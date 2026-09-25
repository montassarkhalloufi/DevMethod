import { createHash, randomUUID } from 'node:crypto';
import {
  createProposal,
  pendingProposalOption,
  prepareProposalApproval,
  validateProposals,
} from './proposals.mjs';
import { designJourneyView, validateDesignJourney } from './design-journey.mjs';
import { prepareConnectorGuides, validateConnectorGuideSnapshots } from './connector-guides.mjs';
import { validRelativePath } from './import-paths.mjs';
import { validateImportRecord } from './import-contract.mjs';
import { validateControlPlane } from '../../dist/control-plane/validation.js';
export {
  setDesignMaster,
  approveDesignMaster,
  addDesignScreen,
  linkDesignPrototype,
} from './design-journey.mjs';

const terminal = new Set(['ready', 'failed', 'cancelled', 'interrupted']);
const jobStatuses = ['queued', 'running', ...terminal];
const referenceMimes = ['image/png', 'image/jpeg', 'image/webp', 'text/plain', 'text/markdown'];
const now = () => new Date().toISOString();

function reject(message, status = 400) {
  throw Object.assign(new Error(message), { status });
}

function requireValue(condition, message) {
  if (!condition) reject(message);
}

function object(value, label) {
  requireValue(
    value !== null && typeof value === 'object' && !Array.isArray(value),
    `${label} doit être un objet.`,
  );
  requireValue(
    Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null,
    `${label} invalide.`,
  );
}

function shape(value, keys, label) {
  object(value, label);
  requireValue(
    Object.keys(value).every((key) => keys.includes(key)),
    `Champ inconnu dans ${label}.`,
  );
}

function text(value, label, max = 10000, empty = true) {
  requireValue(
    typeof value === 'string' && value.length <= max && (empty || value.trim().length > 0),
    `${label} invalide (maximum ${max} caractères).`,
  );
}

function identifier(value, label = 'Identifiant') {
  requireValue(
    typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value),
    `${label} invalide.`,
  );
}

function date(value) {
  requireValue(
    typeof value === 'string' &&
      /^\d{4}-\d{2}-\d{2}T/.test(value) &&
      Number.isFinite(Date.parse(value)),
    'Date invalide.',
  );
}

function oneOf(value, choices, label) {
  requireValue(choices.includes(value), `${label} invalide.`);
}

function collection(value, label, max = 1000) {
  requireValue(
    Array.isArray(value) && value.length <= max,
    `${label} doit être un tableau de ${max} éléments au plus.`,
  );
}

function strings(value, label) {
  collection(value, label, 100);
  for (const entry of value) text(entry, label, 2000, false);
}

function unique(records, label, field = 'id') {
  collection(records, label);
  requireValue(
    new Set(records.map((entry) => entry[field])).size === records.length,
    `Doublon dans ${label}.`,
  );
}

function relativeFile(value) {
  text(value, 'Chemin', 512, false);
  requireValue(validRelativePath(value), 'Chemin relatif invalide.');
}

function find(records, id, label) {
  identifier(id);
  const result = records.find((record) => record.id === id);
  if (!result) reject(`${label} introuvable.`, 404);
  return result;
}

function event(state, type, message) {
  state.events.push({ id: randomUUID(), type, text: message, createdAt: now() });
}

function validateProject(project) {
  shape(project, ['name', 'idea', 'mode', 'constraints', 'delegation'], 'Projet');
  text(project.name, 'Nom du projet', 200);
  text(project.idea, 'Idée', 20000);
  oneOf(project.mode, ['guided', 'devauto', 'delegated'], 'Mode');
  strings(project.constraints, 'Contraintes');
  if (project.delegation !== undefined) {
    shape(project.delegation, ['structure', 'visual', 'adoption'], 'Délégation');
    for (const key of ['structure', 'visual', 'adoption'])
      oneOf(project.delegation[key], ['agent', 'user'], `Délégation ${key}`);
  }
}

