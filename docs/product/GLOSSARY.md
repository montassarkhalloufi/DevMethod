# Glossaire

| Terme | Définition dans DevMethod |
| --- | --- |
| **Mission** | Résultat utilisateur autorisé avec portée, critères, sources, dépendances, preuves et prochaine action |
| **Slice** | Sous-ensemble cohérent et vérifiable d'une mission substantielle |
| **Skill** | Procédure locale lue par l'agent ; ce n'est pas un service ni un exécuteur autonome |
| **Étape** | Point d'entrée visible tel que `devmethod-review` ou `devmethod-verify` |
| **Mode demandé** | Guidé, DevAuto ou Autonome ; préférence de délégation |
| **Autonomie effective** | Auto-Continue, Verify, Human Decision ou Bounded Stop, calculé par la politique |
| **Preuve** | Observation attribuée à une source, une version, un périmètre et des limites |
| **Déclaration** | Information affirmée par une personne, un agent ou un enregistrement ; elle n'est pas forcément vérifiée |
| **Vérification** | Procédure effectivement exécutée qui produit une observation inspectable |
| **Critère** | Attente observable du besoin ; un critère n'est pas sa propre preuve |
| **Révision** | Version immuable des fichiers connue du Studio |
| **Candidate** | Révision préparée mais pas nécessairement appliquée ou publiée |
| **Adoption/application** | Action qui rend une révision candidate active dans le Studio |
| **Evidence Graph** | Graphe de confiance reliant intentions, décisions, code, contrôles, jobs, runtime et décisions d'autonomie |
| **Vue Architecture** | Graphe statique de la structure du logiciel ; distinct du Evidence Graph |
| **Risk Engine** | Politique déterministe qui agrège des signaux explicables et retient le plus grave actif |
| **Human Attention** | File d'éléments nécessitant lecture, renouvellement, inspection ou décision humaine |
| **Lire** | Accuser réception d'une information sans la résoudre |
| **Intervention** | Acceptation ou refus motivé, lié à une version, une action et un contexte précis |
| **Invalidation** | Passage d'une preuve à périmée lorsque ses dépendances, sa version ou son expiration l'exigent |
| **Bounded Stop** | Arrêt persistant empêchant la continuation automatique jusqu'à réconciliation |
| **Non-convergence** | Échecs répétés ou état impossible à réconcilier qui justifient un arrêt borné |
| **MCP** | Protocole d'outils externes ; ses permissions restent distinctes du Control Plane |
| **Checkpoint** | État de reprise lié à des sources et preuves identifiées ; il n'autorise aucun nouveau travail |
| **ADR** | Décision d'architecture durable avec contexte, choix, alternatives et conséquences |
| **Contrôle local** | Vérification exécutée dans le périmètre maîtrisé par le Studio |
| **Attestation externe** | Résultat déclaré par un pont ou un outil ; sa portée est limitée à la source annoncée |
