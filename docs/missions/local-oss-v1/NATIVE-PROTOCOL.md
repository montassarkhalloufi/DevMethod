# Recette native v1 — protocole distinct, avant appels

Date : 2026-09-21. État initial : préparé avant appels ; résultat daté en fin de document.
Autorité : continuation v1 et bornes techniques déléguées par le propriétaire.
Ce protocole n'ouvre pas les essais Les Ateliers ou les comparaisons historiques clos.

## Premier scénario intégré

Projet nouveau « Inventaire local » : application React/TypeScript strict avec articles,
quantités et note, stockage dans l'API locale versionnée. Ajouter un article, recharger,
modifier le besoin (alerte quantité minimale) et vérifier conservation des données.
Demande et création par le runner lancé depuis l'interface Studio. Les données sont fictives.
Ce n'est ni une mesure comparative, ni une preuve du portage du site, prévu séparément avec
ses références et bornes avant appels. Aucun remplacement du périmètre final par cette démo.

Pour cette campagne initiale : 6 admissions maximum, 300000 tokens rapportés cumulés comme
seuil d'admission entre appels, timeout local 300000 ms par processus. Aucun prix monétaire
supposé. Le fournisseur n'expose pas ici de plafond dur de tokens : un appel peut dépasser
le seuil. Le timeout local ne prouve pas l'annulation côté fournisseur. Une consommation
inconnue suspend la campagne. Les limites ne seront pas relevées silencieusement, ni le
registre supprimé ou recopié pour contourner un arrêt. Aucun achat ou changement vers API.

Configuration à saisir et relire depuis Studio avant la première demande. Installation
Codex existante, connexion ChatGPT constatée par sonde du 21 septembre, CLI0.147.0 ; re-sonde
au moment de l'activation. Répertoire isolé dans evaluation-private/local-oss-v1/native-home/projects/e4b27e38-f943-4fb1-9329-ffb1803df8a8.
Le profil `react-ts` est enregistré dans Studio avant activation ; le mode Autonome
applique la délégation de mission, sans constituer une approbation humaine de recette.
Conserver jobs, révisions, limites et journaux utiles, sans credentials dans les preuves.

## Observations et arrêts

Exercer rapidement création → progression réelle → contrôles → résultat et données depuis
le navigateur. Si un défaut Studio bloque, conserver contexte/job, réparer son code dans
le worktree de développement, puis reprendre le même scénario. Ces réparations bootstrap
ne sont pas des réalisations natives de l'application. Aucune écriture externe de l'app.

Ajouter ensuite évolution, défaut réel ou fixture négative explicitement identifiée,
correction bornée, péremption de preuve, décision de risque, intervention, interruption/
reprise, export/restauration et ouverture autonome. Ne pas introduire un défaut dans une
application utilisateur pour fabriquer une panne. Chaque observation indique source,
scénario, révision/job, attendu, constaté, limites et suite utile. Les critères impossibles
à ce stade restent ouverts et pilotent les développements suivants.

Une approbation émise par un agent de recette sera identifiée comme telle et ne prouvera
pas une intervention humaine. La participation réelle nécessaire sera demandée à partir
d'un résultat concret dans Studio. Ce protocole ne fabrique aucune acceptation du site
ou du film, et n'autorise aucune publication.

## Résultat du premier appel

Appel lancé10:17:08Z, timeout10:22:08Z le21 septembre. Usage fournisseur inconnu ; campagne
suspendue sans changement de bornes. Reprise locale sans fournisseur et observations réelles :
[NATIVE-INVENTORY](evidence/NATIVE-INVENTORY.md). Une éventuelle reprise des appels attend
une décision explicite ; cette note ne l’autorise pas.
