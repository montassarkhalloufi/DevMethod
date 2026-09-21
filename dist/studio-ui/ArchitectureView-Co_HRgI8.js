import { i as e, r as t, t as n } from "./jsx-runtime-DZd2gj5L.js";
import { s as r } from "./i18n-CRhBcIYq.js";
import { a as i, c as a, f as o, i as s, l as c, n as l, o as u, p as d, r as f, s as p, t as m, u as h } from "./architecture-model-CYlN9V-Z.js";
/* empty css                      */
//#region studio-ui/src/features/project/hooks/useArchitectureCanvas.ts
var g = e();
function _(e, t, n) {
	let [r, o] = (0, g.useState)(() => i(e)), s = h(e);
	r.signature !== s && o(i(e, r));
	let [c, l] = (0, g.useState)({
		x: 0,
		y: 0,
		zoom: 1
	}), [u, d] = (0, g.useState)(n);
	if (u !== n) {
		let e = a(t, r), i = Math.min(1, 880 / e.width);
		d(n), l({
			x: (880 - e.width * i) / 2 - e.x * i,
			y: -e.y * i,
			zoom: i
		});
	}
	let f = (0, g.useRef)(null), p = (e, t) => l((n) => ({
		...n,
		x: n.x + e,
		y: n.y + t
	}));
	function m(e) {
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
		t && (e.preventDefault(), p(...t));
	}
	return {
		layout: r,
		camera: c,
		pan: p,
		handlers: {
			onPointerDown: m,
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
var v = n(), y = {
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
}, b = (e = "en") => ({
	detected: r("Détecté dans le code", "Detected in code", void 0, e),
	declared: r("Déclaré", "Declared", void 0, e),
	observed: r("Observé", "Observed", void 0, e),
	inferred: r("Supposé", "Assumed", void 0, e)
});
function x(e, t) {
	(e.key === "Enter" || e.key === " ") && (e.preventDefault(), t());
}
function S({ element: e, point: n, selected: r, change: i, visible: a, onSelect: o, onOpenSource: s }) {
	let { t: c, locale: u } = t(), f = e.sources[0], p = a ? 0 : -1, h = [...new Set(e.provenance.map((e) => b(u)[e.kind]))].join(" · ") || c("Provenance non renseignée", "Provenance not provided");
	return /* @__PURE__ */ (0, v.jsxs)("g", {
		transform: `translate(${n.x},${n.y})`,
		children: [/* @__PURE__ */ (0, v.jsxs)("g", {
			role: "button",
			tabIndex: p,
			"aria-pressed": r,
			"aria-label": `${e.label} · ${l(u)[e.type]} · ${h}`,
			"data-graph-select": "node",
			onClick: () => o(e.id),
			onKeyDown: (t) => x(t, () => o(e.id)),
			className: "arch-svg-action",
			children: [
				/* @__PURE__ */ (0, v.jsxs)("title", { children: [
					e.label,
					"\n",
					e.description,
					"\n",
					h,
					"\n",
					c("Runtime :", "Runtime:"),
					" ",
					e.runtime === "observed" ? c("observé", "observed") : c("non observé", "not observed")
				] }),
				/* @__PURE__ */ (0, v.jsx)("rect", {
					width: m.width,
					height: m.height,
					rx: 9,
					fill: r ? "#182344" : "#0e1c31",
					stroke: r ? "#9b82ff" : "#2b4568",
					strokeWidth: r ? 2 : 1
				}),
				/* @__PURE__ */ (0, v.jsx)("rect", {
					x: 12,
					y: 18,
					width: 34,
					height: 34,
					rx: 8,
					fill: "#1a2c48"
				}),
				/* @__PURE__ */ (0, v.jsx)("path", {
					transform: "translate(18, 24) scale(.92)",
					d: y[e.type],
					fill: "none",
					stroke: e.layer === "frontend" ? "#50c9e8" : "#b8c5ee",
					strokeWidth: 1.6,
					strokeLinecap: "round",
					strokeLinejoin: "round",
					"aria-hidden": "true"
				}),
				/* @__PURE__ */ (0, v.jsx)("text", {
					x: 58,
					y: 31,
					fill: "#f5f7fc",
					fontSize: 13,
					fontWeight: 600,
					children: d(e.label, 20)
				}),
				/* @__PURE__ */ (0, v.jsx)("text", {
					x: 58,
					y: 51,
					fill: "#becbe0",
					fontSize: 11,
					children: l(u)[e.type]
				}),
				/* @__PURE__ */ (0, v.jsx)("text", {
					x: 14,
					y: 76,
					fill: "#9fb7d9",
					fontSize: 10,
					children: d(h, 34)
				}),
				/* @__PURE__ */ (0, v.jsx)("text", {
					x: 14,
					y: 95,
					fill: e.runtime === "observed" ? "#69dcab" : "#cad3e2",
					fontSize: 10,
					children: e.runtime === "observed" ? c("◉ Exécution observée", "◉ Execution observed") : c("○ Exécution non observée", "○ Execution not observed")
				}),
				i ? /* @__PURE__ */ (0, v.jsx)("text", {
					x: m.width - 9,
					y: 95,
					textAnchor: "end",
					fill: i === "added" ? "#69dcab" : "#f2ba58",
					fontSize: 10,
					children: i === "added" ? c("+ Ajout", "+ Added") : c("Δ Modifié", "Δ Modified")
				}) : null
			]
		}), f ? /* @__PURE__ */ (0, v.jsxs)("g", {
			role: "button",
			tabIndex: p,
			"data-graph-select": "source",
			className: "arch-svg-action",
			"aria-label": c("Ouvrir le code de {name}", "Open source for {name}", { name: e.label }),
			onClick: () => s(f.path, f.line),
			onKeyDown: (e) => x(e, () => s(f.path, f.line)),
			children: [/* @__PURE__ */ (0, v.jsx)("rect", {
				x: m.width - 28,
				y: 3,
				width: 24,
				height: 24,
				fill: "#0e1c31",
				rx: 4
			}), /* @__PURE__ */ (0, v.jsx)("text", {
				x: m.width - 16,
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
function C({ relation: e, path: n, markerId: r, selected: i, onSelect: a, label: o }) {
	let { locale: c } = t(), l = new Set(e.provenance.map((e) => e.kind)), u = l.has("observed") ? "2 4" : l.has("detected") ? void 0 : "7 5";
	return /* @__PURE__ */ (0, v.jsxs)("g", {
		role: "button",
		tabIndex: -1,
		"data-graph-select": "edge",
		className: "arch-svg-action",
		"aria-label": `${s(c)[e.kind]} : ${e.label}`,
		onClick: () => a(e.id),
		onKeyDown: (t) => x(t, () => a(e.id)),
		children: [
			/* @__PURE__ */ (0, v.jsxs)("title", { children: [
				e.label,
				"\n",
				e.provenance.map((e) => `${b(c)[e.kind]} · ${e.method}`).join("\n")
			] }),
			/* @__PURE__ */ (0, v.jsx)("path", {
				d: n,
				stroke: "transparent",
				strokeWidth: 16,
				fill: "none"
			}),
			/* @__PURE__ */ (0, v.jsx)("path", {
				d: n,
				stroke: i ? "#9b82ff" : "#92abd7",
				strokeWidth: i ? 3 : 1.6,
				strokeDasharray: u,
				fill: "none",
				markerEnd: `url(#${r})`
			}),
			o ? /* @__PURE__ */ (0, v.jsx)("text", {
				x: o.x,
				y: o.y,
				textAnchor: "middle",
				fill: "#c4d3f0",
				fontSize: 10,
				stroke: "#0b1729",
				strokeWidth: 5,
				paintOrder: "stroke",
				children: s(c)[e.kind]
			}) : null
		]
	});
}
function w(e) {
	let { t: n, locale: r } = t(), i = `arrow-${(0, g.useId)().replaceAll(":", "")}`, s = `dots-${i}`, { elements: c, relations: l, canvas: d } = e, p = a(c, d.layout), h = [...new Set(c.map(u))];
	return /* @__PURE__ */ (0, v.jsxs)("svg", {
		ref: e.svgRef,
		className: "arch-graph",
		role: "group",
		"aria-label": n("Carte d’architecture. Flèches pour déplacer la carte, tabulation pour sélectionner un élément.", "Architecture map. Use arrow keys to move the map and Tab to select an element."),
		tabIndex: 0,
		viewBox: "0 0 880 460",
		preserveAspectRatio: "xMidYMin meet",
		xmlns: "http://www.w3.org/2000/svg",
		style: { fontFamily: "Inter, system-ui, sans-serif" },
		...d.handlers,
		children: [
			/* @__PURE__ */ (0, v.jsx)("title", { children: n("Architecture du projet sélectionné", "Architecture of the selected project") }),
			/* @__PURE__ */ (0, v.jsx)("desc", { children: n("Carte issue de l’analyse du projet. Les connexions de code ne prouvent pas le fonctionnement à l’exécution. Une liste navigable est disponible sous la carte.", "Map derived from project analysis. Code connections do not prove runtime behavior. A navigable list is available below the map.") }),
			/* @__PURE__ */ (0, v.jsxs)("defs", { children: [/* @__PURE__ */ (0, v.jsx)("pattern", {
				id: s,
				width: 22,
				height: 22,
				patternUnits: "userSpaceOnUse",
				children: /* @__PURE__ */ (0, v.jsx)("circle", {
					cx: 1,
					cy: 1,
					r: .8,
					fill: "#203652"
				})
			}), /* @__PURE__ */ (0, v.jsx)("marker", {
				id: i,
				viewBox: "0 0 10 10",
				refX: 9,
				refY: 5,
				markerWidth: 6,
				markerHeight: 6,
				orient: "auto",
				children: /* @__PURE__ */ (0, v.jsx)("path", {
					d: "M 0 0 L 10 5 L 0 10 z",
					fill: "#92abd7"
				})
			})] }),
			/* @__PURE__ */ (0, v.jsx)("rect", {
				width: 880,
				height: 460,
				fill: "#0b1729"
			}),
			/* @__PURE__ */ (0, v.jsx)("rect", {
				width: 880,
				height: 460,
				fill: `url(#${s})`
			}),
			/* @__PURE__ */ (0, v.jsxs)("g", {
				transform: `translate(${d.camera.x},${d.camera.y}) scale(${d.camera.zoom})`,
				children: [
					h.map((e) => /* @__PURE__ */ (0, v.jsxs)("g", {
						"aria-hidden": "true",
						children: [/* @__PURE__ */ (0, v.jsx)("rect", {
							x: (d.layout.lanes[e] ?? 0) * m.column + 8,
							y: 10,
							width: 250,
							height: p.y + p.height - 16,
							rx: 8,
							fill: "#0f2036",
							fillOpacity: .55,
							stroke: "#294363"
						}), /* @__PURE__ */ (0, v.jsx)("text", {
							x: (d.layout.lanes[e] ?? 0) * m.column + 22,
							y: 33,
							fill: "#b6adff",
							fontSize: 13,
							fontWeight: 600,
							children: f(r)[e]
						})]
					}, e)),
					l.map((t) => {
						let n = d.layout.positions[t.source], r = d.layout.positions[t.target];
						if (!n || !r) return null;
						let a = l.length <= 24 || t.id === e.selectedId ? {
							x: (n.x + r.x + m.width) / 2,
							y: (n.y + r.y + m.height) / 2 - 8
						} : void 0;
						return /* @__PURE__ */ (0, v.jsx)(C, {
							relation: t,
							path: o(n, r),
							markerId: i,
							selected: t.id === e.selectedId,
							onSelect: e.onSelect,
							label: a
						}, t.id);
					}),
					c.map((t) => {
						let n = d.layout.positions[t.id];
						return n ? /* @__PURE__ */ (0, v.jsx)(S, {
							element: t,
							point: n,
							visible: n.x * d.camera.zoom + d.camera.x >= 0 && n.y * d.camera.zoom + d.camera.y >= 0 && (n.x + m.width) * d.camera.zoom + d.camera.x <= 880 && (n.y + m.height) * d.camera.zoom + d.camera.y <= 460,
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
function T(e, t) {
	let n = e.cloneNode(!0);
	n.removeAttribute("xmlns");
	let r = e.getBoundingClientRect();
	n.setAttribute("width", String(Math.round(r.width))), n.setAttribute("height", String(Math.round(r.height)));
	let i = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(n)], { type: "image/svg+xml;charset=utf-8" })), a = document.createElement("a");
	a.href = i, a.download = `architecture-${t.replace(/[^a-z0-9_-]/gi, "").slice(0, 24)}.svg`, a.click(), setTimeout(() => URL.revokeObjectURL(i), 1e3);
}
function E({ current: e, previous: n }) {
	let { t: r } = t(), i = new Set(e.elements.map((e) => e.id)), a = n.elements.filter((e) => !i.has(e.id)), o = new Set(e.relations.map((e) => e.id)), s = new Set(n.relations.map((e) => e.id));
	return /* @__PURE__ */ (0, v.jsxs)("details", {
		className: "arch-comparison",
		open: !0,
		children: [
			/* @__PURE__ */ (0, v.jsxs)("summary", { children: [
				r("Comparaison", "Comparison"),
				" ",
				n.revisionId.slice(0, 8),
				" →",
				" ",
				e.revisionId.slice(0, 8)
			] }),
			/* @__PURE__ */ (0, v.jsxs)("p", { children: [
				e.relations.filter((e) => !s.has(e.id)).length,
				" ",
				r("connexion(s) ajoutée(s) ·", "connection(s) added ·"),
				" ",
				n.relations.filter((e) => !o.has(e.id)).length,
				" ",
				r("supprimée(s). Les marqueurs de modification portent sur les éléments de la version actuelle.", "removed. Change markers refer to elements of the current version.")
			] }),
			a.length ? /* @__PURE__ */ (0, v.jsxs)("details", { children: [
				/* @__PURE__ */ (0, v.jsxs)("summary", { children: [
					a.length,
					" ",
					r("élément(s) retiré(s)", "element(s) removed")
				] }),
				/* @__PURE__ */ (0, v.jsx)("ul", { children: a.slice(0, 100).map((e) => /* @__PURE__ */ (0, v.jsxs)("li", { children: [
					e.label,
					" ",
					/* @__PURE__ */ (0, v.jsxs)("small", { children: ["— ", e.sources.map((e) => e.path).join(", ")] })
				] }, e.id)) }),
				a.length > 100 ? /* @__PURE__ */ (0, v.jsx)("p", { children: r("Liste limitée à 100 éléments retirés.", "List limited to 100 removed elements.") }) : null
			] }) : /* @__PURE__ */ (0, v.jsx)("p", { children: r("Aucun élément retiré détecté.", "No removed elements detected.") })
		]
	});
}
function D({ elements: e, relations: n, selectedId: r, onSelect: i, onOpenSource: a }) {
	let { t: o, locale: c } = t();
	return /* @__PURE__ */ (0, v.jsxs)("details", {
		className: "arch-list",
		children: [
			/* @__PURE__ */ (0, v.jsxs)("summary", { children: [
				o("Liste accessible ·", "Accessible list ·"),
				" ",
				e.length,
				" ",
				o("éléments ·", "elements ·"),
				" ",
				n.length,
				" ",
				o("connexions", "connections")
			] }),
			/* @__PURE__ */ (0, v.jsx)("ul", { children: e.map((e) => /* @__PURE__ */ (0, v.jsxs)("li", { children: [/* @__PURE__ */ (0, v.jsxs)("button", {
				type: "button",
				"aria-pressed": r === e.id,
				onClick: () => i(e.id),
				children: [
					e.label,
					" ",
					/* @__PURE__ */ (0, v.jsx)("small", { children: l(c)[e.type] })
				]
			}), e.sources[0] ? /* @__PURE__ */ (0, v.jsxs)("button", {
				type: "button",
				onClick: () => a(e.sources[0].path, e.sources[0].line),
				children: [
					o("Ouvrir le code", "Open code"),
					" ",
					/* @__PURE__ */ (0, v.jsxs)("span", {
						className: "sr-only",
						children: [
							o("de", "of"),
							" ",
							e.label
						]
					})
				]
			}) : /* @__PURE__ */ (0, v.jsx)("small", { children: o("Aucune source liée", "No linked source") })] }, e.id)) }),
			/* @__PURE__ */ (0, v.jsxs)("details", { children: [/* @__PURE__ */ (0, v.jsx)("summary", { children: o("Connexions et provenance", "Connections and provenance") }), /* @__PURE__ */ (0, v.jsx)("ul", { children: n.map((e) => /* @__PURE__ */ (0, v.jsxs)("li", { children: [/* @__PURE__ */ (0, v.jsxs)("button", {
				type: "button",
				"aria-pressed": r === e.id,
				onClick: () => i(e.id),
				children: [
					s(c)[e.kind],
					" · ",
					e.label
				]
			}), /* @__PURE__ */ (0, v.jsx)("small", { children: e.provenance.map((e) => e.method).join(" · ") || o("Provenance non renseignée", "Provenance not provided") })] }, e.id)) })] })
		]
	});
}
function O(e) {
	let { t: n, locale: r } = t(), [i, o] = (0, g.useState)(""), u = (0, g.useDeferredValue)(i), [d, f] = (0, g.useState)("all"), [m, h] = (0, g.useState)("all"), [y, b] = (0, g.useState)(!1), [x, S] = (0, g.useState)(!1), [C, O] = (0, g.useState)(40), [k, A] = (0, g.useState)(!1), j = (0, g.useRef)(null), M = e.model.analysis, N = p(M, {
		search: u,
		elementType: d,
		relationKind: m,
		details: y,
		limit: C
	}, e.selectedId), P = _(M.elements, N.elements, JSON.stringify([
		u,
		d,
		m,
		y,
		C
	])), F = x ? c(M, e.model.previous) : /* @__PURE__ */ new Map(), I = M.elements.find((t) => t.id === e.selectedId);
	function L() {
		if (j.current) try {
			T(j.current, M.revisionId), A(!1);
		} catch {
			A(!0);
		}
	}
	return /* @__PURE__ */ (0, v.jsxs)("section", {
		className: "architecture-view",
		"aria-label": n("Architecture du projet", "Project architecture"),
		children: [
			/* @__PURE__ */ (0, v.jsxs)("div", {
				className: "arch-toolbar",
				children: [
					/* @__PURE__ */ (0, v.jsxs)("label", {
						className: "arch-search",
						children: [
							/* @__PURE__ */ (0, v.jsx)("span", {
								className: "sr-only",
								children: n("Rechercher un composant ou fichier", "Search for a component or file")
							}),
							/* @__PURE__ */ (0, v.jsx)("span", {
								"aria-hidden": "true",
								children: "⌕"
							}),
							/* @__PURE__ */ (0, v.jsx)("input", {
								value: i,
								onChange: (e) => o(e.target.value),
								placeholder: n("Rechercher un composant…", "Search for a component…"),
								name: "architecture-search",
								autoComplete: "off",
								spellCheck: !1
							})
						]
					}),
					/* @__PURE__ */ (0, v.jsxs)("div", {
						className: "arch-zoom",
						role: "group",
						"aria-label": n("Zoom de la carte", "Map zoom"),
						children: [
							/* @__PURE__ */ (0, v.jsx)("button", {
								type: "button",
								onClick: () => P.zoom(1 / 1.2),
								"aria-label": n("Réduire le zoom", "Zoom out"),
								children: "−"
							}),
							/* @__PURE__ */ (0, v.jsxs)("button", {
								type: "button",
								onClick: P.reset,
								"aria-label": n("Rétablir le zoom lisible à 100 %", "Reset readable zoom to 100%"),
								children: [Math.round(P.camera.zoom * 100), " %"]
							}),
							/* @__PURE__ */ (0, v.jsx)("button", {
								type: "button",
								onClick: () => P.zoom(1.2),
								"aria-label": n("Augmenter le zoom", "Zoom in"),
								children: "+"
							})
						]
					}),
					/* @__PURE__ */ (0, v.jsx)("button", {
						type: "button",
						onClick: () => P.fit(a(N.elements, P.layout)),
						children: n("Ajuster", "Fit")
					}),
					/* @__PURE__ */ (0, v.jsx)("button", {
						type: "button",
						"aria-pressed": x,
						disabled: !e.model.previous,
						onClick: () => S((e) => !e),
						children: n("Comparer", "Compare")
					}),
					/* @__PURE__ */ (0, v.jsx)("button", {
						type: "button",
						onClick: L,
						disabled: !N.elements.length,
						children: "↓ Export SVG"
					})
				]
			}),
			/* @__PURE__ */ (0, v.jsxs)("div", {
				className: "arch-filters",
				children: [
					/* @__PURE__ */ (0, v.jsxs)("label", { children: [
						n("Éléments", "Elements"),
						" ",
						/* @__PURE__ */ (0, v.jsxs)("select", {
							value: d,
							onChange: (e) => f(e.target.value),
							children: [/* @__PURE__ */ (0, v.jsx)("option", {
								value: "all",
								children: n("Tous les types", "All types")
							}), Object.entries(l(r)).map(([e, t]) => /* @__PURE__ */ (0, v.jsx)("option", {
								value: e,
								children: t
							}, e))]
						})
					] }),
					/* @__PURE__ */ (0, v.jsxs)("label", { children: [
						n("Connexions", "Connections"),
						" ",
						/* @__PURE__ */ (0, v.jsxs)("select", {
							value: m,
							onChange: (e) => h(e.target.value),
							children: [/* @__PURE__ */ (0, v.jsx)("option", {
								value: "all",
								children: n("Tous les liens", "All links")
							}), Object.entries(s(r)).map(([e, t]) => /* @__PURE__ */ (0, v.jsx)("option", {
								value: e,
								children: t
							}, e))]
						})
					] }),
					/* @__PURE__ */ (0, v.jsxs)("label", {
						className: "arch-checkbox",
						children: [
							/* @__PURE__ */ (0, v.jsx)("input", {
								type: "checkbox",
								checked: y,
								onChange: (e) => b(e.target.checked)
							}),
							" ",
							n("Modules, tests et contrats", "Modules, tests and contracts")
						]
					}),
					/* @__PURE__ */ (0, v.jsxs)("span", {
						className: "arch-count",
						"aria-live": "polite",
						children: [
							N.elements.length,
							" / ",
							N.total,
							" ",
							n("éléments filtrés", "filtered elements")
						]
					})
				]
			}),
			M.backendDetected ? null : /* @__PURE__ */ (0, v.jsx)("p", {
				className: "arch-note",
				children: n("Aucun backend métier détecté dans ces sources. Le serveur du Studio n’est pas ajouté à cette carte.", "No business backend detected in these sources. The Studio server is not added to this map.")
			}),
			e.model.previous ? null : /* @__PURE__ */ (0, v.jsx)("p", {
				className: "arch-note",
				children: n("Comparaison indisponible : aucune analyse précédente pour ce projet.", "Comparison unavailable: no previous analysis for this project.")
			}),
			x && e.model.previous ? /* @__PURE__ */ (0, v.jsx)(E, {
				current: M,
				previous: e.model.previous
			}) : null,
			/* @__PURE__ */ (0, v.jsxs)("div", {
				className: "arch-canvas",
				children: [N.elements.length ? /* @__PURE__ */ (0, v.jsx)(w, {
					elements: N.elements,
					relations: N.relations,
					selectedId: e.selectedId,
					onSelect: e.onSelect,
					onOpenSource: e.onOpenSource,
					canvas: P,
					svgRef: j,
					changes: F
				}) : /* @__PURE__ */ (0, v.jsxs)("div", {
					className: "arch-empty",
					children: [/* @__PURE__ */ (0, v.jsx)("h3", { children: n("Aucun élément dans ce périmètre", "No elements in this scope") }), /* @__PURE__ */ (0, v.jsx)("p", { children: n("Activez les détails ou élargissez les filtres. L’analyse ne crée pas de services absents du projet.", "Enable details or broaden the filters. Analysis does not invent services absent from the project.") })]
				}), /* @__PURE__ */ (0, v.jsxs)("div", {
					className: "arch-legend",
					children: [
						/* @__PURE__ */ (0, v.jsx)("span", { children: n("━ Détecté dans le code", "━ Detected in code") }),
						/* @__PURE__ */ (0, v.jsx)("span", { children: n("┄ Déclaré / supposé", "┄ Declared / assumed") }),
						/* @__PURE__ */ (0, v.jsx)("span", { children: n("┈ Observé à l’exécution", "┈ Observed at runtime") })
					]
				})]
			}),
			/* @__PURE__ */ (0, v.jsxs)("div", {
				className: "arch-status",
				children: [/* @__PURE__ */ (0, v.jsx)("span", { children: n("Carte déplaçable : glisser le fond ou utiliser les flèches. Ajuster affiche l’ensemble ; 100 % rétablit la lecture.", "Move the map by dragging its background or using arrow keys. Fit shows everything; 100% restores readable zoom.") }), /* @__PURE__ */ (0, v.jsxs)("span", { children: [
					n("Analyse", "Analysis"),
					" ",
					M.status === "complete" ? n("terminée", "completed") : M.status === "partial" ? n("partielle", "partial") : n("en échec", "failed"),
					" ",
					"· ",
					new Date(M.analyzedAt).toLocaleString(r)
				] })]
			}),
			I ? /* @__PURE__ */ (0, v.jsxs)("div", {
				className: "arch-selected",
				children: [
					/* @__PURE__ */ (0, v.jsx)("strong", { children: I.label }),
					/* @__PURE__ */ (0, v.jsx)("span", { children: I.description }),
					/* @__PURE__ */ (0, v.jsx)("button", {
						type: "button",
						onClick: () => e.onShowChecks(I.sources[0]?.path),
						children: n("Vérifications associées", "Related checks")
					})
				]
			}) : null,
			N.total > N.elements.length ? /* @__PURE__ */ (0, v.jsxs)("p", {
				className: "arch-note",
				children: [
					n("Carte bornée à", "Map limited to"),
					" ",
					C,
					" ",
					n("éléments pour rester lisible.", "elements to remain readable."),
					" ",
					C < 100 ? /* @__PURE__ */ (0, v.jsx)("button", {
						type: "button",
						onClick: () => O(100),
						children: n("Afficher jusqu’à 100 éléments", "Show up to 100 elements")
					}) : n("Affinez la recherche pour explorer les autres éléments.", "Refine the search to explore other elements.")
				]
			}) : null,
			N.omittedRelations > 0 ? /* @__PURE__ */ (0, v.jsxs)("p", {
				className: "arch-note",
				children: [
					N.omittedRelations,
					" ",
					n("liens non dessinés au-delà de la limite de 200. Affinez les filtres.", "links not drawn beyond the limit of 200. Refine the filters.")
				]
			}) : null,
			k ? /* @__PURE__ */ (0, v.jsx)("p", {
				role: "alert",
				className: "arch-note",
				children: n("Export indisponible dans ce navigateur. Vous pouvez conserver la liste des éléments.", "Export is unavailable in this browser. You can keep the element list.")
			}) : null,
			/* @__PURE__ */ (0, v.jsx)(D, {
				elements: N.elements,
				relations: N.relations,
				selectedId: e.selectedId,
				onSelect: e.onSelect,
				onOpenSource: e.onOpenSource
			})
		]
	});
}
//#endregion
export { O as ArchitectureView };
