import { r as e, t } from "./jsx-runtime-Bz8zB3tG.js";
import { t as n } from "./ConnectorIcon-CFT0KtGV.js";
//#region studio-ui/src/features/mcp/model/mcp.ts
var r = e();
function i(e) {
	return {
		id: e.id,
		provider: e.provider,
		auth: e.auth,
		...e.provider === "custom" ? {
			name: e.name,
			url: e.url
		} : {}
	};
}
function a(e) {
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
function o(e) {
	let t = e;
	if (!t || !Array.isArray(t.connections) || !Array.isArray(t.presets)) throw Error("La liste des serveurs MCP est indisponible.");
	return {
		presets: t.presets.filter((e) => e && [
			"notion",
			"linear",
			"sentry"
		].includes(e.id) && typeof e.name == "string" && typeof e.url == "string"),
		connections: t.connections.map(a),
		supported: t.supported !== !1
	};
}
function s(e) {
	if (typeof e != "string") throw Error("Le serveur n’a pas renvoyé d’adresse d’autorisation.");
	let t = new URL(e), n = [
		"127.0.0.1",
		"localhost",
		"[::1]"
	].includes(t.hostname);
	if (t.protocol !== "https:" && !(n && t.protocol === "http:") || t.username || t.password || e.includes("\\")) throw Error("L’adresse d’autorisation renvoyée est invalide.");
	return t.href;
}
var c = {
	disconnected: "Déconnecté",
	connecting: "Connexion en cours",
	"authorization-required": "Autorisation attendue",
	connected: "Connecté",
	error: "Connexion à rétablir"
};
function l(e) {
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
async function u(e, t, n) {
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
function d(e) {
	return new Promise((t) => {
		let n = () => {
			window.clearTimeout(r), e.removeEventListener("abort", n), t();
		}, r = window.setTimeout(n, 2e3);
		e.addEventListener("abort", n, { once: !0 }), e.aborted && n();
	});
}
function f() {
	let e = window.open("about:blank", "_blank", "popup,width=600,height=760");
	if (!e) throw Error("Autorisez les fenêtres de connexion pour ce site, puis réessayez.");
	return e.opener = null, e.document.title = "Connexion du serveur MCP", e.document.body.textContent = "Préparation de votre connexion sécurisée…", e;
}
function p(e, t) {
	let n = s(t);
	if (!e || e.closed) throw Error("La fenêtre de connexion a été fermée. Reconnectez le serveur pour reprendre.");
	e.location.assign(n);
}
function m(e, t) {
	let [n, i] = (0, r.useState)({
		presets: [],
		connections: [],
		supported: !0
	}), [s, c] = (0, r.useState)(!0), [l, m] = (0, r.useState)(""), [h, g] = (0, r.useState)(null), _ = (0, r.useRef)(null), v = (0, r.useRef)(null), y = (0, r.useRef)(null), b = (0, r.useRef)(e), x = (0, r.useRef)(t);
	(0, r.useEffect)(() => {
		b.current = e, x.current = t;
	}, [e, t]);
	let S = (0, r.useCallback)(async () => {
		_.current?.abort();
		let e = new AbortController();
		_.current = e, c(!0);
		try {
			let t = o(await u("", e.signal));
			e.signal.aborted || (i(t), m(""));
		} catch (t) {
			e.signal.aborted || m(t instanceof Error ? t.message : "État MCP indisponible.");
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
			if (await d(t.signal), t.signal.aborted) return;
			let n = o(await u("", t.signal));
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
		v.current = t, m(""), g({
			id: e.id || null,
			authorizing: !1
		});
		try {
			(e.auth || "oauth") === "oauth" && (y.current = f());
			let n = await u("/connect", t.signal, e);
			if (t.signal.aborted) return;
			let r = a(n.connection);
			if (C(r), r.status === "connected") {
				y.current?.close(), b.current(r.id);
				return;
			}
			if (n.authorizationUrl) p(y.current, n.authorizationUrl), g({
				id: r.id,
				authorizing: !0
			}), await w(r.id, t);
			else if (r.status === "connecting") g({
				id: r.id,
				authorizing: !1
			}), await w(r.id, t);
			else throw Error(r.error?.message || "L’autorisation est nécessaire. Reconnectez le serveur.");
		} catch (e) {
			y.current?.close(), t.signal.aborted || m(e instanceof Error ? e.message : "Connexion MCP interrompue.");
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
		}), m("");
		try {
			let r = await u("/" + t, n.signal, { id: e });
			if (n.signal.aborted) return;
			let i = a(r.connection);
			C(i), t === "disconnect" && x.current(e), r.authorizationUrl && m("Une nouvelle autorisation est nécessaire. Cliquez sur Reconnecter."), i.status === "error" && m(i.error?.message || "La connexion doit être rétablie.");
		} catch (e) {
			n.signal.aborted || m(e instanceof Error ? e.message : "Mise à jour MCP impossible.");
		} finally {
			v.current === n && (v.current = null, g(null));
		}
	}
	return {
		...n,
		loading: s,
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
var h = t();
function g({ connection: e, controller: t, selected: a, disabled: o, onToggle: s }) {
	let l = t.active, [u, d] = (0, r.useState)(!1), f = e.status === "connected";
	return /* @__PURE__ */ (0, h.jsxs)("li", {
		className: "mcp-connection-row",
		children: [
			/* @__PURE__ */ (0, h.jsxs)("div", {
				className: "mcp-connection-heading",
				children: [/* @__PURE__ */ (0, h.jsx)(n, {
					optionId: e.provider === "custom" ? "application-mcp" : e.provider,
					size: 32
				}), /* @__PURE__ */ (0, h.jsxs)("div", { children: [/* @__PURE__ */ (0, h.jsx)("strong", { children: e.name }), /* @__PURE__ */ (0, h.jsxs)("span", {
					className: `mcp-status mcp-status-${e.status}`,
					children: [c[e.status], f ? ` · ${e.tools.length} outil${e.tools.length > 1 ? "s" : ""}` : ""]
				})] })]
			}),
			/* @__PURE__ */ (0, h.jsx)("p", {
				className: "mcp-server-url",
				title: e.url,
				children: e.url
			}),
			e.error ? /* @__PURE__ */ (0, h.jsx)("p", {
				className: "mcp-connection-error",
				children: e.error.message
			}) : null,
			f && e.tools.length ? /* @__PURE__ */ (0, h.jsxs)("details", {
				className: "mcp-discovered-tools",
				children: [/* @__PURE__ */ (0, h.jsx)("summary", { children: "Voir les outils disponibles" }), /* @__PURE__ */ (0, h.jsx)("ul", { children: e.tools.map((e) => /* @__PURE__ */ (0, h.jsxs)("li", { children: [/* @__PURE__ */ (0, h.jsx)("strong", { children: e.title || e.name }), e.description ? /* @__PURE__ */ (0, h.jsx)("span", { children: e.description }) : null] }, e.name)) })]
			}) : null,
			/* @__PURE__ */ (0, h.jsxs)("div", {
				className: "mcp-connection-actions",
				children: [/* @__PURE__ */ (0, h.jsxs)("label", {
					className: "mcp-use-connection",
					children: [/* @__PURE__ */ (0, h.jsx)("input", {
						type: "checkbox",
						name: "mcp-connection",
						value: e.id,
						checked: a,
						disabled: o || !f && !a,
						onChange: s
					}), "Utiliser pour ce projet"]
				}), /* @__PURE__ */ (0, h.jsxs)("div", { children: [f ? /* @__PURE__ */ (0, h.jsx)("button", {
					type: "button",
					disabled: o || !!l,
					onClick: () => void t.change(e.id, "refresh"),
					children: "Actualiser les outils"
				}) : /* @__PURE__ */ (0, h.jsx)("button", {
					type: "button",
					disabled: o || !!l,
					onClick: () => e.auth === "bearer" ? d(!0) : void t.connect(i(e)),
					children: "Reconnecter"
				}), e.status === "disconnected" ? null : /* @__PURE__ */ (0, h.jsx)("button", {
					type: "button",
					disabled: o || !!(l && l.id !== e.id),
					onClick: () => void t.change(e.id, "disconnect"),
					children: l?.id === e.id ? "Annuler la connexion" : "Déconnecter"
				})] })]
			}),
			u ? /* @__PURE__ */ (0, h.jsx)(_, {
				controller: t,
				disabled: o,
				connection: e,
				onDismiss: () => d(!1)
			}) : null
		]
	});
}
function _({ controller: e, disabled: t, connection: n, onDismiss: i }) {
	let [a, o] = (0, r.useState)(!!n), [s, c] = (0, r.useState)(n?.auth || "oauth"), [u, d] = (0, r.useState)(""), f = (0, r.useRef)(null);
	return /* @__PURE__ */ (0, h.jsxs)("div", {
		className: "mcp-custom-connection",
		children: [n ? null : /* @__PURE__ */ (0, h.jsx)("button", {
			type: "button",
			className: "mcp-add-custom",
			disabled: t,
			"aria-expanded": a,
			onClick: () => o(!a),
			children: "+ Ajouter un serveur personnalisé"
		}), a ? /* @__PURE__ */ (0, h.jsxs)("form", {
			ref: f,
			onSubmit: (r) => {
				if (r.preventDefault(), !(t || e.active)) try {
					let t = l(r.currentTarget);
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
				/* @__PURE__ */ (0, h.jsx)("input", {
					type: "hidden",
					name: "mcp-provider",
					value: "custom"
				}),
				/* @__PURE__ */ (0, h.jsxs)("div", {
					className: "mcp-custom-fields",
					children: [/* @__PURE__ */ (0, h.jsxs)("label", { children: ["Nom du serveur", /* @__PURE__ */ (0, h.jsx)("input", {
						name: "mcp-name",
						defaultValue: n?.name,
						maxLength: 100,
						autoComplete: "off",
						required: !0,
						disabled: t || !!e.active,
						placeholder: "Mon espace documentaire"
					})] }), /* @__PURE__ */ (0, h.jsxs)("label", { children: ["Adresse MCP", /* @__PURE__ */ (0, h.jsx)("input", {
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
				/* @__PURE__ */ (0, h.jsxs)("label", { children: ["Authentification", /* @__PURE__ */ (0, h.jsxs)("select", {
					name: "mcp-auth",
					value: s,
					disabled: t || !!e.active,
					onChange: (e) => c(e.target.value),
					children: [
						/* @__PURE__ */ (0, h.jsx)("option", {
							value: "oauth",
							children: "OAuth · autoriser dans le navigateur"
						}),
						/* @__PURE__ */ (0, h.jsx)("option", {
							value: "bearer",
							children: "Jeton Bearer"
						}),
						/* @__PURE__ */ (0, h.jsx)("option", {
							value: "none",
							children: "Sans authentification"
						})
					]
				})] }),
				s === "bearer" ? /* @__PURE__ */ (0, h.jsxs)("label", { children: [
					"Jeton de connexion",
					/* @__PURE__ */ (0, h.jsx)("input", {
						name: "mcp-token",
						type: "password",
						maxLength: 8192,
						autoComplete: "off",
						spellCheck: !1,
						required: !0,
						disabled: t || !!e.active
					}),
					/* @__PURE__ */ (0, h.jsx)("small", { children: "Transmis au gestionnaire local. Il n’est jamais ajouté à votre demande." })
				] }) : null,
				u ? /* @__PURE__ */ (0, h.jsx)("p", {
					role: "alert",
					className: "mcp-connection-error",
					children: u
				}) : null,
				/* @__PURE__ */ (0, h.jsxs)("div", {
					className: "mcp-form-actions",
					children: [/* @__PURE__ */ (0, h.jsx)("button", {
						type: "button",
						disabled: !!e.active,
						onClick: () => {
							o(!1), i?.();
						},
						children: "Fermer les réglages"
					}), /* @__PURE__ */ (0, h.jsx)("button", {
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
function v({ controller: e, selectedIds: t, onToggle: i, disabled: a = !1 }) {
	let [o, s] = (0, r.useState)(""), c = e.connections.filter((e) => `${e.name} ${e.url}`.toLocaleLowerCase("fr").includes(o.trim().toLocaleLowerCase("fr")));
	return /* @__PURE__ */ (0, h.jsxs)("section", {
		className: "mcp-connections-panel",
		"aria-label": "Serveurs MCP de l’espace",
		children: [
			/* @__PURE__ */ (0, h.jsxs)("div", {
				className: "mcp-panel-heading",
				children: [/* @__PURE__ */ (0, h.jsxs)("div", { children: [/* @__PURE__ */ (0, h.jsx)("h3", { children: "Serveurs MCP de l’espace" }), /* @__PURE__ */ (0, h.jsx)("p", { children: "Connectez vos sources et outils une fois, puis choisissez ceux à utiliser dans chaque projet." })] }), /* @__PURE__ */ (0, h.jsx)("button", {
					type: "button",
					disabled: e.loading || !!e.active,
					onClick: e.refresh,
					children: "Actualiser les connexions"
				})]
			}),
			e.loading ? /* @__PURE__ */ (0, h.jsx)("p", {
				role: "status",
				className: "mcp-note",
				children: "Lecture des connexions…"
			}) : null,
			e.error ? /* @__PURE__ */ (0, h.jsx)("p", {
				role: "alert",
				className: "mcp-connection-error",
				children: e.error
			}) : null,
			e.active ? /* @__PURE__ */ (0, h.jsx)("p", {
				role: "status",
				className: "mcp-active-status",
				children: e.active.authorizing ? "Autorisez l’accès dans la fenêtre ouverte. Cet écran se mettra à jour après confirmation." : "Vérification de la connexion et découverte des outils…"
			}) : null,
			e.supported ? null : /* @__PURE__ */ (0, h.jsx)("p", {
				className: "mcp-note",
				children: "Ouvrez ce projet depuis l’accueil Studio pour accéder aux connexions de l’espace."
			}),
			/* @__PURE__ */ (0, h.jsxs)("div", {
				className: "mcp-connected-heading",
				children: [/* @__PURE__ */ (0, h.jsxs)("h4", { children: ["Connexions de l’espace ", /* @__PURE__ */ (0, h.jsx)("span", { children: e.connections.length })] }), e.connections.length > 3 ? /* @__PURE__ */ (0, h.jsxs)("label", { children: [/* @__PURE__ */ (0, h.jsx)("span", {
					className: "mcp-sr",
					children: "Rechercher un serveur MCP"
				}), /* @__PURE__ */ (0, h.jsx)("input", {
					type: "search",
					value: o,
					onChange: (e) => s(e.target.value),
					placeholder: "Rechercher une connexion…"
				})] }) : null]
			}),
			/* @__PURE__ */ (0, h.jsx)("ul", {
				className: "mcp-connection-list",
				children: c.map((n) => /* @__PURE__ */ (0, h.jsx)(g, {
					connection: n,
					controller: e,
					selected: t.includes(n.id),
					disabled: a,
					onToggle: () => i(n.id)
				}, n.id))
			}),
			!e.loading && !c.length ? /* @__PURE__ */ (0, h.jsx)("p", {
				className: "mcp-note",
				children: e.connections.length ? "Aucune connexion ne correspond à cette recherche." : "Aucun serveur MCP connecté pour le moment."
			}) : null,
			/* @__PURE__ */ (0, h.jsx)("h4", { children: "Ajouter un serveur" }),
			/* @__PURE__ */ (0, h.jsx)("div", {
				className: "mcp-preset-grid",
				children: e.presets.map((t) => /* @__PURE__ */ (0, h.jsxs)("button", {
					type: "button",
					disabled: a || !e.supported || !!e.active,
					onClick: () => void e.connect({ provider: t.id }),
					children: [/* @__PURE__ */ (0, h.jsx)(n, {
						optionId: t.id,
						size: 28
					}), /* @__PURE__ */ (0, h.jsxs)("span", { children: [t.name, /* @__PURE__ */ (0, h.jsx)("small", { children: "Connecter avec OAuth" })] })]
				}, t.id))
			}),
			/* @__PURE__ */ (0, h.jsx)(_, {
				controller: e,
				disabled: a || !e.supported
			}),
			/* @__PURE__ */ (0, h.jsx)("p", {
				className: "mcp-note",
				children: "Les outils sont disponibles via la connexion ; leur exécution dépend de l’agent. Ces connexions servent au contexte et aux outils de l’agent, pas aux API intégrées dans votre application."
			})
		]
	});
}
//#endregion
//#region studio-ui/src/features/mcp/components/McpPromptSelection.tsx
function y({ connections: e, selectedIds: t, onToggle: r, onManage: i, disabled: a = !1 }) {
	let o = e.filter((e) => e.status === "connected" || t.includes(e.id));
	return /* @__PURE__ */ (0, h.jsxs)("div", {
		className: "mcp-prompt-selection",
		"aria-label": "Serveurs MCP pour ce projet",
		children: [o.map((e) => /* @__PURE__ */ (0, h.jsxs)("button", {
			type: "button",
			className: `mcp-prompt-chip${e.status === "connected" ? "" : " mcp-prompt-chip-unavailable"}`,
			"aria-pressed": t.includes(e.id),
			"aria-label": `Utiliser ${e.name} pour ce projet`,
			disabled: a || e.status !== "connected" && !t.includes(e.id),
			onClick: () => r(e.id),
			title: `${e.name} · ${e.status === "connected" ? `${e.tools.length} outils disponibles` : "À reconnecter"}`,
			children: [
				/* @__PURE__ */ (0, h.jsx)(n, {
					optionId: e.provider === "custom" ? "application-mcp" : e.provider,
					size: 18
				}),
				/* @__PURE__ */ (0, h.jsx)("span", { children: e.name }),
				/* @__PURE__ */ (0, h.jsx)("small", { children: e.status === "connected" ? "Connecté" : "À reconnecter" })
			]
		}, e.id)), /* @__PURE__ */ (0, h.jsx)("button", {
			type: "button",
			className: "mcp-manage",
			disabled: a,
			onClick: (e) => i(e.currentTarget),
			children: o.length ? "Gérer les MCP" : "+ Connecter un MCP"
		})]
	});
}
//#endregion
export { v as n, m as r, y as t };
