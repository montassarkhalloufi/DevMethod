import { o as e, t } from "./i18n-CRhBcIYq.js";
//#region studio-ui/src/discussion-sizing.ts
function n(e) {
	return `devmethod:studio:${e}-height:v1`;
}
function r(e, t) {
	try {
		let r = Number(e.localStorage.getItem(n(t)));
		return Number.isFinite(r) && r > 0 && r <= 1e4 ? r : null;
	} catch {
		return null;
	}
}
function i(e, t) {
	try {
		t.preference === null ? e.localStorage.removeItem(n(t.kind)) : e.localStorage.setItem(n(t.kind), String(t.preference));
	} catch {}
}
function a(e, t) {
	return e.kind === "message" ? {
		min: 52,
		max: Math.max(52, Math.min(480, Math.floor(t.innerHeight * .5) - 140)),
		initial: 52
	} : {
		min: 120,
		max: Math.max(120, Math.min(900, Math.floor(t.innerHeight * .75))),
		initial: 280
	};
}
function o(e, t) {
	let n = a(e, t);
	e.height = Math.round(Math.max(n.min, Math.min(n.max, e.preference ?? n.initial))), e.root.style.setProperty(`--${e.kind}-height`, `${e.height}px`), e.separator.setAttribute("aria-valuemin", String(n.min)), e.separator.setAttribute("aria-valuemax", String(n.max)), e.separator.setAttribute("aria-valuenow", String(e.height)), e.separator.setAttribute("aria-valuetext", `${e.height} pixels`);
}
function s(e) {
	let n = t(e.root.ownerDocument), r = e.kind === "message" ? n("la zone de message", "the message area") : n("l’historique", "the history");
	e.separator.setAttribute("aria-label", n("Hauteur de {area}", "Height of {area}", { area: r })), e.separator.title = n("Glisser pour redimensionner · Double-clic pour rétablir", "Drag to resize · Double-click to reset");
	let i = {
		reduce: n("Réduire {area}", "Reduce {area}", { area: r }),
		reset: n("Rétablir la taille de {area}", "Reset the size of {area}", { area: r }),
		grow: n("Agrandir {area}", "Expand {area}", { area: r })
	};
	for (let [t, n] of Object.entries(i)) {
		let r = e.controls.querySelector(`[data-size-action="${t}"]`);
		r.setAttribute("aria-label", n), r.title = n;
	}
	e.controls.querySelector(".sr-only").textContent = n("Glissez la poignée ou utilisez les flèches haut et bas. Début et Fin : tailles minimale et maximale. Double-clic : taille initiale.", "Drag the handle or use the up and down arrow keys. Home and End: minimum and maximum size. Double-click: initial size.");
}
function c(e, t, n) {
	let i = e.querySelector(`[data-size-region="${n}"]`), a = e.getElementById(n === "message" ? "request" : "conversation-flow");
	if (!i || !a) return null;
	let c = n === "message" ? "la zone de message" : "l’historique", l = e.createElement("div");
	l.className = "panel-size-controls", l.innerHTML = `<div class="panel-height-handle" role="separator" tabindex="0" aria-orientation="horizontal" aria-controls="${a.id}" aria-label="Hauteur de ${c}" aria-describedby="${n}-size-help"></div>
    <button type="button" data-size-action="reduce" aria-label="Réduire ${c}" title="Réduire ${c}">−</button>
    <button type="button" data-size-action="reset" aria-label="Rétablir la taille de ${c}" title="Rétablir la taille initiale">↺</button>
    <button type="button" data-size-action="grow" aria-label="Agrandir ${c}" title="Agrandir ${c}">+</button>
    <span class="sr-only" id="${n}-size-help">Glissez la poignée ou utilisez les flèches haut et bas. Début et Fin : tailles minimale et maximale. Double-clic : taille initiale.</span>`;
	let u = l.querySelector("[role=\"separator\"]");
	u.title = "Glisser pour redimensionner · Double-clic pour rétablir", n === "message" ? i.prepend(l) : i.append(l), i.classList.add("panel-size-enabled");
	let d = {
		root: i,
		target: a,
		controls: l,
		separator: u,
		kind: n,
		preference: r(t, n),
		height: 0
	};
	return o(d, t), s(d), d;
}
function l(t, n) {
	let r = ["message", "activity"].map((e) => c(t, n, e)).filter((e) => e !== null), l = [], u = null;
	function d(e, t, n) {
		e.addEventListener(t, n), l.push(() => e.removeEventListener(t, n));
	}
	function f(e, t, r = !0) {
		let s = a(e, n);
		e.preference = t === null ? null : Math.max(s.min, Math.min(s.max, t)), o(e, n), r && i(n, e);
	}
	function p(e = !1) {
		if (!u) return;
		let r = u;
		u = null, r.zone.separator.hasPointerCapture?.(r.pointer) && r.zone.separator.releasePointerCapture(r.pointer), e && (r.zone.preference = r.previous), o(r.zone, n), i(n, r.zone), t.body.classList.remove("discussion-height-resizing");
	}
	function m(e, t) {
		let r = (t.shiftKey ? 40 : 16) * (e.kind === "message" ? -1 : 1), i = a(e, n), o = {
			ArrowUp: e.height - r,
			ArrowDown: e.height + r,
			Home: i.min,
			End: i.max
		}[t.key];
		o !== void 0 && (t.preventDefault(), f(e, o));
	}
	function h(e) {
		d(e.separator, "keydown", (t) => m(e, t)), d(e.separator, "dblclick", () => f(e, null)), d(e.controls, "click", (t) => {
			let n = t.target.closest("[data-size-action]")?.dataset.sizeAction;
			n && f(e, n === "reset" ? null : e.height + (n === "grow" ? 40 : -40));
		}), d(e.separator, "pointerdown", (r) => {
			let i = r;
			i.button !== 0 || n.innerWidth <= 900 || (i.preventDefault(), p(), e.separator.focus({ preventScroll: !0 }), u = {
				zone: e,
				pointer: i.pointerId,
				startY: i.clientY,
				height: e.height,
				previous: e.preference
			}, e.separator.setPointerCapture?.(i.pointerId), t.body.classList.add("discussion-height-resizing"));
		});
	}
	return r.forEach(h), l.push(e(() => r.forEach(s), n)), d(n, "pointermove", (e) => {
		let t = e;
		if (!u || u.pointer !== t.pointerId) return;
		let n = u.zone.kind === "message" ? -1 : 1;
		f(u.zone, u.height + (t.clientY - u.startY) * n, !1);
	}), d(n, "pointerup", () => p()), d(n, "pointercancel", () => p(!0)), d(n, "blur", () => p()), d(n, "keydown", (e) => {
		let t = e;
		t.key === "Escape" && !t.defaultPrevented && u && (t.preventDefault(), p(!0));
	}), d(n, "resize", () => {
		p(), r.forEach((e) => o(e, n));
	}), { destroy() {
		p(), l.forEach((e) => e());
		for (let e of r) e.controls.remove(), e.root.classList.remove("panel-size-enabled"), e.root.style.removeProperty(`--${e.kind}-height`);
	} };
}
//#endregion
//#region studio-ui/src/layout.ts
var u = "devmethod:studio:conversation-width:v1", d = 300, f = 420;
function p(e) {
	return [...e.querySelectorAll("[data-scroll-region], .workbench > [role=\"tabpanel\"]")].filter((e) => e.clientHeight > 0).map((e) => {
		let t = e.getBoundingClientRect(), n = [...e.querySelectorAll("[data-scroll-key]")].find((e) => {
			let n = e.getBoundingClientRect();
			return n.height > 0 && n.bottom > t.top && n.top < t.bottom;
		});
		return {
			root: e,
			top: e.scrollTop,
			left: e.scrollLeft,
			anchor: n?.dataset.scrollKey,
			offset: n ? n.getBoundingClientRect().top - t.top : void 0
		};
	});
}
function m(e) {
	for (let t of e) {
		if (!t.root.isConnected) continue;
		let e = t.anchor ? [...t.root.querySelectorAll("[data-scroll-key]")].find((e) => e.dataset.scrollKey === t.anchor) : void 0;
		e && h(e, t.root);
		let n = e && t.offset !== void 0 ? e.getBoundingClientRect().top - t.root.getBoundingClientRect().top - t.offset : 0;
		t.root.scrollTop = e ? t.root.scrollTop + n : t.top, t.root.scrollLeft = t.left;
	}
}
function h(e, t) {
	for (let n = e.parentElement; n && n !== t; n = n.parentElement) n.tagName === "DETAILS" && n.setAttribute("open", "");
}
function g(e) {
	try {
		let t = Number(e.localStorage.getItem(u));
		return Number.isFinite(t) && t > 0 ? t : null;
	} catch {
		return null;
	}
}
function _(e, t) {
	try {
		t === null ? e.localStorage.removeItem(u) : e.localStorage.setItem(u, String(t));
	} catch {}
}
function v(n, r) {
	let i = t(n), a = n.querySelector(".studio-layout"), o = n.getElementById("conversation-resizer"), s = n.getElementById("expand-workspace");
	if (!a || !o || !s) return { destroy() {} };
	let c = l(n, r), u = [], h = g(r), v = d, y = null, b = [], x = [], S = !1;
	function C(e, t, n) {
		e.addEventListener(t, n), u.push(() => e.removeEventListener(t, n));
	}
	function w() {
		let e = ["code", "checks"].includes(n.body.dataset.activePanel || ""), t = e ? 240 : d, i = r.getComputedStyle(a), o = (a.clientWidth || r.innerWidth) - (Number.parseFloat(i.paddingLeft) || 0) - (Number.parseFloat(i.paddingRight) || 0) - 2 * (Number.parseFloat(i.columnGap) || 8) - 8;
		return {
			min: t,
			max: Math.max(t, Math.min(720, o - f)),
			default: e ? 260 : Math.max(t, o * .3)
		};
	}
	function T() {
		let e = w();
		v = Math.round(Math.min(e.max, Math.max(e.min, h ?? e.default))), a.style.setProperty("--conversation-width", v + "px"), o.setAttribute("aria-valuemin", String(e.min)), o.setAttribute("aria-valuemax", String(Math.floor(e.max))), o.setAttribute("aria-valuenow", String(v)), o.setAttribute("aria-valuetext", i("{width} pixels pour la discussion", "{width} pixels for the conversation", { width: v })), o.tabIndex = r.innerWidth > 900 && !S ? 0 : -1;
	}
	function E(e) {
		let t = w();
		h = Math.min(t.max, Math.max(t.min, e));
		let r = p(n);
		T(), m(r);
	}
	function D() {
		y && (o.hasPointerCapture?.(y.pointer) && o.releasePointerCapture(y.pointer), y = null, a.classList.remove("layout-resizing"), _(r, h));
	}
	function O() {
		let e = p(n);
		if (S) {
			for (let e of x) e.wasInert || e.element.removeAttribute("inert");
			x = [];
		} else {
			x = [...n.querySelectorAll(".topbar, .mobile-navigation, .skip-link, #discussion, #conversation-resizer")].map((e) => ({
				element: e,
				wasInert: e.hasAttribute("inert")
			}));
			for (let e of x) e.element.setAttribute("inert", "");
		}
		S = !S, a.classList.toggle("workspace-expanded", S), n.body.classList.toggle("studio-expanded", S), s.setAttribute("aria-pressed", String(S));
		let t = S ? i("Revenir à la disposition", "Restore the layout") : i("Agrandir cette vue", "Expand this view");
		s.setAttribute("aria-label", t), s.setAttribute("title", t), T(), m(e), s.focus({ preventScroll: !0 });
	}
	function k(e) {
		if (r.innerWidth <= 900 || S) return;
		let t = w(), n = e.shiftKey ? 40 : 16, i = {
			ArrowLeft: v - n,
			ArrowRight: v + n,
			Home: t.min,
			End: t.max
		}[e.key];
		i !== void 0 && (e.preventDefault(), E(i), _(r, h));
	}
	C(o, "keydown", (e) => k(e)), C(o, "dblclick", () => {
		let e = p(n);
		h = null, _(r, null), T(), m(e);
	}), C(o, "pointerdown", (e) => {
		let t = e;
		t.button !== 0 || r.innerWidth <= 900 || S || (t.preventDefault(), o.focus({ preventScroll: !0 }), y = {
			startX: t.clientX,
			width: v,
			pointer: t.pointerId
		}, o.setPointerCapture?.(t.pointerId), a.classList.add("layout-resizing"));
	}), C(r, "pointermove", (e) => {
		let t = e;
		y && t.pointerId === y.pointer && E(y.width + t.clientX - y.startX);
	});
	for (let e of [
		"pointerup",
		"pointercancel",
		"blur"
	]) C(r, e, D);
	return C(r, "resize", () => {
		let e = p(n);
		D(), T(), m(e);
	}), C(s, "click", O), C(r, "keydown", (e) => {
		let t = e;
		t.key !== "Escape" || t.defaultPrevented || (y ? (E(y.width), D(), t.preventDefault()) : S && (O(), t.preventDefault()));
	}), C(n, "studio:before-render", () => {
		b = p(n);
	}), C(n, "studio:after-render", () => {
		m(b), b = [];
	}), u.push(e(() => {
		let e = S ? i("Revenir à la disposition", "Restore the layout") : i("Agrandir cette vue", "Expand this view");
		s.setAttribute("aria-label", e), s.setAttribute("title", e), T();
	}, r)), T(), { destroy() {
		c.destroy(), D(), S && O();
		for (let e of u) e();
	} };
}
typeof document < "u" && document.body?.hasAttribute("data-studio") && v(document, window);
//#endregion
export { p as captureScroll, v as mountStudioLayout, m as restoreScroll };
