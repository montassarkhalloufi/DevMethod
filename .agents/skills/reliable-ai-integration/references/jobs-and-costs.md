# Jobs, fournisseurs, droits et coûts

## Contrat par capacité
Décrire entrées, sortie validée, configuration, consentement, politique de données, timeout, erreurs, coût, idempotence et moyens de suivi. Préserver les fournisseurs déjà acceptés. Ne pas changer de modèle/version à partir de mémoire.

## Admission et atomicité
Vérifier côté serveur identité/capabilité, accès, consentement et quota avant travail facturable. Réserver le quota atomiquement avec la création du job ou via un protocole de compensation explicite. Le navigateur, success_url et localStorage ne sont pas une preuve d'achat.

Pour une intégration de paiement effective, utiliser les docs/skills du prestataire concernés et leur version; ce document décrit la frontière, pas une recette SDK. Distinguer paiement, entitlement et quota.

## Cycle de vie
Définir les transitions autorisées et leur atomicité : queued, running, succeeded, failed, cancelled et les états intermédiaires nécessaires. Persister l'identifiant fournisseur pour reprendre sans doubler une facturation après timeout ambigu.

Un timeout local n'est pas une preuve que le fournisseur a annulé. Avant retry, réconcilier l'état lorsque possible. Acquitter les événements après le point de durabilité prévu; dédupliquer les webhooks et valider leur authenticité. Le polling doit avoir cadence, plafond et arrêt.

Fallback uniquement pour les erreurs techniques admises. Une entrée invalide, un refus de sécurité, un défaut de consentement ou d'accès ne déclenche pas un contournement fournisseur.

## Quota et coût
Séparer réservation, consommation et restitution. Traiter double soumission, callback en double, succès tardif après annulation, crash entre facturation et persistance, remboursement éventuel et expiration de réservation. Les règles de restitution doivent venir du contrat produit.

Mesurer coût par résultat exploitable, pas uniquement par appel. Compter retries/fallback, stockage et transfert. Respecter budget par action/utilisateur et global. Pas de retry infini ni recherche autonome sans borne.

## Vérification et opérations
Tests significatifs : concurrence dernière unité de quota, livraison doublée, succès tardif, erreur non retryable, fournisseur indisponible, schéma invalide, suppression et accès croisé interdit. Ajouter des essais live autorisés pour la capacité réelle. Prévoir métriques, alertes, désactivation ciblée et runbook de reprise proportionnés.
