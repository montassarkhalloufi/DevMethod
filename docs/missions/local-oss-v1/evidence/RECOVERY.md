# Reprise vérifiée — 21 septembre 2026

Worktree isolé, branche `codex/local-oss-v1`. Source avancée `53b15dfe`,
upstream historique `72d3bc5b`, main `65fbcb92`. Les commits existent dans le dépôt
partagé. Aucun fichier du worktree source n'a été modifié.

Le manifeste et ses quatre artefacts ont été vérifiés par longueur/SHA-256, ainsi que
PROMPT.md. Les deux archives contiennent uniquement les 11 et 30 fichiers réguliers
attendus : chemins relatifs, sans traversée, doublon ou lien. Extraction sans écrasement.
Les 21 entrées source (dont suppressions) et 30 entrées privées ont été vérifiées après
reprise. Les données et le paquet sont conservés sous evaluation-private/, ignoré Git.

Commit de reprise `5f39da5` : corrections MIME MP4/VTT, texte de réouverture du guide,
tests associés, bundles, rapports et preset vocal. Commit de réconciliation `abff07b` :
main intégré à la branche locale, sans fusion vers main ni réécriture d'historique.
Deux conflits résolus : formulation générique de START_HERE issue de PR39 et union des
attributs de conservation des octets. Les ressources Vercel et support de distribution
inspectés sont identiques à main. Les neuf tests ciblés média/guide/ressources passent.

Installation verrouillée : première tentative sans réseau échouée ENOTFOUND ; tentative
avec accès réseau autorisé réussie (319 paquets, audit npm sans vulnérabilité rapportée).
Ce résultat d'audit n'est pas une garantie de sécurité. Build reproduit les bundles sans
diff. Lint et format de la base passent. La suite lancée en sandbox rencontre EPERM sur
les serveurs loopback ; ces erreurs d'environnement ne sont pas des défauts applicatifs.
La suite du candidat suivant a été exécutée avec accès loopback, sans fournisseur natif.
