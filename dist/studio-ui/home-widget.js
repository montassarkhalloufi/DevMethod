import { n as e, r as t, t as n } from "./jsx-runtime-Bz8zB3tG.js";
//#region studio-ui/src/features/home/model/home.ts
var r = t(), i = e(), a = {
	new: "Nouveau projet",
	imported: "Sources importées",
	existing: "Projet Studio"
};
function o(e) {
	let t = e;
	if (!t || ![
		"new",
		"imported",
		"existing"
	].includes(t.kind || "") || ![
		t.id,
		t.name,
		t.workspace,
		t.createdAt
	].every((e) => typeof e == "string" && e.length > 0) || t.lastOpenedAt !== null && typeof t.lastOpenedAt != "string") throw Error("La réponse du projet est illisible. Actualisez pour vérifier son état.");
	return t;
}
function s(e, t) {
	let n = new FormData(t), r = (e) => String(n.get(e) || "").trim();
	return e === "new" ? {
		kind: e,
		name: r("name"),
		idea: r("idea")
	} : e === "existing" ? {
		kind: e,
		workspace: r("workspace")
	} : {
		kind: e,
		...r("name") ? { name: r("name") } : {},
		source: r("source")
	};
}
function c(e) {
	return e.startsWith("/") || /^[a-z]:[\\/]/i.test(e);
}
function l(e) {
	let t = e.kind === "existing" ? "workspace" : "source", n = e[t];
	return n !== void 0 && !c(n) ? {
		field: t,
		message: "Indiquez un chemin absolu, par exemple /Users/vous/mon-projet."
	} : e.kind === "new" && !e.name ? {
		field: "name",
		message: "Donnez un nom au projet."
	} : e.kind === "new" && !e.idea ? {
		field: "idea",
		message: "Décrivez ce que vous voulez faire avancer."
	} : null;
}
function u(e, t) {
	return t.phase === "opening" ? "Ouverture…" : t.phase === "creating" ? e === "imported" ? "Importation…" : "Préparation…" : t.project ? "Réessayer l’ouverture" : {
		new: "Créer et ouvrir",
		imported: "Importer et ouvrir",
		existing: "Reprendre ce projet"
	}[e];
}
function d(e, t) {
	let n = (e) => e.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("fr-FR");
	return n(`${e.name} ${e.workspace}`).includes(n(t.trim()));
}
function f(e) {
	return [...e].sort((e, t) => Date.parse(t.lastOpenedAt || t.createdAt) - Date.parse(e.lastOpenedAt || e.createdAt));
}
function p(e) {
	let t = new Date(e.lastOpenedAt || e.createdAt);
	return Number.isNaN(t.getTime()) ? "Date non disponible" : new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(t);
}
function m(e, t) {
	if (typeof e != "string") throw Error("L’adresse locale du projet est absente.");
	let n = new URL(e);
	if (n.protocol !== "http:" || ![
		"localhost",
		"127.0.0.1",
		"[::1]"
	].includes(n.hostname) || !n.port || n.username || n.password || n.pathname !== "/") throw Error("L’adresse renvoyée ne correspond pas à une session Studio locale.");
	return (t === "new" || t === "imported") && (n.hash = "journey-foundation"), n.href;
}
//#endregion
//#region studio-ui/src/features/home/hooks/useHome.ts
async function h(e, t, n) {
	let r = await fetch("/api/home" + e, {
		...n === void 0 ? { cache: "no-store" } : {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(n)
		},
		credentials: "same-origin",
		signal: AbortSignal.any([t, AbortSignal.timeout(6e4)])
	}), i = await r.json();
	if (!r.ok) throw Error(i.error || "Le service local ne répond pas. Réessayez dans un instant.");
	return i;
}
var g = (e) => e instanceof Error ? e.message : "Action non confirmée. Vous pouvez réessayer.";
function _({ navigate: e }) {
	let [t, n] = (0, r.useState)([]), [i, a] = (0, r.useState)(!0), [s, c] = (0, r.useState)(""), [l, u] = (0, r.useState)({
		phase: "idle",
		project: null,
		error: ""
	}), d = (0, r.useRef)(null), p = (0, r.useRef)(null), _ = (0, r.useRef)(/* @__PURE__ */ new Map()), v = (0, r.useCallback)(async () => {
		d.current?.abort();
		let e = new AbortController();
		d.current = e, a(!0), c("");
		try {
			let t = await h("", e.signal);
			if (e.signal.aborted) return;
			if (!Array.isArray(t.projects)) throw Error("La liste des projets est illisible.");
			n(f(t.projects.map(o)));
		} catch (t) {
			e.signal.aborted || c(g(t));
		} finally {
			e.signal.aborted || a(!1);
		}
	}, []);
	(0, r.useEffect)(() => (v(), () => {
		d.current?.abort(), p.current?.abort();
	}), [v]);
	function y(e) {
		d.current?.abort(), a(!1), n((t) => f([e, ...t.filter((t) => t.id !== e.id)]));
	}
	async function b(t, n, r) {
		u({
			phase: "opening",
			project: t,
			error: ""
		});
		let i = await h("/open", n.signal, { id: t.id });
		if (n.signal.aborted) return;
		let a = o(i.project);
		if (a.id !== t.id) throw Error("La session renvoyée appartient à un autre projet.");
		let s = m(i.url, r ? t.kind : void 0);
		y(a), e ? e(s) : window.location.assign(s);
	}
	async function x(e, t) {
		let n = JSON.stringify(e), r = _.current.get(n);
		if (r || (r = { requestId: crypto.randomUUID() }, _.current.set(n, r)), r.project) return r.project;
		let i = await h("/projects", t.signal, {
			requestId: r.requestId,
			...e
		});
		if (t.signal.aborted) return null;
		let a = o(i.project);
		return r.project = a, y(a), a;
	}
	async function S(e) {
		if (p.current) return;
		let t = new AbortController();
		p.current = t;
		let n = "id" in e ? e : null;
		u({
			phase: n ? "opening" : "creating",
			project: n,
			error: ""
		});
		try {
			"id" in e || (n = await x(e, t)), n && await b(n, t, !("id" in e));
		} catch (e) {
			t.signal.aborted || u({
				phase: "idle",
				project: n,
				error: g(e)
			});
		} finally {
			t.signal.aborted || (p.current = null, u((e) => ({
				...e,
				phase: "idle"
			})));
		}
	}
	function C() {
		p.current || u({
			phase: "idle",
			project: null,
			error: ""
		});
	}
	return {
		projects: t,
		loading: i,
		loadError: s,
		operation: l,
		refresh: v,
		run: S,
		clearOperation: C
	};
}
//#endregion
//#region studio-ui/src/features/home/components/HomeIcon.tsx
var v = n();
function y({ kind: e }) {
	return /* @__PURE__ */ (0, v.jsx)("svg", {
		width: "24",
		height: "24",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "1.6",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, v.jsx)("path", { d: {
			new: "M12 5v14M5 12h14",
			imported: "M12 3v12m-4-4 4 4 4-4M4 15v6h16v-6",
			existing: "M3 10a9 9 0 1 1 2 8M3 4v6h6M12 7v5l3 2",
			folder: "M3 7h18v13H3zM3 7V4h6l2 3"
		}[e] })
	});
}
//#endregion
//#region studio-ui/src/features/home/components/ProjectFormFields.tsx
function b({ kind: e, values: t, validation: n, onEdit: r }) {
	let i = e === "existing" ? "workspace" : "source";
	function a(e) {
		let t = n?.field === e;
		return {
			"aria-invalid": t || void 0,
			"aria-describedby": t ? "home-form-error" : void 0
		};
	}
	return /* @__PURE__ */ (0, v.jsxs)(v.Fragment, { children: [e === "existing" ? null : /* @__PURE__ */ (0, v.jsxs)("label", { children: [/* @__PURE__ */ (0, v.jsxs)("span", {
		className: "home-field-label",
		children: ["Nom du projet ", e === "imported" ? /* @__PURE__ */ (0, v.jsx)("small", { children: "· facultatif" }) : null]
	}), /* @__PURE__ */ (0, v.jsx)("input", {
		name: "name",
		autoComplete: "off",
		required: e === "new",
		maxLength: 200,
		value: t.name,
		onChange: (e) => r("name", e.target.value),
		placeholder: "Par exemple, Mon carnet de lectures…",
		...a("name")
	})] }), e === "new" ? /* @__PURE__ */ (0, v.jsxs)("label", { children: ["Que souhaitez-vous créer ?", /* @__PURE__ */ (0, v.jsx)("textarea", {
		name: "idea",
		autoComplete: "off",
		required: !0,
		maxLength: 2e4,
		rows: 4,
		value: t.idea,
		onChange: (e) => r("idea", e.target.value),
		placeholder: "Une application pour…",
		...a("idea")
	})] }) : /* @__PURE__ */ (0, v.jsxs)("label", { children: [
		e === "existing" ? "Dossier du projet Studio" : "Dossier des sources",
		/* @__PURE__ */ (0, v.jsx)("input", {
			name: i,
			autoComplete: "off",
			autoCapitalize: "off",
			spellCheck: !1,
			required: !0,
			value: t[i],
			onChange: (e) => r(i, e.target.value),
			placeholder: "/Users/vous/mon-projet…",
			...a(i),
			"aria-describedby": n?.field === i ? "home-form-error" : "home-path-help"
		}),
		/* @__PURE__ */ (0, v.jsx)("small", {
			id: "home-path-help",
			children: "Chemin absolu d’un dossier sur cet ordinateur."
		})
	] })] });
}
//#endregion
//#region studio-ui/src/features/home/components/ProjectDialog.tsx
var x = {
	new: "Créer un projet",
	imported: "Importer un projet",
	existing: "Reprendre un projet"
}, S = {
	new: "Une idée suffit pour commencer. Nous préciserons ensemble le résultat à obtenir.",
	imported: "Partez de vos sources actuelles. DevMethod en crée une copie et préserve le dossier original.",
	existing: "Retrouvez un projet déjà utilisé dans DevMethod Studio, avec son contexte et ses versions."
}, C = () => ({
	name: "",
	idea: "",
	source: "",
	workspace: ""
});
function w({ open: e, kind: t, operation: n, onDismiss: i, onSubmit: a, onEdit: o }) {
	let c = (0, r.useRef)(null), d = (0, r.useRef)(null), [f, p] = (0, r.useState)({
		new: C(),
		imported: C(),
		existing: C()
	}), [m, h] = (0, r.useState)(null), g = m?.kind === t ? m.error : null, _ = n.phase !== "idle";
	(0, r.useEffect)(() => {
		let t = c.current;
		e && t && !t.open ? (t.showModal(), t.querySelector("input")?.focus()) : !e && t?.open && t.close();
	}, [e]);
	function y(e, n) {
		p((r) => ({
			...r,
			[t]: {
				...r[t],
				[e]: n
			}
		})), h(null), o();
	}
	let w = u(t, n);
	return /* @__PURE__ */ (0, v.jsxs)("dialog", {
		ref: c,
		className: "home-dialog",
		"aria-labelledby": "home-dialog-title",
		"aria-describedby": "home-dialog-description",
		onCancel: (e) => {
			_ && e.preventDefault();
		},
		onClose: i,
		children: [
			/* @__PURE__ */ (0, v.jsxs)("div", {
				className: "home-dialog-heading",
				children: [/* @__PURE__ */ (0, v.jsx)("span", {
					className: "home-eyebrow",
					children: "Votre point de départ"
				}), /* @__PURE__ */ (0, v.jsx)("button", {
					type: "button",
					"aria-label": "Fermer",
					disabled: _,
					onClick: i,
					children: /* @__PURE__ */ (0, v.jsx)("span", {
						"aria-hidden": "true",
						children: "×"
					})
				})]
			}),
			/* @__PURE__ */ (0, v.jsx)("h2", {
				id: "home-dialog-title",
				children: x[t]
			}),
			/* @__PURE__ */ (0, v.jsx)("p", {
				id: "home-dialog-description",
				children: S[t]
			}),
			/* @__PURE__ */ (0, v.jsxs)("form", {
				ref: d,
				onSubmit: (e) => {
					if (e.preventDefault(), _) return;
					let n = s(t, e.currentTarget), r = l(n);
					if (h({
						kind: t,
						error: r
					}), r) {
						let e = d.current?.elements.namedItem(r.field);
						e instanceof HTMLElement && e.focus();
					} else a(n);
				},
				children: [
					/* @__PURE__ */ (0, v.jsx)("fieldset", {
						disabled: _,
						children: /* @__PURE__ */ (0, v.jsx)(b, {
							kind: t,
							values: f[t],
							validation: g,
							onEdit: y
						})
					}),
					/* @__PURE__ */ (0, v.jsx)("p", {
						className: "home-form-note",
						children: "Aucun agent ni script du projet n’est lancé automatiquement."
					}),
					g ? /* @__PURE__ */ (0, v.jsx)("p", {
						id: "home-form-error",
						role: "alert",
						className: "home-error",
						children: g.message
					}) : null,
					n.project ? /* @__PURE__ */ (0, v.jsxs)("p", {
						className: "home-saved",
						role: "status",
						children: [
							"« ",
							n.project.name,
							" » est enregistré.",
							" ",
							n.error ? "Vous pouvez réessayer son ouverture." : "Ouverture du Studio…"
						]
					}) : null,
					n.error ? /* @__PURE__ */ (0, v.jsx)("p", {
						role: "alert",
						className: "home-error",
						children: n.error
					}) : null,
					/* @__PURE__ */ (0, v.jsxs)("div", {
						className: "home-dialog-actions",
						children: [/* @__PURE__ */ (0, v.jsx)("button", {
							type: "button",
							disabled: _,
							onClick: i,
							children: "Retour"
						}), /* @__PURE__ */ (0, v.jsxs)("button", {
							type: "submit",
							className: "primary",
							disabled: _,
							children: [_ ? /* @__PURE__ */ (0, v.jsx)("span", {
								className: "home-spinner",
								"aria-hidden": "true"
							}) : null, w]
						})]
					}),
					/* @__PURE__ */ (0, v.jsx)("p", {
						className: "home-sr",
						role: "status",
						children: _ ? w : ""
					})
				]
			})
		]
	});
}
//#endregion
//#region studio-ui/src/features/home/components/RecentProjects.tsx
function T({ projects: e, loading: t, error: n, busy: i, searchRef: o, onRefresh: s, onOpen: c, onOther: l }) {
	let [u, f] = (0, r.useState)(""), m = e.filter((e) => d(e, u));
	return /* @__PURE__ */ (0, v.jsxs)("section", {
		className: "home-recents",
		"aria-labelledby": "home-recents-title",
		children: [
			/* @__PURE__ */ (0, v.jsxs)("div", {
				className: "home-section-heading",
				children: [/* @__PURE__ */ (0, v.jsxs)("div", { children: [/* @__PURE__ */ (0, v.jsx)("h2", {
					id: "home-recents-title",
					children: "Vos projets récents"
				}), /* @__PURE__ */ (0, v.jsx)("p", { children: "Retrouvez votre contexte, vos décisions et vos versions." })] }), /* @__PURE__ */ (0, v.jsx)("button", {
					type: "button",
					className: "home-refresh",
					disabled: t || i,
					onClick: s,
					children: t ? "Actualisation…" : "Actualiser"
				})]
			}),
			e.length ? /* @__PURE__ */ (0, v.jsxs)("label", {
				className: "home-search",
				children: [/* @__PURE__ */ (0, v.jsx)("span", {
					className: "home-sr",
					children: "Rechercher un projet"
				}), /* @__PURE__ */ (0, v.jsx)("input", {
					ref: o,
					type: "search",
					name: "project-search",
					autoComplete: "off",
					value: u,
					onChange: (e) => f(e.target.value),
					placeholder: "Rechercher un projet…"
				})]
			}) : null,
			n ? /* @__PURE__ */ (0, v.jsxs)("p", {
				role: "alert",
				className: "home-error",
				children: [
					n,
					" ",
					e.length ? "Vos projets déjà chargés restent visibles. " : "",
					"Actualisez pour réessayer."
				]
			}) : null,
			t && !e.length ? /* @__PURE__ */ (0, v.jsx)("p", {
				className: "home-empty",
				role: "status",
				children: "Lecture de vos projets…"
			}) : null,
			!t && !n && !e.length ? /* @__PURE__ */ (0, v.jsxs)("div", {
				className: "home-empty",
				children: [
					/* @__PURE__ */ (0, v.jsx)(y, { kind: "folder" }),
					/* @__PURE__ */ (0, v.jsx)("h3", { children: "Votre prochain projet commence ici" }),
					/* @__PURE__ */ (0, v.jsx)("p", { children: "Créez un projet ou importez vos sources. Ils apparaîtront ici pour les retrouver facilement." })
				]
			}) : null,
			e.length && !m.length ? /* @__PURE__ */ (0, v.jsx)("p", {
				className: "home-empty",
				role: "status",
				children: "Aucun projet ne correspond à cette recherche."
			}) : null,
			/* @__PURE__ */ (0, v.jsx)("ul", {
				className: "home-project-list",
				children: m.map((e) => /* @__PURE__ */ (0, v.jsx)("li", { children: /* @__PURE__ */ (0, v.jsxs)("button", {
					type: "button",
					className: "home-project",
					disabled: i,
					onClick: () => c(e),
					"aria-label": `Ouvrir ${e.name}`,
					children: [
						/* @__PURE__ */ (0, v.jsx)("span", {
							className: "home-project-icon",
							children: /* @__PURE__ */ (0, v.jsx)(y, { kind: "folder" })
						}),
						/* @__PURE__ */ (0, v.jsxs)("span", {
							className: "home-project-copy",
							children: [/* @__PURE__ */ (0, v.jsx)("strong", { children: e.name }), /* @__PURE__ */ (0, v.jsx)("span", {
								className: "home-project-path",
								title: e.workspace,
								children: e.workspace
							})]
						}),
						/* @__PURE__ */ (0, v.jsxs)("span", {
							className: "home-project-meta",
							children: [/* @__PURE__ */ (0, v.jsx)("span", { children: a[e.kind] }), /* @__PURE__ */ (0, v.jsx)("time", {
								dateTime: e.lastOpenedAt || e.createdAt,
								children: p(e)
							})]
						}),
						/* @__PURE__ */ (0, v.jsx)("span", {
							className: "home-project-arrow",
							"aria-hidden": "true",
							children: "→"
						})
					]
				}) }, e.id))
			}),
			/* @__PURE__ */ (0, v.jsxs)("button", {
				type: "button",
				className: "home-other",
				disabled: i,
				onClick: (e) => l(e.currentTarget),
				children: ["Ouvrir un autre dossier Studio ", /* @__PURE__ */ (0, v.jsx)("span", {
					"aria-hidden": "true",
					children: "↗"
				})]
			})
		]
	});
}
//#endregion
//#region studio-ui/src/features/home/components/HomeView.tsx
var E = [
	{
		kind: "new",
		title: "Créer un projet",
		description: "Donnez forme à une idée, du premier choix à la réalisation."
	},
	{
		kind: "imported",
		title: "Importer un projet",
		description: "Partez de vos sources et construisez la suite avec leur contexte."
	},
	{
		kind: "existing",
		title: "Reprendre un projet",
		description: "Retrouvez votre espace de travail et poursuivez là où vous en étiez."
	}
];
function D(e) {
	let t = _(e), [n, i] = (0, r.useState)({
		open: !1,
		kind: "new"
	}), a = (0, r.useRef)(null), o = (0, r.useRef)(null), s = t.operation.phase !== "idle";
	function c(e, n) {
		s || (a.current = n, t.clearOperation(), i({
			open: !0,
			kind: e
		}));
	}
	function l() {
		s || (i((e) => ({
			...e,
			open: !1
		})), a.current?.focus());
	}
	return /* @__PURE__ */ (0, v.jsxs)("div", {
		className: "home-shell",
		children: [
			/* @__PURE__ */ (0, v.jsx)("a", {
				className: "home-skip",
				href: "#home-main",
				children: "Aller aux projets"
			}),
			/* @__PURE__ */ (0, v.jsxs)("header", {
				className: "home-header",
				children: [/* @__PURE__ */ (0, v.jsxs)("a", {
					className: "home-brand",
					href: "/",
					"aria-label": "DevMethod, accueil",
					children: [/* @__PURE__ */ (0, v.jsxs)("span", {
						className: "home-mark",
						"aria-hidden": "true",
						children: ["D", /* @__PURE__ */ (0, v.jsx)("span", { children: "·" })]
					}), /* @__PURE__ */ (0, v.jsxs)("span", { children: ["DevMethod ", /* @__PURE__ */ (0, v.jsx)("small", { children: "Studio" })] })]
				}), /* @__PURE__ */ (0, v.jsxs)("span", {
					className: "home-local",
					children: [/* @__PURE__ */ (0, v.jsx)("span", { "aria-hidden": "true" }), "Votre espace local"]
				})]
			}),
			/* @__PURE__ */ (0, v.jsxs)("main", {
				id: "home-main",
				children: [
					/* @__PURE__ */ (0, v.jsxs)("section", {
						className: "home-hero",
						"aria-labelledby": "home-title",
						children: [
							/* @__PURE__ */ (0, v.jsx)("span", {
								className: "home-eyebrow",
								children: "Une idée, un projet, une prochaine étape"
							}),
							/* @__PURE__ */ (0, v.jsxs)("h1", {
								id: "home-title",
								children: [
									"Quel projet allons-nous",
									/* @__PURE__ */ (0, v.jsx)("br", { className: "home-title-break" }),
									" faire avancer ?"
								]
							}),
							/* @__PURE__ */ (0, v.jsxs)("p", { children: [
								"Commencez avec une idée ou avec ce qui existe déjà.",
								/* @__PURE__ */ (0, v.jsx)("br", { className: "home-title-break" }),
								" Gardez le fil, les choix et les preuves au même endroit."
							] }),
							/* @__PURE__ */ (0, v.jsx)("div", {
								className: "home-entry-grid",
								children: E.map((e) => /* @__PURE__ */ (0, v.jsxs)("button", {
									type: "button",
									className: `home-entry home-entry-${e.kind}`,
									disabled: s,
									onClick: (n) => {
										e.kind === "existing" && t.projects.length && o.current ? (o.current.scrollIntoView?.({ block: "center" }), o.current.focus()) : c(e.kind, n.currentTarget);
									},
									children: [
										/* @__PURE__ */ (0, v.jsx)("span", {
											className: "home-entry-icon",
											children: /* @__PURE__ */ (0, v.jsx)(y, { kind: e.kind })
										}),
										/* @__PURE__ */ (0, v.jsx)("strong", { children: e.title }),
										/* @__PURE__ */ (0, v.jsx)("span", {
											className: "home-entry-description",
											children: e.description
										}),
										/* @__PURE__ */ (0, v.jsxs)("span", {
											className: "home-entry-link",
											children: [
												e.kind === "new" ? "Partir de mon idée" : e.kind === "imported" ? "Choisir mes sources" : "Retrouver mon projet",
												" ",
												/* @__PURE__ */ (0, v.jsx)("span", {
													"aria-hidden": "true",
													children: "→"
												})
											]
										})
									]
								}, e.kind))
							})
						]
					}),
					!n.open && t.operation.error ? /* @__PURE__ */ (0, v.jsxs)("p", {
						role: "alert",
						className: "home-error",
						children: [t.operation.error, " Réessayez l’ouverture depuis la liste."]
					}) : null,
					!n.open && s ? /* @__PURE__ */ (0, v.jsxs)("p", {
						role: "status",
						className: "home-opening",
						children: [
							"Ouverture de « ",
							t.operation.project?.name,
							" »…"
						]
					}) : null,
					/* @__PURE__ */ (0, v.jsx)(T, {
						projects: t.projects,
						loading: t.loading,
						error: t.loadError,
						busy: s,
						searchRef: o,
						onRefresh: () => void t.refresh(),
						onOpen: (e) => void t.run(e),
						onOther: (e) => c("existing", e)
					})
				]
			}),
			/* @__PURE__ */ (0, v.jsx)("footer", {
				className: "home-footer",
				children: "Vos projets restent sur cet ordinateur. Vous choisissez quand lancer un agent."
			}),
			/* @__PURE__ */ (0, v.jsx)(w, {
				...n,
				operation: t.operation,
				onDismiss: l,
				onSubmit: (e) => void t.run(e),
				onEdit: t.clearOperation
			})
		]
	});
}
//#endregion
//#region studio-ui/src/home-widget.tsx
function O(e, t = {}) {
	let n = (0, i.createRoot)(e);
	return n.render(/* @__PURE__ */ (0, v.jsx)(D, { ...t })), { dispose: () => n.unmount() };
}
var k = document.getElementById("studio-home");
k && O(k);
//#endregion
export { O as mountHomeWidget };
