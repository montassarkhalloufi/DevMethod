import { translateAgentMessage } from '../../../../../scripts/studio/public/i18n.js';
import { translateStudioError } from '../../../../../scripts/studio/public/error-messages.js';
import { translate } from '../../../i18n';
const messages: Record<string, string> = {
  Configuration: 'Configuration',
  'Réessayez.': 'Retry.',
  'Connexion impossible. Vérifiez l’état et réessayez.':
    'Connection failed. Check status and retry.',
  'Action impossible. Réessayez.': 'Action failed. Retry.',
};
/** Only local UI feedback; project content is never passed to this formatter. */
export function localizeMessage(
  value: string | undefined,
  locale: 'en' | 'fr',
): string | undefined {
  if (!value) return value;
  if (Object.hasOwn(messages, value))
    return translate(value, messages[value] ?? value, undefined, locale);
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
  return translateStudioError(translateAgentMessage(value, locale), locale);
}
