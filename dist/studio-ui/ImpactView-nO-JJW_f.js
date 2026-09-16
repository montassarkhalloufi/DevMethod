import { r as e, t } from "./jsx-runtime-Bz8zB3tG.js";
/* empty css                      */
//#region studio-ui/src/features/project/components/ImpactView.tsx
var n = e(), r = t(), i = {
	added: "Ajouté",
	modified: "Modifié",
	removed: "Supprimé"
};
function a({ title: e, ids: t, elements: n, onSelect: i, note: a }) {
	return /* @__PURE__ */ (0, r.jsxs)("div", {
		className: "impact-reference",
		children: [
			/* @__PURE__ */ (0, r.jsxs)("h4", { children: [
				e,
				" ",
				/* @__PURE__ */ (0, r.jsx)("span", { children: t.length })
			] }),
			/* @__PURE__ */ (0, r.jsx)("p", { children: a }),
			t.length ? /* @__PURE__ */ (0, r.jsx)("ul", { children: t.slice(0, 40).map((e) => {
				let t = n.get(e);
				return /* @__PURE__ */ (0, r.jsx)("li", { children: t ? /* @__PURE__ */ (0, r.jsx)("button", {
					type: "button",
					onClick: () => i(e),
					children: t.label
				}) : /* @__PURE__ */ (0, r.jsxs)("span", { children: ["Élément non résolu : ", e] }) }, e);
			}) }) : /* @__PURE__ */ (0, r.jsx)("small", { children: "Aucune association détectée." }),
			t.length > 40 ? /* @__PURE__ */ (0, r.jsx)("small", { children: "Affichage limité aux 40 premières associations." }) : null
		]
	});
}
function o({ change: e, props: t, elements: n }) {
	let i = e.contractIds.filter((t) => e.elementIds.includes(t)), o = e.testIds.map((e) => n.get(e)).filter((e) => !!e);
	return /* @__PURE__ */ (0, r.jsxs)("div", {
		className: "impact-detail",
		children: [
			/* @__PURE__ */ (0, r.jsxs)("div", {
				className: "impact-columns",
				children: [
					/* @__PURE__ */ (0, r.jsx)(a, {
						title: "Éléments modifiés",
						ids: e.elementIds,
						elements: n,
						onSelect: t.onSelect,
						note: "Associés au fichier effectivement modifié."
					}),
					/* @__PURE__ */ (0, r.jsx)(a, {
						title: "Dépendances directes",
						ids: e.dependencyIds,
						elements: n,
						onSelect: t.onSelect,
						note: "Relations établies par l’analyse ; elles ne prouvent pas une régression."
					}),
					/* @__PURE__ */ (0, r.jsx)(a, {
						title: "Consommateurs potentiels",
						ids: e.consumerIds,
						elements: n,
						onSelect: t.onSelect,
						note: "À réexaminer. L’effet réel nécessite un contrôle de comportement."
					}),
					/* @__PURE__ */ (0, r.jsx)(a, {
						title: "Contrats à réexaminer",
						ids: e.contractIds,
						elements: n,
						onSelect: t.onSelect,
						note: `${i.length} contrat(s) directement rattaché(s) aux éléments modifiés. Aucun changement de schéma non extrait n’est déduit.`
					})
				]
			}),
			/* @__PURE__ */ (0, r.jsxs)("div", {
				className: "impact-reference",
				children: [/* @__PURE__ */ (0, r.jsxs)("h4", { children: ["Tests associés ", /* @__PURE__ */ (0, r.jsx)("span", { children: o.length })] }), o.length ? /* @__PURE__ */ (0, r.jsx)("ul", { children: o.slice(0, 40).map((e) => /* @__PURE__ */ (0, r.jsxs)("li", { children: [/* @__PURE__ */ (0, r.jsx)("button", {
					type: "button",
					onClick: () => t.onSelect(e.id),
					children: e.label
				}), /* @__PURE__ */ (0, r.jsxs)("small", { children: [
					"Association :",
					" ",
					e.provenance.map((e) => `${e.kind} · ${e.method}`).join(" ; ") || "méthode non renseignée"
				] })] }, e.id)) }) : /* @__PURE__ */ (0, r.jsx)("p", { children: "Aucun test associé par l’analyse. Cette absence ne constitue pas une couverture suffisante." })]
			}),
			/* @__PURE__ */ (0, r.jsxs)("div", {
				className: "impact-actions",
				children: [e.kind === "removed" ? /* @__PURE__ */ (0, r.jsx)("span", { children: "Fichier supprimé de la version actuelle." }) : /* @__PURE__ */ (0, r.jsx)("button", {
					type: "button",
					onClick: () => t.onOpenSource(e.path),
					children: "Ouvrir le fichier actuel"
				}), /* @__PURE__ */ (0, r.jsx)("button", {
					type: "button",
					onClick: () => t.onShowChecks(e.path),
					children: "Examiner les vérifications"
				})]
			})
		]
	});
}
function s(e) {
	let [t, a] = (0, n.useState)(""), [s, c] = (0, n.useState)("all"), [l, u] = (0, n.useState)(null), { impact: d, analysis: f, previous: p } = e.model, m = new Map([...p?.elements ?? [], ...f.elements].map((e) => [e.id, e]));
	if (d.revisionId !== f.revisionId) return /* @__PURE__ */ (0, r.jsxs)("section", {
		className: "impact-view",
		children: [/* @__PURE__ */ (0, r.jsx)("h3", { children: "Comparaison obsolète" }), /* @__PURE__ */ (0, r.jsx)("p", { children: "Cette analyse d’impact appartient à une autre version. Actualisez le modèle avant de la rapprocher des sources affichées." })]
	});
	let h = d.changes.filter((e) => (s === "all" || e.kind === s) && e.path.toLocaleLowerCase("fr").includes(t.toLocaleLowerCase("fr"))), g = {
		added: h.filter((e) => e.kind === "added").length,
		modified: h.filter((e) => e.kind === "modified").length,
		removed: h.filter((e) => e.kind === "removed").length
	};
	return /* @__PURE__ */ (0, r.jsxs)("section", {
		className: "impact-view",
		"aria-label": "Impact des modifications",
		children: [
			/* @__PURE__ */ (0, r.jsxs)("div", {
				className: "model-heading",
				children: [/* @__PURE__ */ (0, r.jsxs)("div", { children: [/* @__PURE__ */ (0, r.jsx)("h3", { children: "Comprendre ce que le changement touche" }), /* @__PURE__ */ (0, r.jsxs)("p", { children: [d.baseRevisionId ? `${d.baseRevisionId.slice(0, 8)} → ${d.revisionId.slice(0, 8)}` : "Aucune version de référence disponible", f.localChanges ? " · modifications locales analysées" : ""] })] }), /* @__PURE__ */ (0, r.jsx)("span", {
					className: "model-kind",
					children: "Analyse statique"
				})]
			}),
			/* @__PURE__ */ (0, r.jsxs)("div", {
				className: "arch-toolbar",
				children: [/* @__PURE__ */ (0, r.jsxs)("label", {
					className: "arch-search",
					children: [/* @__PURE__ */ (0, r.jsx)("span", {
						className: "sr-only",
						children: "Filtrer les fichiers modifiés"
					}), /* @__PURE__ */ (0, r.jsx)("input", {
						name: "impact-search",
						autoComplete: "off",
						placeholder: "Rechercher un fichier…",
						value: t,
						onChange: (e) => a(e.target.value)
					})]
				}), /* @__PURE__ */ (0, r.jsxs)("label", { children: [
					"Modification",
					" ",
					/* @__PURE__ */ (0, r.jsxs)("select", {
						value: s,
						onChange: (e) => c(e.target.value),
						children: [/* @__PURE__ */ (0, r.jsx)("option", {
							value: "all",
							children: "Toutes"
						}), Object.entries(i).map(([e, t]) => /* @__PURE__ */ (0, r.jsx)("option", {
							value: e,
							children: t
						}, e))]
					})
				] })]
			}),
			/* @__PURE__ */ (0, r.jsxs)("div", {
				className: "impact-counts",
				"aria-live": "polite",
				children: [
					/* @__PURE__ */ (0, r.jsxs)("span", { children: [/* @__PURE__ */ (0, r.jsx)("strong", { children: g.added }), " ajout(s)"] }),
					/* @__PURE__ */ (0, r.jsxs)("span", { children: [/* @__PURE__ */ (0, r.jsx)("strong", { children: g.modified }), " modification(s)"] }),
					/* @__PURE__ */ (0, r.jsxs)("span", { children: [/* @__PURE__ */ (0, r.jsx)("strong", { children: g.removed }), " suppression(s)"] }),
					/* @__PURE__ */ (0, r.jsxs)("span", { children: [/* @__PURE__ */ (0, r.jsx)("strong", { children: d.staleCheckIds.length }), " preuve(s) à réexaminer sur l’ensemble du changement"] })
				]
			}),
			d.baseRevisionId ? null : /* @__PURE__ */ (0, r.jsx)("p", {
				className: "arch-note",
				children: "Sans référence antérieure, l’absence de différence ne prouve pas la stabilité du projet."
			}),
			/* @__PURE__ */ (0, r.jsx)("div", {
				className: "impact-changes",
				children: h.length ? h.slice(0, 100).map((t) => /* @__PURE__ */ (0, r.jsxs)("details", {
					open: l === t.path,
					onToggle: (e) => {
						e.currentTarget.open ? u(t.path) : l === t.path && u(null);
					},
					children: [/* @__PURE__ */ (0, r.jsxs)("summary", { children: [
						/* @__PURE__ */ (0, r.jsx)("span", {
							className: `impact-change-kind ${t.kind}`,
							children: i[t.kind]
						}),
						/* @__PURE__ */ (0, r.jsx)("code", { children: t.path }),
						/* @__PURE__ */ (0, r.jsxs)("span", { children: [t.consumerIds.length, " consommateur(s) potentiel(s)"] })
					] }), /* @__PURE__ */ (0, r.jsx)(o, {
						change: t,
						props: e,
						elements: m
					})]
				}, t.path)) : /* @__PURE__ */ (0, r.jsxs)("div", {
					className: "arch-empty",
					children: [/* @__PURE__ */ (0, r.jsx)("h3", { children: "Aucune modification dans ce périmètre" }), /* @__PURE__ */ (0, r.jsx)("p", { children: "Une absence de différence ou de dépendance détectée ne garantit pas une absence d’impact." })]
				})
			}),
			h.length > 100 ? /* @__PURE__ */ (0, r.jsxs)("p", {
				className: "arch-note",
				children: [
					"100 fichiers affichés sur ",
					h.length,
					". Réduisez le périmètre avec la recherche."
				]
			}) : null,
			/* @__PURE__ */ (0, r.jsxs)("details", {
				className: "model-limits",
				children: [/* @__PURE__ */ (0, r.jsxs)("summary", { children: ["Preuves à réexaminer · ", d.staleCheckIds.length] }), d.staleCheckIds.length ? /* @__PURE__ */ (0, r.jsxs)(r.Fragment, { children: [/* @__PURE__ */ (0, r.jsx)("ul", { children: d.staleCheckIds.slice(0, 100).map((e) => /* @__PURE__ */ (0, r.jsx)("li", { children: /* @__PURE__ */ (0, r.jsx)("code", { children: e }) }, e)) }), /* @__PURE__ */ (0, r.jsx)("button", {
					type: "button",
					onClick: () => e.onShowChecks(),
					children: "Ouvrir les preuves et leur version"
				})] }) : /* @__PURE__ */ (0, r.jsx)("p", { children: "Aucune preuve marquée par cette comparaison. Cela ne signifie pas que tous les comportements ont été contrôlés." })]
			}),
			/* @__PURE__ */ (0, r.jsxs)("details", {
				className: "model-limits",
				open: !0,
				children: [/* @__PURE__ */ (0, r.jsx)("summary", { children: "Impact inconnu et limites" }), /* @__PURE__ */ (0, r.jsxs)("ul", { children: [
					d.limits.map((e, t) => /* @__PURE__ */ (0, r.jsx)("li", { children: e }, t)),
					/* @__PURE__ */ (0, r.jsx)("li", { children: "Les appels dynamiques et consommateurs externes non résolus restent inconnus." }),
					/* @__PURE__ */ (0, r.jsx)("li", { children: "Les contrats et schémas ne sont analysés que lorsqu’un extracteur fournit une association." })
				] })]
			})
		]
	});
}
//#endregion
export { s as ImpactView };
