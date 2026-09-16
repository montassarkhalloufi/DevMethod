# Revue indépendante — retrait explicite de l’appel

Date : 2026-09-16. Revue en lecture seule du worktree `/private/tmp/devmethod-reconsideration-ordinary` ; seul ce rapport est écrit. Aucun appel fournisseur, aucune campagne et aucune mutation du dépôt principal.

## Pin et portée

- Commit inspecté : `491491a505665e6ca72eeb5839dc20d041b54f5c`.
- Arbre : `a1072e7ceb3e2bee7e06c6638953f45fdd5b17f4`.
- Worktree propre au début et à la fin de la revue.
- Protocole lu : `PROTOCOL.md`, SHA-256 `dae5f66c2ffa89b981cc49315c2f1453218fd47e945bcd51a38a7438984ce0f0`. Le parent déclare ce protocole écrit avant dispatch ; cette revue ne reconstitue pas indépendamment la chronologie de son écriture.
- Diff intégral des cinq fichiers du commit examiné ; contexte complet de `domain.js`, `app.js`, `render.js`, `storage.js` et suite `tests/seance.test.mjs` lu. Les suites déjà vertes n’ont pas été relancées.

| Fichier relatif au worktree | SHA-256 inspecté |
|---|---|
| `examples/seance/code/domain.js` | `1740356ae8a9cbc3973f475d3b09092e5508127873149ee263aa52371c3d4f10` |
| `examples/seance/code/app.js` | `8051673c99e737bddc08b7ca66375eec3ba558dde2504a406ebe2494ca9bd9ea` |
| `examples/seance/code/render.js` | `87aa1e4e6f431d70acf5eaaef8c9779b6236ee3718ebf884833fb9dea4ae9cdc` |
| `examples/seance/code/storage.js` | `0f0d5bfe38287833d65e22c7158e085928dc3ac7270a25be543f61d5ae1886d9` |
| `tests/seance.test.mjs` | `a4e6b9faa4d0a8acaf93eff3619ab9b9ca41d3a935a6d9de3bcaccc5e9ecf462` |

## Conclusion ciblée

Aucun défaut bloquant ou majeur identifié dans ce delta pour le brief fixé. Le code permet de retirer explicitement l’activité appel et son obligation depuis le brouillon courant, sans restaurer une ancienne version. Le clone conserve le titre, l’ordre relatif des autres activités, le choix de durée de discussion et les omissions. L’attente disparaît par recalcul, car elle n’existe qu’avant l’appel.

L’aperçu possède son propre état en mémoire. Son ouverture, les ajouts proposés et son abandon n’appellent pas la sauvegarde. L’application copie l’aperçu vers le seul brouillon, sans publication. Les mutations ordinaires et la sélection d’un compromis ferment l’aperçu pour empêcher qu’il écrase une nouvelle édition. La sélection d’une ancienne publication ne transforme pas celle-ci en source de restauration. Les instantanés et leur génération HTML restent séparés du brouillon.

Les raisons des anciennes omissions ne sont pas déduites. Le texte affiche explicitement cette ignorance ; chaque ajout de film ou discussion demande un clic nommé et reste visible dans les horaires et le diff avant application. Les propositions de réintégration de l’appel restent des actions séparées et explicites.

La règle de décision du protocole peut donc être appliquée à cette opération précise : ce travail d’agent ordinaire suffit à réaliser le retrait explicite de l’appel avec préservation du reste. Aucune nécessité d’un moteur spécial de décisions n’apparaît ici. Ce constat ne prouve ni le retrait arbitraire d’une décision passée, ni l’identification de ses dépendances, ni un avantage humain ou comparatif.

## Contrôles nouveaux exécutés

Deux scénarios DOM supplémentaires ont été exécutés une fois, par script Node sur stdin, avec `assert/strict` et JSDOM. Runtime : Node `v24.18.0`, exécutable `/Users/montassar/.local/share/fnm/node-versions/v24.18.0/installation/bin/node`. JSDOM est résolu depuis les dépendances déjà installées du dépôt principal ; aucune installation. Les modules testés sont ceux du worktree au pin ci-dessus. Stockage simulé en mémoire ; aucun stockage navigateur réel manipulé.

