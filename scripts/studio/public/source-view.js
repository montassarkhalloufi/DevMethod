import { t, createTranslator, createMessageBindings, getLocale, subscribeLocale } from './i18n.js';
import { translateStudioError } from './error-messages.js';
import { compareLineSources } from './source-diff.js';
import { createCodeEditor } from './source-editor.js';
import { createCodeSurface } from './code-widget.js';

function bindSourceMenus(document, topbar) {
  const selector = 'details.source-menu, details.editor-more';
  const menus = () => [...topbar.querySelectorAll(selector)];
  const window = document.defaultView;
  const listeners = [];
  function listen(target, name, callback, capture = false) {
    target?.addEventListener(name, callback, capture);
    listeners.push(() => target?.removeEventListener(name, callback, capture));
  }
  function closeOthers(current) {
    for (const menu of menus()) if (menu !== current) menu.open = false;
  }
  function sizeMenu(menu) {
    const bottom = menu.querySelector('summary').getBoundingClientRect().bottom;
    menu.style.setProperty(
      '--source-menu-available-height',
      `${Math.max(80, (window?.innerHeight || 800) - bottom - 12)}px`,
    );
  }
  function dismiss(event) {
    const current = menus().find((menu) => menu.contains(event.target));
    closeOthers(current);
    if (current) sizeMenu(current);
  }
  listen(document, 'pointerdown', dismiss);
  listen(document, 'click', dismiss);
  listen(document, 'focusin', dismiss);
  // Capture also covers the nested runtime source toolbar and programmatic openings.
  listen(
    document,
    'toggle',
    (event) => {
      const menu = event.target;
      if (!menu.matches?.(selector) || !menu.open) return;
      closeOthers(menu);
      if (topbar.contains(menu)) sizeMenu(menu);
    },
    true,
  );
  listen(
    topbar,
    'keydown',
    (event) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      const menu = menus().find((item) => item.open && item.contains(event.target));
      if (!menu) return;
      event.preventDefault();
      event.stopPropagation();
      menu.open = false;
      menu.querySelector('summary').focus({ preventScroll: true });
    },
    true,
  );
  listen(window, 'resize', () => {
    for (const menu of menus()) if (menu.open) sizeMenu(menu);
  });
  return () => listeners.forEach((dispose) => dispose());
}

async function readSource({ revisionId, path, signal, scope }) {
  const query = new URLSearchParams({ revision: revisionId, path });
  if (scope) query.set('scope', scope);
  const response = await fetch('/api/source?' + query, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(8000)]),
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(
      result.error || t('Lecture du fichier indisponible.', 'File reading is unavailable.'),
    );
  return result;
}

async function readServices({ revisionId, signal }) {
  const query = new URLSearchParams(revisionId ? { revision: revisionId } : {});
  const response = await fetch('/api/runtime/services?' + query, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(8000)]),
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(
      result.error || t('État des services indisponible.', 'Service status unavailable.'),
    );
  return result;
}

