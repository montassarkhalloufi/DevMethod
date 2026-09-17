> Livraison suivante : [permissions MCP, interactions persistantes et GitHub](evidence/connector-permissions/RESULTS.md). Le parcours demandé ensuite consiste à créer le site DevMethod depuis Studio et corriger les défauts observés.

> Mise à jour du 17 septembre : [espace technique, architecture, vérifications et défilement](TECHNICAL-CHECKPOINT.md), [accueil/composer livré](evidence/home-composer/RESULTS.md), puis [huit scénarios connecteurs Lovable et cadre d’intégration](evidence/lovable-connectors/SCENARIOS.md). Le « go » suivant a livré les [guides Slack/Notion/Linear et leur contexte structuré](evidence/guided-connectors/RESULTS.md) ; les parcours concurrentiels précédents restent des observations séparées. Les preuves historiques ci-dessous gardent leur périmètre d’origine.

# Reprendre Studio — checkpoint du 16 septembre 2026

**Évolution suivante :** [Studio React typé et éditeur multicolore](REACT-CHECKPOINT.md).
Le bilan historique ci-dessous conserve la livraison HTML/JS de la PR #37 ; ne pas attribuer
ses preuves à la nouvelle tranche React sans consulter son checkpoint. La référence M
bleu nuit/ardoise est désormais validée dans [STUDIO-DESIGN.md](STUDIO-DESIGN.md) ; elle remplace
l’attente de choix sur L mentionnée dans ce bilan antérieur.

État : parcours Les Ateliers et transfert métier réalisés ; éditeur implémenté, 21 tests
ciblés réussis et parcours navigateur édition, erreurs, récupération et adoption enregistré.
La suite locale rapporte 472/472 tests réussis ; lint, format et smoke global du paquet local
ont réussi après correction des liens documentaires. La CI du runtime `6fb8a90` a réussi
sur Linux, macOS et Windows, ainsi que le scénario fullstack. Ces tests ne lancent pas les
fournisseurs natifs ; voir la [trace CI](evidence/platform-ci.json). L’esthétique
olive de K a été rejetée après essai ; composition et fonctions restent retenues. **L bleu
nuit / indigo attend le choix humain.** Continuer les travaux techniques indépendants.
Voir [résultats et limites](RESULTS.md), [contrat actuel](CONTRACT.md),
[guide Studio](../../STUDIO.md), [critères et budgets](PLAN.md).

