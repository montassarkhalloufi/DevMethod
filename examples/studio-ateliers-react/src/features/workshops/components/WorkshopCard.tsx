import { useCallback, useRef, useState } from 'react';
import { Button } from '@/shared/ui/button';
import { CATEGORY_LABELS } from '../model/domain';
import type { Workshop } from '../model/types';

interface Props {
  workshop: Workshop;
  remaining: number;
  waitingCount: number;
  draft: string;
  busy: boolean;
  onDraft: (name: string) => void;
  onRegister: () => Promise<boolean>;
}

const weekdayFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', timeZone: 'UTC' });
const monthFormat = new Intl.DateTimeFormat('fr-FR', { month: 'long', timeZone: 'UTC' });

function DateBlock({ value }: { value: string }) {
  const date = new Date(`${value}T00:00:00Z`);
  const validDate = !Number.isNaN(date.getTime());
  return (
    <div className="date-block">
      <span className="weekday">
        {validDate ? weekdayFormat.format(date).replace('.', '') : 'Date'}
      </span>
      <strong className="day">
        {validDate ? String(date.getUTCDate()).padStart(2, '0') : '—'}
      </strong>
      <span className="date-month">{validDate ? monthFormat.format(date) : value}</span>
    </div>
  );
}

function WaitingNote({ count }: { count: number }) {
  return (
    <p className="waitlist-note">
      {count > 0 && `${count} ${count === 1 ? 'personne en attente.' : 'personnes en attente.'} `}
      La première personne prend la prochaine place libérée, sans email.
    </p>
  );
}

export function WorkshopCard({
  workshop,
  remaining,
  waitingCount,
  draft,
  busy,
  onDraft,
  onRegister,
}: Props) {
  const [open, setOpen] = useState(Boolean(draft));
  const [nameError, setNameError] = useState('');
  const edits = useRef(0);
  const focusRequested = useRef(false);
  const inputElement = useRef<HTMLInputElement | null>(null);
  const focusInput = useCallback((input: HTMLInputElement | null) => {
    inputElement.current = input;
    if (input && focusRequested.current) {
      focusRequested.current = false;
      input.focus();
    }
  }, []);
  const waiting = remaining === 0;
  const nameId = `name-${workshop.id}`;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim()) {
      setNameError('Indiquez votre nom pour confirmer cette inscription.');
      inputElement.current?.focus();
      return;
    }
    const submittedAt = edits.current;
    if ((await onRegister()) && edits.current === submittedAt) setOpen(false);
  }

  return (
    <article className="workshop-card" data-category={workshop.category}>
      <DateBlock value={workshop.date} />
      <div className="workshop-details">
        <span className="category-pill">
          {CATEGORY_LABELS[workshop.category] ?? workshop.category}
        </span>
        <h2 className="workshop-title">{workshop.title}</h2>
        <p className="meta">
          <span aria-hidden="true">◷</span> {workshop.time}
        </p>
        <p className="meta">
          <span aria-hidden="true">●</span> {workshop.location}
        </p>
      </div>
      <div className="booking-panel">
        <p className={`availability${waiting ? ' full' : ''}`}>
          {waiting
            ? 'Complet'
            : `${remaining} ${remaining === 1 ? 'place disponible' : 'places disponibles'}`}
        </p>
        {(waiting || waitingCount > 0) && <WaitingNote count={waitingCount} />}
        {open ? (
          <form className="booking-form" onSubmit={(event) => void submit(event)}>
            <label htmlFor={nameId}>Votre nom</label>
            <input
              ref={focusInput}
              id={nameId}
              className="name-input"
              name="name"
              value={draft}
              onChange={(event) => {
                edits.current += 1;
                setNameError('');
                onDraft(event.target.value);
              }}
              maxLength={80}
              autoComplete="name"
              required
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? `${nameId}-error` : undefined}
            />
            {nameError && (
              <p className="form-error" id={`${nameId}-error`} role="alert">
                {nameError}
              </p>
            )}
            <div className="form-actions mt-3">
              <Button className="primary-button" type="submit" disabled={busy}>
                {busy ? 'Enregistrement…' : waiting ? 'Rejoindre la liste' : 'Confirmer'}
              </Button>
              <Button
                className="text-button"
                variant="link"
                type="button"
                onClick={() => setOpen(false)}
              >
                Fermer
              </Button>
            </div>
          </form>
        ) : (
          <Button
            className="primary-button"
            type="button"
            disabled={busy}
            onClick={(event) => {
              focusRequested.current =
                event.detail === 0 || window.matchMedia?.('(pointer: fine)').matches === true;
              setOpen(true);
            }}
          >
            {waiting ? 'Liste d’attente →' : 'S’inscrire →'}
          </Button>
        )}
      </div>
    </article>
  );
}
