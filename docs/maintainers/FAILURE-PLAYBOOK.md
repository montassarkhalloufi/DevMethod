# Playbook de diagnostic et de récupération

Le but n'est pas de mémoriser toutes les erreurs, mais d'identifier la frontière fautive avant de
modifier quoi que ce soit.

## Le Studio refuse de démarrer

### « Workspace verrouillé »

1. chercher un autre serveur Studio utilisant le même dossier ;
2. lire `.devmethod/studio.lock` et vérifier le PID ;
3. ne pas supprimer le verrou tant qu'un processus peut encore écrire ;
4. après un arrêt brutal confirmé, préserver une copie du verrou et inspecter `studio.json` ;
5. redémarrer puis vérifier que les jobs `running` deviennent `interrupted`.

### « État Studio illisible ou invalide »

Le store refuse volontairement de remplacer le fichier. Copiez l'artefact pour analyse, validez le
JSON et localisez l'invariant violé dans `validateStudioState`. Ne créez pas un état vide par-dessus
le seul exemplaire.

## Une mutation renvoie 409

Deux causes principales :

- `version` n'est plus celle du store ;
- `snapshotKey` ne représente plus les mêmes preuves et la même action.

Rechargez. Comparez révision active, jobs, contrôles, décisions et mode. Préservez la saisie humaine
si l'interface le permet, mais ne rejouez pas automatiquement une acceptation sur le nouveau
contexte.

## Le Control Plane reste sur Verify

Lire dans cet ordre :

1. `snapshot.evidence.missing` ;
2. nœuds `required` qui ne satisfont pas `evidenceSupports` ;
3. signaux de risque moyen ;
4. `sourceIssues` ;
5. dépendances et fraîcheur ;
6. capacité `canRun` du contrôle manquant.

Ne résolvez pas une preuve absente avec une décision humaine. Exécutez ou importez la vraie
vérification, ou documentez pourquoi elle reste bloquée.

## Le Control Plane demande une décision humaine

Identifier si la cause est : impact élevé, irréversibilité, responsabilité réservée ou permission.
L'acceptation doit décrire précisément le risque accepté. Si la cause est une permission MCP,
vérifiez aussi la politique de l'outil : les deux gates sont indépendantes.

## Bounded Stop

Un arrêt peut provenir d'un `stopSignature`, d'un risque critique ou d'un rejet applicable.

1. geler les nouveaux effets ;
2. inventorier ce qui a peut-être déjà été exécuté ;
3. lire le journal du job et les actions MCP ;
4. distinguer échec reproductible, état externe incertain et convergence absente ;
5. produire un diagnostic qui change l'information disponible ;
6. réconcilier avec la personne avant reprise.

Répéter la même commande sans hypothèse nouvelle ne constitue pas une correction.

## Un contrôle passe mais l'interface reste rouge

Vérifier : révision visée, manifeste local, `checkId`, dépendances, date d'expiration et statut du
journal. Le test peut être réussi sur une révision différente ou avoir été invalidé par une
modification locale.

## L'interface affiche des données anciennes

Dans un widget React :

- vérifier le `revisionId` transmis ;
- observer la génération du hook et les requêtes annulées ;
- distinguer rapport présent + erreur de l'état succès ;
- vérifier le polling et l'onglet actif ;
- ne pas supprimer l'avertissement d'obsolescence pour rendre la vue « verte ».

## Un module d'analyse est indisponible

Une erreur TypeScript manquante peut être une capacité absente, pas une corruption du projet.
Vérifiez les dépendances installées et le message `503`. Le Studio minimal peut rester utilisable,
mais architecture, flux et qualité dépendante demeurent non vérifiés.

## Un appel MCP a un résultat incertain

Ne relancez pas immédiatement une action à effet. Recherchez d'abord son identifiant dans le journal,
son statut, sa clé d'idempotence et l'état externe observable. Une réponse réseau perdue ne prouve
pas que l'opération n'a pas eu lieu.

## Fiche de diagnostic minimale

```text
Symptôme observable :
Révision / version / snapshot :
Entrée et acteur :
Frontière suspectée :
Effet durable possible :
Preuve consultée :
Hypothèse suivante :
Commande ou observation qui peut la réfuter :
Condition d'arrêt :
```
