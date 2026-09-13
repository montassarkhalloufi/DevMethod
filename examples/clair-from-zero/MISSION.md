# Clair — mission canonique

2026-09-13, livraison standard, propriétaire : agent de réalisation.

## Sources et profil adopté
Le brief transmis par le parent fait autorité : application française locale, HTML/CSS/JS sans dépendances ni comptes, direction ivoire/encre/rouille et sérif ; choix détaillés délégués. Les fichiers du kit restent intacts, notamment PROJECT_PROFILE.md : ce paragraphe porte le profil adopté conformément à la contrainte de préservation. CONTRIBUTING.md et AGENTS.md sont absents. ENGINEERING_POLICY.template.md est un modèle ; le JavaScript demandé prend priorité sur sa recommandation TypeScript.

Stack : modules JavaScript natifs, CSS, HTML ; Node pour les tests purs ; Python pour le serveur local. Commandes : `node --test tests/*.test.mjs` ; `python3 -m http.server 8766 --bind 127.0.0.1 --directory app`. Aucun déploiement, réseau, installation ou génération d’images autorisé. Données : titres, notes et état d’achèvement stockés sous clair.tasks.v1 dans localStorage, conservés jusqu’à suppression ou effacement du navigateur ; aucune synchronisation ni télémétrie.

## Framing, design et architecture — décisions avant code
Valeur : choisir et suivre les priorités du jour sans configuration. Direction existante explicite, choix d’écran délégué ; aucune image ou maquette séparée nécessaire. Prototype HTML final choisi comme support. Grand titre éditorial, date, compteur, liste principale et formulaire latéral ; mobile en une colonne avec formulaire avant la liste. Palette #f7f3eb, #292923, #97472f ; Georgia système et sans-sérif système. États : vide, filtres vides, tâches actives/terminées, validation, suppression/annulation, stockage indisponible/corrompu.

Choix structurel dans le cadre délégué : module pur pour validation/transitions/schéma, adaptateur localStorage, contrôleur DOM. Une page monolithique serait plus courte mais rendrait les invariants difficiles à tester isolément. Aucun framework utile au périmètre. Les titres/notes ne deviennent jamais du HTML. Échec d’écriture : garder la session en mémoire et afficher une alerte persistante avec réessai ; erreur de lecture : ne pas écraser les données sans action explicite de réinitialisation. Suppression réversible de la dernière tâche, sans expiration temporelle. Pas de réinitialisation automatique à minuit.

## Plan et readiness (avant implémentation)
Une tranche CLAIR-1 couvre AC1 ajout titre/note et validation ; AC2 toggle/filtres ; AC3 suppression/annulation ; AC4 persistance/schema/erreurs ; AC5 vide + démo explicitement fictive ; AC6 responsive/clavier/focus. Contrats prêts, dépendances résolues. Tests prévus sur invariants et stockage ; vérification navigateur déléguée au parent et non revendiquée par cet agent. Limites de titre 160 caractères et note 500, données versionnées et validées à la lecture. Fin de périmètre après réalisation locale et tests ; pas de fonctionnalités hors brief.

## Evidence et état
État courant après vérification parent : CLAIR-1 réalisé et vérifié dans Chrome desktop/mobile. Les étapes explorations/cadrage/design/architecture/plan/readiness ont été groupées, pas de document par étape.

## Résultat local et evidence — 2026-09-13
CLAIR-1 réalisé dans `app/`. État lors du retour de l’agent : implémentation locale terminée, acceptation navigateur alors en attente. Aucun commit, PR ou déploiement.

| Critère | Preuve exécutée | Résultat |
|---|---|---|
| AC1 | `node --test tests/*.test.mjs`, cas validation | passé : blanc, trim, bornes titre/note |
| AC2 | même commande, toggle/filtres | passé : immutabilité et ordre |
| AC3 | même commande, suppression/annulation | passé : position, ajout intermédiaire, absence et doublon |
| AC4 | même commande, schéma/adapter | passé : round-trip Unicode, JSON invalide, version, types, IDs dupliqués, exceptions lecture/écriture |
| AC5 | revue du contrôleur et HTML | démarrage vide sans données ; bouton de démo explicitement fictif, notes marquées ; navigateur non exécuté |
| AC6 | revue CSS/DOM | labels, focus visible, annonces, règles 700/1000 px et réduction de mouvement présentes ; comportement/rendu navigateur non vérifiés |

Commande `node --check app/app.mjs` passée. Six tests, zéro échec. Revue locale de ses propres fichiers : contenu utilisateur inséré via textContent, stockage traité au bord, aucune ressource distante, aucun secret, actions couvertes dans le contrôleur. Cette inspection ne démontre pas l'accessibilité complète. Vérification SHA-256 des fichiers installés contre kit-manifest.json : aucun changement. Aucun test navigateur réalisé par cet agent, aucune comparaison pixel ou audit automatique revendiqué.

Prochaine action exacte : parent, exécuter la vérification desktop/mobile et des parcours de CLAIR-1 sur le serveur local. Commande méthode recommandée : `$project-foundation verify CLAIR-1`.

## Vérification indépendante du parent

Interactions Chrome vérifiées : vide, validation, ajout/note, toggle/filtres, rechargement, suppression/annulation, démo, saisie clavier, absence de débordement à 390px, échec de stockage avec conservation en mémoire et alerte. Captures desktop/mobile inspectées. Les animations sont désactivées pour les captures afin de ne pas photographier une barre de progression en transition. Aucun audit complet d’accessibilité.

Constat méthode : l’agent avait conservé une ancienne ligne « implémentation en cours » avant son résultat final. Le parent l’a réconciliée ici ; ce besoin de correction empêche de présenter la tenue du statut comme entièrement autonome. Le rapport agent est un instantané historique. Prochaine action : aucune implémentation restante dans ce périmètre ; intégration et vidéo suivies dans le dépôt DevMethod.
