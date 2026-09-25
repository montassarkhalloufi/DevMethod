const params = new URLSearchParams(location.search);
const requested = params.get('doc') || '';
const from = params.get('from') || 'bienvenue';
const contentRoot = document.documentElement.dataset.contentRoot || '../../';
const publicBundle = document.documentElement.dataset.publicBundle === 'true';
const repositoryURL =
  document.documentElement.dataset.repositoryUrl ||
  'https://github.com/montassarkhalloufi/DevMethod/blob/main/';
const allowedTopLevel = new Set([
  'README.md',
  'CONTRIBUTING.md',
  'COMPATIBILITY.md',
  'VALIDATION.md',
  'START_HERE.md',
]);
const loading = document.querySelector('#loading');
const errorPanel = document.querySelector('#error');
const errorCopy = document.querySelector('#error-copy');
const article = document.querySelector('#rendered-document');
const toc = document.querySelector('#toc');
const backLink = document.querySelector('#back-link');
const sourceLink = document.querySelector('#source-link');
const documentName = document.querySelector('#document-name');
const documentPath = document.querySelector('#document-path');
const tocButton = document.querySelector('#toc-button');
const sidebar = document.querySelector('.reader-sidebar');

function safeDocument(value) {
  if (!value || value.includes('..') || value.includes('\\')) return false;
  return allowedTopLevel.has(value) || /^docs\/[a-zA-Z0-9._/-]+\.md$/.test(value);
}

