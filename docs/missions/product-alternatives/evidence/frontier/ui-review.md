# Revue indépendante — découverte UI/API

2026-09-16. Revue en lecture seule du checkout principal, au-dessus de `d3d94d82b544d8fb2a8fae1a55785d17730445a1` (arbre `78da43ba16d4b9a8b898b64b35749771e87499cb`, intégration du moteur figé). Cette revue porte sur le delta UI/API non committé inspecté ; aucun fichier source modifié, aucun fournisseur ni campagne. Seul ce rapport est écrit.

## Pins du delta effectivement inspecté

- `scripts/atelier/public/app.js` SHA-256 : `8026a7425c850f804dd68fe6e7146921bd761ab459d146cee007eef9f536732d`.
- `scripts/atelier/public/discovery-view.js` : `05655bad15da1d0440eba5e85ab640cdaa677b5fbf8619fbbafbe36bd6a48621`.
- `scripts/atelier/server.mjs` : `0eff543c8602471f1ad12126754ada19b070c17c73aa2031ff6eda1342dd129a`.
- SHA-256 du diff Git binaire des fichiers suivis app.js/style.css/server.mjs/tests/atelier-server.test.mjs : `a635fb24432e7499371afae6c4fa91384f8a7bbc5c9a35aa64f62d48fb61cc29`. Les fichiers nouveaux discovery-view.js et atelier-discovery-ui.test.mjs ne sont pas inclus dans ce hash de diff suivi ; leur contenu a été lu séparément.

Le parent peut corriger simultanément ces sources. Les constats ci-dessous visent ces pins et ne présument pas l’état d’un correctif ultérieur.

## Findings

### P2 — une confirmation ouverte peut rejouer un témoin ancien avec la version d’un nouveau contexte

`app.js:112–117`, et frontière `change()` qui construit la requête depuis la version courante.

Reproduction ciblée Node24.18/JSDOM, avec les vrais modules de domaine et des réponses HTTP différées en mémoire :

1. Charger version 1 et obtenir son témoin.
2. Cliquer Recharger ; laisser le GET en attente.
3. Avant sa réponse, ouvrir « Jouer cette situation » : le dialogue capture les anciennes étapes.
4. Résoudre le GET avec version 2 et un besoin révisé. L’aperçu est bien supprimé, mais le dialogue reste ouvert.
5. Confirmer : la closure soumet l’ancien témoin via `change`, qui utilise maintenant **version 2**.

Sortie observée :

```json
{"version":2,"steps":[{"actionId":"review","actorId":"nina","recordId":"atelier-velo"}]}
```

Le garde serveur compare seulement la version envoyée à celle stockée ; cette requête passe donc ce garde avec un contexte périmé. Selon le nouveau projet, elle peut remplacer les essais courants tout en ayant des conséquences différentes de l’aperçu accepté. Le contrôle indépendant confirme la requête erronée ; il n’a pas modifié une vraie session serveur.

Correction minimale : capturer `discovery.storageVersion` avec les étapes et vérifier encore cette version au moment de confirmer ; si elle a changé, refuser et demander une nouvelle recherche. Fermer/invalider les confirmations lors d’un rechargement est également possible. Le POST de rejeu doit conserver son garde de concurrence pour un changement intervenu après ce contrôle local. Aucune nécessité d’inventer un nouveau protocole de preuve signée.

### P2 — la recherche perd le focus clavier en remplaçant son déclencheur par un bouton désactivé

`app.js:85–108` et `discovery-view.js` : bouton `discover-situation` désactivé pendant `seeking`.

Contrôle ciblé : focaliser explicitement ce bouton, lancer la recherche, puis résoudre sa réponse. Après le premier render, `document.activeElement` vaut `BODY` : le bouton recréé désactivé ne peut reprendre le focus. Après le render final, il reste `BODY`, car l’ancien identifiant est perdu. La notification annonce la fin mais l’utilisateur clavier perd son point de navigation loin des résultats.

Sortie observée :

```text
search in flight focus: BODY
search completed focus: BODY
```

Correction minimale : rétablir un point de focus pertinent à la fin si le focus a été perdu par cette opération ; ne pas voler le focus si l’utilisateur s’est déplacé dans un autre contrôle ou dialogue. Le parent conserve l’attribution du parcours Chrome ; cette reproduction est DOM, pas un contrôle d’assistance technique réelle.

### P2 — un écart réellement comparé peut être invisible dans les conséquences affichées

`discovery-view.js:24–27` remplace l’identifiant d’état par son seul libellé.

Reproduction isolée avec un projet valide : deux variantes acceptent `submit` sur le même enregistrement ; l’une obtient `ready`, l’autre `published`, et les deux états portent le même libellé « Traité ». Le moteur renvoie un témoin conforme à son contrat d’observation exacte des IDs. Le rendu affiche cependant deux conséquences identiques, hors titre de variante :

