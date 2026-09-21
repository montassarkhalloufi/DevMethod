import { i as e, n as t, r as n, t as r } from "./jsx-runtime-DZd2gj5L.js";
import { a as i, i as a, n as o, r as s, s as c } from "./i18n-CRhBcIYq.js";
import { t as l } from "./error-messages-CtvOKk7F.js";
import { a as u, n as d, o as f, r as p, t as m, u as h } from "./ConnectorGuide-IMh4AumH.js";
import { c as g, i as _, n as v, r as y, s as b } from "./useMcpSelection-CKOOWESs.js";
import "./mcp-MPHsJQgm.js";
//#region studio-ui/src/LanguageSelector.tsx
var x = t(), S = r();
function C() {
	let { locale: e, t } = n();
	return /* @__PURE__ */ (0, S.jsxs)("label", {
		className: "studio-language",
		children: [/* @__PURE__ */ (0, S.jsx)("span", {
			className: "sr-only",
			children: t("Langue du Studio", "Studio language")
		}), /* @__PURE__ */ (0, S.jsxs)("select", {
			value: e,
			name: "studio-language",
			title: t("Langue du Studio", "Studio language"),
			onChange: (e) => i(e.target.value),
			children: [/* @__PURE__ */ (0, S.jsx)("option", {
				value: "en",
				lang: "en",
				children: "English"
			}), /* @__PURE__ */ (0, S.jsx)("option", {
				value: "fr",
				lang: "fr",
				children: "Français"
			})]
		})]
	});
}
//#endregion
//#region studio-ui/src/features/home/model/home.ts
var w = e();
function T(e = "en") {
	return {
		new: c("Nouveau projet", "New project", void 0, e),
		imported: c("Sources importées", "Imported sources", void 0, e),
		existing: c("Projet Studio", "Studio project", void 0, e)
	};
}
function E(e, t = "en") {
	let n = e;
	if (!n || ![
		"new",
		"imported",
		"existing"
	].includes(n.kind || "") || ![
		n.id,
		n.name,
		n.workspace,
		n.createdAt
	].every((e) => typeof e == "string" && e.length > 0) || n.lastOpenedAt !== null && typeof n.lastOpenedAt != "string") throw Error(c("La réponse du projet est illisible. Actualisez pour vérifier son état.", "The project response could not be read. Refresh to check its state.", void 0, t));
	return n;
}
function D(e, t) {
	let n = new FormData(t), r = (e) => String(n.get(e) || "").trim();
	return e === "new" ? {
		kind: e,
		name: r("name"),
		idea: r("idea")
	} : e === "existing" ? {
		kind: e,
		workspace: r("workspace")
	} : {
		kind: e,
		...r("name") ? { name: r("name") } : {},
		source: r("source")
	};
}
function O(e) {
	return e.startsWith("/") || /^[a-z]:[\\/]/i.test(e);
}
function k(e, t = "en") {
	let n = e.kind === "existing" ? "workspace" : "source", r = e[n];
	return r !== void 0 && !O(r) ? {
		field: n,
		message: c("Indiquez un chemin absolu, par exemple /Users/vous/mon-projet.", "Enter an absolute path, for example /Users/you/my-project.", void 0, t)
	} : e.kind === "new" && !e.name ? {
		field: "name",
		message: c("Donnez un nom au projet.", "Give the project a name.", void 0, t)
	} : e.kind === "new" && !e.idea ? {
		field: "idea",
		message: c("Décrivez ce que vous voulez faire avancer.", "Describe what you want to work on.", void 0, t)
	} : null;
}
function A(e, t, n = "en") {
	return t.phase === "opening" ? c("Ouverture…", "Opening…", void 0, n) : t.phase === "creating" ? e === "imported" ? c("Importation…", "Importing…", void 0, n) : c("Préparation…", "Preparing…", void 0, n) : t.project ? c("Réessayer l’ouverture", "Retry opening", void 0, n) : {
		new: c("Créer et ouvrir", "Create and open", void 0, n),
		imported: c("Importer et ouvrir", "Import and open", void 0, n),
		existing: c("Reprendre ce projet", "Resume this project", void 0, n)
	}[e];
}
function j(e, t) {
	let n = (e) => e.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
	return n(`${e.name} ${e.workspace}`).includes(n(t.trim()));
}
function M(e) {
	return [...e].sort((e, t) => Date.parse(t.lastOpenedAt || t.createdAt) - Date.parse(e.lastOpenedAt || e.createdAt));
}
function N(e, t = "en") {
	let n = new Date(e.lastOpenedAt || e.createdAt);
	return Number.isNaN(n.getTime()) ? c("Date non disponible", "Date unavailable", void 0, t) : new Intl.DateTimeFormat(t, { dateStyle: "medium" }).format(n);
}
function P(e, t, n = "en") {
	if (typeof e != "string") throw Error(c("L’adresse locale du projet est absente.", "The project’s local address is missing.", void 0, n));
	let r = new URL(e);
	if (r.protocol !== "http:" || ![
		"localhost",
		"127.0.0.1",
		"[::1]"
	].includes(r.hostname) || !r.port || r.username || r.password || r.pathname !== "/") throw Error(c("L’adresse renvoyée ne correspond pas à une session Studio locale.", "The returned address is not a local Studio session.", void 0, n));
	return (t === "new" || t === "imported") && (r.hash = "journey-foundation"), r.href;
}
//#endregion
//#region studio-ui/src/features/home/hooks/useHome.ts
async function F(e, t, n, r = "en") {
	let i = await fetch("/api/home" + e, {
		...n === void 0 ? { cache: "no-store" } : {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(n)
		},
		credentials: "same-origin",
		signal: AbortSignal.any([t, AbortSignal.timeout(6e4)])
	}), a = await i.json();
	if (!i.ok) throw Error(a.error || c("Le service local ne répond pas. Réessayez dans un instant.", "The local service is not responding. Try again shortly.", void 0, r));
	return a;
}
var I = (e) => e instanceof Error ? e.message : c("Action non confirmée. Vous pouvez réessayer.", "Action not confirmed. You can try again.", void 0, o());
function L({ navigate: e }) {
	let { locale: t, t: r } = n(), [i, a] = (0, w.useState)([]), [s, u] = (0, w.useState)(!0), [d, f] = (0, w.useState)(""), [p, m] = (0, w.useState)({
		phase: "idle",
		project: null,
		error: ""
	}), h = (0, w.useRef)(null), g = (0, w.useRef)(null), _ = (0, w.useRef)(/* @__PURE__ */ new Map()), v = (0, w.useCallback)(async () => {
		h.current?.abort();
		let e = new AbortController();
		h.current = e, u(!0), f("");
		try {
			let t = await F("", e.signal, void 0, o());
			if (e.signal.aborted) return;
			if (!Array.isArray(t.projects)) throw Error(c("La liste des projets est illisible.", "The project list could not be read.", void 0, o()));
			a(M(t.projects.map((e) => E(e, o()))));
		} catch (t) {
			e.signal.aborted || f(I(t));
		} finally {
			e.signal.aborted || u(!1);
		}
	}, []);
	(0, w.useEffect)(() => (v(), () => {
		h.current?.abort(), g.current?.abort();
	}), [v]);
	function y(e) {
		h.current?.abort(), u(!1), a((t) => M([e, ...t.filter((t) => t.id !== e.id)]));
	}
	async function b(n, i, a) {
		m({
			phase: "opening",
			project: n,
			error: ""
		});
		let o = await F("/open", i.signal, { id: n.id }, t);
		if (i.signal.aborted) return;
		let s = E(o.project, t);
		if (s.id !== n.id) throw Error(r("La session renvoyée appartient à un autre projet.", "The returned session belongs to another project."));
		let c = P(o.url, a ? n.kind : void 0, t);
		return y(s), e ? e(c) : window.location.assign(c), !0;
	}
	async function x(e, n) {
		let r = JSON.stringify(e), i = _.current.get(r);
		if (i || (i = { requestId: crypto.randomUUID() }, _.current.set(r, i)), i.project) return i.project;
		let a = await F("/projects", n.signal, {
			requestId: i.requestId,
			...e
		}, t);
		if (n.signal.aborted) return null;
		let o = E(a.project, t);
		return i.project = o, y(o), o;
	}
	async function S(e, t) {
		if (g.current) return !1;
		let n = new AbortController();
		g.current = n;
		let r = "id" in e ? e : null, i = !1;
		m({
			phase: r ? "opening" : "creating",
			project: r,
			error: ""
		});
		try {
			"id" in e || (r = await x(e, n), r && t?.()), r && (i = !!await b(r, n, !("id" in e)));
		} catch (e) {
			n.signal.aborted || m({
				phase: "idle",
				project: r,
				error: I(e)
			});
		} finally {
			n.signal.aborted || (g.current = null, i || m((e) => ({
				...e,
				phase: "idle"
			})));
		}
		return i;
	}
	function C() {
		g.current || m({
			phase: "idle",
			project: null,
			error: ""
		});
	}
	return {
		projects: i,
		loading: s,
		loadError: l(d, t),
		operation: {
			...p,
			error: l(p.error, t)
		},
		refresh: v,
		run: S,
		clearOperation: C
	};
}
//#endregion
//#region studio-ui/src/features/home/hooks/useComposerGuides.ts
var R = (e, t) => f(e) === f(t);
function ee({ busy: e, selected: t, onApply: r, onEdit: i }) {
	let { locale: a } = n(), [o, s] = (0, w.useState)(!1), c = u({ enabled: o }), l = d({ enabled: o }), f = p(), [m, h] = (0, w.useState)(null), [g, _] = (0, w.useState)({}), v = c.guides.find((e) => e.optionId === m) ?? null, y = {
		...Object.fromEntries(Object.values(l.drafts).filter((e) => e.input !== null).map((e) => [e.optionId, {
			input: e.input,
			preparation: null
		}])),
		...g
	}, b = m ? y[m] : void 0, x = f.preparation && R(f.preparation.input, b?.input) ? f.preparation : b?.locale === a ? b.preparation : null;
	function S(t) {
		e || (s(!0), f.reset(), h(t));
	}
	function C(t) {
		e || (f.reset(), _((e) => ({
			...e,
			[t.optionId]: {
				input: t,
				preparation: null
			}
		})), l.edit(t.optionId, t, l.drafts[t.optionId]?.step ?? 0), i());
	}
	async function T(t) {
		if (e) return;
		_((e) => ({
			...e,
			[t.optionId]: {
				input: t,
				preparation: null
			}
		}));
		let n = await f.prepare(t);
		n && _((e) => R(e[t.optionId]?.input, t) ? {
			...e,
			[t.optionId]: {
				input: n.input,
				preparation: n,
				locale: a
			}
		} : e);
	}
	function E(t) {
		if (e || x !== t) return;
		let n = v?.flows.find((e) => e.id === t.input.flowId);
		n && r(t, n.usage !== "assistant") && h(null);
	}
	function D(e) {
		f.reset(), l.clear(e), _((t) => {
			let n = { ...t };
			return delete n[e], n;
		});
	}
	return {
		...c,
		activeId: m,
		definition: v,
		input: b?.input ?? null,
		preparation: x,
		preparationFor: (e) => g[e]?.preparation ?? null,
		preparing: f.loading,
		preparationError: f.error,
		persistence: l,
		step: m ? l.drafts[m]?.step : void 0,
		setStep: (e) => {
			m && l.edit(m, b?.input ?? null, e);
		},
		hasPendingDraft: Object.values(y).some(({ input: e }) => !R(e, t.find((t) => t.optionId === e.optionId))),
		hasPendingSelection: t.some((e) => {
			let t = y[e.optionId];
			return t && !R(e, t.input);
		}),
		open: S,
		load: () => s(!0),
		change: C,
		prepare: T,
		apply: E,
		forget: D,
		back: () => {
			f.reset(), h(null);
		}
	};
}
//#endregion
//#region studio-ui/src/features/home/model/composer.ts
var z = {
	idea: 16e3,
	design: 2e3,
	connectors: 12,
	attachments: 4,
	attachmentBytes: 2097152,
	links: 5
};
function B(e = "en") {
	return [
		{
			id: "website",
			label: c("Site web", "Website", void 0, e),
			idea: c("Créer un site pour présenter mon activité, expliquer mon offre et permettre aux visiteurs de me contacter.", "Create a website to present my business, explain my offer, and let visitors contact me.", void 0, e)
		},
		{
			id: "app",
			label: c("Application", "App", void 0, e),
			idea: c("Créer une application web pour organiser des informations, les retrouver rapidement et suivre les actions importantes.", "Create a web app to organize information, find it quickly, and track important actions.", void 0, e)
		},
		{
			id: "prototype",
			label: "Prototype",
			idea: c("Créer un prototype interactif pour tester un parcours clé et recueillir des retours avant de développer la version complète.", "Create an interactive prototype to test a key journey and gather feedback before developing the full version.", void 0, e)
		},
		{
			id: "slides",
			label: c("Présentation web", "Web presentation", void 0, e),
			idea: c("Créer une présentation web claire pour exposer un sujet, ses points essentiels et la prochaine étape attendue.", "Create a clear web presentation to explain a topic, its key points, and the expected next step.", void 0, e)
		}
	];
}
function V(e = "en") {
	return [
		{
			title: c("Sobre et précis", "Clean and precise", void 0, e),
			description: c("Une composition épurée, une typographie lisible et des accents mesurés.", "A clean composition, readable typography, and restrained accents.", void 0, e)
		},
		{
			title: c("Éditorial", "Editorial", void 0, e),
			description: c("Une hiérarchie typographique affirmée, de grandes images et un rythme de lecture soigné.", "A clear typographic hierarchy, large images, and a considered reading rhythm.", void 0, e)
		},
		{
			title: c("Chaleureux", "Warm", void 0, e),
			description: c("Des couleurs douces, des formes accueillantes et des espaces généreux.", "Soft colors, inviting shapes, and generous spacing.", void 0, e)
		},
		{
			title: c("Audacieux", "Bold", void 0, e),
			description: c("Des contrastes marqués, des titres expressifs et une identité graphique assumée.", "Strong contrasts, expressive headings, and a distinctive visual identity.", void 0, e)
		}
	];
}
function te() {
	return {
		name: "",
		idea: "",
		action: "build",
		projectType: "website",
		design: "",
		connectors: [],
		connectorGuides: [],
		mcpConnectionIds: [],
		links: [],
		attachments: []
	};
}
function ne(e) {
	return !!(e.idea.trim() || e.name.trim() || e.design.trim() || e.connectors.length || e.connectorGuides.length || e.mcpConnectionIds.length || e.links.length || e.attachments.length);
}
function re(e, t, n = "en") {
	return t ? c("Lecture des références…", "Reading references…", void 0, n) : e.phase === "opening" ? c("Ouverture du projet…", "Opening project…", void 0, n) : e.phase === "creating" ? c("Préparation du projet…", "Preparing project…", void 0, n) : e.project ? c("Réessayer l’ouverture", "Retry opening", void 0, n) : c("Démarrer le projet", "Start project", void 0, n);
}
function ie(e, t, n = "en") {
	let r = e.idea.trim() ? `${e.idea}\n\n${t.idea}` : t.idea;
	return r.length > z.idea ? {
		draft: e,
		error: c("Cette inspiration dépasse la place disponible. Raccourcissez votre demande avant de l’ajouter.", "This inspiration exceeds the available space. Shorten your request before adding it.", void 0, n)
	} : {
		draft: {
			...e,
			idea: r,
			projectType: t.projectType,
			design: t.design ?? e.design
		},
		error: ""
	};
}
function ae(e, t = "en") {
	let n;
	try {
		n = new URL(e.trim());
	} catch {
		throw Error(c("Ajoutez une adresse complète, par exemple https://exemple.fr.", "Add a complete address, for example https://example.com.", void 0, t));
	}
	if (!["http:", "https:"].includes(n.protocol) || n.username || n.password || e.includes("\\")) throw Error(c("Utilisez un lien HTTP ou HTTPS sans identifiant ni mot de passe.", "Use an HTTP or HTTPS link without a username or password.", void 0, t));
	if (n.href.length > 2e3) throw Error(c("Ce lien dépasse 2 000 caractères.", "This link exceeds 2,000 characters.", void 0, t));
	return n.href;
}
function H(e, t = "en") {
	let n = e.name.toLowerCase().split(".").at(-1), r = n === "md" ? "text/markdown" : e.type || (n === "txt" ? "text/plain" : "");
	if (![
		"image/png",
		"image/jpeg",
		"image/webp",
		"text/plain",
		"text/markdown"
	].includes(r)) throw Error(c("Choisissez une image PNG, JPEG ou WebP, ou un fichier .txt ou .md.", "Choose a PNG, JPEG, or WebP image, or a .txt or .md file.", void 0, t));
	if (!e.size || e.size > z.attachmentBytes) throw Error(c("« {name} » doit contenir entre 1 octet et 2 Mio.", "“{name}” must contain between 1 byte and 2 MiB.", { name: e.name }, t));
	if (!e.name.trim() || e.name.length > 256 || /[<>:"/\\|?*\p{Cc}]/u.test(e.name)) throw Error(c("Utilisez un nom de fichier simple, sans chemin ni caractères spéciaux (256 caractères maximum).", "Use a simple file name without a path or special characters (up to 256 characters).", void 0, t));
	return r;
}
function oe(e, t = "en") {
	if (!e.idea.trim()) throw Error(c("Décrivez votre idée pour démarrer le projet.", "Describe your idea to start the project.", void 0, t));
	if (e.idea.length > z.idea) throw Error(c("Votre demande dépasse 16 000 caractères. Raccourcissez-la avant de démarrer.", "Your request exceeds 16,000 characters. Shorten it before starting.", void 0, t));
	return {
		kind: "new",
		...e.name.trim() ? { name: e.name.trim() } : {},
		idea: e.idea.trim(),
		launch: {
			action: e.action,
			projectType: e.projectType,
			design: e.design.trim(),
			connectors: [...e.connectors],
			...e.connectorGuides.length ? { connectorGuides: structuredClone(e.connectorGuides) } : {},
			mcpConnectionIds: [...e.mcpConnectionIds],
			links: [...e.links],
			attachments: [...e.attachments]
		}
	};
}
function se(e, t = "en") {
	let n = e;
	if (!n || !Array.isArray(n.options) || !Array.isArray(n.capabilities)) throw Error(c("Le catalogue est illisible. Réessayez son chargement.", "The catalog could not be read. Try loading it again.", void 0, t));
	return {
		options: n.options.map((e) => {
			if (!e || ![
				e.id,
				e.title,
				e.description
			].every((e) => typeof e == "string") || !Array.isArray(e.capabilities) || e.capabilities.some((e) => typeof e != "string")) throw Error(c("Une option du catalogue est illisible.", "A catalog option could not be read.", void 0, t));
			return e;
		}),
		capabilities: n.capabilities.map((e) => {
			if (!e || typeof e.id != "string" || typeof e.title != "string") throw Error(c("Une catégorie du catalogue est illisible.", "A catalog category could not be read.", void 0, t));
			return e;
		})
	};
}
function U(e, t) {
	let n = (e) => e.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
	return n(`${e.title} ${e.description}`).includes(n(t.trim()));
}
//#endregion
//#region studio-ui/src/features/home/hooks/useIdeaComposer.ts
function ce(e, t, n = "en") {
	let r = H(e, n);
	return new Promise((i, a) => {
		let o = new FileReader(), s = () => o.abort(), l = () => t.removeEventListener("abort", s);
		o.onload = () => {
			l();
			let t = String(o.result || "").split(",")[1];
			t ? i({
				name: e.name,
				mime: r,
				base64: t
			}) : a(Error(c("Impossible de lire « {name} ». Réessayez.", "Unable to read “{name}”. Try again.", { name: e.name }, n)));
		}, o.onerror = () => {
			l(), a(Error(c("Impossible de lire « {name} ». Réessayez.", "Unable to read “{name}”. Try again.", { name: e.name }, n)));
		}, o.onabort = () => {
			l(), a(Error(c("Lecture des fichiers interrompue.", "File reading interrupted.", void 0, n)));
		}, t.addEventListener("abort", s, { once: !0 }), o.readAsDataURL(e), t.aborted && o.abort();
	});
}
function W({ operation: e, onSubmit: t, onEdit: r, seed: i }) {
	let { locale: a, t: o } = n(), [s, c] = (0, w.useState)({
		draft: te(),
		seedId: null,
		seedError: ""
	}), [u, d] = (0, w.useState)(""), [f, p] = (0, w.useState)(!1), [m, h] = (0, w.useState)(null), [_, v] = (0, w.useState)(!1), [y, b] = (0, w.useState)(""), [x, S] = (0, w.useState)(null), C = (0, w.useRef)(null), T = (0, w.useRef)(!1), E = (0, w.useRef)(null), D = (0, w.useRef)(null), O = (0, w.useRef)(a), k = (0, w.useRef)(!1), A = (0, w.useRef)(null), j = g((e) => X(e, !0), (e) => X(e, !1)), M = f || e.phase !== "idle", N = ee({
		busy: M,
		selected: s.draft.connectorGuides,
		onApply: J,
		onEdit: r
	}), P = (0, w.useEffectEvent)(r), F = f || N.hasPendingDraft || ne(s.draft) && s.draft !== x, I = (0, w.useEffectEvent)((e) => {
		T.current || (E.current || N.hasPendingDraft || ne(s.draft) && s.draft !== C.current) && (e.preventDefault(), e.returnValue = "");
	});
	if ((0, w.useEffect)(() => {
		let e = (e) => I(e);
		return window.addEventListener("beforeunload", e), () => window.removeEventListener("beforeunload", e);
	}, []), i && i.id !== s.seedId && !M) {
		let e = ie(s.draft, i, a);
		c({
			draft: e.draft,
			seedId: i.id,
			seedError: e.error
		}), d("");
	}
	(0, w.useEffect)(() => {
		s.seedId !== null && (P(), A.current?.focus(), A.current?.scrollIntoView?.({ block: "center" }));
	}, [s.seedId]), (0, w.useEffect)(() => () => {
		let e = E.current;
		E.current = null, e?.abort(), D.current?.abort();
	}, []);
	function L(t) {
		E.current || e.phase !== "idle" || (T.current = !1, c((e) => ({
			...e,
			draft: t(e.draft),
			seedError: ""
		})), d(""), r());
	}
	function R(e, t) {
		L((n) => ({
			...n,
			[e]: t
		}));
	}
	function V(e) {
		L((t) => ({
			...t,
			projectType: e,
			idea: t.idea.trim() ? t.idea : B(a).find((t) => t.id === e)?.idea || ""
		})), A.current?.focus();
	}
	function re(e) {
		if (M || E.current) return !1;
		try {
			let t = ae(e, a);
			if (s.draft.links.includes(t)) throw Error(o("Cette référence est déjà ajoutée.", "This reference has already been added."));
			if (s.draft.links.length >= z.links) throw Error(o("Vous pouvez ajouter au maximum 5 liens.", "You can add up to 5 links."));
			return L((e) => ({
				...e,
				links: [...e.links, t]
			})), !0;
		} catch (e) {
			return d(e instanceof Error ? e.message : o("Lien invalide.", "Invalid link.")), !1;
		}
	}
	async function U(t) {
		if (!t.length || E.current || e.phase !== "idle") return;
		let n = new AbortController();
		try {
			if (s.draft.attachments.length + t.length > z.attachments) throw Error(o("Vous pouvez joindre au maximum 4 fichiers.", "You can attach up to 4 files."));
			t.forEach((e) => H(e, a)), E.current = n, p(!0), d("");
			let e = await Promise.all(t.map((e) => ce(e, n.signal, a)));
			if (n.signal.aborted) return;
			c((t) => ({
				...t,
				draft: {
					...t.draft,
					attachments: [...t.draft.attachments, ...e]
				},
				seedError: ""
			})), r();
		} catch (e) {
			n.signal.aborted || d(e instanceof Error ? e.message : o("Lecture des fichiers impossible.", "The files could not be read.")), n.abort();
		} finally {
			E.current === n && (E.current = null, p(!1));
		}
	}
	async function W() {
		D.current?.abort();
		let e = new AbortController();
		D.current = e, v(!0), b("");
		try {
			let t = await fetch("/api/home/catalog?language=" + a, {
				cache: "no-store",
				credentials: "same-origin",
				signal: AbortSignal.any([e.signal, AbortSignal.timeout(15e3)])
			}), n = await t.json();
			if (e.signal.aborted) return;
			if (!t.ok) throw Error(o("Le catalogue est indisponible. Réessayez dans un instant.", "The catalog is unavailable. Try again shortly."));
			h(se(n, a));
		} catch (t) {
			e.signal.aborted || b(t instanceof Error ? t.message : o("Chargement impossible.", "Unable to load."));
		} finally {
			e.signal.aborted || v(!1);
		}
	}
	let G = (0, w.useEffectEvent)(() => {
		D.current && W();
	});
	(0, w.useEffect)(() => {
		O.current !== a && (O.current = a, G());
	}, [a]);
	function K() {
		if (!(M || E.current || k.current)) try {
			if (N.hasPendingSelection) throw Error(o("Validez puis ajoutez à nouveau le guide modifié, ou retirez-le de votre demande.", "Validate and add the updated guide again, or remove it from your request."));
			if (s.draft.mcpConnectionIds.some((e) => !j.connections.some((t) => t.id === e && t.status === "connected"))) throw Error(o("Reconnectez les serveurs MCP sélectionnés ou retirez-les de ce projet.", "Reconnect the selected MCP servers or remove them from this project."));
			let e = oe(s.draft, a);
			k.current = !0, d("");
			let n = s.draft;
			t(e, () => {
				C.current = n, S(n);
			}), queueMicrotask(() => {
				k.current = !1;
			});
		} catch (e) {
			k.current = !1, d(e instanceof Error ? e.message : o("Complétez votre demande.", "Complete your request.")), A.current?.focus();
		}
	}
	function q(e) {
		if (M || E.current) return;
		let t = s.draft.connectors.includes(e);
		if (!t && s.draft.connectors.length >= z.connectors) {
			d(o("Vous pouvez proposer au maximum 12 outils ou services.", "You can suggest up to 12 tools or services."));
			return;
		}
		L((n) => ({
			...n,
			connectorGuides: t ? n.connectorGuides.filter((t) => t.optionId !== e) : n.connectorGuides,
			connectors: t ? n.connectors.filter((t) => t !== e) : [...n.connectors, e]
		})), t && N.forget(e);
	}
	function J(e, t) {
		if (M || E.current) return !1;
		let n = e.input.optionId;
		return !s.draft.connectorGuides.some((e) => e.optionId === n) && s.draft.connectorGuides.length >= 12 || t && !s.draft.connectors.includes(n) && s.draft.connectors.length >= z.connectors ? (d(o("Vous pouvez préparer au maximum 12 outils ou services.", "You can prepare up to 12 tools or services.")), !1) : (L((r) => ({
			...r,
			connectorGuides: [...r.connectorGuides.filter((e) => e.optionId !== n), structuredClone(e.input)],
			connectors: t && !r.connectors.includes(n) ? [...r.connectors, n] : r.connectors
		})), !0);
	}
	function Y(e) {
		M || E.current || (L((t) => ({
			...t,
			connectorGuides: t.connectorGuides.filter((t) => t.optionId !== e),
			connectors: t.connectors.filter((t) => t !== e)
		})), N.forget(e));
	}
	function X(e, t) {
		if (!(t && s.draft.mcpConnectionIds.includes(e))) {
			if (t && s.draft.mcpConnectionIds.length >= 12) {
				d(o("Vous pouvez utiliser au maximum 12 serveurs MCP pour ce projet.", "You can use up to 12 MCP servers for this project."));
				return;
			}
			L((n) => ({
				...n,
				mcpConnectionIds: t ? [...n.mcpConnectionIds, e] : n.mcpConnectionIds.filter((t) => t !== e)
			}));
		}
	}
	return {
		mcp: j,
		linearAccessWarning: s.draft.connectorGuides.some((e) => e.flowId === "linear-read") && j.connections.some((e) => e.provider === "linear" && e.url === "https://mcp.linear.app/mcp" && e.status === "connected" && s.draft.mcpConnectionIds.includes(e.id)),
		guides: N,
		removeGuide: Y,
		toggleMcp: (e) => X(e, !s.draft.mcpConnectionIds.includes(e)),
		hasUnsavedContent: F,
		approveDeparture: () => {
			T.current = !0;
		},
		cancelDeparture: () => {
			T.current = !1;
		},
		draft: s.draft,
		error: l(u || s.seedError, a),
		busy: M,
		reading: f,
		textarea: A,
		catalog: m,
		catalogLoading: _,
		catalogError: l(y, a),
		loadCatalog: W,
		submit: K,
		setField: R,
		selectType: V,
		addLink: re,
		addFiles: U,
		removeLink: (e) => L((t) => ({
			...t,
			links: t.links.filter((t, n) => n !== e)
		})),
		removeAttachment: (e) => L((t) => ({
			...t,
			attachments: t.attachments.filter((t, n) => n !== e)
		})),
		toggleConnector: q
	};
}
//#endregion
//#region studio-ui/src/features/home/components/HomeIcon.tsx
function G({ kind: e }) {
	return /* @__PURE__ */ (0, S.jsx)("svg", {
		width: "24",
		height: "24",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "1.6",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, S.jsx)("path", { d: {
			new: "M12 5v14M5 12h14",
			imported: "M12 3v12m-4-4 4 4 4-4M4 15v6h16v-6",
			existing: "M3 10a9 9 0 1 1 2 8M3 4v6h6M12 7v5l3 2",
			folder: "M3 7h18v13H3zM3 7V4h6l2 3"
		}[e] })
	});
}
//#endregion
//#region studio-ui/src/features/home/components/ProjectFormFields.tsx
function K({ kind: e, values: t, validation: r, onEdit: i }) {
	let { t: a } = n(), o = e === "existing" ? "workspace" : "source";
	function s(e) {
		let t = r?.field === e;
		return {
			"aria-invalid": t || void 0,
			"aria-describedby": t ? "home-form-error" : void 0
		};
	}
	return /* @__PURE__ */ (0, S.jsxs)(S.Fragment, { children: [e === "existing" ? null : /* @__PURE__ */ (0, S.jsxs)("label", { children: [/* @__PURE__ */ (0, S.jsxs)("span", {
		className: "home-field-label",
		children: [
			" ",
			a("Nom du projet", "Project name"),
			" ",
			e === "imported" ? /* @__PURE__ */ (0, S.jsx)("small", { children: a("· facultatif", "· optional") }) : null
		]
	}), /* @__PURE__ */ (0, S.jsx)("input", {
		name: "name",
		autoComplete: "off",
		required: e === "new",
		maxLength: 200,
		value: t.name,
		onChange: (e) => i("name", e.target.value),
		placeholder: a("Par exemple, Mon carnet de lectures…", "For example, My reading notebook…"),
		...s("name")
	})] }), e === "new" ? /* @__PURE__ */ (0, S.jsxs)("label", { children: [
		" ",
		a("Que souhaitez-vous créer ?", "What would you like to create?"),
		" ",
		/* @__PURE__ */ (0, S.jsx)("textarea", {
			name: "idea",
			autoComplete: "off",
			required: !0,
			maxLength: 2e4,
			rows: 4,
			value: t.idea,
			onChange: (e) => i("idea", e.target.value),
			placeholder: a("Une application pour…", "An app to…"),
			...s("idea")
		})
	] }) : /* @__PURE__ */ (0, S.jsxs)("label", { children: [
		e === "existing" ? a("Dossier du projet Studio", "Studio project folder") : a("Dossier des sources", "Source folder"),
		/* @__PURE__ */ (0, S.jsx)("input", {
			name: o,
			autoComplete: "off",
			autoCapitalize: "off",
			spellCheck: !1,
			required: !0,
			value: t[o],
			onChange: (e) => i(o, e.target.value),
			placeholder: "/Users/vous/mon-projet…",
			...s(o),
			"aria-describedby": r?.field === o ? "home-form-error" : "home-path-help"
		}),
		/* @__PURE__ */ (0, S.jsx)("small", {
			id: "home-path-help",
			children: a("Chemin absolu d’un dossier sur cet ordinateur.", "Absolute path to a folder on this computer.")
		})
	] })] });
}
//#endregion
//#region studio-ui/src/features/home/components/ProjectDialog.tsx
function q(e = "en") {
	return {
		new: c("Créer un projet", "Create a project", void 0, e),
		imported: c("Importer un projet", "Import a project", void 0, e),
		existing: c("Reprendre un projet", "Resume a project", void 0, e)
	};
}
function J(e = "en") {
	return {
		new: c("Une idée suffit pour commencer. Nous préciserons ensemble le résultat à obtenir.", "An idea is enough to begin. We will clarify the intended outcome together.", void 0, e),
		imported: c("Partez de vos sources actuelles. DevMethod en crée une copie et préserve le dossier original.", "Start with your current sources. DevMethod creates a copy and preserves the original folder.", void 0, e),
		existing: c("Retrouvez un projet déjà utilisé dans DevMethod Studio, avec son contexte et ses versions.", "Return to an existing DevMethod Studio project with its context and versions.", void 0, e)
	};
}
var Y = () => ({
	name: "",
	idea: "",
	source: "",
	workspace: ""
});
function X({ open: e, kind: t, operation: r, onDismiss: i, onSubmit: a, onEdit: o, departure: s }) {
	let { locale: c, t: l } = n(), u = (0, w.useRef)(null), d = (0, w.useRef)(null), [f, p] = (0, w.useState)({
		new: Y(),
		imported: Y(),
		existing: Y()
	}), [m, h] = (0, w.useState)(null), g = m?.kind === t ? m.error : null, _ = r.phase !== "idle", v = !!s;
	(0, w.useEffect)(() => {
		let t = u.current;
		if (e && t) {
			let e = t.open;
			e || t.showModal(), v ? t.querySelector("[data-keep-idea]")?.focus() : e ? t.querySelector("button[type=\"submit\"]")?.focus() : t.querySelector("input")?.focus();
		} else !e && t?.open && t.close();
	}, [e, v]);
	function y(e, n) {
		p((r) => ({
			...r,
			[t]: {
				...r[t],
				[e]: n
			}
		})), h(null), o();
	}
	let b = A(t, r, c);
	return /* @__PURE__ */ (0, S.jsxs)("dialog", {
		ref: u,
		className: "home-dialog",
		"aria-labelledby": "home-dialog-title",
		"aria-describedby": "home-dialog-description",
		onCancel: (e) => {
			s ? (e.preventDefault(), s.onCancel()) : _ && e.preventDefault();
		},
		onClose: i,
		children: [
			/* @__PURE__ */ (0, S.jsxs)("div", {
				className: "home-dialog-heading",
				children: [/* @__PURE__ */ (0, S.jsx)("span", {
					className: "home-eyebrow",
					children: l("Votre point de départ", "Your starting point")
				}), /* @__PURE__ */ (0, S.jsx)("button", {
					type: "button",
					"aria-label": l("Fermer", "Close"),
					disabled: _,
					onClick: s?.onCancel || i,
					children: /* @__PURE__ */ (0, S.jsx)("span", {
						"aria-hidden": "true",
						children: "×"
					})
				})]
			}),
			/* @__PURE__ */ (0, S.jsx)("h2", {
				id: "home-dialog-title",
				children: s ? l("Quitter cette idée ?", "Leave this idea?") : q(c)[t]
			}),
			/* @__PURE__ */ (0, S.jsx)("p", {
				id: "home-dialog-description",
				children: s ? l("Votre idée et ses références ne sont pas encore enregistrées. Si vous ouvrez un autre projet, elles seront perdues.", "Your idea and references have not been saved. Opening another project will discard them.") : J(c)[t]
			}),
			s ? /* @__PURE__ */ (0, S.jsxs)("div", {
				className: "home-dialog-actions",
				children: [/* @__PURE__ */ (0, S.jsxs)("button", {
					type: "button",
					"data-keep-idea": !0,
					onClick: s.onCancel,
					children: [
						" ",
						l("Garder mon idée", "Keep my idea"),
						" "
					]
				}), /* @__PURE__ */ (0, S.jsxs)("button", {
					type: "button",
					className: "primary",
					onClick: s.onConfirm,
					children: [
						" ",
						l("Ouvrir quand même", "Open anyway"),
						" "
					]
				})]
			}) : null,
			/* @__PURE__ */ (0, S.jsxs)("form", {
				ref: d,
				hidden: v,
				onSubmit: (e) => {
					if (e.preventDefault(), _ || s) return;
					let n = D(t, e.currentTarget), r = k(n, c);
					if (h({
						kind: t,
						error: r
					}), r) {
						let e = d.current?.elements.namedItem(r.field);
						e instanceof HTMLElement && e.focus();
					} else a(n);
				},
				children: [
					/* @__PURE__ */ (0, S.jsx)("fieldset", {
						disabled: _,
						children: /* @__PURE__ */ (0, S.jsx)(K, {
							kind: t,
							values: f[t],
							validation: g,
							onEdit: y
						})
					}),
					/* @__PURE__ */ (0, S.jsxs)("p", {
						className: "home-form-note",
						children: [
							" ",
							l("Aucun agent ni script du projet n’est lancé automatiquement.", "No agent or project script runs automatically."),
							" "
						]
					}),
					g ? /* @__PURE__ */ (0, S.jsx)("p", {
						id: "home-form-error",
						role: "alert",
						className: "home-error",
						children: g.message
					}) : null,
					r.project ? /* @__PURE__ */ (0, S.jsxs)("p", {
						className: "home-saved",
						role: "status",
						children: [
							l("« {name} » est enregistré.", "“{name}” is saved.", { name: r.project.name }),
							" ",
							r.error ? l("Vous pouvez réessayer son ouverture.", "You can try opening it again.") : l("Ouverture du Studio…", "Opening Studio…")
						]
					}) : null,
					r.error ? /* @__PURE__ */ (0, S.jsx)("p", {
						role: "alert",
						className: "home-error",
						children: r.error
					}) : null,
					/* @__PURE__ */ (0, S.jsxs)("div", {
						className: "home-dialog-actions",
						children: [/* @__PURE__ */ (0, S.jsxs)("button", {
							type: "button",
							disabled: _,
							onClick: i,
							children: [
								" ",
								l("Retour", "Back"),
								" "
							]
						}), /* @__PURE__ */ (0, S.jsxs)("button", {
							type: "submit",
							className: "primary",
							disabled: _,
							children: [_ ? /* @__PURE__ */ (0, S.jsx)("span", {
								className: "home-spinner",
								"aria-hidden": "true"
							}) : null, b]
						})]
					}),
					/* @__PURE__ */ (0, S.jsx)("p", {
						className: "home-sr",
						role: "status",
						children: _ ? b : ""
					})
				]
			})
		]
	});
}
//#endregion
//#region studio-ui/src/features/home/hooks/usePreviewViewport.ts
function le() {
	let e = (0, w.useRef)(null), [t, n] = (0, w.useState)({
		visible: !1,
		width: 0
	});
	return (0, w.useEffect)(() => {
		let t = e.current;
		if (!t) return;
		let r = () => {
			let e = t.getBoundingClientRect().width;
			n((t) => t.width === e ? t : {
				...t,
				width: e
			});
		}, i = () => {
			let e = t.getBoundingClientRect(), r = e.bottom > 0 && e.top < window.innerHeight && e.right > 0 && e.left < window.innerWidth;
			n((e) => e.visible === r ? e : {
				...e,
				visible: r
			});
		}, a = typeof IntersectionObserver > "u" ? null : new IntersectionObserver((e) => {
			let t = e.some((e) => e.isIntersecting);
			n((e) => e.visible === t ? e : {
				...e,
				visible: t
			});
		}), o = typeof ResizeObserver > "u" ? null : new ResizeObserver(r);
		return r(), a?.observe(t), o?.observe(t), a || (i(), window.addEventListener("scroll", i, { passive: !0 }), window.addEventListener("resize", i)), o || window.addEventListener("resize", r), () => {
			a?.disconnect(), o?.disconnect(), window.removeEventListener("scroll", i), window.removeEventListener("resize", i), window.removeEventListener("resize", r);
		};
	}, []), {
		container: e,
		...t
	};
}
//#endregion
//#region studio-ui/src/features/home/components/RecentProjectPreview.tsx
function ue(e) {
	if (e.preview?.status !== "ready") return null;
	try {
		let t = new URL(e.preview.url), n = `/projects/${encodeURIComponent(e.id)}/revisions/${encodeURIComponent(e.preview.revisionId)}/index.html`;
		return t.protocol !== "http:" || ![
			"127.0.0.1",
			"localhost",
			"[::1]"
		].includes(t.hostname) || !t.port || t.origin === window.location.origin || t.username || t.password || t.search || t.hash || t.pathname !== n ? null : t.href;
	} catch {
		return null;
	}
}
function Z({ title: e, detail: t }) {
	return /* @__PURE__ */ (0, S.jsxs)("div", {
		className: "home-preview-placeholder",
		children: [
			/* @__PURE__ */ (0, S.jsx)("span", {
				className: "home-preview-symbol",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, S.jsx)(G, { kind: "folder" })
			}),
			/* @__PURE__ */ (0, S.jsx)("span", {
				className: "home-preview-title",
				children: e
			}),
			/* @__PURE__ */ (0, S.jsx)("span", {
				className: "home-preview-detail",
				children: t
			})
		]
	});
}
function de({ url: e, width: t, name: r }) {
	let { t: i } = n(), [a, o] = (0, w.useState)("loading");
	return (0, w.useEffect)(() => {
		if (a !== "loading") return;
		let e = window.setTimeout(() => o("failed"), 2e4);
		return () => window.clearTimeout(e);
	}, [a]), a === "failed" ? /* @__PURE__ */ (0, S.jsx)(Z, {
		title: i("Aperçu indisponible", "Preview unavailable"),
		detail: i("Le chargement n’a pas abouti. Ouvrez le projet pour le consulter.", "The preview could not load. Open the project to view it.")
	}) : /* @__PURE__ */ (0, S.jsxs)(S.Fragment, { children: [/* @__PURE__ */ (0, S.jsx)("div", {
		className: "home-preview-frame",
		"aria-hidden": "true",
		inert: !0,
		children: /* @__PURE__ */ (0, S.jsx)("iframe", {
			title: i("Aperçu de {name}", "Preview of {name}", { name: r }),
			src: e,
			sandbox: "allow-scripts",
			loading: "lazy",
			tabIndex: -1,
			"aria-hidden": "true",
			referrerPolicy: "no-referrer",
			width: 1280,
			height: 800,
			style: { transform: `scale(${t / 1280})` },
			onLoad: () => o((e) => e === "failed" ? e : "displayed"),
			onErrorCapture: () => o("failed")
		})
	}), a === "loading" ? /* @__PURE__ */ (0, S.jsxs)("div", {
		className: "home-preview-loading",
		children: [
			/* @__PURE__ */ (0, S.jsx)("span", {
				className: "home-spinner",
				"aria-hidden": "true"
			}),
			" ",
			i("Chargement de l’aperçu…", "Loading preview…"),
			" "
		]
	}) : null] });
}
function fe({ project: e }) {
	let { t } = n(), r = le(), i = e.preview, a = ue(e), o;
	return o = i?.status === "empty" ? /* @__PURE__ */ (0, S.jsx)(Z, {
		title: t("Votre idée prend forme", "Your idea is taking shape"),
		detail: t("Aucune version générée pour le moment.", "No version has been generated yet.")
	}) : i?.status === "unavailable" && i.reason === "source-only" ? /* @__PURE__ */ (0, S.jsx)(Z, {
		title: t("Sources sans aperçu", "Sources without a preview"),
		detail: t("Le projet reste consultable dans Studio.", "You can still inspect the project in Studio.")
	}) : a ? r.visible && r.width > 0 ? /* @__PURE__ */ (0, S.jsx)(de, {
		url: a,
		width: r.width,
		name: e.name
	}, a) : /* @__PURE__ */ (0, S.jsx)(Z, {
		title: t("Aperçu du projet", "Project preview"),
		detail: t("Il se charge lorsque cette carte est visible.", "It loads when this card is visible.")
	}) : /* @__PURE__ */ (0, S.jsx)(Z, {
		title: t("Aperçu indisponible", "Preview unavailable"),
		detail: t("Ouvrez le projet pour retrouver son contexte.", "Open the project to return to its context.")
	}), /* @__PURE__ */ (0, S.jsxs)("div", {
		ref: r.container,
		className: "home-project-preview",
		children: [o, a && i?.status === "ready" ? /* @__PURE__ */ (0, S.jsx)("span", {
			className: "home-preview-version",
			children: i.selection === "active" ? t("Version active", "Active version") : t("Version proposée", "Proposed version")
		}) : null]
	});
}
//#endregion
//#region studio-ui/src/features/home/components/RecentProjects.tsx
function pe({ projects: e, loading: t, error: r, busy: i, searchRef: a, onRefresh: o, onOpen: s, onOther: c }) {
	let { locale: l, t: u } = n(), [d, f] = (0, w.useState)(""), p = e.filter((e) => j(e, d));
	return /* @__PURE__ */ (0, S.jsxs)("section", {
		className: "home-recents",
		"aria-labelledby": "home-recents-title",
		children: [
			/* @__PURE__ */ (0, S.jsxs)("div", {
				className: "home-section-heading",
				children: [/* @__PURE__ */ (0, S.jsxs)("div", { children: [/* @__PURE__ */ (0, S.jsx)("h2", {
					id: "home-recents-title",
					children: u("Vos projets récents", "Your recent projects")
				}), /* @__PURE__ */ (0, S.jsx)("p", { children: u("Retrouvez votre contexte, vos décisions et vos versions.", "Return to your context, decisions, and versions.") })] }), /* @__PURE__ */ (0, S.jsx)("button", {
					type: "button",
					className: "home-refresh",
					disabled: t || i,
					onClick: o,
					children: t ? u("Actualisation…", "Refreshing…") : u("Actualiser", "Refresh")
				})]
			}),
			e.length ? /* @__PURE__ */ (0, S.jsxs)("label", {
				className: "home-search",
				children: [/* @__PURE__ */ (0, S.jsx)("span", {
					className: "home-sr",
					children: u("Rechercher un projet", "Search projects")
				}), /* @__PURE__ */ (0, S.jsx)("input", {
					ref: a,
					type: "search",
					name: "project-search",
					autoComplete: "off",
					value: d,
					onChange: (e) => f(e.target.value),
					placeholder: u("Rechercher un projet…", "Search projects…")
				})]
			}) : null,
			r ? /* @__PURE__ */ (0, S.jsxs)("p", {
				role: "alert",
				className: "home-error",
				children: [
					r,
					" ",
					e.length ? u("Vos projets déjà chargés restent visibles. ", "Your loaded projects remain visible. ") : "",
					" ",
					u("Actualisez pour réessayer.", "Refresh to try again."),
					" "
				]
			}) : null,
			t && !e.length ? /* @__PURE__ */ (0, S.jsxs)("p", {
				className: "home-empty",
				role: "status",
				children: [
					" ",
					u("Lecture de vos projets…", "Loading your projects…"),
					" "
				]
			}) : null,
			!t && !r && !e.length ? /* @__PURE__ */ (0, S.jsxs)("div", {
				className: "home-empty",
				children: [
					/* @__PURE__ */ (0, S.jsx)(G, { kind: "folder" }),
					/* @__PURE__ */ (0, S.jsx)("h3", { children: u("Votre prochain projet commence ici", "Your next project starts here") }),
					/* @__PURE__ */ (0, S.jsxs)("p", { children: [
						" ",
						u("Créez un projet ou importez vos sources. Ils apparaîtront ici pour les retrouver facilement.", "Create a project or import your sources. They will appear here for easy access."),
						" "
					] })
				]
			}) : null,
			e.length && !p.length ? /* @__PURE__ */ (0, S.jsxs)("p", {
				className: "home-empty",
				role: "status",
				children: [
					" ",
					u("Aucun projet ne correspond à cette recherche.", "No projects match this search."),
					" "
				]
			}) : null,
			/* @__PURE__ */ (0, S.jsx)("ul", {
				className: "home-project-list",
				children: p.map((e) => /* @__PURE__ */ (0, S.jsxs)("li", {
					className: "home-project-card",
					children: [/* @__PURE__ */ (0, S.jsx)(fe, { project: e }), /* @__PURE__ */ (0, S.jsxs)("button", {
						type: "button",
						className: "home-project",
						disabled: i,
						onClick: () => s(e),
						"aria-label": u("Ouvrir {name}", "Open {name}", { name: e.name }),
						children: [
							/* @__PURE__ */ (0, S.jsxs)("span", {
								className: "home-project-copy",
								children: [/* @__PURE__ */ (0, S.jsx)("strong", { children: e.name }), /* @__PURE__ */ (0, S.jsx)("span", {
									className: "home-project-path",
									title: e.workspace,
									children: e.workspace
								})]
							}),
							/* @__PURE__ */ (0, S.jsx)("span", {
								className: "home-project-arrow",
								"aria-hidden": "true",
								children: "↗"
							}),
							/* @__PURE__ */ (0, S.jsxs)("span", {
								className: "home-project-meta",
								children: [/* @__PURE__ */ (0, S.jsx)("span", { children: T(l)[e.kind] }), /* @__PURE__ */ (0, S.jsx)("time", {
									dateTime: e.lastOpenedAt || e.createdAt,
									children: N(e, l)
								})]
							})
						]
					})]
				}, e.id))
			}),
			/* @__PURE__ */ (0, S.jsxs)("button", {
				type: "button",
				className: "home-other",
				disabled: i,
				onClick: (e) => c(e.currentTarget),
				children: [
					" ",
					u("Ouvrir un autre dossier Studio", "Open another Studio folder"),
					" ",
					/* @__PURE__ */ (0, S.jsx)("span", {
						"aria-hidden": "true",
						children: "↗"
					})
				]
			})
		]
	});
}
//#endregion
//#region studio-ui/src/features/home/components/ComposerReferences.tsx
function me({ composer: e }) {
	let { t } = n(), [r, i] = (0, w.useState)(""), a = (0, w.useRef)(null), o = (0, w.useRef)(null), s = (0, w.useRef)(null);
	function c() {
		e.addLink(r) && i(""), a.current?.focus();
	}
	return /* @__PURE__ */ (0, S.jsxs)(S.Fragment, { children: [
		/* @__PURE__ */ (0, S.jsxs)("p", {
			className: "composer-option-intro",
			children: [
				" ",
				t("Montrez ce qui vous inspire : un écran, un document ou un site à étudier.", "Share what inspires you: a screen, document, or website to study."),
				" "
			]
		}),
		/* @__PURE__ */ (0, S.jsx)("input", {
			ref: o,
			className: "composer-file-input",
			type: "file",
			multiple: !0,
			accept: "image/png,image/jpeg,image/webp,text/plain,text/markdown,.txt,.md",
			"aria-label": t("Joindre des références", "Attach references"),
			disabled: e.busy,
			onChange: (t) => {
				let n = Array.from(t.currentTarget.files || []);
				t.currentTarget.value = "", e.addFiles(n);
			}
		}),
		/* @__PURE__ */ (0, S.jsxs)("button", {
			ref: s,
			type: "button",
			className: "composer-file-drop",
			disabled: e.busy || e.draft.attachments.length >= z.attachments,
			onClick: () => o.current?.click(),
			children: [
				/* @__PURE__ */ (0, S.jsx)("span", {
					className: "composer-upload-mark",
					"aria-hidden": "true",
					children: "↑"
				}),
				/* @__PURE__ */ (0, S.jsx)("strong", { children: e.reading ? t("Lecture des fichiers…", "Reading files…") : t("Ajouter des fichiers", "Add files") }),
				/* @__PURE__ */ (0, S.jsx)("span", { children: t("PNG, JPEG, WebP, TXT ou Markdown", "PNG, JPEG, WebP, TXT, or Markdown") }),
				/* @__PURE__ */ (0, S.jsx)("small", { children: t("4 fichiers maximum · 2 Mio par fichier", "Up to 4 files · 2 MiB per file") })
			]
		}),
		e.draft.attachments.length ? /* @__PURE__ */ (0, S.jsx)("ul", {
			className: "composer-reference-list",
			"aria-label": t("Fichiers joints", "Attached files"),
			children: e.draft.attachments.map((n, r) => /* @__PURE__ */ (0, S.jsxs)("li", { children: [/* @__PURE__ */ (0, S.jsxs)("span", { children: [/* @__PURE__ */ (0, S.jsx)("strong", { children: n.name }), /* @__PURE__ */ (0, S.jsx)("small", { children: n.mime.startsWith("image/") ? t("Image de référence", "Reference image") : t("Document de référence", "Reference document") })] }), /* @__PURE__ */ (0, S.jsx)("button", {
				type: "button",
				className: "composer-remove",
				disabled: e.busy,
				"aria-label": t("Retirer le fichier {name}", "Remove file {name}", { name: n.name }),
				onClick: () => {
					e.removeAttachment(r), requestAnimationFrame(() => s.current?.focus());
				},
				children: "×"
			})] }, `${r}:${n.name}`))
		}) : null,
		/* @__PURE__ */ (0, S.jsxs)("label", {
			className: "composer-field",
			htmlFor: "composer-reference-link",
			children: [
				" ",
				t("Un lien de référence", "A reference link"),
				" "
			]
		}),
		/* @__PURE__ */ (0, S.jsxs)("div", {
			className: "composer-link-entry",
			children: [/* @__PURE__ */ (0, S.jsx)("input", {
				ref: a,
				id: "composer-reference-link",
				type: "url",
				name: "reference-link",
				autoComplete: "off",
				autoCapitalize: "off",
				spellCheck: !1,
				value: r,
				disabled: e.busy,
				onChange: (e) => i(e.target.value),
				onKeyDown: (e) => {
					e.key === "Enter" && (e.preventDefault(), c());
				},
				placeholder: "https://un-site-qui-vous-inspire.fr…"
			}), /* @__PURE__ */ (0, S.jsxs)("button", {
				type: "button",
				disabled: e.busy,
				onClick: c,
				children: [
					" ",
					t("Ajouter", "Add"),
					" "
				]
			})]
		}),
		e.draft.links.length ? /* @__PURE__ */ (0, S.jsx)("ul", {
			className: "composer-reference-list",
			"aria-label": t("Liens de référence", "Reference links"),
			children: e.draft.links.map((n, r) => /* @__PURE__ */ (0, S.jsxs)("li", { children: [/* @__PURE__ */ (0, S.jsx)("span", {
				className: "composer-reference-url",
				title: n,
				children: n
			}), /* @__PURE__ */ (0, S.jsx)("button", {
				type: "button",
				className: "composer-remove",
				disabled: e.busy,
				"aria-label": t("Retirer le lien {url}", "Remove link {url}", { url: n }),
				onClick: () => {
					e.removeLink(r), a.current?.focus();
				},
				children: "×"
			})] }, n))
		}) : null,
		/* @__PURE__ */ (0, S.jsxs)("p", {
			className: "composer-option-note",
			children: [
				" ",
				t("5 liens maximum. Ils seront transmis comme références ; aucun site n’est consulté automatiquement.", "Up to 5 links. They will be passed on as references; no website is opened automatically."),
				" "
			]
		})
	] });
}
//#endregion
//#region studio-ui/src/features/home/components/ComposerGuideConnection.tsx
function he({ composer: e, preparation: t, title: r }) {
	let { t: i } = n(), [a, o] = (0, w.useState)(""), s = t.nativeConnection, c = e.mcp.connections.find((e) => e.provider === s?.providerId && e.url === s?.url), l = e.mcp.active;
	function u() {
		o("");
		try {
			e.mcp.connect(v(t));
		} catch {
			o(i("Cette préparation ne propose pas de connexion MCP prise en charge. Revenez aux outils pour choisir un serveur.", "This preparation has no supported MCP connection. Return to tools to choose a server."));
		}
	}
	return /* @__PURE__ */ (0, S.jsxs)("div", {
		className: "composer-guide-connect",
		children: [
			/* @__PURE__ */ (0, S.jsxs)("p", { children: [
				" ",
				i("L’ajout à la demande prépare le travail. La connexion autorise séparément l’accès de l’assistant.", "Adding this to your request prepares the work. Connecting separately authorizes assistant access."),
				" "
			] }),
			s?.providerId === "github" ? /* @__PURE__ */ (0, S.jsx)(b, {
				input: v(t),
				controller: e.mcp,
				disabled: e.busy
			}) : /* @__PURE__ */ (0, S.jsxs)("button", {
				type: "button",
				disabled: e.busy || !!l,
				onClick: u,
				children: [
					c?.status === "connected" ? i("Reconnecter", "Reconnect") : i("Connecter", "Connect"),
					" ",
					r
				]
			}),
			l ? /* @__PURE__ */ (0, S.jsx)("p", {
				role: "status",
				children: l.authorizing ? i("Autorisation attendue dans la fenêtre du fournisseur…", "Waiting for authorization in the provider window…") : i("Connexion MCP en cours…", "Connecting to MCP…")
			}) : null,
			c?.status === "connected" ? /* @__PURE__ */ (0, S.jsxs)("p", {
				role: "status",
				children: [
					" ",
					i("Connecté ·", "Connected ·"),
					" ",
					c.tools.length,
					" ",
					i("outils découverts. L’usage dans l’application reste distinct.", "tools discovered. Use within the application remains separate."),
					" "
				]
			}) : null,
			l?.id ? /* @__PURE__ */ (0, S.jsxs)("button", {
				type: "button",
				onClick: () => void e.mcp.change(l.id, "disconnect"),
				children: [
					" ",
					i("Annuler la connexion", "Cancel connection"),
					" "
				]
			}) : null,
			a || e.mcp.error ? /* @__PURE__ */ (0, S.jsx)("p", {
				role: "alert",
				children: a || e.mcp.error
			}) : null
		]
	});
}
//#endregion
//#region studio-ui/src/features/home/components/ComposerGuide.tsx
function ge({ composer: e }) {
	let { t } = n(), r = e.guides;
	return r.definition ? /* @__PURE__ */ (0, S.jsxs)("div", {
		className: "composer-service-guide",
		children: [
			/* @__PURE__ */ (0, S.jsx)(m, {
				definition: r.definition,
				draft: r.input,
				preparation: r.preparation,
				preparing: r.preparing,
				error: r.preparationError,
				onChange: r.change,
				onPrepare: (e) => void r.prepare(e),
				onApply: r.apply,
				applyLabel: t("Ajouter à ma demande", "Add to my request"),
				onBack: r.back,
				disabled: e.busy,
				step: r.step,
				onStepChange: r.setStep
			}, r.definition.optionId),
			r.persistence.error ? /* @__PURE__ */ (0, S.jsxs)("p", {
				role: "alert",
				children: [
					r.persistence.error,
					" ",
					/* @__PURE__ */ (0, S.jsxs)("button", {
						type: "button",
						onClick: () => void r.persistence.retry(),
						children: [
							" ",
							t("Réessayer l’enregistrement", "Retry saving"),
							" "
						]
					})
				]
			}) : null,
			r.persistence.saving ? /* @__PURE__ */ (0, S.jsx)("p", {
				role: "status",
				children: t("Enregistrement des réponses…", "Saving answers…")
			}) : null,
			r.preparation?.nativeConnection ? /* @__PURE__ */ (0, S.jsx)(he, {
				composer: e,
				preparation: r.preparation,
				title: r.definition.title
			}, r.preparation.setupFingerprint) : null
		]
	}) : /* @__PURE__ */ (0, S.jsxs)("section", {
		"aria-label": t("Guide du service", "Service guide"),
		children: [
			/* @__PURE__ */ (0, S.jsxs)("button", {
				type: "button",
				onClick: r.back,
				children: [
					" ",
					t("Retour aux outils", "Back to tools"),
					" "
				]
			}),
			/* @__PURE__ */ (0, S.jsx)("p", {
				role: r.error ? "alert" : "status",
				children: r.error || (r.loading ? t("Chargement du guide…", "Loading guide…") : t("Ce guide est indisponible. Réessayez son chargement.", "This guide is unavailable. Try loading it again."))
			}),
			/* @__PURE__ */ (0, S.jsxs)("button", {
				type: "button",
				disabled: r.loading || e.busy,
				onClick: () => void r.refresh(),
				children: [
					" ",
					t("Réessayer le guide", "Retry guide"),
					" "
				]
			})
		]
	});
}
//#endregion
//#region studio-ui/src/features/home/components/ComposerTools.tsx
function _e({ composer: e }) {
	let { t } = n(), [r, i] = (0, w.useState)(""), [a, o] = (0, w.useState)("all"), s = (0, w.useRef)(null), c = (0, w.useRef)(null), l = (0, w.useRef)(null), u = e.guides.activeId;
	(0, w.useEffect)(() => {
		!u && l.current && (s.current ?? c.current)?.focus(), l.current = u;
	}, [u]);
	function d(t) {
		document.activeElement instanceof HTMLButtonElement && (s.current = document.activeElement), e.guides.open(t);
	}
	let f = e.catalog, p = (f?.options || []).filter((e) => U(e, r)), m = p.filter((e) => a === "all" || e.capabilities.includes(a));
	return /* @__PURE__ */ (0, S.jsxs)(S.Fragment, { children: [u ? /* @__PURE__ */ (0, S.jsx)(ge, { composer: e }, u) : null, /* @__PURE__ */ (0, S.jsxs)("div", {
		hidden: !!u,
		children: [/* @__PURE__ */ (0, S.jsx)(_, {
			controller: e.mcp,
			selectedIds: e.draft.mcpConnectionIds,
			onToggle: e.toggleMcp,
			disabled: e.busy,
			onConfigureGuide: d
		}), /* @__PURE__ */ (0, S.jsxs)("section", {
			className: "composer-application-services",
			"aria-label": t("API et services du projet", "Project APIs and services"),
			children: [
				/* @__PURE__ */ (0, S.jsxs)("h3", {
					ref: c,
					tabIndex: -1,
					children: [
						" ",
						t("API et services du projet", "Project APIs and services"),
						" "
					]
				}),
				/* @__PURE__ */ (0, S.jsxs)("p", {
					className: "composer-option-intro",
					children: [
						" ",
						t("Proposez les services que vous souhaitez utiliser. L’agent vérifiera leur intérêt et leur accès avec vous.", "Suggest the services you want to use. The agent will review their relevance and access with you."),
						" "
					]
				}),
				e.guides.error ? /* @__PURE__ */ (0, S.jsxs)("div", {
					className: "composer-catalog-error",
					children: [/* @__PURE__ */ (0, S.jsx)("p", {
						role: "alert",
						children: e.guides.error
					}), /* @__PURE__ */ (0, S.jsxs)("button", {
						type: "button",
						disabled: e.busy || e.guides.loading,
						onClick: e.guides.refresh,
						children: [
							" ",
							t("Réessayer les guides", "Retry guides"),
							" "
						]
					})]
				}) : null,
				/* @__PURE__ */ (0, S.jsxs)("div", {
					className: "composer-tool-filters",
					children: [/* @__PURE__ */ (0, S.jsxs)("label", { children: [/* @__PURE__ */ (0, S.jsx)("span", {
						className: "home-sr",
						children: t("Rechercher un outil ou un service", "Search for a tool or service")
					}), /* @__PURE__ */ (0, S.jsx)("input", {
						type: "search",
						name: "composer-tool-search",
						autoComplete: "off",
						value: r,
						onChange: (e) => i(e.target.value),
						placeholder: t("Rechercher un outil ou un service…", "Search for a tool or service…"),
						disabled: e.busy
					})] }), /* @__PURE__ */ (0, S.jsxs)("label", { children: [/* @__PURE__ */ (0, S.jsx)("span", {
						className: "home-sr",
						children: t("Catégorie des outils", "Tool category")
					}), /* @__PURE__ */ (0, S.jsxs)("select", {
						value: a,
						onChange: (e) => o(e.target.value),
						disabled: e.busy,
						"aria-label": t("Catégorie des outils", "Tool category"),
						children: [/* @__PURE__ */ (0, S.jsxs)("option", {
							value: "all",
							children: [
								t("Toutes les catégories (", "All categories ("),
								p.length,
								")"
							]
						}), (f?.capabilities || []).map((e) => /* @__PURE__ */ (0, S.jsxs)("option", {
							value: e.id,
							children: [
								e.title,
								" (",
								p.filter((t) => t.capabilities.includes(e.id)).length,
								")"
							]
						}, e.id))]
					})] })]
				}),
				e.catalogLoading ? /* @__PURE__ */ (0, S.jsxs)("p", {
					className: "composer-option-note",
					role: "status",
					children: [
						" ",
						t("Chargement du catalogue…", "Loading catalog…"),
						" "
					]
				}) : null,
				e.catalogError ? /* @__PURE__ */ (0, S.jsxs)("div", {
					className: "composer-catalog-error",
					children: [/* @__PURE__ */ (0, S.jsx)("p", {
						role: "alert",
						children: e.catalogError
					}), /* @__PURE__ */ (0, S.jsxs)("button", {
						type: "button",
						onClick: () => void e.loadCatalog(),
						disabled: e.catalogLoading || e.busy,
						children: [
							" ",
							t("Réessayer le catalogue", "Retry catalog"),
							" "
						]
					})]
				}) : null,
				/* @__PURE__ */ (0, S.jsxs)("div", {
					className: "composer-tool-count",
					role: "status",
					children: [
						t(e.draft.connectors.length === 1 ? "{count} sélectionné" : "{count} sélectionnés", "{count} selected", { count: e.draft.connectors.length }),
						" ",
						t("· 12 maximum", "· up to 12"),
						" "
					]
				}),
				/* @__PURE__ */ (0, S.jsx)("div", {
					className: "composer-tool-grid",
					children: m.map((n) => /* @__PURE__ */ (0, S.jsxs)("div", {
						className: "composer-tool-card",
						children: [/* @__PURE__ */ (0, S.jsxs)("label", {
							className: "composer-tool-option",
							children: [
								/* @__PURE__ */ (0, S.jsx)("input", {
									type: "checkbox",
									name: "preferred-connector",
									value: n.id,
									checked: e.draft.connectors.includes(n.id),
									disabled: e.busy,
									onChange: () => e.toggleConnector(n.id)
								}),
								/* @__PURE__ */ (0, S.jsx)(h, {
									optionId: n.id,
									size: 28
								}),
								/* @__PURE__ */ (0, S.jsxs)("span", { children: [/* @__PURE__ */ (0, S.jsx)("strong", { children: n.title }), /* @__PURE__ */ (0, S.jsx)("small", { children: n.description })] })
							]
						}), e.guides.guides.some((e) => e.optionId === n.id) ? /* @__PURE__ */ (0, S.jsxs)("button", {
							type: "button",
							className: "composer-tool-configure",
							disabled: e.busy,
							onClick: () => d(n.id),
							children: [
								" ",
								t("Configurer", "Configure"),
								" ",
								n.title
							]
						}) : null]
					}, n.id))
				}),
				f && !m.length ? /* @__PURE__ */ (0, S.jsx)("p", {
					className: "composer-option-note",
					children: t("Aucun outil ne correspond à ce filtre.", "No tools match this filter.")
				}) : null,
				/* @__PURE__ */ (0, S.jsxs)("p", {
					className: "composer-option-note",
					children: [
						" ",
						t("Une préférence ne configure aucune connexion et n’accorde aucun accès à vos comptes.", "A preference does not configure a connection or grant access to your accounts."),
						" "
					]
				})
			]
		})]
	})] });
}
//#endregion
//#region studio-ui/src/features/home/components/ComposerOptions.tsx
function ve(e = "en") {
	return [
		{
			id: "references",
			label: c("Références", "References", void 0, e)
		},
		{
			id: "design",
			label: "Design"
		},
		{
			id: "tools",
			label: c("Outils et services", "Tools and services", void 0, e)
		},
		{
			id: "project",
			label: c("Projet", "Project", void 0, e)
		}
	];
}
function ye({ open: e, section: t, composer: r, onSection: i, onDismiss: a }) {
	let { locale: o, t: s } = n(), c = (0, w.useRef)(null), l = (0, w.useRef)(null);
	return (0, w.useEffect)(() => {
		let t = c.current;
		e && t && !t.open ? (t.showModal(), l.current?.focus()) : !e && t?.open && t.close();
	}, [e]), /* @__PURE__ */ (0, S.jsxs)("dialog", {
		ref: c,
		className: "composer-options-dialog",
		"aria-labelledby": "composer-options-title",
		onClose: a,
		children: [
			/* @__PURE__ */ (0, S.jsxs)("header", {
				className: "composer-options-header",
				children: [/* @__PURE__ */ (0, S.jsxs)("div", { children: [/* @__PURE__ */ (0, S.jsx)("span", {
					className: "home-eyebrow",
					children: s("Donnez une direction à votre idée", "Give your idea a direction")
				}), /* @__PURE__ */ (0, S.jsxs)("h2", {
					ref: l,
					tabIndex: -1,
					id: "composer-options-title",
					children: [
						" ",
						s("Préparer mon projet", "Prepare my project"),
						" "
					]
				})] }), /* @__PURE__ */ (0, S.jsx)("button", {
					type: "button",
					className: "composer-close",
					"aria-label": s("Fermer les options", "Close options"),
					onClick: a,
					children: "×"
				})]
			}),
			/* @__PURE__ */ (0, S.jsx)("nav", {
				className: "composer-options-nav",
				"aria-label": s("Options du projet", "Project options"),
				children: ve(o).map((e) => /* @__PURE__ */ (0, S.jsx)("button", {
					type: "button",
					"aria-pressed": t === e.id,
					onClick: () => i(e.id),
					disabled: r.busy,
					children: e.label
				}, e.id))
			}),
			/* @__PURE__ */ (0, S.jsxs)("div", {
				className: "composer-options-body",
				children: [
					/* @__PURE__ */ (0, S.jsx)("section", {
						className: "composer-options-pane",
						hidden: t !== "references",
						"aria-label": s("Références du projet", "Project references"),
						children: /* @__PURE__ */ (0, S.jsx)(me, { composer: r })
					}),
					/* @__PURE__ */ (0, S.jsxs)("section", {
						className: "composer-options-pane",
						hidden: t !== "design",
						"aria-label": s("Direction visuelle", "Visual direction"),
						children: [
							/* @__PURE__ */ (0, S.jsxs)("p", {
								className: "composer-option-intro",
								children: [
									" ",
									s("Indiquez une ambiance, des couleurs ou une manière de présenter le contenu.", "Describe a mood, colors, or a way to present the content."),
									" "
								]
							}),
							/* @__PURE__ */ (0, S.jsx)("div", {
								className: "composer-style-grid",
								children: V(o).map((e, t) => {
									let n = `${e.title}. ${e.description}`;
									return /* @__PURE__ */ (0, S.jsxs)("button", {
										className: `composer-style composer-style-${t}`,
										type: "button",
										"aria-pressed": r.draft.design === n,
										onClick: () => r.setField("design", n),
										disabled: r.busy,
										children: [
											/* @__PURE__ */ (0, S.jsxs)("span", {
												className: "composer-style-swatch",
												"aria-hidden": "true",
												children: [
													/* @__PURE__ */ (0, S.jsx)("i", {}),
													/* @__PURE__ */ (0, S.jsx)("i", {}),
													/* @__PURE__ */ (0, S.jsx)("i", {})
												]
											}),
											/* @__PURE__ */ (0, S.jsx)("strong", { children: e.title }),
											/* @__PURE__ */ (0, S.jsx)("small", { children: e.description })
										]
									}, e.title);
								})
							}),
							/* @__PURE__ */ (0, S.jsxs)("label", {
								className: "composer-field",
								htmlFor: "composer-design",
								children: [
									" ",
									s("Votre direction visuelle", "Your visual direction"),
									" "
								]
							}),
							/* @__PURE__ */ (0, S.jsx)("textarea", {
								id: "composer-design",
								name: "design",
								autoComplete: "off",
								rows: 3,
								maxLength: z.design,
								value: r.draft.design,
								onChange: (e) => r.setField("design", e.target.value),
								placeholder: s("Par exemple, une interface lumineuse et éditoriale, avec des accents verts…", "For example, a bright editorial interface with green accents…"),
								disabled: r.busy
							}),
							/* @__PURE__ */ (0, S.jsxs)("p", {
								className: "composer-option-note",
								children: [
									" ",
									s("Ces pistes donnent une intention de style. Aucun kit de design n’est installé.", "These ideas describe a style. No design kit is installed."),
									" "
								]
							})
						]
					}),
					/* @__PURE__ */ (0, S.jsx)("section", {
						className: "composer-options-pane",
						hidden: t !== "tools",
						"aria-label": s("Outils proposés", "Suggested tools"),
						children: /* @__PURE__ */ (0, S.jsx)(_e, { composer: r })
					}),
					/* @__PURE__ */ (0, S.jsxs)("section", {
						className: "composer-options-pane",
						hidden: t !== "project",
						"aria-label": s("Nom du projet", "Project name"),
						children: [
							/* @__PURE__ */ (0, S.jsxs)("p", {
								className: "composer-option-intro",
								children: [
									" ",
									s("Vous pourrez faire évoluer ces informations dans le projet.", "You can update this information as the project develops."),
									" "
								]
							}),
							/* @__PURE__ */ (0, S.jsxs)("label", {
								className: "composer-field",
								htmlFor: "composer-project-name",
								children: [
									" ",
									s("Nom du projet", "Project name"),
									" ",
									/* @__PURE__ */ (0, S.jsx)("span", { children: s("· facultatif", "· optional") })
								]
							}),
							/* @__PURE__ */ (0, S.jsx)("input", {
								id: "composer-project-name",
								name: "project-name",
								autoComplete: "off",
								maxLength: 200,
								value: r.draft.name,
								onChange: (e) => r.setField("name", e.target.value),
								placeholder: s("Donnez un nom à votre idée…", "Give your idea a name…"),
								disabled: r.busy
							}),
							/* @__PURE__ */ (0, S.jsxs)("p", {
								className: "composer-option-note",
								children: [
									" ",
									s("Vous pouvez laisser ce champ vide pour commencer avec un nom par défaut.", "Leave this blank to start with a default name."),
									" "
								]
							})
						]
					}),
					r.error ? /* @__PURE__ */ (0, S.jsx)("p", {
						role: "alert",
						className: "composer-error",
						children: r.error
					}) : null
				]
			}),
			/* @__PURE__ */ (0, S.jsxs)("footer", {
				className: "composer-options-footer",
				children: [/* @__PURE__ */ (0, S.jsx)("span", { children: r.reading ? s("Lecture des fichiers…", "Reading files…") : s("Vos choix restent modifiables.", "You can still change your choices.") }), /* @__PURE__ */ (0, S.jsxs)("button", {
					type: "button",
					className: "primary",
					onClick: a,
					children: [
						" ",
						s("Terminé", "Done"),
						" "
					]
				})]
			})
		]
	});
}
//#endregion
//#region studio-ui/src/features/home/components/ComposerPreferences.tsx
function be({ composer: e, onConfigureGuide: t }) {
	let { t: r } = n(), { draft: i } = e;
	function a(t) {
		t(), e.textarea.current?.focus();
	}
	return !i.design && !i.connectors.length && !i.connectorGuides.length && !i.links.length && !i.attachments.length ? null : /* @__PURE__ */ (0, S.jsxs)("div", {
		className: "composer-preferences",
		"aria-label": r("Préférences ajoutées", "Added preferences"),
		children: [
			i.design ? /* @__PURE__ */ (0, S.jsxs)("span", {
				className: "composer-chip",
				children: [/* @__PURE__ */ (0, S.jsxs)("span", {
					className: "composer-chip-label",
					title: i.design,
					children: [
						" ",
						r("Style :", "Style:"),
						" ",
						i.design.split(/[.\n]/)[0]
					]
				}), /* @__PURE__ */ (0, S.jsx)("button", {
					type: "button",
					disabled: e.busy,
					"aria-label": r("Retirer la direction visuelle", "Remove visual direction"),
					onClick: () => a(() => e.setField("design", "")),
					children: "×"
				})]
			}) : null,
			i.connectors.filter((e) => !i.connectorGuides.some((t) => t.optionId === e)).map((n) => {
				let i = e.catalog?.options.find((e) => e.id === n)?.title || n;
				return /* @__PURE__ */ (0, S.jsxs)("span", {
					className: "composer-chip",
					children: [
						/* @__PURE__ */ (0, S.jsx)(h, {
							optionId: n,
							size: 18
						}),
						e.guides.guides.some((e) => e.optionId === n) ? /* @__PURE__ */ (0, S.jsx)("button", {
							type: "button",
							className: "composer-chip-configure",
							disabled: e.busy,
							"aria-label": r("Configurer {title}", "Configure {title}", { title: i }),
							onClick: (e) => t(n, e.currentTarget),
							children: i
						}) : /* @__PURE__ */ (0, S.jsx)("span", {
							className: "composer-chip-label",
							children: i
						}),
						/* @__PURE__ */ (0, S.jsx)("button", {
							type: "button",
							disabled: e.busy,
							"aria-label": r("Retirer {title}", "Remove {title}", { title: i }),
							onClick: () => a(() => e.toggleConnector(n)),
							children: "×"
						})
					]
				}, n);
			}),
			i.connectorGuides.map((n) => {
				let i = e.guides.guides.find((e) => e.optionId === n.optionId), o = i?.title || n.optionId, s = i?.flows.find((e) => e.id === n.flowId), c = e.guides.preparationFor(n.optionId)?.nativeConnection, l = c && e.mcp.connections.some((e) => e.provider === c.providerId && e.url === c.url && e.status === "connected");
				return /* @__PURE__ */ (0, S.jsxs)("span", {
					className: "composer-chip composer-guide-chip",
					children: [
						/* @__PURE__ */ (0, S.jsx)(h, {
							optionId: n.optionId,
							size: 18
						}),
						/* @__PURE__ */ (0, S.jsxs)("button", {
							type: "button",
							className: "composer-chip-configure",
							disabled: e.busy,
							"aria-label": r("Configurer {title}", "Configure {title}", { title: o }),
							title: s?.title,
							onClick: (e) => t(n.optionId, e.currentTarget),
							children: [
								o,
								" ·",
								" ",
								l ? r("MCP connecté", "MCP connected") : r("À connecter", "Not connected")
							]
						}),
						/* @__PURE__ */ (0, S.jsx)("button", {
							type: "button",
							disabled: e.busy,
							"aria-label": r("Retirer {title}", "Remove {title}", { title: o }),
							onClick: () => a(() => e.removeGuide(n.optionId)),
							children: "×"
						})
					]
				}, "guide:" + n.optionId);
			}),
			i.attachments.map((t, n) => /* @__PURE__ */ (0, S.jsxs)("span", {
				className: "composer-chip",
				children: [
					/* @__PURE__ */ (0, S.jsx)("span", {
						className: "composer-chip-mark",
						"aria-hidden": "true",
						children: "↗"
					}),
					/* @__PURE__ */ (0, S.jsx)("span", {
						className: "composer-chip-label",
						title: t.name,
						children: t.name
					}),
					/* @__PURE__ */ (0, S.jsx)("button", {
						type: "button",
						disabled: e.busy,
						"aria-label": r("Retirer le fichier {name}", "Remove file {name}", { name: t.name }),
						onClick: () => a(() => e.removeAttachment(n)),
						children: "×"
					})
				]
			}, `${n}:${t.name}`)),
			i.links.map((t, n) => /* @__PURE__ */ (0, S.jsxs)("span", {
				className: "composer-chip",
				children: [
					/* @__PURE__ */ (0, S.jsx)("span", {
						className: "composer-chip-mark",
						"aria-hidden": "true",
						children: "↗"
					}),
					/* @__PURE__ */ (0, S.jsx)("span", {
						className: "composer-chip-label",
						title: t,
						children: new URL(t).hostname
					}),
					/* @__PURE__ */ (0, S.jsx)("button", {
						type: "button",
						disabled: e.busy,
						"aria-label": r("Retirer le lien {url}", "Remove link {url}", { url: t }),
						onClick: () => a(() => e.removeLink(n)),
						children: "×"
					})
				]
			}, t))
		]
	});
}
//#endregion
//#region studio-ui/src/features/home/hooks/useComposerPlaceholder.ts
function xe(e = "en") {
	return [
		c("Une boutique pour mes créations, avec une collection à découvrir et un panier…", "A shop for my creations, with a collection to explore and a shopping cart…", void 0, e),
		c("Une application pour réserver des ateliers et suivre les inscriptions…", "An app to book workshops and track registrations…", void 0, e),
		c("Un tableau de bord qui rend les chiffres de mon activité faciles à comprendre…", "A dashboard that makes my business figures easy to understand…", void 0, e),
		c("Un portfolio qui raconte mon travail et donne envie de me contacter…", "A portfolio that tells the story of my work and encourages people to get in touch…", void 0, e),
		c("Un espace partagé pour transformer les idées de mon équipe en projets…", "A shared workspace to turn my team’s ideas into projects…", void 0, e)
	];
}
function Se(e = "en") {
	return c("Décrivez votre idée. À qui s’adresse-t-elle, et que doit-elle permettre de faire ?", "Describe your idea. Who is it for, and what should it help them do?", void 0, e);
}
function Ce(e) {
	let { locale: t, t: r } = n(), [i, a] = (0, w.useState)({
		index: 0,
		cursor: 6
	});
	(0, w.useEffect)(() => {
		if (!e) return;
		let n = window.matchMedia?.("(prefers-reduced-motion: reduce)"), r = xe(t), i, o = 0, s = 6, c = !1;
		function l(e) {
			i = setTimeout(u, e);
		}
		function u() {
			if (document.hidden) return;
			if (n?.matches) {
				a({
					index: 0,
					cursor: r[0].length
				});
				return;
			}
			let e = r[o] ?? r[0];
			s += c ? -1 : 1, a({
				index: o,
				cursor: s
			}), s === e.length ? (c = !0, l(2300)) : s === 0 ? (c = !1, o = (o + 1) % r.length, l(350)) : l(c ? 18 : 48);
		}
		function d() {
			clearTimeout(i), document.hidden || l(150);
		}
		return n?.addEventListener("change", d), document.addEventListener("visibilitychange", d), d(), () => {
			clearTimeout(i), n?.removeEventListener("change", d), document.removeEventListener("visibilitychange", d);
		};
	}, [e, t]);
	let o = (xe(t)[i.index] ?? "").slice(0, i.cursor);
	return e ? r("Imaginez… {text}", "Imagine… {text}", { text: o }) : Se(t);
}
//#endregion
//#region studio-ui/src/features/home/components/IdeaComposer.tsx
function we(e) {
	let { locale: t, t: r } = n(), { composer: i } = e, [a, o] = (0, w.useState)(!1), s = Ce(!a && !i.draft.idea && !i.busy), [c, l] = (0, w.useState)({
		open: !1,
		section: "references"
	}), u = (0, w.useRef)(null);
	function d(e) {
		l({
			open: !0,
			section: e
		}), e === "tools" && i.guides.load(), e === "tools" && !i.catalog && !i.catalogLoading && i.loadCatalog();
	}
	function f(e, t) {
		u.current = t, d(e);
	}
	function p() {
		l((e) => ({
			...e,
			open: !1
		})), u.current?.focus();
	}
	let m = re(e.operation, i.reading, t);
	return /* @__PURE__ */ (0, S.jsxs)("div", {
		className: "idea-composer-wrap",
		children: [
			/* @__PURE__ */ (0, S.jsxs)("form", {
				className: "idea-composer",
				onSubmit: (e) => {
					e.preventDefault(), i.submit();
				},
				children: [
					/* @__PURE__ */ (0, S.jsxs)("label", {
						className: "home-sr",
						htmlFor: "composer-idea",
						children: [
							" ",
							r("Décrivez votre idée", "Describe your idea"),
							" "
						]
					}),
					/* @__PURE__ */ (0, S.jsx)("textarea", {
						ref: i.textarea,
						id: "composer-idea",
						name: "idea",
						rows: 4,
						maxLength: z.idea,
						value: i.draft.idea,
						autoComplete: "off",
						placeholder: s,
						onFocus: () => o(!0),
						onBlur: () => o(!1),
						onChange: (e) => i.setField("idea", e.target.value),
						onKeyDown: (e) => {
							e.key === "Enter" && (e.metaKey || e.ctrlKey) && (e.preventDefault(), i.submit());
						},
						disabled: i.busy,
						"aria-invalid": !!i.error || void 0,
						"aria-describedby": "composer-help"
					}),
					/* @__PURE__ */ (0, S.jsx)(be, {
						composer: i,
						onConfigureGuide: (e, t) => {
							i.guides.open(e), f("tools", t);
						}
					}),
					/* @__PURE__ */ (0, S.jsxs)("div", {
						className: "composer-toolbar",
						children: [/* @__PURE__ */ (0, S.jsxs)("div", {
							className: "composer-option-actions",
							children: [
								/* @__PURE__ */ (0, S.jsx)("button", {
									type: "button",
									className: "composer-add",
									disabled: i.busy,
									"aria-label": r("Ajouter des références", "Add references"),
									title: r("Ajouter des références", "Add references"),
									onClick: (e) => f("references", e.currentTarget),
									children: /* @__PURE__ */ (0, S.jsx)("span", {
										"aria-hidden": "true",
										children: "+"
									})
								}),
								/* @__PURE__ */ (0, S.jsxs)("button", {
									type: "button",
									disabled: i.busy,
									onClick: (e) => f("design", e.currentTarget),
									children: [/* @__PURE__ */ (0, S.jsx)("span", {
										className: "composer-style-symbol",
										"aria-hidden": "true",
										children: "◒"
									}), "Design"]
								}),
								/* @__PURE__ */ (0, S.jsxs)("button", {
									type: "button",
									disabled: i.busy,
									onClick: (e) => f("tools", e.currentTarget),
									children: [
										/* @__PURE__ */ (0, S.jsx)("span", {
											className: "composer-tools-symbol",
											"aria-hidden": "true",
											children: "⌘"
										}),
										" ",
										r("Outils", "Tools"),
										" "
									]
								})
							]
						}), /* @__PURE__ */ (0, S.jsxs)("div", {
							className: "composer-submit-actions",
							children: [/* @__PURE__ */ (0, S.jsxs)("label", {
								className: "composer-mode",
								children: [/* @__PURE__ */ (0, S.jsx)("span", {
									className: "home-sr",
									children: r("Première étape", "First step")
								}), /* @__PURE__ */ (0, S.jsxs)("select", {
									name: "launch-action",
									value: i.draft.action,
									disabled: i.busy,
									onChange: (e) => i.setField("action", e.target.value),
									children: [/* @__PURE__ */ (0, S.jsx)("option", {
										value: "build",
										children: r("Construire", "Build")
									}), /* @__PURE__ */ (0, S.jsx)("option", {
										value: "plan",
										children: r("Planifier", "Plan")
									})]
								})]
							}), /* @__PURE__ */ (0, S.jsxs)("button", {
								type: "submit",
								className: "primary composer-start",
								disabled: i.busy,
								children: [
									i.busy ? /* @__PURE__ */ (0, S.jsx)("span", {
										className: "home-spinner",
										"aria-hidden": "true"
									}) : null,
									m,
									/* @__PURE__ */ (0, S.jsx)("span", {
										"aria-hidden": "true",
										children: "↑"
									})
								]
							})]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, S.jsx)(y, {
				connections: i.mcp.connections,
				selectedIds: i.draft.mcpConnectionIds,
				onToggle: i.toggleMcp,
				onManage: (e) => f("tools", e),
				disabled: i.busy
			}),
			i.linearAccessWarning ? /* @__PURE__ */ (0, S.jsxs)("p", {
				role: "alert",
				className: "composer-error",
				children: [
					" ",
					r("Une connexion Linear avec accès standard est aussi sélectionnée. Retirez-la pour limiter les outils du projet à la lecture seule.", "A Linear connection with standard access is also selected. Remove it to limit this project’s tools to read-only access."),
					" "
				]
			}) : null,
			/* @__PURE__ */ (0, S.jsx)("div", {
				className: "composer-type-pills",
				role: "group",
				"aria-label": r("Type de projet", "Project type"),
				children: B(t).map((e) => /* @__PURE__ */ (0, S.jsx)("button", {
					type: "button",
					"aria-pressed": i.draft.projectType === e.id,
					disabled: i.busy,
					onClick: () => i.selectType(e.id),
					children: e.label
				}, e.id))
			}),
			/* @__PURE__ */ (0, S.jsxs)("p", {
				className: "composer-help",
				id: "composer-help",
				children: [
					" ",
					r("La demande sera transmise à l’agent du projet. Elle attendra sa prise en charge.", "The request will be sent to the project’s agent and wait to be picked up."),
					" "
				]
			}),
			e.operation.project ? /* @__PURE__ */ (0, S.jsxs)("p", {
				className: "composer-saved",
				role: "status",
				children: [
					r("« {name} » est enregistré.", "“{name}” is saved.", { name: e.operation.project.name }),
					" ",
					e.operation.error ? r("Réessayez son ouverture ; votre projet est conservé.", "Try opening it again; your project is saved.") : r("Ouverture du Studio…", "Opening Studio…")
				]
			}) : null,
			i.error || e.operation.error ? /* @__PURE__ */ (0, S.jsx)("p", {
				role: "alert",
				className: "composer-error",
				children: i.error || e.operation.error
			}) : null,
			/* @__PURE__ */ (0, S.jsx)("p", {
				role: "status",
				className: "home-sr",
				children: i.busy ? m : ""
			}),
			/* @__PURE__ */ (0, S.jsx)(ye, {
				...c,
				composer: i,
				onSection: d,
				onDismiss: p
			})
		]
	});
}
//#endregion
//#region studio-ui/src/features/home/model/starters.ts
function Te(e = "en") {
	return [
		{
			id: "all",
			label: c("Tout", "All", void 0, e)
		},
		{
			id: "website",
			label: c("Sites web", "Websites", void 0, e)
		},
		{
			id: "app",
			label: c("Applications", "Apps", void 0, e)
		},
		{
			id: "prototype",
			label: "Prototypes"
		},
		{
			id: "slides",
			label: c("Présentations", "Presentations", void 0, e)
		}
	];
}
function Ee(e = "en") {
	return [
		{
			id: "atelier",
			title: c("Atelier — Portfolio", "Atelier — Portfolio", void 0, e),
			description: c("Un regard singulier, des projets qui parlent.", "A distinctive perspective, projects that speak for themselves.", void 0, e),
			category: "website",
			interaction: c("Filtrez les projets de ce studio fictif.", "Filter this fictional studio’s projects.", void 0, e),
			seed: {
				projectType: "website",
				idea: c("Créer un portfolio éditorial pour un studio créatif. Présenter une sélection de projets filtrables par discipline, des études de cas avec intention et résultat, une présentation du studio et un moyen de contact. Adapter les contenus et l’identité à mon activité ; prévoir les états vides et une navigation mobile accessible.", "Create an editorial portfolio for a creative studio. Include selected projects filterable by discipline, case studies with intentions and outcomes, a studio introduction, and a contact method. Adapt the content and identity to my business; include empty states and accessible mobile navigation.", void 0, e),
				design: c("Direction Atelier : fond crème, typographie éditoriale à empattements, accents corail et composition asymétrique. Grandes respirations, numérotation discrète et illustrations géométriques originales. Préserver une forte lisibilité sur mobile.", "Atelier direction: cream background, editorial serif typography, coral accents, and asymmetric composition. Generous spacing, subtle numbering, and original geometric illustrations. Preserve strong readability on mobile.", void 0, e)
			}
		},
		{
			id: "pulse",
			title: c("Pulse — Tableau de bord", "Pulse — Dashboard", void 0, e),
			description: c("Les chiffres utiles, au premier regard.", "The figures that matter, at a glance.", void 0, e),
			category: "app",
			interaction: c("Changez la période pour comparer les données de démonstration.", "Change the period to compare the sample data.", void 0, e),
			seed: {
				projectType: "app",
				idea: c("Créer un tableau de bord SaaS pour suivre l’activité d’une équipe. Prévoir des indicateurs définis, un filtre de période, des tendances et une liste détaillée. Identifier les sources de données et les droits nécessaires avant connexion ; distinguer données de démonstration, chargement, absence de données et erreurs.", "Create a SaaS dashboard to track a team’s activity. Include defined metrics, a period filter, trends, and a detailed list. Identify data sources and required permissions before connecting; distinguish sample data, loading, empty states, and errors.", void 0, e),
				design: c("Direction Pulse : interface bleu nuit, graphiques menthe et lilas, typographie sans empattements, chiffres tabulaires. Hiérarchie calme, panneaux fins et contrastes accessibles ; une version mobile recentrée sur les indicateurs essentiels.", "Pulse direction: midnight-blue interface, mint and lilac charts, sans-serif typography, and tabular figures. Calm hierarchy, subtle panels, and accessible contrast; a mobile version focused on essential metrics.", void 0, e)
			}
		},
		{
			id: "rivage",
			title: c("Rivage — Boutique", "Rivage — Shop", void 0, e),
			description: c("Une collection soignée, une sélection simple.", "A considered collection, a simple selection.", void 0, e),
			category: "website",
			interaction: c("Ajoutez un objet à une sélection locale, sans commande.", "Add an item to a local selection without placing an order.", void 0, e),
			seed: {
				projectType: "website",
				idea: c("Créer une boutique pour une petite collection d’objets. Prévoir catalogue, fiches produit, filtres et sélection modifiable. Préciser les besoins de stock, livraison et paiement avant toute intégration ; aucun achat ne doit être simulé comme réussi. Partir de produits fictifs clairement identifiés puis remplacer par les données autorisées.", "Create a shop for a small collection of objects. Include a catalog, product pages, filters, and an editable selection. Clarify inventory, delivery, and payment needs before any integration; never present a simulated purchase as successful. Start with clearly labeled fictional products, then replace them with authorized data.", void 0, e),
				design: c("Direction Rivage : palette sauge, ivoire et terre cuite, formes organiques, titres fins à empattements. Présentation généreuse des objets, prix lisibles, parcours tactile sobre et accessible.", "Rivage direction: sage, ivory, and terracotta palette, organic shapes, and fine serif headings. Generous product presentation, readable prices, and a restrained, accessible touch journey.", void 0, e)
			}
		},
		{
			id: "pause",
			title: c("Pause — Rendez-vous", "Pause — Appointments", void 0, e),
			description: c("Choisir un moment, en toute simplicité.", "Choose a moment, with ease.", void 0, e),
			category: "prototype",
			interaction: c("Choisissez un jour et un créneau ; aucune réservation n’est envoyée.", "Choose a day and time slot; no booking is submitted.", void 0, e),
			seed: {
				projectType: "prototype",
				idea: c("Prototyper un parcours de prise de rendez-vous : choisir une prestation, un jour et un créneau, puis revoir le récapitulatif. Tester la compréhension des disponibilités, les états complets et l’annulation. Garder le prototype local avec données fictives ; définir ensuite les règles de disponibilité, les données personnelles et le service de réservation avant implémentation.", "Prototype an appointment journey: choose a service, day, and time slot, then review the summary. Test how availability, fully booked states, and cancellation are understood. Keep the prototype local with fictional data; define availability rules, personal data, and the booking service before implementation.", void 0, e),
				design: c("Direction Pause : lavande douce, crème et violet profond, cartes arrondies, calendrier aéré. Boutons de créneaux généreux, sélection explicite et récapitulatif toujours visible sur mobile.", "Pause direction: soft lavender, cream, and deep purple, rounded cards, and a spacious calendar. Generous time-slot buttons, explicit selection, and a summary that stays visible on mobile.", void 0, e)
			}
		},
		{
			id: "collectif",
			title: c("Collectif — Kanban", "Collectif — Kanban", void 0, e),
			description: c("Moins de dispersion, plus de mouvement.", "Less distraction, more progress.", void 0, e),
			category: "app",
			interaction: c("Faites avancer une tâche dans le tableau de démonstration.", "Move a task forward on the demo board.", void 0, e),
			seed: {
				projectType: "app",
				idea: c("Créer un tableau kanban pour une petite équipe avec colonnes À faire, En cours et Terminé. Prévoir création, édition, déplacement au clavier et filtres de tâches. Clarifier la persistance, les rôles et les conflits de modifications avant d’ajouter la collaboration ; conserver un historique compréhensible et un état vide utile.", "Create a kanban board for a small team with To do, In progress, and Done columns. Include task creation, editing, keyboard movement, and filters. Clarify persistence, roles, and editing conflicts before adding collaboration; keep an understandable history and useful empty state.", void 0, e),
				design: c("Direction Collectif : surfaces ivoire, texte encre, accents prune et pastels par statut. Cartes compactes, libellés clairs, actions de déplacement accessibles sans glisser-déposer obligatoire.", "Collectif direction: ivory surfaces, ink text, plum accents, and status-specific pastels. Compact cards, clear labels, and accessible movement actions that do not require drag-and-drop.", void 0, e)
			}
		},
		{
			id: "perspective",
			title: c("Perspective — Slides", "Perspective — Slides", void 0, e),
			description: c("Une histoire claire, un écran à la fois.", "A clear story, one screen at a time.", void 0, e),
			category: "slides",
			interaction: c("Parcourez les trois diapositives de cet exemple.", "Browse this example’s three slides.", void 0, e),
			seed: {
				projectType: "slides",
				idea: c("Créer une présentation web pour exposer une idée : contexte, proposition, bénéfices et prochaine étape. Prévoir navigation précédente/suivante au clavier, indicateur de progression et affichage responsive. Construire le récit avec mon contenu et signaler toute donnée illustrative ; permettre de revoir les slides sans animation obligatoire.", "Create a web presentation to explain an idea: context, proposal, benefits, and next step. Include previous/next keyboard navigation, a progress indicator, and responsive display. Build the story around my content and label illustrative data; allow slides to be revisited without mandatory animation.", void 0, e),
				design: c("Direction Perspective : orange solaire, fond encre et ivoire, typographie monumentale. Une idée par écran, mise en page graphique, numérotation discrète et transitions respectant la réduction des mouvements.", "Perspective direction: sunny orange, ink and ivory backgrounds, and monumental typography. One idea per screen, graphic layouts, subtle numbering, and transitions that respect reduced motion.", void 0, e)
			}
		}
	];
}
function De(e) {
	return e.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}
function Oe(e, t, n = "en") {
	let r = De(e.trim()).split(/\s+/);
	return Ee(n).filter((e) => {
		let n = De(`${e.title} ${e.description} ${e.seed.idea}`);
		return (t === "all" || e.category === t) && r.every((e) => n.includes(e));
	});
}
//#endregion
//#region studio-ui/src/features/home/components/StarterGallery.tsx
function ke() {
	let { t: e } = n(), [t, r] = (0, w.useState)("all"), i = {
		all: e("Tous", "All"),
		identity: e("Identité", "Identity"),
		editorial: e("Édition", "Editorial")
	}, a = [
		{
			name: e("Formes libres", "Free forms"),
			category: "identity",
			tone: "coral"
		},
		{
			name: e("Objets sensibles", "Sensitive objects"),
			category: "editorial",
			tone: "blue"
		},
		{
			name: e("Nouveaux regards", "New perspectives"),
			category: "identity",
			tone: "lime"
		}
	];
	return /* @__PURE__ */ (0, S.jsxs)("div", {
		className: "sg-preview sg-atelier",
		children: [
			/* @__PURE__ */ (0, S.jsxs)("div", {
				className: "sg-mini-nav",
				children: [/* @__PURE__ */ (0, S.jsx)("b", { children: "atelier." }), /* @__PURE__ */ (0, S.jsx)("span", { children: e("STUDIO INDÉPENDANT · DÉMO", "INDEPENDENT STUDIO · DEMO") })]
			}),
			/* @__PURE__ */ (0, S.jsxs)("div", {
				className: "sg-editorial-hero",
				children: [/* @__PURE__ */ (0, S.jsxs)("h3", { children: [
					" ",
					e("Des idées", "Ideas"),
					" ",
					/* @__PURE__ */ (0, S.jsx)("br", {}),
					" ",
					e("qui prennent", "taking"),
					" ",
					/* @__PURE__ */ (0, S.jsx)("em", { children: e("forme.", "shape.") })
				] }), /* @__PURE__ */ (0, S.jsxs)("div", {
					className: "sg-sculpture",
					"aria-hidden": "true",
					children: [
						/* @__PURE__ */ (0, S.jsx)("i", {}),
						/* @__PURE__ */ (0, S.jsx)("i", {}),
						/* @__PURE__ */ (0, S.jsx)("i", {})
					]
				})]
			}),
			/* @__PURE__ */ (0, S.jsx)("div", {
				className: "sg-mini-controls",
				"aria-label": e("Discipline des projets", "Project discipline"),
				children: [
					"all",
					"identity",
					"editorial"
				].map((e) => /* @__PURE__ */ (0, S.jsx)("button", {
					type: "button",
					"aria-pressed": t === e,
					onClick: () => r(e),
					children: i[e]
				}, i[e]))
			}),
			/* @__PURE__ */ (0, S.jsx)("ul", {
				className: "sg-portfolio-list",
				"aria-label": e("Projets démo", "Demo projects"),
				children: a.filter((e) => t === "all" || e.category === t).map((e) => /* @__PURE__ */ (0, S.jsxs)("li", { children: [
					/* @__PURE__ */ (0, S.jsx)("span", {
						className: `sg-project-art sg-art-${e.tone}`,
						"aria-hidden": "true"
					}),
					/* @__PURE__ */ (0, S.jsx)("b", { children: e.name }),
					/* @__PURE__ */ (0, S.jsx)("small", { children: i[e.category] })
				] }, e.name))
			})
		]
	});
}
function Ae(e = "en") {
	return {
		week: {
			label: c("7 jours", "7 days", void 0, e),
			total: new Intl.NumberFormat(e).format(1284),
			change: new Intl.NumberFormat(e, {
				style: "percent",
				signDisplay: "always"
			}).format(.12),
			bars: [
				34,
				48,
				40,
				65,
				54,
				79,
				92
			]
		},
		month: {
			label: c("30 jours", "30 days", void 0, e),
			total: new Intl.NumberFormat(e).format(5460),
			change: new Intl.NumberFormat(e, {
				style: "percent",
				signDisplay: "always"
			}).format(.18),
			bars: [
				46,
				68,
				52,
				86,
				66,
				74,
				98
			]
		}
	};
}
function je() {
	let { locale: e, t } = n(), [r, i] = (0, w.useState)("week"), a = Ae(e)[r];
	return /* @__PURE__ */ (0, S.jsxs)("div", {
		className: "sg-preview sg-pulse",
		children: [
			/* @__PURE__ */ (0, S.jsxs)("div", {
				className: "sg-mini-nav",
				children: [/* @__PURE__ */ (0, S.jsxs)("b", { children: [/* @__PURE__ */ (0, S.jsx)("span", {
					"aria-hidden": "true",
					children: "◈"
				}), " pulse"] }), /* @__PURE__ */ (0, S.jsx)("span", { children: t("ESPACE DÉMO", "DEMO WORKSPACE") })]
			}),
			/* @__PURE__ */ (0, S.jsxs)("div", {
				className: "sg-dashboard-heading",
				children: [/* @__PURE__ */ (0, S.jsxs)("div", { children: [/* @__PURE__ */ (0, S.jsx)("small", { children: t("VUE D’ENSEMBLE", "OVERVIEW") }), /* @__PURE__ */ (0, S.jsx)("h3", { children: t("Chaque signal compte.", "Every signal matters.") })] }), /* @__PURE__ */ (0, S.jsx)("div", {
					className: "sg-mini-controls",
					"aria-label": t("Période des données démo", "Demo data period"),
					children: ["week", "month"].map((t) => /* @__PURE__ */ (0, S.jsx)("button", {
						type: "button",
						"aria-pressed": r === t,
						onClick: () => i(t),
						children: Ae(e)[t].label
					}, t))
				})]
			}),
			/* @__PURE__ */ (0, S.jsxs)("div", {
				className: "sg-metrics",
				children: [/* @__PURE__ */ (0, S.jsxs)("div", { children: [
					/* @__PURE__ */ (0, S.jsxs)("span", { children: [
						t("Visites ·", "Visits ·"),
						" ",
						a.label
					] }),
					/* @__PURE__ */ (0, S.jsx)("strong", {
						"aria-live": "polite",
						children: a.total
					}),
					/* @__PURE__ */ (0, S.jsxs)("small", { children: [
						a.change,
						" ",
						t("· données fictives", "· sample data")
					] })
				] }), /* @__PURE__ */ (0, S.jsxs)("div", { children: [
					/* @__PURE__ */ (0, S.jsx)("span", { children: t("Objectif de la démo", "Demo target") }),
					/* @__PURE__ */ (0, S.jsxs)("strong", { children: ["78", /* @__PURE__ */ (0, S.jsx)("small", { children: " %" })] }),
					/* @__PURE__ */ (0, S.jsx)("span", {
						className: "sg-meter",
						"aria-hidden": "true"
					})
				] })]
			}),
			/* @__PURE__ */ (0, S.jsx)("div", {
				className: "sg-chart",
				role: "img",
				"aria-label": t("Tendance illustrative sur {period}, {total} visites fictives", "Illustrative trend over {period}, {total} sample visits", {
					period: a.label,
					total: a.total
				}),
				children: a.bars.map((e, t) => /* @__PURE__ */ (0, S.jsx)("span", { style: { height: `${e}%` } }, t))
			}),
			/* @__PURE__ */ (0, S.jsxs)("div", {
				className: "sg-chart-caption",
				children: [/* @__PURE__ */ (0, S.jsx)("span", { children: t("Début de période", "Start of period") }), /* @__PURE__ */ (0, S.jsx)("span", { children: t("Aujourd’hui · démo", "Today · demo") })]
			})
		]
	});
}
function Me() {
	let { locale: e, t } = n(), [r, i] = (0, w.useState)(0);
	return /* @__PURE__ */ (0, S.jsxs)("div", {
		className: "sg-preview sg-rivage",
		children: [
			/* @__PURE__ */ (0, S.jsxs)("div", {
				className: "sg-mini-nav",
				children: [/* @__PURE__ */ (0, S.jsx)("b", { children: "RIVAGE" }), /* @__PURE__ */ (0, S.jsx)("span", { children: t("OBJETS DU QUOTIDIEN · DÉMO", "EVERYDAY OBJECTS · DEMO") })]
			}),
			/* @__PURE__ */ (0, S.jsxs)("div", {
				className: "sg-commerce-hero",
				children: [/* @__PURE__ */ (0, S.jsxs)("div", { children: [
					/* @__PURE__ */ (0, S.jsx)("small", { children: t("LA COLLECTION CALME", "THE QUIET COLLECTION") }),
					/* @__PURE__ */ (0, S.jsxs)("h3", { children: [
						" ",
						t("Faire place", "Make room"),
						" ",
						/* @__PURE__ */ (0, S.jsx)("br", {}),
						t("à l’essentiel.", "for what matters."),
						" "
					] }),
					/* @__PURE__ */ (0, S.jsxs)("p", { children: [
						" ",
						t("Des formes simples.", "Simple forms."),
						" ",
						/* @__PURE__ */ (0, S.jsx)("br", {}),
						" ",
						t("Des jours plus doux.", "Gentler days."),
						" "
					] })
				] }), /* @__PURE__ */ (0, S.jsxs)("div", {
					className: "sg-vase-scene",
					"aria-hidden": "true",
					children: [
						/* @__PURE__ */ (0, S.jsx)("i", { className: "sg-vase" }),
						/* @__PURE__ */ (0, S.jsx)("i", { className: "sg-branch" }),
						/* @__PURE__ */ (0, S.jsx)("i", { className: "sg-sun" })
					]
				})]
			}),
			/* @__PURE__ */ (0, S.jsxs)("div", {
				className: "sg-product",
				children: [
					/* @__PURE__ */ (0, S.jsxs)("div", { children: [/* @__PURE__ */ (0, S.jsx)("strong", { children: t("Vase Sillage", "Sillage vase") }), /* @__PURE__ */ (0, S.jsx)("span", { children: t("Grès naturel · objet fictif", "Natural stoneware · sample item") })] }),
					/* @__PURE__ */ (0, S.jsx)("b", { children: new Intl.NumberFormat(e, {
						style: "currency",
						currency: "EUR",
						maximumFractionDigits: 0
					}).format(48) }),
					/* @__PURE__ */ (0, S.jsxs)("button", {
						type: "button",
						onClick: () => i((e) => Math.min(9, e + 1)),
						disabled: r === 9,
						children: [
							" ",
							t("Ajouter à la sélection", "Add to selection"),
							" "
						]
					})
				]
			}),
			/* @__PURE__ */ (0, S.jsxs)("div", {
				className: "sg-selection",
				children: [/* @__PURE__ */ (0, S.jsxs)("p", {
					role: "status",
					children: [
						" ",
						t("Sélection démo :", "Demo selection:"),
						" ",
						r,
						" ",
						r === 1 ? t("objet", "item") : t("objets", "items"),
						" ",
						t("· aucune commande", "· no order placed"),
						" "
					]
				}), /* @__PURE__ */ (0, S.jsxs)("button", {
					type: "button",
					disabled: r === 0,
					onClick: () => i((e) => Math.max(0, e - 1)),
					children: [
						" ",
						t("Retirer un objet", "Remove an item"),
						" "
					]
				})]
			})
		]
	});
}
function Ne() {
	let { t: e } = n(), [t, r] = (0, w.useState)("Mardi"), i = {
		Mardi: e("Mardi", "Tuesday"),
		Mercredi: e("Mercredi", "Wednesday"),
		Jeudi: e("Jeudi", "Thursday")
	}, [a, o] = (0, w.useState)(null);
	return /* @__PURE__ */ (0, S.jsxs)("div", {
		className: "sg-preview sg-pause",
		children: [/* @__PURE__ */ (0, S.jsxs)("div", {
			className: "sg-mini-nav",
			children: [/* @__PURE__ */ (0, S.jsxs)("b", { children: ["pause", /* @__PURE__ */ (0, S.jsx)("span", {
				"aria-hidden": "true",
				children: " ✳"
			})] }), /* @__PURE__ */ (0, S.jsx)("span", { children: e("STUDIO BIEN-ÊTRE · DÉMO", "WELLNESS STUDIO · DEMO") })]
		}), /* @__PURE__ */ (0, S.jsxs)("div", {
			className: "sg-booking-layout",
			children: [/* @__PURE__ */ (0, S.jsxs)("div", { children: [
				/* @__PURE__ */ (0, S.jsx)("span", {
					className: "sg-booking-flower",
					"aria-hidden": "true",
					children: "✳"
				}),
				/* @__PURE__ */ (0, S.jsxs)("h3", { children: [
					" ",
					e("Un moment.", "A moment."),
					" ",
					/* @__PURE__ */ (0, S.jsx)("br", {}),
					" ",
					e("Juste pour vous.", "Just for you."),
					" "
				] }),
				/* @__PURE__ */ (0, S.jsxs)("p", { children: [
					" ",
					e("Séance découverte", "Introductory session"),
					" ",
					/* @__PURE__ */ (0, S.jsx)("br", {}),
					/* @__PURE__ */ (0, S.jsx)("strong", { children: "45 minutes" })
				] })
			] }), /* @__PURE__ */ (0, S.jsxs)("div", {
				className: "sg-booking-picker",
				children: [
					/* @__PURE__ */ (0, S.jsx)("h4", { children: e("Votre prochain rendez-vous", "Your next appointment") }),
					/* @__PURE__ */ (0, S.jsx)("div", {
						className: "sg-mini-controls",
						"aria-label": e("Jour de démonstration", "Demo day"),
						children: [
							"Mardi",
							"Mercredi",
							"Jeudi"
						].map((e) => /* @__PURE__ */ (0, S.jsx)("button", {
							type: "button",
							"aria-pressed": t === e,
							onClick: () => {
								r(e), o(null);
							},
							children: i[e] ?? e
						}, i[e] ?? e))
					}),
					/* @__PURE__ */ (0, S.jsxs)("p", { children: [
						e("Créneaux fictifs ·", "Sample time slots ·"),
						" ",
						i[t]
					] }),
					/* @__PURE__ */ (0, S.jsx)("div", {
						className: "sg-slots",
						"aria-label": e("Créneau de démonstration", "Demo time slot"),
						children: [
							"10:00",
							"11:30",
							"14:00",
							"16:30"
						].map((e) => /* @__PURE__ */ (0, S.jsx)("button", {
							type: "button",
							"aria-pressed": a === e,
							onClick: () => o(e),
							children: i[e] ?? e
						}, i[e] ?? e))
					}),
					/* @__PURE__ */ (0, S.jsx)("p", {
						className: "sg-booking-result",
						role: "status",
						children: a ? e("{day} à {time} sélectionné dans la démo.", "{day} at {time} selected in the demo.", {
							day: i[t],
							time: a
						}) : e("Choisissez un créneau pour essayer.", "Choose a time slot to try it.")
					}),
					/* @__PURE__ */ (0, S.jsx)("small", { children: e("Aucune réservation envoyée.", "No booking submitted.") })
				]
			})]
		})]
	});
}
function Pe() {
	let { t: e } = n(), [t, r] = (0, w.useState)(0), i = [
		e("À faire", "To do"),
		e("En cours", "In progress"),
		e("Terminé", "Done")
	];
	return /* @__PURE__ */ (0, S.jsxs)("div", {
		className: "sg-preview sg-collectif",
		children: [
			/* @__PURE__ */ (0, S.jsxs)("div", {
				className: "sg-mini-nav",
				children: [/* @__PURE__ */ (0, S.jsxs)("b", { children: ["collectif", /* @__PURE__ */ (0, S.jsx)("span", {
					"aria-hidden": "true",
					children: " ▪"
				})] }), /* @__PURE__ */ (0, S.jsx)("span", { children: e("TABLEAU DÉMO", "DEMO BOARD") })]
			}),
			/* @__PURE__ */ (0, S.jsxs)("div", {
				className: "sg-board-heading",
				children: [/* @__PURE__ */ (0, S.jsxs)("div", { children: [/* @__PURE__ */ (0, S.jsx)("small", { children: e("NOTRE PROCHAIN CHAPITRE", "OUR NEXT CHAPTER") }), /* @__PURE__ */ (0, S.jsx)("h3", { children: e("Lancement du studio", "Studio launch") })] }), /* @__PURE__ */ (0, S.jsxs)("span", {
					className: "sg-avatars",
					"aria-hidden": "true",
					children: [
						/* @__PURE__ */ (0, S.jsx)("i", { children: "AM" }),
						/* @__PURE__ */ (0, S.jsx)("i", { children: "JL" }),
						/* @__PURE__ */ (0, S.jsx)("i", { children: "SO" })
					]
				})]
			}),
			/* @__PURE__ */ (0, S.jsx)("div", {
				className: "sg-board",
				children: i.map((n, i) => /* @__PURE__ */ (0, S.jsxs)("section", {
					"aria-label": n,
					children: [/* @__PURE__ */ (0, S.jsxs)("h4", { children: [
						/* @__PURE__ */ (0, S.jsx)("span", {
							"aria-hidden": "true",
							children: "●"
						}),
						" ",
						n
					] }), t === i ? /* @__PURE__ */ (0, S.jsxs)("div", {
						className: "sg-task",
						children: [
							/* @__PURE__ */ (0, S.jsx)("small", { children: "DESIGN" }),
							/* @__PURE__ */ (0, S.jsx)("strong", { children: e("Esquisser la page d’accueil", "Sketch the homepage") }),
							/* @__PURE__ */ (0, S.jsx)("p", { children: e("Clarifier le premier regard.", "Clarify the first impression.") }),
							t < 2 ? /* @__PURE__ */ (0, S.jsx)("button", {
								type: "button",
								onClick: () => r((e) => e + 1),
								children: t === 0 ? e("Commencer", "Start") : e("Terminer", "Finish")
							}) : /* @__PURE__ */ (0, S.jsx)("span", { children: e("Terminé dans la démo", "Completed in the demo") })
						]
					}) : /* @__PURE__ */ (0, S.jsx)("p", {
						className: "sg-column-empty",
						children: e("Place aux idées", "Room for ideas")
					})]
				}, n))
			}),
			/* @__PURE__ */ (0, S.jsxs)("div", {
				className: "sg-board-footer",
				children: [/* @__PURE__ */ (0, S.jsxs)("p", {
					role: "status",
					children: [
						e("Tâche démo :", "Demo task:"),
						" ",
						i[t]
					]
				}), /* @__PURE__ */ (0, S.jsxs)("button", {
					type: "button",
					onClick: () => r(0),
					disabled: t === 0,
					children: [
						" ",
						e("Réinitialiser", "Reset"),
						" "
					]
				})]
			})
		]
	});
}
function Q(e = "en") {
	return [
		{
			eyebrow: c("01 / L’INTENTION", "01 / THE INTENTION", void 0, e),
			title: /* @__PURE__ */ (0, S.jsxs)(S.Fragment, { children: [
				" ",
				c("Moins de bruit.", "Less noise.", void 0, e),
				" ",
				/* @__PURE__ */ (0, S.jsx)("br", {}),
				/* @__PURE__ */ (0, S.jsx)("em", { children: c("Plus d’idées.", "More ideas.", void 0, e) })
			] }),
			note: c("Une autre façon de raconter ce qui compte.", "Another way to tell the stories that matter.", void 0, e)
		},
		{
			eyebrow: c("02 / LE CHEMIN", "02 / THE PATH", void 0, e),
			title: /* @__PURE__ */ (0, S.jsxs)(S.Fragment, { children: [
				" ",
				c("Voir plus clair.", "See more clearly.", void 0, e),
				" ",
				/* @__PURE__ */ (0, S.jsx)("br", {}),
				/* @__PURE__ */ (0, S.jsx)("em", { children: c("Faire ensemble.", "Create together.", void 0, e) })
			] }),
			note: c("Observer. Choisir. Donner forme.", "Observe. Choose. Shape.", void 0, e)
		},
		{
			eyebrow: c("03 / LA SUITE", "03 / WHAT’S NEXT", void 0, e),
			title: /* @__PURE__ */ (0, S.jsxs)(S.Fragment, { children: [
				" ",
				c("Une idée suffit.", "One idea is enough.", void 0, e),
				" ",
				/* @__PURE__ */ (0, S.jsx)("br", {}),
				/* @__PURE__ */ (0, S.jsx)("em", { children: c("À vous la suite.", "Your turn to continue.", void 0, e) })
			] }),
			note: c("Quel changement voulez-vous rendre possible ?", "What change do you want to make possible?", void 0, e)
		}
	];
}
function Fe() {
	let { locale: e, t } = n(), [r, i] = (0, w.useState)(0), a = Q(e)[r];
	return /* @__PURE__ */ (0, S.jsxs)("div", {
		className: "sg-preview sg-perspective",
		children: [
			/* @__PURE__ */ (0, S.jsxs)("div", {
				className: "sg-mini-nav",
				children: [/* @__PURE__ */ (0, S.jsx)("b", { children: "perspective /" }), /* @__PURE__ */ (0, S.jsx)("span", { children: t("PRÉSENTATION DÉMO", "DEMO PRESENTATION") })]
			}),
			/* @__PURE__ */ (0, S.jsxs)("div", {
				className: "sg-slide-body",
				"aria-live": "polite",
				children: [
					/* @__PURE__ */ (0, S.jsx)("small", { children: a.eyebrow }),
					/* @__PURE__ */ (0, S.jsx)("h3", { children: a.title }),
					/* @__PURE__ */ (0, S.jsx)("p", { children: a.note }),
					/* @__PURE__ */ (0, S.jsx)("span", {
						className: "sg-slide-orbit",
						"aria-hidden": "true"
					})
				]
			}),
			/* @__PURE__ */ (0, S.jsxs)("div", {
				className: "sg-slide-controls",
				children: [/* @__PURE__ */ (0, S.jsxs)("span", { children: [
					" ",
					t("Diapositive", "Slide"),
					" ",
					r + 1,
					" ",
					t("sur", "of"),
					" ",
					Q(e).length
				] }), /* @__PURE__ */ (0, S.jsxs)("div", { children: [/* @__PURE__ */ (0, S.jsx)("button", {
					type: "button",
					"aria-label": t("Diapositive précédente", "Previous slide"),
					disabled: r === 0,
					onClick: () => i((e) => e - 1),
					children: "←"
				}), /* @__PURE__ */ (0, S.jsx)("button", {
					type: "button",
					"aria-label": t("Diapositive suivante", "Next slide"),
					disabled: r === Q(e).length - 1,
					onClick: () => i((e) => e + 1),
					children: "→"
				})] })]
			})
		]
	});
}
var Ie = {
	atelier: ke,
	pulse: je,
	rivage: Me,
	pause: Ne,
	collectif: Pe,
	perspective: Fe
};
function Le({ starter: e, onOpen: t }) {
	let { t: r } = n(), i = Ie[e.id];
	return /* @__PURE__ */ (0, S.jsxs)("article", {
		className: "sg-card",
		children: [/* @__PURE__ */ (0, S.jsx)("div", {
			className: "sg-thumbnail",
			"aria-hidden": "true",
			inert: !0,
			children: /* @__PURE__ */ (0, S.jsx)(i, {})
		}), /* @__PURE__ */ (0, S.jsxs)("button", {
			type: "button",
			className: "sg-card-open",
			"aria-label": r("Explorer {title}", "Explore {title}", { title: e.title }),
			onClick: (n) => t(e, n.currentTarget),
			children: [/* @__PURE__ */ (0, S.jsxs)("span", { children: [/* @__PURE__ */ (0, S.jsx)("strong", { children: e.title }), /* @__PURE__ */ (0, S.jsx)("small", { children: e.description })] }), /* @__PURE__ */ (0, S.jsx)("span", {
				className: "sg-card-arrow",
				"aria-hidden": "true",
				children: "↗"
			})]
		})]
	});
}
function Re({ onChoose: e }) {
	let { locale: t, t: r } = n(), [i, a] = (0, w.useState)(""), [o, s] = (0, w.useState)("all"), [c, l] = (0, w.useState)(null), u = Ee(t).find((e) => e.id === c) ?? null, d = (0, w.useRef)(null), f = (0, w.useRef)(null), p = (0, w.useRef)(null), m = (0, w.useId)(), h = (0, w.useId)(), g = (0, w.useId)(), _ = Oe(i, o, t), v = u ? Ie[u.id] : null;
	(0, w.useEffect)(() => {
		if (!c || !d.current) return;
		let e = d.current;
		e.open || e.showModal(), e.querySelector(".sg-close")?.focus();
		let t = document.documentElement.style.overflow;
		return document.documentElement.style.overflow = "hidden", () => {
			document.documentElement.style.overflow = t;
		};
	}, [c]);
	function y(e, t) {
		f.current = t, p.current = null, l(e.id);
	}
	function b() {
		let t = p.current;
		p.current = null, l(null), f.current?.focus(), t && e(t);
	}
	return /* @__PURE__ */ (0, S.jsxs)("section", {
		className: "starter-gallery",
		"aria-labelledby": m,
		children: [
			/* @__PURE__ */ (0, S.jsxs)("div", {
				className: "sg-heading",
				children: [/* @__PURE__ */ (0, S.jsxs)("div", { children: [
					/* @__PURE__ */ (0, S.jsx)("span", {
						className: "sg-eyebrow",
						children: r("POINTS DE DÉPART", "STARTING POINTS")
					}),
					/* @__PURE__ */ (0, S.jsx)("h2", {
						id: m,
						children: r("Une inspiration, votre interprétation.", "An inspiration, your interpretation.")
					}),
					/* @__PURE__ */ (0, S.jsx)("p", { children: r("Explorez une idée en action, puis faites-en la vôtre.", "Explore an idea in action, then make it yours.") })
				] }), /* @__PURE__ */ (0, S.jsxs)("label", {
					className: "sg-search",
					children: [
						/* @__PURE__ */ (0, S.jsx)("span", {
							className: "sg-sr",
							children: r("Rechercher une inspiration", "Search for inspiration")
						}),
						/* @__PURE__ */ (0, S.jsx)("span", {
							"aria-hidden": "true",
							children: "⌕"
						}),
						/* @__PURE__ */ (0, S.jsx)("input", {
							type: "search",
							name: "starter-search",
							autoComplete: "off",
							placeholder: r("Portfolio, boutique…", "Portfolio, shop…"),
							value: i,
							onChange: (e) => a(e.target.value)
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, S.jsxs)("div", {
				className: "sg-toolbar",
				children: [/* @__PURE__ */ (0, S.jsx)("div", {
					className: "sg-filters",
					"aria-label": r("Catégories d’inspiration", "Inspiration categories"),
					children: Te(t).map((e) => /* @__PURE__ */ (0, S.jsx)("button", {
						type: "button",
						"aria-pressed": o === e.id,
						onClick: () => s(e.id),
						children: e.label
					}, e.id))
				}), /* @__PURE__ */ (0, S.jsxs)("p", {
					role: "status",
					children: [
						_.length,
						" ",
						_.length === 1 ? "inspiration" : "inspirations"
					]
				})]
			}),
			/* @__PURE__ */ (0, S.jsx)("div", {
				className: "sg-grid",
				children: _.map((e) => /* @__PURE__ */ (0, S.jsx)(Le, {
					starter: e,
					onOpen: y
				}, e.id))
			}),
			_.length === 0 ? /* @__PURE__ */ (0, S.jsxs)("div", {
				className: "sg-empty",
				children: [
					/* @__PURE__ */ (0, S.jsx)("h3", { children: r("Aucune inspiration trouvée", "No inspiration found") }),
					/* @__PURE__ */ (0, S.jsx)("p", { children: r("Essayez un autre mot ou explorez toutes les catégories.", "Try another word or explore all categories.") }),
					/* @__PURE__ */ (0, S.jsxs)("button", {
						type: "button",
						onClick: () => {
							a(""), s("all");
						},
						children: [
							" ",
							r("Voir toutes les inspirations", "See all inspirations"),
							" "
						]
					})
				]
			}) : null,
			/* @__PURE__ */ (0, S.jsxs)("p", {
				className: "sg-note",
				children: [
					" ",
					r("Aperçus interactifs avec données de démonstration. Votre choix prépare une idée à adapter, pas une application déjà construite.", "Interactive previews with sample data. Your choice prepares an idea to adapt, not a finished application."),
					" "
				]
			}),
			/* @__PURE__ */ (0, S.jsxs)("dialog", {
				ref: d,
				className: "sg-dialog",
				"aria-labelledby": h,
				"aria-describedby": g,
				onClose: b,
				onCancel: (e) => {
					e.preventDefault(), d.current?.close();
				},
				children: [
					/* @__PURE__ */ (0, S.jsxs)("header", {
						className: "sg-dialog-heading",
						children: [/* @__PURE__ */ (0, S.jsxs)("div", { children: [/* @__PURE__ */ (0, S.jsx)("span", {
							className: "sg-eyebrow",
							children: r("EXPLORER UNE INSPIRATION", "EXPLORE AN INSPIRATION")
						}), /* @__PURE__ */ (0, S.jsx)("h2", {
							id: h,
							children: u?.title
						})] }), /* @__PURE__ */ (0, S.jsx)("button", {
							className: "sg-close",
							type: "button",
							"aria-label": r("Fermer l’aperçu", "Close preview"),
							onClick: () => d.current?.close(),
							children: "×"
						})]
					}),
					/* @__PURE__ */ (0, S.jsxs)("div", {
						className: "sg-demo-note",
						id: g,
						children: [/* @__PURE__ */ (0, S.jsx)("span", { children: r("Démo interactive", "Interactive demo") }), /* @__PURE__ */ (0, S.jsxs)("p", { children: [
							u?.interaction,
							" ",
							r("Les changements restent dans cet aperçu.", "Changes stay within this preview.")
						] })]
					}),
					/* @__PURE__ */ (0, S.jsx)("div", {
						className: "sg-live-preview",
						children: v ? /* @__PURE__ */ (0, S.jsx)(v, {}, u?.id) : null
					}),
					/* @__PURE__ */ (0, S.jsxs)("footer", {
						className: "sg-dialog-footer",
						children: [/* @__PURE__ */ (0, S.jsxs)("p", { children: [
							" ",
							r("Cette inspiration prépare votre brief et sa direction visuelle.", "This inspiration prepares your brief and visual direction."),
							" ",
							/* @__PURE__ */ (0, S.jsx)("br", {}),
							" ",
							r("Aucun modèle source n’est importé.", "No source template is imported."),
							" "
						] }), /* @__PURE__ */ (0, S.jsxs)("button", {
							type: "button",
							className: "sg-use",
							onClick: () => {
								u && !p.current && (p.current = { ...u.seed }, d.current?.close());
							},
							children: [
								" ",
								r("Utiliser cette idée", "Use this idea"),
								" ",
								/* @__PURE__ */ (0, S.jsx)("span", {
									"aria-hidden": "true",
									children: "↗"
								})
							]
						})]
					})
				]
			})
		]
	});
}
//#endregion
//#region studio-ui/src/features/home/components/HomeView.tsx
function ze(e) {
	let { t } = n(), r = L(e), [i, a] = (0, w.useState)({
		open: !1,
		kind: "new"
	}), o = (0, w.useRef)(null), s = (0, w.useRef)(null), [c, l] = (0, w.useState)(), [u, d] = (0, w.useState)("composer"), [f, p] = (0, w.useState)(null), m = (0, w.useRef)(!1), h = u === "composer" ? r.operation : {
		phase: r.operation.phase,
		project: null,
		error: ""
	}, g = W({
		operation: h,
		onSubmit: (e, t) => {
			d("composer"), r.run(e, t);
		},
		onEdit: r.clearOperation,
		seed: c
	}), _ = g.busy;
	async function v(e) {
		if (_ || m.current) return;
		m.current = !0, p(null), g.approveDeparture(), d("project");
		let t = await r.run(e);
		m.current = !1, t || g.cancelDeparture();
	}
	function y(e) {
		_ || m.current || (g.hasUnsavedContent ? (i.open || (o.current = document.activeElement), p(e)) : v(e));
	}
	function b() {
		p(null), i.open || o.current?.focus();
	}
	function x(e, t) {
		_ || (o.current = t, d("project"), r.clearOperation(), a({
			open: !0,
			kind: e
		}));
	}
	function T() {
		_ || (a((e) => ({
			...e,
			open: !1
		})), o.current?.focus());
	}
	return /* @__PURE__ */ (0, S.jsxs)("div", {
		className: "home-shell",
		children: [
			/* @__PURE__ */ (0, S.jsxs)("a", {
				className: "home-skip",
				href: "#home-main",
				children: [
					" ",
					t("Aller aux projets", "Skip to projects"),
					" "
				]
			}),
			/* @__PURE__ */ (0, S.jsxs)("header", {
				className: "home-header",
				children: [/* @__PURE__ */ (0, S.jsxs)("a", {
					className: "home-brand",
					href: "/",
					"aria-label": t("DevMethod, accueil", "DevMethod home"),
					children: [/* @__PURE__ */ (0, S.jsxs)("span", {
						className: "home-mark",
						"aria-hidden": "true",
						children: ["D", /* @__PURE__ */ (0, S.jsx)("span", { children: "·" })]
					}), /* @__PURE__ */ (0, S.jsxs)("span", { children: ["DevMethod ", /* @__PURE__ */ (0, S.jsx)("small", { children: "Studio" })] })]
				}), /* @__PURE__ */ (0, S.jsxs)("nav", {
					className: "home-nav",
					"aria-label": t("Accueil", "Home"),
					children: [
						/* @__PURE__ */ (0, S.jsx)(C, {}),
						/* @__PURE__ */ (0, S.jsx)("a", {
							href: "#home-recents-title",
							children: t("Mes projets", "My projects")
						}),
						/* @__PURE__ */ (0, S.jsx)("a", {
							href: "#home-inspirations",
							children: t("Galerie", "Gallery")
						}),
						/* @__PURE__ */ (0, S.jsxs)("span", {
							className: "home-local",
							children: [
								/* @__PURE__ */ (0, S.jsx)("span", { "aria-hidden": "true" }),
								" ",
								t("Espace local", "Local workspace"),
								" "
							]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, S.jsxs)("main", {
				id: "home-main",
				children: [
					/* @__PURE__ */ (0, S.jsxs)("section", {
						className: "home-hero",
						"aria-labelledby": "home-title",
						children: [
							/* @__PURE__ */ (0, S.jsx)("span", {
								className: "home-eyebrow",
								children: t("L’espace où vos idées prennent forme", "Where your ideas take shape")
							}),
							/* @__PURE__ */ (0, S.jsxs)("h1", {
								id: "home-title",
								children: [
									" ",
									t("Que voulez-vous", "What would you like to"),
									" ",
									/* @__PURE__ */ (0, S.jsx)("span", { children: t("créer ?", "create?") })
								]
							}),
							/* @__PURE__ */ (0, S.jsxs)("p", { children: [
								" ",
								t("Un site, une application, une nouvelle façon de travailler.", "A website, an app, a new way to work."),
								" ",
								/* @__PURE__ */ (0, S.jsx)("br", { className: "home-title-break" }),
								" ",
								t("Décrivez votre idée et construisons la suite.", "Describe your idea and let’s build what comes next."),
								" "
							] }),
							/* @__PURE__ */ (0, S.jsx)(we, {
								operation: h,
								composer: g
							}),
							/* @__PURE__ */ (0, S.jsxs)("div", {
								className: "home-start-alternatives",
								children: [
									/* @__PURE__ */ (0, S.jsx)("span", { children: t("Ou partez de l’existant", "Or start with what you have") }),
									/* @__PURE__ */ (0, S.jsxs)("button", {
										type: "button",
										disabled: _,
										onClick: (e) => x("imported", e.currentTarget),
										children: [
											/* @__PURE__ */ (0, S.jsx)(G, { kind: "imported" }),
											" ",
											t("Importer un projet", "Import a project"),
											" "
										]
									}),
									/* @__PURE__ */ (0, S.jsxs)("button", {
										type: "button",
										disabled: _,
										onClick: (e) => {
											r.projects.length && s.current ? (s.current.scrollIntoView?.({ block: "center" }), s.current.focus()) : x("existing", e.currentTarget);
										},
										children: [
											/* @__PURE__ */ (0, S.jsx)(G, { kind: "existing" }),
											" ",
											t("Reprendre un projet", "Resume a project"),
											" "
										]
									})
								]
							})
						]
					}),
					!i.open && u === "project" && r.operation.error ? /* @__PURE__ */ (0, S.jsx)("p", {
						role: "alert",
						className: "home-error",
						children: r.operation.error
					}) : null,
					!i.open && u === "project" && _ ? /* @__PURE__ */ (0, S.jsx)("p", {
						role: "status",
						className: "home-opening",
						children: t("Ouverture de « {name} »…", "Opening “{name}”…", { name: r.operation.project?.name ?? "" })
					}) : null,
					/* @__PURE__ */ (0, S.jsx)(pe, {
						projects: r.projects,
						loading: r.loading,
						error: r.loadError,
						busy: _,
						searchRef: s,
						onRefresh: () => void r.refresh(),
						onOpen: y,
						onOther: (e) => x("existing", e)
					}),
					/* @__PURE__ */ (0, S.jsx)("div", {
						id: "home-inspirations",
						children: /* @__PURE__ */ (0, S.jsx)(Re, { onChoose: (e) => {
							r.clearOperation(), l((t) => ({
								...e,
								id: (t?.id ?? 0) + 1
							}));
						} })
					})
				]
			}),
			/* @__PURE__ */ (0, S.jsxs)("footer", {
				className: "home-footer",
				children: [
					" ",
					t("Votre espace de création. Vos projets et leurs références restent sur cet ordinateur.", "Your creative workspace. Your projects and references stay on this computer."),
					" "
				]
			}),
			/* @__PURE__ */ (0, S.jsx)(X, {
				...i,
				open: i.open || !!f,
				departure: f ? {
					onCancel: b,
					onConfirm: () => void v(f)
				} : void 0,
				operation: r.operation,
				onDismiss: T,
				onSubmit: y,
				onEdit: r.clearOperation
			})
		]
	});
}
//#endregion
//#region studio-ui/src/home-widget.tsx
function Be(e, t = {}) {
	s(e.ownerDocument, e.ownerDocument.defaultView ?? void 0);
	let n = e.ownerDocument.defaultView ? a(e.ownerDocument, e.ownerDocument.defaultView) : () => {}, r = (0, x.createRoot)(e);
	return r.render(/* @__PURE__ */ (0, S.jsx)(ze, { ...t })), { dispose: () => {
		n(), r.unmount();
	} };
}
var $ = document.getElementById("studio-home");
$ && Be($);
//#endregion
export { Be as mountHomeWidget };
