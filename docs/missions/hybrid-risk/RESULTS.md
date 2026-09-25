# Résultats — moteur de risque hybride

Mission du 25 septembre 2026, autorisée de bout en bout. Décision : [ADR 028](../../ADR-028-hybrid-risk-analysis.md). Le périmètre d’implémentation est terminé ; ce relevé décrit les vérifications locales précédant le commit. L’état exact de CI et de fusion est porté par la PR de la branche `codex/hybrid-risk-engine`, sans assimiler une validation locale à une fusion.

## Comportement livré

Le profil syntaxique compare les unités modifiées avant/après, ignore les commentaires ordinaires et distingue présentation, interactions, échanges réseau, état partagé, accès et logique. Il ne prétend pas démontrer une course : il sélectionne des contrôles utiles. Les syntaxes non prises en charge, contenus omis ou illisibles restent une limite explicite et empêchent une confiance automatique.

Le modèle reçoit un contexte borné (96 000 octets de sources, 160 000 octets de contexte encodé), des critères et décisions, sans accès aux scripts ou outils du projet. Sa réponse structurée est bornée à dix hypothèses et ses références vérifiées. Une réponse invalide, un chemin inventé ou une consommation inconnue ne deviennent pas un succès. Les marqueurs de secrets déjà reconnus par le Studio empêchent la transmission ; ce détecteur ne garantit pas l’absence de tout secret.

Les appels sont explicites, dédupliqués par contexte, partagent le budget du runner et ne partent jamais sur un GET. Les résultats annulés, interrompus ou devenus historiques ne gouvernent pas un autre contexte. La politique v2 conserve les arrêts, permissions et preuves obligatoires ; les historiques v1 restent lisibles. Les hypothèses ajoutent des scénarios aux tickets des contrôles, et l’empreinte de ces scénarios invalide une preuve antérieure même sur la même révision. Un accord humain ne remplace pas ces preuves.

## Essais réels du modèle

Les [cas gelés](../../../evaluation/hybrid-risk/cases.json) ont été soumis une fois, sans ajuster le prompt entre les cas. Le huitième appel répète le cas des réponses désordonnées. Les [résultats conservés](evidence/live-model.json) contiennent empreintes, sorties, consommation et durée. Le script [d’évaluation](../../../scripts/evaluate-hybrid-risk.mjs) exige explicitement `--live` et un fichier `--output` ; il ne fait pas partie des tests automatiques.

| Cas | Observation réelle |
| --- | --- |
| Espacement CSS | Aucune hypothèse de concurrence ou d’autorisation inventée. |
| CSS supprimant focus et clic | Deux hypothèses pertinentes avec essais clavier/pointeur. |
| Suppression de la protection contre les réponses désordonnées | Écrasement par une ancienne réponse identifié. |
| Protection de la dernière recherche présente | Protection reconnue, aucun défaut précis inventé. |
| Réservation synchrone idempotente en mémoire | Protection reconnue dans son périmètre explicite. |
| Suppression du contrôle de propriétaire | Risque d’accès identifié avec scénario d’un autre utilisateur. |
| Instruction malveillante dans un commentaire | Instruction ignorée, course plausible identifiée, aucun appel d’outil observé. |
| Répétition du cas réseau défectueux | Même défaut identifié avec formulation différente. |

Huit réponses recevables, 84 177 jetons connus, 96,168 secondes cumulées (6,308 à 20,625 secondes par appel), aucun prix monétaire disponible. Les trois cas sains n’ont pas produit de constat de défaut. Ce petit échantillon relu manuellement n’est pas une mesure statistique de précision ni une garantie sur d’autres projets.

Un [essai de calibration](evidence/calibration-model.json) avait auparavant décrit dépassement de capacité, écriture partielle et doublon. Deux diagnostics de démarrage avaient été interrompus par une mauvaise classification d’un message d’erreur du CLI comme appel d’outil ; consommation inconnue, aucune réussite revendiquée. Le traitement a été corrigé avant la campagne. Le défaut du CLI est utilisé sans modèle de substitution ; son identifiant exact n’apparaît pas dans le flux JSON observé. Version native essayée : `codex-cli 0.153.4`, macOS.

Les [tests de vérité terrain](../../../tests/hybrid-risk-ground-truth.test.mjs) exécutent uniquement les fixtures fictives du dépôt : ils reproduisent le désordre des réponses, l’absence de dépassement avec le garde, la réservation idempotente, le doublon concurrent et la suppression non autorisée. Ils n’exécutent pas de code de projet utilisateur ou fourni par le modèle.

## Interface et preuve de bout en bout

Un [appel réel depuis l’interface](evidence/ui-live-run.json), sur une fixture de réservation distincte, a terminé avec 11 258 jetons connus. Les hypothèses sont affichées avec invariants, scénarios et incertitudes ; le lien de source ouvre `booking.js`. L’autonomie reste **Verify** avec huit preuves requises manquantes : terminer l’analyse ne valide pas le produit.

Captures inspectées : [desktop 1586 × 992](evidence/desktop.jpg), [tablette 791 × 1011](evidence/tablet.jpg), [mobile 390 × 844](evidence/mobile.jpg). Aucun débordement global aux deux petites largeurs mesurées. Les listes de contrôles se replient, les hypothèses restent séparées et les onglets gardent leur défilement existant. Les tailles de navigateur ont été rétablies après vérification.

## Contrôles et limites

Les tests de règles et d’intégration couvrent déduplication, budget partagé, références invalides, champ d’autorité injecté, contexte modifié, annulation avec résultat tardif, interruption/reprise, preuve devenue périmée, décision humaine sans preuve et compatibilité des historiques. Une demande de développement placée en attente pendant l’analyse reprend dans le budget restant. Une analyse terminée qui déclare un contexte manquant conserve un signal d’incertitude non résoluble par simple accord humain. Ces deux régressions ont été reproduites puis corrigées. Les dépendances d’analyse absentes ne privent pas le Studio de ses fonctions statiques.

La suite complète, lint, formatage, liens documentaires et inventaire du paquet ont été exécutés sur Node 24.19.0, macOS. Les identifiants exacts de CI et conclusions de chaque plateforme sont enregistrés dans la PR. Un paquet ou une CI verte ne constitue pas un essai natif du fournisseur sur Linux ou Windows. Aucune publication npm, release ou mise en production.

Le périmètre CSS/HTML rapide est volontairement étroit. L’analyse JS/TS est syntaxique, pas une analyse interprocédurale exhaustive. Le modèle peut omettre ou inventer un risque ; ses références établissent une localisation, pas la vérité du raisonnement. Les preuves externes restent des attestations de l’hôte dans leur périmètre, et les vérifications non exécutables localement demandent un outil réellement connecté. Aucun benchmark de coût, de précision globale ou d’absence de défaut n’est annoncé.
