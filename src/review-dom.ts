import { reviewUrl } from './review-model.js';

export const el = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls = '',
  text?: string,
): HTMLElementTagNameMap[K] => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};
export function button(label: string, cls: string, action: () => void): HTMLButtonElement {
  const b = el('button', cls, label);
  b.type = 'button';
  b.addEventListener('click', action);
  return b;
}
export function textBlock(title: string, value: string, parent: HTMLElement): void {
  const box = el('section', 'text-block');
  box.append(el('h3', '', title), el('p', '', value));
  parent.append(box);
}
export function badge(label: string, kind: string, icon: string): HTMLElement {
  return el('span', `badge ${kind}`, `${icon} ${label}`);
}
export function link(label: string, url: string | null, parent: HTMLElement, cls = 'link'): void {
  if (!reviewUrl(url)) {
    parent.append(
      el('p', 'muted unavailable', 'Destination indisponible : aucun lien HTTPS valide renseigné.'),
    );
    return;
  }
  const a = el('a', cls, `${label} ↗`);
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  parent.append(a);
}
export function download(name: string, body: string, type: string): void {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const a = el('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function tabs(
  items: [string, string][],
  active: string,
  change: (id: string) => void,
  label: string,
  panelId: string,
): HTMLElement {
  const group = el('div', 'tabs');
  group.setAttribute('role', 'tablist');
  group.setAttribute('aria-label', label);
  for (const [id, title] of items) {
    const b = button(title, active === id ? 'tab active' : 'tab', () => {
      change(id);
      document.getElementById(`${panelId}-${id}`)?.focus();
    });
    b.id = `${panelId}-${id}`;
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', String(active === id));
    b.setAttribute('aria-controls', panelId);
    b.tabIndex = active === id ? 0 : -1;
    b.addEventListener('keydown', (e) => {
      const index = items.findIndex((i) => i[0] === id);
      let next: number | null = null;
      if (e.key === 'ArrowRight') next = (index + 1) % items.length;
      if (e.key === 'ArrowLeft') next = (index + items.length - 1) % items.length;
      if (e.key === 'Home') next = 0;
      if (e.key === 'End') next = items.length - 1;
      if (next !== null) {
        e.preventDefault();
        change(items[next]![0]);
        document.getElementById(`${panelId}-${items[next]![0]}`)?.focus();
      }
    });
    group.append(b);
  }
  return group;
}
