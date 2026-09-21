# Scénarios navigateur dans Studio

Ce contrôle optionnel exécute des assertions sur une copie de la version sélectionnée,
avec des données initialement vides. Activez-le dans **Vérifications**, choisissez Chrome
ou Edge déjà installé, puis lancez **Scénarios navigateur du candidat**. Enregistrer le
réglage ne lance rien. Le pilote optionnel `playwright-core` est fourni par l’installation
npm normale ; une installation qui omet les dépendances optionnelles conserve les autres
contrôles, mais ne peut pas exécuter celui-ci. Aucun navigateur n’est téléchargé.

L’option distincte **Exécuter automatiquement après chaque candidat de l’agent** autorise
les mêmes scénarios locaux à la fin d’une demande native, avant la décision de contrôle.
Elle est désactivée par défaut. L’enregistrer ne lance aucune demande à l’agent, ne vérifie
pas les anciennes versions et n’adopte aucun candidat. Le résultat reste visible dans
Vérifications. Arrêter l’agent ou révoquer l’autorisation interrompt une vérification en cours.

Le candidat doit contenir `devmethod.browser.json`. Exemple pour une application qui expose
un champ « Valeur », un bouton « Enregistrer », un statut nommé « Sauvegarde » et conserve
la valeur dans `data.value` du runtime local : adaptez les cibles et attendus à votre produit.

```json
{
  "schemaVersion": 1,
  "scenarios": [{
    "id": "saved-value",
    "title": "Une valeur sauvegardée survit au redémarrage",
    "criterionIds": [],
    "steps": [
      { "action": "fill", "target": { "role": "textbox", "name": "Valeur" }, "value": "Essai-{{nonce}}" },
      { "action": "click", "target": { "role": "button", "name": "Enregistrer" } },
      { "action": "expectText", "target": { "role": "status", "name": "Sauvegarde" }, "text": "Enregistré" },
      { "action": "expectData", "path": ["value"], "expected": "Essai-{{nonce}}" },
      { "action": "restart" },
      { "action": "expectValue", "target": { "role": "textbox", "name": "Valeur" }, "value": "Essai-{{nonce}}" }
    ]
  }]
}
```

Les cibles sont soit `{ "role": "button", "name": "Nom exact" }`, soit
`{ "testId": "identifiant" }`. Les assertions disponibles sont `expectText` (texte avec
espaces normalisés), `expectValue`, `expectVisible` et `expectData` (égalité JSON exacte,
chemin relatif à `data`, clés ou indices de tableau). `reload` recharge la page ; `restart`
ferme son contexte et redémarre le runtime avec les mêmes données isolées, puis ouvre
un contexte vierge. La valeur `{{nonce}}` est unique au scénario et remplace uniquement
les valeurs textuelles, jamais les clés JSON. Chaque scénario commence avec des données vides.

Limites : six scénarios, quatre-vingts étapes au total, au moins une assertion par scénario,
JSON de 64 Kio au plus ; délai global de soixante secondes plus nettoyage borné. Les champs
inconnus, JavaScript libre et URL arbitraires sont refusés. Seul le runtime HTML ou React
compilé de Studio est pris en charge ; aucun backend ou script package personnalisé n’est lancé.

Le reçu distingue les assertions exécutées des critères déclarés. Pour `criterionIds`,
utilisez seulement des identifiants du cadrage actuel. Ce lien ne prouve pas à lui seul que
le scénario couvre correctement tout le critère. Une réussite n’est ni une validation
humaine ni une autorisation automatique d’appliquer la version. Les sources et critères
modifiés rendent leurs preuves dépendantes à réévaluer.

Dans le détail d’un reçu, **Examiner la couverture métier** affiche les critères du cadrage
et les étapes exactes du manifeste avec leurs résultats. Sélectionnez un critère et les
scénarios à apprécier, puis choisissez une conclusion : **suffisante pour ce critère dans
ce périmètre**, **pertinente mais partielle**, ou **non pertinente**. Précisez le périmètre
et la justification ; aucun choix n’est précoché. Une conclusion suffisante requiert des
scénarios entièrement exécutés et un reçu local réussi, toujours actuel. Elle exprime votre
appréciation de leur pertinence, distincte de ce que le navigateur a réellement exécuté.

L’appréciation apparaît dans les décisions et le graphe des preuves. Elle ne relance aucun
agent et n’adopte pas la version. Si le contexte a changé avant confirmation, vos saisies
restent disponibles : actualisez l’examen, relisez-le puis confirmez de nouveau. Une nouvelle
appréciation du même critère et de la même version remplace la précédente, sans effacer
l’historique. Une autre version ou une nouvelle exécution exigent leur propre appréciation.

Les reçus sont conservés lors d’un export/restauration, mais l’autorisation du navigateur
reste locale. Après restauration, activez le contrôle sur cette installation et relancez-le
pour obtenir une preuve actuelle. Un ancien réglage sans identité locale demande également
un réenregistrement explicite ; cette opération ne valide pas les anciens résultats.

Les données du projet ne sont pas copiées dans la recette et ne sont pas modifiées par elle.
Le navigateur est lancé dans un nouveau processus sans profil personnel. Les requêtes vers
d’autres origines, service workers et WebSockets sont bloqués ; cela ne constitue pas une
isolation réseau au niveau du système d’exploitation. Voir [ADR 033](ADR-033-local-browser-verification.md).
