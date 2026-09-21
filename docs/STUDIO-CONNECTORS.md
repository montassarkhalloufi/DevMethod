# Connexions MCP, outils de diagnostic et services applicatifs

Studio propose des options par capacité. Les diagnostics produisent des preuves qui
peuvent alimenter une demande de correction ; les services applicatifs préparent une
intégration dans une version du projet. Choisir un fournisseur ne l’installe pas et ne
l’active pas dans l’application. Les offres SaaS conservent leurs propres conditions ;
aucune gratuité de service n’est présumée.

Les sources officielles sont accessibles depuis chaque option : [ESLint](https://eslint.org/docs/latest/integrate/nodejs-api),
[Playwright](https://playwright.dev/docs/test-reporters), [Playwright MCP](https://github.com/microsoft/playwright-mcp),
[axe-core](https://www.deque.com/axe/axe-core/), [Sentry](https://docs.sentry.io/api/) et
[OpenTelemetry](https://opentelemetry.io/docs/) pour les diagnostics ;
[SMTP](https://nodemailer.com/smtp), [Mailpit](https://mailpit.axllent.org/docs/) et
[Resend](https://resend.com/docs/introduction) et [Brevo](https://developers.brevo.com/docs/getting-started) pour le mail ;
[PostgreSQL](https://www.postgresql.org/docs/current/), [Supabase](https://supabase.com/docs),
[Appwrite](https://appwrite.io/docs/) ou un backend existant pour les services ;
[Keycloak](https://www.keycloak.org/documentation) et [Auth0](https://auth0.com/docs) pour
l’identité. Le catalogue ne remplace pas le choix architectural du projet.

## Serveurs MCP de l’espace

Depuis l’accueil : Outils → Serveurs MCP de l’espace. Notion, Linear et Sentry proposent
un démarrage OAuth réel ; GitHub pour l’assistant utilise un jeton personnel ciblé, avec
un endpoint en lecture seule par défaut. Un serveur personnalisé accepte OAuth, Bearer ou aucun secret.
L’autorisation du fournisseur reste une étape explicite. Le statut connecté apparaît
seulement après initialisation et découverte des outils. « Utiliser pour ce projet »
active une connexion dans le prompt, sans la copier ni la connecter à nouveau.

Ces connexions sont communes aux projets ouverts depuis cette bibliothèque. Les credentials
restent dans son dossier privé `.mcp-private` (0700, fichier 0600), hors du projet et de
ses exports. Déconnecter efface les credentials locaux ; la révocation du consentement
s’effectue auprès du fournisseur. Après redémarrage, reconnecter ou actualiser vérifie
l’accès avant de retrouver le statut connecté.

Le pont hôte peut lire les outils ou les appeler pendant une demande en cours :

```sh
devmethod studio mcp tools --workspace /chemin/projet --file outils.json
devmethod studio mcp call --workspace /chemin/projet --file appel.json
```

`outils.json` contient `jobId`, `connectionId` et éventuellement `toolName` pour consulter
son schéma. `appel.json` contient `requestId` (identifiant stable recommandé), `jobId`,
`connectionId`, `toolName` et `arguments`. Une répétition identique restitue la même action.
Le CLI utilise l’authentification worker locale. Une connexion doit être sélectionnée lors
de la prise en charge et rester sélectionnée/active. L’outil, sa version et le schéma des
arguments sont vérifiés. Une sélection n’autorise pas toute écriture externe : l’agent
respecte la demande utilisateur et les consentements nécessaires.

La fiche « Compte et permissions » applique trois règles : Autoriser, Demander (défaut),
Interdire. Le pont retient la règle la plus restrictive entre le début de mission et
l’état courant. Les outils nouveaux ou modifiés demandent un nouvel accord. Pour Demander,
une carte affiche service, outil, destination et arguments ; seul le clic humain peut
accorder cette action, dans les dix minutes. Un résultat inconnu après interruption ne
se relance pas automatiquement. Les politiques ne contrôlent pas les outils externes
appelés directement par l’agent hôte.

Les guides Slack, Notion, Linear et GitHub conservent leurs étapes et réponses. L’agent
peut demander un questionnaire connu avec `devmethod studio guide-request --workspace …
--file demande.json`, puis lire les réponses avec `guide-responses`. Une préparation
n’est jamais présentée comme une connexion. Les interactions restent séparées du
contexte initial immuable, des propositions de design et du progrès déclaré. Voir les
[contrats et limites de l’ADR 026](ADR-026-connector-permissions-and-interactions.md).

Le runner natif accède aux connexions sélectionnées par un pont STDIO limité au job :
consultation des schémas, demande d’appel et lecture des résultats. Les accords restent dans
Studio ; le réseau du shell demeure désactivé. Le raccordement est testé avec un fournisseur
fictif, mais son utilisation par un vrai appel natif reste à valider. Voir
[ADR 031](ADR-031-native-scoped-tool-bridge.md). Un Studio ouvert directement sans
l’accueil indique l’indisponibilité du gestionnaire partagé. OAuth exige un fournisseur
compatible avec les métadonnées et l’enregistrement dynamique pris en charge ; aucun client
privé préenregistré n’est deviné. Les limites sont 32 connexions, 200 outils par connexion,
12 connexions sélectionnées. Voir [ADR 024](ADR-024-workspace-mcp.md).

## Catalogue par besoin

Le catalogue comporte 54 options dans 20 capacités, diagnostics compris. Les ajouts
ci-dessous s’appuient sur les documentations officielles consultées le 17 septembre 2026.
Ce sont des solutions à choisir et à préparer avec l’hôte, pas 54 intégrations natives
déjà connectées. Aucun tarif, forfait gratuit ni compatibilité avec tous les runtimes
n’est garanti. Chaque fiche précise le mode proposé, les coûts à examiner et les
prérequis concrets.

| Besoin applicatif | Options et documentation officielle | À préciser avant l’intégration |
| --- | --- | --- |
| Paiements et abonnements | [Stripe](https://docs.stripe.com/payments), [Paddle](https://developer.paddle.com/) | Compte, éligibilité, environnement de test, webhooks et traitement des erreurs ; aucun paiement depuis le panneau. |
| Commerce | [Shopify](https://shopify.dev/docs/api), [WooCommerce](https://developer.woocommerce.com/docs/apis/) | Boutique, catalogue, version et portées des API ; aucune commande créée. |
| Fichiers et stockage | [Amazon S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html), [Cloudflare R2](https://developers.cloudflare.com/r2/) | Bucket, accès privés, conservation et opérations compatibles ; aucun provisionnement. |
| IA | [OpenAI](https://developers.openai.com/api/docs), [Anthropic](https://platform.claude.com/docs/en/api/overview), [Gemini](https://ai.google.dev/gemini-api/docs), [Ollama local](https://docs.ollama.com/api/introduction) | Modèle, accès ou installation locale, données, budget et évaluations ; aucun modèle appelé ou téléchargé. |
| Dépôts et collaboration Git | [GitHub](https://docs.github.com/en/rest), [GitLab](https://docs.gitlab.com/api/rest/) | Dépôts, permissions et version d’instance ; aucun push, pipeline ou merge lancé. |
| Contenus et CMS | [Strapi](https://docs.strapi.io/cms/api/rest), [Directus](https://directus.com/docs/api), [Contentful](https://www.contentful.com/developers/docs/references/api-basics/), [Sanity](https://www.sanity.io/docs) | Schémas, datasets, droits de lecture/édition et distinction brouillon/publication. |
| Messages et notifications | [Slack](https://docs.slack.dev/apis/web-api/), [Discord](https://docs.discord.com/developers/intro), [Telegram](https://core.telegram.org/bots/api), [Twilio](https://www.twilio.com/docs/messaging/api), [Brevo](https://developers.brevo.com/docs/getting-started), [Gmail](https://developers.google.com/workspace/gmail/api/guides) | Application ou bot, destinataires et portées ; aucun message envoyé. Gmail est un accès à une boîte, pas un choix implicite de mail transactionnel. |
| Documents et organisation | [Notion](https://developers.notion.com/guides/get-started/overview), [Airtable](https://support.airtable.com/articles/6292134965-getting-started-with-airtable-s-web-api), [Google Calendar](https://developers.google.com/workspace/calendar/api/guides/overview) | Pages, bases ou agendas autorisés ; aucun document modifié ni invitation envoyée. |
| Mesure d’usage | [PostHog](https://posthog.com/docs), [Matomo](https://developer.matomo.org/), [Google Analytics](https://developers.google.com/analytics) | Événements utiles, propriété, données collectées et choix du projet ; aucune télémétrie activée. |
| Recherche applicative | [Meilisearch](https://www.meilisearch.com/docs/getting_started/overview), [Algolia](https://www.algolia.com/doc) | Instance, index et accès aux résultats ; aucune donnée indexée par la préparation. |
| Hébergement | [Cloudflare Workers](https://developers.cloudflare.com/workers/), [Vercel](https://vercel.com/docs), [Netlify](https://docs.netlify.com/) | Runtime, build, ressources, variables et domaine ; aucun déploiement lancé. |

Les choix existants de base, backend, authentification et mail restent disponibles.
Un service auto-hébergé comme Strapi ou Meilisearch peut être joint par API : le libellé
`API` ne signifie pas « SaaS obligatoire ». `Local` décrit l’option d’exécution proposée,
sans attester que le logiciel ou ses modèles sont installés. `MCP` décrit une interface
d’outils, pas un fournisseur ni un service applicatif autonome.

Pour une offre absente, « Backend existant / autre fournisseur » reste spécialisé dans
les contrats backend et données. « Autre API applicative » étend les demandes aux
capacités applicatives à partir d’un [contrat API](https://spec.openapis.org/oas/latest.html).
« Autre service via MCP » concerne un serveur déjà accessible à l’hôte, dont les outils
et opérations doivent être constatés avec le [protocole MCP](https://modelcontextprotocol.io/specification/2025-11-25/server/tools).
Les catégories possibles des options génériques ne sont pas des capacités attestées.
Un connecteur applicatif n’est pas utilisable comme outil de contrôle qualité ; les
entrées génériques de diagnostic ont un usage distinct et exigent un ticket de contrôle.

La couverture exécutable de Studio reste la même pour toutes ces offres : enregistrer
des références, recevoir un probe, préparer une demande versionnée, puis recevoir les
résultats de contrôle via le bridge diagnostic. Il n’y a ni SDK de ces fournisseurs,
ni connexion OAuth applicative, ni exécution distante incorporée à cette extension du catalogue.
Le gestionnaire MCP d’espace ci-dessus possède son propre contrat de connexion, distinct.
L’accès d’un agent à Gmail, Notion ou MCP ne configure pas les accès de l’application
déployée ; l’adaptateur et ses secrets runtime restent à réaliser et à vérifier.

## États et configuration

Une option du catalogue reste proposée tant qu’aucun connecteur n’a été configuré.
`configured` signifie que ses références sont enregistrées. `attested` signifie qu’un
hôte authentifié a rapporté des capacités disponibles à la date indiquée. `failed`
signifie que son dernier probe a échoué. Aucun de ces états ne prouve à lui seul qu’un
contrôle a réussi ou qu’un service applicatif est opérationnel.

`GET /api/connectors?revision=<id>` donne le catalogue et les configurations. Une
configuration envoyée à `POST /api/connectors/configure` contient :

```json
{"id":"lint-local","optionId":"eslint","purpose":"diagnostics","profileRef":"host:outils-locaux","secretRefs":[]}
```

Pour mettre à jour une configuration, ajouter son `expectedVersion` courant. Une mise à
jour incrémente sa version et retire l’ancienne attestation. `profileRef` référence
`host:nom`. Les seuls formats de secrets acceptés sont `env:NOM_VARIABLE` et
`host:nom-reference`. Ces références sont des noms ; Studio ne lit pas leur valeur.
Aucune clé, URL avec identifiants ou valeur d’environnement ne doit être enregistrée
dans ces objets ou dans les documents exportables. Les marqueurs sensibles reconnus
sont refusés, mais aucun détecteur ne peut garantir de reconnaître tout secret arbitraire.

## Probe rapporté par l’agent hôte

Le serveur réserve `POST /api/connectors/probe` à son token worker. L’agent hôte examine
les outils ou services déjà autorisés. Il rapporte la version de l’outil, les capacités
réellement constatées et, pour MCP, les outils obtenus par `tools/list` :

```json
{"connectionId":"lint-local","connectionVersion":1,"eventId":"probe-001","status":"available","tool":{"name":"ESLint","version":"version-observée"},"capabilities":["code-quality"],"observedAt":"2026-09-17T12:00:00.000Z","summary":"Version locale et configuration examinées."}
```

`status` vaut `available` ou `failed`. Les capacités doivent appartenir à l’option
choisie. Pour MCP, ajouter `tools:[{name,inputSchema?,outputSchema?}]`. Les schémas sont
bornés et remplacés par leurs empreintes avant stockage. Le journal conserve les noms
des outils, pas leurs descriptions ou leur sortie brute. Un probe disponible MCP sans
outil est refusé. Un rapport antérieur ne remplace pas une observation plus récente.

Le token authentifie l’émetteur du rapport auprès de Studio ; il ne constitue pas une
signature du fournisseur externe. Le backend de cette tranche n’effectue aucun appel
MCP/API et n’embarque ni OAuth, ni lancement de commande configurable. La
[spécification MCP](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)
distingue les résultats structurés et les erreurs d’outils. Une réponse de transport
valide n’est pas une preuve de qualité du projet.

## Exécution et retour d’un contrôle

`POST /api/connectors/executions` prépare un ticket avec
`{connectionId,revisionId,checkId}`. Il exige une version sélectionnée connue, ses
fichiers intacts et un probe compatible. Une version non appliquée peut être vérifiée.
La réponse comprend `runId`, l’empreinte, la version appliquée au départ dans `activeRevision`,
l’outil/version attendus, `admittedAt`, `expiresAt`, un titre et une demande pour l’hôte.
La préparation n’exécute pas le contrôle. Le ticket expire après 30 minutes.

Pour `business-journey`, des critères métier explicites sont requis. Le ticket conserve
leurs identifiants et textes exacts dans `businessCriteria`, avec une empreinte séparée
des sources ; la demande expose ces critères à l’hôte. Le snapshot est borné à 8 Kio,
sans troncature. Un changement de critères avant le retour refuse le résultat et exige
un nouveau ticket. Après réception, la preuve conserve l’objectif effectivement
contrôlé et devient `reevaluate` si les critères changent. Les autres contrôles restent
liés à leur propre périmètre. Les anciens tickets métier sans snapshot doivent être
recréés ; leurs preuves conservées sont à réévaluer. Un rejeu exact ne réactualise pas
une preuve. Le format du rapport transmis par l’hôte reste identique.

Après exécution réelle, le worker envoie à `POST /api/connectors/results` :

```json
{
  "runId":"uuid-du-ticket",
  "connectionId":"lint-local",
  "revisionId":"revision-du-ticket",
  "fingerprint":"empreinte-du-ticket",
  "tool":{"name":"ESLint","version":"version-observée"},
  "source":{"kind":"host-local"},
  "startedAt":"2026-09-17T12:01:00.000Z",
  "finishedAt":"2026-09-17T12:01:01.000Z",
  "status":"failed",
  "observed":"Une règle de lint a échoué.",
  "findings":[{"message":"Diagnostic expurgé.","source":{"path":"src/main.ts","line":8}}],
  "metrics":{"errors":1},
  "limits":["Contrôle limité aux règles exécutées."]
}
```

La commande `devmethod studio connector-result --workspace <workspace> --file <rapport.json>`
gère le token worker localement. Le ticket rappelle aussi le point d’entrée HTTP. Le
workspace est celui de la demande ; aucune clé ne doit être copiée dans le fichier.

Les valeurs d’identifiant et d’empreinte de cet exemple doivent être remplacées par le
ticket réel. `source.kind` vaut `host-local`, `host-api` ou `host-mcp` selon le connecteur.
Pour MCP, `source.toolName` doit identifier un outil du probe. Le statut obligatoire est
`passed`, `failed` ou `blocked` ; `isError: false` ne peut pas le remplacer. Un diagnostic
possède un fichier du manifeste dans `source` ou une `target` textuelle expurgée pour un
constat sans correspondance source, par exemple un élément de page. Une réussite ne
contient aucun diagnostic non résolu.

Le serveur refuse les résultats d’un autre ticket, outil, connecteur, contexte ou
empreinte, ainsi que les horodatages incompatibles. Une nouvelle version appliquée ou
une modification locale des fichiers invalide un résultat en attente. Le rejeu exact
d’un résultat déjà reçu est idempotent ; un contenu différent est refusé. Un rejeu ne
réactualise pas la preuve historique.

Les résultats rejoignent `.devmethod/quality/` et le panneau des vérifications. Ils
conservent outil/version, provenance hôte, métriques et diagnostics pour préparer la
correction. Ils ne copient pas de stdout dans le projet et ne s’assimilent pas à un
contrôle exécuté par le runtime Studio. Après changement de configuration, d’outil ou
de schéma MCP, la preuve reste consultable avec une fraîcheur `reevaluate`.

## Intégrer un service applicatif

`POST /api/connectors/prepare` reçoit `{connectionId,revisionId,capability}` et retourne
une demande `kind:integrate` liée à la version appliquée. Elle demande d’examiner les
dépendances et les contrats, de respecter les décisions du projet et de distinguer
implémentation, essai effectif et prérequis manquants. Elle ne crée pas de tâche à elle
seule et n’envoie aucun mail. L’interface ou l’hôte soumet ensuite cette demande selon
les autorisations de la session.

## Bornes et validation de cette tranche

Le catalogue propose 54 options ; le registre d’un projet accepte toujours 32
configurations simultanées et 200 reçus de probe, avec au plus 8 capacités observées,
40 outils par probe et 4 Kio par schéma. Les requêtes sont bornées à 64 Kio. Le projet conserve au maximum
500 tickets et 500 exécutions qualité ; aucun historique n’est supprimé automatiquement.
Un résultat contient au maximum 100 diagnostics, 40 métriques numériques et 20 limites.

Les tests exécutent réellement le parseur Node sur une fixture locale, puis importent
ce résultat via le bridge. Les scénarios MCP/API valident le protocole et les refus avec
des fixtures ; ils ne démontrent pas une connexion à Playwright MCP, Sentry ou un service
de mail. Aucun appel fournisseur payant ni installation n’a été effectué pour cette
tranche. Les tests parcourent aussi les 54 configurations du catalogue et la préparation
de chaque capacité applicative, sans modifier la version ni les sources. Ce parcours
vérifie le contrat de préparation, pas le fonctionnement effectif des fournisseurs.

L’export applicatif existant n’inclut pas les fichiers annexes `.devmethod/connectors.json`,
`.devmethod/connector-executions/` et `.devmethod/quality/`. Les connecteurs, tickets et
preuves externes de cette tranche restent donc dans le workspace Studio d’origine. Un
résultat externe n’est pas recopié en contrôle historique dépourvu de sa provenance dans
`studio.json`. Restaurer l’export de l’application demande de reconfigurer les références
et de réexécuter les contrôles nécessaires ; aucune connexion n’est reconstruite à partir
des noms de dépendances. Les accès restent gérés par l’hôte.
