import { translateStudioError } from '../../../../../scripts/studio/public/error-messages.js';
import { translate } from '../../../i18n';

const labels: Record<string, string> = {
  'À configurer': 'Needs configuration',
  'Échec de la vérification de connexion': 'Connection check failed',
  'Disponibilité attestée par l’agent hôte': 'Availability attested by the host agent',
  'Configuré · connexion à vérifier': 'Configured · connection needs checking',
  'à préciser dans l’hôte': 'to specify in the host',
  'Utiliser uniquement les accès autorisés dans l’agent hôte. Ne pas envoyer de message, provisionner ou modifier les données pour cette vérification.':
    'Use only access authorized in the host agent. Do not send messages, provision services or modify data for this check.',
  'Publier le résultat via le bridge worker POST /api/connectors/probe avec connectionId, connectionVersion, eventId unique, status available ou failed, tool {name, version}, capabilities, observedAt, summary et tools si MCP. Ne publier available qu’après une réponse réelle ; une configuration ne prouve pas la connexion. Aucune clé ni sortie sensible dans le rapport.':
    'Publish the result through the worker bridge POST /api/connectors/probe with connectionId, connectionVersion, a unique eventId, status available or failed, tool {name, version}, capabilities, observedAt, summary and tools for MCP. Publish available only after a real response; configuration does not prove connectivity. No secrets or sensitive output in the report.',
  'La configuration a changé. Vos réponses sont conservées ; relisez la version enregistrée avant de les remplacer.':
    'Configuration changed. Your answers are preserved; review the saved version before replacing them.',
  'Documentation officielle ↗': 'Official documentation ↗',
  'Configuration avancée': 'Advanced configuration',
  'Profil dans l’agent hôte': 'Profile in the host agent',
  'Références des accès, une par ligne': 'Access references, one per line',
  'Indiquez les noms des accès conservés dans l’hôte. Ne collez aucune clé secrète. Enregistrer ne connecte ni n’installe un service.':
    'Enter the names of access profiles stored in the host. Do not paste secret keys. Saving does not connect or install a service.',
  'Enregistrer les réglages': 'Save settings',
  'Enregistrer la configuration': 'Save configuration',
  'Enregistrez les réglages avant de préparer une demande avec cette configuration.':
    'Save settings before preparing a request with this configuration.',
  'Préparer la vérification de connexion →': 'Prepare connection check →',
  'Contrôle à exécuter': 'Check to run',
  'Capacité à intégrer': 'Capability to integrate',
  'Préparer l’exécution avec l’agent hôte →': 'Prepare execution with the host agent →',
  'Préparer l’intégration au projet →': 'Prepare project integration →',
  'Une version du projet est nécessaire.': 'A project version is required.',
  'Le résultat reçu sera rattaché aux sources contrôlées.':
    'The received result will be linked to the checked sources.',
  'La demande prépare une évolution du code. Aucun service n’est provisionné et aucun e-mail n’est envoyé.':
    'This request prepares a code change. No service is provisioned and no email is sent.',
  'Portée et limites': 'Scope and limits',
  'Toutes les catégories': 'All categories',
  'Usage des connecteurs': 'Connector usage',
  'Services de l’application': 'Application services',
  'Diagnostic et vérifications': 'Diagnostics and checks',
  'Rechercher un outil ou un service': 'Search for a tool or service',
  'Rechercher un outil ou un service…': 'Search for a tool or service…',
  'Catégories des connecteurs': 'Connector categories',
  Catégories: 'Categories',
  Catégorie: 'Category',
  'État de configuration': 'Configuration status',
  Tous: 'All',
  Configurés: 'Configured',
  'Solutions proposées': 'Available options',
  Local: 'Local',
  'Aucune solution dans ce filtre': 'No options match this filter',
  'Aucun connecteur configuré ne correspond. Consultez Tous pour parcourir les options.':
    'No configured connector matches. Select All to browse the options.',
  'Essayez une autre recherche ou une autre catégorie.': 'Try another search or category.',
  'Plusieurs réponses possibles': 'Multiple answers allowed',
  'Préparation uniquement · Aucun nouvel accès connecté':
    'Preparation only · No new access connected',
  'Permissions prévues': 'Planned permissions',
  'Elles expliquent les accès à demander. Elles ne prouvent pas un consentement.':
    'These describe access to request. They do not prove consent.',
  'Aucune permission détaillée dans cette préparation.':
    'No permissions detailed in this preparation.',
  'Éléments à préparer': 'Items to prepare',
  'Éléments à préparer ou à vérifier': 'Items to prepare or check',
  'Aucun prérequis supplémentaire déclaré par le guide.':
    'No additional prerequisites declared by the guide.',
  'Utiliser cette préparation': 'Use this preparation',
  'Préparer une intégration': 'Prepare an integration',
  'À quoi ce service doit-il servir ?': 'What should this service do?',
  'Outils de l’agent': 'Agent tools',
  'Comptes de vos utilisateurs': 'Your users’ accounts',
  'Votre application': 'Your application',
  '· Identité prévue :': '· Intended identity:',
  'Ces réponses préparent le travail de l’agent. Ne saisissez aucune clé ni aucun jeton.':
    'These answers prepare the agent’s work. Do not enter keys or tokens.',
  'Préparation du résumé et des permissions…': 'Preparing the summary and permissions…',
  'Vos réponses sont conservées. Vérifiez la préparation pour afficher un résumé à jour.':
    'Your answers are preserved. Check the preparation to display an updated summary.',
  'Sources et documentation': 'Sources and documentation',
  'Trouvez les services de votre application et les outils pour la vérifier. Configuration et disponibilité restent distinctes.':
    'Find services for your application and tools to check it. Configuration and availability remain distinct.',
  'Actualiser les états': 'Refresh statuses',
  'Aucun état de connexion confirmé.': 'No connection status confirmed.',
  'Lecture du catalogue…': 'Loading catalog…',
  'Ce que DevMethod prend en charge': 'What DevMethod supports',
  'Étapes de préparation': 'Preparation steps',
  Usage: 'Usage',
  Configuration: 'Configuration',
  Vérification: 'Verification',
  'Préciser la configuration →': 'Specify configuration →',
  'Vérifier la préparation →': 'Check preparation →',
  'Réessayer la préparation': 'Retry preparation',
  'Vérifier la préparation': 'Check preparation',
  'Lecture du guide fournisseur…': 'Loading provider guide…',
  'Réessayer le guide': 'Retry guide',
  'Réessayer l’enregistrement': 'Retry saving',
  'Vérifiez la préparation avant d’enregistrer ces réponses avec les réglages.':
    'Check the preparation before saving these answers with the settings.',
  'Le guide ne répond pas. Réessayez.': 'The guide is not responding. Try again.',
  'Guides indisponibles.': 'Guides unavailable.',
  'Le service des connecteurs ne répond pas.': 'The connector service is not responding.',
  'Catalogue illisible. Aucun état de connexion confirmé.':
    'Unreadable catalog. No connection status confirmed.',
  'Le catalogue concerne une autre version.': 'The catalog belongs to another version.',
  'Chargement impossible.': 'Unable to load.',
  'Action non confirmée. Actualisez pour vérifier.': 'Action not confirmed. Refresh to check.',
  'La préparation concerne d’autres réponses. Réessayez.':
    'The preparation belongs to different answers. Try again.',
  'Préparation impossible. Vos réponses sont conservées.':
    'Unable to prepare. Your answers are preserved.',
  'Disponibilité attestée': 'Availability attested',
  'Connexion à revoir': 'Review connection',
  'Configuré · à vérifier': 'Configured · needs checking',
  'Enregistrement indisponible. Vos réponses locales sont conservées ; réessayez.':
    'Saving unavailable. Your local answers are preserved; try again.',
  'Brouillon non enregistré ou modifié ailleurs. Vos réponses sont conservées. Réessayez pour enregistrer cette saisie.':
    'Draft not saved or changed elsewhere. Your answers are preserved. Retry to save this input.',
  'Brouillon du guide illisible.': 'Unreadable guide draft.',
  'Le brouillon concerne un autre guide.': 'The draft belongs to another guide.',
  'Les brouillons du guide sont illisibles.': 'Unreadable guide drafts.',
  'Les réponses du guide sont illisibles.': 'Unreadable guide answers.',
  'Les guides sont illisibles. Actualisez pour réessayer.':
    'Unreadable guides. Refresh to try again.',
  'La préparation reçue est illisible. Aucun accès n’est confirmé.':
    'Unreadable preparation received. No access confirmed.',
  '+ Ajouter un serveur personnalisé': '+ Add a custom server',
  'Vérifiez les informations du serveur.': 'Check the server information.',
  'Nom du serveur': 'Server name',
  'Mon espace documentaire': 'My documentation workspace',
  'Adresse MCP': 'MCP address',
  Authentification: 'Authentication',
  'Jeton Bearer': 'Bearer token',
  'Sans authentification': 'No authentication',
  'Jeton de connexion': 'Connection token',
  'Transmis au gestionnaire local. Il n’est jamais ajouté à votre demande.':
    'Sent to the local manager. Never added to your request.',
  'Fermer les réglages': 'Close settings',
  'Connecter le serveur': 'Connect server',
  Notion: 'Notion',
  Linear: 'Linear',
  'Connecté ·': 'Connected ·',
  'outils découverts': 'tools discovered',
  'Utilisé dans ce projet. Disponible pour la prochaine mission.':
    'Used in this project. Available for the next mission.',
  'Utiliser dans ce projet': 'Use in this project',
  Reconnecter: 'Reconnect',
  Connecter: 'Connect',
  'Terminez l’autorisation dans la fenêtre du fournisseur.':
    'Complete authorization in the provider’s window.',
  'Vérification de la connexion…': 'Checking connection…',
  'Votre accord est nécessaire': 'Your approval is required',
  'Action en cours': 'Action in progress',
  'Résultat reçu': 'Result received',
  'Action refusée': 'Action denied',
  'Demande expirée': 'Request expired',
  'Demande annulée': 'Request cancelled',
  'Résultat inconnu': 'Unknown outcome',
  'Actions des connecteurs': 'Connector actions',
  'Réessayer l’actualisation': 'Retry refresh',
  'Destination :': 'Destination:',
  'Paramètres exacts de l’action': 'Exact action parameters',
  'Accord unique pour ces paramètres, valable jusqu’à':
    'One-time approval for these parameters, valid until',
  '. Les règles durables se modifient dans la fiche du connecteur.':
    '. Change ongoing rules in the connector details.',
  Refuser: 'Deny',
  'Autoriser cette action': 'Allow this action',
  'L’opération a pu avoir lieu chez le fournisseur. Vérifiez son résultat avant de demander une nouvelle action.':
    'The operation may have occurred at the provider. Check its outcome before requesting another action.',
  'Le fournisseur a signalé une erreur': 'The provider reported an error',
  'Voir le résultat': 'View result',
  'Consultez le code, les issues et les pull requests avec l’assistant.':
    'Read code, issues and pull requests with the assistant.',
  'Retrouvez le contexte et préparez la documentation de vos projets.':
    'Find context and prepare project documentation.',
  'Suivez les issues et préparez les mises à jour de votre équipe.':
    'Track issues and prepare team updates.',
  'Ajoutez les outils de ce service au contexte de l’assistant.':
    'Add this service’s tools to the assistant’s context.',
  'Utilisé dans ce projet': 'Used in this project',
  'Fermer la fiche': 'Close details',
  'Compte et permissions': 'Account and permissions',
  'Connexion partagée': 'Shared connection',
  'L’identité du compte n’est pas fournie par ce serveur. Les droits du compte sont ceux accordés chez le fournisseur.':
    'This server does not provide the account identity. Account permissions are those granted at the provider.',
  'Authentification :': 'Authentication:',
  'Jeton personnel': 'Personal token',
  'Documentation du service ↗': 'Service documentation ↗',
  'Reconnectez ce service pour vérifier ses outils et régler leurs permissions.':
    'Reconnect this service to check its tools and set their permissions.',
  'Utiliser pour ce projet': 'Use for this project',
  'Actualiser les outils': 'Refresh tools',
  'Annuler la connexion': 'Cancel connection',
  Déconnecter: 'Disconnect',
  'Serveurs MCP de l’espace': 'Workspace MCP servers',
  'Connectez vos sources et outils une fois, puis choisissez ceux à utiliser dans chaque projet.':
    'Connect your sources and tools once, then choose which ones to use in each project.',
  'Actualiser les connexions': 'Refresh connections',
  'Lecture des connexions…': 'Loading connections…',
  'Autorisez l’accès dans la fenêtre ouverte. Cet écran se mettra à jour après confirmation.':
    'Authorize access in the opened window. This screen will update after confirmation.',
  'Vérification de la connexion et découverte des outils…':
    'Checking connection and discovering tools…',
  'Ouvrez ce projet depuis l’accueil Studio pour accéder aux connexions de l’espace.':
    'Open this project from Studio home to access workspace connections.',
  'Connexions de l’espace': 'Workspace connections',
  'Rechercher un serveur MCP': 'Search for an MCP server',
  'Rechercher une connexion…': 'Search connections…',
  'Aucune connexion ne correspond à cette recherche.': 'No connection matches this search.',
  'Aucun serveur MCP connecté pour le moment.': 'No MCP server connected yet.',
  'Ajouter un serveur': 'Add a server',
  'Choisir l’usage et connecter': 'Choose usage and connect',
  'Connecter avec un jeton ciblé': 'Connect with a scoped token',
  'Connecter avec OAuth': 'Connect with OAuth',
  'Les permissions contrôlent les appels du pont MCP DevMethod. Elles ne contrôlent pas les outils utilisés directement par l’agent hôte. Ces connexions servent au contexte et aux outils de l’agent, pas aux API intégrées dans votre application.':
    'Permissions control calls through the DevMethod MCP bridge. They do not control tools used directly by the host agent. These connections provide agent context and tools, not APIs integrated into your application.',
  'Jeton personnel GitHub ciblé': 'Scoped GitHub personal token',
  'Limitez le jeton aux dépôts nécessaires dans GitHub. Il reste dans le stockage privé local, hors de la demande et des exports. Le questionnaire ne modifie pas ses droits.':
    'Limit the token to the required repositories in GitHub. It stays in private local storage, outside requests and exports. The questionnaire does not change its permissions.',
  'Créer un jeton ciblé sur GitHub ↗': 'Create a scoped token on GitHub ↗',
  'Connecter GitHub': 'Connect GitHub',
  'Vérifiez l’expiration du jeton, ses permissions et les restrictions de votre organisation, puis saisissez-le à nouveau.':
    'Check the token’s expiration, permissions and organization restrictions, then enter it again.',
  'Permissions de l’assistant': 'Assistant permissions',
  'Ce que l’assistant peut faire': 'What the assistant can do',
  'Ces règles s’appliquent aux appels du pont MCP DevMethod dans tous les projets utilisant cette connexion. Chaque nouvel outil demande votre accord.':
    'These rules apply to DevMethod MCP bridge calls across projects using this connection. Each new tool requires your approval.',
  'Relire les permissions': 'Reload permissions',
  'Lecture des permissions…': 'Loading permissions…',
  'Tous les outils de cette connexion': 'All tools in this connection',
  Personnalisé: 'Custom',
  'Une restriction prend effet immédiatement. Un élargissement durable s’applique à la prochaine mission. « Autoriser » permet l’exécution sans accord ponctuel.':
    'Restrictions take effect immediately. Broader ongoing access applies to the next mission. “Allow” permits execution without one-time approval.',
  'Rechercher un outil': 'Search for a tool',
  'Permission pour': 'Permission for',
  'Aucun outil à afficher.': 'No tools to display.',
  'Serveurs MCP pour ce projet': 'MCP servers for this project',
  'À reconnecter': 'Needs reconnection',
  Connecté: 'Connected',
  'Gérer les MCP': 'Manage MCP',
  'Utilisation dans les projets indisponible.': 'Connection usage across projects is unavailable.',
  'Projets utilisant cette connexion': 'Projects using this connection',
  Actualiser: 'Refresh',
  'Aucun projet enregistré ne sélectionne cette connexion.':
    'No registered project selects this connection.',
  'projet(s) indisponible(s) : leur sélection reste inconnue.':
    'project(s) unavailable: their selection remains unknown.',
  'La liste des projets est disponible depuis l’accueil.':
    'The project list is available from home.',
  'Lecture des projets…': 'Loading projects…',
  'Retour aux outils': 'Back to tools',
  'Chargement du guide…': 'Loading guide…',
  'Ce guide est indisponible.': 'This guide is unavailable.',
  'Ajouter à ma demande': 'Add to my request',
  'Enregistrement des réponses…': 'Saving answers…',
  'La préparation décrit votre besoin. La connexion autorise séparément l’accès de l’assistant.':
    'Preparation describes your need. Connection separately authorizes the assistant’s access.',
  'Connexion en cours. Terminez l’autorisation dans la fenêtre ouverte.':
    'Connecting. Complete authorization in the opened window.',
  'connecté ·': 'connected ·',
  'Une connexion Linear avec accès standard est aussi sélectionnée. Retirez-la pour limiter les outils du projet à la lecture seule.':
    'A Linear connection with standard access is also selected. Remove it to limit this project’s tools to read-only access.',
  'Services préparés pour la demande': 'Services prepared for this request',
  '· Préparé': '· Prepared',
  'Retirer la préparation': 'Remove preparation',
  'Des réponses ont changé. Vérifiez la préparation puis ajoutez-la à la demande, ou retirez sa pastille.':
    'Answers have changed. Check the preparation and add it to the request, or remove its chip.',
  'Enregistrement des outils du projet…': 'Saving project tools…',
  'Réessayer la sélection': 'Retry selection',
  'Outils du projet': 'Project tools',
  'Fermer les outils MCP': 'Close MCP tools',
  'Ouvrez le projet depuis l’accueil Studio pour utiliser les connexions de l’espace.':
    'Open the project from Studio home to use workspace connections.',
  'La sélection s’applique aux prochaines demandes de ce projet. Désélectionner un serveur retire aussi son accès à une mission en cours.':
    'Selection applies to this project’s next requests. Deselecting a server also removes its access from an ongoing mission.',
  Terminé: 'Done',
  'Actions indisponibles.': 'Actions unavailable.',
  'Décision non enregistrée.': 'Decision not saved.',
  'La connexion MCP n’a pas abouti.': 'The MCP connection did not succeed.',
  'Autorisez les fenêtres de connexion pour ce site, puis réessayez.':
    'Allow connection windows for this site, then try again.',
  'Connexion du serveur MCP': 'MCP server connection',
  'Préparation de votre connexion sécurisée…': 'Preparing your secure connection…',
  'La fenêtre de connexion a été fermée. Reconnectez le serveur pour reprendre.':
    'The connection window was closed. Reconnect the server to resume.',
  'État MCP indisponible.': 'MCP status unavailable.',
  'La connexion a été interrompue. Réessayez.': 'The connection was interrupted. Try again.',
  'Le délai d’autorisation est écoulé. Relancez la connexion.':
    'Authorization timed out. Restart the connection.',
  'L’autorisation est nécessaire. Reconnectez le serveur.':
    'Authorization is required. Reconnect the server.',
  'Connexion MCP interrompue.': 'MCP connection interrupted.',
  'Une nouvelle autorisation est nécessaire. Cliquez sur Reconnecter.':
    'New authorization is required. Click Reconnect.',
  'La connexion doit être rétablie.': 'The connection needs to be restored.',
  'Mise à jour MCP impossible.': 'Unable to update MCP.',
  'Réglage non enregistré.': 'Setting not saved.',
  'La sélection MCP n’a pas été enregistrée.': 'The MCP selection was not saved.',
  'La sélection MCP reçue est illisible.': 'Unreadable MCP selection received.',
  'Sélection indisponible.': 'Selection unavailable.',
  'Vous pouvez sélectionner au maximum 12 serveurs MCP.': 'You can select up to 12 MCP servers.',
  'Sélection non enregistrée.': 'Selection not saved.',
  'Vous pouvez préparer jusqu’à 12 services par demande.':
    'You can prepare up to 12 services per request.',
  'Cette préparation ne propose pas de connexion MCP prise en charge.':
    'This preparation does not offer a supported MCP connection.',
  'accès standard': 'standard access',
  'La connexion MCP reçue est illisible. Actualisez son état.':
    'Unreadable MCP connection received. Refresh its status.',
  'La liste des serveurs MCP est indisponible.': 'The MCP server list is unavailable.',
  'Le serveur n’a pas renvoyé d’adresse d’autorisation.':
    'The server did not return an authorization address.',
  'L’adresse d’autorisation renvoyée est invalide.':
    'The returned authorization address is invalid.',
  Déconnecté: 'Disconnected',
  'Connexion en cours': 'Connecting',
  'Autorisation attendue': 'Awaiting authorization',
  'Connexion à rétablir': 'Connection needs restoring',
  'Indiquez un nom et l’adresse du serveur MCP.': 'Enter a name and the MCP server address.',
  'Utilisez une adresse HTTPS (ou HTTP locale) sans identifiant, paramètres ni fragment.':
    'Use an HTTPS address (or local HTTP) without credentials, query parameters or fragments.',
  'Saisissez le jeton de connexion.': 'Enter the connection token.',
  Autoriser: 'Allow',
  Demander: 'Ask',
  Interdire: 'Deny',
  'Action indisponible. Réessayez.': 'Action unavailable. Try again.',
  'Connexion MCP observée ·': 'MCP connection observed ·',
  'outils découverts. Les prérequis ci-dessous restent à vérifier.':
    'tools discovered. The prerequisites below still need checking.',
  'Prérequis à configurer': 'Prerequisites to configure',
  'À configurer :': 'To configure:',
  'Réponses transmises à l’agent': 'Answers sent to the agent',
  'Questionnaire annulé : la mission ou son contexte a changé.':
    'Questionnaire cancelled: the mission or its context changed.',
  'L’agent attend vos choix pour ce service.':
    'The agent is waiting for your choices for this service.',
  'Transmettre mes réponses à l’agent': 'Send my answers to the agent',
  Questionnaire: 'Questionnaire',
  'Revoir les réponses ·': 'Review answers ·',
  'Questions de la mission': 'Mission questions',
  'Relire les questionnaires': 'Reload questionnaires',
  'Questionnaire illisible.': 'Unreadable questionnaire.',
  'Guide incohérent.': 'Inconsistent guide.',
  'Réponses incohérentes.': 'Inconsistent answers.',
  'Prérequis illisibles.': 'Unreadable prerequisites.',
  'Questionnaires illisibles.': 'Unreadable questionnaires.',
  'Questionnaire d’une autre mission refusé.': 'Questionnaire from another mission rejected.',
  'Questionnaire différent.': 'Different questionnaire.',
  'Réponses non enregistrées ou questionnaire modifié. Votre saisie est conservée. Réessayez après avoir relu son état.':
    'Answers not saved or questionnaire changed. Your input is preserved. Review its status and try again.',
  'Réponse non transmise. Votre saisie est conservée ; relisez le questionnaire avant de réessayer.':
    'Answer not sent. Your input is preserved; review the questionnaire before trying again.',
  'Impossible de relire les questionnaires. Les réponses affichées sont conservées.':
    'Unable to reload questionnaires. Displayed answers are preserved.',
};

/** Only known interface copy is translated. Unknown text and stored user data remain intact. */
export function connectorText(text: string, locale: 'en' | 'fr') {
  if (!Object.hasOwn(labels, text)) return translateStudioError(text, locale);
  return translate(text, labels[text] ?? text, undefined, locale);
}

export function connectorMessage(
  fr: string,
  en: string,
  locale: 'en' | 'fr',
  values?: Record<string, string | number>,
) {
  return translate(fr, en, values, locale);
}
