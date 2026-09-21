import fs from 'node:fs';
import { readMcpSelection } from './mcp-selection.mjs';

// The Home library already bounds the number of projects and validates their roots.
// An unreadable project is reported as unknown, never inferred to be unselected.
export function readMcpUsage(projects, connectionId) {
  const selected = [];
  let unavailable = 0;
  for (const project of projects) {
    try {
      const stat = fs.lstatSync(project.workspace);
      if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('Projet indisponible.');
      if (readMcpSelection({ root: project.workspace }).connectionIds.includes(connectionId))
        selected.push({ id: project.id, name: project.name });
    } catch {
      unavailable += 1;
    }
  }
  return { supported: true, projects: selected, unavailable };
}
