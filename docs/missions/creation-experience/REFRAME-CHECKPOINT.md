# Studio — checkpoint du recadrage décision et parcours

Date : 2026-09-16. Complète le [checkpoint React](REACT-CHECKPOINT.md) et
[ADR 019](../../ADR-019-studio-decision-journey.md). Ce document décrit le candidat en cours
d’intégration ; ses preuves sont distinctes de celles de la tranche précédente.

## Périmètre demandé

La référence N précise l’interface : décision actuelle lisible, options verticales, conséquences,
bloc « À préserver » et preuves distinctes, avec historique accessible mais secondaire.
Foundation, Explore, Frame, Design, Architecture et Delivery doivent rendre le travail compréhensible.
Le [contrat de disposition](design/DECISION-LAYOUT.md) conserve le détail et la provenance de N.
Le panneau n’invente ni conversation, ni phase achevée, ni accord de la personne.

Une décision en attente est maintenant un objet structuré : question, options, conséquences,
recommandation et aperçu lié à une image ou une version. Avant/Proposition compare ces sources
identifiées. Sélection, approbation, réalisation et adoption restent distinctes ; une image porte
le statut simulation. Les contrôles d’une version ne deviennent pas ceux d’une autre option.

Le parcours Design conserve directions, master détaillé, écrans dérivés et prototype réel. L’accord
du master est indépendant du choix de direction. La régression trouvée lors de la revue acceptait
encore une livraison après choix de direction malgré un master en attente : elle est reproduite
puis corrigée dans le domaine. Un master non approuvé, absent ou devenu périmé bloque désormais
la réalisation ; le refus conserve le job et sa base. Les projets sans parcours restent compatibles.

## Implémenté et limites d’intégration

Les règles et tests ciblés résident dans [le contrat domaine](../../../scripts/studio/domain.mjs),
[les propositions](../../../scripts/studio/proposals.mjs),
[le parcours](../../../scripts/studio/design-journey.mjs) et
leurs régressions (`tests/studio-proposals.test.mjs` dans le dépôt). Le store conserve l’historique,
les jobs prennent ces champs en compte dans leur empreinte et le serveur impose l’acteur.
`approval.visualBlock` permet d’expliquer le besoin de validation du master plutôt que de
redemander la direction. Une modification importante déjà approuvée peut renouveler son
empreinte seulement lors de l’accord explicite de la proposition correspondante.

Le [contexte transmis à l’agent](../../../scripts/studio/workflow.mjs) décrit les formes réelles
de `proposals` et les actions versionnées du parcours. Le runner peut recevoir les propositions
dans `decisions.json`. Il n’accepte pas un objet `designJourney` arbitraire en fin de job.
Les actions d’hôte du parcours s’effectuent entre les jobs pour ne pas invalider leur contexte.
Le raccord worker est exposé par `/api/design/master/delegate-approval` et
`/api/proposals/delegate-approval` : acteur agent imposé, délégation effective vérifiée,
version courante exigée et refus sans mutation. Les tests HTTP distinguent accord réservé et
délégué, interdisent l’accord humain par token et conservent le brouillon lors d’une réalisation.
La revue a aussi reproduit une modification de sa propre délégation par le worker via
`/api/project` ; cette route lui est maintenant interdite, avec régression rouge puis verte.
Le raccord HTTP n’établit pas à lui seul un parcours natif autonome complet.

Code distingue les fichiers du projet des sources installées du backend local, en lecture seule.
Les [services](../../STUDIO-SERVICES.md) exposent leur origine, leur état observé et leurs limites.
Le runtime est un processus Node avec les serveurs de preview et stockage JSON ; il n’est pas
un orchestrateur de microservices. Les services de `devmethod.project.json` sont des déclarations
liées aux fichiers existants, non des backends exécutés. Auth, hébergement et APIs externes ne sont
pas déduits de ce manifeste. Une sonde saine atteste seulement une lecture JSON valide.
L’origine de comparaison `comparisonPreviewOrigin` lit les données courantes de l’application
mais refuse leur modification ; l’application active reste accessible sur sa propre origine
avec ses écritures habituelles. Ce n’est ni une copie de données ni une isolation de processus.
La régression HTTP vérifie refus 405, conservation des données puis lecture d’une modification
effectuée par l’application active. Les trois previews se ferment avec Studio.

## Lancer et essayer

Depuis le dépôt, installer les dépendances avec `npm ci`, puis `npm run build`. Les espaces locaux
de cette session se relancent avec :

```sh
node scripts/studio.mjs serve --workspace /private/tmp/devmethod-react-live --port 4342 --preview-port 4343
node scripts/studio.mjs serve --workspace /private/tmp/devmethod-reframe-demo --port 4346 --preview-port 4347
```

