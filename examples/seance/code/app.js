import * as D from './domain.js';
import * as R from './render.js';
import * as S from './storage.js';

export function start(document, storage = S) {
  const root = document.getElementById('app');
  const status = document.getElementById('storage');
  let documentState;
  let volatile = false;
  let selectedVersion = null;
  try {
    documentState = storage.load() || D.initial();
  } catch (error) {
    status.textContent = `Stockage illisible : ${error.message} Les données existantes ne sont pas écrasées. Le prototype s’arrête pour éviter une perte.`;
    return;
  }

  function save() {
    try {
      storage.save(documentState);
      volatile = false;
      status.textContent =
        'Enregistré sur cet appareil. Les exports HTML restent consultables sans cet outil.';
    } catch (error) {
      volatile = true;
      status.textContent = `Enregistrement impossible : ${error.message} Session en mémoire seulement ; exportez les programmes et la sauvegarde JSON avant de fermer.`;
    }
  }

  function mutate(action) {
    action(documentState.draft);
    documentState.draft.decision =
      'Ajustement manuel du brouillon : vérifier les horaires et les changements avant publication.';
    save();
    render();
  }

  function download(name, body, type) {
    const url = URL.createObjectURL(new Blob([body], { type }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function bindOrderControls() {
    for (const [direction, offset] of [
      ['up', -1],
      ['down', 1],
    ]) {
      root.querySelectorAll(`[data-${direction}]`).forEach((button) => {
        button.onclick = () =>
          mutate((draft) => {
            const index = Number(button.dataset[direction]);
            [draft.order[index], draft.order[index + offset]] = [
              draft.order[index + offset],
              draft.order[index],
            ];
          });
      });
    }
    root.querySelectorAll('[data-remove]').forEach((button) => {
      button.onclick = () =>
        mutate((draft) => {
          draft.order = draft.order.filter((id) => id !== button.dataset.remove);
        });
    });
    root.querySelectorAll('[data-add]').forEach((button) => {
      button.onclick = () =>
        mutate((draft) => {
          draft.order.push(button.dataset.add);
        });
    });
  }

  function bindDraftControls() {
    root.querySelector('#title').onchange = (event) =>
      mutate((draft) => {
        draft.title = event.target.value.trim() || 'La séance collective';
      });
    bindOrderControls();
    const duration = root.querySelector('#discussion-duration');
    if (duration)
      duration.onchange = (event) =>
        mutate((draft) => {
          draft.order = draft.order.map((id) =>
            D.catalog[id].kind === 'discussion' ? event.target.value : id,
          );
        });
    const change = root.querySelector('#event');
    if (change)
      change.onclick = () =>
        mutate((draft) => {
          draft.callRequired = true;
        });
  }

  function bindProposals(options) {
    root.querySelectorAll('[data-option]').forEach((button) => {
      button.onclick = () => {
        documentState.draft = D.clone(options[Number(button.dataset.option)].draft);
        save();
        render();
      };
    });
  }

  function bindPublications(published) {
    root.querySelector('#publish').onclick = () => {
      documentState = D.publish(documentState, new Date().toISOString());
      selectedVersion = documentState.publications.at(-1).version;
      save();
      render();
    };
    const version = root.querySelector('#version');
    if (version)
      version.onchange = (event) => {
        selectedVersion = Number(event.target.value);
        render();
      };
    const exportButton = root.querySelector('#export');
    if (exportButton)
      exportButton.onclick = () =>
        download(
          `seance-v${published.version}.html`,
          R.offline(published),
          'text/html;charset=utf-8',
        );
    root.querySelector('#backup').onclick = () =>
      download(
        'seance-sauvegarde.json',
        JSON.stringify(documentState, null, 2),
        'application/json',
      );
  }

  function render() {
    const options = D.proposals(documentState.draft);
    const published =
      documentState.publications.find((item) => item.version === selectedVersion) ||
      documentState.publications.at(-1);
    root.innerHTML = R.workspace(documentState, {
      result: D.schedule(documentState.draft),
      options,
      published,
      volatile,
    });
    bindDraftControls();
    bindProposals(options);
    bindPublications(published);
  }

  save();
  render();
}

if (typeof document !== 'undefined') start(document);