function escapeHTML(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function slug(value, used) {
  const base = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'section';
  const count = used.get(base) || 0;
  used.set(base, count + 1);
  return count ? `${base}-${count + 1}` : base;
}

function repositoryPath(target) {
  const sourceParts = requested.split('/').slice(0, -1);
  const targetParts = decodeURIComponent(target.split(/[?#]/)[0]).split('/');
  const parts = target.startsWith('/') ? [] : [...sourceParts];
  for (const part of targetParts) {
    if (!part || part === '.') continue;
    if (part === '..') parts.pop();
    else parts.push(part);
  }
  return parts.join('/');
}

function resolveTarget(target) {
  if (/^(https?:|mailto:|#)/i.test(target)) return target;
  if (/^[a-z][a-z0-9+.-]*:/i.test(target)) return '#';
  if (publicBundle) {
    const relative = repositoryPath(target);
    const suffix = target.includes('#') ? `#${target.split('#').slice(1).join('#')}` : '';
    if (/^docs\/handbook\/(?:index|read)\.html$/i.test(relative)) {
      return `${new URL(relative.split('/').at(-1), location.href).href}${suffix}`;
    }
    if (safeDocument(relative) || /\.(?:gif|jpe?g|png|svg|webp)$/i.test(relative)) {
      return `${new URL(`${contentRoot}${relative}`, location.href).href}${suffix}`;
    }
    return `${repositoryURL}${relative}${suffix}`;
  }
  const source = new URL(`${contentRoot}${requested}`, location.href);
  return new URL(target, source).href;
}

function documentPathFromURL(url) {
  const absolute = new URL(url, location.href);
  const root = new URL(contentRoot, location.href);
  if (absolute.origin !== root.origin || !absolute.pathname.startsWith(root.pathname)) return null;
  const relative = decodeURIComponent(absolute.pathname.slice(root.pathname.length));
  return safeDocument(relative) ? relative : null;
}

function inline(value) {
  const tokens = [];
  let escaped = escapeHTML(value);
  escaped = escaped.replace(/`([^`]+)`/g, (_, code) => {
    const token = `@@INLINE${tokens.length}@@`;
    tokens.push(`<code>${code}</code>`);
    return token;
  });
  escaped = escaped.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g, (_, alt, target) => {
    const src = resolveTarget(target);
    const token = `@@INLINE${tokens.length}@@`;
    tokens.push(`<figure><img src="${escapeHTML(src)}" alt="${alt}" loading="lazy"><figcaption>${alt}</figcaption></figure>`);
    return token;
  });
  escaped = escaped.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g, (_, label, target) => {
    const href = resolveTarget(target);
    const doc = documentPathFromURL(href);
    const fragment = new URL(href, location.href).hash;
    const safeHref = doc
      ? `read.html?doc=${encodeURIComponent(doc)}&from=${encodeURIComponent(from)}${fragment}`
      : href;
    const token = `@@INLINE${tokens.length}@@`;
    tokens.push(`<a href="${escapeHTML(safeHref)}">${label}</a>`);
    return token;
  });
  escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  escaped = escaped.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  for (let pass = 0; pass <= tokens.length; pass += 1) {
    if (!/@@INLINE\d+@@/.test(escaped)) break;
    escaped = escaped.replace(/@@INLINE(\d+)@@/g, (_, index) => tokens[Number(index)]);
  }
  return escaped;
}

function cells(line) {
  return line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim());
}

function isTableDivider(line) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function startsBlock(lines, index) {
  const line = lines[index] || '';
  const next = lines[index + 1] || '';
  return (
    !line.trim() ||
    /^#{1,6}\s+/.test(line) ||
    /^```/.test(line) ||
    /^>\s?/.test(line) ||
    /^\s*([-*+] |\d+\. )/.test(line) ||
    /^\s*([-*_])(?:\s*\1){2,}\s*$/.test(line) ||
    (line.includes('|') && isTableDivider(next))
  );
}

function mermaidNode(token, fallback) {
  const match = token.match(/^([A-Za-z0-9_]+)(?:\[([^\]]+)\]|\(([^)]+)\)|\{([^}]+)\})?$/);
  if (!match) return { id: token, label: fallback || token };
  return { id: match[1], label: (match[2] || match[3] || match[4] || fallback || match[1]).replaceAll('\\n', ' ') };
}

function renderFlowchart(source) {
  const labels = new Map();
  const edges = [];
  for (const raw of source.split('\n').slice(1)) {
    const line = raw.trim();
    if (!line.includes('-->')) continue;
    const [left, ...rightParts] = line.split('-->');
    const labelled = rightParts.join('-->').trim().match(/^\|([^|]+)\|\s*(.+)$/);
    const from = mermaidNode(left.trim());
    const to = mermaidNode((labelled?.[2] || rightParts.join('-->')).trim());
    if (!labels.has(from.id) || from.label !== from.id) labels.set(from.id, from.label);
    if (!labels.has(to.id) || to.label !== to.id) labels.set(to.id, to.label);
    edges.push({ from: from.id, to: to.id, label: labelled?.[1] || '' });
  }
  if (!edges.length) return '';
  return `<div class="diagram-flow" role="group" aria-label="Diagramme de flux">${edges
    .map(
      (edge) =>
        `<div class="diagram-edge"><span class="diagram-node">${escapeHTML(labels.get(edge.from))}</span><span class="diagram-arrow"><i>→</i>${edge.label ? `<small>${escapeHTML(edge.label)}</small>` : ''}</span><span class="diagram-node">${escapeHTML(labels.get(edge.to))}</span></div>`,
    )
    .join('')}</div>`;
}

function renderSequence(source) {
  const participants = new Map();
  const events = [];
  for (const raw of source.split('\n').slice(1)) {
    const line = raw.trim();
    const participant = line.match(/^participant\s+([A-Za-z0-9_]+)\s+as\s+(.+)$/);
    if (participant) {
      participants.set(participant[1], participant[2]);
      continue;
    }
    const event = line.match(/^([A-Za-z0-9_]+)(?:-->>|->>|-->|->)([A-Za-z0-9_]+):\s*(.+)$/);
    if (event) events.push({ from: event[1], to: event[2], label: event[3] });
  }
  if (!events.length) return '';
  return `<div class="diagram-sequence" role="group" aria-label="Diagramme de séquence"><div class="diagram-participants">${[
    ...participants.entries(),
  ]
    .map(([id, label]) => `<span><b>${escapeHTML(id)}</b>${escapeHTML(label)}</span>`)
    .join('')}</div><ol>${events
    .map(
      (event) =>
        `<li><span>${escapeHTML(participants.get(event.from) || event.from)}</span><i>→</i><span>${escapeHTML(participants.get(event.to) || event.to)}</span><strong>${escapeHTML(event.label)}</strong></li>`,
    )
    .join('')}</ol></div>`;
}

function renderMermaid(source) {
  const visual = source.trimStart().startsWith('sequenceDiagram')
    ? renderSequence(source)
    : renderFlowchart(source);
  if (!visual) return '';
  return `${visual}<details class="diagram-source"><summary>Voir la source Mermaid</summary><pre><code>${escapeHTML(source)}</code></pre></details>`;
}

function renderMarkdown(markdown) {
  const lines = markdown.replace(/^\uFEFF/, '').replaceAll('\r\n', '\n').split('\n');
  const headings = [];
  const used = new Map();
  const output = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const fence = line.match(/^```\s*([^\s]*)/);
    if (fence) {
      const language = fence[1] || 'texte';
      const body = [];
      index += 1;
      while (index < lines.length && !/^```/.test(lines[index])) body.push(lines[index++]);
      if (index < lines.length) index += 1;
      const source = body.join('\n');
      const diagram = language === 'mermaid' ? renderMermaid(source) : '';
      output.push(
        `<section class="code-block ${language === 'mermaid' ? 'mermaid-block' : ''}"><header><span>${escapeHTML(language === 'mermaid' ? 'Diagramme HTML · source Mermaid conservée' : language)}</span><button type="button" data-copy>Copier</button></header>${diagram || `<pre><code>${escapeHTML(source)}</code></pre>`}</section>`,
      );
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const label = heading[2].replace(/\s+#+\s*$/, '');
      const id = slug(label, used);
      headings.push({ level, label: label.replace(/[*`]/g, ''), id });
      output.push(`<h${level} id="${id}">${inline(label)}</h${level}>`);
      index += 1;
      continue;
    }

    if (line.includes('|') && isTableDivider(lines[index + 1] || '')) {
      const headers = cells(line);
      const rows = [];
      index += 2;
      while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
        rows.push(cells(lines[index++]));
      }
      output.push(`<div class="table-wrap"><table><thead><tr>${headers.map((cell) => `<th>${inline(cell)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${headers.map((_, cellIndex) => `<td>${inline(row[cellIndex] || '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quote.push(lines[index++].replace(/^>\s?/, ''));
      }
      output.push(`<blockquote><p>${inline(quote.join(' '))}</p></blockquote>`);
      continue;
    }

    const list = line.match(/^\s*([-*+] |\d+\. )(.+)$/);
    if (list) {
      const ordered = /\d/.test(list[1]);
      const items = [];
      const pattern = ordered ? /^\s*\d+\.\s+(.+)$/ : /^\s*[-*+]\s+(.+)$/;
      while (index < lines.length) {
        const match = lines[index].match(pattern);
        if (!match) break;
        const item = [match[1]];
        index += 1;
        while (
          index < lines.length &&
          lines[index].trim() &&
          !pattern.test(lines[index]) &&
          !/^\s*([-*+] |\d+\. )/.test(lines[index]) &&
          !/^(#{1,6}\s+|```|>\s?)/.test(lines[index])
        ) {
          item.push(lines[index].trim());
          index += 1;
        }
        items.push(item.join(' '));
      }
      const tag = ordered ? 'ol' : 'ul';
      output.push(`<${tag}>${items.map((item) => `<li>${inline(item)}</li>`).join('')}</${tag}>`);
      continue;
    }

    if (/^\s*([-*_])(?:\s*\1){2,}\s*$/.test(line)) {
      output.push('<hr>');
      index += 1;
      continue;
    }

    const paragraph = [line.trim()];
    index += 1;
    while (index < lines.length && !startsBlock(lines, index)) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    output.push(`<p>${inline(paragraph.join(' '))}</p>`);
  }
  return { html: output.join('\n'), headings };
}

function renderToc(headings) {
  const visible = headings.filter((heading) => heading.level === 2 || heading.level === 3);
  toc.replaceChildren();
  const label = document.createElement('span');
  label.textContent = 'Dans cette référence';
  toc.append(label);
  for (const heading of visible) {
    const link = document.createElement('a');
    link.href = `#${heading.id}`;
    link.dataset.level = String(heading.level);
    link.textContent = heading.label;
    link.addEventListener('click', () => {
      sidebar.classList.remove('is-open');
      tocButton.setAttribute('aria-expanded', 'false');
    });
    toc.append(link);
  }
}

function installCopyButtons() {
  document.querySelectorAll('[data-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      const value = button.closest('.code-block').querySelector('code').textContent;
      await navigator.clipboard.writeText(value);
      button.textContent = 'Copié';
      setTimeout(() => {
        button.textContent = 'Copier';
      }, 1200);
    });
  });
}

function fail(message) {
  loading.hidden = true;
  article.hidden = true;
  errorCopy.textContent = message;
  errorPanel.hidden = false;
}

async function loadDocument() {
  if (!safeDocument(requested)) {
    fail('Le chemin demandé ne fait pas partie des références Markdown autorisées.');
    return;
  }
  const sourceURL = new URL(`${contentRoot}${requested}`, location.href);
  backLink.href = `index.html#${encodeURIComponent(from)}`;
  sourceLink.href = publicBundle ? `${repositoryURL}${requested}` : sourceURL.href;
  if (publicBundle) {
    sourceLink.removeAttribute('download');
    sourceLink.textContent = 'Voir la source GitHub';
  }
  sourceLink.hidden = false;
  documentPath.textContent = requested;
  documentName.textContent = requested.split('/').at(-1).replace(/\.md$/i, '').replaceAll('-', ' ');
  try {
    const response = await fetch(sourceURL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`réponse HTTP ${response.status}`);
    const bytes = await response.arrayBuffer();
    const markdown = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    const rendered = renderMarkdown(markdown);
    article.innerHTML = rendered.html;
    renderToc(rendered.headings);
    installCopyButtons();
    const title = rendered.headings.find((heading) => heading.level === 1)?.label;
    if (title) {
      document.title = `${title} — DevMethod`;
      documentName.textContent = title;
    }
    loading.hidden = true;
    article.hidden = false;
    document.querySelector('#document').focus({ preventScroll: true });
  } catch (error) {
    fail(`Lecture impossible : ${error instanceof Error ? error.message : 'erreur inconnue'}.`);
  }
}

tocButton.addEventListener('click', () => {
  const open = !sidebar.classList.contains('is-open');
  sidebar.classList.toggle('is-open', open);
  tocButton.setAttribute('aria-expanded', String(open));
});

void loadDocument();
