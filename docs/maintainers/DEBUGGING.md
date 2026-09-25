# Diagnostic et reprise

## Procédure

1. conserver l'erreur, la commande et la révision ;
2. identifier la couche : invocation, validation, store, adaptateur, transport, UI ou service externe ;
3. formuler une hypothèse qui distingue au moins deux causes ;
4. changer un seul élément utile ou ajouter une sonde ciblée ;
5. réexécuter le contrôle affecté ;
6. conserver l'échec initial et le résultat corrigé.

## Symptômes Studio fréquents

| Symptôme | Vérifier |
| --- | --- |
| État changé / conflit 409 | Version et clé de snapshot ; recharger avant de décider |
| Contrôle non exécutable | Catalogue qualité et procédure externe attendue |
| Dernier rapport périmé | Connexion au serveur, origine et reprise du polling |
| Candidate non appliquée | Décision effective, délégation, base, plan et job concurrent |
| Action MCP bloquée | Permission exacte puis admission Control Plane juste avant appel |
| Graphe incomplet | Analyseurs optionnels, qualité, journaux et source indisponible |
| Progression sans preuve | Normal : une déclaration de l'agent ne vaut pas contrôle |

## Arrêts persistants

Un effet MCP inconnu, une mission interrompue, un ledger runner incohérent ou deux erreurs
successives identiques peuvent produire `Bounded Stop`. Ne supprimez pas l'historique et ne rejouez
pas automatiquement. Réconciliez les effets, enregistrez le diagnostic et changez le contexte qui
justifie une nouvelle évaluation.

Voir aussi le [troubleshooting général](../TROUBLESHOOTING.md).
