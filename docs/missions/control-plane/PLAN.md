# Mission — DevMethod Control Plane

Source : demande utilisateur du 25 septembre 2026 ; délégation autonome de l’implémentation,
commit, push, PR et fusion conditionnée aux contrôles verts. Aucune publication npm ni tag autorisé.

Base inspectée : `codex/studio-0.6-integration`, `f6d6b4b3a89066b9baa8d1e18acc7dbb10d8be0c`,
Studio `0.6.0-beta.1`, PR #41 ouverte. CI initiale Linux/macOS verte, Windows en échec.
Fichiers personnels préexistants exclus : `.DS_Store`, `prepublication-ai-audit.*`,
`publication-preparation/`. Les cinq images déjà présentes dans `evidence/` sont préservées ;
seules les trois références explicitement demandées seront ajoutées au commit.

## Portée et ordre

1. Domaine typé, politique versionnée, invalidation sélective, attention et rejeu.
2. Adaptation des sources Studio, persistance, routes, contrôles et limites d’exécution.
3. Îlot React : synthèse, graphe, attention, risques, autonomie, historique ; navigation existante.
4. Scénarios d’acceptation et négatifs, contrôles dépôt, parcours navigateur, captures et revue.
5. Commit identifié, PR actualisée, CI toutes plateformes, fusion uniquement sous les conditions demandées.

Architecture : [ADR 027](../../ADR-027-control-plane.md).
Références verrouillées : [vue d’ensemble](evidence/control-plane-overview-v1.png),
[graphe](evidence/control-plane-evidence-graph-v1.png),
[attention](evidence/control-plane-human-attention-v1.png).

## État

Checkpoint du 25 septembre 2026 : domaine typé, stockage, sources, admission jobs/MCP,
continuation vérifiée et six vues implémentés. Les tests ciblés couvrent les quatre décisions,
l’invalidation sélective, les contrôles réels et leurs reprises, les décisions humaines,
le redémarrage, les sources indisponibles et les interactions UI. Les tests de contrats
utilisant des attestations simulées sont explicitement identifiés dans leur résultat ;
ils ne sont pas des validations navigateur.

L’essai navigateur utilise une copie locale jetable de Les Ateliers (51 fichiers, 73 nœuds
observés avant les dernières observations). La navigation, le rechargement, le graphe, la décision humaine et
le lancement de contrôles ont été exercés. Les contrôles locaux, les captures finales et les
essais étroits sont consignés dans [les résultats](RESULTS.md). Le retour utilisateur sur la
lisibilité du graphe complet est intégré : familles, noms complets, marges pour les lignes,
recherche et navigation des relations. La CI du commit exact et la fusion sont suivies dans la PR.

Corrections de compatibilité : les tests de livraison appliquent explicitement leur candidate
avant d’exercer l’aperçu ; ils vérifient aussi l’absence d’adoption sans preuves. Les tests MCP
examinent désormais l’autorisation exacte et conservent les assertions de permissions juste
avant transmission. Les fixtures de package incluent le domaine compilé distribué. Les tests
Windows historiques ont révélé des séparateurs non portables et une lecture de lien symbolique :
la correction est locale, sans suppression d’assertion ; la CI Windows reste à confirmer.
