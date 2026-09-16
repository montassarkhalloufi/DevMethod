# Revue pré-appel du diagnostic de cadrage

Date : 2026-09-16T13:19:13.734Z. Lecture seule du pilote ; aucun modèle, processus Codex ou test de campagne lancé. Seule écriture : ce rapport. Périmètre : protocol.json, TASK/AGENTS, entrées natives installées et intégrité de leurs manifests.

Verdict : les entrées de cadrage sont comparables dans le périmètre annoncé. Aucune raison de remplacer le parcours natif BMAD spec ni de rouvrir Build Auto. Admission opérationnelle encore à confirmer : catalogue effectif et pilote d'arrêt ne sont pas présents dans les artefacts relus.

## Résultats vérifiés

- Les trois TASK.md ne diffèrent que par l'invocation native ; même demande, même slug, mêmes exclusions et délégation. AGENTS.md est byte-identique pour les trois conditions. Il désigne explicitement les skills sous product/ comme sources documentaires, la méthode active comme celle de la racine.
- Les 879 entrées product/ et sources/ sont exactement identiques dans les trois manifests. J'ai recalculé tous les hashes du manifest de chaque condition sur les fichiers réels : aucune divergence, calibration comprise. Ce contrôle couvre les entrées énumérées, pas des fichiers supplémentaires éventuels.
- Catalogue installé à la racine : 20 skills DevMethod, 18 Spec Kit, 29 BMAD ; aucun pour calibration. Ce sont les répertoires présents, PAS la preuve du catalogue actif Codex, qui peut inclure les skills personnels/globaux. Versions locales : BMAD 6.12.0 (_bmad/_config/manifest.yaml), Spec Kit 1.0.7 (.specify/init-options.json). Spec Kit hooks={} ; aucun hook de branche/réseau requis par sa configuration présente.
- BMAD .agents/skills/bmad-spec/SKILL.md définit explicitement headless pour un caller non interactif, express par défaut, slug fourni, deux passes de self-validation avec verdicts dans .memlog.md. Aucune obligation de reviewers enfants dans cette entrée. DevMethod frame borne aussi son stage ; specify produit spec et checklist. Des formes d'artefacts différentes sont attendues et ne constituent pas une inégalité.
- Les anciennes séries restent closed ; les 51 712 tokens connus sont conservés, les deux anciens montants inconnus restent null. 200 000 est explicitement un arrêt souple sur tokens connus, pas une borne du coût historique total. Pas de reset/retry annoncé.

## Deux contrôles concrets restant avant le premier appel

1. **Catalogue effectif et arguments d'exécution.** Au moment de la revue, controls/ ne contient que protocol.json, .runtime/ que tmp/ ; pas de résultat skills/list ni d'argv pour ces racines. Avant admission, conserver le résultat sans modèle du catalogue réellement chargé avec les mêmes overrides que l'appel, et vérifier chaque skill enabled par chemin : seulement la méthode de la condition, aucun skill global/méthode voisine ; calibration sans méthode. Vérifier aussi l'AGENTS effectivement chargé. Un catalogue d'une autre racine ou les noms de dossiers ne satisfont pas ce critère. Ce point ne démontre pas une contamination ; il distingue preuve absente et défaut avéré.
2. **Arrêt réellement appliqué.** Le protocole dit 4 appels, 120 s, maxBytes, pas de retry, stop sur usage/final manquant ou input protégé changé. Aucun runner/ledger de ce nouveau pilote n'était fourni à inspecter. Écrire le slot avant dispatch, inclure la calibration dans les quatre, enregistrer chaque échec et le montant connu avant toute prochaine admission ; refuser le slot suivant si fin/usage manquent ou seuil atteint. Vérifier inputs après chaque essai. Ne pas réutiliser directement scripts/hosts/codex-task.mjs sans adaptation : sa configuration lue dans l'audit précédent activait multi_agent=true, contrairement à ce protocole. Ce constat est une vérification d'assemblage à faire, pas une demande de nouveau laboratoire.

## Portée des conclusions

Le pilote est un diagnostic d'artefacts de cadrage sur un projet réel déjà très documenté par DevMethod. Il ne mesure pas la construction du contexte depuis zéro, la facilité pour un humain, la livraison complète, ni un effet causal de méthode. Le protocole l'annonce correctement. Le choix opérateur du problème et la fourniture des messages sources sont explicites. Ordre prospectif fixe, un essai par méthode : rapporter les observations individuelles, pas un classement statistique. Les passes de validation BMAD sont du travail natif, pas une pénalité à neutraliser ; un timeout sous 120 s reste un résultat borné, pas une réfutation de la méthode.

L'absence de grille de notation figée n'empêche pas un diagnostic descriptif. Si un verdict comparatif chiffré est envisagé, figer avant sortie les questions communes (décisions actuelles correctement reprises, hypothèses attribuées, critères observables, exclusions, chemins utilisables) et ne pas noter selon le format propre à DevMethod.

