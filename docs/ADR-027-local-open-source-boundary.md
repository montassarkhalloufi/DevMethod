# ADR 027 — Socle local open source complet

Date : 2026-09-21. Statut : accepté par choix explicite utilisateur dans la mission
[local-oss-v1](missions/local-oss-v1/PLAN.md).

## Décision et limites

Le choix est « Open source local complet + cloud et services payants ». Cette mission
s'arrête au socle local v1. Un futur produit payant sera un autre projet consommant
une base versionnée. Aucun SaaS, abonnement, licence propriétaire, administration
multi-tenant ou dossier commercial factice n'est ajouté. La licence MIT est conservée.
Les accès et coûts du fournisseur d'agent restent distincts de DevMethod.

La méthode distribuée sous `.agents/skills/` reste utilisable sans Studio. Le cœur
porte jobs, décisions, preuves, risques, attention et politique d'autonomie, sans UI,
facturation ou dépendance commerciale. Le Studio compose ce cœur, le stockage local,
les adaptateurs et l'interface. Les contrats sont extraits au fil des besoins réels,
sans migration générale ni framework de plugins anticipé.

L'alternative d'un contrôle réservé au cloud est écartée par le choix utilisateur.
L'alternative d'une réorganisation massive préalable retarderait le parcours utile
sans démontrer une meilleure séparation. Les quatre capacités de contrôle demandées
appartiennent donc au socle local et doivent influencer réellement l'exécution.

## État inspecté et vérification attendue

À la reprise `abff07b`, `scripts/studio/domain.mjs` porte les décisions métier,
`jobs.mjs` coordonne snapshots et compilation, `runner.mjs` adapte Codex,
`store.mjs` persiste localement et `server.mjs` compose les services. `studio-ui/`
consomme les endpoints. Ces frontières existent mais leur indépendance complète
reste à vérifier : leur emplacement ne constitue pas une preuve.

`package.json` déclare MIT et des dépendances locales React, TypeScript, esbuild,
MCP SDK et utilitaires UI. Aucune dépendance commerciale DevMethod n'y est déclarée.
Les licences transitives et notices générées doivent être vérifiées sur l'installation
verrouillée ; l'absence d'un module commercial ne prouve pas cette conformité.

Les preuves de sortie doivent couvrir les imports du cœur, les dépendances installées,
les notices, le paquet et l'ouverture autonome d'un export avec ses données. Le produit
payant futur intégrera ces contrats et formats versionnés, sans import inverse du socle.

Inspection du lockfile v3 après `npm ci` (Node 24.18.0, macOS) : aucune entrée sans
champ licence. Les licences déclarées incluent MIT, ISC, MIT-0, Apache-2.0, BSD,
MPL-2.0, LGPL-3.0-only, CC-BY-4.0, CC0 et BlueOak-1.0.0. Les deux entrées LGPL
sont `eslint-plugin-sonarjs` et ses configurations d'analyse, outils de développement.
Lightning CSS utilise MPL-2.0 ; DOMPurify propose MPL-2.0 ou Apache-2.0 ; caniuse-lite
est CC-BY-4.0. Ce relevé de métadonnées ne remplace pas la vérification des notices
et fichiers réellement embarqués dans le paquet. Aucun changement de licence effectué.

## Vérification bornée du 21 septembre

Sur les sources de `9ecf22b`, la fermeture d’imports de `domain.mjs`,
`control-policy.mjs` et `public/attention-model.js` couvre 22 modules locaux.
Les seuls imports externes sont des modules Node (`crypto`, `fs`, `path`,
`child_process`) ; aucune dépendance React, DOM, serveur, cloud ou commerciale.
Les tests existants appellent directement le domaine, `evaluateControl` et
`summarizeAttention`, sans démarrer Studio. Cette réutilisation reste liée aux
formats et modules locaux : `control-policy.mjs` importe `dist/loop.js`, dont
les utilitaires transitifs incluent des fonctions système. Ce n’est pas encore
un SDK public autonome stabilisé, qui n’est pas requis pour la v1 locale.

L’archive installée et essayée de la tranche attention, SHA-256
`bd78958f3794ecff33f644492a4aae6618510220c2d9fe85cdf01956c896038b`,
contient ces modules, MIT, la notice Studio et la
[notice des icônes](CONNECTOR-ICON-NOTICES.txt), identiques au workspace inspecté.
Les textes complets correspondent à Monaco 0.56.0 et ses notices tierces,
React/React DOM 19.3.0, scheduler 0.28.0 et DOMPurify 3.4.15 ; cette dernière
version est aussi présente dans le JavaScript distribué. Les 38 sources SVG
concordent avec leurs empreintes et la notice conserve provenance, attribution
OpenTelemetry, licence Sanity et réserves de marques. L’export restauré du site
conserve aussi sa notice React/React DOM/scheduler/Tailwind.
Cette inspection et les [essais du paquet](missions/local-oss-v1/evidence/ATTENTION-CONCENTRATION.md)
établissent le périmètre local décrit ; ils ne constituent pas un audit juridique
exhaustif de toute dépendance ni une validation du parcours natif complet.
