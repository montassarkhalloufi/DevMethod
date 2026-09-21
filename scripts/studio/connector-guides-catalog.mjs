const choice = (id, title, description) => ({ id, title, ...(description ? { description } : {}) });
const slackActions = {
  id: 'actions',
  title: 'Que doit préparer l’application ?',
  multiple: true,
  description:
    'Ces choix définissent le code et les accès à préparer, sans autoriser une action externe.',
  options: [
    choice('send-messages', 'Envoyer des messages'),
    choice('read-history', 'Lire l’historique des conversations autorisées'),
  ],
};
const slackAudience = (bot) => ({
  id: 'audience',
  title: 'Dans quelles conversations ?',
  description: bot
    ? 'Le bot doit être invité dans les canaux choisis. Aucun accès à tous les canaux publics par défaut.'
    : 'L’accès dépend des permissions accordées et des conversations accessibles à chaque compte.',
  options: bot
    ? [
        choice('selected-public-channels', 'Canaux publics choisis'),
        choice('selected-private-channels', 'Canaux privés choisis'),
      ]
    : [
        choice('public-channels', 'Canaux publics accessibles'),
        choice('private-channels', 'Canaux privés accessibles'),
        choice('direct-messages', 'Messages directs accessibles'),
      ],
});
const slackFlow = (id, title, identity, usage = 'application') => ({
  id,
  title,
  description:
    usage === 'app-user'
      ? 'Chaque utilisateur de votre application devra autoriser son propre compte Slack. Ce parcours prépare cette intégration ; DevMethod ne la fournit pas nativement.'
      : 'Préparer une intégration API côté serveur. Aucune installation Slack ni connexion API n’est effectuée par ce guide.',
  usage,
  identity,
  transport: 'api',
  questions: [slackActions, slackAudience(identity === 'bot')],
});
const notionFlow = (id, title) => ({
  id,
  title,
  description:
    'Le MCP Notion peut exposer lecture et modification selon le compte et les outils autorisés. Le choix ci-dessous exprime une intention, pas une restriction technique OAuth.',
  usage: 'assistant',
  identity: 'user',
  transport: 'mcp',
  questions: [
    {
      id: 'actions',
      title: 'Quel travail préparer ?',
      multiple: true,
      options: [
        choice('read-content', 'Consulter du contenu pour comprendre le projet'),
        choice(
          'prepare-changes',
          'Préparer des propositions de modification',
          'Toute écriture externe nécessite une autorisation distincte de l’utilisateur.',
        ),
      ],
    },
  ],
});
const linearFlow = (id, title, description) => ({
  id,
  title,
  description,
  usage: 'assistant',
  identity: 'user',
  transport: 'mcp',
  questions: [
    {
      id: 'resources',
      title: 'Quelles informations utiliser ?',
      multiple: true,
      options: [
        choice('issues', 'Issues'),
        choice('projects', 'Projets'),
        choice('comments', 'Commentaires'),
      ],
    },
  ],
});
const githubFlow = (id, title, description) => ({
  id,
  title,
  description,
  usage: 'assistant',
  identity: 'user',
  transport: 'mcp',
  questions: [
    {
      id: 'resources',
      title: 'Quel contexte GitHub utiliser ?',
      description:
        'Ces choix préparent le travail de l’assistant. Les dépôts et droits réellement accessibles se règlent dans le jeton GitHub.',
      multiple: true,
      options: [
        choice('code', 'Code et fichiers des dépôts'),
        choice('issues', 'Issues'),
        choice('pull-requests', 'Pull requests'),
      ],
    },
  ],
});

