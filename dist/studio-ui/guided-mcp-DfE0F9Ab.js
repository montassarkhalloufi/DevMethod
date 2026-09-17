import { r as e, t } from "./jsx-runtime-Bz8zB3tG.js";
import { i as n } from "./ConnectorGuide-B-paXMRz.js";
//#region studio-ui/src/features/mcp/model/mcp.ts
var r = e();
function i(e) {
	return e.provider === "linear" ? `${e.name} · ${e.url === "https://mcp.linear.app/mcp/readonly" ? "lecture seule" : "accès standard"}` : e.name;
}
function a(e) {
	return {
		id: e.id,
		provider: e.provider,
		auth: e.auth,
		...e.provider === "linear" ? { url: e.url } : {},
		...e.provider === "custom" ? {
			name: e.name,
			url: e.url
		} : {}
	};
}
function o(e) {
	let t = e;
	if (!t || ![
		t.id,
		t.name,
		t.url
	].every((e) => typeof e == "string" && e.length) || ![
		"notion",
		"linear",
		"sentry",
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
function s(e) {
	let t = e;
	if (!t || !Array.isArray(t.connections) || !Array.isArray(t.presets)) throw Error("La liste des serveurs MCP est indisponible.");
	return {
		presets: t.presets.filter((e) => e && [
			"notion",
			"linear",
			"sentry"
		].includes(e.id) && typeof e.name == "string" && typeof e.url == "string"),
		connections: t.connections.map(o),
		supported: t.supported !== !1
	};
}
function c(e) {
	if (typeof e != "string") throw Error("Le serveur n’a pas renvoyé d’adresse d’autorisation.");
	let t = new URL(e), n = [
		"127.0.0.1",
		"localhost",
		"[::1]"
	].includes(t.hostname);
	if (t.protocol !== "https:" && !(n && t.protocol === "http:") || t.username || t.password || e.includes("\\")) throw Error("L’adresse d’autorisation renvoyée est invalide.");
	return t.href;
}
var l = {
	disconnected: "Déconnecté",
	connecting: "Connexion en cours",
	"authorization-required": "Autorisation attendue",
	connected: "Connecté",
	error: "Connexion à rétablir"
};
function u(e) {
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
//#region studio-ui/src/features/mcp/hooks/useMcpConnections.ts
async function d(e, t, n) {
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
function f(e) {
	return new Promise((t) => {
		let n = () => {
			window.clearTimeout(r), e.removeEventListener("abort", n), t();
		}, r = window.setTimeout(n, 2e3);
		e.addEventListener("abort", n, { once: !0 }), e.aborted && n();
	});
}
function p() {
	let e = window.open("about:blank", "_blank", "popup,width=600,height=760");
	if (!e) throw Error("Autorisez les fenêtres de connexion pour ce site, puis réessayez.");
	return e.opener = null, e.document.title = "Connexion du serveur MCP", e.document.body.textContent = "Préparation de votre connexion sécurisée…", e;
}
function m(e, t) {
	let n = c(t);
	if (!e || e.closed) throw Error("La fenêtre de connexion a été fermée. Reconnectez le serveur pour reprendre.");
	e.location.assign(n);
}
function h(e, t) {
	let [n, i] = (0, r.useState)({
		presets: [],
		connections: [],
		supported: !0
	}), [a, c] = (0, r.useState)(!0), [l, u] = (0, r.useState)(""), [h, g] = (0, r.useState)(null), _ = (0, r.useRef)(null), v = (0, r.useRef)(null), y = (0, r.useRef)(null), b = (0, r.useRef)(e), x = (0, r.useRef)(t);
	(0, r.useEffect)(() => {
		b.current = e, x.current = t;
	}, [e, t]);
	let S = (0, r.useCallback)(async () => {
		_.current?.abort();
		let e = new AbortController();
		_.current = e, c(!0);
		try {
			let t = s(await d("", e.signal));
			e.signal.aborted || (i(t), u(""));
		} catch (t) {
			e.signal.aborted || u(t instanceof Error ? t.message : "État MCP indisponible.");
		} finally {
			e.signal.aborted || c(!1);
		}
	}, []);
	(0, r.useEffect)(() => (S(), () => {
		_.current?.abort(), v.current?.abort(), y.current?.close();
	}), [S]);
	function C(e) {
		_.current?.abort(), c(!1), i((t) => ({
			...t,
			connections: [...t.connections.filter((t) => t.id !== e.id), e]
		}));
	}
	async function w(e, t) {
		let n = Date.now() + 6e5;
		for (; !t.signal.aborted && Date.now() < n;) {
			if (await f(t.signal), t.signal.aborted) return;
			let n = s(await d("", t.signal));
			if (t.signal.aborted) return;
			i(n);
			let r = n.connections.find((t) => t.id === e);
			if (r?.status === "connected") {
				y.current?.close(), b.current(e);
				return;
			}
			if (!r || ["error", "disconnected"].includes(r.status)) throw Error(r?.error?.message || "La connexion a été interrompue. Réessayez.");
		}
		if (!t.signal.aborted) throw Error("Le délai d’autorisation est écoulé. Relancez la connexion.");
	}
	async function T(e) {
		if (v.current) return;
		let t = new AbortController();
		v.current = t, u(""), g({
			id: e.id || null,
			authorizing: !1
		});
		try {
			(e.auth || "oauth") === "oauth" && (y.current = p());
			let n = await d("/connect", t.signal, e);
			if (t.signal.aborted) return;
			let r = o(n.connection);
			if (C(r), r.status === "connected") {
				y.current?.close(), b.current(r.id);
				return;
			}
			if (n.authorizationUrl) m(y.current, n.authorizationUrl), g({
				id: r.id,
				authorizing: !0
			}), await w(r.id, t);
			else if (r.status === "connecting") g({
				id: r.id,
				authorizing: !1
			}), await w(r.id, t);
			else throw Error(r.error?.message || "L’autorisation est nécessaire. Reconnectez le serveur.");
		} catch (e) {
			y.current?.close(), t.signal.aborted || u(e instanceof Error ? e.message : "Connexion MCP interrompue.");
		} finally {
			v.current === t && (v.current = null, g(null));
		}
	}
	async function E(e, t) {
		if (v.current && (h?.id !== e || t !== "disconnect")) return;
		v.current?.abort(), y.current?.close();
		let n = new AbortController();
		v.current = n, g({
			id: e,
			authorizing: !1
		}), u("");
		try {
			let r = await d("/" + t, n.signal, { id: e });
			if (n.signal.aborted) return;
			let i = o(r.connection);
			C(i), t === "disconnect" && x.current(e), r.authorizationUrl && u("Une nouvelle autorisation est nécessaire. Cliquez sur Reconnecter."), i.status === "error" && u(i.error?.message || "La connexion doit être rétablie.");
		} catch (e) {
			n.signal.aborted || u(e instanceof Error ? e.message : "Mise à jour MCP impossible.");
		} finally {
			v.current === n && (v.current = null, g(null));
		}
	}
	return {
		...n,
		loading: a,
		error: l,
		active: h,
		refresh: () => {
			S();
		},
		connect: T,
		change: E
	};
}
//#endregion
//#region studio-ui/src/features/mcp/components/McpConnectionsPanel.tsx
var g = t();
function _({ connection: e, controller: t, selected: o, disabled: s, onToggle: c }) {
	let u = t.active, [d, f] = (0, r.useState)(!1), p = e.status === "connected";
	return /* @__PURE__ */ (0, g.jsxs)("li", {
		className: "mcp-connection-row",
		children: [
			/* @__PURE__ */ (0, g.jsxs)("div", {
				className: "mcp-connection-heading",
				children: [/* @__PURE__ */ (0, g.jsx)(n, {
					optionId: e.provider === "custom" ? "application-mcp" : e.provider,
					size: 32
				}), /* @__PURE__ */ (0, g.jsxs)("div", { children: [/* @__PURE__ */ (0, g.jsx)("strong", { children: i(e) }), /* @__PURE__ */ (0, g.jsxs)("span", {
					className: `mcp-status mcp-status-${e.status}`,
					children: [l[e.status], p ? ` · ${e.tools.length} outil${e.tools.length > 1 ? "s" : ""}` : ""]
				})] })]
			}),
			/* @__PURE__ */ (0, g.jsx)("p", {
				className: "mcp-server-url",
				title: e.url,
				children: e.url
			}),
			e.error ? /* @__PURE__ */ (0, g.jsx)("p", {
				className: "mcp-connection-error",
				children: e.error.message
			}) : null,
			p && e.tools.length ? /* @__PURE__ */ (0, g.jsxs)("details", {
				className: "mcp-discovered-tools",
				children: [/* @__PURE__ */ (0, g.jsx)("summary", { children: "Voir les outils disponibles" }), /* @__PURE__ */ (0, g.jsx)("ul", { children: e.tools.map((e) => /* @__PURE__ */ (0, g.jsxs)("li", { children: [/* @__PURE__ */ (0, g.jsx)("strong", { children: e.title || e.name }), e.description ? /* @__PURE__ */ (0, g.jsx)("span", { children: e.description }) : null] }, e.name)) })]
			}) : null,
			/* @__PURE__ */ (0, g.jsxs)("div", {
				className: "mcp-connection-actions",
				children: [/* @__PURE__ */ (0, g.jsxs)("label", {
					className: "mcp-use-connection",
					children: [/* @__PURE__ */ (0, g.jsx)("input", {
						type: "checkbox",
						name: "mcp-connection",
						value: e.id,
						checked: o,
						disabled: s || !p && !o,
						onChange: c
					}), "Utiliser pour ce projet"]
				}), /* @__PURE__ */ (0, g.jsxs)("div", { children: [p ? /* @__PURE__ */ (0, g.jsx)("button", {
					type: "button",
					disabled: s || !!u,
					onClick: () => void t.change(e.id, "refresh"),
					children: "Actualiser les outils"
				}) : /* @__PURE__ */ (0, g.jsx)("button", {
					type: "button",
					disabled: s || !!u,
					onClick: () => e.auth === "bearer" ? f(!0) : void t.connect(a(e)),
					children: "Reconnecter"
				}), e.status === "disconnected" ? null : /* @__PURE__ */ (0, g.jsx)("button", {
					type: "button",
					disabled: s || !!(u && u.id !== e.id),
					onClick: () => void t.change(e.id, "disconnect"),
					children: u?.id === e.id ? "Annuler la connexion" : "Déconnecter"
				})] })]
			}),
			d ? /* @__PURE__ */ (0, g.jsx)(v, {
				controller: t,
				disabled: s,
				connection: e,
				onDismiss: () => f(!1)
			}) : null
		]
	});
}
function v({ controller: e, disabled: t, connection: n, onDismiss: i }) {
	let [a, o] = (0, r.useState)(!!n), [s, c] = (0, r.useState)(n?.auth || "oauth"), [l, d] = (0, r.useState)(""), f = (0, r.useRef)(null);
	return /* @__PURE__ */ (0, g.jsxs)("div", {
		className: "mcp-custom-connection",
		children: [n ? null : /* @__PURE__ */ (0, g.jsx)("button", {
			type: "button",
			className: "mcp-add-custom",
			disabled: t,
			"aria-expanded": a,
			onClick: () => o(!a),
			children: "+ Ajouter un serveur personnalisé"
		}), a ? /* @__PURE__ */ (0, g.jsxs)("form", {
			ref: f,
			onSubmit: (r) => {
				if (r.preventDefault(), !(t || e.active)) try {
					let t = u(r.currentTarget);
					d(""), e.connect({
						...t,
						...n ? { id: n.id } : {}
					});
					let i = r.currentTarget.elements.namedItem("mcp-token");
					i instanceof HTMLInputElement && (i.value = "");
				} catch (e) {
					d(e instanceof Error ? e.message : "Vérifiez les informations du serveur.");
				}
			},
			children: [
				/* @__PURE__ */ (0, g.jsx)("input", {
					type: "hidden",
					name: "mcp-provider",
					value: "custom"
				}),
				/* @__PURE__ */ (0, g.jsxs)("div", {
					className: "mcp-custom-fields",
					children: [/* @__PURE__ */ (0, g.jsxs)("label", { children: ["Nom du serveur", /* @__PURE__ */ (0, g.jsx)("input", {
						name: "mcp-name",
						defaultValue: n?.name,
						maxLength: 100,
						autoComplete: "off",
						required: !0,
						disabled: t || !!e.active,
						placeholder: "Mon espace documentaire"
					})] }), /* @__PURE__ */ (0, g.jsxs)("label", { children: ["Adresse MCP", /* @__PURE__ */ (0, g.jsx)("input", {
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
				/* @__PURE__ */ (0, g.jsxs)("label", { children: ["Authentification", /* @__PURE__ */ (0, g.jsxs)("select", {
					name: "mcp-auth",
					value: s,
					disabled: t || !!e.active,
					onChange: (e) => c(e.target.value),
					children: [
						/* @__PURE__ */ (0, g.jsx)("option", {
							value: "oauth",
							children: "OAuth · autoriser dans le navigateur"
						}),
						/* @__PURE__ */ (0, g.jsx)("option", {
							value: "bearer",
							children: "Jeton Bearer"
						}),
						/* @__PURE__ */ (0, g.jsx)("option", {
							value: "none",
							children: "Sans authentification"
						})
					]
				})] }),
				s === "bearer" ? /* @__PURE__ */ (0, g.jsxs)("label", { children: [
					"Jeton de connexion",
					/* @__PURE__ */ (0, g.jsx)("input", {
						name: "mcp-token",
						type: "password",
						maxLength: 8192,
						autoComplete: "off",
						spellCheck: !1,
						required: !0,
						disabled: t || !!e.active
					}),
					/* @__PURE__ */ (0, g.jsx)("small", { children: "Transmis au gestionnaire local. Il n’est jamais ajouté à votre demande." })
				] }) : null,
				l ? /* @__PURE__ */ (0, g.jsx)("p", {
					role: "alert",
					className: "mcp-connection-error",
					children: l
				}) : null,
				/* @__PURE__ */ (0, g.jsxs)("div", {
					className: "mcp-form-actions",
					children: [/* @__PURE__ */ (0, g.jsx)("button", {
						type: "button",
						disabled: !!e.active,
						onClick: () => {
							o(!1), i?.();
						},
						children: "Fermer les réglages"
					}), /* @__PURE__ */ (0, g.jsx)("button", {
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
function y({ controller: e, selectedIds: t, onToggle: i, onConfigureGuide: a, disabled: o = !1 }) {
	let [s, c] = (0, r.useState)(""), l = e.connections.filter((e) => `${e.name} ${e.url}`.toLocaleLowerCase("fr").includes(s.trim().toLocaleLowerCase("fr")));
	return /* @__PURE__ */ (0, g.jsxs)("section", {
		className: "mcp-connections-panel",
		"aria-label": "Serveurs MCP de l’espace",
		children: [
			/* @__PURE__ */ (0, g.jsxs)("div", {
				className: "mcp-panel-heading",
				children: [/* @__PURE__ */ (0, g.jsxs)("div", { children: [/* @__PURE__ */ (0, g.jsx)("h3", { children: "Serveurs MCP de l’espace" }), /* @__PURE__ */ (0, g.jsx)("p", { children: "Connectez vos sources et outils une fois, puis choisissez ceux à utiliser dans chaque projet." })] }), /* @__PURE__ */ (0, g.jsx)("button", {
					type: "button",
					disabled: e.loading || !!e.active,
					onClick: e.refresh,
					children: "Actualiser les connexions"
				})]
			}),
			e.loading ? /* @__PURE__ */ (0, g.jsx)("p", {
				role: "status",
				className: "mcp-note",
				children: "Lecture des connexions…"
			}) : null,
			e.error ? /* @__PURE__ */ (0, g.jsx)("p", {
				role: "alert",
				className: "mcp-connection-error",
				children: e.error
			}) : null,
			e.active ? /* @__PURE__ */ (0, g.jsx)("p", {
				role: "status",
				className: "mcp-active-status",
				children: e.active.authorizing ? "Autorisez l’accès dans la fenêtre ouverte. Cet écran se mettra à jour après confirmation." : "Vérification de la connexion et découverte des outils…"
			}) : null,
			e.supported ? null : /* @__PURE__ */ (0, g.jsx)("p", {
				className: "mcp-note",
				children: "Ouvrez ce projet depuis l’accueil Studio pour accéder aux connexions de l’espace."
			}),
			/* @__PURE__ */ (0, g.jsxs)("div", {
				className: "mcp-connected-heading",
				children: [/* @__PURE__ */ (0, g.jsxs)("h4", { children: ["Connexions de l’espace ", /* @__PURE__ */ (0, g.jsx)("span", { children: e.connections.length })] }), e.connections.length > 3 ? /* @__PURE__ */ (0, g.jsxs)("label", { children: [/* @__PURE__ */ (0, g.jsx)("span", {
					className: "mcp-sr",
					children: "Rechercher un serveur MCP"
				}), /* @__PURE__ */ (0, g.jsx)("input", {
					type: "search",
					value: s,
					onChange: (e) => c(e.target.value),
					placeholder: "Rechercher une connexion…"
				})] }) : null]
			}),
			/* @__PURE__ */ (0, g.jsx)("ul", {
				className: "mcp-connection-list",
				children: l.map((n) => /* @__PURE__ */ (0, g.jsx)(_, {
					connection: n,
					controller: e,
					selected: t.includes(n.id),
					disabled: o,
					onToggle: () => i(n.id)
				}, n.id))
			}),
			!e.loading && !l.length ? /* @__PURE__ */ (0, g.jsx)("p", {
				className: "mcp-note",
				children: e.connections.length ? "Aucune connexion ne correspond à cette recherche." : "Aucun serveur MCP connecté pour le moment."
			}) : null,
			/* @__PURE__ */ (0, g.jsx)("h4", { children: "Ajouter un serveur" }),
			/* @__PURE__ */ (0, g.jsx)("div", {
				className: "mcp-preset-grid",
				children: e.presets.map((t) => /* @__PURE__ */ (0, g.jsxs)("button", {
					type: "button",
					disabled: o || !e.supported || !!e.active,
					onClick: () => a && ["notion", "linear"].includes(t.id) ? a(t.id) : void e.connect({ provider: t.id }),
					children: [/* @__PURE__ */ (0, g.jsx)(n, {
						optionId: t.id,
						size: 28
					}), /* @__PURE__ */ (0, g.jsxs)("span", { children: [t.name, /* @__PURE__ */ (0, g.jsx)("small", { children: a && ["notion", "linear"].includes(t.id) ? "Choisir l’usage et connecter" : "Connecter avec OAuth" })] })]
				}, t.id))
			}),
			/* @__PURE__ */ (0, g.jsx)(v, {
				controller: e,
				disabled: o || !e.supported
			}),
			/* @__PURE__ */ (0, g.jsx)("p", {
				className: "mcp-note",
				children: "Les outils sont disponibles via la connexion ; leur exécution dépend de l’agent. Ces connexions servent au contexte et aux outils de l’agent, pas aux API intégrées dans votre application."
			})
		]
	});
}
//#endregion
//#region studio-ui/src/features/mcp/components/McpPromptSelection.tsx
function b({ connections: e, selectedIds: t, onToggle: r, onManage: a, disabled: o = !1 }) {
	let s = e.filter((e) => e.status === "connected" || t.includes(e.id));
	return /* @__PURE__ */ (0, g.jsxs)("div", {
		className: "mcp-prompt-selection",
		"aria-label": "Serveurs MCP pour ce projet",
		children: [s.map((e) => /* @__PURE__ */ (0, g.jsxs)("button", {
			type: "button",
			className: `mcp-prompt-chip${e.status === "connected" ? "" : " mcp-prompt-chip-unavailable"}`,
			"aria-pressed": t.includes(e.id),
			"aria-label": `Utiliser ${i(e)} pour ce projet`,
			disabled: o || e.status !== "connected" && !t.includes(e.id),
			onClick: () => r(e.id),
			title: `${i(e)} · ${e.status === "connected" ? `${e.tools.length} outils disponibles` : "À reconnecter"}`,
			children: [
				/* @__PURE__ */ (0, g.jsx)(n, {
					optionId: e.provider === "custom" ? "application-mcp" : e.provider,
					size: 18
				}),
				/* @__PURE__ */ (0, g.jsx)("span", { children: i(e) }),
				/* @__PURE__ */ (0, g.jsx)("small", { children: e.status === "connected" ? "Connecté" : "À reconnecter" })
			]
		}, e.id)), /* @__PURE__ */ (0, g.jsx)("button", {
			type: "button",
			className: "mcp-manage",
			disabled: o,
			onClick: (e) => a(e.currentTarget),
			children: s.length ? "Gérer les MCP" : "+ Connecter un MCP"
		})]
	});
}
//#endregion
//#region studio-ui/src/features/mcp/model/guided-mcp.ts
function x(e) {
	let t = e.nativeConnection;
	if (t?.providerId === "notion" && t.url === "https://mcp.notion.com/mcp") return { provider: "notion" };
	if (t?.providerId === "linear" && ["https://mcp.linear.app/mcp", "https://mcp.linear.app/mcp/readonly"].includes(t.url)) return {
		provider: "linear",
		url: t.url
	};
	throw Error("Cette préparation ne propose pas de connexion MCP prise en charge.");
}
//#endregion
export { h as i, b as n, y as r, x as t };
