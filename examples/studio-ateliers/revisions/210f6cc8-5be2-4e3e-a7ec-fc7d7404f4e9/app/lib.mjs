export const INITIAL_WORKSHOPS = [
  { id: "repair-bike", category: "repair", title: "Réparer son vélo", date: "2026-09-20", time: "10 h–12 h", location: "Maison des associations", capacity: 2 },
  { id: "season-cooking", category: "cooking", title: "Cuisine de saison", date: "2026-09-23", time: "18 h–20 h", location: "Cuisine partagée", capacity: 3 },
  { id: "sewing-intro", category: "sewing", title: "Initiation à la couture", date: "2026-09-26", time: "14 h–16 h", location: "Salle des pratiques", capacity: 2 }
];

export const CATEGORY_LABELS = { repair: "Réparation", cooking: "Cuisine", sewing: "Couture" };

export function initialData() {
  return { workshops: INITIAL_WORKSHOPS.map(workshop => ({ ...workshop })), registrations: [] };
}

export function normalizeData(value) {
  if (!value || !Array.isArray(value.workshops) || !Array.isArray(value.registrations)) return null;
  return {
    workshops: value.workshops.map(workshop => ({ ...workshop })),
    registrations: value.registrations.map(registration => ({ ...registration }))
  };
}

export function placesLeft(data, workshopId) {
  const workshop = data.workshops.find(item => item.id === workshopId);
  if (!workshop) return 0;
  const taken = data.registrations.filter(item => item.workshopId === workshopId).length;
  return Math.max(0, workshop.capacity - taken);
}

export function applyRegistration(data, workshopId, name, id = makeId()) {
  const cleanName = name.trim();
  if (!cleanName) throw new Error("Indiquez votre nom.");
  if (!data.workshops.some(item => item.id === workshopId)) throw new Error("Cet atelier n’existe plus.");
  if (placesLeft(data, workshopId) < 1) throw new Error("Cet atelier est complet.");
  return { ...data, registrations: [...data.registrations, { id, workshopId, name: cleanName }] };
}

export function applyCancellation(data, registrationId) {
  return { ...data, registrations: data.registrations.filter(item => item.id !== registrationId) };
}

export function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `registration-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function readDataPayload(payload) {
  if (!Number.isSafeInteger(payload.version) || payload.version < 1) throw new Error("Version de stockage invalide.");
  const raw = payload.data;
  const empty = raw && typeof raw === "object" && !Array.isArray(raw) && Object.keys(raw).length === 0;
  const data = empty ? null : normalizeData(raw);
  if (!empty && !data) throw new Error("Les données existantes ont un format incompatible ; elles n’ont pas été remplacées.");
  return {version: payload.version, data};
}
