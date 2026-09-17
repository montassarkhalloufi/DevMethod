//#region studio-ui/src/discussion-sizing.ts
function e(e) {
	return `devmethod:studio:${e}-height:v1`;
}
function t(t, n) {
	try {
		let r = Number(t.localStorage.getItem(e(n)));
		return Number.isFinite(r) && r > 0 && r <= 1e4 ? r : null;
	} catch {
		return null;
	}
}
function n(t, n) {
	try {
		n.preference === null ? t.localStorage.removeItem(e(n.kind)) : t.localStorage.setItem(e(n.kind), String(n.preference));
	} catch {}
}
function r(e, t) {
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
function i(e, t) {
	let n = r(e, t);
	e.height = Math.round(Math.max(n.min, Math.min(n.max, e.preference ?? n.initial))), e.root.style.setProperty(`--${e.kind}-height`, `${e.height}px`), e.separator.setAttribute("aria-valuemin", String(n.min)), e.separator.setAttribute("aria-valuemax", String(n.max)), e.separator.setAttribute("aria-valuenow", String(e.height)), e.separator.setAttribute("aria-valuetext", `${e.height} pixels`);
}
function a(e, n, r) {
	let a = e.querySelector(`[data-size-region="${r}"]`), o = e.getElementById(r === "message" ? "request" : "conversation-flow");
	if (!a || !o) return null;
	let s = r === "message" ? "la zone de message" : "l’historique", c = e.createElement("div");
	c.className = "panel-size-controls", c.innerHTML = `<div class="panel-height-handle" role="separator" tabindex="0" aria-orientation="horizontal" aria-controls="${o.id}" aria-label="Hauteur de ${s}" aria-describedby="${r}-size-help"></div>
    <button type="button" data-size-action="reduce" aria-label="Réduire ${s}" title="Réduire ${s}">−</button>
    <button type="button" data-size-action="reset" aria-label="Rétablir la taille de ${s}" title="Rétablir la taille initiale">↺</button>
    <button type="button" data-size-action="grow" aria-label="Agrandir ${s}" title="Agrandir ${s}">+</button>
    <span class="sr-only" id="${r}-size-help">Glissez la poignée ou utilisez les flèches haut et bas. Début et Fin : tailles minimale et maximale. Double-clic : taille initiale.</span>`;
	let l = c.querySelector("[role=\"separator\"]");
	l.title = "Glisser pour redimensionner · Double-clic pour rétablir", r === "message" ? a.prepend(c) : a.append(c), a.classList.add("panel-size-enabled");
	let u = {
		root: a,
		target: o,
		controls: c,
		separator: l,
		kind: r,
		preference: t(n, r),
		height: 0
	};
	return i(u, n), u;
}
function o(e, t) {
	let o = ["message", "activity"].map((n) => a(e, t, n)).filter((e) => e !== null), s = [], c = null;
	function l(e, t, n) {
		e.addEventListener(t, n), s.push(() => e.removeEventListener(t, n));
	}
	function u(e, a, o = !0) {
		let s = r(e, t);
		e.preference = a === null ? null : Math.max(s.min, Math.min(s.max, a)), i(e, t), o && n(t, e);
	}
	function d(r = !1) {
		if (!c) return;
		let a = c;
		c = null, a.zone.separator.hasPointerCapture?.(a.pointer) && a.zone.separator.releasePointerCapture(a.pointer), r && (a.zone.preference = a.previous), i(a.zone, t), n(t, a.zone), e.body.classList.remove("discussion-height-resizing");
	}
	function f(e, n) {
		let i = (n.shiftKey ? 40 : 16) * (e.kind === "message" ? -1 : 1), a = r(e, t), o = {
			ArrowUp: e.height - i,
			ArrowDown: e.height + i,
			Home: a.min,
			End: a.max
		}[n.key];
		o !== void 0 && (n.preventDefault(), u(e, o));
	}
	function p(n) {
		l(n.separator, "keydown", (e) => f(n, e)), l(n.separator, "dblclick", () => u(n, null)), l(n.controls, "click", (e) => {
			let t = e.target.closest("[data-size-action]")?.dataset.sizeAction;
			t && u(n, t === "reset" ? null : n.height + (t === "grow" ? 40 : -40));
		}), l(n.separator, "pointerdown", (r) => {
			let i = r;
			i.button !== 0 || t.innerWidth <= 900 || (i.preventDefault(), d(), n.separator.focus({ preventScroll: !0 }), c = {
				zone: n,
				pointer: i.pointerId,
				startY: i.clientY,
				height: n.height,
				previous: n.preference
			}, n.separator.setPointerCapture?.(i.pointerId), e.body.classList.add("discussion-height-resizing"));
		});
	}
	return o.forEach(p), l(t, "pointermove", (e) => {
		let t = e;
		if (!c || c.pointer !== t.pointerId) return;
		let n = c.zone.kind === "message" ? -1 : 1;
		u(c.zone, c.height + (t.clientY - c.startY) * n, !1);
	}), l(t, "pointerup", () => d()), l(t, "pointercancel", () => d(!0)), l(t, "blur", () => d()), l(t, "keydown", (e) => {
		let t = e;
		t.key === "Escape" && !t.defaultPrevented && c && (t.preventDefault(), d(!0));
	}), l(t, "resize", () => {
		d(), o.forEach((e) => i(e, t));
	}), { destroy() {
		d(), s.forEach((e) => e());
		for (let e of o) e.controls.remove(), e.root.classList.remove("panel-size-enabled"), e.root.style.removeProperty(`--${e.kind}-height`);
	} };
}
//#endregion
//#region studio-ui/src/layout.ts
var s = "devmethod:studio:conversation-width:v1";
function c(e) {
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
function l(e) {
	for (let t of e) {
		if (!t.root.isConnected) continue;
		let e = t.anchor ? [...t.root.querySelectorAll("[data-scroll-key]")].find((e) => e.dataset.scrollKey === t.anchor) : void 0;
		e && u(e, t.root);
		let n = e && t.offset !== void 0 ? e.getBoundingClientRect().top - t.root.getBoundingClientRect().top - t.offset : 0;
		t.root.scrollTop = e ? t.root.scrollTop + n : t.top, t.root.scrollLeft = t.left;
	}
}
function u(e, t) {
	for (let n = e.parentElement; n && n !== t; n = n.parentElement) n.tagName === "DETAILS" && n.setAttribute("open", "");
}
function d(e) {
	try {
		let t = Number(e.localStorage.getItem(s));
		return Number.isFinite(t) && t > 0 ? t : null;
	} catch {
		return null;
	}
}
function f(e, t) {
	try {
		t === null ? e.localStorage.removeItem(s) : e.localStorage.setItem(s, String(t));
	} catch {}
}
function p(e, t) {
	let n = e.querySelector(".studio-layout"), r = e.getElementById("conversation-resizer"), i = e.getElementById("expand-workspace");
	if (!n || !r || !i) return { destroy() {} };
	let a = o(e, t), s = [], u = d(t), p = 300, m = null, h = [], g = [], _ = !1;
	function v(e, t, n) {
		e.addEventListener(t, n), s.push(() => e.removeEventListener(t, n));
	}
	function y() {
		let r = ["code", "checks"].includes(e.body.dataset.activePanel || ""), i = r ? 240 : 300, a = t.getComputedStyle(n), o = (n.clientWidth || t.innerWidth) - (Number.parseFloat(a.paddingLeft) || 0) - (Number.parseFloat(a.paddingRight) || 0) - 2 * (Number.parseFloat(a.columnGap) || 8) - 8;
		return {
			min: i,
			max: Math.max(i, Math.min(720, o - 420)),
			default: r ? 260 : Math.max(i, o * .3)
		};
	}
	function b() {
		let e = y();
		p = Math.round(Math.min(e.max, Math.max(e.min, u ?? e.default))), n.style.setProperty("--conversation-width", p + "px"), r.setAttribute("aria-valuemin", String(e.min)), r.setAttribute("aria-valuemax", String(Math.floor(e.max))), r.setAttribute("aria-valuenow", String(p)), r.setAttribute("aria-valuetext", `${p} pixels pour la discussion`), r.tabIndex = t.innerWidth > 900 && !_ ? 0 : -1;
	}
	function x(t) {
		let n = y();
		u = Math.min(n.max, Math.max(n.min, t));
		let r = c(e);
		b(), l(r);
	}
	function S() {
		m && (r.hasPointerCapture?.(m.pointer) && r.releasePointerCapture(m.pointer), m = null, n.classList.remove("layout-resizing"), f(t, u));
	}
	function C() {
		let t = c(e);
		if (_) {
			for (let e of g) e.wasInert || e.element.removeAttribute("inert");
			g = [];
		} else {
			g = [...e.querySelectorAll(".topbar, .mobile-navigation, .skip-link, #discussion, #conversation-resizer")].map((e) => ({
				element: e,
				wasInert: e.hasAttribute("inert")
			}));
			for (let e of g) e.element.setAttribute("inert", "");
		}
		_ = !_, n.classList.toggle("workspace-expanded", _), e.body.classList.toggle("studio-expanded", _), i.setAttribute("aria-pressed", String(_));
		let r = _ ? "Revenir à la disposition" : "Agrandir cette vue";
		i.setAttribute("aria-label", r), i.setAttribute("title", r), b(), l(t), i.focus({ preventScroll: !0 });
	}
	function w(e) {
		if (t.innerWidth <= 900 || _) return;
		let n = y(), r = e.shiftKey ? 40 : 16, i = {
			ArrowLeft: p - r,
			ArrowRight: p + r,
			Home: n.min,
			End: n.max
		}[e.key];
		i !== void 0 && (e.preventDefault(), x(i), f(t, u));
	}
	v(r, "keydown", (e) => w(e)), v(r, "dblclick", () => {
		let n = c(e);
		u = null, f(t, null), b(), l(n);
	}), v(r, "pointerdown", (e) => {
		let i = e;
		i.button !== 0 || t.innerWidth <= 900 || _ || (i.preventDefault(), r.focus({ preventScroll: !0 }), m = {
			startX: i.clientX,
			width: p,
			pointer: i.pointerId
		}, r.setPointerCapture?.(i.pointerId), n.classList.add("layout-resizing"));
	}), v(t, "pointermove", (e) => {
		let t = e;
		m && t.pointerId === m.pointer && x(m.width + t.clientX - m.startX);
	});
	for (let e of [
		"pointerup",
		"pointercancel",
		"blur"
	]) v(t, e, S);
	return v(t, "resize", () => {
		let t = c(e);
		S(), b(), l(t);
	}), v(i, "click", C), v(t, "keydown", (e) => {
		let t = e;
		t.key !== "Escape" || t.defaultPrevented || (m ? (x(m.width), S(), t.preventDefault()) : _ && (C(), t.preventDefault()));
	}), v(e, "studio:before-render", () => {
		h = c(e);
	}), v(e, "studio:after-render", () => {
		l(h), h = [];
	}), b(), { destroy() {
		a.destroy(), S(), _ && C();
		for (let e of s) e();
	} };
}
typeof document < "u" && document.body?.hasAttribute("data-studio") && p(document, window);
//#endregion
export { c as captureScroll, p as mountStudioLayout, l as restoreScroll };
