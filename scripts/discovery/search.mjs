const DEFAULTS = { maxDepth: 4, maxStates: 2000, maxTransitions: 10000 };
const CAPS = { maxDepth: 32, maxStates: 10000, maxTransitions: 50000 };

function limitsFor(options) {
  if (!options || Object.getPrototypeOf(options) !== Object.prototype)
    throw new TypeError('Search options must be an object.');
  const limits = { ...DEFAULTS };
  for (const name of Object.keys(options)) {
    if (!Object.hasOwn(DEFAULTS, name)) throw new TypeError(`Unknown search option: ${name}.`);
    const value = options[name];
    const minimum = name === 'maxDepth' ? 0 : 1;
    if (!Number.isSafeInteger(value) || value < minimum || value > CAPS[name])
      throw new RangeError(`${name} must be an integer from ${minimum} to ${CAPS[name]}.`);
    limits[name] = value;
  }
  return limits;
}

// Reject lossy JSON conversions (undefined, NaN, dates, sparse arrays, cycles).
// Object key order is immaterial; array order remains observable.
function canonical(value, ancestors = new Set()) {
  if (value === null) return 'null';
  if (typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (typeof value !== 'object') throw new TypeError('Machine data must be finite JSON values.');
  if (ancestors.has(value)) throw new TypeError('Machine data must not contain cycles.');
  if (!Array.isArray(value) && ![Object.prototype, null].includes(Object.getPrototypeOf(value)))
    throw new TypeError('Machine data must contain only JSON objects and arrays.');
  if (Object.getOwnPropertySymbols(value).length)
    throw new TypeError('Machine data must not contain symbol keys.');
  ancestors.add(value);
  const result = Array.isArray(value)
    ? '[' + Array.from(value, (item) => canonical(item, ancestors)).join(',') + ']'
    : '{' +
      Object.keys(value)
        .sort()
        .map((key) => JSON.stringify(key) + ':' + canonical(value[key], ancestors))
        .join(',') +
      '}';
  ancestors.delete(value);
  return result;
}

const clone = (value) => JSON.parse(canonical(value));

function keyFor(machine, state) {
  const key = machine.key(clone(state));
  if (typeof key !== 'string') throw new TypeError('machine.key must return a string.');
  return key;
}

function observationsFor(value) {
  const observations = clone(value);
  if (!Array.isArray(observations) || observations.length < 2)
    throw new TypeError('machine.step must return at least two observations.');
  const ids = new Set();
  for (const observation of observations) {
    if (
      !observation ||
      typeof observation.variantId !== 'string' ||
      !observation.variantId ||
      !Object.hasOwn(observation, 'value') ||
      ids.has(observation.variantId)
    )
      throw new TypeError('Observations require unique variantId strings and JSON values.');
    ids.add(observation.variantId);
  }
  return observations;
}

function advance(machine, state, action) {
  const result = machine.step(clone(state), clone(action));
  if (!result || !Object.hasOwn(result, 'state') || !Object.hasOwn(result, 'observations'))
    throw new TypeError('machine.step must return { state, observations }.');
  const next = clone(result.state);
  const observations = observationsFor(result.observations);
  const first = canonical(observations[0].value);
  return {
    state: next,
    observations,
    differs: observations.some((observation) => canonical(observation.value) !== first),
  };
}

function expand(machine, node, actions, search) {
  const { limits, stats, seen, queue } = search;
  for (const action of actions) {
    if (stats.transitions === limits.maxTransitions)
      return { status: 'bounded', reason: 'maxTransitions' };
    const next = advance(machine, node.state, action);
    stats.transitions += 1;
    const trace = [...node.trace, { action, observations: next.observations }];
    if (next.differs) return { status: 'witness', reason: 'difference', trace };
    const key = keyFor(machine, next.state);
    if (seen.has(key)) continue;
    if (stats.states === limits.maxStates) return { status: 'bounded', reason: 'maxStates' };
    seen.add(key);
    stats.states += 1;
    queue.push({ state: next.state, trace });
  }
  return null;
}

/**
 * Exact comparison of supplied JSON observables, shortest trace by breadth first search.
 * Callbacks must be synchronous and deterministic. key(state) must preserve all future
 * behaviors, including enabled actions; this caller-owned abstraction cannot be inferred.
 * states counts admitted distinct keys (initial included), transitions counts step calls.
 * A witness endpoint need not be admitted for further exploration. Limits do not preempt
 * a nonterminating callback. Exhaustion concerns only this initial state/alphabet/key.
 */
export function findWitness(machine, options = {}) {
  const limits = limitsFor(options);
  if (!machine || !['actions', 'key', 'step'].every((name) => typeof machine[name] === 'function'))
    throw new TypeError('A machine requires initial, actions, key and step.');
  const initial = clone(machine.initial);
  const seen = new Set([keyFor(machine, initial)]);
  const queue = [{ state: initial, trace: [] }];
  const stats = { states: 1, transitions: 0 };
  const result = (status, reason, trace = []) => ({ status, trace, stats, limits, reason });
  let depthFrontier = false;
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const node = queue[cursor];
    const supplied = machine.actions(clone(node.state));
    if (!Array.isArray(supplied)) throw new TypeError('machine.actions must return an array.');
    const actions = clone(supplied);
    if (node.trace.length === limits.maxDepth) {
      depthFrontier ||= actions.length > 0;
      continue;
    }
    const stopped = expand(machine, node, actions, { limits, stats, seen, queue });
    if (stopped) return result(stopped.status, stopped.reason, stopped.trace);
  }
  return depthFrontier ? result('bounded', 'maxDepth') : result('exhausted', 'frontier-exhausted');
}
