# Maturité de la v1 locale — 21 septembre 2026

Base inspectée : `9ecf22b79d9afa758eed8e0846646e6335d79d55`, branche
`codex/local-oss-v1`. Bilan dérivé du mandat privé original
`v1-continuation-2026-09-21/PROMPT.md`, du [PLAN](../PLAN.md), du
[contrat Studio](../../creation-experience/CONTRACT.md) et de [REPRISE](../REPRISE.md).
La v1 complète reste **PARTIAL**. Ce relevé n'exécute aucun contrôle et ne remplace
pas les preuves datées auxquelles il renvoie.

## Sens des statuts

- **IMPLEMENTED** : capacité locale décrite présente, avec preuves dans la portée indiquée.
- **PARTIAL** : capacité ou critère complet encore incomplet, notamment sa recette exigée.
- **EXPERIMENTAL** : instrument optionnel, sans garantie de clôture du parcours produit.
- **DOCUMENTED ONLY** : contrat ou intention documentés, sans réalisation revendiquée.
- **NOT FOUND** : preuve recherchée non trouvée dans le périmètre inspecté ; ce statut
  ne suffit pas à conclure qu'un module logiciel manque.

Une exécution navigateur réelle sur fixture reste une preuve de fixture. Un fournisseur
simulé ne prouve pas une exécution native. Une décision enregistrée via `source:user`
par l'agent de recette ne prouve pas l'intervention d'une personne.

## Critères A–H

Les deux statuts séparent la capacité nommée de la clôture du critère dans la recette
complète demandée. Toutes les preuves de continuation citées sont datées du 21 septembre 2026.

