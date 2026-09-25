import { i as e, n as t, t as n } from "./jsx-runtime-D7gWoUTT.js";
//#region studio-ui/src/features/decisions/hooks/useDecisionAction.ts
var r = t(), i = e(), a = 4e3, o = "Le stockage local est indisponible. Votre raison reste en mémoire ; copiez-la avant de quitter.";
function s(e) {
	return !e.draftScope || e.draftScope.length > 4096 ? null : "devmethod:decision-reason:v1:" + JSON.stringify([
		e.draftScope,
		e.proposalId,
		e.baseRevision
	]);
}
function c(e) {
	if (e.length > 32768) throw Error("Oversized reason draft");
	let t = JSON.parse(e);
	if (!t || typeof t != "object" || !("format" in t) || t.format !== 1 || !("text" in t) || typeof t.text != "string" || t.text.length > a) throw Error("Invalid reason draft");
	return t.text;
}
function l(e) {
	if (!e) return {
		reason: "",
		warning: o
	};
	try {
		let t = window.localStorage.getItem(e);
		return {
			reason: t === null ? "" : c(t),
			warning: ""
		};
	} catch {
		return {
			reason: "",
			warning: o
		};
	}
}
function u(e, t) {
	if (!e) return o;
	try {
		return window.localStorage.setItem(e, JSON.stringify({
			format: 1,
			text: t
		})), "";
	} catch {
		return o;
	}
}
function d(e, t) {
	if (!e) return o;
	try {
		let n = window.localStorage.getItem(e);
		return n !== null && c(n) === t && window.localStorage.removeItem(e), "";
	} catch {
		return o;
	}
}
function f(e) {
	let t = s(e), [n] = (0, i.useState)(() => l(t)), [r, o] = (0, i.useState)(n.reason), [c, f] = (0, i.useState)(n.warning), p = (0, i.useRef)({
		text: n.reason,
		edits: 0
	});
	function m(e) {
		let n = e.slice(0, a);
		p.current = {
			text: n,
			edits: p.current.edits + 1
		}, o(n), f(u(t, n));
	}
	function h(e) {
		e === p.current.edits && (f(d(t, p.current.text)), p.current = {
			text: "",
			edits: e + 1
		}, o(""));
	}
	return {
		reason: r,
		setReason: m,
		storageWarning: c,
		current: p,
		clearApproved: h
	};
}
function p(e) {
	let t = f(e), n = (0, i.useRef)(!1), [r, a] = (0, i.useState)("idle"), [o, s] = (0, i.useState)("");
	async function c(e, r = !1) {
		if (n.current) return;
		n.current = !0, a("saving"), s("");
		let i = t.current.current.edits;
		try {
			await e(), r && t.clearApproved(i);
		} catch (e) {
			s(e && typeof e == "object" && "message" in e && typeof e.message == "string" ? e.message : "Enregistrement impossible. Réessayez.");
		} finally {
			n.current = !1, a("idle");
		}
	}
	return {
		status: r,
		error: o,
		run: c,
		reason: t.reason,
		setReason: t.setReason,
		storageWarning: t.storageWarning
	};
}
//#endregion
//#region studio-ui/src/features/decisions/model/contracts.ts
function m(e, t) {
	return e.stage === "implementation" ? t === "automatic" ? "Approuver et lancer la réalisation" : "Approuver et préparer la réalisation" : e.options.find((t) => t.id === e.selectedOptionId)?.preview?.status === "implemented" ? "Valider le rendu de cette version" : "Retenir cette proposition visuelle";
}
//#endregion
//#region studio-ui/src/features/decisions/components/DecisionCard.tsx
var h = n();
function g({ option: e, selected: t, recommended: n, disabled: r, onSelect: i }) {
	return /* @__PURE__ */ (0, h.jsxs)("label", {
		className: "decision-option" + (t ? " selected" : ""),
		children: [
			/* @__PURE__ */ (0, h.jsxs)("span", {
				className: "decision-option-heading",
				children: [
					/* @__PURE__ */ (0, h.jsx)("input", {
						type: "radio",
						name: "pending-proposal-option",
						value: e.id,
						checked: t,
						disabled: r,
						onChange: i
					}),
					/* @__PURE__ */ (0, h.jsx)("strong", { children: e.title }),
					n ? /* @__PURE__ */ (0, h.jsx)("small", {
						className: "decision-recommended",
						children: "Recommandé"
					}) : null
				]
			}),
			/* @__PURE__ */ (0, h.jsx)("ul", {
				className: "decision-consequences",
				children: e.consequences.map((e, t) => /* @__PURE__ */ (0, h.jsx)("li", { children: e }, t))
			}),
			e.preview?.status === "implemented" ? null : /* @__PURE__ */ (0, h.jsx)("small", {
				className: "decision-preview-kind",
				children: e.preview ? "Simulation visuelle" : "Aperçu non fourni"
			})
		]
	});
}
function _({ proposal: e, activeRevision: t, execution: n, actions: r, draftScope: i }) {
	let { status: a, error: o, run: s, reason: c, setReason: l, storageWarning: u } = p({
		draftScope: i,
		proposalId: e.id,
		baseRevision: e.baseRevision
	}), d = e.baseRevision !== t, f = a === "saving";
	return /* @__PURE__ */ (0, h.jsxs)("article", {
		className: "active-decision-card",
		children: [
			/* @__PURE__ */ (0, h.jsxs)("p", {
				className: "decision-phase",
				children: [
					/* @__PURE__ */ (0, h.jsx)("svg", {
						viewBox: "0 0 24 24",
						width: "24",
						height: "24",
						fill: "none",
						stroke: "currentColor",
						strokeWidth: "1.6",
						"aria-hidden": "true",
						children: /* @__PURE__ */ (0, h.jsx)("path", { d: "M12 3v4m-6 1h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2ZM8 12h1m6 0h1m-7 4h6M1 12v4m22-4v4" })
					}),
					e.stage === "implementation" ? "Décision avant réalisation" : "Validation visuelle",
					" ",
					"· En attente"
				]
			}),
			/* @__PURE__ */ (0, h.jsx)("h2", {
				className: "decision-question",
				children: e.question
			}),
			/* @__PURE__ */ (0, h.jsx)("p", {
				className: "decision-summary",
				children: "Comparez les options dans l’aperçu, sans les appliquer."
			}),
			d ? /* @__PURE__ */ (0, h.jsx)("p", {
				className: "inline-error",
				role: "alert",
				children: "La version actuelle a changé. Demandez à l’agent de réexaminer cette proposition."
			}) : null,
			/* @__PURE__ */ (0, h.jsxs)("fieldset", {
				className: "decision-options",
				disabled: f || d,
				children: [/* @__PURE__ */ (0, h.jsxs)("legend", {
					className: "sr-only",
					children: ["Options pour ", e.topic]
				}), e.options.map((t) => /* @__PURE__ */ (0, h.jsx)(g, {
					option: t,
					selected: t.id === e.selectedOptionId,
					recommended: t.id === e.recommendation?.optionId,
					disabled: f || d,
					onSelect: () => {
						s(() => r.select(e.id, t.id));
					}
				}, t.id))]
			}),
			e.recommendation ? /* @__PURE__ */ (0, h.jsxs)("p", {
				className: "decision-recommendation",
				children: [
					/* @__PURE__ */ (0, h.jsx)("span", {
						"aria-hidden": "true",
						children: "ⓘ"
					}),
					" ",
					e.recommendation.reason
				]
			}) : null,
			/* @__PURE__ */ (0, h.jsxs)("form", {
				className: "decision-approval",
				onSubmit: (t) => {
					t.preventDefault();
					let n = e.selectedOptionId;
					n && !d && s(() => r.approve(e.id, n, c), !0);
				},
				children: [
					/* @__PURE__ */ (0, h.jsxs)("details", {
						className: "decision-reason",
						children: [
							/* @__PURE__ */ (0, h.jsx)("summary", { children: "Ajouter une raison" }),
							/* @__PURE__ */ (0, h.jsxs)("label", {
								htmlFor: "decision-reason-" + e.id,
								children: ["Votre raison ", /* @__PURE__ */ (0, h.jsx)("span", {
									className: "muted",
									children: "(facultatif)"
								})]
							}),
							/* @__PURE__ */ (0, h.jsx)("textarea", {
								id: "decision-reason-" + e.id,
								name: "decision-reason",
								autoComplete: "off",
								rows: 2,
								maxLength: 4e3,
								value: c,
								onChange: (e) => l(e.target.value),
								placeholder: "Ce qui motive votre choix…"
							})
						]
					}),
					u ? /* @__PURE__ */ (0, h.jsx)("p", {
						className: "muted",
						role: "status",
						children: u
					}) : null,
					o ? /* @__PURE__ */ (0, h.jsx)("p", {
						className: "inline-error",
						role: "alert",
						children: o
					}) : null,
					/* @__PURE__ */ (0, h.jsxs)("button", {
						type: "submit",
						className: "primary",
						disabled: f || d || !e.selectedOptionId,
						children: [/* @__PURE__ */ (0, h.jsx)("span", { children: f ? "Enregistrement…" : m(e, n) }), /* @__PURE__ */ (0, h.jsx)("svg", {
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
							children: /* @__PURE__ */ (0, h.jsx)("path", { d: "M4 12h16m-6-6 6 6-6 6" })
						})]
					}),
					/* @__PURE__ */ (0, h.jsx)("p", {
						className: "muted",
						children: e.stage === "implementation" ? n === "automatic" ? "Une demande sera lancée. Son résultat restera à vérifier." : "Une demande sera créée pour votre agent hôte. Aucun agent automatique n’est actif." : "Rendu uniquement · version et contrôles inchangés."
					})
				]
			})
		]
	});
}
function v(e) {
	let t = JSON.stringify([
		e.draftScope,
		e.proposal.id,
		e.proposal.baseRevision
	]);
	return /* @__PURE__ */ (0, h.jsx)(_, { ...e }, t);
}
//#endregion
//#region studio-ui/src/decision-widget.tsx
function y(e) {
	let t = (0, r.createRoot)(e);
	return {
		update(e) {
			t.render(/* @__PURE__ */ (0, h.jsx)(v, { ...e }, e.proposal.id));
		},
		dispose() {
			t.unmount();
		}
	};
}
//#endregion
export { y as mountDecisionWidget };