function validateBrief(brief) {
  shape(brief, ['outcome', 'scope', 'excluded', 'criteria'], 'Cadrage');
  text(brief.outcome, 'Résultat', 10000);
  strings(brief.scope, 'Périmètre');
  strings(brief.excluded, 'Exclusions');
  unique(brief.criteria, 'Critères');
  for (const criterion of brief.criteria) {
    shape(criterion, ['id', 'text'], 'Critère');
    identifier(criterion.id);
    text(criterion.text, 'Critère', 2000, false);
  }
}

function validateDecision(decision) {
  shape(decision, ['id', 'topic', 'choice', 'reason', 'status', 'source'], 'Décision');
  identifier(decision.id);
  text(decision.topic, 'Sujet', 200, false);
  text(decision.choice, 'Choix', 4000, false);
  text(decision.reason, 'Raison', 4000);
  oneOf(decision.status, ['active', 'superseded', 'hypothesis'], 'Statut de décision');
  oneOf(decision.source, ['user', 'agent'], 'Source');
}

function validateReference(reference) {
  shape(reference, ['id', 'name', 'file', 'mime'], 'Référence');
  identifier(reference.id);
  text(reference.name, 'Nom de référence', 256, false);
  relativeFile(reference.file);
  requireValue(reference.file.startsWith('references/'), 'Référence hors du dossier references.');
  oneOf(reference.mime, referenceMimes, 'Type de référence');
}

function validateDesign(design, references) {
  shape(design, ['id', 'title', 'description', 'file'], 'Design');
  identifier(design.id);
  text(design.title, 'Titre du design', 200, false);
  text(design.description, 'Description', 4000);
  identifier(design.file, 'Référence du design');
  requireValue(
    references.some((ref) => ref.id === design.file && ref.mime.startsWith('image/')),
    'Le design doit référencer une image importée.',
  );
}

function validateElement(element) {
  if (element === null) return;
  shape(element, ['selector', 'text'], 'Élément');
  text(element.selector, 'Sélecteur', 2000, false);
  text(element.text, 'Texte de l’élément', 4000);
}

function validateJob(job, revisionIds) {
  shape(
    job,
    [
      'id',
      'request',
      'element',
      'baseRevision',
      'status',
      'worker',
      'createdAt',
      'finishedAt',
      'summary',
      'error',
      'connectorGuides',
    ],
    'Demande',
  );
  identifier(job.id);
  if (job.connectorGuides !== undefined) validateConnectorGuideSnapshots(job.connectorGuides);
  text(job.request, 'Demande', 20000, false);
  validateElement(job.element);
  requireValue(
    job.baseRevision === null || revisionIds.has(job.baseRevision),
    'Révision de départ absente.',
  );
  oneOf(job.status, jobStatuses, 'Statut de demande');
  if (job.worker !== null) text(job.worker, 'Exécutant', 200, false);
  if (job.status === 'running' || job.status === 'ready')
    requireValue(job.worker !== null, 'Demande exécutée sans exécutant.');
  if (job.status === 'queued')
    requireValue(job.worker === null, 'Une demande en attente ne possède pas d’exécutant.');
  date(job.createdAt);
  if (terminal.has(job.status)) date(job.finishedAt);
  else requireValue(job.finishedAt === undefined, 'Demande non terminée avec date de fin.');
  if (job.summary !== undefined) text(job.summary, 'Résumé', 10000);
  if (job.error !== undefined) text(job.error, 'Erreur', 10000);
}