```json
{
  "observedStates": ["ready", "published"],
  "displayedConsequences": [
    ["Action acceptée", "Texte de contrôle · Traité"],
    ["Action acceptée", "Texte de contrôle · Traité"]
  ]
}
```

Le propriétaire ne peut voir ce qui justifie « Un premier écart à examiner ». Correction limitée à la vue : rendre inspectables les valeurs exactes comparées, au moins lorsqu’un libellé masque une différence (détails ou indication explicite des IDs). Expliquer qu’un écart d’identifiant n’est pas déjà une différence de qualité ou de préférence. Le moteur figé n’a pas besoin d’être changé pour cette correction de transparence.

## Contrats relus sans autre défaut identifié

- `/api/discover` applique les frontières Host/Origin, JSON et version existantes, puis calcule depuis `before.session.project` et renvoie **avant** `store.commit`. Aucun chemin de mutation de la session n’est appelé par cet aperçu.
- La trace porte des actions de situation communes compatibles avec `replaySituation`. L’interface annonce la remise aux données initiales et la disparition des essais/éléments ajoutés ; le rejeu demande une confirmation HTML explicite.
- Les modifications réussies et chargements réussis invalident l’aperçu. Le retour asynchrone d’une recherche vérifie la version de départ ; le finding 1 concerne la confirmation de rejeu déjà ouverte, pas l’absence totale de contrôle de version.
- La contestation préremplit un textarea puis ouvre le vrai dialogue de demande. Aucun appel `/api/request` ou fournisseur n’est déclenché par ce bouton ; la question est modifiable avant une soumission explicite.
- Texte de projet/observations construit avec `textContent` par `el`; pas d’injection HTML ajoutée.
- Aucun témoin trouvé n’est présenté comme recommandation. Les résultats bornés restent accompagnés d’une limite et d’un refus de conclure à l’équivalence. Mode simple et route isolée n’ajoutent pas ce panneau.

## Vérification et limites

Deux scripts indépendants sur stdin ont été exécutés avec Node `v24.18.0` et JSDOM installé : un scénario de concurrence de chargement + focus, un projet valide dont les états différents partagent un libellé. Ils réutilisent les modules réels, simulent uniquement la frontière réseau du DOM et ne touchent pas à la session utilisée par le parent. Les nouveaux tests de l’auteur et le delta du test serveur ont été lus, pas réexécutés. Aucune suite inchangée, test large ou navigation navigateur n’a été répété.

Les trois findings sont ouverts sur les pins ci-dessus. Les corrections annoncées par le parent ne sont pas encore relues au moment de cette rédaction. Cette revue n’établit ni utilité humaine, ni équivalence des produits, ni généralisation du moteur hors de son alphabet.

## Clôture ciblée des trois findings — correction UI/API

Même base intégrée `d3d94d82b544d8fb2a8fae1a55785d17730445a1`, correctif UI encore non committé lors de la lecture. **Les trois findings sont fermés sur les pins suivants** ; les sections précédentes conservent le constat historique.

- `scripts/atelier/public/app.js` : `c4e631828929b4155f4a11646c6a63479dc70e0427e35f36b77e7335736d9011`.
- `scripts/atelier/public/discovery-view.js` : `484127f7b7d18424e2a0bb5207709f0102b725405d9d0685bb9af53bf4be4fa8`.
- `scripts/atelier/public/style.css` : `a60061ed26a1ddf0ca757e7c4e6aa75554a02b4be2d067b6c0eb40ca57050f6b`.
- `tests/atelier-discovery-ui.test.mjs` : `a11b757651128cf4e143ca4a02c2fe906f4cf21a542c4b761165a53b19e6e819`.

1. **Rejeu périmé : fermé.** `playDiscovery` capture la version du résultat avec les étapes ; la closure de confirmation compare cette version à la version locale courante et refuse le rejeu après le GET intermédiaire. Le garde serveur existant reste applicable si un autre changement intervient ensuite. Le test reproduit précisément le rechargement différé pendant la confirmation, n’observe aucun POST de rejeu supplémentaire et conserve la session nouvelle.
2. **Focus perdu : fermé.** La recherche mémorise si son déclencheur était focalisé, puis restaure le focus au bouton redevenu actif seulement si le focus est encore sur `BODY`. La lecture confirme qu’un autre contrôle resté focalisé n’est pas remplacé par ce retour. Le test vérifie le retour effectif au bouton après la recherche. Il ne prétend pas reproduire l’intégralité des comportements d’un lecteur d’écran.
3. **Écart masqué : fermé.** Chaque observation expose maintenant ses valeurs comparées dans un disclosure natif, avec une explication sur les identifiants. La différence `ready`/`published` sous un même libellé est donc inspectable. Le test parse les valeurs rendues et les compare aux observations réelles distinctes. Le style `white-space:pre-wrap` et `overflow-wrap:anywhere` accompagne le JSON pour éviter des lignes rigides ; cela n’est pas une nouvelle certification visuelle.

