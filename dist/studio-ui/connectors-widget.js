import { n as e, r as t, t as n } from "./jsx-runtime-Bz8zB3tG.js";
import { t as r } from "./ConnectorIcon-CFT0KtGV.js";
//#region studio-ui/src/features/connectors/model/catalog.ts
var i = t(), a = e();
function o(e, t, n) {
	let r = e.filter((e) => e.checkIds.includes(n || ""));
	for (let e of ["attested", "configured"]) {
		let n = r.find((n) => t.some((t) => t.optionId === n.id && t.status === e));
		if (n) return n;
	}
	return r.find((e) => e.transport === "local") || r[0];
}
function s(e) {
	return e.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("fr-FR");
}
function c(e) {
	return e ? e.status === "attested" ? "Disponibilité attestée" : e.status === "failed" ? "Connexion à revoir" : "Configuré · à vérifier" : "À configurer";
}
//#endregion
//#region studio-ui/src/features/connectors/hooks/useConnectors.ts
async function l(e) {
	let t = await e.json();
	if (!e.ok) throw Error(t.error || "Le service des connecteurs ne répond pas.");
	return t;
}
function u(e) {
	let [t, n] = (0, i.useState)(null), [r, a] = (0, i.useState)(""), [o, s] = (0, i.useState)(!1), [c, u] = (0, i.useState)(0), d = (0, i.useRef)(0), f = (0, i.useRef)(null);
	(0, i.useEffect)(() => {
		let t = new AbortController(), r = ++d.current;
		return a(""), s(!1), fetch("/api/connectors?" + new URLSearchParams(e ? { revision: e } : {}), {
			signal: AbortSignal.any([t.signal, AbortSignal.timeout(15e3)]),
			cache: "no-store"
		}).then(l).then((i) => {
			if (!(r !== d.current || t.signal.aborted)) {
				if (i.schemaVersion !== 1 || !i.catalog || !Array.isArray(i.connections)) throw Error("Catalogue illisible. Aucun état de connexion confirmé.");
				if (e !== null && i.revisionId !== e) throw Error("Le catalogue concerne une autre version.");
				n({
					revision: e,
					data: i
				});
			}
		}).catch((e) => {
			!t.signal.aborted && r === d.current && a(e instanceof Error ? e.message : "Chargement impossible.");
		}), () => {
			d.current = r + 1, t.abort(), f.current?.abort(), f.current = null;
		};
	}, [e, c]);
	async function p(e, t) {
		if (f.current) return null;
		let n = new AbortController();
		f.current = n;
		let r = d.current;
		s(!0), a("");
		try {
			let i = await l(await fetch("/api/connectors/" + e, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(t),
				signal: AbortSignal.any([n.signal, AbortSignal.timeout(15e3)])
			}));
			return n.signal.aborted || r !== d.current ? null : i;
		} catch (e) {
			return !n.signal.aborted && r === d.current && a(e instanceof Error ? e.message : "Action non confirmée. Actualisez pour vérifier."), null;
		} finally {
			r === d.current && (f.current = null, s(!1));
		}
	}
	return {
		report: t?.revision === e ? t.data : null,
		error: r,
		busy: o,
		action: p,
		refresh: () => u((e) => e + 1)
	};
}
//#endregion
//#region studio-ui/src/features/connectors/components/ConnectionDetail.tsx
var d = n();
function f(e) {
	return e ? e.status === "failed" ? "Échec de la vérification de connexion" : e.status === "attested" ? "Disponibilité attestée par l’agent hôte" : "Configuré · connexion à vérifier" : "À configurer";
}
function p(e, t) {
	return [
		`Vérifier la disponibilité du connecteur ${t.title} pour ce projet.`,
		`Connexion : ${e.id}, configuration ${e.version}. Profil : ${e.profileRef || "à préciser dans l’hôte"}.`,
		`Capacités attendues : ${t.capabilities.join(", ")}. Documentation : ${t.docs}`,
		"Utiliser uniquement les accès autorisés dans l’agent hôte. Ne pas envoyer de message, provisionner ou modifier les données pour cette vérification.",
		"Publier le résultat via le bridge worker POST /api/connectors/probe avec connectionId, connectionVersion, eventId unique, status available ou failed, tool {name, version}, capabilities, observedAt, summary et tools si MCP. Ne publier available qu’après une réponse réelle ; une configuration ne prouve pas la connexion. Aucune clé ni sortie sensible dans le rapport."
	].join("\n");
}
function m(e) {
	let { option: t, connection: n, revisionId: r, busy: a, action: o, refresh: s, onPrepareRequest: c } = e, [l, u] = (0, i.useState)(n?.profileRef || ""), [m, h] = (0, i.useState)(n?.secretRefs.join("\n") || ""), [g, _] = (0, i.useState)(t.checkIds.includes(e.checkId || "") ? e.checkId : t.checkIds[0] || ""), [v, y] = (0, i.useState)(t.capabilities[0] || "");
	async function b(e) {
		e.preventDefault(), await o("configure", {
			id: n?.id || t.id,
			optionId: t.id,
			purpose: t.purpose,
			...l.trim() ? { profileRef: l.trim() } : {},
			secretRefs: m.split("\n").map((e) => e.trim()).filter(Boolean),
			...n ? { expectedVersion: n.version } : {}
		}) && s();
	}
	async function x() {
		if (!n || !r) return;
		let e = await o(t.purpose === "diagnostics" ? "executions" : "prepare", {
			connectionId: n.id,
			revisionId: r,
			...t.purpose === "diagnostics" ? { checkId: g } : { capability: v }
		});
		e && typeof e == "object" && "prompt" in e && typeof e.prompt == "string" && c({ prompt: e.prompt });
	}
	return /* @__PURE__ */ (0, d.jsxs)("section", {
		className: "connector-detail",
		"aria-label": `Configurer ${t.title}`,
		children: [
			/* @__PURE__ */ (0, d.jsx)("h3", { children: t.title }),
			/* @__PURE__ */ (0, d.jsx)("p", {
				className: `connector-state state-${n?.status || "proposed"}`,
				children: f(n)
			}),
			/* @__PURE__ */ (0, d.jsx)("p", { children: t.description }),
			/* @__PURE__ */ (0, d.jsx)("p", {
				className: "connector-cost",
				children: t.cost
			}),
			/* @__PURE__ */ (0, d.jsx)("a", {
				href: t.docs,
				target: "_blank",
				rel: "noopener noreferrer",
				children: "Documentation officielle ↗"
			}),
			/* @__PURE__ */ (0, d.jsxs)("form", {
				onSubmit: (e) => void b(e),
				children: [
					/* @__PURE__ */ (0, d.jsxs)("label", { children: [
						"Profil dans l’agent hôte",
						" ",
						/* @__PURE__ */ (0, d.jsx)("input", {
							value: l,
							onChange: (e) => u(e.target.value),
							placeholder: "host:mon-profil",
							pattern: "host:[A-Za-z0-9_.-]+"
						})
					] }),
					/* @__PURE__ */ (0, d.jsxs)("label", { children: [
						"Références des accès, une par ligne",
						" ",
						/* @__PURE__ */ (0, d.jsx)("textarea", {
							value: m,
							onChange: (e) => h(e.target.value),
							placeholder: "env:NOM_DE_VARIABLE\nhost:nom-du-secret",
							rows: 2
						})
					] }),
					/* @__PURE__ */ (0, d.jsx)("p", {
						className: "connector-note",
						children: "Indiquez les noms des accès conservés dans l’hôte. Ne collez aucune clé secrète. Enregistrer ne connecte ni n’installe un service."
					}),
					/* @__PURE__ */ (0, d.jsx)("button", {
						type: "submit",
						disabled: a,
						children: n ? "Enregistrer les réglages" : "Enregistrer la configuration"
					})
				]
			}),
			n ? /* @__PURE__ */ (0, d.jsxs)(d.Fragment, { children: [
				/* @__PURE__ */ (0, d.jsx)("button", {
					type: "button",
					disabled: a,
					onClick: () => c({ prompt: p(n, t) }),
					children: "Préparer la vérification de connexion →"
				}),
				n.probe ? /* @__PURE__ */ (0, d.jsxs)("div", {
					className: "connector-probe",
					children: [/* @__PURE__ */ (0, d.jsx)("p", { children: n.probe.summary }), /* @__PURE__ */ (0, d.jsxs)("small", { children: [
						n.probe.tool.name,
						" · ",
						n.probe.tool.version,
						" · constat du",
						" ",
						new Date(n.probe.observedAt).toLocaleString("fr-FR")
					] })]
				}) : null,
				t.purpose === "diagnostics" ? /* @__PURE__ */ (0, d.jsxs)("label", { children: ["Contrôle à exécuter", /* @__PURE__ */ (0, d.jsx)("select", {
					value: g,
					onChange: (e) => _(e.target.value),
					children: t.checkIds.map((e) => /* @__PURE__ */ (0, d.jsx)("option", {
						value: e,
						children: e
					}, e))
				})] }) : /* @__PURE__ */ (0, d.jsxs)("label", { children: ["Capacité à intégrer", /* @__PURE__ */ (0, d.jsx)("select", {
					value: v,
					onChange: (e) => y(e.target.value),
					children: t.capabilities.map((e) => /* @__PURE__ */ (0, d.jsx)("option", {
						value: e,
						children: e
					}, e))
				})] }),
				/* @__PURE__ */ (0, d.jsx)("button", {
					type: "button",
					className: "primary",
					disabled: a || !r || t.purpose === "diagnostics" && (n.status !== "attested" || !g),
					onClick: () => void x(),
					children: t.purpose === "diagnostics" ? "Préparer l’exécution avec l’agent hôte →" : "Préparer l’intégration au projet →"
				}),
				/* @__PURE__ */ (0, d.jsxs)("p", {
					className: "connector-note",
					children: [r ? `Version ciblée : ${r.slice(0, 8)}. ` : "Une version du projet est nécessaire. ", t.purpose === "diagnostics" ? "Le résultat reçu sera rattaché aux sources contrôlées." : "La demande prépare une évolution du code. Aucun service n’est provisionné et aucun e-mail n’est envoyé."]
				})
			] }) : null,
			/* @__PURE__ */ (0, d.jsxs)("details", { children: [/* @__PURE__ */ (0, d.jsx)("summary", { children: "Portée et limites" }), /* @__PURE__ */ (0, d.jsx)("ul", { children: t.limits.map((e) => /* @__PURE__ */ (0, d.jsx)("li", { children: e }, e)) })] })
		]
	});
}
//#endregion
//#region studio-ui/src/features/connectors/components/ConnectorCatalog.tsx
function h({ report: e, contextual: t, selectedId: n, onOpen: a }) {
	let [o, l] = (0, i.useState)(t ? "diagnostics" : "application"), [u, f] = (0, i.useState)("all"), [p, m] = (0, i.useState)(""), [h, g] = (0, i.useState)(!1);
	if (!e) return null;
	let _ = new Map(e.connections.map((e) => [e.optionId, e])), v = e.catalog.capabilities.filter((e) => e.purpose === o), y = s(p.trim()), b = e.catalog.options.filter((e) => e.purpose === o && s(`${e.title} ${e.description} ${e.capabilities.join(" ")}`).includes(y)), x = b.filter((e) => _.has(e.id)).length, S = b.filter((e) => !h || _.has(e.id)), C = [{
		id: "all",
		title: "Toutes les catégories",
		count: S.length
	}, ...v.map((e) => ({
		id: e.id,
		title: e.title,
		count: S.filter((t) => t.capabilities.includes(e.id)).length
	}))], w = S.filter((e) => u === "all" || e.capabilities.includes(u));
	return /* @__PURE__ */ (0, d.jsxs)("div", {
		className: "connector-catalog",
		children: [/* @__PURE__ */ (0, d.jsxs)("div", {
			className: "connector-browse-toolbar",
			children: [/* @__PURE__ */ (0, d.jsx)("nav", {
				className: "connector-purpose",
				"aria-label": "Usage des connecteurs",
				children: ["application", "diagnostics"].map((e) => /* @__PURE__ */ (0, d.jsx)("button", {
					type: "button",
					"aria-pressed": o === e,
					onClick: () => {
						l(e), f("all");
					},
					children: e === "application" ? "Services de l’application" : "Diagnostic et vérifications"
				}, e))
			}), /* @__PURE__ */ (0, d.jsxs)("label", {
				className: "connector-search",
				children: [/* @__PURE__ */ (0, d.jsx)("span", {
					className: "connector-sr",
					children: "Rechercher un outil ou un service"
				}), /* @__PURE__ */ (0, d.jsx)("input", {
					type: "search",
					name: "connector-search",
					autoComplete: "off",
					spellCheck: !1,
					value: p,
					onChange: (e) => m(e.target.value),
					placeholder: "Rechercher un outil ou un service…"
				})]
			})]
		}), /* @__PURE__ */ (0, d.jsxs)("div", {
			className: "connector-catalog-layout",
			children: [/* @__PURE__ */ (0, d.jsxs)("nav", {
				className: "connector-categories",
				"aria-label": "Catégories des connecteurs",
				children: [/* @__PURE__ */ (0, d.jsx)("span", {
					className: "connector-section-label",
					children: "Catégories"
				}), C.map((e) => /* @__PURE__ */ (0, d.jsxs)("button", {
					type: "button",
					"aria-pressed": u === e.id,
					onClick: () => f(e.id),
					children: [/* @__PURE__ */ (0, d.jsx)("span", { children: e.title }), /* @__PURE__ */ (0, d.jsx)("span", {
						className: "connector-count",
						children: e.count
					})]
				}, e.id))]
			}), /* @__PURE__ */ (0, d.jsxs)("div", {
				className: "connector-catalog-main",
				children: [
					/* @__PURE__ */ (0, d.jsxs)("label", {
						className: "connector-mobile-category",
						children: ["Catégorie", /* @__PURE__ */ (0, d.jsx)("select", {
							value: u,
							onChange: (e) => f(e.target.value),
							children: C.map((e) => /* @__PURE__ */ (0, d.jsxs)("option", {
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
					/* @__PURE__ */ (0, d.jsxs)("div", {
						className: "connector-results-toolbar",
						children: [/* @__PURE__ */ (0, d.jsxs)("nav", {
							className: "connector-filter-tabs",
							"aria-label": "État de configuration",
							children: [/* @__PURE__ */ (0, d.jsxs)("button", {
								type: "button",
								"aria-pressed": !h,
								onClick: () => g(!1),
								children: ["Tous ", /* @__PURE__ */ (0, d.jsx)("span", { children: b.length })]
							}), /* @__PURE__ */ (0, d.jsxs)("button", {
								type: "button",
								"aria-pressed": h,
								onClick: () => g(!0),
								children: ["Configurés ", /* @__PURE__ */ (0, d.jsx)("span", { children: x })]
							})]
						}), /* @__PURE__ */ (0, d.jsxs)("span", {
							className: "connector-result-count",
							role: "status",
							children: [
								w.length,
								" solution",
								w.length === 1 ? "" : "s"
							]
						})]
					}),
					/* @__PURE__ */ (0, d.jsx)("div", {
						className: "connector-card-grid",
						"aria-label": "Solutions proposées",
						children: w.map((e) => {
							let t = _.get(e.id);
							return /* @__PURE__ */ (0, d.jsxs)("button", {
								className: "connector-card",
								type: "button",
								"aria-label": `Voir ${e.title}`,
								"aria-current": n === e.id ? "true" : void 0,
								onClick: (t) => a(e.id, t.currentTarget),
								children: [
									/* @__PURE__ */ (0, d.jsxs)("span", {
										className: "connector-card-heading",
										children: [
											/* @__PURE__ */ (0, d.jsx)(r, { optionId: e.id }),
											/* @__PURE__ */ (0, d.jsx)("span", {
												className: "connector-card-title",
												children: e.title
											}),
											/* @__PURE__ */ (0, d.jsx)("span", {
												className: "connector-card-arrow",
												"aria-hidden": "true",
												children: "↗"
											})
										]
									}),
									/* @__PURE__ */ (0, d.jsx)("span", {
										className: "connector-card-description",
										children: e.description
									}),
									/* @__PURE__ */ (0, d.jsxs)("span", {
										className: "connector-card-footer",
										children: [/* @__PURE__ */ (0, d.jsx)("span", {
											className: `connector-state state-${t?.status || "proposed"}`,
											children: c(t)
										}), /* @__PURE__ */ (0, d.jsx)("span", {
											className: "connector-transport",
											children: e.transport === "local" ? "Local" : e.transport.toUpperCase()
										})]
									})
								]
							}, e.id);
						})
					}),
					w.length ? null : /* @__PURE__ */ (0, d.jsxs)("div", {
						className: "connector-empty",
						children: [/* @__PURE__ */ (0, d.jsx)("strong", { children: "Aucune solution dans ce filtre" }), /* @__PURE__ */ (0, d.jsx)("p", { children: h ? "Aucun connecteur configuré ne correspond. Consultez Tous pour parcourir les options." : "Essayez une autre recherche ou une autre catégorie." })]
					})
				]
			})]
		})]
	});
}
//#endregion
//#region studio-ui/src/features/connectors/components/ConnectorsView.tsx
function g(e) {
	let { report: t, error: n, busy: r, action: a, refresh: s } = u(e.revisionId), [c, l] = (0, i.useState)({
		detail: e.checkId ? void 0 : null,
		lastSelected: null
	}), f = (0, i.useRef)(null), p = (0, i.useRef)(null), g = (0, i.useRef)(!1), _ = (0, i.useCallback)((e) => e?.focus(), []), v = t && (c.detail === void 0 ? o(t.catalog.options, t.connections, e.checkId) : t.catalog.options.find((e) => e.id === c.detail)), y = t?.connections.find((e) => e.optionId === v?.id), b = v?.id;
	(0, i.useLayoutEffect)(() => {
		!b && g.current && (g.current = !1, (p.current?.isConnected ? p.current : f.current?.querySelector("input[type=\"search\"]"))?.focus());
	}, [b]);
	function x() {
		g.current = !0, l({
			detail: null,
			lastSelected: v?.id || c.lastSelected
		});
	}
	return /* @__PURE__ */ (0, d.jsxs)("div", {
		className: "connectors-view",
		children: [
			/* @__PURE__ */ (0, d.jsxs)("div", {
				className: "connector-toolbar",
				children: [/* @__PURE__ */ (0, d.jsx)("p", {
					className: "connector-intro",
					children: "Trouvez les services de votre application et les outils pour la vérifier. Configuration et disponibilité restent distinctes."
				}), /* @__PURE__ */ (0, d.jsx)("button", {
					type: "button",
					className: "connector-refresh",
					onClick: s,
					disabled: r,
					children: "Actualiser les états"
				})]
			}),
			n ? /* @__PURE__ */ (0, d.jsx)("p", {
				role: "alert",
				className: "connector-error",
				children: n
			}) : null,
			t ? null : /* @__PURE__ */ (0, d.jsx)("p", {
				role: "status",
				children: n ? "Aucun état de connexion confirmé." : "Lecture du catalogue…"
			}),
			/* @__PURE__ */ (0, d.jsx)("div", {
				ref: f,
				hidden: !!v,
				children: /* @__PURE__ */ (0, d.jsx)(h, {
					report: t,
					contextual: !!e.checkId,
					selectedId: v?.id || c.lastSelected,
					onOpen: (e, t) => {
						p.current = t, l({
							detail: e,
							lastSelected: e
						});
					}
				})
			}),
			v ? /* @__PURE__ */ (0, d.jsxs)("div", {
				className: "connector-detail-page",
				children: [/* @__PURE__ */ (0, d.jsx)("button", {
					type: "button",
					className: "connector-back",
					ref: _,
					onClick: x,
					children: "← Retour au catalogue"
				}), /* @__PURE__ */ (0, d.jsx)(m, {
					...e,
					option: v,
					connection: y,
					busy: r,
					action: a,
					refresh: s
				}, v.id + ":" + (y?.version || 0))]
			}) : null,
			t ? /* @__PURE__ */ (0, d.jsxs)("details", {
				className: "connector-report-limits",
				children: [/* @__PURE__ */ (0, d.jsx)("summary", { children: "Ce que DevMethod prend en charge" }), /* @__PURE__ */ (0, d.jsx)("ul", { children: t.limits.map((e) => /* @__PURE__ */ (0, d.jsx)("li", { children: e }, e)) })]
			}) : null
		]
	});
}
//#endregion
//#region studio-ui/src/connectors-widget.tsx
function _(e, t) {
	let n = (0, a.createRoot)(e), r = (e) => n.render(/* @__PURE__ */ (0, d.jsx)(g, { ...e }, e.checkId || "catalog"));
	return r(t), {
		update: r,
		dispose: () => n.unmount()
	};
}
//#endregion
export { _ as mountConnectorsWidget };
