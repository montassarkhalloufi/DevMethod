import { i as e, r as t, t as n } from "./jsx-runtime-DZd2gj5L.js";
import { f as r } from "./ConnectorGuide-IMh4AumH.js";
import { c as i, n as a, o, s, t as c } from "./useMcpSelection-CKOOWESs.js";
//#region studio-ui/src/features/mcp/hooks/useMcpActions.ts
var l = e();
function u(e, t) {
	return !e || e.status === "pending" ? t : t.status === "pending" || e.status !== "executing" && t.status === "executing" ? e : t;
}
function d(e, t) {
	let [n, r] = (0, l.useState)([]), [i, a] = (0, l.useState)(""), [s, c] = (0, l.useState)(null), [d, f] = (0, l.useState)(0), p = (0, l.useRef)(null);
	(0, l.useEffect)(() => {
		let n = new AbortController(), i;
		async function s() {
			try {
				let t = await o("actions?jobId=" + encodeURIComponent(e), n.signal);
				n.signal.aborted || (r((e) => t.actions.map((t) => u(e.find((e) => e.requestId === t.requestId), t))), a(""));
			} catch (e) {
				n.signal.aborted || a(e instanceof Error ? e.message : "Actions indisponibles.");
			} finally {
				!n.signal.aborted && t && (i = setTimeout(() => void s(), 2e3));
			}
		}
		return s(), () => {
			n.abort(), clearTimeout(i), p.current?.abort();
		};
	}, [
		e,
		t,
		d
	]);
	async function m(e, t) {
		if (p.current) return;
		let n = new AbortController();
		p.current = n, c(e);
		try {
			let i = await o("actions/decide", n.signal, {
				requestId: e,
				decision: t
			});
			n.signal.aborted || (r((e) => e.map((e) => e.requestId === i.requestId ? u(e, i) : e)), a(""));
		} catch (e) {
			n.signal.aborted || a(e instanceof Error ? e.message : "Décision non enregistrée.");
		} finally {
			p.current === n && (p.current = null, c(null));
		}
	}
	return {
		actions: n.filter((t) => t.jobId === e),
		error: i,
		busy: s,
		decide: m,
		refresh: () => f((e) => e + 1)
	};
}
//#endregion
//#region studio-ui/src/features/mcp/components/McpActionCards.tsx
var f = n(), p = {
	pending: "Votre accord est nécessaire",
	executing: "Action en cours",
	completed: "Résultat reçu",
	denied: "Action refusée",
	expired: "Demande expirée",
	cancelled: "Demande annulée",
	unknown: "Résultat inconnu"
};
function m({ jobId: e, running: n }) {
	let { locale: i } = t(), a = d(e, n);
	return !a.actions.length && !a.error ? null : /* @__PURE__ */ (0, f.jsxs)("section", {
		className: "mcp-action-cards",
		"aria-label": r("Actions des connecteurs", i),
		children: [a.error ? /* @__PURE__ */ (0, f.jsxs)("div", {
			role: "alert",
			children: [/* @__PURE__ */ (0, f.jsx)("p", { children: r(a.error, i) }), /* @__PURE__ */ (0, f.jsx)("button", {
				type: "button",
				onClick: a.refresh,
				children: r("Réessayer l’actualisation", i)
			})]
		}) : null, a.actions.map((e) => /* @__PURE__ */ (0, f.jsxs)("article", {
			className: "mcp-action-card",
			children: [
				/* @__PURE__ */ (0, f.jsxs)("header", { children: [/* @__PURE__ */ (0, f.jsx)("strong", { children: e.connectionName }), /* @__PURE__ */ (0, f.jsx)("span", {
					role: "status",
					children: r(p[e.status], i)
				})] }),
				/* @__PURE__ */ (0, f.jsx)("h3", { children: e.toolName }),
				e.connectionUrl ? /* @__PURE__ */ (0, f.jsxs)("p", {
					className: "mcp-note",
					children: [r("Destination :", i), e.connectionUrl]
				}) : null,
				/* @__PURE__ */ (0, f.jsxs)("details", {
					open: e.status === "pending",
					children: [/* @__PURE__ */ (0, f.jsx)("summary", { children: r("Paramètres exacts de l’action", i) }), /* @__PURE__ */ (0, f.jsx)("pre", { children: JSON.stringify(e.arguments, null, 2) })]
				}),
				e.error ? /* @__PURE__ */ (0, f.jsx)("p", {
					role: "alert",
					children: r(e.error.message, i)
				}) : null,
				e.status === "pending" ? /* @__PURE__ */ (0, f.jsxs)(f.Fragment, { children: [/* @__PURE__ */ (0, f.jsxs)("p", {
					className: "mcp-note",
					children: [
						r("Accord unique pour ces paramètres, valable jusqu’à", i),
						" ",
						new Date(e.expiresAt).toLocaleTimeString(i === "fr" ? "fr-FR" : "en-US"),
						r(". Les règles durables se modifient dans la fiche du connecteur.", i)
					]
				}), /* @__PURE__ */ (0, f.jsxs)("div", {
					className: "mcp-form-actions",
					children: [/* @__PURE__ */ (0, f.jsx)("button", {
						type: "button",
						disabled: !!a.busy || !n,
						onClick: () => void a.decide(e.requestId, "deny"),
						children: r("Refuser", i)
					}), /* @__PURE__ */ (0, f.jsx)("button", {
						className: "primary",
						type: "button",
						disabled: !!a.busy || !n,
						onClick: () => void a.decide(e.requestId, "allow"),
						children: r("Autoriser cette action", i)
					})]
				})] }) : null,
				e.status === "unknown" ? /* @__PURE__ */ (0, f.jsx)("p", { children: r("L’opération a pu avoir lieu chez le fournisseur. Vérifiez son résultat avant de demander une nouvelle action.", i) }) : null,
				e.status === "completed" ? /* @__PURE__ */ (0, f.jsxs)("details", { children: [/* @__PURE__ */ (0, f.jsx)("summary", { children: e.isError ? r("Le fournisseur a signalé une erreur", i) : r("Voir le résultat", i) }), /* @__PURE__ */ (0, f.jsx)("pre", { children: JSON.stringify(e.result, null, 2) })] }) : null
			]
		}, e.requestId))]
	});
}
//#endregion
//#region studio-ui/src/features/mcp/components/GuidedConnection.tsx
var h = {
	notion: "Notion",
	linear: "Linear",
	github: "GitHub"
};
function g({ preparation: e }) {
	let { locale: n } = t(), o = c(), l = i((e) => void o.select(e, !0), (e) => void o.select(e, !1));
	if (!e.nativeConnection) return null;
	let u = a(e), d = l.connections.find((e) => e.provider === u.provider && e.url === u.url), p = d?.status === "connected", m = !!l.active || o.saving;
	return /* @__PURE__ */ (0, f.jsxs)("div", {
		className: "connector-guide-connect",
		children: [
			p ? /* @__PURE__ */ (0, f.jsxs)(f.Fragment, { children: [/* @__PURE__ */ (0, f.jsxs)("p", {
				role: "status",
				children: [
					r("Connecté ·", n),
					d.name,
					" · ",
					d.tools.length.toLocaleString(n),
					" ",
					r("outils découverts", n)
				]
			}), o.connectionIds.includes(d.id) ? /* @__PURE__ */ (0, f.jsx)("p", { children: r("Utilisé dans ce projet. Disponible pour la prochaine mission.", n) }) : /* @__PURE__ */ (0, f.jsx)("button", {
				type: "button",
				disabled: m,
				onClick: () => void o.select(d.id, !0),
				children: r("Utiliser dans ce projet", n)
			})] }) : u.auth === "bearer" ? /* @__PURE__ */ (0, f.jsx)(s, {
				input: u,
				controller: l
			}) : /* @__PURE__ */ (0, f.jsxs)("button", {
				type: "button",
				disabled: m,
				onClick: () => void l.connect(u),
				children: [
					r(d ? "Reconnecter" : "Connecter", n),
					" ",
					h[u.provider]
				]
			}),
			l.active ? /* @__PURE__ */ (0, f.jsx)("p", {
				role: "status",
				children: l.active.authorizing ? r("Terminez l’autorisation dans la fenêtre du fournisseur.", n) : r("Vérification de la connexion…", n)
			}) : null,
			l.error || o.error ? /* @__PURE__ */ (0, f.jsx)("p", {
				role: "alert",
				children: r(l.error || o.error, n)
			}) : null
		]
	});
}
//#endregion
export { m as n, g as t };
