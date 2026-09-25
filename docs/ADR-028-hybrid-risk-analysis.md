# ADR 028 — Analyse de risque hybride, contextualisée et vérifiable

Date : 2026-09-25. Statut : **acceptée et implémentée ; validation locale consignée dans la mission**.
Responsable de la décision : agent de développement, sur délégation explicite du propriétaire.

## Origine et portée de la décision

Après la livraison du [Control Plane v1](ADR-027-control-plane.md), l’utilisateur demande
une distinction plus fine entre un changement CSS et un changement exposé à la concurrence
de requêtes. Après discussion d’une combinaison IA/règles, il délègue le choix :
« c'est une idée mais c'est toi l'expert tu dois decideer ».

Cette délégation a été suivie de l’autorisation explicite de terminer le sujet, avec liberté de corriger la solution. L’implémentation et ses essais sont consignés dans les [résultats de mission](missions/hybrid-risk/RESULTS.md) ; la décision seule ne constituait pas une preuve. La mission Control Plane v1 fusionnée reste clôturée dans son périmètre.
Cet ADR étend ses sources de risque ; il conserve la séparation preuve/inférence,
les décisions humaines, la politique versionnée et les permissions indépendantes.

## Décision

Retenir quatre responsabilités complémentaires dans le Control Plane existant :

| Responsabilité | Entrée et résultat | Autorité |
| --- | --- | --- |
| Analyse structurée | Comparaison des versions, syntaxe, dépendances et contrats ; faits localisés et limites de couverture | Établit ce qui a été effectivement analysé |
| Analyse IA | Changements et contexte pertinents ; hypothèses de risque, références et scénarios de vérification | Produit des inférences, jamais des résultats de tests |
| Vérification | Contrôles autorisés portant sur les risques et critères concernés ; résultats attachés à la version | Apporte une observation dans un périmètre annoncé |
| Politique déterministe | Faits, inférences recevables, preuves, incertitudes et responsabilités | Calcule le risque effectif et l’autonomie autorisée |

Le modèle ne fixe pas directement `Auto-Continue`. Une affirmation d’absence de risque
ne supprime aucune exigence. Les permissions, arrêts persistants, sources manquantes et
responsabilités réservées restent contrôlés par le serveur. Un constat IA peut conduire
à demander une vérification ; une gravité suggérée par le modèle n’est pas une commande.
Une contradiction entre analyse, contrat et observations reste explicite jusqu’à résolution.

## Distinction des changements et des preuves

La sélection des contrôles utilise la nature du changement, ses consommateurs, les
invariants métier et les limites de l’analyse. L’extension d’un fichier ne suffit pas.

| Cas à distinguer | Analyse utile | Preuve recherchée |
| --- | --- | --- |
| Espacement CSS local | Propriétés modifiées, sélecteurs et écrans concernés | Rendu aux tailles pertinentes, absence de recouvrement |
| CSS d’un composant partagé ou d’une confirmation | Portée, visibilité, focus, superposition et interactions | Parcours navigateur et clavier, accessibilité et rendu |
| Recherches asynchrones | Ordre des réponses, annulation et état affiché | Réponses inversées ; la dernière intention reste affichée |
| Réservations concurrentes | Ressource partagée, lecture/écriture et atomicité | Requêtes simultanées ; capacité et unicité respectées |
| Reprise d’une écriture | Identité de l’opération, doublons et effets après timeout | Répétition d’une demande ; un seul effet métier |
| Changement de permissions ou migration | Contrats, consommateurs, autorisations et réversibilité | Contrôles de permissions ou migration/restauration adaptés |

Séparer l’impact potentiel d’un défaut, les mécanismes de défaut suspectés et la couverture
des preuves. Un test réussi ne diminue pas la gravité d’une perte de données ; il renseigne
sur la vérification d’un scénario précis. Un nombre élevé de tests ne compense pas
l’absence du scénario concurrent ou de l’invariant concerné.

