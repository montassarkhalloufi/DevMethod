import { i as e, r as t, t as n } from "./jsx-runtime-DZd2gj5L.js";
import { d as r, i, n as a } from "./architecture-model-CYlN9V-Z.js";
/* empty css                      */
//#region studio-ui/src/features/project/components/FlowView.tsx
var o = e(), s = n();
function c({ id: e, element: n, relations: r, onSelect: o, onOpenSource: c, selectedId: l }) {
	let { t: u, locale: d } = t();
	if (!n) return /* @__PURE__ */ (0, s.jsxs)("li", {
		className: "flow-step flow-unresolved",
		children: [/* @__PURE__ */ (0, s.jsx)("span", {
			className: "flow-number",
			"aria-hidden": "true",
			children: "?"
		}), /* @__PURE__ */ (0, s.jsxs)("div", { children: [/* @__PURE__ */ (0, s.jsx)("h4", { children: u("Chaînon non résolu", "Unresolved link") }), /* @__PURE__ */ (0, s.jsxs)("p", { children: [
			u("L’élément", "Element"),
			" ",
			e,
			" ",
			u("n’est pas présent dans cette analyse. Le parcours n’est pas complété arbitrairement.", "is absent from this analysis. The flow is not completed arbitrarily.")
		] })] })]
	});
	let f = n.sources[0];
	return /* @__PURE__ */ (0, s.jsxs)("li", {
		className: "flow-step",
		"data-selected": l === n.id,
		children: [/* @__PURE__ */ (0, s.jsx)("span", {
			className: "flow-number",
			"aria-hidden": "true",
			children: "◇"
		}), /* @__PURE__ */ (0, s.jsxs)("div", {
			className: "flow-step-body",
			children: [
				/* @__PURE__ */ (0, s.jsxs)("div", {
					className: "flow-step-heading",
					children: [/* @__PURE__ */ (0, s.jsx)("button", {
						type: "button",
						"aria-pressed": l === n.id,
						onClick: () => o(n.id),
						children: n.label
					}), /* @__PURE__ */ (0, s.jsx)("span", { children: a(d)[n.type] })]
				}),
				/* @__PURE__ */ (0, s.jsx)("p", { children: n.description }),
				f ? /* @__PURE__ */ (0, s.jsxs)("button", {
					className: "model-source-link",
					type: "button",
					onClick: () => c(f.path, f.line),
					children: [
						f.path,
						f.line ? `:${f.line}` : "",
						" ↗"
					]
				}) : /* @__PURE__ */ (0, s.jsx)("small", { children: u("Aucune source reliée.", "No linked source.") }),
				r.length ? /* @__PURE__ */ (0, s.jsx)("ul", {
					className: "flow-connections",
					children: r.map((e) => /* @__PURE__ */ (0, s.jsxs)("li", { children: [/* @__PURE__ */ (0, s.jsxs)("button", {
						type: "button",
						onClick: () => o(e.id),
						children: [
							i(d)[e.kind],
							" · ",
							e.label
						]
					}), /* @__PURE__ */ (0, s.jsx)("small", { children: e.provenance.map((e) => e.method).join(" · ") })] }, e.id))
				}) : /* @__PURE__ */ (0, s.jsx)("p", {
					className: "arch-note",
					children: u("Aucune connexion sortante résolue dans ce périmètre.", "No resolved outgoing connection in this scope.")
				})
			]
		})]
	});
}
function l({ flow: e, revisionId: n }) {
	let { t: i, locale: a } = t();
	return e.kind === "observed" ? e.trace ? /* @__PURE__ */ (0, s.jsxs)("details", {
		className: "flow-trace",
		open: !0,
		children: [
			/* @__PURE__ */ (0, s.jsxs)("summary", { children: [
				i("Trace observée · version", "Observed trace · version"),
				" ",
				e.trace.revisionId.slice(0, 8),
				" · ",
				e.trace.environment
			] }),
			e.trace.revisionId === n ? null : /* @__PURE__ */ (0, s.jsx)("p", {
				className: "arch-note",
				children: i("Trace d’une autre version : elle n’établit pas le comportement de la version affichée.", "Trace from another version: it does not establish the behavior of the displayed version.")
			}),
			/* @__PURE__ */ (0, s.jsx)("p", { children: e.trace.durationMs === void 0 ? i("Durée totale indisponible.", "Total duration unavailable.") : i("Durée mesurée : {duration} ms.", "Measured duration: {duration} ms.", { duration: new Intl.NumberFormat(a).format(e.trace.durationMs) }) }),
			/* @__PURE__ */ (0, s.jsx)("ol", { children: e.trace.events.slice(0, 100).map((e, t) => /* @__PURE__ */ (0, s.jsxs)("li", { children: [
				/* @__PURE__ */ (0, s.jsx)("strong", { children: r(e.label, a) }),
				e.at ? /* @__PURE__ */ (0, s.jsx)("time", { children: new Date(e.at).toLocaleString(a) }) : null,
				e.durationMs === void 0 ? null : /* @__PURE__ */ (0, s.jsxs)("span", { children: [new Intl.NumberFormat(a).format(e.durationMs), " ms"] }),
				e.error ? /* @__PURE__ */ (0, s.jsx)("p", {
					className: "flow-error",
					children: r(e.error, a)
				}) : null
			] }, `${t}-${e.at ?? ""}`)) }),
			e.trace.events.length > 100 ? /* @__PURE__ */ (0, s.jsx)("p", { children: i("Affichage limité aux 100 premiers événements.", "Display limited to the first 100 events.") }) : null,
			/* @__PURE__ */ (0, s.jsx)("small", { children: i("Masquage complémentaire des jetons et adresses reconnaissables. Les traces doivent être expurgées à la collecte ; cette vue n’est pas un filtre exhaustif.", "Additional masking of recognizable tokens and addresses. Traces must be redacted during collection; this view is not an exhaustive filter.") })
		]
	}) : /* @__PURE__ */ (0, s.jsx)("p", {
		className: "arch-note",
		children: i("Flux marqué observé, mais trace absente. Observation non vérifiable dans cet écran.", "Flow marked observed, but its trace is missing. The observation cannot be verified here.")
	}) : /* @__PURE__ */ (0, s.jsx)("p", {
		className: "arch-note",
		children: i("Flux déduit du code. Aucun temps de réponse ni succès à l’exécution ne peut être conclu de ce parcours.", "Flow inferred from code. This flow establishes neither response times nor runtime success.")
	});
}
function u({ flow: e, props: n }) {
	let { t: i, locale: a } = t(), o = n.model.analysis, u = new Map(o.elements.map((e) => [e.id, e])), d = new Set(e.relationIds), f = /* @__PURE__ */ new Map();
	for (let e of o.relations) d.has(e.id) && f.set(e.source, [...f.get(e.source) ?? [], e]);
	let p = new Set(o.relations.map((e) => e.id)), m = e.relationIds.filter((e) => !p.has(e));
	return /* @__PURE__ */ (0, s.jsxs)(s.Fragment, { children: [
		/* @__PURE__ */ (0, s.jsxs)("div", {
			className: "model-heading",
			children: [/* @__PURE__ */ (0, s.jsxs)("div", { children: [/* @__PURE__ */ (0, s.jsx)("h3", { children: e.title }), /* @__PURE__ */ (0, s.jsx)("p", { children: e.kind === "code" ? i("Parcours déduit des liens du code", "Flow inferred from code links") : i("Parcours avec trace observée", "Flow with an observed trace") })] }), /* @__PURE__ */ (0, s.jsx)("span", {
				className: `model-kind ${e.kind === "observed" ? "observed" : ""}`,
				children: e.kind === "code" ? i("Analyse statique", "Static analysis") : i("Observation enregistrée", "Recorded observation")
			})]
		}),
		/* @__PURE__ */ (0, s.jsx)(l, {
			flow: e,
			revisionId: o.revisionId
		}),
		/* @__PURE__ */ (0, s.jsx)("p", {
			className: "flow-scope",
			children: i("Éléments et dépendances associés à l’entrée, sans ordre d’exécution déduit. D’autres routes du même fichier peuvent figurer dans ce périmètre.", "Elements and dependencies associated with the entry, without inferred execution order. Other routes in the same file may appear in this scope.")
		}),
		/* @__PURE__ */ (0, s.jsx)("ul", {
			className: "flow-steps",
			children: e.elementIds.slice(0, 80).map((e, t) => /* @__PURE__ */ (0, s.jsx)(c, {
				id: e,
				element: u.get(e),
				relations: f.get(e) ?? [],
				selectedId: n.selectedId,
				onSelect: n.onSelect,
				onOpenSource: n.onOpenSource
			}, `${e}-${t}`))
		}),
		e.elementIds.length > 80 ? /* @__PURE__ */ (0, s.jsx)("p", {
			className: "arch-note",
			children: i("Parcours limité aux 80 premiers éléments. Réduisez le périmètre d’analyse.", "Flow limited to the first 80 elements. Narrow the analysis scope.")
		}) : null,
		m.length ? /* @__PURE__ */ (0, s.jsxs)("p", {
			className: "arch-note",
			children: [
				m.length,
				" ",
				i("connexion(s) de ce parcours ne sont plus résolues dans l’analyse.", "connection(s) in this flow are no longer resolved in the analysis.")
			]
		}) : null,
		/* @__PURE__ */ (0, s.jsxs)("details", {
			className: "flow-errors",
			open: !0,
			children: [/* @__PURE__ */ (0, s.jsxs)("summary", { children: [
				i("Branches d’erreur identifiées dans les sources associées ·", "Error branches identified in associated sources ·"),
				" ",
				e.errors.length
			] }), e.errors.length ? /* @__PURE__ */ (0, s.jsx)("ul", { children: e.errors.map((e, t) => /* @__PURE__ */ (0, s.jsxs)("li", { children: [/* @__PURE__ */ (0, s.jsx)("span", { children: r(e.label, a) }), /* @__PURE__ */ (0, s.jsxs)("button", {
				className: "model-source-link",
				type: "button",
				onClick: () => n.onOpenSource(e.source.path, e.source.line),
				children: [
					e.source.path,
					e.source.line ? `:${e.source.line}` : "",
					" ↗"
				]
			})] }, `${e.source.path}-${t}`)) }) : /* @__PURE__ */ (0, s.jsx)("p", { children: i("Aucune branche d’erreur identifiée par cet extracteur. Cela ne prouve pas que le parcours gère les erreurs.", "No error branch identified by this extractor. This does not prove that the flow handles errors.") })]
		}),
		/* @__PURE__ */ (0, s.jsxs)("details", {
			className: "model-limits",
			open: !0,
			children: [/* @__PURE__ */ (0, s.jsx)("summary", { children: i("Limites du parcours", "Flow limitations") }), /* @__PURE__ */ (0, s.jsxs)("ul", { children: [e.limits.map((e, t) => /* @__PURE__ */ (0, s.jsx)("li", { children: e }, t)), /* @__PURE__ */ (0, s.jsx)("li", { children: i("L’ordre des dépendances n’établit pas à lui seul une chronologie d’exécution.", "Dependency order alone does not establish an execution timeline.") })] })]
		}),
		/* @__PURE__ */ (0, s.jsx)("button", {
			type: "button",
			onClick: () => n.onShowChecks(u.get(e.entryId)?.sources[0]?.path),
			children: i("Voir les vérifications liées à l’entrée", "View checks linked to this entry")
		})
	] });
}
function d(e) {
	let { t: n } = t(), [r, i] = (0, o.useState)(""), [a, c] = (0, o.useState)(""), l = e.model.analysis.flows, d = l.filter((e) => `${e.title} ${e.entryId}`.toLocaleLowerCase("fr").includes(a.toLocaleLowerCase("fr"))), f = d.find((e) => e.id === r) ?? d.find((t) => t.elementIds.includes(e.selectedId ?? "")) ?? d[0];
	return /* @__PURE__ */ (0, s.jsxs)("section", {
		className: "flow-view",
		"aria-label": n("Parcours des données du projet", "Project data flows"),
		children: [
			/* @__PURE__ */ (0, s.jsxs)("div", {
				className: "arch-toolbar",
				children: [
					/* @__PURE__ */ (0, s.jsxs)("label", {
						className: "arch-search",
						children: [/* @__PURE__ */ (0, s.jsx)("span", {
							className: "sr-only",
							children: n("Rechercher un scénario ou endpoint", "Search for a scenario or endpoint")
						}), /* @__PURE__ */ (0, s.jsx)("input", {
							value: a,
							onChange: (e) => c(e.target.value),
							name: "flow-search",
							autoComplete: "off",
							placeholder: n("Scénario, entrée, endpoint…", "Scenario, entry, endpoint…")
						})]
					}),
					/* @__PURE__ */ (0, s.jsxs)("label", {
						className: "flow-select",
						children: [
							n("Parcours", "Flows"),
							" ",
							/* @__PURE__ */ (0, s.jsx)("select", {
								value: f?.id ?? "",
								onChange: (e) => i(e.target.value),
								disabled: !d.length,
								children: d.length ? d.slice(0, 150).map((e) => /* @__PURE__ */ (0, s.jsx)("option", {
									value: e.id,
									children: e.title
								}, e.id)) : /* @__PURE__ */ (0, s.jsx)("option", {
									value: "",
									children: n("Aucun parcours disponible", "No flow available")
								})
							})
						]
					}),
					/* @__PURE__ */ (0, s.jsxs)("span", {
						className: "arch-count",
						children: [
							d.length,
							" ",
							n("parcours", "flows")
						]
					})
				]
			}),
			d.length > 150 ? /* @__PURE__ */ (0, s.jsx)("p", {
				className: "arch-note",
				children: n("Sélecteur limité à 150 parcours. Utilisez la recherche.", "Selector limited to 150 flows. Use search.")
			}) : null,
			f ? /* @__PURE__ */ (0, s.jsx)(u, {
				flow: f,
				props: e
			}) : /* @__PURE__ */ (0, s.jsxs)("div", {
				className: "arch-empty",
				children: [/* @__PURE__ */ (0, s.jsx)("h3", { children: n("Aucun parcours résolu", "No resolved flow") }), /* @__PURE__ */ (0, s.jsx)("p", { children: l.length ? n("Aucun scénario ne correspond à la recherche.", "No scenario matches the search.") : n("Aucune entrée ou chaîne de dépendances exploitable n’a été identifiée dans ces sources. Aucun scénario d’exécution n’est inventé.", "No usable entry or dependency chain was identified in these sources. No execution scenario is invented.") })]
			})
		]
	});
}
//#endregion
export { d as FlowView };
