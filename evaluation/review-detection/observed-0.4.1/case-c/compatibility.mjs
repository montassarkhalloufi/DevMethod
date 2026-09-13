export function orderResponse(stored) {
  return { id: stored.id, totalCents: stored.totalCents };
}
