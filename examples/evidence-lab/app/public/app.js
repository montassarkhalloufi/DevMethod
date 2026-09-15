const slotDescriptions = {
  welcome: ['✳', 'Offer a warm hello, help people find their team, and keep the morning moving.'],
  garden: [
    '❋',
    'Plant something lovely together. Help our shared garden grow, one seed at a time.',
  ],
};
const notice = document.querySelector('#notice');
const pending = new Map();
let currentSlots = [];

function announce(message, error = false) {
  notice.textContent = message;
  notice.classList.toggle('error', error);
  notice.focus();
}

async function api(path, value) {
  const options =
    value === undefined
      ? {}
      : {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(value),
        };
  const response = await fetch(path, options);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'The request could not be completed.');
  return result;
}

function reservationRow(item) {
  const row = document.createElement('article');
  row.className = `reservation ${item.status === 'cancelled' ? 'cancelled' : ''}`;
  const details = document.createElement('div');
  const title = document.createElement('strong');
  title.textContent = currentSlots.find((slot) => slot.id === item.slotId)?.title || item.slotId;
  const description = document.createElement('p');
  description.textContent = `${item.seats} ${item.seats === 1 ? 'place' : 'places'} · Saturday 09:00–12:00`;
  const reference = document.createElement('code');
  reference.textContent = `Reference: ${item.id}`;
  details.append(title, description, reference);
  const action = document.createElement(item.status === 'active' ? 'button' : 'span');
  action.className = item.status === 'active' ? 'cancel-button' : 'cancelled-label';
  action.textContent = item.status === 'active' ? 'Cancel reservation' : 'Cancelled';
  if (item.status === 'active')
    action.addEventListener('click', async () => {
      action.disabled = true;
      try {
        await api(`/api/reservations/${item.id}/cancel`, {});
        announce('Reservation cancelled. Your places are available again.');
        await refresh();
      } catch (error) {
        announce(error.message, true);
        action.disabled = false;
      }
    });
  row.append(details, action);
  return row;
}

function slotCard(slot) {
  const card = document.querySelector('#slot-template').content.firstElementChild.cloneNode(true);
  card.querySelector('h3').textContent = slot.title;
  card.querySelector('.role-symbol').textContent = slotDescriptions[slot.id][0];
  card.querySelector('.role-description').textContent = slotDescriptions[slot.id][1];
  card.querySelector('.availability').textContent = slot.remaining
    ? `${slot.remaining} of ${slot.capacity} places left`
    : 'Team complete';
  const select = card.querySelector('select');
  select.replaceChildren();
  for (let seats = 1; seats <= slot.remaining; seats++) {
    const option = document.createElement('option');
    option.value = String(seats);
    option.textContent = `${seats} ${seats === 1 ? 'person' : 'people'}`;
    select.append(option);
  }
  const button = card.querySelector('button');
  select.disabled = button.disabled = slot.remaining === 0;
  card.querySelector('form').addEventListener('submit', async (event) => {
    event.preventDefault();
    button.disabled = true;
    const seats = Number(select.value);
    const key = `${slot.id}:${seats}`;
    if (!pending.has(key)) pending.set(key, crypto.randomUUID());
    try {
      const reservation = await api('/api/reservations', {
        slotId: slot.id,
        seats,
        requestId: pending.get(key),
      });
      pending.delete(key);
      announce(
        reservation.status === 'cancelled'
          ? 'This request was already cancelled. It has not been booked again.'
          : `${seats} place(s) reserved. Reference: ${reservation.id}`,
      );
      await refresh().catch(() =>
        announce(
          `Reservation saved. Reference: ${reservation.id}. Refresh availability before making another booking.`,
          true,
        ),
      );
    } catch (error) {
      announce(
        `${error.message} If your connection failed, retrying these same places is safe.`,
        true,
      );
      button.disabled = false;
    }
  });
  return card;
}

async function refresh() {
  const state = await api('/api/state');
  currentSlots = state.slots;
  document.querySelector('#available').textContent = state.slots.reduce(
    (sum, slot) => sum + slot.remaining,
    0,
  );
  document.querySelector('#slots').replaceChildren(...state.slots.map(slotCard));
  const reservations = document.querySelector('#reservations');
  reservations.replaceChildren(...state.reservations.slice().reverse().map(reservationRow));
  if (!state.reservations.length) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'Your first small act starts above. Reserve a place to join in.';
    reservations.append(empty);
  }
}

document
  .querySelector('#refresh')
  .addEventListener('click', () => refresh().catch((error) => announce(error.message, true)));
refresh().catch((error) => announce(`Cannot load availability. ${error.message}`, true));
