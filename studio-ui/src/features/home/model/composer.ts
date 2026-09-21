import { translate, type StudioLocale } from '../../../i18n';
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
export function projectTypes(
  locale: StudioLocale = 'en',
): { id: HomeProjectType; label: string; idea: string }[] {
  return [
    {
      id: 'website',
      label: translate('Site web', 'Website', undefined, locale),
      idea: translate(
        'Créer un site pour présenter mon activité, expliquer mon offre et permettre aux visiteurs de me contacter.',
        'Create a website to present my business, explain my offer, and let visitors contact me.',
        undefined,
        locale,
      ),
    },
    {
      id: 'app',
      label: translate('Application', 'App', undefined, locale),
      idea: translate(
        'Créer une application web pour organiser des informations, les retrouver rapidement et suivre les actions importantes.',
        'Create a web app to organize information, find it quickly, and track important actions.',
        undefined,
        locale,
      ),
    },
    {
      id: 'prototype',
      label: 'Prototype',
      idea: translate(
        'Créer un prototype interactif pour tester un parcours clé et recueillir des retours avant de développer la version complète.',
        'Create an interactive prototype to test a key journey and gather feedback before developing the full version.',
        undefined,
        locale,
      ),
    },
    {
      id: 'slides',
      label: translate('Présentation web', 'Web presentation', undefined, locale),
      idea: translate(
        'Créer une présentation web claire pour exposer un sujet, ses points essentiels et la prochaine étape attendue.',
        'Create a clear web presentation to explain a topic, its key points, and the expected next step.',
        undefined,
        locale,
      ),
    },
  ];
}
export function stylePresets(locale: StudioLocale = 'en') {
  return [
    {
      title: translate('Sobre et précis', 'Clean and precise', undefined, locale),
      description: translate(
        'Une composition épurée, une typographie lisible et des accents mesurés.',
        'A clean composition, readable typography, and restrained accents.',
        undefined,
        locale,
      ),
    },
    {
      title: translate('Éditorial', 'Editorial', undefined, locale),
      description: translate(
        'Une hiérarchie typographique affirmée, de grandes images et un rythme de lecture soigné.',
        'A clear typographic hierarchy, large images, and a considered reading rhythm.',
        undefined,
        locale,
      ),
    },
    {
      title: translate('Chaleureux', 'Warm', undefined, locale),
      description: translate(
        'Des couleurs douces, des formes accueillantes et des espaces généreux.',
        'Soft colors, inviting shapes, and generous spacing.',
        undefined,
        locale,
      ),
    },
    {
      title: translate('Audacieux', 'Bold', undefined, locale),
      description: translate(
        'Des contrastes marqués, des titres expressifs et une identité graphique assumée.',
        'Strong contrasts, expressive headings, and a distinctive visual identity.',
        undefined,
        locale,
      ),
    },
  ];
}

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

export function composerActionLabel(
  operation: HomeOperation,
  reading: boolean,
  locale: StudioLocale = 'en',
) {
  if (reading)
    return translate('Lecture des références…', 'Reading references…', undefined, locale);
  if (operation.phase === 'opening')
    return translate('Ouverture du projet…', 'Opening project…', undefined, locale);
  if (operation.phase === 'creating')
    return translate('Préparation du projet…', 'Preparing project…', undefined, locale);
  return operation.project
    ? translate('Réessayer l’ouverture', 'Retry opening', undefined, locale)
    : translate('Démarrer le projet', 'Start project', undefined, locale);
}

export function applyComposerSeed(
  draft: ComposerDraft,
  seed: ComposerSeed,
  locale: StudioLocale = 'en',
) {
  const nextIdea = draft.idea.trim() ? `${draft.idea}\n\n${seed.idea}` : seed.idea;
  if (nextIdea.length > composerLimits.idea)
    return {
      draft,
      error: translate(
        'Cette inspiration dépasse la place disponible. Raccourcissez votre demande avant de l’ajouter.',
        'This inspiration exceeds the available space. Shorten your request before adding it.',
        undefined,
        locale,
      ),
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

export function normalizeReference(value: string, locale: StudioLocale = 'en') {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error(
      translate(
        'Ajoutez une adresse complète, par exemple https://exemple.fr.',
        'Add a complete address, for example https://example.com.',
        undefined,
        locale,
      ),
    );
  }
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    value.includes('\\')
  )
    throw new Error(
      translate(
        'Utilisez un lien HTTP ou HTTPS sans identifiant ni mot de passe.',
        'Use an HTTP or HTTPS link without a username or password.',
        undefined,
        locale,
      ),
    );
  if (url.href.length > 2000)
    throw new Error(
      translate(
        'Ce lien dépasse 2 000 caractères.',
        'This link exceeds 2,000 characters.',
        undefined,
        locale,
      ),
    );
  return url.href;
}

