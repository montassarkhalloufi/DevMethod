import { setLocale, useI18n, type StudioLocale } from './i18n';

export function LanguageSelector() {
  const { locale, t } = useI18n();
  return (
    <label className="studio-language">
      <span className="sr-only">{t('Langue du Studio', 'Studio language')}</span>
      <select
        value={locale}
        name="studio-language"
        title={t('Langue du Studio', 'Studio language')}
        onChange={(event) => setLocale(event.target.value as StudioLocale)}
      >
        <option value="en" lang="en">
          English
        </option>
        <option value="fr" lang="fr">
          Français
        </option>
      </select>
    </label>
  );
}
