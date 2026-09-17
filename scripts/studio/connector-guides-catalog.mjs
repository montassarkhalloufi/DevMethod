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
];
