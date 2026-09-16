# ADR 019 — Décisions en attente et parcours design explicite

Date : 2026-09-16. Statut : accepté pour cette tranche sous demande utilisateur explicite.
Complète [ADR 016](ADR-016-local-creation-studio.md), [ADR 017](ADR-017-typed-react-studio.md)
et [ADR 018](ADR-018-required-versioned-react-guidance.md).

## Besoin et choix

Le recadrage demande de voir les phases utiles de DevMethod, le choix actuellement attendu,
ses conséquences et un aperçu comparable, plutôt qu’un historique de tâches tenant lieu de
guidage. La référence N précise la hiérarchie du shell ; elle ne redessine pas implicitement
l’application. Voir le [contrat visuel](missions/creation-experience/design/DECISION-LAYOUT.md).
La personne conserve les validations qu’elle s’est réservées, en particulier les interfaces
avant leur réalisation. L’exposition du backend doit distinguer un service réel d’une déclaration.

Conserver seulement les décisions textuelles serait plus simple, mais ne permettrait pas de
relier sans ambiguïté sélection, validation et aperçu à leurs versions. Un moteur générique de
workflow ajouterait des transitions et migrations sans besoin démontré. Retenir deux extensions
facultatives de l’état existant : `proposals` et `designJourney`, avec règles de domaine pures,
écritures versionnées et historique conservé. Les anciens projets sans ces champs restent valides.

## Contrats et autorité

Une proposition contient une question, des options, leurs conséquences, une recommandation
facultative et une étape `implementation` ou `visual`. Elle conserve la version de départ et
l’empreinte du contexte. Un aperçu désigne une révision réelle ou une référence image ; une image
est toujours une simulation. Les contrôles affichés sont ceux de la révision exacte, jamais
transférés d’une image, d’une option ou d’une version précédente.

Sélectionner n’approuve rien. Approuver conserve la décision, sa source, sa raison et la cible
exacte de l’aperçu ; appliquer une version reste une autre opération. Une approbation de réalisation
peut préparer une nouvelle demande ; une validation visuelle ne simule pas sa réalisation.
Un contexte devenu ancien refuse sélection et approbation avec conflit, sans effacer la proposition.
Les propositions résolues sont immuables ; une autre proposition peut les remplacer explicitement.

Le parcours design distingue trois directions pertinentes, le master détaillé de la direction
choisie, ses écrans/états dérivés et un prototype lié à une vraie révision. Ce parcours accompagne
un nouveau design ou une réouverture explicite ; il ne force pas trois images pour chaque correction.
Une capacité d’image absente reste une limite, pas une référence inventée. Masters et dérivés sont
conservés avec leurs liens. La présence d’une image ou d’un design sélectionné n’approuve aucun master.

Quand `designJourney` existe, le master courant doit correspondre à la direction sélectionnée et
être explicitement approuvé avant le code. Avec `visual:user`, seul `approvedBy:user` satisfait
le verrou ; avec `visual:agent`, un accord explicite de l’agent ou de la personne est requis.
Les écrans/prototypes exigent également cet accord. L’API expose la cause du blocage par
`approval.visualBlock`, sans redemander une direction déjà choisie. Sans parcours, le contrat
visuel antérieur demeure compatible. Un accord de master ne vaut ni adoption, ni preuve de qualité.

Le transport impose l’acteur ; les payloads ne choisissent pas leur propre autorité. Les routes
d’accord humain et de modification de politique (`/api/project`) refusent le jeton worker.
Les routes worker `/api/design/master/delegate-approval` et `/api/proposals/delegate-approval`
forcent l’acteur agent, exigent la version courante et vérifient la délégation effective.
La seconde prépare une demande seulement pour une proposition de réalisation, en conservant
le brouillon non envoyé. Le registre local n’authentifie pas
à lui seul l’identité physique de la personne devant le navigateur.

L’approbation d’une proposition structurelle renouvelle le cadrage seulement si la personne
approuve cette modification précise, que le contexte est resté identique et que le plan était
déjà approuvé. Aucun cadrage incomplet ou accord visuel manquant n’est approuvé par effet de bord.
Les mutations du parcours changent le contexte d’un job : un résultat fondé sur l’ancien contexte
est conservé mais refusé à l’adoption. L’hôte réconcilie ces étapes entre deux jobs.

## Frontières et vérification

| Scénario | Invariant et frontière faisant autorité | Vérification pertinente |
|---|---|---|
| Un master arrive après le choix de direction | `domain.planApprovalStatus` et validation avant/après livraison exigent l’accord exact | Régression : refus de `finishJob` sans mutation, puis réussite après accord |
| L’agent prétend un accord humain | Acteur imposé par route, métadonnées de completion validées, approbation réservée refusée | Tests domaine et HTTP sur les deux rôles |
| Le projet évolue pendant un choix/job | Base/empreinte de proposition, contexte du job et commit versionné refusent l’ancien résultat | Conflit sans suppression du brouillon/historique |
| Une comparaison semble « vérifiée » | `proposalComparison` filtre les contrôles par identifiant de révision | Contrôle d’une autre version absent de l’option |

Les sources canoniques sont [domain.mjs](../scripts/studio/domain.mjs),
[proposals.mjs](../scripts/studio/proposals.mjs),
[design-journey.mjs](../scripts/studio/design-journey.mjs), le
[store](../scripts/studio/store.mjs) et les tests du contrat
(`tests/studio-proposals.test.mjs`, dans le dépôt).
Les garanties de persistance restent celles du registre local ; aucune transaction distribuée
ou isolation multi-instance n’est introduite. Les comptes et résultats globaux sont consignés
dans le [checkpoint](missions/creation-experience/REFRAME-CHECKPOINT.md), pas figés dans cet ADR.

Les [services exposés](STUDIO-SERVICES.md) sont le stockage JSON embarqué et ses vraies sources.
L’origine de comparaison est distincte de l’application et du brouillon : elle lit les données
courantes et refuse les mutations. Ce n’est ni un snapshot des données ni un processus isolé.
Un backend personnalisé déclaré reste non exécuté et non connecté. Les sondes ne prouvent ni
les règles métier ni une écriture. Le budget natif clos reste clos. La fidélité à N, l’accessibilité
effective et la compréhension du guidage nécessitent leurs observations propres ; cet ADR,
un rendu DOM et des tests verts ne les démontrent pas.
