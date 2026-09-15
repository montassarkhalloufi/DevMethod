export type Reservation = { id: string; remaining: number };
export function createReservations(capacity = 1) {
  let remaining = capacity;
  const rows: Reservation[] = [];
  return {
    availability: () => remaining,
    list: () => rows.map(row => ({ ...row })),
    async reserve(id: string, beforeWrite: () => Promise<void> = async () => {}) {
      if (remaining < 1) throw new Error('CAPACITY_FULL');
      await beforeWrite();
      remaining -= 1;
      const row = { id, remaining }; rows.push(row); return row;
    },
  };
}
