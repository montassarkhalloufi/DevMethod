import { i as e, r as t, t as n } from "./jsx-runtime-DZd2gj5L.js";
import { s as r } from "./i18n-CRhBcIYq.js";
import { a as i, c as a, d as o, f as s, i as c, l, r as u, s as d, t as f, u as p } from "./ConnectorGuide-IMh4AumH.js";
//#region studio-ui/src/features/mcp/model/mcp.ts
var m = e();
function h(e, t = "en") {
	return ["linear", "github"].includes(e.provider) ? r("{name} · {access}", "{name} · {access}", {
		name: e.name,
		access: e.url.endsWith("/readonly") ? r("lecture seule", "read-only", void 0, t) : r("accès standard", "standard access", void 0, t)
	}, t) : e.name;
}
function g(e) {
	return {
		id: e.id,
		provider: e.provider,
		auth: e.auth,
		...["linear", "github"].includes(e.provider) ? { url: e.url } : {},
		...e.provider === "custom" ? {
			name: e.name,
			url: e.url
		} : {}
	};
}
function _(e) {
	let t = e;
	if (!t || t.version !== void 0 && (!Number.isSafeInteger(t.version) || t.version < 1) || ![
		t.id,
		t.name,
		t.url
	].every((e) => typeof e == "string" && e.length) || ![
		"notion",
		"linear",
		"sentry",
		"github",
		"custom"
	].includes(t.provider) || ![
		"oauth",
		"bearer",
		"none"
	].includes(t.auth) || ![
		"disconnected",
		"connecting",
		"authorization-required",
		"connected",
		"error"
	].includes(t.status) || !Array.isArray(t.tools) || t.tools.some((e) => !e || typeof e.name != "string")) throw Error("La connexion MCP reçue est illisible. Actualisez son état.");
	return {
		id: t.id,
		version: t.version ?? 1,
		name: t.name,
		provider: t.provider,
		url: t.url,
		auth: t.auth,
		status: t.status,
		tools: t.tools.map((e) => ({
			name: e.name,
			...typeof e.title == "string" ? { title: e.title } : {},
			...typeof e.description == "string" ? { description: e.description } : {}
		})),
		...typeof t.error?.message == "string" ? { error: {
			message: t.error.message,
			...typeof t.error.code == "string" ? { code: t.error.code } : {}
		} } : {}
	};
}
function v(e) {
	let t = e;
	if (!t || !Array.isArray(t.connections) || !Array.isArray(t.presets)) throw Error("La liste des serveurs MCP est indisponible.");
	return {
		presets: t.presets.filter((e) => e && [
			"notion",
			"linear",
			"sentry",
			"github"
		].includes(e.id) && e.auth === (e.id === "github" ? "bearer" : "oauth") && typeof e.name == "string" && typeof e.url == "string"),
		connections: t.connections.map(_),
		supported: t.supported !== !1
	};
}
function y(e) {
	if (typeof e != "string") throw Error("Le serveur n’a pas renvoyé d’adresse d’autorisation.");
	let t = new URL(e), n = [
		"127.0.0.1",
		"localhost",
		"[::1]"
	].includes(t.hostname);
	if (t.protocol !== "https:" && !(n && t.protocol === "http:") || t.username || t.password || e.includes("\\")) throw Error("L’adresse d’autorisation renvoyée est invalide.");
	return t.href;
}
var b = {
	disconnected: "Déconnecté",
	connecting: "Connexion en cours",
	"authorization-required": "Autorisation attendue",
	connected: "Connecté",
	error: "Connexion à rétablir"
};
function x(e) {
	let t = new FormData(e), n = String(t.get("mcp-provider") || "custom");
	if (n !== "custom") return { provider: n };
	let r = String(t.get("mcp-name") || "").trim(), i = String(t.get("mcp-url") || "").trim(), a = String(t.get("mcp-auth") || "oauth");
	if (!r || !i) throw Error("Indiquez un nom et l’adresse du serveur MCP.");
	let o = new URL(i);
	if (o.protocol !== "https:" && !(o.protocol === "http:" && ["127.0.0.1", "localhost"].includes(o.hostname)) || o.username || o.password || o.search || o.hash || i.includes("\\")) throw Error("Utilisez une adresse HTTPS (ou HTTP locale) sans identifiant, paramètres ni fragment.");
	let s = String(t.get("mcp-token") || "");
	if (a === "bearer" && !s.trim()) throw Error("Saisissez le jeton de connexion.");
	return {
		provider: n,
		name: r,
		url: i,
		auth: a,
		...a === "bearer" ? { bearerToken: s } : {}
	};
}
//#endregion
//#region studio-ui/src/features/mcp/model/change-events.ts
var S = (e) => `devmethod:mcp-${e}-changed`;
function C(e, t) {
	window.dispatchEvent(new CustomEvent(S(e), { detail: t }));
}
function w(e, t, n) {
	let r = (e) => {
		e.detail !== t && n();
	};
	return window.addEventListener(S(e), r), () => window.removeEventListener(S(e), r);
}
//#endregion
//#region studio-ui/src/features/mcp/hooks/useMcpConnections.ts
async function T(e, t, n) {
	let r = await fetch("/api/mcp" + e, {
		credentials: "same-origin",
		cache: "no-store",
		signal: AbortSignal.any([t, AbortSignal.timeout(3e4)]),
		...n ? {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(n)
		} : {}
	}), i = await r.json();
	if (!r.ok) throw Error(i.error?.message || i.error || "La connexion MCP n’a pas abouti.");
	return i;
}
function E(e) {
	return new Promise((t) => {
		let n = () => {
			window.clearTimeout(r), e.removeEventListener("abort", n), t();
		}, r = window.setTimeout(n, 2e3);
		e.addEventListener("abort", n, { once: !0 }), e.aborted && n();
	});
}
function D(e) {
	let t = window.open("about:blank", "_blank", "popup,width=600,height=760");
	if (!t) throw Error("Autorisez les fenêtres de connexion pour ce site, puis réessayez.");
	return t.opener = null, t.document.title = s("Connexion du serveur MCP", e), t.document.body.textContent = s("Préparation de votre connexion sécurisée…", e), t;
}
function O(e, t) {
	let n = y(t);
	if (!e || e.closed) throw Error("La fenêtre de connexion a été fermée. Reconnectez le serveur pour reprendre.");
	e.location.assign(n);
}
function k(e, n) {
	let { locale: r } = t(), [i, a] = (0, m.useState)({
		presets: [],
		connections: [],
		supported: !0
	}), [o, s] = (0, m.useState)(!0), [c, l] = (0, m.useState)(""), [u, d] = (0, m.useState)(null), f = (0, m.useRef)(null), p = (0, m.useRef)(null), h = (0, m.useRef)(null), g = (0, m.useRef)(Symbol()), y = (0, m.useRef)(!1), b = (0, m.useRef)(e), x = (0, m.useRef)(n);
	(0, m.useEffect)(() => {
		b.current = e, x.current = n;
	}, [e, n]);
	let S = (0, m.useCallback)(async (e = !1) => {
		if (p.current) {
			y.current = !0;
			return;
		}
		y.current = !1, f.current?.abort();
		let t = new AbortController();
		f.current = t, s(!0);
		try {
			let n = v(await T("", t.signal));
			t.signal.aborted || (a(n), e || l(""));
		} catch (e) {
			t.signal.aborted || l(e instanceof Error ? e.message : "État MCP indisponible.");
		} finally {
			t.signal.aborted || s(!1);
		}
	}, []);
	(0, m.useEffect)(() => {
		let e = w("connections", g.current, () => void S(!0));
		return S(), () => {
			e(), f.current?.abort(), p.current?.abort(), h.current?.close();
		};
	}, [S]);
	function k(e) {
		p.current === e && (p.current = null, d(null), y.current && !e.signal.aborted && S(!0));
	}
	function A(e) {
		f.current?.abort(), s(!1), a((t) => ({
			...t,
			connections: [...t.connections.filter((t) => t.id !== e.id), e]
		})), C("connections", g.current);
	}
	async function j(e, t) {
		let n = Date.now() + 6e5;
		for (; !t.signal.aborted && Date.now() < n;) {
			if (await E(t.signal), t.signal.aborted) return;
			let n = v(await T("", t.signal));
			if (t.signal.aborted) return;
			a(n);
			let r = n.connections.find((t) => t.id === e);
			if (r?.status === "connected") {
				h.current?.close(), b.current(e), C("connections", g.current);
				return;
			}
			if (!r || ["error", "disconnected"].includes(r.status)) throw Error(r?.error?.message || "La connexion a été interrompue. Réessayez.");
		}
		if (!t.signal.aborted) throw Error("Le délai d’autorisation est écoulé. Relancez la connexion.");
	}
	async function M(e) {
		if (p.current) return;
		let t = new AbortController();
		p.current = t, f.current?.abort(), s(!1), l(""), d({
			id: e.id || null,
			authorizing: !1
		});
		try {
			(e.auth || "oauth") === "oauth" && (h.current = D(r));
			let n = await T("/connect", t.signal, e);
			if (t.signal.aborted) return;
			let i = _(n.connection);
			if (A(i), i.status === "connected") {
				h.current?.close(), b.current(i.id);
				return;
			}
			if (n.authorizationUrl) O(h.current, n.authorizationUrl), d({
				id: i.id,
				authorizing: !0
			}), await j(i.id, t);
			else if (i.status === "connecting") d({
				id: i.id,
				authorizing: !1
			}), await j(i.id, t);
			else throw Error(i.error?.message || "L’autorisation est nécessaire. Reconnectez le serveur.");
		} catch (e) {
			h.current?.close(), t.signal.aborted || l(e instanceof Error ? e.message : "Connexion MCP interrompue.");
		} finally {
			k(t);
		}
	}
	async function N(e, t) {
		if (p.current && (u?.id !== e || t !== "disconnect")) return;
		p.current?.abort(), f.current?.abort(), s(!1), h.current?.close();
		let n = new AbortController();
		p.current = n, d({
			id: e,
			authorizing: !1
		}), l("");
		try {
			let r = await T("/" + t, n.signal, { id: e });
			if (n.signal.aborted) return;
			let i = _(r.connection);
			A(i), t === "disconnect" && x.current(e), r.authorizationUrl && l("Une nouvelle autorisation est nécessaire. Cliquez sur Reconnecter."), i.status === "error" && l(i.error?.message || "La connexion doit être rétablie.");
		} catch (e) {
			n.signal.aborted || l(e instanceof Error ? e.message : "Mise à jour MCP impossible.");
		} finally {
			k(n);
		}
	}
	return {
		...i,
		loading: o,
		error: c,
		active: u,
		refresh: () => {
			S();
		},
		connect: M,
		change: N
	};
}
//#endregion
//#region studio-ui/src/features/mcp/components/McpCredentialForm.tsx
var A = n();
function j({ input: e, controller: n, disabled: r = !1 }) {
	let { locale: i } = t(), a = (0, m.useRef)(null);
	return /* @__PURE__ */ (0, A.jsxs)("form", {
		className: "mcp-credential-form",
		onSubmit: (t) => {
			if (t.preventDefault(), !a.current?.value || n.active || r) return;
			let i = a.current.value;
			a.current.value = "", n.connect({
				...e,
				auth: "bearer",
				bearerToken: i
			});
		},
		children: [
			/* @__PURE__ */ (0, A.jsxs)("label", { children: [s("Jeton personnel GitHub ciblé", i), /* @__PURE__ */ (0, A.jsx)("input", {
				ref: a,
				type: "password",
				name: "github-pat",
				autoComplete: "off",
				spellCheck: !1,
				required: !0,
				maxLength: 8192,
				disabled: r || !!n.active
			})] }),
			/* @__PURE__ */ (0, A.jsx)("p", {
				className: "mcp-note",
				children: s("Limitez le jeton aux dépôts nécessaires dans GitHub. Il reste dans le stockage privé local, hors de la demande et des exports. Le questionnaire ne modifie pas ses droits.", i)
			}),
			/* @__PURE__ */ (0, A.jsx)("a", {
				href: "https://github.com/settings/personal-access-tokens/new",
				target: "_blank",
				rel: "noopener noreferrer",
				children: s("Créer un jeton ciblé sur GitHub ↗", i)
			}),
			/* @__PURE__ */ (0, A.jsx)("button", {
				type: "submit",
				className: "primary",
				disabled: r || !!n.active,
				children: s("Connecter GitHub", i)
			}),
			n.error ? /* @__PURE__ */ (0, A.jsxs)("p", {
				role: "alert",
				children: [
					s(n.error, i),
					" ",
					s("Vérifiez l’expiration du jeton, ses permissions et les restrictions de votre organisation, puis saisissez-le à nouveau.", i)
				]
			}) : null
		]
	});
}
//#endregion
//#region studio-ui/src/features/mcp/components/CustomConnection.tsx
function M({ controller: e, disabled: n, connection: r, onDismiss: i }) {
	let { locale: a } = t(), [c, l] = (0, m.useState)(!!r), [u, d] = (0, m.useState)(r?.auth || "oauth"), [f, p] = (0, m.useState)(""), h = (0, m.useRef)(null);
	return /* @__PURE__ */ (0, A.jsxs)("div", {
		className: "mcp-custom-connection",
		children: [r ? null : /* @__PURE__ */ (0, A.jsx)("button", {
			type: "button",
			className: "mcp-add-custom",
			disabled: n,
			"aria-expanded": c,
			onClick: () => l(!c),
			children: s("+ Ajouter un serveur personnalisé", a)
		}), c ? /* @__PURE__ */ (0, A.jsxs)("form", {
			ref: h,
			onSubmit: (t) => {
				if (t.preventDefault(), !(n || e.active)) try {
					let n = x(t.currentTarget);
					p(""), e.connect({
						...n,
						...r ? { id: r.id } : {}
					});
					let i = t.currentTarget.elements.namedItem("mcp-token");
					i instanceof HTMLInputElement && (i.value = "");
				} catch (e) {
					p(e instanceof Error ? e.message : "Vérifiez les informations du serveur.");
				}
			},
			children: [
				/* @__PURE__ */ (0, A.jsx)("input", {
					type: "hidden",
					name: "mcp-provider",
					value: "custom"
				}),
				/* @__PURE__ */ (0, A.jsxs)("div", {
					className: "mcp-custom-fields",
					children: [/* @__PURE__ */ (0, A.jsxs)("label", { children: [s("Nom du serveur", a), /* @__PURE__ */ (0, A.jsx)("input", {
						name: "mcp-name",
						defaultValue: r?.name,
						maxLength: 100,
						autoComplete: "off",
						required: !0,
						disabled: n || !!e.active,
						placeholder: s("Mon espace documentaire", a)
					})] }), /* @__PURE__ */ (0, A.jsxs)("label", { children: [s("Adresse MCP", a), /* @__PURE__ */ (0, A.jsx)("input", {
						name: "mcp-url",
						defaultValue: r?.url,
						type: "url",
						maxLength: 2048,
						autoComplete: "off",
						required: !0,
						disabled: n || !!e.active,
						placeholder: o("https://serveur.exemple/mcp", "https://server.example/mcp", a)
					})] })]
				}),
				/* @__PURE__ */ (0, A.jsxs)("label", { children: [s("Authentification", a), /* @__PURE__ */ (0, A.jsxs)("select", {
					name: "mcp-auth",
					value: u,
					disabled: n || !!e.active,
					onChange: (e) => d(e.target.value),
					children: [
						/* @__PURE__ */ (0, A.jsx)("option", {
							value: "oauth",
							children: o("OAuth · autoriser dans le navigateur", "OAuth · authorize in browser", a)
						}),
						/* @__PURE__ */ (0, A.jsx)("option", {
							value: "bearer",
							children: s("Jeton Bearer", a)
						}),
						/* @__PURE__ */ (0, A.jsx)("option", {
							value: "none",
							children: s("Sans authentification", a)
						})
					]
				})] }),
				u === "bearer" ? /* @__PURE__ */ (0, A.jsxs)("label", { children: [
					s("Jeton de connexion", a),
					/* @__PURE__ */ (0, A.jsx)("input", {
						name: "mcp-token",
						type: "password",
						maxLength: 8192,
						autoComplete: "off",
						spellCheck: !1,
						required: !0,
						disabled: n || !!e.active
					}),
					/* @__PURE__ */ (0, A.jsx)("small", { children: s("Transmis au gestionnaire local. Il n’est jamais ajouté à votre demande.", a) })
				] }) : null,
				f ? /* @__PURE__ */ (0, A.jsx)("p", {
					role: "alert",
					className: "mcp-connection-error",
					children: s(f, a)
				}) : null,
				/* @__PURE__ */ (0, A.jsxs)("div", {
					className: "mcp-form-actions",
					children: [/* @__PURE__ */ (0, A.jsx)("button", {
						type: "button",
						disabled: !!e.active,
						onClick: () => {
							l(!1), i?.();
						},
						children: s("Fermer les réglages", a)
					}), /* @__PURE__ */ (0, A.jsx)("button", {
						type: "submit",
						className: "primary",
						disabled: n || !!e.active,
						children: s("Connecter le serveur", a)
					})]
				})
			]
		}) : null]
	});
}
//#endregion
//#region studio-ui/src/features/mcp/model/permissions.ts
var N = {
	allow: "Autoriser",
	ask: "Demander",
	deny: "Interdire"
};
async function P(e, t, n) {
	let r = await fetch("/api/mcp/" + e, {
		credentials: "same-origin",
		cache: "no-store",
		signal: AbortSignal.any([t, AbortSignal.timeout(3e4)]),
		...n ? {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(n)
		} : {}
	}), i = await r.json();
	if (!r.ok) throw Error(typeof i.error == "string" ? i.error : "Action indisponible. Réessayez.");
	return i;
}
//#endregion
//#region studio-ui/src/features/mcp/hooks/useMcpPolicy.ts
function ee(e) {
	let [t, n] = (0, m.useState)(null), [r, i] = (0, m.useState)(""), [a, o] = (0, m.useState)(!1), [s, c] = (0, m.useState)(0), l = (0, m.useRef)(null);
	(0, m.useEffect)(() => {
		let t = new AbortController();
		return P("policy?connectionId=" + encodeURIComponent(e), t.signal).then((e) => {
			t.signal.aborted || (n((t) => t?.connectionId === e.connectionId && t.version > e.version ? t : e), i(""));
		}).catch((e) => {
			t.signal.aborted || i(e.message);
		}), () => {
			t.abort(), l.current?.abort();
		};
	}, [e, s]);
	async function u(r, a) {
		if (!t || t.connectionId !== e || l.current) return;
		let s = new AbortController();
		l.current = s, o(!0);
		try {
			let o = await P("policy", s.signal, {
				connectionId: e,
				version: t.version,
				updates: r.map((e) => ({
					toolName: e.name,
					inputSchemaFingerprint: e.inputSchemaFingerprint,
					permission: a
				}))
			});
			s.signal.aborted || (n((e) => e?.connectionId === o.connectionId && e.version > o.version ? e : o), i(""));
		} catch (e) {
			s.signal.aborted || i(e instanceof Error ? e.message : "Réglage non enregistré.");
		} finally {
			l.current === s && (l.current = null, o(!1));
		}
	}
	return {
		policy: t?.connectionId === e ? t : null,
		busy: a,
		error: r,
		change: u,
		refresh: () => c((e) => e + 1)
	};
}
//#endregion
//#region studio-ui/src/features/mcp/components/McpPermissions.tsx
function F({ connectionId: e }) {
	let { locale: n } = t(), r = ee(e), [i, a] = (0, m.useState)(""), c = r.policy, l = i.trim().toLocaleLowerCase(n), u = c?.tools.filter((e) => `${e.title || ""} ${e.name}`.toLocaleLowerCase(n).includes(l)) || [], d = u.every((e) => e.permission === u[0]?.permission) ? u[0]?.permission ?? "ask" : "mixed";
	return /* @__PURE__ */ (0, A.jsxs)("section", {
		className: "mcp-permissions",
		"aria-label": s("Permissions de l’assistant", n),
		children: [
			/* @__PURE__ */ (0, A.jsx)("h4", { children: s("Ce que l’assistant peut faire", n) }),
			/* @__PURE__ */ (0, A.jsx)("p", {
				className: "mcp-note",
				children: s("Ces règles s’appliquent aux appels du pont MCP DevMethod dans tous les projets utilisant cette connexion. Chaque nouvel outil demande votre accord.", n)
			}),
			r.error ? /* @__PURE__ */ (0, A.jsxs)("div", {
				role: "alert",
				children: [/* @__PURE__ */ (0, A.jsx)("p", { children: s(r.error, n) }), /* @__PURE__ */ (0, A.jsx)("button", {
					type: "button",
					disabled: r.busy,
					onClick: r.refresh,
					children: s("Relire les permissions", n)
				})]
			}) : null,
			c ? /* @__PURE__ */ (0, A.jsxs)(A.Fragment, { children: [
				/* @__PURE__ */ (0, A.jsxs)("label", {
					className: "mcp-permission-global",
					children: [l ? o("Outils affichés ({count})", "Visible tools ({count})", n, { count: u.length.toLocaleString(n) }) : s("Tous les outils de cette connexion", n), /* @__PURE__ */ (0, A.jsxs)("select", {
						value: d,
						disabled: r.busy || !u.length,
						onChange: (e) => void r.change(u, e.target.value),
						children: [/* @__PURE__ */ (0, A.jsx)("option", {
							value: "mixed",
							disabled: !0,
							children: s("Personnalisé", n)
						}), Object.entries(N).map(([e, t]) => /* @__PURE__ */ (0, A.jsx)("option", {
							value: e,
							children: s(t, n)
						}, e))]
					})]
				}),
				/* @__PURE__ */ (0, A.jsx)("p", {
					className: "mcp-note",
					children: s("Une restriction prend effet immédiatement. Un élargissement durable s’applique à la prochaine mission. « Autoriser » permet l’exécution sans accord ponctuel.", n)
				}),
				c.tools.length > 6 ? /* @__PURE__ */ (0, A.jsxs)("label", { children: [s("Rechercher un outil", n), /* @__PURE__ */ (0, A.jsx)("input", {
					type: "search",
					value: i,
					onChange: (e) => a(e.target.value)
				})] }) : null,
				/* @__PURE__ */ (0, A.jsx)("ul", {
					className: "mcp-permission-tools",
					children: u.map((e) => /* @__PURE__ */ (0, A.jsxs)("li", { children: [/* @__PURE__ */ (0, A.jsxs)("div", { children: [
						/* @__PURE__ */ (0, A.jsx)("strong", { children: e.title || e.name }),
						/* @__PURE__ */ (0, A.jsx)("small", { children: e.name }),
						e.description ? /* @__PURE__ */ (0, A.jsx)("p", { children: e.description }) : null
					] }), /* @__PURE__ */ (0, A.jsxs)("label", { children: [/* @__PURE__ */ (0, A.jsxs)("span", {
						className: "mcp-sr",
						children: [s("Permission pour", n), e.name]
					}), /* @__PURE__ */ (0, A.jsx)("select", {
						value: e.permission,
						disabled: r.busy,
						onChange: (t) => void r.change([e], t.target.value),
						children: Object.entries(N).map(([e, t]) => /* @__PURE__ */ (0, A.jsx)("option", {
							value: e,
							children: s(t, n)
						}, e))
					})] })] }, e.name))
				}),
				u.length ? null : /* @__PURE__ */ (0, A.jsx)("p", { children: s("Aucun outil à afficher.", n) }),
				r.busy ? /* @__PURE__ */ (0, A.jsx)("p", {
					role: "status",
					children: o("Enregistrement…", "Saving…", n)
				}) : null
			] }) : /* @__PURE__ */ (0, A.jsx)("p", {
				role: "status",
				children: s("Lecture des permissions…", n)
			})
		]
	});
}
//#endregion
//#region studio-ui/src/features/mcp/components/McpUsage.tsx
function I({ connectionId: e }) {
	let { locale: n } = t(), [r, i] = (0, m.useState)(null), [a, o] = (0, m.useState)(""), [c, l] = (0, m.useState)(0);
	return (0, m.useEffect)(() => {
		let t = new AbortController();
		return P("usage?connectionId=" + encodeURIComponent(e), t.signal).then((e) => {
			t.signal.aborted || (i(e), o(""));
		}).catch(() => {
			t.signal.aborted || o("Utilisation dans les projets indisponible.");
		}), () => t.abort();
	}, [e, c]), /* @__PURE__ */ (0, A.jsxs)("div", {
		className: "mcp-usage",
		children: [
			/* @__PURE__ */ (0, A.jsx)("h4", { children: s("Projets utilisant cette connexion", n) }),
			a ? /* @__PURE__ */ (0, A.jsxs)("p", {
				role: "alert",
				children: [
					s(a, n),
					" ",
					/* @__PURE__ */ (0, A.jsx)("button", {
						type: "button",
						onClick: () => l((e) => e + 1),
						children: s("Actualiser", n)
					})
				]
			}) : null,
			r ? r.supported ? /* @__PURE__ */ (0, A.jsxs)(A.Fragment, { children: [r.projects.length ? /* @__PURE__ */ (0, A.jsx)("ul", { children: r.projects.map((e) => /* @__PURE__ */ (0, A.jsx)("li", { children: e.name }, e.id)) }) : /* @__PURE__ */ (0, A.jsx)("p", {
				className: "mcp-note",
				children: s("Aucun projet enregistré ne sélectionne cette connexion.", n)
			}), r.unavailable ? /* @__PURE__ */ (0, A.jsxs)("p", {
				className: "mcp-note",
				children: [
					r.unavailable.toLocaleString(n),
					" ",
					s("projet(s) indisponible(s) : leur sélection reste inconnue.", n)
				]
			}) : null] }) : /* @__PURE__ */ (0, A.jsx)("p", {
				className: "mcp-note",
				children: s("La liste des projets est disponible depuis l’accueil.", n)
			}) : a ? null : /* @__PURE__ */ (0, A.jsx)("p", {
				role: "status",
				children: s("Lecture des projets…", n)
			})
		]
	});
}
//#endregion
//#region studio-ui/src/features/connector-interactions/model.ts
function L(e) {
	let t = e;
	if (!t || typeof t.id != "string" || typeof t.jobId != "string" || !Number.isSafeInteger(t.version) || t.version < 1 || ![
		0,
		1,
		2
	].includes(t.step) || ![
		"pending",
		"answered",
		"cancelled"
	].includes(t.status)) throw Error("Questionnaire illisible.");
	if (d({ guides: [t.definition] }), t.definition.optionId !== t.optionId) throw Error("Guide incohérent.");
	if (t.input !== null && a(t.input).optionId !== t.optionId) throw Error("Réponses incohérentes.");
	if (t.preparation !== null && l(t.preparation), !Array.isArray(t.prerequisites) || !t.prerequisites.every((e) => typeof e.label == "string" && e.status === "to-configure") || !t.accessObservation || !["verified", "not-observed"].includes(t.accessObservation.status)) throw Error("Prérequis illisibles.");
	return t;
}
function R(e, t) {
	let n = e;
	if (!n || !Array.isArray(n.interactions) || n.interactions.length > 200) throw Error("Questionnaires illisibles.");
	let r = n.interactions.map(L);
	if (r.some((e) => e.jobId !== t)) throw Error("Questionnaire d’une autre mission refusé.");
	return r;
}
//#endregion
//#region studio-ui/src/features/connector-interactions/useInteractions.ts
function z(e) {
	let [t, n] = (0, m.useState)([]), [r, i] = (0, m.useState)(""), [a, o] = (0, m.useState)(0), s = (0, m.useRef)(!1);
	return (0, m.useEffect)(() => {
		let t = new AbortController();
		async function r() {
			if (!s.current) {
				s.current = !0;
				try {
					let r = await fetch("/api/connectors/interactions?jobId=" + encodeURIComponent(e), {
						cache: "no-store",
						signal: AbortSignal.any([t.signal, AbortSignal.timeout(15e3)])
					}), a = R(await c(r), e);
					t.signal.aborted || (n((e) => a.map((t) => e.find((e) => e.id === t.id && e.version > t.version) ?? t)), i(""));
				} catch {
					t.signal.aborted || i("Impossible de relire les questionnaires. Les réponses affichées sont conservées.");
				} finally {
					s.current = !1;
				}
			}
		}
		r();
		let a = window.setInterval(() => void r(), 2e3);
		return () => {
			t.abort(), window.clearInterval(a);
		};
	}, [e, a]), {
		items: t,
		error: r,
		refresh: () => o((e) => e + 1),
		replace: (e) => n((t) => t.map((t) => t.id === e.id && t.version <= e.version ? e : t))
	};
}
//#endregion
//#region studio-ui/src/features/connector-interactions/useInteractionAnswer.ts
function B(e, t) {
	let [n, r] = (0, m.useState)({
		input: e.input,
		step: e.step
	}), [i, a] = (0, m.useState)(!1), [o, s] = (0, m.useState)(""), l = u(), d = (0, m.useRef)({
		record: e,
		local: n,
		pending: null,
		failed: !1,
		alive: !0,
		task: null
	});
	(0, m.useEffect)(() => {
		let e = d.current;
		return e.alive = !0, () => {
			e.alive = !1;
		};
	}, []), (0, m.useEffect)(() => {
		let t = d.current;
		e.version < t.record.version || (t.record = e, e.status === "answered" && (t.pending = null, t.failed = !1, s("")), !t.pending && !t.task && (t.local = {
			input: e.input,
			step: e.step
		}, r(t.local)));
	}, [e]);
	async function f(n, r) {
		let i = L((await c(await fetch("/api/connectors/interactions/" + n, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				interactionId: e.id,
				expectedVersion: d.current.record.version,
				...r
			}),
			signal: AbortSignal.timeout(15e3)
		}))).interaction);
		if (i.id !== e.id || i.jobId !== e.jobId) throw Error("Questionnaire différent.");
		return d.current.record = i, d.current.alive && t(i), i;
	}
	async function p() {
		let e = d.current;
		a(!0);
		try {
			for (; e.pending && e.record.status === "pending";) {
				let t = e.pending;
				await f("draft", t), e.pending === t && (e.pending = null);
			}
			return !e.pending;
		} catch {
			return e.failed = !0, e.alive && e.record.status === "pending" && s("Réponses non enregistrées ou questionnaire modifié. Votre saisie est conservée. Réessayez après avoir relu son état."), !1;
		} finally {
			e.task = null, e.alive && a(!1);
		}
	}
	function h() {
		let e = d.current;
		return e.task ? e.task : e.failed ? Promise.resolve(!1) : e.pending ? (e.task = p(), e.task) : Promise.resolve(!0);
	}
	function g(t) {
		if (e.status !== "pending") return;
		let n = d.current;
		n.local = t, n.pending = t, r(t), h();
	}
	async function _(e) {
		if (await h()) {
			a(!0);
			try {
				await f("answer", {
					input: e.input,
					step: 2
				});
			} catch {
				s("Réponse non transmise. Votre saisie est conservée ; relisez le questionnaire avant de réessayer.");
			} finally {
				d.current.alive && a(!1);
			}
		}
	}
	return {
		local: n,
		saving: i,
		error: o,
		validation: l,
		change: (e) => {
			l.reset(), g({
				...d.current.local,
				input: e
			});
		},
		setStep: (e) => g({
			...d.current.local,
			step: e
		}),
		answer: _,
		retry: () => {
			d.current.failed = !1, s(""), h();
		}
	};
}
//#endregion
//#region studio-ui/src/features/connector-interactions/ConnectorInteractions.tsx
function V({ item: e, renderConnection: n }) {
	let { locale: r } = t();
	return /* @__PURE__ */ (0, A.jsxs)(A.Fragment, { children: [
		e.accessObservation.status === "verified" ? /* @__PURE__ */ (0, A.jsxs)("p", { children: [
			s("Connexion MCP observée ·", r),
			e.accessObservation.tools.toLocaleString(r),
			" ",
			s("outils découverts. Les prérequis ci-dessous restent à vérifier.", r)
		] }) : null,
		e.prerequisites.length ? /* @__PURE__ */ (0, A.jsx)("ul", {
			"aria-label": s("Prérequis à configurer", r),
			children: e.prerequisites.map((e) => /* @__PURE__ */ (0, A.jsxs)("li", { children: [s("À configurer :", r), e.label] }, e.label))
		}) : null,
		e.preparation?.nativeConnection && n ? n(e.preparation) : null
	] });
}
var H = {
	answered: "Réponses transmises à l’agent",
	cancelled: "Questionnaire annulé : la mission ou son contexte a changé.",
	pending: "L’agent attend vos choix pour ce service."
};
function U({ item: e, onSaved: n, renderConnection: r }) {
	let { locale: a } = t(), c = B(e, n), l = i({ enabled: e.status === "pending" }), u = e.status === "pending" ? l.guides.find((t) => t.optionId === e.optionId) ?? e.definition : e.definition, d = e.requestedFlowId ? {
		...u,
		flows: u.flows.filter((t) => t.id === e.requestedFlowId)
	} : u, p = e.status !== "pending", m = /* @__PURE__ */ (0, A.jsx)(f, {
		definition: d,
		draft: c.local.input,
		preparation: e.preparation ?? c.validation.preparation,
		step: p ? e.step : c.local.step,
		onStepChange: c.setStep,
		preparing: c.validation.loading,
		disabled: p || c.saving,
		error: s(c.validation.error, a),
		onChange: c.change,
		onPrepare: c.validation.prepare,
		onApply: p ? void 0 : (e) => void c.answer(e),
		applyLabel: s("Transmettre mes réponses à l’agent", a)
	});
	return /* @__PURE__ */ (0, A.jsxs)("article", {
		"aria-label": o("Questionnaire {name}", "Questionnaire {name}", a, { name: e.definition.title }),
		className: "connector-interaction",
		children: [
			/* @__PURE__ */ (0, A.jsx)("p", {
				role: "status",
				children: s(H[e.status], a)
			}),
			e.status === "answered" ? /* @__PURE__ */ (0, A.jsxs)("details", {
				className: "connector-interaction-summary",
				open: !0,
				children: [/* @__PURE__ */ (0, A.jsxs)("summary", { children: [s("Revoir les réponses ·", a), e.definition.title] }), m]
			}) : m,
			c.saving ? /* @__PURE__ */ (0, A.jsx)("p", {
				role: "status",
				children: s("Enregistrement des réponses…", a)
			}) : null,
			c.error ? /* @__PURE__ */ (0, A.jsxs)("p", {
				role: "alert",
				children: [
					s(c.error, a),
					" ",
					p ? null : /* @__PURE__ */ (0, A.jsx)("button", {
						type: "button",
						onClick: c.retry,
						children: s("Réessayer l’enregistrement", a)
					})
				]
			}) : null,
			/* @__PURE__ */ (0, A.jsx)(V, {
				item: e,
				renderConnection: r
			})
		]
	});
}
function W({ jobId: e, renderConnection: n }) {
	let { locale: r } = t(), i = z(e);
	return /* @__PURE__ */ (0, A.jsxs)("section", {
		"aria-label": s("Questions de la mission", r),
		children: [i.error ? /* @__PURE__ */ (0, A.jsxs)("p", {
			role: "alert",
			children: [
				s(i.error, r),
				" ",
				/* @__PURE__ */ (0, A.jsx)("button", {
					type: "button",
					onClick: i.refresh,
					children: s("Relire les questionnaires", r)
				})
			]
		}) : null, i.items.map((e) => /* @__PURE__ */ (0, A.jsx)(U, {
			item: e,
			onSaved: i.replace,
			renderConnection: n
		}, e.id))]
	});
}
function G({ jobId: e, renderConnection: t }) {
	return e ? /* @__PURE__ */ (0, A.jsx)(W, {
		jobId: e,
		renderConnection: t
	}, e) : null;
}
//#endregion
//#region studio-ui/src/features/mcp/components/McpConnectionCard.tsx
var K = {
	github: "Consultez le code, les issues et les pull requests avec l’assistant.",
	notion: "Retrouvez le contexte et préparez la documentation de vos projets.",
	linear: "Suivez les issues et préparez les mises à jour de votre équipe."
}, q = {
	github: "https://github.com/github/github-mcp-server/blob/main/docs/remote-server.md",
	notion: "https://developers.notion.com/guides/mcp/build-mcp-client",
	linear: "https://linear.app/docs/mcp"
};
function J({ connection: e, controller: n, selected: r, disabled: i, onToggle: a }) {
	let { locale: c } = t(), [l, u] = (0, m.useState)(!1), [d, f] = (0, m.useState)(!1), _ = e.status === "connected";
	return /* @__PURE__ */ (0, A.jsxs)("li", {
		className: "mcp-connection-row",
		children: [
			/* @__PURE__ */ (0, A.jsxs)("div", {
				className: "mcp-connection-heading",
				children: [/* @__PURE__ */ (0, A.jsx)(p, {
					optionId: e.provider === "custom" ? "application-mcp" : e.provider,
					size: 32
				}), /* @__PURE__ */ (0, A.jsxs)("div", { children: [/* @__PURE__ */ (0, A.jsx)("strong", { children: h(e, c) }), /* @__PURE__ */ (0, A.jsxs)("span", {
					className: `mcp-status mcp-status-${e.status}`,
					children: [s(b[e.status], c), _ ? o(" · {count} outil(s)", " · {count} tool(s)", c, { count: e.tools.length.toLocaleString(c) }) : ""]
				})] })]
			}),
			/* @__PURE__ */ (0, A.jsx)("p", {
				className: "mcp-note",
				children: s(K[e.provider] || "Ajoutez les outils de ce service au contexte de l’assistant.", c)
			}),
			r ? /* @__PURE__ */ (0, A.jsx)("p", {
				className: "mcp-status mcp-status-connected",
				children: s("Utilisé dans ce projet", c)
			}) : null,
			e.error ? /* @__PURE__ */ (0, A.jsx)("p", {
				className: "mcp-connection-error",
				children: s(e.error.message, c)
			}) : null,
			/* @__PURE__ */ (0, A.jsx)("button", {
				type: "button",
				"aria-expanded": d,
				onClick: () => f(!d),
				children: s(d ? "Fermer la fiche" : "Compte et permissions", c)
			}),
			d ? /* @__PURE__ */ (0, A.jsx)(Y, {
				connection: e,
				selected: r
			}) : null,
			/* @__PURE__ */ (0, A.jsx)(X, {
				connection: e,
				controller: n,
				selected: r,
				disabled: i,
				onToggle: a,
				onCredentials: () => u(!0)
			}),
			l ? e.provider === "github" ? /* @__PURE__ */ (0, A.jsx)(j, {
				input: g(e),
				controller: n,
				disabled: i
			}) : /* @__PURE__ */ (0, A.jsx)(M, {
				controller: n,
				disabled: i,
				connection: e,
				onDismiss: () => u(!1)
			}) : null
		]
	});
}
function Y({ connection: e, selected: n }) {
	let { locale: r } = t(), i = e.status === "connected";
	return /* @__PURE__ */ (0, A.jsxs)("div", {
		className: "mcp-connection-detail",
		children: [
			/* @__PURE__ */ (0, A.jsx)("h4", { children: s("Connexion partagée", r) }),
			/* @__PURE__ */ (0, A.jsx)("p", { children: e.name }),
			/* @__PURE__ */ (0, A.jsx)("p", {
				className: "mcp-note",
				children: s("L’identité du compte n’est pas fournie par ce serveur. Les droits du compte sont ceux accordés chez le fournisseur.", r)
			}),
			/* @__PURE__ */ (0, A.jsxs)("details", { children: [
				/* @__PURE__ */ (0, A.jsx)("summary", { children: s("Configuration avancée", r) }),
				/* @__PURE__ */ (0, A.jsx)("p", {
					className: "mcp-server-url",
					children: e.url
				}),
				/* @__PURE__ */ (0, A.jsxs)("p", { children: [
					s("Authentification :", r),
					" ",
					e.auth === "bearer" ? s("Jeton personnel", r) : e.auth === "oauth" ? "OAuth" : s("Sans authentification", r)
				] })
			] }),
			q[e.provider] ? /* @__PURE__ */ (0, A.jsx)("a", {
				href: q[e.provider],
				target: "_blank",
				rel: "noopener noreferrer",
				children: s("Documentation du service ↗", r)
			}) : null,
			/* @__PURE__ */ (0, A.jsx)(I, { connectionId: e.id }, e.id + ":" + n),
			i ? /* @__PURE__ */ (0, A.jsx)(F, { connectionId: e.id }, e.id + ":" + e.version) : /* @__PURE__ */ (0, A.jsx)("p", {
				className: "mcp-note",
				children: s("Reconnectez ce service pour vérifier ses outils et régler leurs permissions.", r)
			})
		]
	});
}
function X({ connection: e, controller: n, selected: r, disabled: i, onToggle: a, onCredentials: o }) {
	let { locale: c } = t(), l = e.status === "connected", u = n.active;
	return /* @__PURE__ */ (0, A.jsxs)("div", {
		className: "mcp-connection-actions",
		children: [/* @__PURE__ */ (0, A.jsxs)("label", {
			className: "mcp-use-connection",
			children: [/* @__PURE__ */ (0, A.jsx)("input", {
				type: "checkbox",
				name: "mcp-connection",
				value: e.id,
				checked: r,
				disabled: i || !l && !r,
				onChange: a
			}), s("Utiliser pour ce projet", c)]
		}), /* @__PURE__ */ (0, A.jsxs)("div", { children: [l ? /* @__PURE__ */ (0, A.jsx)("button", {
			type: "button",
			disabled: i || !!u,
			onClick: () => void n.change(e.id, "refresh"),
			children: s("Actualiser les outils", c)
		}) : /* @__PURE__ */ (0, A.jsx)("button", {
			type: "button",
			disabled: i || !!u,
			onClick: () => e.auth === "bearer" ? o() : void n.connect(g(e)),
			children: s("Reconnecter", c)
		}), e.status === "disconnected" ? null : /* @__PURE__ */ (0, A.jsx)("button", {
			type: "button",
			disabled: i || !!(u && u.id !== e.id),
			onClick: () => void n.change(e.id, "disconnect"),
			children: u?.id === e.id ? s("Annuler la connexion", c) : s("Déconnecter", c)
		})] })]
	});
}
//#endregion
//#region studio-ui/src/features/mcp/components/McpConnectionsPanel.tsx
function Z({ controller: e, selectedIds: n, onToggle: r, onConfigureGuide: i, disabled: a = !1 }) {
	let { locale: o } = t(), [c, l] = (0, m.useState)(""), [u, d] = (0, m.useState)(!1), f = e.connections.filter((e) => `${e.name} ${e.url}`.toLocaleLowerCase(o).includes(c.trim().toLocaleLowerCase(o)));
	return /* @__PURE__ */ (0, A.jsxs)("section", {
		className: "mcp-connections-panel",
		"aria-label": s("Serveurs MCP de l’espace", o),
		children: [
			/* @__PURE__ */ (0, A.jsxs)("div", {
				className: "mcp-panel-heading",
				children: [/* @__PURE__ */ (0, A.jsxs)("div", { children: [/* @__PURE__ */ (0, A.jsx)("h3", { children: s("Serveurs MCP de l’espace", o) }), /* @__PURE__ */ (0, A.jsx)("p", { children: s("Connectez vos sources et outils une fois, puis choisissez ceux à utiliser dans chaque projet.", o) })] }), /* @__PURE__ */ (0, A.jsx)("button", {
					type: "button",
					disabled: e.loading || !!e.active,
					onClick: e.refresh,
					children: s("Actualiser les connexions", o)
				})]
			}),
			e.loading ? /* @__PURE__ */ (0, A.jsx)("p", {
				role: "status",
				className: "mcp-note",
				children: s("Lecture des connexions…", o)
			}) : null,
			e.error ? /* @__PURE__ */ (0, A.jsx)("p", {
				role: "alert",
				className: "mcp-connection-error",
				children: s(e.error, o)
			}) : null,
			e.active ? /* @__PURE__ */ (0, A.jsx)("p", {
				role: "status",
				className: "mcp-active-status",
				children: e.active.authorizing ? s("Autorisez l’accès dans la fenêtre ouverte. Cet écran se mettra à jour après confirmation.", o) : s("Vérification de la connexion et découverte des outils…", o)
			}) : null,
			e.supported ? null : /* @__PURE__ */ (0, A.jsx)("p", {
				className: "mcp-note",
				children: s("Ouvrez ce projet depuis l’accueil Studio pour accéder aux connexions de l’espace.", o)
			}),
			/* @__PURE__ */ (0, A.jsxs)("div", {
				className: "mcp-connected-heading",
				children: [/* @__PURE__ */ (0, A.jsxs)("h4", { children: [s("Connexions de l’espace", o), /* @__PURE__ */ (0, A.jsx)("span", { children: e.connections.length.toLocaleString(o) })] }), e.connections.length > 3 ? /* @__PURE__ */ (0, A.jsxs)("label", { children: [/* @__PURE__ */ (0, A.jsx)("span", {
					className: "mcp-sr",
					children: s("Rechercher un serveur MCP", o)
				}), /* @__PURE__ */ (0, A.jsx)("input", {
					type: "search",
					value: c,
					onChange: (e) => l(e.target.value),
					placeholder: s("Rechercher une connexion…", o)
				})] }) : null]
			}),
			/* @__PURE__ */ (0, A.jsx)("ul", {
				className: "mcp-connection-list",
				children: f.map((t) => /* @__PURE__ */ (0, A.jsx)(J, {
					connection: t,
					controller: e,
					selected: n.includes(t.id),
					disabled: a,
					onToggle: () => r(t.id)
				}, t.id))
			}),
			!e.loading && !f.length ? /* @__PURE__ */ (0, A.jsx)("p", {
				className: "mcp-note",
				children: e.connections.length ? s("Aucune connexion ne correspond à cette recherche.", o) : s("Aucun serveur MCP connecté pour le moment.", o)
			}) : null,
			/* @__PURE__ */ (0, A.jsx)("h4", { children: s("Ajouter un serveur", o) }),
			/* @__PURE__ */ (0, A.jsx)("div", {
				className: "mcp-preset-grid",
				children: e.presets.map((t) => /* @__PURE__ */ (0, A.jsxs)("button", {
					type: "button",
					disabled: a || !e.supported || !!e.active,
					onClick: () => i && [
						"notion",
						"linear",
						"github"
					].includes(t.id) ? i(t.id === "github" ? "github-mcp" : t.id) : t.id === "github" ? d(!0) : void e.connect({ provider: t.id }),
					children: [/* @__PURE__ */ (0, A.jsx)(p, {
						optionId: t.id,
						size: 28
					}), /* @__PURE__ */ (0, A.jsxs)("span", { children: [t.name, /* @__PURE__ */ (0, A.jsx)("small", { children: i && [
						"notion",
						"linear",
						"github"
					].includes(t.id) ? s("Choisir l’usage et connecter", o) : t.id === "github" ? s("Connecter avec un jeton ciblé", o) : s("Connecter avec OAuth", o) })] })]
				}, t.id))
			}),
			u ? /* @__PURE__ */ (0, A.jsx)(j, {
				input: {
					provider: "github",
					auth: "bearer"
				},
				controller: e,
				disabled: a
			}) : null,
			/* @__PURE__ */ (0, A.jsx)(M, {
				controller: e,
				disabled: a || !e.supported
			}),
			/* @__PURE__ */ (0, A.jsx)("p", {
				className: "mcp-note",
				children: s("Les permissions contrôlent les appels du pont MCP DevMethod. Elles ne contrôlent pas les outils utilisés directement par l’agent hôte. Ces connexions servent au contexte et aux outils de l’agent, pas aux API intégrées dans votre application.", o)
			})
		]
	});
}
//#endregion
//#region studio-ui/src/features/mcp/components/McpPromptSelection.tsx
function Q({ connections: e, selectedIds: n, onToggle: r, onManage: i, disabled: a = !1 }) {
	let { locale: c } = t(), l = e.filter((e) => e.status === "connected" || n.includes(e.id));
	return /* @__PURE__ */ (0, A.jsxs)("div", {
		className: "mcp-prompt-selection",
		"aria-label": s("Serveurs MCP pour ce projet", c),
		children: [l.map((e) => /* @__PURE__ */ (0, A.jsxs)("button", {
			type: "button",
			className: `mcp-prompt-chip${e.status === "connected" ? "" : " mcp-prompt-chip-unavailable"}`,
			"aria-pressed": n.includes(e.id),
			"aria-label": o("Utiliser {name} pour ce projet", "Use {name} for this project", c, { name: h(e, c) }),
			disabled: a || e.status !== "connected" && !n.includes(e.id),
			onClick: () => r(e.id),
			title: `${h(e, c)} · ${e.status === "connected" ? o("{count} outils disponibles", "{count} tools available", c, { count: e.tools.length.toLocaleString(c) }) : s("À reconnecter", c)}`,
			children: [
				/* @__PURE__ */ (0, A.jsx)(p, {
					optionId: e.provider === "custom" ? "application-mcp" : e.provider,
					size: 18
				}),
				/* @__PURE__ */ (0, A.jsx)("span", { children: h(e, c) }),
				/* @__PURE__ */ (0, A.jsx)("small", { children: e.status === "connected" ? s("Connecté", c) : s("À reconnecter", c) })
			]
		}, e.id)), /* @__PURE__ */ (0, A.jsx)("button", {
			type: "button",
			className: "mcp-manage",
			disabled: a,
			onClick: (e) => i(e.currentTarget),
			children: l.length ? s("Gérer les MCP", c) : o("+ Connecter un MCP", "+ Connect MCP", c)
		})]
	});
}
//#endregion
//#region studio-ui/src/features/mcp/model/guided-mcp.ts
function te(e) {
	let t = e.nativeConnection;
	if (t?.providerId === "notion" && t.url === "https://mcp.notion.com/mcp") return { provider: "notion" };
	if (t?.providerId === "linear" && ["https://mcp.linear.app/mcp", "https://mcp.linear.app/mcp/readonly"].includes(t.url)) return {
		provider: "linear",
		url: t.url
	};
	if (t?.providerId === "github" && ["https://api.githubcopilot.com/mcp/readonly", "https://api.githubcopilot.com/mcp/"].includes(t.url)) return {
		provider: "github",
		url: t.url,
		auth: "bearer"
	};
	throw Error("Cette préparation ne propose pas de connexion MCP prise en charge.");
}
//#endregion
//#region studio-ui/src/features/mcp/hooks/useMcpSelection.ts
async function $(e, t) {
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
function ne() {
	let [e, t] = (0, m.useState)({
		supported: !1,
		connectionIds: []
	}), [n, r] = (0, m.useState)(!0), [i, a] = (0, m.useState)(!1), [o, s] = (0, m.useState)(""), c = (0, m.useRef)(null), l = (0, m.useRef)(null), u = (0, m.useRef)(null), d = (0, m.useRef)(""), f = (0, m.useRef)(!1), p = (0, m.useRef)(Symbol()), h = (0, m.useRef)(!1), g = (0, m.useCallback)((e = !1) => {
		if (l.current) {
			h.current = !0;
			return;
		}
		h.current = !1, c.current?.abort();
		let n = new AbortController();
		c.current = n, r(!0), (!e || !f.current) && (s(""), d.current = "", f.current = !1), u.current = $(n.signal).then((e) => {
			n.signal.aborted || t(e);
		}).catch((e) => {
			n.signal.aborted || (d.current = e instanceof Error ? e.message : "Sélection indisponible.", s(d.current));
		}).finally(() => {
			n.signal.aborted || r(!1);
		});
	}, []);
	(0, m.useEffect)(() => {
		let e = w("selection", p.current, () => g(!0));
		return g(), () => {
			e(), c.current?.abort(), l.current?.abort();
		};
	}, [g]);
	async function _(r, i) {
		if (n || l.current || !e.supported || e.connectionIds.includes(r) === i) return;
		let o = i ? [...e.connectionIds, r] : e.connectionIds.filter((e) => e !== r);
		if (o.length > 12) {
			s("Vous pouvez sélectionner au maximum 12 serveurs MCP.");
			return;
		}
		c.current?.abort();
		let u = new AbortController();
		l.current = u, a(!0), d.current = "", f.current = !1, s("");
		try {
			let e = await $(u.signal, o);
			u.signal.aborted || (t(e), C("selection", p.current));
		} catch (e) {
			u.signal.aborted || (f.current = !0, d.current = e instanceof Error ? e.message : "Sélection non enregistrée.", s(d.current));
		} finally {
			u.signal.aborted || (l.current = null, a(!1), h.current && g(!0));
		}
	}
	return {
		...e,
		loading: n,
		saving: i,
		error: o,
		select: (t, r) => {
			if (n || l.current || !e.supported || e.connectionIds.includes(t) === r) return u.current;
			let i = _(t, r);
			return u.current = i, i;
		},
		refresh: () => g(),
		prepareRequest: async () => {
			let e;
			do
				e = u.current, await e;
			while (u.current !== e);
			return !d.current;
		}
	};
}
//#endregion
export { G as a, k as c, Z as i, te as n, P as o, Q as r, j as s, ne as t };
