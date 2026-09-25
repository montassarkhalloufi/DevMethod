import { i as e, t } from "./jsx-runtime-D7gWoUTT.js";
import { c as n, i as r, l as i, r as a, s as o, t as s, u as c } from "./ConnectorGuide-66T_yuwk.js";
//#region studio-ui/src/features/mcp/model/mcp.ts
var l = e();
function u(e) {
	return ["linear", "github"].includes(e.provider) ? `${e.name} · ${e.url.endsWith("/readonly") ? "lecture seule" : "accès standard"}` : e.name;
}
function d(e) {
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
function f(e) {
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
function p(e) {
	let t = e;
	if (!t || !Array.isArray(t.connections) || !Array.isArray(t.presets)) throw Error("La liste des serveurs MCP est indisponible.");
	return {
		presets: t.presets.filter((e) => e && [
			"notion",
			"linear",
			"sentry",
			"github"
		].includes(e.id) && e.auth === (e.id === "github" ? "bearer" : "oauth") && typeof e.name == "string" && typeof e.url == "string"),
		connections: t.connections.map(f),
		supported: t.supported !== !1
	};
}
function m(e) {
	if (typeof e != "string") throw Error("Le serveur n’a pas renvoyé d’adresse d’autorisation.");
	let t = new URL(e), n = [
		"127.0.0.1",
		"localhost",
		"[::1]"
	].includes(t.hostname);
	if (t.protocol !== "https:" && !(n && t.protocol === "http:") || t.username || t.password || e.includes("\\")) throw Error("L’adresse d’autorisation renvoyée est invalide.");
	return t.href;
}
var h = {
	disconnected: "Déconnecté",
	connecting: "Connexion en cours",
	"authorization-required": "Autorisation attendue",
	connected: "Connecté",
	error: "Connexion à rétablir"
};
function g(e) {
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
var _ = (e) => `devmethod:mcp-${e}-changed`;
function v(e, t) {
	window.dispatchEvent(new CustomEvent(_(e), { detail: t }));
}
function y(e, t, n) {
	let r = (e) => {
		e.detail !== t && n();
	};
	return window.addEventListener(_(e), r), () => window.removeEventListener(_(e), r);
}
//#endregion
//#region studio-ui/src/features/mcp/hooks/useMcpConnections.ts
async function b(e, t, n) {
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
function x(e) {
	return new Promise((t) => {
		let n = () => {
			window.clearTimeout(r), e.removeEventListener("abort", n), t();
		}, r = window.setTimeout(n, 2e3);
		e.addEventListener("abort", n, { once: !0 }), e.aborted && n();
	});
}
function S() {
	let e = window.open("about:blank", "_blank", "popup,width=600,height=760");
	if (!e) throw Error("Autorisez les fenêtres de connexion pour ce site, puis réessayez.");
	return e.opener = null, e.document.title = "Connexion du serveur MCP", e.document.body.textContent = "Préparation de votre connexion sécurisée…", e;
}
function C(e, t) {
	let n = m(t);
	if (!e || e.closed) throw Error("La fenêtre de connexion a été fermée. Reconnectez le serveur pour reprendre.");
	e.location.assign(n);
}
function w(e, t) {
	let [n, r] = (0, l.useState)({
		presets: [],
		connections: [],
		supported: !0
	}), [i, a] = (0, l.useState)(!0), [o, s] = (0, l.useState)(""), [c, u] = (0, l.useState)(null), d = (0, l.useRef)(null), m = (0, l.useRef)(null), h = (0, l.useRef)(null), g = (0, l.useRef)(Symbol()), _ = (0, l.useRef)(!1), w = (0, l.useRef)(e), T = (0, l.useRef)(t);
	(0, l.useEffect)(() => {
		w.current = e, T.current = t;
	}, [e, t]);
	let E = (0, l.useCallback)(async (e = !1) => {
		if (m.current) {
			_.current = !0;
			return;
		}
		_.current = !1, d.current?.abort();
		let t = new AbortController();
		d.current = t, a(!0);
		try {
			let n = p(await b("", t.signal));
			t.signal.aborted || (r(n), e || s(""));
		} catch (e) {
			t.signal.aborted || s(e instanceof Error ? e.message : "État MCP indisponible.");
		} finally {
			t.signal.aborted || a(!1);
		}
	}, []);
	(0, l.useEffect)(() => {
		let e = y("connections", g.current, () => void E(!0));
		return E(), () => {
			e(), d.current?.abort(), m.current?.abort(), h.current?.close();
		};
	}, [E]);
	function D(e) {
		m.current === e && (m.current = null, u(null), _.current && !e.signal.aborted && E(!0));
	}
	function O(e) {
		d.current?.abort(), a(!1), r((t) => ({
			...t,
			connections: [...t.connections.filter((t) => t.id !== e.id), e]
		})), v("connections", g.current);
	}
	async function k(e, t) {
		let n = Date.now() + 6e5;
		for (; !t.signal.aborted && Date.now() < n;) {
			if (await x(t.signal), t.signal.aborted) return;
			let n = p(await b("", t.signal));
			if (t.signal.aborted) return;
			r(n);
			let i = n.connections.find((t) => t.id === e);
			if (i?.status === "connected") {
				h.current?.close(), w.current(e), v("connections", g.current);
				return;
			}
			if (!i || ["error", "disconnected"].includes(i.status)) throw Error(i?.error?.message || "La connexion a été interrompue. Réessayez.");
		}
		if (!t.signal.aborted) throw Error("Le délai d’autorisation est écoulé. Relancez la connexion.");
	}
	async function A(e) {
		if (m.current) return;
		let t = new AbortController();
		m.current = t, d.current?.abort(), a(!1), s(""), u({
			id: e.id || null,
			authorizing: !1
		});
		try {
			(e.auth || "oauth") === "oauth" && (h.current = S());
			let n = await b("/connect", t.signal, e);
			if (t.signal.aborted) return;
			let r = f(n.connection);
			if (O(r), r.status === "connected") {
				h.current?.close(), w.current(r.id);
				return;
			}
			if (n.authorizationUrl) C(h.current, n.authorizationUrl), u({
				id: r.id,
				authorizing: !0
			}), await k(r.id, t);
			else if (r.status === "connecting") u({
				id: r.id,
				authorizing: !1
			}), await k(r.id, t);
			else throw Error(r.error?.message || "L’autorisation est nécessaire. Reconnectez le serveur.");
		} catch (e) {
			h.current?.close(), t.signal.aborted || s(e instanceof Error ? e.message : "Connexion MCP interrompue.");
		} finally {
			D(t);
		}
	}
	async function j(e, t) {
		if (m.current && (c?.id !== e || t !== "disconnect")) return;
		m.current?.abort(), d.current?.abort(), a(!1), h.current?.close();
		let n = new AbortController();
		m.current = n, u({
			id: e,
			authorizing: !1
		}), s("");
		try {
			let r = await b("/" + t, n.signal, { id: e });
			if (n.signal.aborted) return;
			let i = f(r.connection);
			O(i), t === "disconnect" && T.current(e), r.authorizationUrl && s("Une nouvelle autorisation est nécessaire. Cliquez sur Reconnecter."), i.status === "error" && s(i.error?.message || "La connexion doit être rétablie.");
		} catch (e) {
			n.signal.aborted || s(e instanceof Error ? e.message : "Mise à jour MCP impossible.");
		} finally {
			D(n);
		}
	}
	return {
		...n,
		loading: i,
		error: o,
		active: c,
		refresh: () => {
			E();
		},
		connect: A,
		change: j
	};
}
//#endregion
//#region studio-ui/src/features/mcp/components/McpCredentialForm.tsx
var T = t();
function E({ input: e, controller: t, disabled: n = !1 }) {
	let r = (0, l.useRef)(null);
	return /* @__PURE__ */ (0, T.jsxs)("form", {
		className: "mcp-credential-form",
		onSubmit: (i) => {
			if (i.preventDefault(), !r.current?.value || t.active || n) return;
			let a = r.current.value;
			r.current.value = "", t.connect({
				...e,
				auth: "bearer",
				bearerToken: a
			});
		},
		children: [
			/* @__PURE__ */ (0, T.jsxs)("label", { children: ["Jeton personnel GitHub ciblé", /* @__PURE__ */ (0, T.jsx)("input", {
				ref: r,
				type: "password",
				name: "github-pat",
				autoComplete: "off",
				spellCheck: !1,
				required: !0,
				maxLength: 8192,
				disabled: n || !!t.active
			})] }),
			/* @__PURE__ */ (0, T.jsx)("p", {
				className: "mcp-note",
				children: "Limitez le jeton aux dépôts nécessaires dans GitHub. Il reste dans le stockage privé local, hors de la demande et des exports. Le questionnaire ne modifie pas ses droits."
			}),
			/* @__PURE__ */ (0, T.jsx)("a", {
				href: "https://github.com/settings/personal-access-tokens/new",
				target: "_blank",
				rel: "noopener noreferrer",
				children: "Créer un jeton ciblé sur GitHub ↗"
			}),
			/* @__PURE__ */ (0, T.jsx)("button", {
				type: "submit",
				className: "primary",
				disabled: n || !!t.active,
				children: "Connecter GitHub"
			}),
			t.error ? /* @__PURE__ */ (0, T.jsxs)("p", {
				role: "alert",
				children: [t.error, " Vérifiez l’expiration du jeton, ses permissions et les restrictions de votre organisation, puis saisissez-le à nouveau."]
			}) : null
		]
	});
}
//#endregion
//#region studio-ui/src/features/mcp/components/CustomConnection.tsx
function D({ controller: e, disabled: t, connection: n, onDismiss: r }) {
	let [i, a] = (0, l.useState)(!!n), [o, s] = (0, l.useState)(n?.auth || "oauth"), [c, u] = (0, l.useState)(""), d = (0, l.useRef)(null);
	return /* @__PURE__ */ (0, T.jsxs)("div", {
		className: "mcp-custom-connection",
		children: [n ? null : /* @__PURE__ */ (0, T.jsx)("button", {
			type: "button",
			className: "mcp-add-custom",
			disabled: t,
			"aria-expanded": i,
			onClick: () => a(!i),
			children: "+ Ajouter un serveur personnalisé"
		}), i ? /* @__PURE__ */ (0, T.jsxs)("form", {
			ref: d,
			onSubmit: (r) => {
				if (r.preventDefault(), !(t || e.active)) try {
					let t = g(r.currentTarget);
					u(""), e.connect({
						...t,
						...n ? { id: n.id } : {}
					});
					let i = r.currentTarget.elements.namedItem("mcp-token");
					i instanceof HTMLInputElement && (i.value = "");
				} catch (e) {
					u(e instanceof Error ? e.message : "Vérifiez les informations du serveur.");
				}
			},
			children: [
				/* @__PURE__ */ (0, T.jsx)("input", {
					type: "hidden",
					name: "mcp-provider",
					value: "custom"
				}),
				/* @__PURE__ */ (0, T.jsxs)("div", {
					className: "mcp-custom-fields",
					children: [/* @__PURE__ */ (0, T.jsxs)("label", { children: ["Nom du serveur", /* @__PURE__ */ (0, T.jsx)("input", {
						name: "mcp-name",
						defaultValue: n?.name,
						maxLength: 100,
						autoComplete: "off",
						required: !0,
						disabled: t || !!e.active,
						placeholder: "Mon espace documentaire"
					})] }), /* @__PURE__ */ (0, T.jsxs)("label", { children: ["Adresse MCP", /* @__PURE__ */ (0, T.jsx)("input", {
						name: "mcp-url",
						defaultValue: n?.url,
						type: "url",
						maxLength: 2048,
						autoComplete: "off",
						required: !0,
						disabled: t || !!e.active,
						placeholder: "https://serveur.exemple/mcp"
					})] })]
				}),
				/* @__PURE__ */ (0, T.jsxs)("label", { children: ["Authentification", /* @__PURE__ */ (0, T.jsxs)("select", {
					name: "mcp-auth",
					value: o,
					disabled: t || !!e.active,
					onChange: (e) => s(e.target.value),
					children: [
						/* @__PURE__ */ (0, T.jsx)("option", {
							value: "oauth",
							children: "OAuth · autoriser dans le navigateur"
						}),
						/* @__PURE__ */ (0, T.jsx)("option", {
							value: "bearer",
							children: "Jeton Bearer"
						}),
						/* @__PURE__ */ (0, T.jsx)("option", {
							value: "none",
							children: "Sans authentification"
						})
					]
				})] }),
				o === "bearer" ? /* @__PURE__ */ (0, T.jsxs)("label", { children: [
					"Jeton de connexion",
					/* @__PURE__ */ (0, T.jsx)("input", {
						name: "mcp-token",
						type: "password",
						maxLength: 8192,
						autoComplete: "off",
						spellCheck: !1,
						required: !0,
						disabled: t || !!e.active
					}),
					/* @__PURE__ */ (0, T.jsx)("small", { children: "Transmis au gestionnaire local. Il n’est jamais ajouté à votre demande." })
				] }) : null,
				c ? /* @__PURE__ */ (0, T.jsx)("p", {
					role: "alert",
					className: "mcp-connection-error",
					children: c
				}) : null,
				/* @__PURE__ */ (0, T.jsxs)("div", {
					className: "mcp-form-actions",
					children: [/* @__PURE__ */ (0, T.jsx)("button", {
						type: "button",
						disabled: !!e.active,
						onClick: () => {
							a(!1), r?.();
						},
						children: "Fermer les réglages"
					}), /* @__PURE__ */ (0, T.jsx)("button", {
						type: "submit",
						className: "primary",
						disabled: t || !!e.active,
						children: "Connecter le serveur"
					})]
				})
			]
		}) : null]
	});
}
//#endregion
//#region studio-ui/src/features/mcp/model/permissions.ts
var O = {
	allow: "Autoriser",
	ask: "Demander",
	deny: "Interdire"
};
async function k(e, t, n) {
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
function A(e) {
	let [t, n] = (0, l.useState)(null), [r, i] = (0, l.useState)(""), [a, o] = (0, l.useState)(!1), [s, c] = (0, l.useState)(0), u = (0, l.useRef)(null);
	(0, l.useEffect)(() => {
		let t = new AbortController();
		return k("policy?connectionId=" + encodeURIComponent(e), t.signal).then((e) => {
			t.signal.aborted || (n((t) => t?.connectionId === e.connectionId && t.version > e.version ? t : e), i(""));
		}).catch((e) => {
			t.signal.aborted || i(e.message);
		}), () => {
			t.abort(), u.current?.abort();
		};
	}, [e, s]);
	async function d(r, a) {
		if (!t || t.connectionId !== e || u.current) return;
		let s = new AbortController();
		u.current = s, o(!0);
		try {
			let o = await k("policy", s.signal, {
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
			u.current === s && (u.current = null, o(!1));
		}
	}
	return {
		policy: t?.connectionId === e ? t : null,
		busy: a,
		error: r,
		change: d,
		refresh: () => c((e) => e + 1)
	};
}
//#endregion
//#region studio-ui/src/features/mcp/components/McpPermissions.tsx
function j({ connectionId: e }) {
	let t = A(e), [n, r] = (0, l.useState)(""), i = t.policy, a = n.trim().toLocaleLowerCase("fr"), o = i?.tools.filter((e) => `${e.title || ""} ${e.name}`.toLocaleLowerCase("fr").includes(a)) || [], s = o.every((e) => e.permission === o[0]?.permission) ? o[0]?.permission ?? "ask" : "mixed";
	return /* @__PURE__ */ (0, T.jsxs)("section", {
		className: "mcp-permissions",
		"aria-label": "Permissions de l’assistant",
		children: [
			/* @__PURE__ */ (0, T.jsx)("h4", { children: "Ce que l’assistant peut faire" }),
			/* @__PURE__ */ (0, T.jsx)("p", {
				className: "mcp-note",
				children: "Ces règles s’appliquent aux appels du pont MCP DevMethod dans tous les projets utilisant cette connexion. Chaque nouvel outil demande votre accord."
			}),
			t.error ? /* @__PURE__ */ (0, T.jsxs)("div", {
				role: "alert",
				children: [/* @__PURE__ */ (0, T.jsx)("p", { children: t.error }), /* @__PURE__ */ (0, T.jsx)("button", {
					type: "button",
					disabled: t.busy,
					onClick: t.refresh,
					children: "Relire les permissions"
				})]
			}) : null,
			i ? /* @__PURE__ */ (0, T.jsxs)(T.Fragment, { children: [
				/* @__PURE__ */ (0, T.jsxs)("label", {
					className: "mcp-permission-global",
					children: [a ? `Outils affichés (${o.length})` : "Tous les outils de cette connexion", /* @__PURE__ */ (0, T.jsxs)("select", {
						value: s,
						disabled: t.busy || !o.length,
						onChange: (e) => void t.change(o, e.target.value),
						children: [/* @__PURE__ */ (0, T.jsx)("option", {
							value: "mixed",
							disabled: !0,
							children: "Personnalisé"
						}), Object.entries(O).map(([e, t]) => /* @__PURE__ */ (0, T.jsx)("option", {
							value: e,
							children: t
						}, e))]
					})]
				}),
				/* @__PURE__ */ (0, T.jsx)("p", {
					className: "mcp-note",
					children: "Une restriction prend effet immédiatement. Un élargissement durable s’applique à la prochaine mission. « Autoriser » permet l’exécution sans accord ponctuel."
				}),
				i.tools.length > 6 ? /* @__PURE__ */ (0, T.jsxs)("label", { children: ["Rechercher un outil", /* @__PURE__ */ (0, T.jsx)("input", {
					type: "search",
					value: n,
					onChange: (e) => r(e.target.value)
				})] }) : null,
				/* @__PURE__ */ (0, T.jsx)("ul", {
					className: "mcp-permission-tools",
					children: o.map((e) => /* @__PURE__ */ (0, T.jsxs)("li", { children: [/* @__PURE__ */ (0, T.jsxs)("div", { children: [
						/* @__PURE__ */ (0, T.jsx)("strong", { children: e.title || e.name }),
						/* @__PURE__ */ (0, T.jsx)("small", { children: e.name }),
						e.description ? /* @__PURE__ */ (0, T.jsx)("p", { children: e.description }) : null
					] }), /* @__PURE__ */ (0, T.jsxs)("label", { children: [/* @__PURE__ */ (0, T.jsxs)("span", {
						className: "mcp-sr",
						children: ["Permission pour ", e.name]
					}), /* @__PURE__ */ (0, T.jsx)("select", {
						value: e.permission,
						disabled: t.busy,
						onChange: (n) => void t.change([e], n.target.value),
						children: Object.entries(O).map(([e, t]) => /* @__PURE__ */ (0, T.jsx)("option", {
							value: e,
							children: t
						}, e))
					})] })] }, e.name))
				}),
				o.length ? null : /* @__PURE__ */ (0, T.jsx)("p", { children: "Aucun outil à afficher." }),
				t.busy ? /* @__PURE__ */ (0, T.jsx)("p", {
					role: "status",
					children: "Enregistrement…"
				}) : null
			] }) : /* @__PURE__ */ (0, T.jsx)("p", {
				role: "status",
				children: "Lecture des permissions…"
			})
		]
	});
}
//#endregion
//#region studio-ui/src/features/mcp/components/McpUsage.tsx
function M({ connectionId: e }) {
	let [t, n] = (0, l.useState)(null), [r, i] = (0, l.useState)(""), [a, o] = (0, l.useState)(0);
	return (0, l.useEffect)(() => {
		let t = new AbortController();
		return k("usage?connectionId=" + encodeURIComponent(e), t.signal).then((e) => {
			t.signal.aborted || (n(e), i(""));
		}).catch(() => {
			t.signal.aborted || i("Utilisation dans les projets indisponible.");
		}), () => t.abort();
	}, [e, a]), /* @__PURE__ */ (0, T.jsxs)("div", {
		className: "mcp-usage",
		children: [
			/* @__PURE__ */ (0, T.jsx)("h4", { children: "Projets utilisant cette connexion" }),
			r ? /* @__PURE__ */ (0, T.jsxs)("p", {
				role: "alert",
				children: [
					r,
					" ",
					/* @__PURE__ */ (0, T.jsx)("button", {
						type: "button",
						onClick: () => o((e) => e + 1),
						children: "Actualiser"
					})
				]
			}) : null,
			t ? t.supported ? /* @__PURE__ */ (0, T.jsxs)(T.Fragment, { children: [t.projects.length ? /* @__PURE__ */ (0, T.jsx)("ul", { children: t.projects.map((e) => /* @__PURE__ */ (0, T.jsx)("li", { children: e.name }, e.id)) }) : /* @__PURE__ */ (0, T.jsx)("p", {
				className: "mcp-note",
				children: "Aucun projet enregistré ne sélectionne cette connexion."
			}), t.unavailable ? /* @__PURE__ */ (0, T.jsxs)("p", {
				className: "mcp-note",
				children: [t.unavailable, " projet(s) indisponible(s) : leur sélection reste inconnue."]
			}) : null] }) : /* @__PURE__ */ (0, T.jsx)("p", {
				className: "mcp-note",
				children: "La liste des projets est disponible depuis l’accueil."
			}) : r ? null : /* @__PURE__ */ (0, T.jsx)("p", {
				role: "status",
				children: "Lecture des projets…"
			})
		]
	});
}
//#endregion
//#region studio-ui/src/features/connector-interactions/model.ts
function N(e) {
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
	if (o({ guides: [t.definition] }), t.definition.optionId !== t.optionId) throw Error("Guide incohérent.");
	if (t.input !== null && n(t.input).optionId !== t.optionId) throw Error("Réponses incohérentes.");
	if (t.preparation !== null && i(t.preparation), !Array.isArray(t.prerequisites) || !t.prerequisites.every((e) => typeof e.label == "string" && e.status === "to-configure") || !t.accessObservation || !["verified", "not-observed"].includes(t.accessObservation.status)) throw Error("Prérequis illisibles.");
	return t;
}
function P(e, t) {
	let n = e;
	if (!n || !Array.isArray(n.interactions) || n.interactions.length > 200) throw Error("Questionnaires illisibles.");
	let r = n.interactions.map(N);
	if (r.some((e) => e.jobId !== t)) throw Error("Questionnaire d’une autre mission refusé.");
	return r;
}
//#endregion
//#region studio-ui/src/features/connector-interactions/useInteractions.ts
function F(e) {
	let [t, n] = (0, l.useState)([]), [i, a] = (0, l.useState)(""), [o, s] = (0, l.useState)(0), c = (0, l.useRef)(!1);
	return (0, l.useEffect)(() => {
		let t = new AbortController();
		async function i() {
			if (!c.current) {
				c.current = !0;
				try {
					let i = await fetch("/api/connectors/interactions?jobId=" + encodeURIComponent(e), {
						cache: "no-store",
						signal: AbortSignal.any([t.signal, AbortSignal.timeout(15e3)])
					}), o = P(await r(i), e);
					t.signal.aborted || (n((e) => o.map((t) => e.find((e) => e.id === t.id && e.version > t.version) ?? t)), a(""));
				} catch {
					t.signal.aborted || a("Impossible de relire les questionnaires. Les réponses affichées sont conservées.");
				} finally {
					c.current = !1;
				}
			}
		}
		i();
		let o = window.setInterval(() => void i(), 2e3);
		return () => {
			t.abort(), window.clearInterval(o);
		};
	}, [e, o]), {
		items: t,
		error: i,
		refresh: () => s((e) => e + 1),
		replace: (e) => n((t) => t.map((t) => t.id === e.id && t.version <= e.version ? e : t))
	};
}
//#endregion
//#region studio-ui/src/features/connector-interactions/useInteractionAnswer.ts
function I(e, t) {
	let [n, i] = (0, l.useState)({
		input: e.input,
		step: e.step
	}), [o, s] = (0, l.useState)(!1), [c, u] = (0, l.useState)(""), d = a(), f = (0, l.useRef)({
		record: e,
		local: n,
		pending: null,
		failed: !1,
		alive: !0,
		task: null
	});
	(0, l.useEffect)(() => {
		let e = f.current;
		return e.alive = !0, () => {
			e.alive = !1;
		};
	}, []), (0, l.useEffect)(() => {
		let t = f.current;
		e.version < t.record.version || (t.record = e, e.status === "answered" && (t.pending = null, t.failed = !1, u("")), !t.pending && !t.task && (t.local = {
			input: e.input,
			step: e.step
		}, i(t.local)));
	}, [e]);
	async function p(n, i) {
		let a = N((await r(await fetch("/api/connectors/interactions/" + n, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				interactionId: e.id,
				expectedVersion: f.current.record.version,
				...i
			}),
			signal: AbortSignal.timeout(15e3)
		}))).interaction);
		if (a.id !== e.id || a.jobId !== e.jobId) throw Error("Questionnaire différent.");
		return f.current.record = a, f.current.alive && t(a), a;
	}
	async function m() {
		let e = f.current;
		s(!0);
		try {
			for (; e.pending && e.record.status === "pending";) {
				let t = e.pending;
				await p("draft", t), e.pending === t && (e.pending = null);
			}
			return !e.pending;
		} catch {
			return e.failed = !0, e.alive && e.record.status === "pending" && u("Réponses non enregistrées ou questionnaire modifié. Votre saisie est conservée. Réessayez après avoir relu son état."), !1;
		} finally {
			e.task = null, e.alive && s(!1);
		}
	}
	function h() {
		let e = f.current;
		return e.task ? e.task : e.failed ? Promise.resolve(!1) : e.pending ? (e.task = m(), e.task) : Promise.resolve(!0);
	}
	function g(t) {
		if (e.status !== "pending") return;
		let n = f.current;
		n.local = t, n.pending = t, i(t), h();
	}
	async function _(e) {
		if (await h()) {
			s(!0);
			try {
				await p("answer", {
					input: e.input,
					step: 2
				});
			} catch {
				u("Réponse non transmise. Votre saisie est conservée ; relisez le questionnaire avant de réessayer.");
			} finally {
				f.current.alive && s(!1);
			}
		}
	}
	return {
		local: n,
		saving: o,
		error: c,
		validation: d,
		change: (e) => {
			d.reset(), g({
				...f.current.local,
				input: e
			});
		},
		setStep: (e) => g({
			...f.current.local,
			step: e
		}),
		answer: _,
		retry: () => {
			f.current.failed = !1, u(""), h();
		}
	};
}
//#endregion
//#region studio-ui/src/features/connector-interactions/ConnectorInteractions.tsx
function L({ item: e, renderConnection: t }) {
	return /* @__PURE__ */ (0, T.jsxs)(T.Fragment, { children: [
		e.accessObservation.status === "verified" ? /* @__PURE__ */ (0, T.jsxs)("p", { children: [
			"Connexion MCP observée · ",
			e.accessObservation.tools,
			" outils découverts. Les prérequis ci-dessous restent à vérifier."
		] }) : null,
		e.prerequisites.length ? /* @__PURE__ */ (0, T.jsx)("ul", {
			"aria-label": "Prérequis à configurer",
			children: e.prerequisites.map((e) => /* @__PURE__ */ (0, T.jsxs)("li", { children: ["À configurer : ", e.label] }, e.label))
		}) : null,
		e.preparation?.nativeConnection && t ? t(e.preparation) : null
	] });
}
var R = {
	answered: "Réponses transmises à l’agent",
	cancelled: "Questionnaire annulé : la mission ou son contexte a changé.",
	pending: "L’agent attend vos choix pour ce service."
};
function z({ item: e, onSaved: t, renderConnection: n }) {
	let r = I(e, t), i = e.requestedFlowId ? {
		...e.definition,
		flows: e.definition.flows.filter((t) => t.id === e.requestedFlowId)
	} : e.definition, a = e.status !== "pending", o = /* @__PURE__ */ (0, T.jsx)(s, {
		definition: i,
		draft: r.local.input,
		preparation: e.preparation ?? r.validation.preparation,
		step: a ? e.step : r.local.step,
		onStepChange: r.setStep,
		preparing: r.validation.loading,
		disabled: a || r.saving,
		error: r.validation.error,
		onChange: r.change,
		onPrepare: r.validation.prepare,
		onApply: a ? void 0 : (e) => void r.answer(e),
		applyLabel: "Transmettre mes réponses à l’agent"
	});
	return /* @__PURE__ */ (0, T.jsxs)("article", {
		"aria-label": "Questionnaire " + e.definition.title,
		className: "connector-interaction",
		children: [
			/* @__PURE__ */ (0, T.jsx)("p", {
				role: "status",
				children: R[e.status]
			}),
			e.status === "answered" ? /* @__PURE__ */ (0, T.jsxs)("details", {
				className: "connector-interaction-summary",
				open: !0,
				children: [/* @__PURE__ */ (0, T.jsxs)("summary", { children: ["Revoir les réponses · ", e.definition.title] }), o]
			}) : o,
			r.saving ? /* @__PURE__ */ (0, T.jsx)("p", {
				role: "status",
				children: "Enregistrement des réponses…"
			}) : null,
			r.error ? /* @__PURE__ */ (0, T.jsxs)("p", {
				role: "alert",
				children: [
					r.error,
					" ",
					a ? null : /* @__PURE__ */ (0, T.jsx)("button", {
						type: "button",
						onClick: r.retry,
						children: "Réessayer l’enregistrement"
					})
				]
			}) : null,
			/* @__PURE__ */ (0, T.jsx)(L, {
				item: e,
				renderConnection: n
			})
		]
	});
}
function B({ jobId: e, renderConnection: t }) {
	let n = F(e);
	return /* @__PURE__ */ (0, T.jsxs)("section", {
		"aria-label": "Questions de la mission",
		children: [n.error ? /* @__PURE__ */ (0, T.jsxs)("p", {
			role: "alert",
			children: [
				n.error,
				" ",
				/* @__PURE__ */ (0, T.jsx)("button", {
					type: "button",
					onClick: n.refresh,
					children: "Relire les questionnaires"
				})
			]
		}) : null, n.items.map((e) => /* @__PURE__ */ (0, T.jsx)(z, {
			item: e,
			onSaved: n.replace,
			renderConnection: t
		}, e.id))]
	});
}
function V({ jobId: e, renderConnection: t }) {
	return e ? /* @__PURE__ */ (0, T.jsx)(B, {
		jobId: e,
		renderConnection: t
	}, e) : null;
}
//#endregion
//#region studio-ui/src/features/mcp/components/McpConnectionCard.tsx
var H = {
	github: "Consultez le code, les issues et les pull requests avec l’assistant.",
	notion: "Retrouvez le contexte et préparez la documentation de vos projets.",
	linear: "Suivez les issues et préparez les mises à jour de votre équipe."
}, U = {
	github: "https://github.com/github/github-mcp-server/blob/main/docs/remote-server.md",
	notion: "https://developers.notion.com/guides/mcp/build-mcp-client",
	linear: "https://linear.app/docs/mcp"
};
function W({ connection: e, controller: t, selected: n, disabled: r, onToggle: i }) {
	let [a, o] = (0, l.useState)(!1), [s, f] = (0, l.useState)(!1), p = e.status === "connected";
	return /* @__PURE__ */ (0, T.jsxs)("li", {
		className: "mcp-connection-row",
		children: [
			/* @__PURE__ */ (0, T.jsxs)("div", {
				className: "mcp-connection-heading",
				children: [/* @__PURE__ */ (0, T.jsx)(c, {
					optionId: e.provider === "custom" ? "application-mcp" : e.provider,
					size: 32
				}), /* @__PURE__ */ (0, T.jsxs)("div", { children: [/* @__PURE__ */ (0, T.jsx)("strong", { children: u(e) }), /* @__PURE__ */ (0, T.jsxs)("span", {
					className: `mcp-status mcp-status-${e.status}`,
					children: [h[e.status], p ? ` · ${e.tools.length} outil${e.tools.length > 1 ? "s" : ""}` : ""]
				})] })]
			}),
			/* @__PURE__ */ (0, T.jsx)("p", {
				className: "mcp-note",
				children: H[e.provider] || "Ajoutez les outils de ce service au contexte de l’assistant."
			}),
			n ? /* @__PURE__ */ (0, T.jsx)("p", {
				className: "mcp-status mcp-status-connected",
				children: "Utilisé dans ce projet"
			}) : null,
			e.error ? /* @__PURE__ */ (0, T.jsx)("p", {
				className: "mcp-connection-error",
				children: e.error.message
			}) : null,
			/* @__PURE__ */ (0, T.jsx)("button", {
				type: "button",
				"aria-expanded": s,
				onClick: () => f(!s),
				children: s ? "Fermer la fiche" : "Compte et permissions"
			}),
			s ? /* @__PURE__ */ (0, T.jsx)(G, {
				connection: e,
				selected: n
			}) : null,
			/* @__PURE__ */ (0, T.jsx)(K, {
				connection: e,
				controller: t,
				selected: n,
				disabled: r,
				onToggle: i,
				onCredentials: () => o(!0)
			}),
			a ? e.provider === "github" ? /* @__PURE__ */ (0, T.jsx)(E, {
				input: d(e),
				controller: t,
				disabled: r
			}) : /* @__PURE__ */ (0, T.jsx)(D, {
				controller: t,
				disabled: r,
				connection: e,
				onDismiss: () => o(!1)
			}) : null
		]
	});
}
function G({ connection: e, selected: t }) {
	let n = e.status === "connected";
	return /* @__PURE__ */ (0, T.jsxs)("div", {
		className: "mcp-connection-detail",
		children: [
			/* @__PURE__ */ (0, T.jsx)("h4", { children: "Connexion partagée" }),
			/* @__PURE__ */ (0, T.jsx)("p", { children: e.name }),
			/* @__PURE__ */ (0, T.jsx)("p", {
				className: "mcp-note",
				children: "L’identité du compte n’est pas fournie par ce serveur. Les droits du compte sont ceux accordés chez le fournisseur."
			}),
			/* @__PURE__ */ (0, T.jsxs)("details", { children: [
				/* @__PURE__ */ (0, T.jsx)("summary", { children: "Configuration avancée" }),
				/* @__PURE__ */ (0, T.jsx)("p", {
					className: "mcp-server-url",
					children: e.url
				}),
				/* @__PURE__ */ (0, T.jsxs)("p", { children: [
					"Authentification :",
					" ",
					e.auth === "bearer" ? "Jeton personnel" : e.auth === "oauth" ? "OAuth" : "Sans authentification"
				] })
			] }),
			U[e.provider] ? /* @__PURE__ */ (0, T.jsx)("a", {
				href: U[e.provider],
				target: "_blank",
				rel: "noopener noreferrer",
				children: "Documentation du service ↗"
			}) : null,
			/* @__PURE__ */ (0, T.jsx)(M, { connectionId: e.id }, e.id + ":" + t),
			n ? /* @__PURE__ */ (0, T.jsx)(j, { connectionId: e.id }, e.id + ":" + e.version) : /* @__PURE__ */ (0, T.jsx)("p", {
				className: "mcp-note",
				children: "Reconnectez ce service pour vérifier ses outils et régler leurs permissions."
			})
		]
	});
}
function K({ connection: e, controller: t, selected: n, disabled: r, onToggle: i, onCredentials: a }) {
	let o = e.status === "connected", s = t.active;
	return /* @__PURE__ */ (0, T.jsxs)("div", {
		className: "mcp-connection-actions",
		children: [/* @__PURE__ */ (0, T.jsxs)("label", {
			className: "mcp-use-connection",
			children: [/* @__PURE__ */ (0, T.jsx)("input", {
				type: "checkbox",
				name: "mcp-connection",
				value: e.id,
				checked: n,
				disabled: r || !o && !n,
				onChange: i
			}), "Utiliser pour ce projet"]
		}), /* @__PURE__ */ (0, T.jsxs)("div", { children: [o ? /* @__PURE__ */ (0, T.jsx)("button", {
			type: "button",
			disabled: r || !!s,
			onClick: () => void t.change(e.id, "refresh"),
			children: "Actualiser les outils"
		}) : /* @__PURE__ */ (0, T.jsx)("button", {
			type: "button",
			disabled: r || !!s,
			onClick: () => e.auth === "bearer" ? a() : void t.connect(d(e)),
			children: "Reconnecter"
		}), e.status === "disconnected" ? null : /* @__PURE__ */ (0, T.jsx)("button", {
			type: "button",
			disabled: r || !!(s && s.id !== e.id),
			onClick: () => void t.change(e.id, "disconnect"),
			children: s?.id === e.id ? "Annuler la connexion" : "Déconnecter"
		})] })]
	});
}
//#endregion
//#region studio-ui/src/features/mcp/components/McpConnectionsPanel.tsx
function q({ controller: e, selectedIds: t, onToggle: n, onConfigureGuide: r, disabled: i = !1 }) {
	let [a, o] = (0, l.useState)(""), [s, u] = (0, l.useState)(!1), d = e.connections.filter((e) => `${e.name} ${e.url}`.toLocaleLowerCase("fr").includes(a.trim().toLocaleLowerCase("fr")));
	return /* @__PURE__ */ (0, T.jsxs)("section", {
		className: "mcp-connections-panel",
		"aria-label": "Serveurs MCP de l’espace",
		children: [
			/* @__PURE__ */ (0, T.jsxs)("div", {
				className: "mcp-panel-heading",
				children: [/* @__PURE__ */ (0, T.jsxs)("div", { children: [/* @__PURE__ */ (0, T.jsx)("h3", { children: "Serveurs MCP de l’espace" }), /* @__PURE__ */ (0, T.jsx)("p", { children: "Connectez vos sources et outils une fois, puis choisissez ceux à utiliser dans chaque projet." })] }), /* @__PURE__ */ (0, T.jsx)("button", {
					type: "button",
					disabled: e.loading || !!e.active,
					onClick: e.refresh,
					children: "Actualiser les connexions"
				})]
			}),
			e.loading ? /* @__PURE__ */ (0, T.jsx)("p", {
				role: "status",
				className: "mcp-note",
				children: "Lecture des connexions…"
			}) : null,
			e.error ? /* @__PURE__ */ (0, T.jsx)("p", {
				role: "alert",
				className: "mcp-connection-error",
				children: e.error
			}) : null,
			e.active ? /* @__PURE__ */ (0, T.jsx)("p", {
				role: "status",
				className: "mcp-active-status",
				children: e.active.authorizing ? "Autorisez l’accès dans la fenêtre ouverte. Cet écran se mettra à jour après confirmation." : "Vérification de la connexion et découverte des outils…"
			}) : null,
			e.supported ? null : /* @__PURE__ */ (0, T.jsx)("p", {
				className: "mcp-note",
				children: "Ouvrez ce projet depuis l’accueil Studio pour accéder aux connexions de l’espace."
			}),
			/* @__PURE__ */ (0, T.jsxs)("div", {
				className: "mcp-connected-heading",
				children: [/* @__PURE__ */ (0, T.jsxs)("h4", { children: ["Connexions de l’espace ", /* @__PURE__ */ (0, T.jsx)("span", { children: e.connections.length })] }), e.connections.length > 3 ? /* @__PURE__ */ (0, T.jsxs)("label", { children: [/* @__PURE__ */ (0, T.jsx)("span", {
					className: "mcp-sr",
					children: "Rechercher un serveur MCP"
				}), /* @__PURE__ */ (0, T.jsx)("input", {
					type: "search",
					value: a,
					onChange: (e) => o(e.target.value),
					placeholder: "Rechercher une connexion…"
				})] }) : null]
			}),
			/* @__PURE__ */ (0, T.jsx)("ul", {
				className: "mcp-connection-list",
				children: d.map((r) => /* @__PURE__ */ (0, T.jsx)(W, {
					connection: r,
					controller: e,
					selected: t.includes(r.id),
					disabled: i,
					onToggle: () => n(r.id)
				}, r.id))
			}),
			!e.loading && !d.length ? /* @__PURE__ */ (0, T.jsx)("p", {
				className: "mcp-note",
				children: e.connections.length ? "Aucune connexion ne correspond à cette recherche." : "Aucun serveur MCP connecté pour le moment."
			}) : null,
			/* @__PURE__ */ (0, T.jsx)("h4", { children: "Ajouter un serveur" }),
			/* @__PURE__ */ (0, T.jsx)("div", {
				className: "mcp-preset-grid",
				children: e.presets.map((t) => /* @__PURE__ */ (0, T.jsxs)("button", {
					type: "button",
					disabled: i || !e.supported || !!e.active,
					onClick: () => r && [
						"notion",
						"linear",
						"github"
					].includes(t.id) ? r(t.id === "github" ? "github-mcp" : t.id) : t.id === "github" ? u(!0) : void e.connect({ provider: t.id }),
					children: [/* @__PURE__ */ (0, T.jsx)(c, {
						optionId: t.id,
						size: 28
					}), /* @__PURE__ */ (0, T.jsxs)("span", { children: [t.name, /* @__PURE__ */ (0, T.jsx)("small", { children: r && [
						"notion",
						"linear",
						"github"
					].includes(t.id) ? "Choisir l’usage et connecter" : t.id === "github" ? "Connecter avec un jeton ciblé" : "Connecter avec OAuth" })] })]
				}, t.id))
			}),
			s ? /* @__PURE__ */ (0, T.jsx)(E, {
				input: {
					provider: "github",
					auth: "bearer"
				},
				controller: e,
				disabled: i
			}) : null,
			/* @__PURE__ */ (0, T.jsx)(D, {
				controller: e,
				disabled: i || !e.supported
			}),
			/* @__PURE__ */ (0, T.jsx)("p", {
				className: "mcp-note",
				children: "Les permissions contrôlent les appels du pont MCP DevMethod. Elles ne contrôlent pas les outils utilisés directement par l’agent hôte. Ces connexions servent au contexte et aux outils de l’agent, pas aux API intégrées dans votre application."
			})
		]
	});
}
//#endregion
//#region studio-ui/src/features/mcp/components/McpPromptSelection.tsx
function J({ connections: e, selectedIds: t, onToggle: n, onManage: r, disabled: i = !1 }) {
	let a = e.filter((e) => e.status === "connected" || t.includes(e.id));
	return /* @__PURE__ */ (0, T.jsxs)("div", {
		className: "mcp-prompt-selection",
		"aria-label": "Serveurs MCP pour ce projet",
		children: [a.map((e) => /* @__PURE__ */ (0, T.jsxs)("button", {
			type: "button",
			className: `mcp-prompt-chip${e.status === "connected" ? "" : " mcp-prompt-chip-unavailable"}`,
			"aria-pressed": t.includes(e.id),
			"aria-label": `Utiliser ${u(e)} pour ce projet`,
			disabled: i || e.status !== "connected" && !t.includes(e.id),
			onClick: () => n(e.id),
			title: `${u(e)} · ${e.status === "connected" ? `${e.tools.length} outils disponibles` : "À reconnecter"}`,
			children: [
				/* @__PURE__ */ (0, T.jsx)(c, {
					optionId: e.provider === "custom" ? "application-mcp" : e.provider,
					size: 18
				}),
				/* @__PURE__ */ (0, T.jsx)("span", { children: u(e) }),
				/* @__PURE__ */ (0, T.jsx)("small", { children: e.status === "connected" ? "Connecté" : "À reconnecter" })
			]
		}, e.id)), /* @__PURE__ */ (0, T.jsx)("button", {
			type: "button",
			className: "mcp-manage",
			disabled: i,
			onClick: (e) => r(e.currentTarget),
			children: a.length ? "Gérer les MCP" : "+ Connecter un MCP"
		})]
	});
}
//#endregion
//#region studio-ui/src/features/mcp/model/guided-mcp.ts
function Y(e) {
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
async function X(e, t) {
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
function Z() {
	let [e, t] = (0, l.useState)({
		supported: !1,
		connectionIds: []
	}), [n, r] = (0, l.useState)(!0), [i, a] = (0, l.useState)(!1), [o, s] = (0, l.useState)(""), c = (0, l.useRef)(null), u = (0, l.useRef)(null), d = (0, l.useRef)(null), f = (0, l.useRef)(""), p = (0, l.useRef)(!1), m = (0, l.useRef)(Symbol()), h = (0, l.useRef)(!1), g = (0, l.useCallback)((e = !1) => {
		if (u.current) {
			h.current = !0;
			return;
		}
		h.current = !1, c.current?.abort();
		let n = new AbortController();
		c.current = n, r(!0), (!e || !p.current) && (s(""), f.current = "", p.current = !1), d.current = X(n.signal).then((e) => {
			n.signal.aborted || t(e);
		}).catch((e) => {
			n.signal.aborted || (f.current = e instanceof Error ? e.message : "Sélection indisponible.", s(f.current));
		}).finally(() => {
			n.signal.aborted || r(!1);
		});
	}, []);
	(0, l.useEffect)(() => {
		let e = y("selection", m.current, () => g(!0));
		return g(), () => {
			e(), c.current?.abort(), u.current?.abort();
		};
	}, [g]);
	async function _(r, i) {
		if (n || u.current || !e.supported || e.connectionIds.includes(r) === i) return;
		let o = i ? [...e.connectionIds, r] : e.connectionIds.filter((e) => e !== r);
		if (o.length > 12) {
			s("Vous pouvez sélectionner au maximum 12 serveurs MCP.");
			return;
		}
		c.current?.abort();
		let l = new AbortController();
		u.current = l, a(!0), f.current = "", p.current = !1, s("");
		try {
			let e = await X(l.signal, o);
			l.signal.aborted || (t(e), v("selection", m.current));
		} catch (e) {
			l.signal.aborted || (p.current = !0, f.current = e instanceof Error ? e.message : "Sélection non enregistrée.", s(f.current));
		} finally {
			l.signal.aborted || (u.current = null, a(!1), h.current && g(!0));
		}
	}
	return {
		...e,
		loading: n,
		saving: i,
		error: o,
		select: (t, r) => {
			if (n || u.current || !e.supported || e.connectionIds.includes(t) === r) return d.current;
			let i = _(t, r);
			return d.current = i, i;
		},
		refresh: () => g(),
		prepareRequest: async () => {
			let e;
			do
				e = d.current, await e;
			while (d.current !== e);
			return !f.current;
		}
	};
}
//#endregion
export { V as a, w as c, q as i, Y as n, k as o, J as r, E as s, Z as t };
