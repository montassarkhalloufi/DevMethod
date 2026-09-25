# Retour du Studio dans la méthode — 17 septembre 2026

Base : `84e6d41`. Portée : règles réutilisables, sans changement applicatif ni nouvel appel fournisseur produit. Empreinte SHA-256 de l'ensemble candidat des skills, avant exercices : `baaf6548090a49e568e9d57fc67fd53ca77979580726633ae3360638a09a3003` (liste ordonnée de chemins et empreintes). Les ressources Vercel épinglées sont inchangées.

## Exercices ponctuels

Trois sous-agents hôtes frais ont reçu uniquement le projet fictif, les skills candidats installés et une demande neutre. L'opérateur connaissait les attentes : aucun jugement aveugle, comparaison avant/après de méthodes ou essai natif Claude/Cursor. [Entrées et protocole](../../../../../evaluation/method-feedback/README.md).

| Exercice | Résultat observé | Limite |
| --- | --- | --- |
| Petite correction | Seul le titre de `docs/notes.md` devient « Equipment notes » ; contenu et changements préexistants préservés. Réponse brève, pas de nouvelle délégation demandée ni de tests applicatifs inutiles. | Un cas documentaire ne prouve pas une réduction générale de l'effort. |
| Contrôle puis correction | Condition `amount >= remaining` remplacée par `amount > remaining`, une ligne. L'agent rapporte 1 échec/1 réussite avant, puis 2 réussites. L'opérateur reproduit indépendamment ces résultats sur les deux sources ; journaux ci-dessous. Audit absent explicitement non exécuté ; rapport historique non réattribué. | Les journaux conservés sont ceux de la reproduction opérateur, pas des fichiers produits par le sous-agent. Aucun audit de dépendances réalisé. |
| Revue UI précoce | Recommande stabiliser le premier écran avant réplication, gestes réels de défilement, menu avec éditeur monté, clavier et faible hauteur. Distingue hypothèses CSS et défauts reproduits. Aucun fichier changé. | Lecture seule, aucun navigateur disponible ; sélection des contrôles uniquement. Réponse encore détaillée : la concision générale n'est pas démontrée. |

Preuves de reproduction : [défaut initial](stock-before.log), [source corrigée](stock-after.log). Les chemins absolus dans ces sorties sont remplacés par des libellés de workspace. SHA-256 du fichier corrigé : `a8d4ff0ee7c75f02a70f21a35962a84a5a8ef46396f657889dcf77ae5473e2b9`. L'entrée conservée dans Git reste volontairement défectueuse.

## Vérification du kit

- `npm ci --offline` dans un répertoire temporaire avec les mêmes manifestes : installation réussie ; scripts d'installation esbuild/fsevents non approuvés dans cette copie. La compilation suivante utilise les dépendances déjà opérationnelles du dépôt.
- `npm test` : **702/702**, compilation incluse.
- Contrôles ciblés installation/doctor/workflow : **24/24** ; installations Codex, Claude et Cursor et intégrité des références Vercel couvertes, pas comportement natif de ces agents.
- Lint, format, liens documentaires, `git diff --check` réussis ; `npm pack --dry-run` inclut les skills et fixtures.
- Revue indépendante du diff méthode : aucune contradiction bloquante trouvée ; pas de nouvelle preuve navigateur.
- `quick_validate.py` de skill-creator non exécuté jusqu'au bout : dépendance Python `yaml` indisponible. Les métadonnées des skills n'ont pas changé ; les contrôles d'installation du dépôt restent la preuve réellement obtenue.

Les enseignements sont intégrés aux propriétaires existants : dimensionnement et commandes pour la présentation, design-to-code pour la première composition et les gestes, scoped-delivery pour les preuves et corrections. Aucun nouveau rituel ou document obligatoire par petite modification.
