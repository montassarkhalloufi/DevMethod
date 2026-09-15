// Unchanged existing consumer. Existing rows use amountCents, too.
export function invoiceTotal(response) { return response.amountCents / 100; }
export const existingOrder = { id: 'order-fixture', amountCents: 1250 };
