# Première recette native — inventaire local

21 septembre 2026. Parcours lancé et observé par l’agent de recette sous la délégation
de mission ; **aucune intervention humaine prouvée**. Protocole :
[bornes conservées](../NATIVE-PROTOCOL.md). Les observations ne valident pas toute la v1.

## Exécution et reprise réelle

Depuis l’accueil Studio, création du projet, mode Autonome et profil `react-ts` enregistrés.
Sonde réelle : Codex CLI0.147.0, accès ChatGPT. Activation par l’interface avec 6 jobs,
300000 tokens rapportés comme seuil entre appels et timeout300000ms. Job
`96e83931-5efa-4d52-a160-524cb08229c5`, début10:17:08Z, arrêt10:22:08Z.
Le plan et les actions apparaissent réellement dans Studio. À l’arrêt, 5/6 étapes étaient
marquées terminées, vérification en cours ; le journal contient une compilation réussie.
La réponse terminale et le bilan fournisseur manquent : **timeout, usage inconnu**.
Le registre conserve une admission, zéro token *connu* (ce n’est pas zéro consommé),
aucun nouvel appel. Il n’a pas été supprimé, recopié ou réinitialisé.

Défaut Studio confirmé : aucun parcours pour vérifier le travail interrompu sans fournisseur.
Réparation bootstrap dans le dépôt Studio, distincte de la création de l’application.
Après redémarrage du même espace, bouton « Vérifier le travail conservé sans relancer Codex ».
Job local `1671235d-ad5c-4ac6-8e5c-6a61b4ba0cb4`, acteur « Studio — reprise locale ».
Candidate `1673aa69-5737-45f9-ac2d-67c3d23bd010` conservée sans activation ; source native
inchangée, 11 fichiers comparés octet/empreinte aux sources du job interrompu.
Empreinte du manifeste canonisé :
`3bb339f668ada2b3cd8c569c4806e840a3b5a6c5f8f9dfed321bec81cd352273`.

Studio a réellement réexécuté JSON/scripts HTML et TypeScript strict/compilation React.
Deux reçus `executor:studio`, protocoles `studio-document-syntax-v1` et `react-strict-v1`.
Ils prouvent leur périmètre technique, pas le comportement. Le job original reste failed.
Cette reprise locale n’est pas présentée comme une finalisation réussie de Codex.

## Observation navigateur

Depuis l’aperçu de cette candidate, puis deux onglets de l’application sur son origine locale :

- Ajouter « Carnet fictif », quantité3, note ; succès visible.
- Nouvelle ouverture : article retrouvé sans remise à zéro.
- Premier onglet : modifier quantité4 ; second onglet conservant l’ancienne version,
  ajouter « Stylo fictif », quantité7 et note.
- Conflit : message explicite, liste serveur actualisée à4, nom/quantité/note saisis conservés.
  Deuxième envoi : deux articles enregistrés ; version de données4.
- Capture desktop et aperçu mobile390 inspectés. Défaut visuel mineur restant : libellé
  « Modifier » coupé dans la colonne d’action desktop. Aucun changement externe des sources.

Observation enregistrée dans Studio via le bridge hôte, id
`20194444-6fbc-4bc2-9b79-09dca52d4395`, kind `agent-observation`, sans executor Studio.
Elle n’est ni un contrôle lancé par l’agent natif, ni une approbation humaine.
Les journaux et données fictives restent dans le répertoire privé ignoré
`evaluation-private/local-oss-v1/native-home/` ; manifeste privé `native-recipe-evidence.json`.

## Limites et suite

App React persistante réellement créée par le job Studio, reprise locale contrôlée et premiers
usages observés. Évolution native, export/restauration, exécution autonome, recette complète
mobile, outils du runner et intervention humaine restent à démontrer. Toute reprise fournisseur
avec usage inconnu exige la décision explicite demandée ; aucune réponse présumée.
Le site/film constitue le chantier distinct demandé, pas un renommage de cette campagne.

## Export/restauration et runtime autonome

Clic Exporter depuis Studio effectué ; le téléchargement du navigateur intégré n’a pas été
retrouvé, donc pas de preuve de téléchargement réussi. Le même `exportProject` utilisé par
la route serveur a produit `inventory-recovery-export.tar`, puis le CLI officiel restore
l’a restauré dans `inventory-restored` (25 fichiers). Tous les octets des sources et bundles
ont été comparés et sont identiques ; budget portable :1 admission, usage inconnu conservé.
Sans Studio ni fournisseur, `node launch.mjs 4399` et URL explicite de la candidate ont ouvert
l’app avec ses deux articles. Modification de Stylo7→8 via CUA réussie dans la copie ; données
restaurées version5, original resté version4 et quantité7. La candidate n’a pas été activée :
l’ouverture par la racine `/` n’est pas revendiquée, seul le chemin de révision a été exercé.
