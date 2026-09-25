import { i as e, t } from "./jsx-runtime-D7gWoUTT.js";
import { a as n, c as r, f as i, i as a, l as o, n as s, o as c, p as l, r as u, s as d, t as f, u as p } from "./architecture-model-BrTs_SJo.js";
/* empty css                      */
//#region studio-ui/src/features/project/hooks/useArchitectureCanvas.ts
var m = e();
function h(e, t, i) {
	let [a, o] = (0, m.useState)(() => n(e)), s = p(e);
	a.signature !== s && o(n(e, a));
	let [c, l] = (0, m.useState)({
		x: 0,
		y: 0,
		zoom: 1
	}), [u, d] = (0, m.useState)(i);
	if (u !== i) {
		let e = r(t, a), n = Math.min(1, 880 / e.width);
		d(i), l({
			x: (880 - e.width * n) / 2 - e.x * n,
			y: -e.y * n,
			zoom: n
		});
	}
	let f = (0, m.useRef)(null), h = (e, t) => l((n) => ({
		...n,
		x: n.x + e,
		y: n.y + t
	}));
	function g(e) {
		if (e.button !== 0 || e.target.closest("[data-graph-select]")) return;
		let t = e.currentTarget.getBoundingClientRect();
		f.current = {
			id: e.pointerId,
			x: e.clientX,
			y: e.clientY,
			originX: c.x,
			originY: c.y,
			scale: Math.max(e.currentTarget.viewBox.baseVal.width / t.width, e.currentTarget.viewBox.baseVal.height / t.height)
		}, e.currentTarget.setPointerCapture(e.pointerId);
	}
	function _(e) {
		let t = f.current;
		t && t.id === e.pointerId && l((n) => ({
			...n,
			x: t.originX + (e.clientX - t.x) * t.scale,
			y: t.originY + (e.clientY - t.y) * t.scale
		}));
	}
	function v(e) {
		f.current = null, e.currentTarget.hasPointerCapture(e.pointerId) && e.currentTarget.releasePointerCapture(e.pointerId);
	}
	function y(e) {
		if (e.target !== e.currentTarget) return;
		let t = {
			ArrowLeft: [40, 0],
			ArrowRight: [-40, 0],
			ArrowUp: [0, 40],
			ArrowDown: [0, -40]
		}[e.key];
		t && (e.preventDefault(), h(...t));
	}
	return {
		layout: a,
		camera: c,
		pan: h,
		handlers: {
			onPointerDown: g,
			onPointerMove: _,
			onPointerUp: v,
			onPointerCancel: v,
			onKeyDown: y
		},
		reset: () => l({
			x: 0,
			y: 0,
			zoom: 1
		}),
		fit: (e) => {
			let t = Math.min(880 / e.width, 460 / e.height, 1);
			l({
				x: (880 - e.width * t) / 2 - e.x * t,
				y: -e.y * t,
				zoom: t
			});
		},
		zoom: (e) => l((t) => {
			let n = Math.max(.05, Math.min(3, t.zoom * e)), r = n / t.zoom;
			return {
				zoom: n,
				x: 440 - (440 - t.x) * r,
				y: 230 - (230 - t.y) * r
			};
		})
	};
}
//#endregion
//#region studio-ui/src/features/project/components/ArchitectureGraph.tsx
var g = t(), _ = {
	frontend: "M3 4h18v16H3zM3 9h18M7 6.5h.1M10 6.5h.1",
	module: "m12 3 9 5-9 5-9-5 9-5m-9 9 9 5 9-5m-18 5 9 5 9-5",
	service: "M4 3h16v7H4zM4 14h16v7H4zM7 6.5h.1M7 17.5h.1M12 7h5M12 18h5",
	endpoint: "M3 7h17m-4-4 4 4-4 4M21 17H4m4-4-4 4 4 4",
	database: "M3 6c0-5 18-5 18 0S3 11 3 6v12c0 5 18 5 18 0V6M3 12c0 5 18 5 18 0",
	cache: "M5 5h14v14H5zM9 9h6v6H9zM8 2v3m8-3v3M8 19v3m8-3v3M2 8h3m-3 8h3M19 8h3m-3 8h3",
	queue: "M3 5h12M3 12h12M3 19h12m2-10 4 3-4 3",
	storage: "M3 3h18v6H3zM5 9v12h14V9M9 13h6",
	external: "M13 3h8v8m0-8L10 14M9 5H3v16h16v-6",
	contract: "M5 3h10l4 4v14H5zM14 3v5h5M8 12h8M8 16h8",
	test: "m5 12 4 4L19 6"
}, v = {
	detected: "Détecté dans le code",
	declared: "Déclaré",
	observed: "Observé",
	inferred: "Supposé"
};
function y(e, t) {
	(e.key === "Enter" || e.key === " ") && (e.preventDefault(), t());
}
function b({ element: e, point: t, selected: n, change: r, visible: i, onSelect: a, onOpenSource: o }) {
	let c = e.sources[0], u = i ? 0 : -1, d = [...new Set(e.provenance.map((e) => v[e.kind]))].join(" · ") || "Provenance non renseignée";
	return /* @__PURE__ */ (0, g.jsxs)("g", {
		transform: `translate(${t.x},${t.y})`,
		children: [/* @__PURE__ */ (0, g.jsxs)("g", {
			role: "button",
			tabIndex: u,
			"aria-pressed": n,
			"aria-label": `${e.label} · ${s[e.type]} · ${d}`,
			"data-graph-select": "node",
			onClick: () => a(e.id),
			onKeyDown: (t) => y(t, () => a(e.id)),
			className: "arch-svg-action",
			children: [
				/* @__PURE__ */ (0, g.jsxs)("title", { children: [
					e.label,
					"\n",
					e.description,
					"\n",
					d,
					"\n",
					"Runtime : ",
					e.runtime === "observed" ? "observé" : "non observé"
				] }),
				/* @__PURE__ */ (0, g.jsx)("rect", {
					width: f.width,
					height: f.height,
					rx: 9,
					fill: n ? "#182344" : "#0e1c31",
					stroke: n ? "#9b82ff" : "#2b4568",
					strokeWidth: n ? 2 : 1
				}),
				/* @__PURE__ */ (0, g.jsx)("rect", {
					x: 12,
					y: 18,
					width: 34,
					height: 34,
					rx: 8,
					fill: "#1a2c48"
				}),
				/* @__PURE__ */ (0, g.jsx)("path", {
					transform: "translate(18, 24) scale(.92)",
					d: _[e.type],
					fill: "none",
					stroke: e.layer === "frontend" ? "#50c9e8" : "#b8c5ee",
					strokeWidth: 1.6,
					strokeLinecap: "round",
					strokeLinejoin: "round",
					"aria-hidden": "true"
				}),
				/* @__PURE__ */ (0, g.jsx)("text", {
					x: 58,
					y: 31,
					fill: "#f5f7fc",
					fontSize: 13,
					fontWeight: 600,
					children: l(e.label, 20)
				}),
				/* @__PURE__ */ (0, g.jsx)("text", {
					x: 58,
					y: 51,
					fill: "#becbe0",
					fontSize: 11,
					children: s[e.type]
				}),
				/* @__PURE__ */ (0, g.jsx)("text", {
					x: 14,
					y: 76,
					fill: "#9fb7d9",
					fontSize: 10,
					children: l(d, 34)
				}),
				/* @__PURE__ */ (0, g.jsx)("text", {
					x: 14,
					y: 95,
					fill: e.runtime === "observed" ? "#69dcab" : "#cad3e2",
					fontSize: 10,
					children: e.runtime === "observed" ? "◉ Exécution observée" : "○ Exécution non observée"
				}),
				r ? /* @__PURE__ */ (0, g.jsx)("text", {
					x: f.width - 9,
					y: 95,
					textAnchor: "end",
					fill: r === "added" ? "#69dcab" : "#f2ba58",
					fontSize: 10,
					children: r === "added" ? "+ Ajout" : "Δ Modifié"
				}) : null
			]
		}), c ? /* @__PURE__ */ (0, g.jsxs)("g", {
			role: "button",
			tabIndex: u,
			"data-graph-select": "source",
			className: "arch-svg-action",
			"aria-label": `Ouvrir le code de ${e.label}`,
			onClick: () => o(c.path, c.line),
			onKeyDown: (e) => y(e, () => o(c.path, c.line)),
			children: [/* @__PURE__ */ (0, g.jsx)("rect", {
				x: f.width - 28,
				y: 3,
				width: 24,
				height: 24,
				fill: "#0e1c31",
				rx: 4
			}), /* @__PURE__ */ (0, g.jsx)("text", {
				x: f.width - 16,
				y: 20,
				fill: "#bcaaff",
				textAnchor: "middle",
				fontSize: 16,
				"aria-hidden": "true",
				children: "↗"
			})]
		}) : null]
	});
}
function x({ relation: e, path: t, markerId: n, selected: r, onSelect: i, label: o }) {
	let s = new Set(e.provenance.map((e) => e.kind)), c = s.has("observed") ? "2 4" : s.has("detected") ? void 0 : "7 5";
	return /* @__PURE__ */ (0, g.jsxs)("g", {
		role: "button",
		tabIndex: -1,
		"data-graph-select": "edge",
		className: "arch-svg-action",
		"aria-label": `${a[e.kind]} : ${e.label}`,
		onClick: () => i(e.id),
		onKeyDown: (t) => y(t, () => i(e.id)),
		children: [
			/* @__PURE__ */ (0, g.jsxs)("title", { children: [
				e.label,
				"\n",
				e.provenance.map((e) => `${v[e.kind]} · ${e.method}`).join("\n")
			] }),
			/* @__PURE__ */ (0, g.jsx)("path", {
				d: t,
				stroke: "transparent",
				strokeWidth: 16,
				fill: "none"
			}),
			/* @__PURE__ */ (0, g.jsx)("path", {
				d: t,
				stroke: r ? "#9b82ff" : "#92abd7",
				strokeWidth: r ? 3 : 1.6,
				strokeDasharray: c,
				fill: "none",
				markerEnd: `url(#${n})`
			}),
			o ? /* @__PURE__ */ (0, g.jsx)("text", {
				x: o.x,
				y: o.y,
				textAnchor: "middle",
				fill: "#c4d3f0",
				fontSize: 10,
				stroke: "#0b1729",
				strokeWidth: 5,
				paintOrder: "stroke",
				children: a[e.kind]
			}) : null
		]
	});
}
function S(e) {
	let t = `arrow-${(0, m.useId)().replaceAll(":", "")}`, n = `dots-${t}`, { elements: a, relations: o, canvas: s } = e, l = r(a, s.layout), d = [...new Set(a.map(c))];
	return /* @__PURE__ */ (0, g.jsxs)("svg", {
		ref: e.svgRef,
		className: "arch-graph",
		role: "group",
		"aria-label": "Carte d’architecture. Flèches pour déplacer la carte, tabulation pour sélectionner un élément.",
		tabIndex: 0,
		viewBox: "0 0 880 460",
		preserveAspectRatio: "xMidYMin meet",
		xmlns: "http://www.w3.org/2000/svg",
		style: { fontFamily: "Inter, system-ui, sans-serif" },
		...s.handlers,
		children: [
			/* @__PURE__ */ (0, g.jsx)("title", { children: "Architecture du projet sélectionné" }),
			/* @__PURE__ */ (0, g.jsx)("desc", { children: "Carte issue de l’analyse du projet. Les connexions de code ne prouvent pas le fonctionnement à l’exécution. Une liste navigable est disponible sous la carte." }),
			/* @__PURE__ */ (0, g.jsxs)("defs", { children: [/* @__PURE__ */ (0, g.jsx)("pattern", {
				id: n,
				width: 22,
				height: 22,
				patternUnits: "userSpaceOnUse",
				children: /* @__PURE__ */ (0, g.jsx)("circle", {
					cx: 1,
					cy: 1,
					r: .8,
					fill: "#203652"
				})
			}), /* @__PURE__ */ (0, g.jsx)("marker", {
				id: t,
				viewBox: "0 0 10 10",
				refX: 9,
				refY: 5,
				markerWidth: 6,
				markerHeight: 6,
				orient: "auto",
				children: /* @__PURE__ */ (0, g.jsx)("path", {
					d: "M 0 0 L 10 5 L 0 10 z",
					fill: "#92abd7"
				})
			})] }),
			/* @__PURE__ */ (0, g.jsx)("rect", {
				width: 880,
				height: 460,
				fill: "#0b1729"
			}),
			/* @__PURE__ */ (0, g.jsx)("rect", {
				width: 880,
				height: 460,
				fill: `url(#${n})`
			}),
			/* @__PURE__ */ (0, g.jsxs)("g", {
				transform: `translate(${s.camera.x},${s.camera.y}) scale(${s.camera.zoom})`,
				children: [
					d.map((e) => /* @__PURE__ */ (0, g.jsxs)("g", {
						"aria-hidden": "true",
						children: [/* @__PURE__ */ (0, g.jsx)("rect", {
							x: (s.layout.lanes[e] ?? 0) * f.column + 8,
							y: 10,
							width: 250,
							height: l.y + l.height - 16,
							rx: 8,
							fill: "#0f2036",
							fillOpacity: .55,
							stroke: "#294363"
						}), /* @__PURE__ */ (0, g.jsx)("text", {
							x: (s.layout.lanes[e] ?? 0) * f.column + 22,
							y: 33,
							fill: "#b6adff",
							fontSize: 13,
							fontWeight: 600,
							children: u[e]
						})]
					}, e)),
					o.map((n) => {
						let r = s.layout.positions[n.source], a = s.layout.positions[n.target];
						if (!r || !a) return null;
						let c = o.length <= 24 || n.id === e.selectedId ? {
							x: (r.x + a.x + f.width) / 2,
							y: (r.y + a.y + f.height) / 2 - 8
						} : void 0;
						return /* @__PURE__ */ (0, g.jsx)(x, {
							relation: n,
							path: i(r, a),
							markerId: t,
							selected: n.id === e.selectedId,
							onSelect: e.onSelect,
							label: c
						}, n.id);
					}),
					a.map((t) => {
						let n = s.layout.positions[t.id];
						return n ? /* @__PURE__ */ (0, g.jsx)(b, {
							element: t,
							point: n,
							visible: n.x * s.camera.zoom + s.camera.x >= 0 && n.y * s.camera.zoom + s.camera.y >= 0 && (n.x + f.width) * s.camera.zoom + s.camera.x <= 880 && (n.y + f.height) * s.camera.zoom + s.camera.y <= 460,
							selected: t.id === e.selectedId,
							change: e.changes.get(t.id),
							onSelect: e.onSelect,
							onOpenSource: e.onOpenSource
						}, t.id) : null;
					})
				]
			})
		]
	});
}
//#endregion
//#region studio-ui/src/features/project/components/ArchitectureView.tsx
function C(e, t) {
	let n = e.cloneNode(!0);
	n.removeAttribute("xmlns");
	let r = e.getBoundingClientRect();
	n.setAttribute("width", String(Math.round(r.width))), n.setAttribute("height", String(Math.round(r.height)));
	let i = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(n)], { type: "image/svg+xml;charset=utf-8" })), a = document.createElement("a");
	a.href = i, a.download = `architecture-${t.replace(/[^a-z0-9_-]/gi, "").slice(0, 24)}.svg`, a.click(), setTimeout(() => URL.revokeObjectURL(i), 1e3);
}
function w({ current: e, previous: t }) {
	let n = new Set(e.elements.map((e) => e.id)), r = t.elements.filter((e) => !n.has(e.id)), i = new Set(e.relations.map((e) => e.id)), a = new Set(t.relations.map((e) => e.id));
	return /* @__PURE__ */ (0, g.jsxs)("details", {
		className: "arch-comparison",
		open: !0,
		children: [
			/* @__PURE__ */ (0, g.jsxs)("summary", { children: [
				"Comparaison ",
				t.revisionId.slice(0, 8),
				" → ",
				e.revisionId.slice(0, 8)
			] }),
			/* @__PURE__ */ (0, g.jsxs)("p", { children: [
				e.relations.filter((e) => !a.has(e.id)).length,
				" connexion(s) ajoutée(s) · ",
				t.relations.filter((e) => !i.has(e.id)).length,
				" ",
				"supprimée(s). Les marqueurs de modification portent sur les éléments de la version actuelle."
			] }),
			r.length ? /* @__PURE__ */ (0, g.jsxs)("details", { children: [
				/* @__PURE__ */ (0, g.jsxs)("summary", { children: [r.length, " élément(s) retiré(s)"] }),
				/* @__PURE__ */ (0, g.jsx)("ul", { children: r.slice(0, 100).map((e) => /* @__PURE__ */ (0, g.jsxs)("li", { children: [
					e.label,
					" ",
					/* @__PURE__ */ (0, g.jsxs)("small", { children: ["— ", e.sources.map((e) => e.path).join(", ")] })
				] }, e.id)) }),
				r.length > 100 ? /* @__PURE__ */ (0, g.jsx)("p", { children: "Liste limitée à 100 éléments retirés." }) : null
			] }) : /* @__PURE__ */ (0, g.jsx)("p", { children: "Aucun élément retiré détecté." })
		]
	});
}
function T({ elements: e, relations: t, selectedId: n, onSelect: r, onOpenSource: i }) {
	return /* @__PURE__ */ (0, g.jsxs)("details", {
		className: "arch-list",
		children: [
			/* @__PURE__ */ (0, g.jsxs)("summary", { children: [
				"Liste accessible · ",
				e.length,
				" éléments · ",
				t.length,
				" connexions"
			] }),
			/* @__PURE__ */ (0, g.jsx)("ul", { children: e.map((e) => /* @__PURE__ */ (0, g.jsxs)("li", { children: [/* @__PURE__ */ (0, g.jsxs)("button", {
				type: "button",
				"aria-pressed": n === e.id,
				onClick: () => r(e.id),
				children: [
					e.label,
					" ",
					/* @__PURE__ */ (0, g.jsx)("small", { children: s[e.type] })
				]
			}), e.sources[0] ? /* @__PURE__ */ (0, g.jsxs)("button", {
				type: "button",
				onClick: () => i(e.sources[0].path, e.sources[0].line),
				children: ["Ouvrir le code ", /* @__PURE__ */ (0, g.jsxs)("span", {
					className: "sr-only",
					children: ["de ", e.label]
				})]
			}) : /* @__PURE__ */ (0, g.jsx)("small", { children: "Aucune source liée" })] }, e.id)) }),
			/* @__PURE__ */ (0, g.jsxs)("details", { children: [/* @__PURE__ */ (0, g.jsx)("summary", { children: "Connexions et provenance" }), /* @__PURE__ */ (0, g.jsx)("ul", { children: t.map((e) => /* @__PURE__ */ (0, g.jsxs)("li", { children: [/* @__PURE__ */ (0, g.jsxs)("button", {
				type: "button",
				"aria-pressed": n === e.id,
				onClick: () => r(e.id),
				children: [
					a[e.kind],
					" · ",
					e.label
				]
			}), /* @__PURE__ */ (0, g.jsx)("small", { children: e.provenance.map((e) => e.method).join(" · ") || "Provenance non renseignée" })] }, e.id)) })] })
		]
	});
}
function E(e) {
	let [t, n] = (0, m.useState)(""), i = (0, m.useDeferredValue)(t), [c, l] = (0, m.useState)("all"), [u, f] = (0, m.useState)("all"), [p, _] = (0, m.useState)(!1), [v, y] = (0, m.useState)(!1), [b, x] = (0, m.useState)(40), [E, D] = (0, m.useState)(""), O = (0, m.useRef)(null), k = e.model.analysis, A = d(k, {
		search: i,
		elementType: c,
		relationKind: u,
		details: p,
		limit: b
	}, e.selectedId), j = h(k.elements, A.elements, JSON.stringify([
		i,
		c,
		u,
		p,
		b
	])), M = v ? o(k, e.model.previous) : /* @__PURE__ */ new Map(), N = k.elements.find((t) => t.id === e.selectedId);
	function P() {
		if (O.current) try {
			C(O.current, k.revisionId), D("");
		} catch {
			D("Export indisponible dans ce navigateur. Vous pouvez conserver la liste des éléments.");
		}
	}
	return /* @__PURE__ */ (0, g.jsxs)("section", {
		className: "architecture-view",
		"aria-label": "Architecture du projet",
		children: [
			/* @__PURE__ */ (0, g.jsxs)("div", {
				className: "arch-toolbar",
				children: [
					/* @__PURE__ */ (0, g.jsxs)("label", {
						className: "arch-search",
						children: [
							/* @__PURE__ */ (0, g.jsx)("span", {
								className: "sr-only",
								children: "Rechercher un composant ou fichier"
							}),
							/* @__PURE__ */ (0, g.jsx)("span", {
								"aria-hidden": "true",
								children: "⌕"
							}),
							/* @__PURE__ */ (0, g.jsx)("input", {
								value: t,
								onChange: (e) => n(e.target.value),
								placeholder: "Rechercher un composant…",
								name: "architecture-search",
								autoComplete: "off",
								spellCheck: !1
							})
						]
					}),
					/* @__PURE__ */ (0, g.jsxs)("div", {
						className: "arch-zoom",
						role: "group",
						"aria-label": "Zoom de la carte",
						children: [
							/* @__PURE__ */ (0, g.jsx)("button", {
								type: "button",
								onClick: () => j.zoom(1 / 1.2),
								"aria-label": "Réduire le zoom",
								children: "−"
							}),
							/* @__PURE__ */ (0, g.jsxs)("button", {
								type: "button",
								onClick: j.reset,
								"aria-label": "Rétablir le zoom lisible à 100 %",
								children: [Math.round(j.camera.zoom * 100), " %"]
							}),
							/* @__PURE__ */ (0, g.jsx)("button", {
								type: "button",
								onClick: () => j.zoom(1.2),
								"aria-label": "Augmenter le zoom",
								children: "+"
							})
						]
					}),
					/* @__PURE__ */ (0, g.jsx)("button", {
						type: "button",
						onClick: () => j.fit(r(A.elements, j.layout)),
						children: "Ajuster"
					}),
					/* @__PURE__ */ (0, g.jsx)("button", {
						type: "button",
						"aria-pressed": v,
						disabled: !e.model.previous,
						onClick: () => y((e) => !e),
						children: "Comparer"
					}),
					/* @__PURE__ */ (0, g.jsx)("button", {
						type: "button",
						onClick: P,
						disabled: !A.elements.length,
						children: "↓ Export SVG"
					})
				]
			}),
			/* @__PURE__ */ (0, g.jsxs)("div", {
				className: "arch-filters",
				children: [
					/* @__PURE__ */ (0, g.jsxs)("label", { children: [
						"Éléments",
						" ",
						/* @__PURE__ */ (0, g.jsxs)("select", {
							value: c,
							onChange: (e) => l(e.target.value),
							children: [/* @__PURE__ */ (0, g.jsx)("option", {
								value: "all",
								children: "Tous les types"
							}), Object.entries(s).map(([e, t]) => /* @__PURE__ */ (0, g.jsx)("option", {
								value: e,
								children: t
							}, e))]
						})
					] }),
					/* @__PURE__ */ (0, g.jsxs)("label", { children: [
						"Connexions",
						" ",
						/* @__PURE__ */ (0, g.jsxs)("select", {
							value: u,
							onChange: (e) => f(e.target.value),
							children: [/* @__PURE__ */ (0, g.jsx)("option", {
								value: "all",
								children: "Tous les liens"
							}), Object.entries(a).map(([e, t]) => /* @__PURE__ */ (0, g.jsx)("option", {
								value: e,
								children: t
							}, e))]
						})
					] }),
					/* @__PURE__ */ (0, g.jsxs)("label", {
						className: "arch-checkbox",
						children: [
							/* @__PURE__ */ (0, g.jsx)("input", {
								type: "checkbox",
								checked: p,
								onChange: (e) => _(e.target.checked)
							}),
							" ",
							"Modules, tests et contrats"
						]
					}),
					/* @__PURE__ */ (0, g.jsxs)("span", {
						className: "arch-count",
						"aria-live": "polite",
						children: [
							A.elements.length,
							" / ",
							A.total,
							" éléments filtrés"
						]
					})
				]
			}),
			k.backendDetected ? null : /* @__PURE__ */ (0, g.jsx)("p", {
				className: "arch-note",
				children: "Aucun backend métier détecté dans ces sources. Le serveur du Studio n’est pas ajouté à cette carte."
			}),
			e.model.previous ? null : /* @__PURE__ */ (0, g.jsx)("p", {
				className: "arch-note",
				children: "Comparaison indisponible : aucune analyse précédente pour ce projet."
			}),
			v && e.model.previous ? /* @__PURE__ */ (0, g.jsx)(w, {
				current: k,
				previous: e.model.previous
			}) : null,
			/* @__PURE__ */ (0, g.jsxs)("div", {
				className: "arch-canvas",
				children: [A.elements.length ? /* @__PURE__ */ (0, g.jsx)(S, {
					elements: A.elements,
					relations: A.relations,
					selectedId: e.selectedId,
					onSelect: e.onSelect,
					onOpenSource: e.onOpenSource,
					canvas: j,
					svgRef: O,
					changes: M
				}) : /* @__PURE__ */ (0, g.jsxs)("div", {
					className: "arch-empty",
					children: [/* @__PURE__ */ (0, g.jsx)("h3", { children: "Aucun élément dans ce périmètre" }), /* @__PURE__ */ (0, g.jsx)("p", { children: "Activez les détails ou élargissez les filtres. L’analyse ne crée pas de services absents du projet." })]
				}), /* @__PURE__ */ (0, g.jsxs)("div", {
					className: "arch-legend",
					children: [
						/* @__PURE__ */ (0, g.jsx)("span", { children: "━ Détecté dans le code" }),
						/* @__PURE__ */ (0, g.jsx)("span", { children: "┄ Déclaré / supposé" }),
						/* @__PURE__ */ (0, g.jsx)("span", { children: "┈ Observé à l’exécution" })
					]
				})]
			}),
			/* @__PURE__ */ (0, g.jsxs)("div", {
				className: "arch-status",
				children: [/* @__PURE__ */ (0, g.jsx)("span", { children: "Carte déplaçable : glisser le fond ou utiliser les flèches. Ajuster affiche l’ensemble ; 100 % rétablit la lecture." }), /* @__PURE__ */ (0, g.jsxs)("span", { children: [
					"Analyse",
					" ",
					k.status === "complete" ? "terminée" : k.status === "partial" ? "partielle" : "en échec",
					" ",
					"· ",
					new Date(k.analyzedAt).toLocaleString("fr-FR")
				] })]
			}),
			N ? /* @__PURE__ */ (0, g.jsxs)("div", {
				className: "arch-selected",
				children: [
					/* @__PURE__ */ (0, g.jsx)("strong", { children: N.label }),
					/* @__PURE__ */ (0, g.jsx)("span", { children: N.description }),
					/* @__PURE__ */ (0, g.jsx)("button", {
						type: "button",
						onClick: () => e.onShowChecks(N.sources[0]?.path),
						children: "Vérifications associées"
					})
				]
			}) : null,
			A.total > A.elements.length ? /* @__PURE__ */ (0, g.jsxs)("p", {
				className: "arch-note",
				children: [
					"Carte bornée à ",
					b,
					" éléments pour rester lisible.",
					" ",
					b < 100 ? /* @__PURE__ */ (0, g.jsx)("button", {
						type: "button",
						onClick: () => x(100),
						children: "Afficher jusqu’à 100 éléments"
					}) : "Affinez la recherche pour explorer les autres éléments."
				]
			}) : null,
			A.omittedRelations > 0 ? /* @__PURE__ */ (0, g.jsxs)("p", {
				className: "arch-note",
				children: [A.omittedRelations, " liens non dessinés au-delà de la limite de 200. Affinez les filtres."]
			}) : null,
			E ? /* @__PURE__ */ (0, g.jsx)("p", {
				role: "alert",
				className: "arch-note",
				children: E
			}) : null,
			/* @__PURE__ */ (0, g.jsx)(T, {
				elements: A.elements,
				relations: A.relations,
				selectedId: e.selectedId,
				onSelect: e.onSelect,
				onOpenSource: e.onOpenSource
			})
		]
	});
}
//#endregion
export { E as ArchitectureView };
