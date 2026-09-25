# Continuité de l'Atelier et diagnostic de cadrage

16 septembre 2026. Reprise explicitement demandée par le propriétaire. **Une perte de contexte est corrigée ; aucun avantage humain comparatif ni rupture n'est établi.** Cette tranche relie un défaut du produit utilisable au travail de contexte décrit dans [EMPOWERMENT](../../EMPOWERMENT.md). Elle ne remplace pas l'objectif par un benchmark de laboratoire.

## Changement pour la personne

Après deux choix et une révision du besoin, la session conservait l'ancienne raison, son contexte et ses contraintes. La nouvelle demande téléchargée pour l'agent les omettait. L'[observation HTTP avant correction](handoff-before.json), conduite sur `617b22c` avec des données explicitement synthétiques, retrouve la raison actuelle mais aucun de ces trois éléments historiques. Ce n'est pas une plainte attribuée à un participant.

La demande préparée transmet maintenant `history` et `scenario`, en plus du projet actuel, du choix actuel et des observations par variante. L'[observation après correction](handoff-after.json) retrouve les quatre éléments et confirme que les données vivantes restent intactes. Le destinataire dispose donc des acquis déjà enregistrés sans saisie supplémentaire. **Nous n'avons pas encore observé s'il les utilise correctement ni combien de travail cela épargne à une personne.** Une raison enregistrée n'est pas automatiquement une décision humaine ; les anciens fichiers incomplets restent incomplets.

