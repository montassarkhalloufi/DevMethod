# Contrats HTTP, retries et idempotence

Documenter avant de coder une nouvelle opération distante :
- méthode, chemin, identité/autorisation, entrées validées et tailles;
- succès observable, ressource créée ou état de job réel;
- erreurs stables, limites, request ID et détails sûrs;
- empreinte de requête normalisée, paramètres influençant le calcul;
- portée de clé par identité/capabilité, durée, capacité et atomicité;
- comportement même clé/même entrée, même clé/entrée différente;
- traitement d'une déconnexion, timeout ambigu, crash et reprise;
- garantie dans un processus vs plusieurs, après redémarrage et après expiration;
- données gardées pour rejeu, suppression et sauvegardes.

Utiliser les sémantiques HTTP appropriées : 200 pour un succès synchrone retourné; 201 pour création selon le contrat et localisation quand pertinente; 202 implique travail accepté encore incomplet avec le contrat de suivi nécessaire. Préserver les choix existants. Ne pas transformer un timeout navigateur en certitude d'annulation distante.

Les erreurs peuvent suivre Problem Details si retenu. Les headers locaux d'un prototype ne constituent pas une authentification. Limiter et ordonner les collections lorsqu'elles existent, sans créer une pagination inutile.

Avant retry d'un appel payant, déterminer si son résultat/facturation est inconnu, si le fournisseur déduplique et si une reprise d'état est possible. Une clé seule ne garantit ni exécution unique ni gratuité du retry. Si le calcul a réussi mais sa persistance échoue, une reprise peut réutiliser le résultat uniquement dans les limites documentées.

Mettre à jour schémas publics, documentation, génération OpenAPI si existante, tests et stratégie de compatibilité ensemble. Un schéma généré sans dérive ne prouve pas la correspondance de tous les comportements HTTP : vérifier également statuts, headers, erreurs et contraintes observables.

Références normatives à consulter pour la question précise : [HTTP semantics](https://www.rfc-editor.org/rfc/rfc9110.html) et [Problem Details](https://www.rfc-editor.org/rfc/rfc9457.html). Définir les seuils, délais et champs depuis le contrat du projet, sans reprendre ceux d'un exemple comme défaut universel.
