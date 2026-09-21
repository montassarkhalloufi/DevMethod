import { i as e, n as t, r as n, t as r } from "./jsx-runtime-DZd2gj5L.js";
import { r as i } from "./i18n-CRhBcIYq.js";
import { a, c as o, d as s, f as c, n as l, o as u, r as d, t as f, u as p } from "./ConnectorGuide-IMh4AumH.js";
//#region studio-ui/src/features/connectors/model/catalog.ts
var m = e(), h = t();
function g(e, t, n) {
	let r = e.filter((e) => e.checkIds.includes(n || ""));
	for (let e of ["attested", "configured"]) {
		let n = r.find((n) => t.some((t) => t.optionId === n.id && t.status === e));
		if (n) return n;
	}
	return r.find((e) => e.transport === "local") || r[0];
}
function _(e, t = "en") {
	return e.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase(t);
}
function v(e) {
	return e ? e.status === "attested" ? "Disponibilité attestée" : e.status === "failed" ? "Connexion à revoir" : "Configuré · à vérifier" : "À configurer";
}
//#endregion
//#region studio-ui/src/features/connectors/hooks/useConnectors.ts
async function y(e) {
	let t = await e.json();
	if (!e.ok) throw Error(t.error || "Le service des connecteurs ne répond pas.");
	return t;
}
function b(e) {
	let { locale: t } = n(), [r, i] = (0, m.useState)(null), [a, o] = (0, m.useState)(""), [s, c] = (0, m.useState)(!1), [l, u] = (0, m.useState)(0), d = (0, m.useRef)(0), f = (0, m.useRef)(null);
	(0, m.useEffect)(() => {
		let n = new AbortController(), r = ++d.current;
		return o(""), c(!1), fetch("/api/connectors?" + new URLSearchParams({
			language: t,
			...e ? { revision: e } : {}
		}), {
			signal: AbortSignal.any([n.signal, AbortSignal.timeout(15e3)]),
			cache: "no-store"
		}).then(y).then((t) => {
			if (!(r !== d.current || n.signal.aborted)) {
				if (t.schemaVersion !== 1 || !t.catalog || !Array.isArray(t.connections)) throw Error("Catalogue illisible. Aucun état de connexion confirmé.");
				if (e !== null && t.revisionId !== e) throw Error("Le catalogue concerne une autre version.");
				i({
					revision: e,
					data: t
				});
			}
		}).catch((e) => {
			!n.signal.aborted && r === d.current && o(e instanceof Error ? e.message : "Chargement impossible.");
		}), () => {
			d.current = r + 1, n.abort(), f.current?.abort(), f.current = null;
		};
	}, [
		e,
		l,
		t
	]);
	async function p(e, t) {
		if (f.current) return null;
		let n = new AbortController();
		f.current = n;
		let r = d.current;
		c(!0), o("");
		try {
			let i = await y(await fetch("/api/connectors/" + e, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(t),
				signal: AbortSignal.any([n.signal, AbortSignal.timeout(15e3)])
			}));
			return n.signal.aborted || r !== d.current ? null : i;
		} catch (e) {
			return !n.signal.aborted && r === d.current && o(e instanceof Error ? e.message : "Action non confirmée. Actualisez pour vérifier."), null;
		} finally {
			r === d.current && (f.current = null, c(!1));
		}
	}
	return {
		report: r?.revision === e ? r.data : null,
		error: a,
		busy: s,
		action: p,
		refresh: () => u((e) => e + 1)
	};
}
//#endregion
//#region studio-ui/src/features/connectors/components/ConnectionDetail.tsx
var x = r();
function S(e) {
	return e ? e.status === "failed" ? "Échec de la vérification de connexion" : e.status === "attested" ? "Disponibilité attestée par l’agent hôte" : "Configuré · connexion à vérifier" : "À configurer";
}
function C(e, t, n) {
	return [
		s("Vérifier la disponibilité du connecteur {name} pour ce projet.", "Check availability of connector {name} for this project.", n, { name: t.title }),
		s("Connexion : {id}, configuration {version}. Profil : {profile}.", "Connection: {id}, configuration {version}. Profile: {profile}.", n, {
			id: e.id,
			version: e.version,
			profile: e.profileRef || c("à préciser dans l’hôte", n)
		}),
		s("Capacités attendues : {capabilities}. Documentation : {docs}", "Expected capabilities: {capabilities}. Documentation: {docs}", n, {
			capabilities: t.capabilities.join(", "),
			docs: t.docs
		}),
		c("Utiliser uniquement les accès autorisés dans l’agent hôte. Ne pas envoyer de message, provisionner ou modifier les données pour cette vérification.", n),
		c("Publier le résultat via le bridge worker POST /api/connectors/probe avec connectionId, connectionVersion, eventId unique, status available ou failed, tool {name, version}, capabilities, observedAt, summary et tools si MCP. Ne publier available qu’après une réponse réelle ; une configuration ne prouve pas la connexion. Aucune clé ni sortie sensible dans le rapport.", n)
	].join("\n");
}
function w({ draft: e, version: t }) {
	let { locale: r } = n();
	return !e.dirty || e.baseVersion === t ? null : /* @__PURE__ */ (0, x.jsx)("p", {
		role: "alert",
		className: "connector-error",
		children: c("La configuration a changé. Vos réponses sont conservées ; relisez la version enregistrée avant de les remplacer.", r)
	});
}
function T(e) {
	let { locale: t } = n(), { option: r, connection: i, revisionId: a, busy: l, action: u, refresh: d, onPrepareRequest: f, draft: p, onDraft: m } = e, { profile: h, references: g, control: _, capability: v } = p;
	async function y(t) {
		if (t.preventDefault(), l || e.guideReady === !1) return;
		let n = await u("configure", {
			id: i?.id || r.id,
			optionId: r.id,
			purpose: r.purpose,
			...h.trim() ? { profileRef: h.trim() } : {},
			secretRefs: g.split("\n").map((e) => e.trim()).filter(Boolean),
			expectedVersion: p.baseVersion,
			...p.guide ? { guide: p.guide } : {}
		});
		if (n && typeof n == "object" && "connections" in n && Array.isArray(n.connections)) {
			let t = n.connections.find((e) => e.optionId === r.id);
			t && e.onSaved(p, t.version), d();
		}
	}
	async function b() {
		if (!i || !a || l || p.dirty) return;
		let e = await u(r.purpose === "diagnostics" ? "executions" : "prepare", {
			connectionId: i.id,
			revisionId: a,
			...r.purpose === "diagnostics" ? { checkId: _ } : { capability: v }
		});
		e && typeof e == "object" && "prompt" in e && typeof e.prompt == "string" && f({
			prompt: e.prompt,
			..."connectorGuides" in e && Array.isArray(e.connectorGuides) ? { connectorGuides: e.connectorGuides.map(o) } : {}
		});
	}
	return /* @__PURE__ */ (0, x.jsxs)("section", {
		className: "connector-detail",
		"aria-label": s("Configurer {name}", "Configure {name}", t, { name: r.title }),
		children: [
			/* @__PURE__ */ (0, x.jsx)("h3", { children: r.title }),
			/* @__PURE__ */ (0, x.jsx)("p", {
				className: `connector-state state-${i?.status || "proposed"}`,
				children: c(S(i), t)
			}),
			/* @__PURE__ */ (0, x.jsx)("p", { children: r.description }),
			/* @__PURE__ */ (0, x.jsx)("p", {
				className: "connector-cost",
				children: r.cost
			}),
			/* @__PURE__ */ (0, x.jsx)("a", {
				href: r.docs,
				target: "_blank",
				rel: "noopener noreferrer",
				children: c("Documentation officielle ↗", t)
			}),
			e.guidePanel,
			/* @__PURE__ */ (0, x.jsx)(w, {
				draft: p,
				version: i?.version || 0
			}),
			/* @__PURE__ */ (0, x.jsxs)("form", {
				onSubmit: (e) => void y(e),
				children: [/* @__PURE__ */ (0, x.jsxs)("details", {
					className: "connector-advanced",
					children: [
						/* @__PURE__ */ (0, x.jsx)("summary", { children: c("Configuration avancée", t) }),
						/* @__PURE__ */ (0, x.jsxs)("label", { children: [
							c("Profil dans l’agent hôte", t),
							" ",
							/* @__PURE__ */ (0, x.jsx)("input", {
								value: h,
								onChange: (e) => m({ profile: e.target.value }),
								disabled: l,
								name: "connector-profile",
								autoComplete: "off",
								placeholder: "host:mon-profil",
								pattern: "host:[A-Za-z0-9_.-]+"
							})
						] }),
						/* @__PURE__ */ (0, x.jsxs)("label", { children: [
							c("Références des accès, une par ligne", t),
							" ",
							/* @__PURE__ */ (0, x.jsx)("textarea", {
								value: g,
								onChange: (e) => m({ references: e.target.value }),
								disabled: l,
								name: "connector-secret-references",
								autoComplete: "off",
								spellCheck: !1,
								placeholder: s("env:NOM_DE_VARIABLE\nhost:nom-du-secret", "env:VARIABLE_NAME\nhost:secret-name", t),
								rows: 2
							})
						] }),
						/* @__PURE__ */ (0, x.jsx)("p", {
							className: "connector-note",
							children: c("Indiquez les noms des accès conservés dans l’hôte. Ne collez aucune clé secrète. Enregistrer ne connecte ni n’installe un service.", t)
						})
					]
				}), /* @__PURE__ */ (0, x.jsx)("button", {
					type: "submit",
					disabled: l || e.guideReady === !1,
					children: c(i ? "Enregistrer les réglages" : "Enregistrer la configuration", t)
				})]
			}),
			i ? /* @__PURE__ */ (0, x.jsxs)(x.Fragment, { children: [
				p.dirty ? /* @__PURE__ */ (0, x.jsx)("p", {
					className: "connector-note",
					children: c("Enregistrez les réglages avant de préparer une demande avec cette configuration.", t)
				}) : null,
				/* @__PURE__ */ (0, x.jsx)("button", {
					type: "button",
					disabled: l || p.dirty,
					onClick: () => f({ prompt: C(i, r, t) }),
					children: c("Préparer la vérification de connexion →", t)
				}),
				i.probe ? /* @__PURE__ */ (0, x.jsxs)("div", {
					className: "connector-probe",
					children: [/* @__PURE__ */ (0, x.jsx)("p", { children: i.probe.summary }), /* @__PURE__ */ (0, x.jsxs)("small", { children: [
						i.probe.tool.name,
						" · ",
						i.probe.tool.version,
						" ·",
						" ",
						s("constat du", "observed on", t),
						" ",
						new Date(i.probe.observedAt).toLocaleString(t === "fr" ? "fr-FR" : "en-US")
					] })]
				}) : null,
				r.purpose === "diagnostics" ? /* @__PURE__ */ (0, x.jsxs)("label", { children: [c("Contrôle à exécuter", t), /* @__PURE__ */ (0, x.jsx)("select", {
					value: _,
					disabled: l,
					onChange: (e) => m({ control: e.target.value }),
					children: r.checkIds.map((e) => /* @__PURE__ */ (0, x.jsx)("option", {
						value: e,
						children: e
					}, e))
				})] }) : /* @__PURE__ */ (0, x.jsxs)("label", { children: [c("Capacité à intégrer", t), /* @__PURE__ */ (0, x.jsx)("select", {
					value: v,
					disabled: l,
					onChange: (e) => m({ capability: e.target.value }),
					children: r.capabilities.map((e) => /* @__PURE__ */ (0, x.jsx)("option", {
						value: e,
						children: e
					}, e))
				})] }),
				/* @__PURE__ */ (0, x.jsx)("button", {
					type: "button",
					className: "primary",
					disabled: l || p.dirty || !a || r.purpose === "diagnostics" && (i.status !== "attested" || !_),
					onClick: () => void b(),
					children: r.purpose === "diagnostics" ? c("Préparer l’exécution avec l’agent hôte →", t) : c("Préparer l’intégration au projet →", t)
				}),
				/* @__PURE__ */ (0, x.jsx)(E, {
					revisionId: a,
					purpose: r.purpose
				})
			] }) : null,
			/* @__PURE__ */ (0, x.jsxs)("details", { children: [/* @__PURE__ */ (0, x.jsx)("summary", { children: c("Portée et limites", t) }), /* @__PURE__ */ (0, x.jsx)("ul", { children: r.limits.map((e) => /* @__PURE__ */ (0, x.jsx)("li", { children: e }, e)) })] })
		]
	});
}
function E({ revisionId: e, purpose: t }) {
	let { locale: r } = n();
	return /* @__PURE__ */ (0, x.jsxs)("p", {
		className: "connector-note",
		children: [e ? s("Version ciblée : {id}. ", "Target version: {id}. ", r, { id: e.slice(0, 8) }) : c("Une version du projet est nécessaire.", r), c(t === "diagnostics" ? "Le résultat reçu sera rattaché aux sources contrôlées." : "La demande prépare une évolution du code. Aucun service n’est provisionné et aucun e-mail n’est envoyé.", r)]
	});
}
//#endregion
//#region studio-ui/src/features/connectors/components/ConnectorCatalog.tsx
function D({ report: e, contextual: t, selectedId: r, onOpen: i }) {
	let { locale: a } = n(), [o, l] = (0, m.useState)(t ? "diagnostics" : "application"), [u, d] = (0, m.useState)("all"), [f, h] = (0, m.useState)(""), [g, y] = (0, m.useState)(!1);
	if (!e) return null;
	let b = new Map(e.connections.map((e) => [e.optionId, e])), S = e.catalog.capabilities.filter((e) => e.purpose === o), C = _(f.trim(), a), w = e.catalog.options.filter((e) => e.purpose === o && _(`${e.title} ${e.description} ${e.capabilities.join(" ")}`, a).includes(C)), T = w.filter((e) => b.has(e.id)).length, E = w.filter((e) => !g || b.has(e.id)), D = [{
		id: "all",
		title: c("Toutes les catégories", a),
		count: E.length
	}, ...S.map((e) => ({
		id: e.id,
		title: e.title,
		count: E.filter((t) => t.capabilities.includes(e.id)).length
	}))], O = E.filter((e) => u === "all" || e.capabilities.includes(u));
	return /* @__PURE__ */ (0, x.jsxs)("div", {
		className: "connector-catalog",
		children: [/* @__PURE__ */ (0, x.jsxs)("div", {
			className: "connector-browse-toolbar",
			children: [/* @__PURE__ */ (0, x.jsx)("nav", {
				className: "connector-purpose",
				"aria-label": c("Usage des connecteurs", a),
				children: ["application", "diagnostics"].map((e) => /* @__PURE__ */ (0, x.jsx)("button", {
					type: "button",
					"aria-pressed": o === e,
					onClick: () => {
						l(e), d("all");
					},
					children: c(e === "application" ? "Services de l’application" : "Diagnostic et vérifications", a)
				}, e))
			}), /* @__PURE__ */ (0, x.jsxs)("label", {
				className: "connector-search",
				children: [/* @__PURE__ */ (0, x.jsx)("span", {
					className: "connector-sr",
					children: c("Rechercher un outil ou un service", a)
				}), /* @__PURE__ */ (0, x.jsx)("input", {
					type: "search",
					name: "connector-search",
					autoComplete: "off",
					spellCheck: !1,
					value: f,
					onChange: (e) => h(e.target.value),
					placeholder: c("Rechercher un outil ou un service…", a)
				})]
			})]
		}), /* @__PURE__ */ (0, x.jsxs)("div", {
			className: "connector-catalog-layout",
			children: [/* @__PURE__ */ (0, x.jsxs)("nav", {
				className: "connector-categories",
				"aria-label": c("Catégories des connecteurs", a),
				children: [/* @__PURE__ */ (0, x.jsx)("span", {
					className: "connector-section-label",
					children: c("Catégories", a)
				}), D.map((e) => /* @__PURE__ */ (0, x.jsxs)("button", {
					type: "button",
					"aria-pressed": u === e.id,
					onClick: () => d(e.id),
					children: [/* @__PURE__ */ (0, x.jsx)("span", { children: e.title }), /* @__PURE__ */ (0, x.jsx)("span", {
						className: "connector-count",
						children: e.count.toLocaleString(a)
					})]
				}, e.id))]
			}), /* @__PURE__ */ (0, x.jsxs)("div", {
				className: "connector-catalog-main",
				children: [
					/* @__PURE__ */ (0, x.jsxs)("label", {
						className: "connector-mobile-category",
						children: [c("Catégorie", a), /* @__PURE__ */ (0, x.jsx)("select", {
							value: u,
							onChange: (e) => d(e.target.value),
							children: D.map((e) => /* @__PURE__ */ (0, x.jsxs)("option", {
								value: e.id,
								children: [
									e.title,
									" (",
									e.count.toLocaleString(a),
									")"
								]
							}, e.id))
						})]
					}),
					/* @__PURE__ */ (0, x.jsxs)("div", {
						className: "connector-results-toolbar",
						children: [/* @__PURE__ */ (0, x.jsxs)("nav", {
							className: "connector-filter-tabs",
							"aria-label": c("État de configuration", a),
							children: [/* @__PURE__ */ (0, x.jsxs)("button", {
								type: "button",
								"aria-pressed": !g,
								onClick: () => y(!1),
								children: [c("Tous", a), /* @__PURE__ */ (0, x.jsx)("span", { children: w.length.toLocaleString(a) })]
							}), /* @__PURE__ */ (0, x.jsxs)("button", {
								type: "button",
								"aria-pressed": g,
								onClick: () => y(!0),
								children: [c("Configurés", a), /* @__PURE__ */ (0, x.jsx)("span", { children: T.toLocaleString(a) })]
							})]
						}), /* @__PURE__ */ (0, x.jsx)("span", {
							className: "connector-result-count",
							role: "status",
							children: s(O.length === 1 ? "{count} solution" : "{count} solutions", O.length === 1 ? "{count} option" : "{count} options", a, { count: O.length.toLocaleString(a) })
						})]
					}),
					/* @__PURE__ */ (0, x.jsx)("div", {
						className: "connector-card-grid",
						"aria-label": c("Solutions proposées", a),
						children: O.map((e) => {
							let t = b.get(e.id);
							return /* @__PURE__ */ (0, x.jsxs)("button", {
								className: "connector-card",
								type: "button",
								"aria-label": s("Voir {name}", "View {name}", a, { name: e.title }),
								"aria-current": r === e.id ? "true" : void 0,
								onClick: (t) => i(e.id, t.currentTarget),
								children: [
									/* @__PURE__ */ (0, x.jsxs)("span", {
										className: "connector-card-heading",
										children: [
											/* @__PURE__ */ (0, x.jsx)(p, { optionId: e.id }),
											/* @__PURE__ */ (0, x.jsx)("span", {
												className: "connector-card-title",
												children: e.title
											}),
											/* @__PURE__ */ (0, x.jsx)("span", {
												className: "connector-card-arrow",
												"aria-hidden": "true",
												children: "↗"
											})
										]
									}),
									/* @__PURE__ */ (0, x.jsx)("span", {
										className: "connector-card-description",
										children: e.description
									}),
									/* @__PURE__ */ (0, x.jsxs)("span", {
										className: "connector-card-footer",
										children: [/* @__PURE__ */ (0, x.jsx)("span", {
											className: `connector-state state-${t?.status || "proposed"}`,
											children: c(v(t), a)
										}), /* @__PURE__ */ (0, x.jsx)("span", {
											className: "connector-transport",
											children: e.transport === "local" ? c("Local", a) : e.transport.toUpperCase()
										})]
									})
								]
							}, e.id);
						})
					}),
					O.length ? null : /* @__PURE__ */ (0, x.jsxs)("div", {
						className: "connector-empty",
						children: [/* @__PURE__ */ (0, x.jsx)("strong", { children: c("Aucune solution dans ce filtre", a) }), /* @__PURE__ */ (0, x.jsx)("p", { children: c(g ? "Aucun connecteur configuré ne correspond. Consultez Tous pour parcourir les options." : "Essayez une autre recherche ou une autre catégorie.", a) })]
					})
				]
			})]
		})]
	});
}
//#endregion
//#region studio-ui/src/features/connectors/hooks/useConnectorDrafts.ts
function O(e, t, n) {
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
function k(e) {
	let t = l(), [n, r] = (0, m.useState)({});
	function i(r, i) {
		let a = n[r.id], o = a && (a.dirty || a.baseVersion >= (i?.version || 0)) ? a : O(r, i, e), s = t.drafts[r.id]?.input;
		return !o.dirty && s ? {
			...o,
			guide: s
		} : o;
	}
	function a(e, n, i) {
		i.guide !== void 0 && t.edit(e, i.guide, t.drafts[e]?.step ?? 0);
		let a = n.dirty || [
			"profile",
			"references",
			"guide"
		].some((e) => e in i);
		r((t) => ({
			...t,
			[e]: {
				...n,
				...i,
				dirty: a
			}
		}));
	}
	function o(e, t, n) {
		r((r) => {
			let i = r[e];
			return i && i !== t ? r : {
				...r,
				[e]: {
					...t,
					baseVersion: n,
					dirty: !1
				}
			};
		});
	}
	return {
		get: i,
		update: a,
		saved: o,
		persistence: t
	};
}
//#endregion
//#region studio-ui/src/features/connectors/hooks/useProjectGuide.ts
function A(e, t) {
	let { locale: r } = n(), [i, o] = (0, m.useState)({}), s = a({ enabled: e === "slack" }), c = d(), l = s.guides.find((t) => t.optionId === e), f = c.preparation?.input.optionId === e ? c.preparation : e ? i[`${r}:${e}`] : null, p = f && u(f.input) === u(t) ? f : null;
	async function h(e) {
		let t = await c.prepare(e);
		t && o((n) => ({
			...n,
			[`${r}:${e.optionId}`]: t
		}));
	}
	return {
		enabled: e === "slack",
		catalog: s,
		request: c,
		definition: l,
		confirmed: p,
		ready: !t || !!p,
		prepare: h
	};
}
//#endregion
//#region studio-ui/src/features/connectors/components/ProjectConnectorGuide.tsx
function j({ controller: e, input: t, busy: r, onChange: i, persistence: a }) {
	let { locale: o } = n();
	if (!e.enabled) return null;
	let { catalog: s, request: l, definition: u, confirmed: d } = e;
	return /* @__PURE__ */ (0, x.jsxs)("div", {
		className: "connector-project-guide",
		children: [
			s.loading ? /* @__PURE__ */ (0, x.jsx)("p", {
				role: "status",
				children: c("Lecture du guide fournisseur…", o)
			}) : null,
			s.error ? /* @__PURE__ */ (0, x.jsxs)("div", { children: [/* @__PURE__ */ (0, x.jsx)("p", {
				role: "alert",
				className: "connector-error",
				children: c(s.error, o)
			}), /* @__PURE__ */ (0, x.jsx)("button", {
				type: "button",
				onClick: s.refresh,
				children: c("Réessayer le guide", o)
			})] }) : null,
			u ? /* @__PURE__ */ (0, x.jsx)(f, {
				definition: u,
				draft: t,
				preparation: d,
				preparing: l.loading,
				error: c(l.error, o),
				disabled: r,
				onChange: (e) => {
					l.reset(), i(e);
				},
				onPrepare: (t) => void e.prepare(t),
				step: a.drafts[u.optionId]?.step,
				onStepChange: (e) => a.edit(u.optionId, t, e)
			}) : null,
			a.error ? /* @__PURE__ */ (0, x.jsxs)("p", {
				role: "alert",
				children: [
					c(a.error, o),
					" ",
					/* @__PURE__ */ (0, x.jsx)("button", {
						type: "button",
						onClick: () => void a.retry(),
						children: c("Réessayer l’enregistrement", o)
					})
				]
			}) : null,
			t && !d ? /* @__PURE__ */ (0, x.jsx)("p", {
				className: "connector-note",
				children: c("Vérifiez la préparation avant d’enregistrer ces réponses avec les réglages.", o)
			}) : null
		]
	});
}
//#endregion
//#region studio-ui/src/features/connectors/components/ConnectorsView.tsx
function M(e) {
	let { locale: t } = n(), { report: r, error: i, busy: a, action: o, refresh: l } = b(e.revisionId), u = k(e.checkId), [d, f] = (0, m.useState)({
		detail: e.checkId ? void 0 : null,
		lastSelected: null
	}), p = (0, m.useRef)(null), h = (0, m.useRef)(null), _ = (0, m.useRef)(!1), v = (0, m.useCallback)((e) => e?.focus(), []), y = r && (d.detail === void 0 ? g(r.catalog.options, r.connections, e.checkId) : r.catalog.options.find((e) => e.id === d.detail)), S = r?.connections.find((e) => e.optionId === y?.id), C = y?.id, w = y ? u.get(y, S) : null, E = A(C, w?.guide);
	(0, m.useLayoutEffect)(() => {
		!C && _.current && (_.current = !1, (h.current?.isConnected ? h.current : p.current?.querySelector("input[type=\"search\"]"))?.focus());
	}, [C]);
	function O() {
		E.request.reset(), _.current = !0, f({
			detail: null,
			lastSelected: y?.id || d.lastSelected
		});
	}
	return /* @__PURE__ */ (0, x.jsxs)("div", {
		className: "connectors-view",
		children: [
			/* @__PURE__ */ (0, x.jsxs)("div", {
				className: "connector-toolbar",
				children: [/* @__PURE__ */ (0, x.jsx)("p", {
					className: "connector-intro",
					children: c("Trouvez les services de votre application et les outils pour la vérifier. Configuration et disponibilité restent distinctes.", t)
				}), /* @__PURE__ */ (0, x.jsx)("button", {
					type: "button",
					className: "connector-refresh",
					onClick: l,
					disabled: a,
					children: c("Actualiser les états", t)
				})]
			}),
			i ? /* @__PURE__ */ (0, x.jsx)("p", {
				role: "alert",
				className: "connector-error",
				children: c(i, t)
			}) : null,
			r ? null : /* @__PURE__ */ (0, x.jsx)("p", {
				role: "status",
				children: c(i ? "Aucun état de connexion confirmé." : "Lecture du catalogue…", t)
			}),
			/* @__PURE__ */ (0, x.jsx)("div", {
				ref: p,
				hidden: !!y,
				children: /* @__PURE__ */ (0, x.jsx)(D, {
					report: r,
					contextual: !!e.checkId,
					selectedId: y?.id || d.lastSelected,
					onOpen: (e, t) => {
						h.current = t, f({
							detail: e,
							lastSelected: e
						});
					}
				})
			}),
			y && w ? /* @__PURE__ */ (0, x.jsxs)("div", {
				className: "connector-detail-page",
				children: [/* @__PURE__ */ (0, x.jsx)("button", {
					type: "button",
					className: "connector-back",
					ref: v,
					onClick: O,
					children: s("← Retour au catalogue", "← Back to catalog", t)
				}), /* @__PURE__ */ (0, x.jsx)(T, {
					...e,
					option: y,
					connection: S,
					busy: a,
					action: o,
					refresh: l,
					draft: w,
					onDraft: (e) => u.update(y.id, w, e),
					onSaved: (e, t) => u.saved(y.id, e, t),
					guideReady: E.ready,
					guidePanel: /* @__PURE__ */ (0, x.jsx)(j, {
						controller: E,
						persistence: u.persistence,
						input: w.guide,
						busy: a,
						onChange: (e) => u.update(y.id, w, { guide: e })
					})
				}, y.id)]
			}) : null,
			r ? /* @__PURE__ */ (0, x.jsxs)("details", {
				className: "connector-report-limits",
				children: [/* @__PURE__ */ (0, x.jsx)("summary", { children: c("Ce que DevMethod prend en charge", t) }), /* @__PURE__ */ (0, x.jsx)("ul", { children: r.limits.map((e) => /* @__PURE__ */ (0, x.jsx)("li", { children: e }, e)) })]
			}) : null
		]
	});
}
//#endregion
//#region studio-ui/src/connectors-widget.tsx
function N(e, t) {
	i(e.ownerDocument, e.ownerDocument.defaultView ?? void 0);
	let n = (0, h.createRoot)(e), r = (e) => n.render(/* @__PURE__ */ (0, x.jsx)(M, { ...e }, e.checkId || "catalog"));
	return r(t), {
		update: r,
		dispose: () => n.unmount()
	};
}
//#endregion
export { N as mountConnectorsWidget };
