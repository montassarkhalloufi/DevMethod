import type { HomeOperation, HomeProjectType, ProjectInput } from './contracts';
import type { GuideInput } from '../../connectors';

export type ComposerSection = 'references' | 'design' | 'tools' | 'project';
export interface ComposerSeed {
  id: number;
  idea: string;
  projectType: HomeProjectType;
  design?: string;
}
export interface ComposerAttachment {
  name: string;
  mime: string;
  base64: string;
}
export interface ComposerDraft {
  name: string;
  idea: string;
  action: 'plan' | 'build';
  projectType: HomeProjectType;
  design: string;
  connectors: string[];
  connectorGuides: GuideInput[];
  mcpConnectionIds: string[];
  links: string[];
  attachments: ComposerAttachment[];
}
export interface ComposerTool {
  id: string;
  title: string;
  description: string;
  capabilities: string[];
}
export interface ComposerCatalog {
  options: ComposerTool[];
  capabilities: { id: string; title: string }[];
}

export const composerLimits = {
  idea: 16000,
  design: 2000,
  connectors: 12,
  attachments: 4,
  attachmentBytes: 2 * 1024 * 1024,
  links: 5,
};
export const projectTypes: { id: HomeProjectType; label: string; idea: string }[] = [
  {
    id: 'website',
    label: 'Site web',
    idea: 'Créer un site pour présenter mon activité, expliquer mon offre et permettre aux visiteurs de me contacter.',
  },
  {
    id: 'app',
    label: 'Application',
    idea: 'Créer une application web pour organiser des informations, les retrouver rapidement et suivre les actions importantes.',
  },
  {
    id: 'prototype',
    label: 'Prototype',
    idea: 'Créer un prototype interactif pour tester un parcours clé et recueillir des retours avant de développer la version complète.',
  },
  {
    id: 'slides',
    label: 'Présentation web',
    idea: 'Créer une présentation web claire pour exposer un sujet, ses points essentiels et la prochaine étape attendue.',
  },
];
export const stylePresets = [
  {
    title: 'Sobre et précis',
    description: 'Une composition épurée, une typographie lisible et des accents mesurés.',
  },
  {
    title: 'Éditorial',
    description:
      'Une hiérarchie typographique affirmée, de grandes images et un rythme de lecture soigné.',
  },
  {
    title: 'Chaleureux',
    description: 'Des couleurs douces, des formes accueillantes et des espaces généreux.',
  },
  {
    title: 'Audacieux',
    description: 'Des contrastes marqués, des titres expressifs et une identité graphique assumée.',
  },
];

export function emptyComposer(): ComposerDraft {
  return {
    name: '',
    idea: '',
    action: 'build',
    projectType: 'website',
    design: '',
    connectors: [],
    connectorGuides: [],
    mcpConnectionIds: [],
    links: [],
    attachments: [],
  };
}

export function hasComposerContent(draft: ComposerDraft) {
  return Boolean(
    draft.idea.trim() ||
    draft.name.trim() ||
    draft.design.trim() ||
    draft.connectors.length ||
    draft.connectorGuides.length ||
    draft.mcpConnectionIds.length ||
    draft.links.length ||
    draft.attachments.length,
  );
}

export function composerActionLabel(operation: HomeOperation, reading: boolean) {
  if (reading) return 'Lecture des références…';
  if (operation.phase === 'opening') return 'Ouverture du projet…';
  if (operation.phase === 'creating') return 'Préparation du projet…';
  return operation.project ? 'Réessayer l’ouverture' : 'Démarrer le projet';
}

export function applyComposerSeed(draft: ComposerDraft, seed: ComposerSeed) {
  const nextIdea = draft.idea.trim() ? `${draft.idea}\n\n${seed.idea}` : seed.idea;
  if (nextIdea.length > composerLimits.idea)
    return {
      draft,
      error:
        'Cette inspiration dépasse la place disponible. Raccourcissez votre demande avant de l’ajouter.',
    };
  return {
    draft: {
      ...draft,
      idea: nextIdea,
      projectType: seed.projectType,
      design: seed.design ?? draft.design,
    },
    error: '',
  };
}

export function normalizeReference(value: string) {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error('Ajoutez une adresse complète, par exemple https://exemple.fr.');
  }
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    value.includes('\\')
  )
    throw new Error('Utilisez un lien HTTP ou HTTPS sans identifiant ni mot de passe.');
  if (url.href.length > 2000) throw new Error('Ce lien dépasse 2 000 caractères.');
  return url.href;
}

export function attachmentMime(file: Pick<File, 'type' | 'name' | 'size'>) {
  const extension = file.name.toLowerCase().split('.').at(-1);
  const mime =
    extension === 'md' ? 'text/markdown' : file.type || (extension === 'txt' ? 'text/plain' : '');
  if (!['image/png', 'image/jpeg', 'image/webp', 'text/plain', 'text/markdown'].includes(mime))
    throw new Error('Choisissez une image PNG, JPEG ou WebP, ou un fichier .txt ou .md.');
  if (!file.size || file.size > composerLimits.attachmentBytes)
    throw new Error(`« ${file.name} » doit contenir entre 1 octet et 2 Mio.`);
  if (!file.name.trim() || file.name.length > 256 || /[<>:"/\\|?*\p{Cc}]/u.test(file.name))
    throw new Error(
      'Utilisez un nom de fichier simple, sans chemin ni caractères spéciaux (256 caractères maximum).',
    );
  return mime;
}

export function composerInput(draft: ComposerDraft): ProjectInput {
  if (!draft.idea.trim()) throw new Error('Décrivez votre idée pour démarrer le projet.');
  if (draft.idea.length > composerLimits.idea)
    throw new Error('Votre demande dépasse 16 000 caractères. Raccourcissez-la avant de démarrer.');
  return {
    kind: 'new',
    ...(draft.name.trim() ? { name: draft.name.trim() } : {}),
    idea: draft.idea.trim(),
    launch: {
      action: draft.action,
      projectType: draft.projectType,
      design: draft.design.trim(),
      connectors: [...draft.connectors],
      ...(draft.connectorGuides.length
        ? { connectorGuides: structuredClone(draft.connectorGuides) }
        : {}),
      mcpConnectionIds: [...draft.mcpConnectionIds],
      links: [...draft.links],
      attachments: [...draft.attachments],
    },
  };
}

export function parseComposerCatalog(value: unknown): ComposerCatalog {
  const catalog = value as Partial<ComposerCatalog> | null;
  if (!catalog || !Array.isArray(catalog.options) || !Array.isArray(catalog.capabilities))
    throw new Error('Le catalogue est illisible. Réessayez son chargement.');
  const options = catalog.options.map((option) => {
    if (
      !option ||
      ![option.id, option.title, option.description].every((v) => typeof v === 'string') ||
      !Array.isArray(option.capabilities) ||
      option.capabilities.some((id) => typeof id !== 'string')
    )
      throw new Error('Une option du catalogue est illisible.');
    return option;
  });
  const capabilities = catalog.capabilities.map((capability) => {
    if (!capability || typeof capability.id !== 'string' || typeof capability.title !== 'string')
      throw new Error('Une catégorie du catalogue est illisible.');
    return capability;
  });
  return { options, capabilities };
}

export function matchesTool(option: ComposerTool, search: string) {
  const normalize = (value: string) =>
    value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLocaleLowerCase('fr-FR');
  return normalize(`${option.title} ${option.description}`).includes(normalize(search.trim()));
}
