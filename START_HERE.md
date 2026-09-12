# Démarrage du kit

Le dossier contient six skills indépendants. Copier `.agents/skills/` dans le projet en préservant ses fichiers existants. Si une version existe déjà, comparer les changements avant de la mettre à jour. Garder PROJECT_PROFILE.md et compléter depuis le projet la stack, les commandes, le scope, les permissions de déploiement et les exigences de données avant adoption. ENGINEERING_POLICY.template.md conserve la politique fournie; la fusionner avec CONTRIBUTING.md et les instructions existantes.

Dans Codex, commencer par `$project-foundation status`. Dans Claude Code ou Cursor, commencer par `/project-foundation status`. Pour une demande libre :
> Utilise le skill project-foundation sur ce projet. Lis les instructions et sources existantes, complète le profil sans réinventer les décisions, puis réalise le périmètre suivant : [mon objectif]. Applique seulement les modules pertinents. Préserve la maquette validée, les frontières d'architecture et les règles React. Avance jusqu'à un résultat vérifié dans ce périmètre.

L'installateur copie la méthode et ses modèles vierges, pas le contexte du projet adopté. Conserver séparément le profil rempli, les décisions, tickets et instructions. Le manifeste décrit l'installation initiale : les adaptations locales changent normalement ses empreintes. Pour mettre à jour, installer dans un dossier neuf puis comparer les changements.

Si les skills ne sont pas découverts automatiquement :
> Lis .agents/skills/project-foundation/SKILL.md et ses seules références utiles, puis réalise : [mon objectif].

AGENTS.foundation.md fournit un fragment à fusionner dans les instructions existantes. Il ne remplace jamais un AGENTS.md. Le kit ne contient pas les skills tiers Vercel : appliquer les versions déjà approuvées du projet; leur ajout éventuel est distinct.

Exemples :
- « Reprends ce ticket et livre sa tranche complète. »
- « Voici la maquette approuvée : implémente cette page et vérifie desktop/mobile. »
- « Compare ces deux architectures avec mon budget et propose un ADR. »
- « Corrige la séparation vue/hooks/métier de cette feature, sans refonte globale. »

Ce kit réduit le cadrage répétitif; il ne prouve pas à lui seul la qualité de l'application ni sa préparation à la production.
