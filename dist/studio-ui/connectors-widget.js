import { i as e, n as t, t as n } from "./jsx-runtime-D7gWoUTT.js";
import { a as r, c as i, n as a, o, r as s, t as c, u as l } from "./ConnectorGuide-66T_yuwk.js";
//#region studio-ui/src/features/connectors/model/catalog.ts
var u = e(), d = t();
function f(e, t, n) {
	let r = e.filter((e) => e.checkIds.includes(n || ""));
	for (let e of ["attested", "configured"]) {
		let n = r.find((n) => t.some((t) => t.optionId === n.id && t.status === e));
		if (n) return n;
	}
	return r.find((e) => e.transport === "local") || r[0];
}
function p(e) {
	return e.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("fr-FR");
}
function m(e) {
	return e ? e.status === "attested" ? "Disponibilité attestée" : e.status === "failed" ? "Connexion à revoir" : "Configuré · à vérifier" : "À configurer";
}
//#endregion
//#region studio-ui/src/features/connectors/hooks/useConnectors.ts
async function h(e) {
	let t = await e.json();
	if (!e.ok) throw Error(t.error || "Le service des connecteurs ne répond pas.");
	return t;
}
function g(e) {
	let [t, n] = (0, u.useState)(null), [r, i] = (0, u.useState)(""), [a, o] = (0, u.useState)(!1), [s, c] = (0, u.useState)(0), l = (0, u.useRef)(0), d = (0, u.useRef)(null);
	(0, u.useEffect)(() => {
		let t = new AbortController(), r = ++l.current;
		return i(""), o(!1), fetch("/api/connectors?" + new URLSearchParams(e ? { revision: e } : {}), {
			signal: AbortSignal.any([t.signal, AbortSignal.timeout(15e3)]),
			cache: "no-store"
		}).then(h).then((i) => {
			if (!(r !== l.current || t.signal.aborted)) {
				if (i.schemaVersion !== 1 || !i.catalog || !Array.isArray(i.connections)) throw Error("Catalogue illisible. Aucun état de connexion confirmé.");
				if (e !== null && i.revisionId !== e) throw Error("Le catalogue concerne une autre version.");
				n({
					revision: e,
					data: i
				});
			}
		}).catch((e) => {
			!t.signal.aborted && r === l.current && i(e instanceof Error ? e.message : "Chargement impossible.");
		}), () => {
			l.current = r + 1, t.abort(), d.current?.abort(), d.current = null;
		};
	}, [e, s]);
	async function f(e, t) {
		if (d.current) return null;
		let n = new AbortController();
		d.current = n;
		let r = l.current;
		o(!0), i("");
		try {
			let i = await h(await fetch("/api/connectors/" + e, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(t),
				signal: AbortSignal.any([n.signal, AbortSignal.timeout(15e3)])
			}));
			return n.signal.aborted || r !== l.current ? null : i;
		} catch (e) {
			return !n.signal.aborted && r === l.current && i(e instanceof Error ? e.message : "Action non confirmée. Actualisez pour vérifier."), null;
		} finally {
			r === l.current && (d.current = null, o(!1));
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
var _ = n();
function v(e) {
	return e ? e.status === "failed" ? "Échec de la vérification de connexion" : e.status === "attested" ? "Disponibilité attestée par l’agent hôte" : "Configuré · connexion à vérifier" : "À configurer";
}
function y(e, t) {
	return [
		`Vérifier la disponibilité du connecteur ${t.title} pour ce projet.`,
		`Connexion : ${e.id}, configuration ${e.version}. Profil : ${e.profileRef || "à préciser dans l’hôte"}.`,
		`Capacités attendues : ${t.capabilities.join(", ")}. Documentation : ${t.docs}`,
		"Utiliser uniquement les accès autorisés dans l’agent hôte. Ne pas envoyer de message, provisionner ou modifier les données pour cette vérification.",
		"Publier le résultat via le bridge worker POST /api/connectors/probe avec connectionId, connectionVersion, eventId unique, status available ou failed, tool {name, version}, capabilities, observedAt, summary et tools si MCP. Ne publier available qu’après une réponse réelle ; une configuration ne prouve pas la connexion. Aucune clé ni sortie sensible dans le rapport."
	].join("\n");
}
function b({ draft: e, version: t }) {
	return !e.dirty || e.baseVersion === t ? null : /* @__PURE__ */ (0, _.jsx)("p", {
		role: "alert",
		className: "connector-error",
		children: "La configuration a changé. Vos réponses sont conservées ; relisez la version enregistrée avant de les remplacer."
	});
}
function x(e) {
	let { option: t, connection: n, revisionId: r, busy: a, action: o, refresh: s, onPrepareRequest: c, draft: l, onDraft: u } = e, { profile: d, references: f, control: p, capability: m } = l;
	async function h(r) {
		if (r.preventDefault(), a || e.guideReady === !1) return;
		let i = await o("configure", {
			id: n?.id || t.id,
			optionId: t.id,
			purpose: t.purpose,
			...d.trim() ? { profileRef: d.trim() } : {},
			secretRefs: f.split("\n").map((e) => e.trim()).filter(Boolean),
			expectedVersion: l.baseVersion,
			...l.guide ? { guide: l.guide } : {}
		});
		if (i && typeof i == "object" && "connections" in i && Array.isArray(i.connections)) {
			let n = i.connections.find((e) => e.optionId === t.id);
			n && e.onSaved(l, n.version), s();
		}
	}
	async function g() {
		if (!n || !r || a || l.dirty) return;
		let e = await o(t.purpose === "diagnostics" ? "executions" : "prepare", {
			connectionId: n.id,
			revisionId: r,
			...t.purpose === "diagnostics" ? { checkId: p } : { capability: m }
		});
		e && typeof e == "object" && "prompt" in e && typeof e.prompt == "string" && c({
			prompt: e.prompt,
			..."connectorGuides" in e && Array.isArray(e.connectorGuides) ? { connectorGuides: e.connectorGuides.map(i) } : {}
		});
	}
	return /* @__PURE__ */ (0, _.jsxs)("section", {
		className: "connector-detail",
		"aria-label": `Configurer ${t.title}`,
		children: [
			/* @__PURE__ */ (0, _.jsx)("h3", { children: t.title }),
			/* @__PURE__ */ (0, _.jsx)("p", {
				className: `connector-state state-${n?.status || "proposed"}`,
				children: v(n)
			}),
			/* @__PURE__ */ (0, _.jsx)("p", { children: t.description }),
			/* @__PURE__ */ (0, _.jsx)("p", {
				className: "connector-cost",
				children: t.cost
			}),
			/* @__PURE__ */ (0, _.jsx)("a", {
				href: t.docs,
				target: "_blank",
				rel: "noopener noreferrer",
				children: "Documentation officielle ↗"
			}),
			e.guidePanel,
			/* @__PURE__ */ (0, _.jsx)(b, {
				draft: l,
				version: n?.version || 0
			}),
			/* @__PURE__ */ (0, _.jsxs)("form", {
				onSubmit: (e) => void h(e),
				children: [/* @__PURE__ */ (0, _.jsxs)("details", {
					className: "connector-advanced",
					children: [
						/* @__PURE__ */ (0, _.jsx)("summary", { children: "Configuration avancée" }),
						/* @__PURE__ */ (0, _.jsxs)("label", { children: [
							"Profil dans l’agent hôte",
							" ",
							/* @__PURE__ */ (0, _.jsx)("input", {
								value: d,
								onChange: (e) => u({ profile: e.target.value }),
								disabled: a,
								name: "connector-profile",
								autoComplete: "off",
								placeholder: "host:mon-profil",
								pattern: "host:[A-Za-z0-9_.-]+"
							})
						] }),
						/* @__PURE__ */ (0, _.jsxs)("label", { children: [
							"Références des accès, une par ligne",
							" ",
							/* @__PURE__ */ (0, _.jsx)("textarea", {
								value: f,
								onChange: (e) => u({ references: e.target.value }),
								disabled: a,
								name: "connector-secret-references",
								autoComplete: "off",
								spellCheck: !1,
								placeholder: "env:NOM_DE_VARIABLE\nhost:nom-du-secret",
								rows: 2
							})
						] }),
						/* @__PURE__ */ (0, _.jsx)("p", {
							className: "connector-note",
							children: "Indiquez les noms des accès conservés dans l’hôte. Ne collez aucune clé secrète. Enregistrer ne connecte ni n’installe un service."
						})
					]
				}), /* @__PURE__ */ (0, _.jsx)("button", {
					type: "submit",
					disabled: a || e.guideReady === !1,
					children: n ? "Enregistrer les réglages" : "Enregistrer la configuration"
				})]
			}),
			n ? /* @__PURE__ */ (0, _.jsxs)(_.Fragment, { children: [
				l.dirty ? /* @__PURE__ */ (0, _.jsx)("p", {
					className: "connector-note",
					children: "Enregistrez les réglages avant de préparer une demande avec cette configuration."
				}) : null,
				/* @__PURE__ */ (0, _.jsx)("button", {
					type: "button",
					disabled: a || l.dirty,
					onClick: () => c({ prompt: y(n, t) }),
					children: "Préparer la vérification de connexion →"
				}),
				n.probe ? /* @__PURE__ */ (0, _.jsxs)("div", {
					className: "connector-probe",
					children: [/* @__PURE__ */ (0, _.jsx)("p", { children: n.probe.summary }), /* @__PURE__ */ (0, _.jsxs)("small", { children: [
						n.probe.tool.name,
						" · ",
						n.probe.tool.version,
						" · constat du",
						" ",
						new Date(n.probe.observedAt).toLocaleString("fr-FR")
					] })]
				}) : null,
				t.purpose === "diagnostics" ? /* @__PURE__ */ (0, _.jsxs)("label", { children: ["Contrôle à exécuter", /* @__PURE__ */ (0, _.jsx)("select", {
					value: p,
					disabled: a,
					onChange: (e) => u({ control: e.target.value }),
					children: t.checkIds.map((e) => /* @__PURE__ */ (0, _.jsx)("option", {
						value: e,
						children: e
					}, e))
				})] }) : /* @__PURE__ */ (0, _.jsxs)("label", { children: ["Capacité à intégrer", /* @__PURE__ */ (0, _.jsx)("select", {
					value: m,
					disabled: a,
					onChange: (e) => u({ capability: e.target.value }),
					children: t.capabilities.map((e) => /* @__PURE__ */ (0, _.jsx)("option", {
						value: e,
						children: e
					}, e))
				})] }),
				/* @__PURE__ */ (0, _.jsx)("button", {
					type: "button",
					className: "primary",
					disabled: a || l.dirty || !r || t.purpose === "diagnostics" && (n.status !== "attested" || !p),
					onClick: () => void g(),
					children: t.purpose === "diagnostics" ? "Préparer l’exécution avec l’agent hôte →" : "Préparer l’intégration au projet →"
				}),
				/* @__PURE__ */ (0, _.jsxs)("p", {
					className: "connector-note",
					children: [r ? `Version ciblée : ${r.slice(0, 8)}. ` : "Une version du projet est nécessaire. ", t.purpose === "diagnostics" ? "Le résultat reçu sera rattaché aux sources contrôlées." : "La demande prépare une évolution du code. Aucun service n’est provisionné et aucun e-mail n’est envoyé."]
				})
			] }) : null,
			/* @__PURE__ */ (0, _.jsxs)("details", { children: [/* @__PURE__ */ (0, _.jsx)("summary", { children: "Portée et limites" }), /* @__PURE__ */ (0, _.jsx)("ul", { children: t.limits.map((e) => /* @__PURE__ */ (0, _.jsx)("li", { children: e }, e)) })] })
		]
	});
}
//#endregion
//#region studio-ui/src/features/connectors/components/ConnectorCatalog.tsx
function S({ report: e, contextual: t, selectedId: n, onOpen: r }) {
	let [i, a] = (0, u.useState)(t ? "diagnostics" : "application"), [o, s] = (0, u.useState)("all"), [c, d] = (0, u.useState)(""), [f, h] = (0, u.useState)(!1);
	if (!e) return null;
	let g = new Map(e.connections.map((e) => [e.optionId, e])), v = e.catalog.capabilities.filter((e) => e.purpose === i), y = p(c.trim()), b = e.catalog.options.filter((e) => e.purpose === i && p(`${e.title} ${e.description} ${e.capabilities.join(" ")}`).includes(y)), x = b.filter((e) => g.has(e.id)).length, S = b.filter((e) => !f || g.has(e.id)), C = [{
		id: "all",
		title: "Toutes les catégories",
		count: S.length
	}, ...v.map((e) => ({
		id: e.id,
		title: e.title,
		count: S.filter((t) => t.capabilities.includes(e.id)).length
	}))], w = S.filter((e) => o === "all" || e.capabilities.includes(o));
	return /* @__PURE__ */ (0, _.jsxs)("div", {
		className: "connector-catalog",
		children: [/* @__PURE__ */ (0, _.jsxs)("div", {
			className: "connector-browse-toolbar",
			children: [/* @__PURE__ */ (0, _.jsx)("nav", {
				className: "connector-purpose",
				"aria-label": "Usage des connecteurs",
				children: ["application", "diagnostics"].map((e) => /* @__PURE__ */ (0, _.jsx)("button", {
					type: "button",
					"aria-pressed": i === e,
					onClick: () => {
						a(e), s("all");
					},
					children: e === "application" ? "Services de l’application" : "Diagnostic et vérifications"
				}, e))
			}), /* @__PURE__ */ (0, _.jsxs)("label", {
				className: "connector-search",
				children: [/* @__PURE__ */ (0, _.jsx)("span", {
					className: "connector-sr",
					children: "Rechercher un outil ou un service"
				}), /* @__PURE__ */ (0, _.jsx)("input", {
					type: "search",
					name: "connector-search",
					autoComplete: "off",
					spellCheck: !1,
					value: c,
					onChange: (e) => d(e.target.value),
					placeholder: "Rechercher un outil ou un service…"
				})]
			})]
		}), /* @__PURE__ */ (0, _.jsxs)("div", {
			className: "connector-catalog-layout",
			children: [/* @__PURE__ */ (0, _.jsxs)("nav", {
				className: "connector-categories",
				"aria-label": "Catégories des connecteurs",
				children: [/* @__PURE__ */ (0, _.jsx)("span", {
					className: "connector-section-label",
					children: "Catégories"
				}), C.map((e) => /* @__PURE__ */ (0, _.jsxs)("button", {
					type: "button",
					"aria-pressed": o === e.id,
					onClick: () => s(e.id),
					children: [/* @__PURE__ */ (0, _.jsx)("span", { children: e.title }), /* @__PURE__ */ (0, _.jsx)("span", {
						className: "connector-count",
						children: e.count
					})]
				}, e.id))]
			}), /* @__PURE__ */ (0, _.jsxs)("div", {
				className: "connector-catalog-main",
				children: [
					/* @__PURE__ */ (0, _.jsxs)("label", {
						className: "connector-mobile-category",
						children: ["Catégorie", /* @__PURE__ */ (0, _.jsx)("select", {
							value: o,
							onChange: (e) => s(e.target.value),
							children: C.map((e) => /* @__PURE__ */ (0, _.jsxs)("option", {
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
					/* @__PURE__ */ (0, _.jsxs)("div", {
						className: "connector-results-toolbar",
						children: [/* @__PURE__ */ (0, _.jsxs)("nav", {
							className: "connector-filter-tabs",
							"aria-label": "État de configuration",
							children: [/* @__PURE__ */ (0, _.jsxs)("button", {
								type: "button",
								"aria-pressed": !f,
								onClick: () => h(!1),
								children: ["Tous ", /* @__PURE__ */ (0, _.jsx)("span", { children: b.length })]
							}), /* @__PURE__ */ (0, _.jsxs)("button", {
								type: "button",
								"aria-pressed": f,
								onClick: () => h(!0),
								children: ["Configurés ", /* @__PURE__ */ (0, _.jsx)("span", { children: x })]
							})]
						}), /* @__PURE__ */ (0, _.jsxs)("span", {
							className: "connector-result-count",
							role: "status",
							children: [
								w.length,
								" solution",
								w.length === 1 ? "" : "s"
							]
						})]
					}),
					/* @__PURE__ */ (0, _.jsx)("div", {
						className: "connector-card-grid",
						"aria-label": "Solutions proposées",
						children: w.map((e) => {
							let t = g.get(e.id);
							return /* @__PURE__ */ (0, _.jsxs)("button", {
								className: "connector-card",
								type: "button",
								"aria-label": `Voir ${e.title}`,
								"aria-current": n === e.id ? "true" : void 0,
								onClick: (t) => r(e.id, t.currentTarget),
								children: [
									/* @__PURE__ */ (0, _.jsxs)("span", {
										className: "connector-card-heading",
										children: [
											/* @__PURE__ */ (0, _.jsx)(l, { optionId: e.id }),
											/* @__PURE__ */ (0, _.jsx)("span", {
												className: "connector-card-title",
												children: e.title
											}),
											/* @__PURE__ */ (0, _.jsx)("span", {
												className: "connector-card-arrow",
												"aria-hidden": "true",
												children: "↗"
											})
										]
									}),
									/* @__PURE__ */ (0, _.jsx)("span", {
										className: "connector-card-description",
										children: e.description
									}),
									/* @__PURE__ */ (0, _.jsxs)("span", {
										className: "connector-card-footer",
										children: [/* @__PURE__ */ (0, _.jsx)("span", {
											className: `connector-state state-${t?.status || "proposed"}`,
											children: m(t)
										}), /* @__PURE__ */ (0, _.jsx)("span", {
											className: "connector-transport",
											children: e.transport === "local" ? "Local" : e.transport.toUpperCase()
										})]
									})
								]
							}, e.id);
						})
					}),
					w.length ? null : /* @__PURE__ */ (0, _.jsxs)("div", {
						className: "connector-empty",
						children: [/* @__PURE__ */ (0, _.jsx)("strong", { children: "Aucune solution dans ce filtre" }), /* @__PURE__ */ (0, _.jsx)("p", { children: f ? "Aucun connecteur configuré ne correspond. Consultez Tous pour parcourir les options." : "Essayez une autre recherche ou une autre catégorie." })]
					})
				]
			})]
		})]
	});
}
//#endregion
//#region studio-ui/src/features/connectors/hooks/useConnectorDrafts.ts
function C(e, t, n) {
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
function w(e) {
	let t = a(), [n, r] = (0, u.useState)({});
	function i(r, i) {
		let a = n[r.id], o = a && (a.dirty || a.baseVersion >= (i?.version || 0)) ? a : C(r, i, e), s = t.drafts[r.id]?.input;
		return !o.dirty && s ? {
			...o,
			guide: s
		} : o;
	}
	function o(e, n, i) {
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
	function s(e, t, n) {
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
		update: o,
		saved: s,
		persistence: t
	};
}
//#endregion
//#region studio-ui/src/features/connectors/hooks/useProjectGuide.ts
function T(e, t) {
	let [n, i] = (0, u.useState)({}), a = r({ enabled: e === "slack" }), c = s(), l = a.guides.find((t) => t.optionId === e), d = e ? n[e] : null, f = d && o(d.input) === o(t) ? d : null;
	async function p(e) {
		let t = await c.prepare(e);
		t && i((n) => ({
			...n,
			[e.optionId]: t
		}));
	}
	return {
		enabled: e === "slack",
		catalog: a,
		request: c,
		definition: l,
		confirmed: f,
		ready: !t || !!f,
		prepare: p
	};
}
//#endregion
//#region studio-ui/src/features/connectors/components/ProjectConnectorGuide.tsx
function E({ controller: e, input: t, busy: n, onChange: r, persistence: i }) {
	if (!e.enabled) return null;
	let { catalog: a, request: o, definition: s, confirmed: l } = e;
	return /* @__PURE__ */ (0, _.jsxs)("div", {
		className: "connector-project-guide",
		children: [
			a.loading ? /* @__PURE__ */ (0, _.jsx)("p", {
				role: "status",
				children: "Lecture du guide fournisseur…"
			}) : null,
			a.error ? /* @__PURE__ */ (0, _.jsxs)("div", { children: [/* @__PURE__ */ (0, _.jsx)("p", {
				role: "alert",
				className: "connector-error",
				children: a.error
			}), /* @__PURE__ */ (0, _.jsx)("button", {
				type: "button",
				onClick: a.refresh,
				children: "Réessayer le guide"
			})] }) : null,
			s ? /* @__PURE__ */ (0, _.jsx)(c, {
				definition: s,
				draft: t,
				preparation: l,
				preparing: o.loading,
				error: o.error,
				disabled: n,
				onChange: (e) => {
					o.reset(), r(e);
				},
				onPrepare: (t) => void e.prepare(t),
				step: i.drafts[s.optionId]?.step,
				onStepChange: (e) => i.edit(s.optionId, t, e)
			}) : null,
			i.error ? /* @__PURE__ */ (0, _.jsxs)("p", {
				role: "alert",
				children: [
					i.error,
					" ",
					/* @__PURE__ */ (0, _.jsx)("button", {
						type: "button",
						onClick: () => void i.retry(),
						children: "Réessayer l’enregistrement"
					})
				]
			}) : null,
			t && !l ? /* @__PURE__ */ (0, _.jsx)("p", {
				className: "connector-note",
				children: "Vérifiez la préparation avant d’enregistrer ces réponses avec les réglages."
			}) : null
		]
	});
}
//#endregion
//#region studio-ui/src/features/connectors/components/ConnectorsView.tsx
function D(e) {
	let { report: t, error: n, busy: r, action: i, refresh: a } = g(e.revisionId), o = w(e.checkId), [s, c] = (0, u.useState)({
		detail: e.checkId ? void 0 : null,
		lastSelected: null
	}), l = (0, u.useRef)(null), d = (0, u.useRef)(null), p = (0, u.useRef)(!1), m = (0, u.useCallback)((e) => e?.focus(), []), h = t && (s.detail === void 0 ? f(t.catalog.options, t.connections, e.checkId) : t.catalog.options.find((e) => e.id === s.detail)), v = t?.connections.find((e) => e.optionId === h?.id), y = h?.id, b = h ? o.get(h, v) : null, C = T(y, b?.guide);
	(0, u.useLayoutEffect)(() => {
		!y && p.current && (p.current = !1, (d.current?.isConnected ? d.current : l.current?.querySelector("input[type=\"search\"]"))?.focus());
	}, [y]);
	function D() {
		C.request.reset(), p.current = !0, c({
			detail: null,
			lastSelected: h?.id || s.lastSelected
		});
	}
	return /* @__PURE__ */ (0, _.jsxs)("div", {
		className: "connectors-view",
		children: [
			/* @__PURE__ */ (0, _.jsxs)("div", {
				className: "connector-toolbar",
				children: [/* @__PURE__ */ (0, _.jsx)("p", {
					className: "connector-intro",
					children: "Trouvez les services de votre application et les outils pour la vérifier. Configuration et disponibilité restent distinctes."
				}), /* @__PURE__ */ (0, _.jsx)("button", {
					type: "button",
					className: "connector-refresh",
					onClick: a,
					disabled: r,
					children: "Actualiser les états"
				})]
			}),
			n ? /* @__PURE__ */ (0, _.jsx)("p", {
				role: "alert",
				className: "connector-error",
				children: n
			}) : null,
			t ? null : /* @__PURE__ */ (0, _.jsx)("p", {
				role: "status",
				children: n ? "Aucun état de connexion confirmé." : "Lecture du catalogue…"
			}),
			/* @__PURE__ */ (0, _.jsx)("div", {
				ref: l,
				hidden: !!h,
				children: /* @__PURE__ */ (0, _.jsx)(S, {
					report: t,
					contextual: !!e.checkId,
					selectedId: h?.id || s.lastSelected,
					onOpen: (e, t) => {
						d.current = t, c({
							detail: e,
							lastSelected: e
						});
					}
				})
			}),
			h && b ? /* @__PURE__ */ (0, _.jsxs)("div", {
				className: "connector-detail-page",
				children: [/* @__PURE__ */ (0, _.jsx)("button", {
					type: "button",
					className: "connector-back",
					ref: m,
					onClick: D,
					children: "← Retour au catalogue"
				}), /* @__PURE__ */ (0, _.jsx)(x, {
					...e,
					option: h,
					connection: v,
					busy: r,
					action: i,
					refresh: a,
					draft: b,
					onDraft: (e) => o.update(h.id, b, e),
					onSaved: (e, t) => o.saved(h.id, e, t),
					guideReady: C.ready,
					guidePanel: /* @__PURE__ */ (0, _.jsx)(E, {
						controller: C,
						persistence: o.persistence,
						input: b.guide,
						busy: r,
						onChange: (e) => o.update(h.id, b, { guide: e })
					})
				}, h.id)]
			}) : null,
			t ? /* @__PURE__ */ (0, _.jsxs)("details", {
				className: "connector-report-limits",
				children: [/* @__PURE__ */ (0, _.jsx)("summary", { children: "Ce que DevMethod prend en charge" }), /* @__PURE__ */ (0, _.jsx)("ul", { children: t.limits.map((e) => /* @__PURE__ */ (0, _.jsx)("li", { children: e }, e)) })]
			}) : null
		]
	});
}
//#endregion
//#region studio-ui/src/connectors-widget.tsx
function O(e, t) {
	let n = (0, d.createRoot)(e), r = (e) => n.render(/* @__PURE__ */ (0, _.jsx)(D, { ...e }, e.checkId || "catalog"));
	return r(t), {
		update: r,
		dispose: () => n.unmount()
	};
}
//#endregion
export { O as mountConnectorsWidget };
