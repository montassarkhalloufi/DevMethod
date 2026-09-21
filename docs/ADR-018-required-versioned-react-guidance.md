# ADR 018 — Références React obligatoires, versionnées et évolutives

Date : 2026-09-16. Statut : accepté à la demande explicite de l’utilisateur.
Complète [ADR 017](ADR-017-typed-react-studio.md).

## Décision

React est le parcours frontend interactif principal actuellement implémenté par
DevMethod Studio. Ce choix peut évoluer avec les besoins et les décisions du
projet. Une demande React ne doit pas être satisfaite par une page HTML simulant
une architecture React. Une autre pile existante n’est pas migrée automatiquement.

Les trois compétences Vercel sélectionnées sont distribuées avec
`react-feature-engineering` : React best practices, composition patterns et Web
Interface Guidelines. Leurs règles applicables sont obligatoires pendant la
réalisation et la revue. L’agent lit les règles pertinentes avant de coder, puis
évalue toutes les règles applicables à la surface modifiée ; les écarts matériels
sont justifiés et les contrôles manquants restent visibles. Le chargement d’une
compétence, le typage ou des tests verts ne prouvent pas une conformité complète.

Les versions installées et le runtime disponible bornent l’application des règles.
L’architecture sépare présentation, hooks, règles métier pures et accès aux
services. Les principes Clean Architecture protègent la direction des dépendances ;
ils n’imposent ni dossiers vides, ni interfaces artificielles, ni backend nouveau.

## Provenance et exécution

Les sources Vercel sont conservées sans modification avec leur licence, commit et
empreinte dans la [provenance distribuée](../.agents/skills/react-feature-engineering/references/vercel/PROVENANCE.md).
La commande Web Guidelines est elle aussi épinglée ; l’instruction upstream de
charger `main` ne remplace pas cette version. Toute évolution passe par une revue
du diff et de sa compatibilité, puis une actualisation des empreintes.

Le contexte de travail Studio inclut le vrai `react-feature-engineering/SKILL.md`
et expose le chemin local des références en lecture seule. Il ne prétend pas que
l’agent a lu toutes les règles ni que le résultat les respecte. L’installation
conserve les six modules existants ; ces sources restent des références du module
React, sans nouveau plugin global ni changement des autorisations.

## Couverture explicite

| Besoin | État actuel |
|---|---|
| React 19, TypeScript strict, composants/hooks/domain/services | Sources, template et compilation locale disponibles ; règles Vercel locales requises |
| Next.js / RSC / Cache Components | Règles conditionnelles au framework et à sa version ; aucun runtime Next annoncé dans le preview React |
| React Native | Ni compétence Native importée ni runtime mobile natif vérifié |
| Backend Express, Koa, NestJS, Fastify, Python | Choix selon besoin ; aucun skill backend installé par cette décision |
| Hébergement, déploiement, auth et services tiers | Dépendent d’une implémentation et des autorisations propres au projet |

Deux candidats backend peuvent être évalués quand le besoin le justifie : le
[skill FastAPI officiel](https://github.com/fastapi/fastapi/blob/0af003a85da454dcf6b6783e0ad3f0dd687e944f/fastapi/.agents/skills/fastapi/SKILL.md)
(MIT), et le [skill Fastify de Matteo Collina](https://github.com/mcollina/skills/blob/856efd268ae85482d882f3d0bed869fd020b5c06/skills/fastify/SKILL.md)
(MIT, collection personnelle). Le [skill NestJS communautaire](https://github.com/Kadajett/agent-nestjs-skills/blob/main/skills/nestjs-best-practices/SKILL.md)
déclare MIT et v1.2.0, mais sa version doit encore être figée et son périmètre revu
avant import. Aucun skill officiel Express, Koa, NestJS ou Django n’a été vérifié
par cette recherche ciblée ; cela ne démontre pas leur inexistence. Les
[workflows Django SaaS Pegasus](https://github.com/saaspegasus/django-skills)
portent sur la maintenance et ne constituent pas un guide backend complet.

## Vérification et limite

Les contrôles d’intégrité portent sur les octets distribués, leur présence après
installation et les chemins réellement exposés au travail Studio. La revue d’une
réalisation doit encore examiner ses composants, interactions, données et preuves.
Cette décision rend les références disponibles et requises ; leur bénéfice sur la
qualité, le coût ou l’effort humain reste à mesurer.
