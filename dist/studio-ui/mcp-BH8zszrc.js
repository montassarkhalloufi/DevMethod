import { r as e, t } from "./jsx-runtime-Bz8zB3tG.js";
import { c as n, n as r, o as i, s as a, t as o } from "./useMcpSelection-BrYUToXT.js";
//#region studio-ui/src/features/mcp/hooks/useMcpActions.ts
var s = e();
function c(e, t) {
	return !e || e.status === "pending" ? t : t.status === "pending" || e.status !== "executing" && t.status === "executing" ? e : t;
}
function l(e, t) {
	let [n, r] = (0, s.useState)([]), [a, o] = (0, s.useState)(""), [l, u] = (0, s.useState)(null), [d, f] = (0, s.useState)(0), p = (0, s.useRef)(null);
	(0, s.useEffect)(() => {
		let n = new AbortController(), a;
		async function s() {
			try {
				let t = await i("actions?jobId=" + encodeURIComponent(e), n.signal);
				n.signal.aborted || (r((e) => t.actions.map((t) => c(e.find((e) => e.requestId === t.requestId), t))), o(""));
			} catch (e) {
				n.signal.aborted || o(e instanceof Error ? e.message : "Actions indisponibles.");
			} finally {
				!n.signal.aborted && t && (a = setTimeout(() => void s(), 2e3));
			}
		}
		return s(), () => {
			n.abort(), clearTimeout(a), p.current?.abort();
		};
	}, [
		e,
		t,
		d
	]);
	async function m(e, t) {
		if (p.current) return;
		let n = new AbortController();
		p.current = n, u(e);
		try {
			let a = await i("actions/decide", n.signal, {
				requestId: e,
				decision: t
			});
			n.signal.aborted || (r((e) => e.map((e) => e.requestId === a.requestId ? c(e, a) : e)), o(""));
		} catch (e) {
			n.signal.aborted || o(e instanceof Error ? e.message : "Décision non enregistrée.");
		} finally {
			p.current === n && (p.current = null, u(null));
		}
	}
	return {
		actions: n.filter((t) => t.jobId === e),
		error: a,
		busy: l,
		decide: m,
		refresh: () => f((e) => e + 1)
	};
}
//#endregion
//#region studio-ui/src/features/mcp/components/McpActionCards.tsx
var u = t(), d = {
	pending: "Votre accord est nécessaire",
	executing: "Action en cours",
	completed: "Résultat reçu",
	denied: "Action refusée",
	expired: "Demande expirée",
	cancelled: "Demande annulée",
	unknown: "Résultat inconnu"
};
function f({ jobId: e, running: t }) {
	let n = l(e, t);
	return !n.actions.length && !n.error ? null : /* @__PURE__ */ (0, u.jsxs)("section", {
		className: "mcp-action-cards",
		"aria-label": "Actions des connecteurs",
		children: [n.error ? /* @__PURE__ */ (0, u.jsxs)("div", {
			role: "alert",
			children: [/* @__PURE__ */ (0, u.jsx)("p", { children: n.error }), /* @__PURE__ */ (0, u.jsx)("button", {
				type: "button",
				onClick: n.refresh,
				children: "Réessayer l’actualisation"
			})]
		}) : null, n.actions.map((e) => /* @__PURE__ */ (0, u.jsxs)("article", {
			className: "mcp-action-card",
			children: [
				/* @__PURE__ */ (0, u.jsxs)("header", { children: [/* @__PURE__ */ (0, u.jsx)("strong", { children: e.connectionName }), /* @__PURE__ */ (0, u.jsx)("span", {
					role: "status",
					children: d[e.status]
				})] }),
				/* @__PURE__ */ (0, u.jsx)("h3", { children: e.toolName }),
				e.connectionUrl ? /* @__PURE__ */ (0, u.jsxs)("p", {
					className: "mcp-note",
					children: ["Destination : ", e.connectionUrl]
				}) : null,
				/* @__PURE__ */ (0, u.jsxs)("details", {
					open: e.status === "pending",
					children: [/* @__PURE__ */ (0, u.jsx)("summary", { children: "Paramètres exacts de l’action" }), /* @__PURE__ */ (0, u.jsx)("pre", { children: JSON.stringify(e.arguments, null, 2) })]
				}),
				e.error ? /* @__PURE__ */ (0, u.jsx)("p", {
					role: "alert",
					children: e.error.message
				}) : null,
				e.status === "pending" ? /* @__PURE__ */ (0, u.jsxs)(u.Fragment, { children: [/* @__PURE__ */ (0, u.jsxs)("p", {
					className: "mcp-note",
					children: [
						"Accord unique pour ces paramètres, valable jusqu’à",
						" ",
						new Date(e.expiresAt).toLocaleTimeString("fr-FR"),
						". Les règles durables se modifient dans la fiche du connecteur."
					]
				}), /* @__PURE__ */ (0, u.jsxs)("div", {
					className: "mcp-form-actions",
					children: [/* @__PURE__ */ (0, u.jsx)("button", {
						type: "button",
						disabled: !!n.busy || !t,
						onClick: () => void n.decide(e.requestId, "deny"),
						children: "Refuser"
					}), /* @__PURE__ */ (0, u.jsx)("button", {
						className: "primary",
						type: "button",
						disabled: !!n.busy || !t,
						onClick: () => void n.decide(e.requestId, "allow"),
						children: "Autoriser cette action"
					})]
				})] }) : null,
				e.status === "unknown" ? /* @__PURE__ */ (0, u.jsx)("p", { children: "L’opération a pu avoir lieu chez le fournisseur. Vérifiez son résultat avant de demander une nouvelle action." }) : null,
				e.status === "completed" ? /* @__PURE__ */ (0, u.jsxs)("details", { children: [/* @__PURE__ */ (0, u.jsx)("summary", { children: e.isError ? "Le fournisseur a signalé une erreur" : "Voir le résultat" }), /* @__PURE__ */ (0, u.jsx)("pre", { children: JSON.stringify(e.result, null, 2) })] }) : null
			]
		}, e.requestId))]
	});
}
//#endregion
//#region studio-ui/src/features/mcp/components/GuidedConnection.tsx
var p = {
	notion: "Notion",
	linear: "Linear",
	github: "GitHub"
};
function m({ preparation: e }) {
	let t = o(), i = n((e) => void t.select(e, !0), (e) => void t.select(e, !1));
	if (!e.nativeConnection) return null;
	let s = r(e), c = i.connections.find((e) => e.provider === s.provider && e.url === s.url), l = c?.status === "connected", d = !!i.active || t.saving;
	return /* @__PURE__ */ (0, u.jsxs)("div", {
		className: "connector-guide-connect",
		children: [
			l ? /* @__PURE__ */ (0, u.jsxs)(u.Fragment, { children: [/* @__PURE__ */ (0, u.jsxs)("p", {
				role: "status",
				children: [
					"Connecté · ",
					c.name,
					" · ",
					c.tools.length,
					" outils découverts"
				]
			}), t.connectionIds.includes(c.id) ? /* @__PURE__ */ (0, u.jsx)("p", { children: "Utilisé dans ce projet. Disponible pour la prochaine mission." }) : /* @__PURE__ */ (0, u.jsx)("button", {
				type: "button",
				disabled: d,
				onClick: () => void t.select(c.id, !0),
				children: "Utiliser dans ce projet"
			})] }) : s.auth === "bearer" ? /* @__PURE__ */ (0, u.jsx)(a, {
				input: s,
				controller: i
			}) : /* @__PURE__ */ (0, u.jsxs)("button", {
				type: "button",
				disabled: d,
				onClick: () => void i.connect(s),
				children: [
					c ? "Reconnecter" : "Connecter",
					" ",
					p[s.provider]
				]
			}),
			i.active ? /* @__PURE__ */ (0, u.jsx)("p", {
				role: "status",
				children: i.active.authorizing ? "Terminez l’autorisation dans la fenêtre du fournisseur." : "Vérification de la connexion…"
			}) : null,
			i.error || t.error ? /* @__PURE__ */ (0, u.jsx)("p", {
				role: "alert",
				children: i.error || t.error
			}) : null
		]
	});
}
//#endregion
export { f as n, m as t };
