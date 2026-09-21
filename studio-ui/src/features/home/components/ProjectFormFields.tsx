import { useI18n } from '../../../i18n';
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
  const { t } = useI18n();
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
            {' '}
            {t('Nom du projet', 'Project name')}{' '}
            {kind === 'imported' ? <small>{t('· facultatif', '· optional')}</small> : null}
          </span>
          <input
            name="name"
            autoComplete="off"
            required={kind === 'new'}
            maxLength={200}
            value={values.name}
            onChange={(event) => onEdit('name', event.target.value)}
            placeholder={t(
              'Par exemple, Mon carnet de lectures…',
              'For example, My reading notebook…',
            )}
            {...fieldStatus('name')}
          />
        </label>
      ) : null}
      {kind === 'new' ? (
        <label>
          {' '}
          {t('Que souhaitez-vous créer ?', 'What would you like to create?')}{' '}
          <textarea
            name="idea"
            autoComplete="off"
            required
            maxLength={20000}
            rows={4}
            value={values.idea}
            onChange={(event) => onEdit('idea', event.target.value)}
            placeholder={t('Une application pour…', 'An app to…')}
            {...fieldStatus('idea')}
          />
        </label>
      ) : (
        <label>
          {kind === 'existing'
            ? t('Dossier du projet Studio', 'Studio project folder')
            : t('Dossier des sources', 'Source folder')}
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
          <small id="home-path-help">
            {t(
              'Chemin absolu d’un dossier sur cet ordinateur.',
              'Absolute path to a folder on this computer.',
            )}
          </small>
        </label>
      )}
    </>
  );
}
