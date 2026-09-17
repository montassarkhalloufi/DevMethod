import type { FieldError, ProjectFields, ProjectKind } from '../model/contracts';

export function ProjectFormFields({
  kind,
  values,
  validation,
  onEdit,
}: {
  kind: ProjectKind;
  values: ProjectFields;
  validation: FieldError | null;
  onEdit(field: keyof ProjectFields, value: string): void;
}) {
  const pathField = kind === 'existing' ? 'workspace' : 'source';
  function fieldStatus(field: keyof ProjectFields) {
    const invalid = validation?.field === field;
    return {
      'aria-invalid': invalid || undefined,
      'aria-describedby': invalid ? 'home-form-error' : undefined,
    };
  }
  return (
    <>
      {kind !== 'existing' ? (
        <label>
          <span className="home-field-label">
            Nom du projet {kind === 'imported' ? <small>· facultatif</small> : null}
          </span>
          <input
            name="name"
            autoComplete="off"
            required={kind === 'new'}
            maxLength={200}
            value={values.name}
            onChange={(event) => onEdit('name', event.target.value)}
            placeholder="Par exemple, Mon carnet de lectures…"
            {...fieldStatus('name')}
          />
        </label>
      ) : null}
      {kind === 'new' ? (
        <label>
          Que souhaitez-vous créer ?
          <textarea
            name="idea"
            autoComplete="off"
            required
            maxLength={20000}
            rows={4}
            value={values.idea}
            onChange={(event) => onEdit('idea', event.target.value)}
            placeholder="Une application pour…"
            {...fieldStatus('idea')}
          />
        </label>
      ) : (
        <label>
          {kind === 'existing' ? 'Dossier du projet Studio' : 'Dossier des sources'}
          <input
            name={pathField}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            required
            value={values[pathField]}
            onChange={(event) => onEdit(pathField, event.target.value)}
            placeholder="/Users/vous/mon-projet…"
            {...fieldStatus(pathField)}
            aria-describedby={
              validation?.field === pathField ? 'home-form-error' : 'home-path-help'
            }
          />
          <small id="home-path-help">Chemin absolu d’un dossier sur cet ordinateur.</small>
        </label>
      )}
    </>
  );
}
