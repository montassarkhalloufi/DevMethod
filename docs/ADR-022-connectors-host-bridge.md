# ADR-022 — Connecteurs par capacité et retour de preuves via l’hôte

Date : 17 septembre 2026. Statut : adopté dans la portée autorisée.

Le besoin utilisateur couvre deux usages : améliorer le projet grâce à des outils de
diagnostic, et intégrer des services applicatifs tels que mail, base de données, backend
ou authentification. Le fournisseur doit rester un choix du projet. Les contrôles externes
de Studio étaient seulement des descriptions et une demande préparée pour l’agent.

Le catalogue expose maintenant des options locales libres, API et MCP avec leur
documentation officielle, leurs limites et les contrôles concernés. Un choix disponible
dans le catalogue est une proposition. Une configuration conserve seulement un identifiant
de profil hôte et des références de secrets. Un probe reçu de l’hôte authentifié peut
attester les capacités observées ; cette attestation ne signifie pas que Studio possède
un client réseau, ni que l’application a intégré le service.

Nous retenons le bridge hôte déjà utilisé par Studio, complété par des tickets de contrôle
à usage unique. Chaque ticket lie la version sélectionnée, les empreintes exactes de ses
fichiers, la configuration du connecteur, son probe et l’outil/version attendus. Il expire
après 30 minutes et conserve aussi la version appliquée au départ pour détecter une
bascule de contexte. Une proposition non appliquée peut ainsi être contrôlée sans
valider implicitement la version active. Le retour est strictement validé et rejoint le journal qualité existant.
Un rejeu identique restitue la preuve conservée ; un résultat différent, tardif ou rattaché
à un contexte périmé est refusé. Un transport réussi ou `isError: false` ne constitue pas
un résultat de contrôle ; le statut attendu est explicite.

Cette décision réutilise les accès et outils déjà autorisés chez l’hôte. Un client MCP
embarqué avec OAuth et transports réseau offrirait une exécution directe, mais imposerait
un nouveau gestionnaire de secrets, de sessions, de cibles et d’autorisations. L’import
libre d’un rapport sans ticket ne conserverait pas suffisamment le contexte d’exécution.
Ces deux possibilités ne sont pas le comportement de cette tranche.

Les services applicatifs préparent une demande liée à une version. Choisir Resend,
Mailpit, SMTP, PostgreSQL, Supabase, Appwrite ou un backend existant ne lance aucun envoi,
installation, provisionnement ou migration. Les décisions métier, les réservations
d’approbation et les autorisations externes existantes continuent de s’appliquer.

Les preuves externes sont des observations rapportées par un hôte authentifié. Studio
vérifie la forme, les limites, le ticket et les sources locales ; il ne certifie pas
l’exécution distante. Les diagnostics expurgés, métriques et cibles sont conservés sans
stdout brut. Un changement de configuration, de version d’outil ou d’interface MCP
invalide les preuves dépendantes sans les effacer ; un probe équivalent ne les invalide
pas automatiquement.

Les tests comprennent un vrai `node --check` sur des fichiers de fixture et son retour
dans le journal, ainsi que les refus d’empreinte périmée, délai, conflit, outil MCP non
attesté et valeurs sensibles. Les probes MCP/API de tests sont des fixtures de protocole,
pas des connexions effectives aux services mentionnés. Aucun fournisseur payant ni
installation n’a été utilisé pour cette tranche. Voir [le protocole](STUDIO-CONNECTORS.md).
