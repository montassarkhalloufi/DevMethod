---
name: design-to-code
description: Translate an approved mockup or design direction into coherent product UI and verify visual and interaction fidelity. Use for reference-driven screens, design-system adoption and UX audits; distinguish design creation from implementation of an already locked direction.
---

# Design to Code

Une maquette approuvée est un contrat visuel. Ne pas « améliorer » sa direction sans demande. Les contraintes produit, d'accessibilité et de sécurité restent applicables; rendre visible un conflit plutôt que le masquer.

## Exécution
1. Lire et voir réellement la référence : écran/version, viewport, tokens, hiérarchie, contenu, médias et états. Si elle manque, retrouver l'asset indiqué; n'inventer ni sa géométrie ni un verdict de fidélité.
2. Identifier le parcours, l'action principale et les états nécessaires. Lire [references/ux-contract.md](references/ux-contract.md).
3. Extraire les tokens et primitives déjà présents : typographie, couleurs sémantiques, espacements, grille, contours, rayons, ombres, iconographie. Conserver la bibliothèque UI en place.
4. Mapper référence → composants → données → interactions. Séparer primitives neutres et composants métier; créer uniquement ce dont l'écran a besoin.
5. Implémenter le comportement réel demandé et les états vides/chargement/erreur utiles. Étiqueter les fixtures de prototype; ne pas laisser un bouton afficher un faux succès.
6. Rendre dans le navigateur et comparer aux mêmes dimensions desktop/mobile. Vérifier lisibilité, défilement, interactions, clavier et focus. Une compilation verte ne valide pas l'apparence.
7. Corriger les écarts prioritaires puis reporter les vérifications réellement faites avec [la fiche](assets/UI_ACCEPTANCE.md). Ne jamais annoncer « pixel perfect » ou « 100 % fidèle » sans base mesurable.

Si la demande concerne React, résoudre react-feature-engineering seulement pour la partie implémentation. Ce skill n'impose pas de framework, de palette ou de style commun aux projets.
