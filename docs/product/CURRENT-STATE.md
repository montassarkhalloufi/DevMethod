# État actuel et limites

Cette page décrit la candidate Studio `0.6.0-beta.1` inspectée dans la branche d'intégration au
commit `ef539e5`. Elle ne remplace pas le registre npm ni les rapports liés à un commit exact.

## État synthétique

| Domaine | État observé dans la candidate | Limite principale |
| --- | --- | --- |
| Méthode et skills | 14 étapes visibles, 6 modules de procédure | Comportement natif dépend du host et du modèle |
| CLI | Installation, doctor, contexte, reprise, plan, closure, loop, guard, evidence, review | Plusieurs commandes inspectent sans exécuter le travail métier |
| Studio local | Création/import, conception, aperçu, code, décisions, vérifications, historique | Pas d'hébergement public, auth produit ou déploiement cloud |
| Code intelligence | Fichiers, architecture, flux, impact | Analyse statique partielle, comportement runtime non prouvé |
| Qualité | Catalogue et exécution de contrôles locaux | Les audits externes ou métier peuvent rester indisponibles |
| MCP/connecteurs | Catalogue, préparation, permissions et journal local | La présence d'un connecteur ne prouve ni connexion ni succès externe |
| Progression | Journal borné, persistant, déclaré par l'agent | Une action déclarée terminée n'est pas une preuve de correction |
| Control Plane | Graphe, risque, attention, autonomie, historique et admission | Politique v1 déterministe ; heuristiques explicites, pas audit global |

## Ce qui est réellement livré dans le Control Plane

- domaine TypeScript pur dans `src/control-plane/` ;
- politique `control-plane-v1` ;
- adaptation aux sources du Studio ;
- persistance dans le registre atomique existant ;
- routes HTTP locales ;
- admission des jobs, continuations et actions MCP ;
- six vues React : synthèse, graphe, risques, attention, autonomie et historique ;
- invalidation ciblée par dépendances connues ;
- interventions humaines motivées et non réécrites ;
- reprise après redémarrage ;
- captures navigateur et scénarios vérifiés dans la mission.

Voir le [guide du Control Plane](../studio/CONTROL-PLANE.md), l'[ADR 027](../ADR-027-control-plane.md)
et les [résultats exécutés](../missions/control-plane/RESULTS.md).

## Audits : lire les statuts correctement

Le Studio peut afficher des contrôles locaux, des résultats enregistrés, des demandes de contrôle
externe et des analyses statiques. Un audit n'est « réussi » que dans le périmètre de la preuve
reçue. Les catégories sécurité, performance, accessibilité, UX, métier et production readiness ne
sont pas des certifications globales.

Exemple de formulation correcte :

> Aucun marqueur de secret n'a été trouvé par le contrôle local exécuté sur cette révision.

Formulation incorrecte :

> Le projet est sécurisé.

## Ce qui reste expérimental ou non démontré

- avantage comparatif général face aux autres méthodes ;
- campagnes natives complètes Claude Code et Cursor ;
- parité entre installation d'un skill et comportement réel du modèle ;
- exécution arbitraire de frameworks ou backends importés ;
- audit métier, sécurité dynamique ou disponibilité de production ;
- montée en charge du Studio ou du Control Plane ;
- calibration automatique de la politique d'autonomie ;
- release npm publique de la candidate Studio décrite ici.

## Règle de mise à jour

Lorsqu'une fonctionnalité change, mettez à jour ensemble :

1. le contrat ou l'ADR propriétaire ;
2. le code et les tests ;
3. le guide utilisateur concerné ;
4. la carte du code si la frontière change ;
5. le rapport de vérification de la révision inspectée.

Ne transformez jamais un résultat historique en statut courant par simple copier-coller.
