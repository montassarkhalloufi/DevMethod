# Revue React et sources

## Cas de placement
- Filtrer/trier une liste déjà en mémoire : fonction pure ou dérivation locale; pas d'effet miroir.
- Charger le contenu initial d'une page publique Next : frontière serveur existante; pas de useFetch qui supprime l'HTML utile.
- Gérer sélection, progression et annulation d'un upload : hook de feature; transport dans l'adapter; validation et autorisation serveur.
- Calculer l'éligibilité à une offre : domaine/cas d'usage, même si un contrôle UI anticipé réutilise une version pure.
- Ouvrir un accordéon : état local du composant si aucune orchestration partagée.
- Requête A suivie de B : empêcher la réponse tardive de A de remplacer B, via le cache/framework ou annulation/identité de requête appropriée.
- Double clic sur un achat : contrôle UI utile, idempotence et droit serveur indispensables.

## Références vérifiées le 12 septembre 2026
Ces références publiques sont des compléments. Ce kit ne redistribue ni ne prétend installer les skills tiers.

- [React : custom hooks](https://react.dev/learn/reusing-logic-with-custom-hooks) — partager une logique React concrète; ne pas transformer les fonctions pures en hooks.
- [React : effets souvent inutiles](https://react.dev/learn/you-might-not-need-an-effect) — dérivations et événements.
- [Next : serveur et client](https://nextjs.org/docs/app/getting-started/server-and-client-components) — composition et frontières selon version.
- [Vercel agent-skills](https://github.com/vercel-labs/agent-skills) — React best practices, composition et web design.
- [Vercel next-skills](https://github.com/vercel-labs/next-skills) — guidance Next conditionnelle.

## Résolution versionnée
1. Lire le manifeste et le lockfile; identifier la version installée.
2. Lire les skills obligatoires du pack local et leur pin approuvé. Suivre leurs références utiles.
3. Pour les APIs, privilégier la documentation embarquée disponible puis les docs officielles correspondant à cette version.
4. Un lien amont n'est pas une preuve de chargement. Si le projet exige un skill local absent/incomplet, signaler le blocage de ce scope; ne pas fabriquer un équivalent.
5. Un ajout/mise à jour de skill est une dépendance à revoir : source, commit/version, licence, compatibilité, conflits et changements de comportement. Ne pas exécuter automatiquement une commande npx flottante.
6. Cache Components/PPR ne s'applique que si adopté et supporté. L'existence d'un skill n'autorise pas un changement de framework ou d'hébergement.

## Revue ciblée
- La règle métier se teste-t-elle sans rendu React ?
- Le hook a-t-il une responsabilité React et une API courte ?
- Les props/state restent-ils immuables ?
- Les états réseau et erreurs sont-ils explicites ?
- La frontière serveur/client préserve-t-elle secrets et données privées ?
- Le partage répond-il à une responsabilité stable, ou seulement à une ressemblance ?
- Les composants se composent-ils sans explosion de booléens ?
- Les vérifications couvrent-elles la frontière changée ?
