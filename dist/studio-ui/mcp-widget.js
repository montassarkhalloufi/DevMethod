import { i as e, n as t, r as n, t as r } from "./jsx-runtime-DZd2gj5L.js";
import { r as i } from "./i18n-CRhBcIYq.js";
import { a, d as o, f as s, n as c, o as l, r as u, t as d } from "./ConnectorGuide-IMh4AumH.js";
import { c as f, i as p, n as m, r as h, s as g, t as _ } from "./useMcpSelection-CKOOWESs.js";
//#region studio-ui/src/features/mcp/components/ProjectConnectorGuide.tsx
var v = e(), y = t(), b = r();
function x({ guide: e, controller: t }) {
	let { locale: r } = n();
	return e.definition ? /* @__PURE__ */ (0, b.jsxs)(b.Fragment, { children: [
		/* @__PURE__ */ (0, b.jsx)(d, {
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
			applyLabel: s("Ajouter à ma demande", r),
			onBack: e.back
		}, e.definition.optionId),
		e.persistence.saving ? /* @__PURE__ */ (0, b.jsx)("p", {
			role: "status",
			children: s("Enregistrement des réponses…", r)
		}) : null,
		e.persistence.error ? /* @__PURE__ */ (0, b.jsxs)("p", {
			role: "alert",
			children: [
				s(e.persistence.error, r),
				" ",
				/* @__PURE__ */ (0, b.jsx)("button", {
					type: "button",
					onClick: e.persistence.retry,
					children: s("Réessayer l’enregistrement", r)
				})
			]
		}) : null,
		e.preparation?.nativeConnection ? /* @__PURE__ */ (0, b.jsxs)("div", {
			className: "connector-guide-connect",
			children: [
				/* @__PURE__ */ (0, b.jsx)("p", { children: s("La préparation décrit votre besoin. La connexion autorise séparément l’accès de l’assistant.", r) }),
				e.preparation.nativeConnection.providerId === "github" ? /* @__PURE__ */ (0, b.jsx)(g, {
					input: m(e.preparation),
					controller: t
				}) : /* @__PURE__ */ (0, b.jsxs)("button", {
					type: "button",
					className: "primary",
					disabled: !!t.active,
					onClick: () => void t.connect(m(e.preparation)),
					children: [s("Connecter", r), e.definition.title]
				}),
				t.active ? /* @__PURE__ */ (0, b.jsx)("p", {
					role: "status",
					children: s("Connexion en cours. Terminez l’autorisation dans la fenêtre ouverte.", r)
				}) : null,
				t.error ? /* @__PURE__ */ (0, b.jsx)("p", {
					role: "alert",
					children: s(t.error, r)
				}) : null,
				t.connections.filter((t) => t.url === e.preparation?.nativeConnection?.url && t.status === "connected").map((e) => /* @__PURE__ */ (0, b.jsxs)("p", {
					role: "status",
					children: [
						e.name,
						" ",
						s("connecté ·", r),
						o("{count} outils disponibles", "{count} tools available", r, { count: e.tools.length.toLocaleString(r) })
					]
				}, e.id))
			]
		}) : null
	] }) : /* @__PURE__ */ (0, b.jsxs)("section", { children: [
		/* @__PURE__ */ (0, b.jsx)("button", {
			type: "button",
			onClick: e.back,
			children: s("Retour aux outils", r)
		}),
		/* @__PURE__ */ (0, b.jsx)("p", {
			role: e.catalog.error ? "alert" : "status",
			children: e.catalog.error && s(e.catalog.error, r) || (e.catalog.loading ? s("Chargement du guide…", r) : s("Ce guide est indisponible.", r))
		}),
		/* @__PURE__ */ (0, b.jsx)("button", {
			type: "button",
			disabled: e.catalog.loading,
			onClick: e.catalog.refresh,
			children: s("Réessayer le guide", r)
		})
	] });
}
//#endregion
//#region studio-ui/src/features/mcp/hooks/useProjectGuides.ts
function S(e) {
	let t = a(), n = u(), r = c(), [i, o] = (0, v.useState)(null), [s, d] = (0, v.useState)({}), [f, p] = (0, v.useState)([]), [m, h] = (0, v.useState)(""), g = (0, v.useRef)({
		selected: f,
		drafts: s
	});
	function _(t, n = !0) {
		g.current = {
			...g.current,
			selected: t
		}, p(t), n && e?.(t);
	}
	function y(e) {
		g.current = {
			...g.current,
			drafts: e
		}, d(e);
	}
	let b = t.guides.find((e) => e.optionId === i) ?? null, x = i ? s[i] ?? r.drafts[i]?.input ?? f.find((e) => e.optionId === i) ?? null : null, S = f.some((e) => {
		let t = s[e.optionId] ?? r.drafts[e.optionId]?.input;
		return t && l(e) !== l(t);
	});
	function C(e) {
		n.reset(), h(""), o(e);
	}
	function w(e) {
		n.reset(), y({
			...g.current.drafts,
			[e.optionId]: e
		}), r.edit(e.optionId, e, r.drafts[e.optionId]?.step ?? 0);
	}
	function T(e) {
		return new Set([...g.current.selected, ...e].map((e) => e.optionId)).size > 12 ? (h("Vous pouvez préparer jusqu’à 12 services par demande."), !1) : (_([...g.current.selected.filter((t) => !e.some((e) => e.optionId === t.optionId)), ...e]), y({
			...g.current.drafts,
			...Object.fromEntries(e.map((e) => [e.optionId, e]))
		}), !0);
	}
	function E(e) {
		l(e.input) === l(x) && T([e.input]) && o(null);
	}
	function D(e) {
		_(g.current.selected.filter((t) => !e.some((e) => l(e) === l(t))));
	}
	return {
		catalog: t,
		definition: b,
		input: x,
		selected: f,
		pending: S,
		error: m,
		activeId: i,
		requestGuides: () => g.current.selected,
		ready: () => !g.current.selected.some((e) => {
			let t = g.current.drafts[e.optionId] ?? r.drafts[e.optionId]?.input;
			return t && l(e) !== l(t);
		}),
		restore: (e) => _(e, !1),
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
		remove: (e) => _(g.current.selected.filter((t) => t.optionId !== e)),
		back: () => {
			n.reset(), o(null);
		}
	};
}
//#endregion
//#region studio-ui/src/features/mcp/components/ProjectMcpTools.tsx
function C({ apiRef: e, onGuidesChange: t }) {
	let { locale: r } = n(), i = _(), a = S(t), c = f((e) => {
		i.select(e, !0);
	}, (e) => {
		i.select(e, !1);
	}), [l, u] = (0, v.useState)(!1), d = (0, v.useRef)(null), m = (0, v.useRef)(null), g = (0, v.useRef)(null);
	(0, v.useImperativeHandle)(e, () => ({
		prepareRequest: async () => await i.prepareRequest() && a.ready(),
		addGuides: a.add,
		requestGuides: a.requestGuides,
		clearGuides: a.clear,
		restoreGuides: a.restore
	})), (0, v.useEffect)(() => {
		let e = d.current;
		l && e && !e.open ? (e.showModal(), m.current?.focus()) : !l && e?.open && e.close();
	}, [l]);
	function y() {
		u(!1), g.current?.focus();
	}
	let C = (e) => {
		i.select(e, !i.connectionIds.includes(e));
	};
	return /* @__PURE__ */ (0, b.jsxs)("div", {
		className: "project-mcp-tools",
		children: [
			a.selected.some((e) => e.flowId === "linear-read") && c.connections.some((e) => e.provider === "linear" && e.url !== "https://mcp.linear.app/mcp/readonly" && i.connectionIds.includes(e.id)) ? /* @__PURE__ */ (0, b.jsx)("p", {
				role: "alert",
				children: s("Une connexion Linear avec accès standard est aussi sélectionnée. Retirez-la pour limiter les outils du projet à la lecture seule.", r)
			}) : null,
			a.selected.length ? /* @__PURE__ */ (0, b.jsx)("div", {
				className: "connector-guide-chips",
				"aria-label": s("Services préparés pour la demande", r),
				children: a.selected.map((e) => /* @__PURE__ */ (0, b.jsxs)("span", { children: [/* @__PURE__ */ (0, b.jsxs)("button", {
					type: "button",
					onClick: (t) => {
						g.current = t.currentTarget, a.open(e.optionId), u(!0);
					},
					children: [
						a.catalog.guides.find((t) => t.optionId === e.optionId)?.title ?? e.optionId,
						" ",
						s("· Préparé", r)
					]
				}), /* @__PURE__ */ (0, b.jsx)("button", {
					type: "button",
					"aria-label": o("Retirer la préparation {name}", "Remove preparation {name}", r, { name: e.optionId }),
					onClick: () => a.remove(e.optionId),
					children: "×"
				})] }, e.optionId))
			}) : null,
			a.pending ? /* @__PURE__ */ (0, b.jsx)("p", {
				role: "alert",
				children: s("Des réponses ont changé. Vérifiez la préparation puis ajoutez-la à la demande, ou retirez sa pastille.", r)
			}) : null,
			a.error ? /* @__PURE__ */ (0, b.jsx)("p", {
				role: "alert",
				children: s(a.error, r)
			}) : null,
			/* @__PURE__ */ (0, b.jsx)(h, {
				connections: c.connections,
				selectedIds: i.connectionIds,
				onToggle: C,
				disabled: i.loading || i.saving,
				onManage: (e) => {
					g.current = e, u(!0);
				}
			}),
			i.saving ? /* @__PURE__ */ (0, b.jsx)("p", {
				className: "mcp-note",
				role: "status",
				children: s("Enregistrement des outils du projet…", r)
			}) : null,
			i.error ? /* @__PURE__ */ (0, b.jsxs)("div", { children: [/* @__PURE__ */ (0, b.jsx)("p", {
				className: "mcp-connection-error",
				role: "alert",
				children: s(i.error, r)
			}), /* @__PURE__ */ (0, b.jsx)("button", {
				type: "button",
				disabled: i.loading || i.saving,
				onClick: i.refresh,
				children: s("Réessayer la sélection", r)
			})] }) : null,
			/* @__PURE__ */ (0, b.jsxs)("dialog", {
				ref: d,
				className: "mcp-settings-dialog",
				"aria-labelledby": "project-mcp-title",
				onClose: y,
				children: [
					/* @__PURE__ */ (0, b.jsxs)("header", { children: [/* @__PURE__ */ (0, b.jsx)("h2", {
						id: "project-mcp-title",
						ref: m,
						tabIndex: -1,
						children: s("Outils du projet", r)
					}), /* @__PURE__ */ (0, b.jsx)("button", {
						type: "button",
						"aria-label": s("Fermer les outils MCP", r),
						onClick: y,
						children: "×"
					})] }),
					!i.supported && !i.loading ? /* @__PURE__ */ (0, b.jsx)("p", {
						className: "mcp-note",
						children: s("Ouvrez le projet depuis l’accueil Studio pour utiliser les connexions de l’espace.", r)
					}) : null,
					a.activeId ? /* @__PURE__ */ (0, b.jsx)(x, {
						guide: a,
						controller: c
					}) : /* @__PURE__ */ (0, b.jsx)(p, {
						controller: c,
						onConfigureGuide: a.open,
						selectedIds: i.connectionIds,
						onToggle: C,
						disabled: !i.supported || i.loading || i.saving
					}),
					/* @__PURE__ */ (0, b.jsx)("p", {
						className: "mcp-note",
						children: s("La sélection s’applique aux prochaines demandes de ce projet. Désélectionner un serveur retire aussi son accès à une mission en cours.", r)
					}),
					/* @__PURE__ */ (0, b.jsx)("footer", { children: /* @__PURE__ */ (0, b.jsx)("button", {
						type: "button",
						className: "primary",
						onClick: y,
						children: s("Terminé", r)
					}) })
				]
			})
		]
	});
}
//#endregion
//#region studio-ui/src/mcp-widget.tsx
function w(e, t) {
	i(e.ownerDocument, e.ownerDocument.defaultView ?? void 0);
	let n = (0, y.createRoot)(e), r = null, a;
	return n.render(/* @__PURE__ */ (0, b.jsx)(C, {
		apiRef: (e) => {
			if (r = e, e && a) {
				let t = a;
				a = void 0, e.restoreGuides(t);
			}
		},
		onGuidesChange: t?.onGuidesChange
	})), {
		prepareRequest: () => r?.prepareRequest() || Promise.resolve(!1),
		restoreGuides: (e) => {
			r ? r.restoreGuides(e) : a = e;
		},
		addGuides: (e) => r?.addGuides(e) ?? !1,
		requestGuides: () => r?.requestGuides() ?? a ?? [],
		clearGuides: (e) => r?.clearGuides(e),
		dispose: () => n.unmount()
	};
}
//#endregion
export { w as mountMcpWidget };
