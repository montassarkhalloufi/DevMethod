import { CATEGORY_LABELS, applyCancellation, applyRegistration, applyWaitlist, applyWaitlistCancellation, initialData, readDataPayload, placesLeft } from "./lib.mjs";

const DRAFT_KEY = "les-ateliers:drafts:v1";
const dateFormatter = new Intl.DateTimeFormat("fr-FR", { weekday: "short", timeZone: "UTC" });
const state = { version: null, data: null, filter: "all", drafts: loadDrafts(), conflicts: new Set(), pending: new Map() };

const elements = {
  list: document.querySelector("#workshop-list"),
  status: document.querySelector("#status"),
  empty: document.querySelector("#empty-state"),
  registrations: document.querySelector("#registration-list"),
  count: document.querySelector("#registration-count"),
  template: document.querySelector("#workshop-template")
};

document.querySelectorAll(".filter").forEach(button => button.addEventListener("click", () => {
  state.filter = button.dataset.filter;
  document.querySelectorAll(".filter").forEach(item => {
    const selected = item === button;
    item.classList.toggle("active", selected);
    item.setAttribute("aria-pressed", String(selected));
  });
  render();
}));

function loadDrafts() {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY)) ?? {}; } catch { return {}; }
}

function saveDraft(workshopId, value) {
  state.drafts[workshopId] = value;
  persistDrafts();
}

function persistDrafts() {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(state.drafts)); } catch { /* Le brouillon reste au moins en mémoire pour cette session. */ }
}

