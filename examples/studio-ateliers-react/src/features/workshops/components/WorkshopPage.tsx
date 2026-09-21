import { Button } from '@/shared/ui/button';
import { CATEGORY_LABELS, placesLeft } from '../model/domain';
import { useBookingDrafts } from '../hooks/useBookingDrafts';
import { useWorkshopData } from '../hooks/useWorkshopData';
import { useWorkshopFilter } from '../hooks/useWorkshopFilter';
import { Registrations } from './Registrations';
import { WorkshopCard } from './WorkshopCard';

export function WorkshopPage() {
  const { filter, setFilter } = useWorkshopFilter();
  const { drafts, storageWarning, change, clear } = useBookingDrafts();
  const { snapshot, loading, busy, message, failed, retryIntent, perform, reload } =
    useWorkshopData();
  const data = snapshot?.data;
  const workshops =
    data?.workshops.filter((item) => filter === 'all' || item.category === filter) ?? [];

  async function register(workshopId: string) {
    const name = drafts[workshopId] ?? '';
    const saved = await perform({
      type: 'register',
      workshopId,
      name,
      id: crypto.randomUUID(),
    });
    if (saved) clear(workshopId, name);
    return saved;
  }

  async function retry() {
    if (!retryIntent) return;
    if ((await perform(retryIntent)) && retryIntent.type === 'register')
      clear(retryIntent.workshopId, retryIntent.name);
  }

  return (
    <>
      <a className="skip-link" href="#programme">
        Aller au programme
      </a>
      <header className="site-header">
        <a className="brand" href="#programme" aria-label="Les Ateliers — accueil">
          <svg className="brand-mark" aria-hidden="true" viewBox="0 0 52 48">
            <path d="M25 43C24 27 15 18 4 12c-1 13 6 23 20 24M27 33C27 16 36 5 50 3c1 16-7 27-23 30M26 46V25" />
          </svg>
          <span translate="no">Les Ateliers</span>
        </a>
        <nav aria-label="Navigation principale">
          <a className="active" href="#programme">
            Les ateliers
          </a>
          <a href="#inscriptions">
            Mes inscriptions
            {Boolean(data?.registrations.length) && (
              <span className="nav-count">{data?.registrations.length}</span>
            )}
          </a>
        </nav>
      </header>
      <main id="programme" className="page-shell" tabIndex={-1}>
        <section className="intro" aria-labelledby="page-title">
          <p className="eyebrow">Le programme</p>
          <span className="accent-line" aria-hidden="true" />
          <h1 id="page-title">
            Faire ensemble,
            <br /> apprendre
            <br /> autrement.
          </h1>
          <p className="lede">
            Des rendez-vous pour réparer,
            <br /> cuisiner et créer près de chez vous.
          </p>
          <p className="month">Septembre 2026</p>
        </section>
        <section className="agenda" aria-label="Programme des ateliers">
          <div className="filters" role="group" aria-label="Filtrer par activité">
            {[['all', 'Tous'], ...Object.entries(CATEGORY_LABELS)].map(
              ([id, label]) =>
                id && (
                  <Button
                    key={id}
                    variant="outline"
                    className={`filter${filter === id ? ' active' : ''}`}
                    aria-pressed={filter === id}
                    onClick={() => setFilter(id)}
                  >
                    {label}
                  </Button>
                ),
            )}
          </div>
          <div className={`status${failed ? ' error' : ''}`} role="status" aria-live="polite">
            {loading ? 'Chargement du programme…' : message}
            {failed && !data && (
              <Button variant="link" onClick={reload}>
                Réessayer le chargement
              </Button>
            )}
            {failed && retryIntent && (
              <Button variant="link" disabled={busy} onClick={() => void retry()}>
                Réessayer l’action
              </Button>
            )}
          </div>
          {storageWarning && (
            <p role="status">
              Le stockage du navigateur est indisponible : votre saisie reste en mémoire pour cette
              session.
            </p>
          )}
          <div className="workshop-list" aria-busy={loading || busy}>
            {data &&
              workshops.map((workshop) => (
                <WorkshopCard
                  key={workshop.id}
                  workshop={workshop}
                  remaining={placesLeft(data, workshop.id)}
                  waitingCount={
                    data.waitlist.filter((item) => item.workshopId === workshop.id).length
                  }
                  draft={drafts[workshop.id] ?? ''}
                  busy={busy}
                  onDraft={(name) => change(workshop.id, name)}
                  onRegister={() => register(workshop.id)}
                />
              ))}
          </div>
          {!loading && data && workshops.length === 0 && (
            <p className="empty">Aucun atelier ne correspond à ce filtre.</p>
          )}
        </section>
      </main>
      {data && (
        <Registrations
          data={data}
          busy={busy}
          onCancel={(registrationId, waiting) => {
            void perform({ type: waiting ? 'leave-waitlist' : 'cancel', registrationId });
          }}
        />
      )}
      <footer>
        Association fictive — code édité dans Studio <span aria-hidden="true">·</span> Démonstration
        locale
      </footer>
    </>
  );
}