// Version 1 IDs and semantics are durable; a changed contract needs a new version.
export const connectorGuideDefinitions = [
  {
    optionId: 'slack',
    guideVersion: 1,
    title: 'Slack',
    description:
      'Séparer identité, fonctionnalités et conversations avant de préparer une intégration API.',
    flows: [
      slackFlow('slack-bot', 'Un bot pour l’application', 'bot'),
      slackFlow('slack-user', 'Un compte utilisateur pour l’application', 'user'),
      slackFlow('slack-app-user', 'Chaque utilisateur connecte son compte', 'end-user', 'app-user'),
    ],
    sources: [
      { title: 'Slack — types de tokens', url: 'https://docs.slack.dev/authentication/tokens/' },
      {
        title: 'Slack — OAuth et scopes bot/user',
        url: 'https://docs.slack.dev/authentication/installing-with-oauth/',
      },
      { title: 'Slack — chat:write', url: 'https://docs.slack.dev/reference/scopes/chat.write/' },
      {
        title: 'Slack — historique public',
        url: 'https://docs.slack.dev/reference/scopes/channels.history/',
      },
      {
        title: 'Slack — historique privé',
        url: 'https://docs.slack.dev/reference/scopes/groups.history/',
      },
      {
        title: 'Slack — historique des messages directs',
        url: 'https://docs.slack.dev/reference/scopes/im.history/',
      },
      {
        title: 'Slack — PKCE et restrictions desktop',
        url: 'https://docs.slack.dev/authentication/using-pkce/',
      },
    ],
  },
  {
    optionId: 'notion',
    guideVersion: 1,
    title: 'Notion',
    description:
      'Préparer le contexte ou la documentation du projet avec le MCP officiel, sous les permissions du compte connecté.',
    flows: [
      notionFlow('notion-context', 'Contexte de l’assistant'),
      notionFlow('notion-documentation', 'Documentation du projet'),
    ],
    sources: [
      {
        title: 'Notion — construire un client MCP',
        url: 'https://developers.notion.com/guides/mcp/build-mcp-client',
      },
      {
        title: 'Notion — métadonnées OAuth officielles',
        url: 'https://mcp.notion.com/.well-known/oauth-authorization-server',
      },
    ],
  },
  {
    optionId: 'linear',
    guideVersion: 1,
    title: 'Linear',
    description:
      'Choisir une connexion MCP en lecture seule ou capable de modifications avant de préparer son usage.',
    flows: [
      linearFlow(
        'linear-read',
        'Consulter Linear',
        'Utiliser le point d’entrée officiel /mcp/readonly, qui expose des outils de lecture seule.',
      ),
      linearFlow(
        'linear-write',
        'Préparer des modifications Linear',
        'Le point d’entrée standard peut exposer des outils de modification. Chaque action externe reste soumise aux autorisations utilisateur.',
      ),
    ],
    sources: [
      { title: 'Linear — serveur MCP et lecture seule', url: 'https://linear.app/docs/mcp' },
    ],
  },
  {
    optionId: 'github-mcp',
    guideVersion: 1,
    title: 'GitHub · Assistant MCP',
    description:
      'Connecter le serveur MCP officiel avec un jeton personnel GitHub (PAT). La lecture seule est proposée en premier ; l’API de votre application reste une intégration distincte.',
    flows: [
      githubFlow(
        'github-read',
        'Consulter GitHub en lecture seule',
        'Le point d’entrée /mcp/readonly expose uniquement les outils de lecture du serveur. Il ne retire pas les autres droits du jeton.',
      ),
      githubFlow(
        'github-write',
        'Préparer des modifications GitHub',
        'Le point d’entrée standard peut exposer des outils de modification. Chaque action externe reste soumise aux autorisations utilisateur.',
      ),
    ],
    sources: [
      {
        title: 'GitHub — serveur MCP distant et lecture seule',
        url: 'https://github.com/github/github-mcp-server/blob/main/docs/remote-server.md',
      },
      {
        title: 'GitHub — authentification MCP par PAT',
        url: 'https://github.com/github/github-mcp-server/blob/main/README.md',
      },
      {
        title: 'GitHub — jetons personnels et dépôts autorisés',
        url: 'https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens',
      },
    ],
  },
];

