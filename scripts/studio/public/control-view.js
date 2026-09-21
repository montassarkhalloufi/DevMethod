import { createAttentionView } from './attention-view.js';
import { createTranslator, getLocale, translate } from './i18n.js';
const actions = {
  continue: [
    'Poursuite autorisée dans le périmètre évalué',
    'Continuation authorized within the assessed scope',
  ],
  stop: ['Exécution arrêtée', 'Execution stopped'],
  arbitrate: ['Arbitrage nécessaire', 'Decision needed'],
  'strengthen-verification': ['Vérifications à renforcer', 'More verification needed'],
};
const reasons = {
  'candidate-discarded': [
    'Cette candidate a été écartée explicitement.',
    'This candidate was explicitly discarded.',
  ],
  'consequences-held': [
    'Les conséquences de ce candidat maintiennent l’arrêt.',
    'This candidate’s consequences keep execution stopped.',
  ],
  'agent-unavailable': [
    'L’agent automatique n’est pas disponible ou activé.',
    'The automatic agent is unavailable or disabled.',
  ],
  'runtime-observation-failed': [
    'Une erreur a été signalée dans l’aperçu de cette version.',
    'An error was reported in this version’s preview.',
  ],
  'persistent-data': [
    'Des données persistantes sont présentes ou signalées.',
    'Persistent data is present or reported.',
  ],
  'contract-changed': [
    'Un changement de contrat est signalé et doit être examiné.',
    'A reported contract change needs review.',
  ],
  'tool-action-pending': [
    'Une action outil attend une résolution dans le contrôle des outils.',
    'A tool action awaits resolution in tool controls.',
  ],
  'tool-action-failed': [
    'Une action outil a échoué ; son diagnostic doit être examiné.',
    'A tool action failed; its diagnostic needs review.',
  ],
  'usage-unknown': ['La consommation est inconnue.', 'Usage is unknown.'],
  interrupted: ['Une exécution a été interrompue.', 'An execution was interrupted.'],
  'context-changed': [
    'Le contexte a changé depuis la demande.',
    'The context has changed since the request.',
  ],
  'permission-revoked': ['Une permission a été retirée.', 'A permission was revoked.'],
  'external-outcome-unknown': [
    'Le résultat d’une action externe est inconnu.',
    'The outcome of an external action is unknown.',
  ],
  'budget-closed': ['Le budget est clos.', 'The budget is closed.'],
  'repeated-failure': [
    'Le même échec se répète sans progrès.',
    'The same failure is recurring without progress.',
  ],
  'revision-missing': [
    'Aucune version candidate ne permet cette évaluation.',
    'No candidate version is available for this assessment.',
  ],
  irreversible: [
    'Une opération irréversible est signalée.',
    'An irreversible operation is reported.',
  ],
  'external-scope': [
    'Une action dépasse le périmètre local.',
    'An action exceeds the local scope.',
  ],
  'not-reversible': [
    'La réversibilité n’est pas établie.',
    'Reversibility has not been established.',
  ],
  'admission-missing': [
    'Les contrôles d’admission ne permettent pas cette version.',
    'Admission checks do not allow this version.',
  ],
  'business-evidence-missing': [
    'Des critères attendent une preuve de fonctionnement.',
    'Some criteria still need behavioral evidence.',
  ],
  'consequences-to-check': [
    'Les conséquences du changement restent à vérifier.',
    'The change’s consequences still need verification.',
  ],
  'adoption-reserved': [
    'L’activation est réservée à votre décision.',
    'Activation is reserved for your decision.',
  ],
  'scoped-evidence-sufficient': [
    'Les preuves requises sont suffisantes pour le périmètre évalué.',
    'The required evidence is sufficient for the assessed scope.',
  ],
  'correction-history-unknown': [
    'L’historique des corrections est inconnu.',
    'Correction history is unknown.',
  ],
  'correction-limit': [
    'La limite de correction est atteinte.',
    'The correction limit has been reached.',
  ],
  'diagnosis-required': [
    'Un diagnostic est nécessaire avant toute correction.',
    'A diagnosis is required before any correction.',
  ],
  'correction-reserved': [
    'La correction exige une décision réservée.',
    'Correction requires a reserved decision.',
  ],
  'correction-consequences-unknown': [
    'Les conséquences de la correction sont inconnues.',
    'The correction’s consequences are unknown.',
  ],
  'attributable-technical-failure': [
    'Une correction bornée de l’échec technique est autorisée.',
    'A bounded correction of the technical failure is authorized.',
  ],
};
const severities = {
  critical: ['Critique', 'Critical'],
  high: ['Élevée', 'High'],
  moderate: ['Modérée', 'Moderate'],
  low: ['Faible', 'Low'],
  unknown: ['Inconnue', 'Unknown'],
};
const unknowns = {
  localOnly: ['Périmètre local', 'Local scope'],
  reversible: ['Réversibilité', 'Reversibility'],
  persistentData: ['Données persistantes', 'Persistent data'],
  contractChanged: ['Contrats consommés', 'Consumed contracts'],
};
const statuses = {
  passed: ['Réussi', 'Passed'],
  failed: ['Échoué', 'Failed'],
  unknown: ['Inconnu', 'Unknown'],
  running: ['En cours', 'In progress'],
  queued: ['En attente', 'Pending'],
  ready: ['Candidat disponible', 'Candidate available'],
  cancelled: ['Interrompu', 'Interrupted'],
  pending: ['En attente de décision', 'Awaiting decision'],
  executing: ['Appel en cours', 'Call in progress'],
  completed: ['Appel terminé', 'Call completed'],
  denied: ['Refusé', 'Denied'],
  expired: ['Expiré', 'Expired'],
};
const kinds = {
  'agent-observation': ['Observation de l’agent', 'Agent observation'],
  'mcp-transport': [
    'Trace de transport MCP — aucune preuve métier',
    'MCP transport record — no business evidence',
  ],
  technical: ['Contrôle technique', 'Technical check'],
  business: ['Parcours de fonctionnement', 'Behavioral scenario'],
  runtime: ['Observation runtime', 'Runtime observation'],
};
const options = {
  'inspect-tool-request': [
    'Examiner la demande dans le contrôle des outils existant',
    'Review the request in the existing tool controls',
  ],
  inspect: ['Examiner le diagnostic et les preuves', 'Review the diagnosis and evidence'],
  'keep-stopped': ['Conserver l’arrêt', 'Keep stopped'],
  verify: ['Compléter les vérifications', 'Complete verification'],
  decide: ['Réserver une décision explicite', 'Reserve an explicit decision'],
};
const freshness = {
  current: ['À jour pour la version évaluée', 'Current for the assessed version'],
  reevaluate: ['À réévaluer avant utilisation', 'Reassess before use'],
  obsolete: ['Obsolète pour la version évaluée', 'Obsolete for the assessed version'],
};
const provenance = {
  'preview-signal': [
    'signal de l’aperçu — non attesté, à diagnostiquer',
    'preview signal — unattested, needs diagnosis',
  ],
  'studio-executor': ['exécuteur Studio', 'Studio executor'],
  'studio-adapter': ['adaptateur Studio', 'Studio adapter'],
  'host-attested': ['attestation de l’agent hôte', 'host agent attestation'],
  'legacy-recorded': [
    'enregistrement hérité, origine à examiner',
    'legacy record, origin needs review',
  ],
  'studio-mcp-broker': [
    'courtier MCP Studio — trace d’appel outil',
    'Studio MCP broker — tool call record',
  ],
  unattested: ['source non attestée par Studio', 'source not attested by Studio'],
};
const label = (map, value, locale = getLocale()) => {
  const entry = map[value];
  return Array.isArray(entry)
    ? translate(entry[0], entry[1], {}, locale)
    : (entry ??
        translate(
          'Non reconnu ({value0})',
          'Unrecognized ({value0})',
          { value0: String(value) },
          locale,
        ));
};
const conclusions = {
  sufficient: [
    'Suffisante pour ce critère dans ce périmètre',
    'Sufficient for this criterion within this scope',
  ],
  partial: ['Pertinente mais partielle', 'Relevant but partial'],
  irrelevant: ['Non pertinente', 'Not relevant'],
};
export const controlActionLabel = (control, locale = getLocale()) =>
  label(actions, control.autonomy.action, locale);
