# Manuel navigable DevMethod

Ouvrir [`index.html`](index.html) dans un navigateur. L'interface ne dépend d'aucun CDN, compte,
service ou build. Les captures sont des observations navigateur déjà versionnées dans les missions ;
les liens de code pointent vers le checkout local.

Pour servir le dossier depuis la racine du dépôt :

```sh
python3 -m http.server 4380 --directory .
```

Puis ouvrir `http://127.0.0.1:4380/docs/handbook/`. Cette commande est un moyen de prévisualisation,
pas une fonctionnalité du CLI DevMethod.

Les liens documentaires s'ouvrent dans `read.html`, un lecteur HTML local qui décode explicitement
l'UTF-8 et structure titres, sommaire, tableaux, listes, code, images et liens internes. Les fichiers
Markdown restent les sources canoniques ; le lecteur évite de les présenter bruts aux utilisateurs.

La progression est enregistrée uniquement dans `localStorage`. Elle constitue une aide de lecture,
pas une preuve de compétence ni une donnée du Studio.

Sources éditoriales : [`../START-HERE.md`](../START-HERE.md), guides par domaine, ADR acceptés et
rapports de mission liés à une révision.
