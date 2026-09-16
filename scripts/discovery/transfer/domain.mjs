export const RENTAL = Object.freeze({
  horizonMinutes: 120,
  billingBlockMinutes: 30,
  blockPriceCents: 300,
  rentalMinutes: Object.freeze([20, 40, 60]),
  pauseMinutes: 20,
});
export const POLICIES = Object.freeze(['per-session', 'daily-total']);

export function initialRental() {
  return { elapsedMinutes: 0, usedMinutes: 0, sessionUnits: 0 };
}

function validateState(state) {
  if (
    !state ||
    !['elapsedMinutes', 'usedMinutes', 'sessionUnits'].every(
      (key) => Number.isSafeInteger(state[key]) && state[key] >= 0,
    ) ||
    state.elapsedMinutes > RENTAL.horizonMinutes ||
    state.usedMinutes > state.elapsedMinutes
  )
    throw new Error('Invalid rental totals or elapsed time.');
}

export function rentalActions(state) {
  validateState(state);
  const remaining = RENTAL.horizonMinutes - state.elapsedMinutes;
  return [
    ...RENTAL.rentalMinutes.map((minutes) => ({ kind: 'rent', minutes })),
    { kind: 'pause', minutes: RENTAL.pauseMinutes },
  ].filter((action) => action.minutes <= remaining);
}

export function executeRental(state, action) {
  if (
    !action ||
    !rentalActions(state).some(
      (allowed) => allowed.kind === action.kind && allowed.minutes === action.minutes,
    )
  )
    throw new Error('Choose an available rental or pause within the two-hour window.');
  const rented = action.kind === 'rent' ? action.minutes : 0;
  return {
    elapsedMinutes: state.elapsedMinutes + action.minutes,
    usedMinutes: state.usedMinutes + rented,
    sessionUnits: state.sessionUnits + Math.ceil(rented / RENTAL.billingBlockMinutes),
  };
}

export function rentalInvoice(state, policy) {
  validateState(state);
  if (!POLICIES.includes(policy)) throw new Error('Unknown rental billing policy.');
  const units =
    policy === 'per-session'
      ? state.sessionUnits
      : Math.ceil(state.usedMinutes / RENTAL.billingBlockMinutes);
  return {
    elapsedMinutes: state.elapsedMinutes,
    usedMinutes: state.usedMinutes,
    chargedMinutes: units * RENTAL.billingBlockMinutes,
    priceCents: units * RENTAL.blockPriceCents,
  };
}
