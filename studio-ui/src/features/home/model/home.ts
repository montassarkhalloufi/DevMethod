import { translate, type StudioLocale } from '../../../i18n';
import type {
  FieldError,
  HomeOperation,
  HomeProject,
  ProjectInput,
  ProjectKind,
} from './contracts';

export function kindLabels(locale: StudioLocale = 'en'): Record<ProjectKind, string> {
  return {
    new: translate('Nouveau projet', 'New project', undefined, locale),
    imported: translate('Sources importées', 'Imported sources', undefined, locale),
    existing: translate('Projet Studio', 'Studio project', undefined, locale),
  };
}

export function readProject(value: unknown, locale: StudioLocale = 'en'): HomeProject {
  const project = value as Partial<HomeProject> | null;
  if (
    !project ||
    !['new', 'imported', 'existing'].includes(project.kind || '') ||
    ![project.id, project.name, project.workspace, project.createdAt].every(
      (entry) => typeof entry === 'string' && entry.length > 0,
    ) ||
    !(project.lastOpenedAt === null || typeof project.lastOpenedAt === 'string')
  )
    throw new Error(
      translate(
        'La réponse du projet est illisible. Actualisez pour vérifier son état.',
        'The project response could not be read. Refresh to check its state.',
        undefined,
        locale,
      ),
    );
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

export function validateProjectInput(
  input: ProjectInput,
  locale: StudioLocale = 'en',
): FieldError | null {
  const field = input.kind === 'existing' ? 'workspace' : 'source';
  const path = input[field];
  if (path !== undefined && !isAbsolutePath(path))
    return {
      field,
      message: translate(
        'Indiquez un chemin absolu, par exemple /Users/vous/mon-projet.',
        'Enter an absolute path, for example /Users/you/my-project.',
        undefined,
        locale,
      ),
    };
  if (input.kind === 'new' && !input.name)
    return {
      field: 'name',
      message: translate('Donnez un nom au projet.', 'Give the project a name.', undefined, locale),
    };
  if (input.kind === 'new' && !input.idea)
    return {
      field: 'idea',
      message: translate(
        'Décrivez ce que vous voulez faire avancer.',
        'Describe what you want to work on.',
        undefined,
        locale,
      ),
    };
  return null;
}

export function projectActionLabel(
  kind: ProjectKind,
  operation: HomeOperation,
  locale: StudioLocale = 'en',
) {
  if (operation.phase === 'opening') return translate('Ouverture…', 'Opening…', undefined, locale);
  if (operation.phase === 'creating')
    return kind === 'imported'
      ? translate('Importation…', 'Importing…', undefined, locale)
      : translate('Préparation…', 'Preparing…', undefined, locale);
  if (operation.project)
    return translate('Réessayer l’ouverture', 'Retry opening', undefined, locale);
  return {
    new: translate('Créer et ouvrir', 'Create and open', undefined, locale),
    imported: translate('Importer et ouvrir', 'Import and open', undefined, locale),
    existing: translate('Reprendre ce projet', 'Resume this project', undefined, locale),
  }[kind];
}

export function projectSearch(project: HomeProject, query: string) {
  const normalize = (text: string) =>
    text
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();
  return normalize(`${project.name} ${project.workspace}`).includes(normalize(query.trim()));
}

export function recentProjects(projects: HomeProject[]) {
  return [...projects].sort(
    (a, b) => Date.parse(b.lastOpenedAt || b.createdAt) - Date.parse(a.lastOpenedAt || a.createdAt),
  );
}

export function projectDate(project: HomeProject, locale: StudioLocale = 'en') {
  const date = new Date(project.lastOpenedAt || project.createdAt);
  return Number.isNaN(date.getTime())
    ? translate('Date non disponible', 'Date unavailable', undefined, locale)
    : new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
}

export function openingUrl(value: unknown, kind?: ProjectKind, locale: StudioLocale = 'en') {
  if (typeof value !== 'string')
    throw new Error(
      translate(
        'L’adresse locale du projet est absente.',
        'The project’s local address is missing.',
        undefined,
        locale,
      ),
    );
  const url = new URL(value);
  if (
    url.protocol !== 'http:' ||
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
    !url.port ||
    url.username ||
    url.password ||
    url.pathname !== '/'
  )
    throw new Error(
      translate(
        'L’adresse renvoyée ne correspond pas à une session Studio locale.',
        'The returned address is not a local Studio session.',
        undefined,
        locale,
      ),
    );
  if (kind === 'new' || kind === 'imported') url.hash = 'journey-foundation';
  return url.href;
}