function validateRevision(revision, jobs) {
  shape(
    revision,
    ['id', 'jobId', 'title', 'summary', 'createdAt', 'files', 'compilation', 'origin', 'profile'],
    'Révision',
  );
  identifier(revision.id);
  if (revision.origin !== undefined) {
    shape(revision.origin, ['kind'], 'Origine de révision');
    requireValue(
      revision.origin.kind === 'import' && revision.jobId === undefined,
      'Baseline importée sans demande artificielle requise.',
    );
  } else {
    identifier(revision.jobId);
    requireValue(
      jobs.some((job) => job.id === revision.jobId && job.status === 'ready'),
      'Révision sans demande terminée.',
    );
  }
  if (revision.profile !== undefined)
    oneOf(revision.profile, ['static', 'source-only'], 'Profil de révision');
  requireValue(
    revision.profile !== 'source-only' || revision.compilation === undefined,
    'Un snapshot source-only ne contient pas de compilation.',
  );
  text(revision.title, 'Titre de révision', 200, false);
  text(revision.summary, 'Résumé de révision', 10000);
  date(revision.createdAt);
  validateFileManifest(revision.files, revision.profile !== 'source-only');
  if (revision.compilation !== undefined) {
    const build = revision.compilation;
    shape(build, ['profile', 'protocol', 'files'], 'Compilation');
    requireValue(
      build.profile === 'react-ts' && build.protocol === 'react-strict-v1',
      'Profil de compilation invalide.',
    );
    validateFileManifest(build.files);
  }
}

function validateFileManifest(files, application = true) {
  unique(files, 'Fichiers', 'path');
  requireValue(files.length > 0 && files.length <= 256, 'Nombre de fichiers invalide.');
  let bytes = 0;
  for (const file of files) {
    shape(file, ['path', 'sha256', 'bytes'], 'Fichier');
    relativeFile(file.path);
    requireValue(
      typeof file.sha256 === 'string' && /^[a-f0-9]{64}$/.test(file.sha256),
      'Empreinte de fichier invalide.',
    );
    requireValue(
      Number.isSafeInteger(file.bytes) && file.bytes >= 0,
      'Taille de fichier invalide.',
    );
    bytes += file.bytes;
  }
  requireValue(
    bytes <= 32 * 1024 * 1024 && (!application || files.some((file) => file.path === 'index.html')),
    'Application absente ou supérieure à 32 Mio.',
  );
}

function validateCheck(check, revisionIds) {
  shape(
    check,
    ['id', 'revisionId', 'label', 'status', 'kind', 'command', 'output', 'createdAt'],
    'Vérification',
  );
  identifier(check.id);
  requireValue(revisionIds.has(check.revisionId), 'Vérification sans révision connue.');
  text(check.label, 'Libellé de vérification', 500, false);
  oneOf(check.status, ['passed', 'failed'], 'Résultat de vérification');
  oneOf(check.kind, ['command', 'agent-observation'], 'Type de vérification');
  if (check.kind === 'command') text(check.command, 'Commande', 4000, false);
  else
    requireValue(
      check.command === undefined,
      'Une observation ne contient pas de commande exécutée.',
    );
  if (check.output !== undefined) text(check.output, 'Sortie', 64000);
  date(check.createdAt);
}

