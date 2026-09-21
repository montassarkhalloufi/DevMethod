import { createTranslator, getLocale, translateAgentMessage } from './i18n.js';
import { presentation } from './version-presentation.js';
import {
  createControlView,
  controlActionLabel,
  describeActivationReview,
  describeCoverageReview,
  describeInterventionReview,
  describeControlledApplication,
} from './control-view.js';

export function createViews(document) {
  const t = createTranslator(document);
  function node(tag, text = '', className = '') {
    const result = document.createElement(tag);
    result.textContent = text;
    if (className) result.className = className;
    return result;
  }
  function group(tag, className, children) {
    const result = node(tag, '', className);
    result.append(...children);
    return result;
  }
  function action(label, name, id, className = '') {
    const result = node('button', label, className);
    result.type = 'button';
    result.dataset.action = name;
    result.dataset.id = id;
    result.id = name + '-' + id;
    return result;
  }
  const empty = (text) => node('p', text, 'empty-copy');
  const badge = (text, style = '') => node('span', text, 'badge ' + style);
  function icon(kind) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    for (const [key, value] of Object.entries({
      viewBox: '0 0 24 24',
      width: '22',
      height: '22',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '1.7',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'aria-hidden': 'true',
    }))
      svg.setAttribute(key, value);
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute(
      'd',
      {
        version: 'M12 2 3 7v10l9 5 9-5V7ZM3 7l9 5 9-5M12 12v10M7 4.8l10 5.5',
        proposal:
          'M7 5a2 2 0 1 0 0 .01M17 17a2 2 0 1 0 0 .01M7 17a2 2 0 1 0 0 .01M7 7v8M7 8c0 5 10 0 10 7',
        visual: 'M3 3h18v18H3ZM3 16l6-6 5 5 3-3 4 4M16 7h.01',
        success: 'M21 12a9 9 0 1 1-3-6.7M7 12l3 3 9-10',
        failed: 'M12 3 2 21h20ZM12 9v5m0 3v.01',
        unverified: 'M12 3a9 9 0 1 0 .01 0M12 8v5m0 3v.01',
        muted: 'M12 3a9 9 0 1 0 .01 0M12 7v6l4 2',
      }[kind],
    );
    svg.append(path);
    return svg;
  }
  const list = (items) =>
    group(
      'ul',
      'plain-list',
      items.map((text) => node('li', text)),
    );
  function disclosure(title, children) {
    return group('details', 'technical', [node('summary', title), ...children]);
  }
  function card(title, content) {
    return group('section', 'context-card', [node('h3', title), ...content]);
  }
  function context(state) {
    const exploration = state.decisions.filter(
      (d) => d.status === 'hypothesis' || (d.status === 'active' && /explor/i.test(d.topic)),
    );
    const architecture = state.decisions.filter(
      (d) => d.status === 'active' && /architect|techni|donné|stock|backend/i.test(d.topic),
    );
    const design = state.designs.find((d) => d.id === state.selectedDesignId);
    const criteria = state.brief.criteria.map((c) => c.text);
    return [
      card(t('Le point de départ', 'The starting point'), [
        node(
          'p',
          state.project.idea ||
            t(
              'Votre idée sera le point de départ des choix et des demandes.',
              'Your idea will be the starting point for choices and requests.',
            ),
        ),
      ]),
      card(
        t('Ce qu’on explore', 'What we’re exploring'),
        exploration.length
          ? exploration.map((d) => node('p', d.choice))
          : [
              empty(
                t(
                  'Les questions et hypothèses de l’agent apparaîtront ici.',
                  'The agent’s questions and hypotheses will appear here.',
                ),
              ),
            ],
      ),
      card(t('Ce qu’on veut obtenir', 'What we want to achieve'), [
        node(
          'p',
          state.brief.outcome ||
            t('Le cadrage reste à construire.', 'The brief still needs to be defined.'),
        ),
        list(state.brief.scope),
        disclosure(
          t('Comment le vérifier', 'How to check it'),
          criteria.length
            ? [list(criteria)]
            : [empty(t('Aucun critère encore défini.', 'No criteria defined yet.'))],
        ),
      ]),
      card(t('La direction visuelle', 'The visual direction'), [
        node(
          'p',
          design?.title ||
            t('Aucune direction retenue pour l’instant.', 'No direction chosen yet.'),
        ),
      ]),
      card(
        t('Comment l’app tient ensemble', 'How the app fits together'),
        architecture.length
          ? architecture.map((d) =>
              group('div', '', [node('strong', d.choice), node('p', d.reason)]),
            )
          : [
              empty(
                t(
                  'Les choix techniques utiles seront expliqués ici.',
                  'Relevant technical choices will be explained here.',
                ),
              ),
            ],
      ),
      disclosure(t('Contraintes et limites', 'Constraints and limitations'), [
        list(state.project.constraints),
        list(state.brief.excluded),
      ]),
      disclosure(
        t('Toutes les décisions conservées', 'All recorded decisions'),
        state.decisions.length
          ? state.decisions.map(decision)
          : [empty(t('Aucune décision enregistrée.', 'No decisions recorded.'))],
      ),
    ];
  }
  function decision(item) {
    const status = {
      active: t('Actuel', 'Current'),
      superseded: t('Remplacé', 'Replaced'),
      hypothesis: t('Hypothèse', 'Hypothesis'),
    }[item.status];
    const card = group('article', 'decision', [
      node(
        'h4',
        item.coverage
          ? t('Couverture du critère {id}', 'Coverage of criterion {id}', {
              id: item.coverage.criterion.id,
            })
          : item.topic,
      ),
      badge(status),
      node('p', item.choice),
      node('p', item.reason, 'muted'),
      node(
        'small',
        item.application
          ? t('Moteur Studio', 'Studio engine')
          : item.source === 'user'
            ? t('Choix de la personne', 'Your choice')
            : t('Proposition de l’agent', 'Agent proposal'),
      ),
      ...(item.application
        ? [
            disclosure(
              t('Application selon les contrôles conservée', 'Recorded application under controls'),
              [list(describeControlledApplication(item.application))],
            ),
          ]
        : []),
      ...(item.intervention
        ? [
            disclosure(
              t('Appréciation des conséquences conservée', 'Recorded consequence assessment'),
              [list(describeInterventionReview(item.intervention))],
            ),
          ]
        : []),
      ...(item.coverage
        ? [
            disclosure(t('Appréciation de couverture conservée', 'Recorded coverage assessment'), [
              list(describeCoverageReview(item.coverage)),
            ]),
          ]
        : []),
      ...(item.review
        ? [
            disclosure(
              t('Examen associé à cette adoption', 'Review associated with this adoption'),
              [list(describeActivationReview(item.review))],
            ),
          ]
        : []),
    ]);
    card.dataset.status = item.status;
    card.dataset.scrollKey = 'decision:' + item.id;
    return card;
  }
  function references(state) {
    return state.references.map((ref) => {
      const link = node('a', '', 'reference-card');
      link.href = '/references/' + encodeURIComponent(ref.id);
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      if (ref.mime.startsWith('image/')) {
        const image = node('img');
        image.src = link.href;
        image.alt = '';
        link.append(image);
      } else link.append(node('span', '↗', 'reference-text'));
      link.append(node('span', ref.name));
      return link;
    });
  }
  function designs(state, selectedId) {
    if (!state.designs.length)
      return [
        empty(
          t(
            'Pas encore de propositions visuelles. Vous pouvez demander à l’agent plusieurs directions à partir de vos références.',
            'No visual proposals yet. You can ask the agent for several directions based on your references.',
          ),
        ),
      ];
    return state.designs.map((design) => {
      const selected = design.id === selectedId;
      const image = node('img');
      image.src = '/references/' + encodeURIComponent(design.file);
      image.alt = t('Proposition visuelle : ', 'Visual proposal: ') + design.title;
      image.loading = 'lazy';
      const choice = node('input');
      choice.type = 'radio';
      choice.name = 'design-option';
      choice.id = 'design-' + design.id;
      choice.value = design.id;
      choice.checked = selected;
      choice.dataset.action = 'design';
      choice.dataset.id = design.id;
      const label = node('label', '', 'design-choice');
      label.htmlFor = choice.id;
      label.append(choice, node('span', design.title));
      const details = [image, label, node('p', design.description)];
      if (state.selectedDesignId === design.id)
        details.push(badge(t('Choix enregistré', 'Choice saved'), 'success'));
      const card = group('article', 'design-card' + (selected ? ' selected' : ''), details);
      card.dataset.scrollKey = 'design:' + design.id;
      return card;
    });
  }
  function jobs(state) {
    const labels = {
      queued: t('En attente de l’agent', 'Waiting for the agent'),
      running: t('En cours', 'In progress'),
      ready: t('Résultat disponible', 'Result available'),
      failed: t('Échec', 'Failed'),
      cancelled: t('Annulée', 'Cancelled'),
      interrupted: t('Interrompue', 'Interrupted'),
    };
    const cards = state.jobs
      .slice()
      .reverse()
      .map((job) => {
        const parts = [
          group('div', 'job-heading', [
            badge(labels[job.status], job.status),
            node('time', date(job.createdAt)),
          ]),
          node('small', t('Votre demande', 'Your request'), 'job-content-label'),
          node('p', excerpt(job.request, 150), 'job-request'),
        ];
        if (job.summary)
          parts.push(
            node('small', t('Résultat fourni', 'Delivered result'), 'job-content-label'),
            node('p', excerpt(job.summary, 150), 'job-summary'),
          );
        if (job.status === 'ready')
          parts.push(
            node(
              'p',
              t(
                'Disponibilité ≠ résultat vérifié. Consultez les preuves de la version.',
                'Available does not mean verified. Review the version’s evidence.',
              ),
              'job-verification-note',
            ),
          );
        if (job.error) parts.push(node('p', job.error, 'inline-error'));
        if (
          job.control?.revisionId &&
          (job.control.action !== 'continue' || job.control.operation === 'activate') &&
          job.control.revisionId !== state.activeRevision
        )
          parts.push(
            action(
              t(
                'Écarter ce candidat et reprendre les demandes en attente',
                'Discard this candidate and resume pending requests',
              ),
              'discard-candidate',
              job.id,
            ),
          );
        if (['failed', 'interrupted', 'cancelled'].includes(job.status)) {
          parts.push(
            action(t('Reprendre cette demande', 'Resume this request'), 'retry-draft', job.id),
          );
          parts.push(
            action(
              t(
                'Vérifier le travail conservé sans relancer Codex',
                'Check the saved work without calling Codex again',
              ),
              'recover-work',
              job.id,
            ),
          );
        }
        if (job.status === 'running')
          parts.push(
            node(
              'small',
              job.worker
                ? t('Pris en charge par ', 'Picked up by ') + job.worker
                : t('Prise en charge confirmée.', 'Request picked up.'),
            ),
          );
        if (['queued', 'running'].includes(job.status))
          parts.push(
            action(t('Annuler la demande', 'Cancel request'), 'cancel', job.id, 'text-button'),
          );
        const detail = [
          t('Demande : ', 'Request: ') + job.id,
          (job.candidateRequest
            ? t('Base active de la demande : ', 'Request active base: ')
            : t('Version de départ : ', 'Starting version: ')) +
            (job.baseRevision || t('aucune', 'none')),
          ...(job.candidateRequest
            ? [
                t('Version source du candidat : ', 'Candidate source version: ') +
                  job.candidateRequest.sourceRevision,
                t('Demande parente : ', 'Parent request: ') + job.candidateRequest.parentJobId,
              ]
            : []),
        ];
        parts.push(
          disclosure(
            t('Lire la demande et le résultat complets', 'Read the full request and result'),
            [
              node('h4', t('Demande intégrale', 'Full request')),
              node('p', job.request),
              ...(job.summary
                ? [node('h4', t('Résultat intégral', 'Full result')), node('p', job.summary)]
                : []),
              node('pre', detail.join('\n')),
            ],
          ),
        );
        const card = group('article', 'job-card', parts);
        card.dataset.scrollKey = 'job:' + job.id;
        return card;
      });
    return [
      ...cards.slice(0, 3),
      ...(cards.length > 3
        ? [
            disclosure(
              t('Demandes antérieures · ', 'Earlier requests · ') + (cards.length - 3),
              cards.slice(3),
            ),
          ]
        : []),
    ];
  }
  function check(item) {
    return group('div', 'check', [
      badge(
        item.status === 'passed' ? t('Passé', 'Passed') : t('Échoué', 'Failed'),
        item.status === 'passed' ? 'success' : 'failed',
      ),
      node('span', item.label),
      node(
        'small',
        item.kind === 'command'
          ? t('Commande exécutée', 'Executed command')
          : item.kind === 'runtime-observation'
            ? t('Signal du navigateur — non attesté', 'Browser signal — unattested')
            : t('Observation de l’agent', 'Agent observation'),
      ),
      disclosure(t('Voir le détail', 'View details'), [
        node(
          'pre',
          [item.command, item.output].filter(Boolean).join('\n') ||
            t('Aucun détail fourni.', 'No details provided.'),
        ),
      ]),
    ]);
  }
  function versions(state, previewId) {
    if (!state.revisions.length)
      return [
        empty(
          t(
            'Les versions apparaîtront après une première réalisation. Une version disponible n’est pas nécessairement vérifiée.',
            'Versions will appear after the first implementation. An available version is not necessarily verified.',
          ),
        ),
      ];
    return [...state.revisions].reverse().map((revision) => {
      const checks = state.checks.filter((c) => c.revisionId === revision.id);
      const active = state.activeRevision === revision.id;
      const parts = [
        group('div', 'version-heading', [
          node('h3', revision.title),
          badge(
            revision.origin?.kind === 'import'
              ? t('Référence importée', 'Imported reference')
              : active
                ? t('Active', 'Active')
                : t('Disponible', 'Available'),
          ),
          ...(!checks.length ? [badge(t('Non vérifiée', 'Unverified'), 'unverified')] : []),
        ]),
        node('p', revision.summary),
        node('time', date(revision.createdAt)),
        group('div', 'version-actions', [
          action(
            revision.profile === 'source-only'
              ? t('Consulter cette version', 'Browse this version')
              : previewId === revision.id
                ? t('Dans l’aperçu', 'In the preview')
                : t('Essayer cette version', 'Try this version'),
            'preview',
            revision.id,
          ),
          ...(!active
            ? [
                action(t('Utiliser cette version', 'Use this version'), 'activate', revision.id),
                action(
                  t('Corriger cette version', 'Request changes'),
                  'candidate-request',
                  revision.id,
                ),
              ]
            : []),
          action(
            t('Comparer le code et l’impact', 'Compare code and impact'),
            'inspect-impact',
            revision.id,
          ),
          action(
            t('Voir l’architecture', 'View architecture'),
            'inspect-architecture',
            revision.id,
          ),
        ]),
        ...(checks.length
          ? checks.map(check)
          : [
              empty(
                t(
                  'Aucune vérification enregistrée pour cette version.',
                  'No checks recorded for this version.',
                ),
              ),
            ]),
      ];
      parts.push(
        disclosure(t('Fichiers de cette version', 'Files in this version'), [
          list(revision.files.map((f) => f.path)),
        ]),
      );
      return group('article', 'version-card', parts);
    });
  }
  function events(state) {
    return state.events
      .slice(-30)
      .reverse()
      .map((event) =>
        group('p', 'event', [node('time', date(event.createdAt)), node('span', event.text)]),
      );
  }
  function cap(state) {
    const criteria = state.brief.criteria;
    return [
      node('p', t('Objectif', 'Objective'), 'eyebrow'),
      node(
        'h2',
        state.brief.outcome ||
          t(
            'Précisons le résultat que votre app doit rendre possible.',
            'Define the outcome your app should make possible.',
          ),
      ),
      criteria.length
        ? list(criteria.slice(0, 2).map((item) => item.text))
        : empty(
            t(
              'Les critères de réussite restent à définir.',
              'Success criteria still need to be defined.',
            ),
          ),
      disclosure(t('Voir les critères', 'View criteria'), [
        node('h3', t('Dans cette version', 'In this version')),
        state.brief.scope.length
          ? list(state.brief.scope)
          : empty(t('Périmètre encore ouvert.', 'Scope still open.')),
        node('h3', t('Ce que nous ne faisons pas', 'What is out of scope')),
        state.brief.excluded.length
          ? list(state.brief.excluded)
          : empty(t('Aucune exclusion enregistrée.', 'No exclusions recorded.')),
        node('h3', t('Comment juger le résultat', 'How to assess the result')),
        list(criteria.map((item) => item.text)),
      ]),
    ];
  }
  function policy(state, runtime) {
    const delegation = runtime?.delegation ||
      state.project.delegation || {
        structure: state.project.mode === 'delegated' ? 'agent' : 'user',
        visual: 'agent',
        adoption: state.project.mode === 'guided' ? 'user' : 'agent',
      };
    return [
      group(
        'div',
        'responsibility-rows',
        Object.entries({
          structure: t('Produit et architecture', 'Product and architecture'),
          visual: t('Validation visuelle', 'Visual approval'),
          adoption: t('Application d’une version', 'Applying a version'),
        }).map(([key, label]) =>
          group('div', 'responsibility-role', [
            group('span', 'responsibility-title', [
              icon(key === 'visual' ? 'visual' : key === 'adoption' ? 'version' : 'proposal'),
              node('span', label),
            ]),
            badge(
              delegation[key] === 'agent' ? t('Agent', 'Agent') : t('Vous', 'You'),
              delegation[key] === 'agent' ? 'agent-badge' : 'person-badge',
            ),
          ]),
        ),
      ),
      disclosure(t('Comprendre la délégation', 'Understand delegation'), [
        node(
          'p',
          t('Réalisation technique : agent. ', 'Technical implementation: agent. ') +
            (runtime?.agent?.automatic
              ? t('Exécution automatique connectée.', 'Automatic execution connected.')
              : t(
                  'Prise en charge par votre agent hôte ; pas de lancement automatique.',
                  'Handled by your host agent; no automatic launch.',
                )),
        ),
        node(
          'p',
          t(
            'La délégation autorise l’agent à choisir ; elle ne vaut pas validation humaine.',
            'Delegation allows the agent to choose; it does not count as human approval.',
          ),
          'muted',
        ),
      ]),
    ];
  }
  function evidenceSignals(state, agent, failed) {
    const latest = state.jobs.at(-1);
    const signals = [];
    if (failed)
      signals.push(
        t(
          '{count} contrôle(s) de livraison échoué(s) sur la version affichée.',
          '{count} failed delivery check(s) on the displayed version.',
          { count: failed },
        ),
      );
    if (latest && ['failed', 'interrupted'].includes(latest.status))
      signals.push(
        t('Dernière demande {status} : {reason}', 'Latest request {status}: {reason}', {
          status:
            latest.status === 'failed' ? t('en échec', 'failed') : t('interrompue', 'interrupted'),
          reason:
            latest.error ||
            t('consultez son résultat dans le fil.', 'review its result in the thread.'),
        }),
      );
    if (
      state.jobs.some(
        (job) =>
          ['queued', 'running'].includes(job.status) && job.baseRevision !== state.activeRevision,
      )
    )
      signals.push(
        t(
          'Une demande en cours repose sur une autre version que la version active.',
          'A current request is based on a different version from the active one.',
        ),
      );
    if (agent?.connected && !agent.automatic)
      signals.push(
        (agent.message && translateAgentMessage(agent.message, getLocale(document))) ||
          t('Les appels automatiques sont suspendus.', 'Automatic calls are suspended.'),
      );
    return signals;
  }
  function verificationBadge(checks, failed) {
    if (failed) return badge(t('Contrôle en échec', 'Failed check'), 'failed');
    if (checks.length)
      return badge(
        t(
          'Contrôles enregistrés · couverture à établir',
          'Checks recorded · coverage to establish',
        ),
        'unverified',
      );
    return badge(t('Non vérifié sur cette version', 'Not verified on this version'), 'unverified');
  }
  function evidence(state, runtime, shown = presentation(state, {}, getLocale(document))) {
    const active = state.revisions.find((revision) => revision.id === shown.displayed.revisionId);
    const checks = shown.checks.items;
    const { passed, failed, observations } = shown.checks;
    const agent = runtime?.agent;
    const signals = evidenceSignals(state, agent, failed);
    const parts = [
      node('h3', shown.displayed.label),
      ...(active
        ? [
            verificationBadge(
              checks.filter((item) => item.kind === 'command'),
              failed,
            ),
          ]
        : []),
      node(
        'p',
        active
          ? t(
              '{passed} contrôle(s) de livraison passé(s) · {failed} échoué(s) · {observations} observation(s) non attestée(s), hors contrôles de livraison',
              '{passed} passed delivery check(s) · {failed} failed · {observations} unattested observation(s), excluded from delivery checks',
              { passed, failed, observations },
            )
          : t(
              'Aucun contrôle de fonctionnement attribuable à cet aperçu.',
              'No functional check attributable to this preview.',
            ),
        'evidence-summary',
      ),
      node(
        'p',
        t(
          'Les contrôles enregistrés ne prouvent pas à eux seuls tous les critères du projet.',
          'The recorded checks alone do not prove every project criterion.',
        ),
        'muted',
      ),
    ];
    const controlPanel = runtime?.control
      ? group(
          'div',
          'execution-control',
          createControlView(document, runtime.control, shown.displayed.revisionId),
        )
      : null;
    if (controlPanel) parts.push(controlPanel);
    const candidateId = runtime?.control?.graph?.revisionId;
    if (
      runtime?.control?.autonomy?.action === 'continue' &&
      runtime.control.autonomy.operation === 'activate' &&
      candidateId !== state.activeRevision &&
      state.revisions.some((revision) => revision.id === candidateId)
    )
      controlPanel.append(
        action(
          t('Appliquer selon les contrôles', 'Apply under current controls'),
          'control-apply',
          candidateId,
        ),
      );
    if (signals.length) parts.push(list(signals));
    if (agent?.knownTokens !== undefined)
      parts.push(
        node(
          'p',
          t(
            '{tokens} jetons connus{unknown}. Coût monétaire {cost}.',
            '{tokens} known tokens{unknown}. Monetary cost {cost}.',
            {
              tokens: agent.knownTokens.toLocaleString(getLocale(document)),
              unknown: agent.usageUnknown
                ? t(' · consommation partiellement inconnue', ' · usage partly unknown')
                : '',
              cost:
                agent.costUSD == null ? t('non disponible', 'unavailable') : agent.costUSD + ' USD',
            },
          ),
          'muted',
        ),
      );
    parts.push(
      disclosure(
        t('Preuves de cette version', 'Evidence for this version'),
        checks.length
          ? checks.map(check)
          : [
              empty(
                t(
                  'Aucune preuve enregistrée pour cet aperçu.',
                  'No evidence recorded for this preview.',
                ),
              ),
            ],
      ),
      disclosure(t('Ce qui reste à établir', 'What remains to establish'), [
        empty(
          t(
            'Couverture complète des critères, essai par une personne et avantage comparatif : non déduits de ces contrôles.',
            'Complete criterion coverage, a human trial and comparative benefit are not inferred from these checks.',
          ),
        ),
      ]),
    );
    return parts;
  }
  function flowDecisions(state) {
    return [
      disclosure(
        t('Décisions précédentes · ', 'Earlier decisions · ') + state.decisions.length,
        state.decisions.slice().reverse().map(decision),
      ),
    ];
  }
  function evidenceDock(state, shown = presentation(state, {}, getLocale(document)), control) {
    const { displayed, checks, visual } = shown;
    const status =
      checks.status === 'passed' ? 'success' : checks.status === 'failed' ? 'failed' : 'unverified';
    const identity =
      displayed.revisionId?.slice(0, 8) ||
      displayed.referenceId ||
      t('Aucune version', 'No version');
    const visualStatus = visual.status === 'accepted' ? 'success' : 'unverified';
    return [
      group('div', 'evidence-row', [
        group('div', 'evidence-kind', [icon('version'), node('strong', displayed.label)]),
        node('span', identity + t(' · affichée', ' · displayed'), 'muted'),
      ]),
      group('div', 'evidence-row', [
        group('div', 'evidence-kind', [
          icon(status),
          node('strong', t('Contrôles de livraison', 'Delivery checks')),
        ]),
        node('span', checks.label, 'evidence-result ' + status),
        action(
          t('Consulter les résultats et les preuves →', 'View results and evidence →'),
          'checks',
          '',
          'text-button',
        ),
      ]),
      group('div', 'evidence-row', [
        group('div', 'evidence-kind', [
          icon('visual'),
          node('strong', t('Validation visuelle', 'Visual approval')),
          badge(
            visual.responsibilityLabel,
            visual.responsibility === 'agent' ? 'agent-badge' : 'person-badge',
          ),
        ]),
        node('span', visual.label, 'evidence-result ' + visualStatus),
      ]),
      ...(control
        ? [
            node(
              'p',
              controlActionLabel(control, getLocale(document)) +
                t(' · version évaluée : ', ' · evaluated version: ') +
                (control.graph.revisionId ?? t('aucune candidate', 'no candidate')),
              'muted',
            ),
          ]
        : []),
      node(
        'small',
        t('La délégation ne vaut pas validation.', 'Delegation is not approval.'),
        'muted',
      ),
    ];
  }
  function latestResult(state) {
    const job = state.jobs.at(-1);
    if (!job) return [];
    const revision = state.revisions.findLast((item) => item.jobId === job.id);
    const labels = {
      ready: t('Résultat disponible', 'Result available'),
      queued: t('Demande enregistrée', 'Request saved'),
      running: t('Réalisation en cours', 'Implementation in progress'),
      failed: t('Échec', 'Failed'),
      interrupted: t('Interrompue', 'Interrupted'),
      cancelled: t('Annulée', 'Cancelled'),
    };
    const style = ['failed', 'interrupted'].includes(job.status)
      ? 'semantic-error'
      : job.status === 'ready'
        ? 'semantic-agent'
        : 'semantic-warning';
    return [
      node('strong', labels[job.status], style),
      node('p', excerpt(job.summary || job.error || job.request, 180)),
      ...(revision
        ? [
            action(
              t('Examiner le résultat →', 'Review the result →'),
              'preview',
              revision.id,
              'result-action',
            ),
          ]
        : []),
      action(t('Voir la demande complète', 'View the full request'), 'activity', '', 'text-button'),
    ];
  }
  return {
    context,
    references,
    designs,
    jobs,
    versions,
    events,
    cap,
    policy,
    evidence,
    flowDecisions,
    evidenceDock,
    latestResult,
  };
}

function date(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? ''
    : new Intl.DateTimeFormat('fr', { dateStyle: 'short', timeStyle: 'short' }).format(parsed);
}

function excerpt(value = '', limit = 150) {
  const text = value.replace(/\s+/g, ' ').trim();
  return text.length > limit ? text.slice(0, limit).trimEnd() + '…' : text;
}
