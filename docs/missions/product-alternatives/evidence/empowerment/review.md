# Revue indépendante du candidat empowerment — 16 septembre 2026

**Clôture par l'auteur après cette revue :** la précision demandée sur `cached_input_tokens` est appliquée dans EMPOWERMENT et le diagnostic de sandbox : « tokens d'entrée lus dans le cache », déjà inclus dans l'entrée. Aucun chiffre, résultat ou code n'a changé pour cette correction. Le rapport ci-dessous et ses pins identifient les fichiers examinés avant cette retouche ; ils ne constituent pas une nouvelle exécution des contrôles.

Lecture seule du checkout `d14e64493bc02ed0470e8b65b72df3498706d6ac` avec changements non committés. Révision effectivement inspectée liée aux SHA-256 ci-dessous, capturés à **12:35:43.924 UTC**. Aucun fournisseur, nouvelle calibration, outil Codex réel, test ou modification produit lancé par cette revue. Les suites352 et logs7/7 sont des preuves antérieures du parent, pas des exécutions de ce reviewer.

**Aucun finding bloquant trouvé dans ce delta.** Une correction factuelle mineure est recommandée avant gel : `docs/missions/product-alternatives/EMPOWERMENT.md:50`, remplacer «40 704 tokens cachés» par «40 704 tokens d'entrée lus dans le cache». Le champ réel est `cached_input_tokens` ; il ne désigne pas des tokens cachés. Le calcul total51 712 et l'inclusion du cache dans50 760 sont corrects. Cette remarque ne demande aucun nouvel appel.

## Conclusions et comparateur

Les trois modifications de skills répondent au biais précis : une partie du guidage était déjà fournie comme intrant aux contrôles d'exécution. `product-decisions.md:5` demande désormais d'évaluer la chaîne personne–agent, maintient l'alternative simple et ne suppose aucun bénéfice par description. `exploration.md:9` distingue mêmes sources/capacités et synthèses construites comme sorties ; il n'interdit au témoin ni recherche ni clarification. Les deux champs ajoutés à OPPORTUNITES rendent visible le fournisseur de l'intrant et l'effort réellement observé, sans imposer une nouvelle étape ou un score.

EMPOWERMENT conserve l'humain comme décideur, distingue quantité de questions et qualité du contrôle, et traite séparément résultat, préparation, reprise et coût. Les annotations dans maintenance/RESULTS, FRONTIER, PLAN, RECONSIDERATION et product-alternatives/RESULTS réduisent la portée des comparaisons passées sans réécrire leurs résultats. Le moteur Atelier inadéquat au temporel, l'annulation programmable ordinairement et les séries interrompues restent distincts. Aucun effet humain validé n'est annoncé.

Le futur comparateur possède les mêmes sources et capacités, peut créer son propre contexte et conserver son parcours recommandé. Les prérequis BMAD manquants ne peuvent être convertis en infériorité. Les réponses humaines inconnues restent inconnues. L'exigence d'une observation humaine pour compréhension/effort ne suspend pas les contrôles techniques préalables. Ce n'est donc ni une victoire par redéfinition ni un témoin artificiellement appauvri.

## Coûts et nouvelle admission

Les sept événements publiés contiennent une fin de tour avec50 760 entrées,952 sorties,40 704 entrées de cache. Ils ne contiennent aucun événement de commande exécutée. Le texte distingue le récit de l'agent du stderr : erreur réelle de helper filesystem, hunk invalide distinct, plus erreurs de cachemodèle. L'échec produit est conservé malgré exit0/finalResponse. Le contrôle indépendant n'est pas présenté comme une commande de l'agent.

Les47,218s, le seuil20 000 souple et l'arrêt après51 712 sont explicités ; aucune égalité avec l'ancien plafond100 000 du pilote maintenance n'est prétendue. Le résultat lie sa calibration distincte à son protocole/pilote d'origine ; les nouvelles corrections ne lui donnent pas rétrospectivement un succès. La dépense monétaire reste inconnue et les consommations anciennes inconnues restent inconnues.

Le rapport d'installation sépare dépendances, init, extensions optionnelles et rendu statique. L'échec puis correction BMAD restent visibles. Les commandes parallèles ne sont pas additionnées comme temps comparatif, l'effort opérateur-agent est déclaré non mesuré et aucun gain utilisateur n'est extrapolé. Cette revue n'a pas relancé les installateurs ni revérifié les clones/manifests privés ; elle examine la cohérence et la portée du rapport publié.

Les textes gardent les campagnes anciennes closes et réclament un protocole prospectif pour toute admission nouvelle. Ni la correction ni ce rapport ne donnent une autorisation de relance. Les pins de pilote contrôlés par `preflight` rendent en outre un ancien gel incompatible avec le code changé.

## Contrôle préalable et régression

`scripts/native-maintenance.mjs:267–306` essaie un vrai second sandbox local exécutant seulement `/usr/bin/true`, sous le profil externe. Un échec de création, timeout ou status non nul lève avant le test de configuration Codex. Ce contrôle vérifie une condition nécessaire révélée par l'incident ; son succès n'est pas une certification de tous les futurs outils. Le test de configuration restant conserve l'option typée volontairement invalide et exige le diagnostic attendu, pas une exécution modèle valide.

