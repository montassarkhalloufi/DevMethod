# Concentration des observations à examiner — 21 septembre 2026

Tranche de présentation du critère E de la [mission](../PLAN.md), dérivée du graphe
de contrôle existant. Elle ne modifie ni la politique d’autonomie ni les accords.

## Résultat

Dans Vérifications, « Points à examiner / Items to review » compte les preuves de
la version évaluée dont le résultat n’est pas un succès courant attesté par Studio.
Les groupes sont ordonnés par effectif puis type, sans en masquer. Identités uniques,
provenance et liens existants sont conservés ; le reçu remplaçant un contrôle lié
ne compte pas deux fois. Les preuves hors version sont séparées. Une absence de
preuve ne devient pas une observation ; aucun ratio 80/20 ou score de risque n’est
déduit. Les comptes courants et à examiner peuvent se recouper et le texte le précise.

Les motifs d’arrêt et facteurs critiques restent visibles avant les groupes, même
sans observation ou pour un facteur isolé. Aucune action, approbation, écriture métier
ou exécution n’est ajoutée. Les diagnostics inconnus restent du texte, sans exécution.

## Vérification et corrections

Six tests du modèle pur couvrent portée, déduplication, stabilité, inconnus, absence
de mutation et critiques isolés. Le cas de reçu lié utilise la véritable projection
`evaluateControl`. Quatre tests de la vue exercent son raccordement, les liens
préfixés dans les dialogues, les limites, FR/EN et l’absence de nouvelles actions.
Trois tests de la vue ont d’abord échoué sur l’absence de la section ; les tests
du nouveau modèle sont postérieurs à son implémentation, sans faux rouge revendiqué.

La revue indépendante a relevé un libellé de provenance trompeur : un résultat
`host-attested` peut être `trusted:false`. La vue dit maintenant « non attestée par
Studio », préservant la distinction avec l’attestation hôte. Les facteurs critiques
connus sont traduits et les observations agent disposent d’un nom explicite.

Recette CUA sur un vrai Studio servant une fixture synthétique, agent désactivé :
échec syntaxique réellement enregistré, observation agent et baseline historique.
Comptes observés : deux points à examiner, deux preuves courantes, une preuve hors
version. Les liens ouvrent la bonne preuve et son diagnostic. Un défaut visuel plaçait
le titre ciblé derrière l’en-tête ; la marge d’ancre corrigée le rend visible à 68 px
sur bureau et 108 px sur mobile. Français/anglais, largeur 390 × 844 sans débordement,
et retour à la langue anglaise vérifiés. L’empreinte de l’état Studio est identique
avant et après la recette. Le serveur de fixture a été fermé.

Preuves privées : `evaluation-private/local-oss-v1/attention-fixture/`, dont états
avant/après, observations CUA et captures inspectées. La première préparation de
fixture a été refusée avant livraison, car son plan Guided n’était pas approuvé ;
elle est conservée séparément de la fixture de présentation préparée ensuite.

Build et **1 504/1 504 tests globaux réussis**, lint et format réussis. La première
exécution globale avait un échec dans un test Home inchangé : une ancienne erreur
était observée avant la fin du deuxième envoi, puis une pause fixe de 10 ms précédait
le troisième. Le rejet retardé contrôlé a reproduit cette course du test ; attendre
les états occupé puis réactivé l’a corrigée sans changer le produit ni ses assertions
d’identité. Les 20 tests Home passent, puis la suite complète est verte. Les deux
exécutions globales et la reproduction sont conservées dans les logs privés `attention-*`.

Le paquet contenant ces sources a aussi été inspecté, installé et vérifié par
`test:package` : Studio, React, reprise, export/restauration et installateurs réussis.
Les nouveaux modules de présentation sont inclus ; aucun fichier privé n’est emballé.
SHA-256 de l’archive vérifiée :
`bd78958f3794ecff33f644492a4aae6618510220c2d9fe85cdf01956c896038b`.
La note de résultat du paquet a été ajoutée ensuite ; les sources exécutables sont
identiques. Aucun appel fournisseur ni publication.

## Limites

Les comptes décrivent les observations disponibles, pas leur fréquence dans tous
les projets, leur gravité relative ou la probabilité d’un incident. Cette tranche
complète la vue de concentration demandée ; elle ne démontre ni intervention humaine
indépendante, ni opération réelle d’un connecteur, ni achèvement des critères C–G.
