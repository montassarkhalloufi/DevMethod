# Adoption après examen — 21 septembre 2026

Tranche locale de [la mission](../PLAN.md), contrat [ADR 032](../../../ADR-032-reviewed-local-adoption.md).
Essai contrôlé par l’agent ; aucune intervention humaine réelle ni recette native supplémentaire.

## Résultat

Dans l’historique, « Utiliser cette version » ouvre un examen de la version exacte. La raison
est obligatoire. Le serveur relit admission, intégrité, preuves, critères, délégation, état
agent et connexions, puis compare l’empreinte et la version de l’état avant adoption.
Un contexte périmé refuse l’écriture et conserve la saisie. Actualiser n’approuve rien.
La décision conserve motifs, risque, inconnues et preuves avec leur provenance/fraîcheur ;
ce résumé se consulte ensuite dans Décisions et voyage dans l’export.

## Parcours réellement observé

Même projet de fixture que [les signaux runtime](RUNTIME-SIGNALS.md), deux candidats contrôlés.
Le nouveau candidat est produit par le harnais local, pas par un fournisseur :
`6b872168-d321-4dfa-b7fc-c93341ec0a35`, job `2824c5e1-3e36-4ad5-9c16-ac10c62981da`.

1. Ouverture réelle du dialogue depuis Historique : aucune adoption immédiate.
2. Saisie d’une raison identifiant explicitement l’essai de l’agent et l’absence de validation humaine.
3. Second onglet : saisie et enregistrement d’un brouillon, sans envoi à l’agent.
4. Confirmation du premier examen : refus pour contexte changé, raison conservée, bouton désactivé.
5. Actualisation : raison conservée, aucune adoption automatique. Inconnues inspectées.
6. Nouveau clic explicite : candidat appliqué, brouillon concurrent conservé, deux jobs inchangés,
   agent toujours arrêté. L’interface et le stockage concordent.
7. Décisions : résumé de l’examen ouvert et inspecté, motif `agent-unavailable`, inconnues sur
   données persistantes et contrats, preuve technique conservée sans réussite métier déduite.

Décision enregistrée : `34784d83-b7ee-46ea-a27f-df7a0d81123f`, état version 11, relevé à
12:03 UTC. Le champ serveur `source:user` identifie la route du navigateur : **ce clic CUA
est celui de l’agent de recette, pas une preuve de participation humaine**.
Relevé privé : `activation-review-replay.json` dans les données ignorées de mission.

Rendu inspecté sur bureau puis en 390 × 844 : texte et actions accessibles, défilement vertical
et focus clavier fonctionnels, largeur intérieure et largeur de contenu égales à 350 px.
La taille temporaire du navigateur est rétablie. Une collision de styles avec le dialogue des
connecteurs a été corrigée après observation ; les liens du graphe ont des identités propres
au dialogue pour éviter des cibles dans le panneau d’arrière-plan.

## Vérification et limites

57 tests de raccordement passent, puis build et **1231 tests globaux** réussis. Lint et format
globaux réussis. Revue indépendante ciblée : aucun nouveau défaut bloquant confirmé ; une
fixture de test incomplète a été corrigée avant la suite globale. Logs privés
`adoption-connected.log`, `adoption-full-tests.log`, `adoption-lint-final.log`, `adoption-format.log`.
Les tests incluent preuve qualité modifiée hors compteur principal, sources altérées, décision
périmée, worker refusé, résultat tardif, export/restauration et arrêt fournisseur conservé.
Inspection du paquet : aucun fichier privé de campagne ou de fixture inclus. Smoke réussi sur
l’archive effectivement créée et installée avec ses dépendances : Studio, compilation React,
éditeur, persistance, export/restauration et CLI. Logs `adoption-pack.json` et
`adoption-package-smoke-final.log` ; ces contrôles ne sont pas une exécution d’agent natif.

Le parcours d’application depuis l’éditeur a ensuite été raccordé à cet examen en `3af6a8b` ;
son essai réel est décrit dans [la recette navigateur](BROWSER-VERIFICATION.md). Les interventions
ne disposent pas encore d’une résolution générale ni de mesures de concentration. Les preuves
métier exécutées par le Studio, la vraie participation humaine, le site React et le film
restent à livrer. Aucun appel fournisseur, aucun push, merge ou publication pendant cette tranche.
