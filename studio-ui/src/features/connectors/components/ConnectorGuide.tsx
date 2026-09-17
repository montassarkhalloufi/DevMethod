import { useId } from 'react';
import type { GuideDefinition, GuideInput, GuidePreparation, GuideQuestion } from '../model/guides';
import { useConnectorGuide } from '../hooks/useConnectorGuide';
import { GuideActions, GuideSteps } from './GuideNavigation';
import { ConnectorIcon } from './ConnectorIcon';

export interface ConnectorGuideProps {
  definition: GuideDefinition;
  draft: GuideInput | null;
  preparation: GuidePreparation | null;
  preparing: boolean;
  error?: string;
  disabled?: boolean;
  onChange(input: GuideInput): void;
  onPrepare(input: GuideInput): void;
  onApply?(preparation: GuidePreparation): void;
  applyLabel?: string;
  onBack?(): void;
}

function GuideQuestionChoices({
  question,
  input,
  disabled,
  onChange,
}: {
  question: GuideQuestion;
  input: GuideInput;
  disabled: boolean;
  onChange(input: GuideInput): void;
}) {
  const id = useId();
  const answer = input.answers[question.id];
  const selected = Array.isArray(answer) ? answer : answer ? [answer] : [];
  function choose(value: string) {
    const next = question.multiple
      ? selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value]
      : value;
    onChange({ ...input, answers: { ...input.answers, [question.id]: next } });
  }
  return (
    <fieldset className="connector-guide-question" disabled={disabled}>
      <legend>{question.title}</legend>
      {question.description ? <p>{question.description}</p> : null}
      {question.multiple ? <small>Plusieurs réponses possibles</small> : null}
      <div className="connector-guide-choices">
        {question.options.map((option) => (
          <label className="connector-guide-choice" key={option.id}>
            <input
              type={question.multiple ? 'checkbox' : 'radio'}
              name={id}
              checked={selected.includes(option.id)}
              onChange={() => choose(option.id)}
            />
            <span>
              <strong>{option.title}</strong>
              {option.description ? <small>{option.description}</small> : null}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function GuideSummary({ value }: { value: GuidePreparation }) {
  return (
    <div className="connector-guide-summary">
      <div className="connector-guide-status">
        <span aria-hidden="true">○</span> Préparation uniquement · Aucun nouvel accès connecté
      </div>
      <h4>{value.title}</h4>
      <ul>
        {value.summary.map((line, index) => (
          <li key={index}>{line}</li>
        ))}
      </ul>
      <section aria-label="Permissions prévues">
        <h4>Permissions prévues</h4>
        <p>Elles expliquent les accès à demander. Elles ne prouvent pas un consentement.</p>
        {value.permissions.length ? (
          <dl>
            {value.permissions.map((permission) => (
              <div key={permission.scope}>
                <dt>
                  <code translate="no">{permission.scope}</code>
                </dt>
                <dd>{permission.reason}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p>Aucune permission détaillée dans cette préparation.</p>
        )}
      </section>
      <section aria-label="Éléments à préparer">
        <h4>Éléments à préparer ou à vérifier</h4>
        {value.prerequisites.length ? (
          <ul>
            {value.prerequisites.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        ) : (
          <p>Aucun prérequis supplémentaire déclaré par le guide.</p>
        )}
      </section>
    </div>
  );
}

export function ConnectorGuide({
  definition,
  draft,
  preparation,
  preparing,
  error,
  disabled = false,
  onChange,
  onPrepare,
  onApply,
  applyLabel = 'Utiliser cette préparation',
  onBack,
}: ConnectorGuideProps) {
  const {
    input,
    flow,
    confirmed,
    step,
    setStep,
    heading,
    headingId,
    locked,
    complete,
    chooseFlow,
    preview,
  } = useConnectorGuide({
    definition,
    draft,
    preparation,
    preparing,
    disabled,
    onChange,
    onPrepare,
  });
  return (
    <section className="connector-guide" aria-labelledby={headingId}>
      <div className="connector-guide-heading">
        <ConnectorIcon optionId={definition.optionId} size={36} />
        <div>
          <span className="connector-guide-eyebrow">Préparer une intégration</span>
          <h3 id={headingId} ref={heading} tabIndex={-1}>
            {definition.title}
          </h3>
        </div>
      </div>
      <p className="connector-guide-intro">{definition.description}</p>
      <GuideSteps
        step={step}
        locked={locked}
        hasFlow={Boolean(flow)}
        prepared={Boolean(confirmed)}
        onStep={setStep}
      />
      {step === 0 ? (
        <fieldset className="connector-guide-question" disabled={locked}>
          <legend>À quoi ce service doit-il servir ?</legend>
          <div className="connector-guide-choices">
            {definition.flows.map((item) => (
              <label className="connector-guide-choice" key={item.id}>
                <input
                  type="radio"
                  name={headingId + '-flow'}
                  checked={item.id === input?.flowId}
                  onChange={() => chooseFlow(item)}
                />
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.description}</small>
                  <span className="connector-guide-scope">
                    {item.usage === 'assistant'
                      ? 'Outils de l’agent'
                      : item.usage === 'app-user'
                        ? 'Comptes de vos utilisateurs'
                        : 'Votre application'}{' '}
                    · {item.transport.toUpperCase()}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
      {step === 1 && flow && input ? (
        <div className="connector-guide-questions">
          <p className="connector-guide-identity">
            {flow.title} · Identité prévue : {flow.identity}
          </p>
          {flow.questions.map((question) => (
            <GuideQuestionChoices
              key={question.id}
              question={question}
              input={input}
              disabled={locked}
              onChange={onChange}
            />
          ))}
          <p className="connector-guide-note">
            Ces réponses préparent le travail de l’agent. Ne saisissez aucune clé ni aucun jeton.
          </p>
        </div>
      ) : null}
      {step === 2 ? (
        <>
          {preparing ? (
            <p role="status" className="connector-guide-note">
              Préparation du résumé et des permissions…
            </p>
          ) : null}
          {confirmed ? (
            <GuideSummary value={confirmed} />
          ) : !preparing && !error ? (
            <p className="connector-guide-note">
              Vos réponses ont changé. Vérifiez à nouveau la préparation.
            </p>
          ) : null}
        </>
      ) : null}
      {error ? (
        <p role="alert" className="connector-guide-error">
          {error}
        </p>
      ) : null}
      <GuideActions
        step={step}
        locked={locked}
        hasFlow={Boolean(flow)}
        complete={complete}
        confirmed={confirmed}
        error={error}
        applyLabel={applyLabel}
        onStep={setStep}
        onPreview={preview}
        onApply={onApply}
        onBack={onBack}
      />
      {definition.sources.length ? (
        <details className="connector-guide-sources">
          <summary>Sources et documentation</summary>
          <ul>
            {definition.sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noopener noreferrer">
                  {source.title} ↗
                </a>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
