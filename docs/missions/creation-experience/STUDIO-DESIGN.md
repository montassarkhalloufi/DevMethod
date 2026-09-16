# Référence du Studio et corrections dans l’usage

Le Studio et l’application produite ont deux références distinctes. Le Studio affiche
le vrai produit ; il ne remplace pas celui-ci par le raster d’une maquette. Les chiffres,
photos, avatars et indications de réussite des propositions générées ne constituent
aucune donnée ni preuve d’exécution.

## Décisions visuelles

La composition B, conversation à gauche et application à droite, a d’abord été retenue.
La direction artistique a ensuite été rouverte : C/D, E/F et G/H n’ont pas satisfait la
demande. I (bleu nuit) et J (olive) ont servi de base déléguée. L’utilisateur a signalé
que la méthode était invisible derrière une interface trop proche des builders.

La proposition [K](design/studio-k-method-olive.png) rend visibles le résultat recherché,
la délégation par responsabilité, les choix révisables et les preuves propres à la version.
Elle a reçu l’accord explicite « Oui, développer cette base et l’affiner dans l’usage ».
Cette approbation porte sur la composition ; elle ne transforme pas les contrôles ou
les choix fictifs du raster en observations du produit.

La réalisation Olive a été essayée et conservée en [capture desktop](evidence/studio/olive-desktop.png)
et [mobile](evidence/studio/olive-mobile.png). Les vérifications de navigation et de
débordement sont positives dans leurs dimensions mesurées ; elles ne valident pas l’art.
L’utilisateur a ensuite rejeté la faible distinction des blocs, comparée à du camouflage.
Ce retour invalide le choix de palette comme résultat artistique accepté.

Une [revue distincte de l’agent auteur](evidence/studio/DESIGN-REVIEW.md) retrouve ce défaut
et pointe aussi la priorité du produit sur mobile, la densité et la visibilité des limites.
La nouvelle proposition [L, bleu nuit → indigo](design/studio-l-night-indigo.png) conserve
la composition K, sépare les surfaces navy/slate et réserve le gradient au chrome et aux
actions. Elle est soumise à validation avant application. Ce statut sera actualisé selon
la réponse réelle, sans déduire une validation du silence.

## Contraintes de réalisation

- Le résultat visé reste lisible ; les critères sont neutres tant que leur réussite
  n’est pas établie. Un contrôle de syntaxe ne coche pas les critères métier.
- « Qui décide ? » provient de la délégation effective, avec distinction entre décision
  de la personne et choix confié à l’agent. Les trois modes restent ajustables.
- Les choix actuels, remplacés et hypothétiques sont distingués. Les raisons peuvent
  être examinées sans lire les fichiers internes.
- Application, Code, Choix, Preuves et Reprise partagent un contexte conservé. Le code
  devient éditable à la demande utilisateur ; les versions antérieures restent consultables.
- Un brouillon de code ne remplace pas silencieusement l’application active. Son aperçu
  utilise une autre origine et des données d’essai séparées ; son adoption est explicite.
- Les erreurs observées restent visibles et donnent une prochaine action. Aucun compteur
  ou texte « terminé » n’est une preuve indépendante de correction.
- Une revue visuelle et UX est effectuée aux étapes significatives de cette mission.
  Aucune tâche planifiée ni validation humaine simulée n’est créée.

## Traçabilité

[Historique des propositions](design/studio-proposals.json),
[prompt de L](design/studio-l-prompt.txt), [référence de l’application](DESIGN.md).
Les images sont générées avec l’outil intégré d’image ; les captures de vérification
proviennent du navigateur réel. Les captures personnelles fournies par l’utilisateur
ne sont pas redistribuées dans le dépôt.