const reasonLabel = (reason, locale = getLocale()) => label(reasons, reason, locale);

function describeConsequenceObservations(observations, locale = getLocale()) {
  const t = (fr, en, values) => translate(fr, en, values, locale);
  if (!observations) return [];
  const {
    data,
    changes = [],
    signals = [],
    evidence = [],
    unknowns: missing = [],
    riskFactors = [],
    limits = [],
  } = observations;
  const text = (value) => String(value ?? t('inconnu', 'unknown')).slice(0, 500);
  const rows = (title, entries, describe) => [
    ...entries.slice(0, 5).map((entry) => `${title} : ${text(describe(entry))}`),
    ...(entries.length > 5
      ? [
          t(
            '{value0} : {value1} autre(s) conservé(s), non affiché(s).',
            '{value0}: {value1} other record(s) preserved, not displayed.',
            { value0: title, value1: (entries.length - 5).toLocaleString(locale) },
          ),
        ]
      : []),
  ];
  return [
    t(
      'Observations au moment de l’examen — leur validité actuelle est recalculée',
      'Observations at review time — their current validity is recalculated',
    ),
    t(
      'Données à l’examen : {value0} · version {value1} · {value2} · {value3} octets. Aucune valeur privée affichée.',
      'Data at review time: {value0} · version {value1} · {value2} · {value3} bytes. No private values displayed.',
      {
        value0: label(
          {
            available: t('disponibles', 'available'),
            missing: t('absentes', 'missing'),
            unavailable: t('indisponibles', 'unavailable'),
          },
          data?.status,
          locale,
        ),
        value1: data?.version ?? t('inconnue', 'unknown'),
        value2:
          data?.nonEmpty === true
            ? t('non vides', 'not empty')
            : data?.nonEmpty === false
              ? t('vides', 'empty')
              : t('contenu inconnu', 'unknown contents'),
        value3: data?.bytes?.toLocaleString(locale) ?? t('inconnu', 'unknown'),
      },
    ),
    t(
      'Périmètre observé à l’examen : {value0} changement(s), {value1} indice(s), {value2} preuve(s), {value3} inconnue(s), {value4} facteur(s) de risque.',
      'Scope observed at review time: {value0} change(s), {value1} indication(s), {value2} evidence item(s), {value3} unknown(s), {value4} risk factor(s).',
      {
        value0: changes.length.toLocaleString(locale),
        value1: signals.length.toLocaleString(locale),
        value2: evidence.length.toLocaleString(locale),
        value3: missing.length.toLocaleString(locale),
        value4: riskFactors.length.toLocaleString(locale),
      },
    ),
    ...rows(
      t('Changement à l’examen', 'Change at review time'),
      changes,
      (entry) =>
        `${label({ added: t('ajouté', 'added'), modified: t('modifié', 'modified'), removed: t('supprimé', 'removed') }, entry.kind, locale)} · ${entry.path}`,
    ),
    ...rows(
      t('Indice à l’examen', 'Indication at review time'),
      signals,
      (entry) => `${reasonLabel(entry.kind, locale)} · ${entry.path}:${entry.line ?? '?'}`,
    ),
    ...rows(t('Preuve à l’examen', 'Evidence at review time'), evidence, (entry) =>
      t(
        '{value0} · {value1} · {value2} · {value3} · {value4} · empreinte {value5}',
        '{value0} · {value1} · {value2} · {value3} · {value4} · fingerprint {value5}',
        {
          value0: entry.id,
          value1: label(statuses, entry.status, locale),
          value2: label(freshness, entry.freshness, locale),
          value3: entry.trusted
            ? t('provenance reconnue dans cet examen', 'provenance recognized in this review')
            : t('non attestée', 'unattested'),
          value4: label(provenance, entry.provenance, locale),
          value5: entry.fingerprint ?? t('absente', 'missing'),
        },
      ),
    ),
    ...rows(t('Inconnue à l’examen', 'Unknown at review time'), missing, (entry) =>
      label(unknowns, entry, locale),
    ),
    ...rows(
      t('Facteur à l’examen', 'Factor at review time'),
      riskFactors,
      (entry) => `${label(severities, entry.severity, locale)} · ${entry.reason}`,
    ),
    ...rows(t('Limite à l’examen', 'Limitation at review time'), limits, (entry) => entry),
  ];
}

