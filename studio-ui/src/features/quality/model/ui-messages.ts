import { translateStudioError } from '../../../../../scripts/studio/public/error-messages.js';
import { translate } from '../../../i18n';
const messages: Record<string, string> = {
  'Le pilote optionnel playwright-core est absent de cette installation.':
    'The optional playwright-core driver is absent from this installation.',
  'Le pilote est installé. Activer ce contrôle pour utiliser une copie isolée du candidat.':
    'The driver is installed. Enable this check to use an isolated copy of the candidate.',
  'Réenregistrer ce réglage pour confirmer la configuration locale avant de lancer le contrôle.':
    'Save this setting again to confirm the local configuration before running the check.',
  'Le navigateur sélectionné doit être installé ; sa disponibilité sera vérifiée au lancement.':
    'The selected browser must be installed; availability will be checked at launch.',
  Lecture: 'Read',
  Configuration: 'Configuration',
  Contrôle: 'Check',
  'Réglage navigateur indisponible.': 'Browser settings unavailable.',
  'Configuration navigateur invalide.': 'Invalid browser configuration.',
  'Configuration relue. Vos choix sont conservés ; examinez-les avant d’enregistrer.':
    'Configuration reloaded. Your choices are retained; review them before saving.',
  'Lecture impossible.': 'Unable to load.',
  'Réglage enregistré. Aucun navigateur lancé maintenant. Les prochains candidats de l’agent pourront être vérifiés automatiquement.':
    'Settings saved. No browser launched now. Future agent candidates may be checked automatically.',
  'Réglage enregistré. Aucun navigateur lancé. Utilisez Exécuter dans le contrôle navigateur.':
    'Settings saved. No browser launched. Use Run in the browser check.',
  ' Vos choix sont conservés. Relisez la configuration avant de réessayer.':
    ' Your choices are retained. Reload the configuration before retrying.',
  'L’examen reçu ne correspond pas à cette version et ce reçu.':
    'The received review does not match this version and receipt.',
  'Appréciation enregistrée. Aucun contrôle relancé ni version adoptée.':
    'Assessment saved. No check rerun or version adopted.',
  'Appréciation enregistrée, mais relecture indisponible. ':
    'Assessment saved, but reloading is unavailable. ',
  ' Vos saisies sont conservées. Actualisez l’examen avant de confirmer à nouveau.':
    ' Your entries are retained. Refresh the review before confirming again.',
  'Rapport qualité invalide.': 'Invalid quality report.',
  'La réponse concerne une autre version ; série interrompue.':
    'The response concerns another version; batch interrupted.',
  'La réponse concerne une autre version ; rapport écarté.':
    'The response concerns another version; report discarded.',
  'Contrôle indisponible.': 'Check unavailable.',
  'La réponse concerne une autre version.': 'The response concerns another version.',
  'Actualisation du rapport après appréciation impossible. ':
    'Could not refresh the report after assessment. ',
  'Réessayez.': 'Retry.',
  'Chargement impossible.': 'Unable to load.',
  'Enregistrement impossible.': 'Unable to save.',
};
/** Only local UI feedback; project content is never passed to this formatter. */
export function localizeMessage(
  value: string | undefined,
  locale: 'en' | 'fr',
): string | undefined {
  if (!value) return value;
  const timeout =
    /^Délai de réponse dépassé \((\d+(?:\.\d+)?) s\)\. Aucun nouveau résultat confirmé\. Réessayez pour lire l’état réel des contrôles ; une exécution peut continuer côté serveur\.$/.exec(
      value,
    );
  if (timeout)
    return translate(
      'Délai de réponse dépassé ({seconds} s). Aucun nouveau résultat confirmé. Réessayez pour lire l’état réel des contrôles ; une exécution peut continuer côté serveur.',
      'Response timed out ({seconds} s). No new result confirmed. Retry to read the actual check status; execution may continue on the server.',
      { seconds: timeout[1]! },
      locale,
    );
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
  return translateStudioError(value, locale);
}
