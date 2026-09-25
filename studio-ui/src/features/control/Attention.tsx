import { useEffect, useRef, useState } from 'react';
import {
  openItems,
  riskLabels,
  type ControlReport,
  type AttentionItem,
  type SourceLink,
} from './model';
import { Icon } from './Icon';

function DecisionReview({
  item,
  busy,
  close,
  decide,
}: {
  item: AttentionItem;
  busy: boolean;
  close: () => void;
  decide: (item: AttentionItem, resolution: 'accept' | 'reject', reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <section className="cp-decision-review" aria-labelledby="cp-review-title">
      <h2 id="cp-review-title">Examiner la décision</h2>
      <p>{item.cause}</p>
      <p>
        Cette décision concerne la version {item.revisionId?.slice(0, 8) ?? 'en préparation'} et
        l’action {item.actionId}. Elle ne remplace aucun contrôle.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          decide(item, 'accept', reason);
        }}
      >
        <label htmlFor="cp-reason">Justification de votre décision</label>
        <textarea
          id="cp-reason"
          name="reason"
          required
          maxLength={2000}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Précisez le périmètre examiné et les conditions de reprise…"
        />
        <div>
          <button className="cp-primary" disabled={busy || !reason.trim()} type="submit">
            Accepter ce périmètre
          </button>
          <button
            disabled={busy || !reason.trim()}
            type="button"
            onClick={() => decide(item, 'reject', reason)}
          >
            Refuser et maintenir l’arrêt
          </button>
          <button type="button" onClick={close}>
            Fermer
          </button>
        </div>
      </form>
    </section>
  );
}

export function Attention({
  report,
  busy,
  mutate,
  run,
  open,
}: {
  report: ControlReport;
  busy: boolean;
  mutate: (action: string, input: object) => Promise<void>;
  run: (ids?: string[]) => void;
  open: (link: SourceLink) => void;
}) {
  const items = openItems(report);
  const [selected, setSelected] = useState<string | null>(null);
  const selection = items.find((item) => item.id === selected);
  const review = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const summary = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (selected && !selection) summary.current?.focus();
  }, [selected, selection]);
  const decisionCount = items.filter((item) => item.expectedAction !== 'renew').length;
  const renewCount = new Set(
    items.filter((item) => item.expectedAction === 'renew').flatMap((item) => item.evidenceIds),
  ).size;
  const passed = report.snapshot.nodes.filter(
    (node) =>
      node.kind === 'check' &&
      node.status === 'observed' &&
      node.outcome === 'passed' &&
      node.freshness === 'current',
  );
  const decisionInput = { version: report.version, snapshotKey: report.snapshot.key };
  const decide = async (item: AttentionItem, resolution: 'accept' | 'reject', reason: string) => {
    await mutate('decide', { ...decisionInput, itemId: item.id, resolution, reason });
  };
  return (
    <>
      <header className="cp-heading cp-heading-actions">
        <div>
          <h1>Votre attention</h1>
          <p>Les éléments qui nécessitent une intervention humaine.</p>
        </div>
        <button
          disabled={busy || !items.some((item) => item.status === 'open')}
          onClick={() => void mutate('read', decisionInput)}
        >
          <Icon name="check" />
          Tout marquer comme lu
        </button>
      </header>
      <div className="cp-attention-layout">
        <div className="cp-attention-items">
          {!items.length && (
            <div className="cp-empty">
              <Icon name="check" />
              <h2>Aucune intervention en attente</h2>
              <p>Les vérifications et leurs limites restent consultables dans le graphe.</p>
            </div>
          )}
          {items.map((item) => {
            const proofs = report.snapshot.nodes.filter((node) =>
              item.evidenceIds.includes(node.id),
            );
            const runnable = proofs.filter((node) => node.canRun).map((node) => node.checkId!);
            const mcp = proofs.find((node) => node.kind === 'mcp');
            return (
              <article
                key={item.id}
                className={`cp-attention-card cp-${item.expectedAction !== 'renew' ? 'red' : 'cyan'}`}
              >
                <Icon name={item.expectedAction !== 'renew' ? 'risk' : 'info'} />
                <div>
                  <h2>
                    {item.expectedAction !== 'renew' ? 'Validation requise' : 'Preuve à renouveler'}{' '}
                    · {item.cause}
                  </h2>
                  <p>
                    {item.expectedAction === 'decide'
                      ? 'Examinez la cause, les preuves et les conséquences avant de poursuivre.'
                      : 'Consultez le périmètre manquant et relancez les contrôles disponibles.'}
                  </p>
                  <small>
                    Version : {item.revisionId?.slice(0, 8) ?? 'Aucune'} ·{' '}
                    {item.status === 'read' ? 'Lu, action encore requise' : 'À examiner'} ·{' '}
                    {proofs.length} preuve(s) associée(s)
                  </small>
                </div>
                <div className="cp-attention-actions">
                  <span className={`cp-badge cp-${item.severity}`}>
                    Risque {riskLabels[item.severity].toLowerCase()}
                  </span>
                  {item.expectedAction === 'decide' ? (
                    <button
                      className="cp-primary"
                      disabled={busy}
                      onClick={(event) => {
                        trigger.current = event.currentTarget;
                        setSelected(item.id);
                        requestAnimationFrame(() => {
                          review.current?.scrollIntoView({ block: 'nearest' });
                          review.current?.focus();
                        });
                      }}
                    >
                      Examiner
                    </button>
                  ) : (
                    <button
                      className="cp-primary"
                      disabled={busy}
                      onClick={() => {
                        if (mcp?.link) open(mcp.link);
                        else if (runnable.length) run(runnable);
                        else open({ panel: 'checks', revisionId: item.revisionId ?? undefined });
                      }}
                    >
                      {runnable.length
                        ? 'Relancer'
                        : mcp
                          ? 'Examiner l’autorisation'
                          : 'Voir la procédure'}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
          {passed.length > 0 && (
            <article className="cp-attention-card cp-green">
              <Icon name="check" />
              <div>
                <h2>Information · {passed.length} contrôles réussis</h2>
                <p>Les vérifications ont produit un résultat positif dans leur périmètre.</p>
                <small>Les audits non exécutés restent distincts.</small>
              </div>
              <button
                onClick={() =>
                  open({
                    panel: 'checks',
                    revisionId: report.snapshot.input.revisionId ?? undefined,
                  })
                }
              >
                Voir les détails
              </button>
            </article>
          )}
          <div ref={review} tabIndex={-1}>
            {selection && (
              <DecisionReview
                key={selection.id}
                item={selection}
                busy={busy}
                close={() => {
                  setSelected(null);
                  trigger.current?.focus();
                }}
                decide={(...args) => void decide(...args)}
              />
            )}
          </div>
        </div>
        <aside>
          <section className="cp-summary">
            <h2 ref={summary} tabIndex={-1}>
              Synthèse
            </h2>
            <div className="cp-red">
              <Icon name="risk" />
              <p>
                <strong>{decisionCount}</strong>décision(s) requise(s)
              </p>
            </div>
            <div className="cp-cyan">
              <Icon name="info" />
              <p>
                <strong>{renewCount}</strong>vérification(s) à reprendre
              </p>
            </div>
            <div className="cp-green">
              <Icon name="check" />
              <p>
                <strong>{passed.length}</strong>contrôles sans action
              </p>
            </div>
          </section>
          <section className="cp-attention-note">
            <Icon name="info" />
            <p>Votre attention permet de maintenir un niveau d’autonomie sûr et explicable.</p>
          </section>
        </aside>
      </div>
    </>
  );
}