Exécution indépendante limitée aux **deux tests modifiés** : `node --test tests/atelier-discovery-ui.test.mjs`, Node `v24.18.0`, **2/2 passent**, 0 échec. Aucun test large, parcours navigateur, fournisseur ou mutation de session réelle. La première tentative de fixture signalée par l’auteur, qui omettait `otherOwner`, relève d’une entrée de test invalide et n’est pas comptée comme échec produit. Les reproductions indépendantes initiales de cette revue utilisaient bien une fixture valide.

Le SHA-256 du moteur reste `8b23e894b57013a943a6be2bd31c0bfe0da4d84e60e0e27b34daed14f64aa843` : aucun changement de ce fichier gelé. Aucun autre périmètre de recherche n’a été rouvert.


## Revue additionnelle de la surface numérique /transfer

Base Git intégrée : `3401226767538a9a076b57fc2f80af4057f5c74e`. Surface et routes relues comme changements non committés ; cette extension n'était pas couverte par le pin antérieur de discovery-view. Le changement de cette vue depuis la clôture ajoute le lien vers /transfer et sa phrase de contexte. Pins SHA-256 de la présente inspection :

- `scripts/atelier/public/transfer.html` : `677764c94819df531c7ee55a2db9c98a25c12426f613e6b5fcd5aaeb7308e8a4`.
- `scripts/atelier/public/transfer-app.js` : `2f4d0c7d5a6d5d108f84b6daddbabceefbec875003d9673123e9b0ef8bdbd60a`.
- `scripts/atelier/public/transfer.css` : `042bddadd287e2f8b7654700eec1ad229a6f932c08a22ed41d27751f04cf1b48`.
- `scripts/atelier/public/discovery-view.js` : `9ee2a14864cad15c961bed4a187548d0799d70427dc1579e479713c7334b1d7a`.
- `scripts/atelier/server.mjs` : `096fe92fb9d3587ca446c3daffdd7b6c6f5a20b89c611a6a822f444662579c9e`.
- `scripts/discovery/search.mjs` : `8b23e894b57013a943a6be2bd31c0bfe0da4d84e60e0e27b34daed14f64aa843`.
- `scripts/discovery/transfer/domain.mjs` : `a5ede32c39bcdf5add4284e07b41af5efc88d53703bf337ac5a7c1d2ca67eaad`.
- `scripts/discovery/transfer/machine.mjs` : `f1e50ad215680f06b95f2d9fa445660ddc842dce10beadbd340487519b0d4297`.

### P2 ouvert — focus perdu à la fin de la fenêtre de location

Dans `transfer-app.js`, `renderRental` mémorise l'ID focalisé puis recrée les actions. Si l'action disparaît lorsque la fenêtre de 120 minutes est atteinte, la restauration par cet ID ne trouve plus de contrôle. Reproduction indépendante : location 60 minutes, focus sur Location de 60 minutes, activation. Résultat réel DOM : 120/120 minutes, zéro action disponible et `document.activeElement.tagName === 'BODY'`. Le bouton Recommencer cet essai reste disponible mais ne reçoit pas le focus. Le point de navigation clavier est perdu.

Correction limitée proposée : retenir si le contrôle focalisé appartenait aux actions et, uniquement si ce contrôle n'existe plus après rendu, focaliser Recommencer cet essai. Aucune modification du domaine ou du moteur n'est nécessaire. Finding communiqué au parent avant rédaction.

### Autres contrats inspectés

- Les titres des deux politiques respectent l'ordre POLICIES du domaine figé. Le rendu monétaire utilise les centimes de rentalInvoice ; aucune conversion intermédiaire flottante n'entre dans le calcul.
- Contrôle DOM indépendant avec vrais modules de recherche et domaine : une location manuelle de 60 minutes reste inchangée après recherche et après annulation du dialogue. Après confirmation, l'essai est remplacé par deux locations de 20 puis 40 minutes ; les montants affichés sont respectivement 9,00 € et 6,00 €. Ces montants correspondent aussi au calcul direct : (1+2) tranches contre 2 tranches, à 3 € chacune. Le focus revient bien au bouton de rejeu après fermeture du dialogue.
- L'aperçu est calculé depuis initialRental via rentalMachine ; il n'altère pas current ou steps. Le dialogue avertit que l'essai local sera remplacé. Les opérations sont synchrones et aucune requête asynchrone ou révision serveur n'entre dans cette confirmation.
- Aucun fetch, paiement, écriture de fichier ni stockage navigateur dans cette surface. L'état reste en mémoire, et le rechargement annoncé recrée initialRental. Il ne s'agit pas d'un système de location persistant.
- Les trois nouveaux modules exposés par le serveur proviennent d'une allowlist explicite avec Object.hasOwn et noms de fichiers constants. Les routes publiques de la surface sont également explicites ; les chemins fournis par l'appelant ne sont pas joints au répertoire source. Les en-têtes CSP/nosniff et la frontière Host existants restent applicables. Les imports navigateur relatifs de machine.mjs résolvent vers la route domain.mjs autorisée. Aucun élargissement à un répertoire arbitraire n'a été observé.
- Les textes des résultats utilisent textContent via el. Aucun HTML dynamique non échappé n'a été ajouté. Le résultat n'est pas présenté comme une recommandation tarifaire, et les limites (cas fictif, deux heures, mémoire locale, pas de paiement/dépôt/client supplémentaire) sont explicites.