const englishGuideText = {
  'Que doit préparer l’application ?': 'What should the application prepare?',
  'Ces choix définissent le code et les accès à préparer, sans autoriser une action externe.':
    'These choices define the code and access to prepare without authorizing any external action.',
  'Envoyer des messages': 'Send messages',
  'Lire l’historique des conversations autorisées': 'Read authorized conversation history',
  'Dans quelles conversations ?': 'In which conversations?',
  'Le bot doit être invité dans les canaux choisis. Aucun accès à tous les canaux publics par défaut.':
    'The bot must be invited to the selected channels. No default access to all public channels.',
  'L’accès dépend des permissions accordées et des conversations accessibles à chaque compte.':
    'Access depends on granted permissions and conversations available to each account.',
  'Canaux publics choisis': 'Selected public channels',
  'Canaux privés choisis': 'Selected private channels',
  'Canaux publics accessibles': 'Accessible public channels',
  'Canaux privés accessibles': 'Accessible private channels',
  'Messages directs accessibles': 'Accessible direct messages',
  'Chaque utilisateur de votre application devra autoriser son propre compte Slack. Ce parcours prépare cette intégration ; DevMethod ne la fournit pas nativement.':
    'Each application user must authorize their own Slack account. This guide prepares that integration; DevMethod does not provide it natively.',
  'Préparer une intégration API côté serveur. Aucune installation Slack ni connexion API n’est effectuée par ce guide.':
    'Prepare a server-side API integration. This guide performs no Slack installation or API connection.',
  'Le MCP Notion peut exposer lecture et modification selon le compte et les outils autorisés. Le choix ci-dessous exprime une intention, pas une restriction technique OAuth.':
    'Notion MCP may expose reading and editing depending on the account and authorized tools. The choice below expresses intent, not a technical OAuth restriction.',
  'Quel travail préparer ?': 'What work should be prepared?',
  'Consulter du contenu pour comprendre le projet': 'Read content to understand the project',
  'Préparer des propositions de modification': 'Prepare proposed changes',
  'Toute écriture externe nécessite une autorisation distincte de l’utilisateur.':
    'Every external write requires separate user authorization.',
  'Quelles informations utiliser ?': 'Which information should be used?',
  Projets: 'Projects',
  Commentaires: 'Comments',
  'Quel contexte GitHub utiliser ?': 'Which GitHub context should be used?',
  'Ces choix préparent le travail de l’assistant. Les dépôts et droits réellement accessibles se règlent dans le jeton GitHub.':
    'These choices prepare the assistant’s work. Actual repository access and permissions are configured in the GitHub token.',
  'Code et fichiers des dépôts': 'Repository code and files',
  'Séparer identité, fonctionnalités et conversations avant de préparer une intégration API.':
    'Separate identity, features and conversations before preparing an API integration.',
  'Un bot pour l’application': 'A bot for the application',
  'Un compte utilisateur pour l’application': 'A user account for the application',
  'Chaque utilisateur connecte son compte': 'Each user connects their account',
  'Slack — types de tokens': 'Slack — token types',
  'Slack — OAuth et scopes bot/user': 'Slack — OAuth and bot/user scopes',
  'Slack — historique public': 'Slack — public history',
  'Slack — historique privé': 'Slack — private history',
  'Slack — historique des messages directs': 'Slack — direct message history',
  'Slack — PKCE et restrictions desktop': 'Slack — PKCE and desktop restrictions',
  'Préparer le contexte ou la documentation du projet avec le MCP officiel, sous les permissions du compte connecté.':
    'Prepare project context or documentation with the official MCP server, under the connected account’s permissions.',
  'Contexte de l’assistant': 'Assistant context',
  'Documentation du projet': 'Project documentation',
  'Notion — construire un client MCP': 'Notion — build an MCP client',
  'Notion — métadonnées OAuth officielles': 'Notion — official OAuth metadata',
  'Choisir une connexion MCP en lecture seule ou capable de modifications avant de préparer son usage.':
    'Choose a read-only or write-capable MCP connection before preparing its use.',
  'Consulter Linear': 'Read Linear',
  'Utiliser le point d’entrée officiel /mcp/readonly, qui expose des outils de lecture seule.':
    'Use the official /mcp/readonly endpoint, which exposes read-only tools.',
  'Préparer des modifications Linear': 'Prepare Linear changes',
  'Le point d’entrée standard peut exposer des outils de modification. Chaque action externe reste soumise aux autorisations utilisateur.':
    'The standard endpoint may expose editing tools. Each external action remains subject to user authorization.',
  'Linear — serveur MCP et lecture seule': 'Linear — MCP server and read-only access',
  'Connecter le serveur MCP officiel avec un jeton personnel GitHub (PAT). La lecture seule est proposée en premier ; l’API de votre application reste une intégration distincte.':
    'Connect the official MCP server with a GitHub personal access token (PAT). Read-only access is offered first; your application’s API remains a separate integration.',
  'Consulter GitHub en lecture seule': 'Read GitHub with read-only access',
  'Le point d’entrée /mcp/readonly expose uniquement les outils de lecture du serveur. Il ne retire pas les autres droits du jeton.':
    'The /mcp/readonly endpoint exposes only the server’s read tools. It does not remove other token permissions.',
  'Préparer des modifications GitHub': 'Prepare GitHub changes',
  'GitHub — serveur MCP distant et lecture seule':
    'GitHub — remote MCP server and read-only access',
  'GitHub — authentification MCP par PAT': 'GitHub — MCP authentication with a PAT',
  'GitHub — jetons personnels et dépôts autorisés':
    'GitHub — personal access tokens and authorized repositories',
};

export function projectConnectorGuides(locale = 'en') {
  const guides = structuredClone(connectorGuideDefinitions);
  if (locale === 'fr') return guides;

  function presentation(value) {
    if (Array.isArray(value)) return value.map(presentation);
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        ['title', 'description'].includes(key) && typeof entry === 'string'
          ? (englishGuideText[entry] ?? entry)
          : presentation(entry),
      ]),
    );
  }

  return presentation(guides);
}