Une voie sans IA reste possible pour un changement dont le périmètre limité est établi
par une règle explicite et des analyseurs supportés. Les autres changements fonctionnels,
mixtes, sensibles ou insuffisamment compris passent par l’analyse contextuelle lorsque
celle-ci est disponible et autorisée. Un parseur absent, une dépendance non résolue ou
un contexte tronqué ne permettent pas de classer arbitrairement le changement comme faible.

## Contrats et intégration

Réutiliser l’analyse projet, les jobs, les budgets, le stockage atomique, l’Evidence Graph
et les retours de contrôles existants. Ne pas introduire un service distant de risque,
un second registre décisionnel ou une flotte d’agents.

L’analyse reçoit la base et la version cible exactes, les critères et décisions applicables,
les sources avant/après, les consommateurs présents dans le contexte borné et un inventaire explicite des éléments non inspectés. Les preuves existantes sont confrontées séparément par la politique : un ancien résultat positif ne doit pas inciter le modèle à ignorer un risque nouveau. Chaque constat doit contenir :

- une catégorie et une conséquence possible ;
- les chemins et plages de code vérifiables sur la version cible ;
- l’invariant concerné et le raisonnement observable qui motive le constat ;
- les hypothèses, informations manquantes et limites ;
- les scénarios de vérification recommandés, sans commande libre à exécuter.

Valider strictement la réponse, les identifiants, les références et les bornes de taille.
Une référence existante confirme sa localisation, pas la vérité de l’interprétation.
Les constats restent marqués `inferred`. Une analyse terminée est une exécution observée
de l’analyseur ; ce statut ne transforme pas ses conclusions en preuves observées.

La clé de réutilisation inclut les empreintes des versions, du contexte métier et des
sources transmises et le protocole versionné `hybrid-risk-1` (contrat, instructions et profil d’exécution). Toute évolution sémantique de ce protocole impose un nouvel identifiant. Le runner utilise le modèle par défaut du CLI ; son identifiant exact n’est pas exposé dans le flux JSON observé. Cette limite de provenance est annoncée : les essais ne certifient pas un autre modèle ou une évolution future du défaut du fournisseur.
Conserver la réponse acceptée et sa provenance permet de rejouer la politique sans
réinterroger le modèle. Une nouvelle invocation peut produire un résultat différent.
Un résultat tardif pour un contexte remplacé reste historique et ne décide pas pour la
version courante. Les analyses ne peuvent réécrire une décision humaine.

## Exécution, accès et coût

