# Studio React typé — checkpoint du 16 septembre 2026

Tranche : source React 19 réellement éditable, typée et compilée, avec évolution réutilisable
pour les nouveaux projets. Voir [ADR 017](../../ADR-017-typed-react-studio.md),
[guide de lancement](../../STUDIO.md), [template](../../../templates/studio-react/README.md)
et [exemple métier](../../../examples/studio-ateliers-react/README.md).

## Essayer sur cette machine

Le projet isolé tourne sur <http://127.0.0.1:4342/> ; application sur
<http://127.0.0.1:4343/> ; workspace `/private/tmp/devmethod-react-live`.
Code → fichier TSX → Modifier le code → Vérifier et actualiser. Les fichiers colorés,
diagnostics, diff, aperçu et adoption sont réels. Aucun fournisseur n’est lancé.

Si arrêté :

```sh
node scripts/studio.mjs serve --workspace /private/tmp/devmethod-react-live --port 4342 --preview-port 4343
```

Pour une autre copie, dans un dossier absent/vide :

```sh
node scripts/studio.mjs example-react --workspace /private/tmp/devmethod-react-copy --delegate-technical
node scripts/studio.mjs serve --workspace /private/tmp/devmethod-react-copy --port 4352 --preview-port 4353
```

`example-react` exige cette délégation technique explicite avant de créer la copie. Elle
ne change que sa responsabilité structurelle ; le mode et les responsabilités visuelles
et d’adoption effectives sont conservés. La commande compile un portage enregistré,
préserve l’historique et réconcilie la décision d’architecture avec une décision d’agent,
sans inventer une approbation humaine. Elle ne démontre pas une génération nouvelle par un modèle.
Les anciens serveurs/projets 4330/4331 et 4334/4335 restent distincts et préservés.
Le serveur 4340/4341 est une copie QA HTML/JS ; les captures Monaco TSX finales sont sur 4342.

## Observé

- Source découpée : vues/components, synchronisation/hooks, modèle pur et validation du réseau.
  Compiler et widget sont écrits en TypeScript ; le shell et plusieurs modules historiques
  Studio restent JavaScript. Il ne s’agit pas d’une migration totale du dépôt vers React.
- Le template générique et l’exemple métier passent TypeScript et Vite ; l’exemple passe
  aussi dix tests métier/API.
  Le runtime Studio compile avec TS/esbuild/Tailwind, sans exécuter le Vite config du projet.
- Couleurs par langage, lignes, frappe, undo, diff et refus d’erreur vérifiés dans Chrome.
  [Captures et revue](evidence/react-studio/MONACO-REVIEW.md).
- Inscription de contrôle Mina, filtre Couture, saisie conservée au rechargement, redémarrage
  réel du serveur et données conservées : [trace du parcours](evidence/react-studio/journey.json).
- Révision active `336de365-3d32-476e-9577-5d5798829ed8`. Trois inscriptions et une attente
  historiques ont été conservées ; une quatrième inscription fictive a été ajoutée par le
  navigateur sur la copie React seulement. Quatre inscriptions et une attente, données
  version 11, SHA-256 `7e5a1c94e6383910e6d583268c97fbe8ca94c0af27a7a8fd803bd40ab32e73c0`.
- Redémarrage réel du serveur, PID `15289` → `44167` : données et brouillon de reprise
  conservés. Les corrections issues de la [revue Vercel](evidence/react-studio/VERCEL-REVIEW.md),
  dont la conservation de saisie pendant une inscription et la synchronisation du filtre
  avec l’URL, ont rejoint le live par le job `7e832ad9-e418-4732-8e1a-a777cdee3dd5`.
  La [trace](evidence/react-studio/journey.json) distingue ce job du redémarrage antérieur.
- Une erreur de type volontaire a bloqué l’adoption avec fichier/ligne. L’annulation clavier
  n’a retiré que le dernier groupe de frappe ; restauration exacte par l’API éditeur ensuite,
  sans adoption de code. Ce détail n’est pas masqué comme un parcours UI de correction complet.
- Tests d’intégration : erreur/correction, refus d’adoption tardive, fichier compilé altéré,
  export et vrai redémarrage. La coloration n’est pas un contrôle métier indépendant.
- Les artefacts compilés incluent les licences complètes des paquets réellement incorporés,
  dans `THIRD_PARTY_NOTICES.txt`, lui-même couvert par le manifeste et l’export.

## Disposition et palette essayées

La référence M bleu nuit/ardoise est appliquée au shell et a été inspectée dans le vrai
navigateur ; elle reste distincte du design Agenda de l’application. La
[revue de palette](evidence/react-studio/PALETTE-REVIEW.md) conserve les calculs de contraste
et les limites de la première session. La [revue de disposition](evidence/react-studio/LAYOUT-REVIEW.md)
et les captures finales complètent ces observations :

- Séparation déplacée à la souris de 452 à 372 px, puis à 388 px au clavier ; largeur
  retrouvée à 388 px après rechargement.
