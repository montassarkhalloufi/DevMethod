import { n as e, r as t, t as n } from "./jsx-runtime-Bz8zB3tG.js";
//#region studio-ui/src/features/journey/model/journey.ts
var r = e(), i = (e, t, n) => `${e} ${e === 1 ? t : n}`;
function a(e) {
	return {
		id: "foundation",
		title: "Comprendre le projet",
		purpose: "Retrouver l’intention, les acquis et ce que vous déléguez.",
		status: e.project.idea ? "Intention enregistrée" : "À préciser",
		facts: [e.project.idea || "Décrivez votre idée dans la discussion.", ...e.project.constraints],
		request: "Reprends le contexte et les acquis du projet, ses références et les décisions déléguées. Signale seulement les informations qui manquent pour avancer, sans répéter les questions déjà résolues."
	};
}
function o(e) {
	let t = e.decisions.filter((e) => e.status === "hypothesis");
	return {
		id: "exploration",
		title: "Explorer les possibilités",
		purpose: "Comparer les usages, alternatives et incertitudes utiles avant de choisir.",
		status: t.length ? i(t.length, "hypothèse enregistrée", "hypothèses enregistrées") : "Exploration à documenter",
		facts: t.length ? t.map((e) => `${e.topic} — ${e.choice}`) : ["Aucune hypothèse explicite enregistrée. Cela ne prouve pas qu’une exploration a été menée."],
		request: "Explore les besoins, usages et alternatives réellement différents pour ce projet. Appuie les possibilités sur des observations et propose une expérience bornée pour les incertitudes importantes."
	};
}
function s(e) {
	return {
		id: "frame",
		title: "Cadrer le résultat",
		purpose: "Exprimer le résultat attendu, le périmètre et les critères pour le juger.",
		status: e.brief.outcome ? "Cadrage disponible à examiner" : "À cadrer",
		facts: [e.brief.outcome || "Le résultat attendu reste à préciser.", ...e.brief.criteria.map((e) => e.text)],
		request: "Précise le résultat attendu, le périmètre, les exclusions et les critères observables. Relie-les aux acquis de l’exploration et aux contraintes, sans marquer comme validé ce qui n’a pas été décidé."
	};
}
function c(e) {
	let t = e.decisions.filter((e) => e.status === "active" && /architect|techni|stockage|données|sécurité/i.test(e.topic));
	return {
		id: "architecture",
		title: "Choisir une architecture",
		purpose: "Rendre les compromis techniques compréhensibles et éprouver les risques.",
		status: t.length ? "Choix techniques repérés" : "Choix techniques à expliciter",
		facts: t.length ? t.map((e) => `${e.topic} — ${e.choice}. ${e.reason}`) : ["Aucune décision active repérée par son thème technique. Le code seul ne décrit pas ses compromis."],
		request: "Propose une architecture proportionnée au projet, explicite les alternatives et compromis, puis éprouve les hypothèses risquées. Préserve les choix de design retenus et les données existantes."
	};
}
function l(e) {
	let t = e.revisions.find((t) => t.id === e.activeRevision), n = t ? e.checks.filter((e) => e.revisionId === t.id) : [];
	return {
		id: "delivery",
		title: "Réaliser et vérifier",
		purpose: "Livrer une tranche utilisable, confronter le résultat aux critères et pouvoir reprendre.",
		status: e.revisions.length ? i(e.revisions.length, "version enregistrée", "versions enregistrées") : "Application à réaliser",
		facts: t ? [`Version active : ${t.title}.`, `${n.length} contrôle(s) enregistré(s) sur cette version. Leur présence ne prouve pas la couverture de tous les critères.`] : ["Aucune version active. Une direction visuelle ne remplace pas une application exécutée."],
		request: "Réalise une tranche utilisable à partir des choix autorisés. Exécute les contrôles pertinents, conserve les preuves liées à la version, et vérifie une interruption, une reprise et une évolution du besoin."
	};
}
function u(e) {
	return [
		a(e),
		o(e),
		s(e),
		{
			id: "design",
			title: "Concevoir l’expérience",
			purpose: "Passer de directions distinctes à une référence détaillée, puis aux écrans et au prototype.",
			status: e.designs.length ? i(e.designs.length, "direction disponible", "directions disponibles") : "Directions à créer",
			facts: [],
			request: "Crée trois directions visuelles réellement distinctes du même écran à partir des références. Présente leurs différences pour choisir avant de produire le master détaillé, les écrans dérivés et le prototype interactif."
		},
		c(e),
		l(e)
	];
}
function d(e) {
	let t = e.designJourney, n = t?.masters.find((e) => e.id === t.activeMasterId), r = !!(n && n.designId !== e.selectedDesignId), i = n?.approvedBy === "agent" && e.project.delegation?.visual === "user", a = n ? t?.screens.filter((e) => e.masterId === n.id) ?? [] : [], o = n ? t?.prototypes.filter((e) => e.masterId === n.id).at(-1) : void 0;
	return {
		master: n,
		stale: r,
		approvalInsufficient: i,
		screens: a,
		prototype: o,
		revision: e.revisions.find((e) => e.id === o?.revisionId)
	};
}
//#endregion
//#region studio-ui/src/features/journey/hooks/useJourneyActions.ts
var f = t();
function p(e) {
	let [t, n] = (0, f.useState)(null), [r, i] = (0, f.useState)(null), [a, o] = (0, f.useState)(""), s = (0, f.useRef)(!1);
	function c(t, n) {
		o("");
		try {
			e.onRequest(t, n);
		} catch (e) {
			o(e instanceof Error ? e.message : "La demande n’a pas pu être préparée. Réessayez.");
		}
	}
	async function l(t) {
		if (!s.current && e.onApproveMaster) {
			s.current = !0, n(t), o("");
			try {
				await e.onApproveMaster(t);
			} catch (e) {
				o(e instanceof Error ? e.message : "La validation n’a pas été enregistrée. Réessayez.");
			} finally {
				s.current = !1, n(null);
			}
		}
	}
	async function u(t) {
		if (!s.current && e.onChooseDirection) {
			s.current = !0, i(t), o("");
			try {
				await e.onChooseDirection(t);
			} catch (e) {
				o(e instanceof Error ? e.message : "Le choix n’a pas été enregistré. Réessayez.");
			} finally {
				s.current = !1, i(null);
			}
		}
	}
	return {
		prepare: c,
		approve: l,
		chooseDirection: u,
		pending: t,
		choosing: r,
		error: a
	};
}
//#endregion
//#region studio-ui/src/features/journey/components/DesignJourney.tsx
var m = n();
function h({ state: e, id: t, title: n }) {
	let r = e.references.find((e) => e.id === t && e.mime.startsWith("image/"));
	return r ? /* @__PURE__ */ (0, m.jsxs)("a", {
		href: `/references/${encodeURIComponent(r.id)}`,
		target: "_blank",
		rel: "noopener noreferrer",
		children: [/* @__PURE__ */ (0, m.jsx)("img", {
			src: `/references/${encodeURIComponent(r.id)}`,
			alt: n,
			width: 600,
			height: 400,
			loading: "lazy"
		}), /* @__PURE__ */ (0, m.jsxs)("span", {
			className: "sr-only",
			children: ["Ouvrir la référence ", n]
		})]
	}) : /* @__PURE__ */ (0, m.jsx)("p", {
		className: "journey-gap",
		children: "Image de référence indisponible dans ce projet."
	});
}
function g({ prepare: e, canPrepare: t }) {
	return /* @__PURE__ */ (0, m.jsxs)(m.Fragment, { children: [/* @__PURE__ */ (0, m.jsx)("p", {
		className: "journey-gap",
		children: "Cet accord historique ne suffit plus : vous avez repris la validation visuelle. Préparez un nouveau master à valider ; l’accord précédent reste conservé."
	}), t ? /* @__PURE__ */ (0, m.jsx)("button", {
		type: "button",
		onClick: () => e("design", "Prépare un nouveau master à partir de la direction courante pour ma validation visuelle explicite avant réalisation. Conserve l’ancien master et son accord historique sans les réécrire."),
		children: "Préparer un nouveau master"
	}) : /* @__PURE__ */ (0, m.jsx)("p", { children: "La préparation n’est pas connectée dans cet hôte. Demandez un nouveau master à votre agent." })] });
}
function _({ state: e, pending: t, choosing: n, canApprove: r, canPrepare: i, approve: a, prepare: o }) {
	let { master: s, stale: c, approvalInsufficient: l } = d(e);
	if (!s) return /* @__PURE__ */ (0, m.jsxs)("div", {
		className: "journey-step",
		children: [
			/* @__PURE__ */ (0, m.jsx)("h4", { children: "2. Une référence détaillée" }),
			/* @__PURE__ */ (0, m.jsx)("p", { children: "Le master n’est pas encore enregistré. Sélectionner une direction ne valide pas un écran détaillé." }),
			/* @__PURE__ */ (0, m.jsx)("button", {
				type: "button",
				onClick: () => o("design", "À partir de la direction visuelle choisie, produis un master détaillé du même écran. Conserve la composition, les contenus utiles et les états clés ; présente-le pour validation avant le code UI."),
				children: "Préparer le master"
			})
		]
	});
	let u = l ? "Accord antérieur de l’agent — à réexaminer" : s.approvedBy === "user" ? "Master validé par vous" : s.approvedBy === "agent" ? "Master retenu par délégation" : "Master proposé — à valider";
	return /* @__PURE__ */ (0, m.jsxs)("div", {
		className: "journey-step",
		children: [
			/* @__PURE__ */ (0, m.jsx)("h4", { children: "2. Une référence détaillée" }),
			/* @__PURE__ */ (0, m.jsx)("p", {
				className: "journey-record-status",
				children: u
			}),
			l ? /* @__PURE__ */ (0, m.jsx)(g, {
				prepare: o,
				canPrepare: i
			}) : null,
			c && /* @__PURE__ */ (0, m.jsx)("p", {
				className: "journey-gap",
				children: "Ce master correspond à une autre direction. Réexaminez-le avant de poursuivre."
			}),
			/* @__PURE__ */ (0, m.jsx)(h, {
				state: e,
				id: s.referenceId,
				title: "Master détaillé de la direction"
			}),
			s.approvalReason && /* @__PURE__ */ (0, m.jsx)("p", { children: s.approvalReason }),
			!s.approvedBy && !c && /* @__PURE__ */ (0, m.jsx)("button", {
				type: "button",
				className: "primary",
				disabled: !r || t !== null || n !== null,
				onClick: () => void a(s.id),
				children: t === s.id ? "Validation en cours…" : "Valider ce master"
			}),
			!s.approvedBy && !r && /* @__PURE__ */ (0, m.jsx)("p", { children: "La validation du master n’est pas disponible dans cet hôte." })
		]
	});
}
function v({ state: e, prepare: t }) {
	let { screens: n, prototype: r, revision: i, stale: a } = d(e);
	return /* @__PURE__ */ (0, m.jsxs)(m.Fragment, { children: [/* @__PURE__ */ (0, m.jsxs)("div", {
		className: "journey-step",
		children: [
			/* @__PURE__ */ (0, m.jsx)("h4", { children: "3. Les écrans et leurs états" }),
			/* @__PURE__ */ (0, m.jsx)("p", { children: "Décliner la référence retenue pour les autres écrans, le mobile, le chargement et les erreurs." }),
			a && /* @__PURE__ */ (0, m.jsx)("p", {
				className: "journey-gap",
				children: "La direction a changé : ces enregistrements doivent être réexaminés."
			}),
			n.length ? /* @__PURE__ */ (0, m.jsx)("div", {
				className: "journey-image-grid",
				children: n.map((t) => /* @__PURE__ */ (0, m.jsxs)("figure", { children: [/* @__PURE__ */ (0, m.jsx)(h, {
					state: e,
					id: t.referenceId,
					title: t.title
				}), /* @__PURE__ */ (0, m.jsx)("figcaption", { children: t.title })] }, t.id))
			}) : /* @__PURE__ */ (0, m.jsx)("p", {
				className: "journey-gap",
				children: "Aucun écran dérivé lié au master courant."
			}),
			/* @__PURE__ */ (0, m.jsx)("button", {
				type: "button",
				onClick: () => t("design", "À partir du master approuvé, décline les écrans et états nécessaires : mobile, chargement, vide, erreur et reprise. Enregistre leurs références et leurs liens au master ; ne remplace pas ces images par une simple description."),
				children: "Préparer les déclinaisons"
			})
		]
	}), /* @__PURE__ */ (0, m.jsxs)("div", {
		className: "journey-step",
		children: [
			/* @__PURE__ */ (0, m.jsx)("h4", { children: "4. Le prototype interactif" }),
			/* @__PURE__ */ (0, m.jsx)("p", { children: r && i ? `Prototype relié à « ${i.title} ». Les interactions et la fidélité restent à vérifier.` : "Aucun prototype exécutable n’est relié au master courant. Une image ne prouve pas une interaction." }),
			/* @__PURE__ */ (0, m.jsx)("button", {
				type: "button",
				onClick: () => t("design", "Réalise un prototype interactif à partir du master approuvé et de ses écrans dérivés. Relie la version au master et vérifie dans le navigateur les interactions et la fidélité visuelle. Distingue les données simulées des fonctions exécutées."),
				children: "Préparer le prototype"
			})
		]
	})] });
}
function y(e) {
	let t = e.state.designs.find((t) => t.id === e.state.selectedDesignId);
	return /* @__PURE__ */ (0, m.jsxs)("div", {
		className: "design-journey",
		children: [
			/* @__PURE__ */ (0, m.jsxs)("div", {
				className: "journey-step",
				children: [
					/* @__PURE__ */ (0, m.jsx)("h4", { children: "1. Trois directions du même écran" }),
					/* @__PURE__ */ (0, m.jsx)("p", { children: "Comparer des compositions distinctes avant de choisir une référence." }),
					/* @__PURE__ */ (0, m.jsx)("div", {
						className: "journey-image-grid",
						children: e.state.designs.map((n) => /* @__PURE__ */ (0, m.jsxs)("figure", {
							"data-selected": n.id === t?.id,
							children: [
								/* @__PURE__ */ (0, m.jsx)(h, {
									state: e.state,
									id: n.file,
									title: n.title
								}),
								/* @__PURE__ */ (0, m.jsxs)("figcaption", { children: [
									/* @__PURE__ */ (0, m.jsx)("strong", { children: n.title }),
									n.id === t?.id && /* @__PURE__ */ (0, m.jsx)("span", { children: "Direction retenue" }),
									/* @__PURE__ */ (0, m.jsx)("p", { children: n.description })
								] }),
								/* @__PURE__ */ (0, m.jsx)("button", {
									type: "button",
									"aria-label": `Choisir la direction ${n.title}`,
									"aria-pressed": n.id === t?.id,
									disabled: !e.canChoose || e.pending !== null || e.choosing !== null || n.id === t?.id,
									onClick: () => void e.chooseDirection(n.id),
									children: e.choosing === n.id ? "Enregistrement…" : n.id === t?.id ? "Direction retenue" : "Choisir cette direction"
								})
							]
						}, n.id))
					}),
					!e.canChoose && /* @__PURE__ */ (0, m.jsx)("p", {
						className: "journey-gap",
						children: "Le choix d’une direction n’est pas connecté dans cet hôte."
					}),
					e.state.designs.length < 3 && /* @__PURE__ */ (0, m.jsxs)("p", {
						className: "journey-gap",
						children: [e.state.designs.length, " direction(s) disponible(s) ; trois propositions comparables restent à réunir."]
					}),
					t && /* @__PURE__ */ (0, m.jsxs)("p", { children: [
						"La direction « ",
						t.title,
						" » est retenue. Les étapes suivantes restent distinctes."
					] }),
					/* @__PURE__ */ (0, m.jsx)("button", {
						type: "button",
						onClick: () => e.prepare("design", "Crée trois directions visuelles réellement distinctes du même écran, à partir des références et de l’intention. Présente leurs différences pour choisir avant de développer le code UI."),
						children: "Préparer les directions"
					})
				]
			}),
			/* @__PURE__ */ (0, m.jsx)(_, { ...e }),
			/* @__PURE__ */ (0, m.jsx)(v, {
				state: e.state,
				prepare: e.prepare
			})
		]
	});
}
//#endregion
//#region studio-ui/src/features/journey/components/JourneyView.tsx
function b({ stage: e, prepare: t }) {
	return /* @__PURE__ */ (0, m.jsxs)("section", {
		className: "journey-stage",
		id: `journey-${e.id}`,
		"aria-labelledby": `journey-title-${e.id}`,
		children: [
			/* @__PURE__ */ (0, m.jsxs)("div", {
				className: "journey-stage-heading",
				children: [/* @__PURE__ */ (0, m.jsx)("h3", {
					id: `journey-title-${e.id}`,
					children: e.title
				}), /* @__PURE__ */ (0, m.jsx)("span", {
					className: "journey-record-status",
					children: e.status
				})]
			}),
			/* @__PURE__ */ (0, m.jsx)("p", {
				className: "journey-purpose",
				children: e.purpose
			}),
			/* @__PURE__ */ (0, m.jsx)("ul", {
				className: "journey-facts",
				children: e.facts.map((t, n) => /* @__PURE__ */ (0, m.jsx)("li", { children: t }, `${e.id}-${n}`))
			}),
			/* @__PURE__ */ (0, m.jsx)("button", {
				type: "button",
				onClick: () => t(e.id, e.request),
				children: "Préparer la demande"
			})
		]
	});
}
function x(e) {
	let t = u(e.state), n = p(e);
	return /* @__PURE__ */ (0, m.jsxs)("div", {
		className: "journey-view",
		children: [
			/* @__PURE__ */ (0, m.jsxs)("header", {
				className: "journey-heading",
				children: [
					/* @__PURE__ */ (0, m.jsx)("p", {
						className: "eyebrow",
						children: "DE L’INTENTION AU PRODUIT"
					}),
					/* @__PURE__ */ (0, m.jsx)("h2", { children: "Le parcours de votre projet" }),
					/* @__PURE__ */ (0, m.jsx)("p", { children: "Retrouvez les acquis, les choix et les étapes à approfondir. Une trace disponible ne signifie pas que l’étape est validée." })
				]
			}),
			/* @__PURE__ */ (0, m.jsx)("nav", {
				className: "journey-navigation",
				"aria-label": "Étapes du projet",
				children: /* @__PURE__ */ (0, m.jsx)("ol", { children: t.map((e, t) => /* @__PURE__ */ (0, m.jsx)("li", { children: /* @__PURE__ */ (0, m.jsxs)("a", {
					href: `#journey-${e.id}`,
					children: [/* @__PURE__ */ (0, m.jsx)("span", {
						"aria-hidden": "true",
						children: t + 1
					}), e.title]
				}) }, e.id)) })
			}),
			/* @__PURE__ */ (0, m.jsx)("p", {
				className: "journey-action-note",
				children: "« Préparer » rédige une demande dans la discussion. Cela ne lance pas une génération ni une validation."
			}),
			n.error && /* @__PURE__ */ (0, m.jsx)("p", {
				className: "inline-error",
				role: "alert",
				children: n.error
			}),
			/* @__PURE__ */ (0, m.jsx)("div", {
				className: "journey-stages",
				children: t.map((t) => t.id === "design" ? /* @__PURE__ */ (0, m.jsxs)("section", {
					className: "journey-stage journey-design",
					id: "journey-design",
					"aria-labelledby": "journey-title-design",
					children: [
						/* @__PURE__ */ (0, m.jsxs)("div", {
							className: "journey-stage-heading",
							children: [/* @__PURE__ */ (0, m.jsx)("h3", {
								id: "journey-title-design",
								children: t.title
							}), /* @__PURE__ */ (0, m.jsx)("span", {
								className: "journey-record-status",
								children: t.status
							})]
						}),
						/* @__PURE__ */ (0, m.jsx)("p", {
							className: "journey-purpose",
							children: t.purpose
						}),
						/* @__PURE__ */ (0, m.jsx)(y, {
							state: e.state,
							pending: n.pending,
							choosing: n.choosing,
							canApprove: !!e.onApproveMaster,
							canChoose: !!e.onChooseDirection,
							canPrepare: typeof e.onRequest == "function",
							approve: n.approve,
							chooseDirection: n.chooseDirection,
							prepare: n.prepare
						})
					]
				}, t.id) : /* @__PURE__ */ (0, m.jsx)(b, {
					stage: t,
					prepare: n.prepare
				}, t.id))
			})
		]
	});
}
//#endregion
//#region studio-ui/src/journey-widget.tsx
function S(e, t) {
	let n = (0, r.createRoot)(e), i = !1, a = (e) => {
		i || n.render(/* @__PURE__ */ (0, m.jsx)(x, { ...e }));
	};
	return a(t), {
		update: a,
		dispose() {
			i || (i = !0, n.unmount());
		}
	};
}
//#endregion
export { S as mountJourneyWidget };
