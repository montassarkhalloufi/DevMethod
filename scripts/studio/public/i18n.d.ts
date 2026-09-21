export type StudioLocale = 'en' | 'fr';
export type MessageValues = Record<string, string | number>;
export const languageKey: string;
export function isLocale(value: unknown): value is StudioLocale;
export function getLocale(document?: Document): StudioLocale;
export function initializeLocale(document?: Document, window?: Window): StudioLocale;
export function setLocale(locale: StudioLocale, document?: Document, window?: Window): void;
export function subscribeLocale(callback: () => void, window?: Window): () => void;
export function translate(
  fr: string,
  en: string,
  values?: MessageValues,
  locale?: StudioLocale,
): string;
export const t: typeof translate;
export function createTranslator(
  document: Document,
): (fr: string, en: string, values?: MessageValues) => string;
export function translateStaticLabels(document: Document): void;
export function mountLocaleControls(document: Document, window: Window): () => void;
export function createMessageBindings(document: Document): {
  text(node: Node, read: () => string): void;
  attribute(node: Element, name: string, read: () => string): void;
  dispose(): void;
};
export function translateAgentMessage(message: string, locale?: StudioLocale): string;