export function validateStudioState(state) {
  shape(
    state,
    [
      'format',
      'version',
      'project',
      'draft',
      'draftConnectorGuides',
      'references',
      'brief',
      'decisions',
      'designs',
      'selectedDesignId',
      'jobs',
      'revisions',
      'activeRevision',
      'checks',
      'events',
      'proposals',
      'designJourney',
      'import',
      'controlPlane',
    ],
    'État',
  );
  requireValue(
    state.format === 1 && Number.isSafeInteger(state.version) && state.version > 0,
    'Format ou version invalide.',
  );
  validateProject(state.project);
  text(state.draft, 'Brouillon', 20000);
  if (state.draftConnectorGuides !== undefined) {
    const canonical = prepareConnectorGuides(state.draftConnectorGuides).map(
      (entry) => entry.input,
    );
    requireValue(
      JSON.stringify(canonical) === JSON.stringify(state.draftConnectorGuides),
      'Parcours du brouillon non canoniques.',
    );
  }
  validateBrief(state.brief);
  for (const key of ['references', 'decisions', 'designs', 'jobs', 'revisions', 'checks'])
    unique(state[key], key);
  collection(state.events, 'Événements', 10000);
  requireValue(
    new Set(state.events.map((entry) => entry.id)).size === state.events.length,
    'Événements dupliqués.',
  );
  for (const reference of state.references) validateReference(reference);
  for (const decision of state.decisions) validateDecision(decision);
  const activeTopics = state.decisions.filter((d) => d.status === 'active').map((d) => d.topic);
  requireValue(
    new Set(activeTopics).size === activeTopics.length,
    'Plusieurs décisions actives sur le même sujet.',
  );
  for (const design of state.designs) validateDesign(design, state.references);
  requireValue(
    state.selectedDesignId === null || state.designs.some((d) => d.id === state.selectedDesignId),
    'Design sélectionné absent.',
  );
  const revisionIds = new Set(state.revisions.map((revision) => revision.id));
  requireValue(
    state.activeRevision === null || revisionIds.has(state.activeRevision),
    'Révision active absente.',
  );
  for (const job of state.jobs) validateJob(job, revisionIds);
  requireValue(
    state.jobs.filter((job) => job.status === 'running').length <= 1,
    'Plusieurs demandes en cours.',
  );
  for (const revision of state.revisions) validateRevision(revision, state.jobs);
  if (state.import !== undefined) validateImportRecord(state.import, state.revisions);
  requireValue(
    state.revisions.filter((revision) => revision.origin).length === (state.import ? 1 : 0),
    'Origine importée incohérente.',
  );
  requireValue(
    !state.revisions.some((revision) => revision.profile === 'source-only') ||
      state.import !== undefined,
    'Un snapshot source-only nécessite une reprise importée.',
  );
  requireValue(
    new Set(state.revisions.filter((rev) => !rev.origin).map((rev) => rev.jobId)).size ===
      state.revisions.filter((rev) => !rev.origin).length,
    'Plusieurs révisions pour une demande.',
  );
  for (const check of state.checks) validateCheck(check, revisionIds);
  validateProposals(state);
  validateDesignJourney(state);
  if (state.controlPlane !== undefined) validateControlPlane(state.controlPlane);
  for (const entry of state.events) {
    shape(entry, ['id', 'type', 'text', 'createdAt'], 'Événement');
    identifier(entry.id);
    text(entry.type, 'Type d’événement', 100, false);
    text(entry.text, 'Événement', 10000);
    date(entry.createdAt);
  }
  return state;
}

export function updateProject(state, project) {
  validateProject(project);
  const previousDelegation = state.project.delegation;
  state.project = structuredClone(project);
  if (project.delegation === undefined && previousDelegation !== undefined)
    state.project.delegation = structuredClone(previousDelegation);
  event(state, 'project', 'Intention et délégation enregistrées.');
}
export function proposeDecision(state, input, { actor = 'agent' } = {}) {
  const proposal = createProposal(state, input, actor);
  (state.proposals ??= []).push(proposal);
  event(
    state,
    'proposal',
    'Une question et ses alternatives sont disponibles ; aucun choix approuvé.',
  );
  return proposal;
}
export function selectProposalOption(state, input) {
  shape(input, ['proposalId', 'optionId'], 'Sélection de proposition');
  const { proposal, option } = pendingProposalOption(state, input);
  proposal.selectedOptionId = option.id;
  event(
    state,
    'proposal-selected',
    'Option sélectionnée pour examen, sans approbation ni adoption.',
  );
  return proposal;
}
export function approveProposal(state, input, { actor = 'user' } = {}) {
  const next = structuredClone(state);
  const delegation = effectiveDelegation(state);
  const { proposal, resolution, decision } = prepareProposalApproval(next, input, {
    actor,
    delegation,
  });
  appendDecisions(next, [decision]);
  proposal.resolution = resolution;
  if (
    proposal.stage === 'implementation' &&
    actor === 'user' &&
    delegation.structure === 'user' &&
    hasApprovedPlan(state) &&
    !hasApprovedPlan(next)
  )
    approvePlan(next, {
      reason: `Le cadrage déjà approuvé est conservé avec le choix explicite de la proposition ${proposal.id}.`,
    });
  event(
    next,
    'proposal-approved',
    'Choix enregistré ; aucune version activée et aucune vérification inventée.',
  );
  validateStudioState(next);
  state.decisions = next.decisions;
  state.proposals = next.proposals;
  state.events = next.events;
  return proposal;
}
export function setDraft(state, { text: value, connectorGuides }) {
  text(value, 'Brouillon', 20000);
  const guides =
    connectorGuides === undefined
      ? undefined
      : prepareConnectorGuides(connectorGuides).map((entry) => entry.input);
  state.draft = value;
  if (guides !== undefined) state.draftConnectorGuides = guides;
}
export function queueRequest(state, { request, element = null, connectorGuides }) {
  text(request, 'Demande', 20000, false);
  validateElement(element);
  const preparations = prepareConnectorGuides(connectorGuides);
  const job = {
    id: randomUUID(),
    request,
    element: structuredClone(element),
    ...(preparations.length ? { connectorGuides: preparations } : {}),
    baseRevision: state.activeRevision,
    status: 'queued',
    worker: null,
    createdAt: now(),
  };
  state.jobs.push(job);
  state.draft = '';
  if (state.draftConnectorGuides !== undefined) state.draftConnectorGuides = [];
  event(state, 'queued', 'Demande enregistrée, en attente d’un agent.');
  return job;
}
export function claimJob(state, { worker }) {
  text(worker, 'Exécutant', 200, false);
  if (state.jobs.some((job) => job.status === 'running'))
    reject('Un agent traite déjà une demande.', 409);
  const job = state.jobs.find((entry) => entry.status === 'queued');
  if (!job) return null;
  if (job.baseRevision !== state.activeRevision)
    reject(
      'La demande en attente vise une ancienne révision. Annulez-la et soumettez-la à nouveau.',
      409,
    );
  job.status = 'running';
  job.worker = worker;
  event(state, 'running', 'Un agent a pris en charge la demande.');
  return job;
}

