//#region scripts/studio/public/i18n.js
var e = "devmethod:studio:language:v1", t = "devmethod-studio-language", n = "studio:language-change";
function r(e) {
	return e === "en" || e === "fr";
}
function i(n, i) {
	try {
		let e = n.cookie.split(";").map((e) => e.trim()).find((e) => e.startsWith(t + "="))?.slice(26);
		if (r(e)) return e;
	} catch {}
	try {
		let t = i.localStorage.getItem(e);
		if (r(t)) return t;
	} catch {}
}
function a(e = globalThis.document) {
	let t = e?.documentElement.lang;
	return r(t) ? t : "en";
}
function o(e = globalThis.document, t = globalThis.window) {
	return !e || !t ? "en" : (e.documentElement.hasAttribute("data-studio-language-ready") || (e.documentElement.lang = i(e, t) ?? "en", e.documentElement.setAttribute("data-studio-language-ready", "")), a(e));
}
function s(i, a = globalThis.document, o = globalThis.window) {
	if (!r(i)) throw TypeError("Unsupported Studio language");
	if (a && o) {
		a.documentElement.lang = i, a.documentElement.setAttribute("data-studio-language-ready", "");
		try {
			o.localStorage.setItem(e, i);
		} catch {}
		try {
			a.cookie = `${t}=${i}; Path=/; SameSite=Strict; Max-Age=31536000`;
		} catch {}
		o.dispatchEvent(new o.Event(n));
	}
}
var c = /* @__PURE__ */ new WeakMap();
function l(e, t = globalThis.window) {
	if (!t) return () => {};
	let o = c.get(t);
	if (!o) {
		let e = /* @__PURE__ */ new Set(), s = () => {
			for (let t of e) t();
		}, l = (e) => {
			e.key === "devmethod:studio:language:v1" && r(e.newValue) && (t.document.documentElement.lang = e.newValue, s());
		}, u = () => {
			let e = i(t.document, t);
			r(e) && e !== a(t.document) && (t.document.documentElement.lang = e, s());
		};
		o = {
			listeners: e,
			notify: s,
			storage: l,
			focus: u
		}, c.set(t, o), t.addEventListener(n, s), t.addEventListener("storage", l), t.addEventListener("focus", u);
	}
	return o.listeners.add(e), () => {
		o.listeners.delete(e), !o.listeners.size && (t.removeEventListener(n, o.notify), t.removeEventListener("storage", o.storage), t.removeEventListener("focus", o.focus), c.delete(t));
	};
}
function u(e, t, n = {}, r = a()) {
	return (r === "fr" ? e : t).replace(/\{([a-zA-Z][\w]*)\}/g, (e, t) => Object.hasOwn(n, t) ? String(n[t]) : e);
}
function d(e) {
	return (t, n, r) => u(t, n, r, a(e));
}
function f(e) {
	let t = a(e);
	for (let n of e.querySelectorAll("[data-i18n-fr][data-i18n-en]")) n.textContent = n.getAttribute("data-i18n-" + t);
	for (let n of [
		"title",
		"placeholder",
		"aria-label"
	]) for (let r of e.querySelectorAll(`[data-i18n-${n}-fr]`)) {
		let e = r.getAttribute(`data-i18n-${n}-${t}`);
		e !== null && r.setAttribute(n, e);
	}
}
function p(e, t) {
	o(e, t);
	let n = () => {
		f(e);
		for (let t of e.querySelectorAll("[data-studio-language]")) t.value = a(e);
		e.body.classList.contains("studio-home") && (e.title = u("DevMethod — Vos projets", "DevMethod — Your projects", {}, a(e)));
	}, i = (n) => {
		n.target?.matches("[data-studio-language]") && r(n.target.value) && s(n.target.value, e, t);
	};
	n();
	let c = l(n, t);
	return e.addEventListener("change", i), () => {
		c(), e.removeEventListener("change", i);
	};
}
var m = /* @__PURE__ */ new Map([
	["Vérification navigateur locale du candidat en cours ; aucun nouvel appel fournisseur.", "Local browser verification of the candidate in progress; no new provider call."],
	["Vérification navigateur suspendue ou indisponible ; candidat conservé sans réussite déduite.", "Browser verification suspended or unavailable; candidate preserved without assuming success."],
	["Disponibilité de Codex à vérifier.", "Codex availability needs checking."],
	["Codex CLI indisponible. Installez-le ou rendez-le accessible au processus Studio.", "Codex CLI unavailable. Install it or make it accessible to the Studio process."],
	["Accès Codex existant détecté. Les limites de cet accès restent applicables.", "Existing Codex access detected. Its limits still apply."],
	["Connexion Codex non établie. Connectez Codex dans votre terminal, puis vérifiez à nouveau.", "Codex connection not established. Connect Codex in your terminal, then check again."],
	["Le type d’accès Codex a changé. Une nouvelle activation explicite est nécessaire.", "The Codex access type changed. Explicit activation is required again."],
	["Prêt à traiter une demande locale.", "Ready to process a local request."],
	["Consommation inconnue : exécution automatique suspendue.", "Usage unknown: automatic execution suspended."],
	["Seuil de consommation atteint : aucun nouvel appel automatique.", "Usage threshold reached: no new automatic call."],
	["Nombre maximal de demandes atteint : aucun nouvel appel automatique.", "Maximum request count reached: no new automatic call."],
	["Construction locale en cours ; les résultats restent à vérifier.", "Local build in progress; results still need verification."],
	["Version appliquée après relecture des contrôles ; données et limites conservées.", "Version applied after reviewing checks; data and limits preserved."],
	["Échec technique constaté ; une correction bornée repart du candidat conservé.", "Technical failure observed; a bounded correction resumes from the preserved candidate."],
	["Résultat conservé ; consultez la décision de contrôle et les preuves dans Vérifications.", "Result preserved; review the control decision and evidence in Checks."],
	["Une action outil attend un accord, a échoué ou conserve un résultat inconnu ; aucun nouvel appel lancé.", "A tool action awaits approval, failed or has an unknown outcome; no new call started."],
	["La correction attend un nouveau contrôle favorable de son candidat et de ses preuves.", "Correction awaits a fresh favorable assessment of its candidate and evidence."],
	["Contrôle préalable indisponible ou illisible ; aucun nouvel appel lancé.", "Preflight control unavailable or unreadable; no new call started."],
	["Un candidat attend vérification ou décision ; les demandes suivantes restent conservées.", "A candidate awaits verification or a decision; subsequent requests are preserved."],
	["La demande en attente vise une ancienne révision. Annulez-la et soumettez-la à nouveau.", "The pending request targets an older revision. Cancel it and submit it again."]
]);
m.set("La demande liée au candidat reste suspendue par ses contrôles courants.", "The candidate-linked request remains suspended by its current controls.");
var h = new Map([...m].map(([e, t]) => [t, e]));
function g(e, t = a()) {
	return (t === "fr" ? h.get(e) : m.get(e)) ?? e;
}
//#endregion
export { s as a, g as c, p as i, a as n, l as o, o as r, u as s, d as t };
