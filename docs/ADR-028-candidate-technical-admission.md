# ADR 028 — Admission technique avant activation

Date : 2026-09-21. Accepté sous délégation technique de la mission
[local-oss-v1](missions/local-oss-v1/PLAN.md). Complète ADR 016 et 017.

Le runner vérifiait JavaScript après `jobs.finish`, alors que ce dernier activait déjà
la révision déléguée. Le pont hôte ne bénéficiait pas de cette vérification. React
compilait réellement avant finalisation, mais son reçu était ajouté après activation.

`jobs.finish` exécute désormais le contrôle technique applicable avant de finaliser le
candidat. Le domaine enregistre le reçu exécuté et décide l'activation dans la même
transition. Le candidat JavaScript invalide reste conservé avec son diagnostic et ne
remplace pas l'ancien actif. `activateRevision` consomme la même admission. Les
propositions jointes utilisent la base effectivement active, y compris après refus.

Le module pur `scripts/studio/admission.mjs` consomme la révision et ses reçus. Le
protocole est distinct de la commande réellement exécutée. Seuls les reçus de provenance
`executor: studio`, attribuée par les chemins internes de vérification, satisfont ce
minimum ; le pont ne peut pas fournir ce champ. Les reçus historiques ne sont pas
réétiquetés. Une nouvelle vérification produit une nouvelle preuve.

Cette étape n'est pas encore la politique complète d'admissibilité v1 : HTML inline,
comportement, suffisance des critères, risque et attention restent à raccorder. Les
sources importées conservent leur parcours explicite source-only. Un HTML sans script
externe n'obtient pas de preuve fabriquée. Le contrôle JS synchrone est borné globalement
à dix secondes ; sa conversion asynchrone est nécessaire pour recevoir une annulation
pendant cette phase. Les erreurs/non-exécutions sont détaillées dans le reçu mais restent
agrégées en failed par le schéma historique. Un échec de compilation React conserve le
travail sans encore créer le candidat immuable demandé pour la v1.

L'éditeur conserve son contrôle préalable JS/JSON et le contrôle d'admission JS à la
livraison : ils portent sur deux frontières de copie, avec couverture différente. Cette
répétition sera supprimée uniquement avec un transfert de preuve vérifié par empreinte.

Preuve de régression : JavaScript réellement invalide, ancien actif conservé, activation
manuelle refusée, correction nouvelle activée, ancien échec conservé. Tests de déclaration
de preuve usurpée et proposition sur candidat refusé. Voir
[validation](missions/local-oss-v1/evidence/ADMISSION.md).
