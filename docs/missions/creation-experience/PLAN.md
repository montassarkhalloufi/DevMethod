> Mise à jour du 17 septembre : [espace technique, architecture, vérifications et défilement](TECHNICAL-CHECKPOINT.md). Les preuves historiques ci-dessous gardent leur périmètre d’origine.

# Création et évolution visibles — mission du 16 septembre 2026

Statut : implémentation et essais en cours. Aucune supériorité annoncée. La délégation
couvre les choix réversibles, le code local, les tests, les commits et une PR brouillon.
Fusion, déploiement public, publication npm, achat, télémétrie et contact externe exclus.

## Tranche terminée : plan et avancement visibles

Après le chantier méthode `b8724c1`, demande utilisateur du 17 septembre : afficher en direct le plan et le journal d’actions, avec références Bolt comme exemple d’interaction, sans copier leur identité. [Décision technique](../../ADR-020-live-job-progress.md) sous la délégation existante : journal borné par demande et actualisation automatique, agents réellement connectés seulement, aucune relance fournisseur.

Critères : LIVE-1 plan transmis et étapes mis à jour sans rechargement ; LIVE-2 journal repliable avec type, état, date et fichiers de la bonne livraison ; LIVE-3 ancien résultat, attente, interruption et erreur réseau distincts sans faux contrôle réussi ; LIVE-4 reprise persistante, publications idempotentes et tardives refusées ; LIVE-5 focus, saisie, défilement et lisibilité préservés. Tests de contrats, intégration HTTP, composant React et navigateur sur une copie locale identifiée. Une simulation d’événements pour vérifier l’affichage ne vaut pas essai fournisseur natif.

Réalisée et contrôlée : [746 tests, essais navigateur, capture et limites](evidence/progress/RESULTS.md). Le plan et les actions restent distincts des preuves de la révision. Aucun nouvel appel fournisseur.

## Tranche terminée : enseignements réutilisables de Studio

Le 17 septembre, après le bilan utilisateur, autorisation explicite : « je te laisse ce chantier alors go ». Partir de `84e6d41` ; améliorer le kit à partir des défauts et frictions constatés, sans relancer les essais fournisseur clos ni développer de nouveaux connecteurs Studio. La portée est prête sous la délégation existante : règles canoniques proportionnées, vérification UI plus précoce, résultats d’outils actionnables et boucle de correction traçable. Pas de nouvelle architecture ni de modification des références Vercel épinglées.

| Critère | Résultat attendu | Vérification prévue |
| --- | --- | --- |
| METHOD-1 | Résultat et décision utile présentés avant la mécanique ; reprise d’une petite correction sans redemande de délégation | Exercice isolé sur projet fictif, diff et résultat observables |
| METHOD-2 | Contrôle d’une première composition interactive avant réplication ; risques de scroll, superposition et espace utilisable ciblés | Revue des règles contre les défauts observés et exercice de sélection de contrôles ; aucune conformité navigateur déduite d’une lecture |
| METHOD-3 | Contrôle absent/non exécuté/échoué distingué ; correction et recontrôle rattachés aux bons fichiers et révision | Exercice isolé avec vrai contrôle défaillant, journal conservé et nouvelle exécution |
| METHOD-4 | Règles réutilisables distribuées par les installations existantes, références intactes, pas de migration automatique | Validation skills, liens, installation Codex/Claude/Cursor et contrôles du paquet |

Tranche réalisée : [résultats, journaux et limites](evidence/method-feedback/RESULTS.md). Trois exercices hôtes ponctuels, 702 tests du dépôt réussis, installation/doctor/workflow 24/24, lint/format/liens/paquet contrôlés. La validation Python externe est indisponible (PyYAML absent). Ces essais évaluent la distribution et des comportements bornés ; ils ne prouvent ni supériorité comparative ni gain d’effort humain. Les checkpoints précédents restent historiques.

## Tranche précédente : espaces avant réalisation

Reprise du 16 septembre après `23b7a34` : le retour utilisateur montre que la longue vue
Parcours ne rend pas Discovery, Cadrage et Design assez accessibles. Périmètre prêt :
un espace actif à la fois, navigation persistée dans l’URL, résultat/périmètre/exclusions/
critères du cadrage, quatre jalons visuels et ouverture du prototype réellement lié.
Réutiliser la composition bleu nuit/violet et les contrats existants. La conversation,
le brouillon, les décisions et leurs autorisations restent conservés.

