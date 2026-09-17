import { n as e, r as t, t as n } from "./jsx-runtime-Bz8zB3tG.js";
//#region studio-ui/src/features/progress/hooks/useJobProgress.ts
var r = e(), i = t();
function a(e, t, n = 2e3) {
	let [r, a] = (0, i.useState)(null), [o, s] = (0, i.useState)(""), [c, l] = (0, i.useState)(0);
	return (0, i.useEffect)(() => {
		let r = !1, i, o, c = !1, l = async () => {
			if (r || c) return;
			c = !0, o = new AbortController();
			let u = setTimeout(() => o?.abort(), 1e4);
			try {
				let n = await t(e.id, o.signal);
				if (r) return;
				if (n.jobId !== e.id) throw Error("La réponse concerne une autre demande.");
				a((e) => e?.jobId === n.jobId && e.sequence > n.sequence ? e : n), s("");
			} catch {
				r || s("Actualisation interrompue. Le dernier état reçu est conservé.");
			} finally {
				clearTimeout(u), c = !1, !r && n > 0 && ["queued", "running"].includes(e.status) && (i = setTimeout(() => {
					document.hidden || l();
				}, n));
			}
		}, u = () => {
			document.hidden || (clearTimeout(i), l());
		};
		return document.addEventListener("visibilitychange", u), l(), () => {
			r = !0, clearTimeout(i), o?.abort(), document.removeEventListener("visibilitychange", u);
		};
	}, [
		e.id,
		e.status,
		t,
		n,
		c
	]), {
		snapshot: r,
		error: o,
		retry: () => l((e) => e + 1)
	};
}
//#endregion
//#region studio-ui/src/features/progress/components/ProgressView.tsx
var o = n(), s = {
	queued: "En attente de prise en charge",
	running: "Prise en charge confirmée",
	ready: "Résultat disponible",
	failed: "Échec de la demande",
	cancelled: "Demande annulée",
	interrupted: "Demande interrompue"
}, c = {
	read: "Lecture",
	write: "Modification",
	command: "Commande",
	search: "Recherche",
	check: "Contrôle",
	message: "Information"
}, l = new Intl.DateTimeFormat("fr", {
	hour: "2-digit",
	minute: "2-digit",
	second: "2-digit"
});
function u(e) {
	let t = new Date(e);
	return Number.isNaN(t.getTime()) ? "Date inconnue" : l.format(t);
}
function d({ status: e }) {
	return /* @__PURE__ */ (0, o.jsx)("span", {
		className: "progress-state-icon state-" + e,
		"aria-hidden": "true",
		children: e === "completed" ? "✓" : e === "failed" || e === "blocked" ? "!" : e === "running" ? "◷" : "○"
	});
}
function f({ snapshot: e, status: t }) {
	let [n, r] = (0, i.useState)(t === "running"), a = e.plan;
	if (!a) return /* @__PURE__ */ (0, o.jsx)("p", {
		className: "progress-empty",
		children: "Aucun plan transmis. Les étapes apparaîtront quand l’agent les publiera."
	});
	let s = a.steps.filter((e) => e.status === "completed").length, c = {
		pending: "À faire",
		running: t === "running" ? "En cours" : "Non terminée",
		completed: "Terminée",
		blocked: "Bloquée"
	};
	return /* @__PURE__ */ (0, o.jsxs)("details", {
		className: "progress-plan",
		open: n,
		onToggle: (e) => r(e.currentTarget.open),
		children: [
			/* @__PURE__ */ (0, o.jsxs)("summary", { children: [/* @__PURE__ */ (0, o.jsx)("span", { children: "Plan" }), /* @__PURE__ */ (0, o.jsxs)("span", {
				className: "progress-count",
				children: [
					s,
					"/",
					a.steps.length,
					" terminées"
				]
			})] }),
			/* @__PURE__ */ (0, o.jsx)("p", {
				className: "progress-plan-title",
				children: a.title
			}),
			/* @__PURE__ */ (0, o.jsx)("ol", { children: a.steps.map((e) => /* @__PURE__ */ (0, o.jsxs)("li", {
				className: "progress-step step-" + e.status,
				children: [/* @__PURE__ */ (0, o.jsx)(d, { status: e.status === "running" && t !== "running" ? "pending" : e.status }), /* @__PURE__ */ (0, o.jsxs)("span", { children: [e.title, /* @__PURE__ */ (0, o.jsx)("small", { children: c[e.status] })] })]
			}, e.id)) }),
			/* @__PURE__ */ (0, o.jsx)("p", {
				className: "progress-note",
				children: "Avancement déclaré par l’agent. Les preuves restent dans Vérifications."
			})
		]
	});
}
function p({ action: e, status: t, canOpen: n, onOpen: r }) {
	let i = e.status === "failed" ? "Échec" : e.status === "completed" ? "Terminée" : t === "running" ? "En cours" : "Sans résultat final";
	return /* @__PURE__ */ (0, o.jsxs)("li", {
		className: "progress-action",
		children: [/* @__PURE__ */ (0, o.jsx)(d, { status: e.status === "running" && t !== "running" ? "pending" : e.status }), /* @__PURE__ */ (0, o.jsxs)("div", { children: [
			/* @__PURE__ */ (0, o.jsxs)("span", {
				className: "progress-action-kind",
				children: [
					c[e.kind],
					" · ",
					i
				]
			}),
			/* @__PURE__ */ (0, o.jsx)("span", {
				className: "progress-action-label",
				children: e.label
			}),
			e.path ? /* @__PURE__ */ (0, o.jsx)("code", {
				title: e.path,
				children: e.path
			}) : null,
			/* @__PURE__ */ (0, o.jsxs)("div", {
				className: "progress-action-meta",
				children: [/* @__PURE__ */ (0, o.jsx)("time", {
					dateTime: e.at,
					children: u(e.at)
				}), n ? /* @__PURE__ */ (0, o.jsx)("button", {
					type: "button",
					onClick: r,
					title: "Voir ce fichier dans la version livrée",
					children: "Ouvrir le fichier ↗"
				}) : null]
			})
		] })]
	});
}
function m({ snapshot: e, job: t, revisions: n, onOpenFile: r }) {
	let [a, s] = (0, i.useState)(12), c = e.actions.slice(-a), l = n.slice().reverse().find((e) => e.jobId === t.id);
	return /* @__PURE__ */ (0, o.jsxs)("details", {
		className: "progress-actions",
		children: [/* @__PURE__ */ (0, o.jsxs)("summary", { children: [/* @__PURE__ */ (0, o.jsx)("span", { children: "Journal des actions" }), /* @__PURE__ */ (0, o.jsxs)("span", {
			className: "progress-count",
			children: [e.truncated ? "Dernières " : "", e.actions.length]
		})] }), e.actions.length ? /* @__PURE__ */ (0, o.jsxs)(o.Fragment, { children: [
			e.actions.length > a ? /* @__PURE__ */ (0, o.jsx)("button", {
				className: "progress-earlier",
				type: "button",
				onClick: () => s((e) => e + 20),
				children: "Voir les actions précédentes"
			}) : null,
			/* @__PURE__ */ (0, o.jsx)("ol", { children: c.map((n) => /* @__PURE__ */ (0, o.jsx)(p, {
				action: n,
				status: e.status,
				canOpen: !!(n.path && l?.files.some((e) => e.path === n.path)),
				onOpen: () => n.path && r(t.id, n.path)
			}, n.id)) }),
			e.truncated ? /* @__PURE__ */ (0, o.jsx)("p", {
				className: "progress-note",
				children: "Le journal est limité aux 200 dernières actions."
			}) : null
		] }) : /* @__PURE__ */ (0, o.jsx)("p", {
			className: "progress-empty",
			children: "Aucune action transmise pour cette demande."
		})]
	});
}
function h(e, t) {
	return ["queued", "running"].includes(e.status) ? t?.status ?? e.status : e.status;
}
function g({ job: e, ...t }) {
	let { snapshot: n, error: r, retry: i } = a(e, t.loadProgress, t.pollMs), c = n?.jobId === e.id ? n : null, l = h(e, c), p = c?.plan?.steps.find((e) => e.status === "running");
	return /* @__PURE__ */ (0, o.jsxs)("div", {
		className: "progress-job",
		children: [
			/* @__PURE__ */ (0, o.jsx)("p", {
				className: "progress-request",
				title: e.request,
				children: e.request
			}),
			/* @__PURE__ */ (0, o.jsx)("div", {
				className: "progress-job-status status-" + l,
				role: "status",
				children: s[l]
			}),
			e.worker ? /* @__PURE__ */ (0, o.jsxs)("p", {
				className: "progress-worker",
				children: ["Agent · ", e.worker]
			}) : null,
			l === "queued" ? /* @__PURE__ */ (0, o.jsx)("p", {
				className: "progress-empty",
				children: "La demande attend un agent. Aucune exécution n’a commencé."
			}) : null,
			r ? /* @__PURE__ */ (0, o.jsxs)("div", {
				className: "progress-error",
				role: "status",
				children: [/* @__PURE__ */ (0, o.jsx)("p", { children: r }), /* @__PURE__ */ (0, o.jsx)("button", {
					type: "button",
					onClick: i,
					children: "Réessayer"
				})]
			}) : null,
			c ? /* @__PURE__ */ (0, o.jsxs)(o.Fragment, { children: [
				p && l === "running" ? /* @__PURE__ */ (0, o.jsxs)("p", {
					className: "progress-current",
					children: [/* @__PURE__ */ (0, o.jsx)(d, { status: "running" }), /* @__PURE__ */ (0, o.jsx)("span", { children: p.title })]
				}) : null,
				/* @__PURE__ */ (0, o.jsx)(f, {
					snapshot: c,
					status: l
				}),
				/* @__PURE__ */ (0, o.jsx)(m, {
					snapshot: {
						...c,
						status: l
					},
					job: e,
					revisions: t.revisions,
					onOpenFile: t.onOpenFile
				}),
				/* @__PURE__ */ (0, o.jsxs)("p", {
					className: "progress-received",
					children: [c.updatedAt ? /* @__PURE__ */ (0, o.jsxs)(o.Fragment, { children: ["Dernier événement : ", /* @__PURE__ */ (0, o.jsx)("time", {
						dateTime: c.updatedAt,
						children: u(c.updatedAt)
					})] }) : "Aucun événement reçu.", !r && l === "running" ? " · Actualisation automatique" : ""]
				})
			] }) : r ? null : /* @__PURE__ */ (0, o.jsx)("p", {
				className: "progress-empty",
				children: "Lecture de l’avancement…"
			})
		]
	});
}
function _(e) {
	let [t, n] = (0, i.useState)(null), r = e.jobs.find((e) => e.id === t) ?? e.jobs.find((e) => e.status === "running") ?? e.jobs.find((e) => e.status === "queued") ?? e.jobs.at(-1);
	return r ? /* @__PURE__ */ (0, o.jsxs)("section", {
		className: "job-progress-card",
		"aria-label": "Plan et avancement",
		children: [
			/* @__PURE__ */ (0, o.jsxs)("div", {
				className: "progress-heading",
				children: [/* @__PURE__ */ (0, o.jsx)("h2", { children: "Plan et avancement" }), /* @__PURE__ */ (0, o.jsx)("span", {
					className: "progress-agent-badge",
					children: "Agent"
				})]
			}),
			e.jobs.length > 1 ? /* @__PURE__ */ (0, o.jsxs)("label", {
				className: "progress-job-picker",
				children: ["Demande suivie", /* @__PURE__ */ (0, o.jsx)("select", {
					value: r.id,
					onChange: (e) => n(e.target.value),
					children: e.jobs.slice().reverse().map((e) => /* @__PURE__ */ (0, o.jsx)("option", {
						value: e.id,
						children: e.request.length > 65 ? e.request.slice(0, 65) + "…" : e.request
					}, e.id))
				})]
			}) : null,
			/* @__PURE__ */ (0, o.jsx)(g, {
				job: r,
				...e
			}, r.id)
		]
	}) : null;
}
//#endregion
//#region studio-ui/src/progress-widget.tsx
function v(e) {
	let t = (0, r.createRoot)(e);
	return {
		update(e) {
			t.render(/* @__PURE__ */ (0, o.jsx)(_, { ...e }));
		},
		dispose() {
			t.unmount();
		}
	};
}
//#endregion
export { v as mountProgressWidget };
