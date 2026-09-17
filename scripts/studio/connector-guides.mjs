import { createHash } from 'node:crypto';
import { connectorGuideDefinitions } from './connector-guides-catalog.mjs';
import {
  connectorObject,
  connectorPayload,
  connectorDigest,
  rejectConnector,
} from './connectors-validation.mjs';

export const connectorGuideLimit = 12;
const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const readConnectorGuides = () => ({ guides: structuredClone(connectorGuideDefinitions) });

function answerFor(question, value) {
  const selected = question.multiple ? value : [value];
  if (
    !Array.isArray(selected) ||
    !selected.length ||
    selected.length > question.options.length ||
    new Set(selected).size !== selected.length ||
    selected.some((id) => !question.options.some((option) => option.id === id))
  )
    rejectConnector('Réponse absente, inconnue ou répétée dans le parcours.');
  return question.multiple
    ? question.options.filter((option) => selected.includes(option.id)).map((option) => option.id)
    : value;
}

export function normalizeConnectorGuide(input) {
  connectorObject(input, ['optionId', 'guideVersion', 'flowId', 'answers'], 'Parcours guidé');
  connectorPayload(input);
  const guide = connectorGuideDefinitions.find((entry) => entry.optionId === input.optionId);
  if (!guide || input.guideVersion !== 1) rejectConnector('Parcours ou version inconnue.');
  const flow = guide.flows.find((entry) => entry.id === input.flowId);
  if (!flow) rejectConnector('Parcours incompatible avec ce fournisseur.');
  connectorObject(
    input.answers,
    flow.questions.map((question) => question.id),
    'Réponses du parcours',
  );
  const answers = Object.fromEntries(
    flow.questions.map((question) => [
      question.id,
      answerFor(question, input.answers[question.id]),
    ]),
  );
  return { optionId: guide.optionId, guideVersion: 1, flowId: flow.id, answers };
}

function slackPreparation(input) {
  const actions = input.answers.actions,
    audience = input.answers.audience;
  const bot = input.flowId === 'slack-bot',
    appUser = input.flowId === 'slack-app-user';
  const permissions = [];
  if (actions.includes('send-messages'))
    permissions.push({
      scope: 'chat:write',
      reason: 'Envoyer des messages avec l’identité choisie dans les conversations autorisées.',
    });
  if (actions.includes('read-history')) {
    const scope = audience.includes('private')
      ? 'groups:history'
      : audience === 'direct-messages'
        ? 'im:history'
        : 'channels:history';
    permissions.push({
      scope,
      reason:
        'Lire l’historique du type de conversation choisi, dans les limites d’accès de cette identité.',
    });
  }
  return {
    summary: [
      bot
        ? 'Identité : bot applicatif.'
        : appUser
          ? 'Identité : compte Slack propre à chaque utilisateur de l’application.'
          : 'Identité : compte utilisateur Slack autorisant l’application.',
      bot
        ? 'Le bot doit être invité dans les canaux choisis ; chat:write.public n’est pas demandé.'
        : 'Les scopes ne remplacent pas les droits du compte sur les conversations.',
      'Scopes proposés pour l’intégration, non accordés. Aucune connexion API native ni installation effectuée.',
    ],
    permissions,
    prerequisites: [
      'Créer ou utiliser une application Slack et vérifier la politique d’installation du workspace.',
      'Implémenter OAuth côté serveur, protéger les secrets, vérifier le callback et les permissions accordées.',
      bot
        ? 'Demander les scopes bot via scope, prévoir un callback serveur HTTPS et sélectionner les canaux où inviter le bot. Les redirections desktop/localhost PKCE Slack n’acceptent pas les scopes bot.'
        : 'Demander les scopes utilisateur via user_scope et distinguer ce flux de Sign in with Slack.',
      ...(appUser
        ? [
            'Implémenter le consentement OAuth de chaque utilisateur, l’isolation de ses tokens, la révocation et les contrôles d’accès de l’application. Ce parcours app-user n’est pas fourni nativement.',
          ]
        : []),
      'Une réautorisation Slack peut ajouter des scopes ; retirer une option du guide ne révoque pas les droits déjà accordés.',
    ],
    nativeConnection: null,
  };
}

