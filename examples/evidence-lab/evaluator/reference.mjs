// Independent, finite fixture model. Never imports the producer implementation.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

export function referenceFactory(expected, fault = 'healthy') {
  return (filePath) => {
    let state = existsSync(filePath) && fault !== 'durability-fault'
      ? JSON.parse(readFileSync(filePath, 'utf8')) : { reservations: [], nextId: 1 };
    const save = () => writeFileSync(filePath, JSON.stringify(state));
    if (!existsSync(filePath)) save();
    const copy = (value) => structuredClone(value);
    const slotFor = (id) => {
      const slot = expected.slots.find((entry) => entry.id === id);
      if (!slot || !Number.isSafeInteger(slot.capacity) || slot.capacity <= 0) throw new Error('Invalid slot');
      return slot;
    };
    const remaining = (slot) => slot.capacity - state.reservations
      .filter((entry) => entry.slotId === slot.id && entry.status === 'active')
      .reduce((sum, entry) => sum + entry.seats, 0);
    return {
      listSlots: () => expected.slots.map((slot) => ({ ...slot, title: slot.id, remaining: remaining(slot) })),
      listReservations: () => copy(state.reservations),
      reserve: ({ slotId, requestId, seats }) => {
        const slot = slotFor(slotId);
        if (!Number.isSafeInteger(seats) || seats <= 0 || typeof requestId !== 'string' || !requestId) {
          throw new Error('Invalid request');
        }
        const old = state.reservations.find((entry) => entry.requestId === requestId);
        if (old && fault !== 'idempotency-fault') {
          if (old.slotId !== slotId || old.seats !== seats) throw new Error('Request conflict');
          return copy(old);
        }
        if (fault !== 'capacity-fault' && seats > remaining(slot)) throw new Error('Full');
        const record = { id: String(state.nextId++), slotId, requestId, seats, status: 'active' };
        state.reservations.push(record);
        save();
        return copy(record);
      },
      cancel: (id) => {
        const record = state.reservations.find((entry) => entry.id === id);
        if (!record) throw new Error('Unknown reservation');
        if (fault !== 'cancellation-fault') record.status = 'cancelled';
        save();
        return copy(record);
      },
    };
  };
}
