import { n as e, r as t, t as n } from "./jsx-runtime-Bz8zB3tG.js";
import { a as r, i, n as a, o, r as s, t as c } from "./ConnectorGuide-B-paXMRz.js";
//#region studio-ui/src/features/connectors/model/catalog.ts
var l = t(), u = e();
function d(e, t, n) {
	let r = e.filter((e) => e.checkIds.includes(n || ""));
	for (let e of ["attested", "configured"]) {
		let n = r.find((n) => t.some((t) => t.optionId === n.id && t.status === e));
		if (n) return n;
	}
	return r.find((e) => e.transport === "local") || r[0];
}
function f(e) {
	return e.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("fr-FR");
}
function p(e) {
	return e ? e.status === "attested" ? "Disponibilité attestée" : e.status === "failed" ? "Connexion à revoir" : "Configuré · à vérifier" : "À configurer";
}
//#endregion
//#region studio-ui/src/features/connectors/hooks/useConnectors.ts
async function m(e) {
	let t = await e.json();
	if (!e.ok) throw Error(t.error || "Le service des connecteurs ne répond pas.");
	return t;
}
function h(e) {
	let [t, n] = (0, l.useState)(null), [r, i] = (0, l.useState)(""), [a, o] = (0, l.useState)(!1), [s, c] = (0, l.useState)(0), u = (0, l.useRef)(0), d = (0, l.useRef)(null);
	(0, l.useEffect)(() => {
		let t = new AbortController(), r = ++u.current;
		return i(""), o(!1), fetch("/api/connectors?" + new URLSearchParams(e ? { revision: e } : {}), {
			signal: AbortSignal.any([t.signal, AbortSignal.timeout(15e3)]),
			cache: "no-store"
		}).then(m).then((i) => {
			if (!(r !== u.current || t.signal.aborted)) {
				if (i.schemaVersion !== 1 || !i.catalog || !Array.isArray(i.connections)) throw Error("Catalogue illisible. Aucun état de connexion confirmé.");
				if (e !== null && i.revisionId !== e) throw Error("Le catalogue concerne une autre version.");
				n({
					revision: e,
					data: i
				});
			}
		}).catch((e) => {
			!t.signal.aborted && r === u.current && i(e instanceof Error ? e.message : "Chargement impossible.");
		}), () => {
			u.current = r + 1, t.abort(), d.current?.abort(), d.current = null;
		};
	}, [e, s]);
	async function f(e, t) {
		if (d.current) return null;
		let n = new AbortController();
		d.current = n;
		let r = u.current;
		o(!0), i("");
		try {
			let i = await m(await fetch("/api/connectors/" + e, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(t),
				signal: AbortSignal.any([n.signal, AbortSignal.timeout(15e3)])
			}));
			return n.signal.aborted || r !== u.current ? null : i;
		} catch (e) {
			return !n.signal.aborted && r === u.current && i(e instanceof Error ? e.message : "Action non confirmée. Actualisez pour vérifier."), null;
		} finally {
			r === u.current && (d.current = null, o(!1));
		}
	}
	return {
		report: t?.revision === e ? t.data : null,
		error: r,
		busy: a,
		action: f,
		refresh: () => c((e) => e + 1)
	};
}
//#endregion
//#region studio-ui/src/features/connectors/components/ConnectionDetail.tsx
var g = n();
function _(e) {
	return e ? e.status === "failed" ? "Échec de la vérification de connexion" : e.status === "attested" ? "Disponibilité attestée par l’agent hôte" : "Configuré · connexion à vérifier" : "À configurer";
}
function v(e, t) {
	return [
		`Vérifier la disponibilité du connecteur ${t.title} pour ce projet.`,
		`Connexion : ${e.id}, configuration ${e.version}. Profil : ${e.profileRef || "à préciser dans l’hôte"}.`,
		`Capacités attendues : ${t.capabilities.join(", ")}. Documentation : ${t.docs}`,
		"Utiliser uniquement les accès autorisés dans l’agent hôte. Ne pas envoyer de message, provisionner ou modifier les données pour cette vérification.",
		"Publier le résultat via le bridge worker POST /api/connectors/probe avec connectionId, connectionVersion, eventId unique, status available ou failed, tool {name, version}, capabilities, observedAt, summary et tools si MCP. Ne publier available qu’après une réponse réelle ; une configuration ne prouve pas la connexion. Aucune clé ni sortie sensible dans le rapport."
	].join("\n");
}
function y({ draft: e, version: t }) {
	return !e.dirty || e.baseVersion === t ? null : /* @__PURE__ */ (0, g.jsx)("p", {
		role: "alert",
		className: "connector-error",
		children: "La configuration a changé. Vos réponses sont conservées ; relisez la version enregistrée avant de les remplacer."
	});
}
function b(e) {
	let { option: t, connection: n, revisionId: r, busy: i, action: a, refresh: s, onPrepareRequest: c, draft: l, onDraft: u } = e, { profile: d, references: f, control: p, capability: m } = l;
	async function h(r) {
		if (r.preventDefault(), i || e.guideReady === !1) return;
		let o = await a("configure", {
			id: n?.id || t.id,
			optionId: t.id,
			purpose: t.purpose,
			...d.trim() ? { profileRef: d.trim() } : {},
			secretRefs: f.split("\n").map((e) => e.trim()).filter(Boolean),
			expectedVersion: l.baseVersion,
			...l.guide ? { guide: l.guide } : {}
		});
		if (o && typeof o == "object" && "connections" in o && Array.isArray(o.connections)) {
			let n = o.connections.find((e) => e.optionId === t.id);
			n && e.onSaved(l, n.version), s();
		}
	}
	async function b() {
		if (!n || !r || i || l.dirty) return;
		let e = await a(t.purpose === "diagnostics" ? "executions" : "prepare", {
			connectionId: n.id,
			revisionId: r,
			...t.purpose === "diagnostics" ? { checkId: p } : { capability: m }
		});
		e && typeof e == "object" && "prompt" in e && typeof e.prompt == "string" && c({
			prompt: e.prompt,
			..."connectorGuides" in e && Array.isArray(e.connectorGuides) ? { connectorGuides: e.connectorGuides.map(o) } : {}
		});
	}
	return /* @__PURE__ */ (0, g.jsxs)("section", {
		className: "connector-detail",
		"aria-label": `Configurer ${t.title}`,
		children: [
			/* @__PURE__ */ (0, g.jsx)("h3", { children: t.title }),
			/* @__PURE__ */ (0, g.jsx)("p", {
				className: `connector-state state-${n?.status || "proposed"}`,
				children: _(n)
			}),
			/* @__PURE__ */ (0, g.jsx)("p", { children: t.description }),
			/* @__PURE__ */ (0, g.jsx)("p", {
				className: "connector-cost",
				children: t.cost
			}),
			/* @__PURE__ */ (0, g.jsx)("a", {
				href: t.docs,
				target: "_blank",
				rel: "noopener noreferrer",
				children: "Documentation officielle ↗"
			}),
			e.guidePanel,
			/* @__PURE__ */ (0, g.jsx)(y, {
				draft: l,
				version: n?.version || 0
			}),
			/* @__PURE__ */ (0, g.jsxs)("form", {
				onSubmit: (e) => void h(e),
				children: [
					/* @__PURE__ */ (0, g.jsxs)("label", { children: [
						"Profil dans l’agent hôte",
						" ",
						/* @__PURE__ */ (0, g.jsx)("input", {
							value: d,
							onChange: (e) => u({ profile: e.target.value }),
							disabled: i,
							name: "connector-profile",
							autoComplete: "off",
							placeholder: "host:mon-profil",
							pattern: "host:[A-Za-z0-9_.-]+"
						})
					] }),
					/* @__PURE__ */ (0, g.jsxs)("label", { children: [
						"Références des accès, une par ligne",
						" ",
						/* @__PURE__ */ (0, g.jsx)("textarea", {
							value: f,
							onChange: (e) => u({ references: e.target.value }),
							disabled: i,
							name: "connector-secret-references",
							autoComplete: "off",
							spellCheck: !1,
							placeholder: "env:NOM_DE_VARIABLE\nhost:nom-du-secret",
							rows: 2
						})
					] }),
					/* @__PURE__ */ (0, g.jsx)("p", {
						className: "connector-note",
						children: "Indiquez les noms des accès conservés dans l’hôte. Ne collez aucune clé secrète. Enregistrer ne connecte ni n’installe un service."
					}),
					/* @__PURE__ */ (0, g.jsx)("button", {
						type: "submit",
						disabled: i || e.guideReady === !1,
						children: n ? "Enregistrer les réglages" : "Enregistrer la configuration"
					})
				]
			}),
			n ? /* @__PURE__ */ (0, g.jsxs)(g.Fragment, { children: [
				l.dirty ? /* @__PURE__ */ (0, g.jsx)("p", {
					className: "connector-note",
					children: "Enregistrez les réglages avant de préparer une demande avec cette configuration."
				}) : null,
				/* @__PURE__ */ (0, g.jsx)("button", {
					type: "button",
					disabled: i || l.dirty,
					onClick: () => c({ prompt: v(n, t) }),
					children: "Préparer la vérification de connexion →"
				}),
				n.probe ? /* @__PURE__ */ (0, g.jsxs)("div", {
					className: "connector-probe",
					children: [/* @__PURE__ */ (0, g.jsx)("p", { children: n.probe.summary }), /* @__PURE__ */ (0, g.jsxs)("small", { children: [
						n.probe.tool.name,
						" · ",
						n.probe.tool.version,
						" · constat du",
						" ",
						new Date(n.probe.observedAt).toLocaleString("fr-FR")
					] })]
				}) : null,
				t.purpose === "diagnostics" ? /* @__PURE__ */ (0, g.jsxs)("label", { children: ["Contrôle à exécuter", /* @__PURE__ */ (0, g.jsx)("select", {
					value: p,
					disabled: i,
					onChange: (e) => u({ control: e.target.value }),
					children: t.checkIds.map((e) => /* @__PURE__ */ (0, g.jsx)("option", {
						value: e,
						children: e
					}, e))
				})] }) : /* @__PURE__ */ (0, g.jsxs)("label", { children: ["Capacité à intégrer", /* @__PURE__ */ (0, g.jsx)("select", {
					value: m,
					disabled: i,
					onChange: (e) => u({ capability: e.target.value }),
					children: t.capabilities.map((e) => /* @__PURE__ */ (0, g.jsx)("option", {
						value: e,
						children: e
					}, e))
				})] }),
				/* @__PURE__ */ (0, g.jsx)("button", {
					type: "button",
					className: "primary",
					disabled: i || l.dirty || !r || t.purpose === "diagnostics" && (n.status !== "attested" || !p),
					onClick: () => void b(),
					children: t.purpose === "diagnostics" ? "Préparer l’exécution avec l’agent hôte →" : "Préparer l’intégration au projet →"
				}),
				/* @__PURE__ */ (0, g.jsxs)("p", {
					className: "connector-note",
					children: [r ? `Version ciblée : ${r.slice(0, 8)}. ` : "Une version du projet est nécessaire. ", t.purpose === "diagnostics" ? "Le résultat reçu sera rattaché aux sources contrôlées." : "La demande prépare une évolution du code. Aucun service n’est provisionné et aucun e-mail n’est envoyé."]
				})
			] }) : null,
			/* @__PURE__ */ (0, g.jsxs)("details", { children: [/* @__PURE__ */ (0, g.jsx)("summary", { children: "Portée et limites" }), /* @__PURE__ */ (0, g.jsx)("ul", { children: t.limits.map((e) => /* @__PURE__ */ (0, g.jsx)("li", { children: e }, e)) })] })
		]
	});
}
//#endregion
//#region studio-ui/src/features/connectors/components/ConnectorCatalog.tsx
function x({ report: e, contextual: t, selectedId: n, onOpen: r }) {
	let [a, o] = (0, l.useState)(t ? "diagnostics" : "application"), [s, c] = (0, l.useState)("all"), [u, d] = (0, l.useState)(""), [m, h] = (0, l.useState)(!1);
	if (!e) return null;
	let _ = new Map(e.connections.map((e) => [e.optionId, e])), v = e.catalog.capabilities.filter((e) => e.purpose === a), y = f(u.trim()), b = e.catalog.options.filter((e) => e.purpose === a && f(`${e.title} ${e.description} ${e.capabilities.join(" ")}`).includes(y)), x = b.filter((e) => _.has(e.id)).length, S = b.filter((e) => !m || _.has(e.id)), C = [{
		id: "all",
		title: "Toutes les catégories",
		count: S.length
	}, ...v.map((e) => ({
		id: e.id,
		title: e.title,
		count: S.filter((t) => t.capabilities.includes(e.id)).length
	}))], w = S.filter((e) => s === "all" || e.capabilities.includes(s));
	return /* @__PURE__ */ (0, g.jsxs)("div", {
		className: "connector-catalog",
		children: [/* @__PURE__ */ (0, g.jsxs)("div", {
			className: "connector-browse-toolbar",
			children: [/* @__PURE__ */ (0, g.jsx)("nav", {
				className: "connector-purpose",
				"aria-label": "Usage des connecteurs",
				children: ["application", "diagnostics"].map((e) => /* @__PURE__ */ (0, g.jsx)("button", {
					type: "button",
					"aria-pressed": a === e,
					onClick: () => {
						o(e), c("all");
					},
					children: e === "application" ? "Services de l’application" : "Diagnostic et vérifications"
				}, e))
			}), /* @__PURE__ */ (0, g.jsxs)("label", {
				className: "connector-search",
				children: [/* @__PURE__ */ (0, g.jsx)("span", {
					className: "connector-sr",
					children: "Rechercher un outil ou un service"
				}), /* @__PURE__ */ (0, g.jsx)("input", {
					type: "search",
					name: "connector-search",
					autoComplete: "off",
					spellCheck: !1,
					value: u,
					onChange: (e) => d(e.target.value),
					placeholder: "Rechercher un outil ou un service…"
				})]
			})]
		}), /* @__PURE__ */ (0, g.jsxs)("div", {
			className: "connector-catalog-layout",
			children: [/* @__PURE__ */ (0, g.jsxs)("nav", {
				className: "connector-categories",
				"aria-label": "Catégories des connecteurs",
				children: [/* @__PURE__ */ (0, g.jsx)("span", {
					className: "connector-section-label",
					children: "Catégories"
				}), C.map((e) => /* @__PURE__ */ (0, g.jsxs)("button", {
					type: "button",
					"aria-pressed": s === e.id,
					onClick: () => c(e.id),
					children: [/* @__PURE__ */ (0, g.jsx)("span", { children: e.title }), /* @__PURE__ */ (0, g.jsx)("span", {
						className: "connector-count",
						children: e.count
					})]
				}, e.id))]
			}), /* @__PURE__ */ (0, g.jsxs)("div", {
				className: "connector-catalog-main",
				children: [
					/* @__PURE__ */ (0, g.jsxs)("label", {
						className: "connector-mobile-category",
						children: ["Catégorie", /* @__PURE__ */ (0, g.jsx)("select", {
							value: s,
							onChange: (e) => c(e.target.value),
							children: C.map((e) => /* @__PURE__ */ (0, g.jsxs)("option", {
								value: e.id,
								children: [
									e.title,
									" (",
									e.count,
									")"
								]
							}, e.id))
						})]
					}),
					/* @__PURE__ */ (0, g.jsxs)("div", {
						className: "connector-results-toolbar",
						children: [/* @__PURE__ */ (0, g.jsxs)("nav", {
							className: "connector-filter-tabs",
							"aria-label": "État de configuration",
							children: [/* @__PURE__ */ (0, g.jsxs)("button", {
								type: "button",
								"aria-pressed": !m,
								onClick: () => h(!1),
								children: ["Tous ", /* @__PURE__ */ (0, g.jsx)("span", { children: b.length })]
							}), /* @__PURE__ */ (0, g.jsxs)("button", {
								type: "button",
								"aria-pressed": m,
								onClick: () => h(!0),
								children: ["Configurés ", /* @__PURE__ */ (0, g.jsx)("span", { children: x })]
							})]
						}), /* @__PURE__ */ (0, g.jsxs)("span", {
							className: "connector-result-count",
							role: "status",
							children: [
								w.length,
								" solution",
								w.length === 1 ? "" : "s"
							]
						})]
					}),
					/* @__PURE__ */ (0, g.jsx)("div", {
						className: "connector-card-grid",
						"aria-label": "Solutions proposées",
						children: w.map((e) => {
							let t = _.get(e.id);
							return /* @__PURE__ */ (0, g.jsxs)("button", {
								className: "connector-card",
								type: "button",
								"aria-label": `Voir ${e.title}`,
								"aria-current": n === e.id ? "true" : void 0,
								onClick: (t) => r(e.id, t.currentTarget),
								children: [
									/* @__PURE__ */ (0, g.jsxs)("span", {
										className: "connector-card-heading",
										children: [
											/* @__PURE__ */ (0, g.jsx)(i, { optionId: e.id }),
											/* @__PURE__ */ (0, g.jsx)("span", {
												className: "connector-card-title",
												children: e.title
											}),
											/* @__PURE__ */ (0, g.jsx)("span", {
												className: "connector-card-arrow",
												"aria-hidden": "true",
												children: "↗"
											})
										]
									}),
									/* @__PURE__ */ (0, g.jsx)("span", {
										className: "connector-card-description",
										children: e.description
									}),
									/* @__PURE__ */ (0, g.jsxs)("span", {
										className: "connector-card-footer",
										children: [/* @__PURE__ */ (0, g.jsx)("span", {
											className: `connector-state state-${t?.status || "proposed"}`,
											children: p(t)
										}), /* @__PURE__ */ (0, g.jsx)("span", {
											className: "connector-transport",
											children: e.transport === "local" ? "Local" : e.transport.toUpperCase()
										})]
									})
								]
							}, e.id);
						})
					}),
					w.length ? null : /* @__PURE__ */ (0, g.jsxs)("div", {
						className: "connector-empty",
						children: [/* @__PURE__ */ (0, g.jsx)("strong", { children: "Aucune solution dans ce filtre" }), /* @__PURE__ */ (0, g.jsx)("p", { children: m ? "Aucun connecteur configuré ne correspond. Consultez Tous pour parcourir les options." : "Essayez une autre recherche ou une autre catégorie." })]
					})
				]
			})]
		})]
	});
}
//#endregion
//#region studio-ui/src/features/connectors/hooks/useConnectorDrafts.ts
function S(e, t, n) {
	return {
		profile: t?.profileRef || "",
		references: t?.secretRefs.join("\n") || "",
		control: e.checkIds.includes(n || "") ? n : e.checkIds[0] || "",
		capability: e.capabilities[0] || "",
		guide: t?.guide || null,
		baseVersion: t?.version || 0,
		dirty: !1
	};
}
function C(e) {
	let [t, n] = (0, l.useState)({});
	function r(n, r) {
		let i = t[n.id];
		return i && (i.dirty || i.baseVersion >= (r?.version || 0)) ? i : S(n, r, e);
	}
	function i(e, t, r) {
		let i = t.dirty || [
			"profile",
			"references",
			"guide"
		].some((e) => e in r);
		n((n) => ({
			...n,
			[e]: {
				...t,
				...r,
				dirty: i
			}
		}));
	}
	function a(e, t, r) {
		n((n) => {
			let i = n[e];
			return i && i !== t ? n : {
				...n,
				[e]: {
					...t,
					baseVersion: r,
					dirty: !1
				}
			};
		});
	}
	return {
		get: r,
		update: i,
		saved: a
	};
}
//#endregion
//#region studio-ui/src/features/connectors/hooks/useProjectGuide.ts
function w(e, t) {
	let [n, i] = (0, l.useState)({}), o = s({ enabled: e === "slack" }), c = a(), u = o.guides.find((t) => t.optionId === e), d = e ? n[e] : null, f = d && r(d.input) === r(t) ? d : null;
	async function p(e) {
		let t = await c.prepare(e);
		t && i((n) => ({
			...n,
			[e.optionId]: t
		}));
	}
	return {
		enabled: e === "slack",
		catalog: o,
		request: c,
		definition: u,
		confirmed: f,
		ready: !t || !!f,
		prepare: p
	};
}
//#endregion
//#region studio-ui/src/features/connectors/components/ProjectConnectorGuide.tsx
function T({ controller: e, input: t, busy: n, onChange: r }) {
	if (!e.enabled) return null;
	let { catalog: i, request: a, definition: o, confirmed: s } = e;
	return /* @__PURE__ */ (0, g.jsxs)("div", {
		className: "connector-project-guide",
		children: [
			i.loading ? /* @__PURE__ */ (0, g.jsx)("p", {
				role: "status",
				children: "Lecture du guide fournisseur…"
			}) : null,
			i.error ? /* @__PURE__ */ (0, g.jsxs)("div", { children: [/* @__PURE__ */ (0, g.jsx)("p", {
				role: "alert",
				className: "connector-error",
				children: i.error
			}), /* @__PURE__ */ (0, g.jsx)("button", {
				type: "button",
				onClick: i.refresh,
				children: "Réessayer le guide"
			})] }) : null,
			o ? /* @__PURE__ */ (0, g.jsx)(c, {
				definition: o,
				draft: t,
				preparation: s,
				preparing: a.loading,
				error: a.error,
				disabled: n,
				onChange: (e) => {
					a.reset(), r(e);
				},
				onPrepare: (t) => void e.prepare(t)
			}) : null,
			t && !s ? /* @__PURE__ */ (0, g.jsx)("p", {
				className: "connector-note",
				children: "Vérifiez la préparation avant d’enregistrer ces réponses avec les réglages."
			}) : null
		]
	});
}
//#endregion
//#region studio-ui/src/features/connectors/components/ConnectorsView.tsx
function E(e) {
	let { report: t, error: n, busy: r, action: i, refresh: a } = h(e.revisionId), o = C(e.checkId), [s, c] = (0, l.useState)({
		detail: e.checkId ? void 0 : null,
		lastSelected: null
	}), u = (0, l.useRef)(null), f = (0, l.useRef)(null), p = (0, l.useRef)(!1), m = (0, l.useCallback)((e) => e?.focus(), []), _ = t && (s.detail === void 0 ? d(t.catalog.options, t.connections, e.checkId) : t.catalog.options.find((e) => e.id === s.detail)), v = t?.connections.find((e) => e.optionId === _?.id), y = _?.id, S = _ ? o.get(_, v) : null, E = w(y, S?.guide);
	(0, l.useLayoutEffect)(() => {
		!y && p.current && (p.current = !1, (f.current?.isConnected ? f.current : u.current?.querySelector("input[type=\"search\"]"))?.focus());
	}, [y]);
	function D() {
		E.request.reset(), p.current = !0, c({
			detail: null,
			lastSelected: _?.id || s.lastSelected
		});
	}
	return /* @__PURE__ */ (0, g.jsxs)("div", {
		className: "connectors-view",
		children: [
			/* @__PURE__ */ (0, g.jsxs)("div", {
				className: "connector-toolbar",
				children: [/* @__PURE__ */ (0, g.jsx)("p", {
					className: "connector-intro",
					children: "Trouvez les services de votre application et les outils pour la vérifier. Configuration et disponibilité restent distinctes."
				}), /* @__PURE__ */ (0, g.jsx)("button", {
					type: "button",
					className: "connector-refresh",
					onClick: a,
					disabled: r,
					children: "Actualiser les états"
				})]
			}),
			n ? /* @__PURE__ */ (0, g.jsx)("p", {
				role: "alert",
				className: "connector-error",
				children: n
			}) : null,
			t ? null : /* @__PURE__ */ (0, g.jsx)("p", {
				role: "status",
				children: n ? "Aucun état de connexion confirmé." : "Lecture du catalogue…"
			}),
			/* @__PURE__ */ (0, g.jsx)("div", {
				ref: u,
				hidden: !!_,
				children: /* @__PURE__ */ (0, g.jsx)(x, {
					report: t,
					contextual: !!e.checkId,
					selectedId: _?.id || s.lastSelected,
					onOpen: (e, t) => {
						f.current = t, c({
							detail: e,
							lastSelected: e
						});
					}
				})
			}),
			_ && S ? /* @__PURE__ */ (0, g.jsxs)("div", {
				className: "connector-detail-page",
				children: [/* @__PURE__ */ (0, g.jsx)("button", {
					type: "button",
					className: "connector-back",
					ref: m,
					onClick: D,
					children: "← Retour au catalogue"
				}), /* @__PURE__ */ (0, g.jsx)(b, {
					...e,
					option: _,
					connection: v,
					busy: r,
					action: i,
					refresh: a,
					draft: S,
					onDraft: (e) => o.update(_.id, S, e),
					onSaved: (e, t) => o.saved(_.id, e, t),
					guideReady: E.ready,
					guidePanel: /* @__PURE__ */ (0, g.jsx)(T, {
						controller: E,
						input: S.guide,
						busy: r,
						onChange: (e) => o.update(_.id, S, { guide: e })
					})
				}, _.id)]
			}) : null,
			t ? /* @__PURE__ */ (0, g.jsxs)("details", {
				className: "connector-report-limits",
				children: [/* @__PURE__ */ (0, g.jsx)("summary", { children: "Ce que DevMethod prend en charge" }), /* @__PURE__ */ (0, g.jsx)("ul", { children: t.limits.map((e) => /* @__PURE__ */ (0, g.jsx)("li", { children: e }, e)) })]
			}) : null
		]
	});
}
//#endregion
//#region studio-ui/src/connectors-widget.tsx
function D(e, t) {
	let n = (0, u.createRoot)(e), r = (e) => n.render(/* @__PURE__ */ (0, g.jsx)(E, { ...e }, e.checkId || "catalog"));
	return r(t), {
		update: r,
		dispose: () => n.unmount()
	};
}
//#endregion
export { D as mountConnectorsWidget };
