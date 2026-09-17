import { n as e, r as t, t as n } from "./jsx-runtime-Bz8zB3tG.js";
import { c as r, i, n as a, r as o, s, t as c } from "./useMcpSelection-BrYUToXT.js";
import { a as l, n as u, o as d, r as f, t as p } from "./ConnectorGuide-lY7QqwYz.js";
//#region studio-ui/src/features/mcp/components/ProjectConnectorGuide.tsx
var m = t(), h = e(), g = n();
function _({ guide: e, controller: t }) {
	return e.definition ? /* @__PURE__ */ (0, g.jsxs)(g.Fragment, { children: [
		/* @__PURE__ */ (0, g.jsx)(p, {
			definition: e.definition,
			draft: e.input,
			step: e.step,
			onStepChange: e.setStep,
			preparation: e.preparation,
			preparing: e.preparing,
			error: e.preparationError,
			onChange: e.change,
			onPrepare: (t) => void e.prepare(t),
			onApply: e.apply,
			applyLabel: "Ajouter à ma demande",
			onBack: e.back
		}, e.definition.optionId),
		e.persistence.saving ? /* @__PURE__ */ (0, g.jsx)("p", {
			role: "status",
			children: "Enregistrement des réponses…"
		}) : null,
		e.persistence.error ? /* @__PURE__ */ (0, g.jsxs)("p", {
			role: "alert",
			children: [
				e.persistence.error,
				" ",
				/* @__PURE__ */ (0, g.jsx)("button", {
					type: "button",
					onClick: e.persistence.retry,
					children: "Réessayer l’enregistrement"
				})
			]
		}) : null,
		e.preparation?.nativeConnection ? /* @__PURE__ */ (0, g.jsxs)("div", {
			className: "connector-guide-connect",
			children: [
				/* @__PURE__ */ (0, g.jsx)("p", { children: "La préparation décrit votre besoin. La connexion autorise séparément l’accès de l’assistant." }),
				e.preparation.nativeConnection.providerId === "github" ? /* @__PURE__ */ (0, g.jsx)(s, {
					input: a(e.preparation),
					controller: t
				}) : /* @__PURE__ */ (0, g.jsxs)("button", {
					type: "button",
					className: "primary",
					disabled: !!t.active,
					onClick: () => void t.connect(a(e.preparation)),
					children: ["Connecter ", e.definition.title]
				}),
				t.active ? /* @__PURE__ */ (0, g.jsx)("p", {
					role: "status",
					children: "Connexion en cours. Terminez l’autorisation dans la fenêtre ouverte."
				}) : null,
				t.error ? /* @__PURE__ */ (0, g.jsx)("p", {
					role: "alert",
					children: t.error
				}) : null,
				t.connections.filter((t) => t.url === e.preparation?.nativeConnection?.url && t.status === "connected").map((e) => /* @__PURE__ */ (0, g.jsxs)("p", {
					role: "status",
					children: [
						e.name,
						" connecté · ",
						e.tools.length,
						" outils disponibles"
					]
				}, e.id))
			]
		}) : null
	] }) : /* @__PURE__ */ (0, g.jsxs)("section", { children: [
		/* @__PURE__ */ (0, g.jsx)("button", {
			type: "button",
			onClick: e.back,
			children: "Retour aux outils"
		}),
		/* @__PURE__ */ (0, g.jsx)("p", {
			role: e.catalog.error ? "alert" : "status",
			children: e.catalog.error || (e.catalog.loading ? "Chargement du guide…" : "Ce guide est indisponible.")
		}),
		/* @__PURE__ */ (0, g.jsx)("button", {
			type: "button",
			disabled: e.catalog.loading,
			onClick: e.catalog.refresh,
			children: "Réessayer le guide"
		})
	] });
}
//#endregion
//#region studio-ui/src/features/mcp/hooks/useProjectGuides.ts
function v(e) {
	let t = l(), n = f(), r = u(), [i, a] = (0, m.useState)(null), [o, s] = (0, m.useState)({}), [c, p] = (0, m.useState)([]), [h, g] = (0, m.useState)(""), _ = (0, m.useRef)({
		selected: c,
		drafts: o
	});
	function v(t, n = !0) {
		_.current = {
			..._.current,
			selected: t
		}, p(t), n && e?.(t);
	}
	function y(e) {
		_.current = {
			..._.current,
			drafts: e
		}, s(e);
	}
	let b = t.guides.find((e) => e.optionId === i) ?? null, x = i ? o[i] ?? r.drafts[i]?.input ?? c.find((e) => e.optionId === i) ?? null : null, S = c.some((e) => {
		let t = o[e.optionId] ?? r.drafts[e.optionId]?.input;
		return t && d(e) !== d(t);
	});
	function C(e) {
		n.reset(), g(""), a(e);
	}
	function w(e) {
		n.reset(), y({
			..._.current.drafts,
			[e.optionId]: e
		}), r.edit(e.optionId, e, r.drafts[e.optionId]?.step ?? 0);
	}
	function T(e) {
		return new Set([..._.current.selected, ...e].map((e) => e.optionId)).size > 12 ? (g("Vous pouvez préparer jusqu’à 12 services par demande."), !1) : (v([..._.current.selected.filter((t) => !e.some((e) => e.optionId === t.optionId)), ...e]), y({
			..._.current.drafts,
			...Object.fromEntries(e.map((e) => [e.optionId, e]))
		}), !0);
	}
	function E(e) {
		d(e.input) === d(x) && T([e.input]) && a(null);
	}
	function D(e) {
		v(_.current.selected.filter((t) => !e.some((e) => d(e) === d(t))));
	}
	return {
		catalog: t,
		definition: b,
		input: x,
		selected: c,
		pending: S,
		error: h,
		activeId: i,
		requestGuides: () => _.current.selected,
		ready: () => !_.current.selected.some((e) => {
			let t = _.current.drafts[e.optionId] ?? r.drafts[e.optionId]?.input;
			return t && d(e) !== d(t);
		}),
		restore: (e) => v(e, !1),
		preparation: n.preparation,
		preparing: n.loading,
		preparationError: n.error,
		persistence: r,
		step: i ? r.drafts[i]?.step : void 0,
		setStep: (e) => {
			i && r.edit(i, x, e);
		},
		prepare: n.prepare,
		open: C,
		change: w,
		apply: E,
		add: T,
		clear: D,
		remove: (e) => v(_.current.selected.filter((t) => t.optionId !== e)),
		back: () => {
			n.reset(), a(null);
		}
	};
}
//#endregion
//#region studio-ui/src/features/mcp/components/ProjectMcpTools.tsx
function y({ apiRef: e, onGuidesChange: t }) {
	let n = c(), a = v(t), s = r((e) => {
		n.select(e, !0);
	}, (e) => {
		n.select(e, !1);
	}), [l, u] = (0, m.useState)(!1), d = (0, m.useRef)(null), f = (0, m.useRef)(null), p = (0, m.useRef)(null);
	(0, m.useImperativeHandle)(e, () => ({
		prepareRequest: async () => await n.prepareRequest() && a.ready(),
		addGuides: a.add,
		requestGuides: a.requestGuides,
		clearGuides: a.clear,
		restoreGuides: a.restore
	})), (0, m.useEffect)(() => {
		let e = d.current;
		l && e && !e.open ? (e.showModal(), f.current?.focus()) : !l && e?.open && e.close();
	}, [l]);
	function h() {
		u(!1), p.current?.focus();
	}
	let y = (e) => {
		n.select(e, !n.connectionIds.includes(e));
	};
	return /* @__PURE__ */ (0, g.jsxs)("div", {
		className: "project-mcp-tools",
		children: [
			a.selected.some((e) => e.flowId === "linear-read") && s.connections.some((e) => e.provider === "linear" && e.url !== "https://mcp.linear.app/mcp/readonly" && n.connectionIds.includes(e.id)) ? /* @__PURE__ */ (0, g.jsx)("p", {
				role: "alert",
				children: "Une connexion Linear avec accès standard est aussi sélectionnée. Retirez-la pour limiter les outils du projet à la lecture seule."
			}) : null,
			a.selected.length ? /* @__PURE__ */ (0, g.jsx)("div", {
				className: "connector-guide-chips",
				"aria-label": "Services préparés pour la demande",
				children: a.selected.map((e) => /* @__PURE__ */ (0, g.jsxs)("span", { children: [/* @__PURE__ */ (0, g.jsxs)("button", {
					type: "button",
					onClick: (t) => {
						p.current = t.currentTarget, a.open(e.optionId), u(!0);
					},
					children: [
						a.catalog.guides.find((t) => t.optionId === e.optionId)?.title ?? e.optionId,
						" ",
						"· Préparé"
					]
				}), /* @__PURE__ */ (0, g.jsx)("button", {
					type: "button",
					"aria-label": "Retirer la préparation " + e.optionId,
					onClick: () => a.remove(e.optionId),
					children: "×"
				})] }, e.optionId))
			}) : null,
			a.pending ? /* @__PURE__ */ (0, g.jsx)("p", {
				role: "alert",
				children: "Des réponses ont changé. Vérifiez la préparation puis ajoutez-la à la demande, ou retirez sa pastille."
			}) : null,
			a.error ? /* @__PURE__ */ (0, g.jsx)("p", {
				role: "alert",
				children: a.error
			}) : null,
			/* @__PURE__ */ (0, g.jsx)(o, {
				connections: s.connections,
				selectedIds: n.connectionIds,
				onToggle: y,
				disabled: n.loading || n.saving,
				onManage: (e) => {
					p.current = e, u(!0);
				}
			}),
			n.saving ? /* @__PURE__ */ (0, g.jsx)("p", {
				className: "mcp-note",
				role: "status",
				children: "Enregistrement des outils du projet…"
			}) : null,
			n.error ? /* @__PURE__ */ (0, g.jsxs)("div", { children: [/* @__PURE__ */ (0, g.jsx)("p", {
				className: "mcp-connection-error",
				role: "alert",
				children: n.error
			}), /* @__PURE__ */ (0, g.jsx)("button", {
				type: "button",
				disabled: n.loading || n.saving,
				onClick: n.refresh,
				children: "Réessayer la sélection"
			})] }) : null,
			/* @__PURE__ */ (0, g.jsxs)("dialog", {
				ref: d,
				className: "mcp-settings-dialog",
				"aria-labelledby": "project-mcp-title",
				onClose: h,
				children: [
					/* @__PURE__ */ (0, g.jsxs)("header", { children: [/* @__PURE__ */ (0, g.jsx)("h2", {
						id: "project-mcp-title",
						ref: f,
						tabIndex: -1,
						children: "Outils du projet"
					}), /* @__PURE__ */ (0, g.jsx)("button", {
						type: "button",
						"aria-label": "Fermer les outils MCP",
						onClick: h,
						children: "×"
					})] }),
					!n.supported && !n.loading ? /* @__PURE__ */ (0, g.jsx)("p", {
						className: "mcp-note",
						children: "Ouvrez le projet depuis l’accueil Studio pour utiliser les connexions de l’espace."
					}) : null,
					a.activeId ? /* @__PURE__ */ (0, g.jsx)(_, {
						guide: a,
						controller: s
					}) : /* @__PURE__ */ (0, g.jsx)(i, {
						controller: s,
						onConfigureGuide: a.open,
						selectedIds: n.connectionIds,
						onToggle: y,
						disabled: !n.supported || n.loading || n.saving
					}),
					/* @__PURE__ */ (0, g.jsx)("p", {
						className: "mcp-note",
						children: "La sélection s’applique aux prochaines demandes de ce projet. Désélectionner un serveur retire aussi son accès à une mission en cours."
					}),
					/* @__PURE__ */ (0, g.jsx)("footer", { children: /* @__PURE__ */ (0, g.jsx)("button", {
						type: "button",
						className: "primary",
						onClick: h,
						children: "Terminé"
					}) })
				]
			})
		]
	});
}
//#endregion
//#region studio-ui/src/mcp-widget.tsx
function b(e, t) {
	let n = (0, h.createRoot)(e), r = null, i;
	return n.render(/* @__PURE__ */ (0, g.jsx)(y, {
		apiRef: (e) => {
			if (r = e, e && i) {
				let t = i;
				i = void 0, e.restoreGuides(t);
			}
		},
		onGuidesChange: t?.onGuidesChange
	})), {
		prepareRequest: () => r?.prepareRequest() || Promise.resolve(!1),
		restoreGuides: (e) => {
			r ? r.restoreGuides(e) : i = e;
		},
		addGuides: (e) => r?.addGuides(e) ?? !1,
		requestGuides: () => r?.requestGuides() ?? i ?? [],
		clearGuides: (e) => r?.clearGuides(e),
		dispose: () => n.unmount()
	};
}
//#endregion
export { b as mountMcpWidget };
