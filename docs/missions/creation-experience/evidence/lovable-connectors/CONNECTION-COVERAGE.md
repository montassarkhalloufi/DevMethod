# Connexions — couverture exécutée et accès restant à établir

17 septembre 2026, Node.js v24.18.0, vérification locale. **99 tests ciblés passent.**
Les tests exercent les 54 définitions du catalogue et leurs 99 associations de capacités,
puis les parcours HTTP du bridge pour les trois provenances `host-local`, `host-api` et
`host-mcp`. Ils ne constituent pas 54 connexions fournisseurs réussies.

Le catalogue contient **44 options applicatives et 10 options de diagnostic**. Les
transports déclarés se répartissent en **9 local, 42 API et 3 MCP**. Ces étiquettes
désignent le moyen attendu chez l’hôte, pas un client embarqué dans Studio. Par exemple,
l’option SMTP appartient au groupe API du catalogue ; cela ne lui invente pas un client HTTP.

## Ce qui a réellement été exécuté

- Pour chaque option : configuration avec références `env:` et `host:`, état `configured`
  sans probe, rejet des valeurs brutes et champs de clé, refus d’une version périmée et
  d’une capacité inconnue. Chaque capacité annoncée reçoit ensuite une attestation de
  fixture. Une reconfiguration efface cette attestation et revient à `configured` ; un
  rapport de fixture en échec produit `failed`. Aucun de ces états n’est `connected`.
- Pour les trois options MCP : un probe disponible sans outil est refusé. Les schémas
  déclarés sont empreintés. Les attestations sont des entrées de protocole synthétiques,
  **sans négociation MCP ni appel `tools/list` réel**.
- Trois parcours HTTP sur `127.0.0.1` : configure → probe authentifié → ticket de contrôle
  lié à la version/empreinte → retour authentifié → journal qualité → rejeu exact.
  Les erreurs de token, provenance, empreinte, outil MCP, statut manquant et rejeu divergent
  sont refusées. `isError: false` ne remplace pas un résultat explicite.
- Le parcours local lance réellement `node --check` sur un fichier de fixture valide,
  puis reçoit `passed` avec version de Node et code de sortie. Un test existant lance aussi
  ce parseur sur une syntaxe invalide et conserve son résultat `failed` avec diagnostic.
- Les retours API et MCP des nouveaux tests portent **`blocked`**, avec une observation
  indiquant qu’aucun fournisseur ni outil métier n’a été appelé. Leur acceptation valide
  le contrat du bridge et sa traçabilité, pas une exécution distante.

La suite existante complète ces essais : préparation de chaque capacité applicative,
MCP/CLI/UI, protection des secrets, reçus expirés ou contradictoires, changement de sources,
configuration, interface d’outil et critères métier. Une preuve devenue obsolète reste
conservée et demande réévaluation. L’action de préparation ne crée ni job ni intégration
applicative ; le retour de diagnostic rejoint les détails et la préparation de correction.

## Matrice des parcours

