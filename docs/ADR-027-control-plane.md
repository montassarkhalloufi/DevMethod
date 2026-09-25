# ADR 027 — Control Plane local, explicable et persistant

Date : 2026-09-25. Statut : accepté sous la délégation explicite de la mission Control Plane.
Complète les ADR 012, 016, 017, 018 (analyse projet), 019, 020, 024 et 026.

## Décision

Ajouter un domaine TypeScript pur (graphe, risque, attention, autonomie) et un adaptateur
aux sources Studio. Le champ facultatif `controlPlane` du registre atomique existant conserve
les instantanés, décisions, interventions et transitions. Les anciens projets restent lisibles ;
la première observation initialise ce champ sans réécrire leurs preuves. Le verrou de workspace,
les limites de taille et le contrôle optimiste existants restent propriétaires des écritures.

La politique `control-plane-v1` est déterministe : arrêt persistant/non-convergence avant risque
élevé et décisions réservées, puis preuves manquantes/périmées, puis continuation réversible.
Guidé, DevAuto et Autonome expriment une demande ; ils ne constituent pas une permission.
Une décision ne peut augmenter l’autorité des règles MCP, du cadrage ou de la validation visuelle.
Les lectures, vérifications et préparations restent possibles pour réparer une situation ; les
actions externes et l’adoption automatique ne peuvent contourner un arrêt ou une preuve absente.

Chaque nœud porte provenance, version observée, dépendances, limites et lien vers sa source.
Une preuve peut rester actuelle sur une autre révision seulement si son périmètre de dépendances
explicite et complet est inchangé. Les preuves héritées sans périmètre restent attachées à leur
révision. Les déclarations de progression ne deviennent jamais des tests passés. Les liens
d’architecture décrivent le logiciel ; les liens de confiance décrivent validation, contradiction,
dépendance et invalidation. Les résultats externes restent des attestations du pont existant.

L’attention est dédupliquée par cause/action/version. Lire n’est pas résoudre. Une résolution
humaine comporte une raison et une cible exacte ; elle ne fabrique ni preuve positive ni accord MCP.
Un arrêt persistant exige une réconciliation explicite, sans effacement du passé. L’historique
enregistre les entrées nécessaires au rejeu de la décision et sa politique, pas des scores opaques.
Aucune calibration automatique : une future politique exige une nouvelle version explicite.

## Frontières et alternatives

Réutiliser les contrôles locaux et leur journal de jobs ; ne jamais exécuter les scripts arbitraires
du projet. Le transport impose Origin/Host et acteur ; un worker ne peut décider à la place d’une
personne. Les résumés excluent arguments MCP, secrets, sorties brutes et données applicatives.
Les informations indisponibles restent visibles et empêchent un verdict global positif.

Un service graphe séparé ajouterait transactions et reprise distribuées sans besoin local.
Un tableau uniquement calculé dans React ne protégerait aucune action. Une politique apprise
silencieusement empêcherait le rejeu. Ces alternatives sont écartées. Aucun nouveau fournisseur,
coût, réseau distant ou framework n’est introduit.

## Interface et vérification

Îlot React 19 chargé à la demande dans l’onglet Contrôle ; CSS bleu nuit et panneaux selon les
trois références approuvées. Graphe SVG avec commandes clavier et liste structurée. Les vues
risque/autonomie/historique réutilisent cette direction. Les contrôles déclenchés exposent leurs
véritables identifiants et résultats ; un accusé de lancement n’est jamais une réussite.

Les scénarios, captures navigateur, écarts et limites sont consignés dans
[la mission](missions/control-plane/PLAN.md). La lecture de cet ADR n’est pas une preuve de validation.

## Admission effective et compatibilité

La prise de travail charge le contrôleur, attache la décision au contexte du job et refuse un
`Bounded Stop`. Une nouvelle livraison reste une candidate tant que ses preuves ne sont pas
établies. `POST /api/control/continue` recontrôle les sources, le couple version/instantané,
la délégation d’application, le cadrage, la base de la livraison et l’absence de job en cours
avant d’appliquer la candidate. La décision d’application est attribuée à l’agent. L’action
humaine existante d’application explicite reste disponible et ne crée aucune preuve.

MCP conserve ses permissions `deny/ask/allow`. Si le Control Plane ne permet pas Auto-Continue,
une permission `allow` ne suffit plus à déclencher automatiquement un appel : l’action exacte
rejoint la file d’autorisation existante. L’accord MCP reste séparé de l’attention générale.
Une seconde admission juste avant `tools/call` bloque un arrêt apparu pendant la découverte.
Le refus avant transmission est enregistré comme annulé, sans prétendre à un effet externe.

Les analyseurs sont chargés séparément. Leur absence laisse disponibles le registre, les
sources statiques et le Control Plane, qui indique alors une couverture indisponible. Aucune
migration obligatoire des anciennes données n’est ajoutée. Le domaine compilé sans dépendance
externe fait partie des fichiers distribués du Studio.

Le registre conserve au maximum 250 instantanés, 2 000 transitions et 1 000 interventions,
dans la limite existante de 16 Mio. Atteindre une limite bloque explicitement l’écriture ;
aucun passé n’est supprimé silencieusement. Une politique de rotation nécessite une décision
ultérieure. Les lectures identiques ne créent pas de nouveaux instantanés.

## Lecture du graphe dense

Le retour utilisateur du 25 septembre impose de pouvoir suivre le schéma complet sans réduire
ses libellés à quelques pixels. La synthèse conserve la disposition approuvée ; la vue complète
répartit tous les nœuds en familles de lecture, avec des nœuds ronds numérotés avec un espace adapté au
texte et des espaces réservés aux lignes. Elle dessine les relations de la sélection et conserve
toutes les relations enregistrées dans l’inspecteur, avec navigation dans les deux directions
et retour. Ces familles ne créent aucune dépendance ni validation. Filtrer ne renumérote pas les
nœuds et suivre une relation hors filtre rétablit la vue complète. Le défilement natif, la
recherche, le choix de famille et un zoom minimum de 80 % remplacent l’ajustement global qui
rendait 77 nœuds illisibles. Les états restent portés par du texte, pas seulement une couleur.

Les segments partagés sont dessinés une seule fois par type et direction de relation ; une
jonction explicite représente ce regroupement, sans ajouter d’arête. La couleur, les pointillés
et les libellés distinguent les types. L’isolation d’une relation laisse tous les nœuds visibles.
Le plein écran utilise le mécanisme existant du Studio (isolation du fond, Échap, restauration
du défilement) ; aucun second système modal ni nouvelle permission du navigateur.
