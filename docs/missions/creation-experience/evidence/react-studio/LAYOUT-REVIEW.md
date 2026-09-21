# Studio M — vérification navigateur du 16 septembre 2026

Référence : [maquette M](../../design/studio-m-night-hierarchy.png). Chrome réel,
Studio local 4342 et application 4343. Les captures montrent le projet enregistré ;
aucun message fictif n’a été ajouté pour reproduire le contenu de la maquette.
L’Agenda retenu pour l’application garde son design propre.

## Disposition observée

À 1562 × 762 pixels CSS, la première vérification laissait seulement 141 pixels à
la discussion et 258 à l’aperçu. La correction compacte les blocs fixes sur les
écrans peu hauts : discussion 340 pixels, aperçu 400, saisie 134, objectif 64 et
preuves 66. Les statuts de brouillon et d’agent restent visibles ; les explications
secondaires sont accessibles par des disclosures. Les détails ouverts peuvent
prendre plus de place.

- [Avant](studio-m-before-compact.png) et [après](studio-m-after-compact.png).
- Glissement réel de la séparation : 452 → 372 pixels. Flèche droite : 388 pixels.
  Après rechargement : 388 pixels. Le texte du brouillon est resté identique.
- Défilement de la discussion observé à 692,7 pixels ; workspace à zéro. Les deux
  zones ne partagent pas leur défilement.
- Application puis Code agrandis ; retour à la disposition conservant l’instance
  du produit et le brouillon. [Code agrandi](studio-m-code-expanded.png).
  Ce mode occupe la fenêtre du Studio, il n’utilise pas la Fullscreen API native.
  Le bouton de retour reste accessible ; Échap à l’intérieur de l’iframe produit
  ne remonte pas nécessairement au shell.
- Petit écran observé à **354 pixels CSS** (override demandé 390, zoom navigateur
  conservé) : document de même largeur, séparation masquée, navigation empilée.
  [Capture mobile](studio-m-mobile.png), antérieure à la correction compacte
  ciblant uniquement le bureau de faible hauteur.

## Interactions de l’application après revue Vercel

Révision `336de365-3d32-476e-9577-5d5798829ed8` : filtre Couture sélectionné,
URL `?category=sewing`, une carte affichée, sélection conservée au rechargement.
Les ancres conservent le paramètre. Retour arrière/avant vérifié séparément dans
les tests React/JSDOM, pas compté comme parcours navigateur ici.

« Annuler » ouvre la [confirmation](app-cancel-confirmation.png), puis « Garder mon
inscription » la ferme sans supprimer l’inscription. Contrôle répété à 354 pixels
CSS : [confirmation mobile](app-confirmation-mobile.png), largeur document 354,
bloc de confirmation 272,7 pixels. Les quatre inscriptions et l’attente ont leur
empreinte inchangée dans `journey.json`. Aucun clic sur la confirmation destructive
n’était nécessaire à cette vérification.

## Portée

Les ratios de la palette sont dans [PALETTE-REVIEW.md](PALETTE-REVIEW.md) et
`palette-contrast.json`. Les captures établissent un rendu et des interactions
précises, pas une conformité WCAG complète, une fidélité pixel à pixel ou une
validation humaine. Les cartes de décisions utilisent les informations réelles
présentes : aucun faux état « Un choix évolue » n’est imposé à un projet sans
cette décision en attente. La revue React et ses limites figurent dans
[VERCEL-REVIEW.md](VERCEL-REVIEW.md).