- **4342** conserve le projet, son brouillon de 2 616 caractères et sa version active. Ouvrir
  **Parcours**, puis **Design** : trois directions conservées, master retenu, déclinaison mobile,
  prototype compilé. Le master a été enregistré rétrospectivement par l’agent sous délégation,
  avec cette provenance visible ; ce n’est pas une nouvelle validation humaine.
- **4346** est une copie explicitement nommée « démonstration ». Choisir une option : le formulaire
  ciblé s’ouvre dans la proposition compilée, alors que l’autre option conserve le bouton initial.
  **Avant / Proposition** compare les versions réelles. **Revenir à l’application** sort de la
  comparaison sans résoudre la décision ; **Reprendre la comparaison** la restaure.
- Dans **Code**, les fichiers de l’application affichent la révision examinée. **Backend et
  services** montre les sources du runtime et les sondes bornées. **Agrandir cette vue** libère
  l’espace ; la séparation entre discussion et produit se règle à la souris ou au clavier.

Les workspaces dans `/private/tmp` sont des données locales de session, pas des fixtures distribuées.
Exporter depuis Studio pour les conserver ailleurs. Le scénario détaillé et ses identifiants sont
dans [demo.json](evidence/reframe/demo.json), le raccord du parcours dans
[journey.json](evidence/reframe/journey.json).

## Observations et portée des preuves

La copie de démonstration possède une vraie candidate React/TypeScript, construite par l’agent
hôte sans nouvel appel fournisseur : `d7cd1dff`. Elle n’est pas adoptée ; la version active reste
`336de365`. Les données métier gardent leur empreinte
`7e5a1c94e6383910e6d583268c97fbe8ca94c0af27a7a8fd803bd40ab32e73c0`.

| Vérification | Observation / limite |
| --- | --- |
| Choix et Avant/Proposition dans Chrome | L’URL de l’iframe et la révision de Code correspondent à l’option ; la sortie vers l’application conserve la décision en attente. |
| Écriture depuis une comparaison | Refus 405 visible ; le nom saisi reste disponible pour réessayer. Les données ne changent pas. |
| Historique au clavier | Le conteneur d’activité défile ; la carte de décision et la page restent en place. |
| Raison de décision après rechargement | Texte retrouvé dans le navigateur, décision toujours en attente. Brouillon local isolé par projet/proposition/base, avertissement si stockage indisponible. |
| Redimensionnement | Flèche droite sur le séparateur : 444 → 460 ; double-clic rétablit la disposition. |
| Code agrandi | Coloration Monaco avec six couleurs. La capture initiale a révélé un éditeur limité à 158 px et un pied coupé : après correction, 252 px de code à 762 px de hauteur, 496 px à 1 024 px ; les trois lignes de preuves sont entières. Identifiants et empreintes restent accessibles dans « Version et fichier ». |
| Mobile 390 px | Largeur du document égale au viewport, sans débordement horizontal ; les panneaux se suivent verticalement. |
| Parcours / Design | Le lien de phase défile dans le panneau ; une régression qui déplaçait toute la page a été corrigée puis revérifiée. |
| Master devenu insuffisant | Test React : quand la personne reprend le visuel, l’ancien accord délégué est signalé comme historique et insuffisant. Le serveur garde le blocage. |
| Comparaison d’image, conflit et approbation | Contrôles automatisés de composants/domaine/HTTP ; pas une validation humaine du design. |

Captures : [décision desktop](evidence/reframe/decision-desktop.png),
[mobile](evidence/reframe/decision-mobile.png), [code backend](evidence/reframe/backend-code.png),
[parcours Design](evidence/reframe/journey-design.png). La capture desktop utilise 1 536 × 1 024 px
CSS, comme N. Les contenus et le design de l’application réellement retenue diffèrent de la scène
illustrative N ; aucun délai de 24 h ni compteur de la maquette n’a été codé dans Studio.
Les détails rapprochés comprennent radios, icônes SVG, badge, typographie, surfaces et états.
Il subsiste des différences de densité et de composition : cette inspection ne prouve pas une
correspondance pixel à pixel.

Voir les [observations navigateur](evidence/reframe/browser.json), les
[empreintes avant/après redémarrage](evidence/reframe/restart.json) et la
[revue Vercel applicable](evidence/reframe/VERCEL-REVIEW.md). Les résultats globaux et le
redémarrage sont consignés dans le [registre de validation](evidence/reframe/validation.json)
de cette tranche : **583 tests passent**, avec TypeScript, lint et formatage. Les anciens tests
et la CI verte de `63f7044` ne sont pas attribués automatiquement à ce recadrage.

Aucun nouvel appel natif n’est autorisé par ce recadrage : budget clos, campagnes antérieures
arrêtées conservées. Aucun bénéfice humain comparatif ou avantage de productivité n’est déduit
des tests techniques ; l’hypothèse reste un guidage plus lisible et une continuité mieux conservée.
