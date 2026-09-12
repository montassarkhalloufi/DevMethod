# Frontières backend

Défaut pragmatique, à adapter aux contrats existants.

## Responsabilités
- Présentation : identité de confiance, validation et mapping du transport, appel d'un cas d'usage, présentation des erreurs/résultats.
- Application : cas d'usage, autorisation métier, transactions, idempotence, ports requis, orchestration du domaine.
- Domaine : invariants, transitions d'état, règles et erreurs métier indépendantes des frameworks, de HTTP, ORM, broker ou fournisseur IA.
- Infrastructure : implémentations de ports, persistance, messages, stockage, fournisseurs, mapping des représentations.
- Composition : assemblage concret, sans règles métier cachées.

Dépendances : Présentation → Application → Domaine; Infrastructure dépend vers l'intérieur et implémente les ports; Composition assemble les bords. Le domaine ne dépend pas d'un SDK. Ne pas cacher les cycles derrière des barrels.

Les ports d'I/O requis par les cas d'usage appartiennent par défaut à Application, y compris pour la persistance. Préserver une convention intérieure différente lorsqu'elle est déjà acceptée dans le projet; ne pas déplacer les ports sous couvert de DDD générique.

Domain Entity, Persistence Row, DTO et Integration Event sont des contrats distincts. Ne pas ajouter quatre mappers identiques par cérémonie; séparer les représentations là où leurs responsabilités divergent. Pas de GenericRepository, BaseEntity ou service attrape-tout par défaut.

## Concevoir une tranche
Exprimer une intention, ses entrées/sorties, préconditions, effets, erreurs stables et propriétaire. Identifier l'invariant puis l'endroit où il est garanti sous concurrence. Un contrôle côté client ne protège ni les droits ni les quotas.

Pour les données, préciser propriétaire, transaction, unicité, index utiles, concurrence, migration et restauration/forward-fix. Une migration déjà appliquée ne se réécrit pas. Préférer expand/migrate/contract si plusieurs versions coexistent.

Pour les messages, préciser producteur, consommateur, contrat/version, accusé de traitement, redelivery, idempotence, backoff, poison message et récupération. Ne pas promettre « exactement une fois » grâce au broker seul. Outbox/inbox uniquement si un besoin d'atomicité et de reprise le justifie.

Ne pas accéder à la base ou au code privé d'un autre service. Utiliser ses contrats acceptés. Une projection reconstruite ne doit pas réécrire les preuves historiques d'une décision.

## Vérifier
Tests domaine pour invariants; tests cas d'usage avec ports factices; intégration réelle pour transactions, contraintes et concurrence; contrat/HTTP pour le transport. S'appuyer sur les vérifications d'import existantes; si un gate d'architecture est nécessaire, couvrir alias, imports type-only et tous les packages concernés. Une recherche textuelle seule ne prouve pas l'absence de dépendances interdites.
