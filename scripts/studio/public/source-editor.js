import { t, createTranslator, createMessageBindings } from './i18n.js';
import { createCodeSurface } from './code-widget.js';
import { translateStudioError } from './error-messages.js';

function node(document, tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
}

export function createEditorApi(fetcher = fetch) {
  async function request(route, input) {
    const response = await fetcher(
      '/api/editor' + route,
      input === undefined
        ? { cache: 'no-store' }
        : {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
          },
    );
    const value = await response.json();
    if (!response.ok)
      throw Object.assign(
        new Error(value.error || t('Édition indisponible.', 'Editing is unavailable.')),
        {
          status: response.status,
        },
      );
    return value;
  }
  return {
    read: (baseRevision) =>
      request(baseRevision ? '?' + new URLSearchParams({ baseRevision }) : ''),
    save: (input) => request('/save', input),
    build: (input) => request('/build', input),
    apply: (input) => request('/apply', input),
    reset: (input) => request('/reset', input),
  };
}

// The browser keeps unacknowledged text locally. Only a successful server response
// makes it saved; a successful build never implies that the product need is met.
export function createCodeEditor({
  document,
  root,
  api = createEditorApi(),
  onApplied,
  onCorrection,
  onSelect,
  storage = document.defaultView?.localStorage,
  debounceMs = 700,
  loadWidget,
  toolbarHost,
  backButton,
}) {
  const t = createTranslator(document);
  const messages = createMessageBindings(document);
  const make = (tag, text, className) => {
    const element = node(document, tag, typeof text === 'function' ? undefined : text, className);
    if (typeof text === 'function') messages.text(element, text);
    return element;
  };
  const status = make(
    'p',
    () => t('Ouverture du brouillon…', 'Opening the draft…'),
    'editor-status',
  );
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  const note = make(
    'p',
    () =>
      t(
        'Préparer ouvre un examen. Utiliser la version demande une décision explicite et ne valide pas les critères.',
        'Prepare opens a review. Using the version requires an explicit decision and does not validate the criteria.',
      ),
    'editor-note',
  );
  const toolbar = make('div', undefined, 'editor-toolbar');
  const check = make('button', () => t('Vérifier', 'Check'));
  messages.attribute(check, 'aria-label', () => t('Vérifier et actualiser', 'Check and refresh'));
  messages.attribute(check, 'title', () =>
    t('Enregistrer, vérifier et actualiser le brouillon', 'Save, check and refresh the draft'),
  );
  const adopt = make('button', () => t('Préparer et examiner', 'Prepare and review'), 'primary');
  messages.attribute(adopt, 'aria-label', () =>
    t('Préparer et examiner cette version', 'Prepare and review this version'),
  );
  messages.attribute(adopt, 'title', () =>
    t('Préparer une version pour examen explicite', 'Prepare a version for explicit review'),
  );
  const download = make('button', () => t('Récupérer mes modifications', 'Recover my changes'));
  const correction = make('button', () => t('Préparer une correction', 'Prepare a correction'));
  const rebase = make('button', () =>
    t('Reprendre la version active', 'Resume from the active version'),
  );
  const reload = make('button', () =>
    t(
      'Relire le brouillon partagé (copie à télécharger)',
      'Reload the shared draft (download a copy)',
    ),
  );
  reload.hidden = true;
  rebase.hidden = true;
  const autoLabel = make('label', undefined, 'editor-auto');
  const auto = make('input');
  auto.type = 'checkbox';
  auto.checked = true;
  messages.attribute(auto, 'aria-label', () => t('Aperçu automatique', 'Automatic preview'));
  autoLabel.append(auto, make('span', 'Auto'));
  messages.attribute(autoLabel, 'title', () =>
    t(
      'Enregistrer et compiler automatiquement les modifications',
      'Automatically save and compile changes',
    ),
  );
  for (const button of [check, adopt, download, correction, rebase, reload]) button.type = 'button';
  const more = make('details', undefined, 'editor-more');
  const extra = make('div', undefined, 'editor-more-actions');
  const moreSummary = make('summary', () => t('Plus', 'More'));
  messages.attribute(moreSummary, 'aria-label', () =>
    t('Autres actions et limites de l’éditeur', 'Other editor actions and limitations'),
  );
  more.append(moreSummary, extra);
  extra.append(download, correction, rebase, reload, note);
  more.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      more.open = false;
      moreSummary.focus();
    }
  });
  const body = make('div', undefined, 'editor-body');
  const navigation = make('nav', undefined, 'editor-files');
  messages.attribute(navigation, 'aria-label', () => t('Fichiers à modifier', 'Files to edit'));
  const editing = make('section', undefined, 'editor-editing');
  const filename = make('label', () => t('Choisissez un fichier', 'Choose a file'));
  filename.className = 'editor-filename';
  filename.htmlFor = 'studio-code-input';
  toolbar.append(...(backButton ? [backButton] : []), filename, autoLabel, check, adopt, more);
  const input = make('textarea', undefined, 'editor-input');
  input.id = 'studio-code-input';
  input.spellcheck = false;
  input.setAttribute('autocapitalize', 'off');
  input.setAttribute('autocomplete', 'off');
  messages.attribute(input, 'aria-label', () =>
    t('Code source modifiable', 'Editable source code'),
  );
  const position = make('p', '', 'editor-position');
  const fileMessage = make('p', '', 'editor-file-message');
  const codeHost = make('div', undefined, 'editor-monaco-host');
  editing.append(fileMessage, codeHost, input);
  const previewBox = make('details', undefined, 'editor-preview editor-drawer');
  const previewTitle = make('summary', () => t('Aperçu du brouillon', 'Draft preview'));
  const previewNote = make('p', () =>
    t('Il apparaîtra après une vérification réussie.', 'It will appear after a successful check.'),
  );
  const frame = make('iframe');
  messages.attribute(frame, 'title', () =>
    t('Brouillon exécutable — données d’essai séparées', 'Runnable draft — separate test data'),
  );
  frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
  frame.hidden = true;
  previewBox.append(previewTitle, previewNote, frame);
  body.append(navigation, editing);
  const diagnostics = make('section', undefined, 'editor-diagnostics');
  messages.attribute(diagnostics, 'aria-label', () =>
    t('Signaux et points à vérifier', 'Signals and points to check'),
  );
  const diagnosticsDrawer = make('details', undefined, 'editor-drawer editor-diagnostics-drawer');
  const diagnosticsTitle = make('summary', () =>
    t('Diagnostics · aucun contrôle exécuté', 'Diagnostics · no checks run'),
  );
  diagnosticsDrawer.append(diagnosticsTitle, diagnostics);
  const drawers = make('div', undefined, 'editor-drawers');
  drawers.append(diagnosticsDrawer, previewBox);
  const statusbar = make('div', undefined, 'editor-statusbar');
  statusbar.append(status, position);
  root.replaceChildren(...(toolbarHost ? [] : [toolbar]), body, drawers, statusbar);
  toolbarHost?.replaceChildren(toolbar);

  let draft = null,
    selected = null,
    revision = null,
    activeRevision = null;
  let contents = new Map(),
    acknowledged = new Map(),
    generation = 0,
    savedGeneration = 0;
  let busy = false,
    conflicted = false,
    destroyed = false,
    timer = null,
    requestId = 0;
  const window = document.defaultView;
  let runtimeErrors = [];
  let observedBuild = null;
  let diagnosticsVersion = null;
  let diagnosticsSignalKey = '';
  let changingBase = false;
  const idleWaiters = new Set();
  function releaseOperation() {
    busy = false;
    for (const resolve of idleWaiters) resolve();
    idleWaiters.clear();
  }
  const codeSurface = createCodeSurface({
    document,
    host: codeHost,
    fallback: input,
    loadWidget,
    onChange(value) {
      input.value = value;
      recordChange();
    },
    onSelection({ line, column, offset }) {
      input.setSelectionRange(offset, offset);
      messages.text(position, () =>
        t('Ligne {line} · Colonne {column}', 'Line {line} · Column {column}', { line, column }),
      );
    },
    onSave: () => void flush(),
  });
  extra.append(editing.querySelector('.code-language-status'));
  function syncCode() {
    if (selected)
      codeSurface.setDocument({ path: selected, value: input.value, readOnly: input.disabled });
  }
  const key = () => 'devmethod-code-draft:' + revision;
  const changes = () =>
    [...contents]
      .filter(([path, content]) => acknowledged.get(path) !== content)
      .map(([path, content]) => ({ path, content }));
  const hasLocal = () => generation !== savedGeneration || changes().length > 0;
  const previousControls = () => hasLocal() || diagnosticsVersion !== draft?.version;
  function currentMarkers() {
    if (previousControls()) return [];
    return [
      ...(draft.diagnostics || []),
      ...(draft.builtVersion === draft.version ? runtimeErrors : []),
    ];
  }
  function say(message, error = false) {
    if (typeof message === 'function') {
      messages.text(status, message);
      messages.attribute(status, 'title', message);
    } else {
      messages.text(status, () => translateStudioError(message, document.documentElement.lang));
      messages.attribute(status, 'title', () =>
        translateStudioError(message, document.documentElement.lang),
      );
    }
    status.classList.toggle('error', error);
  }
  function persistLocal() {
    try {
      const entries = changes();
      if (entries.length) storage?.setItem(key(), JSON.stringify(entries));
      else storage?.removeItem(key());
    } catch {
      say(
        () =>
          t(
            'La copie navigateur est indisponible. Enregistrez ou récupérez vos modifications avant de fermer.',
            'The browser copy is unavailable. Save or recover your changes before closing.',
          ),
        true,
      );
    }
  }
  function controls() {
    const sourceOnly = draft?.sourceOnly;
    messages.attribute(auto, 'aria-label', () =>
      sourceOnly
        ? t('Enregistrement automatique des sources', 'Automatic source saving')
        : t('Aperçu automatique', 'Automatic preview'),
    );
    messages.text(check, () =>
      sourceOnly ? t('Enregistrer un snapshot', 'Save a snapshot') : t('Vérifier', 'Check'),
    );
    messages.attribute(check, 'aria-label', () =>
      sourceOnly
        ? t('Enregistrer un snapshot des sources', 'Save a source snapshot')
        : t('Vérifier et actualiser', 'Check and refresh'),
    );
    messages.attribute(check, 'title', () =>
      sourceOnly
        ? t(
            'Enregistrer les sources, sans compilation ni exécution',
            'Save sources without compiling or running them',
          )
        : t(
            'Enregistrer, vérifier et actualiser le brouillon',
            'Save, check and refresh the draft',
          ),
    );
    messages.text(adopt, () => t('Préparer et examiner', 'Prepare and review'));
    messages.attribute(adopt, 'aria-label', () =>
      sourceOnly
        ? t('Préparer et examiner les sources', 'Prepare and review the sources')
        : t('Préparer et examiner cette version', 'Prepare and review this version'),
    );
    messages.attribute(adopt, 'title', () =>
      sourceOnly
        ? t(
            'Préparer une version des sources pour examen explicite',
            'Prepare a source version for explicit review',
          )
        : t('Préparer une version pour examen explicite', 'Prepare a version for explicit review'),
    );
    messages.text(note, () =>
      sourceOnly
        ? t(
            'Sources uniquement. Le runtime de ce projet reste à raccorder ; aucune compilation ni exécution des scripts.',
            'Sources only. This project’s runtime is not connected; scripts are not compiled or executed.',
          )
        : t(
            'Préparer ouvre un examen. Utiliser la version demande une décision explicite et ne valide pas les critères.',
            'Prepare opens a review. Using the version requires an explicit decision and does not validate the criteria.',
          ),
    );
    messages.attribute(autoLabel, 'title', () =>
      sourceOnly
        ? t(
            'Enregistrer automatiquement les modifications des sources',
            'Automatically save source changes',
          )
        : t(
            'Enregistrer et compiler automatiquement les modifications',
            'Automatically save and compile changes',
          ),
    );
    check.disabled = !draft || busy || conflicted;
    adopt.disabled =
      !draft ||
      busy ||
      conflicted ||
      hasLocal() ||
      draft.builtVersion !== draft.version ||
      !draft.buildId ||
      !draft.changedPaths?.length ||
      runtimeErrors.length > 0 ||
      draft.diagnostics?.some((entry) => entry.severity === 'error');
    correction.disabled = !draft || !onCorrection;
    download.disabled = !draft;
    rebase.hidden = !draft || activeRevision === draft.baseRevision;
    rebase.disabled = busy;
    reload.hidden = !conflicted;
    if (conflicted || (!rebase.hidden && !more.open)) more.open = true;
    reload.disabled = busy;
    updateFileAvailability();
    syncCode();
  }
  function updateFileAvailability() {
    const file = draft?.files.find((entry) => entry.path === selected);
    const editable = file?.editable !== false && typeof file?.content === 'string';
    input.disabled = changingBase || !editable;
    messages.text(fileMessage, () =>
      file && !editable
        ? t(
            'Ce fichier est binaire ou dépasse la taille éditable. L’export conserve son contenu complet.',
            'This file is binary or exceeds the editing size limit. The export preserves its full contents.',
          )
        : '',
    );
  }
  function select(path) {
    onSelect?.(path);
    selected = path;
    messages.text(filename, () => path?.split('/').at(-1) || t('Aucun fichier', 'No file'));
    filename.title = path || '';
    updateFileAvailability();
    input.value = contents.get(path) ?? '';
    for (const button of navigation.querySelectorAll('button'))
      button.setAttribute('aria-current', String(button.dataset.path === path));
    updatePosition();
    syncCode();
  }
  function updatePosition() {
    const before = input.value.slice(0, input.selectionStart);
    messages.text(position, () =>
      t('Ligne {line} · Colonne {column}', 'Line {line} · Column {column}', {
        line: before.split('\n').length,
        column: before.length - before.lastIndexOf('\n'),
      }),
    );
  }
  function renderFiles() {
    navigation.replaceChildren();
    for (const file of draft.files) {
      const button = make('button', file.path);
      button.type = 'button';
      button.dataset.path = file.path;
      button.addEventListener('click', () => select(file.path));
      navigation.append(button);
    }
    select(
      draft.files.some((file) => file.path === selected)
        ? selected
        : draft.files.find((file) => file.path.endsWith('.js'))?.path || draft.files[0]?.path,
    );
  }
  function signalCard(item) {
    const card = make('article', undefined, 'editor-signal ' + item.severity);
    const label = item.file ? `${item.file}${item.line ? ':' + item.line : ''} — ` : '';
    const concise =
      /(?:SyntaxError|ReferenceError|TypeError):[^\n]+/.exec(item.message)?.[0] || item.message;
    card.append(make('p', label + concise));
    if (concise !== item.message) {
      const details = make('details');
      details.append(
        make('summary', () => t('Diagnostic complet', 'Full diagnostic')),
        make('pre', item.message),
      );
      card.append(details);
    }
    if (/Unexpected end of input/.test(item.message))
      card.append(
        make(
          'p',
          () =>
            t(
              'Une expression ou un bloc semble inachevé. Vérifiez les parenthèses, accolades et guillemets dans les dernières lignes.',
              'An expression or block appears unfinished. Check parentheses, braces and quotes in the last lines.',
            ),
          'editor-direction',
        ),
      );
    if (/is not defined/.test(item.message))
      card.append(
        make(
          'p',
          () =>
            t(
              'Vérifiez le nom utilisé, sa déclaration et son import avant cet appel.',
              'Check the name, its declaration and its import before this call.',
            ),
          'editor-direction',
        ),
      );
    if (item.direction) card.append(make('p', item.direction, 'editor-direction'));
    if (item.file && contents.has(item.file)) {
      const jump = make('button', () => t('Voir dans le code', 'View in code'));
      jump.type = 'button';
      jump.addEventListener('click', () => {
        select(item.file);
        input.focus();
        const lines = input.value.split('\n');
        const start = lines
          .slice(0, Math.max(0, (item.line || 1) - 1))
          .reduce((n, line) => n + line.length + 1, 0);
        input.setSelectionRange(start, start);
        codeSurface.focus({ line: item.line || 1 });
        updatePosition();
      });
      card.append(jump);
    }
    return card;
  }
  function updateDiagnosticsDrawer(signals, stale) {
    const errors = signals.filter((item) => item.severity === 'error').length;
    messages.text(diagnosticsTitle, () =>
      t('Diagnostics · {count}{stale}', 'Diagnostics · {count}{stale}', {
        count: errors
          ? t('{count} erreur(s)', '{count} error(s)', { count: errors })
          : t('{count} signal(aux)', '{count} signal(s)', { count: signals.length }),
        stale: stale ? t(' · à revérifier', ' · recheck required') : '',
      }),
    );
    diagnosticsTitle.classList.toggle('error', errors > 0);
    const signalKey = JSON.stringify([draft.version, draft.buildId, signals]);
    if (errors && !stale && signalKey !== diagnosticsSignalKey) diagnosticsDrawer.open = true;
    diagnosticsSignalKey = signalKey;
  }
  function renderSignals() {
    if (observedBuild !== draft.buildId) {
      runtimeErrors = [];
      observedBuild = draft.buildId;
    }
    const stale = previousControls();
    const signals = [...(draft.diagnostics || []), ...runtimeErrors];
    updateDiagnosticsDrawer(signals, stale);
    diagnostics.dataset.stale = String(stale);
    diagnostics.replaceChildren(
      make('h3', () =>
        stale
          ? t(
              'Contrôles précédents — modifications à vérifier',
              'Previous checks — changes to verify',
            )
          : t('Ce que DevMethod peut constater', 'What DevMethod can observe'),
      ),
    );
    for (const item of signals) diagnostics.append(signalCard(item));
    const changed = draft.changedPaths || [];
    if (changed.length)
      diagnostics.append(
        make('p', () => t('Fichiers modifiés : ', 'Changed files: ') + changed.join(', ')),
      );
    if (draft.criteriaToReview?.length) {
      diagnostics.append(
        make('h4', () => t('À confronter au résultat visé', 'Compare with the intended outcome')),
      );
      const list = make('ul');
      for (const criterion of draft.criteriaToReview)
        list.append(make('li', typeof criterion === 'string' ? criterion : criterion.text));
      diagnostics.append(list);
    }
    diagnostics.append(
      make(
        'p',
        () =>
          t(
            'Ces contrôles ne démontrent ni la justesse du besoin ni la fidélité visuelle. Les preuves des versions précédentes ne valident pas ce changement.',
            'These checks demonstrate neither the correctness of the need nor visual fidelity. Evidence from previous versions does not validate this change.',
          ),
        'editor-note',
      ),
    );
    if (draft.previewUrl && frame.getAttribute('src') !== draft.previewUrl) {
      frame.src = draft.previewUrl;
      frame.hidden = false;
    } else if (!draft.previewUrl) {
      frame.removeAttribute('src');
      frame.hidden = true;
    }
    renderPreviewStatus();
    codeSurface.setDiagnostics(currentMarkers());
  }
  function renderPreviewStatus() {
    if (draft.sourceOnly) {
      messages.text(previewNote, () =>
        draft.buildId
          ? t(
              'Snapshot des sources conservé · aucune compilation ni vérification fonctionnelle.',
              'Source snapshot saved · no compilation or functional checks.',
            )
          : t(
              'Aperçu indisponible pour cette stack. Les sources restent modifiables et exportables.',
              'Preview unavailable for this stack. Sources remain editable and exportable.',
            ),
      );
      return;
    }
    if (!draft.buildId)
      messages.text(previewNote, () =>
        t('Aucun aperçu valide du brouillon pour le moment.', 'No valid draft preview yet.'),
      );
    else if (draft.builtVersion === draft.version && !hasLocal())
      messages.text(previewNote, () =>
        draft.verificationProtocol === 'react-strict-v1'
          ? t(
              'React compilé · TypeScript strict vérifié. Parcours à essayer ; données d’essai uniquement.',
              'React compiled · strict TypeScript checked. Try the journeys; test data only.',
            )
          : t(
              'Aperçu après contrôle de syntaxe. À essayer ; données d’essai uniquement.',
              'Preview after syntax checking. Try it; test data only.',
            ),
      );
    else
      messages.text(previewNote, () =>
        t(
          'Dernier aperçu valide conservé ; il ne représente pas les dernières modifications.',
          'Last valid preview preserved; it does not represent the latest changes.',
        ),
      );
  }
  function install(next, preserve = false) {
    draft = next;
    diagnosticsVersion = next.version;
    acknowledged = new Map(
      next.files
        .filter((file) => typeof file.content === 'string')
        .map((file) => [file.path, file.content]),
    );
    if (!preserve) {
      contents = new Map(acknowledged);
      generation = 0;
      savedGeneration = 0;
    }
    renderFiles();
    renderSignals();
    controls();
  }
  function retireLocalCopy() {
    try {
      storage?.removeItem(key());
    } catch {
      // The downloaded copy and the server draft remain available.
    }
  }
  async function flush() {
    if (busy || !draft || destroyed || conflicted) return;
    clearTimeout(timer);
    busy = true;
    controls();
    const editGeneration = generation;
    try {
      const pending = changes();
      if (pending.length) {
        say(() => t('Enregistrement du brouillon…', 'Saving the draft…'));
        const next = await api.save({
          version: draft.version,
          baseRevision: draft.baseRevision,
          changes: pending,
        });
        if (destroyed) return;
        draft = next;
        acknowledged = new Map(
          next.files
            .filter((file) => typeof file.content === 'string')
            .map((file) => [file.path, file.content]),
        );
        savedGeneration = editGeneration;
        persistLocal();
        document.dispatchEvent(new window.Event('studio:editor-saved'));
      }
      if (generation !== editGeneration) return;
      say(() =>
        draft.sourceOnly
          ? t('Enregistrement du snapshot des sources…', 'Saving the source snapshot…')
          : t(
              'Vérification du code et préparation de l’aperçu…',
              'Checking the code and preparing the preview…',
            ),
      );
      const next = await api.build({ version: draft.version, baseRevision: draft.baseRevision });
      if (destroyed) return;
      draft = next;
      diagnosticsVersion = next.version;
      renderSignals();
      const errors = next.diagnostics?.filter((entry) => entry.severity === 'error').length || 0;
      say(
        () =>
          errors
            ? t(
                '{count} erreur(s) détectée(s). Le dernier aperçu valide est conservé.',
                '{count} error(s) detected. The last valid preview is preserved.',
                { count: errors },
              )
            : next.sourceOnly
              ? t(
                  'Snapshot des sources enregistré. Aucune compilation ni exécution de contrôle.',
                  'Source snapshot saved. No compilation or checks run.',
                )
              : t(
                  'Brouillon enregistré. Contrôles exécutés ; le résultat fonctionnel reste à vérifier.',
                  'Draft saved. Checks run; functional behavior remains to be verified.',
                ),
        Boolean(errors),
      );
    } catch (error) {
      conflicted = error.status === 409;
      say(
        () =>
          translateStudioError(error.message, document.documentElement.lang) +
          t(' Vos modifications locales sont conservées.', ' Your local changes are preserved.'),
        true,
      );
      persistLocal();
    } finally {
      releaseOperation();
      controls();
      if (!destroyed && !conflicted && generation !== editGeneration && auto.checked) schedule();
    }
  }
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => void flush(), debounceMs);
  }
  function recordChange() {
    contents.set(selected, input.value);
    generation++;
    persistLocal();
    renderSignals();
    controls();
    updatePosition();
    say(() =>
      t('Modifications locales — enregistrement en attente.', 'Local changes — saving pending.'),
    );
    if (draft?.buildId)
      messages.text(previewNote, () =>
        t(
          'Dernier aperçu valide ; actualisation en attente.',
          'Last valid preview; refresh pending.',
        ),
      );
    if (auto.checked) schedule();
  }
  input.addEventListener('input', recordChange);
  input.addEventListener('click', updatePosition);
  input.addEventListener('keyup', updatePosition);
  input.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      void flush();
    }
    if (event.key === 'Tab' && !event.shiftKey) {
      event.preventDefault();
      const start = input.selectionStart;
      input.setRangeText('  ', start, input.selectionEnd, 'end');
      input.dispatchEvent(new window.Event('input', { bubbles: true }));
    }
  });
  auto.addEventListener('change', () => {
    if (auto.checked && hasLocal()) schedule();
    else clearTimeout(timer);
  });
  check.addEventListener('click', () => void flush());
  adopt.addEventListener('click', async () => {
    if (adopt.disabled) return;
    busy = true;
    changingBase = true;
    controls();
    try {
      const result = await api.apply({
        version: draft.version,
        baseRevision: draft.baseRevision,
        title: t('Modification manuelle du code', 'Manual code change'),
      });
      if (destroyed) return;
      // Preparation keeps the editing base and text; only explicit review can activate it.
      draft = result.draft;
      controls();
      say(() =>
        t(
          'Version préparée pour examen. La version active et votre brouillon sont conservés.',
          'Version prepared for review. The active version and your draft are preserved.',
        ),
      );
      await onApplied?.(result);
    } catch (error) {
      conflicted = error.status === 409;
      say(
        () =>
          translateStudioError(error.message, document.documentElement.lang) +
          t(' Votre brouillon est conservé.', ' Your draft is preserved.'),
        true,
      );
    } finally {
      releaseOperation();
      changingBase = false;
      controls();
    }
  });
  correction.addEventListener('click', () => {
    const issues = [...(draft.diagnostics || []), ...runtimeErrors]
      .map(
        (item) =>
          `${item.file || t('Projet', 'Project')}${item.line ? ':' + item.line : ''}: ${item.message} ${typeof item.direction === 'function' ? item.direction() : item.direction || ''}`,
      )
      .join('\n');
    onCorrection?.(
      t(
        'Examiner mon brouillon de code basé sur {base}. Il n’est pas encore adopté.\n{signals} :\n{issues}\nFichiers concernés : {files}\nCritères à préserver : {criteria}\nExtrait actuel de {selected} :\n{source}\nProposer une correction bornée, en expliquant ce qui est constaté et ce qui reste une hypothèse.',
        'Review my code draft based on {base}. It has not been adopted.\n{signals}:\n{issues}\nAffected files: {files}\nCriteria to preserve: {criteria}\nCurrent excerpt from {selected}:\n{source}\nPropose a bounded correction, explaining what was observed and what remains a hypothesis.',
        {
          base: draft.baseRevision,
          signals: previousControls()
            ? t(
                'Signaux des contrôles précédents — modifications à revérifier',
                'Signals from previous checks — changes to recheck',
              )
            : t('Signaux observés', 'Observed signals'),
          issues:
            issues ||
            t(
              'Aucun défaut automatique établi : examiner le changement par rapport au besoin.',
              'No defect automatically established: review the change against the need.',
            ),
          files: (draft.changedPaths || []).join(', '),
          criteria: (draft.criteriaToReview || [])
            .map((c) => (typeof c === 'string' ? c : c.text))
            .join('; '),
          selected,
          source: (contents.get(selected) || '').slice(0, 8000),
        },
      ),
    );
    say(() =>
      t(
        'Correction préparée dans la demande. Examinez-la avant de l’envoyer.',
        'Correction prepared in the request. Review it before sending.',
      ),
    );
  });
  function downloadDraft() {
    const payload = JSON.stringify(
      {
        baseRevision: revision,
        files: [...contents].map(([path, content]) => ({ path, content })),
      },
      null,
      2,
    );
    const link = make('a');
    link.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(payload);
    link.download = 'devmethod-code-draft.json';
    root.append(link);
    link.click();
    link.remove();
  }
  download.addEventListener('click', downloadDraft);
  rebase.addEventListener('click', async () => {
    if (busy || !activeRevision) return;
    // Download first: moving to another base is an explicit user operation.
    downloadDraft();
    busy = true;
    changingBase = true;
    controls();
    try {
      const next = await api.reset({ version: draft.version, baseRevision: activeRevision });
      if (destroyed) return;
      retireLocalCopy();
      revision = activeRevision;
      conflicted = false;
      install(next);
      say(() =>
        t(
          'Brouillon repris depuis la version active. La copie précédente a été proposée au téléchargement.',
          'Draft resumed from the active version. The previous copy was offered for download.',
        ),
      );
    } catch (error) {
      say(error.message, true);
    } finally {
      releaseOperation();
      changingBase = false;
      controls();
    }
  });
  reload.addEventListener('click', async () => {
    if (busy) return;
    downloadDraft();
    busy = true;
    changingBase = true;
    controls();
    try {
      const next = await api.read();
      if (destroyed) return;
      retireLocalCopy();
      conflicted = false;
      revision = next.baseRevision;
      install(next);
      say(() =>
        t(
          'Brouillon partagé relu. La copie locale précédente a été proposée au téléchargement.',
          'Shared draft reloaded. The previous local copy was offered for download.',
        ),
      );
    } catch (error) {
      say(error.message, true);
    } finally {
      releaseOperation();
      changingBase = false;
      controls();
    }
  });
  function runtimeSignal(event) {
    if (
      !draft?.previewUrl ||
      event.source !== frame.contentWindow ||
      event.origin !== new URL(draft.previewUrl).origin
    )
      return;
    const value = event.data;
    if (
      value?.type !== 'devmethod-runtime-error' ||
      value.buildId !== observedBuild ||
      typeof value.message !== 'string'
    )
      return;
    const message = value.message.slice(0, 2000);
    if (runtimeErrors.length >= 20 || runtimeErrors.some((entry) => entry.message === message))
      return;
    runtimeErrors.push({
      severity: 'error',
      file: typeof value.file === 'string' ? value.file.slice(0, 500) : '',
      line: Number.isSafeInteger(value.line) ? value.line : undefined,
      message,
      direction: () =>
        t(
          'Erreur rapportée par le navigateur du brouillon. Examiner le code et reproduire le parcours après correction ; ce signal ne remplace pas un test indépendant.',
          'Error reported by the draft’s browser. Inspect the code and reproduce the journey after correction; this signal does not replace an independent test.',
        ),
    });
    renderSignals();
    controls();
    say(
      () =>
        t(
          'Une erreur d’exécution a été signalée dans le brouillon. Examinez-la avant adoption.',
          'A runtime error was reported in the draft. Review it before adoption.',
        ),
      true,
    );
  }
  window?.addEventListener('message', runtimeSignal);
  function preventLoss(event) {
    if (!hasLocal()) return;
    event.preventDefault();
    event.returnValue = '';
  }
  window?.addEventListener('beforeunload', preventLoss);

  async function readDraft(baseRevision, existingOnly) {
    try {
      return await api.read(existingOnly ? undefined : baseRevision);
    } catch (error) {
      if (error.status !== 409 || existingOnly) throw error;
      return api.read();
    }
  }

  async function reconcileActivation(id) {
    activeRevision = id;
    clearTimeout(timer);
    while (busy && !destroyed) await new Promise((resolve) => idleWaiters.add(resolve));
    if (destroyed || !draft) return;
    busy = true;
    controls();
    try {
      const next = await api.read(draft.baseRevision);
      if (destroyed) return;
      // Capture after the read: typing remains possible throughout the request.
      const pending = changes();
      retireLocalCopy();
      revision = next.baseRevision;
      conflicted = false;
      install(next);
      for (const change of pending) contents.set(change.path, change.content);
      if (pending.length) generation++;
      persistLocal();
      renderFiles();
      renderSignals();
      say(() =>
        pending.length
          ? t(
              'Version utilisée. Vos modifications locales sont conservées et restent à vérifier.',
              'Version applied. Your local changes are preserved and still need checking.',
            )
          : t(
              'Brouillon relu après utilisation de la version.',
              'Draft reloaded after applying the version.',
            ),
      );
    } catch (error) {
      conflicted = error.status === 409;
      persistLocal();
      say(
        () =>
          translateStudioError(error.message, document.documentElement.lang) +
          t(' Vos modifications locales sont conservées.', ' Your local changes are preserved.'),
        true,
      );
    } finally {
      releaseOperation();
      controls();
    }
  }
  return {
    reconcileActivation,
    getBaseRevision() {
      return draft?.baseRevision || null;
    },
    selectFile(path, line) {
      if (!draft?.files.some((file) => file.path === path)) return false;
      select(path);
      if (line) codeSurface.focus({ line });
      return true;
    },
    async open(baseRevision, initialPath, { existingOnly = false } = {}) {
      activeRevision = baseRevision;
      if (draft) {
        controls();
        return;
      }
      revision = baseRevision;
      selected = initialPath;
      const request = ++requestId;
      try {
        const next = await readDraft(baseRevision, existingOnly);
        if (destroyed || request !== requestId) return;
        if (existingOnly && next.baseRevision !== baseRevision) {
          say(
            () =>
              t(
                'Le brouillon enregistré appartient à une autre version.',
                'The saved draft belongs to another version.',
              ),
            true,
          );
          return;
        }
        revision = next.baseRevision;
        install(next);
        try {
          const saved = JSON.parse(storage?.getItem(key()) || '[]');
          for (const entry of saved)
            if (acknowledged.has(entry.path) && typeof entry.content === 'string')
              contents.set(entry.path, entry.content);
          if (changes().length) {
            generation++;
            renderFiles();
            renderSignals();
            say(() =>
              t(
                'Modifications locales récupérées. Vérifiez-les avant de les enregistrer.',
                'Local changes recovered. Review them before saving.',
              ),
            );
          } else
            say(() =>
              next.sourceOnly
                ? t(
                    'Sources ouvertes. Modifiez puis enregistrez une copie ; aperçu indisponible pour cette stack.',
                    'Sources opened. Edit, then save a copy; preview is unavailable for this stack.',
                  )
                : t(
                    'Brouillon ouvert. Modifiez un fichier pour voir son effet.',
                    'Draft opened. Edit a file to see its effect.',
                  ),
            );
        } catch {
          say(
            () =>
              t(
                'La copie locale est illisible ; le brouillon serveur reste disponible.',
                'The local copy is unreadable; the server draft remains available.',
              ),
            true,
          );
        }
        controls();
      } catch (error) {
        say(error.message, true);
      }
    },
    setActiveRevision(id) {
      activeRevision = id;
      controls();
    },
    flush,
    destroy() {
      messages.dispose();
      destroyed = true;
      releaseOperation();
      requestId++;
      clearTimeout(timer);
      window?.removeEventListener('beforeunload', preventLoss);
      window?.removeEventListener('message', runtimeSignal);
      codeSurface.dispose();
      toolbarHost?.replaceChildren();
      root.replaceChildren();
    },
  };
}
