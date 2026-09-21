# Contrôle ordinaire : deux locations suffisent

Auteur : agent ordinaire, utilisant seulement les fichiers isolés `README.md` et `domain.mjs`, un raisonnement arithmétique et un script JavaScript autonome. Aucun moteur candidat, adaptateur, résultat ou test candidat consulté. Aucun appel fournisseur, contact ou participant simulé. Il s'agit d'un contrôle de capacité, pas d'un A/B causal.

**Une suite minimale est louer vingt minutes, puis louer quarante minutes.** Elle comporte deux actions légales, consomme soixante minutes sur la fenêtre de cent vingt minutes et produit une différence de 300 centimes.

| Étape | Action | Minutes écoulées | Minutes réellement louées | Minutes facturées par session | Facture par session, centimes | Minutes facturées au total journalier | Facture au total journalier, centimes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 0 | Aucune | 0 | 0 | 0 | 0 | 0 | 0 |
| 1 | Louer 20 min | 20 | 20 | 30 | 300 | 30 | 300 |
| 2 | Louer 40 min | 60 | 60 | 90 | 900 | 60 | 600 |

Les plafonds sont pris séparément dans la première politique : `ceil(20/30) + ceil(40/30) = 1 + 2 = 3` blocs. Dans la seconde, `ceil((20+40)/30) = 2` blocs. Chaque bloc vaut 300 centimes. Aucune pause, remise ou règle supplémentaire n'a été ajoutée.

La minimalité porte sur le **nombre d'actions**. L'état initial ne diffère pas. Chacune des quatre premières actions possibles — louer 20, 40 ou 60 minutes, ou faire une pause de 20 minutes — produit des factures identiques. Une différence ne peut donc apparaître avant deux actions. L'énumération exhaustive des seize historiques légaux de deux actions trouve trois témoins : `[20,40]`, `[40,20]` et `[40,40]`, toutes des locations. Les deux premiers sont aussi les plus courts en temps écoulé parmi ces témoins : soixante minutes.

Le compromis est explicite : arrondir chaque session peut rémunérer une nouvelle préparation à chaque location ; additionner les minutes évite que le fractionnement entraîne plusieurs arrondis. Ici, la première politique facture neuf unités monétaires et la seconde six. Aucune préférence du propriétaire ni coût réel de préparation n'est fourni : cette différence ne désigne donc pas une politique gagnante.

## Reproduction

```sh
node /private/tmp/devmethod-discovery-ordinary-input/ordinary-search.mjs
```

Le script énumère les historiques légaux par longueur, calcule les observations avec les deux politiques et termine après avoir examiné complètement le premier niveau comportant un écart. Assertions : zéro écart aux profondeurs 0 et 1 ; trois écarts parmi seize historiques à la profondeur 2 ; témoin choisi ; montants exacts ; vérification arithmétique indépendante ; absence de mutation des entrées lors de sa reproduction. Sortie conservée dans `ordinary-result.json`. Exécution observée : Node v24.18.0, exit 0.

Les temps sont muraux, pas du temps humain actif ni un coût : début mesuré **11:14:39 UTC**, premier résultat exécuté et vérifié **11:15:30 UTC**, soit **51 secondes**. Rapport rédigé et dernier contrôle exécuté à **11:16:25 UTC**, soit **1 min 46 s** après le début ; seule cette annotation de clôture suit ce contrôle. Aucune consommation de tokens ni dépense n'est déduite de ces horodatages.

Entrées SHA-256 :

- README.md : `1917582faff386ed1b61c73df4a69a449c540fbba80ccb89ccaf08cc8408fe2d`
- domain.mjs : `a5ede32c39bcdf5add4284e07b41af5efc88d53703bf337ac5a7c1d2ca67eaad`
- ordinary-search.mjs : `14ec86b94a0e7c5a430224aab1dba2c4ce7bb4a09e5ad3ceacaa93e7da2741bf`
- ordinary-result.json : `1ff4cd8ceeec8b9d85dcce53bcb38b4e7791bedd9abd9e9bd5e4b5609a1b96f5`

Limite : ce problème fictif et minuscule fournit déjà les politiques, les actions et les observations pertinentes. Le résultat ne mesure pas le coût de découvrir ces éléments dans un projet réel, ni l'intérêt d'une interface permettant de jouer ou contester l'écart.

## Archivage par le parent

Le script exact et sa sortie sont conservés à côté de ce rapport : `ordinary-search.mjs` et `ordinary-output.json`. Le domaine reste dans `scripts/discovery/transfer/domain.mjs`, avec le hash ci-dessus. Pour rejouer depuis la racine du dépôt, copier le script et ce domaine dans un même dossier temporaire, puis lancer le script avec Node. L'import relatif `./domain.mjs` du contrôle original n'a pas été réécrit. Le parent n'a pas attribué le temps de recherche du moteur seul au coût complet du candidat.
