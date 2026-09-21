import { i as e, n as t, r as n, t as r } from "./jsx-runtime-DZd2gj5L.js";
import { r as i, s as a } from "./i18n-CRhBcIYq.js";
import { t as o } from "./error-messages-CtvOKk7F.js";
import { t as s } from "./engine-messages-BqQBXaLA.js";
//#region studio-ui/src/features/project/model/presentation.ts
var c = e(), l = t();
function u(e, t) {
	let n = (e) => s(e, t), r = (e) => e.map((e) => e.kind === "observed" ? e : {
		...e,
		method: n(e.method),
		...e.limitation ? { limitation: n(e.limitation) } : {}
	});
	return {
		...e,
		environment: n(e.environment),
		scope: n(e.scope),
		files: e.files.map((e) => ({
			...e,
			role: n(e.role)
		})),
		elements: e.elements.map((e) => ({
			...e,
			description: n(e.description),
			provenance: r(e.provenance)
		})),
		relations: e.relations.map((e) => ({
			...e,
			label: n(e.label),
			provenance: r(e.provenance)
		})),
		flows: e.flows.map((e) => e.kind === "observed" ? e : {
			...e,
			errors: e.errors.map((e) => ({
				...e,
				label: n(e.label)
			})),
			limits: e.limits.map(n)
		}),
		issues: e.issues.map((e) => ({
			...e,
			message: n(e.message)
		})),
		limits: e.limits.map(n)
	};
}
function d(e, t) {
	return e && {
		...e,
		analysis: u(e.analysis, t),
		previous: e.previous ? u(e.previous, t) : null,
		impact: {
			...e.impact,
			limits: e.impact.limits.map((e) => s(e, t))
		}
	};
}
//#endregion
//#region studio-ui/src/features/project/model/ui-messages.ts
var f = {
	Analyse: "Analysis",
	"Analyse indisponible": "Analysis unavailable",
	"Analyse indisponible.": "Analysis unavailable.",
	"L’analyse reçue concerne une autre version.": "The received analysis concerns another version.",
	"Analyse interrompue.": "Analysis interrupted."
};
function p(e, t) {
	if (!e) return e;
	if (f[e]) return a(e, f[e], void 0, t);
	for (let [n, r] of Object.entries(f)) {
		if (n.endsWith(" ") && e.startsWith(n)) return a(n, r, void 0, t) + (p(e.slice(n.length), t) ?? "");
		if (n.startsWith(" ") && e.endsWith(n)) return (p(e.slice(0, -n.length), t) ?? "") + a(n, r, void 0, t);
	}
	return o(s(e, t), t);
}
//#endregion
//#region studio-ui/src/features/project/hooks/useProjectModel.ts
function m(e, t, r) {
	let { locale: i } = n(), [a, o] = (0, c.useState)({
		key: "",
		scopeKey: ""
	}), [s, l] = (0, c.useState)(0), u = JSON.stringify([
		e,
		t,
		r
	]), f = JSON.stringify([
		e,
		t,
		r,
		s
	]);
	(0, c.useEffect)(() => {
		if (!e) return;
		let n = new AbortController(), i = new URLSearchParams({ revision: e });
		t && i.set("base", t), r && i.set("draft", "1");
		let a = window.setTimeout(() => {
			fetch("/api/project/model?" + i, { signal: AbortSignal.any([n.signal, AbortSignal.timeout(15e3)]) }).then(async (t) => {
				let i = await t.json();
				if (!t.ok) throw Error(i.error || "Analyse indisponible.");
				if (i.analysis.revisionId !== e && !(r && i.analysis.baseRevisionId === e)) throw Error("L’analyse reçue concerne une autre version.");
				n.signal.aborted || o({
					key: f,
					scopeKey: u,
					model: i
				});
			}).catch((e) => {
				n.signal.aborted || o((t) => ({
					key: f,
					scopeKey: u,
					model: t.scopeKey === u ? t.model : void 0,
					error: e instanceof Error ? e.message : "Analyse interrompue."
				}));
			});
		}, 180);
		return () => {
			window.clearTimeout(a), n.abort();
		};
	}, [
		e,
		t,
		r,
		u,
		f
	]), (0, c.useEffect)(() => {
		let e = () => l((e) => e + 1);
		return document.addEventListener("studio:editor-saved", e), () => document.removeEventListener("studio:editor-saved", e);
	}, []);
	let m = a.scopeKey === u ? a.model : void 0, h = a.key === f ? a.error : void 0, g = !!e && a.key !== f;
	return {
		model: (0, c.useMemo)(() => d(m, i), [m, i]),
		error: p(h, i),
		loading: g,
		stale: !!m && (g || !!h),
		refresh: () => l((e) => e + 1)
	};
}
//#endregion
//#region studio-ui/src/features/project/model/explorer.ts
var h = (e = "en") => ({
	frontend: a("Frontend", "Frontend", void 0, e),
	backend: a("Backend", "Backend", void 0, e),
	shared: a("Partagé", "Shared", void 0, e),
	infrastructure: a("Infrastructure", "Infrastructure", void 0, e),
	unclassified: a("Autres fichiers", "Other files", void 0, e)
});
function g(e, t, n = "en") {
	return t === "files" ? "" : t === "layer" ? h(n)[e.layer] : e.feature || a("Sans fonctionnalité identifiée", "No identified feature", void 0, n);
}
function _(e, t, n) {
	let r = t.path.split("/");
	for (let [i, a] of r.entries()) {
		let o = r.slice(0, i + 1).join("/"), s = e.find((e) => e.name === a);
		s || (s = {
			name: a,
			path: n + o,
			sourcePath: o,
			children: []
		}, e.push(s)), i === r.length - 1 && (s.file = t), e = s.children;
	}
}
function v(e, t) {
	e.sort((e, n) => Number(!!e.file) - Number(!!n.file) || e.name.localeCompare(n.name, t, {
		numeric: !0,
		sensitivity: "base"
	}));
	for (let n of e) v(n.children, t);
	return e;
}
function y(e, t, n, r = "en") {
	let i = [], a = /* @__PURE__ */ new Map(), o = n.trim().toLocaleLowerCase();
	for (let n of e) {
		if (!n.path.toLocaleLowerCase().includes(o)) continue;
		let e = g(n, t, r);
		if (!e) {
			_(i, n, "");
			continue;
		}
		let s = a.get(e);
		s || (s = {
			name: e,
			path: e + ":",
			sourcePath: e,
			children: []
		}, a.set(e, s)), _(s.children, n, e + ":");
	}
	if (t === "files") return v(i, r);
	let s = v([...a.values()], r);
	if (t !== "layer") return s;
	let c = Object.values(h(r));
	return s.sort((e, t) => c.indexOf(e.name) - c.indexOf(t.name));
}
function b(e, t, n = "en") {
	let r = g(e, t, n), i = r ? r + ":" : "", a = e.path.split("/"), o = a.slice(0, -1).map((e, t) => i + a.slice(0, t + 1).join("/"));
	return r ? [i, ...o] : o;
}
var x = {
	kind: "file",
	label: "",
	description: "Fichier"
}, S = {
	kind: "config",
	label: "⚙",
	description: "Configuration"
}, C = {
	ts: {
		kind: "typescript",
		label: "TS",
		description: "TypeScript"
	},
	tsx: {
		kind: "react",
		label: "TSX",
		description: "React / TypeScript"
	},
	js: {
		kind: "javascript",
		label: "JS",
		description: "JavaScript"
	},
	jsx: {
		kind: "react",
		label: "JSX",
		description: "React / JavaScript"
	},
	json: {
		kind: "json",
		label: "{}",
		description: "JSON"
	},
	css: {
		kind: "css",
		label: "#",
		description: "CSS"
	},
	scss: {
		kind: "css",
		label: "#",
		description: "SCSS"
	},
	md: {
		kind: "markdown",
		label: "MD",
		description: "Markdown"
	},
	html: {
		kind: "html",
		label: "<>",
		description: "HTML"
	},
	yaml: {
		kind: "yaml",
		label: "YML",
		description: "YAML"
	},
	config: S,
	file: x
}, w = {
	mts: "ts",
	cts: "ts",
	mjs: "js",
	cjs: "js",
	jsonc: "json",
	yml: "yaml",
	mdx: "md",
	htm: "html"
};
function T(e, t = "en") {
	let n = e.path.split("/").at(-1)?.toLowerCase() || "", r = n.split(".").at(-1) || "";
	if (/^(dockerfile|makefile|\.env(?:\..*)?|\.gitignore|\.npmrc|\.editorconfig)$/.test(n)) return S;
	let i = C[w[r] || r] || x;
	return i === x ? {
		...i,
		description: a("Fichier", "File", void 0, t)
	} : i;
}
//#endregion
//#region studio-ui/src/features/project/components/ProjectIcon.tsx
var E = r(), D = {
	file: "M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h6",
	folder: "M3 7h18v13H3zM3 7V4h6l2 3",
	code: "m8 6-5 6 5 6m8-12 5 6-5 6m-3-15-2 18",
	graph: "M12 8v6M5 14h14M5 14v3M19 14v3M9 3h6v5H9zM2 17h6v4H2zM16 17h6v4h-6z",
	focus: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5",
	search: "M15 15l6 6M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0",
	refresh: "M20 7a9 9 0 1 0 1 8M20 3v5h-5",
	check: "m5 12 4 4L19 6",
	eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12m7 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0"
};
function O({ name: e = "file" }) {
	return /* @__PURE__ */ (0, E.jsx)("svg", {
		className: "project-icon",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "1.6",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, E.jsx)("path", { d: D[e] || D.file })
	});
}
//#endregion
//#region studio-ui/src/features/project/hooks/useExplorerWidth.ts
var k = "devmethod.studio.explorer-width.v1", A = 160, j = 420, M = 260;
function N() {
	try {
		let e = JSON.parse(localStorage.getItem("devmethod.studio.explorer-width.v1") || "null");
		if (typeof e == "object" && e && "version" in e && e.version === 1 && "width" in e && typeof e.width == "number" && Number.isFinite(e.width)) return Math.min(j, Math.max(A, e.width));
	} catch {}
	return 230;
}
function P(e) {
	try {
		localStorage.setItem(k, JSON.stringify({
			version: 1,
			width: e
		}));
	} catch {}
}
function F(e) {
	let [t] = (0, c.useState)(N), n = (0, c.useRef)(t), r = (0, c.useRef)(null), i = (0, c.useRef)(null), a = (0, c.useRef)({
		width: n.current,
		maximum: j,
		enabled: !0
	}), [o, s] = (0, c.useState)(a.current);
	function l(e) {
		let t = Math.min(a.current.maximum, Math.max(A, Math.round(e))), n = {
			...a.current,
			width: t
		};
		return a.current = n, r.current?.style.setProperty("--explorer-width", t + "px"), s(n), t;
	}
	function u(e) {
		n.current = l(e), P(n.current);
	}
	(0, c.useEffect)(() => {
		let t = e.current?.closest(".project-files-layout");
		if (!t) return;
		r.current = t;
		function o() {
			let e = t.getBoundingClientRect().width;
			if (e <= 0) return;
			let r = e >= 420 && window.innerWidth > 650, o = Math.max(A, Math.min(j, e - M)), c = i.current ? a.current.width : n.current, l = Math.min(o, Math.max(A, c));
			a.current = {
				width: l,
				maximum: o,
				enabled: r
			}, t.style.setProperty("--explorer-width", l + "px"), t.dataset.explorerStacked = String(!r), s((e) => e.width === l && e.maximum === o && e.enabled === r ? e : a.current);
		}
		o();
		let c = typeof ResizeObserver > "u" ? null : new ResizeObserver(o);
		return c?.observe(t), window.addEventListener("resize", o), () => {
			c?.disconnect(), window.removeEventListener("resize", o);
			let e = i.current;
			e?.target.hasPointerCapture?.(e.pointerId) && e.target.releasePointerCapture(e.pointerId), i.current = null, delete t.dataset.explorerResizing, delete t.dataset.explorerStacked, t.style.removeProperty("--explorer-width"), r.current = null;
		};
	}, [e]);
	function d(e) {
		e.button === 0 && a.current.enabled && (e.preventDefault(), e.currentTarget.focus(), e.currentTarget.setPointerCapture?.(e.pointerId), i.current = {
			pointerId: e.pointerId,
			startX: e.clientX,
			startWidth: a.current.width,
			target: e.currentTarget
		}, r.current && (r.current.dataset.explorerResizing = "true"));
	}
	function f(e) {
		let t = i.current;
		t && t.pointerId === e.pointerId && l(t.startWidth + e.clientX - t.startX);
	}
	function p(e, t) {
		let n = i.current;
		n && n.pointerId === e.pointerId && (i.current = null, t ? l(n.startWidth) : u(a.current.width), r.current && delete r.current.dataset.explorerResizing, e.currentTarget.hasPointerCapture?.(e.pointerId) && e.currentTarget.releasePointerCapture(e.pointerId));
	}
	function m(e) {
		let t = {
			ArrowLeft: -(e.shiftKey ? 40 : 16),
			ArrowRight: e.shiftKey ? 40 : 16
		}, n = a.current.width + (t[e.key] || 0);
		if (e.key === "Home") n = A;
		else if (e.key === "End") n = a.current.maximum;
		else if (e.key === "Enter") n = 230;
		else if (!(e.key in t)) return;
		e.preventDefault(), u(n);
	}
	return {
		state: o,
		onPointerDown: d,
		onPointerMove: f,
		onPointerUp: (e) => p(e, !1),
		onPointerCancel: (e) => p(e, !0),
		onKeyDown: m,
		reset: () => u(230)
	};
}
//#endregion
//#region studio-ui/src/features/project/components/ExplorerResizer.tsx
function I({ explorer: e }) {
	let { t } = n(), r = F(e);
	return /* @__PURE__ */ (0, E.jsx)("div", {
		className: "explorer-resizer",
		role: "separator",
		"aria-label": t("Largeur de l’explorateur", "Explorer width"),
		"aria-orientation": "vertical",
		"aria-valuemin": 160,
		"aria-valuemax": Math.round(r.state.maximum),
		"aria-valuenow": r.state.width,
		"aria-valuetext": `${r.state.width} pixels`,
		tabIndex: r.state.enabled ? 0 : -1,
		hidden: !r.state.enabled,
		title: t("Glissez pour redimensionner · flèches gauche/droite · Entrée ou double-clic pour réinitialiser", "Drag to resize · left/right arrows · Enter or double-click to reset"),
		onPointerDown: r.onPointerDown,
		onPointerMove: r.onPointerMove,
		onPointerUp: r.onPointerUp,
		onPointerCancel: r.onPointerCancel,
		onLostPointerCapture: r.onPointerUp,
		onKeyDown: r.onKeyDown,
		onDoubleClick: r.reset
	});
}
//#endregion
//#region studio-ui/src/features/project/components/FileExplorer.tsx
function L({ file: e, name: t, selected: r, onSelect: i }) {
	let { locale: a } = n(), o = T(e, a);
	return /* @__PURE__ */ (0, E.jsxs)("button", {
		type: "button",
		className: "project-file",
		"aria-current": r === e.path ? "true" : void 0,
		"aria-label": `${t} · ${o.description}`,
		title: e.path,
		onClick: () => i(e.path),
		children: [/* @__PURE__ */ (0, E.jsx)("span", {
			className: "file-glyph file-kind-" + o.kind,
			"aria-hidden": "true",
			children: o.label || /* @__PURE__ */ (0, E.jsx)(O, {})
		}), /* @__PURE__ */ (0, E.jsx)("span", {
			className: "project-tree-name",
			children: t
		})]
	});
}
function R({ items: e, selected: t, onSelect: n, closed: r, onToggle: i }) {
	return /* @__PURE__ */ (0, E.jsx)("ul", { children: e.map((e) => /* @__PURE__ */ (0, E.jsx)("li", { children: e.file ? /* @__PURE__ */ (0, E.jsx)(L, {
		file: e.file,
		name: e.name,
		selected: t,
		onSelect: n
	}) : /* @__PURE__ */ (0, E.jsxs)("details", {
		open: !r.has(e.path),
		onToggle: (t) => i(e.path, t.currentTarget.open),
		children: [/* @__PURE__ */ (0, E.jsxs)("summary", {
			title: e.sourcePath,
			children: [/* @__PURE__ */ (0, E.jsx)(O, { name: "folder" }), /* @__PURE__ */ (0, E.jsx)("span", {
				className: "project-tree-name",
				children: e.name
			})]
		}), /* @__PURE__ */ (0, E.jsx)(R, {
			items: e.children,
			selected: t,
			onSelect: n,
			closed: r,
			onToggle: i
		})]
	}) }, e.path)) });
}
function z(e, t, n) {
	if (e.has(t) !== n) return e;
	let r = new Set(e);
	return n ? r.delete(t) : r.add(t), r;
}
function B({ analysis: e, selected: t, onSelect: r }) {
	let { t: i, locale: a } = n(), o = (0, c.useRef)(null), [s, l] = (0, c.useState)(""), [u, d] = (0, c.useState)("files"), [f, p] = (0, c.useState)(() => /* @__PURE__ */ new Set()), [m, h] = (0, c.useState)(() => /* @__PURE__ */ new Set()), g = y(e.files, u, s, a);
	function _(t) {
		let n = e.files.find((e) => e.path === t);
		n && p((e) => {
			let t = b(n, u, a);
			return t.some((t) => e.has(t)) ? new Set([...e].filter((e) => !t.includes(e))) : e;
		}), r(t);
	}
	let v = s.trim() ? h : p;
	return /* @__PURE__ */ (0, E.jsxs)("nav", {
		ref: o,
		className: "project-explorer",
		"aria-label": i("Explorateur du projet", "Project explorer"),
		children: [
			/* @__PURE__ */ (0, E.jsxs)("div", {
				className: "explorer-tools",
				children: [
					/* @__PURE__ */ (0, E.jsx)("span", {
						className: "explorer-heading",
						children: i("Explorateur", "Explorer")
					}),
					/* @__PURE__ */ (0, E.jsxs)("label", {
						className: "project-search",
						children: [/* @__PURE__ */ (0, E.jsx)(O, { name: "search" }), /* @__PURE__ */ (0, E.jsx)("input", {
							"aria-label": i("Rechercher un fichier", "Search for a file"),
							placeholder: i("Rechercher un fichier…", "Search for a file…"),
							value: s,
							onChange: (e) => {
								l(e.target.value), h(/* @__PURE__ */ new Set());
							}
						})]
					}),
					/* @__PURE__ */ (0, E.jsxs)("select", {
						"aria-label": i("Organisation des fichiers", "File organization"),
						value: u,
						onChange: (e) => d(e.target.value),
						children: [
							/* @__PURE__ */ (0, E.jsx)("option", {
								value: "files",
								children: i("Dossiers du projet", "Project folders")
							}),
							/* @__PURE__ */ (0, E.jsx)("option", {
								value: "layer",
								children: i("Regrouper par couche", "Group by layer")
							}),
							/* @__PURE__ */ (0, E.jsx)("option", {
								value: "feature",
								children: i("Regrouper par fonctionnalité", "Group by feature")
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, E.jsxs)("div", {
				className: "project-file-tree",
				children: [/* @__PURE__ */ (0, E.jsx)(R, {
					items: g,
					selected: t,
					onSelect: _,
					closed: s.trim() ? m : f,
					onToggle: (e, t) => v((n) => z(n, e, t))
				}), !g.length && /* @__PURE__ */ (0, E.jsx)("p", { children: i("Aucun fichier correspondant.", "No matching files.") })]
			}),
			/* @__PURE__ */ (0, E.jsxs)("p", {
				className: "explorer-note",
				children: [
					e.files.length,
					" ",
					i("fichiers ·", "files ·"),
					" ",
					u === "files" ? i("dossiers du projet", "project folders") : i("classement logique", "logical grouping"),
					!e.backendDetected && /* @__PURE__ */ (0, E.jsxs)(E.Fragment, { children: [/* @__PURE__ */ (0, E.jsx)("br", {}), i("Aucun backend détecté dans ces sources.", "No backend detected in these sources.")] })
				]
			}),
			/* @__PURE__ */ (0, E.jsx)(I, { explorer: o })
		]
	});
}
//#endregion
//#region studio-ui/src/features/project/components/ProjectInspector.tsx
var V = (e = "en") => ({
	feature: a("Fonctionnalité", "Feature", void 0, e),
	role: a("Rôle", "Role", void 0, e),
	language: a("Langage", "Language", void 0, e),
	symbols: a("Fonctions et paramètres", "Functions and parameters", void 0, e),
	interactions: a("Interactions", "Interactions", void 0, e),
	method: a("Méthode", "Method", void 0, e),
	route: a("Route", "Route", void 0, e),
	path: a("Chemin", "Path", void 0, e),
	framework: a("Framework", "Framework", void 0, e),
	resource: a("Ressource", "Resource", void 0, e)
}), H = (e = "en") => ({
	detected: a("Détecté dans le code", "Detected in code", void 0, e),
	declared: a("Déclaré", "Declared", void 0, e),
	observed: a("Observé en exécution", "Observed at runtime", void 0, e),
	inferred: a("Supposé", "Assumed", void 0, e)
});
function U({ sources: e, onOpenSource: t }) {
	return /* @__PURE__ */ (0, E.jsx)("div", {
		className: "inspector-sources",
		children: e.map((e, n) => /* @__PURE__ */ (0, E.jsxs)("button", {
			onClick: () => t(e.path, e.line),
			children: [
				/* @__PURE__ */ (0, E.jsx)(O, {}),
				e.path,
				e.line ? ":" + e.line : ""
			]
		}, e.path + n))
	});
}
function W({ entries: e, onOpenSource: t }) {
	let { locale: r } = n();
	return /* @__PURE__ */ (0, E.jsx)(E.Fragment, { children: e.map((e, n) => /* @__PURE__ */ (0, E.jsxs)("div", {
		className: "inspector-provenance",
		children: [
			/* @__PURE__ */ (0, E.jsx)("span", {
				className: "provenance-tag provenance-" + e.kind,
				children: H(r)[e.kind]
			}),
			/* @__PURE__ */ (0, E.jsx)("p", { children: e.method }),
			/* @__PURE__ */ (0, E.jsx)(U, {
				sources: e.sources,
				onOpenSource: t
			}),
			e.limitation && /* @__PURE__ */ (0, E.jsx)("p", {
				className: "project-caution",
				children: e.limitation
			})
		]
	}, n)) });
}
function G(e, t, n) {
	let r = e.relations.find((e) => e.id === t), i = e.elements.find((e) => e.id === t) || (t ? void 0 : e.elements.find((e) => e.sources.some((e) => e.path === n))), a = t ? void 0 : e.files.find((e) => e.path === n), o = i?.sources || (a ? [{ path: a.path }] : []), s = i ? e.relations.filter((e) => e.source === i.id || e.target === i.id) : [], c = new Set(s.flatMap((e) => [e.source, e.target]));
	return {
		relation: r,
		element: i,
		file: a,
		selectedSources: o,
		connected: s,
		contracts: e.elements.filter((e) => e.type === "contract" && c.has(e.id)),
		tests: e.elements.filter((e) => e.type === "test" && c.has(e.id))
	};
}
function K({ revisionId: e, onClose: t }) {
	let { t: r } = n();
	return /* @__PURE__ */ (0, E.jsxs)("aside", {
		className: "project-inspector",
		"aria-label": r("Inspection du projet", "Project inspection"),
		children: [
			/* @__PURE__ */ (0, E.jsxs)("div", {
				className: "inspector-heading",
				children: [
					/* @__PURE__ */ (0, E.jsx)(O, {}),
					/* @__PURE__ */ (0, E.jsx)("h3", { children: r("Élément absent de cette version", "Element absent from this version") }),
					/* @__PURE__ */ (0, E.jsx)("button", {
						onClick: t,
						"aria-label": r("Fermer l’inspecteur", "Close inspector"),
						title: r("Fermer l’inspecteur", "Close inspector"),
						children: "×"
					})
				]
			}),
			/* @__PURE__ */ (0, E.jsxs)("p", { children: [
				r("L’élément ou la connexion sélectionné n’existe pas dans l’analyse de la version", "The selected element or connection is absent from the analysis of version"),
				" ",
				e.slice(0, 8),
				r(". Il peut avoir été supprimé ou ne plus être résolu.", ". It may have been removed or may no longer resolve.")
			] }),
			/* @__PURE__ */ (0, E.jsx)("p", { children: r("Aucun autre fichier n’est substitué à cette sélection. Consultez la version précédente depuis l’historique pour retrouver ses sources.", "No other file is substituted for this selection. Use history to inspect the previous version and its sources.") })
		]
	});
}
function q(e, t, n) {
	return !(!e || t || n);
}
function J({ analysis: e, selectedId: t, selectedPath: r, onSelect: i, onClose: a, onView: o, onOpenSource: s, onShowChecks: c }) {
	let { t: l, locale: u } = n(), { relation: d, element: f, file: p, selectedSources: m, connected: h, contracts: g, tests: _ } = G(e, t, r);
	if (q(t, f, d)) return /* @__PURE__ */ (0, E.jsx)(K, {
		revisionId: e.revisionId,
		onClose: a
	});
	let v = (e) => /* @__PURE__ */ (0, E.jsx)("button", {
		onClick: () => i(e.id),
		children: e.label
	}, e.id);
	return /* @__PURE__ */ (0, E.jsxs)("aside", {
		className: "project-inspector",
		"aria-label": l("Inspection du projet", "Project inspection"),
		children: [
			/* @__PURE__ */ (0, E.jsxs)("div", {
				className: "inspector-heading",
				children: [
					/* @__PURE__ */ (0, E.jsx)(O, { name: d ? "graph" : "file" }),
					/* @__PURE__ */ (0, E.jsx)("h3", { children: d?.label || f?.label || p?.path.split("/").at(-1) || "Inspection" }),
					/* @__PURE__ */ (0, E.jsx)("button", {
						onClick: a,
						"aria-label": l("Fermer l’inspecteur", "Close inspector"),
						title: l("Fermer l’inspecteur", "Close inspector"),
						children: "×"
					})
				]
			}),
			/* @__PURE__ */ (0, E.jsx)("p", { children: f?.details.role || f?.description || p?.role || l("Sélectionnez un fichier, un élément ou une connexion.", "Select a file, element or connection.") }),
			d ? /* @__PURE__ */ (0, E.jsx)(Y, {
				relation: d,
				analysis: e,
				onSelect: i,
				onOpenSource: s
			}) : /* @__PURE__ */ (0, E.jsxs)(E.Fragment, { children: [
				/* @__PURE__ */ (0, E.jsx)("h4", { children: l("Fichier source", "Source file") }),
				/* @__PURE__ */ (0, E.jsx)(U, {
					sources: m,
					onOpenSource: s
				}),
				f && /* @__PURE__ */ (0, E.jsxs)(E.Fragment, { children: [
					/* @__PURE__ */ (0, E.jsxs)("details", { children: [/* @__PURE__ */ (0, E.jsx)("summary", { children: l("Fonctions, interactions et métadonnées", "Functions, interactions and metadata") }), Object.keys(f.details).length ? /* @__PURE__ */ (0, E.jsx)("dl", { children: Object.entries(f.details).filter(([e]) => e !== "sha256").map(([e, t]) => /* @__PURE__ */ (0, E.jsxs)("div", { children: [/* @__PURE__ */ (0, E.jsx)("dt", { children: V(u)[e] || e }), /* @__PURE__ */ (0, E.jsx)("dd", { children: t })] }, e)) }) : /* @__PURE__ */ (0, E.jsx)("p", { children: l("Entrées et sorties non résolues par cet extracteur.", "Inputs and outputs not resolved by this extractor.") })] }),
					/* @__PURE__ */ (0, E.jsx)("h4", { children: l("Connexions et dépendances", "Connections and dependencies") }),
					h.length ? /* @__PURE__ */ (0, E.jsx)("div", {
						className: "inspector-connections",
						children: h.map((t) => /* @__PURE__ */ (0, E.jsxs)("button", {
							onClick: () => i(t.id),
							children: [
								/* @__PURE__ */ (0, E.jsx)("span", { children: t.kind }),
								" ",
								t.source === f.id ? "→ " : "← ",
								e.elements.find((e) => e.id === (t.source === f.id ? t.target : t.source))?.label || t.label
							]
						}, t.id))
					}) : /* @__PURE__ */ (0, E.jsx)("p", { children: l("Aucune connexion résolue ; cela ne prouve pas l’absence de dépendance.", "No resolved connection; this does not prove there are no dependencies.") })
				] }),
				/* @__PURE__ */ (0, E.jsxs)("div", {
					className: "inspector-actions",
					children: [/* @__PURE__ */ (0, E.jsxs)("button", {
						onClick: () => o("flows"),
						children: [
							/* @__PURE__ */ (0, E.jsx)(O, { name: "graph" }),
							l("Voir le flux", "View flow"),
							" ",
							/* @__PURE__ */ (0, E.jsx)("span", { children: "→" })
						]
					}), /* @__PURE__ */ (0, E.jsxs)("button", {
						onClick: () => o("impact"),
						children: [
							/* @__PURE__ */ (0, E.jsx)(O, { name: "code" }),
							l("Voir l’impact", "View impact"),
							" ",
							/* @__PURE__ */ (0, E.jsx)("span", { children: "→" })
						]
					})]
				}),
				/* @__PURE__ */ (0, E.jsxs)("details", { children: [/* @__PURE__ */ (0, E.jsxs)("summary", { children: [
					l("Contrats associés ·", "Related contracts ·"),
					" ",
					g.length
				] }), g.length ? g.map(v) : /* @__PURE__ */ (0, E.jsx)("p", { children: l("Aucun contrat directement lié détecté.", "No directly linked contract detected.") })] }),
				/* @__PURE__ */ (0, E.jsxs)("details", {
					open: !0,
					children: [
						/* @__PURE__ */ (0, E.jsxs)("summary", { children: [
							l("Tests associés ·", "Related tests ·"),
							" ",
							_.length
						] }),
						_.length ? /* @__PURE__ */ (0, E.jsxs)(E.Fragment, { children: [/* @__PURE__ */ (0, E.jsx)("p", { children: l("Association par une relation d’import ou de test détectée ; aucun succès déduit.", "Association through a detected import or test relationship; no success inferred.") }), _.map(v)] }) : /* @__PURE__ */ (0, E.jsx)("p", { children: l("Aucune association directe détectée.", "No direct association detected.") }),
						/* @__PURE__ */ (0, E.jsx)("button", {
							onClick: () => c(m[0]?.path),
							children: l("Consulter les vérifications →", "Inspect checks →")
						})
					]
				}),
				/* @__PURE__ */ (0, E.jsxs)("details", { children: [
					/* @__PURE__ */ (0, E.jsx)("summary", { children: l("Provenance et fraîcheur", "Provenance and freshness") }),
					f ? /* @__PURE__ */ (0, E.jsx)(W, {
						entries: f.provenance,
						onOpenSource: s
					}) : /* @__PURE__ */ (0, E.jsx)("p", { children: l("Fichier présent dans le manifeste vérifié de cette version.", "File present in the verified manifest for this version.") }),
					/* @__PURE__ */ (0, E.jsxs)("p", { children: [
						l("Runtime :", "Runtime:"),
						" ",
						X(f, u)
					] }),
					f?.details.sha256 && /* @__PURE__ */ (0, E.jsxs)("p", { children: [
						l("Empreinte du fichier :", "File fingerprint:"),
						" ",
						/* @__PURE__ */ (0, E.jsx)("code", { children: f.details.sha256 })
					] }),
					/* @__PURE__ */ (0, E.jsxs)("p", { children: [
						"Version ",
						e.revisionId.slice(0, 8),
						e.localChanges ? l(" + brouillon local", " + local draft") : "",
						/* @__PURE__ */ (0, E.jsx)("br", {}),
						new Date(e.analyzedAt).toLocaleString(u)
					] })
				] })
			] })
		]
	});
}
function Y({ relation: e, analysis: t, onSelect: r, onOpenSource: i }) {
	let { t: a } = n();
	return /* @__PURE__ */ (0, E.jsxs)(E.Fragment, { children: [
		/* @__PURE__ */ (0, E.jsxs)("p", {
			className: "provenance-tag",
			children: [
				a("Relation ·", "Relationship ·"),
				" ",
				e.kind
			]
		}),
		/* @__PURE__ */ (0, E.jsx)("div", {
			className: "inspector-connections",
			children: [e.source, e.target].map((e, n) => /* @__PURE__ */ (0, E.jsxs)("button", {
				onClick: () => r(e),
				children: [n ? a("Vers : ", "To: ") : a("Depuis : ", "From: "), t.elements.find((t) => t.id === e)?.label || e]
			}, e + n))
		}),
		/* @__PURE__ */ (0, E.jsx)("h4", { children: "Provenance" }),
		/* @__PURE__ */ (0, E.jsx)(W, {
			entries: e.provenance,
			onOpenSource: i
		}),
		/* @__PURE__ */ (0, E.jsx)("p", {
			className: "project-caution",
			children: a("Une connexion dans le code ne prouve pas son bon fonctionnement en exécution.", "A code connection does not prove it works at runtime.")
		})
	] });
}
function X(e, t = "en") {
	return e?.runtime === "observed" ? a("observation disponible, voir la preuve", "observation available, see evidence", void 0, t) : a("non observé", "not observed", void 0, t);
}
//#endregion
//#region studio-ui/src/features/project/components/ProjectVersionSelector.tsx
function Z({ revisionId: e, activeRevisionId: t, revisions: r, onSelectVersion: i }) {
	let { t: a } = n();
	return !r?.length || !i ? /* @__PURE__ */ (0, E.jsxs)("strong", { children: ["Version · ", e?.slice(0, 8) || a("aucune", "none")] }) : /* @__PURE__ */ (0, E.jsx)("select", {
		className: "project-version-select",
		"aria-label": a("Version du code", "Code version"),
		value: e || "",
		onChange: (e) => i(e.target.value),
		children: r.map((e) => /* @__PURE__ */ (0, E.jsxs)("option", {
			value: e.id,
			children: [
				e.id.slice(0, 8),
				" ·",
				" ",
				e.origin?.kind === "import" ? a("Référence importée · ", "Imported reference · ") : e.id === t ? a("Appliquée · ", "Applied · ") : "",
				e.title
			]
		}, e.id))
	});
}
//#endregion
//#region studio-ui/src/features/project/components/ProjectWorkbench.tsx
var Q = (0, c.lazy)(() => import("./ArchitectureView-Co_HRgI8.js").then((e) => ({ default: e.ArchitectureView }))), $ = (0, c.lazy)(() => import("./FlowView-Dv_nDKnx.js").then((e) => ({ default: e.FlowView }))), ee = (0, c.lazy)(() => import("./ImpactView-BLJ8lEz_.js").then((e) => ({ default: e.ImpactView })));
function te(e, t, n, r, i = "en") {
	return e ? a("Brouillon enregistré · non appliqué", "Saved draft · not applied", void 0, i) : r === "import" ? a("Référence importée", "Imported reference", void 0, i) : t === n ? a("Appliquée", "Applied", void 0, i) : a("Consultation", "Read-only", void 0, i);
}
function ne(e, t, n, r, i = "en") {
	return e ? r ? a("Nouvelle analyse en cours · dernière analyse affichée, à actualiser.", "New analysis running · last analysis displayed, refresh required.", void 0, i) : a("Analyse des sources…", "Analyzing sources…", void 0, i) : t ? t + (r ? a(" Dernière analyse conservée, non actualisée.", " Last analysis retained, not refreshed.", void 0, i) : "") : n ? a("{files} fichiers · {elements} éléments · {status}", "{files} files · {elements} elements · {status}", {
		files: n.files.length,
		elements: n.elements.length,
		status: n.status === "complete" ? a("analyse terminée", "analysis completed", void 0, i) : a("analyse partielle", "partial analysis", void 0, i)
	}, i) : a("Aucune version à analyser.", "No version to analyze.", void 0, i);
}
function re({ host: e }) {
	let t = (0, c.useCallback)((t) => {
		t && t.append(e);
	}, [e]);
	return /* @__PURE__ */ (0, E.jsx)("div", {
		className: "project-source-slot",
		ref: t
	});
}
function ie(e) {
	let { t, locale: r } = n(), [i, a] = (0, c.useState)(e.view || "files"), o = e.onViewChange ? e.view || "files" : i, s = (t) => {
		e.onViewChange ? e.onViewChange(t) : a(t);
	}, [l, u] = (0, c.useState)(!1), [d, f] = (0, c.useState)(null), [p, h] = (0, c.useState)(!0), g = l && e.revisionId === e.activeRevisionId, { model: _, loading: v, error: y, stale: b, refresh: x } = m(e.revisionId, e.previousRevisionId, g), S = _?.analysis, C = v || !!y || !S, w = C ? [] : e.checks.filter((e) => e.revisionId === S.revisionId), T = (e) => {
		f(e), h(!!e);
	}, D = (t, n) => {
		s("files"), f(null), e.onOpenSource(t, n, { draft: g });
	}, k = _ ? {
		model: _,
		selectedId: d,
		onSelect: T,
		onOpenSource: D,
		onShowChecks: e.onShowChecks
	} : null;
	return /* @__PURE__ */ (0, E.jsxs)("div", {
		className: "project-workspace",
		children: [
			/* @__PURE__ */ (0, E.jsxs)("header", {
				className: "project-context-bar",
				children: [/* @__PURE__ */ (0, E.jsxs)("span", { children: [
					/* @__PURE__ */ (0, E.jsx)(O, { name: "graph" }),
					/* @__PURE__ */ (0, E.jsx)(Z, {
						revisionId: e.revisionId,
						activeRevisionId: e.activeRevisionId,
						revisions: e.revisions,
						onSelectVersion: e.onSelectVersion
					}),
					/* @__PURE__ */ (0, E.jsx)("span", {
						className: "project-context-muted",
						children: te(g, e.revisionId, e.activeRevisionId, e.revisions?.find((t) => t.id === e.revisionId)?.origin?.kind, r)
					})
				] }), /* @__PURE__ */ (0, E.jsxs)("div", { children: [
					/* @__PURE__ */ (0, E.jsxs)("details", {
						className: "project-analysis-menu",
						children: [/* @__PURE__ */ (0, E.jsx)("summary", { children: v ? t("Analyse en cours…", "Analysis running…") : y ? t("Analyse indisponible", "Analysis unavailable") : b ? t("À actualiser", "Refresh required") : t("{count} fichiers", "{count} files", { count: S?.files.length || 0 }) }), /* @__PURE__ */ (0, E.jsxs)("div", {
							className: "project-analysis-line",
							children: [
								/* @__PURE__ */ (0, E.jsx)("span", {
									role: "status",
									children: ne(v, y, S, b, r)
								}),
								/* @__PURE__ */ (0, E.jsxs)("label", { children: [/* @__PURE__ */ (0, E.jsx)("input", {
									type: "checkbox",
									checked: g,
									onChange: (e) => u(e.target.checked),
									disabled: !e.revisionId || e.revisionId !== e.activeRevisionId
								}), t("Inclure le brouillon enregistré", "Include saved draft")] }),
								S && /* @__PURE__ */ (0, E.jsxs)("details", {
									className: "project-analysis-details",
									children: [
										/* @__PURE__ */ (0, E.jsx)("summary", { children: t("Périmètre, limites et décisions de conception", "Scope, limitations and design decisions") }),
										/* @__PURE__ */ (0, E.jsxs)("p", { children: [
											S.scope,
											" · ",
											S.environment,
											" ·",
											" ",
											new Date(S.analyzedAt).toLocaleString(r)
										] }),
										S.limits.map((e, t) => /* @__PURE__ */ (0, E.jsx)("p", { children: e }, t)),
										S.issues.map((e, t) => /* @__PURE__ */ (0, E.jsxs)("p", { children: [
											e.extractor,
											" · ",
											e.path,
											" · ",
											e.message
										] }, t)),
										e.decisions.filter((e) => e.status !== "superseded").map((e) => /* @__PURE__ */ (0, E.jsxs)("p", { children: [
											/* @__PURE__ */ (0, E.jsx)("strong", { children: e.topic }),
											" : ",
											e.choice,
											/* @__PURE__ */ (0, E.jsx)("br", {}),
											e.reason
										] }, e.id)),
										/* @__PURE__ */ (0, E.jsx)("p", { children: t("Les choix de conception sont déclaratifs ; leur conformité au code demande une vérification.", "Design choices are declarations; their conformity with the code requires verification.") })
									]
								})
							]
						})]
					}),
					e.focused && e.pendingDecision && /* @__PURE__ */ (0, E.jsx)("button", {
						className: "project-caution",
						onClick: e.onReviewDecision,
						title: e.pendingDecision,
						children: t("Décision à examiner", "Decision to review")
					}),
					/* @__PURE__ */ (0, E.jsxs)("button", {
						"aria-pressed": e.focused,
						onClick: e.onFocus,
						children: [/* @__PURE__ */ (0, E.jsx)(O, { name: "eye" }), t("Focus technique", "Technical focus")]
					}),
					/* @__PURE__ */ (0, E.jsx)("button", {
						onClick: e.onExpand,
						"aria-label": t("Agrandir l’espace technique", "Expand technical workspace"),
						title: t("Agrandir l’espace technique", "Expand technical workspace"),
						children: /* @__PURE__ */ (0, E.jsx)(O, { name: "focus" })
					})
				] })]
			}),
			/* @__PURE__ */ (0, E.jsxs)("nav", {
				className: "project-subnav",
				"aria-label": t("Vues du code", "Code views"),
				children: [
					[
						["files", t("Fichiers", "Files")],
						["architecture", "Architecture"],
						["flows", t("Flux", "Flows")],
						["impact", "Impact"]
					].map(([e, t]) => /* @__PURE__ */ (0, E.jsx)("button", {
						"aria-current": o === e ? "page" : void 0,
						onClick: () => s(e),
						children: t
					}, e)),
					/* @__PURE__ */ (0, E.jsx)("span", { className: "subnav-spacer" }),
					/* @__PURE__ */ (0, E.jsx)("button", {
						onClick: () => h((e) => !e),
						"aria-pressed": p,
						title: t("Afficher ou masquer l’inspection", "Show or hide inspection"),
						children: t("Inspecteur", "Inspector")
					}),
					/* @__PURE__ */ (0, E.jsx)("button", {
						onClick: x,
						"aria-label": t("Reconstruire l’analyse", "Rebuild analysis"),
						title: t("Reconstruire l’analyse", "Rebuild analysis"),
						children: /* @__PURE__ */ (0, E.jsx)(O, { name: "refresh" })
					})
				]
			}),
			y && /* @__PURE__ */ (0, E.jsxs)("p", {
				className: "project-caution",
				children: [
					t("L’analyse n’est pas disponible. L’éditeur reste accessible.", "Analysis is unavailable. The editor remains accessible."),
					" ",
					/* @__PURE__ */ (0, E.jsx)("button", {
						onClick: x,
						children: t("Réessayer", "Retry")
					})
				]
			}),
			/* @__PURE__ */ (0, E.jsxs)("div", {
				className: "project-main-grid" + (p && S ? " with-inspector" : ""),
				children: [/* @__PURE__ */ (0, E.jsxs)("div", {
					className: "project-center",
					children: [/* @__PURE__ */ (0, E.jsxs)("div", {
						className: "project-files-layout",
						hidden: o !== "files",
						children: [S && /* @__PURE__ */ (0, E.jsx)(B, {
							analysis: S,
							selected: e.selectedPath,
							onSelect: (t) => {
								f(null), e.onOpenSource(t, void 0, { draft: g });
							}
						}), /* @__PURE__ */ (0, E.jsx)(re, { host: e.sourceHost })]
					}), /* @__PURE__ */ (0, E.jsxs)(c.Suspense, {
						fallback: /* @__PURE__ */ (0, E.jsx)("p", {
							role: "status",
							children: t("Chargement de cette vue…", "Loading this view…")
						}),
						children: [
							k && o === "architecture" && /* @__PURE__ */ (0, E.jsx)(Q, { ...k }),
							k && o === "flows" && /* @__PURE__ */ (0, E.jsx)($, { ...k }),
							k && o === "impact" && /* @__PURE__ */ (0, E.jsx)(ee, { ...k })
						]
					})]
				}), p && S && /* @__PURE__ */ (0, E.jsx)(J, {
					analysis: S,
					selectedId: d,
					selectedPath: e.selectedPath,
					onSelect: T,
					onClose: () => h(!1),
					onView: s,
					onOpenSource: D,
					onShowChecks: e.onShowChecks
				})]
			}),
			/* @__PURE__ */ (0, E.jsxs)("details", {
				className: "project-results",
				children: [
					/* @__PURE__ */ (0, E.jsxs)("summary", { children: [
						/* @__PURE__ */ (0, E.jsx)(O, { name: "check" }),
						t("Vérifications de cette version ·", "Checks for this version ·"),
						" ",
						/* @__PURE__ */ (0, E.jsx)("span", { children: t("Consulter les résultats et les preuves", "Inspect results and evidence") })
					] }),
					/* @__PURE__ */ (0, E.jsx)("p", { children: t("Contrôles historiques transmis à cet espace. Le panneau Qualité rassemble les résultats et les rapports reçus de l’hôte ; ils ne valident pas toute l’application.", "Historical checks supplied to this workspace. The Quality panel gathers results and host reports; they do not validate the entire application.") }),
					w.map((e) => /* @__PURE__ */ (0, E.jsxs)("p", {
						className: e.status === "failed" ? "project-caution" : "",
						children: [
							e.status === "passed" ? "✓" : "×",
							" ",
							e.label
						]
					}, e.id)),
					C ? /* @__PURE__ */ (0, E.jsx)("p", { children: t("Contrôles historiques masqués · analyse en attente ou indisponible. Ils seront rapprochés de la version quand son analyse sera disponible.", "Historical checks hidden · analysis pending or unavailable. They will be matched to the version when its analysis is available.") }) : !w.length && /* @__PURE__ */ (0, E.jsx)("p", { children: t("Aucun contrôle historique transmis à cet espace.", "No historical checks supplied to this workspace.") }),
					/* @__PURE__ */ (0, E.jsx)("button", {
						onClick: () => e.onShowChecks(),
						children: t("Consulter les preuves et les outils →", "Inspect evidence and tools →")
					})
				]
			})
		]
	});
}
//#endregion
//#region studio-ui/src/project-widget.tsx
function ae(e, t) {
	i(e.ownerDocument, e.ownerDocument.defaultView ?? void 0);
	let n = (0, l.createRoot)(e), r = (e) => n.render(/* @__PURE__ */ (0, E.jsx)(ie, { ...e }));
	return r(t), {
		update: r,
		dispose: () => n.unmount()
	};
}
//#endregion
export { ae as mountProjectWidget };
