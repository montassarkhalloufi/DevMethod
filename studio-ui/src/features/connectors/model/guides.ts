export interface GuideInput {
  optionId: string;
  guideVersion: 1;
  flowId: string;
  answers: Record<string, string | string[]>;
}

export interface GuideQuestion {
  id: string;
  title: string;
  description?: string;
  multiple?: boolean;
  options: { id: string; title: string; description?: string }[];
}

export interface GuideFlow {
  id: string;
  title: string;
  description: string;
  usage: 'application' | 'assistant' | 'app-user';
  identity: string;
  transport: 'api' | 'mcp';
  questions: GuideQuestion[];
}

export interface GuideDefinition {
  optionId: string;
  guideVersion: 1;
  title: string;
  description: string;
  flows: GuideFlow[];
  sources: { title: string; url: string }[];
}

export interface GuidePreparation {
  input: GuideInput;
  setupFingerprint: string;
  title: string;
  summary: string[];
  permissions: { scope: string; reason: string }[];
  prerequisites: string[];
  access: 'not-connected';
  nativeConnection: { providerId: string; url: string } | null;
}

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

const text = (value: unknown): value is string => typeof value === 'string';
const texts = (value: unknown): value is string[] => Array.isArray(value) && value.every(text);
const titled = (value: unknown) => record(value) && text(value.id) && text(value.title);
const optionalDescription = (value: Record<string, unknown>) =>
  value.description === undefined || text(value.description);

function question(value: unknown) {
  return (
    record(value) &&
    titled(value) &&
    optionalDescription(value) &&
    (value.multiple === undefined || typeof value.multiple === 'boolean') &&
    Array.isArray(value.options) &&
    value.options.length > 0 &&
    value.options.every((option) => record(option) && titled(option) && optionalDescription(option))
  );
}

function flow(value: unknown) {
  return (
    record(value) &&
    titled(value) &&
    text(value.description) &&
    text(value.identity) &&
    ['application', 'assistant', 'app-user'].includes(String(value.usage)) &&
    ['api', 'mcp'].includes(String(value.transport)) &&
    Array.isArray(value.questions) &&
    value.questions.every(question)
  );
}

function publicURL(value: unknown) {
  if (!text(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function readGuideInput(value: unknown): GuideInput {
  if (
    !record(value) ||
    !text(value.optionId) ||
    value.guideVersion !== 1 ||
    !text(value.flowId) ||
    !record(value.answers) ||
    !Object.values(value.answers).every((answer) => text(answer) || texts(answer))
  )
    throw new Error('Les réponses du guide sont illisibles.');
  return value as unknown as GuideInput;
}

export function readGuideDefinitions(value: unknown): GuideDefinition[] {
  if (
    !record(value) ||
    !Array.isArray(value.guides) ||
    !value.guides.every(
      (guide) =>
        record(guide) &&
        text(guide.optionId) &&
        guide.guideVersion === 1 &&
        text(guide.title) &&
        text(guide.description) &&
        Array.isArray(guide.flows) &&
        guide.flows.length > 0 &&
        guide.flows.every(flow) &&
        Array.isArray(guide.sources) &&
        guide.sources.every(
          (source) => record(source) && text(source.title) && publicURL(source.url),
        ),
    )
  )
    throw new Error('Les guides sont illisibles. Actualisez pour réessayer.');
  return value.guides as GuideDefinition[];
}

export function readGuidePreparation(value: unknown): GuidePreparation {
  if (
    !record(value) ||
    !text(value.setupFingerprint) ||
    !/^[a-f0-9]{64}$/.test(value.setupFingerprint) ||
    !text(value.title) ||
    !texts(value.summary) ||
    !texts(value.prerequisites) ||
    value.access !== 'not-connected' ||
    !Array.isArray(value.permissions) ||
    !value.permissions.every(
      (permission) => record(permission) && text(permission.scope) && text(permission.reason),
    ) ||
    !(
      value.nativeConnection === null ||
      (record(value.nativeConnection) &&
        text(value.nativeConnection.providerId) &&
        publicURL(value.nativeConnection.url))
    )
  )
    throw new Error('La préparation reçue est illisible. Aucun accès n’est confirmé.');
  readGuideInput(value.input);
  return value as unknown as GuidePreparation;
}

export function guideInputKey(input: GuideInput | null | undefined) {
  if (!input) return '';
  return JSON.stringify([
    input.optionId,
    input.guideVersion,
    input.flowId,
    Object.entries(input.answers)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => [key, Array.isArray(value) ? [...value].sort() : value]),
  ]);
}

export function selectGuideFlow(definition: GuideDefinition, flowId: string): GuideInput {
  return {
    optionId: definition.optionId,
    guideVersion: definition.guideVersion,
    flowId,
    answers: {},
  };
}

export function guideAnswered(flow: GuideFlow, input: GuideInput) {
  return flow.questions.every((question) => {
    const answer = input.answers[question.id];
    return question.multiple
      ? Array.isArray(answer) && answer.length > 0
      : typeof answer === 'string' && answer.length > 0;
  });
}
