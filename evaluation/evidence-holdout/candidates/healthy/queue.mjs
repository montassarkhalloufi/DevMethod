import { existsSync, readFileSync, writeFileSync } from 'node:fs';

export function createQueue(file) {
  const rows = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : [];
  const save = () => writeFileSync(file, JSON.stringify(rows));
  return {
    enqueue(id) { if (rows.some(row => row.id === id)) return false; rows.push({ id, state: 'pending' }); save(); return true; },
    complete(id) { const row = rows.find(item => item.id === id && item.state === 'pending'); if (!row) return false; row.state = 'complete'; save(); return true; },
    pending() { return rows.filter(row => row.state === 'pending').map(row => row.id); },
  };
}
