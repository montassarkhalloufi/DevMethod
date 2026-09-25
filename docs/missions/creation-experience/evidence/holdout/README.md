# Transfert : le vestiaire des objets

16 septembre 2026. Cas différent des Ateliers, construit par un agent hôte avec
les vrais contrats Studio. Aucun exécuteur injecté, aucun appel `codex exec`,
imagegen ou service payant dans cette sous-tâche. L’agent produit automatique est
absent (`host-bridge`, `automatic: false`). La consommation et le coût de ce worker
ne sont pas exposés : **inconnus**, pas zéro.

Le parcours réel a créé une demande via API, pris le job avec la CLI `claim`,
écrit les fichiers dans le staging retourné puis terminé avec `finish`. Studio a
produit un instantané et activé la révision dans le mode délégué. Les fichiers de
la fixture sont conservés dans [app](app/index.html), avec les
[décisions et critères](finish.json), la [demande](request.json) et le
[reçu d’exécution](receipt.json). Le runtime Studio n’a pas été modifié pour ce cas.

## Ce qui a été observé

- Quatre [tests métier du constructeur](model.test.mjs) passent : identité des
  exemplaires homonymes, unicité du numéro, absence de double prêt actif, retour
  conservé et nouveau prêt possible. [Sortie](model-tests.txt). Syntaxe des deux
  modules vérifiée par `node --check`.
- Parcours **réel dans Chrome**, sans appels API pour simuler les interactions :
  création de deux « Perceuse » OUT-101/OUT-102, prêts à Lina/Noé, retour de OUT-101.
  OUT-102 reste prêté à Noé et l’historique garde les deux lignes.
  [Capture](browser-desktop.jpg), [état accessible](browser-state.txt).
- Le premier serveur a été arrêté ; le port 4335 ne répondait plus, puis un
  nouveau processus a été lancé. La réponse de données avant/après est identique
  octet pour octet : version 6, deux objets, deux prêts, un encore actif.
  [Arrêt](stopped.json), [preuve](restart-proof.json),
  [données avant](before-restart.json), [après](after-restart.json).
  Le [rechargement navigateur](browser-after-restart.txt) conserve cet état.
- L’[export réel](project.tar), 46 592 octets, a été restauré dans un dossier vide
  par la CLI (11 fichiers) puis lancé avec son propre `launch.mjs` sur 4336.
  La page répond, le module servi a l’empreinte de la révision et les données
  égalent l’original. [Preuve autonome](standalone-proof.json).
  Ce serveur temporaire 4336 a été arrêté ; Studio reste disponible sur 4334/4335.
- Les contrôles ont été rattachés à la révision comme
  [commande du constructeur](check.json) et
  [observation du constructeur](browser-check.json), sans être présentés comme
  une évaluation indépendante. Aucun message console de niveau erreur observé
  dans la session navigateur consultée après reprise.

## Essayer et reprendre

Le workspace local vivant est `/private/tmp/devmethod-studio-holdout`.
Studio : `http://127.0.0.1:4334`, application : `http://127.0.0.1:4335`.
Session serveur laissée active : `49585`. Onglet Chrome de contrôle : `744838099`.

Depuis le dépôt, si ce serveur est arrêté :

```sh
node scripts/studio.mjs serve --workspace /private/tmp/devmethod-studio-holdout --port 4334 --preview-port 4335
```

Pour essayer l’archive ailleurs, choisir un dossier vide et un port libre :

```sh
node scripts/studio.mjs restore --workspace /chemin/absolu/dossier-vide --file /chemin/vers/project.tar
node /chemin/absolu/dossier-vide/launch.mjs 4399
```

Les commandes principales effectivement employées sont `serve`, `claim --worker
'Agent hôte transfert'`, `finish --file finish.json`, `check --file check.json`,
`restore --file project.tar`, puis `node restored/launch.mjs 4336`. L’export a été
téléchargé depuis `/api/export` avant l’ajout des reçus de contrôle ; ces deux reçus
sont conservés séparément ici et dans l’état Studio vivant.

Pour relancer uniquement les tests de la fixture copiée :
`node --test docs/missions/creation-experience/evidence/holdout/model.test.mjs`.
Seul le chemin d’import du test copié a été adapté au dossier `app/`.

## Portée et limites

Ce transfert montre que le contrat accepte et conserve une autre application
métier. Il ne prouve pas une génération autonome dans le produit, une supériorité
contre un agent ordinaire, un avantage humain, ni une comparaison A/B/C.
Les choix de code et les contrôles ci-dessus viennent du même constructeur ; les
contrôles indépendants du parent restent séparés.

Le constructeur avait écrit un protocole privé antérieur et ne l’a pas rouvert
pendant cette tâche. Il n’est donc pas aveugle. La demande ici comprend l’historique
dès la première tranche : ce parcours ne doit pas être présenté comme l’exécution
exacte du protocole initial, ni comme un changement de besoin démontré. Aucun
essai à deux onglets, panne d’écriture ou contrôle mobile n’a été réalisé dans
cette sous-tâche. Leur implémentation ou leur mention dans un contrat ne constitue
pas une preuve. Il n’y a ni authentification ni contrôle d’accès de production.

Les données sont fictives. Aucun token runtime, journal fournisseur ou secret n’est
copié dans cette preuve. Le [manifeste source du runtime](runtime-source-manifest.json)
date la collecte ; la candidate finale doit être vérifiée à sa révision finale.
