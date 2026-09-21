# Hiérarchie centrée sur la décision

Recadrage utilisateur autorisé le 2026-09-16, précisé ensuite par la référence N
fournie (`bc785c79-652a-4340-a441-7b48e7e0aa08.png`). N remplace les détails de M :
icônes linéaires, options verticales, titre de décision en serif, bloc distinct
« À préserver » et preuves sur trois lignes. Le bleu nuit et le violet restent
les tokens du shell. L’application conserve sa propre identité dans l’aperçu.
La composition est adaptée aux données réelles ; aucune fidélité au pixel n’est
déduite du seul code ou d’une capture à un autre état.

## Contrat de présentation

- `#active-decision` est une région dédiée entre le projet et l’activité. Le
  widget React y présente les données réelles de la proposition. Elle est cachée
  en l’absence de proposition et ne dépend pas du défilement de l’historique.
- `details#activity` contient le `#conversation-flow` existant, les demandes,
  directions et décisions précédentes. Son ouverture reste une interaction
  utilisateur ; le contrôleur peut le fermer lors de l’arrivée d’une nouvelle
  proposition, sans le refermer à chaque actualisation.
- `details#responsibilities` conserve la politique et l’accès à ses réglages.
  Contraintes et références restent dans le contexte du projet. Aucun contenu
  enregistré n’est supprimé pour obtenir une interface plus sobre.
- `details#preserve-constraints` réserve un bloc aux contraintes réelles de la
  décision. Il est caché tant que le contrôleur n’y a pas fourni de données.
- `#proposal-comparison` se trouve dans Application. Les boutons
  `#comparison-before` et `#comparison-proposal` commandent une source réelle ;
  `#comparison-status` en explique la nature. `#preview` reste l’application
  exécutable ; `#proposal-image` sert seulement à une représentation visuelle
  explicitement qualifiée par le contrôleur ; `#proposal-empty` expose une
  capacité ou une source manquante. Ces régions sont cachées avant intégration.
- Sélection d’une option, simulation et validation sont des opérations distinctes.
  Le CSS ne déclare aucun choix validé, aucune preuve acquise ni résultat produit.

Le widget utilise `.active-decision-card`, `.decision-question`,
`.decision-options`, `.decision-option`, `.decision-consequences`,
`.decision-recommendation`, `.decision-approval`, `.decision-phase` et
`.decision-history`. Le choix sélectionné est lisible avec une bordure violette
et un état natif/ARIA ; la validation est une action séparée. La zone d’approbation
reste accessible en bas de la carte lorsque son contenu nécessite un défilement.

## Adaptation et vérification

Sur ordinateur, la décision reçoit l’espace disponible. L’activité ouverte en
sa présence est bornée à 150 px. Sans décision, le fil retrouve l’espace libre.
Le séparateur, les largeurs mémorisées, les IDs des formulaires et le plein écran
sont préservés. Sur mobile, la décision suit le flux naturel de la colonne ; la
navigation vers le produit et la discussion reste disponible.

Hypothèse d’usage à éprouver : une personne doit retrouver le choix actuel,
comparer Avant/Proposition et comprendre ce qu’elle valide sans parcourir les
anciennes demandes. L’interface réfuterait cette hypothèse si l’historique masque
encore l’action, si une simulation ressemble à une version appliquée, ou si
la confirmation est inaccessible à la hauteur d’écran disponible.

Contrôle statique réalisé : IDs uniques, régions attendues présentes, décision
hors activité, cible existante du défilement conservée. La fidélité visuelle et
les comportements doivent être contrôlés après intégration du widget et de ses
handlers. Aucune observation humaine ni validation de compréhension n’est
déduite de ce contrôle DOM.

## Parcours avant réalisation

L’onglet `#journey`, monté par `journey-widget.tsx`, donne une vue des six fonctions
de DevMethod. Il est alimenté par l’état transmis, sans fetch ni mutation directe
de cet état. Les transformations d’affichage sont pures ; un hook gère seulement
la demande de validation asynchrone et son erreur. Les boutons « Préparer »
appellent l’hôte pour remplir la discussion et ne lancent pas un agent eux-mêmes.

Le Design sépare les directions, le master détaillé explicitement approuvé,
les écrans reliés et le prototype relié à une version. La provenance d’un accord
humain ou d’une délégation est affichée. Une image sélectionnée sans master,
une validation échouée ou un master correspondant à une ancienne direction ne
produisent pas un état de réussite. Quatre tests de rendu React couvrent ces cas,
dont le choix d’une direction : le callback dédié ne valide aucun master et
l’indication « retenue » attend la mise à jour de l’état serveur.

Vercel, périmètre nouveau widget : React 19 CSR, aucun RSC/Next/Native ni service
déployé. Imports locaux directs ; widget chargé à l’ouverture du Parcours par
l’hôte ; projection dérivée sans effet de copie ; pas de mémorisation sans besoin.
Refs limitées au verrou de validation, clés stables pour records, actions dans
leurs handlers et accord serveur faisant autorité. Images locales avec dimensions,
alt, chargement différé et lien vers la référence ; navigation et actions natives,
erreur annoncée. Le français conserve sa casse et les conventions du projet.
Aucune performance, accessibilité avec lecteur d’écran ou compréhension utilisateur
n’est certifiée par les tests DOM. Le nombre de traces exposées et l’encombrement
du Parcours restent à examiner avec un projet plus long que la démonstration.
