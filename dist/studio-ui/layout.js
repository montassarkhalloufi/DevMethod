//#region studio-ui/src/layout.ts
var e = "devmethod:studio:conversation-width:v1";
function t(e) {
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
function n(e) {
	for (let t of e) {
		if (!t.root.isConnected) continue;
		let e = t.anchor ? [...t.root.querySelectorAll("[data-scroll-key]")].find((e) => e.dataset.scrollKey === t.anchor) : void 0;
		e && r(e, t.root);
		let n = e && t.offset !== void 0 ? e.getBoundingClientRect().top - t.root.getBoundingClientRect().top - t.offset : 0;
		t.root.scrollTop = e ? t.root.scrollTop + n : t.top, t.root.scrollLeft = t.left;
	}
}
function r(e, t) {
	for (let n = e.parentElement; n && n !== t; n = n.parentElement) n.tagName === "DETAILS" && n.setAttribute("open", "");
}
function i(t) {
	try {
		let n = Number(t.localStorage.getItem(e));
		return Number.isFinite(n) && n > 0 ? n : null;
	} catch {
		return null;
	}
}
function a(t, n) {
	try {
		n === null ? t.localStorage.removeItem(e) : t.localStorage.setItem(e, String(n));
	} catch {}
}
function o(e, r) {
	let o = e.querySelector(".studio-layout"), s = e.getElementById("conversation-resizer"), c = e.getElementById("expand-workspace");
	if (!o || !s || !c) return { destroy() {} };
	let l = [], u = i(r), d = 300, f = null, p = [], m = [], h = !1;
	function g(e, t, n) {
		e.addEventListener(t, n), l.push(() => e.removeEventListener(t, n));
	}
	function _() {
		let e = r.getComputedStyle(o), t = (o.clientWidth || r.innerWidth) - (Number.parseFloat(e.paddingLeft) || 0) - (Number.parseFloat(e.paddingRight) || 0) - 2 * (Number.parseFloat(e.columnGap) || 8) - 8;
		return {
			min: 300,
			max: Math.max(300, Math.min(720, t - 420)),
			default: Math.max(300, t * .3)
		};
	}
	function v() {
		let e = _();
		d = Math.round(Math.min(e.max, Math.max(e.min, u ?? e.default))), o.style.setProperty("--conversation-width", d + "px"), s.setAttribute("aria-valuemin", String(e.min)), s.setAttribute("aria-valuemax", String(Math.floor(e.max))), s.setAttribute("aria-valuenow", String(d)), s.setAttribute("aria-valuetext", `${d} pixels pour la discussion`), s.tabIndex = r.innerWidth > 900 && !h ? 0 : -1;
	}
	function y(r) {
		let i = _();
		u = Math.min(i.max, Math.max(i.min, r));
		let a = t(e);
		v(), n(a);
	}
	function b() {
		f && (s.hasPointerCapture?.(f.pointer) && s.releasePointerCapture(f.pointer), f = null, o.classList.remove("layout-resizing"), a(r, u));
	}
	function x() {
		let r = t(e);
		if (h) {
			for (let e of m) e.wasInert || e.element.removeAttribute("inert");
			m = [];
		} else {
			m = [...e.querySelectorAll(".topbar, .mobile-navigation, .skip-link, #discussion, #conversation-resizer")].map((e) => ({
				element: e,
				wasInert: e.hasAttribute("inert")
			}));
			for (let e of m) e.element.setAttribute("inert", "");
		}
		h = !h, o.classList.toggle("workspace-expanded", h), e.body.classList.toggle("studio-expanded", h), c.setAttribute("aria-pressed", String(h));
		let i = h ? "Revenir à la disposition" : "Agrandir cette vue";
		c.setAttribute("aria-label", i), c.setAttribute("title", i), v(), n(r), c.focus({ preventScroll: !0 });
	}
	function S(e) {
		if (r.innerWidth <= 900 || h) return;
		let t = _(), n = e.shiftKey ? 40 : 16, i = {
			ArrowLeft: d - n,
			ArrowRight: d + n,
			Home: t.min,
			End: t.max
		}[e.key];
		i !== void 0 && (e.preventDefault(), y(i), a(r, u));
	}
	g(s, "keydown", (e) => S(e)), g(s, "dblclick", () => {
		let i = t(e);
		u = null, a(r, null), v(), n(i);
	}), g(s, "pointerdown", (e) => {
		let t = e;
		t.button !== 0 || r.innerWidth <= 900 || h || (t.preventDefault(), s.focus({ preventScroll: !0 }), f = {
			startX: t.clientX,
			width: d,
			pointer: t.pointerId
		}, s.setPointerCapture?.(t.pointerId), o.classList.add("layout-resizing"));
	}), g(r, "pointermove", (e) => {
		let t = e;
		f && t.pointerId === f.pointer && y(f.width + t.clientX - f.startX);
	});
	for (let e of [
		"pointerup",
		"pointercancel",
		"blur"
	]) g(r, e, b);
	return g(r, "resize", () => {
		let r = t(e);
		b(), v(), n(r);
	}), g(c, "click", x), g(r, "keydown", (e) => {
		let t = e;
		t.key !== "Escape" || t.defaultPrevented || (f ? (y(f.width), b(), t.preventDefault()) : h && (x(), t.preventDefault()));
	}), g(e, "studio:before-render", () => {
		p = t(e);
	}), g(e, "studio:after-render", () => {
		n(p), p = [];
	}), v(), { destroy() {
		b(), h && x();
		for (let e of l) e();
	} };
}
typeof document < "u" && document.body?.hasAttribute("data-studio") && o(document, window);
//#endregion
export { t as captureScroll, o as mountStudioLayout, n as restoreScroll };
