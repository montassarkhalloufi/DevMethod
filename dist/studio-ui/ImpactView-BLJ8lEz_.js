import { i as e, r as t, t as n } from "./jsx-runtime-DZd2gj5L.js";
import { s as r } from "./i18n-CRhBcIYq.js";
/* empty css                      */
//#region studio-ui/src/features/project/components/ImpactView.tsx
var i = e(), a = n(), o = (e = "en") => ({
	added: r("Ajouté", "Added", void 0, e),
	modified: r("Modifié", "Modified", void 0, e),
	removed: r("Supprimé", "Removed", void 0, e)
});
function s({ title: e, ids: n, elements: r, onSelect: i, note: o }) {
	let { t: s } = t();
	return /* @__PURE__ */ (0, a.jsxs)("div", {
		className: "impact-reference",
		children: [
			/* @__PURE__ */ (0, a.jsxs)("h4", { children: [
				e,
				" ",
				/* @__PURE__ */ (0, a.jsx)("span", { children: n.length })
			] }),
			/* @__PURE__ */ (0, a.jsx)("p", { children: o }),
			n.length ? /* @__PURE__ */ (0, a.jsx)("ul", { children: n.slice(0, 40).map((e) => {
				let t = r.get(e);
				return /* @__PURE__ */ (0, a.jsx)("li", { children: t ? /* @__PURE__ */ (0, a.jsx)("button", {
					type: "button",
					onClick: () => i(e),
					children: t.label
				}) : /* @__PURE__ */ (0, a.jsxs)("span", { children: [
					s("Élément non résolu :", "Unresolved element:"),
					" ",
					e
				] }) }, e);
			}) }) : /* @__PURE__ */ (0, a.jsx)("small", { children: s("Aucune association détectée.", "No association detected.") }),
			n.length > 40 ? /* @__PURE__ */ (0, a.jsx)("small", { children: s("Affichage limité aux 40 premières associations.", "Display limited to the first 40 associations.") }) : null
		]
	});
}
function c({ change: e, props: n, elements: r }) {
	let { t: i } = t(), o = e.contractIds.filter((t) => e.elementIds.includes(t)), c = e.testIds.map((e) => r.get(e)).filter((e) => !!e);
	return /* @__PURE__ */ (0, a.jsxs)("div", {
		className: "impact-detail",
		children: [
			/* @__PURE__ */ (0, a.jsxs)("div", {
				className: "impact-columns",
				children: [
					/* @__PURE__ */ (0, a.jsx)(s, {
						title: i("Éléments modifiés", "Changed elements"),
						ids: e.elementIds,
						elements: r,
						onSelect: n.onSelect,
						note: i("Associés au fichier effectivement modifié.", "Associated with the file actually modified.")
					}),
					/* @__PURE__ */ (0, a.jsx)(s, {
						title: i("Dépendances directes", "Direct dependencies"),
						ids: e.dependencyIds,
						elements: r,
						onSelect: n.onSelect,
						note: i("Relations établies par l’analyse ; elles ne prouvent pas une régression.", "Relationships established by analysis; they do not prove a regression.")
					}),
					/* @__PURE__ */ (0, a.jsx)(s, {
						title: i("Consommateurs potentiels", "Potential consumers"),
						ids: e.consumerIds,
						elements: r,
						onSelect: n.onSelect,
						note: i("À réexaminer. L’effet réel nécessite un contrôle de comportement.", "To review. The actual effect requires a behavior check.")
					}),
					/* @__PURE__ */ (0, a.jsx)(s, {
						title: i("Contrats à réexaminer", "Contracts to review"),
						ids: e.contractIds,
						elements: r,
						onSelect: n.onSelect,
						note: i("{count} contrat(s) directement rattaché(s) aux éléments modifiés. Aucun changement de schéma non extrait n’est déduit.", "{count} contract(s) directly linked to changed elements. No unextracted schema change is inferred.", { count: o.length })
					})
				]
			}),
			/* @__PURE__ */ (0, a.jsxs)("div", {
				className: "impact-reference",
				children: [/* @__PURE__ */ (0, a.jsxs)("h4", { children: [
					i("Tests associés", "Related tests"),
					" ",
					/* @__PURE__ */ (0, a.jsx)("span", { children: c.length })
				] }), c.length ? /* @__PURE__ */ (0, a.jsx)("ul", { children: c.slice(0, 40).map((e) => /* @__PURE__ */ (0, a.jsxs)("li", { children: [/* @__PURE__ */ (0, a.jsx)("button", {
					type: "button",
					onClick: () => n.onSelect(e.id),
					children: e.label
				}), /* @__PURE__ */ (0, a.jsxs)("small", { children: [
					i("Association :", "Association:"),
					" ",
					e.provenance.map((e) => `${e.kind} · ${e.method}`).join(" ; ") || i("méthode non renseignée", "method not provided")
				] })] }, e.id)) }) : /* @__PURE__ */ (0, a.jsx)("p", { children: i("Aucun test associé par l’analyse. Cette absence ne constitue pas une couverture suffisante.", "No test associated by analysis. This absence does not establish sufficient coverage.") })]
			}),
			/* @__PURE__ */ (0, a.jsxs)("div", {
				className: "impact-actions",
				children: [e.kind === "removed" ? /* @__PURE__ */ (0, a.jsx)("span", { children: i("Fichier supprimé de la version actuelle.", "File removed from the current version.") }) : /* @__PURE__ */ (0, a.jsx)("button", {
					type: "button",
					onClick: () => n.onOpenSource(e.path),
					children: i("Ouvrir le fichier actuel", "Open current file")
				}), /* @__PURE__ */ (0, a.jsx)("button", {
					type: "button",
					onClick: () => n.onShowChecks(e.path),
					children: i("Examiner les vérifications", "Inspect checks")
				})]
			})
		]
	});
}
function l(e) {
	let { t: n, locale: r } = t(), [s, l] = (0, i.useState)(""), [u, d] = (0, i.useState)("all"), [f, p] = (0, i.useState)(null), { impact: m, analysis: h, previous: g } = e.model, _ = new Map([...g?.elements ?? [], ...h.elements].map((e) => [e.id, e]));
	if (m.revisionId !== h.revisionId) return /* @__PURE__ */ (0, a.jsxs)("section", {
		className: "impact-view",
		children: [/* @__PURE__ */ (0, a.jsx)("h3", { children: n("Comparaison obsolète", "Outdated comparison") }), /* @__PURE__ */ (0, a.jsx)("p", { children: n("Cette analyse d’impact appartient à une autre version. Actualisez le modèle avant de la rapprocher des sources affichées.", "This impact analysis belongs to another version. Refresh the model before comparing it with the displayed sources.") })]
	});
	let v = m.changes.filter((e) => (u === "all" || e.kind === u) && e.path.toLocaleLowerCase("fr").includes(s.toLocaleLowerCase("fr"))), y = {
		added: v.filter((e) => e.kind === "added").length,
		modified: v.filter((e) => e.kind === "modified").length,
		removed: v.filter((e) => e.kind === "removed").length
	};
	return /* @__PURE__ */ (0, a.jsxs)("section", {
		className: "impact-view",
		"aria-label": n("Impact des modifications", "Change impact"),
		children: [
			/* @__PURE__ */ (0, a.jsxs)("div", {
				className: "model-heading",
				children: [/* @__PURE__ */ (0, a.jsxs)("div", { children: [/* @__PURE__ */ (0, a.jsx)("h3", { children: n("Comprendre ce que le changement touche", "Understand what the change affects") }), /* @__PURE__ */ (0, a.jsxs)("p", { children: [m.baseRevisionId ? `${m.baseRevisionId.slice(0, 8)} → ${m.revisionId.slice(0, 8)}` : n("Aucune version de référence disponible", "No reference version available"), h.localChanges ? n(" · modifications locales analysées", " · local changes analyzed") : ""] })] }), /* @__PURE__ */ (0, a.jsx)("span", {
					className: "model-kind",
					children: n("Analyse statique", "Static analysis")
				})]
			}),
			/* @__PURE__ */ (0, a.jsxs)("div", {
				className: "arch-toolbar",
				children: [/* @__PURE__ */ (0, a.jsxs)("label", {
					className: "arch-search",
					children: [/* @__PURE__ */ (0, a.jsx)("span", {
						className: "sr-only",
						children: n("Filtrer les fichiers modifiés", "Filter changed files")
					}), /* @__PURE__ */ (0, a.jsx)("input", {
						name: "impact-search",
						autoComplete: "off",
						placeholder: n("Rechercher un fichier…", "Search for a file…"),
						value: s,
						onChange: (e) => l(e.target.value)
					})]
				}), /* @__PURE__ */ (0, a.jsxs)("label", { children: [
					n("Modification", "Change"),
					" ",
					/* @__PURE__ */ (0, a.jsxs)("select", {
						value: u,
						onChange: (e) => d(e.target.value),
						children: [/* @__PURE__ */ (0, a.jsx)("option", {
							value: "all",
							children: n("Toutes", "All")
						}), Object.entries(o(r)).map(([e, t]) => /* @__PURE__ */ (0, a.jsx)("option", {
							value: e,
							children: t
						}, e))]
					})
				] })]
			}),
			/* @__PURE__ */ (0, a.jsxs)("div", {
				className: "impact-counts",
				"aria-live": "polite",
				children: [
					/* @__PURE__ */ (0, a.jsxs)("span", { children: [
						/* @__PURE__ */ (0, a.jsx)("strong", { children: y.added }),
						" ",
						n("ajout(s)", "addition(s)")
					] }),
					/* @__PURE__ */ (0, a.jsxs)("span", { children: [
						/* @__PURE__ */ (0, a.jsx)("strong", { children: y.modified }),
						" ",
						n("modification(s)", "change(s)")
					] }),
					/* @__PURE__ */ (0, a.jsxs)("span", { children: [
						/* @__PURE__ */ (0, a.jsx)("strong", { children: y.removed }),
						" ",
						n("suppression(s)", "removal(s)")
					] }),
					/* @__PURE__ */ (0, a.jsxs)("span", { children: [
						/* @__PURE__ */ (0, a.jsx)("strong", { children: m.staleCheckIds.length }),
						" ",
						n("preuve(s) à réexaminer sur l’ensemble du changement", "piece(s) of evidence to review across the change")
					] })
				]
			}),
			m.baseRevisionId ? null : /* @__PURE__ */ (0, a.jsx)("p", {
				className: "arch-note",
				children: n("Sans référence antérieure, l’absence de différence ne prouve pas la stabilité du projet.", "Without an earlier reference, the absence of differences does not prove project stability.")
			}),
			/* @__PURE__ */ (0, a.jsx)("div", {
				className: "impact-changes",
				children: v.length ? v.slice(0, 100).map((t) => /* @__PURE__ */ (0, a.jsxs)("details", {
					open: f === t.path,
					onToggle: (e) => {
						e.currentTarget.open ? p(t.path) : f === t.path && p(null);
					},
					children: [/* @__PURE__ */ (0, a.jsxs)("summary", { children: [
						/* @__PURE__ */ (0, a.jsx)("span", {
							className: `impact-change-kind ${t.kind}`,
							children: o(r)[t.kind]
						}),
						/* @__PURE__ */ (0, a.jsx)("code", { children: t.path }),
						/* @__PURE__ */ (0, a.jsxs)("span", { children: [
							t.consumerIds.length,
							" ",
							n("consommateur(s) potentiel(s)", "potential consumer(s)")
						] })
					] }), /* @__PURE__ */ (0, a.jsx)(c, {
						change: t,
						props: e,
						elements: _
					})]
				}, t.path)) : /* @__PURE__ */ (0, a.jsxs)("div", {
					className: "arch-empty",
					children: [/* @__PURE__ */ (0, a.jsx)("h3", { children: n("Aucune modification dans ce périmètre", "No changes in this scope") }), /* @__PURE__ */ (0, a.jsx)("p", { children: n("Une absence de différence ou de dépendance détectée ne garantit pas une absence d’impact.", "No detected difference or dependency does not guarantee no impact.") })]
				})
			}),
			v.length > 100 ? /* @__PURE__ */ (0, a.jsxs)("p", {
				className: "arch-note",
				children: [
					n("100 fichiers affichés sur", "100 files shown out of"),
					" ",
					v.length,
					n(". Réduisez le périmètre avec la recherche.", ". Narrow the scope using search.")
				]
			}) : null,
			/* @__PURE__ */ (0, a.jsxs)("details", {
				className: "model-limits",
				children: [/* @__PURE__ */ (0, a.jsxs)("summary", { children: [
					n("Preuves à réexaminer ·", "Evidence to review ·"),
					" ",
					m.staleCheckIds.length
				] }), m.staleCheckIds.length ? /* @__PURE__ */ (0, a.jsxs)(a.Fragment, { children: [/* @__PURE__ */ (0, a.jsx)("ul", { children: m.staleCheckIds.slice(0, 100).map((e) => /* @__PURE__ */ (0, a.jsx)("li", { children: /* @__PURE__ */ (0, a.jsx)("code", { children: e }) }, e)) }), /* @__PURE__ */ (0, a.jsx)("button", {
					type: "button",
					onClick: () => e.onShowChecks(),
					children: n("Ouvrir les preuves et leur version", "Open evidence and its version")
				})] }) : /* @__PURE__ */ (0, a.jsx)("p", { children: n("Aucune preuve marquée par cette comparaison. Cela ne signifie pas que tous les comportements ont été contrôlés.", "No evidence flagged by this comparison. This does not mean all behavior was checked.") })]
			}),
			/* @__PURE__ */ (0, a.jsxs)("details", {
				className: "model-limits",
				open: !0,
				children: [/* @__PURE__ */ (0, a.jsx)("summary", { children: n("Impact inconnu et limites", "Unknown impact and limitations") }), /* @__PURE__ */ (0, a.jsxs)("ul", { children: [
					m.limits.map((e, t) => /* @__PURE__ */ (0, a.jsx)("li", { children: e }, t)),
					/* @__PURE__ */ (0, a.jsx)("li", { children: n("Les appels dynamiques et consommateurs externes non résolus restent inconnus.", "Unresolved dynamic calls and external consumers remain unknown.") }),
					/* @__PURE__ */ (0, a.jsx)("li", { children: n("Les contrats et schémas ne sont analysés que lorsqu’un extracteur fournit une association.", "Contracts and schemas are analyzed only when an extractor provides an association.") })
				] })]
			})
		]
	});
}
//#endregion
export { l as ImpactView };
