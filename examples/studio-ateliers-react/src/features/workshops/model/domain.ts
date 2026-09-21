import type { BookingIntent, Registration, Workshop, WorkshopData } from './types';

export const CATEGORY_LABELS: Readonly<Record<string, string>> = {
  repair: 'Réparation',
  cooking: 'Cuisine',
  sewing: 'Couture',
};

export function initialData(): WorkshopData {
  return {
    workshops: [
      {
        id: 'repair-bike',
        category: 'repair',
        title: 'Réparer son vélo',
        date: '2026-09-20',
        time: '10 h–12 h',
        location: 'Maison des associations',
        capacity: 2,
      },
      {
        id: 'season-cooking',
        category: 'cooking',
        title: 'Cuisine de saison',
        date: '2026-09-23',
        time: '18 h–20 h',
        location: 'Cuisine partagée',
        capacity: 3,
      },
      {
        id: 'sewing-intro',
        category: 'sewing',
        title: 'Initiation à la couture',
        date: '2026-09-26',
        time: '14 h–16 h',
        location: 'Salle des pratiques',
        capacity: 2,
      },
    ],
    registrations: [],
    waitlist: [],
  };
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function workshop(value: unknown): value is Workshop {
  if (!record(value)) return false;
  const strings = ['id', 'category', 'title', 'date', 'time', 'location'];
  return (
    strings.every((key) => typeof value[key] === 'string' && value[key].length > 0) &&
    typeof value.capacity === 'number' &&
    Number.isSafeInteger(value.capacity) &&
    value.capacity >= 0
  );
}

function registration(value: unknown): value is Registration {
  return (
    record(value) &&
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    typeof value.workshopId === 'string' &&
    typeof value.name === 'string'
  );
}

/** Accept the older shape without waitlist, preserving every unrelated stored field. */
export function decodeData(value: unknown): WorkshopData | null {
  if (record(value) && Object.keys(value).length === 0) return null;
  if (
    !record(value) ||
    !Array.isArray(value.workshops) ||
    !value.workshops.every(workshop) ||
    !Array.isArray(value.registrations) ||
    !value.registrations.every(registration) ||
    (value.waitlist !== undefined &&
      (!Array.isArray(value.waitlist) || !value.waitlist.every(registration)))
  ) {
    throw new Error(
      'Les données existantes ont un format incompatible ; elles n’ont pas été remplacées.',
    );
  }
  const workshops = value.workshops.map((item) => ({ ...item }));
  const registrations = value.registrations.map((item) => ({ ...item }));
  const waitlist = (value.waitlist ?? []).map((item) => ({ ...item }));
  const workshopIds = new Set(workshops.map((item) => item.id));
  const entries = [...registrations, ...waitlist];
  if (
    workshopIds.size !== workshops.length ||
    new Set(entries.map((item) => item.id)).size !== entries.length ||
    entries.some((item) => !workshopIds.has(item.workshopId))
  ) {
    throw new Error(
      'Les références des données existantes sont incompatibles ; aucune remise à zéro.',
    );
  }
  return { ...value, workshops, registrations, waitlist };
}

export function decodePayload(payload: unknown): { version: number; data: WorkshopData | null } {
  if (
    !record(payload) ||
    typeof payload.version !== 'number' ||
    !Number.isSafeInteger(payload.version) ||
    payload.version < 1
  ) {
    throw new Error('Version de stockage invalide.');
  }
  return { version: payload.version, data: decodeData(payload.data) };
}

export function placesLeft(data: WorkshopData, workshopId: string): number {
  const current = data.workshops.find((item) => item.id === workshopId);
  return current
    ? Math.max(
        0,
        current.capacity -
          data.registrations.filter((item) => item.workshopId === workshopId).length,
      )
    : 0;
}

export function register(
  data: WorkshopData,
  workshopId: string,
  name: string,
  id: string,
): WorkshopData {
  const cleanName = name.trim();
  if (!cleanName || cleanName.length > 80) throw new Error('Indiquez un nom de 1 à 80 caractères.');
  if (!data.workshops.some((item) => item.id === workshopId))
    throw new Error('Cet atelier n’existe plus.');
  if ([...data.registrations, ...data.waitlist].some((item) => item.id === id))
    throw new Error('Cette demande est déjà enregistrée.');
  const entry: Registration = { id, workshopId, name: cleanName };
  return placesLeft(data, workshopId) > 0
    ? { ...data, registrations: [...data.registrations, entry] }
    : { ...data, waitlist: [...data.waitlist, entry] };
}

export function cancel(data: WorkshopData, registrationId: string): WorkshopData {
  const cancelled = data.registrations.find((item) => item.id === registrationId);
  if (!cancelled) return data;
  const next = {
    ...data,
    registrations: data.registrations.filter((item) => item.id !== registrationId),
  };
  const first = data.waitlist.find((item) => item.workshopId === cancelled.workshopId);
  if (!first || placesLeft(next, cancelled.workshopId) < 1) return next;
  return {
    ...next,
    registrations: [...next.registrations, { ...first }],
    waitlist: data.waitlist.filter((item) => item.id !== first.id),
  };
}

export function applyIntent(data: WorkshopData, intent: BookingIntent): WorkshopData {
  if (intent.type === 'register') return register(data, intent.workshopId, intent.name, intent.id);
  if (intent.type === 'cancel') return cancel(data, intent.registrationId);
  return { ...data, waitlist: data.waitlist.filter((item) => item.id !== intent.registrationId) };
}

export function describeChange(
  before: WorkshopData,
  after: WorkshopData,
  intent: BookingIntent,
): string {
  if (intent.type === 'leave-waitlist') return 'Nom retiré de la liste d’attente.';
  if (intent.type === 'register') {
    const waiting = after.waitlist.filter((item) => item.workshopId === intent.workshopId);
    const position = waiting.findIndex((item) => item.id === intent.id) + 1;
    return position > 0
      ? `${intent.name.trim()} est sur la liste d’attente, en position ${position}. Aucun email envoyé.`
      : 'Inscription enregistrée.';
  }
  const previousIds = new Set(before.registrations.map((item) => item.id));
  const promoted = after.registrations.find((item) => !previousIds.has(item.id));
  return promoted
    ? `Inscription annulée. ${promoted.name}, première personne de la liste d’attente, prend la place libérée. Aucun email envoyé.`
    : 'Inscription annulée. La place est à nouveau disponible.';
}