| Critère | Capacité locale / critère complet | Fichiers et fonctions inspectés | Preuve actuelle et manque exact |
| --- | --- | --- | --- |
| **A — Studio pilote l'agent** | **IMPLEMENTED / PARTIAL** | [agent-availability.mjs](../../../../scripts/studio/agent-availability.mjs) `probeCodex`; [agent-control.mjs](../../../../scripts/studio/agent-control.mjs) `createAgentControl`; [runner.mjs](../../../../scripts/studio/runner.mjs) `createAgentRunner`; [candidate-request.mjs](../../../../scripts/studio/candidate-request.mjs) `requestCandidateChanges` | [Inventaire](NATIVE-INVENTORY.md) et [site](NATIVE-SITE.md) réellement lancés depuis Studio, progression et arrêts conservés. [Correction ciblée](CANDIDATE-REQUEST.md) éprouvée sur fixture. Échange décisionnel et nouvelle livraison après cette correction non démontrés avec le vrai agent. |
| **B — Vérification et correction bornée** | **IMPLEMENTED / PARTIAL** | [jobs.mjs](../../../../scripts/studio/jobs.mjs) `createJobs`, `finish`; [admission.mjs](../../../../scripts/studio/admission.mjs) `revisionAdmission`; [control-policy.mjs](../../../../scripts/studio/control-policy.mjs) `correctionDecision`; [work-recovery.mjs](../../../../scripts/studio/work-recovery.mjs) `createWorkRecovery` | Admission réelle, reprise locale de l'inventaire, refus et compteur de famille vérifiés. Le site a corrigé `srclang` pendant son appel natif. Cela ne démontre pas la boucle supervisée entre deux jobs natifs ; ses défauts de fidélité restent ouverts. |
| **C — Graphe de preuves** | **IMPLEMENTED / PARTIAL** | [control-policy.mjs](../../../../scripts/studio/control-policy.mjs) `buildEvidenceGraph`; [quality-evidence.mjs](../../../../scripts/studio/quality-evidence.mjs) `readControlQuality`; [coverage-review.mjs](../../../../scripts/studio/coverage-review.mjs) `recordCoverageReview` | [Couverture](BUSINESS-COVERAGE.md) : liens, provenance, fraîcheur sélective, appréciations et restauration éprouvés ; résultats consommés par le contrôle. La couverture métier et sa péremption pendant l'évolution de l'application native ne sont pas démontrées. Aucun nouveau module manquant établi par cette lecture. |
| **D — Risque explicable** | **IMPLEMENTED / PARTIAL** | [control-policy.mjs](../../../../scripts/studio/control-policy.mjs) `riskAssessment`, `evaluateControl`; [consequence-context.mjs](../../../../scripts/studio/consequence-context.mjs) `readConsequenceContext`; [intervention-review.mjs](../../../../scripts/studio/intervention-review.mjs) `recordInterventionReview` | [Conséquences et interventions](LOCAL-INTERVENTIONS.md) : facteurs déterministes, inconnues, contre-exemples et refus éprouvés. L'analyse est bornée, sans compréhension exhaustive des consommateurs ni probabilité mesurée. Examen et décision sur les conséquences du changement natif complet encore non démontrés. |
| **E — Attention humaine** | **IMPLEMENTED / PARTIAL** | [control-policy.mjs](../../../../scripts/studio/control-policy.mjs) `evaluateControl`; [attention-model.js](../../../../scripts/studio/public/attention-model.js) `summarizeAttention`; [attention-view.js](../../../../scripts/studio/public/attention-view.js) `createAttentionView` | Interventions contextualisées et [concentration des observations](ATTENTION-CONCENTRATION.md) réalisées, liens et critiques visibles, CUA FR/EN bureau/mobile. La vue ne mesure pas une distribution générale du risque. Intervention humaine indépendante et utilité du parcours pour cette personne non démontrées. |
| **F — Autonomie effective** | **IMPLEMENTED / PARTIAL** | [control.mjs](../../../../scripts/studio/control.mjs) `readProjectControl`; [control-policy.mjs](../../../../scripts/studio/control-policy.mjs) `evaluateControl`; [controlled-activation.mjs](../../../../scripts/studio/controlled-activation.mjs) `applyControlledRevision`; [runner.mjs](../../../../scripts/studio/runner.mjs) `createAgentRunner` | [Application contrôlée](CONTROLLED-ACTIVATION.md), relecture, persistance et refus éprouvés sur fixtures ; arrêts natifs pour budget et consommation inconnue réellement observés. Chaîne complète décision humaine, autonomie effective et reprise sur l'application native non démontrée. |
| **G — Outils et runtime** | **IMPLEMENTED / PARTIAL** | [runner-browser.mjs](../../../../scripts/studio/runner-browser.mjs) `verifyRunnerBrowser`; [browser-verifier.mjs](../../../../scripts/studio/browser-verifier.mjs) `runBrowserScenarios`; [native-tools-session.mjs](../../../../scripts/studio/native-tools-session.mjs) `createNativeToolsSession`; [mcp-broker.mjs](../../../../scripts/studio/mcp-broker.mjs) `createMcpBroker`; [runtime-observations.mjs](../../../../scripts/studio/runtime-observations.mjs) `recordRuntimeObservation` | [Navigateur](BROWSER-VERIFICATION.md) réel avec fournisseur simulé, [signal runtime](RUNTIME-SIGNALS.md) réel sur fixture, pont MCP testé avec SDK réel selon [ADR 031](../../../ADR-031-native-scoped-tool-bridge.md). `check-work.mjs` réellement invoqué dans le job site. Navigateur automatique et connecteur représentatif utilisés par le vrai agent natif non démontrés ; le catalogue n'est pas une preuve d'intégration. |
| **H — Site et film** | **PARTIAL / PARTIAL** | Candidat privé `d4208c0d-ce2a-4dd0-9163-3b36dee83116`, fichiers `app/src/pages/HomePage.tsx`, `StudioPage.tsx`, `ConnectorsPage.tsx`; [bundle.mjs](../../../../scripts/studio/bundle.mjs) `exportProject`; [archive.mjs](../../../../scripts/studio/archive.mjs) `restoreArchive` | [Site natif](NATIVE-SITE.md) compilé, interactions et comparaison bureau/mobile approfondies, export autonome vérifié. Six espaces et deux retours de ligne à corriger ; recherche vidéo et cas négatifs du presse-papiers non validés dans ce navigateur. Nouveau film anglais `af_heart` non enregistré, monté, intégré ni accepté. La lecture de l'ancien film ne le remplace pas. |

## Capacités transversales et instruments

