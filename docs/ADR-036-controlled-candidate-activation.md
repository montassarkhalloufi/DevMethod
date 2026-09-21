# ADR 036 — Application d’une candidate sous contrôle courant

21 septembre 2026. Choix réversible dans la délégation technique de la
[mission v1](missions/local-oss-v1/PLAN.md), après [ADR 035](ADR-035-reviewed-local-consequences.md).
La campagne native suspendue ne reprend pas pour cette tranche.

## Décision

Une recommandation `continue/activate` doit pouvoir appliquer la candidate autorisée.
Réutiliser l’adoption manuelle attribuerait à tort le choix à une personne ; réveiller
le runner à chaque examen pourrait déclencher une demande fournisseur. Le moteur utilise
donc une transition dédiée, avec provenance Studio et relecture du contrôle au moment
de l’application. Les examens de couverture et de conséquences restent sans effet opérationnel.

Après une livraison, le runner conserve son verdict historique puis consomme uniquement
une recommandation d’activation encore actuelle. Pour une candidate déjà conservée,
l’action locale « Appliquer selon les contrôles » effectue cette même relecture sans
réveiller le runner. Le clic demande l’application de la politique existante ; il ne
vaut ni acceptation des conséquences, ni nouvelle délégation, ni validation humaine.

## Invariant et frontière

Scénario de défaillance : preuve, base, données ou délégation changées après un verdict
favorable. Invariant : aucune activation à partir de ce verdict périmé. Le service relit
sources, preuves, conséquences, outils et disponibilité, exige `continue/activate`, une
demande terminée `ready`, sa base encore active et aucun autre travail en exécution.
Les profils sans application exécutable ne sont pas activés automatiquement. Les limites,
consommations inconnues, interruptions, arrêts explicites et décisions réservées restent
des motifs de refus. L’application locale refuse aussi un runner occupé ou en configuration.

La transition domaine revérifie identité, base, délégation et admission, puis enregistre
version active et décision dans le même commit CAS synchrone. Garantie dans le processus
propriétaire du store ; l’accès disque direct hors serveur reste la frontière locale
existante. Aucun `await` entre la dernière lecture de contrôle et ce commit. Sources,
preuves, données et ledger ne sont pas modifiés ; aucune demande n’est rebasée. Une demande
en attente sur l’ancienne base reste en attente et sera refusée avant le prochain appel.

Une recommandation historique `continue` ne libère plus une candidate non appliquée.
Seule la correction liée exactement à son parent peut continuer sans adoption ; les autres
demandes attendent l’application ou l’écartement explicite. Le `job.control` d’origine
reste immuable même si une lecture ultérieure refuse son ancienne recommandation.
Une ancienne recommandation d’activation non appliquée peut être écartée explicitement ;
son contrôle courant devient alors `stop/candidate-discarded`. Cette résolution libère
la file sans réautoriser l’application automatique de la candidate écartée.
Les nouveaux sujets `control:<jobId>` sont réservés à cette transition dédiée ; une
livraison worker ou une proposition déléguée ne peut remplacer l’écartement. Les anciennes
décisions libres restent lisibles, sans recevoir une nouvelle autorité.

## Trace et transport

La décision `source:agent`, sujet `Version active`, contient un champ structuré
`application` réservé au moteur : protocole, déclencheur `runner|local`, job/base/candidate,
empreintes des sources, critères et contexte, clé du contrôle, délégation, date, références
des appréciations contributives et observations historiques bornées. L’interface l’identifie
comme « Moteur Studio ». Un worker ne peut fournir cette structure dans sa livraison.
La restauration conserve ce fait historique ; elle n’autorise aucune activation supplémentaire.

`POST /api/control/apply` reçoit seulement `{version,revisionId}` (4 Kio maximum).
Host et origine sont contrôlés ; le jeton worker est refusé. Réponse 200
`{state,applied,decision}` après effet synchrone. Une candidate déjà active avec la version
courante retourne `applied:false` sans nouvelle écriture ; rejouer l’ancienne version donne
409. Forme invalide : 400 ; candidate absente : 404 ; contexte périmé ou contrôle défavorable :
409 ; origine/Host/worker non autorisé : 403. Aucun wake ni nouveau job sur cette route.
Après réponse perdue, relire l’état ; aucun retry automatique. Le formulaire conserve le
brouillon et rafraîchit après conflit.

## Vérification

Admission réelle et journal qualité contrôlé, appréciations par les API ordinaires,
relecture sans mock de la politique : application unique et trace runtime ; révocation,
base ou preuve changée, arrêt maintenu, budget clos et consommation inconnue refusés.
Tests runner avec fournisseur fictif, contrôles HTTP et parcours CUA distincts de toute
recette native ou validation humaine. Export/restauration et ancienne base en attente
doivent préserver leurs données et ne provoquer aucun appel supplémentaire.
