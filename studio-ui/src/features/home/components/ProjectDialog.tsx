import { useEffect, useRef, useState } from 'react';
import type { FieldError, HomeOperation, ProjectInput, ProjectKind } from '../model/contracts';
import { projectActionLabel, projectInput, validateProjectInput } from '../model/home';
import { ProjectFormFields } from './ProjectFormFields';

const titles = {
  new: 'Créer un projet',
  imported: 'Importer un projet',
  existing: 'Reprendre un projet',
};
const descriptions = {
  new: 'Une idée suffit pour commencer. Nous préciserons ensemble le résultat à obtenir.',
  imported:
    'Partez de vos sources actuelles. DevMethod en crée une copie et préserve le dossier original.',
  existing:
    'Retrouvez un projet déjà utilisé dans DevMethod Studio, avec son contexte et ses versions.',
};
const emptyFields = () => ({ name: '', idea: '', source: '', workspace: '' });

export function ProjectDialog({
  open,
  kind,
  operation,
  onDismiss,
  onSubmit,
  onEdit,
}: {
  open: boolean;
  kind: ProjectKind;
  operation: HomeOperation;
  onDismiss(): void;
  onSubmit(input: ProjectInput): void;
  onEdit(): void;
}) {
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
  useEffect(() => {
    const node = dialog.current;
    if (open && node && !node.open) {
      node.showModal();
      node.querySelector<HTMLInputElement>('input')?.focus();
    } else if (!open && node?.open) node.close();
  }, [open]);
  function edit(field: keyof ReturnType<typeof emptyFields>, value: string) {
    setDrafts((current) => ({ ...current, [kind]: { ...current[kind], [field]: value } }));
    setFormError(null);
    onEdit();
  }
  const submitLabel = projectActionLabel(kind, operation);
  return (
    <dialog
      ref={dialog}
      className="home-dialog"
      aria-labelledby="home-dialog-title"
      aria-describedby="home-dialog-description"
      onCancel={(event) => {
        if (busy) event.preventDefault();
      }}
      onClose={onDismiss}
    >
      <div className="home-dialog-heading">
        <span className="home-eyebrow">Votre point de départ</span>
        <button type="button" aria-label="Fermer" disabled={busy} onClick={onDismiss}>
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <h2 id="home-dialog-title">{titles[kind]}</h2>
      <p id="home-dialog-description">{descriptions[kind]}</p>
      <form
        ref={form}
        onSubmit={(event) => {
          event.preventDefault();
          if (busy) return;
          const input = projectInput(kind, event.currentTarget);
          const error = validateProjectInput(input);
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
          Aucun agent ni script du projet n’est lancé automatiquement.
        </p>
        {validation ? (
          <p id="home-form-error" role="alert" className="home-error">
            {validation.message}
          </p>
        ) : null}
        {operation.project ? (
          <p className="home-saved" role="status">
            « {operation.project.name} » est enregistré.{' '}
            {operation.error ? 'Vous pouvez réessayer son ouverture.' : 'Ouverture du Studio…'}
          </p>
        ) : null}
        {operation.error ? (
          <p role="alert" className="home-error">
            {operation.error}
          </p>
        ) : null}
        <div className="home-dialog-actions">
          <button type="button" disabled={busy} onClick={onDismiss}>
            Retour
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
