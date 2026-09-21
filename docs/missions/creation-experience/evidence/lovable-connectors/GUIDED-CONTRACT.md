# Parcours guidés de connecteurs — cadre proposé

**Statut : proposition à discuter, 17 septembre 2026.** Ce document ne constitue ni une nouvelle décision d’architecture ni une fonctionnalité livrée. Il rapproche les contrats du code actuel et les documents officiels consultés. La navigation Lovable menée séparément reste une autre source de preuve. Aucun compte, secret, consentement OAuth, installation, appel métier ou envoi de message n’a été effectué pour cette recherche.

Les [huit scénarios UI terminés](SCENARIOS.md) complètent cette analyse documentaire. Ils confirment les variantes de formulaires et le guidage conversationnel, sans valider les droits annoncés dans les plans IA ni les intégrations proposées.

## 1. Partir de l’usage et de l’identité

Le premier choix compréhensible est « À quoi ce service doit-il servir ? », puis « Au nom de qui ? ». API et MCP décrivent une interface, pas une permission ou une identité. Une sélection dans le prompt ne suffit pas à connecter un service.

| Parcours                                 | Question proposée dans l’interface                                                                    | Identité et propriétaire                                                           | Exécution et preuve attendues                                                                      |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| API de l’application                     | « Votre application doit-elle envoyer des notifications ou lire des données avec un compte commun ? » | Compte de service ou bot lié au projet, conformément au périmètre DevMethod retenu | Backend de l’application ; accès et comportement intégrés vérifiés séparément                      |
| MCP pour l’agent                         | « L’assistant doit-il consulter ce service pour travailler sur vos projets ? »                        | Connexion MCP de l’espace local partagé, sélectionnée pour chaque projet/job       | Gestionnaire MCP et pont hôte existants ; OAuth/Bearer puis découverte réelle et appels bornés     |
| Compte propre à chaque utilisateur final | « Chaque utilisateur doit-il connecter son propre compte et ne voir que ses données ? »               | Client OAuth de l’application, autorisation distincte par utilisateur              | Backend multi-identités, isolation et révocation par utilisateur ; capacité non livrée aujourd’hui |
| Authentification à l’application         | « Slack sert-il uniquement à vous identifier dans l’application ? »                                   | Identité OIDC ; distincte de l’accès aux messages                                  | Session applicative et validation des jetons d’identité ; aucun droit de messagerie déduit         |

