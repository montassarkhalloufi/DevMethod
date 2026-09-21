import { i as e, n as t, r as n, t as r } from "./jsx-runtime-DZd2gj5L.js";
import { c as i, r as a, s as o } from "./i18n-CRhBcIYq.js";
import { t as s } from "./error-messages-CtvOKk7F.js";
//#region studio-ui/src/features/agent/model/ui-messages.ts
var c = t(), l = {
	Configuration: "Configuration",
	"Réessayez.": "Retry.",
	"Connexion impossible. Vérifiez l’état et réessayez.": "Connection failed. Check status and retry.",
	"Action impossible. Réessayez.": "Action failed. Retry."
};
function u(e, t) {
	if (!e) return e;
	if (Object.hasOwn(l, e)) return o(e, l[e] ?? e, void 0, t);
	for (let [n, r] of Object.entries(l)) {
		if (n.endsWith(" ") && e.startsWith(n)) return o(n, r, void 0, t) + (u(e.slice(n.length), t) ?? "");
		if (n.startsWith(" ") && e.endsWith(n)) return (u(e.slice(0, -n.length), t) ?? "") + o(n, r, void 0, t);
	}
	return s(i(e, t), t);
}
//#endregion
//#region studio-ui/src/features/agent/hooks/useAgentConfiguration.ts
var d = e();
async function f(e, t, n, r = "en") {
	let i = await fetch("/api/agent/" + e, {
		method: "POST",
		credentials: "same-origin",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(t),
		signal: n
	}), a = await i.json();
	if (!i.ok || !a.settings || !a.availability) throw Error(a.error || o("Connexion impossible. Vérifiez l’état et réessayez.", "Connection failed. Check status and retry.", void 0, r));
	return a;
}
function p({ agent: e, onStatus: t }) {
	let { locale: r } = n(), [i, a] = (0, d.useState)(null), [o, s] = (0, d.useState)(null), [c, l] = (0, d.useState)(""), p = (0, d.useRef)(null), m = i ?? e.settings, h = i !== null, g = i !== null && i.version !== e.settings.version;
	(0, d.useEffect)(() => () => p.current?.abort(), []), (0, d.useEffect)(() => {
		if (!h) return;
		let e = (e) => {
			e.preventDefault(), e.returnValue = "";
		};
		return window.addEventListener("beforeunload", e), () => window.removeEventListener("beforeunload", e);
	}, [h]);
	async function _(e, n) {
		if (p.current) return;
		let r = document.activeElement, i = new AbortController();
		p.current = i, s(e), l("");
		try {
			let r = await f(e, n, i.signal, "fr");
			if (i.signal.aborted) return;
			e === "configure" && a(null), t(r);
		} catch (e) {
			i.signal.aborted || l(e instanceof Error ? e.message : "Action impossible. Réessayez.");
		} finally {
			i.signal.aborted || (s(null), requestAnimationFrame(() => {
				document.activeElement === document.body && r instanceof HTMLElement && r.isConnected && r.focus();
			})), p.current === i && (p.current = null);
		}
	}
	return {
		settings: m,
		stale: g,
		pending: o,
		error: u(c, r),
		edit(e, t) {
			a({
				...m,
				[e]: t
			});
		},
		reload() {
			a(null), l("");
		},
		probe: () => _("probe", {}),
		configure: () => _("configure", {
			...m,
			enabled: !0,
			access: e.availability.access
		}),
		stop: () => _("configure", {
			...e.settings,
			enabled: !1
		})
	};
}
//#endregion
//#region studio-ui/src/features/agent/model/contracts.ts
function m(e, t = "en") {
	return e === "chatgpt" ? o("Abonnement ChatGPT", "ChatGPT subscription", void 0, t) : e === "api-key" ? o("Clé API · facturation OpenAI Platform", "API key · OpenAI Platform billing", void 0, t) : o("Type d’accès inconnu", "Unknown access type", void 0, t);
}
//#endregion
//#region studio-ui/src/features/agent/components/AgentConfiguration.tsx
var h = r();
function g({ availability: e }) {
	let { t, locale: r } = n();
	return /* @__PURE__ */ (0, h.jsxs)(h.Fragment, { children: [
		/* @__PURE__ */ (0, h.jsxs)("p", { children: [
			/* @__PURE__ */ (0, h.jsx)("strong", { children: t("Codex local", "Local Codex") }),
			" ·",
			" ",
			e.available === null ? t("À vérifier", "To check") : e.available ? t("Installé", "Installed") : t("Indisponible", "Unavailable"),
			" · ",
			e.connected ? t("Connecté", "Connected") : t("Connexion non établie", "Connection not established")
		] }),
		/* @__PURE__ */ (0, h.jsxs)("p", { children: [m(e.access, r), e.version ? " · " + e.version : ""] }),
		e.checkedAt ? /* @__PURE__ */ (0, h.jsxs)("p", { children: [
			t("Vérifié le", "Checked on"),
			" ",
			new Date(e.checkedAt).toLocaleString(r)
		] }) : null,
		e.message ? /* @__PURE__ */ (0, h.jsx)("p", { children: u(e.message, r) }) : null
	] });
}
function _(e) {
	return Number.isFinite(e) ? e : "";
}
function v(e) {
	let { t, locale: r } = n(), { agent: i } = e, a = p(e), o = a.pending !== null || i.configuring, s = i.availability, c = s.available === !0 && s.connected && s.access !== "unknown";
	return /* @__PURE__ */ (0, h.jsxs)("section", {
		className: "agent-settings",
		"aria-label": t("Configuration de Codex", "Codex configuration"),
		children: [
			/* @__PURE__ */ (0, h.jsx)(g, { availability: s }),
			/* @__PURE__ */ (0, h.jsx)("button", {
				type: "button",
				disabled: o,
				onClick: () => void a.probe(),
				children: a.pending === "probe" ? t("Vérification…", "Checking…") : t("Vérifier l’installation et la connexion", "Check installation and connection")
			}),
			/* @__PURE__ */ (0, h.jsx)("p", {
				id: "agent-access-help",
				children: t("Studio réutilise votre accès Codex existant, sans quota supplémentaire. Une connexion ChatGPT ne nécessite pas de clé API. Aucun changement automatique de type d’accès.", "Studio reuses your existing Codex access with no additional quota. A ChatGPT connection needs no API key. Access type never changes automatically.")
			}),
			i.historicalBudget ? /* @__PURE__ */ (0, h.jsx)("p", {
				role: "status",
				children: t("Cette campagne possède des limites historiques. Son budget ne peut pas être rouvert ici.", "This campaign has historical limits. Its budget cannot be reopened here.")
			}) : null,
			/* @__PURE__ */ (0, h.jsx)("form", {
				onSubmit: (e) => {
					e.preventDefault(), a.configure();
				},
				"aria-describedby": "agent-limits-help agent-access-help",
				children: /* @__PURE__ */ (0, h.jsxs)("fieldset", {
					disabled: o || i.running || i.historicalBudget,
					children: [
						/* @__PURE__ */ (0, h.jsx)("legend", { children: t("Limites de cette exécution locale", "Limits for this local execution") }),
						/* @__PURE__ */ (0, h.jsxs)("div", {
							className: "agent-settings-fields",
							children: [
								/* @__PURE__ */ (0, h.jsxs)("label", { children: [t("Nombre maximal de jobs", "Maximum jobs"), /* @__PURE__ */ (0, h.jsx)("input", {
									name: "maxJobs",
									type: "number",
									min: "1",
									step: "1",
									required: !0,
									autoComplete: "off",
									value: _(a.settings.maxJobs),
									onChange: (e) => a.edit("maxJobs", e.target.valueAsNumber)
								})] }),
								/* @__PURE__ */ (0, h.jsxs)("label", { children: [t("Seuil d’admission en tokens", "Token admission threshold"), /* @__PURE__ */ (0, h.jsx)("input", {
									name: "maxTokens",
									type: "number",
									min: "1",
									step: "1",
									required: !0,
									autoComplete: "off",
									value: _(a.settings.maxTokens),
									onChange: (e) => a.edit("maxTokens", e.target.valueAsNumber)
								})] }),
								/* @__PURE__ */ (0, h.jsxs)("label", { children: [t("Durée maximale par job (secondes)", "Maximum job duration (seconds)"), /* @__PURE__ */ (0, h.jsx)("input", {
									name: "timeoutSeconds",
									type: "number",
									min: "1",
									step: "1",
									required: !0,
									autoComplete: "off",
									value: _(a.settings.timeoutMs / 1e3),
									onChange: (e) => a.edit("timeoutMs", e.target.valueAsNumber * 1e3)
								})] })
							]
						}),
						/* @__PURE__ */ (0, h.jsx)("p", {
							id: "agent-limits-help",
							children: t("Le seuil en tokens bloque les appels suivants selon l’usage connu ; il ne constitue pas un plafond dur imposé au fournisseur. Les limites du compte Codex restent applicables.", "The token threshold blocks subsequent calls based on known usage; it is not a hard provider-enforced ceiling. Codex account limits still apply.")
						}),
						a.stale ? /* @__PURE__ */ (0, h.jsx)("p", {
							role: "alert",
							children: t("Les limites ont changé ailleurs. Votre saisie est conservée. Rechargez les limites enregistrées avant de continuer.", "Limits changed elsewhere. Your entries are retained. Reload saved limits before continuing.")
						}) : null,
						/* @__PURE__ */ (0, h.jsxs)("p", { children: [
							t("Accès à autoriser :", "Access to authorize:"),
							" ",
							/* @__PURE__ */ (0, h.jsx)("strong", { children: m(s.access, r) }),
							"."
						] }),
						/* @__PURE__ */ (0, h.jsxs)("div", {
							className: "agent-settings-actions",
							children: [/* @__PURE__ */ (0, h.jsx)("button", {
								type: "submit",
								className: "primary",
								disabled: !c || a.stale,
								children: a.pending === "configure" ? t("Enregistrement…", "Saving…") : i.settings.enabled ? t("Enregistrer les limites", "Save limits") : t("Activer Codex avec ces limites", "Enable Codex with these limits")
							}), /* @__PURE__ */ (0, h.jsx)("button", {
								type: "button",
								onClick: a.reload,
								children: t("Recharger les limites enregistrées", "Reload saved limits")
							})]
						})
					]
				})
			}),
			i.settings.enabled || i.running ? /* @__PURE__ */ (0, h.jsx)("button", {
				type: "button",
				disabled: o,
				onClick: () => void a.stop(),
				children: i.running ? t("Arrêter l’agent et suspendre les appels", "Stop the agent and suspend calls") : t("Désactiver les appels automatiques", "Disable automatic calls")
			}) : null,
			i.running ? /* @__PURE__ */ (0, h.jsx)("p", { children: t("Un job est en cours. Arrêtez-le avant de modifier les limites ; son travail reste conservé.", "A job is running. Stop it before changing limits; its work is retained.") }) : null,
			/* @__PURE__ */ (0, h.jsx)("p", {
				role: "status",
				"aria-live": "polite",
				children: a.error || (o ? t("Action en cours…", "Action in progress…") : u(i.message, r) || "")
			})
		]
	});
}
//#endregion
//#region studio-ui/src/agent-widget.tsx
function y(e) {
	a(e.ownerDocument, e.ownerDocument.defaultView ?? void 0);
	let t = (0, c.createRoot)(e);
	return {
		update(e) {
			t.render(/* @__PURE__ */ (0, h.jsx)(v, { ...e }));
		},
		dispose() {
			t.unmount();
		}
	};
}
//#endregion
export { y as mountAgentWidget };