| Objet évalué | Statut | Portée réelle |
| --- | --- | --- |
| Reprise du Studio et réconciliation avec main | **IMPLEMENTED** | [RECOVERY](RECOVERY.md), puis inspection d'intégration rapportée dans [REPRISE](../REPRISE.md) : historique préservé, source d'origine intacte, aucun commit de main manquant. Ce n'est pas une fusion de la v1 vers main. |
| Export, restauration et runtime indépendant | **IMPLEMENTED** | `exportProject`, `restoreArchive` et `launch.mjs` exporté réellement utilisés sur [inventaire](NATIVE-INVENTORY.md), [site](NATIVE-SITE.md) et [demande de correction](CANDIDATE-REQUEST.md). Historique, sources, données et ledger conservés ; permissions locales non transférées. L'export du film final reste à produire. |
| Interface Studio FR/EN | **IMPLEMENTED** | [i18n.js](../../../../scripts/studio/public/i18n.js) `initializeLocale`, `setLocale`, `subscribeLocale`; [i18n.ts](../../../../studio-ui/src/i18n.ts) `useI18n`. [ADR 037](../../../ADR-037-studio-interface-language.md), recette dans [REPRISE](../REPRISE.md) : anglais par défaut, persistance et saisies conservées. Les contenus historiques gardent leur langue. |
| Harness d'évaluation optionnel | **EXPERIMENTAL** | [evidence-runtime.ts](../../../../src/evidence-runtime.ts) `runEvidence`, exposé comme expérimental dans [cli-commands.ts](../../../../src/cli-commands.ts). Il n'est ni un prérequis ajouté au Studio ni une preuve de sa boucle native. |
| Cœur local et notices distribuées | **IMPLEMENTED** | [ADR 027](../../../ADR-027-local-open-source-boundary.md) : fermeture de 22 modules du domaine, contrôle et attention sans import UI/cloud/commercial ; appels directs dans les tests, runtime et export locaux éprouvés. Notices complètes inspectées dans l'archive installée, dont DOMPurify réellement distribué et les 38 sources d'icônes. Périmètre Node lié aux formats Studio, sans revendication de SDK autonome ni d'audit juridique exhaustif. |
| Futur produit hébergé | **DOCUMENTED ONLY** | [ADR 027](../../../ADR-027-local-open-source-boundary.md) définit un consommateur futur distinct de la base versionnée. Aucun SaaS ni service commercial à réaliser dans cette mission ; leur absence ne constitue pas un manque de la v1 locale. |
| Validation humaine indépendante ; gains comparatifs | **NOT FOUND** | Aucune trace de validation par une personne ni mesure comparative de temps, attention, coût ou qualité trouvée pour cette recette. Ni les clics CUA, ni `source:user`, ni le nombre de tests ne peuvent les remplacer. |

## Vérification et position d'intégration

Dernière preuve globale enregistrée : **1 504 tests réussis**, build, lint et format,
avec recette CUA et smoke de l'archive installée dans
[ATTENTION-CONCENTRATION](ATTENTION-CONCENTRATION.md). Les résultats restent attachés
à leurs sources et à leur archive ; les notes ajoutées ensuite ne sont pas une nouvelle
exécution. Les [dérivés publics](PUBLIC-EVIDENCE.md) préservent séparément hashes
originaux et publics, sans changer diagnostics ni résultats historiques.

- **Local** : capacités et commits de continuation présents sur la base inspectée ;
  recette complète encore partielle.
- **PR** : aucune PR dédiée à cette continuation créée à ce point ; les anciens lots
  ne sont pas présentés comme la livraison de la v1. Dossier et CI restent à préparer.
- **Mergé** : la méthode PR 39 appartient aux acquis repris ; aucun merge de cette
  continuation vers main n'est revendiqué.
- **Publié** : aucune publication npm ni aucun déploiement public de cette continuation.

## Entrées nécessaires à la clôture

L'inventaire reste suspendu après timeout avec consommation inconnue : une décision
explicite est requise avant tout nouvel appel. Le site reste arrêté après son appel
rapportant 736 988 tokens pour un seuil de 600 000 ; la correction ciblée est préparée,
mais son appel supplémentaire et ses nouvelles bornes attendent la réponse utilisateur.
Aucun registre ne doit être effacé ni une nouvelle campagne substituée à ces reprises.

Le film attend la permission macOS de capture de la fenêtre Studio, puis ses véritables
enregistrements anglais, montage, sous-titres, intégration et recette des nouveaux octets.
L'intervention humaine et l'acceptation finale doivent être obtenues sur le résultat réel.
Ces dépendances ne constituent pas, à elles seules, du code Studio manquant. La clôture
requiert aussi la recette native restant ouverte, les preuves de CI et un candidat
d'intégration concret ; aucune v1 terminée, fusion ou publication n'est déduite de ce bilan.
