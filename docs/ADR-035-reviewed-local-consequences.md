# ADR 035 — Conséquences examinées et intervention locale

21 septembre 2026. Choix réversible sous les délégations produit et technique de la
[mission v1](missions/local-oss-v1/PLAN.md), après ADR 030, 032 et 034. Direction visuelle
existante préservée. Cette tranche traite l'inconnue sur les conséquences, sans reprendre
la campagne fournisseur suspendue.

## Choix et portée

Le contrôle conserve aujourd'hui `persistentData` et `contractChanged` inconnus. Une
détection statique ne peut pas prouver leur absence. La promotion d'une déclaration agent
en fait vérifié serait incorrecte ; conserver ces inconnues sans action laisserait
l'intervention insoluble. On ajoute donc un examen local explicite, lié aux versions et
preuves exactes, distinct des observations et de l'adoption.

L'examen présente base/candidat, fichiers changés, indices textuels positifs bornés,
présence de données persistantes sans leurs valeurs, preuves et limites. L'absence d'indice
ne signifie pas absence d'impact. L'utilisateur apprécie séparément données et contrats
(`affected`, `not-affected`, `unknown`), puis choisit sans défaut `accept-local` ou
`keep-stopped`, un périmètre et une justification. L'acceptation exige deux appréciations
connues et refuse une conclusion négative contraire aux indices positifs. Des données
non vides empêchent notamment de déclarer les données non concernées.

## Stockage, fraîcheur et contrôle

Le champ optionnel `intervention` rejoint les décisions `source:user`, avec protocole,
base/candidat et empreintes, contexte, clé d'examen, appréciations, résolution, portée et
date et observations historiques bornées. Le serveur capture le résumé des données sans
leurs valeurs, les changements et indices, les limites, inconnues, risques et preuves
examinées ; le client ne fournit pas ce snapshot. Il reste distinct du contrôle courant.
Le sujet est réservé à toute nouvelle écriture, y compris l'approbation d'une proposition
déjà ouverte ; la garde précède la supersession. Les anciens sujets libres restent
lisibles. Nouvelle décision pour une version : ancienne remplacée, jamais supprimée.
La provenance désigne une action locale ; une recette CUA reste une action de l'agent.

Le contexte lie sources vérifiées, base de la demande, projet/critères/délégations,
données exactes, preuves et configurations navigateur/connecteurs. Le chemin réel du
workspace est haché dans le contexte, sans être publié : déplacer ou restaurer ailleurs
impose un nouvel examen. La lecture n'écrit rien. L'adoption de cette même candidate ne
change pas sa base de comparaison ; une autre version active invalide l'acceptation.
Un nouveau reçu, une appréciation de couverture changée ou une donnée modifiée invalide
l'avis même sans changement de compteur Studio. Les empreintes établissent identité et
fraîcheur, jamais vérité métier.

Le risque garde les inconnues factuelles et les facteurs positifs. Il expose séparément
les inconnues appréciées et les facteurs acceptés dans cette portée. Seule une acceptation
actuelle peut lever `consequences-to-check` ; elle ne lève ni admission, critères manquants,
erreur runtime, permission outil, consommation inconnue, interruption ou budget clos.
`keep-stopped` maintient l'arrêt de cette candidate jusqu'à remplacement explicite, y
compris après péremption du contexte. Il ne s'étend pas à une autre candidate.
Le contrôle historique du job reste immuable.

Cette écriture n'adopte pas de version et ne réveille pas le runner. Une permission de
poursuite reste distincte d'une opération effectuée. Le verrou des demandes suivantes
reste lié à l'adoption ou à l'écartement explicite ; l'exécution de `continue/activate`
par le runner constituait un raccord séparé à terminer à cette étape. Il est désormais
défini par [ADR 036](ADR-036-controlled-candidate-activation.md), avec relecture du contrôle
et provenance moteur. Cette séparation évite qu'un examen entraîne implicitement un nouvel
appel fournisseur.

## Frontière HTTP et concurrence

`GET /api/intervention-review?revision=…` retourne la version, la base, le contrôle,
les conséquences, l'historique, `canReview` et `reviewKey`.
`POST /api/intervention-review` accepte uniquement `{version,revisionId,reviewKey,
resolution,assessment:{persistentData,contractChanged},scope,reason}`. Corps 16 Kio,
portée 2 000 caractères et justification 4 000, toutes deux non vides. Réponse 200 avec
état et décision ; 400 forme invalide, 404 révision absente, 409 contexte périmé ou
appréciation incompatible, 403 jeton worker/origine/Host non autorisés.

Le serveur reconstitue les observations et références avant commit synchrone CAS sous
l'unique propriétaire du store. Aucune autorité ou empreinte fournie par le client n'est
acceptée comme fait. Après erreur ou réponse incertaine, le formulaire conserve les
saisies ; actualiser ne confirme pas. Pas de retry automatique d'écriture : relire les
décisions après une réponse perdue. L'accès disque direct reste la frontière locale
existante, sans garantie multi-processus hors verrou Studio.

## Vérification attendue

Indices positifs/absence d'indice, données non divulguées, sources/base modifiées,
concurrence données hors compteur, critères/preuves/configuration périmés ; acceptation
connue, inconnue refusée et arrêt conservé ; aucun contournement des autres verrous ;
worker incapable de forger une résolution ; historique, reprise et restauration ;
formulaire sans défaut, confirmations tardives, erreur 409 et parcours navigateur réel.
Les résultats exécutés figurent dans la [preuve de mission](missions/local-oss-v1/evidence/LOCAL-INTERVENTIONS.md),
sans les confondre avec une validation humaine ou la recette native encore suspendue.