export function attachmentMime(
  file: Pick<File, 'type' | 'name' | 'size'>,
  locale: StudioLocale = 'en',
) {
  const extension = file.name.toLowerCase().split('.').at(-1);
  const mime =
    extension === 'md' ? 'text/markdown' : file.type || (extension === 'txt' ? 'text/plain' : '');
  if (!['image/png', 'image/jpeg', 'image/webp', 'text/plain', 'text/markdown'].includes(mime))
    throw new Error(
      translate(
        'Choisissez une image PNG, JPEG ou WebP, ou un fichier .txt ou .md.',
        'Choose a PNG, JPEG, or WebP image, or a .txt or .md file.',
        undefined,
        locale,
      ),
    );
  if (!file.size || file.size > composerLimits.attachmentBytes)
    throw new Error(
      translate(
        '« {name} » doit contenir entre 1 octet et 2 Mio.',
        '“{name}” must contain between 1 byte and 2 MiB.',
        { name: file.name },
        locale,
      ),
    );
  if (!file.name.trim() || file.name.length > 256 || /[<>:"/\\|?*\p{Cc}]/u.test(file.name))
    throw new Error(
      translate(
        'Utilisez un nom de fichier simple, sans chemin ni caractères spéciaux (256 caractères maximum).',
        'Use a simple file name without a path or special characters (up to 256 characters).',
        undefined,
        locale,
      ),
    );
  return mime;
}

export function composerInput(draft: ComposerDraft, locale: StudioLocale = 'en'): ProjectInput {
  if (!draft.idea.trim())
    throw new Error(
      translate(
        'Décrivez votre idée pour démarrer le projet.',
        'Describe your idea to start the project.',
        undefined,
        locale,
      ),
    );
  if (draft.idea.length > composerLimits.idea)
    throw new Error(
      translate(
        'Votre demande dépasse 16 000 caractères. Raccourcissez-la avant de démarrer.',
        'Your request exceeds 16,000 characters. Shorten it before starting.',
        undefined,
        locale,
      ),
    );
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

export function parseComposerCatalog(value: unknown, locale: StudioLocale = 'en'): ComposerCatalog {
  const catalog = value as Partial<ComposerCatalog> | null;
  if (!catalog || !Array.isArray(catalog.options) || !Array.isArray(catalog.capabilities))
    throw new Error(
      translate(
        'Le catalogue est illisible. Réessayez son chargement.',
        'The catalog could not be read. Try loading it again.',
        undefined,
        locale,
      ),
    );
  const options = catalog.options.map((option) => {
    if (
      !option ||
      ![option.id, option.title, option.description].every((v) => typeof v === 'string') ||
      !Array.isArray(option.capabilities) ||
      option.capabilities.some((id) => typeof id !== 'string')
    )
      throw new Error(
        translate(
          'Une option du catalogue est illisible.',
          'A catalog option could not be read.',
          undefined,
          locale,
        ),
      );
    return option;
  });
  const capabilities = catalog.capabilities.map((capability) => {
    if (!capability || typeof capability.id !== 'string' || typeof capability.title !== 'string')
      throw new Error(
        translate(
          'Une catégorie du catalogue est illisible.',
          'A catalog category could not be read.',
          undefined,
          locale,
        ),
      );
    return capability;
  });
  return { options, capabilities };
}

export function matchesTool(option: ComposerTool, search: string) {
  const normalize = (value: string) =>
    value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();
  return normalize(`${option.title} ${option.description}`).includes(normalize(search.trim()));
}