### Portée de la vérification

Un script ciblé sur stdin, Node v24.18.0 et JSDOM, a chargé le nouveau HTML et la vraie logique UI ; les imports URL navigateur ont seulement été résolus vers leurs mêmes modules locaux. showModal/close ont été adaptés au DOM de test. Ce contrôle vérifie l'état et les montants rendus, l'absence de mutation de l'aperçu, l'annulation, le rejeu et la perte de focus terminale. Il n'atteste pas le piégeage natif du focus ou le rendu visuel responsive. Le parent réalise le parcours Chrome ; je ne l'attribue pas à cette revue. Aucun rerun de suite inchangée, aucun fournisseur et aucune mutation du dépôt. Une tentative de hachage shasum a échoué sur la locale Perl avant lecture des fichiers ; les pins ci-dessus ont été calculés avec node:crypto.

Le moteur exact reste au SHA gelé ci-dessus. Cette surface démontre une interaction locale exécutable et la cohérence des calculs observés ; elle ne démontre ni préférence humaine, ni utilité produit, ni gain causal face à une bonne conversation et des prototypes.


## Clôture ciblée — focus terminal /transfer

**Finding P2 fermé.** Même base Git `3401226767538a9a076b57fc2f80af4057f5c74e` avec correctif non committé. Pins relus :

- `scripts/atelier/public/transfer-app.js` : `2f4d0c7d5a6d5d108f84b6daddbabceefbec875003d9673123e9b0ef8bdbd60a`.
- `tests/discovery-transfer-ui.test.mjs` : `10a66aef279ad19786d3820752980a1b4ab4641a382fe6fbda6c05a491a02a6a`.
- `scripts/discovery/search.mjs` : `8b23e894b57013a943a6be2bd31c0bfe0da4d84e60e0e27b34daed14f64aa843`.

`renderRental` capture désormais l'appartenance du contrôle focalisé à rental-actions avant de remplacer les boutons. Il restaure l'ancien ID s'il existe encore ; sinon, uniquement lorsque le focus provenait d'une action, il cible clear-rental. Ce repli conserve un point clavier utilisable à la fermeture de la fenêtre et ne redirige pas un focus venu d'un autre contrôle. Le texte de l'aperçu annonce son origine initiale et la confirmation du remplacement ; il reste vrai une fois l'essai rejoué.

Exécution indépendante strictement limitée au nouveau test : `node --test tests/discovery-transfer-ui.test.mjs`, Node v24.18.0, **1/1 passe**, zéro échec, 583.62325 ms au total. Le contrôleur et les modules de domaine/recherche sont réels ; seuls les chemins de modules sont adaptés à Node et les méthodes du dialogue sont simulées dans JSDOM. Le test conserve les montants de l'essai manuel avant confirmation, vérifie 9 €/6 € après rejeu, pause gratuite, puis la dernière location de 40 minutes après 80 minutes écoulées : zéro action restante et focus clear-rental. La simulation du dialogue n'atteste pas le focus natif de fermeture ; ce point n'est pas revendiqué par ce nouveau test.

Aucune suite générale relancée ni modification de code effectuée par cette revue. Le moteur gelé reste inchangé. Les quatre findings UI recensés dans ce rapport sont maintenant fermés sur leurs pins de correction respectifs ; aucune nouvelle conclusion d'utilité humaine ou comparative n'est tirée.

Précision de provenance du checkout partagé : le hash transfer-app `2f4d0c7d5a6d5d108f84b6daddbabceefbec875003d9673123e9b0ef8bdbd60a` est déjà celui de la correction. Il avait été collecté à la fin de la première revue, après la lecture initiale et la reproduction rouge, pendant que le parent corrigeait le fichier. Il ne doit donc pas être attribué à la version rouge initiale. La lecture initiale et la sortie DOM rouge conservées dans la trace des outils attestent le défaut observé ; aucun hash autonome de ces octets initiaux n'avait été enregistré avant leur modification. La présente clôture a bien relu et testé les octets corrigés correspondant à ce hash.
