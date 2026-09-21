# ADR 033 — Vérification navigateur locale du candidat

Date : 21 septembre 2026. Décision technique réversible prise dans la délégation
enregistrée par [la mission v1](missions/local-oss-v1/PLAN.md). Adaptateur local implémenté
et [exercé depuis Studio](missions/local-oss-v1/evidence/BROWSER-VERIFICATION.md).

## Besoin et choix

Studio doit exécuter des assertions observables sur la version contrôlée et sur ses
données de recette. Les signaux d’une iframe et les succès de transport MCP ne prouvent
pas que ces assertions ont été exécutées. Le pont MCP existant reste utile pour les outils
externes ; étendre son attestation seule ne répond pas à ce besoin.

Nous retenons un adaptateur local optionnel `playwright-core` 1.63.0 (Apache-2.0), avec
Chrome ou Edge déjà installé, sélectionné explicitement dans Studio. Aucun téléchargement
de navigateur, service distant, profil personnel ou connexion CDP. Garder uniquement les
contrôles statiques laisserait le critère G incomplet ; déléguer ce contrôle à un outil
externe introduirait une dépendance d’accès et d’attestation évitable pour la v1 locale.

Le pilote lance son propre processus et des contextes vierges. Les fichiers proviennent
de l’instantané contrôlé, les données démarrent vides dans un répertoire temporaire distinct.
Le runtime est le serveur d’aperçu existant ; aucun script package, serveur de projet ou
code de test fourni par le candidat n’est exécuté côté Node. Le sandbox Chromium est activé.
Le routage refuse les autres origines, bloque service workers et WebSockets ; les téléchargements
et permissions sont désactivés. Ces contraintes applicatives ne constituent pas une isolation
réseau du système d’exploitation et ne promettent pas de contenir un navigateur compromis.

## Contrat exécutable

Le candidat peut fournir `devmethod.browser.json`, JSON strict et borné : scénarios nommés,
cibles accessibles ou test-id, actions prédéfinies et assertions explicites. Pas de code
JavaScript, commande shell, URL distante, sélecteur exécutable ou option de lancement libre.
Les données de test sont synthétiques ; `{{nonce}}` fournit une valeur unique par scénario.
Un redémarrage ferme le contexte navigateur et relance le runtime avec les mêmes données
isolées ; une assertion sur le fichier de données est lue par le pilote, indépendamment
du DOM. Chaque scénario repart de données vides.

Un contrôle conserve l’empreinte des sources, le protocole, les versions du pilote et du
navigateur, les scénarios/assertions réellement exécutés, diagnostics et limites. Sources
changées, pilote absent, lancement impossible, interruption ou délai dépassé ne donnent
jamais une réussite. Une assertion contrariée donne un échec. Un nouveau succès ne remplace
que la même question sur les mêmes sources et le même exécuteur.

Chaque enregistrement explicite des réglages produit une identité locale aléatoire,
persistée avec le compteur de configuration et capturée avant l’exécution. La fraîcheur
compare cette identité, le compteur, l’activation, le canal et la version du pilote.
L’export conserve les reçus mais pas la configuration locale : un compteur identique
après restauration ne peut donc pas rendre une ancienne preuve actuelle. Les anciens
réglages sans identité restent lisibles sans migration implicite ; leur réenregistrement
explicite est nécessaire avant exécution, et leurs anciens reçus restent à réévaluer.

Le déclenchement après livraison d’un candidat est une permission séparée `automatic`,
désactivée par défaut, y compris pour les configurations existantes. Elle exige le contrôle
navigateur activé et une identité locale confirmée. Enregistrer ce choix ne lance rien et
ne rattrape aucun candidat historique. Le runner vérifie seulement le candidat qu’il vient
de livrer, après admission et avant sa décision finale, avec les sources, le contexte et
les permissions encore valides. Un reçu courant abouti peut être réutilisé. Le délai local
du navigateur est distinct de celui du fournisseur ; épuiser le budget fournisseur n’interdit
pas cette vérification locale autorisée et n’autorise aucun nouvel appel modèle. Révocation,
contexte changé ou arrêt explicite interrompent la vérification ; un résultat tardif ne
devient pas une réussite. L’interface distingue cette phase du travail de l’agent.

Les liens vers les critères déclarés dans le scénario restent explicitement déclaratifs :
exécuter une assertion prouve cette assertion, pas la pertinence ni l’exhaustivité du scénario.
La première tranche ne transforme donc pas ces liens en couverture métier approuvée et ne
déclenche aucune adoption automatique. L’examen de cette pertinence reste nécessaire pour
fermer la recette métier complète. Cela n’autorise pas de nouvel appel dans la campagne arrêtée.

## Vérification attendue

Contrat invalide/absent, navigateur absent, délai/interruption et changement de sources ;
parcours réel saisie → sauvegarde → redémarrage → lecture avec valeur unique, et variante
défectueuse qui perd l’écriture ; données utilisateur intactes ; refus réseau externe ;
exécution depuis Vérifications puis preuve visible dans le contrôle. Les fixtures restent
identifiées comme telles. La disponibilité d’une dépendance ne compte pas comme un essai réel.

Réexaminer le choix si un backend personnalisé, une matrice de navigateurs ou une isolation
OS renforcée devient nécessaire. Sources : [BrowserType](https://playwright.dev/docs/api/class-browsertype)
et [BrowserContext](https://playwright.dev/docs/api/class-browsercontext), consultées le 21 septembre.
