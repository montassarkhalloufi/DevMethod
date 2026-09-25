import { i as e, n as t, r as n, t as r } from "./jsx-runtime-D7gWoUTT.js";
//#region studio-ui/src/features/control/model.ts
var i = e(), a = n(), o = t(), s = [
	{
		id: "overview",
		label: "Vue d’ensemble",
		icon: "document"
	},
	{
		id: "graph",
		label: "Graphe des preuves",
		icon: "graph"
	},
	{
		id: "risks",
		label: "Analyse des risques",
		icon: "risk"
	},
	{
		id: "attention",
		label: "Attention humaine",
		icon: "person"
	},
	{
		id: "autonomy",
		label: "Autonomie adaptative",
		icon: "settings"
	},
	{
		id: "history",
		label: "Historique du Control Plane",
		icon: "history"
	}
], c = {
	low: "Faible",
	medium: "Moyen",
	high: "Élevé",
	critical: "Critique"
}, l = {
	guided: "Guidé",
	devauto: "DevAuto",
	delegated: "Autonome"
}, u = {
	observed: "Observé",
	declared: "Déclaré",
	inferred: "Inféré",
	missing: "Manquant"
}, d = {
	current: "Actuelle",
	stale: "À renouveler",
	unavailable: "Indisponible"
}, f = {
	"Auto-Continue": "Continuation autorisée",
	Verify: "Vérifications renforcées",
	"Human Decision": "Décision humaine requise",
	"Bounded Stop": "Arrêt borné"
}, p = (e) => e.attention.filter((e) => ["open", "read"].includes(e.status)), m = (e) => e.filter((e) => e.required && (e.status !== "observed" || e.freshness !== "current" || e.outcome !== "passed"));
function h() {
	let e = new URLSearchParams(window.location.search).get("control");
	return s.find((t) => t.id === e)?.id ?? "overview";
}
var g = {
	intention: "Intentions",
	criterion: "Critères",
	decision: "Décisions",
	code: "Code",
	analysis: "Analyses",
	check: "Vérifications",
	visual: "Preuves visuelles",
	job: "Missions",
	agent: "Agents",
	mcp: "Actions MCP",
	runtime: "Services locaux",
	risk: "Risques",
	human: "Interventions humaines",
	autonomy: "Autonomie"
};
//#endregion
//#region studio-ui/src/features/control/useControl.ts
async function _(e, t, n) {
	let r = await fetch(e, {
		signal: t,
		cache: "no-store",
		...n ? {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(n)
		} : {}
	}).catch(() => {
		throw Error("Connexion au Studio interrompue. Les preuves seront relues à la reprise.");
	}), i = await r.json();
	if (!r.ok) throw Error(i.error || "Le Control Plane est indisponible.");
	if (i.schemaVersion !== 1 || !i.snapshot?.decision || !Array.isArray(i.snapshot.nodes)) throw Error("Réponse du Control Plane invalide.");
	return i;
}
function v(e) {
	let [t, n] = (0, i.useState)(null), [r, a] = (0, i.useState)(""), [o, s] = (0, i.useState)(!0), [c, l] = (0, i.useState)(null), [u, d] = (0, i.useState)(""), f = (0, i.useRef)(0), p = (0, i.useRef)(null), [m, h] = (0, i.useState)(0), { revisionId: g, mode: v, active: y = !0 } = e;
	return (0, i.useEffect)(() => {
		if (!y) return;
		let e = ++f.current, t = new AbortController(), r;
		p.current?.abort(), p.current = null, s(!0), l(null), n(null), a("");
		let i = async () => {
			if (p.current) {
				r = setTimeout(i, 3e3);
				return;
			}
			try {
				let r = await _(`/api/control${g ? `?revision=${encodeURIComponent(g)}` : ""}`, t.signal);
				e === f.current && !t.signal.aborted && (n(r), a(""));
			} catch (n) {
				!t.signal.aborted && e === f.current && a(n instanceof Error ? n.message : "Chargement impossible.");
			} finally {
				!t.signal.aborted && e === f.current && (s(!1), r = setTimeout(i, 3e3));
			}
		};
		return i(), () => {
			t.abort(), p.current?.abort(), clearTimeout(r);
		};
	}, [
		g,
		v,
		m,
		y
	]), {
		report: t,
		error: r,
		loading: o,
		busy: c,
		progress: u,
		mutate: (0, i.useCallback)(async (t, r) => {
			if (p.current) return;
			let i = new AbortController(), o = f.current;
			p.current = i, l(t), a("");
			try {
				let a = await _(`/api/control/${t}`, i.signal, r);
				o === f.current && !i.signal.aborted && (n(a), e.onStateChanged());
			} catch (e) {
				o === f.current && !i.signal.aborted && a(e instanceof Error ? e.message : "Action impossible.");
			} finally {
				p.current === i && (p.current = null, l(null));
			}
		}, [e]),
		runChecks: async (r) => {
			if (!t || p.current) return;
			let i = t.snapshot.nodes.filter((e) => e.canRun && (!r || r.includes(e.checkId)));
			if (!i.length) return;
			let o = new AbortController(), s = f.current;
			p.current = o, l("verify"), a("");
			try {
				for (let [e, r] of i.entries()) {
					d(`${e} / ${i.length} contrôles terminés · ${r.label} en cours`);
					let a = await _("/api/control/verify", o.signal, {
						revisionId: t.snapshot.input.revisionId,
						checkId: r.checkId,
						requestId: crypto.randomUUID()
					});
					if (s !== f.current || o.signal.aborted) return;
					n(a), d(`${e + 1} / ${i.length} contrôles terminés · consultez leurs résultats`);
				}
				e.onStateChanged();
			} catch (e) {
				o.signal.aborted || a(e instanceof Error ? e.message : "Vérification interrompue.");
			} finally {
				p.current === o && (p.current = null, l(null));
			}
		},
		refresh: () => h((e) => e + 1)
	};
}
//#endregion
//#region studio-ui/src/features/control/Icon.tsx
var y = r(), b = {
	graph: "M12 4v6m-1 2-6 6m8-6 6 6M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4M12 9a2 2 0 1 0 0 4 2 2 0 0 0 0-4M4 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4M20 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4",
	risk: "m12 3 10 18H2L12 3Zm0 5v6m0 3v1",
	person: "M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8M3 22v-3a9 9 0 0 1 18 0v3Z",
	document: "M5 2h9l5 5v15H5ZM14 2v6h5M8 12h8m-8 4h8",
	settings: "M9 3h6l1 4 4 2v6l-4 2-1 4H9l-1-4-4-2V9l4-2ZM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8",
	search: "M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14m5 12 7 7",
	play: "m8 4 13 8-13 8Z",
	shield: "m12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6ZM7 12l4 4 6-8",
	info: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m0 8v7m0-11v1",
	check: "m4 12 5 5L20 5",
	stop: "M5 5h14v14H5Z",
	visual: "M2 3h20v18H2Zm2 14 5-6 4 4 3-3 5 6M15 6h2v2h-2Z",
	code: "m8 6-6 6 6 6m8-12 6 6-6 6m-3-16-2 20",
	history: "M3 11a9 9 0 1 1 3 8M3 5v6h6M12 7v6l4 2"
};
function x({ name: e, className: t = "" }) {
	return /* @__PURE__ */ (0, y.jsx)("svg", {
		className: `cp-icon ${t}`,
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "1.7",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, y.jsx)("path", { d: b[e] ?? b.document })
	});
}
//#endregion
//#region studio-ui/src/features/control/Overview.tsx
function S({ report: e, navigate: t, run: n, busy: r }) {
	let { snapshot: i } = e, { decision: a, risk: o, evidence: s } = i, u = p(e).filter((e) => e.expectedAction !== "renew").length, d = [
		{
			view: "graph",
			title: "Evidence Graph",
			icon: "graph",
			color: "cyan",
			description: "Relie exigences, code, tests et preuves.",
			value: `${s.current} / ${s.required}`,
			detail: "preuves actuelles",
			link: "Voir le graphe"
		},
		{
			view: "risks",
			title: "Risk Engine",
			icon: "risk",
			color: "violet",
			description: "Évalue l’impact et la sécurité.",
			value: `Risque ${c[o.level].toLowerCase()}`,
			detail: `${o.signals.length} signaux à examiner`,
			link: "Voir l’analyse"
		},
		{
			view: "attention",
			title: "Attention humaine",
			icon: "person",
			color: "amber",
			description: "Concentre l’attention sur ce qui compte.",
			value: `${u} décision${u > 1 ? "s" : ""} requise${u > 1 ? "s" : ""}`,
			detail: "",
			link: "Voir la file d’attente"
		},
		{
			view: "autonomy",
			title: "Autonomie adaptative",
			icon: "settings",
			color: "green",
			description: "Ajuste automatiquement le niveau d’autonomie.",
			value: a.effective,
			detail: f[a.effective],
			link: "Voir les paramètres"
		}
	], m = i.nodes.some((e) => e.canRun);
	return /* @__PURE__ */ (0, y.jsxs)(y.Fragment, { children: [
		/* @__PURE__ */ (0, y.jsxs)("header", {
			className: "cp-heading cp-overview-heading",
			children: [/* @__PURE__ */ (0, y.jsx)("h1", { children: "Control Plane" }), /* @__PURE__ */ (0, y.jsx)("p", { children: "Vue d’ensemble du système d’autonomie" })]
		}),
		/* @__PURE__ */ (0, y.jsxs)("div", {
			className: "cp-metrics",
			children: [
				/* @__PURE__ */ (0, y.jsxs)("div", {
					className: "cp-green",
					children: [/* @__PURE__ */ (0, y.jsx)(x, { name: "play" }), /* @__PURE__ */ (0, y.jsxs)("span", { children: ["Demandée", /* @__PURE__ */ (0, y.jsx)("strong", { children: l[a.requested] })] })]
				}),
				/* @__PURE__ */ (0, y.jsxs)("div", {
					className: "cp-cyan",
					children: [/* @__PURE__ */ (0, y.jsx)(x, { name: "search" }), /* @__PURE__ */ (0, y.jsxs)("span", { children: ["Effective", /* @__PURE__ */ (0, y.jsx)("strong", { children: a.effective })] })]
				}),
				/* @__PURE__ */ (0, y.jsxs)("div", {
					className: "cp-amber",
					children: [/* @__PURE__ */ (0, y.jsx)(x, { name: "risk" }), /* @__PURE__ */ (0, y.jsxs)("span", { children: ["Risque", /* @__PURE__ */ (0, y.jsx)("strong", { children: c[o.level] })] })]
				}),
				/* @__PURE__ */ (0, y.jsxs)("div", {
					className: "cp-cyan",
					children: [/* @__PURE__ */ (0, y.jsx)(x, { name: "document" }), /* @__PURE__ */ (0, y.jsxs)("span", { children: ["Preuves", /* @__PURE__ */ (0, y.jsxs)("strong", { children: [
						s.current,
						"/",
						s.required,
						" actuelles"
					] })] })]
				}),
				/* @__PURE__ */ (0, y.jsxs)("div", {
					className: "cp-green",
					children: [/* @__PURE__ */ (0, y.jsx)(x, { name: "shield" }), /* @__PURE__ */ (0, y.jsxs)("span", { children: ["Décision", /* @__PURE__ */ (0, y.jsx)("strong", {
						className: "cp-small",
						children: f[a.effective]
					})] })]
				})
			]
		}),
		/* @__PURE__ */ (0, y.jsxs)("div", {
			className: "cp-explanation",
			children: [
				/* @__PURE__ */ (0, y.jsx)(x, { name: "info" }),
				/* @__PURE__ */ (0, y.jsxs)("div", { children: [/* @__PURE__ */ (0, y.jsx)("h2", { children: "Pourquoi l’autonomie a changé" }), /* @__PURE__ */ (0, y.jsx)("p", { children: s.missing ? `${s.missing} preuve(s) requise(s) sont à compléter sur cette version.` : a.justification })] }),
				/* @__PURE__ */ (0, y.jsxs)("button", {
					onClick: () => t("graph", !0),
					children: ["Voir les preuves manquantes ", /* @__PURE__ */ (0, y.jsx)("span", {
						"aria-hidden": "true",
						children: "→"
					})]
				})
			]
		}),
		/* @__PURE__ */ (0, y.jsx)("div", {
			className: "cp-cards",
			children: d.map((e) => /* @__PURE__ */ (0, y.jsxs)("button", {
				className: `cp-card cp-${e.color}`,
				onClick: () => t(e.view),
				children: [
					/* @__PURE__ */ (0, y.jsx)(x, { name: e.icon }),
					/* @__PURE__ */ (0, y.jsx)("h2", { children: e.title }),
					/* @__PURE__ */ (0, y.jsx)("p", { children: e.description }),
					/* @__PURE__ */ (0, y.jsx)("strong", { children: e.value }),
					/* @__PURE__ */ (0, y.jsx)("small", { children: e.detail || "\xA0" }),
					/* @__PURE__ */ (0, y.jsxs)("span", {
						className: "cp-card-link",
						children: [
							e.link,
							" ",
							/* @__PURE__ */ (0, y.jsx)("span", {
								"aria-hidden": "true",
								children: "→"
							})
						]
					})
				]
			}, e.view))
		}),
		/* @__PURE__ */ (0, y.jsxs)("section", {
			className: "cp-path",
			children: [
				/* @__PURE__ */ (0, y.jsx)("h2", { children: "Chemin de décision" }),
				/* @__PURE__ */ (0, y.jsx)("p", { children: "De l’évaluation à l’action, avec un niveau d’autonomie adapté." }),
				/* @__PURE__ */ (0, y.jsx)("div", { children: [
					"Auto-Continue",
					"Verify",
					"Human Decision",
					"Bounded Stop"
				].map((e, t) => /* @__PURE__ */ (0, y.jsxs)("div", {
					className: `cp-step cp-${[
						"green",
						"violet",
						"amber",
						"red"
					][t]} ${a.effective === e ? "is-current" : ""}`,
					"aria-current": a.effective === e ? "step" : void 0,
					children: [/* @__PURE__ */ (0, y.jsx)(x, { name: [
						"play",
						"search",
						"person",
						"stop"
					][t] }), /* @__PURE__ */ (0, y.jsxs)("div", { children: [
						/* @__PURE__ */ (0, y.jsx)("strong", { children: e === "Human Decision" ? "Décision humaine" : e }),
						/* @__PURE__ */ (0, y.jsx)("span", { children: [
							"Risque faible",
							"Risque moyen",
							"Risque élevé",
							"Non-convergence"
						][t] }),
						/* @__PURE__ */ (0, y.jsx)("small", { children: [
							"Preuves suffisantes",
							"Vérifications renforcées",
							"Intervention requise",
							"ou risque critique"
						][t] })
					] })]
				}, e)) })
			]
		}),
		/* @__PURE__ */ (0, y.jsxs)("div", {
			className: "cp-main-actions",
			children: [/* @__PURE__ */ (0, y.jsxs)("button", {
				className: "cp-primary",
				disabled: r || !m,
				onClick: n,
				children: [/* @__PURE__ */ (0, y.jsx)(x, { name: "play" }), r ? "Vérifications en cours…" : "Lancer les vérifications"]
			}), /* @__PURE__ */ (0, y.jsxs)("button", {
				onClick: () => t("graph", !0),
				children: [/* @__PURE__ */ (0, y.jsx)(x, { name: "search" }), "Voir les preuves manquantes"]
			})]
		}),
		!m && /* @__PURE__ */ (0, y.jsx)("p", {
			className: "cp-note",
			children: "Aucun contrôle local disponible pour cette version. Consultez les procédures dans Vérifications."
		})
	] });
}
//#endregion
//#region studio-ui/src/features/control/graph-layout.ts
var C = [
	{
		title: "Intentions et critères",
		kinds: ["intention", "criterion"]
	},
	{
		title: "Décisions et compromis",
		kinds: ["decision"]
	},
	{
		title: "Code, missions et agents",
		kinds: [
			"code",
			"job",
			"agent"
		]
	},
	{
		title: "Analyses du projet",
		kinds: ["analysis"]
	},
	{
		title: "Vérifications et preuves visuelles",
		kinds: ["check", "visual"]
	},
	{
		title: "Services et actions MCP",
		kinds: ["runtime", "mcp"]
	},
	{
		title: "Évaluation des risques",
		kinds: ["risk"]
	},
	{
		title: "Interventions humaines",
		kinds: ["human"]
	},
	{
		title: "Décision d’autonomie",
		kinds: ["autonomy"]
	}
];
function w(e, t = 26) {
	return e.trim().split(/\s+/).flatMap((e) => {
		let n = Array.from(e), r = [];
		for (let e = 0; e < n.length; e += t) r.push(n.slice(e, e + t).join(""));
		return r;
	}).reduce((e, n) => {
		let r = e.length - 1;
		return r >= 0 && Array.from(`${e[r]} ${n}`).length <= t ? e[r] += ` ${n}` : e.push(n), e;
	}, []);
}
function T(e) {
	let t = /* @__PURE__ */ new Map(), n = 26;
	return {
		boxes: t,
		groups: C.flatMap((r, i) => {
			let a = r.kinds.flatMap((t) => e.filter((e) => e.kind === t));
			if (!a.length) return [];
			let o = n;
			n += 70;
			for (let e = 0; e < a.length; e += 3) {
				let r = a.slice(e, e + 3).map((e) => ({
					node: e,
					lines: w(e.label)
				})), i = Math.max(...r.map(({ lines: e }) => 120 + e.length * 20));
				r.forEach(({ node: e, lines: r }, a) => {
					t.set(e.id, {
						node: e,
						lines: r,
						number: t.size + 1,
						x: 28 + a * 248,
						y: n,
						width: 220,
						height: i,
						rowTop: n - 20,
						rowBottom: n + i + 20
					});
				}), n += i + 60;
			}
			let s = {
				id: String(i),
				title: r.title,
				count: a.length,
				y: o,
				height: n - o - 18
			};
			return n += 24, [s];
		}),
		width: 840,
		height: Math.max(200, n)
	};
}
function E(e, t, n) {
	let r = e.x + e.width / 2 + 34, i = t.x + t.width / 2 - 34, a = e.x + e.width + 12, o = t.x - 12, s = e.y + 42, c = t.y + 42, l = 774 + n % 8 * 6;
	if (e.y === t.y) return `M${r} ${s} H${a} V${e.rowTop - n % 3 * 5} H${o} V${c} H${i}`;
	let u = t.y > e.y;
	return `M${r} ${s} H${a} V${u ? e.rowBottom : e.rowTop} H${l} V${u ? t.rowTop : t.rowBottom} H${o} V${c} H${i}`;
}
var D = {
	"depends-on": ["Dépend de", "Est une dépendance de"],
	validates: ["Examine dans son périmètre", "Est examiné par"],
	contradicts: ["Contredit", "Est contredit par"],
	invalidates: ["Invalide", "Est invalidé par"]
};
function O(e, t, n) {
	let r = new Map(t.map((e) => [e.id, e]));
	return n.flatMap((t) => {
		if (t.from !== e && t.to !== e) return [];
		let n = t.from === e, i = r.get(n ? t.to : t.from);
		return i ? [{
			edge: t,
			node: i,
			label: D[t.relation][+!n]
		}] : [];
	});
}
//#endregion
//#region studio-ui/src/features/control/DetailedGraph.tsx
function k({ nodes: e, allNodes: t, edges: n, selected: r, select: a, zoom: o, ref: s }) {
	let c = (0, i.useMemo)(() => {
		let n = T(e), r = T(t).boxes;
		for (let e of n.boxes.values()) e.number = r.get(e.node.id).number;
		return n;
	}, [e, t]), l = (0, i.useRef)(null), f = (0, i.useRef)(/* @__PURE__ */ new Map()), [p, m] = (0, i.useState)(""), h = n.filter((e) => (e.from === r || e.to === r) && c.boxes.has(e.from) && c.boxes.has(e.to)), g = new Set(h.flatMap((e) => [e.from, e.to])), _ = p.trim() ? [...c.boxes.values()].filter(({ node: e }) => `${e.label} ${e.id}`.toLocaleLowerCase("fr").includes(p.trim().toLocaleLowerCase("fr"))) : [];
	function v(e) {
		let t = c.boxes.get(e);
		t && l.current && (l.current.scrollTo({
			top: Math.max(0, (t.y - 80) * o),
			left: Math.max(0, (t.x - 60) * o)
		}), f.current.get(e)?.focus({ preventScroll: !0 }));
	}
	return (0, i.useImperativeHandle)(s, () => ({ reveal: v })), /* @__PURE__ */ (0, y.jsxs)(y.Fragment, { children: [
		/* @__PURE__ */ (0, y.jsxs)("div", {
			className: "cp-detail-tools",
			children: [
				/* @__PURE__ */ (0, y.jsxs)("label", { children: ["Aller à une famille", /* @__PURE__ */ (0, y.jsxs)("select", {
					defaultValue: "",
					onChange: (e) => {
						let t = c.groups.find((t) => t.id === e.target.value);
						t && l.current?.scrollTo({
							top: t.y * o,
							left: 0
						});
					},
					children: [/* @__PURE__ */ (0, y.jsx)("option", {
						value: "",
						disabled: !0,
						children: "Choisir une étape"
					}), c.groups.map((e, t) => /* @__PURE__ */ (0, y.jsxs)("option", {
						value: e.id,
						children: [
							t + 1,
							". ",
							e.title,
							" · ",
							e.count
						]
					}, e.id))]
				})] }),
				/* @__PURE__ */ (0, y.jsxs)("label", { children: ["Rechercher un nœud", /* @__PURE__ */ (0, y.jsx)("input", {
					type: "search",
					value: p,
					onChange: (e) => m(e.target.value),
					placeholder: "Nom ou identifiant…"
				})] }),
				/* @__PURE__ */ (0, y.jsx)("button", {
					disabled: !r || !c.boxes.has(r),
					onClick: () => r && v(r),
					children: "Centrer la sélection"
				})
			]
		}),
		p.trim() && /* @__PURE__ */ (0, y.jsxs)("div", {
			className: "cp-graph-search",
			"aria-live": "polite",
			children: [/* @__PURE__ */ (0, y.jsxs)("span", { children: [
				_.length,
				" résultat",
				_.length > 1 ? "s" : ""
			] }), _.map(({ node: e, number: t }) => /* @__PURE__ */ (0, y.jsxs)("button", {
				onClick: () => {
					a(e.id), v(e.id);
				},
				children: [
					"#",
					t,
					" · ",
					e.label
				]
			}, e.id))]
		}),
		/* @__PURE__ */ (0, y.jsxs)("p", {
			className: "cp-reading-guide",
			children: [e.length, " nœuds répartis par familles. Lecture de haut en bas ; les familles n’ajoutent aucun lien. Sélectionnez un nœud pour suivre ses relations dans l’inspecteur."]
		}),
		/* @__PURE__ */ (0, y.jsxs)("div", {
			className: "cp-detail-status",
			role: "status",
			children: [
				h.length,
				" lien",
				h.length > 1 ? "s" : "",
				" affiché",
				h.length > 1 ? "s" : "",
				" pour la sélection · déplacement avec les barres de défilement ou les flèches"
			]
		}),
		/* @__PURE__ */ (0, y.jsx)("div", {
			ref: l,
			className: "cp-detail-viewport",
			tabIndex: 0,
			role: "region",
			"aria-label": "Schéma détaillé complet, défilement horizontal et vertical",
			children: /* @__PURE__ */ (0, y.jsxs)("svg", {
				className: "cp-detailed-canvas",
				width: c.width * o,
				height: c.height * o,
				viewBox: `0 0 ${c.width} ${c.height}`,
				role: "group",
				"aria-label": "Nœuds regroupés par étapes de lecture",
				children: [
					/* @__PURE__ */ (0, y.jsx)("defs", { children: /* @__PURE__ */ (0, y.jsx)("marker", {
						id: "cp-detail-arrow",
						markerWidth: "8",
						markerHeight: "8",
						refX: "7",
						refY: "4",
						orient: "auto",
						children: /* @__PURE__ */ (0, y.jsx)("path", {
							d: "M1 1 7 4 1 7",
							fill: "none",
							stroke: "context-stroke"
						})
					}) }),
					c.groups.map((e, t) => /* @__PURE__ */ (0, y.jsxs)("g", {
						className: "cp-graph-family",
						children: [
							/* @__PURE__ */ (0, y.jsx)("rect", {
								x: "10",
								y: e.y,
								width: "748",
								height: e.height,
								rx: "12"
							}),
							/* @__PURE__ */ (0, y.jsxs)("text", {
								x: "28",
								y: e.y + 28,
								children: [
									String(t + 1).padStart(2, "0"),
									" · ",
									e.title
								]
							}),
							/* @__PURE__ */ (0, y.jsxs)("text", {
								x: "735",
								y: e.y + 28,
								textAnchor: "end",
								className: "cp-family-count",
								children: [
									e.count,
									" nœud",
									e.count > 1 ? "s" : ""
								]
							})
						]
					}, e.id)),
					h.map((e, t) => /* @__PURE__ */ (0, y.jsx)("path", {
						className: `cp-edge cp-edge-${e.relation}`,
						d: E(c.boxes.get(e.from), c.boxes.get(e.to), t),
						markerEnd: "url(#cp-detail-arrow)",
						children: /* @__PURE__ */ (0, y.jsx)("title", { children: e.explanation })
					}, e.id)),
					[...c.boxes.values()].map((e) => {
						let t = e.node;
						return /* @__PURE__ */ (0, y.jsxs)("g", {
							ref: (e) => {
								e ? f.current.set(t.id, e) : f.current.delete(t.id);
							},
							transform: `translate(${e.x} ${e.y})`,
							role: "button",
							tabIndex: 0,
							className: `cp-detail-node cp-${t.freshness === "stale" ? "stale" : t.status} ${g.has(t.id) ? "cp-related-node" : ""}`,
							"aria-label": `#${e.number} · ${t.label} · ${u[t.status]} · ${d[t.freshness]}`,
							"aria-pressed": r === t.id,
							onClick: () => a(t.id),
							onKeyDown: (e) => {
								["Enter", " "].includes(e.key) && (e.preventDefault(), a(t.id));
							},
							children: [
								/* @__PURE__ */ (0, y.jsx)("rect", {
									className: "cp-node-hit",
									width: e.width,
									height: e.height,
									rx: "10"
								}),
								/* @__PURE__ */ (0, y.jsx)("circle", {
									cx: e.width / 2,
									cy: "42",
									r: "32"
								}),
								/* @__PURE__ */ (0, y.jsx)("foreignObject", {
									x: e.width / 2 - 16,
									y: "26",
									width: "32",
									height: "32",
									children: /* @__PURE__ */ (0, y.jsx)(x, { name: {
										code: "code",
										risk: "risk",
										autonomy: "search",
										visual: "visual",
										human: "person",
										agent: "person",
										job: "code",
										runtime: "settings",
										mcp: "settings"
									}[t.kind] ?? "document" })
								}),
								/* @__PURE__ */ (0, y.jsx)("text", {
									x: e.width / 2,
									y: "97",
									textAnchor: "middle",
									className: "cp-detail-label",
									children: e.lines.map((t, n) => /* @__PURE__ */ (0, y.jsx)("tspan", {
										x: e.width / 2,
										dy: n ? 20 : 0,
										children: t
									}, n))
								}),
								/* @__PURE__ */ (0, y.jsxs)("text", {
									x: e.width / 2,
									y: e.height - 17,
									textAnchor: "middle",
									className: "cp-detail-evidence",
									children: [
										"#",
										String(e.number).padStart(2, "0"),
										" ·",
										" ",
										t.freshness === "stale" ? "À renouveler" : u[t.status],
										t.required ? " · Requise" : ""
									]
								}),
								/* @__PURE__ */ (0, y.jsx)("title", { children: t.explanation })
							]
						}, t.id);
					})
				]
			})
		})
	] });
}
//#endregion
//#region studio-ui/src/features/control/EvidenceGraph.tsx
function A(e, t) {
	if (t) return e;
	let n = [
		"intention",
		"criterion",
		"decision",
		"code",
		"visual",
		"risk",
		"autonomy"
	].flatMap((t) => {
		let n = e.find((e) => e.kind === t);
		return n ? [n] : [];
	}), r = e.find((e) => e.kind === "check" && e.required);
	return r && n.splice(Math.max(1, n.length - 2), 0, r), n;
}
var j = (e) => ({
	code: "code",
	risk: "risk",
	autonomy: "search",
	visual: "visual",
	human: "person",
	agent: "person"
})[e.kind] ?? "document";
function M({ node: e, open: t, close: n, run: r, busy: i, nodes: a, edges: o, select: s, back: c }) {
	let l = O(e.id, a, o), f = T(a).boxes;
	return /* @__PURE__ */ (0, y.jsxs)("aside", {
		className: "cp-inspector",
		"aria-label": "Détail de la preuve",
		children: [
			/* @__PURE__ */ (0, y.jsxs)("header", { children: [
				/* @__PURE__ */ (0, y.jsx)(x, { name: j(e) }),
				/* @__PURE__ */ (0, y.jsx)("h2", { children: e.label }),
				/* @__PURE__ */ (0, y.jsx)("button", {
					"aria-label": "Fermer l’inspecteur",
					onClick: n,
					children: "×"
				})
			] }),
			c && /* @__PURE__ */ (0, y.jsx)("button", {
				onClick: c,
				children: "← Nœud précédent"
			}),
			/* @__PURE__ */ (0, y.jsxs)("dl", { children: [
				/* @__PURE__ */ (0, y.jsx)("dt", { children: "Statut" }),
				/* @__PURE__ */ (0, y.jsx)("dd", { children: /* @__PURE__ */ (0, y.jsx)("span", {
					className: `cp-badge cp-${e.status}`,
					children: u[e.status]
				}) }),
				/* @__PURE__ */ (0, y.jsx)("dt", { children: "Version observée" }),
				/* @__PURE__ */ (0, y.jsx)("dd", {
					title: e.revisionId ?? "",
					children: e.revisionId?.slice(0, 8) ?? "Sans version"
				}),
				/* @__PURE__ */ (0, y.jsx)("dt", { children: "Fraîcheur" }),
				/* @__PURE__ */ (0, y.jsx)("dd", { children: e.status === "missing" ? "Non établie" : d[e.freshness] }),
				/* @__PURE__ */ (0, y.jsx)("dt", { children: "Source" }),
				/* @__PURE__ */ (0, y.jsx)("dd", { children: e.source }),
				/* @__PURE__ */ (0, y.jsx)("dt", { children: "Résultat" }),
				/* @__PURE__ */ (0, y.jsx)("dd", { children: {
					passed: "Réussi dans ce périmètre",
					failed: "Échec observé",
					unknown: "Non établi",
					running: "En cours"
				}[e.outcome] })
			] }),
			/* @__PURE__ */ (0, y.jsx)("p", { children: e.explanation }),
			e.runId && /* @__PURE__ */ (0, y.jsxs)("p", { children: ["Exécution : ", /* @__PURE__ */ (0, y.jsx)("code", { children: e.runId })] }),
			/* @__PURE__ */ (0, y.jsxs)("section", {
				className: "cp-node-relations",
				"aria-label": "Relations du nœud",
				children: [
					/* @__PURE__ */ (0, y.jsxs)("h3", { children: ["Suivre les relations · ", l.length] }),
					!l.length && /* @__PURE__ */ (0, y.jsx)("p", { children: "Aucune relation enregistrée pour ce nœud." }),
					/* @__PURE__ */ (0, y.jsx)("ul", { children: l.map(({ edge: e, node: t, label: n }) => /* @__PURE__ */ (0, y.jsxs)("li", { children: [
						/* @__PURE__ */ (0, y.jsx)("span", { children: n }),
						/* @__PURE__ */ (0, y.jsxs)("button", {
							onClick: () => s(t.id),
							children: [
								"#",
								f.get(t.id)?.number,
								" · ",
								t.label,
								" →"
							]
						}),
						/* @__PURE__ */ (0, y.jsx)("small", { children: e.explanation })
					] }, e.id)) })
				]
			}),
			/* @__PURE__ */ (0, y.jsxs)("details", { children: [
				/* @__PURE__ */ (0, y.jsx)("summary", { children: "Portée, dépendances et limites" }),
				/* @__PURE__ */ (0, y.jsx)("ul", { children: e.limits.map((e) => /* @__PURE__ */ (0, y.jsx)("li", { children: e }, e)) }),
				/* @__PURE__ */ (0, y.jsx)("p", { children: e.dependencyScope === "complete" ? "Dépendances explicites" : "Preuve attachée à sa révision" }),
				/* @__PURE__ */ (0, y.jsx)("ul", { children: Object.keys(e.dependencies).map((e) => /* @__PURE__ */ (0, y.jsx)("li", { children: e }, e)) }),
				/* @__PURE__ */ (0, y.jsx)("time", {
					dateTime: e.at,
					children: new Date(e.at).toLocaleString("fr-FR")
				})
			] }),
			e.link && /* @__PURE__ */ (0, y.jsx)("button", {
				className: "cp-primary",
				onClick: () => t(e.link),
				children: e.link.panel === "product" ? "Ouvrir dans l’aperçu ↗" : "Ouvrir la source ↗"
			}),
			e.canRun && /* @__PURE__ */ (0, y.jsx)("button", {
				disabled: i,
				onClick: () => r([e.checkId]),
				children: "Relancer cette vérification"
			})
		]
	});
}
function N({ report: e, missing: t, onMissing: n, onRevision: r, open: a, run: o, busy: s }) {
	let [c, l] = (0, i.useState)("all"), [f, p] = (0, i.useState)(!1), [h, _] = (0, i.useState)(!1), [v, b] = (0, i.useState)(null), [S, C] = (0, i.useState)([]), w = (0, i.useRef)(null), T = (0, i.useRef)(null);
	(0, i.useEffect)(() => {
		T.current && w.current && (w.current.reveal(T.current), T.current = null);
	});
	let E = h || t || c !== "all", [D, O] = (0, i.useState)({
		x: 0,
		y: 0,
		zoom: 1
	}), N = (0, i.useRef)(null), P = (t ? m(e.snapshot.nodes) : e.snapshot.nodes).filter((e) => c === "all" || e.kind === c), F = A(P, h || t || c !== "all"), I = !h && !t && c === "all" ? F.find((e) => e.kind === "check") : void 0, L = F.filter((e) => e !== I), R = new Map(L.map((e, t) => [e.id, {
		x: 60 + t % 7 * 130,
		y: 235 + Math.floor(t / 7) * 170
	}]));
	I && R.set(I.id, {
		x: 535,
		y: 90
	});
	let z = v === "closed" ? void 0 : e.snapshot.nodes.find((e) => e.id === v) ?? F.find((e) => e.kind === "visual") ?? F[0], B = e.snapshot.edges.filter((e) => R.has(e.from) && R.has(e.to) && (f || e.relation !== "invalidates"));
	function V(e) {
		z && z.id !== e && C((e) => [...e, z.id]), b(e);
	}
	function H(e) {
		V(e), F.some((t) => t.id === e) || (l("all"), n(!1), _(!0), O({
			x: 0,
			y: 0,
			zoom: 1
		})), T.current = e;
	}
	function U() {
		let e = S.at(-1);
		e && (C((e) => e.slice(0, -1)), b(e), w.current?.reveal(e));
	}
	let W = [...new Set(e.snapshot.nodes.map((e) => e.kind))];
	return /* @__PURE__ */ (0, y.jsxs)(y.Fragment, { children: [
		/* @__PURE__ */ (0, y.jsxs)("header", {
			className: "cp-heading",
			children: [/* @__PURE__ */ (0, y.jsx)("h1", { children: "Graphe des preuves" }), /* @__PURE__ */ (0, y.jsx)("p", { children: "Traçabilité des décisions, du code aux preuves" })]
		}),
		/* @__PURE__ */ (0, y.jsxs)("div", {
			className: "cp-filters",
			children: [
				/* @__PURE__ */ (0, y.jsxs)("label", { children: [/* @__PURE__ */ (0, y.jsx)("span", {
					className: "sr-only",
					children: "Version des preuves"
				}), /* @__PURE__ */ (0, y.jsxs)("select", {
					value: e.snapshot.input.revisionId ?? "",
					onChange: (e) => r(e.target.value),
					children: [!e.revisions.length && /* @__PURE__ */ (0, y.jsx)("option", {
						value: "",
						children: "Aucune version"
					}), e.revisions.map((e) => /* @__PURE__ */ (0, y.jsx)("option", {
						value: e.id,
						children: e.title
					}, e.id))]
				})] }),
				/* @__PURE__ */ (0, y.jsxs)("label", { children: [/* @__PURE__ */ (0, y.jsx)("span", {
					className: "sr-only",
					children: "Type de preuve"
				}), /* @__PURE__ */ (0, y.jsxs)("select", {
					value: c,
					onChange: (e) => l(e.target.value),
					children: [/* @__PURE__ */ (0, y.jsx)("option", {
						value: "all",
						children: "Tous les types"
					}), W.map((e) => /* @__PURE__ */ (0, y.jsx)("option", {
						value: e,
						children: g[e]
					}, e))]
				})] }),
				/* @__PURE__ */ (0, y.jsxs)("label", { children: [/* @__PURE__ */ (0, y.jsx)("input", {
					type: "checkbox",
					checked: f,
					onChange: (e) => p(e.target.checked)
				}), "Afficher les invalidations"] }),
				/* @__PURE__ */ (0, y.jsxs)("label", { children: [/* @__PURE__ */ (0, y.jsx)("input", {
					type: "checkbox",
					checked: t,
					onChange: (e) => n(e.target.checked)
				}), "Preuves manquantes"] })
			]
		}),
		/* @__PURE__ */ (0, y.jsxs)("div", {
			className: `cp-graph-layout ${E ? "cp-graph-detailed" : ""}`,
			children: [/* @__PURE__ */ (0, y.jsxs)("div", {
				className: "cp-graph-area",
				children: [
					/* @__PURE__ */ (0, y.jsxs)("div", {
						className: "cp-canvas-tools",
						children: [
							/* @__PURE__ */ (0, y.jsx)("button", {
								"aria-label": "Réduire le graphe",
								onClick: () => O((e) => ({
									...e,
									zoom: Math.max(E ? .8 : .4, e.zoom - .2)
								})),
								children: "−"
							}),
							/* @__PURE__ */ (0, y.jsxs)("span", { children: [Math.round(D.zoom * 100), " %"] }),
							/* @__PURE__ */ (0, y.jsx)("button", {
								"aria-label": "Agrandir le graphe",
								onClick: () => O((e) => ({
									...e,
									zoom: Math.min(2.4, e.zoom + .2)
								})),
								children: "+"
							}),
							/* @__PURE__ */ (0, y.jsx)("button", {
								onClick: () => {
									O({
										x: 0,
										y: 0,
										zoom: 1
									}), E && z && w.current?.reveal(z.id);
								},
								children: "Recentrer"
							}),
							/* @__PURE__ */ (0, y.jsx)("button", {
								"aria-pressed": h,
								onClick: () => {
									_(!h), O({
										x: 0,
										y: 0,
										zoom: 1
									});
								},
								children: h ? "Vue synthétique" : "Tous les nœuds"
							})
						]
					}),
					F.length && E ? /* @__PURE__ */ (0, y.jsx)(k, {
						ref: w,
						nodes: F,
						allNodes: e.snapshot.nodes,
						edges: e.snapshot.edges.filter((e) => f || e.relation !== "invalidates"),
						selected: z?.id,
						select: V,
						zoom: Math.max(.8, D.zoom)
					}) : F.length ? /* @__PURE__ */ (0, y.jsxs)("svg", {
						className: "cp-canvas",
						viewBox: `0 0 910 ${Math.max(410, Math.ceil(F.length / 7) * 160 + 160)}`,
						tabIndex: 0,
						role: "group",
						"aria-label": "Graphe des preuves. Flèches pour déplacer, plus et moins pour zoomer. Une liste complète suit le graphe.",
						onPointerDown: (e) => {
							e.button === 0 && (N.current = {
								x: e.clientX,
								y: e.clientY,
								startX: D.x,
								startY: D.y
							}, e.currentTarget.setPointerCapture(e.pointerId));
						},
						onPointerMove: (e) => {
							N.current && O((t) => ({
								...t,
								x: N.current.startX + e.clientX - N.current.x,
								y: N.current.startY + e.clientY - N.current.y
							}));
						},
						onPointerUp: () => {
							N.current = null;
						},
						onPointerCancel: () => {
							N.current = null;
						},
						onKeyDown: (e) => {
							let t = {
								ArrowLeft: [-30, 0],
								ArrowRight: [30, 0],
								ArrowUp: [0, -30],
								ArrowDown: [0, 30]
							}[e.key];
							t && (e.preventDefault(), O((e) => ({
								...e,
								x: e.x + t[0],
								y: e.y + t[1]
							}))), ["+", "-"].includes(e.key) && (e.preventDefault(), O((t) => ({
								...t,
								zoom: Math.max(.4, Math.min(2.4, t.zoom + (e.key === "+" ? .2 : -.2)))
							})));
						},
						children: [/* @__PURE__ */ (0, y.jsx)("defs", { children: /* @__PURE__ */ (0, y.jsx)("marker", {
							id: "cp-arrow",
							markerWidth: "8",
							markerHeight: "8",
							refX: "7",
							refY: "4",
							orient: "auto",
							children: /* @__PURE__ */ (0, y.jsx)("path", {
								d: "M1 1 7 4 1 7",
								fill: "none",
								stroke: "currentColor"
							})
						}) }), /* @__PURE__ */ (0, y.jsxs)("g", {
							transform: `translate(${D.x} ${D.y}) scale(${D.zoom})`,
							children: [B.map((e) => {
								let t = R.get(e.from), n = R.get(e.to);
								return /* @__PURE__ */ (0, y.jsx)("path", {
									className: `cp-edge cp-edge-${e.relation}`,
									d: `M${t.x} ${t.y - 40} Q${(t.x + n.x) / 2} ${Math.min(t.y, n.y) - 110} ${n.x} ${n.y - 40}`,
									markerEnd: "url(#cp-arrow)",
									children: /* @__PURE__ */ (0, y.jsx)("title", { children: e.explanation })
								}, e.id);
							}), F.map((e) => {
								let t = R.get(e.id), n = e.kind === "criterion" ? `Critère ${e.id.replace("criterion:", "")}` : e.label;
								return /* @__PURE__ */ (0, y.jsxs)("g", {
									className: `cp-node cp-${e.status} ${e.freshness === "stale" ? "cp-stale" : ""}`,
									transform: `translate(${t.x} ${t.y})`,
									role: "button",
									tabIndex: 0,
									"aria-label": `${e.label} · ${u[e.status]} · ${d[e.freshness]}`,
									"aria-pressed": z?.id === e.id,
									onPointerDown: (e) => e.stopPropagation(),
									onClick: () => V(e.id),
									onKeyDown: (t) => {
										["Enter", " "].includes(t.key) && (t.preventDefault(), t.stopPropagation(), V(e.id));
									},
									children: [
										/* @__PURE__ */ (0, y.jsx)("circle", { r: "37" }),
										/* @__PURE__ */ (0, y.jsx)("foreignObject", {
											x: "-17",
											y: "-18",
											width: "34",
											height: "36",
											children: /* @__PURE__ */ (0, y.jsx)(x, { name: j(e) })
										}),
										/* @__PURE__ */ (0, y.jsx)("text", {
											textAnchor: "middle",
											y: "62",
											children: n.length > 14 ? /* @__PURE__ */ (0, y.jsxs)(y.Fragment, { children: [/* @__PURE__ */ (0, y.jsx)("tspan", {
												x: "0",
												children: n.slice(0, n.lastIndexOf(" ", 14) > 0 ? n.lastIndexOf(" ", 14) : 14)
											}), /* @__PURE__ */ (0, y.jsx)("tspan", {
												x: "0",
												dy: "19",
												children: n.slice(n.lastIndexOf(" ", 14) > 0 ? n.lastIndexOf(" ", 14) + 1 : 14, 29)
											})] }) : n
										}),
										/* @__PURE__ */ (0, y.jsx)("text", {
											className: "cp-node-detail",
											textAnchor: "middle",
											y: "104",
											children: e.freshness === "stale" ? "À renouveler" : u[e.status]
										})
									]
								}, e.id);
							})]
						})]
					}) : /* @__PURE__ */ (0, y.jsx)("div", {
						className: "cp-empty",
						children: "Aucune preuve ne correspond à ces filtres."
					}),
					/* @__PURE__ */ (0, y.jsx)("div", {
						className: "cp-legend",
						children: Object.entries(u).map(([e, t]) => /* @__PURE__ */ (0, y.jsxs)("span", {
							className: `cp-${e}`,
							children: [/* @__PURE__ */ (0, y.jsx)("i", {}), t]
						}, e))
					}),
					/* @__PURE__ */ (0, y.jsxs)("details", {
						className: "cp-evidence-list",
						children: [/* @__PURE__ */ (0, y.jsxs)("summary", { children: [
							"Liste accessible · ",
							P.length,
							" éléments (",
							F.length,
							" affichés dans le graphe)"
						] }), /* @__PURE__ */ (0, y.jsx)("ul", { children: P.map((e) => /* @__PURE__ */ (0, y.jsx)("li", { children: /* @__PURE__ */ (0, y.jsxs)("button", {
							onClick: () => V(e.id),
							children: [
								e.label,
								" · ",
								u[e.status],
								" · ",
								d[e.freshness]
							]
						}) }, e.id)) })]
					})
				]
			}), z && /* @__PURE__ */ (0, y.jsx)(M, {
				node: z,
				open: a,
				close: () => b("closed"),
				run: o,
				busy: s,
				nodes: e.snapshot.nodes,
				edges: e.snapshot.edges,
				select: H,
				back: S.length ? U : void 0
			}, z.id)]
		})
	] });
}
//#endregion
//#region studio-ui/src/features/control/Attention.tsx
function P({ item: e, busy: t, close: n, decide: r }) {
	let [a, o] = (0, i.useState)("");
	return /* @__PURE__ */ (0, y.jsxs)("section", {
		className: "cp-decision-review",
		"aria-labelledby": "cp-review-title",
		children: [
			/* @__PURE__ */ (0, y.jsx)("h2", {
				id: "cp-review-title",
				children: "Examiner la décision"
			}),
			/* @__PURE__ */ (0, y.jsx)("p", { children: e.cause }),
			/* @__PURE__ */ (0, y.jsxs)("p", { children: [
				"Cette décision concerne la version ",
				e.revisionId?.slice(0, 8) ?? "en préparation",
				" et l’action ",
				e.actionId,
				". Elle ne remplace aucun contrôle."
			] }),
			/* @__PURE__ */ (0, y.jsxs)("form", {
				onSubmit: (t) => {
					t.preventDefault(), r(e, "accept", a);
				},
				children: [
					/* @__PURE__ */ (0, y.jsx)("label", {
						htmlFor: "cp-reason",
						children: "Justification de votre décision"
					}),
					/* @__PURE__ */ (0, y.jsx)("textarea", {
						id: "cp-reason",
						name: "reason",
						required: !0,
						maxLength: 2e3,
						value: a,
						onChange: (e) => o(e.target.value),
						placeholder: "Précisez le périmètre examiné et les conditions de reprise…"
					}),
					/* @__PURE__ */ (0, y.jsxs)("div", { children: [
						/* @__PURE__ */ (0, y.jsx)("button", {
							className: "cp-primary",
							disabled: t || !a.trim(),
							type: "submit",
							children: "Accepter ce périmètre"
						}),
						/* @__PURE__ */ (0, y.jsx)("button", {
							disabled: t || !a.trim(),
							type: "button",
							onClick: () => r(e, "reject", a),
							children: "Refuser et maintenir l’arrêt"
						}),
						/* @__PURE__ */ (0, y.jsx)("button", {
							type: "button",
							onClick: n,
							children: "Fermer"
						})
					] })
				]
			})
		]
	});
}
function F({ report: e, busy: t, mutate: n, run: r, open: a }) {
	let o = p(e), [s, l] = (0, i.useState)(null), u = o.find((e) => e.id === s), d = (0, i.useRef)(null), f = (0, i.useRef)(null), m = (0, i.useRef)(null);
	(0, i.useEffect)(() => {
		s && !u && m.current?.focus();
	}, [s, u]);
	let h = o.filter((e) => e.expectedAction !== "renew").length, g = new Set(o.filter((e) => e.expectedAction === "renew").flatMap((e) => e.evidenceIds)).size, _ = e.snapshot.nodes.filter((e) => e.kind === "check" && e.status === "observed" && e.outcome === "passed" && e.freshness === "current"), v = {
		version: e.version,
		snapshotKey: e.snapshot.key
	}, b = async (e, t, r) => {
		await n("decide", {
			...v,
			itemId: e.id,
			resolution: t,
			reason: r
		});
	};
	return /* @__PURE__ */ (0, y.jsxs)(y.Fragment, { children: [/* @__PURE__ */ (0, y.jsxs)("header", {
		className: "cp-heading cp-heading-actions",
		children: [/* @__PURE__ */ (0, y.jsxs)("div", { children: [/* @__PURE__ */ (0, y.jsx)("h1", { children: "Votre attention" }), /* @__PURE__ */ (0, y.jsx)("p", { children: "Les éléments qui nécessitent une intervention humaine." })] }), /* @__PURE__ */ (0, y.jsxs)("button", {
			disabled: t || !o.some((e) => e.status === "open"),
			onClick: () => void n("read", v),
			children: [/* @__PURE__ */ (0, y.jsx)(x, { name: "check" }), "Tout marquer comme lu"]
		})]
	}), /* @__PURE__ */ (0, y.jsxs)("div", {
		className: "cp-attention-layout",
		children: [/* @__PURE__ */ (0, y.jsxs)("div", {
			className: "cp-attention-items",
			children: [
				!o.length && /* @__PURE__ */ (0, y.jsxs)("div", {
					className: "cp-empty",
					children: [
						/* @__PURE__ */ (0, y.jsx)(x, { name: "check" }),
						/* @__PURE__ */ (0, y.jsx)("h2", { children: "Aucune intervention en attente" }),
						/* @__PURE__ */ (0, y.jsx)("p", { children: "Les vérifications et leurs limites restent consultables dans le graphe." })
					]
				}),
				o.map((n) => {
					let i = e.snapshot.nodes.filter((e) => n.evidenceIds.includes(e.id)), o = i.filter((e) => e.canRun).map((e) => e.checkId), s = i.find((e) => e.kind === "mcp");
					return /* @__PURE__ */ (0, y.jsxs)("article", {
						className: `cp-attention-card cp-${n.expectedAction === "renew" ? "cyan" : "red"}`,
						children: [
							/* @__PURE__ */ (0, y.jsx)(x, { name: n.expectedAction === "renew" ? "info" : "risk" }),
							/* @__PURE__ */ (0, y.jsxs)("div", { children: [
								/* @__PURE__ */ (0, y.jsxs)("h2", { children: [
									n.expectedAction === "renew" ? "Preuve à renouveler" : "Validation requise",
									" ",
									"· ",
									n.cause
								] }),
								/* @__PURE__ */ (0, y.jsx)("p", { children: n.expectedAction === "decide" ? "Examinez la cause, les preuves et les conséquences avant de poursuivre." : "Consultez le périmètre manquant et relancez les contrôles disponibles." }),
								/* @__PURE__ */ (0, y.jsxs)("small", { children: [
									"Version : ",
									n.revisionId?.slice(0, 8) ?? "Aucune",
									" ·",
									" ",
									n.status === "read" ? "Lu, action encore requise" : "À examiner",
									" ·",
									" ",
									i.length,
									" preuve(s) associée(s)"
								] })
							] }),
							/* @__PURE__ */ (0, y.jsxs)("div", {
								className: "cp-attention-actions",
								children: [/* @__PURE__ */ (0, y.jsxs)("span", {
									className: `cp-badge cp-${n.severity}`,
									children: ["Risque ", c[n.severity].toLowerCase()]
								}), n.expectedAction === "decide" ? /* @__PURE__ */ (0, y.jsx)("button", {
									className: "cp-primary",
									disabled: t,
									onClick: (e) => {
										f.current = e.currentTarget, l(n.id), requestAnimationFrame(() => {
											d.current?.scrollIntoView({ block: "nearest" }), d.current?.focus();
										});
									},
									children: "Examiner"
								}) : /* @__PURE__ */ (0, y.jsx)("button", {
									className: "cp-primary",
									disabled: t,
									onClick: () => {
										s?.link ? a(s.link) : o.length ? r(o) : a({
											panel: "checks",
											revisionId: n.revisionId ?? void 0
										});
									},
									children: o.length ? "Relancer" : s ? "Examiner l’autorisation" : "Voir la procédure"
								})]
							})
						]
					}, n.id);
				}),
				_.length > 0 && /* @__PURE__ */ (0, y.jsxs)("article", {
					className: "cp-attention-card cp-green",
					children: [
						/* @__PURE__ */ (0, y.jsx)(x, { name: "check" }),
						/* @__PURE__ */ (0, y.jsxs)("div", { children: [
							/* @__PURE__ */ (0, y.jsxs)("h2", { children: [
								"Information · ",
								_.length,
								" contrôles réussis"
							] }),
							/* @__PURE__ */ (0, y.jsx)("p", { children: "Les vérifications ont produit un résultat positif dans leur périmètre." }),
							/* @__PURE__ */ (0, y.jsx)("small", { children: "Les audits non exécutés restent distincts." })
						] }),
						/* @__PURE__ */ (0, y.jsx)("button", {
							onClick: () => a({
								panel: "checks",
								revisionId: e.snapshot.input.revisionId ?? void 0
							}),
							children: "Voir les détails"
						})
					]
				}),
				/* @__PURE__ */ (0, y.jsx)("div", {
					ref: d,
					tabIndex: -1,
					children: u && /* @__PURE__ */ (0, y.jsx)(P, {
						item: u,
						busy: t,
						close: () => {
							l(null), f.current?.focus();
						},
						decide: (...e) => void b(...e)
					}, u.id)
				})
			]
		}), /* @__PURE__ */ (0, y.jsxs)("aside", { children: [/* @__PURE__ */ (0, y.jsxs)("section", {
			className: "cp-summary",
			children: [
				/* @__PURE__ */ (0, y.jsx)("h2", {
					ref: m,
					tabIndex: -1,
					children: "Synthèse"
				}),
				/* @__PURE__ */ (0, y.jsxs)("div", {
					className: "cp-red",
					children: [/* @__PURE__ */ (0, y.jsx)(x, { name: "risk" }), /* @__PURE__ */ (0, y.jsxs)("p", { children: [/* @__PURE__ */ (0, y.jsx)("strong", { children: h }), "décision(s) requise(s)"] })]
				}),
				/* @__PURE__ */ (0, y.jsxs)("div", {
					className: "cp-cyan",
					children: [/* @__PURE__ */ (0, y.jsx)(x, { name: "info" }), /* @__PURE__ */ (0, y.jsxs)("p", { children: [/* @__PURE__ */ (0, y.jsx)("strong", { children: g }), "vérification(s) à reprendre"] })]
				}),
				/* @__PURE__ */ (0, y.jsxs)("div", {
					className: "cp-green",
					children: [/* @__PURE__ */ (0, y.jsx)(x, { name: "check" }), /* @__PURE__ */ (0, y.jsxs)("p", { children: [/* @__PURE__ */ (0, y.jsx)("strong", { children: _.length }), "contrôles sans action"] })]
				})
			]
		}), /* @__PURE__ */ (0, y.jsxs)("section", {
			className: "cp-attention-note",
			children: [/* @__PURE__ */ (0, y.jsx)(x, { name: "info" }), /* @__PURE__ */ (0, y.jsx)("p", { children: "Votre attention permet de maintenir un niveau d’autonomie sûr et explicable." })]
		})] })]
	})] });
}
//#endregion
//#region studio-ui/src/features/control/Details.tsx
function I({ report: e }) {
	let { risk: t, nodes: n } = e.snapshot;
	return /* @__PURE__ */ (0, y.jsxs)(y.Fragment, { children: [
		/* @__PURE__ */ (0, y.jsxs)("header", {
			className: "cp-heading",
			children: [/* @__PURE__ */ (0, y.jsx)("h1", { children: "Analyse des risques" }), /* @__PURE__ */ (0, y.jsx)("p", { children: "Les signaux qui contribuent à la décision, avec leurs preuves et leurs limites." })]
		}),
		/* @__PURE__ */ (0, y.jsxs)("div", {
			className: "cp-explanation",
			children: [/* @__PURE__ */ (0, y.jsx)(x, { name: "risk" }), /* @__PURE__ */ (0, y.jsxs)("div", { children: [/* @__PURE__ */ (0, y.jsxs)("h2", { children: ["Risque ", c[t.level].toLowerCase()] }), /* @__PURE__ */ (0, y.jsx)("p", { children: t.justification })] })]
		}),
		/* @__PURE__ */ (0, y.jsx)("div", {
			className: "cp-risk-list",
			children: t.signals.map((e) => /* @__PURE__ */ (0, y.jsxs)("article", {
				className: "cp-detail-card",
				children: [
					/* @__PURE__ */ (0, y.jsx)("span", {
						className: `cp-badge cp-${e.level}`,
						children: c[e.level]
					}),
					/* @__PURE__ */ (0, y.jsx)("h2", { children: e.reason }),
					/* @__PURE__ */ (0, y.jsxs)("p", { children: [
						"Facteur : ",
						e.category,
						" ·",
						" ",
						e.humanResolvable ? "Examen humain possible" : "Observation ou vérification requise"
					] }),
					/* @__PURE__ */ (0, y.jsx)("ul", { children: e.evidenceIds.map((e) => /* @__PURE__ */ (0, y.jsx)("li", { children: n.find((t) => t.id === e)?.label ?? e }, e)) })
				]
			}, e.id))
		}),
		/* @__PURE__ */ (0, y.jsxs)("section", {
			className: "cp-detail-card",
			children: [
				/* @__PURE__ */ (0, y.jsx)("h2", { children: "Projet et couverture du Studio" }),
				/* @__PURE__ */ (0, y.jsx)("p", { children: "Projet : seuls les résultats des contrôles exécutés sont connus." }),
				/* @__PURE__ */ (0, y.jsxs)("p", { children: [
					"Couverture Studio : ",
					n.filter((e) => e.canRun).length,
					" contrôles locaux disponibles. Les procédures externes non exécutées restent sans verdict."
				] }),
				/* @__PURE__ */ (0, y.jsx)("ul", { children: t.limits.map((e) => /* @__PURE__ */ (0, y.jsx)("li", { children: e }, e)) })
			]
		})
	] });
}
function L({ report: e, probe: t, busy: n, proceed: r }) {
	let { decision: i } = e.snapshot;
	return /* @__PURE__ */ (0, y.jsxs)(y.Fragment, { children: [
		/* @__PURE__ */ (0, y.jsxs)("header", {
			className: "cp-heading",
			children: [/* @__PURE__ */ (0, y.jsx)("h1", { children: "Autonomie adaptative" }), /* @__PURE__ */ (0, y.jsx)("p", { children: "Une politique explicable, versionnée et inspectable." })]
		}),
		/* @__PURE__ */ (0, y.jsxs)("div", {
			className: "cp-metrics",
			children: [
				/* @__PURE__ */ (0, y.jsxs)("div", { children: [/* @__PURE__ */ (0, y.jsx)(x, { name: "person" }), /* @__PURE__ */ (0, y.jsxs)("span", { children: ["Demandée", /* @__PURE__ */ (0, y.jsx)("strong", { children: l[i.requested] })] })] }),
				/* @__PURE__ */ (0, y.jsxs)("div", { children: [/* @__PURE__ */ (0, y.jsx)(x, { name: "shield" }), /* @__PURE__ */ (0, y.jsxs)("span", { children: ["Effective", /* @__PURE__ */ (0, y.jsx)("strong", { children: i.effective })] })] }),
				/* @__PURE__ */ (0, y.jsx)("div", { children: /* @__PURE__ */ (0, y.jsxs)("span", { children: ["Politique", /* @__PURE__ */ (0, y.jsx)("strong", { children: e.policy.id })] }) })
			]
		}),
		/* @__PURE__ */ (0, y.jsxs)("section", {
			className: "cp-detail-card",
			children: [
				/* @__PURE__ */ (0, y.jsx)("h2", { children: "Ce que l’agent peut faire maintenant" }),
				/* @__PURE__ */ (0, y.jsx)("ul", { children: i.allowedActions.map((e) => /* @__PURE__ */ (0, y.jsx)("li", { children: e }, e)) }),
				/* @__PURE__ */ (0, y.jsx)("p", { children: "Les permissions MCP et les validations réservées continuent de s’appliquer à chaque action." }),
				/* @__PURE__ */ (0, y.jsx)("button", {
					className: "cp-primary",
					disabled: n || !e.continuation?.available,
					onClick: r,
					children: "Appliquer la version vérifiée"
				}),
				/* @__PURE__ */ (0, y.jsx)("p", { children: e.continuation?.reason ?? "État de continuation indisponible." })
			]
		}),
		/* @__PURE__ */ (0, y.jsxs)("section", {
			className: "cp-detail-card",
			children: [
				/* @__PURE__ */ (0, y.jsx)("h2", { children: "Conditions pour poursuivre" }),
				/* @__PURE__ */ (0, y.jsx)("ul", { children: i.conditions.map((e, t) => /* @__PURE__ */ (0, y.jsx)("li", { children: e }, t)) }),
				!i.conditions.length && /* @__PURE__ */ (0, y.jsx)("p", { children: "Aucune condition supplémentaire détectée dans le périmètre observé." })
			]
		}),
		/* @__PURE__ */ (0, y.jsxs)("section", {
			className: "cp-detail-card",
			children: [
				/* @__PURE__ */ (0, y.jsx)("h2", { children: e.policy.title }),
				/* @__PURE__ */ (0, y.jsx)("ol", { children: e.policy.rules.map((e) => /* @__PURE__ */ (0, y.jsx)("li", { children: e }, e)) }),
				/* @__PURE__ */ (0, y.jsx)("p", { children: "Calibration automatique : désactivée. Aucune décision humaine ne modifie silencieusement cette politique." }),
				/* @__PURE__ */ (0, y.jsx)("button", {
					disabled: n,
					onClick: t,
					children: "Observer les services locaux"
				}),
				/* @__PURE__ */ (0, y.jsx)("p", {
					className: "cp-note",
					children: "Sonde réelle du stockage embarqué ; ne démontre ni les règles métier ni un audit de sécurité dynamique."
				})
			]
		})
	] });
}
function R({ report: e }) {
	return /* @__PURE__ */ (0, y.jsxs)(y.Fragment, { children: [
		/* @__PURE__ */ (0, y.jsxs)("header", {
			className: "cp-heading",
			children: [/* @__PURE__ */ (0, y.jsx)("h1", { children: "Historique du Control Plane" }), /* @__PURE__ */ (0, y.jsx)("p", { children: "Décisions conservées avec leur contexte et leur politique." })]
		}),
		/* @__PURE__ */ (0, y.jsx)("div", {
			className: "cp-history",
			children: [...e.history].reverse().map((t, n) => /* @__PURE__ */ (0, y.jsxs)("details", {
				className: "cp-detail-card",
				children: [
					/* @__PURE__ */ (0, y.jsxs)("summary", { children: [
						/* @__PURE__ */ (0, y.jsx)("span", {
							className: `cp-badge cp-${t.risk.level}`,
							children: t.decision.effective
						}),
						" ",
						t.input.action.label,
						" ·",
						" ",
						/* @__PURE__ */ (0, y.jsx)("time", {
							dateTime: t.input.at,
							children: new Date(t.input.at).toLocaleString("fr-FR")
						})
					] }),
					/* @__PURE__ */ (0, y.jsxs)("dl", { children: [
						/* @__PURE__ */ (0, y.jsx)("dt", { children: "Version" }),
						/* @__PURE__ */ (0, y.jsx)("dd", { children: t.input.revisionId ?? "Aucune" }),
						/* @__PURE__ */ (0, y.jsx)("dt", { children: "Demandée / effective" }),
						/* @__PURE__ */ (0, y.jsxs)("dd", { children: [
							l[t.decision.requested],
							" / ",
							t.decision.effective
						] }),
						/* @__PURE__ */ (0, y.jsx)("dt", { children: "Risque" }),
						/* @__PURE__ */ (0, y.jsx)("dd", { children: c[t.risk.level] }),
						/* @__PURE__ */ (0, y.jsx)("dt", { children: "Politique" }),
						/* @__PURE__ */ (0, y.jsx)("dd", { children: t.decision.policyId }),
						/* @__PURE__ */ (0, y.jsx)("dt", { children: "Preuves actuelles" }),
						/* @__PURE__ */ (0, y.jsxs)("dd", { children: [
							t.evidence.current,
							" / ",
							t.evidence.required
						] }),
						/* @__PURE__ */ (0, y.jsx)("dt", { children: "Interventions humaines" }),
						/* @__PURE__ */ (0, y.jsx)("dd", { children: t.interventionIds.length })
					] }),
					/* @__PURE__ */ (0, y.jsx)("p", { children: t.decision.justification }),
					/* @__PURE__ */ (0, y.jsx)("ul", { children: t.risk.evidenceIds.map((e) => /* @__PURE__ */ (0, y.jsx)("li", { children: t.nodes.find((t) => t.id === e)?.label ?? e }, e)) }),
					t.interventionIds.map((t) => /* @__PURE__ */ (0, y.jsx)("p", { children: e.interventions.find((e) => e.id === t)?.reason }, t))
				]
			}, `${t.key}:${n}`))
		}),
		/* @__PURE__ */ (0, y.jsxs)("details", {
			className: "cp-detail-card",
			children: [/* @__PURE__ */ (0, y.jsxs)("summary", { children: ["Transitions et marquages lus · ", e.transitions.length] }), /* @__PURE__ */ (0, y.jsx)("ol", { children: e.transitions.map((e) => /* @__PURE__ */ (0, y.jsxs)("li", { children: [
				/* @__PURE__ */ (0, y.jsx)("time", {
					dateTime: e.at,
					children: new Date(e.at).toLocaleString("fr-FR")
				}),
				" ·",
				" ",
				e.explanation
			] }, e.id)) })]
		})
	] });
}
//#endregion
//#region studio-ui/src/features/control/ControlPlane.tsx
function z({ options: e }) {
	let t = (0, i.useRef)(null), [n, r] = (0, i.useState)(h), [o, c] = (0, i.useState)(!1), [u, d] = (0, i.useState)(null), f = v({
		...e,
		revisionId: u ?? e.revisionId
	}), { report: p, error: m, loading: g, busy: _ } = f, b = (e, n = !1) => {
		r(e), c(n), t.current?.closest("#workspace")?.scrollTo({ top: 0 }), window.innerWidth <= 700 && window.scrollTo({ top: 0 });
		let i = new URL(window.location.href);
		i.searchParams.set("control", e), i.hash = "control", window.history.pushState(null, "", i);
	};
	return (0, i.useEffect)(() => {
		let e = () => r(h());
		return window.addEventListener("popstate", e), () => window.removeEventListener("popstate", e);
	}, []), /* @__PURE__ */ (0, y.jsxs)("div", {
		className: "cp-root",
		ref: t,
		children: [
			/* @__PURE__ */ (0, y.jsx)("nav", {
				className: "cp-mobile-nav",
				"aria-label": "Vues du Control Plane sur petit écran",
				children: s.map((e) => /* @__PURE__ */ (0, y.jsx)("button", {
					"aria-current": n === e.id ? "page" : void 0,
					onClick: () => b(e.id),
					children: e.label
				}, e.id))
			}),
			(0, a.createPortal)(/* @__PURE__ */ (0, y.jsxs)("nav", {
				className: "cp-sidebar",
				"aria-label": "Vues du Control Plane",
				children: [/* @__PURE__ */ (0, y.jsxs)("div", {
					className: "cp-sidebar-brand",
					children: [/* @__PURE__ */ (0, y.jsx)(x, { name: "graph" }), /* @__PURE__ */ (0, y.jsxs)("div", { children: [/* @__PURE__ */ (0, y.jsx)("h2", { children: "Control Plane" }), /* @__PURE__ */ (0, y.jsx)("p", { children: "Unifie méthode, preuves, risque et autonomie." })] })]
				}), s.map((e) => /* @__PURE__ */ (0, y.jsxs)("button", {
					"aria-current": n === e.id ? "page" : void 0,
					onClick: () => b(e.id),
					children: [/* @__PURE__ */ (0, y.jsx)(x, { name: e.icon }), /* @__PURE__ */ (0, y.jsxs)("span", { children: [e.label, e.id === "overview" && n === "overview" && /* @__PURE__ */ (0, y.jsx)("small", { children: "Surveillez l’état global et prenez la bonne décision." })] })]
				}, e.id))]
			}), e.sidebar),
			(0, a.createPortal)(/* @__PURE__ */ (0, y.jsx)("div", {
				className: "cp-mode-tabs",
				role: "group",
				"aria-label": "Autonomie demandée",
				children: Object.keys(l).map((t) => /* @__PURE__ */ (0, y.jsx)("button", {
					"aria-pressed": e.mode === t,
					disabled: !!_,
					onClick: () => e.onMode(t),
					children: l[t]
				}, t))
			}), e.modes),
			n !== "overview" && /* @__PURE__ */ (0, y.jsxs)("div", {
				className: "cp-section-brand",
				children: [/* @__PURE__ */ (0, y.jsx)(x, { name: "graph" }), /* @__PURE__ */ (0, y.jsxs)("div", { children: [/* @__PURE__ */ (0, y.jsx)("h2", { children: "Control Plane" }), /* @__PURE__ */ (0, y.jsx)("p", { children: "Méthode, preuves, risque et autonomie." })] })]
			}),
			g && /* @__PURE__ */ (0, y.jsx)("p", {
				className: "cp-loading",
				role: "status",
				children: "Chargement des preuves et de la politique…"
			}),
			m && /* @__PURE__ */ (0, y.jsxs)("div", {
				role: "alert",
				className: "cp-error",
				children: [
					/* @__PURE__ */ (0, y.jsx)("h2", { children: "Le Control Plane n’a pas pu actualiser ses preuves" }),
					/* @__PURE__ */ (0, y.jsx)("p", { children: m }),
					p && /* @__PURE__ */ (0, y.jsx)("p", { children: "Les données ci-dessous sont la dernière observation reçue ; leur actualité n’est pas confirmée." }),
					/* @__PURE__ */ (0, y.jsx)("button", {
						onClick: f.refresh,
						children: "Réessayer"
					})
				]
			}),
			f.progress && /* @__PURE__ */ (0, y.jsx)("p", {
				className: "cp-job-status",
				role: "status",
				children: f.progress
			}),
			p && /* @__PURE__ */ (0, y.jsxs)("div", {
				"aria-busy": !!_,
				className: m ? "cp-report-outdated" : "",
				children: [
					n === "overview" && /* @__PURE__ */ (0, y.jsx)(S, {
						report: p,
						navigate: b,
						run: () => void f.runChecks(),
						busy: !!(_ || m)
					}),
					n === "graph" && /* @__PURE__ */ (0, y.jsx)(N, {
						report: p,
						missing: o,
						onMissing: c,
						onRevision: d,
						open: e.onOpen,
						run: (e) => void f.runChecks(e),
						busy: !!(_ || m)
					}),
					n === "attention" && /* @__PURE__ */ (0, y.jsx)(F, {
						report: p,
						busy: !!(_ || m),
						mutate: f.mutate,
						run: (e) => void f.runChecks(e),
						open: e.onOpen
					}),
					n === "risks" && /* @__PURE__ */ (0, y.jsx)(I, { report: p }),
					n === "autonomy" && /* @__PURE__ */ (0, y.jsx)(L, {
						report: p,
						busy: !!(_ || m),
						probe: () => void f.mutate("runtime", {}),
						proceed: () => void f.mutate("continue", {
							version: p.version,
							snapshotKey: p.snapshot.key
						})
					}),
					n === "history" && /* @__PURE__ */ (0, y.jsx)(R, { report: p })
				]
			})
		]
	});
}
//#endregion
//#region studio-ui/src/control-widget.tsx
function B(e, t) {
	let n = (0, o.createRoot)(e);
	return n.render(/* @__PURE__ */ (0, y.jsx)(z, { options: t })), {
		update(e) {
			n.render(/* @__PURE__ */ (0, y.jsx)(z, { options: e }));
		},
		dispose() {
			n.unmount();
		}
	};
}
//#endregion
export { B as mountControlWidget };