async function requestData() {
  const response = await fetch("/api/data", { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Chargement impossible (${response.status}).`);
  const payload = await response.json();
  return readDataPayload(payload);
}

async function load({ initialize = true } = {}) {
  const remote = await requestData();
  state.version = remote.version;
  if (remote.data) {
    state.data = remote.data;
    render();
    return;
  }
  if (!initialize) throw new Error("Les données du programme sont indisponibles.");
  state.data = initialData();
  const result = await save(state.data);
  if (result === "conflict") await load({ initialize: false });
  else render();
}

async function save(nextData) {
  const response = await fetch("/api/data", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ version: state.version, data: nextData })
  });
  if (response.status === 409) return "conflict";
  if (!response.ok) throw new Error(`Enregistrement impossible (${response.status}).`);
  const payload = await response.json().catch(() => null);
  state.data = nextData;
  if (payload && Object.hasOwn(payload, "version")) state.version = payload.version;
  else {
    const fresh = await requestData();
    state.version = fresh.version;
    state.data = fresh.data ?? nextData;
  }
  return "saved";
}

async function register(workshopId) {
  const input = document.querySelector(`[data-id="${workshopId}"] .name-input`);
  const name = input?.value ?? state.drafts[workshopId] ?? "";
  saveDraft(workshopId, name);
  state.pending.set(workshopId, { type: "register", name });
  setBusy(workshopId, true);
  try {
    const waiting = placesLeft(state.data, workshopId) === 0;
    const nextData = waiting ? applyWaitlist(state.data, workshopId, name) : applyRegistration(state.data, workshopId, name);
    const result = await save(nextData);
    if (result === "conflict") {
      await handleConflict(workshopId);
      return;
    }
    state.pending.delete(workshopId);
    state.conflicts.delete(workshopId);
    delete state.drafts[workshopId];
    persistDrafts();
    announce(waiting ? `${name.trim()} est sur la liste d’attente, en position ${nextData.waitlist.filter(item => item.workshopId === workshopId).length}. La première personne prend automatiquement la prochaine place libérée ; aucun email envoyé.` : "Inscription enregistrée.");
    render();
  } catch (error) {
    showFormError(workshopId, error.message);
  } finally { setBusy(workshopId, false); }
}

async function handleConflict(workshopId) {
  state.conflicts.add(workshopId);
  try {
    const fresh = await requestData();
    state.version = fresh.version;
    state.data = fresh.data;
    announce("Le programme a changé. Votre saisie est conservée : vous pouvez réessayer.", true);
  } catch (error) {
    announce(`Conflit détecté, puis ${error.message.toLowerCase()} Votre saisie reste conservée.`, true);
  }
  render();
}

async function retry(workshopId) {
  const pending = state.pending.get(workshopId);
  if (!pending) return;
  if (pending.type === "register") await register(workshopId);
}

async function cancel(registrationId, waiting = false) {
  const button = document.querySelector(`[data-registration-id="${registrationId}"] .cancel-button`);
  if (button) button.disabled = true;
  try {
    const nextData = waiting ? applyWaitlistCancellation(state.data, registrationId) : applyCancellation(state.data, registrationId);
    const previousIds = new Set(state.data.registrations.map(item => item.id));
    const promoted = nextData.registrations.find(item => !previousIds.has(item.id));
    const result = await save(nextData);
    if (result === "conflict") {
      const fresh = await requestData();
      state.version = fresh.version;
      state.data = fresh.data;
      announce("Le programme a changé. Les données ont été rechargées sans perdre les autres inscriptions.", true);
      render();
      if ((waiting ? state.data.waitlist : state.data.registrations).some(item => item.id === registrationId)) showCancelRetry(registrationId, waiting);
      else announce("Cette inscription avait déjà été annulée dans la version rechargée.");
      return;
    } else announce(waiting ? "Nom retiré de la liste d’attente." : promoted ? `Inscription annulée. ${promoted.name}, première personne de la liste d’attente, prend la place libérée. Aucun email envoyé.` : "Inscription annulée. La place est à nouveau disponible.");
    render();
  } catch (error) {
    announce(error.message, true);
    if (button) button.disabled = false;
  }
}

function render() {
  if (!state.data) return;
  elements.list.replaceChildren();
  const workshops = state.data.workshops.filter(item => state.filter === "all" || item.category === state.filter);
  elements.empty.hidden = workshops.length !== 0;
  workshops.forEach(workshop => elements.list.append(renderWorkshop(workshop)));
  elements.list.setAttribute("aria-busy", "false");
  renderRegistrations();
}

function renderWorkshop(workshop) {
  const fragment = elements.template.content.cloneNode(true);
  const card = fragment.querySelector(".workshop-card");
  const date = new Date(`${workshop.date}T00:00:00Z`);
  const remaining = placesLeft(state.data, workshop.id);
  card.dataset.id = workshop.id;
  card.dataset.category = workshop.category;
  card.querySelector(".weekday").textContent = dateFormatter.format(date).replace(".", "");
  card.querySelector(".day").textContent = String(date.getUTCDate()).padStart(2, "0");
  card.querySelector(".category-pill").textContent = CATEGORY_LABELS[workshop.category] ?? workshop.category;
  card.querySelector(".workshop-title").textContent = workshop.title;
  card.querySelector(".time").textContent = workshop.time;
  card.querySelector(".location").textContent = workshop.location;
  const availability = card.querySelector(".availability");
  availability.textContent = remaining ? `${remaining} ${remaining === 1 ? "place disponible" : "places disponibles"}` : "Complet";
  availability.classList.toggle("full", remaining === 0);
  const openButton = card.querySelector(".open-form");
  if (remaining === 0) openButton.textContent = "Liste d’attente →";
  const waitingCount = state.data.waitlist.filter(item => item.workshopId === workshop.id).length;
  const waitingNote = card.querySelector(".waitlist-note");
  waitingNote.hidden = remaining > 0 && waitingCount === 0;
  waitingNote.textContent = `${waitingCount ? waitingCount + (waitingCount === 1 ? " personne en attente. " : " personnes en attente. ") : ""}La première personne prend la prochaine place libérée, sans email.`;
  const form = card.querySelector("form");
  const input = card.querySelector("input");
  card.querySelector(".submit-booking").textContent = remaining === 0 ? "Rejoindre la liste" : "Confirmer";
  input.value = state.drafts[workshop.id] ?? "";
  input.addEventListener("input", () => saveDraft(workshop.id, input.value));
  openButton.addEventListener("click", () => { form.hidden = false; openButton.hidden = true; input.focus(); });
  card.querySelector(".close-form").addEventListener("click", () => { form.hidden = true; openButton.hidden = false; });
  form.addEventListener("submit", event => { event.preventDefault(); register(workshop.id); });
  const conflict = card.querySelector(".conflict-box");
  conflict.hidden = !state.conflicts.has(workshop.id);
  conflict.querySelector("button").addEventListener("click", () => retry(workshop.id));
  if (state.conflicts.has(workshop.id) || input.value) { form.hidden = false; openButton.hidden = true; }
  return fragment;
}

function renderRegistrations() {
  elements.registrations.replaceChildren();
  const registrations = state.data.registrations;
  elements.count.hidden = registrations.length === 0;
  elements.count.textContent = registrations.length;
  if (!registrations.length) {
    const empty = document.createElement("p");
    empty.textContent = "Aucune inscription pour le moment.";
    elements.registrations.append(empty);
  }
  registrations.forEach(registration => appendRegistration(registration));
  if (state.data.waitlist.length) {
    const heading = document.createElement("h3");
    heading.textContent = "Liste d’attente";
    elements.registrations.append(heading);
    state.data.waitlist.forEach(entry => appendRegistration(entry, true));
  }
}

function appendRegistration(registration, waiting = false) {
    const workshop = state.data.workshops.find(item => item.id === registration.workshopId);
    if (!workshop) return;
    const item = document.createElement("article");
    item.className = "registration-item";
    item.dataset.registrationId = registration.id;
    const details = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = `${registration.name} — ${workshop.title}`;
    const meta = document.createElement("span");
    const position = waiting ? state.data.waitlist.filter(item => item.workshopId === registration.workshopId).findIndex(item => item.id === registration.id) + 1 : null;
    meta.textContent = `${waiting ? `En attente · position ${position} — ` : ""}${workshop.time}, ${workshop.location}`;
    details.append(title, meta);
    const button = document.createElement("button");
    button.className = "cancel-button";
    button.type = "button";
    button.textContent = waiting ? "Quitter la liste" : "Annuler";
    button.addEventListener("click", () => cancel(registration.id, waiting));
    item.append(details, button);
    elements.registrations.append(item);
}

function announce(message, isError = false) {
  elements.status.textContent = message;
  elements.status.classList.toggle("error", isError);
}

function showCancelRetry(registrationId, waiting = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "retry-button status-retry";
  button.textContent = "Réessayer l’annulation";
  button.addEventListener("click", () => cancel(registrationId, waiting));
  elements.status.append(" ", button);
}

function showFormError(workshopId, message) {
  const target = document.querySelector(`[data-id="${workshopId}"] .form-error`);
  if (target) target.textContent = message;
  announce(message, true);
}

function setBusy(workshopId, busy) {
  const button = document.querySelector(`[data-id="${workshopId}"] .submit-booking`);
  if (!button) return;
  button.disabled = busy;
  button.textContent = busy ? "Enregistrement…" : placesLeft(state.data, workshopId) === 0 ? "Rejoindre la liste" : "Confirmer";
}

load().then(() => announce("")).catch(error => {
  elements.list.setAttribute("aria-busy", "false");
  announce(`${error.message} Actualisez la page pour réessayer.`, true);
});
