# ADR 029 — Configuration locale et accès consenti de l’agent

Date : 2026-09-21. Accepté sous délégation technique de la mission locale v1.
Complète ADR016/028 et applique le choix d'utiliser l'installation Codex existante.

Studio sonde `codex --version` puis `codex login status` avec le même environnement
filtré que son runner. L'adaptateur ne restitue que disponibilité, version reconnue,
connexion et type ChatGPT/API/inconnu. La sortie brute n'est ni affichée ni persistée :
elle peut contenir des fragments de credentials. Aucune connexion native fournisseur
n'est prouvée par cette seule inspection de l'accès enregistré.

Le contrôleur expose configuration et sonde via actions HTTP same-origin réservées à la
personne ; un jeton worker ne peut pas activer sa propre exécution. Les limites et le type
d'accès consenti sont persistés hors export. Aucun coffre de clés, achat, quota supplémentaire
ou basculement de facturation. L'activation re-sonde l'accès et refuse un type différent du
choix affiché. La reprise n'active pas un autre type d'accès automatiquement.

Le registre d'admission existant n'est jamais réinitialisé. Des limites commencées ne
peuvent pas être augmentées par l'interface. Un registre historique sans configuration
conservée reste bloqué, y compris après enregistrement désactivé et redémarrage. Les seuils
de tokens sont contrôlés entre appels et peuvent être dépassés par le dernier appel admis.
Une consommation inconnue conserve l'arrêt du runner.

La fermeture invalide une configuration en attente ; une sonde négative ou un type changé
suspend le runner. Les résultats tardifs restent refusés par les jobs. Les contrôles JS
candidats sont maintenant asynchrones (a356a35), avec contrôle du contexte/fichiers/état
après attente. La borne globale de dix secondes demeure ; la recette d'annulation prouve
qu'aucune révision ni reçu n'est adopté après annulation.

L'interface doit montrer ce qui est établi et conserver les brouillons de limites malgré
le polling. Le pont hôte reste disponible sans prétendre lancer automatiquement un agent.
La preuve finale du parcours exige encore la recette native, pas seulement ces adaptateurs.
