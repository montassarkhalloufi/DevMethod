import { createHash, randomUUID } from 'node:crypto';

const reservedTopics = new Set([
  'delivery-scope',
  'visual-approval',
  'version active',
  'direction visuelle',
]);

function requireValue(condition, message, status = 400) {
  if (!condition) throw Object.assign(new Error(message), { status });
}

function shape(value, keys, label) {
  requireValue(value && typeof value === 'object' && !Array.isArray(value), `${label} invalide.`);
  requireValue(
    Object.keys(value).every((key) => keys.includes(key)),
    `Champ inconnu dans ${label}.`,
  );
}

function text(value, label, max = 4000) {
  requireValue(
    typeof value === 'string' && value.trim().length > 0 && value.length <= max,
    `${label} invalide.`,
  );
}

function identifier(value) {
  requireValue(
    typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value),
    'Identifiant de proposition invalide.',
  );
}

function date(value) {
  requireValue(
    typeof value === 'string' &&
      /^\d{4}-\d{2}-\d{2}T/.test(value) &&
      Number.isFinite(Date.parse(value)),
    'Date de proposition invalide.',
  );
}

function actor(value) {
  requireValue(['agent', 'user'].includes(value), 'Source de proposition invalide.');
}

function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object')
    return (
      '{' +
      Object.keys(value)
        .sort()
        .map((key) => JSON.stringify(key) + ':' + canonical(value[key]))
        .join(',') +
      '}'
    );
  return JSON.stringify(value);
}

function equal(left, right) {
  return canonical(left) === canonical(right);
}

export function proposalContextKey(state) {
  const context = {
    project: state.project,
    brief: state.brief,
    selectedDesignId: state.selectedDesignId,
    // Preserve legacy keys when no journey exists; otherwise bind the exact design context.
    ...(state.designJourney === undefined ? {} : { designJourney: state.designJourney }),
    architecture: state.decisions.filter(
      (d) => d.status === 'active' && d.topic.trim().toLowerCase() === 'architecture',
    ),
  };
  return createHash('sha256').update(canonical(context)).digest('hex');
}

