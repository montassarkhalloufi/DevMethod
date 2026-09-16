# DevMethod — capacités créatrices voisines, 16 septembre 2026

**Conclusion de recherche : un nouveau DevMethod limité à un chat, un canvas, des agents spécialisés, une mémoire projet et un passage plan → code serait déjà redondant.** Même la boucle « produire plusieurs directions, les comparer visuellement, choisir puis modifier le code » est décrite dans Replit. La piste qui mérite encore un petit prototype est plus précise : faire éprouver à l’utilisateur plusieurs comportements produit sur les mêmes données, lui permettre de composer son choix, puis retrouver les conséquences de ce choix lors d’une évolution. Ce dernier point est une hypothèse de valeur, pas une lacune du marché démontrée.

Périmètre : huit solutions ou familles proches, sources primaires consultées le 16 septembre 2026. Aucun compte privé, achat, installation ou appel modèle ; aucune interaction dans les produits. Seul ce rapport est écrit. Les dates ci-dessous désignent les annonces quand elles sont affichées, sinon la consultation. Les pages vivantes peuvent évoluer.

## Comment lire les preuves

- **D — fonction documentée** : procédure, interface ou API décrite par son éditeur ; son existence documentaire est vérifiée, sa qualité pratique ne l’est pas.
- **C — annonce commerciale** : capacité revendiquée dans une annonce produit ; ni benchmark indépendant ni observation de fonctionnement ici.
- **R — recherche/prototype** : réalisation ou exploration décrite par ses auteurs, sans supposer une disponibilité de produit industriel.
- **? — non établi** dans les pages retenues. Cela ne signifie pas « absent ».

« Raisonnement » désigne ici les possibilités de planification, critique et exploration offertes à l’utilisateur, jamais l’accès au raisonnement interne d’un modèle. Mémoire de conversation, instructions persistantes et connaissance projet automatiquement entretenue sont distinguées.

## Cartographie des huit solutions

| Solution | Explorer / raisonner | Prototyper visuellement | Alternatives | Mémoire | Coordination | Choix utilisateur |
| --- | --- | --- | --- | --- | --- | --- |
| **tldraw Agent + Branching Chat** | D : modes, tâches, actions de revue | D : agent manipulant le canvas | D : graphe de conversations divergentes | D : état et historique de session ; mémoire métier durable à construire | SDK extensible ; orchestration produit ? | D : sélection spatiale, branches, interruption |
| **Replit Agent / Design** | D : plan relisible et modifiable | D : canvas relié aux créations | D : suggestions, variantes côte à côte, application du gagnant | D : projet et historique conservés ; décision automatiquement réconciliée ? | D : tâches séparées, revue puis application | D : approuver, appliquer, rejeter |
| **Lovable** | D : Plan mode, comparaison d’approches | D : édition depuis le preview | D : exploration textuelle ; comparateur de branches ? | D : connaissances workspace/projet persistantes | Coordination de plusieurs agents créatifs ? | D : plan éditable, approbation, édition directe |
| **v0** | D : cadrage par usage et contraintes dans le guide | D : génération avec preview et Design Mode | Itération D ; comparaison structurée simultanée ? | Instructions projet indiquées par le guide ; mémoire autonome ? | Orchestration créative multi-agent ? | D : modifications visuelles ou par demande |
| **Cursor** | D : Plan Mode avec clarification et édition | D : sélection, dessin et voix dans Design Mode | D : travail parallèle possible ; comparateur produit dédié ? | D : règles persistantes applicables par portée | D : sous-agents, contextes séparés, copies isolées | D : plan, guidage spatial et choix de délégation |
| **OpenHands SDK** | D : boucle agent et outils extensibles | UI créative prête à l’emploi ? | D : délégation configurable ; expérience comparative à construire | D : persistance de session et mémoire projet optionnelle | D : agents spécialisés déclarés et délégués | D : politiques de confirmation ; interface produit à construire |
| **Google Stitch** | C : critique et raisonnement sur l’évolution du projet | C : canvas et prototypes interactifs | C : variantes et idées parallèles | C : contexte projet ; DESIGN.md portable annoncé | C : Agent manager | C : voix, sélection et réorientation en direct |
| **Ink & Switch / Patchwork, Malleable Software** | R : outils adaptés pendant le travail | R : outils incorporés aux documents | R : branches et exploration, capacités encore partielles | R : données persistantes partagées | R : collaboration humaine, pas promesse générale de multi-agents | R : modification directe des outils et de leurs règles |

