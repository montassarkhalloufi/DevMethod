import { compareLineSources } from './source-diff.js';
import { createCodeEditor } from './source-editor.js';

async function readSource({ revisionId, path, signal }) {
  const query = new URLSearchParams({ revision: revisionId, path });
  const response = await fetch('/api/source?' + query, { signal });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Lecture du fichier indisponible.');
  return result;
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
  const compareButton = element('button', 'Comparer à la version précédente');
  compareButton.type = 'button';
  compareButton.disabled = true;
  const copyButton = element('button', 'Copier le contenu');
  copyButton.type = 'button';
  copyButton.disabled = true;
  if (!copyText) copyButton.title = 'Le presse-papiers est indisponible dans cet environnement.';
  const actions = element('div', undefined, 'source-actions');
  actions.append(sourceButton, compareButton, copyButton);
  const editButton = element('button', 'Modifier le code');
  editButton.type = 'button';
  editButton.disabled = true;
  if (allowEdit) actions.append(editButton);
  const navigation = element('nav', undefined, 'source-files');
  navigation.setAttribute('aria-label', 'Fichiers de la version');
  const selectedLabel = element('h3', 'Aucun fichier sélectionné');
  const status = element('p', '', 'source-status');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  const metadata = element('p', '', 'source-metadata');
  const pre = element('pre', undefined, 'source-content');
  pre.tabIndex = 0;
  pre.setAttribute('aria-label', 'Contenu du fichier en lecture seule');
  const code = element('code');
  pre.append(code);
  const retry = element('button', 'Réessayer la lecture');
  retry.type = 'button';
  retry.hidden = true;
  const viewer = element('section', undefined, 'source-viewer');
  viewer.append(selectedLabel, actions, status, metadata, pre, retry);
  const body = element('div', undefined, 'source-body');
  body.append(navigation, viewer);
  const reading = element('div');
  reading.append(heading, revisionLabel, hint, body);
  const editing = element('div');
  editing.hidden = true;
  const back = element('button', '← Consulter la version et ses différences', 'source-editor-back');
  back.type = 'button';
  const editorRoot = element('div');
  editing.append(back, editorRoot);
  root.replaceChildren(reading, editing);
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
  editButton.addEventListener('click', () => {
    if (!revision) return;
    reading.hidden = true;
    editing.hidden = false;
    editor ??= createCodeEditor({
      document,
      root: editorRoot,
      api: editorApi,
      onApplied,
      onCorrection,
    });
    void editor.open(revision.id, selectedPath).then(() => {
      if (document.defaultView?.matchMedia?.('(max-width: 900px)').matches)
        editing.scrollIntoView({ block: 'start' });
    });
  });
  back.addEventListener('click', () => {
    reading.hidden = false;
    editing.hidden = true;
  });

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
    const result = await loadSource({ revisionId: owner.id, path: file.path, signal });
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
      status.textContent = result.truncated
        ? 'Aperçu limité : une partie du fichier est affichée. L’export conserve le fichier complet.'
        : 'Fichier de la version chargé. Lecture seule.';
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
  }

  async function openFile(file) {
    if (!revision || destroyed) return;
    const currentRequest = ++requestNumber;
    pending?.abort();
    pending = new AbortController();
    selectedPath = file.path;
    selectedLabel.textContent = file.path;
    code.textContent = '';
    sourceContent = null;
    copyButton.disabled = true;
    metadata.textContent = '';
    status.textContent = mode === 'source' ? 'Lecture du fichier…' : 'Lecture des deux versions…';
    viewer.setAttribute('aria-busy', 'true');
    retry.hidden = true;
    pre.hidden = true;
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
      if (destroyed || currentRequest !== requestNumber) return;
      if (mode === 'source') renderSource(result);
      else renderDifference(before, result);
    } catch (error) {
      if (destroyed || currentRequest !== requestNumber) return;
      code.textContent = '';
      status.textContent = error.message || 'Lecture du fichier indisponible.';
      retry.hidden = false;
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
    async showRevision(
      next,
      { previousRevision: previous = null, activeRevision = next?.id } = {},
    ) {
      if (destroyed) return;
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
      root.replaceChildren();
    },
  };
}
