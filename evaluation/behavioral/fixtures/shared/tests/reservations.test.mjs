import test from 'node:test';
import assert from 'node:assert/strict';
import { createReservations } from '../api/reservations.ts';
test('a sequential reservation consumes one place', async () => { const store=createReservations(); assert.equal((await store.reserve('r1')).remaining,0); await assert.rejects(store.reserve('r2'), /CAPACITY_FULL/); });
