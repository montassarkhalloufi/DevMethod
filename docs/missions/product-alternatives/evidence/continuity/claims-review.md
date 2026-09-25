# Revue ciblée des claims de continuité

16 septembre 2026. Lecture seule des fichiers du checkout root, HEAD `b590fb1ad6360a9c9d5366b622299cd94c82af5d`, avec dossier continuity et paragraphes de mission non encore committés. Les SHA ci-dessous identifient les octets examinés, pas seulement HEAD. Aucun appel natif, provider, benchmark ou test relancé.

## Conclusion

**Aucune incohérence actionnable trouvée dans le périmètre demandé.** Les textes séparent correction de transmission, exécution native partielle et bénéfice humain non mesuré. Ils n’attribuent ni succès global ni infériorité comparative à BMAD ; DevMethod et Spec Kit restent non admis après son arrêt. Les passages antérieurs dans REPRISE sont sous leur horodatage historique et ne remplacent pas le dernier checkpoint.

## Vérifications directes

- Les objets calibration et BMAD du résultat public sont égaux aux deux result.json originaux. La calibration terminale indique 48 818 entrée + 516 sortie = 49 334 ; les 28 160 tokens cache font partie de l’entrée. L’ancien ledger indique 50 760 + 952 = 51 712. Somme connue correcte : 101 046. Usage BMAD null ; total et prix inconnus restent null.
- Le JSONL calibration possède un turn.completed avec ces chiffres. BMAD ne possède aucun événement terminal d’usage : timeout de 120.008 s, réponse finale absente. Seuls calibration et BMAD ont un dispatch et un résultat dans les contrôles. Rien ne présente les deux autres conditions comme exécutées.
- Hashes des originaux vérifiés : calibration aa478229b7ba23a03e0ae18c3559244bdd709a9818dbcd670c86a64e1750b05b ; BMAD 1d2d057556d3f852b3eb66c032bc7323a3ddea62e41eb0fc078b70f85897a64e. Le protocole privé vaut e2fad5670e83294cc5db7d9ac6a47efbb5852b0051677c6b4255b5827897706e, comme publié ; commonTask est identique.
- Les trois commandes calibration et 27 commandes BMAD terminées sont conservées dans les traces dérivées avec commande, exit code et SHA exact de la sortie originale. Les messages agent sont identiques. L’identification de l’omission history/situation est explicitement présente dans le message natif BMAD ; ce n’est pas une attribution rétrospective du rédacteur.
- Le memlog publié est byte-identique au fichier réellement écrit : sept entrées. Aucun SPEC.md n’existe dans ce dossier. Les deux passes de validation sont décrites comme prévues, puis explicitement non atteintes dans les résultats ; aucune self-validation terminée n’est inventée.
- Les deux tailles du workload de test sont distinguées de la mesure HTTP séparée ; aucune taille n’est présentée comme consommation de tokens. La fixture ancien format est explicitement reconstruite. Le résultat ne présente pas les choix fictifs/agents comme préférences humaines.

## Limites de cette revue

Il s’agit d’une revue des claims et de leur provenance, pas d’une nouvelle validation de la politique sandbox, d’une certification de tous les helpers, d’un audit exhaustif des inputs ni d’une nouvelle QA du produit. Aucun nouveau test de serveur, navigateur, package ou CI n’a été lancé. Les claims de gates larges/live server/PR restent attribués à leurs preuves de livraison et à la revue du parent ; cette lecture ne les réexécute pas. La consommation inconnue de l’appel interrompu empêche de donner un total réel. Le contenu est relu avant son commit de livraison ; toute modification ultérieure des claims doit être rattachée à ses propres octets.

## Pins examinés

- `docs/missions/product-alternatives/evidence/continuity/REPORT.md` : `af76aafb45a2bcd792c10940f39bf8eb813a9e9546ff887440bc63798268d771`.
- `docs/missions/product-alternatives/evidence/continuity/framing-result.json` : `ba27c82c4c1f5ff68869a008ec0794c3434d71546e2b2b7a73239380e6fe1e84`.
- `docs/missions/product-alternatives/evidence/continuity/framing-protocol.json` : `a6bf54fe64afb46c0083699f79fd3ff552846b19a60a9d52de967434c7af6b57`.
- `docs/missions/product-alternatives/evidence/continuity/bmad-events.jsonl` : `e659c7f80d58ffb14190ee4d425aae5cee59bd78169e36e63d72d7c0b8b82a70`.
- `docs/missions/product-alternatives/evidence/continuity/bmad-memlog.md` : `4801d433f058da97cf3a3f61e2e1abf141c23dc22c070c205a496d5199ed09e6`.
- `docs/missions/product-alternatives/EMPOWERMENT.md` : `2ca4d3b9dcd86c9166a7902a36cf7b3fec1247006ed57d22a31e4d6ab37fc929`.
- `docs/missions/product-alternatives/RESULTS.md` : `0653819b646a3e704c7d6896e960fb23135997ef4246e3efb224359e4360a694`.
- `docs/missions/product-alternatives/REPRISE.md` : `d2944cefdf458cbd472a118a1a196135c5e1b3acdedf2228d71b69182eca7f70`.

Inventaire lu des sous-arbres product/ et sources/ : [('bmad', 879), ('devmethod', 879), ('spec-kit', 879)]. Égalité des contenus : True.