export function describeControlledApplication(application, locale = getLocale()) {
  const t = (fr, en, values) => translate(fr, en, values, locale);
  return [
    t(
      'Moteur Studio — application selon les contrôles, distincte d’une appréciation de la personne.',
      'Studio engine — application under execution controls, separate from a person’s assessment.',
    ),
    t('Déclenchement : ', 'Trigger: ') +
      (application.trigger === 'runner'
        ? t('suite du travail de l’agent', 'continuation of the agent’s work')
        : t('action locale', 'local action')),
    ...Object.entries({
      protocol: t('Protocole', 'Protocol'),
      jobId: t('Travail source', 'Source job'),
      revisionId: t('Version appliquée', 'Applied version'),
      baseRevisionId: t('Version de base', 'Base version'),
      contextFingerprint: t('Empreinte du contexte', 'Context fingerprint'),
      controlKey: t('Identité du contrôle', 'Control identity'),
      fingerprint: t('Empreinte des sources', 'Source fingerprint'),
      criteriaFingerprint: t('Empreinte des critères', 'Criteria fingerprint'),
      planKey: 'Plan',
      consequenceDecisionId: t(
        'Appréciation des conséquences liée',
        'Linked consequence assessment',
      ),
      createdAt: 'Date',
    })
      .filter(([key]) => application[key] != null)
      .map(
        ([key, title]) =>
          title +
          ' : ' +
          (key === 'createdAt'
            ? new Date(application[key]).toLocaleString(locale)
            : String(application[key])),
      ),
    ...describeConsequenceObservations(application.observations, locale),
  ];
}

