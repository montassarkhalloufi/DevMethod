import { n as e, r as t, t as n } from "./jsx-runtime-Bz8zB3tG.js";
import { a as r } from "./useMcpSelection-BrYUToXT.js";
import { n as i, t as a } from "./mcp-BH8zszrc.js";
//#region studio-ui/src/features/progress/hooks/useJobProgress.ts
var o = e(), s = t();
function c(e, t, n = 2e3) {
	let [r, i] = (0, s.useState)(null), [a, o] = (0, s.useState)(""), [c, l] = (0, s.useState)(0);
	return (0, s.useEffect)(() => {
		let r = !1, a, s, c = !1, l = async () => {
			if (r || c) return;
			c = !0, s = new AbortController();
			let u = setTimeout(() => s?.abort(), 1e4);
			try {
				let n = await t(e.id, s.signal);
				if (r) return;
				if (n.jobId !== e.id) throw Error("La réponse concerne une autre demande.");
				i((e) => e?.jobId === n.jobId && e.sequence > n.sequence ? e : n), o("");
			} catch {
				r || o("Actualisation interrompue. Le dernier état reçu est conservé.");
			} finally {
				clearTimeout(u), c = !1, !r && n > 0 && ["queued", "running"].includes(e.status) && (a = setTimeout(() => {
					document.hidden || l();
				}, n));
			}
		}, u = () => {
			document.hidden || (clearTimeout(a), l());
		};
		return document.addEventListener("visibilitychange", u), l(), () => {
			r = !0, clearTimeout(a), s?.abort(), document.removeEventListener("visibilitychange", u);
		};
	}, [
		e.id,
		e.status,
		t,
		n,
		c
	]), {
		snapshot: r,
		error: a,
		retry: () => l((e) => e + 1)
	};
}
//#endregion
//#region studio-ui/src/features/progress/components/ProgressView.tsx
var l = n(), u = {
	queued: "En attente de prise en charge",
	running: "Prise en charge confirmée",
	ready: "Résultat disponible",
	failed: "Échec de la demande",
	cancelled: "Demande annulée",
	interrupted: "Demande interrompue"
}, d = {
	read: "Lecture",
	write: "Modification",
	command: "Commande",
	search: "Recherche",
	check: "Contrôle",
	message: "Information"
}, f = new Intl.DateTimeFormat("fr", {
	hour: "2-digit",
	minute: "2-digit",
	second: "2-digit"
});
function p(e) {
	let t = new Date(e);
	return Number.isNaN(t.getTime()) ? "Date inconnue" : f.format(t);
}
function m({ status: e }) {
	return /* @__PURE__ */ (0, l.jsx)("span", {
		className: "progress-state-icon state-" + e,
		"aria-hidden": "true",
		children: e === "completed" ? "✓" : e === "failed" || e === "blocked" ? "!" : e === "running" ? "◷" : "○"
	});
}
function h({ snapshot: e, status: t }) {
	let [n, r] = (0, s.useState)(t === "running"), i = e.plan;
	if (!i) return /* @__PURE__ */ (0, l.jsx)("p", {
		className: "progress-empty",
		children: "Aucun plan transmis. Les étapes apparaîtront quand l’agent les publiera."
	});
	let a = i.steps.filter((e) => e.status === "completed").length, o = {
		pending: "À faire",
		running: t === "running" ? "En cours" : "Non terminée",
		completed: "Terminée",
		blocked: "Bloquée"
	};
	return /* @__PURE__ */ (0, l.jsxs)("details", {
		className: "progress-plan",
		open: n,
		onToggle: (e) => r(e.currentTarget.open),
		children: [
			/* @__PURE__ */ (0, l.jsxs)("summary", { children: [/* @__PURE__ */ (0, l.jsx)("span", { children: "Plan" }), /* @__PURE__ */ (0, l.jsxs)("span", {
				className: "progress-count",
				children: [
					a,
					"/",
					i.steps.length,
					" terminées"
				]
			})] }),
			/* @__PURE__ */ (0, l.jsx)("p", {
				className: "progress-plan-title",
				children: i.title
			}),
			/* @__PURE__ */ (0, l.jsx)("ol", { children: i.steps.map((e) => /* @__PURE__ */ (0, l.jsxs)("li", {
				className: "progress-step step-" + e.status,
				children: [/* @__PURE__ */ (0, l.jsx)(m, { status: e.status === "running" && t !== "running" ? "pending" : e.status }), /* @__PURE__ */ (0, l.jsxs)("span", { children: [e.title, /* @__PURE__ */ (0, l.jsx)("small", { children: o[e.status] })] })]
			}, e.id)) }),
			/* @__PURE__ */ (0, l.jsx)("p", {
				className: "progress-note",
				children: "Avancement déclaré par l’agent. Les preuves restent dans Vérifications."
			})
		]
	});
}
function g({ action: e, status: t, canOpen: n, onOpen: r }) {
	let i = e.status === "failed" ? "Échec" : e.status === "completed" ? "Terminée" : t === "running" ? "En cours" : "Sans résultat final";
	return /* @__PURE__ */ (0, l.jsxs)("li", {
		className: "progress-action",
		children: [/* @__PURE__ */ (0, l.jsx)(m, { status: e.status === "running" && t !== "running" ? "pending" : e.status }), /* @__PURE__ */ (0, l.jsxs)("div", { children: [
			/* @__PURE__ */ (0, l.jsxs)("span", {
				className: "progress-action-kind",
				children: [
					d[e.kind],
					" · ",
					i
				]
			}),
			/* @__PURE__ */ (0, l.jsx)("span", {
				className: "progress-action-label",
				children: e.label
			}),
			e.path ? /* @__PURE__ */ (0, l.jsx)("code", {
				title: e.path,
				children: e.path
			}) : null,
			/* @__PURE__ */ (0, l.jsxs)("div", {
				className: "progress-action-meta",
				children: [/* @__PURE__ */ (0, l.jsx)("time", {
					dateTime: e.at,
					children: p(e.at)
				}), n ? /* @__PURE__ */ (0, l.jsx)("button", {
					type: "button",
					onClick: r,
					title: "Voir ce fichier dans la version livrée",
					children: "Ouvrir le fichier ↗"
				}) : null]
			})
		] })]
	});
}
function _({ snapshot: e, job: t, revisions: n, onOpenFile: r }) {
	let [i, a] = (0, s.useState)(12), o = e.actions.slice(-i), c = n.slice().reverse().find((e) => e.jobId === t.id);
	return /* @__PURE__ */ (0, l.jsxs)("details", {
		className: "progress-actions",
		children: [/* @__PURE__ */ (0, l.jsxs)("summary", { children: [/* @__PURE__ */ (0, l.jsx)("span", { children: "Journal des actions" }), /* @__PURE__ */ (0, l.jsxs)("span", {
			className: "progress-count",
			children: [e.truncated ? "Dernières " : "", e.actions.length]
		})] }), e.actions.length ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
			e.actions.length > i ? /* @__PURE__ */ (0, l.jsx)("button", {
				className: "progress-earlier",
				type: "button",
				onClick: () => a((e) => e + 20),
				children: "Voir les actions précédentes"
			}) : null,
			/* @__PURE__ */ (0, l.jsx)("ol", { children: o.map((n) => /* @__PURE__ */ (0, l.jsx)(g, {
				action: n,
				status: e.status,
				canOpen: !!(n.path && c?.files.some((e) => e.path === n.path)),
				onOpen: () => n.path && r(t.id, n.path)
			}, n.id)) }),
			e.truncated ? /* @__PURE__ */ (0, l.jsx)("p", {
				className: "progress-note",
				children: "Le journal est limité aux 200 dernières actions."
			}) : null
		] }) : /* @__PURE__ */ (0, l.jsx)("p", {
			className: "progress-empty",
			children: "Aucune action transmise pour cette demande."
		})]
	});
}
function v(e, t) {
	return ["queued", "running"].includes(e.status) ? t?.status ?? e.status : e.status;
}
function y({ job: e, ...t }) {
	let { snapshot: n, error: r, retry: i } = c(e, t.loadProgress, t.pollMs), a = n?.jobId === e.id ? n : null, o = v(e, a), s = a?.plan?.steps.find((e) => e.status === "running");
	return /* @__PURE__ */ (0, l.jsxs)("div", {
		className: "progress-job",
		children: [
			/* @__PURE__ */ (0, l.jsx)("p", {
				className: "progress-request",
				title: e.request,
				children: e.request
			}),
			/* @__PURE__ */ (0, l.jsx)("div", {
				className: "progress-job-status status-" + o,
				role: "status",
				children: u[o]
			}),
			e.worker ? /* @__PURE__ */ (0, l.jsxs)("p", {
				className: "progress-worker",
				children: ["Agent · ", e.worker]
			}) : null,
			o === "queued" ? /* @__PURE__ */ (0, l.jsx)("p", {
				className: "progress-empty",
				children: "La demande attend un agent. Aucune exécution n’a commencé."
			}) : null,
			r ? /* @__PURE__ */ (0, l.jsxs)("div", {
				className: "progress-error",
				role: "status",
				children: [/* @__PURE__ */ (0, l.jsx)("p", { children: r }), /* @__PURE__ */ (0, l.jsx)("button", {
					type: "button",
					onClick: i,
					children: "Réessayer"
				})]
			}) : null,
			a ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: [
				s && o === "running" ? /* @__PURE__ */ (0, l.jsxs)("p", {
					className: "progress-current",
					children: [/* @__PURE__ */ (0, l.jsx)(m, { status: "running" }), /* @__PURE__ */ (0, l.jsx)("span", { children: s.title })]
				}) : null,
				/* @__PURE__ */ (0, l.jsx)(h, {
					snapshot: a,
					status: o
				}),
				/* @__PURE__ */ (0, l.jsx)(_, {
					snapshot: {
						...a,
						status: o
					},
					job: e,
					revisions: t.revisions,
					onOpenFile: t.onOpenFile
				}),
				/* @__PURE__ */ (0, l.jsxs)("p", {
					className: "progress-received",
					children: [a.updatedAt ? /* @__PURE__ */ (0, l.jsxs)(l.Fragment, { children: ["Dernier événement : ", /* @__PURE__ */ (0, l.jsx)("time", {
						dateTime: a.updatedAt,
						children: p(a.updatedAt)
					})] }) : "Aucun événement reçu.", !r && o === "running" ? " · Actualisation automatique" : ""]
				})
			] }) : r ? null : /* @__PURE__ */ (0, l.jsx)("p", {
				className: "progress-empty",
				children: "Lecture de l’avancement…"
			})
		]
	});
}
function b(e) {
	let [t, n] = (0, s.useState)(null), r = e.jobs.find((e) => e.id === t) ?? e.jobs.find((e) => e.status === "running") ?? e.jobs.find((e) => e.status === "queued") ?? e.jobs.at(-1);
	return r ? /* @__PURE__ */ (0, l.jsxs)("section", {
		className: "job-progress-card",
		"aria-label": "Plan et avancement",
		children: [
			/* @__PURE__ */ (0, l.jsxs)("div", {
				className: "progress-heading",
				children: [/* @__PURE__ */ (0, l.jsx)("h2", { children: "Plan et avancement" }), /* @__PURE__ */ (0, l.jsx)("span", {
					className: "progress-agent-badge",
					children: "Agent"
				})]
			}),
			e.jobs.length > 1 ? /* @__PURE__ */ (0, l.jsxs)("label", {
				className: "progress-job-picker",
				children: ["Demande suivie", /* @__PURE__ */ (0, l.jsx)("select", {
					value: r.id,
					onChange: (e) => n(e.target.value),
					children: e.jobs.slice().reverse().map((e) => /* @__PURE__ */ (0, l.jsx)("option", {
						value: e.id,
						children: e.request.length > 65 ? e.request.slice(0, 65) + "…" : e.request
					}, e.id))
				})]
			}) : null,
			e.renderInteractions?.(r),
			/* @__PURE__ */ (0, l.jsx)(y, {
				job: r,
				...e
			}, r.id)
		]
	}) : null;
}
//#endregion
//#region studio-ui/src/progress-widget.tsx
function x(e) {
	return /* @__PURE__ */ (0, l.jsxs)("div", { children: [/* @__PURE__ */ (0, l.jsx)(r, {
		jobId: e.id,
		renderConnection: (e) => /* @__PURE__ */ (0, l.jsx)(a, { preparation: e })
	}), /* @__PURE__ */ (0, l.jsx)(i, {
		jobId: e.id,
		running: e.status === "running"
	})] }, "interactions:" + e.id);
}
function S(e) {
	let t = (0, o.createRoot)(e);
	return {
		update(e) {
			t.render(/* @__PURE__ */ (0, l.jsx)(b, {
				...e,
				renderInteractions: x
			}));
		},
		dispose() {
			t.unmount();
		}
	};
}
//#endregion
export { S as mountProgressWidget };