Ordre réellement lu dans `dispatchMaintenance` : contrôles de gel/version/authentification, état initial et refus de lectures protégées ; shell ; **maintenanceConfigPreflight ligne402** ; disponibilité des sorties ; **reserveRun ligne404** ; marqueur ; supervise. Le rejet de composition intervient donc avant ledger et dispatch. Cette lecture d'ordre complète les logs ; la nouvelle régression n'exerce pas dispatchMaintenance avec un vrai modèle.

`tests/native-maintenance.test.mjs:143–189` écrit un faux `codex` shell dans le worker, le met en tête de PATH puis appelle seulement maintenanceConfigPreflight. `codexEnvironment` conserve cePATH ; aucun chemin absolu vers un Codex réel n'est substitué. Le script écrit un marqueur et renvoie uniquement le diagnostic de configuration invalide. Sur la branche où l'imbrication est refusée, le test exige l'exception et l'absence du marqueur. Sur un hôte qui l'autorise, il teste la réussite du contrôle avec ce même faux programme. PATH est restauré. Ni authentification, supervise, ledger ni fournisseur ne sont appelés par cette régression. HorsmacOS, elle est explicitement ignorée : pas de garantie Windows/Linux revendiquée.

La preuve rouge retenue échoue sur «Missing expected exception», ce qui cible l'ancienne absence du contrôle ; la preuve verte contient sept contrôles réussis. Aucun besoin de répéter ces exécutions pour cette relecture. Limite : la relation red/green est examinée par sources et logs fournis, sans nouvelle reproduction ni preuve cryptographique d'exécution.

## Pins des fichiers inspectés

Les lignes et constats ci-dessus portent sur ces bytes ; changements ultérieurs à relire selon leur portée. Les références scientifiques externes de fin de document n'ont pas été réauditées dans cette passe ; leur présentation les traite comme antériorités limitées, pas comme résultats DevMethod.

| Fichier | SHA-256 |
|---|---|
| `.agents/skills/decision-architecture/references/product-decisions.md` | `e692eda30c6395c810932050bc774f9595bcb308e710623144fd20558fb8c61c` |
| `.agents/skills/project-foundation/references/exploration.md` | `038a02b1c1cc35fd6b1de8c4b84fc1e8811368d8acc4691b3ddf16d886d22ae5` |
| `.agents/skills/project-foundation/assets/OPPORTUNITES.md` | `18aee528f60cefc0a2198b5103c963d04030a7e9ef3950dae6fa6990f5671d4c` |
| `scripts/native-maintenance.mjs` | `0e7eec4bcd866febe91c463c08f66626337499e3cb6b19b66527c7de530b4a02` |
| `tests/native-maintenance.test.mjs` | `bbd7a9e3fd5cabd3cc203f11c7e0615ee8f72a0bc40ce30b18fe37d0ee2f1d04` |
| `scripts/hosts/codex.mjs` | `bbfb28f3e0bb1b925845a6a18c4582a7d8d280f5f35a440545ff5e069e020ee8` |
| `scripts/native-journey-smoke.mjs` | `3979b390e0c71ad452387708572bbd4a1d663993f71909b9a126c2c1d9fb9a45` |
| `docs/missions/product-alternatives/EMPOWERMENT.md` | `f3788bb7133acf2dfe3918a55118d790eba5dfcdb5d2c4af166fbf89e91cac70` |
| `docs/missions/maintenance-value/RESULTS.md` | `7ff32310b573a9a07696279d40ada8dd13eec7437229c6001c658ada8f12066b` |
| `docs/missions/product-alternatives/FRONTIER.md` | `58d5c11aceadaa34fd9e2927b22d5399ffc1dbcf40e8d849685b697f96d09b22` |
| `docs/missions/product-alternatives/PLAN.md` | `d302f4e045d35db9eb1f1b08c5b035544d903a66ab857c257d9b40abf8b85301` |
| `docs/missions/product-alternatives/RECONSIDERATION.md` | `c857f8b7fd211459165360ca46e9110d2e87e3746ee55f40f65e4012d3e8e4a0` |
| `docs/missions/product-alternatives/RESULTS.md` | `7109d850bbf8c23ce400b12ebf73c0cb05eebf584c0673389e719b759ca112d7` |
| `docs/missions/product-alternatives/evidence/empowerment/installations.md` | `2df19fc627668fe9b6b71bc9038a1f48af21dad47aa668f72bad60d226b73458` |
| `docs/missions/product-alternatives/evidence/empowerment/admission-result.json` | `577cf00adb532ba78f5981860ed1fe2c6124a5b8766f0d687beb9ee408c706e3` |
| `docs/missions/product-alternatives/evidence/empowerment/admission-events.jsonl` | `199b46ddbd59649f3ed0c2ab83f4c07bc80bb0980e40f50c53c3d9c07f6d880f` |
| `docs/missions/product-alternatives/evidence/empowerment/admission-stderr.txt` | `f34db72436e7e2f41ad2743b52e365b6e163b23bff395ace069a0eb07aa7669f` |
| `docs/missions/product-alternatives/evidence/empowerment/preflight-red.txt` | `9de6f18e3a5f045d76522d274c08c71485bbcb02086cd32216d7a3a9b09cb0d3` |
| `docs/missions/product-alternatives/evidence/empowerment/preflight-green.txt` | `60d853b576b4b818d6a731e64c02aa364b6becf5b89c66231ab2ff28564a1203` |