function runningJob(state, jobId) {
  const job = find(state.jobs, jobId, 'Demande');
  if (job.status !== 'running')
    reject('Cette demande n’est plus en cours ; résultat tardif refusé.', 409);
  return job;
}

export function failJob(state, { jobId, error }) {
  text(error, 'Erreur', 10000, false);
  const job = runningJob(state, jobId);
  job.status = 'failed';
  job.error = error;
  job.finishedAt = now();
  event(state, 'failed', 'La demande a échoué. Son contexte est conservé.');
}
export function cancelJob(state, { jobId }) {
  const job = find(state.jobs, jobId, 'Demande');
  if (terminal.has(job.status)) reject('Cette demande est déjà terminée.', 409);
  job.status = 'cancelled';
  job.finishedAt = now();
  event(state, 'cancelled', 'Demande annulée. Tout résultat tardif sera refusé.');
}

function appendDecisions(state, decisions) {
  for (const decision of decisions) {
    if (decision.status === 'active') {
      for (const previous of state.decisions) {
        if (previous.status === 'active' && previous.topic === decision.topic)
          previous.status = 'superseded';
      }
    }
    state.decisions.push(structuredClone(decision));
  }
}

function validateCompletion(
  state,
  job,
  { revision, brief, decisions, designs, proposals, summary },
) {
  if (job.baseRevision !== state.activeRevision)
    reject('La révision active a changé ; résultat périmé refusé.', 409);
  if (summary !== undefined) text(summary, 'Résumé', 10000);
  if (brief !== undefined) validateBrief(brief);
  if (
    revision === undefined &&
    brief === undefined &&
    !decisions?.length &&
    !designs?.length &&
    !proposals?.length
  )
    reject('Le résultat ne contient ni application, ni cadrage, ni décisions, ni design.');
  unique(decisions ?? [], 'Décisions reçues');
  for (const decision of decisions ?? []) {
    validateDecision(decision);
    requireValue(
      decision.source === 'agent',
      'L’agent ne peut pas attribuer une décision à l’utilisateur.',
    );
    requireValue(
      !state.decisions.some((old) => old.id === decision.id),
      'Identifiant de décision déjà utilisé.',
    );
  }
  unique(designs ?? [], 'Designs reçus');
  for (const design of designs ?? []) {
    validateDesign(design, state.references);
    requireValue(
      !state.designs.some((old) => old.id === design.id),
      'Identifiant de design déjà utilisé.',
    );
  }
  if (revision !== undefined) {
    validateRevision(revision, [{ ...job, status: 'ready' }]);
    requireValue(
      revision.jobId === job.id && !state.revisions.some((old) => old.id === revision.id),
      'Révision reçue incohérente.',
    );
    if (!(state.import && revision.profile === 'source-only'))
      validateApprovedCompletion(state, { brief, decisions });
  }
  return completedProposals(state, { revision, brief, decisions, proposals });
}

