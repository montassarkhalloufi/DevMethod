# DevMethod : rapport consolidé de dogfooding

17 septembre 2026. Ce rapport réunit le développement de DevMethod avec sa propre
méthode, la création de son site dans Studio et la comparaison de parcours concurrents.

**Le résultat acquis est une boucle locale réelle : créer un projet, transmettre une
demande à l'agent hôte, essayer une livraison, conserver un échec, corriger, vérifier
une nouvelle version et restaurer son export.** L'exercice a aussi corrigé la méthode
et plusieurs défauts de Studio. Il ne démontre pas une supériorité de productivité,
une publication en ligne ou une autonomie complète pour un utilisateur débutant.

La finition du film reste ouverte : la vidéo avec la voix Daniel est techniquement
lisible, mais l'utilisateur juge cette voix trop robotique. Son remplacement par une
voix neuronale Kokoro est en cours, sans validation finale à ce stade.

Les preuves détaillées sont réparties dans trois rapports complémentaires :

- [Évolutions de la méthode, historique et contre-exemples](devmethod-dogfooding-method-lessons-2026-09-17.md).
- [Parcours Studio, corrections du site et export](studio-site-dogfooding-2026-09-17.md).
- [Comparaison d'expérience avec Bolt, Lovable et Base44](studio-competitor-experience-2026-09-17.md).

## Ce qui a réellement été obtenu et corrigé

Le site anglais a été créé depuis l'interface Studio, avec un brief, des révisions et
des contrôles conservés dans le projet. Les documentations anglaises font partie du
site ; elles décrivent le checkout de développement sans promettre que toutes les
nouveautés sont déjà disponibles dans la version npm publiée. Le film utilise des
captures réelles de l'interface, montées avec narration et sous-titres. Sa production
a utilisé un outillage média extérieur à Studio : ce n'est pas une fonction native
de génération vidéo démontrée.

| Défaut rencontré | Correction ou état actuel | Ce que la vérification établit |
| --- | --- | --- |
| Deux liens de documentation renvoyaient une erreur 404 : fichiers locaux présents, mais absents du `main` public. | Documentation anglaise embarquée dans le site. | Les deux pages s'ouvrent dans le site et dans sa restauration locale. |
| Huit pixels de débordement mobile et absence de retour pendant une copie en attente. | Décoration contenue, ajustements mobiles, retour immédiat et repli borné pour la copie. | À 390 px, largeur du document et largeur défilable identiques ; menu, copie, filtres, FAQ et navigation clavier essayés. |
| Réouvrir un guide affichait « Vos réponses ont changé » sans modification. | Message corrigé pour distinguer réponses conservées et préparation à revérifier. | Régression UI reproduite avant correction, puis réussie ; aucune préparation ni application automatique ajoutée. |
| Vidéo et sous-titres servis avec un type générique. | Types MP4 et VTT ajoutés au serveur partagé. | En-têtes et octets vérifiés dans l'aperçu vivant et dans un export restauré ; lecture réelle ensuite vérifiée sur la v3. |
| Voix Daniel jugée trop robotique par l'utilisateur. | Remplacement Kokoro en cours. | Les tests techniques précédents restent valides pour leur version ; ils ne prouvent ni naturel de la voix ni satisfaction. La nouvelle voix reste à écouter et valider. |

La première observation navigateur négative n'a pas été effacée. La deuxième version
a sa propre observation positive. Trois contrôles locaux ont également été exécutés
dans Studio : syntaxe, imports relatifs et marqueurs de secrets connus. Chacun garde
sa portée limitée ; aucun ne certifie toute l'application.

Après les correctifs du guide et des types MIME, la suite du dépôt comptait **1070
tests réussis**, avec lint et formatage réussis. Les liens documentaires et le contenu
du paquet ont aussi été contrôlés. Ce nombre concerne le dépôt, pas une mesure de
qualité perçue du site ou de sa narration. Les résultats, versions et limites sont
consignés dans le [rapport de réalisation](studio-site-dogfooding-2026-09-17.md).

Une piste supplémentaire reste à reproduire : l'agent principal a observé une page
Chrome « Ce contenu est bloqué » pour GitHub dans l'iframe Studio. L'action ayant
précédé cet écran n'a pas été observée. Ce constat ne suffit donc pas à attribuer un
défaut à un clic précis ; la navigation externe depuis l'aperçu mérite un essai borné
ultérieur, sans élargir la correction de voix en cours.

## Ce que le dogfooding a changé dans la méthode

Avant cette journée, la méthode prescrivait déjà des décisions explicites, une
vérification proportionnée et la reprise du contexte. Le 16 septembre, elle avait
précisé qu'une comparaison doit mesurer le parcours complet de la personne avec son
agent, y compris le travail nécessaire pour construire les bonnes consignes. Donner
gratuitement un dossier expert à une seule condition fausserait cette comparaison.

Le 17 septembre, trois évolutions ont rendu ces principes plus concrets :

1. **Présenter le résultat et poursuivre la délégation acquise.** Les règles demandent
   moins de mécanique visible et évitent de renvoyer à la personne une continuation
   déjà autorisée. Un exercice isolé de petite correction a vérifié cette conduite,
   sans démontrer un gain général de temps.
2. **Conserver des objets utiles à la reprise.** Brief, choix partiels, raisons,
   versions, demandes et preuves sont distingués. L'adoption d'un dépôt reprend ses
   sources sans fabriquer une histoire de décisions absente. Les régressions de
   sauvegarde ont montré pourquoi une réponse ancienne ne doit pas remplacer un
   choix récent.
3. **Vérifier le geste et le résultat revendiqués.** Une capture n'est pas un clic
   réussi ; une connexion n'est pas une opération métier ; un export présent n'est
   pas une restauration utilisable. Les règles ciblent la première composition
   représentative, puis la nouvelle révision après correction.

Ces changements sont traçables notamment aux commits `b8724c1` et `708afdb`. Ils
s'accompagnent de capacités Studio, sans confondre une instruction écrite avec son
application effective. Les [leçons détaillées](devmethod-dogfooding-method-lessons-2026-09-17.md)
relient chaque évolution à son propriétaire et à ses preuves.

Le retour sur la voix ajoute une leçon d'activation : **le critère utilisateur doit
être essayé avant de multiplier la production**. Un court extrait de narration peut
être écouté et discuté avant le rendu complet. Il n'est pas nécessaire d'inventer une
nouvelle étape universelle ; il faut appliquer la vérification au risque réel du
livrable. Une vidéo décodable, bien exportée et sous-titrée peut encore manquer son
objectif de présentation.

## Positionnement face aux expériences concurrentes

Les observations et sources officielles consultées les 16–17 septembre apportent des
repères concrets, pas un classement. Le même projet n'a pas été mené de bout en bout
dans chaque produit, et le travail Studio a bénéficié d'agents techniques ainsi que
de corrections du produit pendant l'essai.

| Dimension | Appréciation étayée |
| --- | --- |
| De l'idée au premier résultat | Les builders documentent une prise en charge intégrée. Le site Studio a utilisé le pont manuel de l'agent hôte : c'est une friction de parcours réelle, sans comparaison de vitesse mesurée. |
| Guidage des intégrations | Les questions et résumés observés dans Lovable ont aidé à structurer les guides. Il faut séparer usage, identité, cible et permissions plutôt que reproduire un formulaire générique. |
| Connexions et droits | Bolt a affiché une connexion Notion et ses outils ; aucun appel métier n'a été exercé dans ce parcours. Studio a des contrats MCP et des politiques effectivement testés localement, mais toutes les connexions fournisseurs réelles restent à éprouver. |
| Itération et traçabilité | Studio conserve le constat négatif, la correction et la nouvelle preuve. C'est un acquis vérifié, sans exclusivité revendiquée : les concurrents documentent aussi tests, historique ou restauration. |
| Sortie utilisable | L'export et la restauration locale fonctionnent. La publication intégrée documentée par les concurrents reste un écart de parcours ; le site DevMethod n'est pas publié. |

Le scénario Notion de Lovable fournit aussi un contre-exemple : un plan correctement
orienté vers MCP promettait des garanties de lecture seule que l'autorisation
fournisseur n'établissait pas. DevMethod doit donc conserver séparément l'intention,
l'accès réellement accordé et les restrictions qu'il impose dans son propre pont.
Un guide rassurant ne constitue pas une preuve de sécurité.

La [comparaison détaillée](studio-competitor-experience-2026-09-17.md) distingue
captures, documentation, essais et interprétations. Les campagnes antérieures sur
Spec Kit et BMAD, interrompues ou partielles, ne permettent aucun classement des
méthodes. Les contre-exemples favorables à des outils ordinaires restent conservés.

## Six priorités avec critères de sortie

La première action répond au retour utilisateur en cours. Les autres sont des
propositions d'amélioration, pas des réalisations annoncées ni une autorisation
implicite d'acheter, connecter un compte ou publier.

| Priorité | Action | Résultat observable attendu |
| --- | --- | --- |
| **P0 — Finition actuelle** | Remplacer la voix et vérifier la qualité perçue avant de clore le film. | Extrait Kokoro écouté, naturel et intelligibilité évalués ; film final, sous-titres et nouvel export revérifiés sur la révision correspondante. La validation utilisateur, si obtenue, est enregistrée séparément des tests techniques. |
| **P1 — Continuité** | Clarifier et simplifier la prise en charge après l'envoi d'une demande. | La personne voit qui agit, ce qui attend et ce qui manque. Le mode manuel propose une reprise directement exploitable ; aucun statut d'exécution n'est simulé. Une petite correction autorisée ne redemande pas sa délégation. |
| **P1 — Connexions utiles** | Éprouver une opération fournisseur réelle, puis étendre à des cas représentatifs OAuth, PAT et API applicative. | Pour chaque accès autorisé : connexion, opération sur une ressource de test, refus attendu, reprise et déconnexion observés. Le prompt montre l'usage et l'activation ; un guide rempli ou une liste d'outils ne vaut pas intégration. |
| **P1 — Livraison complète** | Réutiliser le parcours site, documentation, mobile, média et export comme recette ciblée. | Première tranche essayée avant réplication ; échec conservé, correction liée à sa nouvelle version, archive restaurée et produit ouvert indépendamment. Une éventuelle publication fera l'objet d'une cible et d'une autorisation distinctes. |
| **P2 — Reprise lisible** | Garder un contexte ciblé et une entrée actuelle vers les preuves. | Après interruption et changement sans rapport, la tâche retrouve choix actifs, raisons utiles, données et contrôles applicables. Les anciennes limites restent datées et renvoient à leur évolution ; le détail n'encombre pas le parcours principal. |
| **P2 — Valeur mesurée** | Comparer un besoin réel de bout en bout avec une alternative compétente. | Protocole fixé avant l'essai ; préparation, supervision, décisions, corrections, reprise et résultat accepté comptés. Temps humain, attente et coûts inconnus restent séparés. Un cas réussi ne devient pas une promesse générale. |

Les tests, la revue indépendante et les recettes ont été utiles parce qu'ils ont
produit des corrections observables. Leur volume seul n'est pas le résultat à
optimiser. Le prochain progrès à démontrer est une création plus continue, une
reprise moins coûteuse et un résultat que la personne juge effectivement satisfaisant.

## Statut final — à compléter après la reprise de voix

Point de situation transmis par l'agent principal lors de cette consolidation :

- La v3 `5554190a-1048-43c9-b0b5-bdff378e7d05` a été vérifiée pour la lecture vidéo,
  les sous-titres, puis exportée et restaurée en **33 fichiers**. Ces faits complètent
  le checkpoint précédent du rapport site ; ils n'ont pas été rejoués pour cette
  synthèse.
- Cette v3 utilise la voix Daniel rejetée par l'utilisateur comme trop robotique.
  Elle reste une preuve de transport, lecture et restauration, pas la version finale
  acceptée du film.
- Le remplacement Kokoro est en cours et doit produire une nouvelle révision. Sa voix,
  son rendu complet et son nouvel export ne sont pas déclarés validés ici.
- Le site n'est pas publié. Aucun essai GitHub authentifié avec un PAT réel n'est ajouté
  par ce rapport.

À renseigner à la clôture : révision retenue, retour sur la nouvelle voix, contrôles
de lecture et sous-titres, archive restaurée correspondante, et limites restantes.
Le [rapport du site](studio-site-dogfooding-2026-09-17.md) conserve le détail de ces
preuves. La présente synthèse n'a exécuté aucun nouveau test produit ni appel fournisseur.
