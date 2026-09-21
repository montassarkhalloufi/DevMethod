import { useI18n, translate, type StudioLocale } from '../../../i18n';
import { useEffect, useRef, useState } from 'react';
import type { FieldError, HomeOperation, ProjectInput, ProjectKind } from '../model/contracts';
import { projectActionLabel, projectInput, validateProjectInput } from '../model/home';
import { ProjectFormFields } from './ProjectFormFields';

function titles(locale: StudioLocale = 'en') {
  return {
    new: translate('Créer un projet', 'Create a project', undefined, locale),
    imported: translate('Importer un projet', 'Import a project', undefined, locale),
    existing: translate('Reprendre un projet', 'Resume a project', undefined, locale),
  };
}
function descriptions(locale: StudioLocale = 'en') {
  return {
    new: translate(
      'Une idée suffit pour commencer. Nous préciserons ensemble le résultat à obtenir.',
      'An idea is enough to begin. We will clarify the intended outcome together.',
      undefined,
      locale,
    ),
    imported: translate(
      'Partez de vos sources actuelles. DevMethod en crée une copie et préserve le dossier original.',
      'Start with your current sources. DevMethod creates a copy and preserves the original folder.',
      undefined,
      locale,
    ),
    existing: translate(
      'Retrouvez un projet déjà utilisé dans DevMethod Studio, avec son contexte et ses versions.',
      'Return to an existing DevMethod Studio project with its context and versions.',
      undefined,
      locale,
    ),
  };
}
const emptyFields = () => ({ name: '', idea: '', source: '', workspace: '' });

export function ProjectDialog({
  open,
  kind,
  operation,
  onDismiss,
  onSubmit,
  onEdit,
  departure,
}: {
  open: boolean;
  kind: ProjectKind;
  operation: HomeOperation;
  onDismiss(): void;
  onSubmit(input: ProjectInput): void;
  onEdit(): void;
  departure?: { onConfirm(): void; onCancel(): void };
}) {
  const { locale, t } = useI18n();
  const dialog = useRef<HTMLDialogElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const [drafts, setDrafts] = useState({
    new: emptyFields(),
    imported: emptyFields(),
    existing: emptyFields(),
  });
  const [formError, setFormError] = useState<{
    kind: ProjectKind;
    error: FieldError | null;
  } | null>(null);
  const validation = formError?.kind === kind ? formError.error : null;
  const busy = operation.phase !== 'idle';
  const confirmingDeparture = Boolean(departure);
  useEffect(() => {
    const node = dialog.current;
    if (open && node) {
      const wasOpen = node.open;
      if (!wasOpen) node.showModal();
      if (confirmingDeparture) node.querySelector<HTMLButtonElement>('[data-keep-idea]')?.focus();
      else if (wasOpen) node.querySelector<HTMLButtonElement>('button[type="submit"]')?.focus();
      else node.querySelector<HTMLInputElement>('input')?.focus();
    } else if (!open && node?.open) node.close();
  }, [open, confirmingDeparture]);
  function edit(field: keyof ReturnType<typeof emptyFields>, value: string) {
    setDrafts((current) => ({ ...current, [kind]: { ...current[kind], [field]: value } }));
    setFormError(null);
    onEdit();
  }
  const submitLabel = projectActionLabel(kind, operation, locale);
  return (
    <dialog
      ref={dialog}
      className="home-dialog"
      aria-labelledby="home-dialog-title"
      aria-describedby="home-dialog-description"
      onCancel={(event) => {
        if (departure) {
          event.preventDefault();
          departure.onCancel();
        } else if (busy) event.preventDefault();
      }}
      onClose={onDismiss}
    >
      <div className="home-dialog-heading">
        <span className="home-eyebrow">{t('Votre point de départ', 'Your starting point')}</span>
        <button
          type="button"
          aria-label={t('Fermer', 'Close')}
          disabled={busy}
          onClick={departure?.onCancel || onDismiss}
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <h2 id="home-dialog-title">
        {departure ? t('Quitter cette idée ?', 'Leave this idea?') : titles(locale)[kind]}
      </h2>
      <p id="home-dialog-description">
        {departure
          ? t(
              'Votre idée et ses références ne sont pas encore enregistrées. Si vous ouvrez un autre projet, elles seront perdues.',
              'Your idea and references have not been saved. Opening another project will discard them.',
            )
          : descriptions(locale)[kind]}
      </p>
      {departure ? (
        <div className="home-dialog-actions">
          <button type="button" data-keep-idea onClick={departure.onCancel}>
            {' '}
            {t('Garder mon idée', 'Keep my idea')}{' '}
          </button>
          <button type="button" className="primary" onClick={departure.onConfirm}>
            {' '}
            {t('Ouvrir quand même', 'Open anyway')}{' '}
          </button>
        </div>
      ) : null}
      <form
        ref={form}
        hidden={confirmingDeparture}
        onSubmit={(event) => {
          event.preventDefault();
          if (busy || departure) return;
          const input = projectInput(kind, event.currentTarget);
          const error = validateProjectInput(input, locale);
          setFormError({ kind, error });
          if (error) {
            const field = form.current?.elements.namedItem(error.field);
            if (field instanceof HTMLElement) field.focus();
          } else onSubmit(input);
        }}
      >
        <fieldset disabled={busy}>
          <ProjectFormFields
            kind={kind}
            values={drafts[kind]}
            validation={validation}
            onEdit={edit}
          />
        </fieldset>
        <p className="home-form-note">
          {' '}
          {t(
            'Aucun agent ni script du projet n’est lancé automatiquement.',
            'No agent or project script runs automatically.',
          )}{' '}
        </p>
        {validation ? (
          <p id="home-form-error" role="alert" className="home-error">
            {validation.message}
          </p>
        ) : null}
        {operation.project ? (
          <p className="home-saved" role="status">
            {t('« {name} » est enregistré.', '“{name}” is saved.', {
              name: operation.project.name,
            })}{' '}
            {operation.error
              ? t('Vous pouvez réessayer son ouverture.', 'You can try opening it again.')
              : t('Ouverture du Studio…', 'Opening Studio…')}
          </p>
        ) : null}
        {operation.error ? (
          <p role="alert" className="home-error">
            {operation.error}
          </p>
        ) : null}
        <div className="home-dialog-actions">
          <button type="button" disabled={busy} onClick={onDismiss}>
            {' '}
            {t('Retour', 'Back')}{' '}
          </button>
          <button type="submit" className="primary" disabled={busy}>
            {busy ? <span className="home-spinner" aria-hidden="true" /> : null}
            {submitLabel}
          </button>
        </div>
        <p className="home-sr" role="status">
          {busy ? submitLabel : ''}
        </p>
      </form>
    </dialog>
  );
}
