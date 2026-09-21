import { useSyncExternalStore } from 'react';
import { CATEGORY_LABELS } from '../model/domain';

const filterChanged = 'les-ateliers:category-changed';

function category(value: string | null): string {
  return value !== null && Object.hasOwn(CATEGORY_LABELS, value) ? value : 'all';
}

function snapshot(): string {
  return typeof window === 'undefined'
    ? 'all'
    : category(new URLSearchParams(window.location.search).get('category'));
}

function subscribe(notify: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const target = window;
  target.addEventListener('popstate', notify);
  target.addEventListener(filterChanged, notify);
  return () => {
    target.removeEventListener('popstate', notify);
    target.removeEventListener(filterChanged, notify);
  };
}

function setFilter(value: string): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  const next = category(value);
  if (next === 'all') url.searchParams.delete('category');
  else url.searchParams.set('category', next);
  if (url.href === window.location.href) return;
  window.history.pushState(window.history.state, '', url);
  window.dispatchEvent(new Event(filterChanged));
}

export function useWorkshopFilter() {
  const filter = useSyncExternalStore(subscribe, snapshot, () => 'all');
  return { filter, setFilter };
}
