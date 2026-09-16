import { decodePayload, initialData } from '../model/domain.ts';
import type { Snapshot, WorkshopData } from '../model/types';

export class DataConflict extends Error {
  constructor() {
    super(
      'Le programme a changé. Rechargez les données avant de réessayer ; votre saisie est conservée.',
    );
    this.name = 'DataConflict';
  }
}

export type FetchData = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

/** Transport only: no localStorage fallback silently replaces the authoritative data. */
export function createWorkshopStore(fetchData: FetchData = fetch) {
  async function read(signal?: AbortSignal) {
    const response = await fetchData('/api/data', {
      headers: { Accept: 'application/json' },
      signal,
    });
    if (!response.ok) throw new Error(`Chargement impossible (${response.status}).`);
    return decodePayload(await response.json());
  }

  async function save(
    version: number,
    data: WorkshopData,
    signal?: AbortSignal,
  ): Promise<Snapshot> {
    const response = await fetchData('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ version, data }),
      signal,
    });
    if (response.status === 409) throw new DataConflict();
    if (!response.ok) throw new Error(`Enregistrement impossible (${response.status}).`);
    const result = decodePayload(await response.json());
    if (!result.data) throw new Error('Enregistrement non confirmé : données vides reçues.');
    return { version: result.version, data: result.data };
  }

  async function load(signal?: AbortSignal): Promise<Snapshot> {
    const snapshot = await read(signal);
    if (snapshot.data) return { version: snapshot.version, data: snapshot.data };
    try {
      return await save(snapshot.version, initialData(), signal);
    } catch (error) {
      if (!(error instanceof DataConflict)) throw error;
      const fresh = await read(signal);
      if (!fresh.data)
        throw new Error('Initialisation concurrente incomplète. Réessayez le chargement.', {
          cause: error,
        });
      return { version: fresh.version, data: fresh.data };
    }
  }

  return { load, save };
}

export type WorkshopStore = ReturnType<typeof createWorkshopStore>;
