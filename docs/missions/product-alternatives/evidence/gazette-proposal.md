# La Gazette — proposition de retrait local et reprise de relecture

Auteur : l’agent assistant `/root/native_admission`, le 16 septembre 2026. Il s’agit d’une proposition produite à partir d’un handoff réel de l’atelier, pas d’une réponse JSON préfabriquée, d’une préférence utilisateur ou d’une observation de terrain.

Entrée : [paquet transmis par l’interface](gazette-request.json), `baseRevision: 2`. Sortie à importer : [devmethod-atelier-gazette-proposal.json](gazette-proposal.json). Aucun fichier de session, de réserve ou du dépôt parent n’a été modifié ; aucun service de modèle CLI ni publication n’a été utilisé.

## Ce que la demande établit

Lou doit pouvoir retirer localement un article publié lorsque Nina et Sam sont absents, puis le renvoyer en relecture. Le paquet conserve un essai où Nina ne peut pas relire dans le bureau mais le peut entre pairs, ainsi qu’un nouvel article de Nina, « Le jardin ouvert samedi » (`item-a39d96a8`). La direction enregistrée est `relecture-pairs`, avec une raison qui précise expressément qu’il s’agit d’un choix fictif fait par l’agent. Elle est déjà marquée à reconsidérer.

La proposition conserve cette différence, ce choix et sa raison. Elle ne déduit pas que l’utilisateur préfère les pairs et ne choisit aucune nouvelle direction. Les quatre articles présents dans chaque lane, y compris celui créé depuis le navigateur, restent intacts à l’import.

## Options examinées et choix de proposition

| Option | Apport | Compromis |
| --- | --- | --- |
| Retrait directement vers `submitted` | Une seule action, relecture immédiatement demandée | Fusionne le retrait et la décision de renvoyer ; ne montre pas la pause entre les deux intentions |
| Retrait vers `draft` | Réutilise tous les états existants | Présente de la même manière un brouillon inédit et un article retiré ; l’événement garde la différence, mais pas l’état visible |
| **Nouvel état `withdrawn`, puis Soumettre** | Rend visibles les deux actions demandées, sans effacer le parcours antérieur | Ajoute un état et une action ; l’article peut rester retiré tant que personne ne le renvoie |

Je propose la troisième option pour l’essai, sans prétendre qu’elle est préférable pour toutes les rédactions. Les quatre états existants et leurs libellés restent inchangés ; `withdrawn` s’ajoute avec le libellé « Retiré localement ». L’action stable `submit` accepte désormais aussi cet état. L’action nouvelle `withdraw` est commune aux deux variantes. Les actions `create`, `review` et `publish` gardent leurs règles exactes.

## Deux organisations encore distinctes

**Bureau.** Nina, Sam et Lou peuvent retirer. Lou reçoit un droit de retrait sans recevoir un droit de publication. Les quatre membres peuvent ensuite renvoyer en relecture ; Sam et Lou restent les relecteurs habilités, Nina et Sam les responsables de publication. Le retrait et son renvoi peuvent donc se faire sans Nina ni Sam, mais une remise en publication pourra attendre leur retour. Cette attente est le compromis conservé du bureau, pas un échec masqué.

**Pairs.** Les quatre membres peuvent retirer et renvoyer. Chacun garde ses droits de relecture et de publication, avec l’interdiction commune de relire son propre texte. Cette répartition donne davantage de relais, mais permet également à chaque membre de suspendre un article d’un autre. Les événements rendent l’acte attribuable ; ils ne règlent pas la légitimité d’un retrait contesté.

Les deux variantes gardent leur design board/liste et leur accent. Le nouvel état rend la suspension visible dans chacune. Cette évolution ne change pas le contenu des articles et n’ajoute ni écran d’authentification ni logique cachée.

## Hypothèses et décisions encore ouvertes

