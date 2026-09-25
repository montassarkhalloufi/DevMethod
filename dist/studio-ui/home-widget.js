import { n as e, r as t, t as n } from "./jsx-runtime-Bz8zB3tG.js";
import { c as r, i, n as a, r as o, s } from "./useMcpSelection-BrYUToXT.js";
import { a as c, n as l, o as u, r as d, t as f, u as p } from "./ConnectorGuide-lY7QqwYz.js";
import "./mcp-BH8zszrc.js";
//#region studio-ui/src/features/home/model/home.ts
var m = t(), h = e(), g = {
	new: "Nouveau projet",
	imported: "Sources importées",
	existing: "Projet Studio"
};
function _(e) {
	let t = e;
	if (!t || ![
		"new",
		"imported",
		"existing"
	].includes(t.kind || "") || ![
		t.id,
		t.name,
		t.workspace,
		t.createdAt
	].every((e) => typeof e == "string" && e.length > 0) || t.lastOpenedAt !== null && typeof t.lastOpenedAt != "string") throw Error("La réponse du projet est illisible. Actualisez pour vérifier son état.");
	return t;
}
function v(e, t) {
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
function y(e) {
	return e.startsWith("/") || /^[a-z]:[\\/]/i.test(e);
}
function b(e) {
	let t = e.kind === "existing" ? "workspace" : "source", n = e[t];
	return n !== void 0 && !y(n) ? {
		field: t,
		message: "Indiquez un chemin absolu, par exemple /Users/vous/mon-projet."
	} : e.kind === "new" && !e.name ? {
		field: "name",
		message: "Donnez un nom au projet."
	} : e.kind === "new" && !e.idea ? {
		field: "idea",
		message: "Décrivez ce que vous voulez faire avancer."
	} : null;
}
function x(e, t) {
	return t.phase === "opening" ? "Ouverture…" : t.phase === "creating" ? e === "imported" ? "Importation…" : "Préparation…" : t.project ? "Réessayer l’ouverture" : {
		new: "Créer et ouvrir",
		imported: "Importer et ouvrir",
		existing: "Reprendre ce projet"
	}[e];
}
function S(e, t) {
	let n = (e) => e.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("fr-FR");
	return n(`${e.name} ${e.workspace}`).includes(n(t.trim()));
}
function C(e) {
	return [...e].sort((e, t) => Date.parse(t.lastOpenedAt || t.createdAt) - Date.parse(e.lastOpenedAt || e.createdAt));
}
function w(e) {
	let t = new Date(e.lastOpenedAt || e.createdAt);
	return Number.isNaN(t.getTime()) ? "Date non disponible" : new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(t);
}
function T(e, t) {
	if (typeof e != "string") throw Error("L’adresse locale du projet est absente.");
	let n = new URL(e);
	if (n.protocol !== "http:" || ![
		"localhost",
		"127.0.0.1",
		"[::1]"
	].includes(n.hostname) || !n.port || n.username || n.password || n.pathname !== "/") throw Error("L’adresse renvoyée ne correspond pas à une session Studio locale.");
	return (t === "new" || t === "imported") && (n.hash = "journey-foundation"), n.href;
}
//#endregion
//#region studio-ui/src/features/home/hooks/useHome.ts
async function E(e, t, n) {
	let r = await fetch("/api/home" + e, {
		...n === void 0 ? { cache: "no-store" } : {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(n)
		},
		credentials: "same-origin",
		signal: AbortSignal.any([t, AbortSignal.timeout(6e4)])
	}), i = await r.json();
	if (!r.ok) throw Error(i.error || "Le service local ne répond pas. Réessayez dans un instant.");
	return i;
}
var D = (e) => e instanceof Error ? e.message : "Action non confirmée. Vous pouvez réessayer.";
function O({ navigate: e }) {
	let [t, n] = (0, m.useState)([]), [r, i] = (0, m.useState)(!0), [a, o] = (0, m.useState)(""), [s, c] = (0, m.useState)({
		phase: "idle",
		project: null,
		error: ""
	}), l = (0, m.useRef)(null), u = (0, m.useRef)(null), d = (0, m.useRef)(/* @__PURE__ */ new Map()), f = (0, m.useCallback)(async () => {
		l.current?.abort();
		let e = new AbortController();
		l.current = e, i(!0), o("");
		try {
			let t = await E("", e.signal);
			if (e.signal.aborted) return;
			if (!Array.isArray(t.projects)) throw Error("La liste des projets est illisible.");
			n(C(t.projects.map(_)));
		} catch (t) {
			e.signal.aborted || o(D(t));
		} finally {
			e.signal.aborted || i(!1);
		}
	}, []);
	(0, m.useEffect)(() => (f(), () => {
		l.current?.abort(), u.current?.abort();
	}), [f]);
	function p(e) {
		l.current?.abort(), i(!1), n((t) => C([e, ...t.filter((t) => t.id !== e.id)]));
	}
	async function h(t, n, r) {
		c({
			phase: "opening",
			project: t,
			error: ""
		});
		let i = await E("/open", n.signal, { id: t.id });
		if (n.signal.aborted) return;
		let a = _(i.project);
		if (a.id !== t.id) throw Error("La session renvoyée appartient à un autre projet.");
		let o = T(i.url, r ? t.kind : void 0);
		return p(a), e ? e(o) : window.location.assign(o), !0;
	}
	async function g(e, t) {
		let n = JSON.stringify(e), r = d.current.get(n);
		if (r || (r = { requestId: crypto.randomUUID() }, d.current.set(n, r)), r.project) return r.project;
		let i = await E("/projects", t.signal, {
			requestId: r.requestId,
			...e
		});
		if (t.signal.aborted) return null;
		let a = _(i.project);
		return r.project = a, p(a), a;
	}
	async function v(e, t) {
		if (u.current) return !1;
		let n = new AbortController();
		u.current = n;
		let r = "id" in e ? e : null, i = !1;
		c({
			phase: r ? "opening" : "creating",
			project: r,
			error: ""
		});
		try {
			"id" in e || (r = await g(e, n), r && t?.()), r && (i = !!await h(r, n, !("id" in e)));
		} catch (e) {
			n.signal.aborted || c({
				phase: "idle",
				project: r,
				error: D(e)
			});
		} finally {
			n.signal.aborted || (u.current = null, i || c((e) => ({
				...e,
				phase: "idle"
			})));
		}
		return i;
	}
	function y() {
		u.current || c({
			phase: "idle",
			project: null,
			error: ""
		});
	}
	return {
		projects: t,
		loading: r,
		loadError: a,
		operation: s,
		refresh: f,
		run: v,
		clearOperation: y
	};
}
//#endregion
//#region studio-ui/src/features/home/hooks/useComposerGuides.ts
var k = (e, t) => u(e) === u(t);
function ee({ busy: e, selected: t, onApply: n, onEdit: r }) {
	let [i, a] = (0, m.useState)(!1), o = c({ enabled: i }), s = l({ enabled: i }), u = d(), [f, p] = (0, m.useState)(null), [h, g] = (0, m.useState)({}), _ = o.guides.find((e) => e.optionId === f) ?? null, v = {
		...Object.fromEntries(Object.values(s.drafts).filter((e) => e.input !== null).map((e) => [e.optionId, {
			input: e.input,
			preparation: null
		}])),
		...h
	}, y = f ? v[f] : void 0;
	function b(t) {
		e || (a(!0), u.reset(), p(t));
	}
	function x(t) {
		e || (u.reset(), g((e) => ({
			...e,
			[t.optionId]: {
				input: t,
				preparation: null
			}
		})), s.edit(t.optionId, t, s.drafts[t.optionId]?.step ?? 0), r());
	}
	async function S(t) {
		if (e) return;
		g((e) => ({
			...e,
			[t.optionId]: {
				input: t,
				preparation: null
			}
		}));
		let n = await u.prepare(t);
		n && g((e) => k(e[t.optionId]?.input, t) ? {
			...e,
			[t.optionId]: {
				input: n.input,
				preparation: n
			}
		} : e);
	}
	function C(t) {
		if (e || y?.preparation !== t) return;
		let r = _?.flows.find((e) => e.id === t.input.flowId);
		r && n(t, r.usage !== "assistant") && p(null);
	}
	function w(e) {
		u.reset(), s.clear(e), g((t) => {
			let n = { ...t };
			return delete n[e], n;
		});
	}
	return {
		...o,
		activeId: f,
		definition: _,
		input: y?.input ?? null,
		preparation: y?.preparation ?? null,
		preparationFor: (e) => h[e]?.preparation ?? null,
		preparing: u.loading,
		preparationError: u.error,
		persistence: s,
		step: f ? s.drafts[f]?.step : void 0,
		setStep: (e) => {
			f && s.edit(f, y?.input ?? null, e);
		},
		hasPendingDraft: Object.values(v).some(({ input: e }) => !k(e, t.find((t) => t.optionId === e.optionId))),
		hasPendingSelection: t.some((e) => {
			let t = v[e.optionId];
			return t && !k(e, t.input);
		}),
		open: b,
		load: () => a(!0),
		change: x,
		prepare: S,
		apply: C,
		forget: w,
		back: () => {
			u.reset(), p(null);
		}
	};
}
//#endregion
//#region studio-ui/src/features/home/model/composer.ts
var A = {
	idea: 16e3,
	design: 2e3,
	connectors: 12,
	attachments: 4,
	attachmentBytes: 2097152,
	links: 5
}, j = [
	{
		id: "website",
		label: "Site web",
		idea: "Créer un site pour présenter mon activité, expliquer mon offre et permettre aux visiteurs de me contacter."
	},
	{
		id: "app",
		label: "Application",
		idea: "Créer une application web pour organiser des informations, les retrouver rapidement et suivre les actions importantes."
	},
	{
		id: "prototype",
		label: "Prototype",
		idea: "Créer un prototype interactif pour tester un parcours clé et recueillir des retours avant de développer la version complète."
	},
	{
		id: "slides",
		label: "Présentation web",
		idea: "Créer une présentation web claire pour exposer un sujet, ses points essentiels et la prochaine étape attendue."
	}
], M = [
	{
		title: "Sobre et précis",
		description: "Une composition épurée, une typographie lisible et des accents mesurés."
	},
	{
		title: "Éditorial",
		description: "Une hiérarchie typographique affirmée, de grandes images et un rythme de lecture soigné."
	},
	{
		title: "Chaleureux",
		description: "Des couleurs douces, des formes accueillantes et des espaces généreux."
	},
	{
		title: "Audacieux",
		description: "Des contrastes marqués, des titres expressifs et une identité graphique assumée."
	}
];
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
function N(e) {
	return !!(e.idea.trim() || e.name.trim() || e.design.trim() || e.connectors.length || e.connectorGuides.length || e.mcpConnectionIds.length || e.links.length || e.attachments.length);
}
function P(e, t) {
	return t ? "Lecture des références…" : e.phase === "opening" ? "Ouverture du projet…" : e.phase === "creating" ? "Préparation du projet…" : e.project ? "Réessayer l’ouverture" : "Démarrer le projet";
}
function ne(e, t) {
	let n = e.idea.trim() ? `${e.idea}\n\n${t.idea}` : t.idea;
	return n.length > A.idea ? {
		draft: e,
		error: "Cette inspiration dépasse la place disponible. Raccourcissez votre demande avant de l’ajouter."
	} : {
		draft: {
			...e,
			idea: n,
			projectType: t.projectType,
			design: t.design ?? e.design
		},
		error: ""
	};
}
function re(e) {
	let t;
	try {
		t = new URL(e.trim());
	} catch {
		throw Error("Ajoutez une adresse complète, par exemple https://exemple.fr.");
	}
	if (!["http:", "https:"].includes(t.protocol) || t.username || t.password || e.includes("\\")) throw Error("Utilisez un lien HTTP ou HTTPS sans identifiant ni mot de passe.");
	if (t.href.length > 2e3) throw Error("Ce lien dépasse 2 000 caractères.");
	return t.href;
}
function F(e) {
	let t = e.name.toLowerCase().split(".").at(-1), n = t === "md" ? "text/markdown" : e.type || (t === "txt" ? "text/plain" : "");
	if (![
		"image/png",
		"image/jpeg",
		"image/webp",
		"text/plain",
		"text/markdown"
	].includes(n)) throw Error("Choisissez une image PNG, JPEG ou WebP, ou un fichier .txt ou .md.");
	if (!e.size || e.size > A.attachmentBytes) throw Error(`« ${e.name} » doit contenir entre 1 octet et 2 Mio.`);
	if (!e.name.trim() || e.name.length > 256 || /[<>:"/\\|?*\p{Cc}]/u.test(e.name)) throw Error("Utilisez un nom de fichier simple, sans chemin ni caractères spéciaux (256 caractères maximum).");
	return n;
}
function ie(e) {
	if (!e.idea.trim()) throw Error("Décrivez votre idée pour démarrer le projet.");
	if (e.idea.length > A.idea) throw Error("Votre demande dépasse 16 000 caractères. Raccourcissez-la avant de démarrer.");
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
function ae(e) {
	let t = e;
	if (!t || !Array.isArray(t.options) || !Array.isArray(t.capabilities)) throw Error("Le catalogue est illisible. Réessayez son chargement.");
	return {
		options: t.options.map((e) => {
			if (!e || ![
				e.id,
				e.title,
				e.description
			].every((e) => typeof e == "string") || !Array.isArray(e.capabilities) || e.capabilities.some((e) => typeof e != "string")) throw Error("Une option du catalogue est illisible.");
			return e;
		}),
		capabilities: t.capabilities.map((e) => {
			if (!e || typeof e.id != "string" || typeof e.title != "string") throw Error("Une catégorie du catalogue est illisible.");
			return e;
		})
	};
}
function I(e, t) {
	let n = (e) => e.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("fr-FR");
	return n(`${e.title} ${e.description}`).includes(n(t.trim()));
}
//#endregion
//#region studio-ui/src/features/home/hooks/useIdeaComposer.ts
function oe(e, t) {
	let n = F(e);
	return new Promise((r, i) => {
		let a = new FileReader(), o = () => a.abort(), s = () => t.removeEventListener("abort", o);
		a.onload = () => {
			s();
			let t = String(a.result || "").split(",")[1];
			t ? r({
				name: e.name,
				mime: n,
				base64: t
			}) : i(/* @__PURE__ */ Error(`Impossible de lire « ${e.name} ». Réessayez.`));
		}, a.onerror = () => {
			s(), i(/* @__PURE__ */ Error(`Impossible de lire « ${e.name} ». Réessayez.`));
		}, a.onabort = () => {
			s(), i(/* @__PURE__ */ Error("Lecture des fichiers interrompue."));
		}, t.addEventListener("abort", o, { once: !0 }), a.readAsDataURL(e), t.aborted && a.abort();
	});
}
function L({ operation: e, onSubmit: t, onEdit: n, seed: i }) {
	let [a, o] = (0, m.useState)({
		draft: te(),
		seedId: null,
		seedError: ""
	}), [s, c] = (0, m.useState)(""), [l, u] = (0, m.useState)(!1), [d, f] = (0, m.useState)(null), [p, h] = (0, m.useState)(!1), [g, _] = (0, m.useState)(""), [v, y] = (0, m.useState)(null), b = (0, m.useRef)(null), x = (0, m.useRef)(!1), S = (0, m.useRef)(null), C = (0, m.useRef)(null), w = (0, m.useRef)(!1), T = (0, m.useRef)(null), E = r((e) => K(e, !0), (e) => K(e, !1)), D = l || e.phase !== "idle", O = ee({
		busy: D,
		selected: a.draft.connectorGuides,
		onApply: W,
		onEdit: n
	}), k = (0, m.useEffectEvent)(n), M = l || O.hasPendingDraft || N(a.draft) && a.draft !== v, P = (0, m.useEffectEvent)((e) => {
		x.current || (S.current || O.hasPendingDraft || N(a.draft) && a.draft !== b.current) && (e.preventDefault(), e.returnValue = "");
	});
	if ((0, m.useEffect)(() => {
		let e = (e) => P(e);
		return window.addEventListener("beforeunload", e), () => window.removeEventListener("beforeunload", e);
	}, []), i && i.id !== a.seedId && !D) {
		let e = ne(a.draft, i);
		o({
			draft: e.draft,
			seedId: i.id,
			seedError: e.error
		}), c("");
	}
	(0, m.useEffect)(() => {
		a.seedId !== null && (k(), T.current?.focus(), T.current?.scrollIntoView?.({ block: "center" }));
	}, [a.seedId]), (0, m.useEffect)(() => () => {
		let e = S.current;
		S.current = null, e?.abort(), C.current?.abort();
	}, []);
	function I(t) {
		S.current || e.phase !== "idle" || (x.current = !1, o((e) => ({
			...e,
			draft: t(e.draft),
			seedError: ""
		})), c(""), n());
	}
	function L(e, t) {
		I((n) => ({
			...n,
			[e]: t
		}));
	}
	function R(e) {
		I((t) => ({
			...t,
			projectType: e,
			idea: t.idea.trim() ? t.idea : j.find((t) => t.id === e)?.idea || ""
		})), T.current?.focus();
	}
	function z(e) {
		if (D || S.current) return !1;
		try {
			let t = re(e);
			if (a.draft.links.includes(t)) throw Error("Cette référence est déjà ajoutée.");
			if (a.draft.links.length >= A.links) throw Error("Vous pouvez ajouter au maximum 5 liens.");
			return I((e) => ({
				...e,
				links: [...e.links, t]
			})), !0;
		} catch (e) {
			return c(e instanceof Error ? e.message : "Lien invalide."), !1;
		}
	}
	async function B(t) {
		if (!t.length || S.current || e.phase !== "idle") return;
		let r = new AbortController();
		try {
			if (a.draft.attachments.length + t.length > A.attachments) throw Error("Vous pouvez joindre au maximum 4 fichiers.");
			t.forEach(F), S.current = r, u(!0), c("");
			let e = await Promise.all(t.map((e) => oe(e, r.signal)));
			if (r.signal.aborted) return;
			o((t) => ({
				...t,
				draft: {
					...t.draft,
					attachments: [...t.draft.attachments, ...e]
				},
				seedError: ""
			})), n();
		} catch (e) {
			r.signal.aborted || c(e instanceof Error ? e.message : "Lecture des fichiers impossible."), r.abort();
		} finally {
			S.current === r && (S.current = null, u(!1));
		}
	}
	async function V() {
		C.current?.abort();
		let e = new AbortController();
		C.current = e, h(!0), _("");
		try {
			let t = await fetch("/api/home/catalog", {
				cache: "no-store",
				credentials: "same-origin",
				signal: AbortSignal.any([e.signal, AbortSignal.timeout(15e3)])
			}), n = await t.json();
			if (e.signal.aborted) return;
			if (!t.ok) throw Error("Le catalogue est indisponible. Réessayez dans un instant.");
			f(ae(n));
		} catch (t) {
			e.signal.aborted || _(t instanceof Error ? t.message : "Chargement impossible.");
		} finally {
			e.signal.aborted || h(!1);
		}
	}
	function H() {
		if (!(D || S.current || w.current)) try {
			if (O.hasPendingSelection) throw Error("Validez puis ajoutez à nouveau le guide modifié, ou retirez-le de votre demande.");
			if (a.draft.mcpConnectionIds.some((e) => !E.connections.some((t) => t.id === e && t.status === "connected"))) throw Error("Reconnectez les serveurs MCP sélectionnés ou retirez-les de ce projet.");
			let e = ie(a.draft);
			w.current = !0, c("");
			let n = a.draft;
			t(e, () => {
				b.current = n, y(n);
			}), queueMicrotask(() => {
				w.current = !1;
			});
		} catch (e) {
			w.current = !1, c(e instanceof Error ? e.message : "Complétez votre demande."), T.current?.focus();
		}
	}
	function U(e) {
		if (D || S.current) return;
		let t = a.draft.connectors.includes(e);
		if (!t && a.draft.connectors.length >= A.connectors) {
			c("Vous pouvez proposer au maximum 12 outils ou services.");
			return;
		}
		I((n) => ({
			...n,
			connectorGuides: t ? n.connectorGuides.filter((t) => t.optionId !== e) : n.connectorGuides,
			connectors: t ? n.connectors.filter((t) => t !== e) : [...n.connectors, e]
		})), t && O.forget(e);
	}
	function W(e, t) {
		if (D || S.current) return !1;
		let n = e.input.optionId;
		return !a.draft.connectorGuides.some((e) => e.optionId === n) && a.draft.connectorGuides.length >= 12 || t && !a.draft.connectors.includes(n) && a.draft.connectors.length >= A.connectors ? (c("Vous pouvez préparer au maximum 12 outils ou services."), !1) : (I((r) => ({
			...r,
			connectorGuides: [...r.connectorGuides.filter((e) => e.optionId !== n), structuredClone(e.input)],
			connectors: t && !r.connectors.includes(n) ? [...r.connectors, n] : r.connectors
		})), !0);
	}
	function G(e) {
		D || S.current || (I((t) => ({
			...t,
			connectorGuides: t.connectorGuides.filter((t) => t.optionId !== e),
			connectors: t.connectors.filter((t) => t !== e)
		})), O.forget(e));
	}
	function K(e, t) {
		if (!(t && a.draft.mcpConnectionIds.includes(e))) {
			if (t && a.draft.mcpConnectionIds.length >= 12) {
				c("Vous pouvez utiliser au maximum 12 serveurs MCP pour ce projet.");
				return;
			}
			I((n) => ({
				...n,
				mcpConnectionIds: t ? [...n.mcpConnectionIds, e] : n.mcpConnectionIds.filter((t) => t !== e)
			}));
		}
	}
	return {
		mcp: E,
		linearAccessWarning: a.draft.connectorGuides.some((e) => e.flowId === "linear-read") && E.connections.some((e) => e.provider === "linear" && e.url === "https://mcp.linear.app/mcp" && e.status === "connected" && a.draft.mcpConnectionIds.includes(e.id)),
		guides: O,
		removeGuide: G,
		toggleMcp: (e) => K(e, !a.draft.mcpConnectionIds.includes(e)),
		hasUnsavedContent: M,
		approveDeparture: () => {
			x.current = !0;
		},
		cancelDeparture: () => {
			x.current = !1;
		},
		draft: a.draft,
		error: s || a.seedError,
		busy: D,
		reading: l,
		textarea: T,
		catalog: d,
		catalogLoading: p,
		catalogError: g,
		loadCatalog: V,
		submit: H,
		setField: L,
		selectType: R,
		addLink: z,
		addFiles: B,
		removeLink: (e) => I((t) => ({
			...t,
			links: t.links.filter((t, n) => n !== e)
		})),
		removeAttachment: (e) => I((t) => ({
			...t,
			attachments: t.attachments.filter((t, n) => n !== e)
		})),
		toggleConnector: U
	};
}
//#endregion
//#region studio-ui/src/features/home/components/HomeIcon.tsx
var R = n();
function z({ kind: e }) {
	return /* @__PURE__ */ (0, R.jsx)("svg", {
		width: "24",
		height: "24",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "1.6",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, R.jsx)("path", { d: {
			new: "M12 5v14M5 12h14",
			imported: "M12 3v12m-4-4 4 4 4-4M4 15v6h16v-6",
			existing: "M3 10a9 9 0 1 1 2 8M3 4v6h6M12 7v5l3 2",
			folder: "M3 7h18v13H3zM3 7V4h6l2 3"
		}[e] })
	});
}
//#endregion
//#region studio-ui/src/features/home/components/ProjectFormFields.tsx
function B({ kind: e, values: t, validation: n, onEdit: r }) {
	let i = e === "existing" ? "workspace" : "source";
	function a(e) {
		let t = n?.field === e;
		return {
			"aria-invalid": t || void 0,
			"aria-describedby": t ? "home-form-error" : void 0
		};
	}
	return /* @__PURE__ */ (0, R.jsxs)(R.Fragment, { children: [e === "existing" ? null : /* @__PURE__ */ (0, R.jsxs)("label", { children: [/* @__PURE__ */ (0, R.jsxs)("span", {
		className: "home-field-label",
		children: ["Nom du projet ", e === "imported" ? /* @__PURE__ */ (0, R.jsx)("small", { children: "· facultatif" }) : null]
	}), /* @__PURE__ */ (0, R.jsx)("input", {
		name: "name",
		autoComplete: "off",
		required: e === "new",
		maxLength: 200,
		value: t.name,
		onChange: (e) => r("name", e.target.value),
		placeholder: "Par exemple, Mon carnet de lectures…",
		...a("name")
	})] }), e === "new" ? /* @__PURE__ */ (0, R.jsxs)("label", { children: ["Que souhaitez-vous créer ?", /* @__PURE__ */ (0, R.jsx)("textarea", {
		name: "idea",
		autoComplete: "off",
		required: !0,
		maxLength: 2e4,
		rows: 4,
		value: t.idea,
		onChange: (e) => r("idea", e.target.value),
		placeholder: "Une application pour…",
		...a("idea")
	})] }) : /* @__PURE__ */ (0, R.jsxs)("label", { children: [
		e === "existing" ? "Dossier du projet Studio" : "Dossier des sources",
		/* @__PURE__ */ (0, R.jsx)("input", {
			name: i,
			autoComplete: "off",
			autoCapitalize: "off",
			spellCheck: !1,
			required: !0,
			value: t[i],
			onChange: (e) => r(i, e.target.value),
			placeholder: "/Users/vous/mon-projet…",
			...a(i),
			"aria-describedby": n?.field === i ? "home-form-error" : "home-path-help"
		}),
		/* @__PURE__ */ (0, R.jsx)("small", {
			id: "home-path-help",
			children: "Chemin absolu d’un dossier sur cet ordinateur."
		})
	] })] });
}
//#endregion
//#region studio-ui/src/features/home/components/ProjectDialog.tsx
var V = {
	new: "Créer un projet",
	imported: "Importer un projet",
	existing: "Reprendre un projet"
}, H = {
	new: "Une idée suffit pour commencer. Nous préciserons ensemble le résultat à obtenir.",
	imported: "Partez de vos sources actuelles. DevMethod en crée une copie et préserve le dossier original.",
	existing: "Retrouvez un projet déjà utilisé dans DevMethod Studio, avec son contexte et ses versions."
}, U = () => ({
	name: "",
	idea: "",
	source: "",
	workspace: ""
});
function W({ open: e, kind: t, operation: n, onDismiss: r, onSubmit: i, onEdit: a, departure: o }) {
	let s = (0, m.useRef)(null), c = (0, m.useRef)(null), [l, u] = (0, m.useState)({
		new: U(),
		imported: U(),
		existing: U()
	}), [d, f] = (0, m.useState)(null), p = d?.kind === t ? d.error : null, h = n.phase !== "idle", g = !!o;
	(0, m.useEffect)(() => {
		let t = s.current;
		if (e && t) {
			let e = t.open;
			e || t.showModal(), g ? t.querySelector("[data-keep-idea]")?.focus() : e ? t.querySelector("button[type=\"submit\"]")?.focus() : t.querySelector("input")?.focus();
		} else !e && t?.open && t.close();
	}, [e, g]);
	function _(e, n) {
		u((r) => ({
			...r,
			[t]: {
				...r[t],
				[e]: n
			}
		})), f(null), a();
	}
	let y = x(t, n);
	return /* @__PURE__ */ (0, R.jsxs)("dialog", {
		ref: s,
		className: "home-dialog",
		"aria-labelledby": "home-dialog-title",
		"aria-describedby": "home-dialog-description",
		onCancel: (e) => {
			o ? (e.preventDefault(), o.onCancel()) : h && e.preventDefault();
		},
		onClose: r,
		children: [
			/* @__PURE__ */ (0, R.jsxs)("div", {
				className: "home-dialog-heading",
				children: [/* @__PURE__ */ (0, R.jsx)("span", {
					className: "home-eyebrow",
					children: "Votre point de départ"
				}), /* @__PURE__ */ (0, R.jsx)("button", {
					type: "button",
					"aria-label": "Fermer",
					disabled: h,
					onClick: o?.onCancel || r,
					children: /* @__PURE__ */ (0, R.jsx)("span", {
						"aria-hidden": "true",
						children: "×"
					})
				})]
			}),
			/* @__PURE__ */ (0, R.jsx)("h2", {
				id: "home-dialog-title",
				children: o ? "Quitter cette idée ?" : V[t]
			}),
			/* @__PURE__ */ (0, R.jsx)("p", {
				id: "home-dialog-description",
				children: o ? "Votre idée et ses références ne sont pas encore enregistrées. Si vous ouvrez un autre projet, elles seront perdues." : H[t]
			}),
			o ? /* @__PURE__ */ (0, R.jsxs)("div", {
				className: "home-dialog-actions",
				children: [/* @__PURE__ */ (0, R.jsx)("button", {
					type: "button",
					"data-keep-idea": !0,
					onClick: o.onCancel,
					children: "Garder mon idée"
				}), /* @__PURE__ */ (0, R.jsx)("button", {
					type: "button",
					className: "primary",
					onClick: o.onConfirm,
					children: "Ouvrir quand même"
				})]
			}) : null,
			/* @__PURE__ */ (0, R.jsxs)("form", {
				ref: c,
				hidden: g,
				onSubmit: (e) => {
					if (e.preventDefault(), h || o) return;
					let n = v(t, e.currentTarget), r = b(n);
					if (f({
						kind: t,
						error: r
					}), r) {
						let e = c.current?.elements.namedItem(r.field);
						e instanceof HTMLElement && e.focus();
					} else i(n);
				},
				children: [
					/* @__PURE__ */ (0, R.jsx)("fieldset", {
						disabled: h,
						children: /* @__PURE__ */ (0, R.jsx)(B, {
							kind: t,
							values: l[t],
							validation: p,
							onEdit: _
						})
					}),
					/* @__PURE__ */ (0, R.jsx)("p", {
						className: "home-form-note",
						children: "Aucun agent ni script du projet n’est lancé automatiquement."
					}),
					p ? /* @__PURE__ */ (0, R.jsx)("p", {
						id: "home-form-error",
						role: "alert",
						className: "home-error",
						children: p.message
					}) : null,
					n.project ? /* @__PURE__ */ (0, R.jsxs)("p", {
						className: "home-saved",
						role: "status",
						children: [
							"« ",
							n.project.name,
							" » est enregistré.",
							" ",
							n.error ? "Vous pouvez réessayer son ouverture." : "Ouverture du Studio…"
						]
					}) : null,
					n.error ? /* @__PURE__ */ (0, R.jsx)("p", {
						role: "alert",
						className: "home-error",
						children: n.error
					}) : null,
					/* @__PURE__ */ (0, R.jsxs)("div", {
						className: "home-dialog-actions",
						children: [/* @__PURE__ */ (0, R.jsx)("button", {
							type: "button",
							disabled: h,
							onClick: r,
							children: "Retour"
						}), /* @__PURE__ */ (0, R.jsxs)("button", {
							type: "submit",
							className: "primary",
							disabled: h,
							children: [h ? /* @__PURE__ */ (0, R.jsx)("span", {
								className: "home-spinner",
								"aria-hidden": "true"
							}) : null, y]
						})]
					}),
					/* @__PURE__ */ (0, R.jsx)("p", {
						className: "home-sr",
						role: "status",
						children: h ? y : ""
					})
				]
			})
		]
	});
}
//#endregion
//#region studio-ui/src/features/home/hooks/usePreviewViewport.ts
function G() {
	let e = (0, m.useRef)(null), [t, n] = (0, m.useState)({
		visible: !1,
		width: 0
	});
	return (0, m.useEffect)(() => {
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
function K(e) {
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
function q({ title: e, detail: t }) {
	return /* @__PURE__ */ (0, R.jsxs)("div", {
		className: "home-preview-placeholder",
		children: [
			/* @__PURE__ */ (0, R.jsx)("span", {
				className: "home-preview-symbol",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, R.jsx)(z, { kind: "folder" })
			}),
			/* @__PURE__ */ (0, R.jsx)("span", {
				className: "home-preview-title",
				children: e
			}),
			/* @__PURE__ */ (0, R.jsx)("span", {
				className: "home-preview-detail",
				children: t
			})
		]
	});
}
function se({ url: e, width: t, name: n }) {
	let [r, i] = (0, m.useState)("loading");
	return (0, m.useEffect)(() => {
		if (r !== "loading") return;
		let e = window.setTimeout(() => i("failed"), 2e4);
		return () => window.clearTimeout(e);
	}, [r]), r === "failed" ? /* @__PURE__ */ (0, R.jsx)(q, {
		title: "Aperçu indisponible",
		detail: "Le chargement n’a pas abouti. Ouvrez le projet pour le consulter."
	}) : /* @__PURE__ */ (0, R.jsxs)(R.Fragment, { children: [/* @__PURE__ */ (0, R.jsx)("div", {
		className: "home-preview-frame",
		"aria-hidden": "true",
		inert: !0,
		children: /* @__PURE__ */ (0, R.jsx)("iframe", {
			title: `Aperçu de ${n}`,
			src: e,
			sandbox: "allow-scripts",
			loading: "lazy",
			tabIndex: -1,
			"aria-hidden": "true",
			referrerPolicy: "no-referrer",
			width: 1280,
			height: 800,
			style: { transform: `scale(${t / 1280})` },
			onLoad: () => i((e) => e === "failed" ? e : "displayed"),
			onErrorCapture: () => i("failed")
		})
	}), r === "loading" ? /* @__PURE__ */ (0, R.jsxs)("div", {
		className: "home-preview-loading",
		children: [/* @__PURE__ */ (0, R.jsx)("span", {
			className: "home-spinner",
			"aria-hidden": "true"
		}), " Chargement de l’aperçu…"]
	}) : null] });
}
function ce({ project: e }) {
	let t = G(), n = e.preview, r = K(e), i;
	return i = n?.status === "empty" ? /* @__PURE__ */ (0, R.jsx)(q, {
		title: "Votre idée prend forme",
		detail: "Aucune version générée pour le moment."
	}) : n?.status === "unavailable" && n.reason === "source-only" ? /* @__PURE__ */ (0, R.jsx)(q, {
		title: "Sources sans aperçu",
		detail: "Le projet reste consultable dans Studio."
	}) : r ? t.visible && t.width > 0 ? /* @__PURE__ */ (0, R.jsx)(se, {
		url: r,
		width: t.width,
		name: e.name
	}, r) : /* @__PURE__ */ (0, R.jsx)(q, {
		title: "Aperçu du projet",
		detail: "Il se charge lorsque cette carte est visible."
	}) : /* @__PURE__ */ (0, R.jsx)(q, {
		title: "Aperçu indisponible",
		detail: "Ouvrez le projet pour retrouver son contexte."
	}), /* @__PURE__ */ (0, R.jsxs)("div", {
		ref: t.container,
		className: "home-project-preview",
		children: [i, r && n?.status === "ready" ? /* @__PURE__ */ (0, R.jsx)("span", {
			className: "home-preview-version",
			children: n.selection === "active" ? "Version active" : "Version proposée"
		}) : null]
	});
}
//#endregion
//#region studio-ui/src/features/home/components/RecentProjects.tsx
function le({ projects: e, loading: t, error: n, busy: r, searchRef: i, onRefresh: a, onOpen: o, onOther: s }) {
	let [c, l] = (0, m.useState)(""), u = e.filter((e) => S(e, c));
	return /* @__PURE__ */ (0, R.jsxs)("section", {
		className: "home-recents",
		"aria-labelledby": "home-recents-title",
		children: [
			/* @__PURE__ */ (0, R.jsxs)("div", {
				className: "home-section-heading",
				children: [/* @__PURE__ */ (0, R.jsxs)("div", { children: [/* @__PURE__ */ (0, R.jsx)("h2", {
					id: "home-recents-title",
					children: "Vos projets récents"
				}), /* @__PURE__ */ (0, R.jsx)("p", { children: "Retrouvez votre contexte, vos décisions et vos versions." })] }), /* @__PURE__ */ (0, R.jsx)("button", {
					type: "button",
					className: "home-refresh",
					disabled: t || r,
					onClick: a,
					children: t ? "Actualisation…" : "Actualiser"
				})]
			}),
			e.length ? /* @__PURE__ */ (0, R.jsxs)("label", {
				className: "home-search",
				children: [/* @__PURE__ */ (0, R.jsx)("span", {
					className: "home-sr",
					children: "Rechercher un projet"
				}), /* @__PURE__ */ (0, R.jsx)("input", {
					ref: i,
					type: "search",
					name: "project-search",
					autoComplete: "off",
					value: c,
					onChange: (e) => l(e.target.value),
					placeholder: "Rechercher un projet…"
				})]
			}) : null,
			n ? /* @__PURE__ */ (0, R.jsxs)("p", {
				role: "alert",
				className: "home-error",
				children: [
					n,
					" ",
					e.length ? "Vos projets déjà chargés restent visibles. " : "",
					"Actualisez pour réessayer."
				]
			}) : null,
			t && !e.length ? /* @__PURE__ */ (0, R.jsx)("p", {
				className: "home-empty",
				role: "status",
				children: "Lecture de vos projets…"
			}) : null,
			!t && !n && !e.length ? /* @__PURE__ */ (0, R.jsxs)("div", {
				className: "home-empty",
				children: [
					/* @__PURE__ */ (0, R.jsx)(z, { kind: "folder" }),
					/* @__PURE__ */ (0, R.jsx)("h3", { children: "Votre prochain projet commence ici" }),
					/* @__PURE__ */ (0, R.jsx)("p", { children: "Créez un projet ou importez vos sources. Ils apparaîtront ici pour les retrouver facilement." })
				]
			}) : null,
			e.length && !u.length ? /* @__PURE__ */ (0, R.jsx)("p", {
				className: "home-empty",
				role: "status",
				children: "Aucun projet ne correspond à cette recherche."
			}) : null,
			/* @__PURE__ */ (0, R.jsx)("ul", {
				className: "home-project-list",
				children: u.map((e) => /* @__PURE__ */ (0, R.jsxs)("li", {
					className: "home-project-card",
					children: [/* @__PURE__ */ (0, R.jsx)(ce, { project: e }), /* @__PURE__ */ (0, R.jsxs)("button", {
						type: "button",
						className: "home-project",
						disabled: r,
						onClick: () => o(e),
						"aria-label": `Ouvrir ${e.name}`,
						children: [
							/* @__PURE__ */ (0, R.jsxs)("span", {
								className: "home-project-copy",
								children: [/* @__PURE__ */ (0, R.jsx)("strong", { children: e.name }), /* @__PURE__ */ (0, R.jsx)("span", {
									className: "home-project-path",
									title: e.workspace,
									children: e.workspace
								})]
							}),
							/* @__PURE__ */ (0, R.jsx)("span", {
								className: "home-project-arrow",
								"aria-hidden": "true",
								children: "↗"
							}),
							/* @__PURE__ */ (0, R.jsxs)("span", {
								className: "home-project-meta",
								children: [/* @__PURE__ */ (0, R.jsx)("span", { children: g[e.kind] }), /* @__PURE__ */ (0, R.jsx)("time", {
									dateTime: e.lastOpenedAt || e.createdAt,
									children: w(e)
								})]
							})
						]
					})]
				}, e.id))
			}),
			/* @__PURE__ */ (0, R.jsxs)("button", {
				type: "button",
				className: "home-other",
				disabled: r,
				onClick: (e) => s(e.currentTarget),
				children: ["Ouvrir un autre dossier Studio ", /* @__PURE__ */ (0, R.jsx)("span", {
					"aria-hidden": "true",
					children: "↗"
				})]
			})
		]
	});
}
//#endregion
//#region studio-ui/src/features/home/components/ComposerReferences.tsx
function ue({ composer: e }) {
	let [t, n] = (0, m.useState)(""), r = (0, m.useRef)(null), i = (0, m.useRef)(null), a = (0, m.useRef)(null);
	function o() {
		e.addLink(t) && n(""), r.current?.focus();
	}
	return /* @__PURE__ */ (0, R.jsxs)(R.Fragment, { children: [
		/* @__PURE__ */ (0, R.jsx)("p", {
			className: "composer-option-intro",
			children: "Montrez ce qui vous inspire : un écran, un document ou un site à étudier."
		}),
		/* @__PURE__ */ (0, R.jsx)("input", {
			ref: i,
			className: "composer-file-input",
			type: "file",
			multiple: !0,
			accept: "image/png,image/jpeg,image/webp,text/plain,text/markdown,.txt,.md",
			"aria-label": "Joindre des références",
			disabled: e.busy,
			onChange: (t) => {
				let n = Array.from(t.currentTarget.files || []);
				t.currentTarget.value = "", e.addFiles(n);
			}
		}),
		/* @__PURE__ */ (0, R.jsxs)("button", {
			ref: a,
			type: "button",
			className: "composer-file-drop",
			disabled: e.busy || e.draft.attachments.length >= A.attachments,
			onClick: () => i.current?.click(),
			children: [
				/* @__PURE__ */ (0, R.jsx)("span", {
					className: "composer-upload-mark",
					"aria-hidden": "true",
					children: "↑"
				}),
				/* @__PURE__ */ (0, R.jsx)("strong", { children: e.reading ? "Lecture des fichiers…" : "Ajouter des fichiers" }),
				/* @__PURE__ */ (0, R.jsx)("span", { children: "PNG, JPEG, WebP, TXT ou Markdown" }),
				/* @__PURE__ */ (0, R.jsx)("small", { children: "4 fichiers maximum · 2 Mio par fichier" })
			]
		}),
		e.draft.attachments.length ? /* @__PURE__ */ (0, R.jsx)("ul", {
			className: "composer-reference-list",
			"aria-label": "Fichiers joints",
			children: e.draft.attachments.map((t, n) => /* @__PURE__ */ (0, R.jsxs)("li", { children: [/* @__PURE__ */ (0, R.jsxs)("span", { children: [/* @__PURE__ */ (0, R.jsx)("strong", { children: t.name }), /* @__PURE__ */ (0, R.jsx)("small", { children: t.mime.startsWith("image/") ? "Image de référence" : "Document de référence" })] }), /* @__PURE__ */ (0, R.jsx)("button", {
				type: "button",
				className: "composer-remove",
				disabled: e.busy,
				"aria-label": `Retirer le fichier ${t.name}`,
				onClick: () => {
					e.removeAttachment(n), requestAnimationFrame(() => a.current?.focus());
				},
				children: "×"
			})] }, `${n}:${t.name}`))
		}) : null,
		/* @__PURE__ */ (0, R.jsx)("label", {
			className: "composer-field",
			htmlFor: "composer-reference-link",
			children: "Un lien de référence"
		}),
		/* @__PURE__ */ (0, R.jsxs)("div", {
			className: "composer-link-entry",
			children: [/* @__PURE__ */ (0, R.jsx)("input", {
				ref: r,
				id: "composer-reference-link",
				type: "url",
				name: "reference-link",
				autoComplete: "off",
				autoCapitalize: "off",
				spellCheck: !1,
				value: t,
				disabled: e.busy,
				onChange: (e) => n(e.target.value),
				onKeyDown: (e) => {
					e.key === "Enter" && (e.preventDefault(), o());
				},
				placeholder: "https://un-site-qui-vous-inspire.fr…"
			}), /* @__PURE__ */ (0, R.jsx)("button", {
				type: "button",
				disabled: e.busy,
				onClick: o,
				children: "Ajouter"
			})]
		}),
		e.draft.links.length ? /* @__PURE__ */ (0, R.jsx)("ul", {
			className: "composer-reference-list",
			"aria-label": "Liens de référence",
			children: e.draft.links.map((t, n) => /* @__PURE__ */ (0, R.jsxs)("li", { children: [/* @__PURE__ */ (0, R.jsx)("span", {
				className: "composer-reference-url",
				title: t,
				children: t
			}), /* @__PURE__ */ (0, R.jsx)("button", {
				type: "button",
				className: "composer-remove",
				disabled: e.busy,
				"aria-label": `Retirer le lien ${t}`,
				onClick: () => {
					e.removeLink(n), r.current?.focus();
				},
				children: "×"
			})] }, t))
		}) : null,
		/* @__PURE__ */ (0, R.jsx)("p", {
			className: "composer-option-note",
			children: "5 liens maximum. Ils seront transmis comme références ; aucun site n’est consulté automatiquement."
		})
	] });
}
//#endregion
//#region studio-ui/src/features/home/components/ComposerGuideConnection.tsx
function de({ composer: e, preparation: t, title: n }) {
	let [r, i] = (0, m.useState)(""), o = t.nativeConnection, c = e.mcp.connections.find((e) => e.provider === o?.providerId && e.url === o?.url), l = e.mcp.active;
	function u() {
		i("");
		try {
			e.mcp.connect(a(t));
		} catch {
			i("Cette préparation ne propose pas de connexion MCP prise en charge. Revenez aux outils pour choisir un serveur.");
		}
	}
	return /* @__PURE__ */ (0, R.jsxs)("div", {
		className: "composer-guide-connect",
		children: [
			/* @__PURE__ */ (0, R.jsx)("p", { children: "L’ajout à la demande prépare le travail. La connexion autorise séparément l’accès de l’assistant." }),
			o?.providerId === "github" ? /* @__PURE__ */ (0, R.jsx)(s, {
				input: a(t),
				controller: e.mcp,
				disabled: e.busy
			}) : /* @__PURE__ */ (0, R.jsxs)("button", {
				type: "button",
				disabled: e.busy || !!l,
				onClick: u,
				children: [
					c?.status === "connected" ? "Reconnecter" : "Connecter",
					" ",
					n
				]
			}),
			l ? /* @__PURE__ */ (0, R.jsx)("p", {
				role: "status",
				children: l.authorizing ? "Autorisation attendue dans la fenêtre du fournisseur…" : "Connexion MCP en cours…"
			}) : null,
			c?.status === "connected" ? /* @__PURE__ */ (0, R.jsxs)("p", {
				role: "status",
				children: [
					"Connecté · ",
					c.tools.length,
					" outils découverts. L’usage dans l’application reste distinct."
				]
			}) : null,
			l?.id ? /* @__PURE__ */ (0, R.jsx)("button", {
				type: "button",
				onClick: () => void e.mcp.change(l.id, "disconnect"),
				children: "Annuler la connexion"
			}) : null,
			r || e.mcp.error ? /* @__PURE__ */ (0, R.jsx)("p", {
				role: "alert",
				children: r || e.mcp.error
			}) : null
		]
	});
}
//#endregion
//#region studio-ui/src/features/home/components/ComposerGuide.tsx
function fe({ composer: e }) {
	let t = e.guides;
	return t.definition ? /* @__PURE__ */ (0, R.jsxs)("div", {
		className: "composer-service-guide",
		children: [
			/* @__PURE__ */ (0, R.jsx)(f, {
				definition: t.definition,
				draft: t.input,
				preparation: t.preparation,
				preparing: t.preparing,
				error: t.preparationError,
				onChange: t.change,
				onPrepare: (e) => void t.prepare(e),
				onApply: t.apply,
				applyLabel: "Ajouter à ma demande",
				onBack: t.back,
				disabled: e.busy,
				step: t.step,
				onStepChange: t.setStep
			}, t.definition.optionId),
			t.persistence.error ? /* @__PURE__ */ (0, R.jsxs)("p", {
				role: "alert",
				children: [
					t.persistence.error,
					" ",
					/* @__PURE__ */ (0, R.jsx)("button", {
						type: "button",
						onClick: () => void t.persistence.retry(),
						children: "Réessayer l’enregistrement"
					})
				]
			}) : null,
			t.persistence.saving ? /* @__PURE__ */ (0, R.jsx)("p", {
				role: "status",
				children: "Enregistrement des réponses…"
			}) : null,
			t.preparation?.nativeConnection ? /* @__PURE__ */ (0, R.jsx)(de, {
				composer: e,
				preparation: t.preparation,
				title: t.definition.title
			}, t.preparation.setupFingerprint) : null
		]
	}) : /* @__PURE__ */ (0, R.jsxs)("section", {
		"aria-label": "Guide du service",
		children: [
			/* @__PURE__ */ (0, R.jsx)("button", {
				type: "button",
				onClick: t.back,
				children: "Retour aux outils"
			}),
			/* @__PURE__ */ (0, R.jsx)("p", {
				role: t.error ? "alert" : "status",
				children: t.error || (t.loading ? "Chargement du guide…" : "Ce guide est indisponible. Réessayez son chargement.")
			}),
			/* @__PURE__ */ (0, R.jsx)("button", {
				type: "button",
				disabled: t.loading || e.busy,
				onClick: () => void t.refresh(),
				children: "Réessayer le guide"
			})
		]
	});
}
//#endregion
//#region studio-ui/src/features/home/components/ComposerTools.tsx
function pe({ composer: e }) {
	let [t, n] = (0, m.useState)(""), [r, a] = (0, m.useState)("all"), o = (0, m.useRef)(null), s = (0, m.useRef)(null), c = (0, m.useRef)(null), l = e.guides.activeId;
	(0, m.useEffect)(() => {
		!l && c.current && (o.current ?? s.current)?.focus(), c.current = l;
	}, [l]);
	function u(t) {
		document.activeElement instanceof HTMLButtonElement && (o.current = document.activeElement), e.guides.open(t);
	}
	let d = e.catalog, f = (d?.options || []).filter((e) => I(e, t)), h = f.filter((e) => r === "all" || e.capabilities.includes(r));
	return /* @__PURE__ */ (0, R.jsxs)(R.Fragment, { children: [l ? /* @__PURE__ */ (0, R.jsx)(fe, { composer: e }, l) : null, /* @__PURE__ */ (0, R.jsxs)("div", {
		hidden: !!l,
		children: [/* @__PURE__ */ (0, R.jsx)(i, {
			controller: e.mcp,
			selectedIds: e.draft.mcpConnectionIds,
			onToggle: e.toggleMcp,
			disabled: e.busy,
			onConfigureGuide: u
		}), /* @__PURE__ */ (0, R.jsxs)("section", {
			className: "composer-application-services",
			"aria-label": "API et services du projet",
			children: [
				/* @__PURE__ */ (0, R.jsx)("h3", {
					ref: s,
					tabIndex: -1,
					children: "API et services du projet"
				}),
				/* @__PURE__ */ (0, R.jsx)("p", {
					className: "composer-option-intro",
					children: "Proposez les services que vous souhaitez utiliser. L’agent vérifiera leur intérêt et leur accès avec vous."
				}),
				e.guides.error ? /* @__PURE__ */ (0, R.jsxs)("div", {
					className: "composer-catalog-error",
					children: [/* @__PURE__ */ (0, R.jsx)("p", {
						role: "alert",
						children: e.guides.error
					}), /* @__PURE__ */ (0, R.jsx)("button", {
						type: "button",
						disabled: e.busy || e.guides.loading,
						onClick: e.guides.refresh,
						children: "Réessayer les guides"
					})]
				}) : null,
				/* @__PURE__ */ (0, R.jsxs)("div", {
					className: "composer-tool-filters",
					children: [/* @__PURE__ */ (0, R.jsxs)("label", { children: [/* @__PURE__ */ (0, R.jsx)("span", {
						className: "home-sr",
						children: "Rechercher un outil ou un service"
					}), /* @__PURE__ */ (0, R.jsx)("input", {
						type: "search",
						name: "composer-tool-search",
						autoComplete: "off",
						value: t,
						onChange: (e) => n(e.target.value),
						placeholder: "Rechercher un outil ou un service…",
						disabled: e.busy
					})] }), /* @__PURE__ */ (0, R.jsxs)("label", { children: [/* @__PURE__ */ (0, R.jsx)("span", {
						className: "home-sr",
						children: "Catégorie des outils"
					}), /* @__PURE__ */ (0, R.jsxs)("select", {
						value: r,
						onChange: (e) => a(e.target.value),
						disabled: e.busy,
						"aria-label": "Catégorie des outils",
						children: [/* @__PURE__ */ (0, R.jsxs)("option", {
							value: "all",
							children: [
								"Toutes les catégories (",
								f.length,
								")"
							]
						}), (d?.capabilities || []).map((e) => /* @__PURE__ */ (0, R.jsxs)("option", {
							value: e.id,
							children: [
								e.title,
								" (",
								f.filter((t) => t.capabilities.includes(e.id)).length,
								")"
							]
						}, e.id))]
					})] })]
				}),
				e.catalogLoading ? /* @__PURE__ */ (0, R.jsx)("p", {
					className: "composer-option-note",
					role: "status",
					children: "Chargement du catalogue…"
				}) : null,
				e.catalogError ? /* @__PURE__ */ (0, R.jsxs)("div", {
					className: "composer-catalog-error",
					children: [/* @__PURE__ */ (0, R.jsx)("p", {
						role: "alert",
						children: e.catalogError
					}), /* @__PURE__ */ (0, R.jsx)("button", {
						type: "button",
						onClick: () => void e.loadCatalog(),
						disabled: e.catalogLoading || e.busy,
						children: "Réessayer le catalogue"
					})]
				}) : null,
				/* @__PURE__ */ (0, R.jsxs)("div", {
					className: "composer-tool-count",
					role: "status",
					children: [
						e.draft.connectors.length,
						" sélectionné",
						e.draft.connectors.length > 1 ? "s" : "",
						" · 12 maximum"
					]
				}),
				/* @__PURE__ */ (0, R.jsx)("div", {
					className: "composer-tool-grid",
					children: h.map((t) => /* @__PURE__ */ (0, R.jsxs)("div", {
						className: "composer-tool-card",
						children: [/* @__PURE__ */ (0, R.jsxs)("label", {
							className: "composer-tool-option",
							children: [
								/* @__PURE__ */ (0, R.jsx)("input", {
									type: "checkbox",
									name: "preferred-connector",
									value: t.id,
									checked: e.draft.connectors.includes(t.id),
									disabled: e.busy,
									onChange: () => e.toggleConnector(t.id)
								}),
								/* @__PURE__ */ (0, R.jsx)(p, {
									optionId: t.id,
									size: 28
								}),
								/* @__PURE__ */ (0, R.jsxs)("span", { children: [/* @__PURE__ */ (0, R.jsx)("strong", { children: t.title }), /* @__PURE__ */ (0, R.jsx)("small", { children: t.description })] })
							]
						}), e.guides.guides.some((e) => e.optionId === t.id) ? /* @__PURE__ */ (0, R.jsxs)("button", {
							type: "button",
							className: "composer-tool-configure",
							disabled: e.busy,
							onClick: () => u(t.id),
							children: ["Configurer ", t.title]
						}) : null]
					}, t.id))
				}),
				d && !h.length ? /* @__PURE__ */ (0, R.jsx)("p", {
					className: "composer-option-note",
					children: "Aucun outil ne correspond à ce filtre."
				}) : null,
				/* @__PURE__ */ (0, R.jsx)("p", {
					className: "composer-option-note",
					children: "Une préférence ne configure aucune connexion et n’accorde aucun accès à vos comptes."
				})
			]
		})]
	})] });
}
//#endregion
//#region studio-ui/src/features/home/components/ComposerOptions.tsx
var me = [
	{
		id: "references",
		label: "Références"
	},
	{
		id: "design",
		label: "Design"
	},
	{
		id: "tools",
		label: "Outils et services"
	},
	{
		id: "project",
		label: "Projet"
	}
];
function he({ open: e, section: t, composer: n, onSection: r, onDismiss: i }) {
	let a = (0, m.useRef)(null), o = (0, m.useRef)(null);
	return (0, m.useEffect)(() => {
		let t = a.current;
		e && t && !t.open ? (t.showModal(), o.current?.focus()) : !e && t?.open && t.close();
	}, [e]), /* @__PURE__ */ (0, R.jsxs)("dialog", {
		ref: a,
		className: "composer-options-dialog",
		"aria-labelledby": "composer-options-title",
		onClose: i,
		children: [
			/* @__PURE__ */ (0, R.jsxs)("header", {
				className: "composer-options-header",
				children: [/* @__PURE__ */ (0, R.jsxs)("div", { children: [/* @__PURE__ */ (0, R.jsx)("span", {
					className: "home-eyebrow",
					children: "Donnez une direction à votre idée"
				}), /* @__PURE__ */ (0, R.jsx)("h2", {
					ref: o,
					tabIndex: -1,
					id: "composer-options-title",
					children: "Préparer mon projet"
				})] }), /* @__PURE__ */ (0, R.jsx)("button", {
					type: "button",
					className: "composer-close",
					"aria-label": "Fermer les options",
					onClick: i,
					children: "×"
				})]
			}),
			/* @__PURE__ */ (0, R.jsx)("nav", {
				className: "composer-options-nav",
				"aria-label": "Options du projet",
				children: me.map((e) => /* @__PURE__ */ (0, R.jsx)("button", {
					type: "button",
					"aria-pressed": t === e.id,
					onClick: () => r(e.id),
					disabled: n.busy,
					children: e.label
				}, e.id))
			}),
			/* @__PURE__ */ (0, R.jsxs)("div", {
				className: "composer-options-body",
				children: [
					/* @__PURE__ */ (0, R.jsx)("section", {
						className: "composer-options-pane",
						hidden: t !== "references",
						"aria-label": "Références du projet",
						children: /* @__PURE__ */ (0, R.jsx)(ue, { composer: n })
					}),
					/* @__PURE__ */ (0, R.jsxs)("section", {
						className: "composer-options-pane",
						hidden: t !== "design",
						"aria-label": "Direction visuelle",
						children: [
							/* @__PURE__ */ (0, R.jsx)("p", {
								className: "composer-option-intro",
								children: "Indiquez une ambiance, des couleurs ou une manière de présenter le contenu."
							}),
							/* @__PURE__ */ (0, R.jsx)("div", {
								className: "composer-style-grid",
								children: M.map((e, t) => {
									let r = `${e.title}. ${e.description}`;
									return /* @__PURE__ */ (0, R.jsxs)("button", {
										className: `composer-style composer-style-${t}`,
										type: "button",
										"aria-pressed": n.draft.design === r,
										onClick: () => n.setField("design", r),
										disabled: n.busy,
										children: [
											/* @__PURE__ */ (0, R.jsxs)("span", {
												className: "composer-style-swatch",
												"aria-hidden": "true",
												children: [
													/* @__PURE__ */ (0, R.jsx)("i", {}),
													/* @__PURE__ */ (0, R.jsx)("i", {}),
													/* @__PURE__ */ (0, R.jsx)("i", {})
												]
											}),
											/* @__PURE__ */ (0, R.jsx)("strong", { children: e.title }),
											/* @__PURE__ */ (0, R.jsx)("small", { children: e.description })
										]
									}, e.title);
								})
							}),
							/* @__PURE__ */ (0, R.jsx)("label", {
								className: "composer-field",
								htmlFor: "composer-design",
								children: "Votre direction visuelle"
							}),
							/* @__PURE__ */ (0, R.jsx)("textarea", {
								id: "composer-design",
								name: "design",
								autoComplete: "off",
								rows: 3,
								maxLength: A.design,
								value: n.draft.design,
								onChange: (e) => n.setField("design", e.target.value),
								placeholder: "Par exemple, une interface lumineuse et éditoriale, avec des accents verts…",
								disabled: n.busy
							}),
							/* @__PURE__ */ (0, R.jsx)("p", {
								className: "composer-option-note",
								children: "Ces pistes donnent une intention de style. Aucun kit de design n’est installé."
							})
						]
					}),
					/* @__PURE__ */ (0, R.jsx)("section", {
						className: "composer-options-pane",
						hidden: t !== "tools",
						"aria-label": "Outils proposés",
						children: /* @__PURE__ */ (0, R.jsx)(pe, { composer: n })
					}),
					/* @__PURE__ */ (0, R.jsxs)("section", {
						className: "composer-options-pane",
						hidden: t !== "project",
						"aria-label": "Nom du projet",
						children: [
							/* @__PURE__ */ (0, R.jsx)("p", {
								className: "composer-option-intro",
								children: "Vous pourrez faire évoluer ces informations dans le projet."
							}),
							/* @__PURE__ */ (0, R.jsxs)("label", {
								className: "composer-field",
								htmlFor: "composer-project-name",
								children: ["Nom du projet ", /* @__PURE__ */ (0, R.jsx)("span", { children: "· facultatif" })]
							}),
							/* @__PURE__ */ (0, R.jsx)("input", {
								id: "composer-project-name",
								name: "project-name",
								autoComplete: "off",
								maxLength: 200,
								value: n.draft.name,
								onChange: (e) => n.setField("name", e.target.value),
								placeholder: "Donnez un nom à votre idée…",
								disabled: n.busy
							}),
							/* @__PURE__ */ (0, R.jsx)("p", {
								className: "composer-option-note",
								children: "Vous pouvez laisser ce champ vide pour commencer avec un nom par défaut."
							})
						]
					}),
					n.error ? /* @__PURE__ */ (0, R.jsx)("p", {
						role: "alert",
						className: "composer-error",
						children: n.error
					}) : null
				]
			}),
			/* @__PURE__ */ (0, R.jsxs)("footer", {
				className: "composer-options-footer",
				children: [/* @__PURE__ */ (0, R.jsx)("span", { children: n.reading ? "Lecture des fichiers…" : "Vos choix restent modifiables." }), /* @__PURE__ */ (0, R.jsx)("button", {
					type: "button",
					className: "primary",
					onClick: i,
					children: "Terminé"
				})]
			})
		]
	});
}
//#endregion
//#region studio-ui/src/features/home/components/ComposerPreferences.tsx
function ge({ composer: e, onConfigureGuide: t }) {
	let { draft: n } = e;
	function r(t) {
		t(), e.textarea.current?.focus();
	}
	return !n.design && !n.connectors.length && !n.connectorGuides.length && !n.links.length && !n.attachments.length ? null : /* @__PURE__ */ (0, R.jsxs)("div", {
		className: "composer-preferences",
		"aria-label": "Préférences ajoutées",
		children: [
			n.design ? /* @__PURE__ */ (0, R.jsxs)("span", {
				className: "composer-chip",
				children: [/* @__PURE__ */ (0, R.jsxs)("span", {
					className: "composer-chip-label",
					title: n.design,
					children: ["Style : ", n.design.split(/[.\n]/)[0]]
				}), /* @__PURE__ */ (0, R.jsx)("button", {
					type: "button",
					disabled: e.busy,
					"aria-label": "Retirer la direction visuelle",
					onClick: () => r(() => e.setField("design", "")),
					children: "×"
				})]
			}) : null,
			n.connectors.filter((e) => !n.connectorGuides.some((t) => t.optionId === e)).map((n) => {
				let i = e.catalog?.options.find((e) => e.id === n)?.title || n;
				return /* @__PURE__ */ (0, R.jsxs)("span", {
					className: "composer-chip",
					children: [
						/* @__PURE__ */ (0, R.jsx)(p, {
							optionId: n,
							size: 18
						}),
						e.guides.guides.some((e) => e.optionId === n) ? /* @__PURE__ */ (0, R.jsx)("button", {
							type: "button",
							className: "composer-chip-configure",
							disabled: e.busy,
							"aria-label": `Configurer ${i}`,
							onClick: (e) => t(n, e.currentTarget),
							children: i
						}) : /* @__PURE__ */ (0, R.jsx)("span", {
							className: "composer-chip-label",
							children: i
						}),
						/* @__PURE__ */ (0, R.jsx)("button", {
							type: "button",
							disabled: e.busy,
							"aria-label": `Retirer ${i}`,
							onClick: () => r(() => e.toggleConnector(n)),
							children: "×"
						})
					]
				}, n);
			}),
			n.connectorGuides.map((n) => {
				let i = e.guides.guides.find((e) => e.optionId === n.optionId), a = i?.title || n.optionId, o = i?.flows.find((e) => e.id === n.flowId), s = e.guides.preparationFor(n.optionId)?.nativeConnection, c = s && e.mcp.connections.some((e) => e.provider === s.providerId && e.url === s.url && e.status === "connected");
				return /* @__PURE__ */ (0, R.jsxs)("span", {
					className: "composer-chip composer-guide-chip",
					children: [
						/* @__PURE__ */ (0, R.jsx)(p, {
							optionId: n.optionId,
							size: 18
						}),
						/* @__PURE__ */ (0, R.jsxs)("button", {
							type: "button",
							className: "composer-chip-configure",
							disabled: e.busy,
							"aria-label": `Configurer ${a}`,
							title: o?.title,
							onClick: (e) => t(n.optionId, e.currentTarget),
							children: [
								a,
								" · ",
								c ? "MCP connecté" : "À connecter"
							]
						}),
						/* @__PURE__ */ (0, R.jsx)("button", {
							type: "button",
							disabled: e.busy,
							"aria-label": `Retirer ${a}`,
							onClick: () => r(() => e.removeGuide(n.optionId)),
							children: "×"
						})
					]
				}, "guide:" + n.optionId);
			}),
			n.attachments.map((t, n) => /* @__PURE__ */ (0, R.jsxs)("span", {
				className: "composer-chip",
				children: [
					/* @__PURE__ */ (0, R.jsx)("span", {
						className: "composer-chip-mark",
						"aria-hidden": "true",
						children: "↗"
					}),
					/* @__PURE__ */ (0, R.jsx)("span", {
						className: "composer-chip-label",
						title: t.name,
						children: t.name
					}),
					/* @__PURE__ */ (0, R.jsx)("button", {
						type: "button",
						disabled: e.busy,
						"aria-label": `Retirer le fichier ${t.name}`,
						onClick: () => r(() => e.removeAttachment(n)),
						children: "×"
					})
				]
			}, `${n}:${t.name}`)),
			n.links.map((t, n) => /* @__PURE__ */ (0, R.jsxs)("span", {
				className: "composer-chip",
				children: [
					/* @__PURE__ */ (0, R.jsx)("span", {
						className: "composer-chip-mark",
						"aria-hidden": "true",
						children: "↗"
					}),
					/* @__PURE__ */ (0, R.jsx)("span", {
						className: "composer-chip-label",
						title: t,
						children: new URL(t).hostname
					}),
					/* @__PURE__ */ (0, R.jsx)("button", {
						type: "button",
						disabled: e.busy,
						"aria-label": `Retirer le lien ${t}`,
						onClick: () => r(() => e.removeLink(n)),
						children: "×"
					})
				]
			}, t))
		]
	});
}
//#endregion
//#region studio-ui/src/features/home/hooks/useComposerPlaceholder.ts
var J = [
	"Une boutique pour mes créations, avec une collection à découvrir et un panier…",
	"Une application pour réserver des ateliers et suivre les inscriptions…",
	"Un tableau de bord qui rend les chiffres de mon activité faciles à comprendre…",
	"Un portfolio qui raconte mon travail et donne envie de me contacter…",
	"Un espace partagé pour transformer les idées de mon équipe en projets…"
], _e = "Décrivez votre idée. À qui s’adresse-t-elle, et que doit-elle permettre de faire ?";
function ve(e) {
	let [t, n] = (0, m.useState)("Une boutique");
	return (0, m.useEffect)(() => {
		if (!e) return;
		let t = window.matchMedia?.("(prefers-reduced-motion: reduce)"), r, i = 0, a = 12, o = !1;
		function s(e) {
			r = setTimeout(c, e);
		}
		function c() {
			if (document.hidden) return;
			if (t?.matches) {
				n(J[0]);
				return;
			}
			let e = J[i] ?? J[0];
			a += o ? -1 : 1, n(e.slice(0, a)), a === e.length ? (o = !0, s(2300)) : a === 0 ? (o = !1, i = (i + 1) % J.length, s(350)) : s(o ? 18 : 48);
		}
		function l() {
			clearTimeout(r), document.hidden || s(150);
		}
		return t?.addEventListener("change", l), document.addEventListener("visibilitychange", l), l(), () => {
			clearTimeout(r), t?.removeEventListener("change", l), document.removeEventListener("visibilitychange", l);
		};
	}, [e]), e ? `Imaginez… ${t}` : _e;
}
//#endregion
//#region studio-ui/src/features/home/components/IdeaComposer.tsx
function ye(e) {
	let { composer: t } = e, [n, r] = (0, m.useState)(!1), i = ve(!n && !t.draft.idea && !t.busy), [a, s] = (0, m.useState)({
		open: !1,
		section: "references"
	}), c = (0, m.useRef)(null);
	function l(e) {
		s({
			open: !0,
			section: e
		}), e === "tools" && t.guides.load(), e === "tools" && !t.catalog && !t.catalogLoading && t.loadCatalog();
	}
	function u(e, t) {
		c.current = t, l(e);
	}
	function d() {
		s((e) => ({
			...e,
			open: !1
		})), c.current?.focus();
	}
	let f = P(e.operation, t.reading);
	return /* @__PURE__ */ (0, R.jsxs)("div", {
		className: "idea-composer-wrap",
		children: [
			/* @__PURE__ */ (0, R.jsxs)("form", {
				className: "idea-composer",
				onSubmit: (e) => {
					e.preventDefault(), t.submit();
				},
				children: [
					/* @__PURE__ */ (0, R.jsx)("label", {
						className: "home-sr",
						htmlFor: "composer-idea",
						children: "Décrivez votre idée"
					}),
					/* @__PURE__ */ (0, R.jsx)("textarea", {
						ref: t.textarea,
						id: "composer-idea",
						name: "idea",
						rows: 4,
						maxLength: A.idea,
						value: t.draft.idea,
						autoComplete: "off",
						placeholder: i,
						onFocus: () => r(!0),
						onBlur: () => r(!1),
						onChange: (e) => t.setField("idea", e.target.value),
						onKeyDown: (e) => {
							e.key === "Enter" && (e.metaKey || e.ctrlKey) && (e.preventDefault(), t.submit());
						},
						disabled: t.busy,
						"aria-invalid": !!t.error || void 0,
						"aria-describedby": "composer-help"
					}),
					/* @__PURE__ */ (0, R.jsx)(ge, {
						composer: t,
						onConfigureGuide: (e, n) => {
							t.guides.open(e), u("tools", n);
						}
					}),
					/* @__PURE__ */ (0, R.jsxs)("div", {
						className: "composer-toolbar",
						children: [/* @__PURE__ */ (0, R.jsxs)("div", {
							className: "composer-option-actions",
							children: [
								/* @__PURE__ */ (0, R.jsx)("button", {
									type: "button",
									className: "composer-add",
									disabled: t.busy,
									"aria-label": "Ajouter des références",
									title: "Ajouter des références",
									onClick: (e) => u("references", e.currentTarget),
									children: /* @__PURE__ */ (0, R.jsx)("span", {
										"aria-hidden": "true",
										children: "+"
									})
								}),
								/* @__PURE__ */ (0, R.jsxs)("button", {
									type: "button",
									disabled: t.busy,
									onClick: (e) => u("design", e.currentTarget),
									children: [/* @__PURE__ */ (0, R.jsx)("span", {
										className: "composer-style-symbol",
										"aria-hidden": "true",
										children: "◒"
									}), "Design"]
								}),
								/* @__PURE__ */ (0, R.jsxs)("button", {
									type: "button",
									disabled: t.busy,
									onClick: (e) => u("tools", e.currentTarget),
									children: [/* @__PURE__ */ (0, R.jsx)("span", {
										className: "composer-tools-symbol",
										"aria-hidden": "true",
										children: "⌘"
									}), "Outils"]
								})
							]
						}), /* @__PURE__ */ (0, R.jsxs)("div", {
							className: "composer-submit-actions",
							children: [/* @__PURE__ */ (0, R.jsxs)("label", {
								className: "composer-mode",
								children: [/* @__PURE__ */ (0, R.jsx)("span", {
									className: "home-sr",
									children: "Première étape"
								}), /* @__PURE__ */ (0, R.jsxs)("select", {
									name: "launch-action",
									value: t.draft.action,
									disabled: t.busy,
									onChange: (e) => t.setField("action", e.target.value),
									children: [/* @__PURE__ */ (0, R.jsx)("option", {
										value: "build",
										children: "Construire"
									}), /* @__PURE__ */ (0, R.jsx)("option", {
										value: "plan",
										children: "Planifier"
									})]
								})]
							}), /* @__PURE__ */ (0, R.jsxs)("button", {
								type: "submit",
								className: "primary composer-start",
								disabled: t.busy,
								children: [
									t.busy ? /* @__PURE__ */ (0, R.jsx)("span", {
										className: "home-spinner",
										"aria-hidden": "true"
									}) : null,
									f,
									/* @__PURE__ */ (0, R.jsx)("span", {
										"aria-hidden": "true",
										children: "↑"
									})
								]
							})]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, R.jsx)(o, {
				connections: t.mcp.connections,
				selectedIds: t.draft.mcpConnectionIds,
				onToggle: t.toggleMcp,
				onManage: (e) => u("tools", e),
				disabled: t.busy
			}),
			t.linearAccessWarning ? /* @__PURE__ */ (0, R.jsx)("p", {
				role: "alert",
				className: "composer-error",
				children: "Une connexion Linear avec accès standard est aussi sélectionnée. Retirez-la pour limiter les outils du projet à la lecture seule."
			}) : null,
			/* @__PURE__ */ (0, R.jsx)("div", {
				className: "composer-type-pills",
				role: "group",
				"aria-label": "Type de projet",
				children: j.map((e) => /* @__PURE__ */ (0, R.jsx)("button", {
					type: "button",
					"aria-pressed": t.draft.projectType === e.id,
					disabled: t.busy,
					onClick: () => t.selectType(e.id),
					children: e.label
				}, e.id))
			}),
			/* @__PURE__ */ (0, R.jsx)("p", {
				className: "composer-help",
				id: "composer-help",
				children: "La demande sera transmise à l’agent du projet. Elle attendra sa prise en charge."
			}),
			e.operation.project ? /* @__PURE__ */ (0, R.jsxs)("p", {
				className: "composer-saved",
				role: "status",
				children: [
					"« ",
					e.operation.project.name,
					" » est enregistré.",
					" ",
					e.operation.error ? "Réessayez son ouverture ; votre projet est conservé." : "Ouverture du Studio…"
				]
			}) : null,
			t.error || e.operation.error ? /* @__PURE__ */ (0, R.jsx)("p", {
				role: "alert",
				className: "composer-error",
				children: t.error || e.operation.error
			}) : null,
			/* @__PURE__ */ (0, R.jsx)("p", {
				role: "status",
				className: "home-sr",
				children: t.busy ? f : ""
			}),
			/* @__PURE__ */ (0, R.jsx)(he, {
				...a,
				composer: t,
				onSection: l,
				onDismiss: d
			})
		]
	});
}
//#endregion
//#region studio-ui/src/features/home/model/starters.ts
var be = [
	{
		id: "all",
		label: "Tout"
	},
	{
		id: "website",
		label: "Sites web"
	},
	{
		id: "app",
		label: "Applications"
	},
	{
		id: "prototype",
		label: "Prototypes"
	},
	{
		id: "slides",
		label: "Présentations"
	}
], xe = [
	{
		id: "atelier",
		title: "Atelier — Portfolio",
		description: "Un regard singulier, des projets qui parlent.",
		category: "website",
		interaction: "Filtrez les projets de ce studio fictif.",
		seed: {
			projectType: "website",
			idea: "Créer un portfolio éditorial pour un studio créatif. Présenter une sélection de projets filtrables par discipline, des études de cas avec intention et résultat, une présentation du studio et un moyen de contact. Adapter les contenus et l’identité à mon activité ; prévoir les états vides et une navigation mobile accessible.",
			design: "Direction Atelier : fond crème, typographie éditoriale à empattements, accents corail et composition asymétrique. Grandes respirations, numérotation discrète et illustrations géométriques originales. Préserver une forte lisibilité sur mobile."
		}
	},
	{
		id: "pulse",
		title: "Pulse — Tableau de bord",
		description: "Les chiffres utiles, au premier regard.",
		category: "app",
		interaction: "Changez la période pour comparer les données de démonstration.",
		seed: {
			projectType: "app",
			idea: "Créer un tableau de bord SaaS pour suivre l’activité d’une équipe. Prévoir des indicateurs définis, un filtre de période, des tendances et une liste détaillée. Identifier les sources de données et les droits nécessaires avant connexion ; distinguer données de démonstration, chargement, absence de données et erreurs.",
			design: "Direction Pulse : interface bleu nuit, graphiques menthe et lilas, typographie sans empattements, chiffres tabulaires. Hiérarchie calme, panneaux fins et contrastes accessibles ; une version mobile recentrée sur les indicateurs essentiels."
		}
	},
	{
		id: "rivage",
		title: "Rivage — Boutique",
		description: "Une collection soignée, une sélection simple.",
		category: "website",
		interaction: "Ajoutez un objet à une sélection locale, sans commande.",
		seed: {
			projectType: "website",
			idea: "Créer une boutique pour une petite collection d’objets. Prévoir catalogue, fiches produit, filtres et sélection modifiable. Préciser les besoins de stock, livraison et paiement avant toute intégration ; aucun achat ne doit être simulé comme réussi. Partir de produits fictifs clairement identifiés puis remplacer par les données autorisées.",
			design: "Direction Rivage : palette sauge, ivoire et terre cuite, formes organiques, titres fins à empattements. Présentation généreuse des objets, prix lisibles, parcours tactile sobre et accessible."
		}
	},
	{
		id: "pause",
		title: "Pause — Rendez-vous",
		description: "Choisir un moment, en toute simplicité.",
		category: "prototype",
		interaction: "Choisissez un jour et un créneau ; aucune réservation n’est envoyée.",
		seed: {
			projectType: "prototype",
			idea: "Prototyper un parcours de prise de rendez-vous : choisir une prestation, un jour et un créneau, puis revoir le récapitulatif. Tester la compréhension des disponibilités, les états complets et l’annulation. Garder le prototype local avec données fictives ; définir ensuite les règles de disponibilité, les données personnelles et le service de réservation avant implémentation.",
			design: "Direction Pause : lavande douce, crème et violet profond, cartes arrondies, calendrier aéré. Boutons de créneaux généreux, sélection explicite et récapitulatif toujours visible sur mobile."
		}
	},
	{
		id: "collectif",
		title: "Collectif — Kanban",
		description: "Moins de dispersion, plus de mouvement.",
		category: "app",
		interaction: "Faites avancer une tâche dans le tableau de démonstration.",
		seed: {
			projectType: "app",
			idea: "Créer un tableau kanban pour une petite équipe avec colonnes À faire, En cours et Terminé. Prévoir création, édition, déplacement au clavier et filtres de tâches. Clarifier la persistance, les rôles et les conflits de modifications avant d’ajouter la collaboration ; conserver un historique compréhensible et un état vide utile.",
			design: "Direction Collectif : surfaces ivoire, texte encre, accents prune et pastels par statut. Cartes compactes, libellés clairs, actions de déplacement accessibles sans glisser-déposer obligatoire."
		}
	},
	{
		id: "perspective",
		title: "Perspective — Slides",
		description: "Une histoire claire, un écran à la fois.",
		category: "slides",
		interaction: "Parcourez les trois diapositives de cet exemple.",
		seed: {
			projectType: "slides",
			idea: "Créer une présentation web pour exposer une idée : contexte, proposition, bénéfices et prochaine étape. Prévoir navigation précédente/suivante au clavier, indicateur de progression et affichage responsive. Construire le récit avec mon contenu et signaler toute donnée illustrative ; permettre de revoir les slides sans animation obligatoire.",
			design: "Direction Perspective : orange solaire, fond encre et ivoire, typographie monumentale. Une idée par écran, mise en page graphique, numérotation discrète et transitions respectant la réduction des mouvements."
		}
	}
];
function Y(e) {
	return e.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("fr");
}
function Se(e, t) {
	let n = Y(e.trim()).split(/\s+/);
	return xe.filter((e) => {
		let r = Y(`${e.title} ${e.description} ${e.seed.idea}`);
		return (t === "all" || e.category === t) && n.every((e) => r.includes(e));
	});
}
//#endregion
//#region studio-ui/src/features/home/components/StarterGallery.tsx
function Ce() {
	let [e, t] = (0, m.useState)("Tous");
	return /* @__PURE__ */ (0, R.jsxs)("div", {
		className: "sg-preview sg-atelier",
		children: [
			/* @__PURE__ */ (0, R.jsxs)("div", {
				className: "sg-mini-nav",
				children: [/* @__PURE__ */ (0, R.jsx)("b", { children: "atelier." }), /* @__PURE__ */ (0, R.jsx)("span", { children: "STUDIO INDÉPENDANT · DÉMO" })]
			}),
			/* @__PURE__ */ (0, R.jsxs)("div", {
				className: "sg-editorial-hero",
				children: [/* @__PURE__ */ (0, R.jsxs)("h3", { children: [
					"Des idées",
					/* @__PURE__ */ (0, R.jsx)("br", {}),
					"qui prennent ",
					/* @__PURE__ */ (0, R.jsx)("em", { children: "forme." })
				] }), /* @__PURE__ */ (0, R.jsxs)("div", {
					className: "sg-sculpture",
					"aria-hidden": "true",
					children: [
						/* @__PURE__ */ (0, R.jsx)("i", {}),
						/* @__PURE__ */ (0, R.jsx)("i", {}),
						/* @__PURE__ */ (0, R.jsx)("i", {})
					]
				})]
			}),
			/* @__PURE__ */ (0, R.jsx)("div", {
				className: "sg-mini-controls",
				"aria-label": "Discipline des projets",
				children: [
					"Tous",
					"Identité",
					"Édition"
				].map((n) => /* @__PURE__ */ (0, R.jsx)("button", {
					type: "button",
					"aria-pressed": e === n,
					onClick: () => t(n),
					children: n
				}, n))
			}),
			/* @__PURE__ */ (0, R.jsx)("ul", {
				className: "sg-portfolio-list",
				"aria-label": "Projets démo",
				children: [
					{
						name: "Formes libres",
						category: "Identité",
						tone: "coral"
					},
					{
						name: "Objets sensibles",
						category: "Édition",
						tone: "blue"
					},
					{
						name: "Nouveaux regards",
						category: "Identité",
						tone: "lime"
					}
				].filter((t) => e === "Tous" || t.category === e).map((e) => /* @__PURE__ */ (0, R.jsxs)("li", { children: [
					/* @__PURE__ */ (0, R.jsx)("span", {
						className: `sg-project-art sg-art-${e.tone}`,
						"aria-hidden": "true"
					}),
					/* @__PURE__ */ (0, R.jsx)("b", { children: e.name }),
					/* @__PURE__ */ (0, R.jsx)("small", { children: e.category })
				] }, e.name))
			})
		]
	});
}
var X = {
	week: {
		label: "7 jours",
		total: "1 284",
		change: "+12 %",
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
		label: "30 jours",
		total: "5 460",
		change: "+18 %",
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
function we() {
	let [e, t] = (0, m.useState)("week"), n = X[e];
	return /* @__PURE__ */ (0, R.jsxs)("div", {
		className: "sg-preview sg-pulse",
		children: [
			/* @__PURE__ */ (0, R.jsxs)("div", {
				className: "sg-mini-nav",
				children: [/* @__PURE__ */ (0, R.jsxs)("b", { children: [/* @__PURE__ */ (0, R.jsx)("span", {
					"aria-hidden": "true",
					children: "◈"
				}), " pulse"] }), /* @__PURE__ */ (0, R.jsx)("span", { children: "ESPACE DÉMO" })]
			}),
			/* @__PURE__ */ (0, R.jsxs)("div", {
				className: "sg-dashboard-heading",
				children: [/* @__PURE__ */ (0, R.jsxs)("div", { children: [/* @__PURE__ */ (0, R.jsx)("small", { children: "VUE D’ENSEMBLE" }), /* @__PURE__ */ (0, R.jsx)("h3", { children: "Chaque signal compte." })] }), /* @__PURE__ */ (0, R.jsx)("div", {
					className: "sg-mini-controls",
					"aria-label": "Période des données démo",
					children: ["week", "month"].map((n) => /* @__PURE__ */ (0, R.jsx)("button", {
						type: "button",
						"aria-pressed": e === n,
						onClick: () => t(n),
						children: X[n].label
					}, n))
				})]
			}),
			/* @__PURE__ */ (0, R.jsxs)("div", {
				className: "sg-metrics",
				children: [/* @__PURE__ */ (0, R.jsxs)("div", { children: [
					/* @__PURE__ */ (0, R.jsxs)("span", { children: ["Visites · ", n.label] }),
					/* @__PURE__ */ (0, R.jsx)("strong", {
						"aria-live": "polite",
						children: n.total
					}),
					/* @__PURE__ */ (0, R.jsxs)("small", { children: [n.change, " · données fictives"] })
				] }), /* @__PURE__ */ (0, R.jsxs)("div", { children: [
					/* @__PURE__ */ (0, R.jsx)("span", { children: "Objectif de la démo" }),
					/* @__PURE__ */ (0, R.jsxs)("strong", { children: ["78", /* @__PURE__ */ (0, R.jsx)("small", { children: " %" })] }),
					/* @__PURE__ */ (0, R.jsx)("span", {
						className: "sg-meter",
						"aria-hidden": "true"
					})
				] })]
			}),
			/* @__PURE__ */ (0, R.jsx)("div", {
				className: "sg-chart",
				role: "img",
				"aria-label": `Tendance illustrative sur ${n.label}, ${n.total} visites fictives`,
				children: n.bars.map((e, t) => /* @__PURE__ */ (0, R.jsx)("span", { style: { height: `${e}%` } }, t))
			}),
			/* @__PURE__ */ (0, R.jsxs)("div", {
				className: "sg-chart-caption",
				children: [/* @__PURE__ */ (0, R.jsx)("span", { children: "Début de période" }), /* @__PURE__ */ (0, R.jsx)("span", { children: "Aujourd’hui · démo" })]
			})
		]
	});
}
function Te() {
	let [e, t] = (0, m.useState)(0);
	return /* @__PURE__ */ (0, R.jsxs)("div", {
		className: "sg-preview sg-rivage",
		children: [
			/* @__PURE__ */ (0, R.jsxs)("div", {
				className: "sg-mini-nav",
				children: [/* @__PURE__ */ (0, R.jsx)("b", { children: "RIVAGE" }), /* @__PURE__ */ (0, R.jsx)("span", { children: "OBJETS DU QUOTIDIEN · DÉMO" })]
			}),
			/* @__PURE__ */ (0, R.jsxs)("div", {
				className: "sg-commerce-hero",
				children: [/* @__PURE__ */ (0, R.jsxs)("div", { children: [
					/* @__PURE__ */ (0, R.jsx)("small", { children: "LA COLLECTION CALME" }),
					/* @__PURE__ */ (0, R.jsxs)("h3", { children: [
						"Faire place",
						/* @__PURE__ */ (0, R.jsx)("br", {}),
						"à l’essentiel."
					] }),
					/* @__PURE__ */ (0, R.jsxs)("p", { children: [
						"Des formes simples.",
						/* @__PURE__ */ (0, R.jsx)("br", {}),
						"Des jours plus doux."
					] })
				] }), /* @__PURE__ */ (0, R.jsxs)("div", {
					className: "sg-vase-scene",
					"aria-hidden": "true",
					children: [
						/* @__PURE__ */ (0, R.jsx)("i", { className: "sg-vase" }),
						/* @__PURE__ */ (0, R.jsx)("i", { className: "sg-branch" }),
						/* @__PURE__ */ (0, R.jsx)("i", { className: "sg-sun" })
					]
				})]
			}),
			/* @__PURE__ */ (0, R.jsxs)("div", {
				className: "sg-product",
				children: [
					/* @__PURE__ */ (0, R.jsxs)("div", { children: [/* @__PURE__ */ (0, R.jsx)("strong", { children: "Vase Sillage" }), /* @__PURE__ */ (0, R.jsx)("span", { children: "Grès naturel · objet fictif" })] }),
					/* @__PURE__ */ (0, R.jsx)("b", { children: "48 €" }),
					/* @__PURE__ */ (0, R.jsx)("button", {
						type: "button",
						onClick: () => t((e) => Math.min(9, e + 1)),
						disabled: e === 9,
						children: "Ajouter à la sélection"
					})
				]
			}),
			/* @__PURE__ */ (0, R.jsxs)("div", {
				className: "sg-selection",
				children: [/* @__PURE__ */ (0, R.jsxs)("p", {
					role: "status",
					children: [
						"Sélection démo : ",
						e,
						" ",
						e === 1 ? "objet" : "objets",
						" · aucune commande"
					]
				}), /* @__PURE__ */ (0, R.jsx)("button", {
					type: "button",
					disabled: e === 0,
					onClick: () => t((e) => Math.max(0, e - 1)),
					children: "Retirer un objet"
				})]
			})
		]
	});
}
function Ee() {
	let [e, t] = (0, m.useState)("Mardi"), [n, r] = (0, m.useState)(null);
	return /* @__PURE__ */ (0, R.jsxs)("div", {
		className: "sg-preview sg-pause",
		children: [/* @__PURE__ */ (0, R.jsxs)("div", {
			className: "sg-mini-nav",
			children: [/* @__PURE__ */ (0, R.jsxs)("b", { children: ["pause", /* @__PURE__ */ (0, R.jsx)("span", {
				"aria-hidden": "true",
				children: " ✳"
			})] }), /* @__PURE__ */ (0, R.jsx)("span", { children: "STUDIO BIEN-ÊTRE · DÉMO" })]
		}), /* @__PURE__ */ (0, R.jsxs)("div", {
			className: "sg-booking-layout",
			children: [/* @__PURE__ */ (0, R.jsxs)("div", { children: [
				/* @__PURE__ */ (0, R.jsx)("span", {
					className: "sg-booking-flower",
					"aria-hidden": "true",
					children: "✳"
				}),
				/* @__PURE__ */ (0, R.jsxs)("h3", { children: [
					"Un moment.",
					/* @__PURE__ */ (0, R.jsx)("br", {}),
					"Juste pour vous."
				] }),
				/* @__PURE__ */ (0, R.jsxs)("p", { children: [
					"Séance découverte",
					/* @__PURE__ */ (0, R.jsx)("br", {}),
					/* @__PURE__ */ (0, R.jsx)("strong", { children: "45 minutes" })
				] })
			] }), /* @__PURE__ */ (0, R.jsxs)("div", {
				className: "sg-booking-picker",
				children: [
					/* @__PURE__ */ (0, R.jsx)("h4", { children: "Votre prochain rendez-vous" }),
					/* @__PURE__ */ (0, R.jsx)("div", {
						className: "sg-mini-controls",
						"aria-label": "Jour de démonstration",
						children: [
							"Mardi",
							"Mercredi",
							"Jeudi"
						].map((n) => /* @__PURE__ */ (0, R.jsx)("button", {
							type: "button",
							"aria-pressed": e === n,
							onClick: () => {
								t(n), r(null);
							},
							children: n
						}, n))
					}),
					/* @__PURE__ */ (0, R.jsxs)("p", { children: ["Créneaux fictifs · ", e] }),
					/* @__PURE__ */ (0, R.jsx)("div", {
						className: "sg-slots",
						"aria-label": "Créneau de démonstration",
						children: [
							"10:00",
							"11:30",
							"14:00",
							"16:30"
						].map((e) => /* @__PURE__ */ (0, R.jsx)("button", {
							type: "button",
							"aria-pressed": n === e,
							onClick: () => r(e),
							children: e
						}, e))
					}),
					/* @__PURE__ */ (0, R.jsx)("p", {
						className: "sg-booking-result",
						role: "status",
						children: n ? `${e} à ${n} sélectionné dans la démo.` : "Choisissez un créneau pour essayer."
					}),
					/* @__PURE__ */ (0, R.jsx)("small", { children: "Aucune réservation envoyée." })
				]
			})]
		})]
	});
}
function De() {
	let [e, t] = (0, m.useState)(0), n = [
		"À faire",
		"En cours",
		"Terminé"
	];
	return /* @__PURE__ */ (0, R.jsxs)("div", {
		className: "sg-preview sg-collectif",
		children: [
			/* @__PURE__ */ (0, R.jsxs)("div", {
				className: "sg-mini-nav",
				children: [/* @__PURE__ */ (0, R.jsxs)("b", { children: ["collectif", /* @__PURE__ */ (0, R.jsx)("span", {
					"aria-hidden": "true",
					children: " ▪"
				})] }), /* @__PURE__ */ (0, R.jsx)("span", { children: "TABLEAU DÉMO" })]
			}),
			/* @__PURE__ */ (0, R.jsxs)("div", {
				className: "sg-board-heading",
				children: [/* @__PURE__ */ (0, R.jsxs)("div", { children: [/* @__PURE__ */ (0, R.jsx)("small", { children: "NOTRE PROCHAIN CHAPITRE" }), /* @__PURE__ */ (0, R.jsx)("h3", { children: "Lancement du studio" })] }), /* @__PURE__ */ (0, R.jsxs)("span", {
					className: "sg-avatars",
					"aria-hidden": "true",
					children: [
						/* @__PURE__ */ (0, R.jsx)("i", { children: "AM" }),
						/* @__PURE__ */ (0, R.jsx)("i", { children: "JL" }),
						/* @__PURE__ */ (0, R.jsx)("i", { children: "SO" })
					]
				})]
			}),
			/* @__PURE__ */ (0, R.jsx)("div", {
				className: "sg-board",
				children: n.map((n, r) => /* @__PURE__ */ (0, R.jsxs)("section", {
					"aria-label": n,
					children: [/* @__PURE__ */ (0, R.jsxs)("h4", { children: [
						/* @__PURE__ */ (0, R.jsx)("span", {
							"aria-hidden": "true",
							children: "●"
						}),
						" ",
						n
					] }), e === r ? /* @__PURE__ */ (0, R.jsxs)("div", {
						className: "sg-task",
						children: [
							/* @__PURE__ */ (0, R.jsx)("small", { children: "DESIGN" }),
							/* @__PURE__ */ (0, R.jsx)("strong", { children: "Esquisser la page d’accueil" }),
							/* @__PURE__ */ (0, R.jsx)("p", { children: "Clarifier le premier regard." }),
							e < 2 ? /* @__PURE__ */ (0, R.jsx)("button", {
								type: "button",
								onClick: () => t((e) => e + 1),
								children: e === 0 ? "Commencer" : "Terminer"
							}) : /* @__PURE__ */ (0, R.jsx)("span", { children: "Terminé dans la démo" })
						]
					}) : /* @__PURE__ */ (0, R.jsx)("p", {
						className: "sg-column-empty",
						children: "Place aux idées"
					})]
				}, n))
			}),
			/* @__PURE__ */ (0, R.jsxs)("div", {
				className: "sg-board-footer",
				children: [/* @__PURE__ */ (0, R.jsxs)("p", {
					role: "status",
					children: ["Tâche démo : ", n[e]]
				}), /* @__PURE__ */ (0, R.jsx)("button", {
					type: "button",
					onClick: () => t(0),
					disabled: e === 0,
					children: "Réinitialiser"
				})]
			})
		]
	});
}
var Z = [
	{
		eyebrow: "01 / L’INTENTION",
		title: /* @__PURE__ */ (0, R.jsxs)(R.Fragment, { children: [
			"Moins de bruit.",
			/* @__PURE__ */ (0, R.jsx)("br", {}),
			/* @__PURE__ */ (0, R.jsx)("em", { children: "Plus d’idées." })
		] }),
		note: "Une autre façon de raconter ce qui compte."
	},
	{
		eyebrow: "02 / LE CHEMIN",
		title: /* @__PURE__ */ (0, R.jsxs)(R.Fragment, { children: [
			"Voir plus clair.",
			/* @__PURE__ */ (0, R.jsx)("br", {}),
			/* @__PURE__ */ (0, R.jsx)("em", { children: "Faire ensemble." })
		] }),
		note: "Observer. Choisir. Donner forme."
	},
	{
		eyebrow: "03 / LA SUITE",
		title: /* @__PURE__ */ (0, R.jsxs)(R.Fragment, { children: [
			"Une idée suffit.",
			/* @__PURE__ */ (0, R.jsx)("br", {}),
			/* @__PURE__ */ (0, R.jsx)("em", { children: "À vous la suite." })
		] }),
		note: "Quel changement voulez-vous rendre possible ?"
	}
];
function Oe() {
	let [e, t] = (0, m.useState)(0), n = Z[e];
	return /* @__PURE__ */ (0, R.jsxs)("div", {
		className: "sg-preview sg-perspective",
		children: [
			/* @__PURE__ */ (0, R.jsxs)("div", {
				className: "sg-mini-nav",
				children: [/* @__PURE__ */ (0, R.jsx)("b", { children: "perspective /" }), /* @__PURE__ */ (0, R.jsx)("span", { children: "PRÉSENTATION DÉMO" })]
			}),
			/* @__PURE__ */ (0, R.jsxs)("div", {
				className: "sg-slide-body",
				"aria-live": "polite",
				children: [
					/* @__PURE__ */ (0, R.jsx)("small", { children: n.eyebrow }),
					/* @__PURE__ */ (0, R.jsx)("h3", { children: n.title }),
					/* @__PURE__ */ (0, R.jsx)("p", { children: n.note }),
					/* @__PURE__ */ (0, R.jsx)("span", {
						className: "sg-slide-orbit",
						"aria-hidden": "true"
					})
				]
			}),
			/* @__PURE__ */ (0, R.jsxs)("div", {
				className: "sg-slide-controls",
				children: [/* @__PURE__ */ (0, R.jsxs)("span", { children: [
					"Diapositive ",
					e + 1,
					" sur ",
					Z.length
				] }), /* @__PURE__ */ (0, R.jsxs)("div", { children: [/* @__PURE__ */ (0, R.jsx)("button", {
					type: "button",
					"aria-label": "Diapositive précédente",
					disabled: e === 0,
					onClick: () => t((e) => e - 1),
					children: "←"
				}), /* @__PURE__ */ (0, R.jsx)("button", {
					type: "button",
					"aria-label": "Diapositive suivante",
					disabled: e === Z.length - 1,
					onClick: () => t((e) => e + 1),
					children: "→"
				})] })]
			})
		]
	});
}
var Q = {
	atelier: Ce,
	pulse: we,
	rivage: Te,
	pause: Ee,
	collectif: De,
	perspective: Oe
};
function ke({ starter: e, onOpen: t }) {
	let n = Q[e.id];
	return /* @__PURE__ */ (0, R.jsxs)("article", {
		className: "sg-card",
		children: [/* @__PURE__ */ (0, R.jsx)("div", {
			className: "sg-thumbnail",
			"aria-hidden": "true",
			inert: !0,
			children: /* @__PURE__ */ (0, R.jsx)(n, {})
		}), /* @__PURE__ */ (0, R.jsxs)("button", {
			type: "button",
			className: "sg-card-open",
			"aria-label": `Explorer ${e.title}`,
			onClick: (n) => t(e, n.currentTarget),
			children: [/* @__PURE__ */ (0, R.jsxs)("span", { children: [/* @__PURE__ */ (0, R.jsx)("strong", { children: e.title }), /* @__PURE__ */ (0, R.jsx)("small", { children: e.description })] }), /* @__PURE__ */ (0, R.jsx)("span", {
				className: "sg-card-arrow",
				"aria-hidden": "true",
				children: "↗"
			})]
		})]
	});
}
function Ae({ onChoose: e }) {
	let [t, n] = (0, m.useState)(""), [r, i] = (0, m.useState)("all"), [a, o] = (0, m.useState)(null), s = (0, m.useRef)(null), c = (0, m.useRef)(null), l = (0, m.useRef)(null), u = (0, m.useId)(), d = (0, m.useId)(), f = (0, m.useId)(), p = Se(t, r), h = a ? Q[a.id] : null;
	(0, m.useEffect)(() => {
		if (!a || !s.current) return;
		let e = s.current;
		e.open || e.showModal(), e.querySelector(".sg-close")?.focus();
		let t = document.documentElement.style.overflow;
		return document.documentElement.style.overflow = "hidden", () => {
			document.documentElement.style.overflow = t;
		};
	}, [a]);
	function g(e, t) {
		c.current = t, l.current = null, o(e);
	}
	function _() {
		let t = l.current;
		l.current = null, o(null), c.current?.focus(), t && e(t);
	}
	return /* @__PURE__ */ (0, R.jsxs)("section", {
		className: "starter-gallery",
		"aria-labelledby": u,
		children: [
			/* @__PURE__ */ (0, R.jsxs)("div", {
				className: "sg-heading",
				children: [/* @__PURE__ */ (0, R.jsxs)("div", { children: [
					/* @__PURE__ */ (0, R.jsx)("span", {
						className: "sg-eyebrow",
						children: "POINTS DE DÉPART"
					}),
					/* @__PURE__ */ (0, R.jsx)("h2", {
						id: u,
						children: "Une inspiration, votre interprétation."
					}),
					/* @__PURE__ */ (0, R.jsx)("p", { children: "Explorez une idée en action, puis faites-en la vôtre." })
				] }), /* @__PURE__ */ (0, R.jsxs)("label", {
					className: "sg-search",
					children: [
						/* @__PURE__ */ (0, R.jsx)("span", {
							className: "sg-sr",
							children: "Rechercher une inspiration"
						}),
						/* @__PURE__ */ (0, R.jsx)("span", {
							"aria-hidden": "true",
							children: "⌕"
						}),
						/* @__PURE__ */ (0, R.jsx)("input", {
							type: "search",
							name: "starter-search",
							autoComplete: "off",
							placeholder: "Portfolio, boutique…",
							value: t,
							onChange: (e) => n(e.target.value)
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, R.jsxs)("div", {
				className: "sg-toolbar",
				children: [/* @__PURE__ */ (0, R.jsx)("div", {
					className: "sg-filters",
					"aria-label": "Catégories d’inspiration",
					children: be.map((e) => /* @__PURE__ */ (0, R.jsx)("button", {
						type: "button",
						"aria-pressed": r === e.id,
						onClick: () => i(e.id),
						children: e.label
					}, e.id))
				}), /* @__PURE__ */ (0, R.jsxs)("p", {
					role: "status",
					children: [
						p.length,
						" ",
						p.length === 1 ? "inspiration" : "inspirations"
					]
				})]
			}),
			/* @__PURE__ */ (0, R.jsx)("div", {
				className: "sg-grid",
				children: p.map((e) => /* @__PURE__ */ (0, R.jsx)(ke, {
					starter: e,
					onOpen: g
				}, e.id))
			}),
			p.length === 0 ? /* @__PURE__ */ (0, R.jsxs)("div", {
				className: "sg-empty",
				children: [
					/* @__PURE__ */ (0, R.jsx)("h3", { children: "Aucune inspiration trouvée" }),
					/* @__PURE__ */ (0, R.jsx)("p", { children: "Essayez un autre mot ou explorez toutes les catégories." }),
					/* @__PURE__ */ (0, R.jsx)("button", {
						type: "button",
						onClick: () => {
							n(""), i("all");
						},
						children: "Voir toutes les inspirations"
					})
				]
			}) : null,
			/* @__PURE__ */ (0, R.jsx)("p", {
				className: "sg-note",
				children: "Aperçus interactifs avec données de démonstration. Votre choix prépare une idée à adapter, pas une application déjà construite."
			}),
			/* @__PURE__ */ (0, R.jsxs)("dialog", {
				ref: s,
				className: "sg-dialog",
				"aria-labelledby": d,
				"aria-describedby": f,
				onClose: _,
				onCancel: (e) => {
					e.preventDefault(), s.current?.close();
				},
				children: [
					/* @__PURE__ */ (0, R.jsxs)("header", {
						className: "sg-dialog-heading",
						children: [/* @__PURE__ */ (0, R.jsxs)("div", { children: [/* @__PURE__ */ (0, R.jsx)("span", {
							className: "sg-eyebrow",
							children: "EXPLORER UNE INSPIRATION"
						}), /* @__PURE__ */ (0, R.jsx)("h2", {
							id: d,
							children: a?.title
						})] }), /* @__PURE__ */ (0, R.jsx)("button", {
							className: "sg-close",
							type: "button",
							"aria-label": "Fermer l’aperçu",
							onClick: () => s.current?.close(),
							children: "×"
						})]
					}),
					/* @__PURE__ */ (0, R.jsxs)("div", {
						className: "sg-demo-note",
						id: f,
						children: [/* @__PURE__ */ (0, R.jsx)("span", { children: "Démo interactive" }), /* @__PURE__ */ (0, R.jsxs)("p", { children: [a?.interaction, " Les changements restent dans cet aperçu."] })]
					}),
					/* @__PURE__ */ (0, R.jsx)("div", {
						className: "sg-live-preview",
						children: h ? /* @__PURE__ */ (0, R.jsx)(h, {}, a?.id) : null
					}),
					/* @__PURE__ */ (0, R.jsxs)("footer", {
						className: "sg-dialog-footer",
						children: [/* @__PURE__ */ (0, R.jsxs)("p", { children: [
							"Cette inspiration prépare votre brief et sa direction visuelle.",
							/* @__PURE__ */ (0, R.jsx)("br", {}),
							"Aucun modèle source n’est importé."
						] }), /* @__PURE__ */ (0, R.jsxs)("button", {
							type: "button",
							className: "sg-use",
							onClick: () => {
								a && !l.current && (l.current = { ...a.seed }, s.current?.close());
							},
							children: ["Utiliser cette idée ", /* @__PURE__ */ (0, R.jsx)("span", {
								"aria-hidden": "true",
								children: "↗"
							})]
						})]
					})
				]
			})
		]
	});
}
//#endregion
//#region studio-ui/src/features/home/components/HomeView.tsx
function je(e) {
	let t = O(e), [n, r] = (0, m.useState)({
		open: !1,
		kind: "new"
	}), i = (0, m.useRef)(null), a = (0, m.useRef)(null), [o, s] = (0, m.useState)(), [c, l] = (0, m.useState)("composer"), [u, d] = (0, m.useState)(null), f = (0, m.useRef)(!1), p = c === "composer" ? t.operation : {
		phase: t.operation.phase,
		project: null,
		error: ""
	}, h = L({
		operation: p,
		onSubmit: (e, n) => {
			l("composer"), t.run(e, n);
		},
		onEdit: t.clearOperation,
		seed: o
	}), g = h.busy;
	async function _(e) {
		if (g || f.current) return;
		f.current = !0, d(null), h.approveDeparture(), l("project");
		let n = await t.run(e);
		f.current = !1, n || h.cancelDeparture();
	}
	function v(e) {
		g || f.current || (h.hasUnsavedContent ? (n.open || (i.current = document.activeElement), d(e)) : _(e));
	}
	function y() {
		d(null), n.open || i.current?.focus();
	}
	function b(e, n) {
		g || (i.current = n, l("project"), t.clearOperation(), r({
			open: !0,
			kind: e
		}));
	}
	function x() {
		g || (r((e) => ({
			...e,
			open: !1
		})), i.current?.focus());
	}
	return /* @__PURE__ */ (0, R.jsxs)("div", {
		className: "home-shell",
		children: [
			/* @__PURE__ */ (0, R.jsx)("a", {
				className: "home-skip",
				href: "#home-main",
				children: "Aller aux projets"
			}),
			/* @__PURE__ */ (0, R.jsxs)("header", {
				className: "home-header",
				children: [/* @__PURE__ */ (0, R.jsxs)("a", {
					className: "home-brand",
					href: "/",
					"aria-label": "DevMethod, accueil",
					children: [/* @__PURE__ */ (0, R.jsxs)("span", {
						className: "home-mark",
						"aria-hidden": "true",
						children: ["D", /* @__PURE__ */ (0, R.jsx)("span", { children: "·" })]
					}), /* @__PURE__ */ (0, R.jsxs)("span", { children: ["DevMethod ", /* @__PURE__ */ (0, R.jsx)("small", { children: "Studio" })] })]
				}), /* @__PURE__ */ (0, R.jsxs)("nav", {
					className: "home-nav",
					"aria-label": "Accueil",
					children: [
						/* @__PURE__ */ (0, R.jsx)("a", {
							href: "#home-recents-title",
							children: "Mes projets"
						}),
						/* @__PURE__ */ (0, R.jsx)("a", {
							href: "#home-inspirations",
							children: "Galerie"
						}),
						/* @__PURE__ */ (0, R.jsxs)("span", {
							className: "home-local",
							children: [/* @__PURE__ */ (0, R.jsx)("span", { "aria-hidden": "true" }), " Espace local"]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, R.jsxs)("main", {
				id: "home-main",
				children: [
					/* @__PURE__ */ (0, R.jsxs)("section", {
						className: "home-hero",
						"aria-labelledby": "home-title",
						children: [
							/* @__PURE__ */ (0, R.jsx)("span", {
								className: "home-eyebrow",
								children: "L’espace où vos idées prennent forme"
							}),
							/* @__PURE__ */ (0, R.jsxs)("h1", {
								id: "home-title",
								children: ["Que voulez-vous ", /* @__PURE__ */ (0, R.jsx)("span", { children: "créer ?" })]
							}),
							/* @__PURE__ */ (0, R.jsxs)("p", { children: [
								"Un site, une application, une nouvelle façon de travailler.",
								/* @__PURE__ */ (0, R.jsx)("br", { className: "home-title-break" }),
								" Décrivez votre idée et construisons la suite."
							] }),
							/* @__PURE__ */ (0, R.jsx)(ye, {
								operation: p,
								composer: h
							}),
							/* @__PURE__ */ (0, R.jsxs)("div", {
								className: "home-start-alternatives",
								children: [
									/* @__PURE__ */ (0, R.jsx)("span", { children: "Ou partez de l’existant" }),
									/* @__PURE__ */ (0, R.jsxs)("button", {
										type: "button",
										disabled: g,
										onClick: (e) => b("imported", e.currentTarget),
										children: [/* @__PURE__ */ (0, R.jsx)(z, { kind: "imported" }), " Importer un projet"]
									}),
									/* @__PURE__ */ (0, R.jsxs)("button", {
										type: "button",
										disabled: g,
										onClick: (e) => {
											t.projects.length && a.current ? (a.current.scrollIntoView?.({ block: "center" }), a.current.focus()) : b("existing", e.currentTarget);
										},
										children: [/* @__PURE__ */ (0, R.jsx)(z, { kind: "existing" }), " Reprendre un projet"]
									})
								]
							})
						]
					}),
					!n.open && c === "project" && t.operation.error ? /* @__PURE__ */ (0, R.jsx)("p", {
						role: "alert",
						className: "home-error",
						children: t.operation.error
					}) : null,
					!n.open && c === "project" && g ? /* @__PURE__ */ (0, R.jsxs)("p", {
						role: "status",
						className: "home-opening",
						children: [
							"Ouverture de « ",
							t.operation.project?.name,
							" »…"
						]
					}) : null,
					/* @__PURE__ */ (0, R.jsx)(le, {
						projects: t.projects,
						loading: t.loading,
						error: t.loadError,
						busy: g,
						searchRef: a,
						onRefresh: () => void t.refresh(),
						onOpen: v,
						onOther: (e) => b("existing", e)
					}),
					/* @__PURE__ */ (0, R.jsx)("div", {
						id: "home-inspirations",
						children: /* @__PURE__ */ (0, R.jsx)(Ae, { onChoose: (e) => {
							t.clearOperation(), s((t) => ({
								...e,
								id: (t?.id ?? 0) + 1
							}));
						} })
					})
				]
			}),
			/* @__PURE__ */ (0, R.jsx)("footer", {
				className: "home-footer",
				children: "Votre espace de création. Vos projets et leurs références restent sur cet ordinateur."
			}),
			/* @__PURE__ */ (0, R.jsx)(W, {
				...n,
				open: n.open || !!u,
				departure: u ? {
					onCancel: y,
					onConfirm: () => void _(u)
				} : void 0,
				operation: t.operation,
				onDismiss: x,
				onSubmit: v,
				onEdit: t.clearOperation
			})
		]
	});
}
//#endregion
//#region studio-ui/src/home-widget.tsx
function Me(e, t = {}) {
	let n = (0, h.createRoot)(e);
	return n.render(/* @__PURE__ */ (0, R.jsx)(je, { ...t })), { dispose: () => n.unmount() };
}
var $ = document.getElementById("studio-home");
$ && Me($);
//#endregion
export { Me as mountHomeWidget };
