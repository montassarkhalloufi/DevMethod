# ADR 030 — Candidats vérifiés, correction bornée et reprise locale

21 septembre2026. Choix technique accepté sous la délégation de la mission v1 locale.
Complète ADR028/029. Implémentation locale partielle du contrôle opérationnel ; aucune
preuve de clôture des critères A–H n’est déduite de cette décision.

La version active et le candidat sont distincts. Les livraisons natives passent désormais
`deferActivation` interne : la fin du processus ne déclenche pas l’adoption. Les contrôles
JSON/HTML/JS/React sont exécutés avant la transition ; le graphe relie job, version immuable,
empreinte, critère et reçu. Un échec React conserve sources et diagnostic sans aperçu compilé.
Une version valide techniquement mais sans preuve métier reste à vérifier. Les chemins
historiques manuels conservent l’adoption explicite avec le verrou technique commun.

La politique pure produit facteurs de risque qualitatifs, inconnues, interventions groupées
et action continue/correction/vérification/arbitrage/arrêt. Le runner persiste sa décision
avant une nouvelle admission. La correction est limitée à une tentative supplémentaire sur
le même candidat, sous délégation structure/adoption effective, échec technique attribuable,
périmètre local réversible et budget connu. `baseRevision` conserve l’autorité de concurrence ;
`correction.sourceRevision` indique les sources effectivement copiées. Retrait de délégation,
contexte changé et limites empêchent le claim. Aucun nouveau budget n’est créé pour corriger.

Un candidat arrêté suspend la file. Une personne peut l’écarter explicitement depuis Studio ;
la décision vise le job, conserve ses sources/contrôles et libère les demandes déjà autorisées.
Le worker ne peut pas appeler cette route ni forger une décision source:user. L’écartement
ne prouve pas la réussite de la version, ne remet pas le ledger à zéro et ne lève pas un arrêt
pour consommation inconnue. La revue a vérifié ces deux frontières d’autorité.

Les jobs terminés restent immuables. Une seule décision `control` peut être ajoutée ensuite,
puis reste immuable elle aussi ; les résolutions sont des décisions séparées. Les champs
optionnels correction/recovery/control et leurs références sont validés et voyagent dans
l’état exporté. Les anciens projets sans ces champs restent lisibles.

Après interruption, une action utilisateur explicite peut vérifier localement les sources
conservées. Nouveau job `recovery.kind:local-inspection`, parent arrêté inchangé, version CAS,
base et contexte original exigés. La copie est contrôlée par les mêmes outils, sans fournisseur,
sans activation et sans mutation des sources d’origine. Les metadata agent ne peuvent attribuer
un accord humain. Le ledger et son usage inconnu restent inchangés.

La recette réelle a exercé cette reprise après timeout ; ce n’est pas une autoréparation
native réussie. L’outil local de contrôle est maintenant transmis par commande exacte, avec
la borne temporelle de l’appel. Sa sortie dit `admissionReceipt:false` : la vérification faite
par l’agent n’usurpe pas le reçu indépendant du Studio.

Limites : conséquences sémantiques et risque applicatif restent souvent inconnus, aucune
probabilité chiffrée ; contrôles métier/runtime et outils natifs doivent encore alimenter
le graphe avec leur provenance. Le graphe dérivé et les interventions informatives ne
constituent pas encore quatre moteurs complets. Toute affirmation de réussite doit conserver
ces limites et la portée exacte des preuves.
