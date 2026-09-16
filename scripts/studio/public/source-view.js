import { compareLineSources } from './source-diff.js';
import { createCodeEditor } from './source-editor.js';
import { createCodeSurface } from './code-widget.js';

async function readSource({ revisionId, path, signal, scope }) {
  const query = new URLSearchParams({ revision: revisionId, path });
  if (scope) query.set('scope', scope);
  const response = await fetch('/api/source?' + query, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(8000)]),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Lecture du fichier indisponible.');
  return result;
}

async function readServices({ revisionId, signal }) {
  const query = new URLSearchParams(revisionId ? { revision: revisionId } : {});
  const response = await fetch('/api/runtime/services?' + query, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(8000)]),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'État des services indisponible.');
  return result;
}

function describeServices(document, result) {
  const details = document.createElement('details');
  details.className = 'source-runtime-status';
  const summary = document.createElement('summary');
  const failed = result.services.filter((service) => service.health.status !== 'healthy').length;
  summary.textContent = `Services locaux : ${failed ? `${failed} état(s) à examiner` : 'réponses reçues'} · voir les limites et le projet`;
  details.append(summary);
  const list = document.createElement('ul');
  for (const service of result.services) {
    const item = document.createElement('li');
    const health = service.health;
    const labels = {
      healthy: 'stockage joignable',
      timeout: 'délai dépassé — état indéterminé',
      unreachable: 'connexion indisponible',
      error: 'réponse en erreur',
      not_checked: 'non démarré',
    };
    item.textContent = `${service.name} — ${labels[health.status] || 'état inconnu'}. ${health.error?.message || ''}`;
    if (health.observedAt)
      item.textContent += ` Observé à ${health.observedAt} (${health.elapsedMs} ms).`;
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
    label.textContent = `Projet déclaré : ${result.project.topology === 'monolith' ? 'monolithe' : 'services'} · version ${result.project.revisionId}.`;
    details.append(label);
    for (const service of result.project.services) {
      const item = document.createElement('p');
      item.textContent = `${service.name} (${service.runtime}) · ${service.root} · ${service.files.length} fichier(s) de cette version · non connecté. ${service.reason}`;
      details.append(item);
    }
  } else {
    const label = document.createElement('p');
    label.textContent =
      'Aucun manifeste devmethod.project.json dans cette version. Le runtime local reste distinct d’un backend métier du projet.';
    details.append(label);
  }
  return details;
}