function githubPreparation(input) {
  const readOnly = input.flowId === 'github-read';
  const permissions = {
    code: 'Contents',
    issues: 'Issues',
    'pull-requests': 'Pull requests',
  };
  return {
    summary: [
      readOnly
        ? 'Usage : assistant, via le MCP GitHub officiel limité aux outils de lecture.'
        : 'Usage : assistant, via le MCP GitHub standard capable de modifications.',
      'Les ressources choisies ne modifient pas les droits du jeton et ne limitent pas les dépôts accessibles. Configurez ces restrictions directement dans GitHub.',
      'Connexion par jeton personnel (PAT), sans OAuth natif DevMethod. Aucun accès n’est accordé par cette préparation.',
    ],
    permissions: input.answers.resources.map((resource) => ({
      scope: `${permissions[resource]}: ${readOnly ? 'read' : 'read/write'}`,
      reason:
        'Permission indicative à configurer dans un PAT à granularité fine, selon les opérations réellement nécessaires. Ce guide ne crée ni ne modifie le jeton.',
    })),
    prerequisites: [
      'Créer un PAT à granularité fine lorsque les opérations le permettent : choisir le propriétaire, limiter les dépôts et donner uniquement les permissions nécessaires avec une expiration.',
      'Vérifier les politiques de l’organisation et obtenir son approbation si nécessaire. Les droits du compte et du jeton déterminent les accès réels.',
      'Saisir le PAT uniquement dans le champ de connexion masqué. Ne jamais le placer dans le prompt, les réponses du guide, les fichiers ou les références du projet.',
      'Vérifier les outils découverts puis sélectionner cette connexion pour le projet. Le point d’entrée lecture seule ne révoque pas les autres permissions du PAT.',
      'Respecter les autorisations utilisateur pour toute action externe. Le runner natif ne reçoit pas ces outils automatiquement.',
    ],
    nativeConnection: {
      providerId: 'github',
      url: readOnly
        ? 'https://api.githubcopilot.com/mcp/readonly'
        : 'https://api.githubcopilot.com/mcp/',
    },
  };
}

function mcpPreparation(input) {
  if (input.optionId === 'github-mcp') return githubPreparation(input);
  if (input.optionId === 'notion')
    return {
      summary: [
        'Usage : contexte ou documentation pour l’assistant via le MCP Notion.',
        'Les choix lecture et préparation de modifications sont des intentions. Ils ne limitent pas techniquement les permissions Notion à la lecture seule.',
        'Le compte connecté peut donner accès à des outils de lecture et de modification. Aucun accès n’est encore accordé par cette préparation.',
      ],
      permissions: [
        {
          scope: 'default',
          reason:
            'Consentement OAuth Notion à examiner : les outils peuvent lire et modifier le contenu accessible au compte. Ce guide ne réduit pas ce grant.',
        },
      ],
      prerequisites: [
        'Connecter explicitement son compte au MCP officiel et examiner les permissions affichées par Notion.',
        'Vérifier les outils réellement découverts et sélectionner la connexion pour ce projet.',
        'Faire autoriser chaque action externe ; préparer un changement ne l’autorise pas. Le runner natif ne reçoit pas ces outils automatiquement.',
      ],
      nativeConnection: { providerId: 'notion', url: 'https://mcp.notion.com/mcp' },
    };
  const readOnly = input.flowId === 'linear-read';
  return {
    summary: [
      readOnly
        ? 'Usage : assistant, via le point d’entrée officiel Linear limité aux outils de lecture.'
        : 'Usage : assistant, via le point d’entrée Linear standard capable de modifications.',
      'Le consentement, la découverte d’outils et la sélection du projet restent à effectuer. Une capacité d’écriture n’autorise pas une action externe.',
    ],
    permissions: [
      { scope: 'read', reason: 'Consulter les ressources Linear accessibles au compte.' },
      ...(!readOnly
        ? [
            {
              scope: 'write',
              reason:
                'Capacité de modification possible avec le point d’entrée standard ; chaque action reste soumise à autorisation distincte.',
            },
          ]
        : []),
    ],
    prerequisites: [
      'Connecter explicitement Linear, examiner son écran de consentement et les droits du compte.',
      'Vérifier les outils réellement découverts et sélectionner cette connexion dans le projet.',
      'Respecter les autorisations utilisateur pour toute action externe. Le runner natif ne reçoit pas ces outils automatiquement.',
    ],
    nativeConnection: {
      providerId: 'linear',
      url: readOnly ? 'https://mcp.linear.app/mcp/readonly' : 'https://mcp.linear.app/mcp',
    },
  };
}

