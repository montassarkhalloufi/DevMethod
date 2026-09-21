import { i as e, n as t, r as n, t as r } from "./jsx-runtime-DZd2gj5L.js";
import { r as i, s as a } from "./i18n-CRhBcIYq.js";
//#region studio-ui/src/features/journey/model/journey.ts
var o = t(), s = (e, t, n, r) => `${e.toLocaleString(r)} ${e === 1 ? t : n}`;
function c(e, t = "en") {
	return {
		id: "foundation",
		title: a("Comprendre le projet", "Understand the project", void 0, t),
		purpose: a("Retrouver l’intention, les acquis et ce que vous déléguez.", "Review the intent, established facts, and what you delegate.", void 0, t),
		status: e.import ? a("Référence importée · contexte à examiner", "Imported reference · context needs review", void 0, t) : e.project.idea ? a("Intention enregistrée", "Intent recorded", void 0, t) : a("À préciser", "To clarify", void 0, t),
		facts: [e.project.idea || (e.import ? a("Précisez l’objectif de la prochaine évolution dans la discussion.", "Clarify the goal of the next change in the conversation.", void 0, t) : a("Décrivez votre idée dans la discussion.", "Describe your idea in the conversation.", void 0, t), t), ...e.project.constraints],
		request: a("Reprends le contexte et les acquis du projet, ses références et les décisions déléguées. Signale seulement les informations qui manquent pour avancer, sans répéter les questions déjà résolues.", "Review the project context, established facts, references, and delegated decisions. Identify only information needed to proceed, without repeating questions already resolved.", void 0, t)
	};
}
function l(e, t = "en") {
	let n = e.decisions.filter((e) => e.status === "hypothesis" || e.status === "active" && /explor/i.test(e.topic));
	return {
		id: "exploration",
		title: a("Explorer les possibilités", "Explore possibilities", void 0, t),
		purpose: a("Comparer les usages, alternatives et incertitudes utiles avant de choisir.", "Compare relevant uses, alternatives, and uncertainties before choosing.", void 0, t),
		status: n.length ? s(n.length, a("piste enregistrée", "recorded direction", void 0, t), a("pistes enregistrées", "recorded directions", void 0, t), t) : a("Exploration à documenter", "Exploration to document", void 0, t),
		facts: n.length ? n.map((e) => `${e.status === "hypothesis" ? a("Hypothèse", "Assumption", void 0, t) : a("Choix actif", "Active decision", void 0, t)} : ${e.topic} — ${e.choice}${e.reason ? `. ${e.reason}` : ""}`) : [a("Aucune hypothèse ou décision d’exploration enregistrée. Cela ne prouve pas qu’une exploration a été menée.", "No exploration assumptions or decisions are recorded. This does not establish that exploration has taken place.", void 0, t)],
		request: a("Explore les besoins, usages et alternatives réellement différents pour ce projet. Appuie les possibilités sur des observations et propose une expérience bornée pour les incertitudes importantes.", "Explore needs, uses, and genuinely different alternatives for this project. Support the possibilities with observations and propose a bounded experiment for important uncertainties.", void 0, t)
	};
}
function u(e, t = "en") {
	return {
		id: "frame",
		title: a("Cadrer le résultat", "Frame the outcome", void 0, t),
		purpose: a("Exprimer le résultat attendu, le périmètre et les critères pour le juger.", "Describe the expected outcome, scope, and criteria for assessing it.", void 0, t),
		status: e.brief.outcome ? a("Cadrage disponible à examiner", "Brief available for review", void 0, t) : a("À cadrer", "To frame", void 0, t),
		facts: [e.brief.outcome || a("Le résultat attendu reste à préciser.", "The expected outcome still needs clarification.", void 0, t), ...e.brief.criteria.map((e) => e.text)],
		request: a("Précise le résultat attendu, le périmètre, les exclusions et les critères observables. Relie-les aux acquis de l’exploration et aux contraintes, sans marquer comme validé ce qui n’a pas été décidé.", "Clarify the expected outcome, scope, exclusions, and observable criteria. Connect them to exploration findings and constraints without treating undecided matters as approved.", void 0, t)
	};
}
function d(e, t = "en") {
	let n = e.decisions.filter((e) => e.status === "active" && /architect|techni|stockage|données|sécurité/i.test(e.topic));
	return {
		id: "architecture",
		title: a("Choisir une architecture", "Choose an architecture", void 0, t),
		purpose: a("Rendre les compromis techniques compréhensibles et éprouver les risques.", "Explain technical trade-offs and test risks.", void 0, t),
		status: n.length ? a("Choix techniques repérés", "Technical decisions identified", void 0, t) : a("Choix techniques à expliciter", "Technical decisions to clarify", void 0, t),
		facts: n.length ? n.map((e) => `${e.topic} — ${e.choice}. ${e.reason}`) : [a("Aucune décision active repérée par son thème technique. Le code seul ne décrit pas ses compromis.", "No active decision was identified by its technical topic. Code alone does not explain its trade-offs.", void 0, t)],
		request: a("Propose une architecture proportionnée au projet, explicite les alternatives et compromis, puis éprouve les hypothèses risquées. Préserve les choix de design retenus et les données existantes.", "Propose an architecture proportionate to the project, explain alternatives and trade-offs, then test risky assumptions. Preserve the selected design decisions and existing data.", void 0, t)
	};
}
function f(e, t = "en") {
	let n = e.revisions.find((t) => t.id === e.activeRevision), r = n ? e.checks.filter((e) => e.revisionId === n.id) : [];
	return {
		id: "delivery",
		title: a("Réaliser et vérifier", "Build and verify", void 0, t),
		purpose: a("Livrer une tranche utilisable, confronter le résultat aux critères et pouvoir reprendre.", "Deliver a usable increment, assess it against the criteria, and keep work resumable.", void 0, t),
		status: e.revisions.length ? s(e.revisions.length, a("version enregistrée", "saved version", void 0, t), a("versions enregistrées", "saved versions", void 0, t), t) : a("Application à réaliser", "Application to build", void 0, t),
		facts: n ? [a("Version active : {title}.", "Active version: {title}.", { title: n.title }, t), a("{count} contrôle(s) enregistré(s) sur cette version. Leur présence ne prouve pas la couverture de tous les critères.", "{count} check(s) recorded for this version. Their presence does not prove coverage of every criterion.", { count: r.length.toLocaleString(t) }, t)] : [a("Aucune version active. Une direction visuelle ne remplace pas une application exécutée.", "No active version. A visual direction does not replace a running application.", void 0, t)],
		request: a("Réalise une tranche utilisable à partir des choix autorisés. Exécute les contrôles pertinents, conserve les preuves liées à la version, et vérifie une interruption, une reprise et une évolution du besoin.", "Build a usable increment from the authorized decisions. Run relevant checks, preserve version-linked evidence, and verify interruption, recovery, and a change in requirements.", void 0, t)
	};
}
function p(e, t = "en") {
	return [
		c(e, t),
		l(e, t),
		u(e, t),
		{
			id: "design",
			title: a("Concevoir l’expérience", "Design the experience", void 0, t),
			purpose: a("Passer de directions distinctes à une référence détaillée, puis aux écrans et au prototype.", "Move from distinct directions to a detailed reference, then screens and a prototype.", void 0, t),
			status: e.designs.length ? s(e.designs.length, a("direction disponible", "available direction", void 0, t), a("directions disponibles", "available directions", void 0, t), t) : a("Directions à créer", "Directions to create", void 0, t),
			facts: [],
			request: a("Crée trois directions visuelles réellement distinctes du même écran à partir des références. Présente leurs différences pour choisir avant de produire le master détaillé, les écrans dérivés et le prototype interactif.", "Create three distinct visual directions for the same screen from the references. Present their differences for selection before creating the detailed master, derived screens, and interactive prototype.", void 0, t)
		},
		d(e, t),
		f(e, t)
	];
}
function m(e) {
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
function h(e = "en") {
	return {
		foundation: a("Projet", "Project", void 0, e),
		exploration: "Discovery",
		frame: a("Cadrage", "Brief", void 0, e),
		design: "Design",
		architecture: "Architecture",
		delivery: a("Réalisation", "Implementation", void 0, e)
	};
}
function g(e = "en") {
	return {
		directions: "Directions",
		master: "Master",
		screens: a("Écrans et états", "Screens and states", void 0, e),
		prototype: "Prototype"
	};
}
function _(e) {
	let [, t, n] = e.split("-");
	return {
		stage: Object.hasOwn(h(), t ?? "") ? t : "foundation",
		step: Object.hasOwn(g(), n ?? "") ? n : "directions"
	};
}
//#endregion
//#region studio-ui/src/features/journey/hooks/useJourneyActions.ts
var v = e();
function y(e) {
	let { t } = n(), [r, i] = (0, v.useState)(null), [a, o] = (0, v.useState)(null), [s, c] = (0, v.useState)(null), l = s ? s.message ?? {
		prepare: t("La demande n’a pas pu être préparée. Réessayez.", "The request could not be prepared. Try again."),
		approve: t("La validation n’a pas été enregistrée. Réessayez.", "The approval was not saved. Try again."),
		choose: t("Le choix n’a pas été enregistré. Réessayez.", "The choice was not saved. Try again.")
	}[s.kind] : "", u = (0, v.useRef)(!1);
	function d(t, n) {
		c(null);
		try {
			e.onRequest(t, n);
		} catch (e) {
			c({
				kind: "prepare",
				...e instanceof Error ? { message: e.message } : {}
			});
		}
	}
	async function f(t) {
		if (!u.current && e.onApproveMaster) {
			u.current = !0, i(t), c(null);
			try {
				await e.onApproveMaster(t);
			} catch (e) {
				c({
					kind: "approve",
					...e instanceof Error ? { message: e.message } : {}
				});
			} finally {
				u.current = !1, i(null);
			}
		}
	}
	async function p(t) {
		if (!u.current && e.onChooseDirection) {
			u.current = !0, o(t), c(null);
			try {
				await e.onChooseDirection(t);
			} catch (e) {
				c({
					kind: "choose",
					...e instanceof Error ? { message: e.message } : {}
				});
			} finally {
				u.current = !1, o(null);
			}
		}
	}
	return {
		prepare: d,
		approve: f,
		chooseDirection: p,
		pending: r,
		choosing: a,
		error: l
	};
}
//#endregion
//#region studio-ui/src/features/journey/hooks/useJourneyNavigation.ts
var b = "studio:journey-navigation";
function x(e) {
	return window.addEventListener("hashchange", e), window.addEventListener("popstate", e), window.addEventListener(b, e), () => {
		window.removeEventListener("hashchange", e), window.removeEventListener("popstate", e), window.removeEventListener(b, e);
	};
}
var S = () => window.location.hash;
function C() {
	let e = (0, v.useSyncExternalStore)(x, S, () => "");
	function t(e) {
		if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
		e.preventDefault();
		let t = e.currentTarget.hash;
		t !== window.location.hash && (window.history.pushState(null, "", t), window.dispatchEvent(new Event(b)));
	}
	return {
		..._(e),
		navigate: t
	};
}
//#endregion
//#region studio-ui/src/features/journey/components/DesignJourney.tsx
var w = r();
function T({ state: e, id: t, title: r }) {
	let { t: i } = n(), a = e.references.find((e) => e.id === t && e.mime.startsWith("image/"));
	return a ? /* @__PURE__ */ (0, w.jsxs)("a", {
		href: `/references/${encodeURIComponent(a.id)}`,
		target: "_blank",
		rel: "noopener noreferrer",
		children: [/* @__PURE__ */ (0, w.jsx)("img", {
			src: `/references/${encodeURIComponent(a.id)}`,
			alt: r,
			width: 600,
			height: 400,
			loading: "lazy"
		}), /* @__PURE__ */ (0, w.jsxs)("span", {
			className: "sr-only",
			children: [
				i("Ouvrir la référence", "Open reference"),
				" ",
				r
			]
		})]
	}) : /* @__PURE__ */ (0, w.jsx)("p", {
		className: "journey-gap",
		children: i("Image de référence indisponible dans ce projet.", "Reference image unavailable in this project.")
	});
}
function E({ prepare: e, canPrepare: t }) {
	let { t: r } = n();
	return /* @__PURE__ */ (0, w.jsxs)(w.Fragment, { children: [/* @__PURE__ */ (0, w.jsxs)("p", {
		className: "journey-gap",
		children: [
			" ",
			r("Cet accord historique ne suffit plus : vous avez repris la validation visuelle. Préparez un nouveau master à valider ; l’accord précédent reste conservé.", "This historical approval is no longer sufficient: you have taken back visual approval. Prepare a new master for approval; the previous approval is preserved."),
			" "
		]
	}), t ? /* @__PURE__ */ (0, w.jsxs)("button", {
		type: "button",
		onClick: () => e("design", r("Prépare un nouveau master à partir de la direction courante pour ma validation visuelle explicite avant réalisation. Conserve l’ancien master et son accord historique sans les réécrire.", "Prepare a new master from the current direction for my explicit visual approval before implementation. Preserve the previous master and its historical approval without rewriting them.")),
		children: [
			" ",
			r("Préparer un nouveau master", "Prepare a new master"),
			" "
		]
	}) : /* @__PURE__ */ (0, w.jsxs)("p", { children: [
		" ",
		r("La préparation n’est pas connectée dans cet hôte. Demandez un nouveau master à votre agent.", "Preparation is not connected in this host. Ask your agent for a new master."),
		" "
	] })] });
}
function D({ state: e, pending: t, choosing: r, canApprove: i, canPrepare: a, approve: o, prepare: s }) {
	let { t: c } = n(), { master: l, stale: u, approvalInsufficient: d } = m(e);
	if (!l) return /* @__PURE__ */ (0, w.jsxs)("div", {
		className: "journey-step",
		children: [
			/* @__PURE__ */ (0, w.jsx)("h4", { children: c("2. Une référence détaillée", "2. A detailed reference") }),
			/* @__PURE__ */ (0, w.jsxs)("p", { children: [
				" ",
				c("Le master n’est pas encore enregistré. Sélectionner une direction ne valide pas un écran détaillé.", "The master has not been saved yet. Selecting a direction does not approve a detailed screen."),
				" "
			] }),
			/* @__PURE__ */ (0, w.jsxs)("button", {
				type: "button",
				onClick: () => s("design", c("À partir de la direction visuelle choisie, produis un master détaillé du même écran. Conserve la composition, les contenus utiles et les états clés ; présente-le pour validation avant le code UI.", "Create a detailed master of the same screen from the selected visual direction. Preserve the composition, useful content, and key states; present it for approval before writing UI code.")),
				children: [
					" ",
					c("Préparer le master", "Prepare master"),
					" "
				]
			})
		]
	});
	let f = d ? c("Accord antérieur de l’agent — à réexaminer", "Previous agent approval — review required") : l.approvedBy === "user" ? c("Master validé par vous", "Master approved by you") : l.approvedBy === "agent" ? c("Master retenu par délégation", "Master selected under delegation") : c("Master proposé — à valider", "Proposed master — awaiting approval");
	return /* @__PURE__ */ (0, w.jsxs)("div", {
		className: "journey-step",
		children: [
			/* @__PURE__ */ (0, w.jsx)("h4", { children: c("2. Une référence détaillée", "2. A detailed reference") }),
			/* @__PURE__ */ (0, w.jsx)("p", {
				className: "journey-record-status",
				children: f
			}),
			d ? /* @__PURE__ */ (0, w.jsx)(E, {
				prepare: s,
				canPrepare: a
			}) : null,
			u && /* @__PURE__ */ (0, w.jsxs)("p", {
				className: "journey-gap",
				children: [
					" ",
					c("Ce master correspond à une autre direction. Réexaminez-le avant de poursuivre.", "This master belongs to another direction. Review it before continuing."),
					" "
				]
			}),
			/* @__PURE__ */ (0, w.jsx)(T, {
				state: e,
				id: l.referenceId,
				title: c("Master détaillé de la direction", "Detailed master of the direction")
			}),
			l.approvalReason && /* @__PURE__ */ (0, w.jsx)("p", { children: l.approvalReason }),
			!l.approvedBy && !u && /* @__PURE__ */ (0, w.jsx)("button", {
				type: "button",
				className: "primary",
				disabled: !i || t !== null || r !== null,
				onClick: () => void o(l.id),
				children: t === l.id ? c("Validation en cours…", "Approving…") : c("Valider ce master", "Approve this master")
			}),
			!l.approvedBy && !i && /* @__PURE__ */ (0, w.jsx)("p", { children: c("La validation du master n’est pas disponible dans cet hôte.", "Master approval is unavailable in this host.") })
		]
	});
}
function O({ state: e, prepare: t }) {
	let { t: r } = n(), { screens: i, stale: a } = m(e);
	return /* @__PURE__ */ (0, w.jsxs)("div", {
		className: "journey-step",
		children: [
			/* @__PURE__ */ (0, w.jsx)("h4", { children: r("3. Les écrans et leurs états", "3. Screens and their states") }),
			/* @__PURE__ */ (0, w.jsxs)("p", { children: [
				" ",
				r("Décliner la référence retenue pour les autres écrans, le mobile, le chargement et les erreurs.", "Extend the selected reference to other screens, mobile, loading, and errors."),
				" "
			] }),
			a && /* @__PURE__ */ (0, w.jsxs)("p", {
				className: "journey-gap",
				children: [
					" ",
					r("La direction a changé : ces enregistrements doivent être réexaminés.", "The direction has changed: these records need review."),
					" "
				]
			}),
			i.length ? /* @__PURE__ */ (0, w.jsx)("div", {
				className: "journey-image-grid",
				children: i.map((t) => /* @__PURE__ */ (0, w.jsxs)("figure", { children: [/* @__PURE__ */ (0, w.jsx)(T, {
					state: e,
					id: t.referenceId,
					title: t.title
				}), /* @__PURE__ */ (0, w.jsx)("figcaption", { children: t.title })] }, t.id))
			}) : /* @__PURE__ */ (0, w.jsx)("p", {
				className: "journey-gap",
				children: r("Aucun écran dérivé lié au master courant.", "No derived screens are linked to the current master.")
			}),
			/* @__PURE__ */ (0, w.jsxs)("button", {
				type: "button",
				onClick: () => t("design", r("À partir du master approuvé, décline les écrans et états nécessaires : mobile, chargement, vide, erreur et reprise. Enregistre leurs références et leurs liens au master ; ne remplace pas ces images par une simple description.", "From the approved master, create the required screens and states: mobile, loading, empty, error, and recovery. Save their references and links to the master; do not replace these images with a description alone.")),
				children: [
					" ",
					r("Préparer les déclinaisons", "Prepare derived screens"),
					" "
				]
			})
		]
	});
}
function k({ state: e, prepare: t, openPrototype: r }) {
	let { t: i } = n(), { prototype: a, revision: o, stale: s, approvalInsufficient: c, master: l } = m(e), u = s || c || !l?.approvedBy;
	return /* @__PURE__ */ (0, w.jsxs)("div", {
		className: "journey-step",
		children: [
			/* @__PURE__ */ (0, w.jsx)("h4", { children: i("4. Le prototype interactif", "4. The interactive prototype") }),
			a && u ? /* @__PURE__ */ (0, w.jsxs)("p", {
				className: "journey-gap",
				children: [
					" ",
					i("Ce prototype est conservé pour examen. Son master est à réexaminer ou à valider avant toute nouvelle réalisation ; l’ouverture ne vaut pas accord.", "This prototype is kept for review. Its master needs review or approval before further implementation; opening it does not imply approval."),
					" "
				]
			}) : null,
			/* @__PURE__ */ (0, w.jsx)("p", { children: a && o ? i("Prototype relié à « {title} ». Les interactions et la fidélité restent à vérifier.", "Prototype linked to “{title}”. Interactions and fidelity still need verification.", { title: o.title }) : i("Aucun prototype exécutable n’est relié au master courant. Une image ne prouve pas une interaction.", "No runnable prototype is linked to the current master. An image does not prove an interaction.") }),
			/* @__PURE__ */ (0, w.jsxs)("p", { children: [
				" ",
				i("Ce prototype éprouve le parcours d’usage. Un POC technique peut être mené séparément pour une hypothèse d’architecture risquée.", "This prototype tests the user journey. A technical proof of concept can separately test a risky architecture assumption."),
				" "
			] }),
			a && o && r ? /* @__PURE__ */ (0, w.jsxs)("button", {
				type: "button",
				className: "primary",
				onClick: () => r(o.id),
				children: [
					" ",
					i("Essayer ce prototype", "Try this prototype"),
					" "
				]
			}) : null,
			a && o ? /* @__PURE__ */ (0, w.jsx)("p", { children: i("Ouvrir cette version ne l’active pas et ne valide pas ses interactions.", "Opening this version does not activate it or validate its interactions.") }) : null,
			/* @__PURE__ */ (0, w.jsxs)("button", {
				type: "button",
				onClick: () => t("design", i("Réalise un prototype interactif à partir du master approuvé et de ses écrans dérivés. Relie la version au master et vérifie dans le navigateur les interactions et la fidélité visuelle. Distingue les données simulées des fonctions exécutées.", "Build an interactive prototype from the approved master and its derived screens. Link the version to the master and verify interactions and visual fidelity in the browser. Distinguish simulated data from executed features.")),
				children: [
					" ",
					i("Préparer le prototype", "Prepare prototype"),
					" "
				]
			})
		]
	});
}
function A(e) {
	let { locale: t, t: r } = n(), i = e.state.designs.find((t) => t.id === e.state.selectedDesignId), a = e.navigation;
	return /* @__PURE__ */ (0, w.jsxs)("div", {
		className: "design-journey",
		children: [
			/* @__PURE__ */ (0, w.jsx)("nav", {
				className: "design-step-navigation",
				"aria-label": r("Jalons du design", "Design milestones"),
				children: Object.entries(g(t)).map(([e, t], n) => /* @__PURE__ */ (0, w.jsxs)("a", {
					href: `#journey-design-${e}`,
					onClick: a.navigate,
					"aria-current": e === a.step ? "step" : void 0,
					children: [
						/* @__PURE__ */ (0, w.jsx)("span", { children: n + 1 }),
						" ",
						t
					]
				}, e))
			}),
			a.step === "directions" ? /* @__PURE__ */ (0, w.jsxs)("div", {
				className: "journey-step",
				children: [
					/* @__PURE__ */ (0, w.jsx)("h4", { children: r("1. Comparer les directions du même écran", "1. Compare directions for the same screen") }),
					/* @__PURE__ */ (0, w.jsxs)("p", { children: [
						" ",
						r("Pour une nouvelle identité : trois compositions distinctes du même contenu, sauf autre format convenu. Une direction déjà approuvée peut être conservée.", "For a new identity: three distinct compositions of the same content, unless another format is agreed. An already approved direction may be kept."),
						" "
					] }),
					/* @__PURE__ */ (0, w.jsx)("div", {
						className: "journey-image-grid",
						children: e.state.designs.map((t) => /* @__PURE__ */ (0, w.jsxs)("figure", {
							"data-selected": t.id === i?.id,
							children: [
								/* @__PURE__ */ (0, w.jsx)(T, {
									state: e.state,
									id: t.file,
									title: t.title
								}),
								/* @__PURE__ */ (0, w.jsxs)("figcaption", { children: [
									/* @__PURE__ */ (0, w.jsx)("strong", { children: t.title }),
									t.id === i?.id && /* @__PURE__ */ (0, w.jsx)("span", { children: r("Direction retenue", "Selected direction") }),
									/* @__PURE__ */ (0, w.jsx)("p", { children: t.description })
								] }),
								/* @__PURE__ */ (0, w.jsx)("button", {
									type: "button",
									"aria-label": r("Choisir la direction {title}", "Choose direction {title}", { title: t.title }),
									"aria-pressed": t.id === i?.id,
									disabled: !e.canChoose || e.pending !== null || e.choosing !== null || t.id === i?.id,
									onClick: () => void e.chooseDirection(t.id),
									children: e.choosing === t.id ? r("Enregistrement…", "Saving…") : t.id === i?.id ? r("Direction retenue", "Selected direction") : r("Choisir cette direction", "Choose this direction")
								})
							]
						}, t.id))
					}),
					!e.canChoose && /* @__PURE__ */ (0, w.jsxs)("p", {
						className: "journey-gap",
						children: [
							" ",
							r("Le choix d’une direction n’est pas connecté dans cet hôte.", "Direction selection is not connected in this host."),
							" "
						]
					}),
					e.state.designs.length < 3 && /* @__PURE__ */ (0, w.jsxs)("p", {
						className: "journey-gap",
						children: [
							e.state.designs.length,
							" ",
							r("direction(s) disponible(s). Pour une nouvelle identité sans exception convenue, réunissez trois propositions comparables.", "direction(s) available. For a new identity without an agreed exception, prepare three comparable proposals."),
							" "
						]
					}),
					i && /* @__PURE__ */ (0, w.jsx)("p", { children: r("La direction « {title} » est retenue. Les étapes suivantes restent distinctes.", "Direction “{title}” is selected. The following steps remain separate.", { title: i.title }) }),
					/* @__PURE__ */ (0, w.jsx)("button", {
						type: "button",
						onClick: () => e.prepare("design", r("Crée trois directions visuelles réellement distinctes du même écran, à partir des références et de l’intention. Présente leurs différences pour choisir avant de développer le code UI.", "Create three distinct visual directions for the same screen from the references and intent. Present their differences to choose a direction before developing UI code.")),
						children: r("Préparer les directions", "Prepare directions")
					})
				]
			}) : null,
			a.step === "master" ? /* @__PURE__ */ (0, w.jsx)(D, { ...e }) : null,
			a.step === "screens" ? /* @__PURE__ */ (0, w.jsx)(O, {
				state: e.state,
				prepare: e.prepare
			}) : null,
			a.step === "prototype" ? /* @__PURE__ */ (0, w.jsx)(k, {
				state: e.state,
				prepare: e.prepare,
				openPrototype: e.openPrototype
			}) : null,
			/* @__PURE__ */ (0, w.jsxs)("p", {
				className: "journey-action-note",
				children: [
					" ",
					r("« Préparer » rédige une demande dans la conversation. Cela ne génère aucune image et ne lance aucune réalisation.", "“Prepare” drafts a request in the conversation. It does not generate images or start implementation."),
					" "
				]
			})
		]
	});
}
//#endregion
//#region studio-ui/src/features/journey/components/ProjectOrigin.tsx
var j = (e) => `'${e.replaceAll("'", "'\\''")}'`;
function M() {
	let { t: e } = n(), [t, r] = (0, v.useState)(e("/chemin/du-projet", "/path/to/project")), [i, a] = (0, v.useState)(e("/chemin/du-studio", "/path/to/studio")), o = `devmethod studio import --source ${j(t)} --workspace ${j(i)}`;
	return /* @__PURE__ */ (0, w.jsxs)("details", {
		className: "journey-import-guide",
		children: [
			/* @__PURE__ */ (0, w.jsx)("summary", { children: e("Reprendre un projet existant sans DevMethod", "Bring an existing project into DevMethod") }),
			/* @__PURE__ */ (0, w.jsxs)("p", { children: [
				" ",
				e("Inspectez un dossier local ou un dépôt déjà cloné, puis conservez sa référence initiale dans un nouvel espace Studio. Cette opération se lance dans le terminal ; le dossier source reste intact.", "Inspect a local folder or an already cloned repository, then preserve its initial reference in a new Studio workspace. Run this operation in the terminal; the source folder stays intact."),
				" "
			] }),
			/* @__PURE__ */ (0, w.jsxs)("div", {
				className: "journey-brief-columns",
				children: [/* @__PURE__ */ (0, w.jsxs)("label", { children: [
					" ",
					e("Dossier source", "Source folder"),
					" ",
					/* @__PURE__ */ (0, w.jsx)("input", {
						value: t,
						onChange: (e) => r(e.target.value)
					})
				] }), /* @__PURE__ */ (0, w.jsxs)("label", { children: [
					" ",
					e("Nouveau dossier Studio, distinct et vide", "New, separate, empty Studio folder"),
					" ",
					/* @__PURE__ */ (0, w.jsx)("input", {
						value: i,
						onChange: (e) => a(e.target.value)
					})
				] })]
			}),
			/* @__PURE__ */ (0, w.jsxs)("ol", { children: [/* @__PURE__ */ (0, w.jsxs)("li", { children: [
				" ",
				e("Inspecter les fichiers retenus, exclusions et capacités :", "Inspect included files, exclusions, and capabilities:"),
				/* @__PURE__ */ (0, w.jsxs)("pre", { children: [o, " --dry-run"] })
			] }), /* @__PURE__ */ (0, w.jsxs)("li", { children: [
				" ",
				e("Importer puis ouvrir le nouvel espace :", "Import and open the new workspace:"),
				" ",
				/* @__PURE__ */ (0, w.jsxs)("pre", { children: [
					o,
					"\n",
					"devmethod studio serve --workspace ",
					j(i)
				] })
			] })] }),
			/* @__PURE__ */ (0, w.jsxs)("p", {
				className: "journey-action-note",
				children: [
					" ",
					e("Aucun script du projet n’est exécuté à l’import. L’analyse distingue les informations détectées, déclarées et inconnues. Un projet importable n’est pas nécessairement exécutable dans l’aperçu Studio.", "No project script runs during import. The analysis distinguishes detected, declared, and unknown information. An importable project is not necessarily runnable in Studio preview."),
					" "
				]
			})
		]
	});
}
function N({ state: e, onOpenSource: t }) {
	let { locale: r, t: i } = n(), a = e.import;
	return a ? /* @__PURE__ */ (0, w.jsxs)("section", {
		className: "journey-origin",
		"aria-labelledby": "project-origin-title",
		children: [
			/* @__PURE__ */ (0, w.jsxs)("h4", {
				id: "project-origin-title",
				children: [
					i("Projet repris ·", "Imported project ·"),
					" ",
					a.source.name
				]
			}),
			/* @__PURE__ */ (0, w.jsxs)("p", { children: [
				a.inventory.included,
				" ",
				i("fichiers conservés · référence", "files preserved · reference"),
				" ",
				a.baselineRevision.slice(0, 8),
				" ",
				i("· import du", "· imported on"),
				" ",
				new Date(a.source.importedAt).toLocaleString(r),
				"."
			] }),
			/* @__PURE__ */ (0, w.jsxs)("p", {
				className: "journey-action-note",
				children: [
					" ",
					i("Cet état décrit les sources au moment de l’import. Il ne constitue ni une validation du produit ni une exécution de ses commandes.", "This state describes the sources at import time. It is neither product validation nor execution of its commands."),
					" "
				]
			}),
			/* @__PURE__ */ (0, w.jsx)("div", {
				className: "journey-origin-facts",
				children: a.context.facts.map((e, n) => /* @__PURE__ */ (0, w.jsxs)("article", { children: [
					/* @__PURE__ */ (0, w.jsx)("strong", { children: e.label }),
					/* @__PURE__ */ (0, w.jsx)("p", { children: e.value }),
					/* @__PURE__ */ (0, w.jsxs)("small", { children: [
						e.provenance.kind === "declared" ? i("Déclaré dans le projet", "Declared in the project") : i("Détecté dans les sources", "Detected in the sources"),
						" ",
						"·",
						" "
					] }),
					t ? /* @__PURE__ */ (0, w.jsxs)("button", {
						type: "button",
						onClick: () => t(e.provenance.path, a.baselineRevision),
						children: [e.provenance.path, " ↗"]
					}) : /* @__PURE__ */ (0, w.jsx)("code", { children: e.provenance.path })
				] }, `${e.provenance.path}:${n}`))
			}),
			/* @__PURE__ */ (0, w.jsxs)("details", {
				open: !0,
				children: [/* @__PURE__ */ (0, w.jsx)("summary", { children: i("Ce qui reste à établir", "Still to establish") }), /* @__PURE__ */ (0, w.jsx)("ul", { children: a.context.unknowns.map((e) => /* @__PURE__ */ (0, w.jsx)("li", { children: e }, e)) })]
			}),
			/* @__PURE__ */ (0, w.jsxs)("details", { children: [
				/* @__PURE__ */ (0, w.jsxs)("summary", { children: [
					i("Périmètre de l’import ·", "Import scope ·"),
					" ",
					a.inventory.excluded.length,
					" ",
					i("exclusions", "exclusions")
				] }),
				/* @__PURE__ */ (0, w.jsxs)("p", { children: [
					" ",
					i("Empreinte de la référence :", "Reference fingerprint:"),
					" ",
					/* @__PURE__ */ (0, w.jsx)("code", { children: a.source.fingerprint })
				] }),
				/* @__PURE__ */ (0, w.jsxs)("p", { children: [
					" ",
					i("Analyse :", "Analysis:"),
					" ",
					a.context.analysis.status,
					" ·",
					" ",
					a.context.analysis.stack.join(", ") || i("Stack non identifiée", "Stack not identified"),
					"."
				] }),
				/* @__PURE__ */ (0, w.jsx)("ul", { children: a.inventory.excluded.map((e) => /* @__PURE__ */ (0, w.jsxs)("li", { children: [
					/* @__PURE__ */ (0, w.jsx)("code", { children: e.path }),
					" — ",
					e.reason
				] }, e.path)) })
			] })
		]
	}) : /* @__PURE__ */ (0, w.jsxs)("section", {
		className: "journey-origin",
		children: [
			/* @__PURE__ */ (0, w.jsx)("h4", { children: i("Deux points de départ", "Two starting points") }),
			/* @__PURE__ */ (0, w.jsxs)("p", { children: [
				/* @__PURE__ */ (0, w.jsx)("strong", { children: i("Créer de zéro :", "Start from scratch:") }),
				" ",
				i("décrivez votre idée ; le cadrage, la conception et la réalisation s’appuieront sur vos choix.", "describe your idea; framing, design, and implementation will build on your choices."),
				" "
			] }),
			/* @__PURE__ */ (0, w.jsx)(M, {})
		]
	});
}
//#endregion
//#region studio-ui/src/features/journey/components/StageWorkspace.tsx
function P({ title: e, items: t, empty: n }) {
	return /* @__PURE__ */ (0, w.jsxs)("section", {
		className: "journey-brief-section",
		children: [/* @__PURE__ */ (0, w.jsx)("h4", { children: e }), t.length > 0 ? /* @__PURE__ */ (0, w.jsx)("ul", {
			className: "journey-facts",
			children: t.map((e, t) => /* @__PURE__ */ (0, w.jsx)("li", { children: e }, t))
		}) : /* @__PURE__ */ (0, w.jsx)("p", {
			className: "journey-gap",
			children: n
		})]
	});
}
function F({ brief: e }) {
	let { t } = n();
	return /* @__PURE__ */ (0, w.jsxs)("div", {
		className: "journey-brief",
		children: [
			/* @__PURE__ */ (0, w.jsxs)("section", {
				className: "journey-brief-section journey-outcome",
				children: [/* @__PURE__ */ (0, w.jsx)("h4", { children: t("Le résultat attendu", "Expected outcome") }), /* @__PURE__ */ (0, w.jsx)("p", { children: e.outcome || t("Le résultat attendu reste à préciser.", "The expected outcome still needs clarification.") })]
			}),
			/* @__PURE__ */ (0, w.jsxs)("div", {
				className: "journey-brief-columns",
				children: [/* @__PURE__ */ (0, w.jsx)(P, {
					title: t("Dans le périmètre", "In scope"),
					items: e.scope,
					empty: t("Le périmètre reste à préciser.", "The scope still needs clarification.")
				}), /* @__PURE__ */ (0, w.jsx)(P, {
					title: t("Hors périmètre", "Out of scope"),
					items: e.excluded,
					empty: t("Les exclusions restent à préciser.", "The exclusions still need clarification.")
				})]
			}),
			/* @__PURE__ */ (0, w.jsx)(P, {
				title: t("Comment juger le résultat", "How to assess the outcome"),
				items: e.criteria.map((e) => e.text),
				empty: t("Aucun critère observable enregistré.", "No observable criteria recorded.")
			}),
			/* @__PURE__ */ (0, w.jsxs)("p", {
				className: "journey-action-note",
				children: [
					" ",
					t("Ce cadrage est enregistré. Sa présence ne vaut pas approbation ni réussite des critères.", "This brief is saved. Its presence does not imply approval or that criteria have been met."),
					" "
				]
			})
		]
	});
}
function I({ references: e }) {
	let { t } = n();
	return /* @__PURE__ */ (0, w.jsxs)("section", {
		className: "journey-brief-section",
		children: [/* @__PURE__ */ (0, w.jsx)("h4", { children: t("Références conservées", "Preserved references") }), e.length > 0 ? /* @__PURE__ */ (0, w.jsx)("ul", {
			className: "journey-facts",
			children: e.map((e) => /* @__PURE__ */ (0, w.jsx)("li", { children: /* @__PURE__ */ (0, w.jsx)("a", {
				href: `/references/${encodeURIComponent(e.id)}`,
				target: "_blank",
				rel: "noopener noreferrer",
				children: e.name
			}) }, e.id))
		}) : /* @__PURE__ */ (0, w.jsx)("p", {
			className: "journey-gap",
			children: t("Aucune référence jointe à ce projet.", "No references attached to this project.")
		})]
	});
}
function L({ stage: e, state: t, prepare: r, onOpenSource: i }) {
	let { t: a } = n();
	return /* @__PURE__ */ (0, w.jsxs)(w.Fragment, { children: [
		e.id === "foundation" ? /* @__PURE__ */ (0, w.jsx)(N, {
			state: t,
			onOpenSource: i
		}) : null,
		e.id === "frame" ? /* @__PURE__ */ (0, w.jsx)(F, { brief: t.brief }) : /* @__PURE__ */ (0, w.jsx)("ul", {
			className: "journey-facts",
			children: e.facts.map((t, n) => /* @__PURE__ */ (0, w.jsx)("li", { children: t }, `${e.id}-${n}`))
		}),
		e.id === "foundation" ? /* @__PURE__ */ (0, w.jsx)(I, { references: t.references }) : null,
		e.id === "exploration" ? /* @__PURE__ */ (0, w.jsxs)("p", {
			className: "journey-action-note",
			children: [
				" ",
				a("Un choix actif n’est pas une preuve ; les hypothèses restent à éprouver. Les sources, observations et résultats d’expériences ne disposent pas encore d’un espace structuré ici.", "An active decision is not evidence; assumptions still need testing. Sources, observations, and experiment results do not yet have a structured workspace here."),
				" "
			]
		}) : null,
		/* @__PURE__ */ (0, w.jsxs)("div", {
			className: "journey-stage-action",
			children: [/* @__PURE__ */ (0, w.jsxs)("button", {
				type: "button",
				className: "primary",
				onClick: () => r(e.id, e.request),
				children: [
					" ",
					a("Préparer une demande", "Prepare a request"),
					" "
				]
			}), /* @__PURE__ */ (0, w.jsxs)("p", { children: [
				" ",
				a("La demande sera placée dans la conversation. Vous pourrez la modifier avant de l’envoyer.", "The request will be placed in the conversation. You can edit it before sending."),
				" "
			] })]
		})
	] });
}
//#endregion
//#region studio-ui/src/features/journey/components/JourneyView.tsx
function R(e) {
	let { locale: t, t: r } = n(), i = p(e.state, t), a = y(e), o = C(), s = i.find((e) => e.id === o.stage);
	return /* @__PURE__ */ (0, w.jsxs)("div", {
		className: "journey-view",
		children: [
			/* @__PURE__ */ (0, w.jsxs)("header", {
				className: "journey-heading",
				children: [
					/* @__PURE__ */ (0, w.jsx)("p", {
						className: "eyebrow",
						children: r("CONCEPTION DU PRODUIT", "PRODUCT DESIGN")
					}),
					/* @__PURE__ */ (0, w.jsx)("h2", { children: e.state.import ? r("Reprendre et faire évoluer le projet", "Resume and evolve the project") : r("De l’idée au premier usage", "From idea to first use") }),
					/* @__PURE__ */ (0, w.jsx)("p", { children: e.state.import ? r("Retrouvez les sources, les acquis et les inconnues avant de préparer la prochaine évolution.", "Review sources, established facts, and unknowns before preparing the next change.") : r("Explorez, cadrez et concevez ici. Retrouvez chaque choix lorsque le produit évolue.", "Explore, frame, and design here. Return to each decision as the product evolves.") })
				]
			}),
			/* @__PURE__ */ (0, w.jsx)("nav", {
				className: "journey-navigation",
				"aria-label": r("Espaces de conception", "Design workspaces"),
				children: /* @__PURE__ */ (0, w.jsx)("ol", { children: i.map((e, n) => /* @__PURE__ */ (0, w.jsx)("li", { children: /* @__PURE__ */ (0, w.jsxs)("a", {
					href: `#journey-${e.id}`,
					onClick: o.navigate,
					"aria-current": e.id === s.id ? "step" : void 0,
					children: [/* @__PURE__ */ (0, w.jsx)("span", {
						"aria-hidden": "true",
						children: n + 1
					}), h(t)[e.id]]
				}) }, e.id)) })
			}),
			a.error ? /* @__PURE__ */ (0, w.jsx)("p", {
				className: "inline-error",
				role: "alert",
				children: a.error
			}) : null,
			/* @__PURE__ */ (0, w.jsxs)("section", {
				className: "journey-stage",
				"aria-labelledby": "journey-stage-title",
				children: [
					/* @__PURE__ */ (0, w.jsxs)("div", {
						className: "journey-stage-heading",
						children: [/* @__PURE__ */ (0, w.jsx)("h3", {
							id: "journey-stage-title",
							children: s.title
						}), /* @__PURE__ */ (0, w.jsx)("span", {
							className: "journey-record-status",
							children: s.status
						})]
					}),
					/* @__PURE__ */ (0, w.jsx)("p", {
						className: "journey-purpose",
						children: s.purpose
					}),
					s.id === "design" ? /* @__PURE__ */ (0, w.jsx)(A, {
						state: e.state,
						pending: a.pending,
						choosing: a.choosing,
						canApprove: !!e.onApproveMaster,
						canChoose: !!e.onChooseDirection,
						canPrepare: typeof e.onRequest == "function",
						approve: a.approve,
						chooseDirection: a.chooseDirection,
						prepare: a.prepare,
						openPrototype: e.onOpenPrototype,
						navigation: o
					}) : /* @__PURE__ */ (0, w.jsx)(L, {
						stage: s,
						state: e.state,
						prepare: a.prepare,
						onOpenSource: e.onOpenSource
					})
				]
			}),
			/* @__PURE__ */ (0, w.jsxs)("p", {
				className: "journey-action-note",
				children: [
					" ",
					r("Ces espaces ne sont pas des étapes obligatoires pour chaque changement. Une petite correction peut suivre un chemin court. Les traces disponibles ne signifient pas que tout a été validé.", "These workspaces are not mandatory steps for every change. A small fix can take a shorter path. Available records do not mean everything has been validated."),
					" "
				]
			})
		]
	});
}
//#endregion
//#region studio-ui/src/journey-widget.tsx
function z(e, t) {
	i(e.ownerDocument, e.ownerDocument.defaultView ?? void 0);
	let n = (0, o.createRoot)(e), r = !1, a = (e) => {
		r || n.render(/* @__PURE__ */ (0, w.jsx)(R, { ...e }));
	};
	return a(t), {
		update: a,
		dispose() {
			r || (r = !0, n.unmount());
		}
	};
}
//#endregion
export { z as mountJourneyWidget };
