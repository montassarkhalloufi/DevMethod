import { n as e, r as t, t as n } from "./jsx-runtime-Bz8zB3tG.js";
//#region studio-ui/src/features/quality/model/selectors.ts
var r = t(), i = e(), a = {
	notrun: "Non exécuté",
	running: "En cours",
	passed: "Réussi",
	failed: "Échec",
	blocked: "Bloqué",
	notapplicable: "Non applicable",
	configure: "Connexion nécessaire"
};
function o(e) {
	return e.execution === "external" && !e.evidence && e.status === "blocked" && e.freshness === "current" ? "configure" : e.status;
}
function s(e) {
	return e.filter((e) => e.canRun && e.execution === "studio" && e.freshness === "current");
}
var c = {
	current: "Version sélectionnée",
	obsolete: "Autre version",
	reevaluate: "À réévaluer"
};
function l(e, t, n) {
	return e.filter((e) => (t === "all" || e.category === t) && (n === "all" || o(e) === n));
}
function u(e) {
	return e.reduce((e, t) => (e.total++, t.freshness === "current" ? (e[o(t)]++, e) : (e.reevaluate++, e)), {
		total: 0,
		passed: 0,
		failed: 0,
		notrun: 0,
		blocked: 0,
		configure: 0,
		running: 0,
		notapplicable: 0,
		reevaluate: 0
	});
}
var d = (e) => e.slice(0, 8);
function f(e) {
	return e == null ? "—" : e < 1e3 ? `${e} ms` : `${(e / 1e3).toFixed(2)} s`;
}
function p(e) {
	return e ? new Intl.DateTimeFormat("fr-FR", {
		dateStyle: "short",
		timeStyle: "short"
	}).format(new Date(e)) : "Non exécuté";
}
//#endregion
//#region studio-ui/src/features/quality/hooks/useQuality.ts
async function m(e) {
	let t = await e.json();
	if (!e.ok) {
		let e = typeof t == "object" && t && "error" in t ? String(t.error) : "Le service qualité n’a pas répondu.";
		throw Error(e);
	}
	if (typeof t != "object" || !t || !("checks" in t) || !Array.isArray(t.checks) || !("revisionId" in t)) throw Error("Rapport qualité invalide.");
	return t;
}
async function h(e, t, n, r) {
	let i = AbortSignal.timeout(n), a = AbortSignal.any([t, i]);
	try {
		let t = await m(await fetch(e, {
			...r,
			signal: a
		}));
		return a.throwIfAborted(), t;
	} catch (e) {
		throw i.aborted && !t.aborted ? Error(`Délai de réponse dépassé (${n / 1e3} s). Aucun nouveau résultat confirmé. Réessayez pour lire l’état réel des contrôles ; une exécution peut continuer côté serveur.`, { cause: e }) : e;
	}
}
async function g(e) {
	let t = 0;
	for (let n of e.queue) {
		if (!e.current() || e.shouldStop()) break;
		e.onStart(n);
		let r = await h("/api/project/checks/run", e.signal, 3e4, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				revisionId: e.revisionId,
				checkId: n
			})
		});
		if (!e.current()) break;
		if (r.revisionId !== e.revisionId) throw Error("La réponse concerne une autre version ; série interrompue.");
		e.onResult(r, ++t);
	}
	return t;
}
function _({ revisionId: e, onStateChanged: t }) {
	let [n, i] = (0, r.useState)(null), [a, o] = (0, r.useState)(""), [c, l] = (0, r.useState)(null), [u, d] = (0, r.useState)(null), f = (0, r.useRef)(!1), [p, m] = (0, r.useState)(0), _ = n?.report.revisionId === e && n.refreshKey === p ? n.report : null, v = (0, r.useRef)(0), y = (0, r.useRef)(null);
	(0, r.useEffect)(() => {
		let t = new AbortController(), n = ++v.current;
		return y.current?.abort(), y.current = null, i(null), d(null), o(""), l(null), e && h(`/api/project/checks?revision=${encodeURIComponent(e)}`, t.signal, 15e3).then((r) => {
			if (!t.signal.aborted && n === v.current) {
				if (r.revisionId !== e) throw Error("La réponse concerne une autre version ; rapport écarté.");
				i({
					report: r,
					refreshKey: p
				});
			}
		}).catch((e) => {
			!t.signal.aborted && n === v.current && (i(null), o(e instanceof Error ? e.message : "Chargement impossible."));
		}), () => {
			t.abort(), y.current?.abort();
		};
	}, [e, p]);
	let b = (0, r.useCallback)(async (n, r) => {
		if (!e || y.current || _?.revisionId !== e) return;
		let a = new Set(s(_.checks).map((e) => e.id)), c = [...new Set(n)].filter((e) => a.has(e));
		if (!c.length) return;
		let u = new AbortController(), m = v.current, h = () => !u.signal.aborted && m === v.current;
		y.current = u, f.current = !1, o(""), d(r ? {
			revisionId: e,
			total: c.length,
			completed: 0,
			state: "running"
		} : null);
		let b = 0;
		try {
			b = await g({
				queue: c,
				revisionId: e,
				signal: u.signal,
				current: h,
				shouldStop: () => f.current,
				onStart: l,
				onResult(t, n) {
					i((n) => ({
						refreshKey: p,
						report: {
							...t,
							flowModel: t.flowModel ?? (n?.report.revisionId === e && n.refreshKey === p ? n.report.flowModel : null)
						}
					})), b = n, r && d({
						revisionId: e,
						total: c.length,
						completed: b,
						state: "running"
					});
				}
			}), h() && t?.();
		} catch (e) {
			h() && (i(null), o(e instanceof Error ? e.message : "Contrôle indisponible."));
		} finally {
			h() && (l(null), y.current = null, d((e) => e ? {
				...e,
				completed: b,
				state: b === c.length ? "complete" : "stopped"
			} : null));
		}
	}, [
		e,
		_,
		p,
		t
	]), x = _?.revisionId === e ? _ : null;
	return {
		report: x,
		error: a,
		runningId: c,
		batch: u?.revisionId === e ? u : null,
		run: (e) => b([e], !1),
		runAll: () => b(s(x?.checks ?? []).map((e) => e.id), !0),
		stopAfterCurrent: () => {
			f.current = !0, d((e) => e ? {
				...e,
				stopping: !0
			} : null);
		},
		refresh: () => m((e) => e + 1)
	};
}
//#endregion
//#region studio-ui/src/features/quality/components/QualityTable.tsx
var v = n();
function y({ checks: e, selectedId: t, runningId: n, categories: r, onSelect: i }) {
	return /* @__PURE__ */ (0, v.jsxs)("div", {
		className: "quality-table-scroll",
		tabIndex: 0,
		"aria-label": "Tableau des contrôles, défilement horizontal disponible",
		children: [/* @__PURE__ */ (0, v.jsxs)("table", {
			className: "quality-table",
			children: [
				/* @__PURE__ */ (0, v.jsx)("caption", {
					className: "quality-sr",
					children: "Contrôles du périmètre filtré. Sélectionnez un nom pour consulter sa preuve."
				}),
				/* @__PURE__ */ (0, v.jsx)("thead", { children: /* @__PURE__ */ (0, v.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, v.jsx)("th", {
						scope: "col",
						children: "Contrôle"
					}),
					/* @__PURE__ */ (0, v.jsx)("th", {
						scope: "col",
						children: "Catégorie"
					}),
					/* @__PURE__ */ (0, v.jsx)("th", {
						scope: "col",
						children: "Outil / méthode"
					}),
					/* @__PURE__ */ (0, v.jsx)("th", {
						scope: "col",
						children: "Résultat"
					}),
					/* @__PURE__ */ (0, v.jsx)("th", {
						scope: "col",
						children: "Durée"
					}),
					/* @__PURE__ */ (0, v.jsx)("th", {
						scope: "col",
						children: "Dernière exécution"
					})
				] }) }),
				/* @__PURE__ */ (0, v.jsx)("tbody", { children: e.map((e) => {
					let s = n === e.id ? "running" : o(e), l = e.evidence?.provider ? e.evidence : null;
					return /* @__PURE__ */ (0, v.jsxs)("tr", {
						className: t === e.id ? `is-selected quality-row-${s}` : void 0,
						children: [
							/* @__PURE__ */ (0, v.jsx)("th", {
								scope: "row",
								children: /* @__PURE__ */ (0, v.jsxs)("button", {
									type: "button",
									className: "quality-row-button",
									"aria-pressed": t === e.id,
									onClick: () => i(e.id),
									children: [e.title, /* @__PURE__ */ (0, v.jsx)("span", {
										"aria-hidden": "true",
										children: "›"
									})]
								})
							}),
							/* @__PURE__ */ (0, v.jsx)("td", { children: r.find((t) => t.id === e.category)?.label ?? e.category }),
							/* @__PURE__ */ (0, v.jsx)("td", {
								className: "quality-method",
								children: l ? `${l.tool}${l.toolVersion ? ` ${l.toolVersion}` : ""} · rapport de l’hôte` : e.tool
							}),
							/* @__PURE__ */ (0, v.jsxs)("td", { children: [/* @__PURE__ */ (0, v.jsx)("span", {
								className: `quality-status quality-status-${e.freshness === "current" ? s : "blocked"}`,
								children: a[s]
							}), e.freshness === "current" ? null : /* @__PURE__ */ (0, v.jsx)("small", {
								className: "quality-freshness",
								children: c[e.freshness]
							})] }),
							/* @__PURE__ */ (0, v.jsx)("td", {
								className: "quality-numeric",
								children: f(e.evidence?.durationMs)
							}),
							/* @__PURE__ */ (0, v.jsx)("td", {
								className: "quality-numeric",
								children: p(e.evidence?.finishedAt)
							})
						]
					}, e.id);
				}) })
			]
		}), e.length ? null : /* @__PURE__ */ (0, v.jsx)("p", {
			className: "quality-empty",
			children: "Aucun contrôle ne correspond à ces filtres."
		})]
	});
}
//#endregion
//#region studio-ui/src/features/quality/model/requests.ts
function b(e, t) {
	let n = e.evidence, r = n?.checkId ?? e.id, i = o(e) === "configure" ? "connect" : "fix", a = n?.revisionId ?? t.revisionId, s = `${i === "connect" ? "Connecter" : "Corriger"} : ${e.title}`;
	return {
		kind: i,
		revisionId: a,
		checkId: r,
		title: s,
		prompt: [
			s,
			`Contrôle : ${r}. Version concernée : ${a}.`,
			`Version actuellement sélectionnée : ${t.revisionId}. Fraîcheur : ${e.freshness}.`,
			`Objectif : ${n?.expected ?? e.objective}`,
			`Résultat observé : ${n?.observed || e.reason || "Aucune exécution."}`,
			`Outil : ${n?.tool ?? e.tool}.`,
			n ? `Preuve : ${n.id} · ${n.finishedAt ?? n.startedAt} · empreinte ${n.fingerprint ?? "non enregistrée"}.` : "Aucune preuve de réussite enregistrée.",
			...(n?.findings ?? []).slice(0, 10).map((e) => `${e.source ? `${e.source.path}${e.source.line ? `:${e.source.line}` : ""}` : e.target || "Constat"} — ${e.message}`),
			e.nextAction ? `Prérequis : ${e.nextAction}` : "",
			...(n?.limits ?? []).map((e) => `Limite : ${e}`),
			i === "connect" ? "Examiner les outils et accès déjà disponibles. Proposer puis raccorder le contrôle adapté au projet, avec exécution bornée et preuve sur sa version exacte. Ne pas déduire de résultat avant son exécution ; aucune installation, dépense ou action externe implicite." : "Réexaminer la preuve et la version actuelle avant toute correction. Préserver les données et décisions, corriger le périmètre affecté, puis relancer les vérifications pertinentes sur la nouvelle version. Une preuve ancienne ne valide jamais la nouvelle version."
		].filter(Boolean).join("\n").slice(0, 12e3)
	};
}
//#endregion
//#region studio-ui/src/features/quality/components/QualityDetail.tsx
function x({ check: e, revisionId: t }) {
	let n = e.evidence;
	return /* @__PURE__ */ (0, v.jsxs)("dl", {
		className: "quality-metadata",
		children: [
			/* @__PURE__ */ (0, v.jsxs)("div", { children: [/* @__PURE__ */ (0, v.jsx)("dt", { children: n ? "Version contrôlée" : "Version à contrôler" }), /* @__PURE__ */ (0, v.jsxs)("dd", { children: [
				d(n?.revisionId ?? t),
				" · ",
				c[e.freshness]
			] })] }),
			/* @__PURE__ */ (0, v.jsxs)("div", { children: [/* @__PURE__ */ (0, v.jsx)("dt", { children: "Dernière exécution" }), /* @__PURE__ */ (0, v.jsxs)("dd", { children: [
				p(n?.finishedAt),
				" · ",
				f(n?.durationMs)
			] })] }),
			/* @__PURE__ */ (0, v.jsxs)("div", { children: [/* @__PURE__ */ (0, v.jsx)("dt", { children: "Environnement" }), /* @__PURE__ */ (0, v.jsx)("dd", { children: n?.environment ?? "Aucune exécution" })] }),
			n?.provider ? /* @__PURE__ */ (0, v.jsxs)("div", { children: [/* @__PURE__ */ (0, v.jsx)("dt", { children: "Provenance du rapport" }), /* @__PURE__ */ (0, v.jsxs)("dd", { children: [
				n.tool,
				" ",
				n.toolVersion,
				" · ",
				n.source?.kind,
				" · connexion",
				" ",
				n.provider.connectionId,
				". Rapport reçu de l’agent hôte."
			] })] }) : null,
			n?.metrics ? Object.entries(n.metrics).map(([e, t]) => /* @__PURE__ */ (0, v.jsxs)("div", { children: [/* @__PURE__ */ (0, v.jsx)("dt", { children: e }), /* @__PURE__ */ (0, v.jsx)("dd", { children: t })] }, e)) : null,
			n?.fingerprint ? /* @__PURE__ */ (0, v.jsxs)("div", { children: [/* @__PURE__ */ (0, v.jsx)("dt", { children: "Empreinte du périmètre" }), /* @__PURE__ */ (0, v.jsx)("dd", {
				title: n.fingerprint,
				children: n.fingerprint.slice(0, 16)
			})] }) : null
		]
	});
}
function S({ check: e, runningId: t, onRun: n }) {
	let r = e.evidence, i = t === e.id;
	return /* @__PURE__ */ (0, v.jsx)("div", {
		className: "quality-detail-actions",
		children: e.canRun ? /* @__PURE__ */ (0, v.jsxs)("button", {
			type: "button",
			className: "quality-primary",
			disabled: t !== null,
			onClick: () => n(e.id),
			children: [
				i ? "Contrôle en cours…" : r ? "Relancer ce contrôle" : "Exécuter ce contrôle",
				" ",
				/* @__PURE__ */ (0, v.jsx)("span", {
					"aria-hidden": "true",
					children: "→"
				})
			]
		}) : r ? /* @__PURE__ */ (0, v.jsx)("p", {
			className: "quality-unavailable",
			children: e.reason ?? "Cette preuve historique est consultable ; elle ne lance pas de commande."
		}) : null
	});
}
function C({ check: e, detailRef: t, report: n, runningId: r, onRun: i, onOpenSource: s, onPrepareRequest: c, onOpenConnectors: l }) {
	let u = e.evidence;
	return /* @__PURE__ */ (0, v.jsxs)("section", {
		ref: t,
		tabIndex: -1,
		className: `quality-detail quality-detail-${e.status}`,
		"aria-labelledby": "quality-detail-heading",
		children: [
			/* @__PURE__ */ (0, v.jsxs)("header", { children: [/* @__PURE__ */ (0, v.jsx)("span", {
				className: `quality-status quality-status-${e.freshness === "current" ? e.status : "blocked"}`,
				children: a[o(e)]
			}), /* @__PURE__ */ (0, v.jsx)("h3", {
				id: "quality-detail-heading",
				children: e.title
			})] }),
			/* @__PURE__ */ (0, v.jsxs)("div", {
				className: "quality-expectation",
				children: [/* @__PURE__ */ (0, v.jsx)("strong", { children: "Attendu" }), /* @__PURE__ */ (0, v.jsx)("p", { children: u?.expected ?? e.objective })]
			}),
			/* @__PURE__ */ (0, v.jsxs)("div", {
				className: "quality-observation",
				children: [/* @__PURE__ */ (0, v.jsx)("strong", { children: u ? "Observé" : "État du contrôle" }), /* @__PURE__ */ (0, v.jsx)("p", { children: u?.observed || e.reason || "Ce contrôle n’a pas encore été exécuté." })]
			}),
			/* @__PURE__ */ (0, v.jsx)(x, {
				check: e,
				revisionId: n.revisionId
			}),
			u?.findings.length ? /* @__PURE__ */ (0, v.jsx)("ul", {
				className: "quality-findings",
				children: u.findings.map((e, t) => /* @__PURE__ */ (0, v.jsxs)("li", { children: [e.source ? /* @__PURE__ */ (0, v.jsxs)("button", {
					type: "button",
					onClick: () => s(e.source.path, e.source.line, u.revisionId),
					children: [
						e.source.path,
						e.source.line ? `:${e.source.line}` : "",
						" ↗"
					]
				}) : /* @__PURE__ */ (0, v.jsx)("span", { children: e.target || "Constat sans fichier associé" }), /* @__PURE__ */ (0, v.jsx)("p", { children: e.message })] }, `${e.source?.path || e.target || "diagnostic"}:${t}`))
			}) : null,
			/* @__PURE__ */ (0, v.jsx)(S, {
				check: e,
				runningId: r,
				onRun: i
			}),
			e.execution === "external" && l ? /* @__PURE__ */ (0, v.jsx)("button", {
				type: "button",
				onClick: () => l(e.id),
				children: "Choisir un outil ou un connecteur →"
			}) : null,
			c && (e.status === "failed" || e.status === "blocked") ? /* @__PURE__ */ (0, v.jsxs)("div", {
				className: "quality-next-step",
				children: [/* @__PURE__ */ (0, v.jsx)("button", {
					type: "button",
					"data-quality-prepare": "",
					disabled: r !== null,
					onClick: () => c(b(e, n)),
					children: o(e) === "configure" ? "Préparer le raccordement de ce contrôle" : "Préparer une correction"
				}), /* @__PURE__ */ (0, v.jsx)("p", { children: "Prépare une demande DevMethod avec la version et les constats. Vous pourrez la compléter avant de l’envoyer." })]
			}) : null,
			e.nextAction ? /* @__PURE__ */ (0, v.jsxs)("div", {
				className: "quality-procedure",
				children: [
					/* @__PURE__ */ (0, v.jsx)("strong", { children: "Pour l’exécuter" }),
					/* @__PURE__ */ (0, v.jsx)("p", { children: e.nextAction }),
					/* @__PURE__ */ (0, v.jsxs)("p", { children: [
						"Version à joindre à la preuve : ",
						d(n.revisionId),
						". Le Studio ne déduit aucun résultat de cette procédure."
					] })
				]
			}) : null,
			u?.limits.length ? /* @__PURE__ */ (0, v.jsxs)("details", {
				className: "quality-limits",
				children: [/* @__PURE__ */ (0, v.jsx)("summary", { children: "Portée et limites du contrôle" }), /* @__PURE__ */ (0, v.jsx)("ul", { children: u.limits.map((e) => /* @__PURE__ */ (0, v.jsx)("li", { children: e }, e)) })]
			}) : null
		]
	});
}
//#endregion
//#region studio-ui/src/features/quality/components/QualityTrace.tsx
function w({ report: e, onOpenSource: t }) {
	let [n, i] = (0, r.useState)(""), a = e.flowModel, o = a?.flows.find((e) => e.id === n) ?? a?.flows[0];
	return !o || !a ? /* @__PURE__ */ (0, v.jsx)("p", {
		className: "quality-empty",
		children: "Aucun parcours de code associé à cette version. Aucune trace applicative n’a été enregistrée par ces contrôles."
	}) : /* @__PURE__ */ (0, v.jsxs)(v.Fragment, { children: [
		/* @__PURE__ */ (0, v.jsxs)("label", {
			className: "quality-select-label",
			children: ["Parcours déduit du code", /* @__PURE__ */ (0, v.jsx)("select", {
				value: o.id,
				onChange: (e) => i(e.target.value),
				children: a.flows.map((e) => /* @__PURE__ */ (0, v.jsx)("option", {
					value: e.id,
					children: e.title
				}, e.id))
			})]
		}),
		/* @__PURE__ */ (0, v.jsxs)("p", {
			className: "quality-note",
			children: [
				"Lecture statique de la version ",
				d(e.revisionId),
				". Ce parcours n’est pas une trace d’exécution, ni nécessairement la cause du résultat sélectionné."
			]
		}),
		/* @__PURE__ */ (0, v.jsx)("ol", {
			className: "quality-flow",
			children: o.elementIds.map((n) => {
				let r = a.elements.find((e) => e.id === n), i = r?.sources[0];
				return /* @__PURE__ */ (0, v.jsxs)("li", { children: [/* @__PURE__ */ (0, v.jsx)("span", {
					className: "quality-flow-node",
					children: r?.label ?? n
				}), i ? /* @__PURE__ */ (0, v.jsx)("button", {
					type: "button",
					onClick: () => t(i.path, i.line, e.revisionId),
					children: "Voir la source ↗"
				}) : null] }, n);
			})
		}),
		o.limits.length ? /* @__PURE__ */ (0, v.jsxs)("details", { children: [/* @__PURE__ */ (0, v.jsx)("summary", { children: "Limites de cette déduction" }), /* @__PURE__ */ (0, v.jsx)("ul", { children: o.limits.map((e) => /* @__PURE__ */ (0, v.jsx)("li", { children: e }, e)) })] }) : null
	] });
}
function T({ check: e, report: t, onOpenSource: n }) {
	let r = e.evidence?.events ?? [], i = !e.evidence || e.evidence.revisionId === t.revisionId;
	return /* @__PURE__ */ (0, v.jsxs)("section", {
		className: "quality-trace",
		"aria-labelledby": "quality-trace-heading",
		children: [/* @__PURE__ */ (0, v.jsx)("h3", {
			id: "quality-trace-heading",
			children: r.length ? "Journal du contrôle" : "Parcours du projet"
		}), r.length ? /* @__PURE__ */ (0, v.jsxs)(v.Fragment, { children: [
			/* @__PURE__ */ (0, v.jsx)("p", {
				className: "quality-note",
				children: e.evidence?.provider ? "Événements du rapport transmis par l’agent hôte. La réception du rapport ne constitue pas une vérification indépendante de son contenu." : "Événements réellement enregistrés par l’analyseur. Aucune exécution métier n’est déduite."
			}),
			/* @__PURE__ */ (0, v.jsx)("ol", {
				className: "quality-run-events",
				children: r.map((e, t) => /* @__PURE__ */ (0, v.jsxs)("li", { children: [/* @__PURE__ */ (0, v.jsx)("time", {
					dateTime: e.at,
					children: p(e.at)
				}), /* @__PURE__ */ (0, v.jsx)("span", { children: e.label })] }, `${e.at}:${t}`))
			}),
			/* @__PURE__ */ (0, v.jsxs)("details", {
				className: "quality-code-flow",
				children: [/* @__PURE__ */ (0, v.jsx)("summary", { children: "Consulter aussi les parcours déduits du code" }), i ? /* @__PURE__ */ (0, v.jsx)(w, {
					report: t,
					onOpenSource: n
				}) : /* @__PURE__ */ (0, v.jsx)("p", { children: "Cette preuve appartient à une autre version. Sélectionnez sa version dans l’historique pour consulter ses parcours." })]
			})
		] }) : i ? /* @__PURE__ */ (0, v.jsx)(w, {
			report: t,
			onOpenSource: n
		}) : /* @__PURE__ */ (0, v.jsx)("p", { children: "Cette preuve appartient à une autre version. Les parcours de la version affichée ne lui sont pas attribués." })]
	});
}
//#endregion
//#region studio-ui/src/features/quality/components/QualityBatch.tsx
function E({ batch: e, onStop: t }) {
	let n = {
		complete: "Terminés",
		stopped: "Série interrompue",
		running: "Contrôles en cours"
	}[e.state];
	return /* @__PURE__ */ (0, v.jsxs)("div", {
		className: "quality-batch",
		role: "status",
		"aria-live": "polite",
		children: [
			/* @__PURE__ */ (0, v.jsxs)("span", { children: [
				n,
				" : ",
				e.completed,
				" / ",
				e.total,
				" réponses reçues · version",
				" ",
				d(e.revisionId),
				"."
			] }),
			/* @__PURE__ */ (0, v.jsx)("progress", {
				value: e.completed,
				max: e.total,
				"aria-label": "Contrôles terminés"
			}),
			e.state === "running" ? /* @__PURE__ */ (0, v.jsx)("button", {
				type: "button",
				onClick: t,
				disabled: e.stopping,
				children: e.stopping ? "Arrêt après le contrôle en cours…" : "Arrêter après ce contrôle"
			}) : null,
			/* @__PURE__ */ (0, v.jsx)("small", { children: "Seuls les contrôles raccordés sont exécutés. Les résultats détaillés restent propres à chaque contrôle." })
		]
	});
}
//#endregion
//#region studio-ui/src/features/quality/components/QualityView.tsx
function D(e) {
	let { report: t, error: n, runningId: i, batch: o, run: c, runAll: f, stopAfterCurrent: p, refresh: m } = _(e), h = (0, r.useRef)(null), [g, b] = (0, r.useState)("all"), [x, S] = (0, r.useState)("all"), [w, D] = (0, r.useState)(""), [O, k] = (0, r.useState)(!1);
	if (!e.revisionId) return /* @__PURE__ */ (0, v.jsxs)("section", {
		className: "quality-workspace quality-empty",
		children: [/* @__PURE__ */ (0, v.jsx)("h2", { children: "Qualité du projet" }), /* @__PURE__ */ (0, v.jsx)("p", { children: "Créez une version pour relier les contrôles à ses fichiers exacts." })]
	});
	if (!t) return /* @__PURE__ */ (0, v.jsxs)("section", {
		className: "quality-workspace",
		children: [
			/* @__PURE__ */ (0, v.jsx)("h2", { children: "Qualité du projet" }),
			/* @__PURE__ */ (0, v.jsx)("p", {
				role: "status",
				children: n || "Lecture des contrôles de cette version…"
			}),
			n ? /* @__PURE__ */ (0, v.jsx)("button", {
				type: "button",
				onClick: m,
				children: "Réessayer"
			}) : null
		]
	});
	let A = l((O ? t.historical : t.checks).map((e) => e.id === i ? {
		...e,
		status: "running"
	} : e), g, x), j = u(A), M = A.find((e) => e.id === w) ?? A.find((e) => e.status === "failed") ?? A[0];
	return /* @__PURE__ */ (0, v.jsxs)("section", {
		className: "quality-workspace",
		"aria-labelledby": "quality-heading",
		children: [
			/* @__PURE__ */ (0, v.jsxs)("header", {
				className: "quality-heading",
				children: [/* @__PURE__ */ (0, v.jsxs)("div", { children: [/* @__PURE__ */ (0, v.jsx)("h2", {
					id: "quality-heading",
					children: "Qualité du projet"
				}), /* @__PURE__ */ (0, v.jsxs)("p", { children: [
					"Résultats liés à la version sélectionnée",
					" ",
					/* @__PURE__ */ (0, v.jsx)("strong", { children: d(t.revisionId) }),
					"."
				] })] }), /* @__PURE__ */ (0, v.jsxs)("div", {
					className: "quality-heading-actions",
					children: [
						e.onOpenConnectors ? /* @__PURE__ */ (0, v.jsx)("button", {
							type: "button",
							onClick: () => e.onOpenConnectors?.(),
							children: "Outils et connecteurs"
						}) : null,
						/* @__PURE__ */ (0, v.jsxs)("button", {
							type: "button",
							"data-quality-run-all": "",
							onClick: () => void f(),
							disabled: i !== null || !s(t.checks).length,
							children: [
								"Exécuter les contrôles disponibles (",
								s(t.checks).length,
								")"
							]
						}),
						/* @__PURE__ */ (0, v.jsx)("button", {
							type: "button",
							onClick: m,
							disabled: i !== null,
							children: "Actualiser"
						})
					]
				})]
			}),
			o ? /* @__PURE__ */ (0, v.jsx)(E, {
				batch: o,
				onStop: p
			}) : null,
			n ? /* @__PURE__ */ (0, v.jsx)("p", {
				role: "alert",
				className: "quality-error",
				children: n
			}) : null,
			t.localChanges ? /* @__PURE__ */ (0, v.jsx)("p", {
				className: "quality-warning",
				role: "status",
				children: "Sources locales modifiées ou indisponibles : preuves à réévaluer. Aucun nouveau succès ne peut être enregistré."
			}) : null,
			/* @__PURE__ */ (0, v.jsx)("nav", {
				className: "quality-categories",
				"aria-label": "Famille de contrôles",
				children: [{
					id: "all",
					label: "Tous"
				}, ...t.categories].map((e) => /* @__PURE__ */ (0, v.jsx)("button", {
					type: "button",
					"aria-pressed": g === e.id,
					onClick: () => b(e.id),
					children: e.label
				}, e.id))
			}),
			/* @__PURE__ */ (0, v.jsxs)("div", {
				className: "quality-summary",
				"aria-label": "Résumé du périmètre filtré",
				children: [
					/* @__PURE__ */ (0, v.jsxs)("div", {
						className: "quality-summary-passed",
						children: [
							/* @__PURE__ */ (0, v.jsx)("span", {
								"aria-hidden": "true",
								children: "✓"
							}),
							/* @__PURE__ */ (0, v.jsx)("strong", { children: j.passed }),
							/* @__PURE__ */ (0, v.jsxs)("div", { children: ["Réussis", /* @__PURE__ */ (0, v.jsx)("small", { children: "Périmètre de ces contrôles uniquement" })] })
						]
					}),
					/* @__PURE__ */ (0, v.jsxs)("div", {
						className: "quality-summary-failed",
						children: [
							/* @__PURE__ */ (0, v.jsx)("span", {
								"aria-hidden": "true",
								children: "×"
							}),
							/* @__PURE__ */ (0, v.jsx)("strong", { children: j.failed }),
							/* @__PURE__ */ (0, v.jsxs)("div", { children: ["En échec", /* @__PURE__ */ (0, v.jsx)("small", { children: "Résultats à examiner" })] })
						]
					}),
					/* @__PURE__ */ (0, v.jsxs)("div", {
						className: "quality-summary-waiting",
						children: [
							/* @__PURE__ */ (0, v.jsx)("span", {
								"aria-hidden": "true",
								children: "◷"
							}),
							/* @__PURE__ */ (0, v.jsx)("strong", { children: j.notrun + j.blocked + j.configure }),
							/* @__PURE__ */ (0, v.jsxs)("div", { children: ["Sans exécution aboutie", /* @__PURE__ */ (0, v.jsxs)("small", { children: [
								j.notrun,
								" non exécuté(s) · ",
								j.configure,
								" à connecter · ",
								j.blocked,
								" ",
								"bloqué(s)"
							] })] })
						]
					})
				]
			}),
			/* @__PURE__ */ (0, v.jsxs)("div", {
				className: "quality-filters",
				children: [
					/* @__PURE__ */ (0, v.jsxs)("label", { children: ["Résultat", /* @__PURE__ */ (0, v.jsxs)("select", {
						value: x,
						onChange: (e) => S(e.target.value),
						children: [/* @__PURE__ */ (0, v.jsx)("option", {
							value: "all",
							children: "Tous les résultats"
						}), Object.entries(a).map(([e, t]) => /* @__PURE__ */ (0, v.jsx)("option", {
							value: e,
							children: t
						}, e))]
					})] }),
					/* @__PURE__ */ (0, v.jsxs)("label", {
						className: "quality-history-toggle",
						children: [
							/* @__PURE__ */ (0, v.jsx)("input", {
								type: "checkbox",
								checked: O,
								onChange: (e) => k(e.target.checked)
							}),
							"Preuves des autres versions (",
							t.historical.length,
							")"
						]
					}),
					/* @__PURE__ */ (0, v.jsxs)("span", { children: [
						j.total,
						" contrôle(s) · ",
						j.notapplicable,
						" non applicable(s) ·",
						" ",
						j.reevaluate,
						" hors preuve actuelle · ",
						j.running,
						" en cours"
					] })
				]
			}),
			/* @__PURE__ */ (0, v.jsx)(y, {
				checks: A,
				selectedId: M?.id,
				runningId: i,
				categories: t.categories,
				onSelect: (e) => {
					D(e), requestAnimationFrame(() => h.current?.focus());
				}
			}),
			M ? /* @__PURE__ */ (0, v.jsxs)("div", {
				className: "quality-details-grid",
				children: [/* @__PURE__ */ (0, v.jsx)(C, {
					detailRef: h,
					check: M,
					report: t,
					runningId: i,
					onRun: (e) => void c(e),
					onOpenSource: e.onOpenSource,
					onPrepareRequest: e.onPrepareRequest,
					onOpenConnectors: e.onOpenConnectors
				}), /* @__PURE__ */ (0, v.jsx)(T, {
					check: M,
					report: t,
					onOpenSource: e.onOpenSource
				})]
			}) : null,
			/* @__PURE__ */ (0, v.jsxs)("details", {
				className: "quality-report-limits",
				children: [/* @__PURE__ */ (0, v.jsx)("summary", { children: "Ce que ces résultats permettent de conclure" }), /* @__PURE__ */ (0, v.jsx)("ul", { children: t.limits.map((e) => /* @__PURE__ */ (0, v.jsx)("li", { children: e }, e)) })]
			})
		]
	});
}
//#endregion
//#region studio-ui/src/quality-widget.tsx
function O(e, t) {
	let n = (0, i.createRoot)(e), r = !1, a = (e) => {
		r || n.render(/* @__PURE__ */ (0, v.jsx)(D, { ...e }));
	};
	return a(t), {
		update: a,
		dispose() {
			r || (r = !0, n.unmount());
		}
	};
}
//#endregion
export { O as mountQualityWidget };
