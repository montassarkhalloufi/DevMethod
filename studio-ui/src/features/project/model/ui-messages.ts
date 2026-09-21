import { translateStudioError } from '../../../../../scripts/studio/public/error-messages.js';
import { engineMessage } from './engine-messages';
import { translate } from '../../../i18n';
const messages: Record<string, string> = {
  Analyse: 'Analysis',
  'Analyse indisponible': 'Analysis unavailable',
  'Analyse indisponible.': 'Analysis unavailable.',
  'L’analyse reçue concerne une autre version.': 'The received analysis concerns another version.',
  'Analyse interrompue.': 'Analysis interrupted.',
};
/** Only local UI feedback; project content is never passed to this formatter. */
export function localizeMessage(
  value: string | undefined,
  locale: 'en' | 'fr',
): string | undefined {
  if (!value) return value;
  if (messages[value]) return translate(value, messages[value], undefined, locale);
  for (const [fr, en] of Object.entries(messages)) {
    if (fr.endsWith(' ') && value.startsWith(fr))
      return (
        translate(fr, en, undefined, locale) +
        (localizeMessage(value.slice(fr.length), locale) ?? '')
      );
    if (fr.startsWith(' ') && value.endsWith(fr))
      return (
        (localizeMessage(value.slice(0, -fr.length), locale) ?? '') +
        translate(fr, en, undefined, locale)
      );
  }
  return translateStudioError(engineMessage(value, locale), locale);
}
