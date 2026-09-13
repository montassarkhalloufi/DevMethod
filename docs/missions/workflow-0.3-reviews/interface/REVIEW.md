# Review de l’interface DevMethod

DevMethod · workflow-0.3 · 2026-09-13
Revision: 8d7cd3584c891c04d983f85279e14a2070ab621d + working changes; uncommitted changes: src/review-app.ts, src/review-model.ts, src/review-cli.ts, src/review.ts, src/review-ui.css, src/cli.ts

Conclusion: **Vérification bloquée**
Le défaut de focus observé a été corrigé et revérifié. La validation de livraison reste incomplète, avec ses limites explicites.
Policy: Corriger les défauts confirmés affectant le parcours et vérifier les contrôles de livraison avant publication.

## Scope
- Format de review, rendu sécurisé, navigation clavier/mobile et exports du candidat en cours.

## Exclusions and limits
- Audit exhaustif WCAG avec lecteur d’écran
- Exécution native du workflow conversationnel sur les trois hôtes
- La réouverture directe file:// est bloquée par la politique du navigateur de test ; elle n’est pas annoncée comme vérifiée.
- Les tests de format ne prouvent ni la vérité des preuves fournies ni le comportement d’un agent de review.
- Le mode d’ouverture final reste à choisir avant publication.

## Counts (whole review)
- Critique: 0
- Majeur: 0
- Modéré: 1
- Mineur: 0
- À vérifier: 0
- Réussi: 2
- En échec: 0
- Non exécuté: 0
- Bloqué: 1
- Hors périmètre: 0

## Coverage
- **UI-KEYBOARD — Clavier et retour mobile** (Interface, manual): Réussi. Focus après correction et conservation des filtres observés. Revision: 8d7cd3584c891c04d983f85279e14a2070ab621d + working changes. Evidence: E-FOCUS-AFTER
- **UI-EXPORT — Contenu de l’export HTML** (Interface, manual): Réussi. Résultats, état de sélection et empreinte CSP vérifiés dans le dernier export Chrome. Revision: 8d7cd3584c891c04d983f85279e14a2070ab621d + working changes. Evidence: E-EXPORT
- **UI-REOPEN — Réouverture file://** (Interface, manual): Bloqué. Non vérifiée dans le navigateur automatisé. Reason: La politique de l’outil interdit cette navigation ; aucun contournement effectué. Revision: 8d7cd3584c891c04d983f85279e14a2070ab621d + working changes. Evidence: none

## Findings

### FOCUS-01 — La sélection d’un constat perdait le focus clavier
Modéré / Confirmé / Résolu et vérifié
Severity rationale: La navigation clavier quittait le contenu attendu et rendait la poursuite du parcours difficile.
Location: src/review-app.ts
Impact: L’utilisateur au clavier perdait son point de navigation.
Trigger: Activer un constat avec Enter quand le fragment de lien doit changer.
Expected: Le focus arrive sur le titre du détail et permet de poursuivre au clavier.
Observed: Avant correction, le rendu immédiat était suivi d’un deuxième rendu lors de hashchange ; le titre focalisé était remplacé.
Reproduction:
- Activer R-01 avec Enter depuis la liste.
- Inspecter le focus après le changement du fragment.
Evidence: E-FOCUS-BEFORE
Correction: Mettre à jour le fragment avec history.pushState, rendre une seule fois, puis focaliser le titre. Restaurer aussi le focus après un changement d’onglet.
Trade-offs: Écouter popstate séparément pour les navigations historiques.
Resolution verification: Enter conserve le focus sur detail-title ; ArrowRight cible Correction ; le retour mobile restaure la liste filtrée.
Resolution evidence: E-FOCUS-AFTER
Sources: WAI-TABS
Tickets: PR-19

## Evidence

### E-FOCUS-BEFORE — Observation réelle avant correction
log
Navigateur intégré, 2026-09-13 : activation clavier du constat R-01 puis lecture du focus. Résultat observé : document.activeElement.id vide après le second rendu déclenché par hashchange. Le lien direct devenait \#finding=R-01. Observation manuelle de cette session, pas un journal de test CI.
No external evidence destination.

### E-FOCUS-AFTER — Vérification réelle après correction
log
Navigateur intégré, 2026-09-13 : Enter sur le constat =\> focus detail-title. ArrowRight sur Preuve =\> focus detail-content-correction. En mobile 390x844, retour =\> focus sur le constat choisi ; query=silencieux et confidence=confirmed conservés ; aucun débordement horizontal.
No external evidence destination.

### E-EXPORT — Export Chrome inspecté sur disque
text
Le dernier export Chrome possède review format 1, uiState.selected=R-01, filters.query=silencieux et section=correction. Les données ont été validées et l’empreinte SHA-256 du programme correspond à la CSP. Réouverture navigateur file:// non exécutée : politique de l’outil.
No external evidence destination.

## Sources
- WAI-TABS: Tabs Pattern — W3C WAI; ARIA / DOM APG consulted 2026-09-13; consulted; 2026-09-13; https://www.w3.org/WAI/ARIA/apg/patterns/tabs/. Clavier, focus et association des onglets/panneaux. Compatibility: Guide de conception ; ne certifie pas une conformité WCAG complète. Provenance: Page du site officiel W3C consultée pendant cette session.

## Technologies
- TypeScript 5.9.3 (package-lock.json)
- Node.js 24.18.0 local / \>=22 package (node --version / package.json)

## Tickets
- PR-19 — Livraison du workflow et de la review: https://github.com/montassarkhalloufi/DevMethod/pull/19

Generated from review format 1. Counts describe the whole review. Historical evidence does not certify a later revision.