Implémentation : deux champs ajoutés à `prepareRequest`, commit d'auteur `54087089fc662a5c63fa786aac99613d971016d8`, intégré par `b590fb1`. Le nouveau test échoue sur la base avec l'[absence d'historique attendue](handoff-red.txt), puis passe avec les cinq tests HTTP existants. Il vérifie un redémarrage dans un autre processus, les anciennes raisons et contraintes, la situation commune distincte des actions ciblées, l'immuabilité des fichiers après de nouveaux changements et la lecture d'un ancien format reconstruit. L'arrêt du processus de test utilise ensuite IPC pour rester portable ; [résultat ciblé final](handoff-green.txt) et [revue indépendante avec addendum](handoff-review.md).

Le mécanisme est une transmission fidèle des données déjà disponibles. Il n'exige ni moteur de mémoire supplémentaire, ni résumé généré, ni nouvelle phase obligatoire. L'export de décision transmettait déjà ces éléments : la demande à l'agent applique désormais la même continuité. Des artefacts de reprise et journaux de décisions existent aussi dans les méthodes concurrentes ; nous ne revendiquons pas leur invention.

Coût : sur la fixture détaillée du test, le fichier contient 34 863 octets, contre 25 393 pour le même snapshot sans les deux champs, soit +9 470 octets. L'observation HTTP séparée, qui emploie d'autres données et une sérialisation compacte, passe de 19 408 à 24 647 octets. Ne pas confondre ces workloads ni les assimiler à des tokens. L'historique complet répète des snapshots : sa sélection pertinente et son utilisation restent des questions ouvertes. Aucun gain de contexte ou de tokens n'est annoncé.

## Diagnostic natif prospectif

Le [protocole](framing-protocol.json) prévoit une calibration, puis BMAD spec, DevMethod frame et Spec Kit specify : mêmes 879 fichiers produit/sources, même demande de cadrage, même hôte Codex 0.147.0, même modèle gpt-5.6-sol/low, une invocation par condition. Le produit est le snapshot complet `617b22c`, antérieur à la correction. L'opérateur a déjà choisi la tâche et fourni les messages sources : ce travail et les documents DevMethod existants sont des entrées déclarées. Ce n'est pas un essai de contexte construit depuis zéro.

BMAD 6.12.0 utilise son entrée officielle headless, avec les deux passes internes de validation prévues ; Spec Kit 1.0.7 utilise specify. Aucun parcours Build n'est évalué. Ces trois entrées de cadrage ne requièrent pas de sous-agents : les désactiver ici ne prétend pas représenter un Build BMAD privé de ses reviewers. L'ordre fixe a été choisi avant les résultats ; un essai par condition ne permettrait de toute façon aucune inférence statistique.

Limites prospectives : au plus quatre nouveaux appels, 120 secondes et 2 MiB par appel, aucune relance automatique, arrêt avant l'appel suivant si réponse finale/consommation manque, si un input protégé change ou si les tokens connus cumulés atteignent 200 000. Ce dernier seuil inclut les 51 712 tokens historiques déjà connus ; c'est un seuil entre appels, pas un plafond fournisseur. Les consommations historiques inconnues restent inconnues.

La [revue](framing-review.md) et les préflights sans modèle vérifient les catalogues actifs par chemin et drapeau enabled : calibration 0, BMAD 29, DevMethod 20, Spec Kit 18 ; 26 skills globaux désactivés dans chaque racine. Les sources produit restent sous `product/`, distinctes du catalogue actif. Une politique native unique permet lecture/écriture et HTTP local tout en refusant controls et les conditions voisines. Elle autorise plus largement les connexions locales/privées ; elle n'est pas décrite comme exclusivement loopback. Le chargement initial d'instructions a été inspecté séparément ; les preuves de commandes ne certifient pas tous les helpers possibles.

Deux erreurs de préparation sans modèle sont conservées en privé : option `--ignore-user-config` non acceptée par app-server, puis priorité de la règle TMPDIR empêchant l'écriture. Elles sont corrigées avant les préflights admis. Les révisions du pilote sont tracées : v1 pré-appel, v2 avec test protégé et vérifications indépendantes confinées, puis v3 avant BMAD pour étendre l'annulation aux vérifications. La calibration v2 n'a pas été rejouée ; sa fenêtre d'annulation résiduelle reste signalée. Aucun changement d'inputs, de seuil ou de critère n'a été fait après résultat. HOME et CODEX_HOME sont conservés dans les appels admis. Un essai exploratoire antérieur hors modèle avait utilisé un CODEX_HOME temporaire ; cette approche a été rejetée et n'est pas la preuve retenue.

## Résultats observés et arrêt

Le [résultat complet](framing-result.json) conserve les statuts, hashes, préflights, révisions du pilote et coûts connus.

| Condition | Observation | Consommation native |
| --- | --- | --- |
| Calibration | Correction effectuée, test HTTP et sept cas indépendants passent ; réponse finale après 27,022 s | 48 818 entrée + 516 sortie = 49 334 ; 28 160 entrées cache déjà incluses |
| BMAD spec | Sources lues, lacune historique identifiée, journal partiel écrit ; arrêt à 120,008 s avant SPEC finale et validations | Inconnue ; aucune réponse finale ni événement terminal d'usage |
| DevMethod frame | Non admis après l'arrêt BMAD | Aucun nouvel appel |
| Spec Kit specify | Non admis après l'arrêt BMAD | Aucun nouvel appel |

La [trace BMAD dérivée](bmad-events.jsonl) montre des commandes réelles, dont l'activation officielle, la lecture des sources et du code. L'agent identifie explicitement l'absence de `history` et de la situation dans la demande, sans avoir reçu les noms des champs attendus dans la consigne commune. Le [journal partiel](bmad-memlog.md) conserve sept entrées ; aucune SPEC terminée n'existe. Cette capacité observée est pertinente, mais ni le diagnostic correct ni l'expiration de deux minutes ne classent BMAD face aux méthodes non exécutées. Ne pas compter l'arrêt imposé comme une infériorité de méthode.

La [trace calibration dérivée](calibration-events.jsonl) conserve les commandes et réponses. Les traces publiées omettent les contenus lus par les commandes ; elles en gardent les tailles et SHA-256. Les JSONL originaux restent privés, avec leurs hashes dans le résultat. Les manifests complets, fichiers de préparation, gels et stderr sont conservés sous `/private/tmp/devmethod-framing-pilot-20260916`. Aucun identifiant de thread ni contenu d'authentification n'est nécessaire au résultat publié.

Cumul **connu** : 101 046 tokens, dont l'ancienne référence de 51 712. Le total réel et le coût monétaire sont inconnus : BMAD et deux anciennes séries ne sont pas chiffrés. La série est close ; aucune augmentation rétrospective du délai, aucun retry, aucun lancement des deux conditions restantes. Une réussite de calibration n'est pas une comparaison achevée.

## Livraison et conséquence pour la recherche

Le serveur Atelier sur le port 4318 a été redémarré sur le correctif, avec HTTP 200 et session conservée octet pour octet (SHA-256 `0aa7457fa8e9c6896e8e4e6840f5649a84eb7f70a0425012c1baeb5f97fb7408`). Les POST d'observation ont eu lieu dans des sessions techniques séparées. Un premier démarrage de ces observations a été refusé par le sandbox local ; ce refus n'est pas le rouge fonctionnel et n'a pas modifié la session utilisateur.

Suite locale Node 24.18.0 : 353/353 tests passent, zéro ignoré ; lint et format passent. Après l'ajustement IPC du test, les six tests concernés repassent. Les contrôles d'archive exacte et CI du head livré sont rattachés à la PR #36, distincts de ces observations locales. Aucune publication, fusion ou ouverture de service externe.

Décision : garder cette correction de transmission simple. Elle retire une lacune réelle du produit utilisable. L'étape décisive reste l'utilisation du contexte pendant une continuation : éléments retrouvés, distinction actuel/historique, corrections demandées à la personne, compréhension et pouvoir de décision, avec le coût de préparation et de lecture inclus. Une comparaison complète doit permettre le parcours natif utile de chaque méthode et disposer d'une collecte de consommation en cas d'interruption ; ce diagnostic arrêté ne doit pas être relancé sous un autre nom. Les autres conceptions de [FRONTIER](../../FRONTIER.md) demeurent ouvertes. La mission de recherche n'est pas déclarée terminée.
