# ADR 020 — Plan et avancement d’une demande

17 septembre 2026. Accepté sous la délégation technique existante et la demande explicite de montrer en direct le plan et l’avancement après le chantier méthode. Complète [ADR 016](ADR-016-local-creation-studio.md). Périmètre local, aucune nouvelle exécution fournisseur autorisée.

## Choix

Conserver le serveur local, les jobs et le polling existants. Ajouter un instantané de progression durable par job, séparé de l’état métier versionné, et une vue React dans le fil. Une actualisation toutes les deux secondes pendant une demande en attente/en cours est suffisante pour cette interface locale ; ce n’est pas une garantie de temps réel strict. La lecture reprend quand l’onglet redevient visible. Un flux SSE réduirait cette latence mais ajouterait reconnexion, diffusion et gestion de sockets sans besoin démontré. Réexaminer pour plusieurs opérateurs simultanés, fréquence élevée ou latence exigée inférieure à la seconde.

Écrire chaque action dans `studio.json` provoquerait des conflits d’édition et des rendus inutiles. Utiliser seulement les logs privés du fournisseur manquerait de portabilité et exposerait trop de contenu. Le journal dédié reste borné et validé, avec une interface indépendante du fournisseur. [Contrat et usage](STUDIO-PROGRESS.md).

## Garanties et limites

| Risque | Frontière et garantie | Vérification |
| --- | --- | --- |
| Une action perturbe le brouillon ou l’approbation | Stockage séparé : ni `state.version`, ni empreinte de contexte, ni données applicatives modifiées | Tests journal + finalisation et UI avec saisie/focus conservés |
| Réessai ambigu ou publication tardive | `eventId` et empreinte persistants ; collision 409 ; nouveaux événements réservés à la demande running sur la base actuelle. Rejeu identique accepté | API token, collision, restart, terminal et base obsolète |
| Faux achèvement | `ready` signifie résultat disponible. Plan déclaré et action exécutée ne créent aucun check ; étapes non terminées conservées | Tests UI terminal et résultats canoniques |
| Réponse A remplace B | Une souscription par demande visible, annulation/identité et séquence ; requêtes sérialisées, échéance de dix secondes | Réponses différées et retry contrôlés en JSDOM |
| Journal sensible ou sans borne | Champs limités, chemins relatifs à l’application, aucun accès aux logs bruts par API ; 40 étapes, 200 actions récentes, 2 000 publications | Validation, dépassements, chemins et liens symboliques |
| Serveur arrêté | Écriture atomique locale ; jobs running deviennent interrupted au redémarrage ; journal reste consultable | Relecture après redémarrage ; aucune relance implicite |

Un seul processus écrivain par workspace, verrou conservateur inchangé. Ce journal n’est pas un bus distribué. Le token worker existant accorde le rôle agent, sans authentifier physiquement son nom. Les plans et lectures déclarées restent des affirmations de cet agent. Le CLI local fournit les actions reconnues ; les commandes et sorties brutes ne sont pas exposées. Aucun branchement automatique aux outils d’un hôte externe : celui-ci publie explicitement via le bridge.

L’UI garde les détails repliables, l’historique consultable et la saisie dans son panneau actuel. Elle ne déplace ni focus ni scroll pour chaque événement. Le fichier peut être ouvert seulement dans une révision livrée du même job qui contient ce chemin ; le journal n’expose pas un éditeur du staging actif. Les anciens jobs restent lisibles sans inventer de plan historique. Pas de nouvelle infrastructure, abonnement, télémétrie ou connexion externe.
