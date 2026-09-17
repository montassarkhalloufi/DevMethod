import { n as e, r as t, t as n } from "./jsx-runtime-Bz8zB3tG.js";
import { a as r, n as i, r as a, t as o } from "./ConnectorGuide-B-paXMRz.js";
import { i as s, n as c, r as l, t as u } from "./guided-mcp-DfE0F9Ab.js";
//#region studio-ui/src/features/mcp/hooks/useMcpSelection.ts
var d = e(), f = t();
async function p(e, t) {
	let n = await fetch("/api/mcp/selection", {
		credentials: "same-origin",
		cache: "no-store",
		signal: AbortSignal.any([e, AbortSignal.timeout(15e3)]),
		...t ? {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ connectionIds: t })
		} : {}
	}), r = await n.json();
	if (!n.ok) throw Error(r.error?.message || r.error || "La sélection MCP n’a pas été enregistrée.");
	if (!Array.isArray(r.connectionIds) || r.connectionIds.some((e) => typeof e != "string")) throw Error("La sélection MCP reçue est illisible.");
	return {
		supported: r.supported === !0,
		connectionIds: r.connectionIds,
		reason: r.reason
	};
}
function m() {
	let [e, t] = (0, f.useState)({
		supported: !1,
		connectionIds: []
	}), [n, r] = (0, f.useState)(!0), [i, a] = (0, f.useState)(!1), [o, s] = (0, f.useState)(""), c = (0, f.useRef)(null), l = (0, f.useRef)(null), u = (0, f.useRef)(null), d = (0, f.useRef)(""), m = (0, f.useCallback)(() => {
		c.current?.abort();
		let e = new AbortController();
		c.current = e, r(!0), s(""), d.current = "", u.current = p(e.signal).then((n) => {
			e.signal.aborted || t(n);
		}).catch((t) => {
			e.signal.aborted || (d.current = t instanceof Error ? t.message : "Sélection indisponible.", s(d.current));
		}).finally(() => {
			e.signal.aborted || r(!1);
		});
	}, []);
	(0, f.useEffect)(() => (m(), () => {
		c.current?.abort(), l.current?.abort();
	}), [m]);
	async function h(r, i) {
		if (n || l.current || !e.supported || e.connectionIds.includes(r) === i) return;
		let o = i ? [...e.connectionIds, r] : e.connectionIds.filter((e) => e !== r);
		if (o.length > 12) {
			s("Vous pouvez sélectionner au maximum 12 serveurs MCP.");
			return;
		}
		c.current?.abort();
		let u = new AbortController();
		l.current = u, a(!0), d.current = "", s("");
		try {
			let e = await p(u.signal, o);
			u.signal.aborted || t(e);
		} catch (e) {
			u.signal.aborted || (d.current = e instanceof Error ? e.message : "Sélection non enregistrée.", s(d.current));
		} finally {
			u.signal.aborted || (l.current = null, a(!1));
		}
	}
	return {
		...e,
		loading: n,
		saving: i,
		error: o,
		select: (t, r) => {
			if (n || l.current || !e.supported || e.connectionIds.includes(t) === r) return u.current;
			let i = h(t, r);
			return u.current = i, i;
		},
		refresh: m,
		prepareRequest: async () => (await u.current, !d.current)
	};
}
//#endregion
//#region studio-ui/src/features/mcp/components/ProjectConnectorGuide.tsx
var h = n();
function g({ guide: e, controller: t }) {
	return e.definition ? /* @__PURE__ */ (0, h.jsxs)(h.Fragment, { children: [/* @__PURE__ */ (0, h.jsx)(o, {
		definition: e.definition,
		draft: e.input,
		preparation: e.preparation,
		preparing: e.preparing,
		error: e.preparationError,
		onChange: e.change,
		onPrepare: (t) => void e.prepare(t),
		onApply: e.apply,
		applyLabel: "Ajouter à ma demande",
		onBack: e.back
	}, e.definition.optionId), e.preparation?.nativeConnection ? /* @__PURE__ */ (0, h.jsxs)("div", {
		className: "connector-guide-connect",
		children: [
			/* @__PURE__ */ (0, h.jsx)("p", { children: "La préparation décrit votre besoin. La connexion autorise séparément l’accès de l’assistant." }),
			/* @__PURE__ */ (0, h.jsxs)("button", {
				type: "button",
				className: "primary",
				disabled: !!t.active,
				onClick: () => void t.connect(u(e.preparation)),
				children: ["Connecter ", e.definition.title]
			}),
			t.active ? /* @__PURE__ */ (0, h.jsx)("p", {
				role: "status",
				children: "Connexion en cours. Terminez l’autorisation dans la fenêtre ouverte."
			}) : null,
			t.error ? /* @__PURE__ */ (0, h.jsx)("p", {
				role: "alert",
				children: t.error
			}) : null,
			t.connections.filter((t) => t.url === e.preparation?.nativeConnection?.url && t.status === "connected").map((e) => /* @__PURE__ */ (0, h.jsxs)("p", {
				role: "status",
				children: [
					e.name,
					" connecté · ",
					e.tools.length,
					" outils disponibles"
				]
			}, e.id))
		]
	}) : null] }) : /* @__PURE__ */ (0, h.jsxs)("section", { children: [
		/* @__PURE__ */ (0, h.jsx)("button", {
			type: "button",
			onClick: e.back,
			children: "Retour aux outils"
		}),
		/* @__PURE__ */ (0, h.jsx)("p", {
			role: e.catalog.error ? "alert" : "status",
			children: e.catalog.error || (e.catalog.loading ? "Chargement du guide…" : "Ce guide est indisponible.")
		}),
		/* @__PURE__ */ (0, h.jsx)("button", {
			type: "button",
			disabled: e.catalog.loading,
			onClick: e.catalog.refresh,
			children: "Réessayer le guide"
		})
	] });
}
//#endregion
//#region studio-ui/src/features/mcp/hooks/useProjectGuides.ts
function _(e) {
	let t = a(), n = i(), [o, s] = (0, f.useState)(null), [c, l] = (0, f.useState)({}), [u, d] = (0, f.useState)([]), [p, m] = (0, f.useState)(""), h = (0, f.useRef)({
		selected: u,
		drafts: c
	});
	function g(t, n = !0) {
		h.current = {
			...h.current,
			selected: t
		}, d(t), n && e?.(t);
	}
	function _(e) {
		h.current = {
			...h.current,
			drafts: e
		}, l(e);
	}
	let v = t.guides.find((e) => e.optionId === o) ?? null, y = o ? c[o] ?? u.find((e) => e.optionId === o) ?? null : null, b = u.some((e) => c[e.optionId] && r(e) !== r(c[e.optionId]));
	function x(e) {
		n.reset(), m(""), s(e);
	}
	function S(e) {
		n.reset(), _({
			...h.current.drafts,
			[e.optionId]: e
		});
	}
	function C(e) {
		return new Set([...h.current.selected, ...e].map((e) => e.optionId)).size > 12 ? (m("Vous pouvez préparer jusqu’à 12 services par demande."), !1) : (g([...h.current.selected.filter((t) => !e.some((e) => e.optionId === t.optionId)), ...e]), _({
			...h.current.drafts,
			...Object.fromEntries(e.map((e) => [e.optionId, e]))
		}), !0);
	}
	function w(e) {
		r(e.input) === r(y) && C([e.input]) && s(null);
	}
	function T(e) {
		g(h.current.selected.filter((t) => !e.some((e) => r(e) === r(t))));
	}
	return {
		catalog: t,
		definition: v,
		input: y,
		selected: u,
		pending: b,
		error: p,
		activeId: o,
		requestGuides: () => h.current.selected,
		ready: () => !h.current.selected.some((e) => h.current.drafts[e.optionId] && r(e) !== r(h.current.drafts[e.optionId])),
		restore: (e) => g(e, !1),
		preparation: n.preparation,
		preparing: n.loading,
		preparationError: n.error,
		prepare: n.prepare,
		open: x,
		change: S,
		apply: w,
		add: C,
		clear: T,
		remove: (e) => g(h.current.selected.filter((t) => t.optionId !== e)),
		back: () => {
			n.reset(), s(null);
		}
	};
}
//#endregion
//#region studio-ui/src/features/mcp/components/ProjectMcpTools.tsx
function v({ apiRef: e, onGuidesChange: t }) {
	let n = m(), r = _(t), i = s((e) => {
		n.select(e, !0);
	}, (e) => {
		n.select(e, !1);
	}), [a, o] = (0, f.useState)(!1), u = (0, f.useRef)(null), d = (0, f.useRef)(null), p = (0, f.useRef)(null);
	(0, f.useImperativeHandle)(e, () => ({
		prepareRequest: async () => await n.prepareRequest() && r.ready(),
		addGuides: r.add,
		requestGuides: r.requestGuides,
		clearGuides: r.clear,
		restoreGuides: r.restore
	})), (0, f.useEffect)(() => {
		let e = u.current;
		a && e && !e.open ? (e.showModal(), d.current?.focus()) : !a && e?.open && e.close();
	}, [a]);
	function v() {
		o(!1), p.current?.focus();
	}
	let y = (e) => {
		n.select(e, !n.connectionIds.includes(e));
	};
	return /* @__PURE__ */ (0, h.jsxs)("div", {
		className: "project-mcp-tools",
		children: [
			r.selected.some((e) => e.flowId === "linear-read") && i.connections.some((e) => e.provider === "linear" && e.url !== "https://mcp.linear.app/mcp/readonly" && n.connectionIds.includes(e.id)) ? /* @__PURE__ */ (0, h.jsx)("p", {
				role: "alert",
				children: "Une connexion Linear avec accès standard est aussi sélectionnée. Retirez-la pour limiter les outils du projet à la lecture seule."
			}) : null,
			r.selected.length ? /* @__PURE__ */ (0, h.jsx)("div", {
				className: "connector-guide-chips",
				"aria-label": "Services préparés pour la demande",
				children: r.selected.map((e) => /* @__PURE__ */ (0, h.jsxs)("span", { children: [/* @__PURE__ */ (0, h.jsxs)("button", {
					type: "button",
					onClick: (t) => {
						p.current = t.currentTarget, r.open(e.optionId), o(!0);
					},
					children: [
						r.catalog.guides.find((t) => t.optionId === e.optionId)?.title ?? e.optionId,
						" ",
						"· Préparé"
					]
				}), /* @__PURE__ */ (0, h.jsx)("button", {
					type: "button",
					"aria-label": "Retirer la préparation " + e.optionId,
					onClick: () => r.remove(e.optionId),
					children: "×"
				})] }, e.optionId))
			}) : null,
			r.pending ? /* @__PURE__ */ (0, h.jsx)("p", {
				role: "alert",
				children: "Des réponses ont changé. Vérifiez la préparation puis ajoutez-la à la demande, ou retirez sa pastille."
			}) : null,
			r.error ? /* @__PURE__ */ (0, h.jsx)("p", {
				role: "alert",
				children: r.error
			}) : null,
			/* @__PURE__ */ (0, h.jsx)(c, {
				connections: i.connections,
				selectedIds: n.connectionIds,
				onToggle: y,
				disabled: n.loading || n.saving,
				onManage: (e) => {
					p.current = e, o(!0);
				}
			}),
			n.saving ? /* @__PURE__ */ (0, h.jsx)("p", {
				className: "mcp-note",
				role: "status",
				children: "Enregistrement des outils du projet…"
			}) : null,
			n.error ? /* @__PURE__ */ (0, h.jsxs)("div", { children: [/* @__PURE__ */ (0, h.jsx)("p", {
				className: "mcp-connection-error",
				role: "alert",
				children: n.error
			}), /* @__PURE__ */ (0, h.jsx)("button", {
				type: "button",
				disabled: n.loading || n.saving,
				onClick: n.refresh,
				children: "Réessayer la sélection"
			})] }) : null,
			/* @__PURE__ */ (0, h.jsxs)("dialog", {
				ref: u,
				className: "mcp-settings-dialog",
				"aria-labelledby": "project-mcp-title",
				onClose: v,
				children: [
					/* @__PURE__ */ (0, h.jsxs)("header", { children: [/* @__PURE__ */ (0, h.jsx)("h2", {
						id: "project-mcp-title",
						ref: d,
						tabIndex: -1,
						children: "Outils du projet"
					}), /* @__PURE__ */ (0, h.jsx)("button", {
						type: "button",
						"aria-label": "Fermer les outils MCP",
						onClick: v,
						children: "×"
					})] }),
					!n.supported && !n.loading ? /* @__PURE__ */ (0, h.jsx)("p", {
						className: "mcp-note",
						children: "Ouvrez le projet depuis l’accueil Studio pour utiliser les connexions de l’espace."
					}) : null,
					r.activeId ? /* @__PURE__ */ (0, h.jsx)(g, {
						guide: r,
						controller: i
					}) : /* @__PURE__ */ (0, h.jsx)(l, {
						controller: i,
						onConfigureGuide: r.open,
						selectedIds: n.connectionIds,
						onToggle: y,
						disabled: !n.supported || n.loading || n.saving
					}),
					/* @__PURE__ */ (0, h.jsx)("p", {
						className: "mcp-note",
						children: "La sélection s’applique aux prochaines demandes de ce projet. Désélectionner un serveur retire aussi son accès à une mission en cours."
					}),
					/* @__PURE__ */ (0, h.jsx)("footer", { children: /* @__PURE__ */ (0, h.jsx)("button", {
						type: "button",
						className: "primary",
						onClick: v,
						children: "Terminé"
					}) })
				]
			})
		]
	});
}
//#endregion
//#region studio-ui/src/mcp-widget.tsx
function y(e, t) {
	let n = (0, d.createRoot)(e), r = null, i;
	return n.render(/* @__PURE__ */ (0, h.jsx)(v, {
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
export { y as mountMcpWidget };