## Pins

53472958aef00cd46fb800007b15e5e16730049d979480a7f6fff8a85a7680df  controls/protocol.json
b6be43a1a427c86acad53de5f7d8a56db9522cedb008bbf340197cdaafc3e3d5  workers/calibration/TASK.md
636dda2c52887a49ed53431d457b46c38330a107239e3ba3c03dcf9a68f83603  workers/calibration/AGENTS.md
b39c66dce23b905ea7a4f405a9a1f0089018861c527ce049e24d8626c92240dc  workers/bmad/TASK.md
d179cc75d26e210426dedd47916a8f67a2c0fbe46c2b502cb75a580904ef75b2  workers/bmad/AGENTS.md
8efd95093564fb9bee2bc71674050bbb645212f2e836b89daec99ec77ca66f88  workers/devmethod/TASK.md
d179cc75d26e210426dedd47916a8f67a2c0fbe46c2b502cb75a580904ef75b2  workers/devmethod/AGENTS.md
f564dd2534dcefad43583e388d0d5d729afb08505a90c8412ef4518543fcd508  workers/spec-kit/TASK.md
d179cc75d26e210426dedd47916a8f67a2c0fbe46c2b502cb75a580904ef75b2  workers/spec-kit/AGENTS.md

## Addendum — runner et préflights, 2026-09-16T13:27:29.971Z

Les deux vérifications opérationnelles initialement absentes ont maintenant des artefacts. Les quatre catalogues effectifs sont sans erreur, avec respectivement calibration 0 / BMAD 29 / DevMethod 20 / Spec Kit 18 skills actifs, tous sous la racine attendue ; 26 chemins globaux désactivés par condition. Les quatre tool-preflight ont exit=0 et confirment écriture locale, refus de lecture controls et HTTP local. Pas de modèle lancé par ma revue. Le ledger contient seulement la référence historique, aucun nouveau slot.

**Slots et cumul conformes à la borne annoncée.** Le runner autorise seulement les quatre noms protocol.order ; réserve le slot avant dispatch ; reserveRun utilise un fichier exclusif et un verrou. maxRuns=5 inclut la référence historique 50 760+952=51 712, donc laisse quatre appels, calibration comprise. L'ordre impose les résultats antérieurs ; la version courante exige exit=0, finalResponse, usage, collectionErrors vides, protectedChanges vides et calibration accepted. reserveRun additionne les montants valides et refuse dès 200 000 avant le prochain appel. Un slot courant/inconnu/timeout bloque. supervise borne 120 secondes et 2 MiB, termine le groupe descendant sur fin contrôlée ; aucun retry automatique.

**Deux défauts concrets signalés au parent avant admission, encore visibles dans la version lue.**

1. Runner ligne 33 : aucun signal transmis à supervise et aucun handler SIGINT/SIGTERM. scripts/native-host.mjs:43 détache le groupe enfant. Terminer le runner peut donc supprimer son timer tout en laissant Codex et ses descendants continuer. Correction minimale : AbortController branché sur ces signaux, passé à supervise, nettoyage des handlers après collecte. L'arrêt forcé SIGKILL reste une limite distincte à ne pas présenter comme interceptable.
2. Runner ligne 36 : les vérifications exécutent range.test.mjs et importent range.mjs via Node direct, hors profil framing. Le contrôle indépendant de sept cas nouvellement ajouté et le hash range.test sont utiles, mais l'import du code produit peut alors accéder à controls/ledger et à l'environnement accessible au runner, malgré la séparation annoncée. Exécuter ces vérifications sous la même politique native (script indépendant fourni par argument, comme le preflight, donc sans ouvrir controls en lecture) et garder le hash du test intact. Aucun besoin de nouvelle campagne ou de laboratoire.

**État de la correction calibration.** La version courante protège désormais le hash de range.test.mjs et exige sept cas indépendants plus aucun changement protégé ; elle refuse également collectionErrors non vides lors de l'admission suivante. Ceci corrige le faux succès par test modifié. Les deux défauts ci-dessus restent à fermer dans le driver final. Le fichier frozen.json lu porte encore le hash driver v1, différent du driver en cours : run refuse ce décalage, donc aucun appel admis par cet état intermédiaire. Conserver v1 et figer v2 une fois ces corrections achevées.

**Limite de preuve.** Lecture statique et examen des résultats existants uniquement ; pas d'exécution du runner, ni test natif, ni modèle. Les pins capturent un candidat en modification et ne constituent pas une approbation du gel futur. Les imports externes sont également listés ci-dessous pour rendre la revue reproductible.

### Pins de cet addendum

