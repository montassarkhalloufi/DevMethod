# Portage natif du site — protocole avant appels

21 septembre 2026. Copie restaurée et protocole fixé avant le premier appel site v1.
Autorité : portage React/TypeScript explicitement demandé dans [PLAN](PLAN.md).
Ce chantier reprend un site existant avec un objectif nouveau ; il ne relance ni ne réinitialise
les anciennes campagnes. L’inventaire interrompu reste un projet distinct, son registre conservé.

## Référence observable

Baseline `5554190a-1048-43c9-b0b5-bdff378e7d05`, dernière révision du17 septembre16:28:22Z
présente dans devmethod-site-en.tar. Archive SHA256
`d086796b317149d881ae9abea08f585c9c1c7714f2d4fa10866ef18794971aaf`.
Aucune référence utilisateur plus récente trouvée dans les notes inspectées. L’archive ne
contient pas d’accord source:user ; on ne transforme pas la provenance agent en acceptation.
Copie privée restaurée officiellement : evaluation-private/local-oss-v1/site-port/baseline.
Original, archive et historique conservés. Les fichiers du site ne sont pas modifiés ici.

Préparer le nouveau projet depuis les sources exactes de cette baseline dans Studio,
avec référence à l’archive historique et manifeste. Enregistrer `expectedProfile:react-ts`
et la délégation existante avant toute prise en charge. La migration doit être faite par
le job natif lancé depuis Studio ; ni code produit par l’hôte ni réimport de migration externe.

Bornes retenues dans la délégation technique pour ce chantier distinct avant activation :6 admissions, seuil cumulé
600000 tokens rapportés, timeout600000ms par processus. Ce seuil n’est pas un plafond fournisseur.
Une consommation inconnue suspend les appels ; aucun reset ou relèvement implicite. Connexion
ChatGPT existante re-sondée, pas de bascule API. Relever la configuration réelle avant appel.
Ce protocole préparatoire ne lève pas la suspension de l’inventaire.

Le mandat de continuation autorise des bornes proportionnées pour un nouveau périmètre,
et la demande suivante autorise explicitement ce portage. La décision pendante concerne
la reprise de l’inventaire ; elle ne constitue pas une interdiction générale de ce chantier
site distinct. Aucune demande d’évolution de l’inventaire ne peut être exécutée ici. La
copie conserve les trois révisions du site et leurs preuves historiques ; son premier
appel natif et ses consommations auront leur propre registre. Aucun ancien registre
n’est effacé, réduit ou réinterprété.

## Invariants du portage

Préserver sortie anglaise, texte, structure/navigation, palette, typographie, espacements,
responsive et interactions. Pages : index.html, docs/studio.html, docs/connectors.html.
Assets inchangés par empreinte : illustration bibliothèque, favicon, vidéo historique,
sous-titres et affiche. Préserver les chemins publics des deux documents et liens GitHub.
L’export autonome doit ouvrir directement chaque page ; la compilation contrôlée ne doit
pas dépendre de scripts package ou d’une configuration JS arbitraire.

Réutiliser les règles React applicables : vues, état/hooks, modèle pur et services distincts,
TypeScript strict. Pas de redesign ni nouvelle architecture distribuée. Présenter le plan
proportionné et la décision de portage dans Studio. Le résultat technique ne vaut pas fidélité.

Comparer les captures baseline/candidat aux mêmes viewports1440×900 et390×844, puis seuils
619/621,799/801,1099/1101px et largeur350px. Inspecter toutes les sections et les deux docs,
retours de lignes, largeur, espacements, images et débordement. Exercer :

- Étapes Frame/Choose/Build/Verify/Resume : onglets, précédent/suivant, compteur, clavier
  flèches/Home/End/espace et deep links #step-*.
- Bibliothèque : All/Reading/Finished, compte annoncé, aria-pressed.
- Menu mobile620px : ouverture, lien, Escape/restauration du focus, redimensionnement.
- Copie du prompt : succès, refus, délai2s, sélection manuelle et résultat tardif refusé.
- Ancres, trois pages et destinations conservées.
- Lecteur : controls, playsinline, preload metadata, affiche1920×1080, piste anglaise par
  défaut, transcript, téléchargement, sans autoplay ; lecture/pause/recherche et MIME MP4/VTT.

## Film distinct

La vidéo Daniel actuelle reste la baseline historique du portage. Le remplacement par Kokoro
`af_heart` est autorisé séparément pour la voix ; cela ne constitue pas l’acceptation du film.
Le projet Remotion restauré est encore ready:false avec scenes/cues vides. Le README récent
prévaut sur l’ancien storyboard de captures fixes : dix enregistrements réels du parcours
(idée, brief, outils, architecture/flux, preview, code, impact, contrôles, itération, export).
Les sept WAV disponibles ne prouvent pas dix scènes montées. Produire montage, sous-titres et
provenance à partir des enregistrements réels ; préserver la présentation du lecteur. Aucune
publication ni modification de domaine. Acceptation humaine finale à distinguer du rendu.

## Langue du nouveau film — précision utilisateur du 21 septembre

Le nouveau film `af_heart` doit être entièrement présenté en anglais : narration,
sous-titres, textes éditoriaux et interface Studio visible dans les captures. Le Studio
propose un choix FR/EN, anglais par défaut, vérifié sur accueil et projet local de recette.
Choisir EN et du contenu de démonstration anglais pour les dix nouveaux enregistrements ; ne pas recycler
les captures françaises historiques en les présentant comme conformes à cette demande.
Le site de référence et ses trois pages restent en anglais. Les documents et données
historiques ne sont pas réécrits pour donner l’apparence d’une nouvelle recette.
