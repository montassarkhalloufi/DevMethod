# DevMethod v1 locale — continuation

Autorité : demande de continuation du 21 septembre 2026 ; choix OSS local complet,
technique réversible déléguée, direction visuelle existante préservée. Pas de merge,
publication, achat ou déploiement autorisé. Mission durable active, sans budget de
jetons inventé. Source détaillée privée : paquet de reprise `v1-continuation-2026-09-21`.

Sources canoniques : [mission Studio](../creation-experience/PLAN.md),
[contrat](../creation-experience/CONTRACT.md),
[intégration méthode](../../METHOD-INTEGRATION-2026-09-18.md),
[frontière OSS](../../ADR-027-local-open-source-boundary.md).
Les preuves historiques gardent leur révision ; elles ne certifient pas ce candidat.

## Tranches et critères de sortie

1. Reprise fidèle : empreintes, source avancée, patch et archives vérifiés, PR39
   réconciliée, données privées ignorées. Base `abff07b` ; [reprise vérifiée](evidence/RECOVERY.md).
2. Parcours agent intégré (A–B) : disponibilité/configuration depuis Studio, lancement
   réel, progression, décision, candidat contrôlé avant activation, échecs et correction
   bornée, refus des résultats obsolètes, interruption/reprise conservant le travail.
3. Contrôle opérationnel (C–F) : liens preuve/critère/révision/job/exécution, fraîcheur
   sélective, risque déterministe explicable, interventions regroupées liées à leur portée,
   autonomie effective bornée par délégation. Les quatre influencent exécution et UI.
4. Outils et runtime (G) : vérification/navigateur puis connecteur représentatif autorisé,
   broker exact allow/ask/deny conservé ; observations runtime liées à leur version.
5. Recette native distincte : application avec données persistantes, évolution, défaut
   observé et correction, péremption, risque, intervention, interruption/reprise,
   export/restauration et exécution indépendante. Cas négatifs explicitement identifiés.
   Protocole et bornes à fixer avant appels. Les campagnes précédentes restent closes.
6. Site et film (H) : copie isolée, voix Kokoro af_heart déjà approuvée, vrais enregistrements
   du Studio, sous-titres/provenance, nouvelle révision testée desktop/mobile/lecture,
   export restauré. Aucune publication ; acceptation du film à distinguer de son rendu.
7. Candidat intégrable : revue indépendante, build/dist, lint/format/tests pertinents,
   paquet/smoke, navigateur et CI ; bilan IMPLEMENTED/PARTIAL/EXPERIMENTAL/
   DOCUMENTED ONLY/NOT FOUND et distinction local/PR/mergé/publié.

## État et prochaine action

La reprise, les contrôles techniques, la configuration native et une première boucle bornée
sont intégrés localement. Une recette React a réellement été lancée depuis Studio ; timeout
et consommation inconnue conservés, puis reprise locale sans fournisseur, données persistantes
et conflit observés. Voir [état de continuation](REPRISE.md) et
[preuve native](evidence/NATIVE-INVENTORY.md). Les quatre moteurs restent partiels ;
preuves métier/outils/runtime, intervention humaine et site/film restent à terminer.
Le site dispose désormais d’un candidat React livré par l’agent lancé depuis Studio,
avec contrôle natif corrigé puis réussi. La fidélité des guides nécessite encore une
correction et le seuil d’admission atteint suspend les appels suivants ; voir la
[preuve du portage site](evidence/NATIVE-SITE.md). Le film anglais reste à monter.
Le défaut de parcours bloquant une correction depuis un candidat non actif est
corrigé localement et vérifié sur fixtures : [preuve](evidence/CANDIDATE-REQUEST.md).
L’export du candidat site et son runtime indépendant sont vérifiés ; la réponse
sur le prochain appel et la permission macOS pour filmer restent attendues.
Les mesures de gains humains, coût, temps et qualité restent à recueillir.
La vue de concentration des observations du critère E est réalisée localement :
[comptes, liens, limites et recette](evidence/ATTENTION-CONCENTRATION.md).
Elle conserve les arrêts visibles et n’ajoute aucune décision ni exécution.
Le [bilan de maturité par critère](evidence/MATURITY.md) distingue les capacités
locales implémentées de la recette complète encore partielle, les instruments
expérimentaux et les preuves non trouvées. Le dossier d’intégration est préparé
sur une branche de revue issue de main, avec l’arbre public contrôlé ; l’historique
local original est conservé sans exposer les anciennes preuves personnelles.

## Précision stack — 21 septembre 2026

La recette native v1 doit créer un vrai projet React/TypeScript strict et vérifier build,
export/restauration des sources et règles React/Vercel applicables. Le choix de stack doit
être visible/persisté, transmis à l'agent puis confronté aux artefacts reçus : aucun repli
silencieux React vers HTML. Les autres stacks et imports restent supportés.

Pour le site, les trois révisions historiques sont HTML/CSS/JS. La demande enregistrée
comportait « Use a lightweight static HTML/CSS/JavaScript implementation for easy hosting »
et la décision architecture est de source agent. Cela ne prouve pas un choix utilisateur.
L'attente React remontée constitue une divergence à traiter explicitement ; elle n'autorise
pas à elle seule une migration générale immédiate. Préparer une correction ciblée avec ses
conséquences sur le film, les sources et l'export.

## Précision accès agent — 21 septembre 2026

