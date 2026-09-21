# Agent local — tranche contrôleur et disponibilité

Implémentation : agent-availability.mjs, agent-control.mjs et raccord server.mjs.
Voir [ADR029](../../../ADR-029-local-agent-control.md). Statut partiel de A ; le panneau
et la recette native doivent encore prouver le parcours utilisateur.

Sonde réelle en lecture seule : 21 septembre2026, 10:02:05UTC, `codex-cli0.147.0`,
accès ChatGPT reconnu avec le même environnement filtré que le runner. Ni credentials
ni sortie brute conservés. Cette observation ne prouve pas un appel fournisseur exécuté.

Tests ciblés intégrés :31 réussis (contrôleur, refus HTTP, annulation candidat, serveur,
accueil et runner avec exécuteurs injectés). Lint/format ciblés réussis. Revue indépendante
initiale : démarrage tardif après close, basculement d'accès au redémarrage, sonde négative
sans suspension. Corrigés avec régressions ; revue de clôture sans nouveau finding bloquant.
Configuration terminée retourne désormais configuring:false.

Contrôles asynchrones repris du commit isolé80fb616 comme a356a35 :708 tests Studio
réussis sous Node24.18.0. La régression utilise le subprocess Node réel et démontre
annulation reçue avant finalisation, résultat tardif refusé409, fichiers conservés.
Aucun test avec adaptateur injecté n'est présenté comme appel natif.

Logs privés : evaluation-private/local-oss-v1/logs/agent-integrated-tests.log,
agent-control-reviewed-tests.log et async-suite-node24.log. Manifest par empreinte joint.
Les seuils restent entre appels, les campagnes historiques restent closes ; la recette
native distincte est [préparée](../NATIVE-PROTOCOL.md), pas encore exécutée.