Réussite : accès direct à chaque phase après rechargement, navigation clavier/mobile,
distinction direction/master/écrans/prototype, ouverture sans adoption de la version liée,
aucune validation ou génération sur simple navigation. Les demandes préparées restent des
brouillons ; aucun nouvel appel fournisseur. Les sources/observations d’exploration sans
contrat actuel restent explicitement manquantes. Cette tranche n’établit pas l’automatisation
complète du parcours. Vérifications : interactions React, raccord shell, navigateur réel,
qualité et tests du dépôt. Référence : `design-to-code/references/visual-creation.md`.

## Besoin et acquis

La personne veut exprimer une idée, examiner ou déléguer ses choix, essayer le vrai
logiciel, le modifier depuis l’usage puis le reprendre. Les captures Lovable fournies
montrent cette continuité, pas une autorisation de copier son identité ou Deskeo.
La composition du shell et ses validations successives sont conservées dans [STUDIO-DESIGN.md](STUDIO-DESIGN.md). La palette Olive a été rouverte après un défaut de distinction des blocs observé par l’utilisateur ; la référence M bleu nuit/ardoise a ensuite été explicitement validée. La tranche React et ses limites sont suivies dans [REACT-CHECKPOINT.md](REACT-CHECKPOINT.md).

[Capacités existantes et limites](evidence/acquis.md), [Bolt/Lovable/Replit](evidence/builders-a.md),
[v0/Base44/Dyad](evidence/builders-b.md). Ces recherches documentaires ne sont pas des essais
commerciaux. Foundation, Explore, Frame, Design, Architecture et Scoped Delivery existent
déjà. L’écart ciblé est leur exécution accessible et durable autour d’un vrai produit.
Les résultats négatifs du laboratoire, notamment les détections ordinaires équivalentes
avec moins d’exécutions, restent valides pour leurs essais. Le laboratoire reste facultatif.

## Trois conceptions et décision déléguée

| Conception | Personne et parcours | Mécanisme, existant et différence possible | Coût, risque et réfutation |
| --- | --- | --- | --- |
| Compagnon léger dans l’outil existant | Développeur : idée dans son agent, docs concis, fichiers et serveur ordinaires, checkpoint pour reprendre. | Skills et contexte DevMethod actuels, Git, outils hôte. Déjà possible ; améliorer la découverte plutôt qu’inventer des commandes. | Coût faible, effort humain pour relier traces et produit. Si cette option demande autant ou moins d’interventions pour une qualité équivalente, elle doit gagner. |
| Constructeur intégré complet | Créateur sans environnement : composer, choisir, déployer, gérer auth/BDD/intégrations dans une plateforme. | Infrastructure de builder comme les produits étudiés. DevMethod pourrait garder des décisions révisables mais ces fonctions sont déjà largement présentes. | Hébergement, secrets, isolation, coûts permanents et dépendance. Réfuté si le bénéfice vient seulement des services déjà achetables ailleurs. Pas sélectionné sans besoin ou budget démontré. |
| Atelier du produit et de ses évolutions — sélection | Créateur accompagné : intention et délégation, propositions visuelles, vrais fichiers exécutés, demande sur un élément, révision et données persistantes, reprise/export. | L’objet principal devient le produit exécuté et ses évolutions ; documents/procédures deviennent un contexte progressif. Contrat local de tâches, décisions actives/remplacées, snapshots liés aux contrôles, données séparées, adaptateur hôte optionnel. Preview/Git/planification ne sont pas nouveaux. Hypothèse : rendre les conséquences et l’état réel plus faciles à comprendre sans coordinateur humain de documents. | Périmètre initial limité aux apps navigateur statiques avec service JSON local ; pas un IDE universel. Risque de second système documentaire et de fausse confiance. Réfuté si compagnon simple fait aussi bien sur changement/reprise/effort humain. |

La troisième conception remet en cause l’Atelier à variantes d’un modèle comportemental
fermé : elle accepte le véritable code HTML/CSS/JS du produit. Ce choix d’ingénierie n’est
pas une rupture démontrée. L’option simple reste un contrôle sérieux.

## Modes et philosophie

Le dépôt stable définissait guidé/autonome. La distinction à trois modes a ensuite été explicitement acceptée dans la conversation :

