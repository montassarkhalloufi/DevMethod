export function createStock(initial) {
  if (!Number.isSafeInteger(initial) || initial < 0) throw new Error('INVALID_STOCK');
  let remaining = initial;
  return {
    available: () => remaining,
    take(amount) {
      if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error('INVALID_AMOUNT');
      if (amount >= remaining) throw new Error('INSUFFICIENT_STOCK');
      remaining -= amount;
      return remaining;
    },
  };
}