Lovable décrit une connexion **App + chat** utilisant un compte commun dans l’agent et l’app, avec liaison au projet ; **App user** sert les comptes individuels. Ses connexions **Chat** sont des accès MCP de construction. Ce sont des repères de produit, pas une équivalence de capacités avec DevMethod. Sources : [App + chat](https://docs.lovable.dev/integrations/app-connectors), [Chat/MCP](https://docs.lovable.dev/integrations/chat-connectors), [recherche antérieure App user](RESEARCH.md#app-user--client-commun-comptes-individuels). La page App user a échoué à la nouvelle consultation ; ses détails fournisseur ne sont pas reconfirmés ici.

Un serveur MCP personnalisé ne doit pas être présenté comme une API applicative prête à intégrer. Dans Lovable, [Custom MCP](https://docs.lovable.dev/integrations/custom-mcp) et [Custom connector REST](https://docs.lovable.dev/integrations/create-connector) sont également des objets différents. Dans DevMethod, le premier réutilise le gestionnaire MCP ; le second réclame un contrat applicatif et un stockage de credentials adaptés, pas un changement de badge.

## 2. Slack : questions utiles et permissions expliquées

Le guidage doit demander successivement : objectif concret, identité souhaitée, type d’accès nécessaire, existence d’une app Slack et backend disponible. « Je ne sais pas encore » conserve une question ouverte ; il ne choisit pas silencieusement l’accès le plus large.

| Choix utilisateur                                                    | Traduction technique proposée                                                          | Explication visible                                                                                                                                       |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| « Envoyer les notifications de mon app dans les canaux choisis »     | Bot Slack ; commencer avec `chat:write`, puis inviter le bot dans les canaux concernés | « Les messages portent le nom de votre application. L’accès n’inclut pas automatiquement l’historique des conversations. »                                |
| « Publier aussi dans des canaux publics où le bot n’est pas membre » | Ajouter explicitement `chat:write.public` au bot, en plus de `chat:write`              | « Étend l’envoi aux canaux publics dont le bot n’est pas membre. » Ce choix n’est pas présélectionné.                                                     |
| « Agir comme moi »                                                   | OAuth utilisateur ; scopes utilisateur séparés de ceux du bot                          | « Les actions sont effectuées avec votre identité Slack et vos accès. » Une seule autorisation du constructeur n’équipe pas tous les utilisateurs finaux. |
| « Consulter Slack pour aider l’assistant »                           | Parcours MCP utilisateur et app Slack enregistrée ; outils de lecture choisis          | « Le contexte accessible dépend de votre compte et des permissions accordées. Aucun droit d’écriture n’est supposé par cette demande. »                   |
| « Se connecter à mon app avec Slack »                                | Parcours OpenID Connect séparé                                                         | « Sert à identifier les personnes ; ne permet pas de lire ou publier leurs messages. »                                                                    |

Les [tokens Slack](https://docs.slack.dev/authentication/tokens/) distinguent le bot, rattaché à l’application, et le token utilisateur, rattaché à la personne. [`chat:write`](https://docs.slack.dev/reference/scopes/chat.write/) existe pour les deux ; [`chat:write.public`](https://docs.slack.dev/reference/scopes/chat.write.public/) étend l’envoi du bot et exige aussi `chat:write`. Ne pas proposer les anciens scopes globaux `bot` ou `chat:write:user` comme configuration moderne.

Pour l’OAuth d’installation, les scopes bot vont dans `scope`, les scopes utilisateur dans `user_scope` ; la réponse distingue le bot et `authed_user`. Les permissions réellement accordées doivent être conservées séparément des permissions demandées. Les réautorisations peuvent cumuler des scopes : une case décochée dans DevMethod ne révoque pas à elle seule un droit chez Slack. [OAuth Slack](https://docs.slack.dev/authentication/installing-with-oauth/).

« Se connecter avec Slack » utilise des endpoints OpenID et les scopes `openid`, `profile`, `email` selon le besoin. Ce flux ne doit pas être mélangé avec l’autorisation d’API de messagerie. [Sign in with Slack](https://docs.slack.dev/authentication/sign-in-with-slack/).

### Prérequis MCP Slack qui changent réellement le parcours

Le service officiel expose `https://mcp.slack.com/mcp` en Streamable HTTP. **Pas de Dynamic Client Registration** : une app Slack enregistrée est requise ; seules les apps internes ou publiées au Marketplace sont admises, pas les apps « unlisted ». Le parcours OAuth utilisateur dédié utilise `oauth/v2_user/authorize` et `oauth.v2.user.access`. Les scopes varient selon la recherche, la lecture ou l’écriture demandée. Les [documents MCP Slack](https://docs.slack.dev/ai/slack-mcp-server/) et les [métadonnées publiques](https://mcp.slack.com/.well-known/oauth-authorization-server) ont été consultés ; aucune autorisation réelle n’a été tentée.

PKCE est désormais documenté, mais son activation sur l’app est irréversible sans intervention du support. Les redirections desktop, dont localhost lorsque PKCE est activé, **ne peuvent pas demander des scopes bot**. Le guide doit donc distinguer OAuth serveur/bot et client public/utilisateur ; il ne doit pas activer ce réglage automatiquement ni promettre que le callback loopback actuel convient à un bot. Le fonctionnement exact du callback DevMethod `127.0.0.1` reste à recetter avec une app Slack réelle. [PKCE Slack](https://docs.slack.dev/authentication/using-pkce/).

L’assistant peut préparer un manifeste, expliquer chaque permission, proposer les variables serveur nécessaires et générer l’intégration locale autorisée. Créer une app chez Slack, changer ses réglages irréversibles, élargir les scopes ou envoyer un message restent des actions distinctes dont l’autorisation doit être établie.

## 3. Variantes Notion et Linear

| Fournisseur | Guidage pertinent                                                                                                                                                                         | Ce qu’il ne faut pas promettre                                                                                                                                               |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Notion MCP  | Compte/espace visé, documents nécessaires, consultation ou modifications souhaitées ; puis OAuth interactif avec PKCE et enregistrement dynamique, identité observée et découverte réelle | Une clé API de l’intégration Notion n’est pas interchangeable avec la connexion MCP hébergée ; ne pas inventer une garantie serveur « lecture seule » à partir d’une case UI |
| Linear MCP  | Choisir « consulter » ou « consulter et modifier » ; proposer la variante officielle `/mcp/readonly` ou le scope OAuth `read` pour une borne réellement imposée par Linear                | Le preset DevMethod actuel `/mcp` ne devient pas readonly grâce au libellé d’une préférence ; endpoint/scope/grant doivent correspondre                                      |

Sources officielles : [client MCP Notion](https://developers.notion.com/guides/mcp/build-mcp-client), [connexion Notion MCP](https://developers.notion.com/guides/mcp/get-started-with-mcp), [MCP Linear](https://linear.app/docs/mcp). Notion et Linear documentent DCR, contrairement à Slack. Notion impose aussi une gestion persistante et sérialisée du renouvellement rotatif ; `invalid_grant` appelle une reconnexion, pas une boucle de tentatives.

## 4. Contrat minimal proposé

### Définition serveur du guide

Ajouter une définition de guide versionnée par fournisseur et parcours, avec `optionId`, `guideVersion`, `flows`, `questions`, `requirements`, `sources` et `support`. La définition est maintenue dans le code serveur ; le navigateur n’envoie ni HTML exécutable ni schéma arbitraire. Chaque question a un identifiant, une réponse typée et bornée, des choix autorisés, une condition d’affichage déclarative et une explication lisible de son impact. Les références techniques détaillées restent dépliables.

`flowId` doit déterminer les combinaisons autorisées d’usage, d’identité et de transport. Cela évite un formulaire permettant « bot + callback desktop + user scope » par assemblage libre. Les scopes sont **dérivés côté serveur** des actions choisies et des règles du fournisseur, avec une raison et une source ; ils ne sont pas un tableau libre choisi par le client.

Exemple de saisie proposée, sans secret et sans déclaration de connexion :

```json
{
  "optionId": "slack",
  "guideVersion": 1,
  "flowId": "slack-api-bot",
  "answers": {
    "intent": "notify-selected-channels",
    "appSetup": "create-internal",
    "channelAccess": "joined-channels",
    "backend": "to-prepare"
  }
}
```

Réponse dérivée proposée :

```json
{
  "status": "preparation-required",
  "normalized": { "optionId": "slack", "guideVersion": 1, "flowId": "slack-api-bot" },
  "identity": { "kind": "bot", "owner": "project", "transport": "api" },
  "permissions": [
    {
      "scope": "chat:write",
      "tokenKind": "bot",
      "reason": "Envoyer les notifications de l’application dans les canaux choisis",
      "sourceId": "slack-chat-write"
    }
  ],
  "prerequisites": [
    { "id": "slack-app", "status": "missing", "label": "Créer ou choisir votre application Slack" },
    {
      "id": "server-runtime",
      "status": "missing",
      "label": "Préparer un backend qui conserve l’accès Slack"
    }
  ],
  "canPrepareIntegration": true,
  "canConnectNatively": false,
  "connectionEvidence": null
}
```

Les statuts de prérequis doivent distinguer `missing`, `declared` et `observed`. Un utilisateur déclarant « j’ai créé l’app » ne produit pas une preuve OAuth. Le serveur renvoie aussi un `setupFingerprint` calculé sur définition, réponses normalisées et version ; le client ne peut pas le choisir. Les sources comportent URL officielle et date de vérification.

### Points d’entrée envisagés, pas encore implémentés

- `GET /api/connectors/guides?optionId=…` : définition et support réel, utilisable depuis l’accueil sans projet existant.
- `POST /api/connectors/guides/prepare` : validation et prévisualisation pure du plan ; aucun OAuth, appel fournisseur, installation ou sauvegarde implicite. Host/Origin/JSON contrôlés, corps au plus 64 Kio ; 12 préparations au plus dans un lancement.
- Sauvegarde explicite dans le projet : réutiliser le CAS `expectedVersion` de `/api/connectors/configure` en ajoutant un objet guidé versionné et des **références** d’accès par rôle, jamais leurs valeurs. Le format persistant et son lecteur strict doivent évoluer ensemble ; les configurations anciennes restent lisibles et marquées sans guide.
- `/api/connectors/prepare` peut recevoir une référence/version de préparation, puis produire le prompt et le contexte normalisé depuis le stockage serveur. Son usage actuel ciblant une révision appliquée reste strict ; le démarrage depuis zéro doit passer par le lancement Home, qui accepte encore une base nulle.

Rejeter les champs, questions, scopes ou fournisseurs inconnus ; chaînes et listes bornées ; identifiants/URLs propres au fournisseur. Une réponse d’étape cachée n’est pas conservée après changement de parcours. `secretRefs` reste composé de noms `env:…` ou `host:…` ; un champ libre de « token », un nom de champ trompeur ou une chaîne ressemblant à une clé ne devient jamais un moyen détourné de stocker un secret. Une future saisie de credential natif relève du gestionnaire sécurisé et de son endpoint séparé.

## 5. Raccord à l’intégration existante

L’état actuel apporte déjà les points utiles :

| Code actuel                                                  | Réutilisation / manque concret                                                                                                                                                                                         |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/studio/connectors.mjs`, `configureProjectConnector` | CAS, stockage séparé, références de secrets, invalidation du probe après reconfiguration. Aucun champ de réponses guidées, identité, scopes demandés/accordés aujourd’hui.                                             |
| `prepareConnectorIntegration`                                | Prompt d’intégration avec version de configuration et empreinte des sources. Attend une révision appliquée existante ; n’installe et ne connecte rien.                                                                 |
| `ConnectionDetail.tsx` et `connectors-controller.js`         | Retour au composer via `onPrepareRequest({prompt})`. Étendre de façon compatible avec une référence structurée de préparation ; ne pas faire du texte libre l’autorité des permissions.                                |
| `scripts/studio/home-launch.mjs`                             | `connectors[]` devient seulement une intention textuelle ; ajouter les réponses normalisées à la requête de lancement et à son empreinte de rejeu. Conserver `mcpConnectionIds` distinct.                              |
| `scripts/studio/jobs.mjs`                                    | Le contexte de claim connaît MCP, mais pas un contrat d’intégration guidée. Fournir les préparations explicitement sélectionnées avec version/fingerprint et prérequis non résolus.                                    |
| `mcp-broker.mjs` et `mcp-selection.mjs`                      | Réutiliser le gestionnaire global et l’intersection sélection courante/snapshot du job ; un guide API ne modifie pas ces droits.                                                                                       |
| `mcp-oauth.mjs` / `mcp-contract.mjs`                         | Pas de parcours de saisie d’un client Slack préenregistré aujourd’hui. Le guide Slack MCP doit afficher ce manque avant une promesse de connexion native.                                                              |
| `runner.mjs`                                                 | Le runner natif interdit réseau et installation de paquets. Une préparation de dépendances ou un manifeste généré ne doit pas devenir « installé ». Le pont hôte reste le chemin distinct pour les actions autorisées. |

Au lancement ou à l’envoi volontaire du prompt, le serveur doit revalider les préparations et figer celles de la demande : ID/version de configuration, guideVersion, réponses normalisées, usage, identité, permissions demandées, accès **observés** s’ils existent, références de secrets, sources officielles et inconnues. Un snapshot par job, analogue au snapshot MCP, permet de les conserver sans recalcul depuis une configuration qui aurait changé pendant le travail. Une édition du guide en cours de job invalide les conclusions dépendantes ; elle ne change pas silencieusement l’autorisation de la mission.

Le prompt généré dit concrètement ce que l’assistant doit préparer, quels fichiers/contrats du backend sont concernés, comment les accès sont résolus, quelles décisions restent ouvertes et quels contrôles rendent la fonctionnalité vérifiable. « Préparer l’intégration » peut remplir le composer ; c’est son envoi explicite qui ouvre une demande. Il ne doit pas effacer le brouillon utilisateur ni démarrer un nouveau job en arrière-plan.

L’expérience doit séparer trois axes visibles : **préparation** (incomplète/prête), **accès** (non connecté/autorisé/vérifié/à reconnecter) et **fonctionnalité** (non implémentée/candidate/testée). Une seule pastille verte « connecté » ne décrit pas ces états. Les anciens probes restent des observations rapportées par l’hôte ; ils ne sont pas requalifiés en consentement OAuth natif.

## 6. Erreurs, reprise et preuves

| Situation                                                | Résultat proposé                                                               | Reprise et texte utile                                                                                      |
| -------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Réponse inconnue ou combinaison impossible               | 400 `invalid-answers`, erreurs indexées par question                           | Conserver les réponses compatibles ; expliquer le choix à corriger, sans renvoyer de valeur secrète         |
| Guide/configuration ou base du projet modifié            | 409 `guide-stale` / `configuration-stale` / `revision-stale`                   | Conserver le brouillon, recharger le guide et montrer ce qui a changé ; ne pas écraser le formulaire        |
| Installation fournisseur / client OAuth / backend absent | Plan retourné avec prérequis manquants, pas succès de connexion                | « Préparer ces éléments » reste possible ; la connexion effective indique précisément son obstacle          |
| Consentement refusé ou fermé                             | Accès non connecté, pas erreur de configuration effaçant les réponses          | Reprendre le même besoin ; nouveau consentement seulement à l’initiative utilisateur                        |
| Scope manquant                                           | Fonction affectée indisponible ; permissions demandées et accordées distinctes | Expliquer l’action bloquée et l’extension précise à autoriser ; ne pas demander tous les scopes             |
| Enregistrement dynamique non pris en charge              | `client-registration-required` ou support natif indisponible                   | Parcours app préenregistrée ; pas de boucle de reconnexion OAuth générique                                  |
| Jeton expiré/révoqué                                     | `reconnect-required`                                                           | Rafraîchissement conforme au fournisseur ; `invalid_grant` terminal ; pas de réessai infini                 |
| 429 / indisponibilité transitoire                        | Échec temporaire borné, état de travail conservé                               | Respecter le délai fournisseur pour une lecture rejouable ; ne pas rejouer une écriture ambiguë             |
| Timeout pendant une mutation externe                     | Effet externe inconnu                                                          | Vérifier chez le fournisseur avant de rejouer ; ne pas présenter l’expiration comme une annulation certaine |
| Même lancement, même clé et même empreinte               | Rejeu du résultat déjà connu                                                   | Inclure les réponses guidées dans le fingerprint Home ; même clé avec réponses différentes = 409            |

Pour une première tranche, la prévisualisation de guide peut rester pure et sa sauvegarde utiliser le CAS existant. N’ajouter une clé d’idempotence persistée que pour une action créatrice de job/ressource ; réutiliser le reçu de lancement Home au lieu d’inventer une garantie « exactement une fois » à distance.

| Affirmation produit         | Preuve minimale à exiger                                                                                                                                                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| « Préparation enregistrée » | Réponses validées, guide/version, fingerprint, CAS et relecture ; aucun accès réseau déduit                                                                                                                                                       |
| « Compte Slack reconnu »    | Réponse réelle et expurgée d’[`auth.test`](https://docs.slack.dev/reference/methods/auth.test/) avec identité/espace et date. Ce contrôle ne prouve pas l’envoi ni tous les scopes nécessaires.                                                   |
| « MCP connecté »            | Authentification terminée si requise, initialize/tools/list réellement réussis, informations du serveur et schémas bornés. Compte utilisateur, workspace et scopes restent « non observés » sans preuve spécifique ; pas seulement une URL saisie |
| « Intégration implémentée » | Diff et snapshot candidat de la révision exacte ; aucun faux appel, endpoint simulé ou succès d’installation                                                                                                                                      |
| « Fonctionnalité vérifiée » | Contrôle du parcours demandé sur la révision concernée, accès/périmètre identifiés, résultat et limites. Une fixture est nommée fixture ; un envoi Slack réel exige une autorisation précise.                                                     |
| « App user isolé »          | Deux identités distinctes et un test négatif de lecture/écriture entre comptes, révocation et renouvellement ; aucune réutilisation du token du constructeur                                                                                      |

Scénarios utiles à observer dans Lovable puis à traduire : Slack notification bot ; Slack action au nom de l’utilisateur ; Notion contexte MCP ; Linear consultation bornée ; API personnalisée ; compte individuel d’un utilisateur final. Pour chacun, relever les champs conditionnels, l’explication des permissions, les étapes externes nécessaires, les états après fermeture/refus et ce qui est réellement transmis au chat. Aucun nombre d’options de catalogue ne vaut preuve de ces parcours.

**Priorité proposée :** livrer d’abord la préparation guidée déterministe et son passage structuré au job, avec Slack API bot/utilisateur et Notion/Linear MCP. Puis traiter l’adaptateur de client OAuth préenregistré Slack et ses contraintes desktop. Le runtime App user, le stockage de grants multi-utilisateurs et l’exécution App + chat partagée constituent des tranches distinctes à décider et vérifier.