function describeServices(document, result) {
  const t = createTranslator(document);
  const details = document.createElement('details');
  details.className = 'source-runtime-status';
  const summary = document.createElement('summary');
  const failed = result.services.filter((service) => service.health.status !== 'healthy').length;
  summary.textContent = t(
    'Services locaux : {status} · voir les limites et le projet',
    'Local services: {status} · review limitations and the project',
    {
      status: failed
        ? t('{count} état(s) à examiner', '{count} status(es) to review', { count: failed })
        : t('réponses reçues', 'responses received'),
    },
  );
  details.append(summary);
  const list = document.createElement('ul');
  for (const service of result.services) {
    const item = document.createElement('li');
    const health = service.health;
    const labels = {
      healthy: t('stockage joignable', 'storage reachable'),
      timeout: t('délai dépassé — état indéterminé', 'timeout — state undetermined'),
      unreachable: t('connexion indisponible', 'connection unavailable'),
      error: t('réponse en erreur', 'error response'),
      not_checked: t('non démarré', 'not started'),
    };
    item.textContent = `${service.name} — ${labels[health.status] || t('état inconnu', 'unknown status')}. ${health.error?.message || ''}`;
    if (health.observedAt)
      item.textContent += t(
        ' Observé à {at} ({elapsed} ms).',
        ' Observed at {at} ({elapsed} ms).',
        { at: health.observedAt, elapsed: health.elapsedMs },
      );
    list.append(item);
  }
  for (const limitation of result.limitations) {
    const item = document.createElement('li');
    item.textContent = limitation;
    list.append(item);
  }
  details.append(list);
  if (result.project) {
    const label = document.createElement('p');
    label.textContent = t(
      'Projet déclaré : {topology} · version {revision}.',
      'Declared project: {topology} · version {revision}.',
      {
        topology:
          result.project.topology === 'monolith'
            ? t('monolithe', 'monolith')
            : t('services', 'services'),
        revision: result.project.revisionId,
      },
    );
    details.append(label);
    for (const service of result.project.services) {
      const item = document.createElement('p');
      item.textContent = t(
        '{name} ({runtime}) · {root} · {count} fichier(s) de cette version · non connecté. {reason}',
        '{name} ({runtime}) · {root} · {count} file(s) in this version · not connected. {reason}',
        {
          name: service.name,
          runtime: service.runtime,
          root: service.root,
          count: service.files.length,
          reason: service.reason,
        },
      );
      details.append(item);
    }
  } else {
    const label = document.createElement('p');
    label.textContent = t(
      'Aucun manifeste devmethod.project.json dans cette version. Le runtime local reste distinct d’un backend métier du projet.',
      'No devmethod.project.json manifest in this version. The local runtime remains separate from the project’s business backend.',
    );
    details.append(label);
  }
  return details;
}

function createRuntimeBrowser({ document, root, loadServices, loadSource, copyText }) {
  const t = createTranslator(document);
  const messages = createMessageBindings(document);
  const refresh = document.createElement('button');
  refresh.type = 'button';
  messages.text(refresh, () => t('Actualiser les services', 'Refresh services'));
  const status = document.createElement('p');
  status.className = 'source-runtime-limit';
  status.setAttribute('role', 'status');
  const details = document.createElement('div');
  details.className = 'source-runtime-details';
  const toolbar = document.createElement('div');
  toolbar.className = 'source-runtime-toolbar';
  toolbar.append(refresh, details);
  const sourceRoot = document.createElement('div');
  sourceRoot.className = 'source-runtime-code';
  root.append(toolbar, status, sourceRoot);
  const source = createSourceView({
    document,
    root: sourceRoot,
    loadSource,
    copyText,
    includeRuntime: false,
  });
  let pending;
  let serial = 0;
  let revisionId;
  let destroyed = false;
  let latestReport;
  function renderReport() {
    if (!latestReport) return;
    const open = details.querySelector('details')?.open;
    details.replaceChildren(describeServices(document, latestReport));
    if (open) details.querySelector('details').open = true;
  }
  const stopLanguage = subscribeLocale(renderReport, document.defaultView);
  async function load(nextId) {
    revisionId = nextId;
    pending?.abort();
    pending = new AbortController();
    const request = ++serial;
    messages.text(status, () =>
      t('Lecture des services réellement démarrés…', 'Reading the services that actually started…'),
    );
    refresh.disabled = true;
    try {
      const result = await loadServices({ revisionId, signal: pending.signal });
      if (destroyed || request !== serial) return;
      if (result.sources?.scope !== 'runtime' || !Array.isArray(result.services))
        throw new Error(
          t(
            'Le catalogue reçu ne décrit pas le runtime attendu.',
            'The received catalog does not describe the expected runtime.',
          ),
        );
      latestReport = result;
      renderReport();
      await source.showRevision(result.sources);
      if (destroyed || request !== serial) return;
      messages.text(status, () =>
        t(
          'Backend embarqué en lecture seule ; les services du projet sont des déclarations, pas des processus lancés.',
          'Read-only embedded backend; project services are declarations, not running processes.',
        ),
      );
    } catch (error) {
      if (destroyed || request !== serial) return;
      messages.text(status, () =>
        t('État non vérifié : {reason}', 'Unverified status: {reason}', {
          reason:
            translateStudioError(error.message, getLocale(document)) ||
            t('lecture interrompue', 'reading interrupted'),
        }),
      );
      latestReport = null;
      details.replaceChildren();
      await source.showRevision(null);
    } finally {
      if (!destroyed && request === serial) refresh.disabled = false;
    }
  }
  refresh.addEventListener('click', () => {
    void load(revisionId);
  });
  return {
    load,
    cancel() {
      serial++;
      pending?.abort();
      refresh.disabled = false;
    },
    destroy() {
      stopLanguage();
      messages.dispose();
      destroyed = true;
      serial++;
      pending?.abort();
      source.destroy();
    },
  };
}