Livraison dans la [PR brouillon #37](https://github.com/montassarkhalloufi/DevMethod/pull/37),
branche `codex/creation-experience`, base PR #36. Le premier commit `37c9633` a passé les
contrôles Linux/macOS mais échoué au format Windows. La correction des attributs Git conserve
les octets des fichiers Studio et des révisions enregistrées. Le runtime corrigé `6fb8a90`
a ensuite passé les trois plateformes. Le commit de checkpoint suivant ne change que les
documents et cette trace ; consulter également les contrôles du HEAD de la PR.
Ne pas fusionner ni publier sans nouvelle autorisation.

## Sources à conserver

- Application Les Ateliers : master Agenda et mobile dans [DESIGN.md](DESIGN.md).
  Révision CSS contrôlée dans Chrome : `4bb3238f-fd3a-4edb-8377-89d5850cc258`,
  [preuves finales ciblées](evidence/journey/final-visual-metrics.json).
- Révision active de l'exemple : `1aea70fe-1134-4dfa-a872-a79e3003b6aa`, sixième révision.
  Elle modifie uniquement le pied de page HTML après le [parcours réel de l'éditeur](evidence/studio/editor-journey.json).
  Son unique nouveau contrôle couvre la syntaxe JS/JSON. Les données actives version 10
  restent identiques ; l'inscription d'essai existe seulement dans la copie éditeur version 11.
- Shell Studio : garder résultat visible, « Qui décide ? », choix révisables, preuves par
  version et composition de K. Palette olive rejetée ; ne pas invoquer son ancien accord
  pour annuler la réouverture. La [revue design](evidence/studio/DESIGN-REVIEW.md) fournit
  les cinq écarts et critères à reprendre après choix de la nouvelle proposition.
- Modes et exceptions : réutiliser la délégation existante. Produit/technique sont délégués
  dans cette mission ; seul le travail visuel dépendant de la palette rouverte attend ce choix.
- L’[export essayé](evidence/journey/export.json) est le snapshot `b44b4b37…`, antérieur à
  la correction CSS finale. L’exemple distribué conserve son état dans
  [studio.json](../../../examples/studio-ateliers/state/studio.json) ; lire sa révision active
  avant d’attribuer une preuve à une version.
- La provenance active d'Agenda est `agent`, corrigée par la demande de contexte
  `5f090ff9-fc4f-47f1-b8d8-cabacf1a6b30`. L'ancienne entrée `user` est conservée comme
  remplacée ; elle n'est pas un accord humain sur cette application.

## Reprendre le projet vivant

Depuis la racine du dépôt, inspecter le serveur existant :

```sh
node scripts/studio.mjs status --workspace /private/tmp/devmethod-studio-live
```

Si le serveur est arrêté, relancer avec les mêmes ports :

```sh
node scripts/studio.mjs serve --workspace /private/tmp/devmethod-studio-live --port 4330 --preview-port 4331
```

Studio est sur `http://127.0.0.1:4330/`, l’application sur `http://127.0.0.1:4331/`.
L’aperçu éditeur utilise un troisième port libre, annoncé par `editorPreviewOrigin` ; ne pas
figer le port observé dans une session comme adresse permanente.
Ne pas démarrer un second écrivain. Le verrou est conservateur après arrêt brutal : vérifier
le processus avant toute intervention sur `.devmethod/studio.lock`. Les mêmes ports conservent
l’origine des brouillons navigateur. Un job `running` interrompu devient `interrupted` à
la réouverture ; cet état n’autorise ni relance silencieuse ni adoption tardive.

**Ne pas ajouter `--agent codex` à la reprise de cette expérience.** L’unique appel natif a
consommé 277 934 tokens, au-delà du seuil d’admission entre appels de 100 000 ; ce budget est
clos. Les 228 224 tokens en cache sont inclus dans l’entrée. Prix et consommation totale des
agents hôtes inconnus. Ne pas effacer le registre ou renommer une expérience pour relancer.
Le serveur sans `--agent` utilise le bridge ; il ne simule pas un agent automatique.

## Essayer une copie isolée

Choisir un nouveau dossier absent ou vide et des ports libres. Sur ce Mac, utiliser
`/private/tmp`, car `/tmp` est un lien symbolique refusé par le contrat de chemins.

```sh
node scripts/studio.mjs example --workspace /private/tmp/devmethod-example
node scripts/studio.mjs serve --workspace /private/tmp/devmethod-example --port 4340 --preview-port 4341
```

Ouvrir `http://127.0.0.1:4340/`. Il s’agit d’une reconstruction des fichiers et traces
enregistrés, sans génération ni appel modèle. Le budget historique reste conservé. Sur cette
copie fictive, filtrer les activités, inscrire, atteindre la capacité, rejoindre l’attente,
annuler une inscription et observer la promotion FIFO. Examiner les versions, l’échec initial,
les contrôles et le code réel. Les observations nouvelles doivent être attachées à la
révision effectivement essayée.

Pour reprendre le cas différent, utiliser le [checkpoint du vestiaire](evidence/holdout/README.md).
Ce transfert n’est pas un essai comparatif aveugle.

## Reprendre un brouillon de code

Dans Code, partir de la version active et choisir « Modifier le code ». Le brouillon enregistré
est récupéré ; un changement de base n’écrase pas silencieusement les anciens textes. Les
fichiers texte existants jusqu’à 256 Kio sont modifiables. L’aperçu automatique attend 700 ms
sans frappe, sauvegarde et vérifie JS/JSON sans exécution applicative serveur, puis recharge
le build sur l’origine d’essai. La copie des données y est conservée entre builds du même
brouillon et reste séparée de l’application active.

Une erreur de syntaxe conserve le dernier bon aperçu, explicitement ancien. Une erreur runtime
signalée par l’iframe bloque l’adoption dans l’interface. Préparer une correction renseigne
le composer sans envoyer ni appeler un modèle. En cas de conflit, récupérer d’abord les
modifications puis choisir de relire le brouillon partagé ou de reprendre la base active.
« Adopter cette version » utilise le build exact courant ; seules les preuves statiques lui
sont attribuées, les critères métier restant à recontrôler selon les changements.

Le brouillon serveur persiste au redémarrage. Les modifications non acquittées disposent
aussi d’une copie navigateur quand le stockage local fonctionne. **Le bundle du projet
n’exporte pas le brouillon non adopté** : utiliser « Récupérer mes modifications » pour son
JSON séparé avant de déplacer le travail. Le JSON de secours n’est pas une application prête.
Les builds précédant le vérificateur corrigé `node-stdin-v1` ne sont plus adoptables : lancer
une nouvelle vérification du brouillon conservé. Cette correction répond au faux succès
observé de `node --check FILE` sur du JavaScript ESM invalide.

## Export et application indépendante

Exporter depuis Studio, puis restaurer l’archive dans un dossier absent ou vide :

```sh
node scripts/studio.mjs restore --workspace /chemin/absolu/projet-restaure --file /chemin/absolu/devmethod-project.tar
node /chemin/absolu/projet-restaure/launch.mjs 4399
```

`http://127.0.0.1:4399/` exécute seulement le produit et ses données. Pour retrouver Studio :

```sh
node scripts/studio.mjs serve --workspace /chemin/absolu/projet-restaure --port 4340 --preview-port 4341
```

L’export conserve données, fichiers déclarés, décisions, références et budget assaini ; il
exclut token runtime, accès globaux, journaux fournisseur et staging. Revenir au code précédent
conserve les données actuelles ; cela n’annule pas leur évolution et n’effectue pas une
migration métier automatique. L’export ne contient pas le localStorage du navigateur.

## Travail autorisé restant

Réutiliser les preuves navigateur de l'éditeur déjà enregistrées, y compris son résultat
négatif et la correction du vérificateur ; ne pas rejouer ce parcours sans changement affecté.
Achever le contrôle global de l'archive exacte après correction des liens. Après le choix
humain de la palette, corriger les cinq
écarts et vérifier le shell contre la référence acceptée. Mettre à jour contrat et résultats
après ces contrôles, puis préparer la PR et les checks de candidate sans fusion ou publication.

Le produit reste local HTML/CSS/JS avec service JSON : authentification, cloud/hébergement,
paiement, backend général et compilation de frameworks non statiques ne sont pas fournis.
L’imagegen utilisé pour les propositions est une capacité de l’hôte, pas un service Studio.
La « compilation » livrée est une vérification de syntaxe JS/JSON, sans bundler, TypeScript,
validation CSS, contrôle JavaScript inline ni tests métier automatiques. L’interface édite
les fichiers existants ; l’ajout/suppression n’y est pas encore exposé, même si l’API le permet.
Les résultats comparatifs et l’effort humain restent non mesurés ; aucune rupture démontrée.
