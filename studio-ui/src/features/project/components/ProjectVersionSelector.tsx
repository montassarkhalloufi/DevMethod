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
  if (!revisions?.length || !onSelectVersion) {
    return <strong>Version · {revisionId?.slice(0, 8) || 'aucune'}</strong>;
  }
  return (
    <select
      className="project-version-select"
      aria-label="Version du code"
      value={revisionId || ''}
      onChange={(event) => onSelectVersion(event.target.value)}
    >
      {revisions.map((revision) => (
        <option key={revision.id} value={revision.id}>
          {revision.id.slice(0, 8)} · {revision.id === activeRevisionId ? 'Appliquée · ' : ''}
          {revision.title}
        </option>
      ))}
    </select>
  );
}
