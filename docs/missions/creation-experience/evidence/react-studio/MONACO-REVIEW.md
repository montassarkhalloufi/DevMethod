# Éditeur multicolore — vérification ciblée

Date : 2026-09-16. Agent de réalisation `studio_design`, avec régressions indépendantes de `studio_state`. Cette revue technique n’est pas une validation humaine d’utilisabilité.

## Mécanisme réalisé

Monaco 0.56 est embarqué localement, monté par React 19. Le code TypeScript sépare la vue, le hook de cycle de vie, les contrats et le choix du langage. Le contrôleur existant conserve la responsabilité du brouillon, de l’enregistrement optimiste, de la vérification et de l’adoption. Aucun CDN n’est appelé pour charger l’éditeur.

La coloration suit l’extension : TS/TSX, JS/JSX, CSS, JSON, HTML et Markdown. L’éditeur conserve un modèle et une pile d’annulation par fichier. La comparaison utilise les contenus réels des deux révisions ; les fichiers tronqués ou binaires ne sont pas présentés comme des comparaisons complètes.

Les diagnostics syntaxiques locaux ne valent pas compilation du projet. Le contrôle sémantique TS/JS de Monaco est désactivé : sans toutes les bibliothèques et tous les fichiers du projet, il produirait notamment de faux imports introuvables. Le serveur exécute le protocole strict du projet React. Les marqueurs serveur ne s’appliquent plus au texte dès qu’il est modifié ; le panneau conserve les anciens contrôles comme tels jusqu’à une nouvelle vérification.

## Observations navigateur réelles

Chrome, viewport CSS 1562 × 762. Les serveurs de contrôle sont séparés du projet utilisateur : `4340/4341` pour les manipulations récupérables, `4342/4343` pour la lecture du projet React. Aucun appel de génération par modèle dans cette revue.

- HTML, CSS et JavaScript : plusieurs couleurs effectivement rendues et numéros de lignes visibles. TS, TSX, JSON et Markdown : même contrôle sur les vrais fichiers du projet React. JSX est pris en charge par le routage JavaScript, mais aucun fichier JSX distinct n’a été essayé dans le navigateur pendant cette revue.
- Une nouvelle ligne tapée dans `index.html` reste présente après passage à un autre fichier puis retour. Le curseur revient à la ligne 2. Cmd-Z rétablit le texte initial.
- Suppression temporaire du premier `i` de `import` dans `app.js`, aperçu automatique désactivé : 3 diagnostics syntaxiques locaux, 2 soulignements rouges visibles. Passage à Markdown : le compteur revient à 0. Retour au JS puis Cmd-Z : texte initial rétabli. Aucune adoption ni modification des données métier.
- Comparaison de deux versions réelles de `index.html` : 1 ligne ajoutée, 1 supprimée selon le comparateur de contenus ; affichage Monaco diff réel, sans texte inventé.
- Aucun message console de niveau warning/error relevé dans ces onglets. Aucun débordement horizontal de la page.
- Défaut trouvé puis corrigé : une longue arborescence React étirait le code à plus de 1100 px. La colonne fichiers est maintenant contrainte et défile dans son espace ; les commandes restent dans le panneau.

## Régressions et limites

48 tests ciblés réussis : contrôleur d’édition, consultation/comparaison, shell et pont Monaco. TypeScript strict et ESLint ciblé passent. Les tests du pont injectent une implémentation contrôlée pour provoquer les échecs ; les captures navigateur, et non ces doubles de test, établissent que Monaco fonctionne réellement.

Les régressions indépendantes couvrent les marqueurs serveur devenus anciens, ainsi qu’une exception lors du montage ou d’un appel `setDocument`, `setDiagnostics` ou `focus`. L’éditeur se libère une seule fois et rend le champ texte utilisable, sans interrompre le contrôleur de sauvegarde.

Le bundle Monaco reste volumineux et est chargé à la demande. Ce travail ne démontre ni l’accessibilité complète de l’éditeur sur mobile, ni une supériorité de DevMethod sur les autres produits. Le thème général du Studio n’a pas été changé par cette tranche.

Captures : `monaco-syntax-error.jpg`, `monaco-diff.jpg`, `monaco-tsx.jpg`. Mesures finales : `monaco-browser.json`.