2060eaf1193010abac3f48f94374c80304c36372e25042101495d8b15d5963a5  /private/tmp/devmethod-framing-pilot.mjs
e2fad5670e83294cc5db7d9ac6a47efbb5852b0051677c6b4255b5827897706e  /private/tmp/devmethod-framing-pilot-20260916/controls/protocol.json
4e44f228876909f9d0669b68143df6678bac53537ac3e67e3c82adef0548247c  /private/tmp/devmethod-framing-pilot-20260916/controls/frozen.json
893e7af75f98f982ad74369bfd1c62367008f78a162db7319b8d5a340277f542  /private/tmp/devmethod-framing-pilot-20260916/controls/calibration-catalog.json
bdf32284b078a357ca6fa84bc1ddca73fd63e3e43f69d4983d74b8ac76269537  /private/tmp/devmethod-framing-pilot-20260916/controls/calibration-tool-preflight.json
8d5de2edbdb6f35eef7ab93ae1bef94fee44204b1f6412fd2914f0921c3a0be4  /private/tmp/devmethod-framing-pilot-20260916/controls/bmad-catalog.json
670814eeba6d438bb0d54d76073cd8e3c6df4c1079d42a0194ed6395a0445636  /private/tmp/devmethod-framing-pilot-20260916/controls/bmad-tool-preflight.json
a1a443ba091983f414f10009e21422f5c4091b9a0d2f7a35d4efd94e35d7339f  /private/tmp/devmethod-framing-pilot-20260916/controls/devmethod-catalog.json
84acc3133398e0bc333b814a626c216a5888cb8dd7bdc946c812891c22dfaed0  /private/tmp/devmethod-framing-pilot-20260916/controls/devmethod-tool-preflight.json
1ae4cb6d55eb5d0843fcfce4e99d413555348d51b8fb467d94b5d6e256f8b197  /private/tmp/devmethod-framing-pilot-20260916/controls/spec-kit-catalog.json
7ec5bd2dfbdad3b1f1e879453e8fce468ac10bf2218870f27b46179e39d2752b  /private/tmp/devmethod-framing-pilot-20260916/controls/spec-kit-tool-preflight.json
5ee9332ebe4af46eddb10e82d1317bfabb6b232dfa2c5d73eaa6a054661f95cb  scripts/native-host.mjs
bbfb28f3e0bb1b925845a6a18c4582a7d8d280f5f35a440545ff5e069e020ee8  scripts/hosts/codex.mjs
0e7eec4bcd866febe91c463c08f66626337499e3cb6b19b66527c7de530b4a02  scripts/native-maintenance.mjs

## Fermeture ciblée v2 — 2026-09-16T13:28:45.204Z

Driver relu : e3e81e7d211a217b3f00df4c89e3ba51b97718cb2301b146fa8d28b899562cd7 ; frozen.json : 976198bd05bbce55b5729bfda09042a92014a01b75474501d699d5c0f0b7ac28. Gel v2 du 13:27:48Z cohérent avec le driver. Le confinement de calibration est **fermé** : lignes 39–40, les deux vérifications passent par codex sandbox avec le même profil framing et supervise borné à 10 secondes/65 536 octets ; controls reste deny. L'annulation du **modèle** est corrigée lignes 33–35 (AbortController transmis).

Le finding d'annulation du runner n'est toutefois pas complètement fermé : ligne 35 retire les handlers avant les deux vérifications, et verify ligne 39 appelle supervise sans signal. Une annulation pendant ces vérifications peut encore laisser leur groupe détaché vivre sans timer parent. Même correction minimale : conserver les handlers jusqu'à finalisation et passer abort.signal à verify. Communiqué immédiatement au parent ; aucune exécution demandée ou effectuée.

## Fermeture finale ciblée v3 — 2026-09-16T13:30:25.628Z

Finding d'annulation **fermé par lecture du code** : handlers SIGINT/SIGTERM conservés jusqu'à finalisation ligne 40 ; abort.signal transmis au modèle ligne 34 et aux deux vérifications ligne 38. Confinement natif de calibration inchangé et toujours fermé. Driver SHA256 59d2759b7331547762de077bc9b47162bdb1334017039f4fdb5e33c6a203dc3b, conforme au gel v3 ef6bc129c2f22159322d6a1132865c992d256055b83f15fd166e72434dc9af14, daté 2026-09-16T13:29:53.245871+00:00. Aucun nouvel appel ou test exécuté par cette revue.

La calibration a effectivement utilisé v2 avant cette fermeture : résultat conservé status=exited, exit=0, accepted=true, elapsedSeconds=27.022, tokens observés=49334, cumul connu=101046. Sa fenêtre d'annulation durant vérification reste une limite historique de v2 ; la correction v3 ne la réécrit pas. Résultat calibration SHA256 c141bbcd0dc2b462ced743d5986e23c44b393e66a3f07bf67271003ce0ee66eb. Gel v3 intervient avant les bras comparatifs d'après sa provenance ; il ne change ni protocole ni entrées ni critères. Cette revue ferme les deux défauts identifiés, sans revendiquer un test d'annulation réel ni un effet de méthode.
