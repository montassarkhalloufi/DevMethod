---
name: react-feature-engineering
description: Implement or refactor React features with clear view, custom-hook, pure-logic and server boundaries. Use for React or Next.js feature code and architecture review; preserve the project's framework version, approved UI and installed Vercel guidance.
---

# React Feature Engineering

Préserver les conventions du projet, les décisions acceptées et la version réellement installée. Compléter les skills Vercel approuvés; ne pas les remplacer ni importer automatiquement leur dernière version.

## Placer chaque responsabilité
| Responsabilité | Emplacement conceptuel |
|---|---|
| Routes, layouts, assemblage, providers | app |
| Vue métier, props typées, callbacks d'intention | feature/components |
| État React, interaction navigateur, subscription cohérente | feature/hooks |
| Transformation pure et view model | feature/model ou fonction nommée |
| Règle métier / calcul faisant autorité | domaine / cas d'usage |
| Accès initial serveur et actions autorisées | feature/server ou frontière serveur |
| Primitives stables sans sens métier | shared UI |

Créer seulement les dossiers nécessaires et respecter les noms existants. Dépendances : app → features → shared/contrats; jamais l'inverse, ni import profond entre features.

## Vue, hooks et effets
La vue décrit le rendu et émet des intentions. Garder son état visuel local simple. Mettre orchestration réseau et SDK hors des composants de présentation. Une composition serveur peut appeler les services serveur sans hook artificiel.

Un custom hook encapsule une responsabilité React concrète : useDecisionDraft, usePhotoUpload ou useMonitoringControls. Une transformation pure n'est pas un hook. Les hooks n'hébergent pas les règles métier faisant autorité.

Ne pas stocker via effet une valeur dérivable. Déclencher une action utilisateur dans son handler/action. Réserver les effets à la synchronisation externe, avec cleanup et dépendances complètes. Ne pas créer useMount/useEffectOnce pour contourner le modèle React. Éviter un composant géant comme une fragmentation en wrappers vides.

Lire [references/review-and-sources.md](references/review-and-sources.md) pour les sources, scénarios et priorités de revue.

## Serveur, état et performance
Choisir les frontières selon le framework installé : initial data côté serveur lorsque pertinent, petites zones clientes pour l'interaction. Ne pas faire passer toute la page en client pour un seul contrôle.

Distinguer état serveur/cache, brouillon durable et état UI. Éviter deux vérités mutables sur la même donnée. Vérifier clés de cache, scope utilisateur et invalidation.

Traiter d'abord les waterfalls, le JavaScript client inutile et les récupérations dupliquées. Paralléliser seulement le travail indépendant dans les limites des ressources. N'ajouter memo/useMemo/useCallback qu'avec une raison mesurée ou une identité stable nécessaire.

## Vérification
Tester les règles pures sans React, les interactions au niveau composant et les frontières runtime au navigateur si nécessaire. Couvrir le risque concret : requête obsolète, double soumission, erreur de mutation, cache privé, focus après action. Employer les commandes du repo; ne pas installer une nouvelle stack de tests pour une retouche simple. Rapporter ce qui a été exécuté et ce qui ne l'a pas été.
