// Candidate change: renamed response field without adapting stored records/consumer.
export function orderResponse(stored) {
  return { id: stored.id, totalCents: stored.totalCents };
}