// Read-only presentation of an actual revision manifest and its verified source.
// The caller owns tab layout and supplies the revision currently being inspected.
export function comparisonBase(state, revision) {
  if (!revision) return null;
  const job = state.jobs.find((entry) => entry.id === revision.jobId);
  return state.revisions.find((entry) => entry.id === job?.baseRevision) || null;
}

export function createSourceView({
  document,
  root,
  loadSource = readSource,
  copyText,
  allowEdit = false,
  onApplied,
  onCorrection,
  editorApi,
  loadServices = readServices,
  includeRuntime = true,
  onSelect,
}) {
  const t = createTranslator(document);
  const messages = createMessageBindings(document);
  const element = (tag, text, className) => {
    const node = document.createElement(tag);
    if (typeof text === 'function') messages.text(node, text);
    else if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  const heading = element('h2', () => t('Code de votre application', 'Your application’s code'));
  const revisionLabel = element('p', '', 'source-revision');
  const hint = element('p', () =>
    t(
      'Lecture seule · Les fichiers appartiennent à la version affichée.',
      'Read-only · Files belong to the displayed version.',
    ),
  );
  const sourceButton = element('button', () => t('Afficher le fichier', 'Show file'));
  sourceButton.type = 'button';
  const compareButton = element('button', () => t('Comparer', 'Compare'));
  messages.attribute(compareButton, 'aria-label', () =>
    t('Comparer à la version précédente', 'Compare with the previous version'),
  );
  messages.attribute(compareButton, 'title', () =>
    t('Comparer à la version précédente', 'Compare with the previous version'),
  );
  compareButton.type = 'button';
  compareButton.disabled = true;
  const copyButton = element('button', () => t('Copier le contenu', 'Copy contents'));
  copyButton.type = 'button';
  copyButton.disabled = true;
  if (!copyText)
    messages.attribute(copyButton, 'title', () =>
      t(
        'Le presse-papiers est indisponible dans cet environnement.',
        'The clipboard is unavailable in this environment.',
      ),
    );
  const actions = element('div', undefined, 'source-actions');
  const editButton = element('button', () => t('Modifier', 'Edit'));
  messages.attribute(editButton, 'aria-label', () => t('Modifier le code', 'Edit code'));
  editButton.type = 'button';
  editButton.disabled = true;
  if (allowEdit) actions.append(editButton);
  actions.append(compareButton);
  const navigation = element('nav', undefined, 'source-files');
  messages.attribute(navigation, 'aria-label', () => t('Fichiers de la version', 'Version files'));
  const selectedLabel = element('h3', () => t('Aucun fichier sélectionné', 'No file selected'));
  const status = element('p', '', 'source-status');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  const metadata = element('p', '', 'source-metadata');
  const sourceDetails = element('details', undefined, 'source-details');
  sourceDetails.append(
    element('summary', () => t('Version et fichier', 'Version and file')),
    heading,
    revisionLabel,
    hint,
    metadata,
  );
  const pre = element('pre', undefined, 'source-content');
  pre.tabIndex = 0;
  messages.attribute(pre, 'aria-label', () =>
    t('Contenu du fichier en lecture seule', 'Read-only file contents'),
  );
  const code = element('code');
  pre.append(code);
  const retry = element('button', () => t('Réessayer la lecture', 'Retry reading'));
  retry.type = 'button';
  retry.hidden = true;
  const viewer = element('section', undefined, 'source-viewer');
  const codeHost = element('div', undefined, 'source-monaco-host');
  const fileToolbar = element('div', undefined, 'source-file-toolbar');
  fileToolbar.append(selectedLabel, actions);
  viewer.append(status, codeHost, pre, retry);
  const codeSurface = createCodeSurface({ document, host: codeHost, fallback: pre });
  const body = element('div', undefined, 'source-body');
  body.append(navigation, viewer);
  const reading = element('div', undefined, 'source-reading');
  reading.append(body);
  const editing = element('div', undefined, 'source-editing');
  editing.hidden = true;
  const back = element('button', '←', 'source-editor-back');
  messages.attribute(back, 'aria-label', () =>
    t('Consulter la version et ses différences', 'Browse the version and its differences'),
  );
  messages.attribute(back, 'title', () =>
    t('Consulter la version et ses différences', 'Browse the version and its differences'),
  );
  back.type = 'button';
  const editorRoot = element('div', undefined, 'source-editor-root');
  const editorControls = element('div', undefined, 'source-editor-controls');
  editorControls.hidden = true;
  editing.append(editorRoot);
  const runtimeRoot = element('div', undefined, 'source-runtime');
  runtimeRoot.hidden = true;
  const sectionMenu = element('details', undefined, 'source-menu');
  const sectionSummary = element('summary', () =>
    includeRuntime ? 'Application' : t('Options', 'Options'),
  );
  const sectionButtons = element('div', undefined, 'source-menu-actions');
  const applicationButton = element('button', 'Application');
  const runtimeButton = element('button', () => t('Diagnostic du Studio', 'Studio diagnostics'));
  applicationButton.type = runtimeButton.type = 'button';
  applicationButton.setAttribute('aria-pressed', 'true');
  runtimeButton.setAttribute('aria-pressed', 'false');
  if (includeRuntime) sectionButtons.append(applicationButton, runtimeButton);
  sectionButtons.append(
    sourceButton,
    copyButton,
    sourceDetails,
    viewer.querySelector('.code-language-status'),
  );
  sectionMenu.append(sectionSummary, sectionButtons);
  const topbar = element('div', undefined, 'source-topbar');
  topbar.append(fileToolbar, editorControls, sectionMenu);
  root.replaceChildren(topbar, reading, editing, ...(includeRuntime ? [runtimeRoot] : []));
  const disposeMenus = bindSourceMenus(document, topbar);
  let revision = null;
  let previousRevision = null;
  let mode = 'source';
  let files = [];
  let manifestKey = null;
  let selectedPath = null;
  let requestNumber = 0;
  let pending;
  let destroyed = false;
  let sourceContent = null;
  let editor = null;
  let runtimeBrowser = null;
  let runtimeVisible = false;
  applicationButton.addEventListener('click', readSurface);
  runtimeButton.addEventListener('click', () => {
    runtimeVisible = true;
    reading.hidden = editing.hidden = true;
    runtimeRoot.hidden = false;
    fileToolbar.hidden = editorControls.hidden = true;
    sectionMenu.open = false;
    messages.text(sectionSummary, () => t('Diagnostic du Studio', 'Studio diagnostics'));
    applicationButton.setAttribute('aria-pressed', 'false');
    runtimeButton.setAttribute('aria-pressed', 'true');
    runtimeBrowser ??= createRuntimeBrowser({
      document,
      root: runtimeRoot,
      loadServices,
      loadSource,
      copyText,
    });
    void runtimeBrowser.load(revision?.id);
  });
  function readSurface() {
    root.dataset.editing = 'false';
    reading.hidden = false;
    editing.hidden = true;
    fileToolbar.hidden = false;
    editorControls.hidden = true;
    runtimeVisible = false;
    runtimeBrowser?.cancel();
    runtimeRoot.hidden = true;
    sectionMenu.open = false;
    messages.text(sectionSummary, () => (includeRuntime ? 'Application' : t('Options', 'Options')));
    applicationButton.setAttribute('aria-pressed', 'true');
    runtimeButton.setAttribute('aria-pressed', 'false');
  }
  function editSurface() {
    reading.hidden = true;
    editing.hidden = false;
    fileToolbar.hidden = true;
    editorControls.hidden = false;
    root.dataset.editing = 'true';
    runtimeVisible = false;
    runtimeRoot.hidden = true;
    sectionMenu.open = false;
    sectionSummary.textContent = 'Application';
  }
  function draftUnavailable() {
    readSurface();
    messages.text(status, () =>
      t(
        'Le brouillon est indisponible ou appartient à une autre version. La copie locale est conservée.',
        'The draft is unavailable or belongs to another version. The local copy is preserved.',
      ),
    );
    status.dataset.state = 'error';
    return false;
  }
  async function openEditor(initialPath, existingOnly = false) {
    if (!revision) return false;
    const expectedRevision = revision.id;
    if (existingOnly && editor?.getBaseRevision() && editor.getBaseRevision() !== expectedRevision)
      return draftUnavailable();
    if (!existingOnly) editSurface();
    editor ??= createCodeEditor({
      document,
      root: editorRoot,
      api: editorApi,
      onApplied,
      onCorrection,
      onSelect,
      toolbarHost: editorControls,
      backButton: back,
    });
    await editor.open(expectedRevision, initialPath, { existingOnly });
    if (destroyed || revision?.id !== expectedRevision) return false;
    if (existingOnly && editor.getBaseRevision() !== expectedRevision) return draftUnavailable();
    if (existingOnly && !editor.selectFile(initialPath)) return draftUnavailable();
    editSurface();
    return true;
  }
  editButton.addEventListener('click', () => {
    void openEditor(selectedPath).then(() => {
      if (document.defaultView?.matchMedia?.('(max-width: 900px)').matches)
        editing.scrollIntoView({ block: 'start' });
    });
  });
  back.addEventListener('click', readSurface);

  function markSelected() {
    for (const button of navigation.querySelectorAll('button')) {
      const selected = button.dataset.path === selectedPath;
      button.setAttribute('aria-current', selected ? 'true' : 'false');
    }
  }

  function validateResponse(result, file, revisionId) {
    if (
      !result ||
      result.revisionId !== revisionId ||
      result.path !== file.path ||
      result.sha256 !== file.sha256 ||
      result.bytes !== file.bytes ||
      typeof result.binary !== 'boolean' ||
      typeof result.truncated !== 'boolean' ||
      (!result.binary && typeof result.content !== 'string')
    )
      throw new Error(
        t(
          'Le contenu reçu ne correspond pas au fichier de cette version.',
          'The received contents do not match this version’s file.',
        ),
      );
  }

  async function readVerified(owner, file, signal) {
    if (!file) return null;
    const result = await loadSource({
      revisionId: owner.id,
      path: file.path,
      signal,
      ...(owner.scope ? { scope: owner.scope } : {}),
    });
    validateResponse(result, file, owner.id);
    return result;
  }

  function renderSource(result) {
    if (!result) {
      messages.text(status, () =>
        t(
          'Ce fichier a été supprimé de cette version. La comparaison permet de consulter ses lignes supprimées.',
          'This file was removed from this version. The comparison shows its removed lines.',
        ),
      );
      return;
    }
    messages.text(metadata, () =>
      t('{count} octets · SHA-256 {hash}', '{count} bytes · SHA-256 {hash}', {
        count: result.bytes.toLocaleString(getLocale(document)),
        hash: result.sha256,
      }),
    );
    if (result.binary) {
      messages.text(status, () =>
        t(
          'Fichier binaire : le contenu textuel n’est pas affiché.',
          'Binary file: text contents are not displayed.',
        ),
      );
    } else {
      code.textContent = result.content;
      sourceContent = result.content;
      copyButton.disabled = !copyText;
      messages.text(copyButton, () =>
        result.truncated
          ? t('Copier l’extrait', 'Copy excerpt')
          : t('Copier le contenu', 'Copy contents'),
      );
      pre.hidden = false;
      codeSurface.setDocument({ path: result.path, value: result.content, readOnly: true });
      messages.text(status, () =>
        result.truncated
          ? t(
              'Aperçu limité : une partie du fichier est affichée. L’export conserve le fichier complet.',
              'Limited preview: only part of the file is displayed. The export preserves the complete file.',
            )
          : t('Fichier de la version chargé. Lecture seule.', 'Version file loaded. Read-only.'),
      );
      status.dataset.state = result.truncated ? 'partial' : 'ready';
    }
  }

  function renderDifference(before, after) {
    metadata.textContent = `${previousRevision.title} → ${revision.title}`;
    if ([before, after].some((result) => result?.binary || result?.truncated)) {
      messages.text(status, () =>
        t(
          'Comparaison indisponible : un fichier est binaire ou son aperçu est tronqué. Aucune différence partielle n’est présentée comme complète.',
          'Comparison unavailable: a file is binary or its preview is truncated. A partial difference is never presented as complete.',
        ),
      );
      return;
    }
    const difference = compareLineSources(before?.content || '', after?.content || '', {
      locale: getLocale(document),
    });
    if (difference.kind !== 'available') {
      // Re-evaluate only the pure limit check; language changes never reread sources.
      messages.text(
        status,
        () =>
          compareLineSources(before?.content || '', after?.content || '', {
            locale: getLocale(document),
          }).reason,
      );
      return;
    }
    if (!difference.added && !difference.removed) {
      messages.text(status, () =>
        !before || !after
          ? before
            ? t(
                'Fichier vide supprimé ; aucune ligne à afficher.',
                'Empty file removed; no lines to display.',
              )
            : t(
                'Fichier vide ajouté ; aucune ligne à afficher.',
                'Empty file added; no lines to display.',
              )
          : t(
              'Aucune différence : les contenus textuels complets sont identiques.',
              'No differences: the complete text contents are identical.',
            ),
      );
    } else {
      messages.text(status, () =>
        t(
          '{added} ligne(s) ajoutée(s), {removed} ligne(s) supprimée(s). Numéros : ancienne version, nouvelle version. ␍ indique une fin de ligne CRLF.',
          '{added} line(s) added, {removed} line(s) removed. Numbers: old version, new version. ␍ indicates a CRLF line ending.',
          { added: difference.added, removed: difference.removed },
        ),
      );
    }
    const width = String(
      Math.max(...difference.entries.map((entry) => entry.beforeLine || entry.afterLine || 1), 1),
    ).length;
    for (const entry of difference.entries) {
      const symbol = { equal: ' ', removed: '−', added: '+' }[entry.type];
      const oldNumber = String(entry.beforeLine || '').padStart(width);
      const newNumber = String(entry.afterLine || '').padStart(width);
      const content = entry.text.replace(/\r\n$/, ' ␍\n');
      const line = element(
        'span',
        `${symbol} ${oldNumber} ${newNumber} │ ${content}`,
        `source-line source-line-${entry.type}`,
      );
      if (!entry.text.endsWith('\n'))
        line.append(
          element(
            'span',
            () => t('\n\\ Pas de saut de ligne final\n', '\n\\ No newline at end of file\n'),
            'source-line-ending',
          ),
        );
      line.dataset.change = entry.type;
      code.append(line);
    }
    pre.hidden = false;
    codeSurface.setDocument({
      path: selectedPath,
      value: after?.content || '',
      original: before?.content || '',
      readOnly: true,
    });
  }

  async function openFile(file) {
    if (!revision || destroyed) return false;
    const currentRequest = ++requestNumber;
    pending?.abort();
    pending = new AbortController();
    selectedPath = file.path;
    onSelect?.(file.path);
    selectedLabel.textContent = file.path.split('/').at(-1);
    selectedLabel.title = file.path;
    code.textContent = '';
    sourceContent = null;
    copyButton.disabled = true;
    metadata.textContent = '';
    messages.text(status, () =>
      mode === 'source'
        ? t('Lecture du fichier…', 'Reading the file…')
        : t('Lecture des deux versions…', 'Reading both versions…'),
    );
    status.dataset.state = 'loading';
    viewer.setAttribute('aria-busy', 'true');
    retry.hidden = true;
    pre.hidden = true;
    codeSurface.clear();
    messages.attribute(pre, 'aria-label', () =>
      mode === 'source'
        ? t('Contenu du fichier en lecture seule', 'Read-only file contents')
        : t(
            'Différences entre les deux versions du fichier',
            'Differences between both versions of the file',
          ),
    );
    sourceButton.setAttribute('aria-pressed', String(mode === 'source'));
    compareButton.setAttribute('aria-pressed', String(mode === 'diff'));
    markSelected();
    try {
      const signal = pending.signal;
      const [result, before] = await Promise.all([
        readVerified(revision, file.current, signal),
        mode === 'diff' ? readVerified(previousRevision, file.previous, signal) : null,
      ]);
      if (destroyed || currentRequest !== requestNumber) return false;
      if (mode === 'source') renderSource(result);
      else renderDifference(before, result);
      return true;
    } catch (error) {
      if (destroyed || currentRequest !== requestNumber) return false;
      code.textContent = '';
      messages.text(
        status,
        () =>
          translateStudioError(error.message, getLocale(document)) ||
          t('Lecture du fichier indisponible.', 'File reading is unavailable.'),
      );
      status.dataset.state = 'error';
      retry.hidden = false;
      return false;
    } finally {
      if (!destroyed && currentRequest === requestNumber) viewer.setAttribute('aria-busy', 'false');
    }
  }

  function fileTree(files) {
    const tree = element('ul');
    const folders = new Map([['', tree]]);
    for (const file of [...files].sort((a, b) => a.path.localeCompare(b.path))) {
      const segments = file.path.split('/');
      let prefix = '';
      let list = tree;
      for (const segment of segments.slice(0, -1)) {
        prefix += segment + '/';
        if (!folders.has(prefix)) {
          const item = element('li');
          const details = element('details');
          details.open = true;
          const child = element('ul');
          details.append(element('summary', segment), child);
          item.append(details);
          list.append(item);
          folders.set(prefix, child);
        }
        list = folders.get(prefix);
      }
      const item = element('li');
      const button = element('button', segments.at(-1));
      button.type = 'button';
      button.dataset.path = file.path;
      button.title = file.path;
      button.dataset.status = !file.current
        ? 'removed'
        : !file.previous && previousRevision
          ? 'added'
          : 'present';
      messages.attribute(button, 'aria-label', () => t('Lire ', 'Read ') + file.path);
      button.addEventListener('click', () => openFile(file));
      item.append(button);
      list.append(item);
    }
    return tree;
  }

  function retryRead() {
    const file = files.find((entry) => entry.path === selectedPath);
    if (file) void openFile(file);
  }
  retry.addEventListener('click', retryRead);
  function showSource() {
    if (mode === 'source') return;
    mode = 'source';
    retryRead();
  }
  function showDifference() {
    if (mode === 'diff' || !previousRevision) return;
    mode = 'diff';
    retryRead();
  }
  sourceButton.addEventListener('click', showSource);
  compareButton.addEventListener('click', showDifference);
  async function copySource() {
    if (!copyText || sourceContent === null || mode !== 'source') return;
    const request = requestNumber;
    try {
      await copyText(sourceContent);
      if (!destroyed && request === requestNumber)
        messages.text(status, () =>
          t(
            'Contenu affiché copié dans le presse-papiers.',
            'Displayed contents copied to the clipboard.',
          ),
        );
    } catch {
      if (!destroyed && request === requestNumber)
        messages.text(status, () =>
          t(
            'La copie a été refusée par le navigateur. Vous pouvez sélectionner le texte du fichier.',
            'The browser refused the copy. You can select the file’s text.',
          ),
        );
    }
  }
  copyButton.addEventListener('click', copySource);

  return {
    reconcileActivation(id) {
      return editor?.reconcileActivation(id);
    },
    async selectFile(path, line, { draft } = {}) {
      if (draft) {
        if (!(await openEditor(path, true))) return false;
        return editor.selectFile(path, line);
      }
      if (draft !== false && !editing.hidden && editor?.getBaseRevision() === revision?.id)
        return editor.selectFile(path, line);
      const file = files.find((entry) => entry.path === path);
      if (!file) return false;
      readSurface();
      if (!(await openFile(file))) return false;
      if (line) codeSurface.focus({ line });
      return true;
    },
    async showRevision(
      next,
      { previousRevision: previous = null, activeRevision = next?.id } = {},
    ) {
      if (destroyed) return;
      if (revision?.id !== next?.id && !editing.hidden) readSurface();
      messages.text(heading, () =>
        next?.scope === 'runtime'
          ? t('Sources du backend local DevMethod', 'Local DevMethod backend sources')
          : t('Code de votre application', 'Your application’s code'),
      );
      messages.text(hint, () =>
        next?.scope === 'runtime'
          ? next.provenance
          : t(
              'Lecture seule · Les fichiers appartiennent à la version affichée.',
              'Read-only · Files belong to the displayed version.',
            ),
      );
      editButton.disabled = !next || next.id !== activeRevision;
      messages.attribute(editButton, 'title', () =>
        next?.id === activeRevision
          ? t('Ouvrir un brouillon de cette version', 'Open a draft of this version')
          : t(
              'Choisissez la version active pour la modifier.',
              'Choose the active version to edit it.',
            ),
      );
      if (activeRevision) editor?.setActiveRevision(activeRevision);
      const nextKey = next
        ? JSON.stringify([
            next.id,
            next.title,
            next.files,
            previous?.id,
            previous?.title,
            previous?.files,
          ])
        : 'empty';
      if (nextKey === manifestKey) return;
      manifestKey = nextKey;
      const previousPath = selectedPath;
      requestNumber++;
      pending?.abort();
      revision = next ? structuredClone(next) : null;
      if (runtimeVisible) void runtimeBrowser.load(revision?.id);
      previousRevision = next && previous ? structuredClone(previous) : null;
      if (!previousRevision) mode = 'source';
      compareButton.disabled = !previousRevision;
      const currentFiles = new Map((revision?.files || []).map((file) => [file.path, file]));
      const oldFiles = new Map((previousRevision?.files || []).map((file) => [file.path, file]));
      files = [...new Set([...currentFiles.keys(), ...oldFiles.keys()])].map((path) => ({
        path,
        current: currentFiles.get(path),
        previous: oldFiles.get(path),
      }));
      code.textContent = '';
      sourceContent = null;
      copyButton.disabled = true;
      metadata.textContent = '';
      retry.hidden = true;
      pre.hidden = true;
      codeSurface.clear();
      viewer.setAttribute('aria-busy', 'false');
      navigation.replaceChildren();
      if (!revision || !files.length) {
        selectedPath = null;
        messages.text(revisionLabel, () => t('Aucune version à consulter', 'No version to browse'));
        messages.text(selectedLabel, () => t('Aucun fichier sélectionné', 'No file selected'));
        messages.text(status, () =>
          t(
            'Le code sera disponible lorsqu’une application aura été produite.',
            'Code will be available once an application has been produced.',
          ),
        );
        return;
      }
      revisionLabel.textContent = revision.title + ' · ' + revision.id;
      navigation.append(fileTree(files));
      const first =
        files.find((file) => file.path === previousPath) ||
        files.find((file) => /(?:components|features)\/.*\.tsx$/.test(file.path)) ||
        files.find((file) => file.path === 'index.html') ||
        files[0];
      await openFile(first);
    },
    destroy() {
      messages.dispose();
      destroyed = true;
      disposeMenus();
      requestNumber++;
      pending?.abort();
      retry.removeEventListener('click', retryRead);
      sourceButton.removeEventListener('click', showSource);
      compareButton.removeEventListener('click', showDifference);
      copyButton.removeEventListener('click', copySource);
      editor?.destroy();
      runtimeBrowser?.destroy();
      codeSurface.dispose();
      root.replaceChildren();
    },
  };
}
