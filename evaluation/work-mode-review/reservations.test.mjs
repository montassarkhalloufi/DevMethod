import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createReservations } from './reservations.mjs';
test('fills a slot and rejects the next request', async () => {
 let value = { capacity: 1, confirmed: [] };
 const reserve = createReservations({get: async () => value, save: async (_, next) => {value=next;}});
 assert.equal((await reserve('A','Fictional One')).status,'confirmed');
 assert.equal((await reserve('A','Fictional Two')).status,'full');
});