function validateTarget(preview) {
  if (preview.route !== undefined) {
    text(preview.route, 'Route d’aperçu', 2000);
    let pathname;
    try {
      pathname = decodeURIComponent(preview.route.split(/[?#]/)[0]);
    } catch {
      requireValue(false, 'Route d’aperçu invalide.');
    }
    requireValue(
      pathname.startsWith('/') &&
        !pathname.startsWith('//') &&
        !pathname.includes('\\') &&
        ![...preview.route].some((char) => char.charCodeAt(0) < 32) &&
        !pathname.split('/').some((part) => part === '.' || part === '..'),
      'L’aperçu exige une route locale sans traversée.',
    );
  }
  if (preview.element !== undefined) {
    shape(preview.element, ['selector', 'text'], 'Cible de l’aperçu');
    text(preview.element.selector, 'Sélecteur', 2000);
    requireValue(
      typeof preview.element.text === 'string' && preview.element.text.length <= 4000,
      'Texte de cible invalide.',
    );
  }
}

function validatePreview(preview, state) {
  shape(preview, ['kind', 'revisionId', 'referenceId', 'status', 'route', 'element'], 'Aperçu');
  validateTarget(preview);
  if (preview.kind === 'revision') {
    requireValue(
      preview.referenceId === undefined && state.revisions.some((r) => r.id === preview.revisionId),
      'Révision d’aperçu inconnue.',
    );
    requireValue(
      ['implemented', 'simulation'].includes(preview.status),
      'Statut de l’aperçu invalide.',
    );
  } else {
    requireValue(
      preview.kind === 'image' &&
        preview.revisionId === undefined &&
        state.references.some((r) => r.id === preview.referenceId && r.mime.startsWith('image/')),
      'Image d’aperçu inconnue.',
    );
    requireValue(
      preview.status === 'simulation',
      'Une image est une simulation, pas une version implémentée.',
    );
  }
}

function validateOptions(proposal, state) {
  const options = proposal.options;
  requireValue(
    Array.isArray(options) && options.length > 0 && options.length <= 12,
    'Une proposition exige de 1 à 12 options.',
  );
  requireValue(
    new Set(options.map((option) => option?.id)).size === options.length,
    'Options dupliquées.',
  );
  for (const option of options) {
    shape(option, ['id', 'title', 'consequences', 'preview'], 'Option');
    identifier(option.id);
    text(option.title, 'Titre de l’option', 200);
    requireValue(
      Array.isArray(option.consequences) && option.consequences.length <= 12,
      'Conséquences invalides.',
    );
    for (const consequence of option.consequences) text(consequence, 'Conséquence', 2000);
    if (option.preview !== undefined) validatePreview(option.preview, state);
    requireValue(
      proposal.stage !== 'visual' || option.preview !== undefined,
      'Une proposition visuelle exige un aperçu identifié.',
    );
  }
  if (proposal.recommendation !== null) {
    shape(proposal.recommendation, ['optionId', 'reason'], 'Recommandation');
    requireValue(
      options.some((option) => option.id === proposal.recommendation.optionId),
      'Option recommandée absente.',
    );
    text(proposal.recommendation.reason, 'Raison de la recommandation');
  }
}

function validateResolution(proposal, state) {
  const resolution = proposal.resolution;
  if (resolution === null) return;
  shape(
    resolution,
    ['optionId', 'reason', 'source', 'createdAt', 'decisionId', 'preview'],
    'Résolution',
  );
  const option = proposal.options.find((entry) => entry.id === resolution.optionId);
  requireValue(
    option && proposal.selectedOptionId === option.id,
    'Résolution sans option sélectionnée.',
  );
  actor(resolution.source);
  date(resolution.createdAt);
  text(resolution.reason, 'Raison de résolution');
  identifier(resolution.decisionId);
  requireValue(
    equal(resolution.preview, option.preview ?? null),
    'La résolution doit conserver la cible exacte de l’aperçu.',
  );
  requireValue(
    state.decisions.some(
      (d) =>
        d.id === resolution.decisionId &&
        d.topic === proposal.topic &&
        d.choice === option.title &&
        d.reason === resolution.reason &&
        d.source === resolution.source,
    ),
    'Décision de résolution absente ou différente.',
  );
}

function validateProposal(proposal, state) {
  shape(
    proposal,
    [
      'id',
      'topic',
      'stage',
      'question',
      'options',
      'recommendation',
      'supersedes',
      'baseRevision',
      'contextKey',
      'source',
      'createdAt',
      'selectedOptionId',
      'resolution',
    ],
    'Proposition',
  );
  identifier(proposal.id);
  text(proposal.topic, 'Sujet', 200);
  text(proposal.question, 'Question');
  requireValue(
    !reservedTopics.has(proposal.topic.trim().toLowerCase()),
    'Ce sujet exige son action d’approbation dédiée.',
  );
  requireValue(
    ['implementation', 'visual'].includes(proposal.stage),
    'Étape de proposition invalide.',
  );
  actor(proposal.source);
  date(proposal.createdAt);
  requireValue(
    proposal.baseRevision === null || state.revisions.some((r) => r.id === proposal.baseRevision),
    'Version de départ de proposition absente.',
  );
  requireValue(
    typeof proposal.contextKey === 'string' && /^[a-f0-9]{64}$/.test(proposal.contextKey),
    'Empreinte de contexte invalide.',
  );
  validateOptions(proposal, state);
  requireValue(
    proposal.selectedOptionId === null ||
      proposal.options.some((option) => option.id === proposal.selectedOptionId),
    'Option sélectionnée absente.',
  );
  validateResolution(proposal, state);
}

export function validateProposals(state) {
  if (state.proposals === undefined) return;
  requireValue(
    Array.isArray(state.proposals) && state.proposals.length <= 100,
    'Maximum 100 propositions ; conservez leur historique.',
  );
  const seen = new Set(),
    replaced = new Set();
  for (const proposal of state.proposals) {
    validateProposal(proposal, state);
    requireValue(!seen.has(proposal.id), 'Proposition dupliquée.');
    if (proposal.supersedes !== null) {
      requireValue(
        seen.has(proposal.supersedes) && !replaced.has(proposal.supersedes),
        'Proposition remplacée absente ou déjà remplacée.',
      );
      replaced.add(proposal.supersedes);
    }
    seen.add(proposal.id);
  }
}

export function createProposal(state, input, source = 'agent') {
  shape(
    input,
    ['id', 'topic', 'stage', 'question', 'options', 'recommendation', 'supersedes'],
    'Nouvelle proposition',
  );
  actor(source);
  const proposal = {
    ...structuredClone(input),
    id: input.id ?? randomUUID(),
    recommendation: structuredClone(input.recommendation ?? null),
    supersedes: input.supersedes ?? null,
    baseRevision: state.activeRevision,
    contextKey: proposalContextKey(state),
    source,
    createdAt: new Date().toISOString(),
    selectedOptionId: null,
    resolution: null,
  };
  validateProposals({ ...state, proposals: [...(state.proposals ?? []), proposal] });
  return proposal;
}

function findProposal(state, id) {
  identifier(id);
  const proposal = state.proposals?.find((entry) => entry.id === id);
  requireValue(proposal, 'Proposition introuvable.', 404);
  return proposal;
}

function isStale(state, proposal) {
  return (
    proposal.baseRevision !== state.activeRevision ||
    proposal.contextKey !== proposalContextKey(state)
  );
}

export function pendingProposalOption(state, { proposalId, optionId }) {
  const proposal = findProposal(state, proposalId);
  requireValue(
    proposal.resolution === null &&
      !state.proposals.some((entry) => entry.supersedes === proposal.id),
    'Cette proposition est déjà résolue ou remplacée.',
    409,
  );
  requireValue(
    !isStale(state, proposal),
    'Le contexte ou la version a changé ; préparez une nouvelle proposition avant de répondre.',
    409,
  );
  const option = proposal.options.find((entry) => entry.id === optionId);
  requireValue(option, 'Option introuvable.', 404);
  return { proposal, option };
}

export function prepareProposalApproval(state, input, { actor: source, delegation }) {
  shape(input, ['proposalId', 'optionId', 'reason'], 'Approbation de proposition');
  actor(source);
  text(input.reason, 'Raison de résolution');
  const { proposal, option } = pendingProposalOption(state, input);
  requireValue(
    proposal.selectedOptionId === option.id,
    'Sélectionnez cette option avant de l’approuver.',
    409,
  );
  const responsibility = proposal.stage === 'visual' ? 'visual' : 'structure';
  requireValue(
    source === 'user' || delegation[responsibility] === 'agent',
    'Ce choix est réservé à l’utilisateur.',
    409,
  );
  const decision = {
    id: randomUUID(),
    topic: proposal.topic,
    choice: option.title,
    reason: input.reason,
    status: 'active',
    source,
  };
  const resolution = {
    optionId: option.id,
    reason: input.reason,
    source,
    createdAt: new Date().toISOString(),
    decisionId: decision.id,
    preview: structuredClone(option.preview ?? null),
  };
  return { proposal, resolution, decision };
}

export function validateProposalTransition(previous, next) {
  const old = previous.proposals ?? [],
    current = next.proposals ?? [];
  requireValue(
    current.length >= old.length,
    'Les propositions historiques ne peuvent pas être supprimées.',
  );
  old.forEach((proposal, index) => {
    const { selectedOptionId, resolution, ...content } = proposal;
    const {
      selectedOptionId: selectedNext,
      resolution: resolvedNext,
      ...contentNext
    } = current[index];
    requireValue(
      equal(content, contentNext),
      'Le contenu d’une proposition ne peut pas être réécrit.',
    );
    if (resolution !== null)
      requireValue(
        equal(resolution, resolvedNext) && selectedOptionId === selectedNext,
        'Une résolution enregistrée ne peut pas être réécrite.',
      );
  });
  for (const proposal of current.slice(old.length))
    requireValue(
      proposal.resolution === null && proposal.selectedOptionId === null,
      'Une nouvelle proposition doit commencer sans sélection ni approbation.',
    );
}

export function proposalComparison(state, proposalId) {
  const proposal = findProposal(state, proposalId);
  const result = structuredClone(proposal);
  result.status = state.proposals.some((entry) => entry.supersedes === proposalId)
    ? 'superseded'
    : proposal.resolution
      ? 'resolved'
      : 'pending';
  result.stale = isStale(state, proposal);
  result.options = proposal.options.map((option) => ({
    ...structuredClone(option),
    checks: structuredClone(
      option.preview?.kind === 'revision'
        ? state.checks.filter((check) => check.revisionId === option.preview.revisionId)
        : [],
    ),
  }));
  return result;
}
