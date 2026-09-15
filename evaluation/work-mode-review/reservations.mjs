export function createReservations(store) {
  return async function reserve(slotId, name) {
    const slot = await store.get(slotId);
    if (slot.confirmed.length >= slot.capacity) return { status: 'full' };
    await store.save(slotId, { ...slot, confirmed: [...slot.confirmed, name] });
    return { status: 'confirmed' };
  };
}
