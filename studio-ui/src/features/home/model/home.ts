import type {
  FieldError,
  HomeOperation,
  HomeProject,
  ProjectInput,
  ProjectKind,
} from './contracts';

export const kindLabels: Record<ProjectKind, string> = {
  new: 'Nouveau projet',
  imported: 'Sources importées',
  existing: 'Projet Studio',
};

export function readProject(value: unknown): HomeProject {
  const project = value as Partial<HomeProject> | null;
  if (
    !project ||
    !['new', 'imported', 'existing'].includes(project.kind || '') ||
    ![project.id, project.name, project.workspace, project.createdAt].every(
      (entry) => typeof entry === 'string' && entry.length > 0,
    ) ||
    !(project.lastOpenedAt === null || typeof project.lastOpenedAt === 'string')
  )
    throw new Error('La réponse du projet est illisible. Actualisez pour vérifier son état.');
  return project as HomeProject;
}

export function projectInput(kind: ProjectKind, form: HTMLFormElement): ProjectInput {
  const data = new FormData(form);
  const text = (key: string) => String(data.get(key) || '').trim();
  if (kind === 'new') return { kind, name: text('name'), idea: text('idea') };
  if (kind === 'existing') return { kind, workspace: text('workspace') };
  return { kind, ...(text('name') ? { name: text('name') } : {}), source: text('source') };
}

export function isAbsolutePath(value: string) {
  return value.startsWith('/') || /^[a-z]:[\\/]/i.test(value);
}

export function validateProjectInput(input: ProjectInput): FieldError | null {
  const field = input.kind === 'existing' ? 'workspace' : 'source';
  const path = input[field];
  if (path !== undefined && !isAbsolutePath(path))
    return { field, message: 'Indiquez un chemin absolu, par exemple /Users/vous/mon-projet.' };
  if (input.kind === 'new' && !input.name)
    return { field: 'name', message: 'Donnez un nom au projet.' };
  if (input.kind === 'new' && !input.idea)
    return { field: 'idea', message: 'Décrivez ce que vous voulez faire avancer.' };
  return null;
}

export function projectActionLabel(kind: ProjectKind, operation: HomeOperation) {
  if (operation.phase === 'opening') return 'Ouverture…';
  if (operation.phase === 'creating') return kind === 'imported' ? 'Importation…' : 'Préparation…';
  if (operation.project) return 'Réessayer l’ouverture';
  return {
    new: 'Créer et ouvrir',
    imported: 'Importer et ouvrir',
    existing: 'Reprendre ce projet',
  }[kind];
}

export function projectSearch(project: HomeProject, query: string) {
  const normalize = (text: string) =>
    text
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLocaleLowerCase('fr-FR');
  return normalize(`${project.name} ${project.workspace}`).includes(normalize(query.trim()));
}

export function recentProjects(projects: HomeProject[]) {
  return [...projects].sort(
    (a, b) => Date.parse(b.lastOpenedAt || b.createdAt) - Date.parse(a.lastOpenedAt || a.createdAt),
  );
}

export function projectDate(project: HomeProject) {
  const date = new Date(project.lastOpenedAt || project.createdAt);
  return Number.isNaN(date.getTime())
    ? 'Date non disponible'
    : new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(date);
}

export function openingUrl(value: unknown, kind?: ProjectKind) {
  if (typeof value !== 'string') throw new Error('L’adresse locale du projet est absente.');
  const url = new URL(value);
  if (
    url.protocol !== 'http:' ||
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
    !url.port ||
    url.username ||
    url.password ||
    url.pathname !== '/'
  )
    throw new Error('L’adresse renvoyée ne correspond pas à une session Studio locale.');
  if (kind === 'new' || kind === 'imported') url.hash = 'journey-foundation';
  return url.href;
}
