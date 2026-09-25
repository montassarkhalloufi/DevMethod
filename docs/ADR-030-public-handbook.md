# ADR 030 — Publier le manuel depuis ses sources canoniques

- Statut : accepté
- Date : 2026-09-25
- Propriétaires : documentation mainteneur et site public

## Contexte

Le manuel HTML doit devenir accessible depuis `https://devmethod.dev/docs/handbook/`. Les chapitres
approfondis restent cependant des fichiers Markdown du dépôt. Copier leur contenu à la main dans le
site créerait deux sources de vérité et rendrait les corrections futures incertaines.

Le site `devmethod.dev` est actuellement servi comme contenu statique sur un hébergement Apache OVH.
Son dépôt source et son mécanisme de déploiement ne font pas partie de ce dépôt.

## Décision

`docs/handbook/` reste l'interface mainteneur. Les Markdown du dépôt restent les sources canoniques.
`npm run build:public-handbook` produit un paquet statique autonome destiné au chemin public
`/docs/handbook/` :

- les documents et médias atteignables sont copiés sous `content/` ;
- les liens entre références restent navigables dans le lecteur HTML ;
- les liens vers le code ouvrent la branche `main` sur GitHub ;
- l'index public est indexable, alors que le lecteur à paramètres reste `noindex,follow` ;
- un manifeste identifie explicitement un paquet que le build peut remplacer sans toucher à un
  autre répertoire.

Le déploiement remplace seulement le répertoire public du manuel. L'ajout d'un lien dans la
navigation principale et du chemin dans le sitemap appartient au site public.

## Conséquences

Une correction documentaire est faite une fois puis republiée. Le paquet est compatible avec un
hébergement statique sans Node côté serveur. Le dépôt devient capable de fabriquer le livrable mais
ne prétend pas l'avoir publié : la publication et le smoke test de l'URL réelle restent des preuves
séparées.

## Alternatives écartées

- Copier les pages à la main : divergence inévitable.
- Déployer tout le dépôt : surface publique et poids inutiles.
- Héberger un second site documentaire : navigation et identité produit fragmentées.

## Réversibilité

Restaurer la sauvegarde du répertoire `/docs/handbook/`, retirer le lien de navigation et l'entrée du
sitemap. Les Markdown canoniques et le manuel local ne dépendent pas du serveur public.
