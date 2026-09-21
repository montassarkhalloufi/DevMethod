# ADR 034 — Appréciation de la couverture d’un critère

21 septembre 2026. Choix réversible sous les délégations produit et technique de la
[mission Studio](missions/creation-experience/CONTRACT.md) et de la
[v1 locale](missions/local-oss-v1/PLAN.md). Complète les ADR 030, 032 et 033.

## Besoin et choix

Un reçu navigateur atteste des assertions exécutées. Les identifiants de critères du
manifeste expriment une intention ; ils ne prouvent pas que ces assertions répondent au
besoin. Conserver seulement ces déclarations laisserait la couverture indécidable ; les
promouvoir automatiquement confondrait intention et résultat. Studio permet donc une
appréciation explicite, bornée à un critère, une version et un reçu exacts.

Depuis Vérifications, la personne examine le texte du critère, les scénarios, leurs étapes,
assertions et résultats. Elle choisit des scénarios entiers, une conclusion sans valeur
précochée (« suffisante dans ce périmètre », « partielle », « non pertinente »), un périmètre
et une justification. « Suffisante » signifie que la personne estime ces scénarios adéquats
pour ce critère dans le périmètre décrit ; ce n’est ni une analyse indépendante exhaustive,
ni une nouvelle preuve d’exécution, ni une garantie de fonctionnement universelle.

## Autorité, données et projection

La décision structurée `coverage` rejoint `state.decisions`, `source:user`. Cette source
identifie la route de décision locale ; un clic automatisé ne démontre pas une participation
humaine. Le worker ne peut ni appeler cette route ni fournir ce champ dans sa livraison.
Le reçu qualité reste inchangé. Une nouvelle appréciation du même critère et de la même
version remplace la précédente comme décision active, sans effacer l’historique.

La liaison conserve version/empreinte, reçu/empreinte, manifeste, critères et texte exact,
scénarios, protocole/versions du navigateur et du pilote, conclusion, périmètre, date et
empreinte de l’examen. Seule une décision active, suffisante et actuelle peut contribuer
aux liens de couverture d’un reçu local Studio réussi. Chaque scénario sélectionné doit
avoir exécuté toutes ses étapes et assertions avec succès. Un reçu bloqué, externe,
incomplet, remplacé ou périmé ne peut couvrir un critère. Les appréciations partielles et
négatives restent visibles et ne ferment pas le critère.

Le graphe distingue la déclaration du manifeste, le résultat exécuté et l’appréciation
locale. Le contrôle courant est recalculé ; les décisions `job.control` historiques restent
immuables. Aucun changement de délégation, accord outil, réinitialisation de budget, réveil
du fournisseur ou adoption n’accompagne cette écriture. Les conséquences inconnues restent
inconnues. Une appréciation ne se généralise pas aux versions ou exécutions suivantes.

## Frontière d’écriture

`GET /api/coverage-review?revision=…&receipt=…` retourne le contexte exact et sa clé.
`POST /api/coverage-review` reçoit uniquement `version`, `revisionId`, `receiptId`, `reviewKey`,
`criterionId`, `scenarioIds`, `conclusion`, `scope`, `reason`. Les références et empreintes
sont recalculées côté serveur, sans accepter de drapeau d’autorité fourni par le client.
Réponse 200 avec état et décision ; 400 pour forme invalide, 404 pour référence absente,
409 pour contexte périmé ou preuve incompatible. Corps borné à 16 Kio. Les règles Host,
origine et contenu JSON du Studio s’appliquent ; le jeton worker reçoit 403.

La relecture et le commit CAS sont synchrones sous le propriétaire unique du stockage.
Une mutation du reçu, des sources, des critères ou du réglage navigateur entre ouverture et
confirmation invalide l’examen, même sans changement du compteur principal. Après erreur,
l’interface conserve les saisies, demande actualisation puis nouveau clic. Aucun retry
automatique d’écriture : après réponse perdue, relire les décisions. L’export conserve
appréciations et reçus ; l’autorisation navigateur locale non exportée les rend à réévaluer
dans la copie. L’accès disque direct reste dans la frontière de confiance locale existante.

## Vérification attendue

Scénario passant mais non pertinent, couverture partielle et suffisante explicite ; scénario
incomplet ou échoué refusé ; remplacement d’une appréciation ; péremption par critère, source,
manifeste, protocole, reçu et configuration ; maintien de la preuve technique indépendante ;
worker/Host/origine/CAS ; absence d’appel/adoption ; historique et export/restauration.
Tests d’interface sur saisies et résultats tardifs, puis parcours navigateur contrôlé avec
inspection du rendu. Cette dernière preuve reste distincte d’une intervention humaine réelle.
