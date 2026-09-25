# Commencer avec DevMethod sur un projet existant

DevMethod propose deux entrées vers la même méthode : partir d’un besoin pour un nouveau produit, ou reprendre un produit existant à partir de ses sources. L’absence de documents DevMethod ne remet pas à zéro les choix, le code et les données d’un projet.

Dans un dépôt existant, l’[installation du kit](../.agents/skills/project-foundation/SKILL.md#copy-the-folder-into-another-project) ajoute les skills et modèles sélectionnés. `init --dry-run` permet d’inspecter cette installation avant écriture ; des fichiers divergents doivent être rapprochés sans les écraser. Cette commande ne reconstruit pas le contexte et n’importe pas l’application dans Studio. Le parcours d’[import local dans Studio](STUDIO-IMPORT.md) copie les sources dans un workspace distinct, reconstruit un contexte sourcé et conserve une référence importée sans inventer de validation. Son guide précise les exclusions, limites et profils sans aperçu ni exécution.

Une fois la méthode disponible dans l’agent, une demande suffisante est :

> Utilise DevMethod pour reprendre ce projet existant. À partir du dépôt et des sources fournis, reconstruis le contexte utile avec sa provenance, préserve les contrats et les modifications en cours, indique les inconnues qui changent la décision, puis traite ce périmètre : [objectif]. Ne remplace pas les choix acceptés et ne recommence pas les étapes déjà suffisamment documentées.

Le parcours canonique [adopter un projet existant](../.agents/skills/project-foundation/references/existing-project.md) relie les informations reconstruites à leurs sources et révisions. Il distingue observations, déclarations, hypothèses et décisions acceptées. Une lecture du code peut identifier un comportement implémenté ; elle ne constitue pas une approbation produit ou une preuve d’exécution. Les contrats et parcours affectés alimentent les contrôles de départ et la prochaine tranche utile.

Pour les moyens manquants, [choisir un outil ou un service](../.agents/skills/decision-architecture/references/tool-and-service-selection.md) sépare l’accès d’un agent aux diagnostics de ce dont l’application a besoin en fonctionnement : messagerie, base de données, backend ou autre service. Le choix part du besoin et des moyens existants, avec des options locales, open source ou hébergées et leurs interfaces disponibles. Aucun fournisseur, achat, connexion ou déploiement ne découle automatiquement de cette analyse.

Les résultats restent rattachés au code, à l’interface utilisée et à l’environnement effectivement inspectés. La [boucle de correction](../.agents/skills/scoped-delivery/references/bounded-correction.md) conserve l’échec, la cause ou l’incertitude, le changement et la nouvelle vérification. Installer les instructions ou réussir un contrôle documentaire ne prouve ni l’exécution de cette démarche par un agent natif, ni la compatibilité d’un projet importé, ni le bon fonctionnement de ses services.
