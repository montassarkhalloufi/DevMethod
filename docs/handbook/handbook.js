const chapters = [...document.querySelectorAll('.chapter')];
const routes = [...document.querySelectorAll('[data-route]')];
const sidebar = document.querySelector('#sidebar');
const menu = document.querySelector('#menu-button');
const backdrop = document.querySelector('#backdrop');
const dialog = document.querySelector('#search-dialog');
const searchButton = document.querySelector('#search-button');
const searchInput = document.querySelector('#search-input');
const searchResults = document.querySelector('#search-results');
const storageKey = 'devmethod-handbook-mastered-v1';
const contentRoot = document.documentElement.dataset.contentRoot || '../../';
const deepDocuments = [
  'docs/START-HERE.md',
  'docs/product/PROMISE.md',
  'docs/product/CURRENT-STATE.md',
  'docs/product/GLOSSARY.md',
  'docs/method/OVERVIEW.md',
  'docs/method/WORKFLOW.md',
  'docs/studio/USER-GUIDE.md',
  'docs/studio/CONTROL-PLANE.md',
  'docs/studio/SERVER-API.md',
  'docs/studio/FRONTEND-STATE.md',
  'docs/architecture/SYSTEM-MAP.md',
  'docs/architecture/THEORY-TO-CODE.md',
  'docs/architecture/ENGINE-ATLAS.md',
  'docs/architecture/CODE-MAP.md',
  'docs/architecture/DATA-FLOWS.md',
  'docs/architecture/REQUEST-LIFECYCLE.md',
  'docs/architecture/CONTRACTS-AND-INVARIANTS.md',
  'docs/maintainers/CODE-DOSSIERS.md',
  'docs/maintainers/DEVELOPMENT.md',
  'docs/maintainers/TESTING.md',
  'docs/maintainers/ADDING-A-FEATURE.md',
  'docs/maintainers/CHANGE-RECIPES.md',
  'docs/maintainers/FAILURE-PLAYBOOK.md',
  'docs/maintainers/LABS-AND-ASSESSMENT.md',
  'docs/maintainers/LEARNING-PATH.md',
  'docs/maintainers/RELEASE.md',
  'docs/STUDIO.md',
  'docs/STUDIO-CONNECTORS.md',
];
history.scrollRestoration = 'manual';

function knownRoute(value) {
  return chapters.some((chapter) => chapter.id === value) ? value : 'bienvenue';
}

function closeMenu() {
  sidebar.classList.remove('is-open');
  menu.setAttribute('aria-expanded', 'false');
  backdrop.classList.remove('is-visible');
}

