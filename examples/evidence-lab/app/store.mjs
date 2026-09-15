import { randomUUID } from 'node:crypto';
import {
  closeSync,
  fsyncSync,
  lstatSync,
  openSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';

const seedSlots = [
  { id: 'welcome', title: 'Welcome desk', capacity: 2 },
  { id: 'garden', title: 'Community garden', capacity: 3 },
];
const format = 'devmethod-volunteers-v1';

function fail(code, message) {
  throw Object.assign(new Error(message), { code });
}

function positiveInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

function validText(value) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 128;
}

function validateSlots(slots) {
  if (!Array.isArray(slots) || slots.length !== seedSlots.length)
    fail('DATA_CORRUPT', 'The data file has invalid event slots.');
  const ids = new Set();
  for (const slot of slots) {
    if (
      !slot ||
      !seedSlots.some((seed) => seed.id === slot.id) ||
      !validText(slot.title) ||
      !positiveInteger(slot.capacity) ||
      ids.has(slot.id)
    ) {
      fail('DATA_CORRUPT', 'The data file has invalid event slots.');
    }
    ids.add(slot.id);
  }
}

function validate(state) {
  if (!state || state.format !== format || !Array.isArray(state.reservations)) {
    fail(
      'DATA_CORRUPT',
      'The data file is not a supported volunteer store. Preserve it for inspection.',
    );
  }
  validateSlots(state.slots);
  const ids = new Set();
  const requests = new Set();
  const totals = new Map(state.slots.map((slot) => [slot.id, 0]));
  for (const item of state.reservations) {
    if (
      !item ||
      !validText(item.id) ||
      !validText(item.requestId) ||
      !totals.has(item.slotId) ||
      !positiveInteger(item.seats) ||
      !['active', 'cancelled'].includes(item.status)
    ) {
      fail(
        'DATA_CORRUPT',
        'A stored reservation is invalid. Preserve the data file for inspection.',
      );
    }
    if (ids.has(item.id) || requests.has(item.requestId))
      fail('DATA_CORRUPT', 'The data file contains duplicate reservation identities.');
    ids.add(item.id);
    requests.add(item.requestId);
    if (item.status === 'active') totals.set(item.slotId, totals.get(item.slotId) + item.seats);
  }
  for (const slot of state.slots) {
    if (totals.get(slot.id) > slot.capacity)
      fail('DATA_CORRUPT', 'Stored reservations exceed a slot capacity.');
  }
  return state;
}

function load(filePath) {
  try {
    if (!lstatSync(filePath).isFile())
      fail('DATA_CORRUPT', 'The data path must be a regular file.');
  } catch (error) {
    if (error.code === 'ENOENT')
      return {
        state: { format, slots: structuredClone(seedSlots), reservations: [] },
        missing: true,
      };
    throw error;
  }
  let state;
  try {
    state = JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (error) {
    if (error instanceof SyntaxError)
      fail('DATA_CORRUPT', 'The data file is unreadable JSON. Preserve it for inspection.');
    throw error;
  }
  return { state: validate(state), missing: false };
}

function save(filePath, state) {
  const temporary = `${filePath}.${randomUUID()}.tmp`;
  let descriptor;
  try {
    descriptor = openSync(temporary, 'wx', 0o600);
    writeFileSync(descriptor, `${JSON.stringify(state, null, 2)}\n`);
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = undefined;
    renameSync(temporary, filePath);
  } catch (error) {
    try {
      if (descriptor !== undefined) closeSync(descriptor);
      unlinkSync(temporary);
    } catch {
      // Preserve the operation error; a failed cleanup can leave a temporary file.
    }
    throw error;
  }
}

function slotsFor(state) {
  return state.slots.map((slot) => ({
    ...slot,
    remaining:
      slot.capacity -
      state.reservations
        .filter((item) => item.slotId === slot.id && item.status === 'active')
        .reduce((sum, item) => sum + item.seats, 0),
  }));
}

export function createStore(filePath) {
  const path = resolve(filePath);
  function read() {
    const result = load(path);
    if (result.missing) save(path, result.state);
    return result.state;
  }
  return {
    listSlots() {
      return slotsFor(read());
    },
    listReservations() {
      return structuredClone(read().reservations);
    },
    reserve({ slotId, requestId, seats }) {
      if (!positiveInteger(seats))
        fail('INVALID_SEATS', 'Choose a positive whole number of places.');
      if (!validText(requestId))
        fail(
          'INVALID_REQUEST',
          'A nonempty request identifier of at most 128 characters is required.',
        );
      const { state } = load(path);
      const existing = state.reservations.find((item) => item.requestId === requestId);
      if (existing) {
        if (existing.slotId !== slotId || existing.seats !== seats)
          fail(
            'REQUEST_CONFLICT',
            'This request identifier already belongs to a different reservation.',
          );
        return structuredClone(existing);
      }
      const slot = slotsFor(state).find((item) => item.id === slotId);
      if (!slot) fail('SLOT_NOT_FOUND', 'This volunteer slot does not exist.');
      if (seats > slot.remaining)
        fail(
          'CAPACITY_EXCEEDED',
          `Only ${slot.remaining} place(s) remain. Refresh and choose fewer places.`,
        );
      const reservation = { id: randomUUID(), slotId, requestId, seats, status: 'active' };
      state.reservations.push(reservation);
      save(path, state);
      return structuredClone(reservation);
    },
    cancel(id) {
      const { state } = load(path);
      const reservation = state.reservations.find((item) => item.id === id);
      if (!reservation)
        fail('RESERVATION_NOT_FOUND', 'This reservation does not exist. Refresh the page.');
      if (reservation.status === 'active') {
        reservation.status = 'cancelled';
        save(path, state);
      }
      return structuredClone(reservation);
    },
  };
}