function createRuntimeBrowser({ document, root, loadServices, loadSource, copyText }) {
  const refresh = document.createElement('button');
  refresh.type = 'button';
  refresh.textContent = 'Actualiser les services';
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
  async function load(nextId) {
    revisionId = nextId;
    pending?.abort();
    pending = new AbortController();
    const request = ++serial;
    status.textContent = 'Lecture des services réellement démarrés…';
    refresh.disabled = true;
    try {
      const result = await loadServices({ revisionId, signal: pending.signal });
      if (destroyed || request !== serial) return;
      if (result.sources?.scope !== 'runtime' || !Array.isArray(result.services))
        throw new Error('Le catalogue reçu ne décrit pas le runtime attendu.');
      details.replaceChildren(describeServices(document, result));
      await source.showRevision(result.sources);
      if (destroyed || request !== serial) return;
      status.textContent =
        'Backend embarqué en lecture seule ; les services du projet sont des déclarations, pas des processus lancés.';
    } catch (error) {
      if (destroyed || request !== serial) return;
      status.textContent = `État non vérifié : ${error.message || 'lecture interrompue'}`;
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
  const element = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  const heading = element('h2', 'Code de votre application');
  const revisionLabel = element('p', '', 'source-revision');
  const hint = element('p', 'Lecture seule · Les fichiers appartiennent à la version affichée.');
  const sourceButton = element('button', 'Afficher le fichier');
  sourceButton.type = 'button';
  const compareButton = element('button', 'Comparer');
  compareButton.setAttribute('aria-label', 'Comparer à la version précédente');
  compareButton.title = 'Comparer à la version précédente';
  compareButton.type = 'button';
  compareButton.disabled = true;
  const copyButton = element('button', 'Copier le contenu');
  copyButton.type = 'button';
  copyButton.disabled = true;
  if (!copyText) copyButton.title = 'Le presse-papiers est indisponible dans cet environnement.';
  const actions = element('div', undefined, 'source-actions');
  const editButton = element('button', 'Modifier');
  editButton.setAttribute('aria-label', 'Modifier le code');
  editButton.type = 'button';
  editButton.disabled = true;
  if (allowEdit) actions.append(editButton);
  actions.append(compareButton);
  const navigation = element('nav', undefined, 'source-files');
  navigation.setAttribute('aria-label', 'Fichiers de la version');
  const selectedLabel = element('h3', 'Aucun fichier sélectionné');
  const status = element('p', '', 'source-status');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  const metadata = element('p', '', 'source-metadata');
  const sourceDetails = element('details', undefined, 'source-details');
  sourceDetails.append(
    element('summary', 'Version et fichier'),
    heading,
    revisionLabel,
    hint,
    metadata,
  );
  const pre = element('pre', undefined, 'source-content');
  pre.tabIndex = 0;
  pre.setAttribute('aria-label', 'Contenu du fichier en lecture seule');
  const code = element('code');
  pre.append(code);
  const retry = element('button', 'Réessayer la lecture');
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
  back.setAttribute('aria-label', 'Consulter la version et ses différences');
  back.title = 'Consulter la version et ses différences';
  back.type = 'button';
  const editorRoot = element('div', undefined, 'source-editor-root');
  const editorControls = element('div', undefined, 'source-editor-controls');
  editorControls.hidden = true;
  editing.append(editorRoot);
  const runtimeRoot = element('div', undefined, 'source-runtime');
  runtimeRoot.hidden = true;
  const sectionMenu = element('details', undefined, 'source-menu');
  const sectionSummary = element('summary', includeRuntime ? 'Application' : 'Options');
  const sectionButtons = element('div', undefined, 'source-menu-actions');
  const applicationButton = element('button', 'Application');
  const runtimeButton = element('button', 'Diagnostic du Studio');
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
  sectionMenu.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      sectionMenu.open = false;
      sectionSummary.focus();
    }
  });
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
    sectionSummary.textContent = 'Diagnostic du Studio';
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
    sectionSummary.textContent = includeRuntime ? 'Application' : 'Options';
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
    status.textContent =
      'Le brouillon est indisponible ou appartient à une autre version. La copie locale est conservée.';
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
      throw new Error('Le contenu reçu ne correspond pas au fichier de cette version.');
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
      status.textContent =
        'Ce fichier a été supprimé de cette version. La comparaison permet de consulter ses lignes supprimées.';
      return;
    }
    metadata.textContent = `${result.bytes.toLocaleString('fr-FR')} octets · SHA-256 ${result.sha256}`;
    if (result.binary) {
      status.textContent = 'Fichier binaire : le contenu textuel n’est pas affiché.';
    } else {
      code.textContent = result.content;
      sourceContent = result.content;
      copyButton.disabled = !copyText;
      copyButton.textContent = result.truncated ? 'Copier l’extrait' : 'Copier le contenu';
      pre.hidden = false;
      codeSurface.setDocument({ path: result.path, value: result.content, readOnly: true });
      status.textContent = result.truncated
        ? 'Aperçu limité : une partie du fichier est affichée. L’export conserve le fichier complet.'
        : 'Fichier de la version chargé. Lecture seule.';
      status.dataset.state = result.truncated ? 'partial' : 'ready';
    }
  }

  function renderDifference(before, after) {
    metadata.textContent = `${previousRevision.title} → ${revision.title}`;
    if ([before, after].some((result) => result?.binary || result?.truncated)) {
      status.textContent =
        'Comparaison indisponible : un fichier est binaire ou son aperçu est tronqué. Aucune différence partielle n’est présentée comme complète.';
      return;
    }
    const difference = compareLineSources(before?.content || '', after?.content || '');
    if (difference.kind !== 'available') {
      status.textContent = difference.reason;
      return;
    }
    if (!difference.added && !difference.removed) {
      status.textContent =
        !before || !after
          ? `Fichier vide ${before ? 'supprimé' : 'ajouté'} ; aucune ligne à afficher.`
          : 'Aucune différence : les contenus textuels complets sont identiques.';
    } else {
      status.textContent = `${difference.added} ligne(s) ajoutée(s), ${difference.removed} ligne(s) supprimée(s). Numéros : ancienne version, nouvelle version. ␍ indique une fin de ligne CRLF.`;
    }
    const width = String(
      Math.max(...difference.entries.map((entry) => entry.beforeLine || entry.afterLine || 1), 1),
    ).length;
    for (const entry of difference.entries) {
      const symbol = { equal: ' ', removed: '−', added: '+' }[entry.type];
      const oldNumber = String(entry.beforeLine || '').padStart(width);
      const newNumber = String(entry.afterLine || '').padStart(width);
      const content = entry.text.replace(/\r\n$/, ' ␍\n');
      const ending = entry.text.endsWith('\n') ? '' : '\n\\ Pas de saut de ligne final\n';
      const line = element(
        'span',
        `${symbol} ${oldNumber} ${newNumber} │ ${content}${ending}`,
        `source-line source-line-${entry.type}`,
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
    status.textContent = mode === 'source' ? 'Lecture du fichier…' : 'Lecture des deux versions…';
    status.dataset.state = 'loading';
    viewer.setAttribute('aria-busy', 'true');
    retry.hidden = true;
    pre.hidden = true;
    codeSurface.clear();
    pre.setAttribute(
      'aria-label',
      mode === 'source'
        ? 'Contenu du fichier en lecture seule'
        : 'Différences entre les deux versions du fichier',
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
      status.textContent = error.message || 'Lecture du fichier indisponible.';
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
      button.setAttribute('aria-label', 'Lire ' + file.path);
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
        status.textContent = 'Contenu affiché copié dans le presse-papiers.';
    } catch {
      if (!destroyed && request === requestNumber)
        status.textContent =
          'La copie a été refusée par le navigateur. Vous pouvez sélectionner le texte du fichier.';
    }
  }
  copyButton.addEventListener('click', copySource);

  return {
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
      heading.textContent =
        next?.scope === 'runtime'
          ? 'Sources du backend local DevMethod'
          : 'Code de votre application';
      hint.textContent =
        next?.scope === 'runtime'
          ? next.provenance
          : 'Lecture seule · Les fichiers appartiennent à la version affichée.';
      editButton.disabled = !next || next.id !== activeRevision;
      editButton.title =
        next?.id === activeRevision
          ? 'Ouvrir un brouillon de cette version'
          : 'Choisissez la version active pour la modifier.';
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
        revisionLabel.textContent = 'Aucune version à consulter';
        selectedLabel.textContent = 'Aucun fichier sélectionné';
        status.textContent = 'Le code sera disponible lorsqu’une application aura été produite.';
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
      destroyed = true;
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