Réutiliser l'installation Codex et son accès existant. Le contrôle lecture seule transmis
par la tâche source, exécuté avec `codexEnvironment()`, rapporte `codex login status` en
connexion ChatGPT, code 0, sans lecture de credentials. Le runner conserve HOME/CODEX_HOME
et n'injecte pas de clé API. La sonde locale v1 doit vérifier les commandes supportées et
exposer disponibilité, connexion, type d'accès ChatGPT/API/inconnu, limites et erreurs.
Ne pas exiger une clé API lorsque ChatGPT suffit, ne pas promettre de quota supplémentaire,
ne pas basculer silencieusement vers une API facturée. Pas de coffre SaaS ni achat autorisé.
Secrets exclus de l'UI, des journaux et exports. Cette observation transmise sera confirmée
par la future sonde ; elle ne prouve pas encore l'exécution native du parcours Studio.

## Portage du site explicitement autorisé — précision utilisateur

Après disponibilité du parcours intégré, le job natif piloté depuis Studio portera le site
existant vers React/TypeScript strict. Référence initiale : révision
`5554190a-1048-43c9-b0b5-bdff378e7d05` de l'export privé devmethod-site-en.tar ; vérifier
l'existence d'une référence utilisateur plus récente avant de figer la baseline.
Conserver la sortie observable : anglais/textes, structure/navigation, palette, typographie,
espacements, responsive, interactions, documentation, liens et assets. Pas de redesign.
Copie isolée, historique et original conservés ; aucune publication/modification de domaine.
Le film af_heart reste une évolution distincte, avec présentation du lecteur conservée.
Comparer avant/après aux mêmes viewports et parcours, inspecter réellement les captures,
revue React/Vercel, build strict et export/restauration. Lier à la nouvelle révision.
Le code doit provenir du job intégré, sans réimport externe présenté comme génération native.

## Dogfooding et retours réutilisables

La recette du site suit réellement Studio et son agent : besoin/choix, demande, plan,
travail visible, contrôles, correction, activation, export/reprise. Les outils sont appelés
et suivis dans ce parcours avec leurs permissions. Aucun assemblage externe réimporté
ne compte comme réussite native. Exercer tôt une tranche complète dans le navigateur.
Conserver chaque défaut significatif avec job/révision/scénario, attendu/observé,
diagnostic, correction bornée et nouvelle observation sur le parcours concerné.
Priorité : création/reprise, données, permissions/preuves et fidélité au résultat.

Réparer le code Studio dans le worktree de développement reste autorisé pour le bootstrap
ou un défaut : identifier cette intervention, conserver le contexte et reprendre le même
scénario dans Studio. Ce n'est pas une preuve d'autoréparation. Une étape absente doit être
implémentée ou rester une limite bloquante ; pas de transfert discret au travail hôte.

Dans le diagnostic existant, distinguer cause confirmée et hypothèse, puis application,
Studio/moteur/outillage, règle manquante/contradictoire ou règle présente mal transmise ou
appliquée. Corriger les propriétaires concernés. Une leçon réutilisable revient à la règle
canonique et à ses contrôles après évaluation ; pas de nouvelle procédure par bug.
Le site React attendu demande notamment décision de stack conservée et contrôle du profil.
Un changement de consigne seul ne démontre pas la correction.

## Boucle et harness intégrés

La recette doit montrer demande Studio → agent configuré/lancé → candidat lié à sa révision
→ vérifications applicables → diagnostic/correction autorisée → nouvelle vérification →
acceptation ou arrêt/escalade. Fin du processus, syntaxe valide et déclaration agent ne
valent pas réussite des critères utilisateur. Conserver tentatives, preuves et limites ;
traiter résultats tardifs, répétition, absence de progrès, inconnus et reprise sans réinitialiser
budget ni permissions. Une boucle interne Codex ne prouve pas la supervision DevMethod.

Réutiliser `inspectLoop` (inspection pure d'historique), `runGuard` (parcours invoqué avec
état), les jobs/runner Studio et les reçus utiles. Le harness expérimental `runEvidence`
ne sera pas rendu obligatoire ni présenté comme déjà intégré. Les négatifs contrôlés
restent des fixtures explicites, pas des pannes fabriquées dans le site utilisateur.

## Studio bilingue et film anglais — demande utilisateur du 21 septembre

L’utilisateur demande l’anglais dans Studio, avec choix FR/EN ou une traduction anglaise,
et impose la cohérence avec le site et la vidéo : les captures de Studio du nouveau film
doivent elles aussi être en anglais. Réalisation retenue dans la délégation technique :
sélecteur FR/EN, anglais par défaut, préférence conservée entre accueil et projets locaux.
Le changement de langue ne doit perdre aucune saisie ni modifier les sources, les décisions,
l’historique ou les données utilisateur. La langue des contenus existants reste leur langue
originale ; les nouvelles démonstrations et narrations du film seront préparées en anglais.

Cette tranche précède les nouveaux enregistrements du film. Traduire les commandes, libellés,
aides, états, erreurs UI et noms accessibles des surfaces React et du shell JavaScript ;
respecter la direction visuelle. Vérifier bascule en cours de saisie, persistance, navigation
accueil/projet, stockage indisponible et absence d’écritures métier. Les captures historiques
françaises restent des preuves datées mais ne peuvent servir de nouveaux plans de ce film.
Aucune autorisation de reprise fournisseur ne découle de ce changement de langue.
