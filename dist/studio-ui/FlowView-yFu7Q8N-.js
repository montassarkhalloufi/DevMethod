import { r as e, t } from "./jsx-runtime-Bz8zB3tG.js";
import { d as n, i as r, n as i } from "./architecture-model-BrTs_SJo.js";
/* empty css                      */
//#region studio-ui/src/features/project/components/FlowView.tsx
var a = e(), o = t();
function s({ id: e, element: t, relations: n, onSelect: a, onOpenSource: s, selectedId: c }) {
	if (!t) return /* @__PURE__ */ (0, o.jsxs)("li", {
		className: "flow-step flow-unresolved",
		children: [/* @__PURE__ */ (0, o.jsx)("span", {
			className: "flow-number",
			"aria-hidden": "true",
			children: "?"
		}), /* @__PURE__ */ (0, o.jsxs)("div", { children: [/* @__PURE__ */ (0, o.jsx)("h4", { children: "Chaînon non résolu" }), /* @__PURE__ */ (0, o.jsxs)("p", { children: [
			"L’élément ",
			e,
			" n’est pas présent dans cette analyse. Le parcours n’est pas complété arbitrairement."
		] })] })]
	});
	let l = t.sources[0];
	return /* @__PURE__ */ (0, o.jsxs)("li", {
		className: "flow-step",
		"data-selected": c === t.id,
		children: [/* @__PURE__ */ (0, o.jsx)("span", {
			className: "flow-number",
			"aria-hidden": "true",
			children: "◇"
		}), /* @__PURE__ */ (0, o.jsxs)("div", {
			className: "flow-step-body",
			children: [
				/* @__PURE__ */ (0, o.jsxs)("div", {
					className: "flow-step-heading",
					children: [/* @__PURE__ */ (0, o.jsx)("button", {
						type: "button",
						"aria-pressed": c === t.id,
						onClick: () => a(t.id),
						children: t.label
					}), /* @__PURE__ */ (0, o.jsx)("span", { children: i[t.type] })]
				}),
				/* @__PURE__ */ (0, o.jsx)("p", { children: t.description }),
				l ? /* @__PURE__ */ (0, o.jsxs)("button", {
					className: "model-source-link",
					type: "button",
					onClick: () => s(l.path, l.line),
					children: [
						l.path,
						l.line ? `:${l.line}` : "",
						" ↗"
					]
				}) : /* @__PURE__ */ (0, o.jsx)("small", { children: "Aucune source reliée." }),
				n.length ? /* @__PURE__ */ (0, o.jsx)("ul", {
					className: "flow-connections",
					children: n.map((e) => /* @__PURE__ */ (0, o.jsxs)("li", { children: [/* @__PURE__ */ (0, o.jsxs)("button", {
						type: "button",
						onClick: () => a(e.id),
						children: [
							r[e.kind],
							" · ",
							e.label
						]
					}), /* @__PURE__ */ (0, o.jsx)("small", { children: e.provenance.map((e) => e.method).join(" · ") })] }, e.id))
				}) : /* @__PURE__ */ (0, o.jsx)("p", {
					className: "arch-note",
					children: "Aucune connexion sortante résolue dans ce périmètre."
				})
			]
		})]
	});
}
function c({ flow: e, revisionId: t }) {
	return e.kind === "observed" ? e.trace ? /* @__PURE__ */ (0, o.jsxs)("details", {
		className: "flow-trace",
		open: !0,
		children: [
			/* @__PURE__ */ (0, o.jsxs)("summary", { children: [
				"Trace observée · version ",
				e.trace.revisionId.slice(0, 8),
				" · ",
				e.trace.environment
			] }),
			e.trace.revisionId === t ? null : /* @__PURE__ */ (0, o.jsx)("p", {
				className: "arch-note",
				children: "Trace d’une autre version : elle n’établit pas le comportement de la version affichée."
			}),
			/* @__PURE__ */ (0, o.jsx)("p", { children: e.trace.durationMs === void 0 ? "Durée totale indisponible." : `Durée mesurée : ${new Intl.NumberFormat("fr-FR").format(e.trace.durationMs)} ms.` }),
			/* @__PURE__ */ (0, o.jsx)("ol", { children: e.trace.events.slice(0, 100).map((e, t) => /* @__PURE__ */ (0, o.jsxs)("li", { children: [
				/* @__PURE__ */ (0, o.jsx)("strong", { children: n(e.label) }),
				e.at ? /* @__PURE__ */ (0, o.jsx)("time", { children: new Date(e.at).toLocaleString("fr-FR") }) : null,
				e.durationMs === void 0 ? null : /* @__PURE__ */ (0, o.jsxs)("span", { children: [new Intl.NumberFormat("fr-FR").format(e.durationMs), " ms"] }),
				e.error ? /* @__PURE__ */ (0, o.jsx)("p", {
					className: "flow-error",
					children: n(e.error)
				}) : null
			] }, `${t}-${e.at ?? ""}`)) }),
			e.trace.events.length > 100 ? /* @__PURE__ */ (0, o.jsx)("p", { children: "Affichage limité aux 100 premiers événements." }) : null,
			/* @__PURE__ */ (0, o.jsx)("small", { children: "Masquage complémentaire des jetons et adresses reconnaissables. Les traces doivent être expurgées à la collecte ; cette vue n’est pas un filtre exhaustif." })
		]
	}) : /* @__PURE__ */ (0, o.jsx)("p", {
		className: "arch-note",
		children: "Flux marqué observé, mais trace absente. Observation non vérifiable dans cet écran."
	}) : /* @__PURE__ */ (0, o.jsx)("p", {
		className: "arch-note",
		children: "Flux déduit du code. Aucun temps de réponse ni succès à l’exécution ne peut être conclu de ce parcours."
	});
}
function l({ flow: e, props: t }) {
	let r = t.model.analysis, i = new Map(r.elements.map((e) => [e.id, e])), a = new Set(e.relationIds), l = /* @__PURE__ */ new Map();
	for (let e of r.relations) a.has(e.id) && l.set(e.source, [...l.get(e.source) ?? [], e]);
	let u = new Set(r.relations.map((e) => e.id)), d = e.relationIds.filter((e) => !u.has(e));
	return /* @__PURE__ */ (0, o.jsxs)(o.Fragment, { children: [
		/* @__PURE__ */ (0, o.jsxs)("div", {
			className: "model-heading",
			children: [/* @__PURE__ */ (0, o.jsxs)("div", { children: [/* @__PURE__ */ (0, o.jsx)("h3", { children: e.title }), /* @__PURE__ */ (0, o.jsx)("p", { children: e.kind === "code" ? "Parcours déduit des liens du code" : "Parcours avec trace observée" })] }), /* @__PURE__ */ (0, o.jsx)("span", {
				className: `model-kind ${e.kind === "observed" ? "observed" : ""}`,
				children: e.kind === "code" ? "Analyse statique" : "Observation enregistrée"
			})]
		}),
		/* @__PURE__ */ (0, o.jsx)(c, {
			flow: e,
			revisionId: r.revisionId
		}),
		/* @__PURE__ */ (0, o.jsx)("p", {
			className: "flow-scope",
			children: "Éléments et dépendances associés à l’entrée, sans ordre d’exécution déduit. D’autres routes du même fichier peuvent figurer dans ce périmètre."
		}),
		/* @__PURE__ */ (0, o.jsx)("ul", {
			className: "flow-steps",
			children: e.elementIds.slice(0, 80).map((e, n) => /* @__PURE__ */ (0, o.jsx)(s, {
				id: e,
				element: i.get(e),
				relations: l.get(e) ?? [],
				selectedId: t.selectedId,
				onSelect: t.onSelect,
				onOpenSource: t.onOpenSource
			}, `${e}-${n}`))
		}),
		e.elementIds.length > 80 ? /* @__PURE__ */ (0, o.jsx)("p", {
			className: "arch-note",
			children: "Parcours limité aux 80 premiers éléments. Réduisez le périmètre d’analyse."
		}) : null,
		d.length ? /* @__PURE__ */ (0, o.jsxs)("p", {
			className: "arch-note",
			children: [d.length, " connexion(s) de ce parcours ne sont plus résolues dans l’analyse."]
		}) : null,
		/* @__PURE__ */ (0, o.jsxs)("details", {
			className: "flow-errors",
			open: !0,
			children: [/* @__PURE__ */ (0, o.jsxs)("summary", { children: ["Branches d’erreur identifiées dans les sources associées · ", e.errors.length] }), e.errors.length ? /* @__PURE__ */ (0, o.jsx)("ul", { children: e.errors.map((e, r) => /* @__PURE__ */ (0, o.jsxs)("li", { children: [/* @__PURE__ */ (0, o.jsx)("span", { children: n(e.label) }), /* @__PURE__ */ (0, o.jsxs)("button", {
				className: "model-source-link",
				type: "button",
				onClick: () => t.onOpenSource(e.source.path, e.source.line),
				children: [
					e.source.path,
					e.source.line ? `:${e.source.line}` : "",
					" ↗"
				]
			})] }, `${e.source.path}-${r}`)) }) : /* @__PURE__ */ (0, o.jsx)("p", { children: "Aucune branche d’erreur identifiée par cet extracteur. Cela ne prouve pas que le parcours gère les erreurs." })]
		}),
		/* @__PURE__ */ (0, o.jsxs)("details", {
			className: "model-limits",
			open: !0,
			children: [/* @__PURE__ */ (0, o.jsx)("summary", { children: "Limites du parcours" }), /* @__PURE__ */ (0, o.jsxs)("ul", { children: [e.limits.map((e, t) => /* @__PURE__ */ (0, o.jsx)("li", { children: e }, t)), /* @__PURE__ */ (0, o.jsx)("li", { children: "L’ordre des dépendances n’établit pas à lui seul une chronologie d’exécution." })] })]
		}),
		/* @__PURE__ */ (0, o.jsx)("button", {
			type: "button",
			onClick: () => t.onShowChecks(i.get(e.entryId)?.sources[0]?.path),
			children: "Voir les vérifications liées à l’entrée"
		})
	] });
}
function u(e) {
	let [t, n] = (0, a.useState)(""), [r, i] = (0, a.useState)(""), s = e.model.analysis.flows, c = s.filter((e) => `${e.title} ${e.entryId}`.toLocaleLowerCase("fr").includes(r.toLocaleLowerCase("fr"))), u = c.find((e) => e.id === t) ?? c.find((t) => t.elementIds.includes(e.selectedId ?? "")) ?? c[0];
	return /* @__PURE__ */ (0, o.jsxs)("section", {
		className: "flow-view",
		"aria-label": "Parcours des données du projet",
		children: [
			/* @__PURE__ */ (0, o.jsxs)("div", {
				className: "arch-toolbar",
				children: [
					/* @__PURE__ */ (0, o.jsxs)("label", {
						className: "arch-search",
						children: [/* @__PURE__ */ (0, o.jsx)("span", {
							className: "sr-only",
							children: "Rechercher un scénario ou endpoint"
						}), /* @__PURE__ */ (0, o.jsx)("input", {
							value: r,
							onChange: (e) => i(e.target.value),
							name: "flow-search",
							autoComplete: "off",
							placeholder: "Scénario, entrée, endpoint…"
						})]
					}),
					/* @__PURE__ */ (0, o.jsxs)("label", {
						className: "flow-select",
						children: [
							"Parcours",
							" ",
							/* @__PURE__ */ (0, o.jsx)("select", {
								value: u?.id ?? "",
								onChange: (e) => n(e.target.value),
								disabled: !c.length,
								children: c.length ? c.slice(0, 150).map((e) => /* @__PURE__ */ (0, o.jsx)("option", {
									value: e.id,
									children: e.title
								}, e.id)) : /* @__PURE__ */ (0, o.jsx)("option", {
									value: "",
									children: "Aucun parcours disponible"
								})
							})
						]
					}),
					/* @__PURE__ */ (0, o.jsxs)("span", {
						className: "arch-count",
						children: [c.length, " parcours"]
					})
				]
			}),
			c.length > 150 ? /* @__PURE__ */ (0, o.jsx)("p", {
				className: "arch-note",
				children: "Sélecteur limité à 150 parcours. Utilisez la recherche."
			}) : null,
			u ? /* @__PURE__ */ (0, o.jsx)(l, {
				flow: u,
				props: e
			}) : /* @__PURE__ */ (0, o.jsxs)("div", {
				className: "arch-empty",
				children: [/* @__PURE__ */ (0, o.jsx)("h3", { children: "Aucun parcours résolu" }), /* @__PURE__ */ (0, o.jsx)("p", { children: s.length ? "Aucun scénario ne correspond à la recherche." : "Aucune entrée ou chaîne de dépendances exploitable n’a été identifiée dans ces sources. Aucun scénario d’exécution n’est inventé." })]
			})
		]
	});
}
//#endregion
export { u as FlowView };
