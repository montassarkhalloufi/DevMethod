# Correction explicite d’un candidat conservé — 21 septembre 2026

Défaut observé pendant [la recette du site](NATIVE-SITE.md) : une demande ordinaire
repartait de la baseline active, malgré l’affichage du candidat React. La réparation
du Studio est réalisée dans le worktree de développement, conformément au mandat
de dogfooding. Ce n’est pas une autoréparation native du site.

## Résultat local

Action Historique « Corriger cette version / Request changes », examen frais de
l’identité et des sources, saisie séparée, puis mise en attente explicite. La demande
conserve parent, source, empreinte et contexte ; la version active, les preuves,
le brouillon principal et les limites restent inchangés. Le runner et le claim
choisissent la même demande liée avant une demande ordinaire bloquée. Le contrat
est [ADR 038](../../../ADR-038-explicit-candidate-request.md).

Le contrôle avant admission et après préparation asynchrone relit source, contexte,
outils et arrêts. Une demande explicite n’accorde pas une nouvelle délégation et ne
réinitialise pas le budget. Les sources React réellement copiées viennent du candidat,
même lorsque la base active est statique. La nouvelle livraison obtient ses contrôles.

## Vérifications

- Rouge HTTP observé sur le code précédent : route absente, 404 au lieu de 200,
  après création et admission réelles de la fixture. Puis neuf tests HTTP/claim verts.
- Fournisseur fictif : une admission avec limite d’un appel, priorité de file,
  blocages budget/consommation inconnue/conséquences retenues et nouvelles sources,
  contexte ou permission outil intervenant pendant la préparation.
- Revue indépendante : une correction automatique échouée sans produire de révision
  était oubliée lors d’une demande explicite depuis son parent. Régression rouge
  reproduite puis verte après comptage de toute la famille. L’admission de la correction
  directe déjà réservée reste permise aux états queued/running. Relecture ciblée close.
- Dix tests DOM/API du dialogue et de son raccordement : demande exacte, doublon,
  refus périmé, saisie conservée, résultats tardifs et traductions connues ; diagnostics
  inconnus préservés. Les nouveaux tests UI sont des tests après implémentation,
  sans revendication de rouge comportemental pour ce volet.
- Suite globale : build et **1 494/1 494 tests réussis**, lint et format globaux réussis.
  Une seule exécution après la correction ; aucun appel fournisseur réel.

Recette CUA sur fixture synthétique servie par Studio, agent désactivé : ouverture
en anglais, saisie, actualisation, modification concurrente du brouillon dans un
autre onglet, refus de l’examen périmé avec texte conservé, actualisation puis mise
en attente unique. Baseline toujours active et brouillon concurrent conservé.
Second envoi indisponible car la demande est déjà en attente. À 390 × 844, aucun
débordement horizontal ; formulaire et actions accessibles par défilement/clavier.
Changement EN → FR → EN depuis l’autre onglet pendant l’ouverture du dialogue,
texte saisi conservé. Captures réellement inspectées, taille et langue restaurées.

L’export officiel de cette fixture CUA a été restauré par CLI : état complet identique,
demande toujours en attente, filiation et brouillon concurrent conservés. Le loader
valide l’état et le contrôle restauré reste désactivé, sans sonde ni runner lancé.
Le paquet contenant ce code a été inspecté sans données privées, installé dans une
copie temporaire et vérifié par `test:package` : réussites Studio, React, reprise,
export et installation. Aucun appel fournisseur.

Le Studio du site a ensuite été redémarré avec ce correctif. Les empreintes d’état,
données, réglages et ledger sont identiques avant/après. Le dialogue anglais reconnaît
le véritable candidat et affiche toujours `The budget is closed`. La demande ciblée
est préparée dans le formulaire et dans un fichier privé, sans POST ni nouvel appel.

Preuves privées : `evaluation-private/local-oss-v1/candidate-request-fixture/` et
`evaluation-private/local-oss-v1/logs/candidate-request-*.log`. La fixture est une
preuve du parcours et de ses refus, pas une acceptation humaine du site.

## Limites

Le candidat site d’origine n’a pas été modifié ni activé. Son prochain appel reste
soumis à la réponse utilisateur sur le dépassement du seuil. L’inventaire reste
suspendu séparément. L’autorisation macOS d’écran demeure manquante ; aucun film
n’a été enregistré. La mission complète, sa CI et son intégration restent ouvertes.