function completedProposals(state, { revision, brief, decisions, proposals = [] }) {
  collection(proposals, 'Propositions reçues', 20);
  const result = structuredClone(state);
  if (brief !== undefined) result.brief = structuredClone(brief);
  appendDecisions(result, decisions ?? []);
  if (revision !== undefined) {
    result.revisions.push(structuredClone(revision));
    if (automaticAdoptionAllowed(state, revision)) result.activeRevision = revision.id;
  }
  const created = [];
  for (const input of proposals) {
    const proposal = createProposal(result, input, 'agent');
    (result.proposals ??= []).push(proposal);
    created.push(proposal);
  }
  return created;
}

function validateApprovedCompletion(state, { brief, decisions }) {
  const approval = planApprovalStatus(state);
  if (!approval.planApproved)
    reject(
      approval.visualBlock?.message ??
        'Les choix réservés à l’utilisateur doivent être approuvés avant de livrer du code.',
      409,
    );
  const proposed = structuredClone(state);
  if (brief !== undefined) proposed.brief = structuredClone(brief);
  appendDecisions(proposed, decisions ?? []);
  if (!hasApprovedPlan(proposed))
    reject(
      'Le résultat modifie des choix réservés ; soumettez ces choix à approbation avant le code.',
      409,
    );
}

export function finishJob(state, completion) {
  const job = runningJob(state, completion.jobId);
  const proposals = validateCompletion(state, job, completion);
  const {
    revision,
    brief,
    decisions,
    designs,
    summary = revision?.summary ?? 'Demande traitée.',
  } = completion;
  if (brief !== undefined) state.brief = structuredClone(brief);
  appendDecisions(state, decisions ?? []);
  state.designs.push(...structuredClone(designs ?? []));
  if (proposals.length) (state.proposals ??= []).push(...proposals);
  if (revision !== undefined) state.revisions.push(structuredClone(revision));
  job.status = 'ready';
  job.finishedAt = now();
  job.summary = summary;
  event(state, 'ready', 'Résultat disponible ; les vérifications restent distinctes.');
  if (revision !== undefined && automaticAdoptionAllowed(state, revision)) {
    state.activeRevision = revision.id;
    appendDecisions(state, [
      {
        id: randomUUID(),
        topic: 'Version active',
        choice: revision.title,
        reason: 'Adoption automatique dans le cadre de la délégation enregistrée.',
        source: 'agent',
        status: 'active',
      },
    ]);
    event(state, 'activated', 'Révision activée dans le cadre de la délégation.');
  }
}

function automaticAdoptionAllowed(state, revision) {
  if (revision.profile === 'source-only' || effectiveDelegation(state).adoption !== 'agent')
    return false;
  // A newly produced revision has no evidence yet. The Control Plane must observe it
  // before an automatic adoption; historical projects retain their original contract.
  if (!state.controlPlane) return true;
  return (
    state.controlPlane.snapshot.input.revisionId === revision.id &&
    state.controlPlane.snapshot.decision.effective === 'Auto-Continue'
  );
}