| Famille | Étapes nécessaires à une connexion ou un usage réel | Capacité DevMethod exercée | Réseau ou outil réellement utilisé | Accès restant à établir |
| --- | --- | --- | --- | --- |
| Diagnostic local | Trouver l’outil/version, définir le périmètre, exécuter, rapporter les constats | Configuration, attestation, ticket et import de résultat ; Node positif et négatif réels | Processus Node local et HTTP loopback | ESLint, Playwright, axe et autres outils n’ont pas été installés ou exécutés par cette campagne |
| Diagnostic API | Authentifier l’hôte auprès du service, associer la cible à la version, lire le résultat utile | Provenance `host-api`, refus des incohérences, conservation du statut `blocked` | HTTP loopback vers Studio uniquement | Aucun endpoint fournisseur, secret ou session API utilisé ; aucune erreur d’authentification distante n’est donc attestée |
| Diagnostic MCP | Initialiser un client, découvrir capacités/outils, autoriser un appel précis, vérifier son résultat | Liste déclarée et schémas empreintés, outil du retour obligatoirement attesté, statut explicite | HTTP loopback vers Studio uniquement | Aucun client stdio/HTTP/SSE lancé ; autorisation et appels MCP distants non essayés |
| Mail et messagerie | Configurer transport/compte, autorisations et destinataires ; tester un envoi autorisé | Intention ou configuration, attestation rapportée, demande d’intégration liée à la version | Aucun envoi, connexion SMTP ou API de messages | Fournisseur/compte, domaine et permissions réelles selon le service |
| Base, backend et authentification | Raccorder un environnement, contrôler schéma, accès et identité ; tester les parcours | Choix indépendant de PostgreSQL/Supabase/Appwrite/autres, préparation bornée | Aucune base provisionnée, migration ou connexion utilisateur | Runtime, secrets chez l’hôte, configuration du fournisseur et tests métier |
| Paiements et commerce | Compte et mode de test, webhook, droits et parcours de paiement/commande | Métadonnées et préparation pour Stripe/Paddle/Shopify/WooCommerce | Aucun paiement, commande ou webhook | Accès de test et vérifications de bout en bout autorisées |
| Stockage, CMS et recherche | Cible/index/bucket/contenus, permissions, requêtes et limites | Configuration de références et préparation d’intégration | Aucune lecture ou écriture fournisseur | Client adapté, données de test et autorisations |
| IA | Modèle/version, accès et budget, contrat de sortie, évaluations | Choix de fournisseur et intention d’intégration | Aucun appel modèle, téléchargement ou service Ollama démarré | Accès, coût accepté et évaluation utile au projet |
| Git, productivité et analytics | Connexion du compte, périmètre de dépôt/document/événements, opérations autorisées | Catalogue et préparation, sans adoption implicite de permissions | Aucune modification de dépôt/document ni ingestion analytics | OAuth ou jeton chez l’hôte, droits et opération réelle à vérifier |
| Hébergement | Cible, configuration, secrets et approbation du déploiement | Préparation pour Cloudflare/Vercel/Netlify | Aucun déploiement ou changement DNS | Compte/cible et autorisation de publication |
| API/MCP applicatif générique | Définir le service et son contrat puis intégrer son usage dans le runtime du produit | `application-api` et `application-mcp` configurables ; chaque capacité annoncée testée au niveau du contrat | Aucun client applicatif généré/exécuté par ce panneau | Implémentation du service, auth et tests du produit ; un accès d’agent ne suffit pas |

Les routes réellement testées sont `POST /api/connectors/configure`, `/probe`, `/executions`,
`/results` et `/prepare`, ainsi que `GET /api/connectors`. Les écritures utilisateur exigent
la même origine ; probes et résultats exigent le token worker local. Ce token authentifie
l’hôte auprès de Studio ; il n’authentifie aucun compte fournisseur. Les références de
secrets sont conservées mais ne sont pas résolues par Studio.

## Inventaire exact exercé

**Local (9)** : `node-test`, `node-check`, `eslint`, `playwright`, `axe-core`, `mailpit`,
`postgresql`, `keycloak`, `ollama`.

**API (42)** : `diagnostic-api`, `sentry`, `opentelemetry`, `smtp`, `resend`, `brevo`,
`supabase`, `appwrite`, `existing-backend`, `auth0`, `stripe`, `paddle`, `shopify`,
`woocommerce`, `s3`, `cloudflare-r2`, `openai`, `anthropic`, `gemini`, `github`, `gitlab`,
`strapi`, `directus`, `contentful`, `sanity`, `slack`, `discord`, `telegram`, `twilio`,
`gmail`, `notion`, `airtable`, `google-calendar`, `posthog`, `matomo`, `google-analytics`,
`meilisearch`, `algolia`, `cloudflare-workers`, `vercel`, `netlify`, `application-api`.

**MCP (3)** : `playwright-mcp`, `diagnostic-mcp`, `application-mcp`.

## Bolt, Lovable et protocole MCP : portée de la comparaison

La recherche et l’inspection Lovable restent dans [RESEARCH.md](RESEARCH.md) et
[UI-OBSERVATIONS.md](UI-OBSERVATIONS.md) : formulaires et réglages observés, sans connexion
fournisseur activée pendant cette inspection. Ce relevé n’en répète pas l’inventaire.

