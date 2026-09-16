import { n as e, r as t, t as n } from "./jsx-runtime-Bz8zB3tG.js";
//#region studio-ui/src/features/project/hooks/useProjectModel.ts
var r = e(), i = t();
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
	unclassified: "Non classé"
};
function s(e, t, n) {
	let r = /* @__PURE__ */ new Map();
	for (let i of e) {
		if (!i.path.toLocaleLowerCase().includes(n.toLocaleLowerCase())) continue;
		let e = t === "layer" ? o[i.layer] : i.feature || "Sans fonctionnalité identifiée", a = r.get(e);
		a || (a = {
			name: e,
			path: e,
			children: []
		}, r.set(e, a));
		let s = a.children, c = i.path.split("/");
		c.forEach((t, n) => {
			let r = c.slice(0, n + 1).join("/"), a = s.find((e) => e.name === t);
			a || (a = {
				name: t,
				path: e + ":" + r,
				children: []
			}, s.push(a)), n === c.length - 1 && (a.file = i), s = a.children;
		});
	}
	let i = Object.values(o);
	return [...r.values()].sort((e, n) => t === "layer" ? i.indexOf(e.name) - i.indexOf(n.name) : e.name.localeCompare(n.name));
}
//#endregion
//#region studio-ui/src/features/project/components/ProjectIcon.tsx
var c = n(), l = {
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
function u({ name: e = "file" }) {
	return /* @__PURE__ */ (0, c.jsx)("svg", {
		className: "project-icon",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "1.6",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, c.jsx)("path", { d: l[e] || l.file })
	});
}
//#endregion
//#region studio-ui/src/features/project/components/FileExplorer.tsx
function d({ items: e, selected: t, onSelect: n }) {
	return /* @__PURE__ */ (0, c.jsx)("ul", { children: e.map((e) => /* @__PURE__ */ (0, c.jsx)("li", { children: e.file ? /* @__PURE__ */ (0, c.jsxs)("button", {
		type: "button",
		className: "project-file",
		"aria-current": t === e.file.path ? "true" : void 0,
		title: e.file.path,
		onClick: () => n(e.file.path),
		children: [/* @__PURE__ */ (0, c.jsx)("span", {
			className: "file-glyph language-" + e.file.language.toLowerCase(),
			"aria-hidden": "true",
			children: ["typescript", "TS"].includes(e.file.language) ? "TS" : ["typescriptreact", "TSX"].includes(e.file.language) ? "TSX" : /* @__PURE__ */ (0, c.jsx)(u, {})
		}), /* @__PURE__ */ (0, c.jsx)("span", { children: e.name })]
	}) : /* @__PURE__ */ (0, c.jsxs)("details", {
		open: !0,
		children: [/* @__PURE__ */ (0, c.jsxs)("summary", { children: [/* @__PURE__ */ (0, c.jsx)(u, { name: "folder" }), e.name] }), /* @__PURE__ */ (0, c.jsx)(d, {
			items: e.children,
			selected: t,
			onSelect: n
		})]
	}) }, e.path)) });
}
function f({ analysis: e, selected: t, onSelect: n }) {
	let [r, a] = (0, i.useState)(""), [o, l] = (0, i.useState)("layer"), f = s(e.files, o, r);
	return /* @__PURE__ */ (0, c.jsxs)("nav", {
		className: "project-explorer",
		"aria-label": "Explorateur du projet",
		children: [
			/* @__PURE__ */ (0, c.jsxs)("div", {
				className: "explorer-tools",
				children: [/* @__PURE__ */ (0, c.jsxs)("label", {
					className: "project-search",
					children: [/* @__PURE__ */ (0, c.jsx)(u, { name: "search" }), /* @__PURE__ */ (0, c.jsx)("input", {
						"aria-label": "Rechercher un fichier",
						placeholder: "Rechercher un fichier…",
						value: r,
						onChange: (e) => a(e.target.value)
					})]
				}), /* @__PURE__ */ (0, c.jsxs)("select", {
					"aria-label": "Organisation des fichiers",
					value: o,
					onChange: (e) => l(e.target.value),
					children: [/* @__PURE__ */ (0, c.jsx)("option", {
						value: "layer",
						children: "Par couche"
					}), /* @__PURE__ */ (0, c.jsx)("option", {
						value: "feature",
						children: "Par fonctionnalité"
					})]
				})]
			}),
			/* @__PURE__ */ (0, c.jsxs)("div", {
				className: "project-file-tree",
				children: [/* @__PURE__ */ (0, c.jsx)(d, {
					items: f,
					selected: t,
					onSelect: n
				}), !f.length && /* @__PURE__ */ (0, c.jsx)("p", { children: "Aucun fichier correspondant." })]
			}),
			/* @__PURE__ */ (0, c.jsxs)("p", {
				className: "explorer-note",
				children: [
					e.files.length,
					" fichiers · classement logique",
					!e.backendDetected && /* @__PURE__ */ (0, c.jsxs)(c.Fragment, { children: [/* @__PURE__ */ (0, c.jsx)("br", {}), "Aucun backend détecté dans ces sources."] })
				]
			})
		]
	});
}
//#endregion
//#region studio-ui/src/features/project/components/ProjectInspector.tsx
var p = {
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
}, m = {
	detected: "Détecté dans le code",
	declared: "Déclaré",
	observed: "Observé en exécution",
	inferred: "Supposé"
};
function h({ sources: e, onOpenSource: t }) {
	return /* @__PURE__ */ (0, c.jsx)("div", {
		className: "inspector-sources",
		children: e.map((e, n) => /* @__PURE__ */ (0, c.jsxs)("button", {
			onClick: () => t(e.path, e.line),
			children: [
				/* @__PURE__ */ (0, c.jsx)(u, {}),
				e.path,
				e.line ? ":" + e.line : ""
			]
		}, e.path + n))
	});
}
function g({ entries: e, onOpenSource: t }) {
	return /* @__PURE__ */ (0, c.jsx)(c.Fragment, { children: e.map((e, n) => /* @__PURE__ */ (0, c.jsxs)("div", {
		className: "inspector-provenance",
		children: [
			/* @__PURE__ */ (0, c.jsx)("span", {
				className: "provenance-tag provenance-" + e.kind,
				children: m[e.kind]
			}),
			/* @__PURE__ */ (0, c.jsx)("p", { children: e.method }),
			/* @__PURE__ */ (0, c.jsx)(h, {
				sources: e.sources,
				onOpenSource: t
			}),
			e.limitation && /* @__PURE__ */ (0, c.jsx)("p", {
				className: "project-caution",
				children: e.limitation
			})
		]
	}, n)) });
}
function _(e, t, n) {
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
function v({ revisionId: e, onClose: t }) {
	return /* @__PURE__ */ (0, c.jsxs)("aside", {
		className: "project-inspector",
		"aria-label": "Inspection du projet",
		children: [
			/* @__PURE__ */ (0, c.jsxs)("div", {
				className: "inspector-heading",
				children: [
					/* @__PURE__ */ (0, c.jsx)(u, {}),
					/* @__PURE__ */ (0, c.jsx)("h3", { children: "Élément absent de cette version" }),
					/* @__PURE__ */ (0, c.jsx)("button", {
						onClick: t,
						"aria-label": "Fermer l’inspecteur",
						title: "Fermer l’inspecteur",
						children: "×"
					})
				]
			}),
			/* @__PURE__ */ (0, c.jsxs)("p", { children: [
				"L’élément ou la connexion sélectionné n’existe pas dans l’analyse de la version",
				" ",
				e.slice(0, 8),
				". Il peut avoir été supprimé ou ne plus être résolu."
			] }),
			/* @__PURE__ */ (0, c.jsx)("p", { children: "Aucun autre fichier n’est substitué à cette sélection. Consultez la version précédente depuis l’historique pour retrouver ses sources." })
		]
	});
}
function y(e, t, n) {
	return !(!e || t || n);
}
function b({ analysis: e, selectedId: t, selectedPath: n, onSelect: r, onClose: i, onView: a, onOpenSource: o, onShowChecks: s }) {
	let { relation: l, element: d, file: f, selectedSources: m, connected: b, contracts: C, tests: w } = _(e, t, n);
	if (y(t, d, l)) return /* @__PURE__ */ (0, c.jsx)(v, {
		revisionId: e.revisionId,
		onClose: i
	});
	let T = (e) => /* @__PURE__ */ (0, c.jsx)("button", {
		onClick: () => r(e.id),
		children: e.label
	}, e.id);
	return /* @__PURE__ */ (0, c.jsxs)("aside", {
		className: "project-inspector",
		"aria-label": "Inspection du projet",
		children: [
			/* @__PURE__ */ (0, c.jsxs)("div", {
				className: "inspector-heading",
				children: [
					/* @__PURE__ */ (0, c.jsx)(u, { name: l ? "graph" : "file" }),
					/* @__PURE__ */ (0, c.jsx)("h3", { children: l?.label || d?.label || f?.path.split("/").at(-1) || "Inspection" }),
					/* @__PURE__ */ (0, c.jsx)("button", {
						onClick: i,
						"aria-label": "Fermer l’inspecteur",
						title: "Fermer l’inspecteur",
						children: "×"
					})
				]
			}),
			/* @__PURE__ */ (0, c.jsx)("p", { children: d?.details.role || d?.description || f?.role || "Sélectionnez un fichier, un élément ou une connexion." }),
			l ? /* @__PURE__ */ (0, c.jsx)(x, {
				relation: l,
				analysis: e,
				onSelect: r,
				onOpenSource: o
			}) : /* @__PURE__ */ (0, c.jsxs)(c.Fragment, { children: [
				/* @__PURE__ */ (0, c.jsx)("h4", { children: "Fichier source" }),
				/* @__PURE__ */ (0, c.jsx)(h, {
					sources: m,
					onOpenSource: o
				}),
				d && /* @__PURE__ */ (0, c.jsxs)(c.Fragment, { children: [
					/* @__PURE__ */ (0, c.jsxs)("details", { children: [/* @__PURE__ */ (0, c.jsx)("summary", { children: "Fonctions, interactions et métadonnées" }), Object.keys(d.details).length ? /* @__PURE__ */ (0, c.jsx)("dl", { children: Object.entries(d.details).filter(([e]) => e !== "sha256").map(([e, t]) => /* @__PURE__ */ (0, c.jsxs)("div", { children: [/* @__PURE__ */ (0, c.jsx)("dt", { children: p[e] || e }), /* @__PURE__ */ (0, c.jsx)("dd", { children: t })] }, e)) }) : /* @__PURE__ */ (0, c.jsx)("p", { children: "Entrées et sorties non résolues par cet extracteur." })] }),
					/* @__PURE__ */ (0, c.jsx)("h4", { children: "Connexions et dépendances" }),
					b.length ? /* @__PURE__ */ (0, c.jsx)("div", {
						className: "inspector-connections",
						children: b.map((t) => /* @__PURE__ */ (0, c.jsxs)("button", {
							onClick: () => r(t.id),
							children: [
								/* @__PURE__ */ (0, c.jsx)("span", { children: t.kind }),
								" ",
								t.source === d.id ? "→ " : "← ",
								e.elements.find((e) => e.id === (t.source === d.id ? t.target : t.source))?.label || t.label
							]
						}, t.id))
					}) : /* @__PURE__ */ (0, c.jsx)("p", { children: "Aucune connexion résolue ; cela ne prouve pas l’absence de dépendance." })
				] }),
				/* @__PURE__ */ (0, c.jsxs)("div", {
					className: "inspector-actions",
					children: [/* @__PURE__ */ (0, c.jsxs)("button", {
						onClick: () => a("flows"),
						children: [
							/* @__PURE__ */ (0, c.jsx)(u, { name: "graph" }),
							"Voir le flux ",
							/* @__PURE__ */ (0, c.jsx)("span", { children: "→" })
						]
					}), /* @__PURE__ */ (0, c.jsxs)("button", {
						onClick: () => a("impact"),
						children: [
							/* @__PURE__ */ (0, c.jsx)(u, { name: "code" }),
							"Voir l’impact ",
							/* @__PURE__ */ (0, c.jsx)("span", { children: "→" })
						]
					})]
				}),
				/* @__PURE__ */ (0, c.jsxs)("details", { children: [/* @__PURE__ */ (0, c.jsxs)("summary", { children: ["Contrats associés · ", C.length] }), C.length ? C.map(T) : /* @__PURE__ */ (0, c.jsx)("p", { children: "Aucun contrat directement lié détecté." })] }),
				/* @__PURE__ */ (0, c.jsxs)("details", {
					open: !0,
					children: [
						/* @__PURE__ */ (0, c.jsxs)("summary", { children: ["Tests associés · ", w.length] }),
						w.length ? /* @__PURE__ */ (0, c.jsxs)(c.Fragment, { children: [/* @__PURE__ */ (0, c.jsx)("p", { children: "Association par une relation d’import ou de test détectée ; aucun succès déduit." }), w.map(T)] }) : /* @__PURE__ */ (0, c.jsx)("p", { children: "Aucune association directe détectée." }),
						/* @__PURE__ */ (0, c.jsx)("button", {
							onClick: () => s(m[0]?.path),
							children: "Consulter les vérifications →"
						})
					]
				}),
				/* @__PURE__ */ (0, c.jsxs)("details", { children: [
					/* @__PURE__ */ (0, c.jsx)("summary", { children: "Provenance et fraîcheur" }),
					d ? /* @__PURE__ */ (0, c.jsx)(g, {
						entries: d.provenance,
						onOpenSource: o
					}) : /* @__PURE__ */ (0, c.jsx)("p", { children: "Fichier présent dans le manifeste vérifié de cette version." }),
					/* @__PURE__ */ (0, c.jsxs)("p", { children: ["Runtime : ", S(d)] }),
					d?.details.sha256 && /* @__PURE__ */ (0, c.jsxs)("p", { children: ["Empreinte du fichier : ", /* @__PURE__ */ (0, c.jsx)("code", { children: d.details.sha256 })] }),
					/* @__PURE__ */ (0, c.jsxs)("p", { children: [
						"Version ",
						e.revisionId.slice(0, 8),
						e.localChanges ? " + brouillon local" : "",
						/* @__PURE__ */ (0, c.jsx)("br", {}),
						new Date(e.analyzedAt).toLocaleString("fr-FR")
					] })
				] })
			] })
		]
	});
}
function x({ relation: e, analysis: t, onSelect: n, onOpenSource: r }) {
	return /* @__PURE__ */ (0, c.jsxs)(c.Fragment, { children: [
		/* @__PURE__ */ (0, c.jsxs)("p", {
			className: "provenance-tag",
			children: ["Relation · ", e.kind]
		}),
		/* @__PURE__ */ (0, c.jsx)("div", {
			className: "inspector-connections",
			children: [e.source, e.target].map((e, r) => /* @__PURE__ */ (0, c.jsxs)("button", {
				onClick: () => n(e),
				children: [r ? "Vers : " : "Depuis : ", t.elements.find((t) => t.id === e)?.label || e]
			}, e + r))
		}),
		/* @__PURE__ */ (0, c.jsx)("h4", { children: "Provenance" }),
		/* @__PURE__ */ (0, c.jsx)(g, {
			entries: e.provenance,
			onOpenSource: r
		}),
		/* @__PURE__ */ (0, c.jsx)("p", {
			className: "project-caution",
			children: "Une connexion dans le code ne prouve pas son bon fonctionnement en exécution."
		})
	] });
}
function S(e) {
	return e?.runtime === "observed" ? "observation disponible, voir la preuve" : "non observé";
}
//#endregion
//#region studio-ui/src/features/project/components/ProjectVersionSelector.tsx
function C({ revisionId: e, activeRevisionId: t, revisions: n, onSelectVersion: r }) {
	return !n?.length || !r ? /* @__PURE__ */ (0, c.jsxs)("strong", { children: ["Version · ", e?.slice(0, 8) || "aucune"] }) : /* @__PURE__ */ (0, c.jsx)("select", {
		className: "project-version-select",
		"aria-label": "Version du code",
		value: e || "",
		onChange: (e) => r(e.target.value),
		children: n.map((e) => /* @__PURE__ */ (0, c.jsxs)("option", {
			value: e.id,
			children: [
				e.id.slice(0, 8),
				" · ",
				e.id === t ? "Appliquée · " : "",
				e.title
			]
		}, e.id))
	});
}
//#endregion
//#region studio-ui/src/features/project/components/ProjectWorkbench.tsx
var w = (0, i.lazy)(() => import("./ArchitectureView-BNuLi3C-.js").then((e) => ({ default: e.ArchitectureView }))), T = (0, i.lazy)(() => import("./FlowView-yFu7Q8N-.js").then((e) => ({ default: e.FlowView }))), E = (0, i.lazy)(() => import("./ImpactView-nO-JJW_f.js").then((e) => ({ default: e.ImpactView })));
function D(e, t, n) {
	return e ? "Brouillon enregistré · non appliqué" : t === n ? "Appliquée" : "Consultation";
}
function O(e, t, n, r) {
	return e ? r ? "Nouvelle analyse en cours · dernière analyse affichée, à actualiser." : "Analyse des sources…" : t ? t + (r ? " Dernière analyse conservée, non actualisée." : "") : n ? `${n.files.length} fichiers · ${n.elements.length} éléments · ${n.status === "complete" ? "analyse terminée" : "analyse partielle"}` : "Aucune version à analyser.";
}
function k({ host: e }) {
	let t = (0, i.useCallback)((t) => {
		t && t.append(e);
	}, [e]);
	return /* @__PURE__ */ (0, c.jsx)("div", {
		className: "project-source-slot",
		ref: t
	});
}
function A(e) {
	let [t, n] = (0, i.useState)(e.view || "files"), [r, o] = (0, i.useState)(!1), [s, l] = (0, i.useState)(null), [d, p] = (0, i.useState)(!0), m = r && e.revisionId === e.activeRevisionId, { model: h, loading: g, error: _, stale: v, refresh: y } = a(e.revisionId, e.previousRevisionId, m), x = h?.analysis, S = g || !!_ || !x, A = S ? [] : e.checks.filter((e) => e.revisionId === x.revisionId), j = (e) => {
		l(e), p(!!e);
	}, M = (t, r) => {
		n("files"), l(null), e.onOpenSource(t, r, { draft: m });
	}, N = h ? {
		model: h,
		selectedId: s,
		onSelect: j,
		onOpenSource: M,
		onShowChecks: e.onShowChecks
	} : null;
	return /* @__PURE__ */ (0, c.jsxs)("div", {
		className: "project-workspace",
		children: [
			/* @__PURE__ */ (0, c.jsxs)("header", {
				className: "project-context-bar",
				children: [/* @__PURE__ */ (0, c.jsxs)("span", { children: [
					/* @__PURE__ */ (0, c.jsx)(u, { name: "graph" }),
					/* @__PURE__ */ (0, c.jsx)(C, {
						revisionId: e.revisionId,
						activeRevisionId: e.activeRevisionId,
						revisions: e.revisions,
						onSelectVersion: e.onSelectVersion
					}),
					/* @__PURE__ */ (0, c.jsx)("span", {
						className: "project-context-muted",
						children: D(m, e.revisionId, e.activeRevisionId)
					})
				] }), /* @__PURE__ */ (0, c.jsxs)("div", { children: [
					/* @__PURE__ */ (0, c.jsxs)("details", {
						className: "project-analysis-menu",
						children: [/* @__PURE__ */ (0, c.jsx)("summary", { children: g ? "Analyse en cours…" : _ ? "Analyse indisponible" : v ? "À actualiser" : `${x?.files.length || 0} fichiers` }), /* @__PURE__ */ (0, c.jsxs)("div", {
							className: "project-analysis-line",
							children: [
								/* @__PURE__ */ (0, c.jsx)("span", {
									role: "status",
									children: O(g, _, x, v)
								}),
								/* @__PURE__ */ (0, c.jsxs)("label", { children: [/* @__PURE__ */ (0, c.jsx)("input", {
									type: "checkbox",
									checked: m,
									onChange: (e) => o(e.target.checked),
									disabled: !e.revisionId || e.revisionId !== e.activeRevisionId
								}), "Inclure le brouillon enregistré"] }),
								x && /* @__PURE__ */ (0, c.jsxs)("details", {
									className: "project-analysis-details",
									children: [
										/* @__PURE__ */ (0, c.jsx)("summary", { children: "Périmètre, limites et décisions de conception" }),
										/* @__PURE__ */ (0, c.jsxs)("p", { children: [
											x.scope,
											" · ",
											x.environment,
											" ·",
											" ",
											new Date(x.analyzedAt).toLocaleString("fr-FR")
										] }),
										x.limits.map((e, t) => /* @__PURE__ */ (0, c.jsx)("p", { children: e }, t)),
										x.issues.map((e, t) => /* @__PURE__ */ (0, c.jsxs)("p", { children: [
											e.extractor,
											" · ",
											e.path,
											" · ",
											e.message
										] }, t)),
										e.decisions.filter((e) => e.status !== "superseded").map((e) => /* @__PURE__ */ (0, c.jsxs)("p", { children: [
											/* @__PURE__ */ (0, c.jsx)("strong", { children: e.topic }),
											" : ",
											e.choice,
											/* @__PURE__ */ (0, c.jsx)("br", {}),
											e.reason
										] }, e.id)),
										/* @__PURE__ */ (0, c.jsx)("p", { children: "Les choix de conception sont déclaratifs ; leur conformité au code demande une vérification." })
									]
								})
							]
						})]
					}),
					e.focused && e.pendingDecision && /* @__PURE__ */ (0, c.jsx)("button", {
						className: "project-caution",
						onClick: e.onReviewDecision,
						title: e.pendingDecision,
						children: "Décision à examiner"
					}),
					/* @__PURE__ */ (0, c.jsxs)("button", {
						"aria-pressed": e.focused,
						onClick: e.onFocus,
						children: [/* @__PURE__ */ (0, c.jsx)(u, { name: "eye" }), "Focus technique"]
					}),
					/* @__PURE__ */ (0, c.jsx)("button", {
						onClick: e.onExpand,
						"aria-label": "Agrandir l’espace technique",
						title: "Agrandir l’espace technique",
						children: /* @__PURE__ */ (0, c.jsx)(u, { name: "focus" })
					})
				] })]
			}),
			/* @__PURE__ */ (0, c.jsxs)("nav", {
				className: "project-subnav",
				"aria-label": "Vues du code",
				children: [
					[
						["files", "Fichiers"],
						["architecture", "Architecture"],
						["flows", "Flux"],
						["impact", "Impact"]
					].map(([e, r]) => /* @__PURE__ */ (0, c.jsx)("button", {
						"aria-current": t === e ? "page" : void 0,
						onClick: () => n(e),
						children: r
					}, e)),
					/* @__PURE__ */ (0, c.jsx)("span", { className: "subnav-spacer" }),
					/* @__PURE__ */ (0, c.jsx)("button", {
						onClick: () => p((e) => !e),
						"aria-pressed": d,
						title: "Afficher ou masquer l’inspection",
						children: "Inspecteur"
					}),
					/* @__PURE__ */ (0, c.jsx)("button", {
						onClick: y,
						"aria-label": "Reconstruire l’analyse",
						title: "Reconstruire l’analyse",
						children: /* @__PURE__ */ (0, c.jsx)(u, { name: "refresh" })
					})
				]
			}),
			_ && /* @__PURE__ */ (0, c.jsxs)("p", {
				className: "project-caution",
				children: [
					"L’analyse n’est pas disponible. L’éditeur reste accessible.",
					" ",
					/* @__PURE__ */ (0, c.jsx)("button", {
						onClick: y,
						children: "Réessayer"
					})
				]
			}),
			/* @__PURE__ */ (0, c.jsxs)("div", {
				className: "project-main-grid" + (d && x ? " with-inspector" : ""),
				children: [/* @__PURE__ */ (0, c.jsxs)("div", {
					className: "project-center",
					children: [/* @__PURE__ */ (0, c.jsxs)("div", {
						className: "project-files-layout",
						hidden: t !== "files",
						children: [x && /* @__PURE__ */ (0, c.jsx)(f, {
							analysis: x,
							selected: e.selectedPath,
							onSelect: (t) => {
								l(null), e.onOpenSource(t, void 0, { draft: m });
							}
						}), /* @__PURE__ */ (0, c.jsx)(k, { host: e.sourceHost })]
					}), /* @__PURE__ */ (0, c.jsxs)(i.Suspense, {
						fallback: /* @__PURE__ */ (0, c.jsx)("p", {
							role: "status",
							children: "Chargement de cette vue…"
						}),
						children: [
							N && t === "architecture" && /* @__PURE__ */ (0, c.jsx)(w, { ...N }),
							N && t === "flows" && /* @__PURE__ */ (0, c.jsx)(T, { ...N }),
							N && t === "impact" && /* @__PURE__ */ (0, c.jsx)(E, { ...N })
						]
					})]
				}), d && x && /* @__PURE__ */ (0, c.jsx)(b, {
					analysis: x,
					selectedId: s,
					selectedPath: e.selectedPath,
					onSelect: j,
					onClose: () => p(!1),
					onView: n,
					onOpenSource: M,
					onShowChecks: e.onShowChecks
				})]
			}),
			/* @__PURE__ */ (0, c.jsxs)("details", {
				className: "project-results",
				children: [
					/* @__PURE__ */ (0, c.jsxs)("summary", { children: [
						/* @__PURE__ */ (0, c.jsx)(u, { name: "check" }),
						S ? "Vérifications masquées · analyse en attente ou indisponible" : `Vérifications de cette version · ${A.filter((e) => e.status === "passed").length} réussies · ${A.filter((e) => e.status === "failed").length} échouées`,
						" ",
						/* @__PURE__ */ (0, c.jsx)("span", { children: "Ouvrir les résultats" })
					] }),
					/* @__PURE__ */ (0, c.jsx)("p", { children: "Ces résultats couvrent uniquement les contrôles exécutés, pas toute l’application." }),
					A.map((e) => /* @__PURE__ */ (0, c.jsxs)("p", {
						className: e.status === "failed" ? "project-caution" : "",
						children: [
							e.status === "passed" ? "✓" : "×",
							" ",
							e.label
						]
					}, e.id)),
					S ? /* @__PURE__ */ (0, c.jsx)("p", { children: "Les résultats seront rapprochés de la version quand son analyse sera disponible." }) : !A.length && /* @__PURE__ */ (0, c.jsx)("p", { children: "Aucun contrôle enregistré pour cette version." }),
					/* @__PURE__ */ (0, c.jsx)("button", {
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
function j(e, t) {
	let n = (0, r.createRoot)(e), i = (e) => n.render(/* @__PURE__ */ (0, c.jsx)(A, { ...e }, e.view || "files"));
	return i(t), {
		update: i,
		dispose: () => n.unmount()
	};
}
//#endregion
export { j as mountProjectWidget };