export function describeInterventionReview(review, locale = getLocale()) {
  const t = (fr, en, values) => translate(fr, en, values, locale);
  const assessment = {
    affected: t('concerné', 'affected'),
    'not-affected': t(
      'non concerné dans le périmètre apprécié',
      'not affected within the assessed scope',
    ),
    unknown: t('inconnu', 'unknown'),
  };
  return [
    t('Résolution : {value0}', 'Resolution: {value0}', {
      value0:
        review.resolution === 'accept-local'
          ? t('conséquences locales acceptées', 'local consequences accepted')
          : t('arrêt maintenu', 'kept stopped'),
    }),
    t('Données persistantes : {value0}', 'Persistent data: {value0}', {
      value0: assessment[review.assessment?.persistentData] ?? t('inconnu', 'unknown'),
    }),
    t('Contrats consommés : {value0}', 'Consumed contracts: {value0}', {
      value0: assessment[review.assessment?.contractChanged] ?? t('inconnu', 'unknown'),
    }),
    t('Périmètre : {value0}', 'Scope: {value0}', { value0: review.scope }),
    ...(review.reason
      ? [t('Justification : {value0}', 'Reason: {value0}', { value0: review.reason })]
      : []),
    ...(review.freshness
      ? [
          t('Fraîcheur : {value0}', 'Freshness: {value0}', {
            value0: label(freshness, review.freshness, locale),
          }),
        ]
      : []),
    ...(review.revisionId
      ? [
          t('Version : {value0} · Base : {value1}', 'Version: {value0} · Base: {value1}', {
            value0: review.revisionId,
            value1: review.baseRevisionId ?? t('absente', 'missing'),
          }),
        ]
      : []),
    ...(review.decisionId
      ? [t('Décision : {value0}', 'Decision: {value0}', { value0: review.decisionId })]
      : []),
    ...(typeof review.contributes === 'boolean'
      ? [
          t(
            'Contribution actuelle à l’appréciation : {value0}',
            'Current contribution to the assessment: {value0}',
            { value0: review.contributes ? t('oui', 'yes') : t('non', 'no') },
          ),
        ]
      : []),
    ...(typeof review.holds === 'boolean'
      ? [
          t('Arrêt actuellement maintenu : {value0}', 'Currently kept stopped: {value0}', {
            value0: review.holds ? t('oui', 'yes') : t('non', 'no'),
          }),
        ]
      : []),
    t(
      'Appréciation locale distincte des faits observés ; les risques ne sont pas effacés.',
      'Local assessment separate from observed facts; risks are not erased.',
    ),
    ...describeConsequenceObservations(review.observations, locale),
  ];
}

export function describeCoverageReview(coverage, locale = getLocale()) {
  const t = (fr, en, values) => translate(fr, en, values, locale);
  return [
    t('Critère examiné : {value0}', 'Reviewed criterion: {value0}', {
      value0: coverage.criterion.text,
    }),
    t('Conclusion : {value0}', 'Conclusion: {value0}', {
      value0: label(conclusions, coverage.conclusion, locale),
    }),
    t('Périmètre : {value0}', 'Scope: {value0}', { value0: coverage.scope }),
    t('Scénarios : {value0}', 'Scenarios: {value0}', { value0: coverage.scenarioIds.join(', ') }),
    t('Version : {value0} · Reçu : {value1}', 'Version: {value0} · Receipt: {value1}', {
      value0: coverage.revisionId,
      value1: coverage.receiptId,
    }),
    t(
      'Protocole : {value0} · Pilote : {value1} · Navigateur : {value2}',
      'Protocol: {value0} · Driver: {value1} · Browser: {value2}',
      {
        value0: coverage.protocol,
        value1: coverage.driverVersion,
        value2: coverage.browserVersion,
      },
    ),
    t('Empreinte du reçu : {value0}', 'Receipt fingerprint: {value0}', {
      value0: coverage.receiptFingerprint,
    }),
    t(
      'Appréciation locale conservée. Sa validité actuelle est recalculée dans Vérifications ; elle ne relance pas l’agent et n’adopte pas la version.',
      'Local assessment preserved. Its current validity is recalculated in Checks; it does not restart the agent or adopt the version.',
    ),
  ];
}

