import { i as e, n as t, r as n, t as r } from "./jsx-runtime-DZd2gj5L.js";
import { r as i, s as a } from "./i18n-CRhBcIYq.js";
import { t as o } from "./error-messages-CtvOKk7F.js";
//#region studio-ui/src/features/decisions/hooks/useDecisionAction.ts
var s = t(), c = e(), l = 4e3, u = "Le stockage local est indisponible. Votre raison reste en mémoire ; copiez-la avant de quitter.";
function d(e) {
	return !e.draftScope || e.draftScope.length > 4096 ? null : "devmethod:decision-reason:v1:" + JSON.stringify([
		e.draftScope,
		e.proposalId,
		e.baseRevision
	]);
}
function f(e) {
	if (e.length > 32768) throw Error("Oversized reason draft");
	let t = JSON.parse(e);
	if (!t || typeof t != "object" || !("format" in t) || t.format !== 1 || !("text" in t) || typeof t.text != "string" || t.text.length > l) throw Error("Invalid reason draft");
	return t.text;
}
function p(e) {
	if (!e) return {
		reason: "",
		warning: u
	};
	try {
		let t = window.localStorage.getItem(e);
		return {
			reason: t === null ? "" : f(t),
			warning: ""
		};
	} catch {
		return {
			reason: "",
			warning: u
		};
	}
}
function m(e, t) {
	if (!e) return u;
	try {
		return window.localStorage.setItem(e, JSON.stringify({
			format: 1,
			text: t
		})), "";
	} catch {
		return u;
	}
}
function h(e, t) {
	if (!e) return u;
	try {
		let n = window.localStorage.getItem(e);
		return n !== null && f(n) === t && window.localStorage.removeItem(e), "";
	} catch {
		return u;
	}
}
function g(e) {
	let { t } = n(), r = d(e), [i] = (0, c.useState)(() => p(r)), [a, o] = (0, c.useState)(i.reason), [s, f] = (0, c.useState)(i.warning), g = (0, c.useRef)({
		text: i.reason,
		edits: 0
	});
	function _(e) {
		let t = e.slice(0, l);
		g.current = {
			text: t,
			edits: g.current.edits + 1
		}, o(t), f(m(r, t));
	}
	function v(e) {
		e === g.current.edits && (f(h(r, g.current.text)), g.current = {
			text: "",
			edits: e + 1
		}, o(""));
	}
	return {
		reason: a,
		setReason: _,
		storageWarning: s ? t(u, "Local storage is unavailable. Your reason remains in memory; copy it before leaving.") : "",
		current: g,
		clearApproved: v
	};
}
function _(e) {
	let { locale: t, t: r } = n(), i = g(e), a = (0, c.useRef)(!1), [s, l] = (0, c.useState)("idle"), [u, d] = (0, c.useState)(null), f = u === null ? "" : u || r("Enregistrement impossible. Réessayez.", "Unable to save. Try again.");
	async function p(e, t = !1) {
		if (a.current) return;
		a.current = !0, l("saving"), d(null);
		let n = i.current.current.edits;
		try {
			await e(), t && i.clearApproved(n);
		} catch (e) {
			d(e && typeof e == "object" && "message" in e && typeof e.message == "string" ? e.message : "");
		} finally {
			a.current = !1, l("idle");
		}
	}
	return {
		status: s,
		error: o(f, t),
		run: p,
		reason: i.reason,
		setReason: i.setReason,
		storageWarning: i.storageWarning
	};
}
//#endregion
//#region studio-ui/src/features/decisions/model/contracts.ts
function v(e, t, n = "en") {
	return e.stage === "implementation" ? t === "automatic" ? a("Approuver et lancer la réalisation", "Approve and start implementation", void 0, n) : a("Approuver et préparer la réalisation", "Approve and prepare implementation", void 0, n) : e.options.find((t) => t.id === e.selectedOptionId)?.preview?.status === "implemented" ? a("Valider le rendu de cette version", "Approve this version’s visuals", void 0, n) : a("Retenir cette proposition visuelle", "Select this visual proposal", void 0, n);
}
//#endregion
//#region studio-ui/src/features/decisions/components/DecisionCard.tsx
var y = r();
function b({ option: e, selected: t, recommended: r, disabled: i, onSelect: a }) {
	let { t: o } = n();
	return /* @__PURE__ */ (0, y.jsxs)("label", {
		className: "decision-option" + (t ? " selected" : ""),
		children: [
			/* @__PURE__ */ (0, y.jsxs)("span", {
				className: "decision-option-heading",
				children: [
					/* @__PURE__ */ (0, y.jsx)("input", {
						type: "radio",
						name: "pending-proposal-option",
						value: e.id,
						checked: t,
						disabled: i,
						onChange: a
					}),
					/* @__PURE__ */ (0, y.jsx)("strong", { children: e.title }),
					r ? /* @__PURE__ */ (0, y.jsx)("small", {
						className: "decision-recommended",
						children: o("Recommandé", "Recommended")
					}) : null
				]
			}),
			/* @__PURE__ */ (0, y.jsx)("ul", {
				className: "decision-consequences",
				children: e.consequences.map((e, t) => /* @__PURE__ */ (0, y.jsx)("li", { children: e }, t))
			}),
			e.preview?.status === "implemented" ? null : /* @__PURE__ */ (0, y.jsx)("small", {
				className: "decision-preview-kind",
				children: e.preview ? o("Simulation visuelle", "Visual simulation") : o("Aperçu non fourni", "No preview provided")
			})
		]
	});
}
function x({ proposal: e, activeRevision: t, execution: r, actions: i, draftScope: a }) {
	let { locale: o, t: s } = n(), { status: c, error: l, run: u, reason: d, setReason: f, storageWarning: p } = _({
		draftScope: a,
		proposalId: e.id,
		baseRevision: e.baseRevision
	}), m = e.baseRevision !== t, h = c === "saving";
	return /* @__PURE__ */ (0, y.jsxs)("article", {
		className: "active-decision-card",
		children: [
			/* @__PURE__ */ (0, y.jsxs)("p", {
				className: "decision-phase",
				children: [
					/* @__PURE__ */ (0, y.jsx)("svg", {
						viewBox: "0 0 24 24",
						width: "24",
						height: "24",
						fill: "none",
						stroke: "currentColor",
						strokeWidth: "1.6",
						"aria-hidden": "true",
						children: /* @__PURE__ */ (0, y.jsx)("path", { d: "M12 3v4m-6 1h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2ZM8 12h1m6 0h1m-7 4h6M1 12v4m22-4v4" })
					}),
					e.stage === "implementation" ? s("Décision avant réalisation", "Decision before implementation") : s("Validation visuelle", "Visual approval"),
					" ",
					s("· En attente", "· Pending"),
					" "
				]
			}),
			/* @__PURE__ */ (0, y.jsx)("h2", {
				className: "decision-question",
				children: e.question
			}),
			/* @__PURE__ */ (0, y.jsx)("p", {
				className: "decision-summary",
				children: s("Comparez les options dans l’aperçu, sans les appliquer.", "Compare options in the preview without applying them.")
			}),
			m ? /* @__PURE__ */ (0, y.jsxs)("p", {
				className: "inline-error",
				role: "alert",
				children: [
					" ",
					s("La version actuelle a changé. Demandez à l’agent de réexaminer cette proposition.", "The current version has changed. Ask the agent to review this proposal again."),
					" "
				]
			}) : null,
			/* @__PURE__ */ (0, y.jsxs)("fieldset", {
				className: "decision-options",
				disabled: h || m,
				children: [/* @__PURE__ */ (0, y.jsxs)("legend", {
					className: "sr-only",
					children: [
						s("Options pour", "Options for"),
						" ",
						e.topic
					]
				}), e.options.map((t) => /* @__PURE__ */ (0, y.jsx)(b, {
					option: t,
					selected: t.id === e.selectedOptionId,
					recommended: t.id === e.recommendation?.optionId,
					disabled: h || m,
					onSelect: () => {
						u(() => i.select(e.id, t.id));
					}
				}, t.id))]
			}),
			e.recommendation ? /* @__PURE__ */ (0, y.jsxs)("p", {
				className: "decision-recommendation",
				children: [
					/* @__PURE__ */ (0, y.jsx)("span", {
						"aria-hidden": "true",
						children: "ⓘ"
					}),
					" ",
					e.recommendation.reason
				]
			}) : null,
			/* @__PURE__ */ (0, y.jsxs)("form", {
				className: "decision-approval",
				onSubmit: (t) => {
					t.preventDefault();
					let n = e.selectedOptionId;
					n && !m && u(() => i.approve(e.id, n, d), !0);
				},
				children: [
					/* @__PURE__ */ (0, y.jsxs)("details", {
						className: "decision-reason",
						children: [
							/* @__PURE__ */ (0, y.jsx)("summary", { children: s("Ajouter une raison", "Add a reason") }),
							/* @__PURE__ */ (0, y.jsxs)("label", {
								htmlFor: "decision-reason-" + e.id,
								children: [
									" ",
									s("Votre raison", "Your reason"),
									" ",
									/* @__PURE__ */ (0, y.jsx)("span", {
										className: "muted",
										children: s("(facultatif)", "(optional)")
									})
								]
							}),
							/* @__PURE__ */ (0, y.jsx)("textarea", {
								id: "decision-reason-" + e.id,
								name: "decision-reason",
								autoComplete: "off",
								rows: 2,
								maxLength: 4e3,
								value: d,
								onChange: (e) => f(e.target.value),
								placeholder: s("Ce qui motive votre choix…", "What motivates your choice…")
							})
						]
					}),
					p ? /* @__PURE__ */ (0, y.jsx)("p", {
						className: "muted",
						role: "status",
						children: p
					}) : null,
					l ? /* @__PURE__ */ (0, y.jsx)("p", {
						className: "inline-error",
						role: "alert",
						children: l
					}) : null,
					/* @__PURE__ */ (0, y.jsxs)("button", {
						type: "submit",
						className: "primary",
						disabled: h || m || !e.selectedOptionId,
						children: [/* @__PURE__ */ (0, y.jsx)("span", { children: h ? s("Enregistrement…", "Saving…") : v(e, r, o) }), /* @__PURE__ */ (0, y.jsx)("svg", {
							className: "decision-submit-icon",
							viewBox: "0 0 24 24",
							width: "22",
							height: "22",
							fill: "none",
							stroke: "currentColor",
							strokeWidth: "1.8",
							strokeLinecap: "round",
							strokeLinejoin: "round",
							"aria-hidden": "true",
							children: /* @__PURE__ */ (0, y.jsx)("path", { d: "M4 12h16m-6-6 6 6-6 6" })
						})]
					}),
					/* @__PURE__ */ (0, y.jsx)("p", {
						className: "muted",
						children: e.stage === "implementation" ? r === "automatic" ? s("Une demande sera lancée. Son résultat restera à vérifier.", "A request will be started. Its result will still need verification.") : s("Une demande sera créée pour votre agent hôte. Aucun agent automatique n’est actif.", "A request will be created for your host agent. No automatic agent is active.") : s("Rendu uniquement · version et contrôles inchangés.", "Visuals only · version and checks unchanged.")
					})
				]
			})
		]
	});
}
function S(e) {
	let t = JSON.stringify([
		e.draftScope,
		e.proposal.id,
		e.proposal.baseRevision
	]);
	return /* @__PURE__ */ (0, y.jsx)(x, { ...e }, t);
}
//#endregion
//#region studio-ui/src/decision-widget.tsx
function C(e) {
	i(e.ownerDocument, e.ownerDocument.defaultView ?? void 0);
	let t = (0, s.createRoot)(e);
	return {
		update(e) {
			t.render(/* @__PURE__ */ (0, y.jsx)(S, { ...e }, e.proposal.id));
		},
		dispose() {
			t.unmount();
		}
	};
}
//#endregion
export { C as mountDecisionWidget };