export function controlContinuation(state) {
  const snapshot = state.controlPlane?.snapshot;
  const revision = state.revisions.find((entry) => entry.id === snapshot?.input.revisionId);
  const job = state.jobs.find((entry) => entry.id === revision?.jobId);
  let reason = 'La version vérifiée peut être appliquée dans la délégation enregistrée.';
  if (!revision || !automaticAdoptionAllowed(state, revision))
    reason = 'L’application exige Auto-Continue et une responsabilité d’application déléguée.';
  else if (state.activeRevision === revision.id) reason = 'Cette version est déjà appliquée.';
  else if (!job || job.baseRevision !== state.activeRevision || job.status !== 'ready')
    reason = 'La base de cette livraison a changé ; préparer une nouvelle version.';
  else if (state.jobs.some((entry) => entry.status === 'running'))
    reason = 'Une mission est encore en cours sur la version actuelle.';
  else if (!hasApprovedPlan(state)) reason = 'Les validations du cadrage restent requises.';
  else return { available: true, reason };
  return { available: false, reason };
}

export function continueVerifiedRevision(state) {
  const admission = controlContinuation(state);
  if (!admission.available) reject(admission.reason, 409);
  const revision = state.revisions.find(
    (entry) => entry.id === state.controlPlane.snapshot.input.revisionId,
  );
  state.activeRevision = revision.id;
  appendDecisions(state, [
    {
      id: randomUUID(),
      topic: 'Version active',
      choice: revision.title,
      reason: `Control Plane ${state.controlPlane.policy.id} : preuves actuelles, risque faible et délégation vérifiés.`,
      source: 'agent',
      status: 'active',
    },
  ]);
  event(state, 'activated', 'Version vérifiée appliquée dans la délégation du Control Plane.');
}

export function chooseDesign(state, { id, reason }) {
  const design = find(state.designs, id, 'Design');
  text(reason, 'Raison', 4000);
  state.selectedDesignId = id;
  appendDecisions(state, [
    {
      id: randomUUID(),
      topic: 'Direction visuelle',
      choice: design.title,
      reason,
      source: 'user',
      status: 'active',
    },
  ]);
  appendDecisions(state, [
    {
      id: randomUUID(),
      topic: 'visual-approval',
      choice: id,
      reason,
      source: 'user',
      status: 'active',
    },
  ]);
  event(state, 'design', 'Direction visuelle sélectionnée et approuvée.');
}

function canonicalJSON(value) {
  if (Array.isArray(value)) return '[' + value.map(canonicalJSON).join(',') + ']';
  if (value !== null && typeof value === 'object') {
    return (
      '{' +
      Object.keys(value)
        .sort()
        .map((key) => JSON.stringify(key) + ':' + canonicalJSON(value[key]))
        .join(',') +
      '}'
    );
  }
  return JSON.stringify(value);
}

export function planApprovalKey(state) {
  const architecture = state.decisions
    .filter(
      (decision) =>
        decision.status === 'active' && decision.topic.trim().toLowerCase() === 'architecture',
    )
    .map(({ choice, reason, source }) => ({ choice, reason, source }))
    .sort((left, right) => canonicalJSON(left).localeCompare(canonicalJSON(right)));
  const content = {
    idea: state.project.idea,
    constraints: state.project.constraints,
    brief: state.brief,
    selectedDesignId: state.selectedDesignId,
    architecture,
  };
  return createHash('sha256').update(canonicalJSON(content)).digest('hex');
}

export function effectiveDelegation(state) {
  if (state.project.delegation) return structuredClone(state.project.delegation);
  return {
    structure: state.project.mode === 'delegated' ? 'agent' : 'user',
    visual: 'agent',
    adoption: state.project.mode === 'guided' ? 'user' : 'agent',
  };
}

function hasUserApproval(state, topic, choice) {
  return state.decisions.some(
    (decision) =>
      decision.topic === topic &&
      decision.status === 'active' &&
      decision.source === 'user' &&
      decision.choice === choice,
  );
}

function masterApprovalBlock(state) {
  if (state.designJourney === undefined) return null;
  const { master, stale, approved } = designJourneyView(state);
  if (!master)
    return {
      kind: 'master-missing',
      masterId: null,
      message:
        'Préparez puis approuvez le master détaillé de la direction courante avant la réalisation.',
    };
  if (stale)
    return {
      kind: 'master-stale',
      masterId: master.id,
      message:
        'Le master appartient à une autre direction ; préparez et approuvez un nouveau master.',
    };
  if (!approved)
    return {
      kind: 'master-unapproved',
      masterId: master.id,
      message: 'Le master détaillé courant attend sa propre validation avant la réalisation.',
    };
  return null;
}

