# Publication du manuel sur devmethod.dev

Ce runbook publie le manuel sans exposer le dépôt complet et sans modifier ses sources pendant le
transfert. L'architecture est décidée dans [l'ADR 030](../ADR-030-public-handbook.md).

## Construire le livrable

Depuis la racine du dépôt :

```bash
git fetch origin main
git merge-base --is-ancestor HEAD origin/main
npm run build:public-handbook
node --test tests/public-handbook.test.mjs
npm run check:docs
```

La deuxième commande doit réussir avant publication : le lecteur public construit ses liens
« Voir la source GitHub » vers `main`. Déployer une révision absente de `origin/main` publierait un
manuel lisible mais des liens de source en `404`.

Le résultat est `dist/public-handbook/`. Son manifeste doit annoncer
`devmethod-public-handbook` et le chemin `/docs/handbook/`.

## Cible OVH observée

- hébergement : `devmetb.cluster129.hosting.ovh.net` ;
- serveur SFTP : `ftp.cluster129.hosting.ovh.net`, port `22` ;
- compte : `devmetb` ;
- racine du compte : `/home/devmetb` ;
- SFTP activé ;
- racine publique confirmée : `/home/devmetb/www` ;
- site servi par Apache.

La racine a été confirmée dans l'onglet **My sites** du Manager OVH le 25 septembre 2026.

## Déployer sans écraser le site

1. Télécharger une sauvegarde des fichiers publics actuels et noter l'heure.
2. Envoyer le nouveau paquet dans un répertoire temporaire voisin de la cible.
3. Vérifier la présence de `index.html`, `read.html`, des quatre assets CSS/JS, de `content/` et du
   manifeste.
4. Renommer l'ancien `/docs/handbook/` en sauvegarde datée s'il existe.
5. Renommer le répertoire temporaire en `/docs/handbook/`.
6. Ajouter dans la navigation principale un lien `Handbook` vers `/docs/handbook/`.
7. Ajouter `https://devmethod.dev/docs/handbook/` au sitemap public.

Le mot de passe SFTP ne doit pas être écrit dans le dépôt, un script ou une sortie de commande.

## Vérifier la production

- `https://devmethod.dev/docs/handbook/` répond en HTTPS avec un statut `200` ;
- CSS, JavaScript, images et Markdown répondent sans `404` ni contenu mixte ;
- les 14 chapitres, la recherche, la progression locale et le menu mobile fonctionnent ;
- une référence approfondie s'ouvre dans le lecteur ;
- un lien de code ouvre le bon fichier sur GitHub ;
- clavier, focus visible et largeurs desktop/mobile restent utilisables ;
- la page d'accueil du site conduit au manuel et le retour vers le site fonctionne.

## Revenir en arrière

Remettre le répertoire sauvegardé à sa place, restaurer la navigation et le sitemap précédents, puis
rejouer les contrôles HTTP. Ne jamais corriger directement le paquet distant : corriger la source du
dépôt, reconstruire et redéployer.

## Publication observée le 25 septembre 2026

- URL publique : `https://devmethod.dev/docs/handbook/` ;
- navigation principale et pied de page reliés au manuel ;
- sitemap public mis à jour ;
- réponses `200` observées pour l'index, CSS, JavaScript, Markdown et une image du Control Plane ;
- parcours navigateur observé de la page d'accueil vers le manuel puis vers `docs/START-HERE.md` ;
- anciens fichiers distants conservés sous `index.html.before-handbook-20260925` et
  `sitemap.xml.before-handbook-20260925` ;
- première préproduction écartée supprimée après vérification ;
- connexion SFTP et serveur HTTP local de contrôle fermés après publication.

Ces observations prouvent ce déploiement précis. Elles ne remplacent pas les contrôles d'une future
publication reconstruite depuis une autre révision.
