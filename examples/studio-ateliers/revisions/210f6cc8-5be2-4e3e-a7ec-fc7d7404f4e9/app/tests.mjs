import assert from "node:assert/strict";
import test from "node:test";
import { applyCancellation, applyRegistration, initialData, normalizeData, readDataPayload, placesLeft } from "./lib.mjs";

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
