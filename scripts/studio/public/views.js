export function createViews(document) {
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
      card('Le point de départ', [
        node(
          'p',
          state.project.idea || 'Votre idée sera le point de départ des choix et des demandes.',
        ),
      ]),
      card(
        'Ce qu’on explore',
        exploration.length
          ? exploration.map((d) => node('p', d.choice))
          : [empty('Les questions et hypothèses de l’agent apparaîtront ici.')],
      ),
      card('Ce qu’on veut obtenir', [
        node('p', state.brief.outcome || 'Le cadrage reste à construire.'),
        list(state.brief.scope),
        disclosure(
          'Comment le vérifier',
          criteria.length ? [list(criteria)] : [empty('Aucun critère encore défini.')],
        ),
      ]),
      card('La direction visuelle', [
        node('p', design?.title || 'Aucune direction retenue pour l’instant.'),
      ]),
      card(
        'Comment l’app tient ensemble',
        architecture.length
          ? architecture.map((d) =>
              group('div', '', [node('strong', d.choice), node('p', d.reason)]),
            )
          : [empty('Les choix techniques utiles seront expliqués ici.')],
      ),
      disclosure('Contraintes et limites', [
        list(state.project.constraints),
        list(state.brief.excluded),
      ]),
      disclosure(
        'Toutes les décisions conservées',
        state.decisions.length
          ? state.decisions.map(decision)
          : [empty('Aucune décision enregistrée.')],
      ),
    ];
  }
  function decision(item) {
    const status = { active: 'Actuel', superseded: 'Remplacé', hypothesis: 'Hypothèse' }[
      item.status
    ];
    const card = group('article', 'decision', [
      node('h4', item.topic),
      badge(status),
      node('p', item.choice),
      node('p', item.reason, 'muted'),
      node('small', item.source === 'user' ? 'Choix de la personne' : 'Proposition de l’agent'),
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
          'Pas encore de propositions visuelles. Vous pouvez demander à l’agent plusieurs directions à partir de vos références.',
        ),
      ];
    return state.designs.map((design) => {
      const selected = design.id === selectedId;
      const image = node('img');
      image.src = '/references/' + encodeURIComponent(design.file);
      image.alt = 'Proposition visuelle : ' + design.title;
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
      if (state.selectedDesignId === design.id) details.push(badge('Choix enregistré', 'success'));
      const card = group('article', 'design-card' + (selected ? ' selected' : ''), details);
      card.dataset.scrollKey = 'design:' + design.id;
      return card;
    });
  }
  function jobs(state) {
    const labels = {
      queued: 'En attente de l’agent',
      running: 'En cours',
      ready: 'Résultat disponible',
      failed: 'Échec',
      cancelled: 'Annulée',
      interrupted: 'Interrompue',
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
          node('small', 'Votre demande', 'job-content-label'),
          node('p', excerpt(job.request, 150), 'job-request'),
        ];
        if (job.summary)
          parts.push(
            node('small', 'Résultat fourni', 'job-content-label'),
            node('p', excerpt(job.summary, 150), 'job-summary'),
          );
        if (job.status === 'ready')
          parts.push(
            node(
              'p',
              'Disponibilité ≠ résultat vérifié. Consultez les preuves de la version.',
              'job-verification-note',
            ),
          );
        if (job.error) parts.push(node('p', job.error, 'inline-error'));
        if (['failed', 'interrupted', 'cancelled'].includes(job.status))
          parts.push(action('Reprendre cette demande', 'retry-draft', job.id));
        if (job.status === 'running')
          parts.push(
            node(
              'small',
              job.worker ? 'Pris en charge par ' + job.worker : 'Prise en charge confirmée.',
            ),
          );
        if (['queued', 'running'].includes(job.status))
          parts.push(action('Annuler la demande', 'cancel', job.id, 'text-button'));
        const detail = [
          'Demande : ' + job.id,
          'Version de départ : ' + (job.baseRevision || 'aucune'),
        ];
        parts.push(
          disclosure('Lire la demande et le résultat complets', [
            node('h4', 'Demande intégrale'),
            node('p', job.request),
            ...(job.summary ? [node('h4', 'Résultat intégral'), node('p', job.summary)] : []),
            node('pre', detail.join('\n')),
          ]),
        );
        const card = group('article', 'job-card', parts);
        card.dataset.scrollKey = 'job:' + job.id;
        return card;
      });
    return [
      ...cards.slice(0, 3),
      ...(cards.length > 3
        ? [disclosure('Demandes antérieures · ' + (cards.length - 3), cards.slice(3))]
        : []),
    ];
  }
  function check(item) {
    return group('div', 'check', [
      badge(
        item.status === 'passed' ? 'Passé' : 'Échoué',
        item.status === 'passed' ? 'success' : 'failed',
      ),
      node('span', item.label),
      node('small', item.kind === 'command' ? 'Commande exécutée' : 'Observation de l’agent'),
      disclosure('Voir le détail', [
        node(
          'pre',
          [item.command, item.output].filter(Boolean).join('\n') || 'Aucun détail fourni.',
        ),
      ]),
    ]);
  }
  function versions(state, previewId) {
    if (!state.revisions.length)
      return [
        empty(
          'Les versions apparaîtront après une première réalisation. Une version disponible n’est pas nécessairement vérifiée.',
        ),
      ];
    return [...state.revisions].reverse().map((revision) => {
      const checks = state.checks.filter((c) => c.revisionId === revision.id);
      const active = state.activeRevision === revision.id;
      const parts = [
        group('div', 'version-heading', [
          node('h3', revision.title),
          badge(active ? 'Active' : 'Disponible'),
          ...(!checks.length ? [badge('Non vérifiée', 'unverified')] : []),
        ]),
        node('p', revision.summary),
        node('time', date(revision.createdAt)),
        group('div', 'version-actions', [
          action(
            previewId === revision.id ? 'Dans l’aperçu' : 'Essayer cette version',
            'preview',
            revision.id,
          ),
          ...(!active ? [action('Utiliser cette version', 'activate', revision.id)] : []),
        ]),
        ...(checks.length
          ? checks.map(check)
          : [empty('Aucune vérification enregistrée pour cette version.')]),
      ];
      parts.push(
        disclosure('Fichiers de cette version', [list(revision.files.map((f) => f.path))]),
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
      node('p', 'LE CAP DU PROJET', 'eyebrow'),
      node(
        'h2',
        state.brief.outcome || 'Précisons le résultat que votre app doit rendre possible.',
      ),
      criteria.length
        ? list(criteria.slice(0, 2).map((item) => item.text))
        : empty('Les critères de réussite restent à définir.'),
      disclosure('Périmètre et critères conservés', [
        node('h3', 'Dans cette version'),
        state.brief.scope.length ? list(state.brief.scope) : empty('Périmètre encore ouvert.'),
        node('h3', 'Ce que nous ne faisons pas'),
        state.brief.excluded.length
          ? list(state.brief.excluded)
          : empty('Aucune exclusion enregistrée.'),
        node('h3', 'Comment juger le résultat'),
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
    const recorded = runtime?.approval?.recorded || {};
    return [
      node('h3', 'Qui décide ?'),
      ...Object.entries({
        structure: 'Cadrage et technique',
        visual: 'Direction visuelle',
        adoption: 'Adoption du résultat',
      }).map(([key, label]) => {
        const delegated = delegation[key] === 'agent';
        const parts = [
          node('strong', label),
          node('span', delegated ? 'Délégué à l’agent' : 'Votre validation'),
        ];
        if (recorded[key])
          parts.push(node('small', 'Accord explicite enregistré', 'policy-agreement'));
        else if (!delegated && key !== 'adoption')
          parts.push(node('small', 'Accord actuel à recueillir', 'muted'));
        return group('div', 'policy-choice', parts);
      }),
      disclosure('Comprendre la délégation', [
        node(
          'p',
          'La délégation autorise l’agent à choisir ; elle ne vaut pas validation humaine.',
          'muted',
        ),
      ]),
    ];
  }
  function evidenceSignals(state, agent, failed) {
    const latest = state.jobs.at(-1);
    const signals = [];
    if (failed.length)
      signals.push(`${failed.length} contrôle(s) échoué(s) sur la version active.`);
    if (latest && ['failed', 'interrupted'].includes(latest.status))
      signals.push(
        `Dernière demande ${latest.status === 'failed' ? 'en échec' : 'interrompue'} : ${latest.error || 'consultez son résultat dans le fil.'}`,
      );
    if (
      state.jobs.some(
        (job) =>
          ['queued', 'running'].includes(job.status) && job.baseRevision !== state.activeRevision,
      )
    )
      signals.push('Une demande en cours repose sur une autre version que la version active.');
    if (agent?.connected && !agent.automatic)
      signals.push(agent.message || 'Les appels automatiques sont suspendus.');
    return signals;
  }
  function verificationBadge(checks, failed) {
    if (failed.length) return badge('Contrôle en échec', 'failed');
    if (checks.length) return badge('Contrôles enregistrés · couverture à établir', 'unverified');
    return badge('Non vérifié sur cette version', 'unverified');
  }
  function evidence(state, runtime) {
    const active = state.revisions.find((revision) => revision.id === state.activeRevision);
    const checks = active ? state.checks.filter((item) => item.revisionId === active.id) : [];
    const passed = checks.filter((item) => item.status === 'passed');
    const failed = checks.filter((item) => item.status === 'failed');
    const agent = runtime?.agent;
    const signals = evidenceSignals(state, agent, failed);
    const parts = [
      node('h3', active ? 'Version active · ' + active.title : 'Aucune version active'),
      ...(active ? [verificationBadge(checks, failed)] : []),
      node(
        'p',
        active
          ? `${passed.length} contrôle(s) passé(s) · ${failed.length} échoué(s)`
          : 'Une application reste à produire.',
        'evidence-summary',
      ),
      node(
        'p',
        'Les contrôles enregistrés ne prouvent pas à eux seuls tous les critères du projet.',
        'muted',
      ),
    ];
    if (signals.length) parts.push(list(signals));
    if (agent?.knownTokens !== undefined)
      parts.push(
        node(
          'p',
          `${agent.knownTokens.toLocaleString('fr-FR')} jetons connus${agent.usageUnknown ? ' · consommation partiellement inconnue' : ''}. Coût monétaire ${agent.costUSD == null ? 'non disponible' : agent.costUSD + ' USD'}.`,
          'muted',
        ),
      );
    parts.push(
      disclosure(
        'Preuves de cette version',
        checks.length
          ? checks.map(check)
          : [empty('Aucune preuve enregistrée pour la version active.')],
      ),
      disclosure('Ce qui reste à établir', [
        empty(
          'Couverture complète des critères, essai par une personne et avantage comparatif : non déduits de ces contrôles.',
        ),
      ]),
    );
    return parts;
  }
  function flowDecisions(state) {
    return state.decisions.slice(-3).map(decision);
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
