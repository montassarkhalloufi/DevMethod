import { i as e, n as t, r as n, t as r } from "./jsx-runtime-DZd2gj5L.js";
import { r as i, s as a } from "./i18n-CRhBcIYq.js";
import { a as o } from "./useMcpSelection-CKOOWESs.js";
import { n as s, t as c } from "./mcp-MPHsJQgm.js";
//#region studio-ui/src/features/progress/hooks/useJobProgress.ts
var l = t(), u = e();
function d(e, t, r = 2e3) {
	let { t: i } = n(), [a, o] = (0, u.useState)(null), [s, c] = (0, u.useState)(!1), [l, d] = (0, u.useState)(0);
	return (0, u.useEffect)(() => {
		let n = !1, i, a, s = !1, l = async () => {
			if (n || s) return;
			s = !0, a = new AbortController();
			let u = setTimeout(() => a?.abort(), 1e4);
			try {
				let r = await t(e.id, a.signal);
				if (n) return;
				if (r.jobId !== e.id) throw Error("Progress response belongs to another request.");
				o((e) => e?.jobId === r.jobId && e.sequence > r.sequence ? e : r), c(!1);
			} catch {
				n || c(!0);
			} finally {
				clearTimeout(u), s = !1, !n && r > 0 && ["queued", "running"].includes(e.status) && (i = setTimeout(() => {
					document.hidden || l();
				}, r));
			}
		}, u = () => {
			document.hidden || (clearTimeout(i), l());
		};
		return document.addEventListener("visibilitychange", u), l(), () => {
			n = !0, clearTimeout(i), a?.abort(), document.removeEventListener("visibilitychange", u);
		};
	}, [
		e.id,
		e.status,
		t,
		r,
		l
	]), {
		snapshot: a,
		error: s ? i("Actualisation interrompue. Le dernier état reçu est conservé.", "Updates interrupted. The last received state is preserved.") : "",
		retry: () => d((e) => e + 1)
	};
}
//#endregion
//#region studio-ui/src/features/progress/components/ProgressView.tsx
var f = r();
function p(e = "en") {
	return {
		queued: a("En attente de prise en charge", "Waiting to be picked up", void 0, e),
		running: a("Prise en charge confirmée", "Agent has started", void 0, e),
		ready: a("Résultat disponible", "Result available", void 0, e),
		failed: a("Échec de la demande", "Request failed", void 0, e),
		cancelled: a("Demande annulée", "Request cancelled", void 0, e),
		interrupted: a("Demande interrompue", "Request interrupted", void 0, e)
	};
}
function m(e = "en") {
	return {
		read: a("Lecture", "Reading", void 0, e),
		write: a("Modification", "Editing", void 0, e),
		command: a("Commande", "Command", void 0, e),
		search: a("Recherche", "Search", void 0, e),
		check: a("Contrôle", "Check", void 0, e),
		message: a("Information", "Information", void 0, e)
	};
}
var h = (e) => new Intl.DateTimeFormat(e, {
	hour: "2-digit",
	minute: "2-digit",
	second: "2-digit"
});
function g(e, t = "en") {
	let n = new Date(e);
	return Number.isNaN(n.getTime()) ? a("Date inconnue", "Unknown date", void 0, t) : h(t).format(n);
}
function _({ status: e }) {
	return /* @__PURE__ */ (0, f.jsx)("span", {
		className: "progress-state-icon state-" + e,
		"aria-hidden": "true",
		children: e === "completed" ? "✓" : e === "failed" || e === "blocked" ? "!" : e === "running" ? "◷" : "○"
	});
}
function v({ snapshot: e, status: t }) {
	let { t: r } = n(), [i, a] = (0, u.useState)(t === "running"), o = e.plan;
	if (!o) return /* @__PURE__ */ (0, f.jsxs)("p", {
		className: "progress-empty",
		children: [
			" ",
			r("Aucun plan transmis. Les étapes apparaîtront quand l’agent les publiera.", "No plan received. Steps will appear when the agent publishes them."),
			" "
		]
	});
	let s = o.steps.filter((e) => e.status === "completed").length, c = {
		pending: r("À faire", "To do"),
		running: t === "running" ? r("En cours", "In progress") : r("Non terminée", "Unfinished"),
		completed: r("Terminée", "Completed"),
		blocked: r("Bloquée", "Blocked")
	};
	return /* @__PURE__ */ (0, f.jsxs)("details", {
		className: "progress-plan",
		open: i,
		onToggle: (e) => a(e.currentTarget.open),
		children: [
			/* @__PURE__ */ (0, f.jsxs)("summary", { children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "Plan" }), /* @__PURE__ */ (0, f.jsxs)("span", {
				className: "progress-count",
				children: [
					s,
					"/",
					o.steps.length,
					" ",
					r("terminées", "completed"),
					" "
				]
			})] }),
			/* @__PURE__ */ (0, f.jsx)("p", {
				className: "progress-plan-title",
				children: o.title
			}),
			/* @__PURE__ */ (0, f.jsx)("ol", { children: o.steps.map((e) => /* @__PURE__ */ (0, f.jsxs)("li", {
				className: "progress-step step-" + e.status,
				children: [/* @__PURE__ */ (0, f.jsx)(_, { status: e.status === "running" && t !== "running" ? "pending" : e.status }), /* @__PURE__ */ (0, f.jsxs)("span", { children: [e.title, /* @__PURE__ */ (0, f.jsx)("small", { children: c[e.status] })] })]
			}, e.id)) }),
			/* @__PURE__ */ (0, f.jsxs)("p", {
				className: "progress-note",
				children: [
					" ",
					r("Avancement déclaré par l’agent. Les preuves restent dans Vérifications.", "Progress reported by the agent. Evidence remains in Checks."),
					" "
				]
			})
		]
	});
}
function y({ action: e, status: t, canOpen: r, onOpen: i }) {
	let { locale: a, t: o } = n(), s = e.status === "failed" ? o("Échec", "Failed") : e.status === "completed" ? o("Terminée", "Completed") : t === "running" ? o("En cours", "In progress") : o("Sans résultat final", "No final result");
	return /* @__PURE__ */ (0, f.jsxs)("li", {
		className: "progress-action",
		children: [/* @__PURE__ */ (0, f.jsx)(_, { status: e.status === "running" && t !== "running" ? "pending" : e.status }), /* @__PURE__ */ (0, f.jsxs)("div", { children: [
			/* @__PURE__ */ (0, f.jsxs)("span", {
				className: "progress-action-kind",
				children: [
					m(a)[e.kind],
					" · ",
					s
				]
			}),
			/* @__PURE__ */ (0, f.jsx)("span", {
				className: "progress-action-label",
				children: e.label
			}),
			e.path ? /* @__PURE__ */ (0, f.jsx)("code", {
				title: e.path,
				children: e.path
			}) : null,
			/* @__PURE__ */ (0, f.jsxs)("div", {
				className: "progress-action-meta",
				children: [/* @__PURE__ */ (0, f.jsx)("time", {
					dateTime: e.at,
					children: g(e.at, a)
				}), r ? /* @__PURE__ */ (0, f.jsxs)("button", {
					type: "button",
					onClick: i,
					title: o("Voir ce fichier dans la version livrée", "View this file in the delivered version"),
					children: [
						" ",
						o("Ouvrir le fichier ↗", "Open file ↗"),
						" "
					]
				}) : null]
			})
		] })]
	});
}
function b({ snapshot: e, job: t, revisions: r, onOpenFile: i }) {
	let { t: a } = n(), [o, s] = (0, u.useState)(12), c = e.actions.slice(-o), l = r.slice().reverse().find((e) => e.jobId === t.id);
	return /* @__PURE__ */ (0, f.jsxs)("details", {
		className: "progress-actions",
		children: [/* @__PURE__ */ (0, f.jsxs)("summary", { children: [/* @__PURE__ */ (0, f.jsx)("span", { children: a("Journal des actions", "Action log") }), /* @__PURE__ */ (0, f.jsxs)("span", {
			className: "progress-count",
			children: [e.truncated ? a("Dernières ", "Latest ") : "", e.actions.length]
		})] }), e.actions.length ? /* @__PURE__ */ (0, f.jsxs)(f.Fragment, { children: [
			e.actions.length > o ? /* @__PURE__ */ (0, f.jsxs)("button", {
				className: "progress-earlier",
				type: "button",
				onClick: () => s((e) => e + 20),
				children: [
					" ",
					a("Voir les actions précédentes", "Show earlier actions"),
					" "
				]
			}) : null,
			/* @__PURE__ */ (0, f.jsx)("ol", { children: c.map((n) => /* @__PURE__ */ (0, f.jsx)(y, {
				action: n,
				status: e.status,
				canOpen: !!(n.path && l?.files.some((e) => e.path === n.path)),
				onOpen: () => n.path && i(t.id, n.path)
			}, n.id)) }),
			e.truncated ? /* @__PURE__ */ (0, f.jsx)("p", {
				className: "progress-note",
				children: a("Le journal est limité aux 200 dernières actions.", "The log is limited to the latest 200 actions.")
			}) : null
		] }) : /* @__PURE__ */ (0, f.jsx)("p", {
			className: "progress-empty",
			children: a("Aucune action transmise pour cette demande.", "No actions received for this request.")
		})]
	});
}
function x(e, t) {
	return ["queued", "running"].includes(e.status) ? t?.status ?? e.status : e.status;
}
function S({ job: e, ...t }) {
	let { locale: r, t: i } = n(), { snapshot: a, error: o, retry: s } = d(e, t.loadProgress, t.pollMs), c = a?.jobId === e.id ? a : null, l = x(e, c), u = c?.plan?.steps.find((e) => e.status === "running");
	return /* @__PURE__ */ (0, f.jsxs)("div", {
		className: "progress-job",
		children: [
			/* @__PURE__ */ (0, f.jsx)("p", {
				className: "progress-request",
				title: e.request,
				children: e.request
			}),
			/* @__PURE__ */ (0, f.jsx)("div", {
				className: "progress-job-status status-" + l,
				role: "status",
				children: p(r)[l]
			}),
			e.worker ? /* @__PURE__ */ (0, f.jsxs)("p", {
				className: "progress-worker",
				children: ["Agent · ", e.worker]
			}) : null,
			l === "queued" ? /* @__PURE__ */ (0, f.jsx)("p", {
				className: "progress-empty",
				children: i("La demande attend un agent. Aucune exécution n’a commencé.", "The request is waiting for an agent. Execution has not started.")
			}) : null,
			o ? /* @__PURE__ */ (0, f.jsxs)("div", {
				className: "progress-error",
				role: "status",
				children: [/* @__PURE__ */ (0, f.jsx)("p", { children: o }), /* @__PURE__ */ (0, f.jsxs)("button", {
					type: "button",
					onClick: s,
					children: [
						" ",
						i("Réessayer", "Retry"),
						" "
					]
				})]
			}) : null,
			c ? /* @__PURE__ */ (0, f.jsxs)(f.Fragment, { children: [
				u && l === "running" ? /* @__PURE__ */ (0, f.jsxs)("p", {
					className: "progress-current",
					children: [/* @__PURE__ */ (0, f.jsx)(_, { status: "running" }), /* @__PURE__ */ (0, f.jsx)("span", { children: u.title })]
				}) : null,
				/* @__PURE__ */ (0, f.jsx)(v, {
					snapshot: c,
					status: l
				}),
				/* @__PURE__ */ (0, f.jsx)(b, {
					snapshot: {
						...c,
						status: l
					},
					job: e,
					revisions: t.revisions,
					onOpenFile: t.onOpenFile
				}),
				/* @__PURE__ */ (0, f.jsxs)("p", {
					className: "progress-received",
					children: [c.updatedAt ? /* @__PURE__ */ (0, f.jsxs)(f.Fragment, { children: [
						" ",
						i("Dernier événement :", "Latest event:"),
						" ",
						/* @__PURE__ */ (0, f.jsx)("time", {
							dateTime: c.updatedAt,
							children: g(c.updatedAt, r)
						})
					] }) : i("Aucun événement reçu.", "No events received."), !o && l === "running" ? i(" · Actualisation automatique", " · Updates automatically") : ""]
				})
			] }) : o ? null : /* @__PURE__ */ (0, f.jsx)("p", {
				className: "progress-empty",
				children: i("Lecture de l’avancement…", "Loading progress…")
			})
		]
	});
}
function C(e) {
	let { t } = n(), [r, i] = (0, u.useState)(null), a = e.jobs.find((e) => e.id === r) ?? e.jobs.find((e) => e.status === "running") ?? e.jobs.find((e) => e.status === "queued") ?? e.jobs.at(-1);
	return a ? /* @__PURE__ */ (0, f.jsxs)("section", {
		className: "job-progress-card",
		"aria-label": t("Plan et avancement", "Plan and progress"),
		children: [
			/* @__PURE__ */ (0, f.jsxs)("div", {
				className: "progress-heading",
				children: [/* @__PURE__ */ (0, f.jsx)("h2", { children: t("Plan et avancement", "Plan and progress") }), /* @__PURE__ */ (0, f.jsx)("span", {
					className: "progress-agent-badge",
					children: "Agent"
				})]
			}),
			e.jobs.length > 1 ? /* @__PURE__ */ (0, f.jsxs)("label", {
				className: "progress-job-picker",
				children: [
					" ",
					t("Demande suivie", "Tracked request"),
					" ",
					/* @__PURE__ */ (0, f.jsx)("select", {
						value: a.id,
						onChange: (e) => i(e.target.value),
						children: e.jobs.slice().reverse().map((e) => /* @__PURE__ */ (0, f.jsx)("option", {
							value: e.id,
							children: e.request.length > 65 ? e.request.slice(0, 65) + "…" : e.request
						}, e.id))
					})
				]
			}) : null,
			e.renderInteractions?.(a),
			/* @__PURE__ */ (0, f.jsx)(S, {
				job: a,
				...e
			}, a.id)
		]
	}) : null;
}
//#endregion
//#region studio-ui/src/progress-widget.tsx
function w(e) {
	return /* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)(o, {
		jobId: e.id,
		renderConnection: (e) => /* @__PURE__ */ (0, f.jsx)(c, { preparation: e })
	}), /* @__PURE__ */ (0, f.jsx)(s, {
		jobId: e.id,
		running: e.status === "running"
	})] }, "interactions:" + e.id);
}
function T(e) {
	i(e.ownerDocument, e.ownerDocument.defaultView ?? void 0);
	let t = (0, l.createRoot)(e);
	return {
		update(e) {
			t.render(/* @__PURE__ */ (0, f.jsx)(C, {
				...e,
				renderInteractions: w
			}));
		},
		dispose() {
			t.unmount();
		}
	};
}
//#endregion
export { T as mountProgressWidget };
