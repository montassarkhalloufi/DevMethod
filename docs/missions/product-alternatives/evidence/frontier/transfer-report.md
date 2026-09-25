# Transfert numérique/temporel — 16 septembre 2026

Commit livré : `cd48f8e0dac9beced55cdc518c99e98cd620fa37`, branche `codex/discovery-transfer`, worktree `/private/tmp/devmethod-discovery-transfer`, basé sur `d3d94d82b544d8fb2a8fae1a55785d17730445a1`. Quatre fichiers ajoutés dans le scope ; worktree propre. Aucun changement core, dépôt root, UI, fournisseur ou campagne. Les contraintes et calculs sont fictifs ; aucune personne n'est simulée.

## Gel avant recherche

Le domaine a été écrit après le gel du moteur à 11:10 UTC. Domaine et brief gelés à **11:13:43.818Z** et leurs hashes transmis au parent avant de créer/exécuter l'adaptateur. L'auteur a lu le core gelé et connaît les deux politiques : cela n'est pas une évaluation aveugle de découverte de domaine ni une généralisation statistique.

- `scripts/discovery/transfer/domain.mjs` : `a5ede32c39bcdf5add4284e07b41af5efc88d53703bf337ac5a7c1d2ca67eaad`.
- `scripts/discovery/transfer/README.md` : `1917582faff386ed1b61c73df4a69a449c540fbba80ccb89ccaf08cc8408fe2d`.
- Core `scripts/discovery/search.mjs` : `8b23e894b57013a943a6be2bd31c0bfe0da4d84e60e0e27b34daed14f64aa843`, identique au gel parent.

Domaine/README n'ont subi aucune modification après ce gel. Le témoin ordinaire doit recevoir les deux premiers fichiers avec les mêmes faits ; ni l'adaptateur ni le core ne lui sont nécessaires. Le brief demande explicitement une séquence la plus courte, ses factures intermédiaires et une explication.

## Besoin construit et comportement

Location d'un équipement partagé dans une fenêtre de 120 minutes. Actions : louer 20/40/60 minutes, ou faire une pause gratuite de 20 minutes. Aucun dépassement de fenêtre. Tarif de 300 centimes par tranche commencée de 30 minutes. Variante par séance : arrondir chaque séance avant cumul. Variante quotidienne : cumuler les minutes réellement louées puis arrondir. Objectif commun : produire une facture lisible ; compromis plausibles coût de remise en place versus pénalisation de l'usage fragmenté. Aucune préférence client, équité réelle ou demande du marché n'est établie.

Le domaine ordinaire calcule temps, minutes utilisées, unités et facture en entiers. Ce n'est pas un automate de permissions Gazette renommé. Il reste cependant délibérément petit et discret ; cet essai ne représente pas tous les systèmes temporels, prix, actions continues ou effets externes.

## Premier essai conservé

Première recherche : **11:15:01.693Z**, sans essai précédent ni réglage du domaine après résultat. Sortie brute : `/private/tmp/devmethod-transfer-first-search.json`.

`status=witness`, `reason=difference`, trace **rent 20 → rent 40**. Après la première séance : 20 minutes réellement utilisées, 30 facturées, 300 centimes dans les deux variantes. Après la seconde : 60 minutes utilisées ; 90 facturées/900 centimes par séance, 60 facturées/600 centimes au cumul. Le moteur a admis 5 clés d'état et exécuté 6 transitions. Intervalle local de cet appel : environ **1,80 ms**, mesuré autour de la fonction, hors import et construction. Ce n'est pas le coût de création du domaine ou du produit.

## Vérifications indépendantes

Trois tests métier/transfert nouveaux passent ; avec les 13 tests existants du core/Atelier : **16/16**. Lint/Sonar (seuil existant), format et `git diff --check` passent. Aucune suite globale n'a été relancée ; le parent réalise les gates d'intégration.

- Rejeu de chaque action retournée dans `executeRental`, avec vérification de légalité et comparaison des factures à un oracle arithmétique indépendant.
- Oracle distinct : il calcule directement depuis la séquence les minutes cumulées et les arrondis par division entière. Il n'appelle ni core, ni adaptateur, ni fonction de domaine pour déterminer les factures attendues.
- Énumération indépendante de toutes les séquences légales de longueurs 0 à 6 : nombres par profondeur **1, 4, 16, 51, 104, 112, 64**, soit **352** séquences. Nombres de séquences aux factures finales différentes : **0, 0, 3, 23, 61, 91, 42**. Tous les états exécutés correspondent à l'oracle. Il n'existe donc aucun témoin à zéro ou une action dans cet alphabet ; le témoin retourné de longueur deux est minimal.
- Limite `maxDepth:1` : **bounded/maxDepth**, 5 états/4 transitions, aucune trace, sans fausse équivalence.
- Politiques identiques `daily-total` comparées sous deux IDs différents, `maxDepth:6` : **exhausted/frontier-exhausted**, 39 états/83 transitions. Exhaustion limitée à cette fenêtre, alphabet et clé. Le cas utilise les mêmes règles métier, pas un domaine réécrit après recherche.
- Frontière temporelle exacte, pause gratuite, durée non proposée et dépassement refusés ; entrée initiale inchangée après exécution.

Pins, sorties bornée/équivalente et décomptes sont conservés dans `/private/tmp/devmethod-transfer-verification.json`, calculé à **11:16:07.844Z**.

## Coût d'adaptation et limites

Coût réel exposé : création manuelle d'un domaine ordinaire, d'un brief explicite, d'un adaptateur dédié et de trois tests. Gel→première recherche : **77,875 secondes de calendrier**, incluant écriture de l'adaptateur/tests et formatage ; ce n'est pas une mesure de temps actif, d'effort humain ni un benchmark comparatif. Le contexte avait déjà demandé du travail avant le gel. Tokens/coût monétaire non exposés. Le coût de conception du domaine ne doit pas disparaître derrière les 1,80 ms de recherche. Deux aléas d'outillage sans rapport avec le moteur : worktree pas encore créé au premier accès (créé ensuite) ; `shasum` échoue sur la locale système, hashes calculés avec Node. Aucun échec de recherche masqué.

Le gain démontré est seulement **compatibilité du moteur gelé avec un adaptateur numérique/temporel et production correcte d'un témoin minimal dans une borne**. L'auteur a choisi des observables déjà pertinentes et des règles simples dont un raisonnement ordinaire peut trouver la différence immédiatement. Pas d'avantage d'usage, sélection automatique des bons observables, découverte d'un besoin ou supériorité sur le témoin ordinaire revendiqués.

## Surface utilisable par le parent

`domain.mjs` exporte `RENTAL`, `POLICIES`, `initialRental()`, `rentalActions(state)`, `executeRental(state, action)`, `rentalInvoice(state, policy)`. Tout est synchrone, pur et sans effet externe. UI possible : boutons des actions disponibles, temps écoulé/temps restant, deux factures et trace réelle. L'UI garde son historique ; aucune donnée historique n'est nécessaire aux calculs futurs. `machine.mjs` exporte `rentalMachine(policies=POLICIES)`. La clé contient les trois totaux déterminant les futures actions et observations. Les observations portent uniquement les conséquences numériques ; les libellés différents ne créent pas artificiellement un témoin.