La documentation Bolt décrit le chemin **+ → Connectors → Manage connectors**, puis une
offre intégrée ou un serveur personnalisé. Ce dernier demande nom, URL, transport HTTP/SSE
et authentification API key, MCP OAuth ou aucune pour une ressource publique. Le statut
Connected vient après vérification d’accès ; les outils ont des réglages globaux et les
connecteurs peuvent être activés par projet. C’est un parcours plus complet que la
configuration de références du bridge DevMethod. [Documentation officielle Bolt MCP](https://support.bolt.new/building/using-bolt/connect-mcp).

L’inspection navigateur menée en parallèle par l’agent coordinateur a observé le détail
Notion passer de Connect à **Connected** après une fenêtre OAuth, avec quatre outils
affichés (`search`, `ai-search`, `fetch`, `create-attachment`) et « View 40 more ».
L’agent n’a pas confirmé d’écran de consentement : la réutilisation d’une autorisation
préexistante ou une intervention simultanée de l’utilisateur reste indéterminée.
Cette observation établit un état de connexion et une découverte **affichés par Bolt**.
Aucun outil métier n’a été appelé ; ni les 44 outils ni l’ensemble des parcours OAuth
ne sont validés par cette observation. Le détail navigateur est conservé dans
[BOLT-CONNECTIONS.md](BOLT-CONNECTIONS.md), sans jeton ni identifiant de compte dans ce rapport.

Les parcours dédiés [GitHub](https://support.bolt.new/integrations/git),
[Supabase](https://support.bolt.new/integrations/supabase) et
[Stripe](https://support.bolt.new/integrations/stripe) sont documentés par Bolt ; cette
lecture ne constitue pas leur exécution. Les fiches et connexions propres à l’application
restent distinctes de l’accès MCP donné à l’agent.

MCP définit stdio et Streamable HTTP, ainsi qu’un cycle d’initialisation et de découverte.
Le transport HTTP peut utiliser SSE ; cela ne transforme pas notre POST JSON de retour
de résultat en transport MCP. [Spécification des transports](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports).
L’autorisation HTTP et les identifiants d’un processus stdio suivent des mécanismes
différents. Aucun de ces mécanismes n’a été ajouté ou essayé par cette campagne.
[Autorisation MCP](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization).
Une liste d’outils déclarée à Studio reste distincte d’une découverte et d’un appel
effectifs. [Contrat des outils MCP](https://modelcontextprotocol.io/specification/2025-11-25/server/tools).

## Exécution reproductible et limites

```sh
node --test tests/studio-connector-coverage.test.mjs tests/studio-connectors.test.mjs tests/studio-connectors-http.test.mjs tests/studio-connectors-ui.test.mjs tests/studio-connector-icons.test.mjs tests/studio-import-cli.test.mjs
```

Résultat : **99 tests Node, 99 réussis, 0 échec, 0 ignoré**. Le nouveau fichier contribue
58 entrées au compteur Node : 54 sous-tests d’options, leur groupe parent et 3 parcours HTTP.
Les 99 associations option-capacité sont des assertions internes, pas 99 connexions ni
99 appels externes. Journal local : `/private/tmp/devmethod-connector-coverage-all-20260917.log`.
Lint et formatage ciblés passent. Les tests UI sont des essais DOM ; ils ne remplacent pas
l’observation navigateur ni un contrôle d’accessibilité complet. Aucun build complet,
installation, OAuth nouveau, envoi, provisionnement ou publication n’a été effectué par
cette campagne automatisée.

Revue complémentaire du lancement **Plan** : sa contrainte dit « Action initiale » et
conditionne l’absence d’implémentation à une nouvelle demande explicite. Elle n’installe
pas un verrou permanent. Les validations de méthode existantes restent nécessaires après
cette demande ; la consigne textuelle doit être respectée par l’hôte. Cette revue de code
ne prouve pas le comportement futur d’un agent natif.

## Extension ultérieure : gestionnaire MCP natif de l’espace

La matrice ci-dessus décrit le catalogue et son bridge historique. La nouvelle tranche
ajoute un gestionnaire MCP distinct : initialisation, découverte d’outils, OAuth/PKCE,
Bearer, sélection dans le prompt et appel hôte réellement exercés avec des serveurs
locaux. Le vrai démarrage Notion atteint son écran de consentement ; l’autorisation
utilisateur n’a pas été accordée pendant la recette. Cela ne valide pas les autres
fournisseurs ni les API applicatives du catalogue. Voir la
[recette datée](../home-composer/RESULTS.md) et [ADR 024](../../../../ADR-024-workspace-mcp.md).
