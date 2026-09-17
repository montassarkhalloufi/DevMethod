# ADR 026 — Permissions MCP et échanges structurés avec la personne

Date : 2026-09-17. Statut : accepté par la demande explicite d’implémentation du plan
« Connecteurs DevMethod : guidage, permissions et GitHub MCP ».
Complète [ADR 024](ADR-024-workspace-mcp.md) et [ADR 025](ADR-025-guided-connector-preparation.md).

## Décision

Les connexions MCP restent partagées dans la bibliothèque locale, leur sélection propre
à chaque projet. Une politique attachée à la connexion contrôle réellement les appels du
pont DevMethod : `allow`, `ask` (défaut), `deny`. Les annotations du fournisseur ne sont
jamais une autorisation. La fiche est le seul endroit pour modifier durablement la politique.
Un nouvel outil ou un contrat changé demande un nouvel accord. Le réglage global vise les
outils connus à cet instant, sans accorder les futures capacités.

La politique est capturée à la prise en charge de la mission. L’appel applique le plus
restrictif du snapshot et de la politique actuelle : deny > ask > allow. Une restriction
agit immédiatement, un élargissement durable attend une nouvelle mission. La politique
n’est pas une ACL pour les outils directement exécutés dans l’agent hôte ; cette frontière
est affichée dans l’interface.

Pour ask, un journal indépendant conserve l’action exacte et sa décision humaine. La
requête contient un identifiant stable, la mission, la connexion, l’outil et les arguments.
Le serveur vérifie le schéma, la sélection et la mission, puis expose une carte à la personne.
L’accord est unique, expire après dix minutes, et déclenche l’appel serveur après nouvelle
vérification. Le même identifiant et les mêmes arguments restituent la même action ; une
réutilisation avec d’autres arguments est refusée. Les anciens clients sans requestId
reçoivent un identifiant déterministe ; une répétition identique ne réexécute pas l’action.
Une nouvelle action volontaire nécessite un nouvel identifiant.

Un appel passé à executing avant interruption devient unknown au redémarrage : son effet
externe peut avoir eu lieu et aucune relance automatique n’est permise. Les opérations
non démarrées sont annulées lorsque leur mission ou accès devient obsolète. Cette déduplication
vaut dans la bibliothèque locale à écrivain unique, pas dans une architecture distribuée.

Les questionnaires constituent un second journal, séparé des actions, du progrès déclaré
et des propositions de design. L’agent demande un guide connu et versionné ; la personne
remplit des choix finis ; le serveur prépare les réponses. Cela ne modifie jamais les
préparations initiales immuables de la mission. Les brouillons intermédiaires sont conservés
par accueil/projet, avec versions optimistes et reprise après fermeture ou rechargement.
Aucun secret n’est une réponse de questionnaire. Les faits de connexion observés sont
séparés des prérequis restant à configurer.

Alternatives écartées : permissions uniquement visuelles (aucune garantie d’exécution),
attente humaine dans un appel HTTP long (fragile au rechargement), réutilisation des
propositions de design (mélange d’autorités), ou nouveau service distant (hors produit local).

## Interfaces et autorité

| Interface | Autorité et comportement |
| --- | --- |
| GET /api/mcp/policy?connectionId | Lire outils courants et version de politique. |
| POST /api/mcp/policy | Personne, Origin exacte, aucun Authorization ; `{connectionId,version,updates:[{toolName,inputSchemaFingerprint,permission}]}` ; conflit 409. |
| POST /api/mcp/call | Worker ; `{requestId?,jobId,connectionId,toolName,arguments}` ; action pending/executing 202, terminale 200. |
| GET /api/mcp/actions?jobId ou requestId | Lire demandes et résultats conservés ; aucune exécution induite. |
| POST /api/mcp/actions/decide | Personne seule ; `{requestId,decision:allow|deny}` ; le serveur exécute après revalidation. |
| GET /api/mcp/usage?connectionId | Projets enregistrés sélectionnant la connexion ; lectures indisponibles signalées. |
| POST /api/connectors/interactions/request | Worker ; `{jobId,eventId,optionId,guideVersion:1,flowId?}` ; identifiant idempotent. |
| GET /api/connectors/interactions?jobId | Questions et réponses validées, liées à leur mission. |
| POST /api/connectors/interactions/draft ou /answer | Personne seule ; interactionId, expectedVersion, input et step pour le brouillon. |
| GET/POST /api/connectors/guide-drafts | Brouillons de l’accueil/projet, choix finis et contrôle de version. |
| POST /api/connectors/guide-drafts/remove | Tombstone versionné ; empêche un ancien enregistrement de rétablir un brouillon. |

Les mutations humaines refusent même un jeton worker valide accompagné de la bonne Origin.
Les vérifications Host/Origin existantes restent actives. Les limites des appels et listes
existantes sont conservées ; le journal MCP est borné à 128 actions et 48 Mio par projet.
Les journaux et les secrets restent hors de l’export du produit. Les règles d’autorisation
ne migrent aucun enregistrement ancien vers allow.

## GitHub

Le guide `github-mcp` est distinct de l’API applicative `github`. Le preset `github` utilise
un PAT saisi dans un champ masqué, envoyé uniquement au gestionnaire privé existant. Endpoint
par défaut : `https://api.githubcopilot.com/mcp/readonly`, alternative standard :
`https://api.githubcopilot.com/mcp/`. La restriction aux dépôts se configure dans le PAT,
jamais par un simple choix de ressources du questionnaire. Les deux endpoints gardent des
connexions distinctes ; un jeton n’est pas recopié silencieusement entre eux.

L’initialisation MCP et la découverte doivent réussir avant `connected`. L’identité du compte
n’est pas inventée quand le protocole ne la fournit pas. Le stockage local privé n’est pas
un coffre chiffré OS. OAuth GitHub attend une application enregistrée dans une livraison
séparée : le serveur distant ne prend pas en charge DCR.

Sources officielles vérifiées : [serveur distant](https://github.com/github/github-mcp-server/blob/main/docs/remote-server.md),
[intégration hôte](https://github.com/github/github-mcp-server/blob/main/docs/host-integration.md).

## Vérification et limites

Les tests visent l’absence d’appel avant accord, le refus, l’expiration, la déduplication,
les changements de règles et de schémas, la perte d’accès, l’obsolescence et les frontières
worker/personne. Les parcours navigateur couvrent les quatre guides et les cartes.
[Preuves de cette livraison](missions/creation-experience/evidence/connector-permissions/RESULTS.md).

Aucun compte fournisseur n’est autorisé par les fixtures locales. Les vérifications réelles
GitHub dépendent d’un PAT saisi dans l’interface ; elles doivent rester distinguées des tests
HTTP de protocole. Stripe, Cloud géré, registres MCP, OAuth Slack natif et identités des
utilisateurs finaux restent hors de cette décision.
