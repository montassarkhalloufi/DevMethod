import assert from "node:assert/strict";
import test from "node:test";
import { applyCancellation, applyRegistration, applyWaitlist, applyWaitlistCancellation, initialData, normalizeData, readDataPayload, placesLeft } from "./lib.mjs";

test("les trois ateliers demandés sont initialisés", () => {
  const data = initialData();
  assert.deepEqual(data.workshops.map(({ title, date, time, location, capacity }) => ({ title, date, time, location, capacity })), [
    { title: "Réparer son vélo", date: "2026-09-20", time: "10 h–12 h", location: "Maison des associations", capacity: 2 },
    { title: "Cuisine de saison", date: "2026-09-23", time: "18 h–20 h", location: "Cuisine partagée", capacity: 3 },
    { title: "Initiation à la couture", date: "2026-09-26", time: "14 h–16 h", location: "Salle des pratiques", capacity: 2 }
  ]);
});

test("une inscription consomme une place et une annulation la restitue", () => {
  const registered = applyRegistration(initialData(), "repair-bike", "  Camille  ", "r1");
  assert.equal(placesLeft(registered, "repair-bike"), 1);
  assert.equal(registered.registrations[0].name, "Camille");
  assert.equal(placesLeft(applyCancellation(registered, "r1"), "repair-bike"), 2);
});

test("la capacité est strictement contrôlée", () => {
  let data = applyRegistration(initialData(), "repair-bike", "Camille", "r1");
  data = applyRegistration(data, "repair-bike", "Noa", "r2");
  assert.throws(() => applyRegistration(data, "repair-bike", "Lou", "r3"), /complet/);
});

test("un nouvel essai sur des données fraîches conserve une inscription concurrente", () => {
  const fresh = applyRegistration(initialData(), "season-cooking", "Concurrente", "remote");
  const retried = applyRegistration(fresh, "season-cooking", "Locale", "local");
  assert.deepEqual(retried.registrations.map(item => item.id), ["remote", "local"]);
  assert.equal(placesLeft(retried, "season-cooking"), 1);
});

test("des données absentes ne sont pas confondues avec des données persistées", () => {
  assert.equal(normalizeData(null), null);
  const data = initialData();
  assert.deepEqual(normalizeData(data), data);
});


test("le contrat HTTP Studio vide est une première utilisation, pas des données à écraser", () => {
  assert.deepEqual(readDataPayload({version: 1, data: {}}), {version: 1, data: null});
  const data = initialData();
  data.registrations.push({id: "existing", workshopId: "repair-bike", name: "Amina"});
  assert.deepEqual(readDataPayload({version: 9, data}), {version: 9, data});
});

test("un stockage non vide inconnu est refusé et reste intact", () => {
  const payload = {version: 2, data: {anotherApp: ["keep"]}};
  assert.throws(() => readDataPayload(payload), /incompatible/);
  assert.deepEqual(payload.data, {anotherApp: ["keep"]});
});

// V2 waitlist: operator-authored examples, not live business data writes.
test("la migration additive conserve Amina, Noa, Omar et les champs existants", () => {
  const legacy = initialData();
  delete legacy.waitlist;
  legacy.note = "Conserver ce champ";
  legacy.registrations = [
    {id: "amina", workshopId: "repair-bike", name: "Amina"},
    {id: "noa", workshopId: "season-cooking", name: "Noa"},
    {id: "omar", workshopId: "repair-bike", name: "Omar"}
  ];
  const migrated = normalizeData(legacy);
  assert.deepEqual(migrated.registrations, legacy.registrations);
  assert.equal(migrated.note, legacy.note);
  assert.deepEqual(migrated.waitlist, []);
  assert.equal(Object.hasOwn(legacy, "waitlist"), false);
});

test("une liste d’attente refuse les noms vides et les ateliers encore disponibles", () => {
  assert.throws(() => applyWaitlist(initialData(), "repair-bike", "Lina", "w1"), /place disponible/);
  assert.throws(() => applyWaitlist(initialData(), "missing", "Lina", "w1"), /n’existe/);
  assert.throws(() => applyWaitlist(initialData(), "repair-bike", "  ", "w1"), /nom/);
});

test("une annulation promeut le premier nom du bon atelier sans dépasser sa capacité", () => {
  let data = applyRegistration(initialData(), "repair-bike", "Amina", "a");
  data = applyRegistration(data, "repair-bike", "Omar", "o");
  data = applyRegistration(data, "season-cooking", "Noa", "n");
  data = applyWaitlist(data, "repair-bike", "  Lina  ", "l");
  data = applyWaitlist(data, "repair-bike", "Sami", "s");
  const original = structuredClone(data);
  const next = applyCancellation(data, "a");
  assert.deepEqual(next.registrations.map(r => r.name), ["Omar", "Noa", "Lina"]);
  assert.deepEqual(next.waitlist.map(r => r.name), ["Sami"]);
  assert.equal(placesLeft(next, "repair-bike"), 0);
  assert.deepEqual(data, original);
  assert.deepEqual(applyCancellation(next, "a"), next);
});

test("l’ordre FIFO survit à la persistance et une annulation d’attente ne prend pas de place", () => {
  let data = applyRegistration(initialData(), "repair-bike", "Amina", "a");
  data = applyRegistration(data, "repair-bike", "Omar", "o");
  data = applyWaitlist(data, "repair-bike", "Lina", "l");
  data = applyWaitlist(data, "repair-bike", "Sami", "s");
  data = normalizeData(JSON.parse(JSON.stringify(data)));
  data = applyWaitlistCancellation(data, "l");
  assert.equal(placesLeft(data, "repair-bike"), 0);
  const next = applyCancellation(data, "o");
  assert.deepEqual(next.registrations.map(r => r.name), ["Amina", "Sami"]);
  assert.deepEqual(next.waitlist, []);
});

test("réessayer sur des données fraîches conserve la priorité de la personne concurrente", () => {
  let data = applyRegistration(initialData(), "repair-bike", "Amina", "a");
  data = applyRegistration(data, "repair-bike", "Omar", "o");
  const fresh = applyWaitlist(data, "repair-bike", "Concurrente", "remote");
  const retried = applyWaitlist(fresh, "repair-bike", "Locale", "local");
  const next = applyCancellation(retried, "a");
  assert.equal(next.registrations.at(-1).name, "Concurrente");
  assert.equal(next.waitlist[0].name, "Locale");
});

test("un format d’attente inconnu ne remplace aucune donnée existante", () => {
  const data = {...initialData(), waitlist: {unknown: "preserve"}};
  assert.throws(() => readDataPayload({version: 5, data}), /incompatible/);
  assert.deepEqual(data.waitlist, {unknown: "preserve"});
});
