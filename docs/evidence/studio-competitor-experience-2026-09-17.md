# Expérience Studio face à Bolt, Lovable et Base44

Date de consultation : **17 septembre 2026**. Étude qualitative de parcours et de
capacités documentées, destinée à orienter le produit. Ce document ne constitue ni
un classement général, ni une mesure comparative de qualité des modèles.

## Conclusion utile

**Studio a démontré une boucle locale utilisable : demande, livraison, aperçu,
constat d'échec, correction, nouvelle version, contrôles et export restauré.** Son
principal écart face aux parcours documentés des trois concurrents est la continuité
d'exécution et de mise en ligne : l'essai a nécessité un agent hôte prenant les
demandes par le bridge manuel, puis une restauration locale. Les concurrents
documentent une génération et une publication accessibles depuis leur éditeur.
Cela indique une priorité d'expérience, pas une différence mesurée de vitesse ou
de qualité du résultat. Sources : [essai Studio](studio-site-dogfooding-2026-09-17.md),
[Bolt — démarrage](https://support.bolt.new/get-started/quickstart),
[Lovable — publication](https://docs.lovable.dev/features/publish),
[Base44 — démarrage](https://docs.base44.com/Getting-Started/Quick-start-guide).

La force concrète de Studio dans cet essai est la lisibilité de ce qui a été
demandé, livré et vérifié, avec les limites de chaque contrôle. C'est un axe de
positionnement à développer, **sans revendiquer son exclusivité** : Lovable
documente également des vérifications navigateur, frontend et backend, et Bolt
documente l'historique et la restauration des versions.
[Lovable — tests](https://docs.lovable.dev/features/testing),
[Bolt — démarrage, historique](https://support.bolt.new/get-started/quickstart).

## Méthode et niveau de preuve

- **O — observé dans des captures utilisateur** : écrans Bolt et Lovable fournis
  dans cette conversation. Une capture établit l'écran affiché ; elle ne prouve
  pas un consentement achevé, un appel distant réussi ou une durée de parcours.
- **D — documenté** : documentation officielle consultée à la date ci-dessus.
  Les pages citées n'affichaient pas de date de mise à jour exploitable dans le
  contenu consulté. Leur disponibilité actuelle ne prouve pas la disponibilité
  dans chaque compte, offre ou région.
- **T — testé localement** : parcours Studio effectué par l'agent principal,
  rapport et artefacts inspectés. Les tests de protocole avec serveur local sont
  identifiés séparément des interactions avec un fournisseur réel.
- **I — interprétation** : appréciation produit tirée de ces preuves, susceptible
  d'être révisée après un essai comparable.

Nous n'avons pas réalisé le même projet de bout en bout dans les trois produits
concurrents. Aucun chronométrage comparable, coût, taux de réussite ou test
utilisateur n'a été collecté. Le travail Studio a bénéficié d'agents techniques
et de corrections du produit pendant l'essai ; il ne représente pas l'autonomie
d'un utilisateur débutant. Conformément au [protocole d'évaluation](../EVALUATION.md),
aucune note globale ou supériorité d'agent n'est déduite de ce parcours ou du nombre
de tests du dépôt. Une capacité non vérifiée n'est pas réputée absente.

## Ce que les captures établissent

| Ensemble fourni | Observation visuelle | Ce que cela ne prouve pas |
| --- | --- | --- |
| Lovable, 12:52 et 12:54 | Prompt central, menu d'ajout, galerie de projets et modèles à grandes vignettes. | Une image fixe ne démontre pas l'animation ni le fonctionnement de tous les modèles. |
| Bolt, 13:00–13:35 | Applications séparées des connecteurs MCP ; écrans d'autorisation Notion, Netlify et Sentry ; Notion visible avec un interrupteur dans le menu du prompt. | Les captures d'autorisation ne suffisent pas à établir le résultat de chaque connexion. |
| Lovable, 14:46–14:50 | Fiche Slack adaptée : identité personnelle ou bot, permissions, partage ; questions guidées dans le chat puis résumé des choix. | Un résumé de préparation n'établit pas l'installation d'une intégration fonctionnelle dans l'application. |
| Lovable, 16:28–16:31 | Registre MCP distinct ; Stripe activé dans l'espace ; règles par action ; réglage global personnalisé après une exception ; bouton d'essai ouvrant des questions métier ; blocage expliqué dans le chat. | Le badge activé ne signifie pas paiement prêt. Le blocage de forfait et de pays concerne le compte et l'essai capturés, sans généralisation tarifaire. |

Les images Codex Plugins/Skills fournies à 13:42 sont une référence complémentaire
d'organisation du catalogue ; elles ne sont pas une preuve sur Bolt, Lovable ou
Base44. Aucun secret, URL d'autorisation avec paramètres ou identité privée n'est
recopié ici.

## Matrice : observation, documentation et Studio

| Critère | Bolt | Lovable | Base44 | Studio réellement établi |
| --- | --- | --- | --- | --- |
| Entrée et premier résultat | **D** : prompt, Build, résultat à essayer dans Preview. [Guide](https://support.bolt.new/get-started/quickstart). | **O** : prompt, galerie, accès aux outils. **D** : aperçu interactif actualisé pendant la construction. [Aperçu](https://docs.lovable.dev/features/projects/preview). | **D** : prompt ou plan, génération et aperçu manipulable. [Guide](https://docs.base44.com/Getting-Started/Quick-start-guide). | **T** : projet et brief créés dans Studio, site livré par l'agent hôte. **Limite** : bridge manuel dans ce parcours ; la présence d'un prompt n'automatise pas la prise en charge. [Contrat](../STUDIO.md). |
| Réutilisation des MCP et accès depuis le prompt | **O/D** : connexions personnelles, activation par projet dans le menu du prompt, activation automatique optionnelle. [MCP](https://support.bolt.new/building/using-bolt/connect-mcp). | **D** : connexions chat personnelles utilisables entre projets ; elles ne deviennent pas des connexions de l'application publiée. [Chat connectors](https://docs.lovable.dev/integrations/chat-connectors). | **D** : MCP configurés au niveau du compte pour le chat des applications ; ils ne servent pas aux appels runtime de l'application. [MCP](https://docs.base44.com/documentation/account-and-billing/setting-up-a-custom-mcp). | **T** : connexions de la bibliothèque sélectionnées par projet ; synchronisation du prompt, reprise et autorité humaine couvertes. Le runner natif isolé n'accède pas à ces connexions. [Preuves](../missions/creation-experience/evidence/connector-permissions/RESULTS.md). |
| API de l'application et identité utilisée | **O** : applications Supabase, Netlify, Figma et GitHub séparées des MCP dans les écrans fournis. | **D** : catalogue distinguant chat MCP, compte partagé application + chat et compte propre à chaque utilisateur final. [Types](https://docs.lovable.dev/integrations/introduction). | **D** : connecteurs applicatifs partagés ou propres à chaque utilisateur. [Types](https://docs.base44.com/Integrations/Connectors). | **T** : GitHub MCP séparé de GitHub applicatif ; guides préparatoires. Un choix d'API ne configure pas l'accès de l'application. OAuth Slack natif et comptes utilisateurs finaux restent hors livraison. [Limites](../STUDIO-CONNECTORS.md). |
| Connexion et retour d'authentification | **O** : écrans fournisseur. **D** : clé ou OAuth, état Connected après confirmation d'accès. [Connexion](https://support.bolt.new/building/using-bolt/connect-mcp). | **O/D** : Slack permet de choisir compte/bot, permissions et partage avant OAuth ; redirection si fenêtre bloquée. [Slack](https://docs.lovable.dev/integrations/slack). | **D** : MCP avec OAuth, en-têtes ou sans auth ; Test puis ajout. [MCP](https://docs.base44.com/documentation/account-and-billing/setting-up-a-custom-mcp). | **T** : contrat OAuth et PAT, secret masqué, stockage privé, découverte des outils avant statut connecté. **Non établi** : authentification GitHub réelle, faute de PAT ; protocoles locaux et UI ne la remplacent pas. [Preuves](../missions/creation-experience/evidence/connector-permissions/RESULTS.md). |
| Permissions compréhensibles | **D** : outils activables globalement ; sélection du connecteur par projet. La documentation précise que la sélection outil par outil n'est pas propre à chaque projet. [Règles](https://support.bolt.new/building/using-bolt/connect-mcp). | **O** : Autoriser/Demander/Interdire par action Stripe/Cloud ; global personnalisé ; fiche Slack avec scopes. | **D** : accès consultable, reconnexion et nouvelles permissions selon les besoins du flux. Le même contrôle ternaire par outil MCP n'a pas été vérifié. [Gestion](https://docs.base44.com/Integrations/Connectors). | **T** : trois politiques effectivement contrôlées par le bridge ; accord ponctuel attaché à l'action, outils nouveaux réévalués. Ne contrôle pas les appels faits hors bridge par l'agent hôte. [Contrat](../STUDIO-CONNECTORS.md). |
| Guidage adapté et blocage utile | **O** : choix du service suivi de son écran d'authentification. | **O** : questions Slack ou Stripe selon l'usage, résumé, puis prérequis ou blocage explicite. **D** : configuration Slack spécialisée. [Guide](https://docs.lovable.dev/integrations/slack). | **D** : suggestions de connecteurs selon l'application et flux générés dans les fonctions backend. [Intégration](https://docs.base44.com/Integrations/Connectors). | **T** : guides persistants, questionnaires de mission, résumés réouvrables ; bug de reprise corrigé. **Limite** : préparation et connexion réelle demeurent deux états. [Essai](studio-site-dogfooding-2026-09-17.md). |
| Aperçu, correction et preuve | **D** : aperçu, sélection d'élément, historique et restauration. [Parcours](https://support.bolt.new/get-started/quickstart). | **O** : détails et récapitulatif dans la conversation. **D** : aperçu mobile/tablette/desktop et tests navigateur/frontend/backend. [Aperçu](https://docs.lovable.dev/features/projects/preview), [tests](https://docs.lovable.dev/features/testing). | **D** : aperçu interactif, essai sous différents rôles et formats. [Parcours](https://docs.base44.com/Getting-Started/Quick-start-guide). | **T** : échec v1 conservé, correction v2, observation navigateur et contrôles liés à la version. Les quatre contrôles affichés ne certifient pas toute l'application. [Essai](studio-site-dogfooding-2026-09-17.md). |
| Sortie du projet | **D** : publication intégrée vers bolt.host. [Publication](https://support.bolt.new/cloud/hosting/publish). | **D** : publication d'un instantané vers lovable.app, HTTPS et republication explicite. [Publication](https://docs.lovable.dev/features/publish). | **D** : publication depuis l'éditeur, visibilité et état de sécurité. [Publication](https://docs.base44.com/Getting-Started/Quick-start-guide). | **T** : archive de la v2 téléchargée, 22 fichiers restaurés, application et guide ouverts localement. **Non établi** : hébergement public ; le site n'a pas été publié. [Export](studio-site-dogfooding-2026-09-17.md). |

## Appréciation qualitative relative

Ces appréciations décrivent le **parcours local étudié** face aux repères
documentés, avec une confiance liée aux preuves disponibles ; elles ne sont pas
une note de performance des produits.

| Dimension | Appréciation Studio | Motif |
| --- | --- | --- |
| Continuité idée → premier aperçu | **Retard de parcours net** | L'agent hôte doit prendre la demande. Les parcours concurrents documentent une exécution intégrée. Pas de comparaison de temps. |
| Compréhension des usages MCP/API | **Base solide, couverture incomplète** | Les usages sont distingués ; les connexions applicatives gérées et les comptes de visiteurs ne sont pas livrés. |
| Connexion fournisseur en quelques étapes | **Écart restant à démontrer** | Les contrats et fixtures passent ; le parcours authentifié réel complet reste nécessaire pour chaque fournisseur. |
| Contrôle d'une action de l'assistant | **Point fort vérifié dans le périmètre local** | L'accord et la politique sont appliqués par le bridge, avec limites déclarées. Cela ne prouve pas un contrôle supérieur aux concurrents. |
| Aperçu et itération | **Parcours fonctionnel, robustesse encore à consolider** | Le résultat est essayé puis corrigé ; l'essai a aussi révélé un message trompeur et des types MIME manquants. |
| Traçabilité des vérifications | **Point fort démontré** | L'échec v1 reste visible et la réussite v2 a sa propre preuve. L'avantage comparatif précis reste non mesuré. |
| Livraison publique sans étape technique | **Écart majeur dans ce parcours** | L'export local fonctionne ; aucune publication intégrée n'a été démontrée. |
| Finition visuelle et facilité pour un débutant | **Non départagées** | Captures attractives et résultat Studio réel, mais aucun test humain équivalent ni mesure de charge cognitive. |

## Ce que l'essai Studio a réellement appris

La première livraison du site avait des liens publics cassés, un débordement
mobile de 8 px et un état de copie sans retour immédiat. La seconde les a corrigés
et a été essayée au navigateur. L'export v2 a été restauré et ouvert. Le film
anglais de 88,1 secondes existe : c'est un montage animé de captures réelles avec
voix synthétique, produit avec un outillage média externe à Studio, **pas une
fonction native de génération vidéo démontrée**. Sa lecture dans la troisième
version du site et l'export final étaient encore en validation au point de
situation consulté ; le [rapport d'essai](studio-site-dogfooding-2026-09-17.md)
porte l'état actualisé.

Les corrections de Studio pendant cet exercice — reprise d'un guide et types
MIME vidéo/sous-titres — sont un signal utile de maturité actuelle. Les tests
supplémentaires vérifient ces régressions ; ils ne doivent pas effacer les
frictions de l'expérience initiale.

La distinction durable doit porter sur **usage, identité et activation**. Un MCP
sert ici l'assistant ; une API sert l'application. Une connexion applicative peut
néanmoins être stockée et partagée entre plusieurs projets : Lovable le documente
pour Slack et Base44 pour les connexions de constructeur. Il serait donc trompeur
de graver « MCP = global, API = toujours propre à un projet » dans le modèle.
[Slack partagé](https://docs.lovable.dev/integrations/slack),
[Base44 — types](https://docs.base44.com/Integrations/Connectors).

Enfin, un registre MCP est un annuaire de serveurs, pas une autorisation accordée
à tous ces serveurs. La capture Lovable et sa documentation concordent sur un
ajout de registre suivi de connexions distinctes.
[Lovable — registres](https://docs.lovable.dev/integrations/mcp-registries).

## Cinq actions proposées

1. **P0 — Rendre la prise en charge continue et explicite.** Conserver l'agent
   choisi, indiquer s'il est disponible, distinguer attente, prise en charge et
   exécution. Dans le mode manuel, donner une reprise exploitable immédiatement.
   Critère : après envoi, on sait qui agit et ce qui manque, sans devoir lire des
   fichiers d'état. Cela n'impose pas un backend hébergé.
2. **P0 — Terminer trois connexions représentatives.** Notion OAuth pour contexte,
   GitHub PAT en lecture seule et une API applicative choisie pour un besoin réel.
   Exercer succès, refus, expiration, reprise, reconnexion et second projet.
   Afficher les vrais prérequis du fournisseur et vérifier un appel utile avant
   de promettre l'intégration. Un guide rempli n'est pas le critère de réussite.
3. **P1 — Unifier la fiche et les repères du prompt.** Montrer service, usage,
   compte lorsqu'il est fourni, état d'accès, activation dans ce projet et
   règle d'action ; rendre la configuration technique secondaire. Conserver
   « identité non fournie » quand elle est inconnue. Le retrait d'un projet doit
   rester distinct de la suppression ou révocation de la connexion.
4. **P1 — Faire de la vérification une étape de l'itération.** Garder le dernier
   aperçu pendant le travail, relier chaque constat à sa version, proposer une
   correction à partir d'un échec et expliquer la portée des contrôles. Réutiliser
   le scénario réel site + docs + mobile + média + export comme parcours de
   régression, sans présenter des contrôles ponctuels comme une couverture totale.
5. **P2 — Offrir une sortie guidée et éprouvée.** Commencer par clarifier et
   simplifier l'export/restauration existant ; choisir ensuite un seul déploiement
   cible avec prérequis, progression, URL finale et nouvelle publication.
   Décider séparément l'architecture et l'autorisation de publication. Une liste
   de fournisseurs n'équivaut pas à un hébergement intégré.

Après ces tranches, un essai concurrent utile partira du même besoin de petit
site, des mêmes sources et des mêmes critères, sans brief expert préparé pour un
seul produit. Il enregistrera les interventions humaines, les connexions
effectivement réussies, les défauts, les reprises et la sortie utilisable. Cette
étape permettra de remplacer les appréciations de parcours par une comparaison
mesurée ; elle n'a pas été réalisée ici.
