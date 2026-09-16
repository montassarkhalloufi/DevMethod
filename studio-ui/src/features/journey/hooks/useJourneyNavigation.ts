import { useSyncExternalStore, type MouseEvent } from 'react';
import { journeyLocation } from '../model/navigation';

const navigationEvent = 'studio:journey-navigation';
function subscribe(notify: () => void) {
  window.addEventListener('hashchange', notify);
  window.addEventListener('popstate', notify);
  window.addEventListener(navigationEvent, notify);
  return () => {
    window.removeEventListener('hashchange', notify);
    window.removeEventListener('popstate', notify);
    window.removeEventListener(navigationEvent, notify);
  };
}
const snapshot = () => window.location.hash;

export function useJourneyNavigation() {
  const hash = useSyncExternalStore(subscribe, snapshot, () => '');
  function navigate(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    const target = event.currentTarget.hash;
    if (target !== window.location.hash) {
      window.history.pushState(null, '', target);
      window.dispatchEvent(new Event(navigationEvent));
    }
  }
  return { ...journeyLocation(hash), navigate };
}
