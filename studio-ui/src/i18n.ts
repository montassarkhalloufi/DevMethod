import { useCallback, useSyncExternalStore } from 'react';
import {
  getLocale,
  subscribeLocale,
  translate,
  type MessageValues,
} from '../../scripts/studio/public/i18n.js';

export {
  getLocale,
  initializeLocale,
  mountLocaleControls,
  setLocale,
  translate,
  type StudioLocale,
} from '../../scripts/studio/public/i18n.js';

const serverLocale = () => 'en' as const;

export function useI18n() {
  const locale = useSyncExternalStore(subscribeLocale, getLocale, serverLocale);
  const t = useCallback(
    (fr: string, en: string, values?: MessageValues) => translate(fr, en, values, locale),
    [locale],
  );
  return { locale, t };
}
