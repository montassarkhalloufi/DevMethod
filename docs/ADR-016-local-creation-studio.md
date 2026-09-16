# ADR 016 — Un atelier local pour le produit exécuté et ses évolutions

Date : 2026-09-16. Statut : accepté pour cette tranche expérimentale sous délégation explicite
des choix réversibles. Ne remplace pas encore l’ensemble du parcours DevMethod stable.

## Problème et alternatives

Foundation, Explore, Frame, Design, Architecture et Scoped Delivery décrivent déjà les
fonctions utiles. Leur articulation reste difficile à voir lorsque l’utilisateur doit
relier seul documents, consignes, code, serveur et résultats. Les builders étudiés possèdent
déjà conversation, preview, édition et checkpoints : ces fonctions ne sont pas nouvelles.

La [mission](missions/creation-experience/PLAN.md) examine trois architectures produit :
compagnon léger dans l’outil actuel ; plateforme complète avec infrastructure et services ;
atelier centré sur une application réellement exécutée et ses évolutions. Retenir la troisième
pour un essai local proportionné. L’option simple reste le contrôle à battre ; reconstruire
un IDE, un hébergeur et une infrastructure d’agents n’est pas justifié par cet essai.

## Décision

Accepter des fichiers HTML/CSS/JavaScript réels et un service JSON local, plutôt que borner
le produit aux états et transitions de l’ancien Atelier. Des serveurs sur loopback séparent
l’interface de contrôle, le produit actif et l’aperçu du brouillon de code. Le navigateur exprime des intentions et des demandes ;
il ne soumet aucune commande shell arbitraire.

Un registre atomique versionné conserve intention, cadrage, décisions actives/remplacées,
références, tâches, versions et contrôles. Un seul écrivain et des versions optimistes
refusent les écrasements concurrents. Chaque résultat de code possède un manifest calculé
par le serveur ; les contrôles restent liés à cette révision. Une version disponible ou
active ne reçoit pas implicitement une preuve de correction.

Le choix de mode règle deux décisions observables :

- **Guidé** : validation du cadrage et des choix structurants, puis activation explicite du code.
- **DevAuto** : même validation structurelle ; réalisation et activation des tranches déléguées.
- **Autonome** (`delegated`) : les choix réversibles sont également délégués, dans les mêmes limites.

Ces valeurs sont des règles par défaut. Le champ facultatif `project.delegation` précise les
responsabilités `structure`, `visual` et `adoption`, chacune confiée à l’agent ou à l’utilisateur.
La politique explicite prime sur le nom du mode. Son absence préserve les projets existants :
structure déléguée seulement en Autonome, adoption déléguée sauf en Guidé, aucun accord visuel
indépendant exigé. Un ancien client qui omet ce champ ne supprime pas la politique enregistrée.

Quand `visual: 'user'`, le serveur exige un design sélectionné existant et une décision active
`visual-approval`, de source utilisateur, portant sur cet identifiant. Choisir explicitement
la proposition crée cette décision. L’accord de cadrage ne contourne pas cette exigence,
même en Autonome ; `structure: 'agent'` évite en revanche des questions structurelles déjà
déléguées en Guidé. L’état distingue une frontière satisfaite par délégation d’un accord
effectivement enregistré. Ce registre décrit les actions ; il n’authentifie pas à lui seul
l’identité humaine de leur auteur.

L’accord porte sur une empreinte canonique de l’intention, des contraintes, du cadrage, du
design sélectionné et de l’architecture. Un changement structurel invalide cet accord. Le
contrôle est appliqué avant et après la proposition reçue : modifier le plan pendant une
livraison de code ne permet pas de contourner l’approbation. Le contexte enregistré lors de
la prise en charge empêche aussi d’adopter un résultat devenu obsolète pendant son exécution.

Séparer le **contrat de tâche** de son **exécuteur**. Un agent hôte peut consommer le bridge
CLI/HTTP ; un adaptateur facultatif lance réellement le CLI Codex existant. Il reçoit des
références locales, un contexte et des instructions issues des skills distribués. Le runner
n’apporte pas les capacités absentes de son hôte : pas de navigateur intégré, recherche web,
génération d’images, auth, hébergement ou intégrations dans cette tranche.

Garder les données métier hors des snapshots de code. Revenir à une version ne restaure pas
la base. Les migrations incompatibles doivent être éprouvées spécifiquement. Un export
USTAR embarque le code déclaré, les données, les références, les décisions et un runtime
relançable sans DevMethod. Il conserve un compteur d’admission assaini, sans token de
contrôle, journaux ni accès fournisseur, pour éviter de réinitialiser silencieusement un arrêt.

