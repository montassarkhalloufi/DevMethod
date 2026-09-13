import test from 'node:test';
import assert from 'node:assert/strict';
import { filterBooks } from './filter.mjs';
const books = [{ title: 'A', status: 'reading' }, { title: 'B', status: 'planned' }];
test('all retains order and every book', () => assert.deepEqual(filterBooks(books, 'all'), books));
test('status filters without mutating source', () => {
  assert.deepEqual(filterBooks(books, 'reading'), [books[0]]);
  assert.equal(books.length, 2);
});
