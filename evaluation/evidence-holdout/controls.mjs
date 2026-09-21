import { existsSync, readFileSync, writeFileSync } from 'node:fs';

export function createControl(file, defect) {
  const data = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { pending: [], completed: [] };
  const save = () => writeFileSync(file, JSON.stringify(data));
  return {
    enqueue(id) { if ((defect !== 'duplicate' && data.pending.includes(id)) || (defect !== 'resurrect' && data.completed.includes(id))) return false; data.pending.push(id); save(); return true; },
    complete(id) { const index = data.pending.indexOf(id); if (index < 0) return false; data.pending.splice(index, 1); data.completed.push(id); save(); return true; },
    pending() { return [...data.pending]; },
  };
}
