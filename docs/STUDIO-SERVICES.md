# Sources et services locaux dans Studio

L’onglet **Code** distingue les fichiers de l’application de ceux du **backend local DevMethod**. Le premier arbre appartient à une version du projet et permet l’édition habituelle. Le second expose les vrais fichiers installés `preview.mjs`, `files.mjs` et `http.mjs`, avec leur empreinte ; il reste en lecture seule. Il ne représente pas un backend métier généré pour votre projet.

Outre l’interface de contrôle, le runtime exécute trois serveurs HTTP d’aperçu sur des origines loopback distinctes, dans un seul processus Node : application adoptée, brouillon et comparaison. L’application et le brouillon offrent `GET /api/data` et `POST /api/data`. Une écriture fournit la version lue ; une version devenue ancienne reçoit un conflit 409. Les données du brouillon sont isolées de celles de l’application.

L’origine `comparisonPreviewOrigin` sert les versions comparées et autorise seulement `GET /api/data`. Elle lit les données courantes de l’application, sans copie ni snapshot ; toute tentative de mutation reçoit 405 avec `Allow: GET`. Une écriture ultérieure depuis l’application est donc visible dans la comparaison. La séparation des origines n’est pas une isolation de processus. Les trois serveurs d’aperçu se ferment avec Studio.

Les propositions restent liées à leur contexte de conception, parcours design compris. Un remplacement ou une approbation du master rend une ancienne proposition périmée : sélectionner ou approuver celle-ci reçoit 409 et conserve son historique. Il faut préparer une nouvelle proposition à partir du contexte courant ; afficher un aperçu ne réactualise pas son accord implicitement.

**Actualiser les services** effectue une vraie lecture locale bornée à 1,2 seconde par service. Le résultat distingue une réponse JSON valide, une erreur HTTP, une connexion impossible et un délai dépassé. Une réponse valide prouve seulement ce contrat de lecture, pas la correction des règles métier, une écriture ou l’absence d’erreurs dans l’application. Le diagnostic ne renvoie pas le contenu des données.

## Décrire un monolithe ou plusieurs services

Le fichier optionnel `devmethod.project.json`, conservé et exporté parmi les sources, rattache des services à leurs vrais fichiers. Exemple de monolithe :

```json
{
  "topology": "monolith",
  "services": [
    { "id": "api", "name": "API du projet", "root": "backend", "runtime": "Node / Fastify" }
  ]
}
```

Pour plusieurs services, utiliser `"topology": "services"` et plusieurs entrées dont les identifiants sont uniques. `root` est un dossier relatif au code de l’application ; `"."` désigne sa racine. Les chemins absolus, remontées `..`, commandes et champs inconnus sont refusés. Le manifeste accepte au plus 16 services et 32 Kio.

`runtime` est une description, pas un programme à lancer. Studio indique **non connecté** pour ces services et liste les fichiers effectivement présents dans la version. Une déclaration seule ne crée ni API, ni authentification, ni base de données. Les profils exécutables restent le frontend statique et React/TypeScript avec le stockage JSON local embarqué. Un backend Express, Fastify, Nest, Python ou des microservices demandent encore un adaptateur d’exécution isolé et vérifié ; aucune commande de projet n’est exécutée implicitement.

Les diagnostics, sources du runtime installé et déclarations de projet sont accessibles via `GET /api/runtime/services?revision=…` et `GET /api/source?scope=runtime&path=preview.mjs`. L’API de sources applicatives existante reste liée à l’identifiant et aux empreintes de sa version.
