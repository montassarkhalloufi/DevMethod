import { useI18n } from '../../../i18n';
import type { ProjectWidgetOptions } from '../model/widget';

type Props = Pick<
  ProjectWidgetOptions,
  'revisionId' | 'activeRevisionId' | 'revisions' | 'onSelectVersion'
>;

export function ProjectVersionSelector({
  revisionId,
  activeRevisionId,
  revisions,
  onSelectVersion,
}: Props) {
  const { t } = useI18n();
  if (!revisions?.length || !onSelectVersion) {
    return <strong>Version · {revisionId?.slice(0, 8) || t('aucune', 'none')}</strong>;
  }
  return (
    <select
      className="project-version-select"
      aria-label={t('Version du code', 'Code version')}
      value={revisionId || ''}
      onChange={(event) => onSelectVersion(event.target.value)}
    >
      {revisions.map((revision) => (
        <option key={revision.id} value={revision.id}>
          {revision.id.slice(0, 8)} ·{' '}
          {revision.origin?.kind === 'import'
            ? t('Référence importée · ', 'Imported reference · ')
            : revision.id === activeRevisionId
              ? t('Appliquée · ', 'Applied · ')
              : ''}
          {revision.title}
        </option>
      ))}
    </select>
  );
}
