import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import type { Registration, WorkshopData } from '../model/types';

interface Props {
  data: WorkshopData;
  busy: boolean;
  onCancel: (id: string, waiting: boolean) => void;
}

export function Registrations({ data, busy, onCancel }: Props) {
  const [confirmation, setConfirmation] = useState<string | null>(null);
  function row(entry: Registration, waiting: boolean) {
    const workshop = data.workshops.find((item) => item.id === entry.workshopId);
    if (!workshop) return null;
    const position =
      data.waitlist
        .filter((item) => item.workshopId === entry.workshopId)
        .findIndex((item) => item.id === entry.id) + 1;
    return (
      <article className="registration-item" key={entry.id}>
        <div>
          <strong>
            {entry.name} — {workshop.title}
          </strong>
          <span>
            {waiting ? `En attente · position ${position} — ` : ''}
            {workshop.time}, {workshop.location}
          </span>
        </div>
        <div className="registration-actions">
          <Button
            className="cancel-button"
            variant="outline"
            disabled={busy}
            aria-expanded={confirmation === entry.id}
            aria-controls={`confirm-${entry.id}`}
            onClick={() => setConfirmation(confirmation === entry.id ? null : entry.id)}
          >
            {waiting ? 'Quitter la liste' : 'Annuler'}
          </Button>
          {confirmation === entry.id && (
            <div
              className="registration-confirmation"
              id={`confirm-${entry.id}`}
              role="group"
              aria-label={`Confirmer l’annulation pour ${entry.name}`}
            >
              <p>
                {waiting
                  ? 'Vous perdrez votre position dans la liste d’attente.'
                  : 'La place libérée sera proposée à la première personne en attente.'}
              </p>
              <div className="form-actions">
                <Button
                  className="cancel-button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    onCancel(entry.id, waiting);
                    setConfirmation(null);
                  }}
                >
                  Confirmer l’annulation
                </Button>
                <Button variant="link" onClick={() => setConfirmation(null)}>
                  Garder mon inscription
                </Button>
              </div>
            </div>
          )}
        </div>
      </article>
    );
  }
  return (
    <section
      id="inscriptions"
      className="registrations-section"
      aria-labelledby="registrations-title"
    >
      <div className="registrations-inner">
        <div>
          <p className="eyebrow">Vos réservations</p>
          <h2 id="registrations-title">Mes inscriptions</h2>
        </div>
        <div className="registration-list" aria-live="polite">
          {data.registrations.length === 0 && <p>Aucune inscription pour le moment.</p>}
          {data.registrations.map((entry) => row(entry, false))}
          {data.waitlist.length > 0 && <h3>Liste d’attente</h3>}
          {data.waitlist.map((entry) => row(entry, true))}
        </div>
      </div>
    </section>
  );
}