function visualApprovalBlock(state, delegation, recorded) {
  const masterBlock = masterApprovalBlock(state);
  if (masterBlock) return masterBlock;
  if (delegation.visual === 'agent' || recorded.visual) return null;
  return {
    kind: 'direction',
    masterId: null,
    message: 'Choisissez et approuvez une direction visuelle avant la réalisation.',
  };
}

export function planApprovalStatus(state) {
  const delegation = effectiveDelegation(state);
  const recorded = {
    structure: hasUserApproval(state, 'delivery-scope', planApprovalKey(state)),
    visual: Boolean(
      state.selectedDesignId &&
      state.designs.some((design) => design.id === state.selectedDesignId) &&
      hasUserApproval(state, 'visual-approval', state.selectedDesignId),
    ),
  };
  const structureApproved = delegation.structure === 'agent' || recorded.structure;
  const visualBlock = visualApprovalBlock(state, delegation, recorded);
  const visualApproved = visualBlock === null;
  const missing = [];
  if (!structureApproved) missing.push('structure');
  if (!visualApproved) missing.push('visual');
  return {
    structureApproved,
    visualApproved,
    visualBlock,
    planApproved: missing.length === 0,
    missing,
    recorded,
  };
}

export function hasApprovedPlan(state) {
  return planApprovalStatus(state).planApproved;
}

export function approvePlan(state, { reason }) {
  text(reason, 'Raison', 4000);
  const approval = planApprovalStatus(state);
  requireValue(approval.visualApproved, approval.visualBlock?.message);
  requireValue(
    state.project.idea.trim().length > 0 &&
      state.brief.outcome.trim().length > 0 &&
      state.brief.criteria.length > 0,
    'Précisez l’idée, le résultat et au moins un critère avant d’approuver.',
  );
  appendDecisions(state, [
    {
      id: randomUUID(),
      topic: 'delivery-scope',
      choice: planApprovalKey(state),
      reason,
      source: 'user',
      status: 'active',
    },
  ]);
  event(state, 'approved', 'Le cadrage et les choix structurants actuels ont été approuvés.');
}

export function activateRevision(state, { id, reason }) {
  const revision = find(state.revisions, id, 'Révision');
  text(reason, 'Raison', 4000);
  if (revision.profile === 'source-only' && !revision.origin && !hasApprovedPlan(state))
    reject(
      'Approuvez le cadrage avant d’adopter cette évolution importée ; le snapshot reste disponible.',
      409,
    );
  state.activeRevision = id;
  appendDecisions(state, [
    {
      id: randomUUID(),
      topic: 'Version active',
      choice: revision.title,
      reason,
      source: 'user',
      status: 'active',
    },
  ]);
  event(state, 'activated', 'Révision activée. Les données applicatives sont conservées.');
}
export function recordCheck(state, input) {
  const check = { ...input, id: randomUUID(), createdAt: now() };
  validateCheck(check, new Set(state.revisions.map((revision) => revision.id)));
  state.checks.push(check);
  event(state, 'checked', 'Une vérification a été ajoutée à sa révision.');
  return check;
}
export function interruptRunningJobs(state) {
  let count = 0;
  for (const run of state.controlPlane?.analyses ?? []) {
    if (run.status !== 'running') continue;
    run.status = 'interrupted';
    run.finishedAt = now();
    run.error = 'Serveur redémarré ; aucun nouvel essai automatique.';
    count++;
  }
  for (const job of state.jobs) {
    if (job.status !== 'running') continue;
    job.status = 'interrupted';
    job.finishedAt = now();
    job.error =
      'Le serveur a redémarré pendant l’exécution. Aucun résultat tardif ne sera accepté.';
    count++;
  }
  if (count)
    event(
      state,
      'interrupted',
      'Travail interrompu par le redémarrage ; aucun nouvel essai automatique.',
    );
  return count;
}
