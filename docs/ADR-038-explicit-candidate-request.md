# ADR 038 — Demande explicite depuis un candidat conservé

21 septembre 2026. Choix réversible dans la délégation technique de la
[mission v1 locale](missions/local-oss-v1/PLAN.md), en complément des
[ADR 030](ADR-030-studio-candidate-supervision.md) et
[ADR 036](ADR-036-controlled-candidate-activation.md).

## Problème observé et décision

La recette du site a livré un candidat React compilé avec des défauts de fidélité.
Une demande ordinaire repart de la version active HTML ; afficher le candidat ne
change pas cette base. Exiger son adoption avant correction mêlerait deux intentions.
Étendre la correction technique automatique ferait aussi perdre sa borne et son
diagnostic attribuable. Une action utilisateur dédiée est donc retenue : « Corriger
cette version », avec identité du candidat et demande explicite avant mise en file.

Cette intervention du développement du Studio est autorisée par le mandat de
dogfooding. Elle ne corrige pas le site à la place de son agent, ne reprend aucune
campagne et ne lève aucune suspension.

## Contrat

`baseRevision` reste la version active qui autorise la concurrence. Un champ optionnel
`candidateRequest` conserve parent, révision source, empreinte et contexte du projet,
dont les délégations. Il est distinct de `correction` et `recovery`, immuable après
enregistrement et exportable. Les anciens états restent lisibles.

Le dialogue possède une saisie séparée du brouillon principal. Une lecture serveur
fournit identité, version CAS, clé d’examen, éligibilité et contrôle courant. Le POST
utilisateur reçoit seulement version, révision, clé et demande. Le serveur déduit
la filiation ; le jeton worker est refusé. Fermeture, lecture et actualisation ne
déclenchent aucune demande. Après conflit ou réponse incertaine, pas de retry automatique.

La source doit provenir d’un parent terminé, être non active, non écartée et conserver
la même base active. Une demande liée déjà en attente ou en cours interdit un doublon.
Les octets sont contrôlés contre leur manifeste. Le contexte et la source sont relus
au claim puis avant l’appel fournisseur. Une modification impose une nouvelle demande.

La demande liée au candidat actuellement bloquant est prioritaire sur les demandes
ordinaires conservées. Les autres demandes ne sont ni supprimées ni rebasées. Cette
exception permet uniquement de travailler sur ce candidat : les arrêts courants,
consommations inconnues, limites, outils en attente et délégations restent opposables.
Le contrôle et les preuves historiques ne deviennent pas une validation du candidat.

La livraison obtient ses propres vérifications et reste soumise à l’adoption existante.
Aucun budget n’est réinitialisé. La correction automatique conserve sa borne ; une
demande explicite ne réécrit ni son historique ni ses compteurs.

## Vérification attendue

Base HTML active et candidat React : copie exacte des TSX, conservation de la base,
du brouillon et du ledger ; priorité cohérente entre runner et claim. Négatifs :
contexte/délégation/base/source périmés, doublon, worker, budget fermé, consommation
ou effet outil inconnus et arrêt explicite. Contrôles de la nouvelle livraison,
export/restauration et dialogue FR/EN avec saisie préservée. Les tests avec fournisseur
fictif restent distincts du prochain appel natif, toujours soumis à son autorisation.
