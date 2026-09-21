# Admission technique — vérification du candidat local

Parent : `abff07b`. Périmètre : admission/domain/jobs/runner/verify et tests associés.
Le commit contenant ce rapport identifie le candidat. Logs bruts privés conservés sous
evaluation-private/local-oss-v1/logs ; empreintes dans [log-manifest.json](log-manifest.json).

- Régression rouge initiale : le candidat JavaScript invalide remplaçait l'actif.
- Vérification finale : `npm test`, build inclus, **1074 réussis, 0 échec, 0 ignoré**.
  Tests locaux et exécuteurs injectés ; aucun appel fournisseur natif. La suite inclut
  compilation React réelle, serveur local, export/restauration et refus des résultats tardifs.
- `npm run lint` et `npm run format:check` : réussis sur les fichiers corrigés.
- Reprise : 9 tests média/guide/intégrité ressources réussis avant réalisation.
- Revue indépendante : propositions visant une mauvaise base et protocole du producteur
  historique corrigés ; provenance réservée au vérificateur ajoutée. La nouvelle régression
  de propositions et les tests de déclaration usurpée sont inclus dans la suite finale.

Le premier passage global du candidat avait 1068 succès/5 échecs : deux fixtures
connecteur utilisaient un code invalide comme actif, une attendait zéro contrôle après
probe, l'éditeur comptait un seul reçu et une fixture JS cachée était syntaxiquement
invalide. Les attentes ont été alignées sans retirer les cas négatifs : le probe doit
préserver les contrôles antérieurs et les fixtures de configuration doivent être valides.
Les échecs intermédiaires restent conservés ; ils ne sont pas des succès rétrospectifs.

Limites : voir [ADR 028](../../../ADR-028-candidate-technical-admission.md). Pas de recette
navigateur manuelle sur cette tranche, pas de CI distante, pas de bénéfice comparatif
mesuré. Parcours natif intégré et critères v1 A–H restent ouverts. État : PARTIAL pour B,
DOCUMENTED ONLY pour la frontière v1 globale au-delà des composants existants.

Le smoke du paquet local final a réussi : installation réelle des dépendances React,
compilation stricte, assets Monaco locaux, données conservées, Studio/export/restauration,
installation des trois profils hôtes et liens documentaires du paquet. Aucun agent natif.
Empreinte de l'archive dans le manifeste ; les ajouts de rapport postérieurs sont seulement
documentaires. Le premier échec ETARGET a disparu avec le cache npm isolé : aucun changement
de dépendance n'a été nécessaire. Les liens des rapports historiques vers les sources
hors paquet sont maintenant des références explicites au dépôt. Le contrôle de liens
n'a pas été affaibli. Le smoke d'édition vérifie les deux reçus réellement produits.

La revue indépendante finale des corrections n'a identifié aucun nouveau défaut bloquant
pour cette tranche limitée. Les limites d'ADR028 et les critères v1 restent ouverts.