export function prepareConnectorGuide(value) {
  const input = normalizeConnectorGuide(value);
  const guide = connectorGuideDefinitions.find((entry) => entry.optionId === input.optionId);
  const flow = guide.flows.find((entry) => entry.id === input.flowId);
  const prepared = {
    input,
    title: `${guide.title} — ${flow.title}`,
    ...(input.optionId === 'slack' ? slackPreparation(input) : mcpPreparation(input)),
    access: 'not-connected',
  };
  const choices = flow.questions.map((question) => {
    const value = input.answers[question.id],
      selected = Array.isArray(value) ? value : [value];
    return `${question.title} ${question.options
      .filter((option) => selected.includes(option.id))
      .map((option) => option.title)
      .join(', ')}.`;
  });
  prepared.summary.unshift(...choices);
  return { ...prepared, setupFingerprint: hash(prepared) };
}

export function prepareConnectorGuides(inputs = []) {
  if (!Array.isArray(inputs) || inputs.length > connectorGuideLimit)
    rejectConnector('Maximum 12 parcours guidés.');
  const prepared = inputs.map(prepareConnectorGuide);
  if (new Set(prepared.map((entry) => entry.input.optionId)).size !== prepared.length)
    rejectConnector('Un seul parcours par fournisseur.');
  return prepared;
}

// Validate versioned snapshots; version 1 definitions must retain their semantics.
export function validateConnectorGuideSnapshots(value) {
  if (!Array.isArray(value) || value.length > connectorGuideLimit)
    rejectConnector('Snapshots de parcours invalides.');
  const ids = new Set();
  for (const snapshot of value) {
    connectorObject(
      snapshot,
      [
        'input',
        'title',
        'summary',
        'permissions',
        'prerequisites',
        'nativeConnection',
        'access',
        'setupFingerprint',
      ],
      'Snapshot de parcours',
    );
    connectorPayload(snapshot);
    const canonical = prepareConnectorGuide(snapshot.input);
    if (ids.has(canonical.input.optionId)) rejectConnector('Snapshot de parcours répété.');
    ids.add(canonical.input.optionId);
    connectorDigest(snapshot.setupFingerprint);
    // Version 1 is fixed: arbitrary text/scopes/URLs cannot enter an agent context.
    if (JSON.stringify(snapshot) !== JSON.stringify(canonical))
      rejectConnector('Snapshot de parcours altéré ou non canonique.');
  }
}

export function connectorGuideInstructions(preparations) {
  return preparations.flatMap((entry) => [
    `Parcours préparé : ${entry.title}. Empreinte : ${entry.setupFingerprint}. Accès : non connecté par le guide.`,
    ...entry.summary,
    'Préparer les étapes et le code nécessaires selon les choix structurés. Vérifier les accès réels séparément ; ne jamais simuler une connexion, une installation ni une permission accordée.',
  ]);
}
