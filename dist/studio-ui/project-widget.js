import { i as e, n as t, t as n } from "./jsx-runtime-D7gWoUTT.js";
//#region studio-ui/src/features/project/hooks/useProjectModel.ts
var r = t(), i = e();
function a(e, t, n) {
	let [r, a] = (0, i.useState)({
		key: "",
		scopeKey: ""
	}), [o, s] = (0, i.useState)(0), c = JSON.stringify([
		e,
		t,
		n
	]), l = JSON.stringify([
		e,
		t,
		n,
		o
	]);
	(0, i.useEffect)(() => {
		if (!e) return;
		let r = new AbortController(), i = new URLSearchParams({ revision: e });
		t && i.set("base", t), n && i.set("draft", "1");
		let o = window.setTimeout(() => {
			fetch("/api/project/model?" + i, { signal: AbortSignal.any([r.signal, AbortSignal.timeout(15e3)]) }).then(async (t) => {
				let i = await t.json();
				if (!t.ok) throw Error(i.error || "Analyse indisponible.");
				if (i.analysis.revisionId !== e && !(n && i.analysis.baseRevisionId === e)) throw Error("L’analyse reçue concerne une autre version.");
				r.signal.aborted || a({
					key: l,
					scopeKey: c,
					model: i
				});
			}).catch((e) => {
				r.signal.aborted || a((t) => ({
					key: l,
					scopeKey: c,
					model: t.scopeKey === c ? t.model : void 0,
					error: e instanceof Error ? e.message : "Analyse interrompue."
				}));
			});
		}, 180);
		return () => {
			window.clearTimeout(o), r.abort();
		};
	}, [
		e,
		t,
		n,
		c,
		l
	]), (0, i.useEffect)(() => {
		let e = () => s((e) => e + 1);
		return document.addEventListener("studio:editor-saved", e), () => document.removeEventListener("studio:editor-saved", e);
	}, []);
	let u = r.scopeKey === c ? r.model : void 0, d = r.key === l ? r.error : void 0, f = !!e && r.key !== l;
	return {
		model: u,
		error: d,
		loading: f,
		stale: !!u && (f || !!d),
		refresh: () => s((e) => e + 1)
	};
}
//#endregion
//#region studio-ui/src/features/project/model/explorer.ts
var o = {
	frontend: "Frontend",
	backend: "Backend",
	shared: "Partagé",
	infrastructure: "Infrastructure",
	unclassified: "Autres fichiers"
};
function s(e, t) {
	return t === "files" ? "" : t === "layer" ? o[e.layer] : e.feature || "Sans fonctionnalité identifiée";
}
function c(e, t, n) {
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
function l(e) {
	e.sort((e, t) => Number(!!e.file) - Number(!!t.file) || e.name.localeCompare(t.name, "fr", {
		numeric: !0,
		sensitivity: "base"
	}));
	for (let t of e) l(t.children);
	return e;
}
function u(e, t, n) {
	let r = [], i = /* @__PURE__ */ new Map(), a = n.trim().toLocaleLowerCase();
	for (let n of e) {
		if (!n.path.toLocaleLowerCase().includes(a)) continue;
		let e = s(n, t);
		if (!e) {
			c(r, n, "");
			continue;
		}
		let o = i.get(e);
		o || (o = {
			name: e,
			path: e + ":",
			sourcePath: e,
			children: []
		}, i.set(e, o)), c(o.children, n, e + ":");
	}
	if (t === "files") return l(r);
	let u = l([...i.values()]);
	if (t !== "layer") return u;
	let d = Object.values(o);
	return u.sort((e, t) => d.indexOf(e.name) - d.indexOf(t.name));
}
function d(e, t) {
	let n = s(e, t), r = n ? n + ":" : "", i = e.path.split("/"), a = i.slice(0, -1).map((e, t) => r + i.slice(0, t + 1).join("/"));
	return n ? [r, ...a] : a;
}
var f = {
	kind: "file",
	label: "",
	description: "Fichier"
}, p = {
	kind: "config",
	label: "⚙",
	description: "Configuration"
}, m = {
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
	config: p,
	file: f
}, h = {
	mts: "ts",
	cts: "ts",
	mjs: "js",
	cjs: "js",
	jsonc: "json",
	yml: "yaml",
	mdx: "md",
	htm: "html"
};
function g(e) {
	let t = e.path.split("/").at(-1)?.toLowerCase() || "", n = t.split(".").at(-1) || "";
	return /^(dockerfile|makefile|\.env(?:\..*)?|\.gitignore|\.npmrc|\.editorconfig)$/.test(t) ? p : m[h[n] || n] || f;
}
//#endregion
//#region studio-ui/src/features/project/components/ProjectIcon.tsx
var _ = n(), v = {
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
function y({ name: e = "file" }) {
	return /* @__PURE__ */ (0, _.jsx)("svg", {
		className: "project-icon",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "1.6",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, _.jsx)("path", { d: v[e] || v.file })
	});
}
//#endregion
//#region studio-ui/src/features/project/hooks/useExplorerWidth.ts
var b = "devmethod.studio.explorer-width.v1", x = 160, S = 420, C = 260;
function w() {
	try {
		let e = JSON.parse(localStorage.getItem("devmethod.studio.explorer-width.v1") || "null");
		if (typeof e == "object" && e && "version" in e && e.version === 1 && "width" in e && typeof e.width == "number" && Number.isFinite(e.width)) return Math.min(S, Math.max(x, e.width));
	} catch {}
	return 230;
}
function T(e) {
	try {
		localStorage.setItem(b, JSON.stringify({
			version: 1,
			width: e
		}));
	} catch {}
}
function E(e) {
	let [t] = (0, i.useState)(w), n = (0, i.useRef)(t), r = (0, i.useRef)(null), a = (0, i.useRef)(null), o = (0, i.useRef)({
		width: n.current,
		maximum: S,
		enabled: !0
	}), [s, c] = (0, i.useState)(o.current);
	function l(e) {
		let t = Math.min(o.current.maximum, Math.max(x, Math.round(e))), n = {
			...o.current,
			width: t
		};
		return o.current = n, r.current?.style.setProperty("--explorer-width", t + "px"), c(n), t;
	}
	function u(e) {
		n.current = l(e), T(n.current);
	}
	(0, i.useEffect)(() => {
		let t = e.current?.closest(".project-files-layout");
		if (!t) return;
		r.current = t;
		function i() {
			let e = t.getBoundingClientRect().width;
			if (e <= 0) return;
			let r = e >= 420 && window.innerWidth > 650, i = Math.max(x, Math.min(S, e - C)), s = a.current ? o.current.width : n.current, l = Math.min(i, Math.max(x, s));
			o.current = {
				width: l,
				maximum: i,
				enabled: r
			}, t.style.setProperty("--explorer-width", l + "px"), t.dataset.explorerStacked = String(!r), c((e) => e.width === l && e.maximum === i && e.enabled === r ? e : o.current);
		}
		i();
		let s = typeof ResizeObserver > "u" ? null : new ResizeObserver(i);
		return s?.observe(t), window.addEventListener("resize", i), () => {
			s?.disconnect(), window.removeEventListener("resize", i);
			let e = a.current;
			e?.target.hasPointerCapture?.(e.pointerId) && e.target.releasePointerCapture(e.pointerId), a.current = null, delete t.dataset.explorerResizing, delete t.dataset.explorerStacked, t.style.removeProperty("--explorer-width"), r.current = null;
		};
	}, [e]);
	function d(e) {
		e.button === 0 && o.current.enabled && (e.preventDefault(), e.currentTarget.focus(), e.currentTarget.setPointerCapture?.(e.pointerId), a.current = {
			pointerId: e.pointerId,
			startX: e.clientX,
			startWidth: o.current.width,
			target: e.currentTarget
		}, r.current && (r.current.dataset.explorerResizing = "true"));
	}
	function f(e) {
		let t = a.current;
		t && t.pointerId === e.pointerId && l(t.startWidth + e.clientX - t.startX);
	}
	function p(e, t) {
		let n = a.current;
		n && n.pointerId === e.pointerId && (a.current = null, t ? l(n.startWidth) : u(o.current.width), r.current && delete r.current.dataset.explorerResizing, e.currentTarget.hasPointerCapture?.(e.pointerId) && e.currentTarget.releasePointerCapture(e.pointerId));
	}
	function m(e) {
		let t = {
			ArrowLeft: -(e.shiftKey ? 40 : 16),
			ArrowRight: e.shiftKey ? 40 : 16
		}, n = o.current.width + (t[e.key] || 0);
		if (e.key === "Home") n = x;
		else if (e.key === "End") n = o.current.maximum;
		else if (e.key === "Enter") n = 230;
		else if (!(e.key in t)) return;
		e.preventDefault(), u(n);
	}
	return {
		state: s,
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
function D({ explorer: e }) {
	let t = E(e);
	return /* @__PURE__ */ (0, _.jsx)("div", {
		className: "explorer-resizer",
		role: "separator",
		"aria-label": "Largeur de l’explorateur",
		"aria-orientation": "vertical",
		"aria-valuemin": 160,
		"aria-valuemax": Math.round(t.state.maximum),
		"aria-valuenow": t.state.width,
		"aria-valuetext": `${t.state.width} pixels`,
		tabIndex: t.state.enabled ? 0 : -1,
		hidden: !t.state.enabled,
		title: "Glissez pour redimensionner · flèches gauche/droite · Entrée ou double-clic pour réinitialiser",
		onPointerDown: t.onPointerDown,
		onPointerMove: t.onPointerMove,
		onPointerUp: t.onPointerUp,
		onPointerCancel: t.onPointerCancel,
		onLostPointerCapture: t.onPointerUp,
		onKeyDown: t.onKeyDown,
		onDoubleClick: t.reset
	});
}
//#endregion
//#region studio-ui/src/features/project/components/FileExplorer.tsx
function O({ file: e, name: t, selected: n, onSelect: r }) {
	let i = g(e);
	return /* @__PURE__ */ (0, _.jsxs)("button", {
		type: "button",
		className: "project-file",
		"aria-current": n === e.path ? "true" : void 0,
		"aria-label": `${t} · ${i.description}`,
		title: e.path,
		onClick: () => r(e.path),
		children: [/* @__PURE__ */ (0, _.jsx)("span", {
			className: "file-glyph file-kind-" + i.kind,
			"aria-hidden": "true",
			children: i.label || /* @__PURE__ */ (0, _.jsx)(y, {})
		}), /* @__PURE__ */ (0, _.jsx)("span", {
			className: "project-tree-name",
			children: t
		})]
	});
}
function k({ items: e, selected: t, onSelect: n, closed: r, onToggle: i }) {
	return /* @__PURE__ */ (0, _.jsx)("ul", { children: e.map((e) => /* @__PURE__ */ (0, _.jsx)("li", { children: e.file ? /* @__PURE__ */ (0, _.jsx)(O, {
		file: e.file,
		name: e.name,
		selected: t,
		onSelect: n
	}) : /* @__PURE__ */ (0, _.jsxs)("details", {
		open: !r.has(e.path),
		onToggle: (t) => i(e.path, t.currentTarget.open),
		children: [/* @__PURE__ */ (0, _.jsxs)("summary", {
			title: e.sourcePath,
			children: [/* @__PURE__ */ (0, _.jsx)(y, { name: "folder" }), /* @__PURE__ */ (0, _.jsx)("span", {
				className: "project-tree-name",
				children: e.name
			})]
		}), /* @__PURE__ */ (0, _.jsx)(k, {
			items: e.children,
			selected: t,
			onSelect: n,
			closed: r,
			onToggle: i
		})]
	}) }, e.path)) });
}
function A(e, t, n) {
	if (e.has(t) !== n) return e;
	let r = new Set(e);
	return n ? r.delete(t) : r.add(t), r;
}
function j({ analysis: e, selected: t, onSelect: n }) {
	let r = (0, i.useRef)(null), [a, o] = (0, i.useState)(""), [s, c] = (0, i.useState)("files"), [l, f] = (0, i.useState)(() => /* @__PURE__ */ new Set()), [p, m] = (0, i.useState)(() => /* @__PURE__ */ new Set()), h = u(e.files, s, a);
	function g(t) {
		let r = e.files.find((e) => e.path === t);
		r && f((e) => {
			let t = d(r, s);
			return t.some((t) => e.has(t)) ? new Set([...e].filter((e) => !t.includes(e))) : e;
		}), n(t);
	}
	let v = a.trim() ? m : f;
	return /* @__PURE__ */ (0, _.jsxs)("nav", {
		ref: r,
		className: "project-explorer",
		"aria-label": "Explorateur du projet",
		children: [
			/* @__PURE__ */ (0, _.jsxs)("div", {
				className: "explorer-tools",
				children: [
					/* @__PURE__ */ (0, _.jsx)("span", {
						className: "explorer-heading",
						children: "Explorateur"
					}),
					/* @__PURE__ */ (0, _.jsxs)("label", {
						className: "project-search",
						children: [/* @__PURE__ */ (0, _.jsx)(y, { name: "search" }), /* @__PURE__ */ (0, _.jsx)("input", {
							"aria-label": "Rechercher un fichier",
							placeholder: "Rechercher un fichier…",
							value: a,
							onChange: (e) => {
								o(e.target.value), m(/* @__PURE__ */ new Set());
							}
						})]
					}),
					/* @__PURE__ */ (0, _.jsxs)("select", {
						"aria-label": "Organisation des fichiers",
						value: s,
						onChange: (e) => c(e.target.value),
						children: [
							/* @__PURE__ */ (0, _.jsx)("option", {
								value: "files",
								children: "Dossiers du projet"
							}),
							/* @__PURE__ */ (0, _.jsx)("option", {
								value: "layer",
								children: "Regrouper par couche"
							}),
							/* @__PURE__ */ (0, _.jsx)("option", {
								value: "feature",
								children: "Regrouper par fonctionnalité"
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, _.jsxs)("div", {
				className: "project-file-tree",
				children: [/* @__PURE__ */ (0, _.jsx)(k, {
					items: h,
					selected: t,
					onSelect: g,
					closed: a.trim() ? p : l,
					onToggle: (e, t) => v((n) => A(n, e, t))
				}), !h.length && /* @__PURE__ */ (0, _.jsx)("p", { children: "Aucun fichier correspondant." })]
			}),
			/* @__PURE__ */ (0, _.jsxs)("p", {
				className: "explorer-note",
				children: [
					e.files.length,
					" fichiers ·",
					" ",
					s === "files" ? "dossiers du projet" : "classement logique",
					!e.backendDetected && /* @__PURE__ */ (0, _.jsxs)(_.Fragment, { children: [/* @__PURE__ */ (0, _.jsx)("br", {}), "Aucun backend détecté dans ces sources."] })
				]
			}),
			/* @__PURE__ */ (0, _.jsx)(D, { explorer: r })
		]
	});
}
//#endregion
//#region studio-ui/src/features/project/components/ProjectInspector.tsx
var M = {
	feature: "Fonctionnalité",
	role: "Rôle",
	language: "Langage",
	symbols: "Fonctions et paramètres",
	interactions: "Interactions",
	method: "Méthode",
	route: "Route",
	path: "Chemin",
	framework: "Framework",
	resource: "Ressource"
}, N = {
	detected: "Détecté dans le code",
	declared: "Déclaré",
	observed: "Observé en exécution",
	inferred: "Supposé"
};
function P({ sources: e, onOpenSource: t }) {
	return /* @__PURE__ */ (0, _.jsx)("div", {
		className: "inspector-sources",
		children: e.map((e, n) => /* @__PURE__ */ (0, _.jsxs)("button", {
			onClick: () => t(e.path, e.line),
			children: [
				/* @__PURE__ */ (0, _.jsx)(y, {}),
				e.path,
				e.line ? ":" + e.line : ""
			]
		}, e.path + n))
	});
}
function F({ entries: e, onOpenSource: t }) {
	return /* @__PURE__ */ (0, _.jsx)(_.Fragment, { children: e.map((e, n) => /* @__PURE__ */ (0, _.jsxs)("div", {
		className: "inspector-provenance",
		children: [
			/* @__PURE__ */ (0, _.jsx)("span", {
				className: "provenance-tag provenance-" + e.kind,
				children: N[e.kind]
			}),
			/* @__PURE__ */ (0, _.jsx)("p", { children: e.method }),
			/* @__PURE__ */ (0, _.jsx)(P, {
				sources: e.sources,
				onOpenSource: t
			}),
			e.limitation && /* @__PURE__ */ (0, _.jsx)("p", {
				className: "project-caution",
				children: e.limitation
			})
		]
	}, n)) });
}
function I(e, t, n) {
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
function L({ revisionId: e, onClose: t }) {
	return /* @__PURE__ */ (0, _.jsxs)("aside", {
		className: "project-inspector",
		"aria-label": "Inspection du projet",
		children: [
			/* @__PURE__ */ (0, _.jsxs)("div", {
				className: "inspector-heading",
				children: [
					/* @__PURE__ */ (0, _.jsx)(y, {}),
					/* @__PURE__ */ (0, _.jsx)("h3", { children: "Élément absent de cette version" }),
					/* @__PURE__ */ (0, _.jsx)("button", {
						onClick: t,
						"aria-label": "Fermer l’inspecteur",
						title: "Fermer l’inspecteur",
						children: "×"
					})
				]
			}),
			/* @__PURE__ */ (0, _.jsxs)("p", { children: [
				"L’élément ou la connexion sélectionné n’existe pas dans l’analyse de la version",
				" ",
				e.slice(0, 8),
				". Il peut avoir été supprimé ou ne plus être résolu."
			] }),
			/* @__PURE__ */ (0, _.jsx)("p", { children: "Aucun autre fichier n’est substitué à cette sélection. Consultez la version précédente depuis l’historique pour retrouver ses sources." })
		]
	});
}
function R(e, t, n) {
	return !(!e || t || n);
}
function z({ analysis: e, selectedId: t, selectedPath: n, onSelect: r, onClose: i, onView: a, onOpenSource: o, onShowChecks: s }) {
	let { relation: c, element: l, file: u, selectedSources: d, connected: f, contracts: p, tests: m } = I(e, t, n);
	if (R(t, l, c)) return /* @__PURE__ */ (0, _.jsx)(L, {
		revisionId: e.revisionId,
		onClose: i
	});
	let h = (e) => /* @__PURE__ */ (0, _.jsx)("button", {
		onClick: () => r(e.id),
		children: e.label
	}, e.id);
	return /* @__PURE__ */ (0, _.jsxs)("aside", {
		className: "project-inspector",
		"aria-label": "Inspection du projet",
		children: [
			/* @__PURE__ */ (0, _.jsxs)("div", {
				className: "inspector-heading",
				children: [
					/* @__PURE__ */ (0, _.jsx)(y, { name: c ? "graph" : "file" }),
					/* @__PURE__ */ (0, _.jsx)("h3", { children: c?.label || l?.label || u?.path.split("/").at(-1) || "Inspection" }),
					/* @__PURE__ */ (0, _.jsx)("button", {
						onClick: i,
						"aria-label": "Fermer l’inspecteur",
						title: "Fermer l’inspecteur",
						children: "×"
					})
				]
			}),
			/* @__PURE__ */ (0, _.jsx)("p", { children: l?.details.role || l?.description || u?.role || "Sélectionnez un fichier, un élément ou une connexion." }),
			c ? /* @__PURE__ */ (0, _.jsx)(B, {
				relation: c,
				analysis: e,
				onSelect: r,
				onOpenSource: o
			}) : /* @__PURE__ */ (0, _.jsxs)(_.Fragment, { children: [
				/* @__PURE__ */ (0, _.jsx)("h4", { children: "Fichier source" }),
				/* @__PURE__ */ (0, _.jsx)(P, {
					sources: d,
					onOpenSource: o
				}),
				l && /* @__PURE__ */ (0, _.jsxs)(_.Fragment, { children: [
					/* @__PURE__ */ (0, _.jsxs)("details", { children: [/* @__PURE__ */ (0, _.jsx)("summary", { children: "Fonctions, interactions et métadonnées" }), Object.keys(l.details).length ? /* @__PURE__ */ (0, _.jsx)("dl", { children: Object.entries(l.details).filter(([e]) => e !== "sha256").map(([e, t]) => /* @__PURE__ */ (0, _.jsxs)("div", { children: [/* @__PURE__ */ (0, _.jsx)("dt", { children: M[e] || e }), /* @__PURE__ */ (0, _.jsx)("dd", { children: t })] }, e)) }) : /* @__PURE__ */ (0, _.jsx)("p", { children: "Entrées et sorties non résolues par cet extracteur." })] }),
					/* @__PURE__ */ (0, _.jsx)("h4", { children: "Connexions et dépendances" }),
					f.length ? /* @__PURE__ */ (0, _.jsx)("div", {
						className: "inspector-connections",
						children: f.map((t) => /* @__PURE__ */ (0, _.jsxs)("button", {
							onClick: () => r(t.id),
							children: [
								/* @__PURE__ */ (0, _.jsx)("span", { children: t.kind }),
								" ",
								t.source === l.id ? "→ " : "← ",
								e.elements.find((e) => e.id === (t.source === l.id ? t.target : t.source))?.label || t.label
							]
						}, t.id))
					}) : /* @__PURE__ */ (0, _.jsx)("p", { children: "Aucune connexion résolue ; cela ne prouve pas l’absence de dépendance." })
				] }),
				/* @__PURE__ */ (0, _.jsxs)("div", {
					className: "inspector-actions",
					children: [/* @__PURE__ */ (0, _.jsxs)("button", {
						onClick: () => a("flows"),
						children: [
							/* @__PURE__ */ (0, _.jsx)(y, { name: "graph" }),
							"Voir le flux ",
							/* @__PURE__ */ (0, _.jsx)("span", { children: "→" })
						]
					}), /* @__PURE__ */ (0, _.jsxs)("button", {
						onClick: () => a("impact"),
						children: [
							/* @__PURE__ */ (0, _.jsx)(y, { name: "code" }),
							"Voir l’impact ",
							/* @__PURE__ */ (0, _.jsx)("span", { children: "→" })
						]
					})]
				}),
				/* @__PURE__ */ (0, _.jsxs)("details", { children: [/* @__PURE__ */ (0, _.jsxs)("summary", { children: ["Contrats associés · ", p.length] }), p.length ? p.map(h) : /* @__PURE__ */ (0, _.jsx)("p", { children: "Aucun contrat directement lié détecté." })] }),
				/* @__PURE__ */ (0, _.jsxs)("details", {
					open: !0,
					children: [
						/* @__PURE__ */ (0, _.jsxs)("summary", { children: ["Tests associés · ", m.length] }),
						m.length ? /* @__PURE__ */ (0, _.jsxs)(_.Fragment, { children: [/* @__PURE__ */ (0, _.jsx)("p", { children: "Association par une relation d’import ou de test détectée ; aucun succès déduit." }), m.map(h)] }) : /* @__PURE__ */ (0, _.jsx)("p", { children: "Aucune association directe détectée." }),
						/* @__PURE__ */ (0, _.jsx)("button", {
							onClick: () => s(d[0]?.path),
							children: "Consulter les vérifications →"
						})
					]
				}),
				/* @__PURE__ */ (0, _.jsxs)("details", { children: [
					/* @__PURE__ */ (0, _.jsx)("summary", { children: "Provenance et fraîcheur" }),
					l ? /* @__PURE__ */ (0, _.jsx)(F, {
						entries: l.provenance,
						onOpenSource: o
					}) : /* @__PURE__ */ (0, _.jsx)("p", { children: "Fichier présent dans le manifeste vérifié de cette version." }),
					/* @__PURE__ */ (0, _.jsxs)("p", { children: ["Runtime : ", V(l)] }),
					l?.details.sha256 && /* @__PURE__ */ (0, _.jsxs)("p", { children: ["Empreinte du fichier : ", /* @__PURE__ */ (0, _.jsx)("code", { children: l.details.sha256 })] }),
					/* @__PURE__ */ (0, _.jsxs)("p", { children: [
						"Version ",
						e.revisionId.slice(0, 8),
						e.localChanges ? " + brouillon local" : "",
						/* @__PURE__ */ (0, _.jsx)("br", {}),
						new Date(e.analyzedAt).toLocaleString("fr-FR")
					] })
				] })
			] })
		]
	});
}
function B({ relation: e, analysis: t, onSelect: n, onOpenSource: r }) {
	return /* @__PURE__ */ (0, _.jsxs)(_.Fragment, { children: [
		/* @__PURE__ */ (0, _.jsxs)("p", {
			className: "provenance-tag",
			children: ["Relation · ", e.kind]
		}),
		/* @__PURE__ */ (0, _.jsx)("div", {
			className: "inspector-connections",
			children: [e.source, e.target].map((e, r) => /* @__PURE__ */ (0, _.jsxs)("button", {
				onClick: () => n(e),
				children: [r ? "Vers : " : "Depuis : ", t.elements.find((t) => t.id === e)?.label || e]
			}, e + r))
		}),
		/* @__PURE__ */ (0, _.jsx)("h4", { children: "Provenance" }),
		/* @__PURE__ */ (0, _.jsx)(F, {
			entries: e.provenance,
			onOpenSource: r
		}),
		/* @__PURE__ */ (0, _.jsx)("p", {
			className: "project-caution",
			children: "Une connexion dans le code ne prouve pas son bon fonctionnement en exécution."
		})
	] });
}
function V(e) {
	return e?.runtime === "observed" ? "observation disponible, voir la preuve" : "non observé";
}
//#endregion
//#region studio-ui/src/features/project/components/ProjectVersionSelector.tsx
function H({ revisionId: e, activeRevisionId: t, revisions: n, onSelectVersion: r }) {
	return !n?.length || !r ? /* @__PURE__ */ (0, _.jsxs)("strong", { children: ["Version · ", e?.slice(0, 8) || "aucune"] }) : /* @__PURE__ */ (0, _.jsx)("select", {
		className: "project-version-select",
		"aria-label": "Version du code",
		value: e || "",
		onChange: (e) => r(e.target.value),
		children: n.map((e) => /* @__PURE__ */ (0, _.jsxs)("option", {
			value: e.id,
			children: [
				e.id.slice(0, 8),
				" ·",
				" ",
				e.origin?.kind === "import" ? "Référence importée · " : e.id === t ? "Appliquée · " : "",
				e.title
			]
		}, e.id))
	});
}
//#endregion
//#region studio-ui/src/features/project/components/ProjectWorkbench.tsx
var U = (0, i.lazy)(() => import("./ArchitectureView-Bc2kDYH1.js").then((e) => ({ default: e.ArchitectureView }))), W = (0, i.lazy)(() => import("./FlowView-Ct_ai35e.js").then((e) => ({ default: e.FlowView }))), G = (0, i.lazy)(() => import("./ImpactView-Br0Pn4fs.js").then((e) => ({ default: e.ImpactView })));
function K(e, t, n, r) {
	return e ? "Brouillon enregistré · non appliqué" : r === "import" ? "Référence importée" : t === n ? "Appliquée" : "Consultation";
}
function q(e, t, n, r) {
	return e ? r ? "Nouvelle analyse en cours · dernière analyse affichée, à actualiser." : "Analyse des sources…" : t ? t + (r ? " Dernière analyse conservée, non actualisée." : "") : n ? `${n.files.length} fichiers · ${n.elements.length} éléments · ${n.status === "complete" ? "analyse terminée" : "analyse partielle"}` : "Aucune version à analyser.";
}
function J({ host: e }) {
	let t = (0, i.useCallback)((t) => {
		t && t.append(e);
	}, [e]);
	return /* @__PURE__ */ (0, _.jsx)("div", {
		className: "project-source-slot",
		ref: t
	});
}
function Y(e) {
	let [t, n] = (0, i.useState)(e.view || "files"), r = e.onViewChange ? e.view || "files" : t, o = (t) => {
		e.onViewChange ? e.onViewChange(t) : n(t);
	}, [s, c] = (0, i.useState)(!1), [l, u] = (0, i.useState)(null), [d, f] = (0, i.useState)(!0), p = s && e.revisionId === e.activeRevisionId, { model: m, loading: h, error: g, stale: v, refresh: b } = a(e.revisionId, e.previousRevisionId, p), x = m?.analysis, S = h || !!g || !x, C = S ? [] : e.checks.filter((e) => e.revisionId === x.revisionId), w = (e) => {
		u(e), f(!!e);
	}, T = (t, n) => {
		o("files"), u(null), e.onOpenSource(t, n, { draft: p });
	}, E = m ? {
		model: m,
		selectedId: l,
		onSelect: w,
		onOpenSource: T,
		onShowChecks: e.onShowChecks
	} : null;
	return /* @__PURE__ */ (0, _.jsxs)("div", {
		className: "project-workspace",
		children: [
			/* @__PURE__ */ (0, _.jsxs)("header", {
				className: "project-context-bar",
				children: [/* @__PURE__ */ (0, _.jsxs)("span", { children: [
					/* @__PURE__ */ (0, _.jsx)(y, { name: "graph" }),
					/* @__PURE__ */ (0, _.jsx)(H, {
						revisionId: e.revisionId,
						activeRevisionId: e.activeRevisionId,
						revisions: e.revisions,
						onSelectVersion: e.onSelectVersion
					}),
					/* @__PURE__ */ (0, _.jsx)("span", {
						className: "project-context-muted",
						children: K(p, e.revisionId, e.activeRevisionId, e.revisions?.find((t) => t.id === e.revisionId)?.origin?.kind)
					})
				] }), /* @__PURE__ */ (0, _.jsxs)("div", { children: [
					/* @__PURE__ */ (0, _.jsxs)("details", {
						className: "project-analysis-menu",
						children: [/* @__PURE__ */ (0, _.jsx)("summary", { children: h ? "Analyse en cours…" : g ? "Analyse indisponible" : v ? "À actualiser" : `${x?.files.length || 0} fichiers` }), /* @__PURE__ */ (0, _.jsxs)("div", {
							className: "project-analysis-line",
							children: [
								/* @__PURE__ */ (0, _.jsx)("span", {
									role: "status",
									children: q(h, g, x, v)
								}),
								/* @__PURE__ */ (0, _.jsxs)("label", { children: [/* @__PURE__ */ (0, _.jsx)("input", {
									type: "checkbox",
									checked: p,
									onChange: (e) => c(e.target.checked),
									disabled: !e.revisionId || e.revisionId !== e.activeRevisionId
								}), "Inclure le brouillon enregistré"] }),
								x && /* @__PURE__ */ (0, _.jsxs)("details", {
									className: "project-analysis-details",
									children: [
										/* @__PURE__ */ (0, _.jsx)("summary", { children: "Périmètre, limites et décisions de conception" }),
										/* @__PURE__ */ (0, _.jsxs)("p", { children: [
											x.scope,
											" · ",
											x.environment,
											" ·",
											" ",
											new Date(x.analyzedAt).toLocaleString("fr-FR")
										] }),
										x.limits.map((e, t) => /* @__PURE__ */ (0, _.jsx)("p", { children: e }, t)),
										x.issues.map((e, t) => /* @__PURE__ */ (0, _.jsxs)("p", { children: [
											e.extractor,
											" · ",
											e.path,
											" · ",
											e.message
										] }, t)),
										e.decisions.filter((e) => e.status !== "superseded").map((e) => /* @__PURE__ */ (0, _.jsxs)("p", { children: [
											/* @__PURE__ */ (0, _.jsx)("strong", { children: e.topic }),
											" : ",
											e.choice,
											/* @__PURE__ */ (0, _.jsx)("br", {}),
											e.reason
										] }, e.id)),
										/* @__PURE__ */ (0, _.jsx)("p", { children: "Les choix de conception sont déclaratifs ; leur conformité au code demande une vérification." })
									]
								})
							]
						})]
					}),
					e.focused && e.pendingDecision && /* @__PURE__ */ (0, _.jsx)("button", {
						className: "project-caution",
						onClick: e.onReviewDecision,
						title: e.pendingDecision,
						children: "Décision à examiner"
					}),
					/* @__PURE__ */ (0, _.jsxs)("button", {
						"aria-pressed": e.focused,
						onClick: e.onFocus,
						children: [/* @__PURE__ */ (0, _.jsx)(y, { name: "eye" }), "Focus technique"]
					}),
					/* @__PURE__ */ (0, _.jsx)("button", {
						onClick: e.onExpand,
						"aria-label": "Agrandir l’espace technique",
						title: "Agrandir l’espace technique",
						children: /* @__PURE__ */ (0, _.jsx)(y, { name: "focus" })
					})
				] })]
			}),
			/* @__PURE__ */ (0, _.jsxs)("nav", {
				className: "project-subnav",
				"aria-label": "Vues du code",
				children: [
					[
						["files", "Fichiers"],
						["architecture", "Architecture"],
						["flows", "Flux"],
						["impact", "Impact"]
					].map(([e, t]) => /* @__PURE__ */ (0, _.jsx)("button", {
						"aria-current": r === e ? "page" : void 0,
						onClick: () => o(e),
						children: t
					}, e)),
					/* @__PURE__ */ (0, _.jsx)("span", { className: "subnav-spacer" }),
					/* @__PURE__ */ (0, _.jsx)("button", {
						onClick: () => f((e) => !e),
						"aria-pressed": d,
						title: "Afficher ou masquer l’inspection",
						children: "Inspecteur"
					}),
					/* @__PURE__ */ (0, _.jsx)("button", {
						onClick: b,
						"aria-label": "Reconstruire l’analyse",
						title: "Reconstruire l’analyse",
						children: /* @__PURE__ */ (0, _.jsx)(y, { name: "refresh" })
					})
				]
			}),
			g && /* @__PURE__ */ (0, _.jsxs)("p", {
				className: "project-caution",
				children: [
					"L’analyse n’est pas disponible. L’éditeur reste accessible.",
					" ",
					/* @__PURE__ */ (0, _.jsx)("button", {
						onClick: b,
						children: "Réessayer"
					})
				]
			}),
			/* @__PURE__ */ (0, _.jsxs)("div", {
				className: "project-main-grid" + (d && x ? " with-inspector" : ""),
				children: [/* @__PURE__ */ (0, _.jsxs)("div", {
					className: "project-center",
					children: [/* @__PURE__ */ (0, _.jsxs)("div", {
						className: "project-files-layout",
						hidden: r !== "files",
						children: [x && /* @__PURE__ */ (0, _.jsx)(j, {
							analysis: x,
							selected: e.selectedPath,
							onSelect: (t) => {
								u(null), e.onOpenSource(t, void 0, { draft: p });
							}
						}), /* @__PURE__ */ (0, _.jsx)(J, { host: e.sourceHost })]
					}), /* @__PURE__ */ (0, _.jsxs)(i.Suspense, {
						fallback: /* @__PURE__ */ (0, _.jsx)("p", {
							role: "status",
							children: "Chargement de cette vue…"
						}),
						children: [
							E && r === "architecture" && /* @__PURE__ */ (0, _.jsx)(U, { ...E }),
							E && r === "flows" && /* @__PURE__ */ (0, _.jsx)(W, { ...E }),
							E && r === "impact" && /* @__PURE__ */ (0, _.jsx)(G, { ...E })
						]
					})]
				}), d && x && /* @__PURE__ */ (0, _.jsx)(z, {
					analysis: x,
					selectedId: l,
					selectedPath: e.selectedPath,
					onSelect: w,
					onClose: () => f(!1),
					onView: o,
					onOpenSource: T,
					onShowChecks: e.onShowChecks
				})]
			}),
			/* @__PURE__ */ (0, _.jsxs)("details", {
				className: "project-results",
				children: [
					/* @__PURE__ */ (0, _.jsxs)("summary", { children: [
						/* @__PURE__ */ (0, _.jsx)(y, { name: "check" }),
						"Vérifications de cette version · ",
						/* @__PURE__ */ (0, _.jsx)("span", { children: "Consulter les résultats et les preuves" })
					] }),
					/* @__PURE__ */ (0, _.jsx)("p", { children: "Contrôles historiques transmis à cet espace. Le panneau Qualité rassemble les résultats et les rapports reçus de l’hôte ; ils ne valident pas toute l’application." }),
					C.map((e) => /* @__PURE__ */ (0, _.jsxs)("p", {
						className: e.status === "failed" ? "project-caution" : "",
						children: [
							e.status === "passed" ? "✓" : "×",
							" ",
							e.label
						]
					}, e.id)),
					S ? /* @__PURE__ */ (0, _.jsx)("p", { children: "Contrôles historiques masqués · analyse en attente ou indisponible. Ils seront rapprochés de la version quand son analyse sera disponible." }) : !C.length && /* @__PURE__ */ (0, _.jsx)("p", { children: "Aucun contrôle historique transmis à cet espace." }),
					/* @__PURE__ */ (0, _.jsx)("button", {
						onClick: () => e.onShowChecks(),
						children: "Consulter les preuves et les outils →"
					})
				]
			})
		]
	});
}
//#endregion
//#region studio-ui/src/project-widget.tsx
function X(e, t) {
	let n = (0, r.createRoot)(e), i = (e) => n.render(/* @__PURE__ */ (0, _.jsx)(Y, { ...e }));
	return i(t), {
		update: i,
		dispose: () => n.unmount()
	};
}
//#endregion
export { X as mountProjectWidget };
