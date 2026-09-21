import { useI18n } from '../../../i18n';
import { useState } from 'react';
import type { JourneyOptions } from '../model/contracts';

const quoted = (value: string) => `'${value.replaceAll("'", "'\\''")}'`;
function ImportGuide() {
  const { t } = useI18n();
  const [source, setSource] = useState(t('/chemin/du-projet', '/path/to/project'));
  const [workspace, setWorkspace] = useState(t('/chemin/du-studio', '/path/to/studio'));
  const command = `devmethod studio import --source ${quoted(source)} --workspace ${quoted(workspace)}`;
  return (
    <details className="journey-import-guide">
      <summary>
        {t(
          'Reprendre un projet existant sans DevMethod',
          'Bring an existing project into DevMethod',
        )}
      </summary>
      <p>
        {' '}
        {t(
          'Inspectez un dossier local ou un dépôt déjà cloné, puis conservez sa référence initiale dans un nouvel espace Studio. Cette opération se lance dans le terminal ; le dossier source reste intact.',
          'Inspect a local folder or an already cloned repository, then preserve its initial reference in a new Studio workspace. Run this operation in the terminal; the source folder stays intact.',
        )}{' '}
      </p>
      <div className="journey-brief-columns">
        <label>
          {' '}
          {t('Dossier source', 'Source folder')}{' '}
          <input value={source} onChange={(event) => setSource(event.target.value)} />
        </label>
        <label>
          {' '}
          {t('Nouveau dossier Studio, distinct et vide', 'New, separate, empty Studio folder')}{' '}
          <input value={workspace} onChange={(event) => setWorkspace(event.target.value)} />
        </label>
      </div>
      <ol>
        <li>
          {' '}
          {t(
            'Inspecter les fichiers retenus, exclusions et capacités :',
            'Inspect included files, exclusions, and capabilities:',
          )}
          <pre>{command} --dry-run</pre>
        </li>
        <li>
          {' '}
          {t('Importer puis ouvrir le nouvel espace :', 'Import and open the new workspace:')}{' '}
          <pre>
            {command}
            {'\n'}devmethod studio serve --workspace {quoted(workspace)}
          </pre>
        </li>
      </ol>
      <p className="journey-action-note">
        {' '}
        {t(
          'Aucun script du projet n’est exécuté à l’import. L’analyse distingue les informations détectées, déclarées et inconnues. Un projet importable n’est pas nécessairement exécutable dans l’aperçu Studio.',
          'No project script runs during import. The analysis distinguishes detected, declared, and unknown information. An importable project is not necessarily runnable in Studio preview.',
        )}{' '}
      </p>
    </details>
  );
}
export function ProjectOrigin({
  state,
  onOpenSource,
}: Pick<JourneyOptions, 'state' | 'onOpenSource'>) {
  const { locale, t } = useI18n();
  const imported = state.import;
  if (!imported)
    return (
      <section className="journey-origin">
        <h4>{t('Deux points de départ', 'Two starting points')}</h4>
        <p>
          <strong>{t('Créer de zéro :', 'Start from scratch:')}</strong>{' '}
          {t(
            'décrivez votre idée ; le cadrage, la conception et la réalisation s’appuieront sur vos choix.',
            'describe your idea; framing, design, and implementation will build on your choices.',
          )}{' '}
        </p>
        <ImportGuide />
      </section>
    );
  return (
    <section className="journey-origin" aria-labelledby="project-origin-title">
      <h4 id="project-origin-title">
        {t('Projet repris ·', 'Imported project ·')} {imported.source.name}
      </h4>
      <p>
        {imported.inventory.included}{' '}
        {t('fichiers conservés · référence', 'files preserved · reference')}{' '}
        {imported.baselineRevision.slice(0, 8)} {t('· import du', '· imported on')}{' '}
        {new Date(imported.source.importedAt).toLocaleString(locale)}.
      </p>
      <p className="journey-action-note">
        {' '}
        {t(
          'Cet état décrit les sources au moment de l’import. Il ne constitue ni une validation du produit ni une exécution de ses commandes.',
          'This state describes the sources at import time. It is neither product validation nor execution of its commands.',
        )}{' '}
      </p>
      <div className="journey-origin-facts">
        {imported.context.facts.map((fact, index) => (
          <article key={`${fact.provenance.path}:${index}`}>
            <strong>{fact.label}</strong>
            <p>{fact.value}</p>
            <small>
              {fact.provenance.kind === 'declared'
                ? t('Déclaré dans le projet', 'Declared in the project')
                : t('Détecté dans les sources', 'Detected in the sources')}{' '}
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
        <summary>{t('Ce qui reste à établir', 'Still to establish')}</summary>
        <ul>
          {imported.context.unknowns.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </details>
      <details>
        <summary>
          {t('Périmètre de l’import ·', 'Import scope ·')} {imported.inventory.excluded.length}{' '}
          {t('exclusions', 'exclusions')}
        </summary>
        <p>
          {' '}
          {t('Empreinte de la référence :', 'Reference fingerprint:')}{' '}
          <code>{imported.source.fingerprint}</code>
        </p>
        <p>
          {' '}
          {t('Analyse :', 'Analysis:')} {imported.context.analysis.status} ·{' '}
          {imported.context.analysis.stack.join(', ') ||
            t('Stack non identifiée', 'Stack not identified')}
          .
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
