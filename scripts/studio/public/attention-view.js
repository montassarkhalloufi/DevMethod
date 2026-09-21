import { createTranslator, getLocale } from './i18n.js';
import { summarizeAttention } from './attention-model.js';

/** A read-only index of existing observations, not a score or an execution decision. */
export function createAttentionView(
  document,
  control,
  { element, list, link, kindLabel, reasonLabel, factorLabel },
) {
  const t = createTranslator(document);
  const locale = getLocale(document);
  const summary = summarizeAttention(control);
  const number = (value) => value.toLocaleString(locale);
  const root = element('section');
  root.dataset.attentionSummary = '';
  root.setAttribute('aria-label', t('Points à examiner', 'Items to review'));
  root.append(element('h4', t('Points à examiner', 'Items to review')));
  if (summary.stopReasons.length)
    root.append(
      element('h5', t('Arrêts en vigueur', 'Current stops')),
      list(summary.stopReasons.map(reasonLabel)),
    );
  if (summary.criticalFactors.length)
    root.append(
      element('h5', t('Facteurs critiques', 'Critical factors')),
      list(summary.criticalFactors.map(factorLabel)),
    );
  root.append(
    element(
      'p',
      summary.revisionId
        ? t('Version évaluée : {id}', 'Assessed version: {id}', { id: summary.revisionId })
        : t('Aucune version candidate évaluée.', 'No assessed candidate version.'),
    ),
  );
  root.append(
    element(
      'p',
      t(
        'Observations à examiner : {observed}. Preuves courantes de cette version, tous résultats confondus : {current}. Preuves historiques hors version : {historical}.',
        'Observations to review: {observed}. Current evidence for this version, including all results: {current}. Historical evidence outside this version: {historical}.',
        {
          observed: number(summary.observedCount),
          current: number(summary.currentCount),
          historical: number(summary.historicalCount),
        },
      ),
    ),
  );
  root.append(
    element(
      'p',
      t(
        'Une observation courante peut aussi demander un examen. Les preuves manquantes ne sont pas comptées comme observations. Le nombre de points ne mesure ni le risque ni la qualité ; les arrêts et limites restent applicables.',
        'Current observations can also need review. Missing evidence is not counted as an observation. Counts measure neither risk nor quality; stops and limits still apply.',
      ),
      'muted',
    ),
  );
  const groups = element('ul', '', 'plain-list');
  for (const group of summary.groups) {
    const item = element('li');
    item.append(element('h5', `${kindLabel(group.kind)} · ${number(group.count)}`));
    item.append(
      element(
        'p',
        t(
          'Courantes : {current} · Non courantes : {stale} · Non attestées par Studio : {untrusted}. Ces catégories peuvent se recouper.',
          'Current: {current} · Non-current: {stale} · Not attested by Studio: {untrusted}. These categories can overlap.',
          {
            current: number(group.currentIds.length),
            stale: number(group.staleIds.length),
            untrusted: number(group.untrustedIds.length),
          },
        ),
      ),
    );
    const evidence = element('ul', '', 'plain-list');
    for (const id of group.evidenceIds) {
      const row = element('li');
      row.append(link(id));
      if (group.staleIds.includes(id))
        row.append(document.createTextNode(' · ' + t('Non courante', 'Non-current')));
      if (group.untrustedIds.includes(id))
        row.append(
          document.createTextNode(' · ' + t('Non attestée par Studio', 'Not attested by Studio')),
        );
      evidence.append(row);
    }
    item.append(evidence);
    groups.append(item);
  }
  root.append(groups);
  return root;
}
