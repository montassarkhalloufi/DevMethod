import { createCodeSurface } from './code-widget.js';

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
      throw Object.assign(new Error(value.error || 'Édition indisponible.'), {
        status: response.status,
      });
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
  storage = document.defaultView?.localStorage,
  debounceMs = 700,
  loadWidget,
}) {
  const make = (tag, text, className) => node(document, tag, text, className);
  const title = make('h2', 'Éditer le code');
  const status = make('p', 'Ouverture du brouillon…', 'editor-status');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  const note = make(
    'p',
    'Aperçu sur une copie des données. Adopter transfère uniquement le code.',
    'editor-note',
  );
  const toolbar = make('div', undefined, 'editor-toolbar');
  const check = make('button', 'Vérifier et actualiser');
  const adopt = make('button', 'Adopter cette version', 'primary');
  const download = make('button', 'Récupérer mes modifications');
  const correction = make('button', 'Préparer une correction');
  const rebase = make('button', 'Reprendre la version active');
  const reload = make('button', 'Relire le brouillon partagé (copie à télécharger)');
  reload.hidden = true;
  rebase.hidden = true;
  const autoLabel = make('label', undefined, 'editor-auto');
  const auto = make('input');
  auto.type = 'checkbox';
  auto.checked = true;
  autoLabel.append(auto, make('span', 'Aperçu automatique'));
  for (const button of [check, adopt, download, correction, rebase, reload]) button.type = 'button';
  const more = make('details', undefined, 'editor-more');
  const extra = make('div', undefined, 'editor-more-actions');
  more.append(make('summary', 'Autres actions'), extra);
  extra.append(download, correction, rebase, reload);
  toolbar.append(autoLabel, check, adopt, more);
  const body = make('div', undefined, 'editor-body');
  const navigation = make('nav', undefined, 'editor-files');
  navigation.setAttribute('aria-label', 'Fichiers à modifier');
  const editing = make('section', undefined, 'editor-editing');
  const filename = make('label', 'Choisissez un fichier');
  filename.htmlFor = 'studio-code-input';
  const input = make('textarea', undefined, 'editor-input');
  input.id = 'studio-code-input';
  input.spellcheck = false;
  input.setAttribute('autocapitalize', 'off');
  input.setAttribute('autocomplete', 'off');
  input.setAttribute('aria-label', 'Code source modifiable');
  const position = make('p', '', 'editor-position');
  const fileMessage = make('p', '', 'editor-file-message');
  const codeHost = make('div', undefined, 'editor-monaco-host');
  editing.append(filename, fileMessage, codeHost, input, position);
  const previewBox = make('section', undefined, 'editor-preview');
  const previewTitle = make('h3', 'Aperçu du brouillon');
  const previewNote = make('p', 'Il apparaîtra après une vérification réussie.');
  const frame = make('iframe');
  frame.title = 'Brouillon exécutable — données d’essai séparées';
  frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
  frame.hidden = true;
  previewBox.append(previewTitle, previewNote, frame);
  body.append(navigation, editing, previewBox);
  const diagnostics = make('section', undefined, 'editor-diagnostics');
  diagnostics.setAttribute('aria-label', 'Signaux et points à vérifier');
  const header = make('div', undefined, 'editor-heading');
  header.append(title, status);
  root.replaceChildren(header, note, toolbar, body, diagnostics);

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
  let changingBase = false;
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
      position.textContent = `Ligne ${line} · Colonne ${column}`;
    },
    onSave: () => void flush(),
  });
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
    status.textContent = message;
    status.classList.toggle('error', error);
  }
  function persistLocal() {
    try {
      const entries = changes();
      if (entries.length) storage?.setItem(key(), JSON.stringify(entries));
      else storage?.removeItem(key());
    } catch {
      say(
        'La copie navigateur est indisponible. Enregistrez ou récupérez vos modifications avant de fermer.',
        true,
      );
    }
  }
  function controls() {
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
    input.disabled =
      changingBase ||
      !draft?.files.some(
        (file) =>
          file.path === selected && file.editable !== false && typeof file.content === 'string',
      );
    syncCode();
  }
  function select(path) {
    selected = path;
    const file = draft.files.find((entry) => entry.path === path);
    filename.textContent = path;
    input.disabled = changingBase || file?.editable === false || typeof file?.content !== 'string';
    input.value = contents.get(path) ?? '';
    fileMessage.textContent = input.disabled
      ? 'Ce fichier est binaire ou dépasse la taille éditable. L’export conserve son contenu complet.'
      : '';
    for (const button of navigation.querySelectorAll('button'))
      button.setAttribute('aria-current', String(button.dataset.path === path));
    updatePosition();
    syncCode();
  }
  function updatePosition() {
    const before = input.value.slice(0, input.selectionStart);
    position.textContent = `Ligne ${before.split('\n').length} · Colonne ${before.length - before.lastIndexOf('\n')}`;
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
      details.append(make('summary', 'Diagnostic complet'), make('pre', item.message));
      card.append(details);
    }
    if (/Unexpected end of input/.test(item.message))
      card.append(
        make(
          'p',
          'Une expression ou un bloc semble inachevé. Vérifiez les parenthèses, accolades et guillemets dans les dernières lignes.',
          'editor-direction',
        ),
      );
    if (/is not defined/.test(item.message))
      card.append(
        make(
          'p',
          'Vérifiez le nom utilisé, sa déclaration et son import avant cet appel.',
          'editor-direction',
        ),
      );
    if (item.direction) card.append(make('p', item.direction, 'editor-direction'));
    if (item.file && contents.has(item.file)) {
      const jump = make('button', 'Voir dans le code');
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
  function renderSignals() {
    if (observedBuild !== draft.buildId) {
      runtimeErrors = [];
      observedBuild = draft.buildId;
    }
    const stale = previousControls();
    diagnostics.dataset.stale = String(stale);
    diagnostics.replaceChildren(
      make(
        'h3',
        stale
          ? 'Contrôles précédents — modifications à vérifier'
          : 'Ce que DevMethod peut constater',
      ),
    );
    for (const item of [...(draft.diagnostics || []), ...runtimeErrors])
      diagnostics.append(signalCard(item));
    const changed = draft.changedPaths || [];
    if (changed.length) diagnostics.append(make('p', 'Fichiers modifiés : ' + changed.join(', ')));
    if (draft.criteriaToReview?.length) {
      diagnostics.append(make('h4', 'À confronter au résultat visé'));
      const list = make('ul');
      for (const criterion of draft.criteriaToReview)
        list.append(make('li', typeof criterion === 'string' ? criterion : criterion.text));
      diagnostics.append(list);
    }
    diagnostics.append(
      make(
        'p',
        'Ces contrôles ne démontrent ni la justesse du besoin ni la fidélité visuelle. Les preuves des versions précédentes ne valident pas ce changement.',
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
    if (!draft.buildId)
      previewNote.textContent = 'Aucun aperçu valide du brouillon pour le moment.';
    else if (draft.builtVersion === draft.version && !hasLocal())
      previewNote.textContent =
        draft.verificationProtocol === 'react-strict-v1'
          ? 'React compilé · TypeScript strict vérifié. Parcours à essayer ; données d’essai uniquement.'
          : 'Aperçu après contrôle de syntaxe. À essayer ; données d’essai uniquement.';
    else
      previewNote.textContent =
        'Dernier aperçu valide conservé ; il ne représente pas les dernières modifications.';
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
        say('Enregistrement du brouillon…');
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
      }
      if (generation !== editGeneration) return;
      say('Vérification du code et préparation de l’aperçu…');
      const next = await api.build({ version: draft.version, baseRevision: draft.baseRevision });
      if (destroyed) return;
      draft = next;
      diagnosticsVersion = next.version;
      renderSignals();
      const errors = next.diagnostics?.filter((entry) => entry.severity === 'error').length || 0;
      say(
        errors
          ? `${errors} erreur(s) détectée(s). Le dernier aperçu valide est conservé.`
          : 'Brouillon enregistré. Contrôles exécutés ; le résultat fonctionnel reste à vérifier.',
        Boolean(errors),
      );
    } catch (error) {
      conflicted = error.status === 409;
      say(error.message + ' Vos modifications locales sont conservées.', true);
      persistLocal();
    } finally {
      busy = false;
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
    say('Modifications locales — enregistrement en attente.');
    if (draft?.buildId)
      previewNote.textContent = 'Dernier aperçu valide ; actualisation en attente.';
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
        title: 'Modification manuelle du code',
      });
      if (destroyed) return;
      try {
        storage?.removeItem(key());
      } catch {
        /* Saved server copy remains authoritative. */
      }
      revision = result.draft.baseRevision;
      activeRevision = result.state.activeRevision;
      install(result.draft);
      say(
        result.activated === false
          ? `Version créée sans adoption : ${result.adoptionError || 'examinez la version dans Reprise.'}`
          : 'Nouvelle version adoptée. Ses preuves fonctionnelles restent à établir.',
      );
      await onApplied?.(result);
    } catch (error) {
      conflicted = error.status === 409;
      say(error.message + ' Votre brouillon est conservé.', true);
    } finally {
      busy = false;
      changingBase = false;
      controls();
    }
  });
  correction.addEventListener('click', () => {
    const issues = [...(draft.diagnostics || []), ...runtimeErrors]
      .map(
        (item) =>
          `${item.file || 'Projet'}${item.line ? ':' + item.line : ''}: ${item.message} ${item.direction || ''}`,
      )
      .join('\n');
    onCorrection?.(
      `Examiner mon brouillon de code basé sur ${draft.baseRevision}. Il n’est pas encore adopté.\n${previousControls() ? 'Signaux des contrôles précédents — modifications à revérifier' : 'Signaux observés'} :\n${issues || 'Aucun défaut automatique établi : examiner le changement par rapport au besoin.'}\nFichiers concernés : ${(draft.changedPaths || []).join(', ')}\nCritères à préserver : ${(draft.criteriaToReview || []).map((c) => (typeof c === 'string' ? c : c.text)).join('; ')}\nExtrait actuel de ${selected} :\n${(contents.get(selected) || '').slice(0, 8000)}\nProposer une correction bornée, en expliquant ce qui est constaté et ce qui reste une hypothèse.`,
    );
    say('Correction préparée dans la demande. Examinez-la avant de l’envoyer.');
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
      say(
        'Brouillon repris depuis la version active. La copie précédente a été proposée au téléchargement.',
      );
    } catch (error) {
      say(error.message, true);
    } finally {
      busy = false;
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
      say('Brouillon partagé relu. La copie locale précédente a été proposée au téléchargement.');
    } catch (error) {
      say(error.message, true);
    } finally {
      busy = false;
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
      direction:
        'Erreur rapportée par le navigateur du brouillon. Examiner le code et reproduire le parcours après correction ; ce signal ne remplace pas un test indépendant.',
    });
    renderSignals();
    controls();
    say(
      'Une erreur d’exécution a été signalée dans le brouillon. Examinez-la avant adoption.',
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

  return {
    async open(baseRevision, initialPath) {
      activeRevision = baseRevision;
      if (draft) {
        controls();
        return;
      }
      revision = baseRevision;
      selected = initialPath;
      const request = ++requestId;
      try {
        let next;
        try {
          next = await api.read(baseRevision);
        } catch (error) {
          if (error.status !== 409) throw error;
          next = await api.read();
        }
        if (destroyed || request !== requestId) return;
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
            say('Modifications locales récupérées. Vérifiez-les avant de les enregistrer.');
          } else say('Brouillon ouvert. Modifiez un fichier pour voir son effet.');
        } catch {
          say('La copie locale est illisible ; le brouillon serveur reste disponible.', true);
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
      destroyed = true;
      requestId++;
      clearTimeout(timer);
      window?.removeEventListener('beforeunload', preventLoss);
      window?.removeEventListener('message', runtimeSignal);
      codeSurface.dispose();
      root.replaceChildren();
    },
  };
}