1. **Obligation d’appel encore non intégrée et fermeture avant application.** Une v1 publiée ; titre modifié ; ordre courant `F2,F1,F3,break,shortDiscussion,F6` ; `callRequired=true`, sans activité appel. Avant retrait, publication bloquée. Ouvrir l’aperçu ne produit aucune écriture et indique la levée de l’obligation. Une nouvelle instance démarrée depuis le stockage conserve exactement le document et n’a pas d’aperçu. Appliquer dans l’instance originale produit une seule écriture, rend la publication possible, garde titre/ordre/discussion10/omissions F4 et F5, et conserve v1 et son HTML à l’identique. Sortie recalculée **20:32** : `18+12+23+10+10+14+5 = 92` minutes après 19:00.
2. **Appel existant en retard alors que l’obligation vaut déjà faux.** Une v1 publiée ; ordre courant `F2,F1,F3,break,F6,shortDiscussion,call` ; `callRequired=false`. Le programme initial est invalide par arrivée tardive à l’appel. L’aperçu reste accessible grâce à la présence réelle de l’activité et affiche son retrait. Application : exactement `F2,F1,F3,break,F6,shortDiscussion`, programme valide, même publication, aucun ajout implicite. Une nouvelle instance recharge exactement le document appliqué.

Sortie observée, processus terminé avec succès :

```text
PASS unintegrated required call: preview has zero writes; reload discards only preview; apply preserves title/order/duration/omissions/v1 HTML; empty 20:32
PASS existing late call with requirement already false: preview available; apply clears actual call; valid schedule; independent omission/order/duration and publication retained after reopening
Runtime v24.18.0
```

Ces contrôles complètent les nouveaux tests du commit lus pendant la revue : les deux compromis, préservation de leurs instantanés/HTML, ajouts explicites, abandon sans écriture, fermeture de l’aperçu devenu périmé et réouverture après application. Le présent rapport ne transforme pas leur lecture en nouvelle exécution indépendante.

## Limites à conserver dans les conclusions

- **Annulation explicite de l’appel, pas retrait de n’importe quel compromis.** Le libellé d’un test « les deux compromis peuvent être retirés » doit se lire dans cette portée : le code conserve justement les choix d’ordre et d’omission associés à ces compromis. Aucun graphe causal ni inversion générale code/données n’est construit.
- Les raisons de retirer F4 ou F5 et de choisir l’ordre courant ne sont pas enregistrées. L’outil protège l’état courant et propose des ajouts ; il ne reconnaît pas automatiquement ce qui devrait être rétabli. Cette incertitude est affichée, pas résolue.
- Un ajout proposé va à la fin. Pour changer ensuite sa position, l’utilisateur applique puis utilise les commandes ordinaires. L’aperçu n’est pas un éditeur complet. Il peut être abandonné entièrement, puis rouvert.
- L’aperçu non appliqué ne survit pas à un rechargement ; le brouillon sauvegardé survit. L’interface annonce que rien n’est encore enregistré. Le démarrage de l’application réécrit le document chargé par la frontière de stockage existante ; « zéro écriture de l’aperçu » n’est pas « zéro écriture sur toute la session ».
- Les versions restent immuables par les opérations de cette application, pas face à une modification manuelle de localStorage, suppression navigateur ou concurrence entre onglets. Ces limites préexistent et sont documentées.
- Cette revue ne réalise ni parcours navigateur réel, ni téléchargement réel, ni contrôle visuel/mobile ou étude de compréhension. Les vérifications navigateur éventuelles du parent doivent conserver leur attribution propre.
- Contexte Séance connu, artefact construit après révélation du scénario initial. Aucun support historique utilisateur n’est inventé. Un seul essai de capacité ; aucun groupe comparateur, budget tokens/coût, temps humain ou bénéfice utilisateur mesuré. Pas de généralisation à une autre application.