export function describeActivationReview(review, locale = getLocale()) {
  const t = (fr, en, values) => translate(fr, en, values, locale);
  return [
    t('Version examinée : {value0}', 'Reviewed version: {value0}', { value0: review.revisionId }),
    t('Recommandation lors du choix : {value0}', 'Recommendation at selection time: {value0}', {
      value0: label(actions, review.action, locale),
    }),
    t('Risque lors du choix : {value0}', 'Risk at selection time: {value0}', {
      value0: label(severities, review.riskSeverity, locale),
    }),
    ...review.reasons.map((reason) => reasonLabel(reason, locale)),
    ...review.riskFactors.map(
      (factor) =>
        `${label(severities, factor.severity, locale)} · ${reasonLabel(factor.id, locale)}`,
    ),
    t('Inconnues conservées : {value0}', 'Preserved unknowns: {value0}', {
      value0:
        review.unknowns.map((key) => label(unknowns, key, locale)).join(', ') ||
        t('aucune déclarée', 'none declared'),
    }),
    ...review.evidence.map((entry) =>
      t(
        'Preuve {value0} · {value1} · {value2} · {value3}{value4}{value5}',
        'Evidence {value0} · {value1} · {value2} · {value3}{value4}{value5}',
        {
          value0: entry.id,
          value1: label(statuses, entry.status, locale),
          value2: label(freshness, entry.freshness, locale),
          value3: label(provenance, entry.provenance, locale),
          value4: entry.fingerprint
            ? t(' · empreinte ', ' · fingerprint ') + entry.fingerprint
            : '',
          value5: entry.coverageDecisionIds?.length
            ? t(' · appréciations examinées : ', ' · reviewed assessments: ') +
              entry.coverageDecisionIds.join(', ')
            : '',
        },
      ),
    ),
    t('Empreinte de la version : {value0}', 'Version fingerprint: {value0}', {
      value0: review.fingerprint,
    }),
    t('Empreinte de l’examen : {value0}', 'Review fingerprint: {value0}', {
      value0: review.reviewKey,
    }),
    t(
      'Ce choix local conserve les limites de l’agent et ne constitue pas une réussite des critères.',
      'This local choice preserves the agent’s limits and does not mean the criteria have been met.',
    ),
  ];
}