La commande `example` reconstruit un exemple enregistré par ce même chemin export/restauration.
Elle rend le parcours local essayable sans appel modèle et conserve les échecs et la
consommation historiques. Ce mécanisme de reproduction n’est ni un générateur spécialisé
Les Ateliers ni une nouvelle preuve de génération. La lecture du code et son diff portent
sur les fichiers déclarés et vérifiés des révisions, sans accès arbitraire au workspace.
L’édition ajoute un brouillon durable soumis à une version optimiste, distinct des révisions
adoptées. Un build vérifie JS/JSON sans exécution applicative serveur puis expose les fichiers
sur une troisième origine avec une copie des données métier. Les builds suivants gardent
ces données d’essai. Une erreur conserve le dernier bon aperçu ; les diagnostics heuristiques
restent identifiés. L’adoption transfère le build exact, conserve les données du produit et
crée une preuve statique propre à la nouvelle révision. L’export du projet porte sur les
révisions adoptées ; le brouillon non adopté dispose d’une récupération JSON séparée.

Ce choix donne un retour direct sur du HTML/CSS/JavaScript local sans reconstruire un IDE
complet. Il ne fournit ni bundler, compilation TypeScript, validation CSS, ni tests métier.
Les 21 tests ciblés de cette tranche (11 backend, 10 UI) vérifient des mécanismes et des cas
d’erreur. Le [parcours navigateur enregistré](missions/creation-experience/evidence/studio/editor-journey.json)
a aussi exercé erreurs statique et runtime, récupération, isolation des données et adoption
de la révision `1aea70fe-1134-4dfa-a872-a79e3003b6aa`. Seul son pied de page HTML a changé ;
son nouveau contrôle est statique, sans reprise des anciennes preuves fonctionnelles.

Cet essai a découvert un faux succès de `node --check FILE` sur un `.js` ESM invalide. Le
vérificateur utilise désormais les octets exacts sur stdin, avec le mode module pour `.js`/`.mjs`
et commonjs pour `.cjs`. Un changement de protocole invalide l'adoptabilité des anciens builds
sans effacer le brouillon. Le même code invalide a été refusé après redémarrage réel. Ce
résultat négatif justifie le contrôle explicite ; la syntaxe valide ne prouve toujours pas
la réussite de l'application ni la qualité visuelle.

## Enseignement de l’usage de DevMethod sur lui-même

Le « dogfooding » a révélé une frontière mal représentée : le propriétaire déléguait produit
et technique même en Guidé, mais réservait les propositions visuelles avant l’interface.
Le comportement initial liait ces décisions au mode global. La politique par responsabilité
permet désormais de continuer les travaux délégués sans fabriquer un accord visuel.

La composition B (conversation à gauche, application à droite) a été retenue, puis son
esthétique rouverte. C/D ont été rejetées ; E/F ont exploré des gradients, G/H une direction
artistique. L’utilisateur a ensuite explicitement validé **K Olive**, avec résultat visible,
« Qui décide ? », choix révisables et preuves liées à la version, puis exigé la fidélité à K.
Après essai, l’utilisateur a rejeté l’esthétique olive comme « camouflage ». Les fonctions et
la composition retenues restent des acquis ; la palette est rouverte. La proposition L bleu
nuit / indigo attend le choix humain. La revue visuelle indépendante relève cinq écarts de
hiérarchie et d’usage : une vérification technique réussie ne suffit pas à justifier le rendu.
Les travaux indépendants de cette palette continuent. Aucun choix de shell ne redéfinit le
design des applications créées.

La distinction apprise reste valable : accepter une composition ne valide pas toute son
esthétique ; rouvrir un aspect préserve les décisions non remises en cause et les travaux
indépendants. Une fois le choix explicite obtenu, poursuivre le travail dépendant sans
redemander le même accord. Le runtime ne déduit pas une réouverture du texte de conversation ;
l’agent hôte doit réconcilier le contexte. Cette limite reste distincte du contrôle de
réception implémenté et testé.

## Limites observées et décision de poursuite

L’adaptateur Codex a été essayé une fois : 277 934 tokens rapportés, prix monétaire inconnu.
Le seuil prospectif de 100 000 tokens était contrôlé entre appels ; il n’a pas limité cet
appel. Aucun second appel natif n’a été lancé. Corrections et évolution ont ensuite utilisé
l’agent de mission par le même bridge. L’accès à un modèle ne prouve donc ni un coût borné par
appel ni une expérience entièrement autonome aboutie.

Le code généré initialement confondait stockage initial `{}` et données incompatibles ; un
contrôle navigateur a révélé ce défaut malgré des tests initiaux réussis. Conserver ce résultat
négatif. Les contrôles de syntaxe, revues d’agents et essais DOM ne remplacent pas une
évaluation indépendante ni une validation humaine.

L’hypothèse de valeur est une réduction de l’effort humain pour comprendre les conséquences,
corriger et reprendre. Elle reste à mesurer sur des cas nouveaux, face au même agent avec
une bonne consigne et des outils ordinaires, puis au DevMethod stable. Si le compagnon léger
obtient une qualité et une reprise équivalentes avec moins d’effort, le préférer. Si le
bénéfice dépend principalement de services absents, réexaminer l’architecture choisie.
Aucune supériorité sur les builders, BMAD ou Spec Kit, ni aucune rupture, n’est démontrée.

Le laboratoire de preuves et ses résultats négatifs antérieurs restent conservés et
facultatifs. Cette décision ne les transforme pas en composant obligatoire.

Détails exécutables : [guide Studio](STUDIO.md), [contrat](missions/creation-experience/CONTRACT.md).
