import { POLICIES, initialRental, rentalActions, executeRental, rentalInvoice } from './domain.mjs';

export function rentalMachine(policies = POLICIES) {
  if (
    !Array.isArray(policies) ||
    policies.length !== 2 ||
    policies.some((p) => !POLICIES.includes(p))
  )
    throw new Error('Choose two known rental policies.');
  const selected = [...policies];
  return {
    initial: initialRental(),
    actions: rentalActions,
    key: (state) => [state.elapsedMinutes, state.usedMinutes, state.sessionUnits].join(':'),
    step: (state, action) => {
      const next = executeRental(state, action);
      return {
        state: next,
        observations: selected.map((policy, index) => ({
          variantId: `${policy}-${index}`,
          value: rentalInvoice(next, policy),
        })),
      };
    },
  };
}
