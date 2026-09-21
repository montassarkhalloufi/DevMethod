# ADR 032 — Adoption locale liée à l’examen de la version

21 septembre 2026. Choix technique réversible sous la délégation de la mission
[v1 locale](missions/local-oss-v1/PLAN.md), en complément d’[ADR 030](ADR-030-studio-candidate-supervision.md).
Implémentation locale sur les parcours historique et éditeur ; cette décision ne prouve pas une
intervention humaine réelle. Voir [la preuve contrôlée](missions/local-oss-v1/evidence/LOCAL-ADOPTION.md).

## Besoin et choix

L’action « Utiliser cette version » applique aujourd’hui un candidat admis techniquement et
enregistre une raison générique. Elle ne conserve pas les preuves, les inconnues et la
recommandation que la personne a examinées. L’intervention du contrôle reste informative.

Trois possibilités ont été examinées : conserver ce comportement ; créer un système général
d’approbation de chaque risque ; relier l’adoption explicite existante à un examen précis de
la version. La troisième est retenue. Elle complète une action déjà utile et autorisée,
sans prétendre résoudre toutes les inconnues ni créer une autorisation globale de poursuivre.
Un système général reste à envisager lorsque plusieurs opérations auront des résolutions
effectivement différentes ; aucun formulaire générique ne tient lieu de preuve métier.

## Contrat

Avant adoption, Studio présente le titre et l’identité exacte de la version, son admission,
ses preuves actuelles, les motifs du contrôle, les risques et inconnues. La personne saisit
une raison puis déclenche l’adoption. L’ouverture de la fenêtre, la sélection d’une version,
la délégation ou la lecture des preuves ne constituent pas une approbation.

Le serveur relit le contrôle de la version demandée, y compris une version historique ou
importée. L’examen possède une empreinte stable du contexte pertinent ; une modification des
critères, délégations, preuves, statuts d’outils ou sources le rend périmé, même sans changement
du compteur de l’état principal. La mutation vérifie également le compteur de version.
Un examen périmé doit être actualisé puis confirmé de nouveau ; la raison saisie est conservée.

L’admission technique et l’intégrité des fichiers restent obligatoires. Une adoption locale
peut consigner des preuves métier absentes ou un arrêt du fournisseur, mais ne transforme
ces éléments en réussite, ne modifie aucune délégation, ne réinitialise aucune limite et
n’autorise aucun nouvel appel fournisseur. Les restrictions du runner restent effectives.
Les routes du worker ne peuvent ni adopter ni forger une décision d’examen utilisateur.

La décision conserve un résumé structuré et borné : version et empreintes, interventions,
motifs et inconnues, preuves examinées et leur provenance/fraîcheur. Aucun argument d’outil
ni résultat privé brut n’est ajouté à ce résumé. Les décisions anciennes restent lisibles ;
le nouveau résumé voyage dans l’export avec l’historique du projet.

## Preuve attendue

Tests d’intégration pour une adoption exacte, un contexte changé entre lecture et écriture,
une preuve qualité changée hors compteur principal, des sources altérées, une tentative du
worker et l’export/restauration. L’interface doit préserver la saisie après erreur, refuser
les résultats tardifs et exiger un nouveau clic après actualisation. Un parcours navigateur
contrôlé vérifie le rendu et les interactions ; il reste distinct d’une décision humaine.

Cette tranche complète la traçabilité d’une intervention d’adoption. Elle ne clôt pas à elle
seule les critères attention/autonomie, la vérification métier, les mesures de concentration
des interventions ou la recette native suspendue.
L’éditeur prépare désormais une version immuable avec `jobs.finish(..., {deferActivation:true})`,
puis ouvre le même examen et utilise la même route d’adoption. La route historique
`/api/editor/apply` conserve son nom pour compatibilité, mais retourne un candidat préparé,
sans activation et sans accord utilisateur inventé. Préparer les mêmes octets réutilise ce
candidat tant que sa source reste intacte. La préparation conserve le brouillon et l’ancienne
version active, y compris lors d’une fermeture ou d’un refus de l’examen.

Après adoption, la relecture de l’éditeur compare le dernier brouillon à la version adoptée
et conserve les changements intervenus pendant l’examen ; les contrôles du brouillon doivent
être réexécutés. Les saisies navigateur non sauvegardées restent séparées des octets examinés.
Les snapshots `source-only` suivent ce même parcours sans inventer une compilation ni lever
l’approbation du cadrage. Les données applicatives restent inchangées.
