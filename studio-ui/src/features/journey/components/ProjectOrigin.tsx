import { useState } from 'react';
import type { JourneyOptions } from '../model/contracts';

const quoted = (value: string) => `'${value.replaceAll("'", "'\\''")}'`;
function ImportGuide() {
  const [source, setSource] = useState('/chemin/du-projet');
  const [workspace, setWorkspace] = useState('/chemin/du-studio');
  const command = `devmethod-studio import --source ${quoted(source)} --workspace ${quoted(workspace)}`;
  return (
    <details className="journey-import-guide">
      <summary>Reprendre un projet existant sans DevMethod</summary>
      <p>
        Inspectez un dossier local ou un dépôt déjà cloné, puis conservez sa référence initiale dans
        un nouvel espace Studio. Cette opération se lance dans le terminal ; le dossier source reste
        intact.
      </p>
      <div className="journey-brief-columns">
        <label>
          Dossier source
          <input value={source} onChange={(event) => setSource(event.target.value)} />
        </label>
        <label>
          Nouveau dossier Studio, distinct et vide
          <input value={workspace} onChange={(event) => setWorkspace(event.target.value)} />
        </label>
      </div>
      <ol>
        <li>
          Inspecter les fichiers retenus, exclusions et capacités :<pre>{command} --dry-run</pre>
        </li>
        <li>
          Importer puis ouvrir le nouvel espace :
          <pre>
            {command}
            {'\n'}devmethod-studio serve --workspace {quoted(workspace)}
          </pre>
        </li>
      </ol>
      <p className="journey-action-note">
        Aucun script du projet n’est exécuté à l’import. L’analyse distingue les informations
        détectées, déclarées et inconnues. Un projet importable n’est pas nécessairement exécutable
        dans l’aperçu Studio.
      </p>
    </details>
  );
}
export function ProjectOrigin({
  state,
  onOpenSource,
}: Pick<JourneyOptions, 'state' | 'onOpenSource'>) {
  const imported = state.import;
  if (!imported)
    return (
      <section className="journey-origin">
        <h4>Deux points de départ</h4>
        <p>
          <strong>Créer de zéro :</strong> décrivez votre idée ; le cadrage, la conception et la
          réalisation s’appuieront sur vos choix.
        </p>
        <ImportGuide />
      </section>
    );
  return (
    <section className="journey-origin" aria-labelledby="project-origin-title">
      <h4 id="project-origin-title">Projet repris · {imported.source.name}</h4>
      <p>
        {imported.inventory.included} fichiers conservés · référence{' '}
        {imported.baselineRevision.slice(0, 8)} · import du{' '}
        {new Date(imported.source.importedAt).toLocaleString('fr-FR')}.
      </p>
      <p className="journey-action-note">
        Cet état décrit les sources au moment de l’import. Il ne constitue ni une validation du
        produit ni une exécution de ses commandes.
      </p>
      <div className="journey-origin-facts">
        {imported.context.facts.map((fact, index) => (
          <article key={`${fact.provenance.path}:${index}`}>
            <strong>{fact.label}</strong>
            <p>{fact.value}</p>
            <small>
              {fact.provenance.kind === 'declared'
                ? 'Déclaré dans le projet'
                : 'Détecté dans les sources'}{' '}
              ·{' '}
            </small>
            {onOpenSource ? (
              <button
                type="button"
                onClick={() => onOpenSource(fact.provenance.path, imported.baselineRevision)}
              >
                {fact.provenance.path} ↗
              </button>
            ) : (
              <code>{fact.provenance.path}</code>
            )}
          </article>
        ))}
      </div>
      <details open>
        <summary>Ce qui reste à établir</summary>
        <ul>
          {imported.context.unknowns.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </details>
      <details>
        <summary>Périmètre de l’import · {imported.inventory.excluded.length} exclusions</summary>
        <p>
          Empreinte de la référence : <code>{imported.source.fingerprint}</code>
        </p>
        <p>
          Analyse : {imported.context.analysis.status} ·{' '}
          {imported.context.analysis.stack.join(', ') || 'Stack non identifiée'}.
        </p>
        <ul>
          {imported.inventory.excluded.map((item) => (
            <li key={item.path}>
              <code>{item.path}</code> — {item.reason}
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
