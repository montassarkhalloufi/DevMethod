import { n as e, r as t, t as n } from "./jsx-runtime-Bz8zB3tG.js";
import { t as r } from "./ConnectorIcon-CFT0KtGV.js";
import { n as i, r as a, t as o } from "./McpPromptSelection-DDwhpHZR.js";
//#region studio-ui/src/features/home/model/home.ts
var s = t(), c = e(), l = {
	new: "Nouveau projet",
	imported: "Sources importées",
	existing: "Projet Studio"
};
function u(e) {
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
function d(e, t) {
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
function f(e) {
	return e.startsWith("/") || /^[a-z]:[\\/]/i.test(e);
}
function p(e) {
	let t = e.kind === "existing" ? "workspace" : "source", n = e[t];
	return n !== void 0 && !f(n) ? {
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
function m(e, t) {
	return t.phase === "opening" ? "Ouverture…" : t.phase === "creating" ? e === "imported" ? "Importation…" : "Préparation…" : t.project ? "Réessayer l’ouverture" : {
		new: "Créer et ouvrir",
		imported: "Importer et ouvrir",
		existing: "Reprendre ce projet"
	}[e];
}
function h(e, t) {
	let n = (e) => e.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("fr-FR");
	return n(`${e.name} ${e.workspace}`).includes(n(t.trim()));
}
function g(e) {
	return [...e].sort((e, t) => Date.parse(t.lastOpenedAt || t.createdAt) - Date.parse(e.lastOpenedAt || e.createdAt));
}
function _(e) {
	let t = new Date(e.lastOpenedAt || e.createdAt);
	return Number.isNaN(t.getTime()) ? "Date non disponible" : new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(t);
}
function v(e, t) {
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
async function y(e, t, n) {
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
var b = (e) => e instanceof Error ? e.message : "Action non confirmée. Vous pouvez réessayer.";
function x({ navigate: e }) {
	let [t, n] = (0, s.useState)([]), [r, i] = (0, s.useState)(!0), [a, o] = (0, s.useState)(""), [c, l] = (0, s.useState)({
		phase: "idle",
		project: null,
		error: ""
	}), d = (0, s.useRef)(null), f = (0, s.useRef)(null), p = (0, s.useRef)(/* @__PURE__ */ new Map()), m = (0, s.useCallback)(async () => {
		d.current?.abort();
		let e = new AbortController();
		d.current = e, i(!0), o("");
		try {
			let t = await y("", e.signal);
			if (e.signal.aborted) return;
			if (!Array.isArray(t.projects)) throw Error("La liste des projets est illisible.");
			n(g(t.projects.map(u)));
		} catch (t) {
			e.signal.aborted || o(b(t));
		} finally {
			e.signal.aborted || i(!1);
		}
	}, []);
	(0, s.useEffect)(() => (m(), () => {
		d.current?.abort(), f.current?.abort();
	}), [m]);
	function h(e) {
		d.current?.abort(), i(!1), n((t) => g([e, ...t.filter((t) => t.id !== e.id)]));
	}
	async function _(t, n, r) {
		l({
			phase: "opening",
			project: t,
			error: ""
		});
		let i = await y("/open", n.signal, { id: t.id });
		if (n.signal.aborted) return;
		let a = u(i.project);
		if (a.id !== t.id) throw Error("La session renvoyée appartient à un autre projet.");
		let o = v(i.url, r ? t.kind : void 0);
		return h(a), e ? e(o) : window.location.assign(o), !0;
	}
	async function x(e, t) {
		let n = JSON.stringify(e), r = p.current.get(n);
		if (r || (r = { requestId: crypto.randomUUID() }, p.current.set(n, r)), r.project) return r.project;
		let i = await y("/projects", t.signal, {
			requestId: r.requestId,
			...e
		});
		if (t.signal.aborted) return null;
		let a = u(i.project);
		return r.project = a, h(a), a;
	}
	async function S(e, t) {
		if (f.current) return !1;
		let n = new AbortController();
		f.current = n;
		let r = "id" in e ? e : null, i = !1;
		l({
			phase: r ? "opening" : "creating",
			project: r,
			error: ""
		});
		try {
			"id" in e || (r = await x(e, n), r && t?.()), r && (i = !!await _(r, n, !("id" in e)));
		} catch (e) {
			n.signal.aborted || l({
				phase: "idle",
				project: r,
				error: b(e)
			});
		} finally {
			n.signal.aborted || (f.current = null, i || l((e) => ({
				...e,
				phase: "idle"
			})));
		}
		return i;
	}
	function C() {
		f.current || l({
			phase: "idle",
			project: null,
			error: ""
		});
	}
	return {
		projects: t,
		loading: r,
		loadError: a,
		operation: c,
		refresh: m,
		run: S,
		clearOperation: C
	};
}
//#endregion
//#region studio-ui/src/features/home/model/composer.ts
var S = {
	idea: 16e3,
	design: 2e3,
	connectors: 12,
	attachments: 4,
	attachmentBytes: 2097152,
	links: 5
}, C = [
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
], w = [
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
function ee() {
	return {
		name: "",
		idea: "",
		action: "build",
		projectType: "website",
		design: "",
		connectors: [],
		mcpConnectionIds: [],
		links: [],
		attachments: []
	};
}
function T(e) {
	return !!(e.idea.trim() || e.name.trim() || e.design.trim() || e.connectors.length || e.mcpConnectionIds.length || e.links.length || e.attachments.length);
}
function E(e, t) {
	return t ? "Lecture des références…" : e.phase === "opening" ? "Ouverture du projet…" : e.phase === "creating" ? "Préparation du projet…" : e.project ? "Réessayer l’ouverture" : "Démarrer le projet";
}
function te(e, t) {
	let n = e.idea.trim() ? `${e.idea}\n\n${t.idea}` : t.idea;
	return n.length > S.idea ? {
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
function D(e) {
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
function O(e) {
	let t = e.name.toLowerCase().split(".").at(-1), n = t === "md" ? "text/markdown" : e.type || (t === "txt" ? "text/plain" : "");
	if (![
		"image/png",
		"image/jpeg",
		"image/webp",
		"text/plain",
		"text/markdown"
	].includes(n)) throw Error("Choisissez une image PNG, JPEG ou WebP, ou un fichier .txt ou .md.");
	if (!e.size || e.size > S.attachmentBytes) throw Error(`« ${e.name} » doit contenir entre 1 octet et 2 Mio.`);
	if (!e.name.trim() || e.name.length > 256 || /[<>:"/\\|?*\p{Cc}]/u.test(e.name)) throw Error("Utilisez un nom de fichier simple, sans chemin ni caractères spéciaux (256 caractères maximum).");
	return n;
}
function ne(e) {
	if (!e.idea.trim()) throw Error("Décrivez votre idée pour démarrer le projet.");
	if (e.idea.length > S.idea) throw Error("Votre demande dépasse 16 000 caractères. Raccourcissez-la avant de démarrer.");
	return {
		kind: "new",
		...e.name.trim() ? { name: e.name.trim() } : {},
		idea: e.idea.trim(),
		launch: {
			action: e.action,
			projectType: e.projectType,
			design: e.design.trim(),
			connectors: [...e.connectors],
			mcpConnectionIds: [...e.mcpConnectionIds],
			links: [...e.links],
			attachments: [...e.attachments]
		}
	};
}
function re(e) {
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
function k(e, t) {
	let n = (e) => e.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("fr-FR");
	return n(`${e.title} ${e.description}`).includes(n(t.trim()));
}
//#endregion
//#region studio-ui/src/features/home/hooks/useIdeaComposer.ts
function ie(e, t) {
	let n = O(e);
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
function A({ operation: e, onSubmit: t, onEdit: n, seed: r }) {
	let [i, o] = (0, s.useState)({
		draft: ee(),
		seedId: null,
		seedError: ""
	}), [c, l] = (0, s.useState)(""), [u, d] = (0, s.useState)(!1), [f, p] = (0, s.useState)(null), [m, h] = (0, s.useState)(!1), [g, _] = (0, s.useState)(""), [v, y] = (0, s.useState)(null), b = (0, s.useRef)(null), x = (0, s.useRef)(!1), w = (0, s.useRef)(null), E = (0, s.useRef)(null), k = (0, s.useRef)(!1), A = (0, s.useRef)(null), j = a((e) => W(e, !0), (e) => W(e, !1)), M = u || e.phase !== "idle", N = (0, s.useEffectEvent)(n), P = u || T(i.draft) && i.draft !== v, F = (0, s.useEffectEvent)((e) => {
		x.current || (w.current || T(i.draft) && i.draft !== b.current) && (e.preventDefault(), e.returnValue = "");
	});
	if ((0, s.useEffect)(() => {
		let e = (e) => F(e);
		return window.addEventListener("beforeunload", e), () => window.removeEventListener("beforeunload", e);
	}, []), r && r.id !== i.seedId && !M) {
		let e = te(i.draft, r);
		o({
			draft: e.draft,
			seedId: r.id,
			seedError: e.error
		}), l("");
	}
	(0, s.useEffect)(() => {
		i.seedId !== null && (N(), A.current?.focus(), A.current?.scrollIntoView?.({ block: "center" }));
	}, [i.seedId]), (0, s.useEffect)(() => () => {
		let e = w.current;
		w.current = null, e?.abort(), E.current?.abort();
	}, []);
	function I(t) {
		w.current || e.phase !== "idle" || (x.current = !1, o((e) => ({
			...e,
			draft: t(e.draft),
			seedError: ""
		})), l(""), n());
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
			idea: t.idea.trim() ? t.idea : C.find((t) => t.id === e)?.idea || ""
		})), A.current?.focus();
	}
	function z(e) {
		if (M || w.current) return !1;
		try {
			let t = D(e);
			if (i.draft.links.includes(t)) throw Error("Cette référence est déjà ajoutée.");
			if (i.draft.links.length >= S.links) throw Error("Vous pouvez ajouter au maximum 5 liens.");
			return I((e) => ({
				...e,
				links: [...e.links, t]
			})), !0;
		} catch (e) {
			return l(e instanceof Error ? e.message : "Lien invalide."), !1;
		}
	}
	async function B(t) {
		if (!t.length || w.current || e.phase !== "idle") return;
		let r = new AbortController();
		try {
			if (i.draft.attachments.length + t.length > S.attachments) throw Error("Vous pouvez joindre au maximum 4 fichiers.");
			t.forEach(O), w.current = r, d(!0), l("");
			let e = await Promise.all(t.map((e) => ie(e, r.signal)));
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
			r.signal.aborted || l(e instanceof Error ? e.message : "Lecture des fichiers impossible."), r.abort();
		} finally {
			w.current === r && (w.current = null, d(!1));
		}
	}
	async function V() {
		E.current?.abort();
		let e = new AbortController();
		E.current = e, h(!0), _("");
		try {
			let t = await fetch("/api/home/catalog", {
				cache: "no-store",
				credentials: "same-origin",
				signal: AbortSignal.any([e.signal, AbortSignal.timeout(15e3)])
			}), n = await t.json();
			if (e.signal.aborted) return;
			if (!t.ok) throw Error("Le catalogue est indisponible. Réessayez dans un instant.");
			p(re(n));
		} catch (t) {
			e.signal.aborted || _(t instanceof Error ? t.message : "Chargement impossible.");
		} finally {
			e.signal.aborted || h(!1);
		}
	}
	function H() {
		if (!(M || w.current || k.current)) try {
			if (i.draft.mcpConnectionIds.some((e) => !j.connections.some((t) => t.id === e && t.status === "connected"))) throw Error("Reconnectez les serveurs MCP sélectionnés ou retirez-les de ce projet.");
			let e = ne(i.draft);
			k.current = !0, l("");
			let n = i.draft;
			t(e, () => {
				b.current = n, y(n);
			}), queueMicrotask(() => {
				k.current = !1;
			});
		} catch (e) {
			k.current = !1, l(e instanceof Error ? e.message : "Complétez votre demande."), A.current?.focus();
		}
	}
	function U(e) {
		if (M || w.current) return;
		let t = i.draft.connectors.includes(e);
		if (!t && i.draft.connectors.length >= S.connectors) {
			l("Vous pouvez proposer au maximum 12 outils ou services.");
			return;
		}
		I((n) => ({
			...n,
			connectors: t ? n.connectors.filter((t) => t !== e) : [...n.connectors, e]
		}));
	}
	function W(e, t) {
		if (!(t && i.draft.mcpConnectionIds.includes(e))) {
			if (t && i.draft.mcpConnectionIds.length >= 12) {
				l("Vous pouvez utiliser au maximum 12 serveurs MCP pour ce projet.");
				return;
			}
			I((n) => ({
				...n,
				mcpConnectionIds: t ? [...n.mcpConnectionIds, e] : n.mcpConnectionIds.filter((t) => t !== e)
			}));
		}
	}
	return {
		mcp: j,
		toggleMcp: (e) => W(e, !i.draft.mcpConnectionIds.includes(e)),
		hasUnsavedContent: P,
		approveDeparture: () => {
			x.current = !0;
		},
		cancelDeparture: () => {
			x.current = !1;
		},
		draft: i.draft,
		error: c || i.seedError,
		busy: M,
		reading: u,
		textarea: A,
		catalog: f,
		catalogLoading: m,
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
var j = n();
function M({ kind: e }) {
	return /* @__PURE__ */ (0, j.jsx)("svg", {
		width: "24",
		height: "24",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "1.6",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, j.jsx)("path", { d: {
			new: "M12 5v14M5 12h14",
			imported: "M12 3v12m-4-4 4 4 4-4M4 15v6h16v-6",
			existing: "M3 10a9 9 0 1 1 2 8M3 4v6h6M12 7v5l3 2",
			folder: "M3 7h18v13H3zM3 7V4h6l2 3"
		}[e] })
	});
}
//#endregion
//#region studio-ui/src/features/home/components/ProjectFormFields.tsx
function N({ kind: e, values: t, validation: n, onEdit: r }) {
	let i = e === "existing" ? "workspace" : "source";
	function a(e) {
		let t = n?.field === e;
		return {
			"aria-invalid": t || void 0,
			"aria-describedby": t ? "home-form-error" : void 0
		};
	}
	return /* @__PURE__ */ (0, j.jsxs)(j.Fragment, { children: [e === "existing" ? null : /* @__PURE__ */ (0, j.jsxs)("label", { children: [/* @__PURE__ */ (0, j.jsxs)("span", {
		className: "home-field-label",
		children: ["Nom du projet ", e === "imported" ? /* @__PURE__ */ (0, j.jsx)("small", { children: "· facultatif" }) : null]
	}), /* @__PURE__ */ (0, j.jsx)("input", {
		name: "name",
		autoComplete: "off",
		required: e === "new",
		maxLength: 200,
		value: t.name,
		onChange: (e) => r("name", e.target.value),
		placeholder: "Par exemple, Mon carnet de lectures…",
		...a("name")
	})] }), e === "new" ? /* @__PURE__ */ (0, j.jsxs)("label", { children: ["Que souhaitez-vous créer ?", /* @__PURE__ */ (0, j.jsx)("textarea", {
		name: "idea",
		autoComplete: "off",
		required: !0,
		maxLength: 2e4,
		rows: 4,
		value: t.idea,
		onChange: (e) => r("idea", e.target.value),
		placeholder: "Une application pour…",
		...a("idea")
	})] }) : /* @__PURE__ */ (0, j.jsxs)("label", { children: [
		e === "existing" ? "Dossier du projet Studio" : "Dossier des sources",
		/* @__PURE__ */ (0, j.jsx)("input", {
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
		/* @__PURE__ */ (0, j.jsx)("small", {
			id: "home-path-help",
			children: "Chemin absolu d’un dossier sur cet ordinateur."
		})
	] })] });
}
//#endregion
//#region studio-ui/src/features/home/components/ProjectDialog.tsx
var P = {
	new: "Créer un projet",
	imported: "Importer un projet",
	existing: "Reprendre un projet"
}, F = {
	new: "Une idée suffit pour commencer. Nous préciserons ensemble le résultat à obtenir.",
	imported: "Partez de vos sources actuelles. DevMethod en crée une copie et préserve le dossier original.",
	existing: "Retrouvez un projet déjà utilisé dans DevMethod Studio, avec son contexte et ses versions."
}, I = () => ({
	name: "",
	idea: "",
	source: "",
	workspace: ""
});
function L({ open: e, kind: t, operation: n, onDismiss: r, onSubmit: i, onEdit: a, departure: o }) {
	let c = (0, s.useRef)(null), l = (0, s.useRef)(null), [u, f] = (0, s.useState)({
		new: I(),
		imported: I(),
		existing: I()
	}), [h, g] = (0, s.useState)(null), _ = h?.kind === t ? h.error : null, v = n.phase !== "idle", y = !!o;
	(0, s.useEffect)(() => {
		let t = c.current;
		if (e && t) {
			let e = t.open;
			e || t.showModal(), y ? t.querySelector("[data-keep-idea]")?.focus() : e ? t.querySelector("button[type=\"submit\"]")?.focus() : t.querySelector("input")?.focus();
		} else !e && t?.open && t.close();
	}, [e, y]);
	function b(e, n) {
		f((r) => ({
			...r,
			[t]: {
				...r[t],
				[e]: n
			}
		})), g(null), a();
	}
	let x = m(t, n);
	return /* @__PURE__ */ (0, j.jsxs)("dialog", {
		ref: c,
		className: "home-dialog",
		"aria-labelledby": "home-dialog-title",
		"aria-describedby": "home-dialog-description",
		onCancel: (e) => {
			o ? (e.preventDefault(), o.onCancel()) : v && e.preventDefault();
		},
		onClose: r,
		children: [
			/* @__PURE__ */ (0, j.jsxs)("div", {
				className: "home-dialog-heading",
				children: [/* @__PURE__ */ (0, j.jsx)("span", {
					className: "home-eyebrow",
					children: "Votre point de départ"
				}), /* @__PURE__ */ (0, j.jsx)("button", {
					type: "button",
					"aria-label": "Fermer",
					disabled: v,
					onClick: o?.onCancel || r,
					children: /* @__PURE__ */ (0, j.jsx)("span", {
						"aria-hidden": "true",
						children: "×"
					})
				})]
			}),
			/* @__PURE__ */ (0, j.jsx)("h2", {
				id: "home-dialog-title",
				children: o ? "Quitter cette idée ?" : P[t]
			}),
			/* @__PURE__ */ (0, j.jsx)("p", {
				id: "home-dialog-description",
				children: o ? "Votre idée et ses références ne sont pas encore enregistrées. Si vous ouvrez un autre projet, elles seront perdues." : F[t]
			}),
			o ? /* @__PURE__ */ (0, j.jsxs)("div", {
				className: "home-dialog-actions",
				children: [/* @__PURE__ */ (0, j.jsx)("button", {
					type: "button",
					"data-keep-idea": !0,
					onClick: o.onCancel,
					children: "Garder mon idée"
				}), /* @__PURE__ */ (0, j.jsx)("button", {
					type: "button",
					className: "primary",
					onClick: o.onConfirm,
					children: "Ouvrir quand même"
				})]
			}) : null,
			/* @__PURE__ */ (0, j.jsxs)("form", {
				ref: l,
				hidden: y,
				onSubmit: (e) => {
					if (e.preventDefault(), v || o) return;
					let n = d(t, e.currentTarget), r = p(n);
					if (g({
						kind: t,
						error: r
					}), r) {
						let e = l.current?.elements.namedItem(r.field);
						e instanceof HTMLElement && e.focus();
					} else i(n);
				},
				children: [
					/* @__PURE__ */ (0, j.jsx)("fieldset", {
						disabled: v,
						children: /* @__PURE__ */ (0, j.jsx)(N, {
							kind: t,
							values: u[t],
							validation: _,
							onEdit: b
						})
					}),
					/* @__PURE__ */ (0, j.jsx)("p", {
						className: "home-form-note",
						children: "Aucun agent ni script du projet n’est lancé automatiquement."
					}),
					_ ? /* @__PURE__ */ (0, j.jsx)("p", {
						id: "home-form-error",
						role: "alert",
						className: "home-error",
						children: _.message
					}) : null,
					n.project ? /* @__PURE__ */ (0, j.jsxs)("p", {
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
					n.error ? /* @__PURE__ */ (0, j.jsx)("p", {
						role: "alert",
						className: "home-error",
						children: n.error
					}) : null,
					/* @__PURE__ */ (0, j.jsxs)("div", {
						className: "home-dialog-actions",
						children: [/* @__PURE__ */ (0, j.jsx)("button", {
							type: "button",
							disabled: v,
							onClick: r,
							children: "Retour"
						}), /* @__PURE__ */ (0, j.jsxs)("button", {
							type: "submit",
							className: "primary",
							disabled: v,
							children: [v ? /* @__PURE__ */ (0, j.jsx)("span", {
								className: "home-spinner",
								"aria-hidden": "true"
							}) : null, x]
						})]
					}),
					/* @__PURE__ */ (0, j.jsx)("p", {
						className: "home-sr",
						role: "status",
						children: v ? x : ""
					})
				]
			})
		]
	});
}
//#endregion
//#region studio-ui/src/features/home/hooks/usePreviewViewport.ts
function R() {
	let e = (0, s.useRef)(null), [t, n] = (0, s.useState)({
		visible: !1,
		width: 0
	});
	return (0, s.useEffect)(() => {
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
function z(e) {
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
function B({ title: e, detail: t }) {
	return /* @__PURE__ */ (0, j.jsxs)("div", {
		className: "home-preview-placeholder",
		children: [
			/* @__PURE__ */ (0, j.jsx)("span", {
				className: "home-preview-symbol",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, j.jsx)(M, { kind: "folder" })
			}),
			/* @__PURE__ */ (0, j.jsx)("span", {
				className: "home-preview-title",
				children: e
			}),
			/* @__PURE__ */ (0, j.jsx)("span", {
				className: "home-preview-detail",
				children: t
			})
		]
	});
}
function V({ url: e, width: t, name: n }) {
	let [r, i] = (0, s.useState)("loading");
	return (0, s.useEffect)(() => {
		if (r !== "loading") return;
		let e = window.setTimeout(() => i("failed"), 2e4);
		return () => window.clearTimeout(e);
	}, [r]), r === "failed" ? /* @__PURE__ */ (0, j.jsx)(B, {
		title: "Aperçu indisponible",
		detail: "Le chargement n’a pas abouti. Ouvrez le projet pour le consulter."
	}) : /* @__PURE__ */ (0, j.jsxs)(j.Fragment, { children: [/* @__PURE__ */ (0, j.jsx)("div", {
		className: "home-preview-frame",
		"aria-hidden": "true",
		inert: !0,
		children: /* @__PURE__ */ (0, j.jsx)("iframe", {
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
	}), r === "loading" ? /* @__PURE__ */ (0, j.jsxs)("div", {
		className: "home-preview-loading",
		children: [/* @__PURE__ */ (0, j.jsx)("span", {
			className: "home-spinner",
			"aria-hidden": "true"
		}), " Chargement de l’aperçu…"]
	}) : null] });
}
function H({ project: e }) {
	let t = R(), n = e.preview, r = z(e), i;
	return i = n?.status === "empty" ? /* @__PURE__ */ (0, j.jsx)(B, {
		title: "Votre idée prend forme",
		detail: "Aucune version générée pour le moment."
	}) : n?.status === "unavailable" && n.reason === "source-only" ? /* @__PURE__ */ (0, j.jsx)(B, {
		title: "Sources sans aperçu",
		detail: "Le projet reste consultable dans Studio."
	}) : r ? t.visible && t.width > 0 ? /* @__PURE__ */ (0, j.jsx)(V, {
		url: r,
		width: t.width,
		name: e.name
	}, r) : /* @__PURE__ */ (0, j.jsx)(B, {
		title: "Aperçu du projet",
		detail: "Il se charge lorsque cette carte est visible."
	}) : /* @__PURE__ */ (0, j.jsx)(B, {
		title: "Aperçu indisponible",
		detail: "Ouvrez le projet pour retrouver son contexte."
	}), /* @__PURE__ */ (0, j.jsxs)("div", {
		ref: t.container,
		className: "home-project-preview",
		children: [i, r && n?.status === "ready" ? /* @__PURE__ */ (0, j.jsx)("span", {
			className: "home-preview-version",
			children: n.selection === "active" ? "Version active" : "Version proposée"
		}) : null]
	});
}
//#endregion
//#region studio-ui/src/features/home/components/RecentProjects.tsx
function U({ projects: e, loading: t, error: n, busy: r, searchRef: i, onRefresh: a, onOpen: o, onOther: c }) {
	let [u, d] = (0, s.useState)(""), f = e.filter((e) => h(e, u));
	return /* @__PURE__ */ (0, j.jsxs)("section", {
		className: "home-recents",
		"aria-labelledby": "home-recents-title",
		children: [
			/* @__PURE__ */ (0, j.jsxs)("div", {
				className: "home-section-heading",
				children: [/* @__PURE__ */ (0, j.jsxs)("div", { children: [/* @__PURE__ */ (0, j.jsx)("h2", {
					id: "home-recents-title",
					children: "Vos projets récents"
				}), /* @__PURE__ */ (0, j.jsx)("p", { children: "Retrouvez votre contexte, vos décisions et vos versions." })] }), /* @__PURE__ */ (0, j.jsx)("button", {
					type: "button",
					className: "home-refresh",
					disabled: t || r,
					onClick: a,
					children: t ? "Actualisation…" : "Actualiser"
				})]
			}),
			e.length ? /* @__PURE__ */ (0, j.jsxs)("label", {
				className: "home-search",
				children: [/* @__PURE__ */ (0, j.jsx)("span", {
					className: "home-sr",
					children: "Rechercher un projet"
				}), /* @__PURE__ */ (0, j.jsx)("input", {
					ref: i,
					type: "search",
					name: "project-search",
					autoComplete: "off",
					value: u,
					onChange: (e) => d(e.target.value),
					placeholder: "Rechercher un projet…"
				})]
			}) : null,
			n ? /* @__PURE__ */ (0, j.jsxs)("p", {
				role: "alert",
				className: "home-error",
				children: [
					n,
					" ",
					e.length ? "Vos projets déjà chargés restent visibles. " : "",
					"Actualisez pour réessayer."
				]
			}) : null,
			t && !e.length ? /* @__PURE__ */ (0, j.jsx)("p", {
				className: "home-empty",
				role: "status",
				children: "Lecture de vos projets…"
			}) : null,
			!t && !n && !e.length ? /* @__PURE__ */ (0, j.jsxs)("div", {
				className: "home-empty",
				children: [
					/* @__PURE__ */ (0, j.jsx)(M, { kind: "folder" }),
					/* @__PURE__ */ (0, j.jsx)("h3", { children: "Votre prochain projet commence ici" }),
					/* @__PURE__ */ (0, j.jsx)("p", { children: "Créez un projet ou importez vos sources. Ils apparaîtront ici pour les retrouver facilement." })
				]
			}) : null,
			e.length && !f.length ? /* @__PURE__ */ (0, j.jsx)("p", {
				className: "home-empty",
				role: "status",
				children: "Aucun projet ne correspond à cette recherche."
			}) : null,
			/* @__PURE__ */ (0, j.jsx)("ul", {
				className: "home-project-list",
				children: f.map((e) => /* @__PURE__ */ (0, j.jsxs)("li", {
					className: "home-project-card",
					children: [/* @__PURE__ */ (0, j.jsx)(H, { project: e }), /* @__PURE__ */ (0, j.jsxs)("button", {
						type: "button",
						className: "home-project",
						disabled: r,
						onClick: () => o(e),
						"aria-label": `Ouvrir ${e.name}`,
						children: [
							/* @__PURE__ */ (0, j.jsxs)("span", {
								className: "home-project-copy",
								children: [/* @__PURE__ */ (0, j.jsx)("strong", { children: e.name }), /* @__PURE__ */ (0, j.jsx)("span", {
									className: "home-project-path",
									title: e.workspace,
									children: e.workspace
								})]
							}),
							/* @__PURE__ */ (0, j.jsx)("span", {
								className: "home-project-arrow",
								"aria-hidden": "true",
								children: "↗"
							}),
							/* @__PURE__ */ (0, j.jsxs)("span", {
								className: "home-project-meta",
								children: [/* @__PURE__ */ (0, j.jsx)("span", { children: l[e.kind] }), /* @__PURE__ */ (0, j.jsx)("time", {
									dateTime: e.lastOpenedAt || e.createdAt,
									children: _(e)
								})]
							})
						]
					})]
				}, e.id))
			}),
			/* @__PURE__ */ (0, j.jsxs)("button", {
				type: "button",
				className: "home-other",
				disabled: r,
				onClick: (e) => c(e.currentTarget),
				children: ["Ouvrir un autre dossier Studio ", /* @__PURE__ */ (0, j.jsx)("span", {
					"aria-hidden": "true",
					children: "↗"
				})]
			})
		]
	});
}
//#endregion
//#region studio-ui/src/features/home/components/ComposerReferences.tsx
function W({ composer: e }) {
	let [t, n] = (0, s.useState)(""), r = (0, s.useRef)(null), i = (0, s.useRef)(null), a = (0, s.useRef)(null);
	function o() {
		e.addLink(t) && n(""), r.current?.focus();
	}
	return /* @__PURE__ */ (0, j.jsxs)(j.Fragment, { children: [
		/* @__PURE__ */ (0, j.jsx)("p", {
			className: "composer-option-intro",
			children: "Montrez ce qui vous inspire : un écran, un document ou un site à étudier."
		}),
		/* @__PURE__ */ (0, j.jsx)("input", {
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
		/* @__PURE__ */ (0, j.jsxs)("button", {
			ref: a,
			type: "button",
			className: "composer-file-drop",
			disabled: e.busy || e.draft.attachments.length >= S.attachments,
			onClick: () => i.current?.click(),
			children: [
				/* @__PURE__ */ (0, j.jsx)("span", {
					className: "composer-upload-mark",
					"aria-hidden": "true",
					children: "↑"
				}),
				/* @__PURE__ */ (0, j.jsx)("strong", { children: e.reading ? "Lecture des fichiers…" : "Ajouter des fichiers" }),
				/* @__PURE__ */ (0, j.jsx)("span", { children: "PNG, JPEG, WebP, TXT ou Markdown" }),
				/* @__PURE__ */ (0, j.jsx)("small", { children: "4 fichiers maximum · 2 Mio par fichier" })
			]
		}),
		e.draft.attachments.length ? /* @__PURE__ */ (0, j.jsx)("ul", {
			className: "composer-reference-list",
			"aria-label": "Fichiers joints",
			children: e.draft.attachments.map((t, n) => /* @__PURE__ */ (0, j.jsxs)("li", { children: [/* @__PURE__ */ (0, j.jsxs)("span", { children: [/* @__PURE__ */ (0, j.jsx)("strong", { children: t.name }), /* @__PURE__ */ (0, j.jsx)("small", { children: t.mime.startsWith("image/") ? "Image de référence" : "Document de référence" })] }), /* @__PURE__ */ (0, j.jsx)("button", {
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
		/* @__PURE__ */ (0, j.jsx)("label", {
			className: "composer-field",
			htmlFor: "composer-reference-link",
			children: "Un lien de référence"
		}),
		/* @__PURE__ */ (0, j.jsxs)("div", {
			className: "composer-link-entry",
			children: [/* @__PURE__ */ (0, j.jsx)("input", {
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
			}), /* @__PURE__ */ (0, j.jsx)("button", {
				type: "button",
				disabled: e.busy,
				onClick: o,
				children: "Ajouter"
			})]
		}),
		e.draft.links.length ? /* @__PURE__ */ (0, j.jsx)("ul", {
			className: "composer-reference-list",
			"aria-label": "Liens de référence",
			children: e.draft.links.map((t, n) => /* @__PURE__ */ (0, j.jsxs)("li", { children: [/* @__PURE__ */ (0, j.jsx)("span", {
				className: "composer-reference-url",
				title: t,
				children: t
			}), /* @__PURE__ */ (0, j.jsx)("button", {
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
		/* @__PURE__ */ (0, j.jsx)("p", {
			className: "composer-option-note",
			children: "5 liens maximum. Ils seront transmis comme références ; aucun site n’est consulté automatiquement."
		})
	] });
}
//#endregion
//#region studio-ui/src/features/home/components/ComposerTools.tsx
function ae({ composer: e }) {
	let [t, n] = (0, s.useState)(""), [a, o] = (0, s.useState)("all"), c = e.catalog, l = (c?.options || []).filter((e) => k(e, t)), u = l.filter((e) => a === "all" || e.capabilities.includes(a));
	return /* @__PURE__ */ (0, j.jsxs)(j.Fragment, { children: [/* @__PURE__ */ (0, j.jsx)(i, {
		controller: e.mcp,
		selectedIds: e.draft.mcpConnectionIds,
		onToggle: e.toggleMcp,
		disabled: e.busy
	}), /* @__PURE__ */ (0, j.jsxs)("section", {
		className: "composer-application-services",
		"aria-label": "API et services du projet",
		children: [
			/* @__PURE__ */ (0, j.jsx)("h3", { children: "API et services du projet" }),
			/* @__PURE__ */ (0, j.jsx)("p", {
				className: "composer-option-intro",
				children: "Proposez les services que vous souhaitez utiliser. L’agent vérifiera leur intérêt et leur accès avec vous."
			}),
			/* @__PURE__ */ (0, j.jsxs)("div", {
				className: "composer-tool-filters",
				children: [/* @__PURE__ */ (0, j.jsxs)("label", { children: [/* @__PURE__ */ (0, j.jsx)("span", {
					className: "home-sr",
					children: "Rechercher un outil ou un service"
				}), /* @__PURE__ */ (0, j.jsx)("input", {
					type: "search",
					name: "composer-tool-search",
					autoComplete: "off",
					value: t,
					onChange: (e) => n(e.target.value),
					placeholder: "Rechercher un outil ou un service…",
					disabled: e.busy
				})] }), /* @__PURE__ */ (0, j.jsxs)("label", { children: [/* @__PURE__ */ (0, j.jsx)("span", {
					className: "home-sr",
					children: "Catégorie des outils"
				}), /* @__PURE__ */ (0, j.jsxs)("select", {
					value: a,
					onChange: (e) => o(e.target.value),
					disabled: e.busy,
					"aria-label": "Catégorie des outils",
					children: [/* @__PURE__ */ (0, j.jsxs)("option", {
						value: "all",
						children: [
							"Toutes les catégories (",
							l.length,
							")"
						]
					}), (c?.capabilities || []).map((e) => /* @__PURE__ */ (0, j.jsxs)("option", {
						value: e.id,
						children: [
							e.title,
							" (",
							l.filter((t) => t.capabilities.includes(e.id)).length,
							")"
						]
					}, e.id))]
				})] })]
			}),
			e.catalogLoading ? /* @__PURE__ */ (0, j.jsx)("p", {
				className: "composer-option-note",
				role: "status",
				children: "Chargement du catalogue…"
			}) : null,
			e.catalogError ? /* @__PURE__ */ (0, j.jsxs)("div", {
				className: "composer-catalog-error",
				children: [/* @__PURE__ */ (0, j.jsx)("p", {
					role: "alert",
					children: e.catalogError
				}), /* @__PURE__ */ (0, j.jsx)("button", {
					type: "button",
					onClick: () => void e.loadCatalog(),
					disabled: e.catalogLoading || e.busy,
					children: "Réessayer le catalogue"
				})]
			}) : null,
			/* @__PURE__ */ (0, j.jsxs)("div", {
				className: "composer-tool-count",
				role: "status",
				children: [
					e.draft.connectors.length,
					" sélectionné",
					e.draft.connectors.length > 1 ? "s" : "",
					" · 12 maximum"
				]
			}),
			/* @__PURE__ */ (0, j.jsx)("div", {
				className: "composer-tool-grid",
				children: u.map((t) => /* @__PURE__ */ (0, j.jsxs)("label", {
					className: "composer-tool-option",
					children: [
						/* @__PURE__ */ (0, j.jsx)("input", {
							type: "checkbox",
							name: "preferred-connector",
							value: t.id,
							checked: e.draft.connectors.includes(t.id),
							disabled: e.busy,
							onChange: () => e.toggleConnector(t.id)
						}),
						/* @__PURE__ */ (0, j.jsx)(r, {
							optionId: t.id,
							size: 28
						}),
						/* @__PURE__ */ (0, j.jsxs)("span", { children: [/* @__PURE__ */ (0, j.jsx)("strong", { children: t.title }), /* @__PURE__ */ (0, j.jsx)("small", { children: t.description })] })
					]
				}, t.id))
			}),
			c && !u.length ? /* @__PURE__ */ (0, j.jsx)("p", {
				className: "composer-option-note",
				children: "Aucun outil ne correspond à ce filtre."
			}) : null,
			/* @__PURE__ */ (0, j.jsx)("p", {
				className: "composer-option-note",
				children: "Une préférence ne configure aucune connexion et n’accorde aucun accès à vos comptes."
			})
		]
	})] });
}
//#endregion
//#region studio-ui/src/features/home/components/ComposerOptions.tsx
var oe = [
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
function se({ open: e, section: t, composer: n, onSection: r, onDismiss: i }) {
	let a = (0, s.useRef)(null), o = (0, s.useRef)(null);
	return (0, s.useEffect)(() => {
		let t = a.current;
		e && t && !t.open ? (t.showModal(), o.current?.focus()) : !e && t?.open && t.close();
	}, [e]), /* @__PURE__ */ (0, j.jsxs)("dialog", {
		ref: a,
		className: "composer-options-dialog",
		"aria-labelledby": "composer-options-title",
		onClose: i,
		children: [
			/* @__PURE__ */ (0, j.jsxs)("header", {
				className: "composer-options-header",
				children: [/* @__PURE__ */ (0, j.jsxs)("div", { children: [/* @__PURE__ */ (0, j.jsx)("span", {
					className: "home-eyebrow",
					children: "Donnez une direction à votre idée"
				}), /* @__PURE__ */ (0, j.jsx)("h2", {
					ref: o,
					tabIndex: -1,
					id: "composer-options-title",
					children: "Préparer mon projet"
				})] }), /* @__PURE__ */ (0, j.jsx)("button", {
					type: "button",
					className: "composer-close",
					"aria-label": "Fermer les options",
					onClick: i,
					children: "×"
				})]
			}),
			/* @__PURE__ */ (0, j.jsx)("nav", {
				className: "composer-options-nav",
				"aria-label": "Options du projet",
				children: oe.map((e) => /* @__PURE__ */ (0, j.jsx)("button", {
					type: "button",
					"aria-pressed": t === e.id,
					onClick: () => r(e.id),
					disabled: n.busy,
					children: e.label
				}, e.id))
			}),
			/* @__PURE__ */ (0, j.jsxs)("div", {
				className: "composer-options-body",
				children: [
					/* @__PURE__ */ (0, j.jsx)("section", {
						className: "composer-options-pane",
						hidden: t !== "references",
						"aria-label": "Références du projet",
						children: /* @__PURE__ */ (0, j.jsx)(W, { composer: n })
					}),
					/* @__PURE__ */ (0, j.jsxs)("section", {
						className: "composer-options-pane",
						hidden: t !== "design",
						"aria-label": "Direction visuelle",
						children: [
							/* @__PURE__ */ (0, j.jsx)("p", {
								className: "composer-option-intro",
								children: "Indiquez une ambiance, des couleurs ou une manière de présenter le contenu."
							}),
							/* @__PURE__ */ (0, j.jsx)("div", {
								className: "composer-style-grid",
								children: w.map((e, t) => {
									let r = `${e.title}. ${e.description}`;
									return /* @__PURE__ */ (0, j.jsxs)("button", {
										className: `composer-style composer-style-${t}`,
										type: "button",
										"aria-pressed": n.draft.design === r,
										onClick: () => n.setField("design", r),
										disabled: n.busy,
										children: [
											/* @__PURE__ */ (0, j.jsxs)("span", {
												className: "composer-style-swatch",
												"aria-hidden": "true",
												children: [
													/* @__PURE__ */ (0, j.jsx)("i", {}),
													/* @__PURE__ */ (0, j.jsx)("i", {}),
													/* @__PURE__ */ (0, j.jsx)("i", {})
												]
											}),
											/* @__PURE__ */ (0, j.jsx)("strong", { children: e.title }),
											/* @__PURE__ */ (0, j.jsx)("small", { children: e.description })
										]
									}, e.title);
								})
							}),
							/* @__PURE__ */ (0, j.jsx)("label", {
								className: "composer-field",
								htmlFor: "composer-design",
								children: "Votre direction visuelle"
							}),
							/* @__PURE__ */ (0, j.jsx)("textarea", {
								id: "composer-design",
								name: "design",
								autoComplete: "off",
								rows: 3,
								maxLength: S.design,
								value: n.draft.design,
								onChange: (e) => n.setField("design", e.target.value),
								placeholder: "Par exemple, une interface lumineuse et éditoriale, avec des accents verts…",
								disabled: n.busy
							}),
							/* @__PURE__ */ (0, j.jsx)("p", {
								className: "composer-option-note",
								children: "Ces pistes donnent une intention de style. Aucun kit de design n’est installé."
							})
						]
					}),
					/* @__PURE__ */ (0, j.jsx)("section", {
						className: "composer-options-pane",
						hidden: t !== "tools",
						"aria-label": "Outils proposés",
						children: /* @__PURE__ */ (0, j.jsx)(ae, { composer: n })
					}),
					/* @__PURE__ */ (0, j.jsxs)("section", {
						className: "composer-options-pane",
						hidden: t !== "project",
						"aria-label": "Nom du projet",
						children: [
							/* @__PURE__ */ (0, j.jsx)("p", {
								className: "composer-option-intro",
								children: "Vous pourrez faire évoluer ces informations dans le projet."
							}),
							/* @__PURE__ */ (0, j.jsxs)("label", {
								className: "composer-field",
								htmlFor: "composer-project-name",
								children: ["Nom du projet ", /* @__PURE__ */ (0, j.jsx)("span", { children: "· facultatif" })]
							}),
							/* @__PURE__ */ (0, j.jsx)("input", {
								id: "composer-project-name",
								name: "project-name",
								autoComplete: "off",
								maxLength: 200,
								value: n.draft.name,
								onChange: (e) => n.setField("name", e.target.value),
								placeholder: "Donnez un nom à votre idée…",
								disabled: n.busy
							}),
							/* @__PURE__ */ (0, j.jsx)("p", {
								className: "composer-option-note",
								children: "Vous pouvez laisser ce champ vide pour commencer avec un nom par défaut."
							})
						]
					}),
					n.error ? /* @__PURE__ */ (0, j.jsx)("p", {
						role: "alert",
						className: "composer-error",
						children: n.error
					}) : null
				]
			}),
			/* @__PURE__ */ (0, j.jsxs)("footer", {
				className: "composer-options-footer",
				children: [/* @__PURE__ */ (0, j.jsx)("span", { children: n.reading ? "Lecture des fichiers…" : "Vos choix restent modifiables." }), /* @__PURE__ */ (0, j.jsx)("button", {
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
function G({ composer: e }) {
	let { draft: t } = e;
	function n(t) {
		t(), e.textarea.current?.focus();
	}
	return !t.design && !t.connectors.length && !t.links.length && !t.attachments.length ? null : /* @__PURE__ */ (0, j.jsxs)("div", {
		className: "composer-preferences",
		"aria-label": "Préférences ajoutées",
		children: [
			t.design ? /* @__PURE__ */ (0, j.jsxs)("span", {
				className: "composer-chip",
				children: [/* @__PURE__ */ (0, j.jsxs)("span", {
					className: "composer-chip-label",
					title: t.design,
					children: ["Style : ", t.design.split(/[.\n]/)[0]]
				}), /* @__PURE__ */ (0, j.jsx)("button", {
					type: "button",
					disabled: e.busy,
					"aria-label": "Retirer la direction visuelle",
					onClick: () => n(() => e.setField("design", "")),
					children: "×"
				})]
			}) : null,
			t.connectors.map((t) => {
				let i = e.catalog?.options.find((e) => e.id === t)?.title || t;
				return /* @__PURE__ */ (0, j.jsxs)("span", {
					className: "composer-chip",
					children: [
						/* @__PURE__ */ (0, j.jsx)(r, {
							optionId: t,
							size: 18
						}),
						/* @__PURE__ */ (0, j.jsx)("span", {
							className: "composer-chip-label",
							children: i
						}),
						/* @__PURE__ */ (0, j.jsx)("button", {
							type: "button",
							disabled: e.busy,
							"aria-label": `Retirer ${i}`,
							onClick: () => n(() => e.toggleConnector(t)),
							children: "×"
						})
					]
				}, t);
			}),
			t.attachments.map((t, r) => /* @__PURE__ */ (0, j.jsxs)("span", {
				className: "composer-chip",
				children: [
					/* @__PURE__ */ (0, j.jsx)("span", {
						className: "composer-chip-mark",
						"aria-hidden": "true",
						children: "↗"
					}),
					/* @__PURE__ */ (0, j.jsx)("span", {
						className: "composer-chip-label",
						title: t.name,
						children: t.name
					}),
					/* @__PURE__ */ (0, j.jsx)("button", {
						type: "button",
						disabled: e.busy,
						"aria-label": `Retirer le fichier ${t.name}`,
						onClick: () => n(() => e.removeAttachment(r)),
						children: "×"
					})
				]
			}, `${r}:${t.name}`)),
			t.links.map((t, r) => /* @__PURE__ */ (0, j.jsxs)("span", {
				className: "composer-chip",
				children: [
					/* @__PURE__ */ (0, j.jsx)("span", {
						className: "composer-chip-mark",
						"aria-hidden": "true",
						children: "↗"
					}),
					/* @__PURE__ */ (0, j.jsx)("span", {
						className: "composer-chip-label",
						title: t,
						children: new URL(t).hostname
					}),
					/* @__PURE__ */ (0, j.jsx)("button", {
						type: "button",
						disabled: e.busy,
						"aria-label": `Retirer le lien ${t}`,
						onClick: () => n(() => e.removeLink(r)),
						children: "×"
					})
				]
			}, t))
		]
	});
}
//#endregion
//#region studio-ui/src/features/home/hooks/useComposerPlaceholder.ts
var K = [
	"Une boutique pour mes créations, avec une collection à découvrir et un panier…",
	"Une application pour réserver des ateliers et suivre les inscriptions…",
	"Un tableau de bord qui rend les chiffres de mon activité faciles à comprendre…",
	"Un portfolio qui raconte mon travail et donne envie de me contacter…",
	"Un espace partagé pour transformer les idées de mon équipe en projets…"
], ce = "Décrivez votre idée. À qui s’adresse-t-elle, et que doit-elle permettre de faire ?";
function q(e) {
	let [t, n] = (0, s.useState)("Une boutique");
	return (0, s.useEffect)(() => {
		if (!e) return;
		let t = window.matchMedia?.("(prefers-reduced-motion: reduce)"), r, i = 0, a = 12, o = !1;
		function s(e) {
			r = setTimeout(c, e);
		}
		function c() {
			if (document.hidden) return;
			if (t?.matches) {
				n(K[0]);
				return;
			}
			let e = K[i] ?? K[0];
			a += o ? -1 : 1, n(e.slice(0, a)), a === e.length ? (o = !0, s(2300)) : a === 0 ? (o = !1, i = (i + 1) % K.length, s(350)) : s(o ? 18 : 48);
		}
		function l() {
			clearTimeout(r), document.hidden || s(150);
		}
		return t?.addEventListener("change", l), document.addEventListener("visibilitychange", l), l(), () => {
			clearTimeout(r), t?.removeEventListener("change", l), document.removeEventListener("visibilitychange", l);
		};
	}, [e]), e ? `Imaginez… ${t}` : ce;
}
//#endregion
//#region studio-ui/src/features/home/components/IdeaComposer.tsx
function le(e) {
	let { composer: t } = e, [n, r] = (0, s.useState)(!1), i = q(!n && !t.draft.idea && !t.busy), [a, c] = (0, s.useState)({
		open: !1,
		section: "references"
	}), l = (0, s.useRef)(null);
	function u(e) {
		c({
			open: !0,
			section: e
		}), e === "tools" && !t.catalog && !t.catalogLoading && t.loadCatalog();
	}
	function d(e, t) {
		l.current = t, u(e);
	}
	function f() {
		c((e) => ({
			...e,
			open: !1
		})), l.current?.focus();
	}
	let p = E(e.operation, t.reading);
	return /* @__PURE__ */ (0, j.jsxs)("div", {
		className: "idea-composer-wrap",
		children: [
			/* @__PURE__ */ (0, j.jsxs)("form", {
				className: "idea-composer",
				onSubmit: (e) => {
					e.preventDefault(), t.submit();
				},
				children: [
					/* @__PURE__ */ (0, j.jsx)("label", {
						className: "home-sr",
						htmlFor: "composer-idea",
						children: "Décrivez votre idée"
					}),
					/* @__PURE__ */ (0, j.jsx)("textarea", {
						ref: t.textarea,
						id: "composer-idea",
						name: "idea",
						rows: 4,
						maxLength: S.idea,
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
					/* @__PURE__ */ (0, j.jsx)(G, { composer: t }),
					/* @__PURE__ */ (0, j.jsxs)("div", {
						className: "composer-toolbar",
						children: [/* @__PURE__ */ (0, j.jsxs)("div", {
							className: "composer-option-actions",
							children: [
								/* @__PURE__ */ (0, j.jsx)("button", {
									type: "button",
									className: "composer-add",
									disabled: t.busy,
									"aria-label": "Ajouter des références",
									title: "Ajouter des références",
									onClick: (e) => d("references", e.currentTarget),
									children: /* @__PURE__ */ (0, j.jsx)("span", {
										"aria-hidden": "true",
										children: "+"
									})
								}),
								/* @__PURE__ */ (0, j.jsxs)("button", {
									type: "button",
									disabled: t.busy,
									onClick: (e) => d("design", e.currentTarget),
									children: [/* @__PURE__ */ (0, j.jsx)("span", {
										className: "composer-style-symbol",
										"aria-hidden": "true",
										children: "◒"
									}), "Design"]
								}),
								/* @__PURE__ */ (0, j.jsxs)("button", {
									type: "button",
									disabled: t.busy,
									onClick: (e) => d("tools", e.currentTarget),
									children: [/* @__PURE__ */ (0, j.jsx)("span", {
										className: "composer-tools-symbol",
										"aria-hidden": "true",
										children: "⌘"
									}), "Outils"]
								})
							]
						}), /* @__PURE__ */ (0, j.jsxs)("div", {
							className: "composer-submit-actions",
							children: [/* @__PURE__ */ (0, j.jsxs)("label", {
								className: "composer-mode",
								children: [/* @__PURE__ */ (0, j.jsx)("span", {
									className: "home-sr",
									children: "Première étape"
								}), /* @__PURE__ */ (0, j.jsxs)("select", {
									name: "launch-action",
									value: t.draft.action,
									disabled: t.busy,
									onChange: (e) => t.setField("action", e.target.value),
									children: [/* @__PURE__ */ (0, j.jsx)("option", {
										value: "build",
										children: "Construire"
									}), /* @__PURE__ */ (0, j.jsx)("option", {
										value: "plan",
										children: "Planifier"
									})]
								})]
							}), /* @__PURE__ */ (0, j.jsxs)("button", {
								type: "submit",
								className: "primary composer-start",
								disabled: t.busy,
								children: [
									t.busy ? /* @__PURE__ */ (0, j.jsx)("span", {
										className: "home-spinner",
										"aria-hidden": "true"
									}) : null,
									p,
									/* @__PURE__ */ (0, j.jsx)("span", {
										"aria-hidden": "true",
										children: "↑"
									})
								]
							})]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, j.jsx)(o, {
				connections: t.mcp.connections,
				selectedIds: t.draft.mcpConnectionIds,
				onToggle: t.toggleMcp,
				onManage: (e) => d("tools", e),
				disabled: t.busy
			}),
			/* @__PURE__ */ (0, j.jsx)("div", {
				className: "composer-type-pills",
				role: "group",
				"aria-label": "Type de projet",
				children: C.map((e) => /* @__PURE__ */ (0, j.jsx)("button", {
					type: "button",
					"aria-pressed": t.draft.projectType === e.id,
					disabled: t.busy,
					onClick: () => t.selectType(e.id),
					children: e.label
				}, e.id))
			}),
			/* @__PURE__ */ (0, j.jsx)("p", {
				className: "composer-help",
				id: "composer-help",
				children: "La demande sera transmise à l’agent du projet. Elle attendra sa prise en charge."
			}),
			e.operation.project ? /* @__PURE__ */ (0, j.jsxs)("p", {
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
			t.error || e.operation.error ? /* @__PURE__ */ (0, j.jsx)("p", {
				role: "alert",
				className: "composer-error",
				children: t.error || e.operation.error
			}) : null,
			/* @__PURE__ */ (0, j.jsx)("p", {
				role: "status",
				className: "home-sr",
				children: t.busy ? p : ""
			}),
			/* @__PURE__ */ (0, j.jsx)(se, {
				...a,
				composer: t,
				onSection: u,
				onDismiss: f
			})
		]
	});
}
//#endregion
//#region studio-ui/src/features/home/model/starters.ts
var ue = [
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
], de = [
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
function J(e) {
	return e.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("fr");
}
function fe(e, t) {
	let n = J(e.trim()).split(/\s+/);
	return de.filter((e) => {
		let r = J(`${e.title} ${e.description} ${e.seed.idea}`);
		return (t === "all" || e.category === t) && n.every((e) => r.includes(e));
	});
}
//#endregion
//#region studio-ui/src/features/home/components/StarterGallery.tsx
function pe() {
	let [e, t] = (0, s.useState)("Tous");
	return /* @__PURE__ */ (0, j.jsxs)("div", {
		className: "sg-preview sg-atelier",
		children: [
			/* @__PURE__ */ (0, j.jsxs)("div", {
				className: "sg-mini-nav",
				children: [/* @__PURE__ */ (0, j.jsx)("b", { children: "atelier." }), /* @__PURE__ */ (0, j.jsx)("span", { children: "STUDIO INDÉPENDANT · DÉMO" })]
			}),
			/* @__PURE__ */ (0, j.jsxs)("div", {
				className: "sg-editorial-hero",
				children: [/* @__PURE__ */ (0, j.jsxs)("h3", { children: [
					"Des idées",
					/* @__PURE__ */ (0, j.jsx)("br", {}),
					"qui prennent ",
					/* @__PURE__ */ (0, j.jsx)("em", { children: "forme." })
				] }), /* @__PURE__ */ (0, j.jsxs)("div", {
					className: "sg-sculpture",
					"aria-hidden": "true",
					children: [
						/* @__PURE__ */ (0, j.jsx)("i", {}),
						/* @__PURE__ */ (0, j.jsx)("i", {}),
						/* @__PURE__ */ (0, j.jsx)("i", {})
					]
				})]
			}),
			/* @__PURE__ */ (0, j.jsx)("div", {
				className: "sg-mini-controls",
				"aria-label": "Discipline des projets",
				children: [
					"Tous",
					"Identité",
					"Édition"
				].map((n) => /* @__PURE__ */ (0, j.jsx)("button", {
					type: "button",
					"aria-pressed": e === n,
					onClick: () => t(n),
					children: n
				}, n))
			}),
			/* @__PURE__ */ (0, j.jsx)("ul", {
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
				].filter((t) => e === "Tous" || t.category === e).map((e) => /* @__PURE__ */ (0, j.jsxs)("li", { children: [
					/* @__PURE__ */ (0, j.jsx)("span", {
						className: `sg-project-art sg-art-${e.tone}`,
						"aria-hidden": "true"
					}),
					/* @__PURE__ */ (0, j.jsx)("b", { children: e.name }),
					/* @__PURE__ */ (0, j.jsx)("small", { children: e.category })
				] }, e.name))
			})
		]
	});
}
var Y = {
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
function me() {
	let [e, t] = (0, s.useState)("week"), n = Y[e];
	return /* @__PURE__ */ (0, j.jsxs)("div", {
		className: "sg-preview sg-pulse",
		children: [
			/* @__PURE__ */ (0, j.jsxs)("div", {
				className: "sg-mini-nav",
				children: [/* @__PURE__ */ (0, j.jsxs)("b", { children: [/* @__PURE__ */ (0, j.jsx)("span", {
					"aria-hidden": "true",
					children: "◈"
				}), " pulse"] }), /* @__PURE__ */ (0, j.jsx)("span", { children: "ESPACE DÉMO" })]
			}),
			/* @__PURE__ */ (0, j.jsxs)("div", {
				className: "sg-dashboard-heading",
				children: [/* @__PURE__ */ (0, j.jsxs)("div", { children: [/* @__PURE__ */ (0, j.jsx)("small", { children: "VUE D’ENSEMBLE" }), /* @__PURE__ */ (0, j.jsx)("h3", { children: "Chaque signal compte." })] }), /* @__PURE__ */ (0, j.jsx)("div", {
					className: "sg-mini-controls",
					"aria-label": "Période des données démo",
					children: ["week", "month"].map((n) => /* @__PURE__ */ (0, j.jsx)("button", {
						type: "button",
						"aria-pressed": e === n,
						onClick: () => t(n),
						children: Y[n].label
					}, n))
				})]
			}),
			/* @__PURE__ */ (0, j.jsxs)("div", {
				className: "sg-metrics",
				children: [/* @__PURE__ */ (0, j.jsxs)("div", { children: [
					/* @__PURE__ */ (0, j.jsxs)("span", { children: ["Visites · ", n.label] }),
					/* @__PURE__ */ (0, j.jsx)("strong", {
						"aria-live": "polite",
						children: n.total
					}),
					/* @__PURE__ */ (0, j.jsxs)("small", { children: [n.change, " · données fictives"] })
				] }), /* @__PURE__ */ (0, j.jsxs)("div", { children: [
					/* @__PURE__ */ (0, j.jsx)("span", { children: "Objectif de la démo" }),
					/* @__PURE__ */ (0, j.jsxs)("strong", { children: ["78", /* @__PURE__ */ (0, j.jsx)("small", { children: " %" })] }),
					/* @__PURE__ */ (0, j.jsx)("span", {
						className: "sg-meter",
						"aria-hidden": "true"
					})
				] })]
			}),
			/* @__PURE__ */ (0, j.jsx)("div", {
				className: "sg-chart",
				role: "img",
				"aria-label": `Tendance illustrative sur ${n.label}, ${n.total} visites fictives`,
				children: n.bars.map((e, t) => /* @__PURE__ */ (0, j.jsx)("span", { style: { height: `${e}%` } }, t))
			}),
			/* @__PURE__ */ (0, j.jsxs)("div", {
				className: "sg-chart-caption",
				children: [/* @__PURE__ */ (0, j.jsx)("span", { children: "Début de période" }), /* @__PURE__ */ (0, j.jsx)("span", { children: "Aujourd’hui · démo" })]
			})
		]
	});
}
function he() {
	let [e, t] = (0, s.useState)(0);
	return /* @__PURE__ */ (0, j.jsxs)("div", {
		className: "sg-preview sg-rivage",
		children: [
			/* @__PURE__ */ (0, j.jsxs)("div", {
				className: "sg-mini-nav",
				children: [/* @__PURE__ */ (0, j.jsx)("b", { children: "RIVAGE" }), /* @__PURE__ */ (0, j.jsx)("span", { children: "OBJETS DU QUOTIDIEN · DÉMO" })]
			}),
			/* @__PURE__ */ (0, j.jsxs)("div", {
				className: "sg-commerce-hero",
				children: [/* @__PURE__ */ (0, j.jsxs)("div", { children: [
					/* @__PURE__ */ (0, j.jsx)("small", { children: "LA COLLECTION CALME" }),
					/* @__PURE__ */ (0, j.jsxs)("h3", { children: [
						"Faire place",
						/* @__PURE__ */ (0, j.jsx)("br", {}),
						"à l’essentiel."
					] }),
					/* @__PURE__ */ (0, j.jsxs)("p", { children: [
						"Des formes simples.",
						/* @__PURE__ */ (0, j.jsx)("br", {}),
						"Des jours plus doux."
					] })
				] }), /* @__PURE__ */ (0, j.jsxs)("div", {
					className: "sg-vase-scene",
					"aria-hidden": "true",
					children: [
						/* @__PURE__ */ (0, j.jsx)("i", { className: "sg-vase" }),
						/* @__PURE__ */ (0, j.jsx)("i", { className: "sg-branch" }),
						/* @__PURE__ */ (0, j.jsx)("i", { className: "sg-sun" })
					]
				})]
			}),
			/* @__PURE__ */ (0, j.jsxs)("div", {
				className: "sg-product",
				children: [
					/* @__PURE__ */ (0, j.jsxs)("div", { children: [/* @__PURE__ */ (0, j.jsx)("strong", { children: "Vase Sillage" }), /* @__PURE__ */ (0, j.jsx)("span", { children: "Grès naturel · objet fictif" })] }),
					/* @__PURE__ */ (0, j.jsx)("b", { children: "48 €" }),
					/* @__PURE__ */ (0, j.jsx)("button", {
						type: "button",
						onClick: () => t((e) => Math.min(9, e + 1)),
						disabled: e === 9,
						children: "Ajouter à la sélection"
					})
				]
			}),
			/* @__PURE__ */ (0, j.jsxs)("div", {
				className: "sg-selection",
				children: [/* @__PURE__ */ (0, j.jsxs)("p", {
					role: "status",
					children: [
						"Sélection démo : ",
						e,
						" ",
						e === 1 ? "objet" : "objets",
						" · aucune commande"
					]
				}), /* @__PURE__ */ (0, j.jsx)("button", {
					type: "button",
					disabled: e === 0,
					onClick: () => t((e) => Math.max(0, e - 1)),
					children: "Retirer un objet"
				})]
			})
		]
	});
}
function ge() {
	let [e, t] = (0, s.useState)("Mardi"), [n, r] = (0, s.useState)(null);
	return /* @__PURE__ */ (0, j.jsxs)("div", {
		className: "sg-preview sg-pause",
		children: [/* @__PURE__ */ (0, j.jsxs)("div", {
			className: "sg-mini-nav",
			children: [/* @__PURE__ */ (0, j.jsxs)("b", { children: ["pause", /* @__PURE__ */ (0, j.jsx)("span", {
				"aria-hidden": "true",
				children: " ✳"
			})] }), /* @__PURE__ */ (0, j.jsx)("span", { children: "STUDIO BIEN-ÊTRE · DÉMO" })]
		}), /* @__PURE__ */ (0, j.jsxs)("div", {
			className: "sg-booking-layout",
			children: [/* @__PURE__ */ (0, j.jsxs)("div", { children: [
				/* @__PURE__ */ (0, j.jsx)("span", {
					className: "sg-booking-flower",
					"aria-hidden": "true",
					children: "✳"
				}),
				/* @__PURE__ */ (0, j.jsxs)("h3", { children: [
					"Un moment.",
					/* @__PURE__ */ (0, j.jsx)("br", {}),
					"Juste pour vous."
				] }),
				/* @__PURE__ */ (0, j.jsxs)("p", { children: [
					"Séance découverte",
					/* @__PURE__ */ (0, j.jsx)("br", {}),
					/* @__PURE__ */ (0, j.jsx)("strong", { children: "45 minutes" })
				] })
			] }), /* @__PURE__ */ (0, j.jsxs)("div", {
				className: "sg-booking-picker",
				children: [
					/* @__PURE__ */ (0, j.jsx)("h4", { children: "Votre prochain rendez-vous" }),
					/* @__PURE__ */ (0, j.jsx)("div", {
						className: "sg-mini-controls",
						"aria-label": "Jour de démonstration",
						children: [
							"Mardi",
							"Mercredi",
							"Jeudi"
						].map((n) => /* @__PURE__ */ (0, j.jsx)("button", {
							type: "button",
							"aria-pressed": e === n,
							onClick: () => {
								t(n), r(null);
							},
							children: n
						}, n))
					}),
					/* @__PURE__ */ (0, j.jsxs)("p", { children: ["Créneaux fictifs · ", e] }),
					/* @__PURE__ */ (0, j.jsx)("div", {
						className: "sg-slots",
						"aria-label": "Créneau de démonstration",
						children: [
							"10:00",
							"11:30",
							"14:00",
							"16:30"
						].map((e) => /* @__PURE__ */ (0, j.jsx)("button", {
							type: "button",
							"aria-pressed": n === e,
							onClick: () => r(e),
							children: e
						}, e))
					}),
					/* @__PURE__ */ (0, j.jsx)("p", {
						className: "sg-booking-result",
						role: "status",
						children: n ? `${e} à ${n} sélectionné dans la démo.` : "Choisissez un créneau pour essayer."
					}),
					/* @__PURE__ */ (0, j.jsx)("small", { children: "Aucune réservation envoyée." })
				]
			})]
		})]
	});
}
function _e() {
	let [e, t] = (0, s.useState)(0), n = [
		"À faire",
		"En cours",
		"Terminé"
	];
	return /* @__PURE__ */ (0, j.jsxs)("div", {
		className: "sg-preview sg-collectif",
		children: [
			/* @__PURE__ */ (0, j.jsxs)("div", {
				className: "sg-mini-nav",
				children: [/* @__PURE__ */ (0, j.jsxs)("b", { children: ["collectif", /* @__PURE__ */ (0, j.jsx)("span", {
					"aria-hidden": "true",
					children: " ▪"
				})] }), /* @__PURE__ */ (0, j.jsx)("span", { children: "TABLEAU DÉMO" })]
			}),
			/* @__PURE__ */ (0, j.jsxs)("div", {
				className: "sg-board-heading",
				children: [/* @__PURE__ */ (0, j.jsxs)("div", { children: [/* @__PURE__ */ (0, j.jsx)("small", { children: "NOTRE PROCHAIN CHAPITRE" }), /* @__PURE__ */ (0, j.jsx)("h3", { children: "Lancement du studio" })] }), /* @__PURE__ */ (0, j.jsxs)("span", {
					className: "sg-avatars",
					"aria-hidden": "true",
					children: [
						/* @__PURE__ */ (0, j.jsx)("i", { children: "AM" }),
						/* @__PURE__ */ (0, j.jsx)("i", { children: "JL" }),
						/* @__PURE__ */ (0, j.jsx)("i", { children: "SO" })
					]
				})]
			}),
			/* @__PURE__ */ (0, j.jsx)("div", {
				className: "sg-board",
				children: n.map((n, r) => /* @__PURE__ */ (0, j.jsxs)("section", {
					"aria-label": n,
					children: [/* @__PURE__ */ (0, j.jsxs)("h4", { children: [
						/* @__PURE__ */ (0, j.jsx)("span", {
							"aria-hidden": "true",
							children: "●"
						}),
						" ",
						n
					] }), e === r ? /* @__PURE__ */ (0, j.jsxs)("div", {
						className: "sg-task",
						children: [
							/* @__PURE__ */ (0, j.jsx)("small", { children: "DESIGN" }),
							/* @__PURE__ */ (0, j.jsx)("strong", { children: "Esquisser la page d’accueil" }),
							/* @__PURE__ */ (0, j.jsx)("p", { children: "Clarifier le premier regard." }),
							e < 2 ? /* @__PURE__ */ (0, j.jsx)("button", {
								type: "button",
								onClick: () => t((e) => e + 1),
								children: e === 0 ? "Commencer" : "Terminer"
							}) : /* @__PURE__ */ (0, j.jsx)("span", { children: "Terminé dans la démo" })
						]
					}) : /* @__PURE__ */ (0, j.jsx)("p", {
						className: "sg-column-empty",
						children: "Place aux idées"
					})]
				}, n))
			}),
			/* @__PURE__ */ (0, j.jsxs)("div", {
				className: "sg-board-footer",
				children: [/* @__PURE__ */ (0, j.jsxs)("p", {
					role: "status",
					children: ["Tâche démo : ", n[e]]
				}), /* @__PURE__ */ (0, j.jsx)("button", {
					type: "button",
					onClick: () => t(0),
					disabled: e === 0,
					children: "Réinitialiser"
				})]
			})
		]
	});
}
var X = [
	{
		eyebrow: "01 / L’INTENTION",
		title: /* @__PURE__ */ (0, j.jsxs)(j.Fragment, { children: [
			"Moins de bruit.",
			/* @__PURE__ */ (0, j.jsx)("br", {}),
			/* @__PURE__ */ (0, j.jsx)("em", { children: "Plus d’idées." })
		] }),
		note: "Une autre façon de raconter ce qui compte."
	},
	{
		eyebrow: "02 / LE CHEMIN",
		title: /* @__PURE__ */ (0, j.jsxs)(j.Fragment, { children: [
			"Voir plus clair.",
			/* @__PURE__ */ (0, j.jsx)("br", {}),
			/* @__PURE__ */ (0, j.jsx)("em", { children: "Faire ensemble." })
		] }),
		note: "Observer. Choisir. Donner forme."
	},
	{
		eyebrow: "03 / LA SUITE",
		title: /* @__PURE__ */ (0, j.jsxs)(j.Fragment, { children: [
			"Une idée suffit.",
			/* @__PURE__ */ (0, j.jsx)("br", {}),
			/* @__PURE__ */ (0, j.jsx)("em", { children: "À vous la suite." })
		] }),
		note: "Quel changement voulez-vous rendre possible ?"
	}
];
function ve() {
	let [e, t] = (0, s.useState)(0), n = X[e];
	return /* @__PURE__ */ (0, j.jsxs)("div", {
		className: "sg-preview sg-perspective",
		children: [
			/* @__PURE__ */ (0, j.jsxs)("div", {
				className: "sg-mini-nav",
				children: [/* @__PURE__ */ (0, j.jsx)("b", { children: "perspective /" }), /* @__PURE__ */ (0, j.jsx)("span", { children: "PRÉSENTATION DÉMO" })]
			}),
			/* @__PURE__ */ (0, j.jsxs)("div", {
				className: "sg-slide-body",
				"aria-live": "polite",
				children: [
					/* @__PURE__ */ (0, j.jsx)("small", { children: n.eyebrow }),
					/* @__PURE__ */ (0, j.jsx)("h3", { children: n.title }),
					/* @__PURE__ */ (0, j.jsx)("p", { children: n.note }),
					/* @__PURE__ */ (0, j.jsx)("span", {
						className: "sg-slide-orbit",
						"aria-hidden": "true"
					})
				]
			}),
			/* @__PURE__ */ (0, j.jsxs)("div", {
				className: "sg-slide-controls",
				children: [/* @__PURE__ */ (0, j.jsxs)("span", { children: [
					"Diapositive ",
					e + 1,
					" sur ",
					X.length
				] }), /* @__PURE__ */ (0, j.jsxs)("div", { children: [/* @__PURE__ */ (0, j.jsx)("button", {
					type: "button",
					"aria-label": "Diapositive précédente",
					disabled: e === 0,
					onClick: () => t((e) => e - 1),
					children: "←"
				}), /* @__PURE__ */ (0, j.jsx)("button", {
					type: "button",
					"aria-label": "Diapositive suivante",
					disabled: e === X.length - 1,
					onClick: () => t((e) => e + 1),
					children: "→"
				})] })]
			})
		]
	});
}
var Z = {
	atelier: pe,
	pulse: me,
	rivage: he,
	pause: ge,
	collectif: _e,
	perspective: ve
};
function ye({ starter: e, onOpen: t }) {
	let n = Z[e.id];
	return /* @__PURE__ */ (0, j.jsxs)("article", {
		className: "sg-card",
		children: [/* @__PURE__ */ (0, j.jsx)("div", {
			className: "sg-thumbnail",
			"aria-hidden": "true",
			inert: !0,
			children: /* @__PURE__ */ (0, j.jsx)(n, {})
		}), /* @__PURE__ */ (0, j.jsxs)("button", {
			type: "button",
			className: "sg-card-open",
			"aria-label": `Explorer ${e.title}`,
			onClick: (n) => t(e, n.currentTarget),
			children: [/* @__PURE__ */ (0, j.jsxs)("span", { children: [/* @__PURE__ */ (0, j.jsx)("strong", { children: e.title }), /* @__PURE__ */ (0, j.jsx)("small", { children: e.description })] }), /* @__PURE__ */ (0, j.jsx)("span", {
				className: "sg-card-arrow",
				"aria-hidden": "true",
				children: "↗"
			})]
		})]
	});
}
function be({ onChoose: e }) {
	let [t, n] = (0, s.useState)(""), [r, i] = (0, s.useState)("all"), [a, o] = (0, s.useState)(null), c = (0, s.useRef)(null), l = (0, s.useRef)(null), u = (0, s.useRef)(null), d = (0, s.useId)(), f = (0, s.useId)(), p = (0, s.useId)(), m = fe(t, r), h = a ? Z[a.id] : null;
	(0, s.useEffect)(() => {
		if (!a || !c.current) return;
		let e = c.current;
		e.open || e.showModal(), e.querySelector(".sg-close")?.focus();
		let t = document.documentElement.style.overflow;
		return document.documentElement.style.overflow = "hidden", () => {
			document.documentElement.style.overflow = t;
		};
	}, [a]);
	function g(e, t) {
		l.current = t, u.current = null, o(e);
	}
	function _() {
		let t = u.current;
		u.current = null, o(null), l.current?.focus(), t && e(t);
	}
	return /* @__PURE__ */ (0, j.jsxs)("section", {
		className: "starter-gallery",
		"aria-labelledby": d,
		children: [
			/* @__PURE__ */ (0, j.jsxs)("div", {
				className: "sg-heading",
				children: [/* @__PURE__ */ (0, j.jsxs)("div", { children: [
					/* @__PURE__ */ (0, j.jsx)("span", {
						className: "sg-eyebrow",
						children: "POINTS DE DÉPART"
					}),
					/* @__PURE__ */ (0, j.jsx)("h2", {
						id: d,
						children: "Une inspiration, votre interprétation."
					}),
					/* @__PURE__ */ (0, j.jsx)("p", { children: "Explorez une idée en action, puis faites-en la vôtre." })
				] }), /* @__PURE__ */ (0, j.jsxs)("label", {
					className: "sg-search",
					children: [
						/* @__PURE__ */ (0, j.jsx)("span", {
							className: "sg-sr",
							children: "Rechercher une inspiration"
						}),
						/* @__PURE__ */ (0, j.jsx)("span", {
							"aria-hidden": "true",
							children: "⌕"
						}),
						/* @__PURE__ */ (0, j.jsx)("input", {
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
			/* @__PURE__ */ (0, j.jsxs)("div", {
				className: "sg-toolbar",
				children: [/* @__PURE__ */ (0, j.jsx)("div", {
					className: "sg-filters",
					"aria-label": "Catégories d’inspiration",
					children: ue.map((e) => /* @__PURE__ */ (0, j.jsx)("button", {
						type: "button",
						"aria-pressed": r === e.id,
						onClick: () => i(e.id),
						children: e.label
					}, e.id))
				}), /* @__PURE__ */ (0, j.jsxs)("p", {
					role: "status",
					children: [
						m.length,
						" ",
						m.length === 1 ? "inspiration" : "inspirations"
					]
				})]
			}),
			/* @__PURE__ */ (0, j.jsx)("div", {
				className: "sg-grid",
				children: m.map((e) => /* @__PURE__ */ (0, j.jsx)(ye, {
					starter: e,
					onOpen: g
				}, e.id))
			}),
			m.length === 0 ? /* @__PURE__ */ (0, j.jsxs)("div", {
				className: "sg-empty",
				children: [
					/* @__PURE__ */ (0, j.jsx)("h3", { children: "Aucune inspiration trouvée" }),
					/* @__PURE__ */ (0, j.jsx)("p", { children: "Essayez un autre mot ou explorez toutes les catégories." }),
					/* @__PURE__ */ (0, j.jsx)("button", {
						type: "button",
						onClick: () => {
							n(""), i("all");
						},
						children: "Voir toutes les inspirations"
					})
				]
			}) : null,
			/* @__PURE__ */ (0, j.jsx)("p", {
				className: "sg-note",
				children: "Aperçus interactifs avec données de démonstration. Votre choix prépare une idée à adapter, pas une application déjà construite."
			}),
			/* @__PURE__ */ (0, j.jsxs)("dialog", {
				ref: c,
				className: "sg-dialog",
				"aria-labelledby": f,
				"aria-describedby": p,
				onClose: _,
				onCancel: (e) => {
					e.preventDefault(), c.current?.close();
				},
				children: [
					/* @__PURE__ */ (0, j.jsxs)("header", {
						className: "sg-dialog-heading",
						children: [/* @__PURE__ */ (0, j.jsxs)("div", { children: [/* @__PURE__ */ (0, j.jsx)("span", {
							className: "sg-eyebrow",
							children: "EXPLORER UNE INSPIRATION"
						}), /* @__PURE__ */ (0, j.jsx)("h2", {
							id: f,
							children: a?.title
						})] }), /* @__PURE__ */ (0, j.jsx)("button", {
							className: "sg-close",
							type: "button",
							"aria-label": "Fermer l’aperçu",
							onClick: () => c.current?.close(),
							children: "×"
						})]
					}),
					/* @__PURE__ */ (0, j.jsxs)("div", {
						className: "sg-demo-note",
						id: p,
						children: [/* @__PURE__ */ (0, j.jsx)("span", { children: "Démo interactive" }), /* @__PURE__ */ (0, j.jsxs)("p", { children: [a?.interaction, " Les changements restent dans cet aperçu."] })]
					}),
					/* @__PURE__ */ (0, j.jsx)("div", {
						className: "sg-live-preview",
						children: h ? /* @__PURE__ */ (0, j.jsx)(h, {}, a?.id) : null
					}),
					/* @__PURE__ */ (0, j.jsxs)("footer", {
						className: "sg-dialog-footer",
						children: [/* @__PURE__ */ (0, j.jsxs)("p", { children: [
							"Cette inspiration prépare votre brief et sa direction visuelle.",
							/* @__PURE__ */ (0, j.jsx)("br", {}),
							"Aucun modèle source n’est importé."
						] }), /* @__PURE__ */ (0, j.jsxs)("button", {
							type: "button",
							className: "sg-use",
							onClick: () => {
								a && !u.current && (u.current = { ...a.seed }, c.current?.close());
							},
							children: ["Utiliser cette idée ", /* @__PURE__ */ (0, j.jsx)("span", {
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
function xe(e) {
	let t = x(e), [n, r] = (0, s.useState)({
		open: !1,
		kind: "new"
	}), i = (0, s.useRef)(null), a = (0, s.useRef)(null), [o, c] = (0, s.useState)(), [l, u] = (0, s.useState)("composer"), [d, f] = (0, s.useState)(null), p = (0, s.useRef)(!1), m = l === "composer" ? t.operation : {
		phase: t.operation.phase,
		project: null,
		error: ""
	}, h = A({
		operation: m,
		onSubmit: (e, n) => {
			u("composer"), t.run(e, n);
		},
		onEdit: t.clearOperation,
		seed: o
	}), g = h.busy;
	async function _(e) {
		if (g || p.current) return;
		p.current = !0, f(null), h.approveDeparture(), u("project");
		let n = await t.run(e);
		p.current = !1, n || h.cancelDeparture();
	}
	function v(e) {
		g || p.current || (h.hasUnsavedContent ? (n.open || (i.current = document.activeElement), f(e)) : _(e));
	}
	function y() {
		f(null), n.open || i.current?.focus();
	}
	function b(e, n) {
		g || (i.current = n, u("project"), t.clearOperation(), r({
			open: !0,
			kind: e
		}));
	}
	function S() {
		g || (r((e) => ({
			...e,
			open: !1
		})), i.current?.focus());
	}
	return /* @__PURE__ */ (0, j.jsxs)("div", {
		className: "home-shell",
		children: [
			/* @__PURE__ */ (0, j.jsx)("a", {
				className: "home-skip",
				href: "#home-main",
				children: "Aller aux projets"
			}),
			/* @__PURE__ */ (0, j.jsxs)("header", {
				className: "home-header",
				children: [/* @__PURE__ */ (0, j.jsxs)("a", {
					className: "home-brand",
					href: "/",
					"aria-label": "DevMethod, accueil",
					children: [/* @__PURE__ */ (0, j.jsxs)("span", {
						className: "home-mark",
						"aria-hidden": "true",
						children: ["D", /* @__PURE__ */ (0, j.jsx)("span", { children: "·" })]
					}), /* @__PURE__ */ (0, j.jsxs)("span", { children: ["DevMethod ", /* @__PURE__ */ (0, j.jsx)("small", { children: "Studio" })] })]
				}), /* @__PURE__ */ (0, j.jsxs)("nav", {
					className: "home-nav",
					"aria-label": "Accueil",
					children: [
						/* @__PURE__ */ (0, j.jsx)("a", {
							href: "#home-recents-title",
							children: "Mes projets"
						}),
						/* @__PURE__ */ (0, j.jsx)("a", {
							href: "#home-inspirations",
							children: "Galerie"
						}),
						/* @__PURE__ */ (0, j.jsxs)("span", {
							className: "home-local",
							children: [/* @__PURE__ */ (0, j.jsx)("span", { "aria-hidden": "true" }), " Espace local"]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, j.jsxs)("main", {
				id: "home-main",
				children: [
					/* @__PURE__ */ (0, j.jsxs)("section", {
						className: "home-hero",
						"aria-labelledby": "home-title",
						children: [
							/* @__PURE__ */ (0, j.jsx)("span", {
								className: "home-eyebrow",
								children: "L’espace où vos idées prennent forme"
							}),
							/* @__PURE__ */ (0, j.jsxs)("h1", {
								id: "home-title",
								children: ["Que voulez-vous ", /* @__PURE__ */ (0, j.jsx)("span", { children: "créer ?" })]
							}),
							/* @__PURE__ */ (0, j.jsxs)("p", { children: [
								"Un site, une application, une nouvelle façon de travailler.",
								/* @__PURE__ */ (0, j.jsx)("br", { className: "home-title-break" }),
								" Décrivez votre idée et construisons la suite."
							] }),
							/* @__PURE__ */ (0, j.jsx)(le, {
								operation: m,
								composer: h
							}),
							/* @__PURE__ */ (0, j.jsxs)("div", {
								className: "home-start-alternatives",
								children: [
									/* @__PURE__ */ (0, j.jsx)("span", { children: "Ou partez de l’existant" }),
									/* @__PURE__ */ (0, j.jsxs)("button", {
										type: "button",
										disabled: g,
										onClick: (e) => b("imported", e.currentTarget),
										children: [/* @__PURE__ */ (0, j.jsx)(M, { kind: "imported" }), " Importer un projet"]
									}),
									/* @__PURE__ */ (0, j.jsxs)("button", {
										type: "button",
										disabled: g,
										onClick: (e) => {
											t.projects.length && a.current ? (a.current.scrollIntoView?.({ block: "center" }), a.current.focus()) : b("existing", e.currentTarget);
										},
										children: [/* @__PURE__ */ (0, j.jsx)(M, { kind: "existing" }), " Reprendre un projet"]
									})
								]
							})
						]
					}),
					!n.open && l === "project" && t.operation.error ? /* @__PURE__ */ (0, j.jsx)("p", {
						role: "alert",
						className: "home-error",
						children: t.operation.error
					}) : null,
					!n.open && l === "project" && g ? /* @__PURE__ */ (0, j.jsxs)("p", {
						role: "status",
						className: "home-opening",
						children: [
							"Ouverture de « ",
							t.operation.project?.name,
							" »…"
						]
					}) : null,
					/* @__PURE__ */ (0, j.jsx)(U, {
						projects: t.projects,
						loading: t.loading,
						error: t.loadError,
						busy: g,
						searchRef: a,
						onRefresh: () => void t.refresh(),
						onOpen: v,
						onOther: (e) => b("existing", e)
					}),
					/* @__PURE__ */ (0, j.jsx)("div", {
						id: "home-inspirations",
						children: /* @__PURE__ */ (0, j.jsx)(be, { onChoose: (e) => {
							t.clearOperation(), c((t) => ({
								...e,
								id: (t?.id ?? 0) + 1
							}));
						} })
					})
				]
			}),
			/* @__PURE__ */ (0, j.jsx)("footer", {
				className: "home-footer",
				children: "Votre espace de création. Vos projets et leurs références restent sur cet ordinateur."
			}),
			/* @__PURE__ */ (0, j.jsx)(L, {
				...n,
				open: n.open || !!d,
				departure: d ? {
					onCancel: y,
					onConfirm: () => void _(d)
				} : void 0,
				operation: t.operation,
				onDismiss: S,
				onSubmit: v,
				onEdit: t.clearOperation
			})
		]
	});
}
//#endregion
//#region studio-ui/src/home-widget.tsx
function Q(e, t = {}) {
	let n = (0, c.createRoot)(e);
	return n.render(/* @__PURE__ */ (0, j.jsx)(xe, { ...t })), { dispose: () => n.unmount() };
}
var $ = document.getElementById("studio-home");
$ && Q($);
//#endregion
export { Q as mountHomeWidget };
