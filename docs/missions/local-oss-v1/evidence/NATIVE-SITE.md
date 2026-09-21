# Portage du site lancé depuis Studio — 21 septembre 2026

État : candidat livré et compilé, fidélité incomplète, non activé. Le chantier suit
[le protocole site](../SITE-PROTOCOL.md), distinct de l’inventaire suspendu.

## Exécution réelle

La copie restaurée conserve les trois révisions historiques. Dans l’interface
Studio anglaise, le profil React/TypeScript strict et les contraintes ont été
enregistrés, la connexion ChatGPT existante sondée, puis la demande envoyée avec
le bouton Send. Le code de migration n’a pas été produit par l’hôte puis importé.

Job `2c1e436f-5b84-4c5b-a7dd-844298820db0`, du 21 septembre à 17:06:39Z
au 21 septembre à 17:13:44Z. Base `5554190a-1048-43c9-b0b5-bdff378e7d05` ;
candidat `d4208c0d-ce2a-4dd0-9163-3b36dee83116`.

Le journal natif conserve un premier contrôle `check-work` échoué sur l’attribut
React `srclang`, sa correction en `srcLang`, puis un contrôle réussi. L’empreinte
de ce contrôle correspond aux 18 sources livrées. Studio a réexécuté la syntaxe
documentaire et la compilation React stricte lors de l’admission : deux réussites.
Cela démontre une correction technique dans l’exécution native, pas encore toute
la boucle de correction entre deux jobs ni une validation métier complète.

Les trois corps de pages sont rendus par React. Les 18 fichiers source et 13 sorties
compilées correspondent à leurs manifestes. Les cinq médias/favicon et deux feuilles
de style préservées sont identiques à la baseline. Les chemins publics sont conservés.

## Consommation et arrêt

Bornes initiales : six admissions, seuil cumulé de 600 000 tokens rapportés,
600 secondes par processus. Un appel terminé rapporte 726 111 tokens d’entrée,
dont 654 336 en cache, et 10 877 de sortie : 736 988 au total. Le coût monétaire
n’est pas rapporté. Le seuil d’admission, évalué entre les appels, n’est pas un
plafond fournisseur ; le contrôle a arrêté la suite avec `budget-closed`.

Le registre et le candidat sont conservés. Une demande explicite d’un seul appel
de correction, avec seuil cumulé de 1 000 000 et durée de 600 secondes, attend
la réponse utilisateur. Aucun relèvement ni second appel n’est attesté ici.

Une limite supplémentaire du parcours a été confirmée par lecture du code à
`6ee5d1f` : une demande libre part de la révision active, même si un candidat est
affiché. Le bouton de préparation d’une correction ne change pas cette base.
L’exception de correction automatique depuis le candidat couvre les échecs
techniques d’admission, pas les défauts de fidélité relevés ici. Corriger ce candidat
par le parcours existant supposerait donc son adoption préalable et explicite,
puis une nouvelle demande. Cette adoption n’a pas eu lieu ; il ne faut pas présenter
l’autorisation d’un appel supplémentaire comme une validation de ces défauts.
Ce manque a depuis été corrigé dans le Studio de développement : action explicite
[Corriger cette version](CANDIDATE-REQUEST.md), éprouvée sur des fixtures contrôlées.
Elle permet la reprise depuis les fichiers du candidat sans adoption préalable.
Aucune demande de ce type n’a encore été envoyée sur le site ; sa suspension demeure.

## Vérifications indépendantes et défauts

Recette CUA réelle du candidat : cinq étapes, navigation clavier flèches/Home/End,
filtres donnant trois livres, deux en cours et un terminé, ouverture des deux guides,
menu mobile avec Escape et restitution du focus. Aucun débordement horizontal mesuré
à 350, 390, 619, 621, 799, 801, 1099, 1101 et 1440 pixels sur l’accueil ; guides
également contrôlés à 390 pixels. Comparaison visuelle initiale desktop/mobile sans
écart concret dans les zones et états communs ; les états de filtre et de focus sont
conservés comme limites des comparaisons.

Deux défauts de fidélité dans les guides restent ouverts :