- Guidé : discuter et valider les choix structurants ; examiner la version avant activation.
- DevAuto : valider le cadrage/design/architecture, puis déléguer la réalisation des tranches.
- Autonome : déléguer aussi les choix réversibles dans le périmètre, avec mêmes exigences de preuves.

Le nom historique interne `delegated` représente Autonome. Aucun mode ne donne des permissions
externes supplémentaires. Le mode reste modifiable et repris. Les limites d’un agent restent
visibles. Un bouton de mode sans différence effective d’exécution ne satisferait pas la mission.

## Expérience fixée avant exécution

Cas fictif opérateur « Les Ateliers » : proposer activités/date/lieu/capacité, filtrer,
inscrire, annuler. Puis ajouter une liste d’attente sans supprimer les inscriptions.
Les [références visuelles](DESIGN.md) sont produites avant construction de l’app.

Réussite technique exigée : demande persistante réellement consommée ; fichiers réels
prévisualisés ; au moins inscription/filtre/annulation ; données après redémarrage du serveur ;
conflit récupérable sans perte de saisie ; demande et référence reprises ; vérifications liées
à chaque version ; export lisible et relançable ; aucun succès affiché sur simple échec agent.
Qualité visuelle : comparaison navigateur au master, responsive, zones d’action lisibles.
Une inspection agent n’est pas validation utilisateur ni contrôle indépendant d’évaluation.

Bornes : au plus deux appels natifs de construction pour ce nouvel essai produit (création,
puis changement), 300 s chacun, arrêt entre appels à 100 000 tokens nouveaux connus. Le plafond
est prospectif et non une garantie financière. Prix inconnu affiché. Aucun appel après usage
inconnu ou interruption ; pas de relance automatique. Les campagnes comparatives historiques
restent closes ; leurs 101 046 tokens connus et usages manquants ne sont ni effacés ni assimilés
à un budget neuf. Ce nouvel essai vérifie un adaptateur produit, pas un nouveau classement BMAD.
Tests hors fournisseur et worker de revue n’appellent pas le modèle produit.

Un cas différent inédit après gel vérifiera le contrat hors des Ateliers. A/B/C : pas de
classement sans mêmes données, hôte, modèle, budgets et contrôles indépendants. Aucune personne
simulée ne compte comme utilisateur. Temps opérateur réel et coût monétaire ne seront pas inventés.

## Architecture proportionnée

Node 22+, modules natifs, origines HTTP locales séparées pour l’outil, le produit et, depuis la demande d’édition manuelle, le brouillon exécutable. Le navigateur ne lance aucune commande shell arbitraire. L’agent optionnel Codex
s’exécute dans un staging dédié, sandbox workspace-write, sans réseau ni sous-agents ; sa
réponse ne devient une révision qu’après validation. Les sorties tardives/obsolètes sont
rejetées. Le code, les décisions et les contrôles sont séparés des données métier : revenir
au code antérieur ne restaure pas la base. Une migration incompatible exige une vérification
spécifique. Le registre atomique a un seul écrivain, versions optimistes et verrou conservateur.
L’export exclut token de contrôle, credentials globaux, journaux fournisseur et répertoires hôte.

La portabilité du contrat et des fichiers ne prouve pas la portabilité d’exécution des agents.
Seul l’adaptateur réellement essayé sera annoncé comme essayé. La génération d’images est une
capacité de l’hôte de cette mission, pas un service fourni automatiquement par le CLI Studio.

## Recadrage visuel « gg » — suite autorisée de la tranche

Le retour utilisateur précise la hiérarchie de l’existant, sans changement de méthode ni de
contrat métier : responsabilités distinctes des accords, couleurs sémantiques, commandes
regroupées, preuves de la version affichée, comparaison manifestement non modifiable.
La sélection locale d’un scénario n’altère ni la décision ni les inscriptions. La réalisation
comprend la correction des défilements et l’alignement des réglages lors du redimensionnement.
Critères : pas de débordement aux tailles testées, accès à la saisie, navigation clavier,
aucun contrôle attribué à une autre version, comparaison bloquant réellement l’écriture,
export incluant son garde. Vérification agent et captures ne valent pas validation humaine.
Budget fournisseur inchangé et clos ; cette correction utilise uniquement l’ingénierie hôte.