function navigate(route, updateHistory = true) {
  const id = knownRoute(route);
  chapters.forEach((chapter) => chapter.classList.toggle('is-active', chapter.id === id));
  document.querySelectorAll('.chapter-nav a').forEach((link) => {
    const active = link.dataset.route === id;
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  if (updateHistory) history.pushState(null, '', `#${id}`);
  closeMenu();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  requestAnimationFrame(() => {
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    document.querySelector('#chapter').focus({ preventScroll: true });
  });
}

routes.forEach((control) =>
  control.addEventListener('click', (event) => {
    event.preventDefault();
    navigate(control.dataset.route);
  }),
);

document.addEventListener('click', (event) => {
  const anchor = event.target.closest('a');
  if (!anchor || anchor.dataset.route) return;
  const target = new URL(anchor.href, location.href);
  if (target.origin !== location.origin || !target.pathname.toLocaleLowerCase().endsWith('.md'))
    return;
  const root = new URL(contentRoot, location.href);
  if (!target.pathname.startsWith(root.pathname)) return;
  event.preventDefault();
  const documentPath = decodeURIComponent(target.pathname.slice(root.pathname.length));
  const current = knownRoute(location.hash.slice(1));
  location.href = `read.html?doc=${encodeURIComponent(documentPath)}&from=${encodeURIComponent(current)}`;
});

menu.addEventListener('click', () => {
  const open = !sidebar.classList.contains('is-open');
  sidebar.classList.toggle('is-open', open);
  menu.setAttribute('aria-expanded', String(open));
  backdrop.classList.toggle('is-visible', open);
});
backdrop.addEventListener('click', closeMenu);
addEventListener('popstate', () => navigate(location.hash.slice(1), false));

function mastered() {
  try {
    return new Set(JSON.parse(localStorage.getItem(storageKey) || '[]'));
  } catch {
    return new Set();
  }
}

function renderProgress() {
  const done = mastered();
  document.querySelectorAll('[data-master]').forEach((button) => {
    const active = done.has(button.dataset.master);
    button.classList.toggle('is-mastered', active);
    button.textContent = active ? '✓ Chapitre lu' : '✓ Marquer comme lu';
    button.setAttribute('aria-pressed', String(active));
  });
  const count = done.size;
  document.querySelector('#progress-bar').style.width = `${Math.min(100, (count / chapters.length) * 100)}%`;
  document.querySelector('#progress-copy').textContent = `${count}/${chapters.length} chapitres lus`;
  document.querySelector('#level-title').textContent =
    count === chapters.length
      ? 'Parcours théorique lu'
      : count >= 9
        ? 'Lecture avancée'
        : count >= 6
          ? 'Fondations lues'
          : count >= 3
            ? 'Découverte en cours'
            : 'Lecture à commencer';
}

document.querySelectorAll('[data-master]').forEach((button) =>
  button.addEventListener('click', () => {
    const done = mastered();
    if (done.has(button.dataset.master)) done.delete(button.dataset.master);
    else done.add(button.dataset.master);
    localStorage.setItem(storageKey, JSON.stringify([...done]));
    renderProgress();
  }),
);

const searchIndex = chapters.map((chapter) => ({
  id: chapter.id,
  title: chapter.dataset.title,
  text: chapter.innerText.replace(/\s+/g, ' ').trim(),
  kind: 'Chapitre',
}));

async function indexDeepDocuments() {
  const root = new URL(contentRoot, location.href);
  const results = await Promise.allSettled(
    deepDocuments.map(async (path) => {
      const response = await fetch(new URL(path, root), { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const markdown = await response.text();
      const title = markdown.match(/^#\s+(.+)$/m)?.[1] || path.split('/').at(-1).replace(/\.md$/i, '');
      return {
        path,
        title,
        text: markdown.replace(/```[\s\S]*?```/g, ' ').replace(/[#*`>|_[\]()-]/g, ' ').replace(/\s+/g, ' ').trim(),
        kind: 'Référence',
      };
    }),
  );
  for (const result of results) {
    if (result.status === 'fulfilled') searchIndex.push(result.value);
  }
}

void indexDeepDocuments();

function renderSearch(query) {
  const words = query.toLocaleLowerCase('fr').trim().split(/\s+/).filter(Boolean);
  const matches = searchIndex.filter((item) =>
    words.every((word) => `${item.title} ${item.text}`.toLocaleLowerCase('fr').includes(word)),
  );
  searchResults.replaceChildren();
  const visible = query ? matches : searchIndex.slice(0, 5);
  if (!visible.length) {
    const empty = document.createElement('p');
    empty.className = 'search-empty';
    empty.textContent = 'Aucun chapitre ne contient ces termes.';
    searchResults.append(empty);
    return;
  }
  visible.forEach((item) => {
    const button = document.createElement('button');
    const lower = item.text.toLocaleLowerCase('fr');
    const position = words.length ? lower.indexOf(words[0]) : 0;
    const excerpt = item.text.slice(Math.max(0, position - 45), position + 155);
    const strong = document.createElement('strong');
    const span = document.createElement('span');
    strong.textContent = `${item.kind} · ${item.title}`;
    span.textContent = `${excerpt}${excerpt.length >= 200 ? '…' : ''}`;
    button.append(strong, span);
    button.addEventListener('click', () => {
      dialog.close();
      if (item.path) {
        const current = knownRoute(location.hash.slice(1));
        location.href = `read.html?doc=${encodeURIComponent(item.path)}&from=${encodeURIComponent(current)}`;
      } else {
        navigate(item.id);
      }
    });
    searchResults.append(button);
  });
}

function showSearch() {
  dialog.showModal();
  searchInput.value = '';
  renderSearch('');
  requestAnimationFrame(() => searchInput.focus());
}

searchButton.addEventListener('click', showSearch);
searchInput.addEventListener('input', () => renderSearch(searchInput.value));
addEventListener('keydown', (event) => {
  if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
    event.preventDefault();
    showSearch();
  }
  if (event.key === 'Escape') closeMenu();
});

navigate(location.hash.slice(1), false);
renderProgress();