Utiliser la voie d’agent déjà configurée et autorisée pour le projet. Aucun fournisseur,
modèle commercial, compte ou abonnement supplémentaire n’est choisi dans cette décision.
Le runner conserve son exécution de développement et possède une entrée d’inspection distincte : sandbox `read-only`, dossier temporaire séparé, configuration utilisateur et règles ignorées, outils de commande, navigateur, plugins, MCP et sous-agents désactivés. Un événement d’outil inattendu interrompt l’inspection. Le [contrat de configuration officiel](https://learn.chatgpt.com/docs/config-file/config-reference) documente les réglages de shell et de sandbox ; les essais réels contrôlent ici leur usage par cette version du CLI.

L’analyse ne modifie pas le projet, ne déclenche pas d’appel MCP et n’exécute aucun script
du dépôt analysé. Les sources sont des données non fiables, y compris leurs commentaires.
Ne pas inclure de secrets ni de données applicatives ; limiter le contexte aux sources
autorisées. L’exécution d’un scénario généré utilise ensuite les contrôles de confiance
existants ou un adaptateur explicitement autorisé.

Une lecture ou un rafraîchissement du tableau de bord ne déclenche aucun appel IA.
Déclenchement par une demande d’analyse ou une mission admise dans les délégations existantes.
Une seule analyse active par projet ; demandes identiques regroupées ; pas de répétition
automatique jusqu’à obtenir une réponse favorable. Réserver l’appel dans le budget existant
avant son démarrage et appliquer ses plafonds de durée, tentatives et consommation.
Une sortie invalide, annulation, interruption ou consommation inconnue n’est pas un succès.
Un timeout ambigu nécessite réconciliation avant une nouvelle tentative payante.

La campagne initiale de huit appels a mesuré 84 177 jetons connus et 96,168 secondes cumulées ; le coût monétaire n’est pas fourni par le CLI. Le détail des essais et des tentatives préliminaires reste dans les résultats. Ils dépendent de la
configuration existante, du contexte et de la fréquence des analyses ; aucune économie
ni précision chiffrée n’est annoncée. Mesurer durée, consommation connue, réutilisation,
indisponibilité et utilité des constats sur la campagne initiale.

Si l’IA nécessaire à un périmètre est indisponible, conserver une couverture incomplète
et au minimum `Verify`, sans abaisser un arrêt ou un risque supérieur. Une voie limitée
explicitement validée sans IA garde ses propres exigences. Aucun fournisseur de remplacement
ni élargissement d’autorisation automatique.

## Alternatives examinées

| Option | Atout | Limite déterminante | Choix |
| --- | --- | --- | --- |
| Conserver les règles v1 | Simple, explicable, aucun appel IA supplémentaire | Interprétation trop limitée des changements et des invariants | Conservée comme base et protection pendant la transition |
| Renforcer uniquement l’analyse statique | Rapide et reproductible dans les langages supportés | Travail par langage/framework ; contexte métier et comportements dynamiques partiels | Retenue comme première couche, insuffisante seule pour l’objectif |
| Analyse structurée et IA, preuves puis politique | Contexte plus riche, hypothèses traçables et contrôles adaptés | Coût, délai, erreurs possibles et évaluation réelle nécessaires | Architecture retenue |

La séparation des permissions suit les [recommandations OWASP sur l’autorité des modèles](https://genai.owasp.org/llmrisk/llm062025-excessive-agency/).
Les limites de revue IA, notamment omissions et faux positifs, sont aussi décrites par
[GitHub](https://docs.github.com/en/copilot/responsible-use/agents). Ces références ne
démontrent pas l’efficacité de cette future capacité dans DevMethod.

## Mise en service et conditions de réussite

La campagne a d’abord exercé le modèle sur des fixtures isolées, sans adoption de code. La politique explicite `control-plane-v2` est maintenant utilisée pour les versions analysables, avec tests de contrat, essais réels et inspection de l’interface. Les évaluations historiques sans identifiant explicite continuent d’utiliser v1. Les constats recevables
peuvent ajouter des besoins de preuve ; ils ne suppriment pas seuls une exigence existante.
L’adaptation des contrôles obligatoires nécessite des règles versionnées et des tests.

La campagne comprend les cas du tableau précédent, avec variantes saines et défectueuses,
code trompeur dans les commentaires, manque de contexte, modèle indisponible, réponse
malformée, références inventées, résultat périmé, double demande et interruption.
Mesurer les risques réellement détectés, les faux positifs, les abstentions, les scénarios
pertinents et leurs résultats, ainsi que le coût et le délai par analyse exploitable.

Séparer cas de mise au point et cas conservés hors mise au point ; conserver les échecs
et les répétitions pour observer la variabilité. Une fixture de réponse IA valide le
câblage ; l’efficacité exige des essais réels du modèle configuré. Les tests adverses
doivent montrer qu’aucune sortie IA ne permet de contourner preuve, autorisation ou arrêt.
Cette campagne finie ne prouve pas l’absence générale de défauts de concurrence.

Les instantanés v1 restent lisibles et rejouables. Désactiver l’analyse IA arrête les
nouveaux appels, sans supprimer les constats ni lever les exigences déjà applicables.
Une régression de précision, un coût disproportionné, un défaut d’isolation ou un changement
de modèle impose une nouvelle évaluation de la capacité avant activation de sa nouvelle version.

État actuel, critères de clôture et limites opérationnelles : [résultats de mission](missions/hybrid-risk/RESULTS.md). Le périmètre livré reste borné : profils syntaxiques JS/TS, voie étroite de présentation CSS/HTML et analyse contextuelle explicite. Les autres contenus et omissions restent une couverture incomplète ; aucune détection exhaustive de concurrence n’est annoncée.