La demande impose que Lou puisse agir en l’absence des deux autres ; elle ne dit pas que ce droit doit exister **uniquement** pendant leur absence. Le moteur ne représente ni présence, ni calendrier, ni délégation temporaire. Je propose donc un droit permanent et l’annonce dans les deux variantes. S’il faut réellement une autorisation conditionnée à l’absence, ce JSON ne la satisfait pas : il faudrait définir puis représenter cette condition, sans prétendre l’inférer.

Le retrait peut porter sur un article dont Lou est propriétaire (`otherOwner:false`) : retirer et relire sont deux responsabilités différentes. Après renvoi, `review.otherOwner:true` continue d’interdire sa propre relecture. Le droit de retrait du bureau est ici proposé à Nina, Sam et Lou ; celui de Camille n’y est pas ajouté. Le collectif peut accepter ou modifier ce périmètre sans perdre les essais.

Deux arbitrages restent à discuter : souhaite-t-on le droit permanent ou une délégation temporaire réelle ? Faut-il exiger un motif de retrait, et qui tranche une contestation ? Le contrat v1 ne peut pas rendre un motif obligatoire ni représenter cet arbitrage ; aucun faux motif n’a été écrit dans les observations.

## Limites réelles

Retirer signifie uniquement changer l’état d’un record local. Aucun contenu n’est supprimé ou masqué sur un site réel, dans un cache ou chez un tiers. L’atelier ne vérifie pas l’identité de l’acteur, la qualité de la nouvelle relecture ou la correction d’un texte. Il n’a ni texte intégral, ni quorum, ni notification, ni horodatage réel. Un changement d’état ne certifie aucune de ces propriétés.

Les sources sont le handoff et le [contrat local](../CONTRACT.md), avec lecture de [domain.mjs](../../../../scripts/atelier/domain.mjs) pour la compatibilité. Aucune recherche extérieure n’était nécessaire pour déterminer ces règles ; tous les faits métier demeurent fictifs et aucune enquête utilisateur n’est revendiquée.

## Vérification effectuée

Sous Node 24.18.0, `applyProposal` accepte le JSON sur une copie en mémoire reconstruite à partir du projet, de la révision, des lanes et de la décision fournis. Le résultat passe à la révision 3 ; les lanes, leurs records et événements, les identités, les données initiales, le choix et sa raison sont strictement conservés. Le choix reste `reviewNeeded:true`. Réappliquer la proposition contre la révision 3 est refusé comme obsolète. Les objets d’entrée et les octets du handoff restent inchangés.

Le paquet ne contient pas l’historique complet de la session ni sa situation courante séparée du scénario enregistré dans la décision. Le contrôle ci-dessus porte sur les champs effectivement transmis ; il ne prétend pas avoir audité un fichier de session complet ou le navigateur. Le moteur d’import reste responsable de préserver le reste du contexte existant.

Un banc de vérification supplémentaire en mémoire prépare des publications fictives, puis exécute 21 actions : retrait par Lou, refus de publication directe depuis Retiré, renvoi en relecture, et retrait de son propre article suivi du refus de sa propre relecture. Les deux organisations passent ces vérifications. Les actes préparatoires de Nina/Sam simulent la publication antérieure ; les deux actions demandées — retirer puis renvoyer — sont effectuées par Lou seule. Ce sont des contrôles de règles, pas de nouveaux essais navigateur ni une observation d’utilisateurs.

SHA-256 du handoff : `c1a8e2f5e28c8e28e3c663eb0935fe98f2e7d67d16d0a26e96bebaf16c6d85fa`.

SHA-256 du JSON proposé : `03f1ad9260d2ca0f584d477e9c2eb743387874a5db2f4a148c08103f4d831891`.

Le prochain geste concret appartient à l’atelier : importer ce JSON contre la révision 2, puis essayer Retirer et Soumettre avec Lou. Si la session a évolué entre-temps, demander une proposition sur sa nouvelle révision ; ne pas modifier manuellement `baseRevision` pour forcer l’import.
