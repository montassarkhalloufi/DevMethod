# CI du candidat de revue — 21 septembre 2026

La [PR brouillon 40](https://github.com/montassarkhalloufi/DevMethod/pull/40)
porte la branche `codex/local-oss-v1-review`, issue de main sans reprendre les
anciens objets privés de la branche de travail. Les arbres source et revue sont
comparés avant chaque envoi ; les histoires existantes restent conservées.
Les résultats et le commit courant de la PR sont la référence pour la CI suivante.

## Premier candidat : `a426d7605967278dba75d289009c3d0cd41a4fb1`

- [Fullstack](https://github.com/montassarkhalloufi/DevMethod/actions/runs/35641426452) : succès, y compris tests, base PostgreSQL et e2e de la fixture.
- [Plateformes](https://github.com/montassarkhalloufi/DevMethod/actions/runs/35641426444) : Linux et macOS réussis, Windows échoué.
- Windows : 1 491 tests rapportés, 1 438 réussis, 7 échoués, 46 explicitement ignorés. Les étapes de paquet suivantes n’ont pas été exécutées sur Windows. Les nombres diffèrent selon les scénarios propres aux plateformes.

Les succès Linux/macOS incluent lint, format, build/tests, applications de départ,
liens documentaires, cohérence du build commité et essais du paquet. Ils ne prouvent
pas une exécution authentifiée de tous les agents ni la recette humaine de la v1.

## Diagnostic et correction

Deux défauts produit dans `scripts/studio/runner-progress.mjs` étaient exposés :
les chemins Windows n’étaient pas normalisés vers les chemins applicatifs portables ;
le lecteur de progression se reposait sur `O_NOFOLLOW`, non imposé sous Windows.
La correction normalise les séparateurs, conserve le périmètre `app`, le refus des
traversées, fichiers cachés et flux alternatifs, puis compare le fichier nommé au
descripteur ouvert avant toute lecture. Un lien ou un remplacement pendant l’ouverture
est refusé ; taille, identité, offset, déduplication et fermeture du descripteur restent
bornés.

Trois hypothèses de fixtures ont aussi été corrigées, sans changement produit :
`SystemRoot` est un champ système Windows autorisé ; le déclenchement d’une mutation
concurrente doit employer le séparateur du système ; l’exclusion esbuild des URL
`/studio-ui/…` ne doit pas externaliser les imports relatifs des sources React.
Les assertions sur les traductions et l’isolement restent effectives.

Les deux régressions produit ont été reproduites localement avant correction avec
la sémantique `path.win32` de Node et une ouverture sans `O_NOFOLLOW`. Trois cas
supplémentaires couvrent chemins, lien initial et remplacement pendant l’ouverture.
Ce sont des tests contrôlés sur macOS, pas une exécution Windows locale.
Revue indépendante : aucun nouveau défaut concret retenu dans ce périmètre.

Après correction : **1 507 tests et build locaux réussis**, lint et format globaux
réussis. Les journaux de la première CI et de ces contrôles sont conservés en privé
sous `local-oss-v1/integration/`. Le nouveau paquet et la CI du nouveau commit doivent
être vérifiés avant de revendiquer la correction sur Windows ; les résultats ci-dessus
ne sont pas réattribués à ce prochain commit.

La PR reste brouillon. Recette Studio complète, interventions humaines, site et film
restent soumis aux limites du [bilan de maturité](MATURITY.md). Aucun merge,
publication npm ou déploiement public n’est établi par une CI réussie.