- À 762 px de hauteur, la compaction fait passer l’espace de conversation de 141 à 340 px
  et l’aperçu de 258 à 400 px ; le composeur passe de 265 à 134 px. L’en-tête mesure 64 px
  et le dock 66 px. Conversation et aperçu défilent indépendamment.
- Les vues Application et Code ont été essayées en mode agrandi. Il s’agit d’une disposition
  CSS étendue, pas de l’API plein écran du navigateur ; les éléments de travail sont conservés.
- À 354 px de largeur CSS, aucun débordement horizontal observé. Dans l’application,
  « Garder mon inscription » ferme la confirmation sans modifier les données.

Ces observations portent sur les parcours et dimensions indiqués, sans prétendre à une
couverture exhaustive des navigateurs ou des technologies d’assistance.

## Vérifications de ce checkpoint

`npm test` : **532 tests passent, aucun échec ni test ignoré**, dans le second essai local
(`devmethod-react-release-test-2.log`, conservé hors du dépôt). Le premier essai de 530 tests
avait 513 succès et 17 échecs liés à `doctor` ; cet échec reste conservé, il n’est pas remplacé
par le résultat vert. Lint, format et contrôle documentaire passent aussi après correction.
Les deux applications passent leur build TypeScript/Vite.

L’archive locale a passé le smoke consommateur : installation des dépendances runtime,
compilation React réelle, assets Monaco, données, export/reprise et trois profils de skills.
Aucun appel fournisseur. Les [sorties de vérification](evidence/react-studio/validation.json)
conservent leur portée. La [PR #38, en brouillon](https://github.com/montassarkhalloufi/DevMethod/pull/38)
contient cette livraison. Sur `4c4719d`, la [CI d’installation](https://github.com/montassarkhalloufi/DevMethod/actions/runs/35137041327)
passe sur macOS et Linux ; Windows vérifie les trois profils puis atteint la limite globale
de 15 minutes pendant le smoke suivant. Le [contrôle fullstack](https://github.com/montassarkhalloufi/DevMethod/actions/runs/35137041279)
passe aussi. Ce timeout n’est pas compté comme une réussite Windows.

La CI installe désormais l’archive une fois, puis vérifie les trois profils avec le binaire
local via `npx --offline --yes=false`. Les mêmes diagnostics et empreintes sont conservés,
ainsi que le smoke consommateur distinct ; le délai global reste de 15 minutes. Le bloc
YAML exact a passé un essai local avec les trois profils. Les checks de la PR donnent le
résultat multi-plateforme de cette correction, sans étendre les conclusions locales.
Aucun paquet n’a été publié.

## Enseignements conservés

La revue a trouvé des marqueurs serveur périmés, un repli Monaco pouvant interrompre la
sauvegarde, une arborescence étirant le panneau, un profil laissant passer `.mts/.cts`,
un intitulé de compilation attribué à tort à Vite et une décision d’architecture encore
HTML/JS après le portage. Ces points sont corrigés et les limites nommées dans l’interface.
Le contrôle npm ne suffisait pas pour Monaco : son DOMPurify vendored 3.4.8 restait embarqué
malgré l’override 3.4.15. Le build remplace explicitement ce module et inspecte l’artefact.

La distribution a révélé deux frontières distinctes. Le compilateur cherchait les
dépendances transitives depuis DevMethod au lieu de leur paquet propriétaire : une
installation npm valide avec `scheduler` imbriqué échouait. La résolution est corrigée et
deux régressions couvrent les dépendances imbriquées et les versions coexistantes. Les
octets des références Vercel épinglées sont protégés contre la conversion de fins de ligne.
L’ajout de ces ressources a aussi révélé une divergence entre installation et diagnostic :
l’autorisation des fichiers runtime est maintenant partagée, sans accepter arbitrairement
des scripts. Les 17 échecs du premier essai global ont conduit à cette correction.

Une première installation de smoke offline depuis le dossier extrait a essayé de résoudre
des métadonnées de développement absentes du cache. Le contrôle final installe l’archive
comme un vrai consommateur, avec ses dépendances de runtime uniquement. La première
installation peut consulter npm ; les compilations du projet ne téléchargent rien.

## Limites et suite

Les trois modes et délégations restent ceux d’ADR 016. Une compilation verte ne prouve pas
l’adéquation au besoin ; aucune supériorité face à un bon agent, BMAD ou Spec Kit n’est
établie. Aucun nouvel appel natif : budget précédent toujours clos.

Le runtime est un profil SPA React local avec API JSON, pas un serveur Next/RSC ou Nest.
Les bibliothèques acceptées sont explicites. Auth, services externes et déploiement demeurent
indisponibles dans ce profil. La palette Olive a été rejetée, puis l’utilisateur a validé
la référence M bleu nuit/ardoise avec trois niveaux de surface : voir [décision visuelle](STUDIO-DESIGN.md).
La réalisation a maintenant été essayée dans le navigateur comme décrit ci-dessus ; les
captures antérieures de Monaco restent une preuve d’édition, pas une acceptation artistique
rétroactive. La distribution locale est vérifiée ; les conclusions CI sont à lire sur la PR de cette branche.