### 1. tldraw : briques d’interaction déjà disponibles

Le starter kit Agent reçoit sélection, viewport, captures et données structurées ; il modifie les formes, suit des tâches et permet des modes adaptés à la critique ou au travail. Le kit Branching Chat représente les conversations par des nœuds reliés et reconstruit le contexte à travers les liens. Ce sont des fondations de développement, pas une méthode complète de création de logiciels. **Conséquence : un canvas d’agent ou un arbre de conversations ne constitue pas, seul, une invention produit DevMethod.** Sources : [Agent starter kit](https://tldraw.dev/starter-kits/agent), [Branching Chat](https://tldraw.dev/starter-kits/branching-chat).

Limite explicite de portée : le contexte de session et les actions du canvas ne prouvent pas une mémoire persistante des décisions métier ni la qualité du code produit. Le kit reconnaît aussi que les actions générées peuvent être invalides et expose leur validation ; aucune robustesse n’a été mesurée ici.

### 2. Replit : le concurrent fonctionnel le plus direct du concept large

Les suggestions partent d’un frame, ouvrent une nouvelle direction sans supprimer l’original, la placent à côté et permettent d’appliquer la direction retenue à une application existante. Elles couvrent apparence, extension et nouveau contexte. **« Montrer des alternatives puis choisir » existe donc au-delà d’une promesse générale.** [Explore suggestions](https://docs.replit.com/design/explore-suggestions).

Les tâches d’arrière-plan ont leur conversation et restent séparées de la version principale jusqu’à revue. L’utilisateur voit travail, tests et preview puis applique ou rejette. Cela couvre déjà une part importante de la coordination et du contrôle. [Task system](https://docs.replit.com/core-concepts/agent/task-system). Le canvas relie sélection, snapshots envoyés à l’agent et app ; certaines opérations sont désactivées dans le contexte de tâche verrouillée. [Canvas](https://docs.replit.com/design/canvas). La reprise de fichiers/historique est documentée, mais cette lecture ne prouve pas une reprise correcte d’intentions implicites. [Project Editor](https://docs.replit.com/learn/projects-and-artifacts/project-editor).

### 3. Lovable : délibération et mémoire de projet ne sont plus des ajouts originaux

Plan mode sert à explorer, comparer et clarifier ; les plans peuvent être révisés avant passage à l’exécution. Le preview permet de cibler des éléments à modifier. [Plan mode](https://docs.lovable.dev/features/plan-mode), [Preview toolbar](https://docs.lovable.dev/features/preview-toolbar).

Les connaissances persistantes existent aux niveaux workspace et projet ; les décisions d’architecture peuvent y être inscrites. La documentation demande de les maintenir à jour et reconnaît que les longues conversations peuvent moins bien respecter les instructions. **Conséquence : « l’agent se souvient du projet » nécessite une proposition plus précise qu’un fichier de contexte.** Ce rapport n’établit pas d’interface de comparaison de versions comportementales ni de coordination entre agents créateurs. [Knowledge](https://docs.lovable.dev/features/knowledge).

### 4. v0 : le passage intention → interface → code est établi dans ses guides

Le guide Vercel organise le prompt autour du produit, de son utilisateur, du moment d’usage, du résultat recherché et des contraintes. Il distingue modifications fonctionnelles par demande et ajustements visuels par Design Mode ; il référence aussi les instructions projet. **DevMethod n’apporte pas une rupture en ajoutant seulement un meilleur brief ou une prévisualisation éditable.** [How to prompt v0](https://vercel.com/blog/how-to-prompt-v0).

Limite de collecte : l’ouverture directe des pages v0 Design Mode a échoué dans l’outil de lecture, notamment à cause du type `text/markdown`. Le guide primaire Vercel a bien été ouvert ; les précisions visibles seulement dans les résultats de recherche — versions, forks, restrictions de viewport — ne sont pas utilisées comme preuves du rapport. Aucun effet de coordination multi-agent ni maintien autonome d’une mémoire n’a été établi ici.

### 5. Cursor : la création dirigée visuellement rejoint déjà l’agent de code

Plan Mode documente clarification, recherche du code, plan éditable et déclenchement de la construction ; les plans peuvent être enregistrés dans le workspace. [Plan Mode](https://cursor.com/docs/agent/plan-mode). Design Mode accepte sélection d’éléments, relations entre éléments, annotation et voix, avec modification du code correspondant. [Design Mode](https://cursor.com/docs/agent/design-mode).

La délégation et les espaces isolés sont documentés ; les sous-agents démarrent avec un contexte propre et dépendent des informations transmises par leur parent. La documentation indique aussi des surcoûts de tokens et de démarrage : paralléliser n’est pas une preuve de gain. [Subagents](https://cursor.com/docs/subagents). Les règles persistantes s’appliquent selon la portée choisie, sans garantir leur mise à jour sémantique. [Rules](https://cursor.com/docs/rules). **Une surcouche de rôles ou d’étapes doit démontrer un résultat utilisateur supplémentaire.**

### 6. OpenHands : réutiliser la plomberie d’agents plutôt que la réinventer

Le SDK documente cycle de conversation, persistance, outils, événements et espaces d’exécution ; les agents spécialisés peuvent être décrits par fichiers et délégués. [Architecture SDK](https://docs.openhands.dev/sdk/arch/sdk), [File-Based Agents](https://docs.openhands.dev/sdk/guides/agent-file-based).

La mémoire persistante optionnelle distingue utilisateur et projet ; ses index Markdown sont relus au début d’une conversation, les notes détaillées à la demande. La documentation les traite comme des indications non vérifiées et prévoit troncature et fonctionnement dégradé. [Persistent Memory](https://docs.openhands.dev/sdk/guides/persistent-memory). **Mémoire, délégation et reprise sont des capacités réutilisables ; elles ne constituent pas déjà une expérience créative aboutie.** Une intégration reste du travail, et aucun SDK n’a été exécuté dans cette recherche.

### 7. Stitch : menace directe pour « atelier d’alternatives créatives »

L’annonce du 18 mars 2026 décrit canvas multimodal, idées parallèles, Agent manager, critique vocale et prototypes reliés. Elle revendique un agent tenant compte de l’évolution du projet. Ce sont des annonces éditeur, pas des performances observées. [Annonce de mars](https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-ai-ui-design/).

En avril, Google annonce un brouillon ouvert de DESIGN.md pour transférer règles et intentions de design ; en mai, il annonce génération visible et réorientation en cours de travail. [DESIGN.md](https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-design-md/), [Itération en direct](https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-updates/). **Canvas + alternatives + mémoire exportable + agent pilotable est déjà une proposition concurrente explicite.** Les annonces ne démontrent pas, à elles seules, la validité fonctionnelle d’une application ni une maintenance correcte après changement métier.

### 8. Ink & Switch : distinguer fabriquer une app et adapter ses outils en situation

L’essai Malleable Software traite de modification d’outils existants, composition autour de données partagées et contrôle direct. Dans Patchwork, les auteurs décrivent des outils produits avec une aide IA qui héritent de persistance et de collaboration. Ils signalent aussi une maturité limitée et des questions ouvertes sur les branches de code et la gouvernance des forks. [Essai de recherche](https://www.inkandswitch.com/essay/malleable-software/), [Projet Patchwork 2024–2026](https://www.inkandswitch.com/project/patchwork/).

**Conséquence : la rupture possible porte sur l’environnement où l’on transforme son travail, pas nécessairement sur un nouvel agent.** C’est une direction de recherche avec prototypes, sans équivalence établie à un produit général accessible aujourd’hui. Le fait qu’un outil puisse être généré ne prouve pas qu’il sera adopté ; l’essai mentionne aussi des outils peu utilisés.

## Ce qui rendrait un nouveau DevMethod inutile

Les points suivants sont des déductions de produit, non des résultats expérimentaux :

1. **Le bénéfice vendu est déjà une commande ou un mode courant.** Clarifier, faire un plan, générer une UI, annoter le preview, déléguer et sauvegarder des règles sont couverts ci-dessus.
2. **La démonstration consiste à juxtaposer trois variantes graphiques puis en sélectionner une.** Replit documente cette boucle, jusqu’à l’application au code. Stitch la revendique aussi dans un environnement créatif.
3. **La mémoire est seulement un journal de décisions ou des instructions persistantes.** Cela peut être utile, mais ne suffit pas à justifier un produit supplémentaire face aux connaissances Lovable, aux règles Cursor ou à la mémoire OpenHands.
4. **L’essentiel du prototype est un gestionnaire d’agents.** L’utilisateur doit recevoir une nouvelle capacité créatrice, pas une nouvelle surface pour surveiller les mêmes tâches.
5. **Un bon prompt et les outils existants réalisent la même expérience avec moins d’effort total.** Le bon comparateur doit recevoir le même brief, les mêmes scénarios et les mêmes contenus, sans être artificiellement privé de ses fonctions de planification ou d’exploration.

La proximité n’impose pas l’abandon de tout produit : la composition, la facilité de prise en main ou un public précis peuvent créer de la valeur. Mais la présence d’un canvas ou d’une mémoire ne démontre aucune de ces différences.

## Hypothèse qui mérite un prototype court

**H1 — Un utilisateur décide mieux quand il peut éprouver et recombiner des règles de comportement sur un scénario partagé, puis voir quelle partie de son choix est affectée par une nouvelle demande.** Le différenciateur supposé est la manipulabilité du comportement et de ses conséquences. Il reste à vérifier que les outils existants ne rendent pas déjà cela aussi simple.

Prototype proposé, sans construire de plateforme d’agents : une seule petite application fictive d’inscriptions à un atelier. Présenter trois politiques réellement différentes — inscription immédiate, liste d’attente automatique, approbation par l’organisateur — avec les mêmes participants et événements. Chaque direction doit être utilisable, et montrer une conséquence concrète, pas uniquement une autre couleur ou un paragraphe d’arguments. Permettre une composition limitée, par exemple liste d’attente + invitation de remplacement, et expliquer les incompatibilités par leurs effets visibles.

La sélection conserve seulement le choix, sa raison courte et le scénario qui le matérialise. Une demande ultérieure, par exemple transférer une place, fait réapparaître les conséquences concernées. Le premier prototype peut être entièrement déterministe, avec alternatives préfabriquées et stockage local : il teste l’interaction sans prétendre tester la capacité d’un modèle à les créer. Ne pas commencer par un graphe générique, un moteur de workflow ou un format universel de mémoire.

Comparaison proposée : mêmes alternatives et mêmes informations accessibles dans un chat/plan bien présenté, face à la surface manipulable. Mesurer réussite sur des scénarios non vus, temps pour trouver une conséquence, effort pour réviser le choix et capacité à reprendre après interruption. Consigner également erreurs de compréhension, préférence et charge ressentie. Avec quelques utilisateurs, ce serait une exploration qualitative et formative, pas une preuve statistique de supériorité.

**Critère d’abandon :** si le témoin obtient la même compréhension et la même reprise avec un coût d’interaction comparable, ou si les personnes préfèrent déléguer entièrement le choix, ne pas industrialiser cette surface. Si le seul bénéfice est de voir plusieurs jolies propositions, réutiliser un outil existant. Si le bénéfice vient des politiques métier manipulables, approfondir ce seul mécanisme avant d’y brancher davantage d’agents.

H2, plus simple à garder en réserve : un contexte compact de choix peut faciliter la reprise entre outils. Mais les formats et mémoires existants rendent cette hypothèse moins distincte ; elle devrait servir H1 plutôt que devenir un nouveau système documentaire autonome.

## Limites de cette recherche

Les huit entrées mélangent produits, SDK et prototypes de recherche ; elles ne sont pas classées par performance. Les capacités documentées ne prouvent ni fiabilité, ni coût, ni qualité de résultat. Les cellules « ? » sont des limites de cette sélection de pages. Les annonces Stitch sont explicitement séparées des guides opérationnels. Aucun témoignage de plainte ou benchmark commercial n’a servi de preuve. Aucune observation d’usage réel n’a été fabriquée : la seule observation directe est l’accès et la lecture des pages primaires indiquées.