- Six espaces manquants aux frontières JSX inline, dont `normallyhttp://…`,
  `its/tmp`, `SelectUse for this project` et `release.Start from the checkout.`.
- Deux blocs de commandes multiligne de Studio perdent leur saut de ligne, ce qui
  change le texte copiable. Les chaînes doivent préserver les retours explicites.

La comparaison des sources et du rendu React a établi les défauts ; les espaces
manquants sont aussi observés dans le navigateur. Ces résultats ne sont pas une
acceptation humaine. Une lecture indépendante des trois pages a confirmé les
50 liens, 33 ancres, six réponses de FAQ et attributs des médias, sans autre écart
concret dans ce périmètre. La comparaison visuelle complète reste à terminer.

Comparaison complémentaire du 21 septembre : les 91 blocs visibles mesurés sur
l’accueil ont les mêmes textes normalisés, positions et dimensions à 1440 × 900
et 390 × 844 (tolérance 0,1 pixel CSS). Les 31 blocs du guide connecteurs ont la
même géométrie aux deux tailles ; les espaces manquants restent visibles dans le
texte. Le guide Studio conserve 35 blocs, mais les deux lignes de commandes perdues
réduisent sa hauteur de 51 pixels sur bureau et de 44,1875 pixels sur mobile.
Les paires de captures des zones connexions, exemple, démarrage et FAQ sur bureau,
ainsi que de la FAQ mobile, n’ont révélé aucun écart visuel supplémentaire.
Preuves privées : `full-layout-review/observations.json`, relevés DOM et captures.
Ces mesures ne certifient ni tous les styles de peinture ni tous les états
interactifs ; la fidélité finale doit être réexaminée après correction des guides.

Recette complémentaire du candidat dans le navigateur intégré : les six réponses
de FAQ s’ouvrent, dont cinq au clavier ; les cinq ancres `#step-*` sélectionnent
le bon panneau, et `#step-verify` reste sélectionné après rechargement. Le bouton
Copy prompt affiche le succès et le presse-papiers du navigateur contient exactement
le texte attendu après ce clic. Refus, délai et résultat tardif ne sont pas exercés
dans ce navigateur ; leur équivalence est seulement relue dans les sources.

Le film historique de 88,101 secondes se charge sans lecture automatique ; lecture,
progression au-delà de dix secondes, pause, image décodée 1920 × 1080 et sous-titres
anglais visibles sont observés. Le transcript s’ouvre sur bureau et à 390 × 844,
sans débordement horizontal. La recherche vidéo demeure **non validée** : les essais
par clavier et barre de temps n’ont pas fait évoluer `currentTime` dans ce navigateur,
sans diagnostic attribuable au site. Aucune appréciation auditive n’est déduite.
Ce film montre encore le Studio français : il ne satisfait pas la demande du nouveau
film anglais. Preuves privées : `runtime-followup-2026-09-21/observations.json` et
captures associées. La recette du film final devra porter sur ses nouveaux octets.

## Export et exécution indépendante

L’export officiel `GET /api/export`, la restauration par CLI et le lancement du
`launch.mjs` exporté ont réussi. Les quatre révisions, l’historique complet et les
données sont conservés ; 55 entrées de manifests source/compilé vérifiées. Les
13 sorties du candidat sont servies à l’identique avec leurs types MIME, dont MP4
et VTT, sous son préfixe de révision. Les trois routes publiques de la baseline
restent actives à la racine. Le runtime indépendant a ensuite été arrêté proprement.

Le registre portable conserve un appel, 736 988 tokens connus et aucune consommation
inconnue ; configuration locale de lancement et secrets sont exclus. Les empreintes
du workspace source et de la copie vérifiée restent inchangées. Archive SHA-256 :
`40548b498d276a1b7c7c047350e0b808e6c8cc7ac530004afc50b28124229975`.
Preuve privée : `native-candidate-export-check/run-2/evidence.json`. Cette vérification
HTTP établit les octets et routes exportés, pas la lecture vidéo ni l’acceptation.

Preuves privées : `evaluation-private/local-oss-v1/site-port/`, notamment
`native-start.json`, les journaux du workspace, `candidate-captures/` et
`native-candidate-review.json`. Aucun déploiement public.