/** Read-only presentation: no decision, approval or provider operation is emitted here. */
export function createControlView(document, control, displayedRevisionId, idPrefix = '') {
  const t = createTranslator(document);
  const locale = getLocale(document);
  if (!control) return [];
  const targetId = (id) => idPrefix + 'control-node-' + id;
  function element(tag, text = '', className = '') {
    const node = document.createElement(tag);
    node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function list(items) {
    const node = element('ul', '', 'plain-list');
    node.append(...items.map((text) => element('li', text)));
    return node;
  }
  function link(id, text = id) {
    const node = element('a', text);
    node.href = '#' + encodeURIComponent(targetId(id));
    return node;
  }
  function details(title, content) {
    const node = element('details', '', 'technical');
    node.append(element('summary', title), ...content);
    return node;
  }
  function linkedItems(ids) {
    const row = element('p');
    for (const id of ids) row.append(link(id), document.createTextNode(' · '));
    return row;
  }
  function evidenceDetails(node) {
    const metadata = [
      `${label(kinds, node.kind, locale)} · ${label(statuses, node.status, locale)} · ${label(freshness, node.freshness, locale)}`,
      t(
        'Provenance : {value0} · Identité source : {value1}',
        'Provenance: {value0} · Source identity: {value1}',
        {
          value0: label(
            provenance,
            node.provenance ?? (node.trusted ? 'legacy-recorded' : 'unattested'),
            locale,
          ),
          value1: node.sourceId,
        },
      ),
      t(
        'Protocole : {value0} · Environnement : {value1}',
        'Protocol: {value0} · Environment: {value1}',
        {
          value0: node.protocol ?? t('non renseigné', 'not specified'),
          value1: node.environment
            ? JSON.stringify(node.environment)
            : t('non renseigné', 'not specified'),
        },
      ),
      t('Date : {value0}', 'Date: {value0}', {
        value0: node.createdAt
          ? new Date(node.createdAt).toLocaleString(locale)
          : t('non renseignée', 'not specified'),
      }),
      t('Empreinte : {value0}', 'Fingerprint: {value0}', {
        value0: node.fingerprint ?? t('non renseignée', 'not specified'),
      }),
      ...(typeof node.observed === 'string' && node.observed
        ? [t('Diagnostic observé : ', 'Observed diagnostic: ') + node.observed.slice(0, 4000)]
        : []),
      t('Contrôle lié : {value0}', 'Linked check: {value0}', {
        value0: node.linkedCheckId ?? t('aucun lien déclaré', 'no link declared'),
      }),
      t(
        'Critères déclarés par le rapport : {value0}. Cette déclaration ne démontre pas leur couverture.',
        'Criteria declared by the report: {value0}. This declaration does not establish their coverage.',
        { value0: (node.reportedCriterionIds ?? []).join(', ') || t('aucun', 'none') },
      ),
      ...(node.limits ?? []),
    ];
    return [
      list(metadata),
      linkedItems([
        ...(node.revisionId ? ['revision:' + node.revisionId] : []),
        ...(node.supersededBy ? ['evidence:' + node.supersededBy] : []),
        ...node.criterionIds.map((id) => 'criterion:' + id),
        ...(node.coverageReviews ?? []).map((review) => 'decision:' + review.decisionId),
      ]),
    ];
  }
  function toolScope(intervention) {
    const scope = intervention.scope;
    if (!scope) return [];
    const fields = [
      [t('Demande outil', 'Tool request'), scope.requestId],
      ['Job', scope.jobId],
      [t('Version de base', 'Base version'), scope.baseRevision],
      [t('Connexion', 'Connection'), scope.connectionId],
      [t('Outil', 'Tool'), scope.toolName],
      [
        t('Empreinte du schéma des arguments', 'Argument schema fingerprint'),
        scope.inputSchemaFingerprint,
      ],
      [
        'Permission',
        label(
          {
            allow: t('Autorisée', 'Allowed'),
            ask: t('Accord requis', 'Approval required'),
            deny: t('Refusée', 'Denied'),
          },
          scope.permission,
          locale,
        ),
      ],
      [t('État de l’appel', 'Call status'), label(statuses, scope.status, locale)],
      [
        'Expiration',
        scope.expiresAt
          ? new Date(scope.expiresAt).toLocaleString(locale)
          : t('non renseignée', 'not specified'),
      ],
    ];
    const result = list(
      fields.map(([title, value]) => `${title} : ${value ?? t('non renseigné', 'not specified')}`),
    );
    result.style.overflowWrap = 'anywhere';
    return [
      element('p', t('Identité de l’intervention : ', 'Intervention identity: ') + intervention.id),
      result,
      element(
        'p',
        t(
          'Une trace de transport ne prouve ni un critère métier ni les effets de l’action. Les accords et refus restent gérés par le contrôle des outils existant.',
          'A transport record proves neither a business criterion nor the action’s effects. Approvals and denials remain managed by the existing tool controls.',
        ),
        'muted',
      ),
    ];
  }
  function graphNode(node) {
    const item = element('li');
    item.id = targetId(node.id);
    item.style.overflowWrap = 'anywhere';
    item.style.scrollMarginTop = idPrefix
      ? '12px'
      : 'calc(var(--shell-header-height, 56px) + 12px)';
    item.append(
      element(
        'strong',
        node.text ||
          ({
            assessment: t('Appréciation locale du critère', 'Local criterion assessment'),
            'consequence-assessment': t(
              'Appréciation locale des conséquences',
              'Local consequence assessment',
            ),
          }[node.type] ??
            node.id),
      ),
    );
    if (node.type === 'consequence-assessment')
      item.append(
        list(describeInterventionReview(node, locale)),
        element(
          'p',
          t(
            'Décision locale de source utilisateur, distincte des observations et des indices.',
            'Local decision from the user route, separate from observations and indications.',
          ),
        ),
      );
    if (node.type === 'evidence') item.append(...evidenceDetails(node));
    if (node.type === 'revision')
      item.append(
        element('p', t('Empreinte de version : ', 'Version fingerprint: ') + node.fingerprint),
      );
    if (node.type === 'job')
      item.append(element('p', t('Job : ', 'Job: ') + label(statuses, node.status, locale)));
    if (node.type === 'assessment')
      item.append(
        list([
          node.criterionText,
          `${label(conclusions, node.conclusion, locale)} · ${label(freshness, node.freshness, locale)}`,
          t('Périmètre : {value0}', 'Scope: {value0}', { value0: node.scope }),
          t('Justification : {value0}', 'Reason: {value0}', { value0: node.reason }),
          t('Scénarios examinés : {value0}', 'Reviewed scenarios: {value0}', {
            value0: node.scenarioIds.join(', '),
          }),
          node.contributes
            ? t(
                'Contribue à la couverture selon cette appréciation et les assertions exécutées.',
                'Contributes to coverage based on this assessment and the executed assertions.',
              )
            : t(
                'Ne contribue pas actuellement à la couverture.',
                'Does not currently contribute to coverage.',
              ),
          t(
            'Décision locale distincte du résultat exécuté. Cette provenance ne certifie pas une intervention humaine indépendante.',
            'Local decision separate from the executed result. This provenance does not certify independent human intervention.',
          ),
        ]),
      );
    return item;
  }
  const { graph, risk, autonomy } = control;
  const root = element('section', '', 'context-card');
  root.setAttribute('aria-label', t('Contrôle de l’exécution', 'Execution control'));
  root.append(
    element('h3', t('Contrôle de l’exécution', 'Execution control')),
    element('p', controlActionLabel(control, locale)),
    element(
      'p',
      t(
        'Mode demandé : {value0}. Les restrictions effectives ne changent pas cette délégation.',
        'Requested mode: {value0}. Effective restrictions do not change this delegation.',
        {
          value0: label(
            {
              guided: t('Guidé', 'Guided'),
              devauto: 'DevAuto',
              delegated: t('Autonome', 'Autonomous'),
              autonomous: t('Autonome', 'Autonomous'),
            },
            autonomy.requestedMode,
            locale,
          ),
        },
      ),
    ),
  );
  root.append(
    element(
      'p',
      graph.revisionId
        ? t('Version évaluée : {value0}', 'Assessed version: {value0}', {
            value0: graph.revisionId,
          })
        : t(
            'Version évaluée : aucune version candidate.',
            'Assessed version: no candidate version.',
          ),
    ),
  );
  if (graph.revisionId !== displayedRevisionId)
    root.append(
      element(
        'p',
        t(
          'Cette évaluation ne concerne pas la version affichée ({value0}).',
          'This assessment does not concern the displayed version ({value0}).',
          { value0: displayedRevisionId ?? 'aucune' },
        ),
        'badge unverified',
      ),
    );
  if (autonomy.operation)
    root.append(
      element(
        'p',
        t(
          'Opération permise : {value0}. Une permission ne prouve pas que l’opération a été réalisée.',
          'Allowed operation: {value0}. Permission does not prove that the operation was performed.',
          {
            value0: label(
              {
                activate: t('activation de la version', 'version activation'),
                correct: t('correction bornée', 'bounded correction'),
              },
              autonomy.operation,
              locale,
            ),
          },
        ),
      ),
    );
  root.append(list(autonomy.reasons.map((reason) => reasonLabel(reason, locale))));
  root.append(
    createAttentionView(document, control, {
      element,
      list,
      link,
      kindLabel: (kind) => label(kinds, kind, locale),
      factorLabel: (factor) =>
        Object.hasOwn(reasons, factor.id)
          ? reasonLabel(factor.id, locale)
          : factor.reason || factor.id,
      reasonLabel: (reason) => reasonLabel(reason, locale),
    }),
  );
  function riskReviewDetails() {
    return [
      ...(risk.review ? [list(describeInterventionReview(risk.review, locale))] : []),
      ...(risk.reviewedUnknowns?.length
        ? [
            element(
              'p',
              t('Inconnues appréciées localement : ', 'Locally assessed unknowns: ') +
                risk.reviewedUnknowns.map((value) => label(unknowns, value, locale)).join(', '),
            ),
          ]
        : []),
      ...(risk.acceptedFactors?.length
        ? [
            element(
              'p',
              t(
                'Facteurs acceptés dans leur périmètre, toujours présents : ',
                'Factors accepted within their scope, still present: ',
              ) + risk.acceptedFactors.map((reason) => reasonLabel(reason, locale)).join(', '),
            ),
          ]
        : []),
    ];
  }
  root.append(
    details(t('Risque et incertitudes', 'Risk and uncertainty'), [
      element(
        'p',
        t(
          'Sévérité : {value0} · Probabilité : {value1}',
          'Severity: {value0} · Probability: {value1}',
          {
            value0: label(severities, risk.severity, locale),
            value1:
              risk.probability === 'unknown'
                ? t('inconnue, non mesurée', 'unknown, not measured')
                : risk.probability,
          },
        ),
      ),
      element(
        'p',
        risk.evidenceQuality === 'scoped'
          ? t(
              'Des preuves existent pour une portée limitée.',
              'Evidence exists for a limited scope.',
            )
          : t('Preuves de risque manquantes.', 'Risk evidence missing.'),
      ),
      list(
        risk.factors.map(
          (factor) => `${label(severities, factor.severity, locale)} — ${factor.reason}`,
        ),
      ),
      element(
        'p',
        risk.unknowns.length
          ? t('Conséquences inconnues : ', 'Unknown consequences: ') +
              risk.unknowns.map((value) => label(unknowns, value, locale)).join(', ')
          : t(
              'Aucune inconnue signalée par les entrées de cette politique ; cela ne garantit pas l’absence de risque.',
              'No unknowns reported by this policy’s inputs; this does not guarantee the absence of risk.',
            ),
      ),
      ...riskReviewDetails(),
      list(risk.limits),
    ]),
  );
  function reviewButton(text, revisionId) {
    const button = element('button', text);
    button.type = 'button';
    button.dataset.action = 'intervention-review';
    button.dataset.id = revisionId;
    return button;
  }
  if (!idPrefix && graph.revisionId)
    root.append(
      reviewButton(t('Examiner les conséquences', 'Review consequences'), graph.revisionId),
    );
  for (const intervention of control.interventions)
    root.append(
      details(
        t('Intervention groupée · ', 'Grouped intervention · ') +
          label(severities, intervention.impact, locale),
        [
          element(
            'p',
            t('Version : ', 'Version: ') +
              (intervention.revisionId ?? t('aucune candidate', 'no candidate')),
          ),
          ...toolScope(intervention),
          ...(!idPrefix &&
          intervention.revisionId &&
          !intervention.requestId &&
          !intervention.scope?.requestId
            ? [
                reviewButton(
                  t('Résoudre cette intervention', 'Resolve this intervention'),
                  intervention.revisionId,
                ),
              ]
            : []),
          list(intervention.reasons.map((reason) => reasonLabel(reason, locale))),
          element(
            'p',
            t('Incertitudes : ', 'Uncertainties: ') +
              (intervention.uncertainties
                .map((value) => label(unknowns, value, locale))
                .join(', ') || t('aucune signalée', 'none reported')),
          ),
          linkedItems(intervention.evidenceIds),
          list(intervention.options.map((value) => label(options, value, locale))),
          element(
            'p',
            t('Recommandation : ', 'Recommendation: ') +
              label(actions, intervention.recommendation, locale),
          ),
          element(
            'p',
            t(
              'Ces options décrivent les suites possibles ; cette vue ne donne aucun accord et ne relance rien.',
              'These options describe possible next steps; this view grants no approval and restarts nothing.',
            ),
            'muted',
          ),
        ],
      ),
    );
  const nodes = element('ul', '', 'plain-list');
  nodes.append(...graph.nodes.map(graphNode));
  const edges = element('ul', '', 'plain-list');
  for (const edge of graph.edges) {
    const row = element('li');
    row.append(
      link(edge.from),
      document.createTextNode(
        ' → ' +
          label(
            {
              produced: t('a produit', 'produced'),
              'checked-by': t('contrôlée par', 'checked by'),
              covers: t('couvre', 'covers'),
              'assessed-by': t('examinée dans', 'reviewed in'),
              assesses: t('apprécie la pertinence pour', 'assesses relevance for'),
              'superseded-by': t('remplacée par', 'superseded by'),
            },
            edge.relation,
            locale,
          ) +
          ' → ',
      ),
      link(edge.to),
    );
    edges.append(row);
  }
  root.append(
    details(t('Preuves, critères et liens de version', 'Evidence, criteria, and version links'), [
      element(
        'p',
        t(
          'Un succès technique ne démontre pas un succès du parcours utilisateur.',
          'Technical success does not establish success of the user journey.',
        ),
        'muted',
      ),
      nodes,
      edges,
    ]),
  );
  return [root];
}
