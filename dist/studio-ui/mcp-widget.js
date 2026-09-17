import { n as e, r as t, t as n } from "./jsx-runtime-Bz8zB3tG.js";
import { n as r, r as i, t as a } from "./McpPromptSelection-DDwhpHZR.js";
//#region studio-ui/src/features/mcp/hooks/useMcpSelection.ts
var o = e(), s = t();
async function c(e, t) {
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
function l() {
	let [e, t] = (0, s.useState)({
		supported: !1,
		connectionIds: []
	}), [n, r] = (0, s.useState)(!0), [i, a] = (0, s.useState)(!1), [o, l] = (0, s.useState)(""), u = (0, s.useRef)(null), d = (0, s.useRef)(null), f = (0, s.useRef)(null), p = (0, s.useRef)(""), m = (0, s.useCallback)(() => {
		u.current?.abort();
		let e = new AbortController();
		u.current = e, r(!0), l(""), p.current = "", f.current = c(e.signal).then((n) => {
			e.signal.aborted || t(n);
		}).catch((t) => {
			e.signal.aborted || (p.current = t instanceof Error ? t.message : "Sélection indisponible.", l(p.current));
		}).finally(() => {
			e.signal.aborted || r(!1);
		});
	}, []);
	(0, s.useEffect)(() => (m(), () => {
		u.current?.abort(), d.current?.abort();
	}), [m]);
	async function h(r, i) {
		if (n || d.current || !e.supported || e.connectionIds.includes(r) === i) return;
		let o = i ? [...e.connectionIds, r] : e.connectionIds.filter((e) => e !== r);
		if (o.length > 12) {
			l("Vous pouvez sélectionner au maximum 12 serveurs MCP.");
			return;
		}
		u.current?.abort();
		let s = new AbortController();
		d.current = s, a(!0), p.current = "", l("");
		try {
			let e = await c(s.signal, o);
			s.signal.aborted || t(e);
		} catch (e) {
			s.signal.aborted || (p.current = e instanceof Error ? e.message : "Sélection non enregistrée.", l(p.current));
		} finally {
			s.signal.aborted || (d.current = null, a(!1));
		}
	}
	return {
		...e,
		loading: n,
		saving: i,
		error: o,
		select: (t, r) => {
			if (n || d.current || !e.supported || e.connectionIds.includes(t) === r) return f.current;
			let i = h(t, r);
			return f.current = i, i;
		},
		refresh: m,
		prepareRequest: async () => (await f.current, !p.current)
	};
}
//#endregion
//#region studio-ui/src/features/mcp/components/ProjectMcpTools.tsx
var u = n();
function d({ apiRef: e }) {
	let t = l(), n = i((e) => {
		t.select(e, !0);
	}, (e) => {
		t.select(e, !1);
	}), [o, c] = (0, s.useState)(!1), d = (0, s.useRef)(null), f = (0, s.useRef)(null), p = (0, s.useRef)(null);
	(0, s.useImperativeHandle)(e, () => ({ prepareRequest: t.prepareRequest }), [t.prepareRequest]), (0, s.useEffect)(() => {
		let e = d.current;
		o && e && !e.open ? (e.showModal(), f.current?.focus()) : !o && e?.open && e.close();
	}, [o]);
	function m() {
		c(!1), p.current?.focus();
	}
	let h = (e) => {
		t.select(e, !t.connectionIds.includes(e));
	};
	return /* @__PURE__ */ (0, u.jsxs)("div", {
		className: "project-mcp-tools",
		children: [
			/* @__PURE__ */ (0, u.jsx)(a, {
				connections: n.connections,
				selectedIds: t.connectionIds,
				onToggle: h,
				disabled: t.loading || t.saving,
				onManage: (e) => {
					p.current = e, c(!0);
				}
			}),
			t.saving ? /* @__PURE__ */ (0, u.jsx)("p", {
				className: "mcp-note",
				role: "status",
				children: "Enregistrement des outils du projet…"
			}) : null,
			t.error ? /* @__PURE__ */ (0, u.jsxs)("div", { children: [/* @__PURE__ */ (0, u.jsx)("p", {
				className: "mcp-connection-error",
				role: "alert",
				children: t.error
			}), /* @__PURE__ */ (0, u.jsx)("button", {
				type: "button",
				disabled: t.loading || t.saving,
				onClick: t.refresh,
				children: "Réessayer la sélection"
			})] }) : null,
			/* @__PURE__ */ (0, u.jsxs)("dialog", {
				ref: d,
				className: "mcp-settings-dialog",
				"aria-labelledby": "project-mcp-title",
				onClose: m,
				children: [
					/* @__PURE__ */ (0, u.jsxs)("header", { children: [/* @__PURE__ */ (0, u.jsx)("h2", {
						id: "project-mcp-title",
						ref: f,
						tabIndex: -1,
						children: "Outils du projet"
					}), /* @__PURE__ */ (0, u.jsx)("button", {
						type: "button",
						"aria-label": "Fermer les outils MCP",
						onClick: m,
						children: "×"
					})] }),
					!t.supported && !t.loading ? /* @__PURE__ */ (0, u.jsx)("p", {
						className: "mcp-note",
						children: "Ouvrez le projet depuis l’accueil Studio pour utiliser les connexions de l’espace."
					}) : null,
					/* @__PURE__ */ (0, u.jsx)(r, {
						controller: n,
						selectedIds: t.connectionIds,
						onToggle: h,
						disabled: !t.supported || t.loading || t.saving
					}),
					/* @__PURE__ */ (0, u.jsx)("p", {
						className: "mcp-note",
						children: "La sélection s’applique aux prochaines demandes de ce projet. Désélectionner un serveur retire aussi son accès à une mission en cours."
					}),
					/* @__PURE__ */ (0, u.jsx)("footer", { children: /* @__PURE__ */ (0, u.jsx)("button", {
						type: "button",
						className: "primary",
						onClick: m,
						children: "Terminé"
					}) })
				]
			})
		]
	});
}
//#endregion
//#region studio-ui/src/mcp-widget.tsx
function f(e) {
	let t = (0, o.createRoot)(e), n = (0, s.createRef)();
	return t.render(/* @__PURE__ */ (0, u.jsx)(d, { apiRef: n })), {
		prepareRequest: () => n.current?.prepareRequest() || Promise.resolve(!1),
		dispose: () => t.unmount()
	};
}
//#endregion
export { f as mountMcpWidget };
