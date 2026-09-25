import { i as e, n as t, t as n } from "./jsx-runtime-D7gWoUTT.js";
//#region studio-ui/src/features/journey/model/journey.ts
var r = t(), i = (e, t, n) => `${e} ${e === 1 ? t : n}`;
function a(e) {
	return {
		id: "foundation",
		title: "Comprendre le projet",
		purpose: "Retrouver l’intention, les acquis et ce que vous déléguez.",
		status: e.import ? "Référence importée · contexte à examiner" : e.project.idea ? "Intention enregistrée" : "À préciser",
		facts: [e.project.idea || (e.import ? "Précisez l’objectif de la prochaine évolution dans la discussion." : "Décrivez votre idée dans la discussion."), ...e.project.constraints],
		request: "Reprends le contexte et les acquis du projet, ses références et les décisions déléguées. Signale seulement les informations qui manquent pour avancer, sans répéter les questions déjà résolues."
	};
}
function o(e) {
	let t = e.decisions.filter((e) => e.status === "hypothesis" || e.status === "active" && /explor/i.test(e.topic));
	return {
		id: "exploration",
		title: "Explorer les possibilités",
		purpose: "Comparer les usages, alternatives et incertitudes utiles avant de choisir.",
		status: t.length ? i(t.length, "piste enregistrée", "pistes enregistrées") : "Exploration à documenter",
		facts: t.length ? t.map((e) => `${e.status === "hypothesis" ? "Hypothèse" : "Choix actif"} : ${e.topic} — ${e.choice}${e.reason ? `. ${e.reason}` : ""}`) : ["Aucune hypothèse ou décision d’exploration enregistrée. Cela ne prouve pas qu’une exploration a été menée."],
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
//#region studio-ui/src/features/journey/model/navigation.ts
var f = {
	foundation: "Projet",
	exploration: "Discovery",
	frame: "Cadrage",
	design: "Design",
	architecture: "Architecture",
	delivery: "Réalisation"
}, p = {
	directions: "Directions",
	master: "Master",
	screens: "Écrans et états",
	prototype: "Prototype"
};
function m(e) {
	let [, t, n] = e.split("-");
	return {
		stage: Object.hasOwn(f, t ?? "") ? t : "foundation",
		step: Object.hasOwn(p, n ?? "") ? n : "directions"
	};
}
//#endregion
//#region studio-ui/src/features/journey/hooks/useJourneyActions.ts
var h = e();
function g(e) {
	let [t, n] = (0, h.useState)(null), [r, i] = (0, h.useState)(null), [a, o] = (0, h.useState)(""), s = (0, h.useRef)(!1);
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
//#region studio-ui/src/features/journey/hooks/useJourneyNavigation.ts
var _ = "studio:journey-navigation";
function v(e) {
	return window.addEventListener("hashchange", e), window.addEventListener("popstate", e), window.addEventListener(_, e), () => {
		window.removeEventListener("hashchange", e), window.removeEventListener("popstate", e), window.removeEventListener(_, e);
	};
}
var y = () => window.location.hash;
function b() {
	let e = (0, h.useSyncExternalStore)(v, y, () => "");
	function t(e) {
		if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
		e.preventDefault();
		let t = e.currentTarget.hash;
		t !== window.location.hash && (window.history.pushState(null, "", t), window.dispatchEvent(new Event(_)));
	}
	return {
		...m(e),
		navigate: t
	};
}
//#endregion
//#region studio-ui/src/features/journey/components/DesignJourney.tsx
var x = n();
function S({ state: e, id: t, title: n }) {
	let r = e.references.find((e) => e.id === t && e.mime.startsWith("image/"));
	return r ? /* @__PURE__ */ (0, x.jsxs)("a", {
		href: `/references/${encodeURIComponent(r.id)}`,
		target: "_blank",
		rel: "noopener noreferrer",
		children: [/* @__PURE__ */ (0, x.jsx)("img", {
			src: `/references/${encodeURIComponent(r.id)}`,
			alt: n,
			width: 600,
			height: 400,
			loading: "lazy"
		}), /* @__PURE__ */ (0, x.jsxs)("span", {
			className: "sr-only",
			children: ["Ouvrir la référence ", n]
		})]
	}) : /* @__PURE__ */ (0, x.jsx)("p", {
		className: "journey-gap",
		children: "Image de référence indisponible dans ce projet."
	});
}
function C({ prepare: e, canPrepare: t }) {
	return /* @__PURE__ */ (0, x.jsxs)(x.Fragment, { children: [/* @__PURE__ */ (0, x.jsx)("p", {
		className: "journey-gap",
		children: "Cet accord historique ne suffit plus : vous avez repris la validation visuelle. Préparez un nouveau master à valider ; l’accord précédent reste conservé."
	}), t ? /* @__PURE__ */ (0, x.jsx)("button", {
		type: "button",
		onClick: () => e("design", "Prépare un nouveau master à partir de la direction courante pour ma validation visuelle explicite avant réalisation. Conserve l’ancien master et son accord historique sans les réécrire."),
		children: "Préparer un nouveau master"
	}) : /* @__PURE__ */ (0, x.jsx)("p", { children: "La préparation n’est pas connectée dans cet hôte. Demandez un nouveau master à votre agent." })] });
}
function w({ state: e, pending: t, choosing: n, canApprove: r, canPrepare: i, approve: a, prepare: o }) {
	let { master: s, stale: c, approvalInsufficient: l } = d(e);
	if (!s) return /* @__PURE__ */ (0, x.jsxs)("div", {
		className: "journey-step",
		children: [
			/* @__PURE__ */ (0, x.jsx)("h4", { children: "2. Une référence détaillée" }),
			/* @__PURE__ */ (0, x.jsx)("p", { children: "Le master n’est pas encore enregistré. Sélectionner une direction ne valide pas un écran détaillé." }),
			/* @__PURE__ */ (0, x.jsx)("button", {
				type: "button",
				onClick: () => o("design", "À partir de la direction visuelle choisie, produis un master détaillé du même écran. Conserve la composition, les contenus utiles et les états clés ; présente-le pour validation avant le code UI."),
				children: "Préparer le master"
			})
		]
	});
	let u = l ? "Accord antérieur de l’agent — à réexaminer" : s.approvedBy === "user" ? "Master validé par vous" : s.approvedBy === "agent" ? "Master retenu par délégation" : "Master proposé — à valider";
	return /* @__PURE__ */ (0, x.jsxs)("div", {
		className: "journey-step",
		children: [
			/* @__PURE__ */ (0, x.jsx)("h4", { children: "2. Une référence détaillée" }),
			/* @__PURE__ */ (0, x.jsx)("p", {
				className: "journey-record-status",
				children: u
			}),
			l ? /* @__PURE__ */ (0, x.jsx)(C, {
				prepare: o,
				canPrepare: i
			}) : null,
			c && /* @__PURE__ */ (0, x.jsx)("p", {
				className: "journey-gap",
				children: "Ce master correspond à une autre direction. Réexaminez-le avant de poursuivre."
			}),
			/* @__PURE__ */ (0, x.jsx)(S, {
				state: e,
				id: s.referenceId,
				title: "Master détaillé de la direction"
			}),
			s.approvalReason && /* @__PURE__ */ (0, x.jsx)("p", { children: s.approvalReason }),
			!s.approvedBy && !c && /* @__PURE__ */ (0, x.jsx)("button", {
				type: "button",
				className: "primary",
				disabled: !r || t !== null || n !== null,
				onClick: () => void a(s.id),
				children: t === s.id ? "Validation en cours…" : "Valider ce master"
			}),
			!s.approvedBy && !r && /* @__PURE__ */ (0, x.jsx)("p", { children: "La validation du master n’est pas disponible dans cet hôte." })
		]
	});
}
function T({ state: e, prepare: t }) {
	let { screens: n, stale: r } = d(e);
	return /* @__PURE__ */ (0, x.jsxs)("div", {
		className: "journey-step",
		children: [
			/* @__PURE__ */ (0, x.jsx)("h4", { children: "3. Les écrans et leurs états" }),
			/* @__PURE__ */ (0, x.jsx)("p", { children: "Décliner la référence retenue pour les autres écrans, le mobile, le chargement et les erreurs." }),
			r && /* @__PURE__ */ (0, x.jsx)("p", {
				className: "journey-gap",
				children: "La direction a changé : ces enregistrements doivent être réexaminés."
			}),
			n.length ? /* @__PURE__ */ (0, x.jsx)("div", {
				className: "journey-image-grid",
				children: n.map((t) => /* @__PURE__ */ (0, x.jsxs)("figure", { children: [/* @__PURE__ */ (0, x.jsx)(S, {
					state: e,
					id: t.referenceId,
					title: t.title
				}), /* @__PURE__ */ (0, x.jsx)("figcaption", { children: t.title })] }, t.id))
			}) : /* @__PURE__ */ (0, x.jsx)("p", {
				className: "journey-gap",
				children: "Aucun écran dérivé lié au master courant."
			}),
			/* @__PURE__ */ (0, x.jsx)("button", {
				type: "button",
				onClick: () => t("design", "À partir du master approuvé, décline les écrans et états nécessaires : mobile, chargement, vide, erreur et reprise. Enregistre leurs références et leurs liens au master ; ne remplace pas ces images par une simple description."),
				children: "Préparer les déclinaisons"
			})
		]
	});
}
function E({ state: e, prepare: t, openPrototype: n }) {
	let { prototype: r, revision: i, stale: a, approvalInsufficient: o, master: s } = d(e), c = a || o || !s?.approvedBy;
	return /* @__PURE__ */ (0, x.jsxs)("div", {
		className: "journey-step",
		children: [
			/* @__PURE__ */ (0, x.jsx)("h4", { children: "4. Le prototype interactif" }),
			r && c ? /* @__PURE__ */ (0, x.jsx)("p", {
				className: "journey-gap",
				children: "Ce prototype est conservé pour examen. Son master est à réexaminer ou à valider avant toute nouvelle réalisation ; l’ouverture ne vaut pas accord."
			}) : null,
			/* @__PURE__ */ (0, x.jsx)("p", { children: r && i ? `Prototype relié à « ${i.title} ». Les interactions et la fidélité restent à vérifier.` : "Aucun prototype exécutable n’est relié au master courant. Une image ne prouve pas une interaction." }),
			/* @__PURE__ */ (0, x.jsx)("p", { children: "Ce prototype éprouve le parcours d’usage. Un POC technique peut être mené séparément pour une hypothèse d’architecture risquée." }),
			r && i && n ? /* @__PURE__ */ (0, x.jsx)("button", {
				type: "button",
				className: "primary",
				onClick: () => n(i.id),
				children: "Essayer ce prototype"
			}) : null,
			r && i ? /* @__PURE__ */ (0, x.jsx)("p", { children: "Ouvrir cette version ne l’active pas et ne valide pas ses interactions." }) : null,
			/* @__PURE__ */ (0, x.jsx)("button", {
				type: "button",
				onClick: () => t("design", "Réalise un prototype interactif à partir du master approuvé et de ses écrans dérivés. Relie la version au master et vérifie dans le navigateur les interactions et la fidélité visuelle. Distingue les données simulées des fonctions exécutées."),
				children: "Préparer le prototype"
			})
		]
	});
}
function D(e) {
	let t = e.state.designs.find((t) => t.id === e.state.selectedDesignId), n = e.navigation;
	return /* @__PURE__ */ (0, x.jsxs)("div", {
		className: "design-journey",
		children: [
			/* @__PURE__ */ (0, x.jsx)("nav", {
				className: "design-step-navigation",
				"aria-label": "Jalons du design",
				children: Object.entries(p).map(([e, t], r) => /* @__PURE__ */ (0, x.jsxs)("a", {
					href: `#journey-design-${e}`,
					onClick: n.navigate,
					"aria-current": e === n.step ? "step" : void 0,
					children: [
						/* @__PURE__ */ (0, x.jsx)("span", { children: r + 1 }),
						" ",
						t
					]
				}, e))
			}),
			n.step === "directions" ? /* @__PURE__ */ (0, x.jsxs)("div", {
				className: "journey-step",
				children: [
					/* @__PURE__ */ (0, x.jsx)("h4", { children: "1. Comparer les directions du même écran" }),
					/* @__PURE__ */ (0, x.jsx)("p", { children: "Pour une nouvelle identité : trois compositions distinctes du même contenu, sauf autre format convenu. Une direction déjà approuvée peut être conservée." }),
					/* @__PURE__ */ (0, x.jsx)("div", {
						className: "journey-image-grid",
						children: e.state.designs.map((n) => /* @__PURE__ */ (0, x.jsxs)("figure", {
							"data-selected": n.id === t?.id,
							children: [
								/* @__PURE__ */ (0, x.jsx)(S, {
									state: e.state,
									id: n.file,
									title: n.title
								}),
								/* @__PURE__ */ (0, x.jsxs)("figcaption", { children: [
									/* @__PURE__ */ (0, x.jsx)("strong", { children: n.title }),
									n.id === t?.id && /* @__PURE__ */ (0, x.jsx)("span", { children: "Direction retenue" }),
									/* @__PURE__ */ (0, x.jsx)("p", { children: n.description })
								] }),
								/* @__PURE__ */ (0, x.jsx)("button", {
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
					!e.canChoose && /* @__PURE__ */ (0, x.jsx)("p", {
						className: "journey-gap",
						children: "Le choix d’une direction n’est pas connecté dans cet hôte."
					}),
					e.state.designs.length < 3 && /* @__PURE__ */ (0, x.jsxs)("p", {
						className: "journey-gap",
						children: [e.state.designs.length, " direction(s) disponible(s). Pour une nouvelle identité sans exception convenue, réunissez trois propositions comparables."]
					}),
					t && /* @__PURE__ */ (0, x.jsxs)("p", { children: [
						"La direction « ",
						t.title,
						" » est retenue. Les étapes suivantes restent distinctes."
					] }),
					/* @__PURE__ */ (0, x.jsx)("button", {
						type: "button",
						onClick: () => e.prepare("design", "Crée trois directions visuelles réellement distinctes du même écran, à partir des références et de l’intention. Présente leurs différences pour choisir avant de développer le code UI."),
						children: "Préparer les directions"
					})
				]
			}) : null,
			n.step === "master" ? /* @__PURE__ */ (0, x.jsx)(w, { ...e }) : null,
			n.step === "screens" ? /* @__PURE__ */ (0, x.jsx)(T, {
				state: e.state,
				prepare: e.prepare
			}) : null,
			n.step === "prototype" ? /* @__PURE__ */ (0, x.jsx)(E, {
				state: e.state,
				prepare: e.prepare,
				openPrototype: e.openPrototype
			}) : null,
			/* @__PURE__ */ (0, x.jsx)("p", {
				className: "journey-action-note",
				children: "« Préparer » rédige une demande dans la conversation. Cela ne génère aucune image et ne lance aucune réalisation."
			})
		]
	});
}
//#endregion
//#region studio-ui/src/features/journey/components/ProjectOrigin.tsx
var O = (e) => `'${e.replaceAll("'", "'\\''")}'`;
function k() {
	let [e, t] = (0, h.useState)("/chemin/du-projet"), [n, r] = (0, h.useState)("/chemin/du-studio"), i = `devmethod studio import --source ${O(e)} --workspace ${O(n)}`;
	return /* @__PURE__ */ (0, x.jsxs)("details", {
		className: "journey-import-guide",
		children: [
			/* @__PURE__ */ (0, x.jsx)("summary", { children: "Reprendre un projet existant sans DevMethod" }),
			/* @__PURE__ */ (0, x.jsx)("p", { children: "Inspectez un dossier local ou un dépôt déjà cloné, puis conservez sa référence initiale dans un nouvel espace Studio. Cette opération se lance dans le terminal ; le dossier source reste intact." }),
			/* @__PURE__ */ (0, x.jsxs)("div", {
				className: "journey-brief-columns",
				children: [/* @__PURE__ */ (0, x.jsxs)("label", { children: ["Dossier source", /* @__PURE__ */ (0, x.jsx)("input", {
					value: e,
					onChange: (e) => t(e.target.value)
				})] }), /* @__PURE__ */ (0, x.jsxs)("label", { children: ["Nouveau dossier Studio, distinct et vide", /* @__PURE__ */ (0, x.jsx)("input", {
					value: n,
					onChange: (e) => r(e.target.value)
				})] })]
			}),
			/* @__PURE__ */ (0, x.jsxs)("ol", { children: [/* @__PURE__ */ (0, x.jsxs)("li", { children: ["Inspecter les fichiers retenus, exclusions et capacités :", /* @__PURE__ */ (0, x.jsxs)("pre", { children: [i, " --dry-run"] })] }), /* @__PURE__ */ (0, x.jsxs)("li", { children: ["Importer puis ouvrir le nouvel espace :", /* @__PURE__ */ (0, x.jsxs)("pre", { children: [
				i,
				"\n",
				"devmethod studio serve --workspace ",
				O(n)
			] })] })] }),
			/* @__PURE__ */ (0, x.jsx)("p", {
				className: "journey-action-note",
				children: "Aucun script du projet n’est exécuté à l’import. L’analyse distingue les informations détectées, déclarées et inconnues. Un projet importable n’est pas nécessairement exécutable dans l’aperçu Studio."
			})
		]
	});
}
function A({ state: e, onOpenSource: t }) {
	let n = e.import;
	return n ? /* @__PURE__ */ (0, x.jsxs)("section", {
		className: "journey-origin",
		"aria-labelledby": "project-origin-title",
		children: [
			/* @__PURE__ */ (0, x.jsxs)("h4", {
				id: "project-origin-title",
				children: ["Projet repris · ", n.source.name]
			}),
			/* @__PURE__ */ (0, x.jsxs)("p", { children: [
				n.inventory.included,
				" fichiers conservés · référence",
				" ",
				n.baselineRevision.slice(0, 8),
				" · import du",
				" ",
				new Date(n.source.importedAt).toLocaleString("fr-FR"),
				"."
			] }),
			/* @__PURE__ */ (0, x.jsx)("p", {
				className: "journey-action-note",
				children: "Cet état décrit les sources au moment de l’import. Il ne constitue ni une validation du produit ni une exécution de ses commandes."
			}),
			/* @__PURE__ */ (0, x.jsx)("div", {
				className: "journey-origin-facts",
				children: n.context.facts.map((e, r) => /* @__PURE__ */ (0, x.jsxs)("article", { children: [
					/* @__PURE__ */ (0, x.jsx)("strong", { children: e.label }),
					/* @__PURE__ */ (0, x.jsx)("p", { children: e.value }),
					/* @__PURE__ */ (0, x.jsxs)("small", { children: [
						e.provenance.kind === "declared" ? "Déclaré dans le projet" : "Détecté dans les sources",
						" ",
						"·",
						" "
					] }),
					t ? /* @__PURE__ */ (0, x.jsxs)("button", {
						type: "button",
						onClick: () => t(e.provenance.path, n.baselineRevision),
						children: [e.provenance.path, " ↗"]
					}) : /* @__PURE__ */ (0, x.jsx)("code", { children: e.provenance.path })
				] }, `${e.provenance.path}:${r}`))
			}),
			/* @__PURE__ */ (0, x.jsxs)("details", {
				open: !0,
				children: [/* @__PURE__ */ (0, x.jsx)("summary", { children: "Ce qui reste à établir" }), /* @__PURE__ */ (0, x.jsx)("ul", { children: n.context.unknowns.map((e) => /* @__PURE__ */ (0, x.jsx)("li", { children: e }, e)) })]
			}),
			/* @__PURE__ */ (0, x.jsxs)("details", { children: [
				/* @__PURE__ */ (0, x.jsxs)("summary", { children: [
					"Périmètre de l’import · ",
					n.inventory.excluded.length,
					" exclusions"
				] }),
				/* @__PURE__ */ (0, x.jsxs)("p", { children: ["Empreinte de la référence : ", /* @__PURE__ */ (0, x.jsx)("code", { children: n.source.fingerprint })] }),
				/* @__PURE__ */ (0, x.jsxs)("p", { children: [
					"Analyse : ",
					n.context.analysis.status,
					" ·",
					" ",
					n.context.analysis.stack.join(", ") || "Stack non identifiée",
					"."
				] }),
				/* @__PURE__ */ (0, x.jsx)("ul", { children: n.inventory.excluded.map((e) => /* @__PURE__ */ (0, x.jsxs)("li", { children: [
					/* @__PURE__ */ (0, x.jsx)("code", { children: e.path }),
					" — ",
					e.reason
				] }, e.path)) })
			] })
		]
	}) : /* @__PURE__ */ (0, x.jsxs)("section", {
		className: "journey-origin",
		children: [
			/* @__PURE__ */ (0, x.jsx)("h4", { children: "Deux points de départ" }),
			/* @__PURE__ */ (0, x.jsxs)("p", { children: [/* @__PURE__ */ (0, x.jsx)("strong", { children: "Créer de zéro :" }), " décrivez votre idée ; le cadrage, la conception et la réalisation s’appuieront sur vos choix."] }),
			/* @__PURE__ */ (0, x.jsx)(k, {})
		]
	});
}
//#endregion
//#region studio-ui/src/features/journey/components/StageWorkspace.tsx
function j({ title: e, items: t, empty: n }) {
	return /* @__PURE__ */ (0, x.jsxs)("section", {
		className: "journey-brief-section",
		children: [/* @__PURE__ */ (0, x.jsx)("h4", { children: e }), t.length > 0 ? /* @__PURE__ */ (0, x.jsx)("ul", {
			className: "journey-facts",
			children: t.map((e, t) => /* @__PURE__ */ (0, x.jsx)("li", { children: e }, t))
		}) : /* @__PURE__ */ (0, x.jsx)("p", {
			className: "journey-gap",
			children: n
		})]
	});
}
function M({ brief: e }) {
	return /* @__PURE__ */ (0, x.jsxs)("div", {
		className: "journey-brief",
		children: [
			/* @__PURE__ */ (0, x.jsxs)("section", {
				className: "journey-brief-section journey-outcome",
				children: [/* @__PURE__ */ (0, x.jsx)("h4", { children: "Le résultat attendu" }), /* @__PURE__ */ (0, x.jsx)("p", { children: e.outcome || "Le résultat attendu reste à préciser." })]
			}),
			/* @__PURE__ */ (0, x.jsxs)("div", {
				className: "journey-brief-columns",
				children: [/* @__PURE__ */ (0, x.jsx)(j, {
					title: "Dans le périmètre",
					items: e.scope,
					empty: "Le périmètre reste à préciser."
				}), /* @__PURE__ */ (0, x.jsx)(j, {
					title: "Hors périmètre",
					items: e.excluded,
					empty: "Les exclusions restent à préciser."
				})]
			}),
			/* @__PURE__ */ (0, x.jsx)(j, {
				title: "Comment juger le résultat",
				items: e.criteria.map((e) => e.text),
				empty: "Aucun critère observable enregistré."
			}),
			/* @__PURE__ */ (0, x.jsx)("p", {
				className: "journey-action-note",
				children: "Ce cadrage est enregistré. Sa présence ne vaut pas approbation ni réussite des critères."
			})
		]
	});
}
function N({ references: e }) {
	return /* @__PURE__ */ (0, x.jsxs)("section", {
		className: "journey-brief-section",
		children: [/* @__PURE__ */ (0, x.jsx)("h4", { children: "Références conservées" }), e.length > 0 ? /* @__PURE__ */ (0, x.jsx)("ul", {
			className: "journey-facts",
			children: e.map((e) => /* @__PURE__ */ (0, x.jsx)("li", { children: /* @__PURE__ */ (0, x.jsx)("a", {
				href: `/references/${encodeURIComponent(e.id)}`,
				target: "_blank",
				rel: "noopener noreferrer",
				children: e.name
			}) }, e.id))
		}) : /* @__PURE__ */ (0, x.jsx)("p", {
			className: "journey-gap",
			children: "Aucune référence jointe à ce projet."
		})]
	});
}
function P({ stage: e, state: t, prepare: n, onOpenSource: r }) {
	return /* @__PURE__ */ (0, x.jsxs)(x.Fragment, { children: [
		e.id === "foundation" ? /* @__PURE__ */ (0, x.jsx)(A, {
			state: t,
			onOpenSource: r
		}) : null,
		e.id === "frame" ? /* @__PURE__ */ (0, x.jsx)(M, { brief: t.brief }) : /* @__PURE__ */ (0, x.jsx)("ul", {
			className: "journey-facts",
			children: e.facts.map((t, n) => /* @__PURE__ */ (0, x.jsx)("li", { children: t }, `${e.id}-${n}`))
		}),
		e.id === "foundation" ? /* @__PURE__ */ (0, x.jsx)(N, { references: t.references }) : null,
		e.id === "exploration" ? /* @__PURE__ */ (0, x.jsx)("p", {
			className: "journey-action-note",
			children: "Un choix actif n’est pas une preuve ; les hypothèses restent à éprouver. Les sources, observations et résultats d’expériences ne disposent pas encore d’un espace structuré ici."
		}) : null,
		/* @__PURE__ */ (0, x.jsxs)("div", {
			className: "journey-stage-action",
			children: [/* @__PURE__ */ (0, x.jsx)("button", {
				type: "button",
				className: "primary",
				onClick: () => n(e.id, e.request),
				children: "Préparer une demande"
			}), /* @__PURE__ */ (0, x.jsx)("p", { children: "La demande sera placée dans la conversation. Vous pourrez la modifier avant de l’envoyer." })]
		})
	] });
}
//#endregion
//#region studio-ui/src/features/journey/components/JourneyView.tsx
function F(e) {
	let t = u(e.state), n = g(e), r = b(), i = t.find((e) => e.id === r.stage);
	return /* @__PURE__ */ (0, x.jsxs)("div", {
		className: "journey-view",
		children: [
			/* @__PURE__ */ (0, x.jsxs)("header", {
				className: "journey-heading",
				children: [
					/* @__PURE__ */ (0, x.jsx)("p", {
						className: "eyebrow",
						children: "CONCEPTION DU PRODUIT"
					}),
					/* @__PURE__ */ (0, x.jsx)("h2", { children: e.state.import ? "Reprendre et faire évoluer le projet" : "De l’idée au premier usage" }),
					/* @__PURE__ */ (0, x.jsx)("p", { children: e.state.import ? "Retrouvez les sources, les acquis et les inconnues avant de préparer la prochaine évolution." : "Explorez, cadrez et concevez ici. Retrouvez chaque choix lorsque le produit évolue." })
				]
			}),
			/* @__PURE__ */ (0, x.jsx)("nav", {
				className: "journey-navigation",
				"aria-label": "Espaces de conception",
				children: /* @__PURE__ */ (0, x.jsx)("ol", { children: t.map((e, t) => /* @__PURE__ */ (0, x.jsx)("li", { children: /* @__PURE__ */ (0, x.jsxs)("a", {
					href: `#journey-${e.id}`,
					onClick: r.navigate,
					"aria-current": e.id === i.id ? "step" : void 0,
					children: [/* @__PURE__ */ (0, x.jsx)("span", {
						"aria-hidden": "true",
						children: t + 1
					}), f[e.id]]
				}) }, e.id)) })
			}),
			n.error ? /* @__PURE__ */ (0, x.jsx)("p", {
				className: "inline-error",
				role: "alert",
				children: n.error
			}) : null,
			/* @__PURE__ */ (0, x.jsxs)("section", {
				className: "journey-stage",
				"aria-labelledby": "journey-stage-title",
				children: [
					/* @__PURE__ */ (0, x.jsxs)("div", {
						className: "journey-stage-heading",
						children: [/* @__PURE__ */ (0, x.jsx)("h3", {
							id: "journey-stage-title",
							children: i.title
						}), /* @__PURE__ */ (0, x.jsx)("span", {
							className: "journey-record-status",
							children: i.status
						})]
					}),
					/* @__PURE__ */ (0, x.jsx)("p", {
						className: "journey-purpose",
						children: i.purpose
					}),
					i.id === "design" ? /* @__PURE__ */ (0, x.jsx)(D, {
						state: e.state,
						pending: n.pending,
						choosing: n.choosing,
						canApprove: !!e.onApproveMaster,
						canChoose: !!e.onChooseDirection,
						canPrepare: typeof e.onRequest == "function",
						approve: n.approve,
						chooseDirection: n.chooseDirection,
						prepare: n.prepare,
						openPrototype: e.onOpenPrototype,
						navigation: r
					}) : /* @__PURE__ */ (0, x.jsx)(P, {
						stage: i,
						state: e.state,
						prepare: n.prepare,
						onOpenSource: e.onOpenSource
					})
				]
			}),
			/* @__PURE__ */ (0, x.jsx)("p", {
				className: "journey-action-note",
				children: "Ces espaces ne sont pas des étapes obligatoires pour chaque changement. Une petite correction peut suivre un chemin court. Les traces disponibles ne signifient pas que tout a été validé."
			})
		]
	});
}
//#endregion
//#region studio-ui/src/journey-widget.tsx
function I(e, t) {
	let n = (0, r.createRoot)(e), i = !1, a = (e) => {
		i || n.render(/* @__PURE__ */ (0, x.jsx)(F, { ...e }));
	};
	return a(t), {
		update: a,
		dispose() {
			i || (i = !0, n.unmount());
		}
	};
}
//#endregion
export { I as mountJourneyWidget };
