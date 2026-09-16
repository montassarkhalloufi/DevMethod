# Les Ateliers — exemple Studio enregistré

Cet exemple conserve une application locale et son parcours réel : cadrage, références
Agenda, versions de code, échec du premier démarrage, correction, liste d’attente FIFO et
contrôles rattachés aux révisions. Les données nominatives sont fictives. Il ne s’agit pas
d’un générateur spécialisé ni d’une simulation de nouvel appel modèle.

Depuis la racine du dépôt, avec Node.js 22+, choisir un dossier absent ou vide :

```sh
node scripts/studio.mjs example --workspace /private/tmp/devmethod-example
node scripts/studio.mjs serve --workspace /private/tmp/devmethod-example --port 4340 --preview-port 4341
```

Ouvrir `http://127.0.0.1:4340/` pour Studio ou `http://127.0.0.1:4341/` pour l’application.
Sur un système où `/tmp` est un vrai dossier, il peut remplacer `/private/tmp`. Les liens
symboliques dans le chemin sont refusés ; sur macOS, utiliser le chemin réel ci-dessus.
Avec le package installé, remplacer `node scripts/studio.mjs` par `devmethod studio`.

`example` reconstruit le workspace à partir de [l’état](state/studio.json), des
[données](state/data.json), des versions et des références présentes dans le dépôt.
Le [registre historique](state/agent.json) est conservé : un appel natif, 277 934 tokens
rapportés, arrêt d’admission atteint. Aucun modèle n’est appelé pour cette reconstruction.
Ne pas remettre ce budget à zéro ni ajouter un fournisseur pour rejouer artificiellement
la preuve. Le serveur démarre par défaut avec le bridge hôte, sans agent automatique.

Dans cette copie, filtrer les ateliers, inscrire un nom lorsqu’il reste une place, rejoindre
la liste d’attente d’un atelier complet puis annuler une inscription pour promouvoir le
premier nom en attente. Examiner aussi les anciennes versions et le contrôle initial en
échec. La fixture conserve six révisions ; la version active est
`1aea70fe-1134-4dfa-a872-a79e3003b6aa`. Cette dernière modifie le pied de page HTML après
un parcours réel de l'éditeur, erreurs et récupération comprises. Son unique nouveau contrôle
est statique ; les anciens contrôles fonctionnels restent rattachés à leurs versions.
Les données actives version 10 conservent Noa, Omar et Lina inscrits, avec Sami en attente.
L'inscription « Essai brouillon » du parcours éditeur n'est pas dans ces données.

Les preuves historiques n’attestent que les révisions qu’elles nomment. L’export autonome
initial porte sur `b44b4b37…` ; les captures Chrome finales portent sur la correction CSS
`4bb3238f…` ; le [parcours éditeur](../../docs/missions/creation-experience/evidence/studio/editor-journey.json)
porte sur `1aea70fe…`. La reconstruction de cette fixture n’est pas une nouvelle vérification
navigateur. Le choix Agenda est délégué à l'agent : sa provenance active a été rectifiée par
la demande de contexte `5f090ff9-fc4f-47f1-b8d8-cabacf1a6b30`, sans changer le code ni réécrire
l'ancienne entrée, conservée comme remplacée. Aucun choix humain de cette application n'est revendiqué.
K concerne le shell Studio : sa composition et ses fonctions sont retenues, mais l'olive a
été rejeté après essai et la proposition L attend un choix humain. Les images Agenda concernent
l'application créée : ne pas confondre leurs approbations ou leurs preuves.

Arrêter avec Ctrl+C puis relancer la même commande pour reprendre. L’export de Studio permet
également de restaurer la copie ailleurs et de lancer son `launch.mjs` sans installer DevMethod.
Voir le [guide complet](../../docs/STUDIO.md), les
[résultats et limites](../../docs/missions/creation-experience/RESULTS.md) et le
[checkpoint de reprise](../../docs/missions/creation-experience/REPRISE.md).

Pas d’authentification, paiement, email ou déploiement public. Les contrôles agents et ce
parcours ne constituent ni une validation humaine, ni une mesure de supériorité comparative.
