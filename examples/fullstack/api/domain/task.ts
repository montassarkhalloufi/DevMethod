export const MAX_TITLE_LENGTH = 120;
export interface Task { id: string; title: string }
export class InvalidTitle extends Error {}
export function taskTitle(value: unknown): string {
  if (typeof value !== 'string') throw new InvalidTitle('Title must be a string.');
  if (value.includes('\u0000')) throw new InvalidTitle('Title must not contain a null character.');
  const title = value.trim();
  if (!title || title.length > MAX_TITLE_LENGTH) {
    throw new InvalidTitle(`Title must contain 1–${MAX_TITLE_LENGTH} characters after trimming.`);
  }
  return title;
}
