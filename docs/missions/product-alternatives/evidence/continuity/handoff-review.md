# Revue indépendante : contexte des demandes Atelier

**Conclusion : aucun défaut confirmé ni finding bloquant dans le diff inspecté.** La correction remplit le besoin borné : une demande préparée contient l'historique enregistré des choix et la situation commune au moment de sa création. Elle ne prouve ni consommation effective de ce contexte par un agent, ni meilleure continuation.

- Révision inspectée : `54087089fc662a5c63fa786aac99613d971016d8`, base `617b22c`, worktree `/private/tmp/devmethod-handoff-impl`.
- Revue par l'agent `native_admission`, distinct de l'auteur de la correction. Lecture seule du code ; aucun appel modèle natif/fournisseur. Seul ce rapport est écrit hors worktree.
- Début observé : 2026-09-16 13:26:07 UTC. Fin de vérification : 13:26:40 UTC ; rédaction ensuite, dans la borne de cinq minutes. Il s'agit de temps de cette revue, pas d'une mesure de tokens ou de coût.

## Vérification

Commande réellement exécutée avec Node 24.18.0 :

```sh
/recorded-home/.local/share/fnm/node-versions/v24.18.0/installation/bin/node --test tests/atelier-handoff.test.mjs tests/atelier-server.test.mjs
```

Résultat : **6 tests passés, 0 échec, 0 ignoré**, durée du runner 273,749958 ms. Les six cas couvrent : nouveau handoff avec redémarrage de processus distinct ; conservation des choix/données après besoin révisé ; refus de version périmée, origine étrangère et proposition malformée ; découverte en lecture seule ; demande/import réel conservant les données ; refus d'une session persistée corrompue. `git diff --check 617b22c 54087089...` passe également.

Le nouveau cas HTTP vérifie une ancienne décision remplacée après révision du besoin, son contexte initial et sa raison, puis distingue une action commune d'une action ciblant une seule variante. `scenario` contient seulement la première ; les observations propres aux variantes restent dans `currentLanes`. La révision, le projet, le choix courant et les lanes sont comparés à l'état juste avant préparation. La création ajoute seulement une entrée de demande à la session.

Après création, le test change de nouveau besoin/choix/scénario, arrête le serveur puis lance **un autre processus**. Il vérifie l'état courant rechargé, le contenu de la demande téléchargée et les octets inchangés du fichier préparé. Il vérifie aussi qu'un fichier ancien sans les deux champs reste téléchargeable sans ajout rétroactif. La fixture ancienne est construite dans le test en retirant ces champs ; ce n'est pas une capture d'une version historique exécutée. Je n'ai pas rejoué de phase rouge sur la base dans cette revue.

## Lecture du code et docs

`scripts/atelier/server.mjs:70` ajoute `history: session.history` et `scenario: session.situation`. Le store fournit déjà un clone de la session ; le paquet est sérialisé immédiatement dans un nouveau fichier exclusif, avant que les mutations ultérieures du domaine puissent intervenir. Les demandes téléchargées sont lues depuis ce fichier conservé et non reconstruites à partir de l'état courant. Pas de changement aux règles métier, à l'import de propositions ou à la migration des sessions.

La terminologie est cohérente avec `exportDecision`, qui utilise déjà `history` et `scenario`. La documentation distingue correctement la situation commune des observations par variante, les choix enregistrés de leur attribution humaine et les snapshots existants de leurs éventuels champs absents.

Limite matérielle correctement documentée : l'historique inclut des copies de contexte et d'observations, sans réduction. Sur la fixture du test, le fichier passe de **25 393 à 34 863 octets** pour une décision historique et une action commune. L'augmentation de 9 470 octets est observée ; ce ne sont pas des tokens. La conservation complète privilégie la fidélité du contexte, sans garantie qu'un modèle absorbera tout un historique proche des limites existantes.

## Portée restante

Revue des trois fichiers modifiés et de leurs interactions avec store/domain/schema/contrat ; pas de nouvelle vérification visuelle navigateur, benchmark humain, campagne native ou suite globale. Ces limites ne bloquent pas cette correction de sérialisation. Les autres gates de livraison du dépôt restent à exécuter ou à rattacher par le parent à ce commit exact.

Prochaine étape de la procédure : `devmethod-verify` pour les gates de livraison encore manquants, sans élargir la correction.

## Addendum — fermeture IPC portable, 13:34 UTC

Intégration produit inspectée en `b590fb1ad6360a9c9d5366b622299cd94c82af5d`. Le changement supplémentaire était encore dans le diff de travail, limité à `tests/atelier-handoff.test.mjs` (SHA256 `dcb35bf347d84bad1f4f9d0698ea51148a0759cf59f8b0e3d46ebaf21c5bf3e3`). Il remplace l’envoi/traitement de SIGTERM par `child.send('close')` et un listener `message` qui appelle `server.close`, puis `process.exit(0)`. Le canal IPC existe déjà dans les options de spawn ; le parent continue d’attendre la sortie `[0,null]` avant de relancer le serveur. La fermeture déclenche donc toujours le nettoyage du store et le test conserve sa preuve de redémarrage dans un processus distinct. Ajustement cohérent, aucun finding ajouté. Aucun code produit modifié par cet ajustement. Lecture seule : aucune suite relancée ici ; la vérification exécutée précédente reste attachée au pin initial, et les tests/CI du delta IPC sont à rattacher par le parent.
