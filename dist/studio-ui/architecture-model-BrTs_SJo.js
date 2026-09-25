//#region studio-ui/src/features/project/components/architecture-model.ts
var e = {
	width: 218,
	height: 108,
	column: 280,
	row: 150
}, t = {
	frontend: "Application frontend",
	module: "Module",
	service: "Service",
	endpoint: "Endpoint",
	database: "Base de données",
	cache: "Cache",
	queue: "File / événements",
	storage: "Stockage",
	external: "Service externe",
	contract: "Contrat",
	test: "Test"
}, n = {
	import: "Import",
	http: "HTTP",
	read: "Lecture",
	write: "Écriture",
	publish: "Publication",
	consume: "Consommation",
	declares: "Déclaration",
	tests: "Test associé"
}, r = {
	frontend: "Frontend",
	backend: "Backend",
	data: "Données et services",
	shared: "Partagé",
	infrastructure: "Infrastructure",
	unclassified: "Non classé"
}, i = [
	"frontend",
	"backend",
	"data",
	"shared",
	"infrastructure",
	"unclassified"
], a = /* @__PURE__ */ new Set([
	"database",
	"cache",
	"queue",
	"storage",
	"external"
]);
function o(e) {
	return a.has(e.type) ? "data" : e.layer;
}
function s(e) {
	return e.map((e) => `${e.id}:${o(e)}`).sort().join("|");
}
function c(t, n) {
	let r = { ...n?.lanes }, a = { ...n?.positions }, c = new Set(t.map(o));
	for (let e of i) c.has(e) && r[e] === void 0 && (r[e] = Object.keys(r).length);
	let l = (e) => +!![
		"module",
		"contract",
		"test"
	].includes(e.type);
	for (let n of [...t].sort((e, t) => l(e) - l(t) || e.id.localeCompare(t.id))) {
		let t = (r[o(n)] ?? 0) * e.column + 24;
		if (a[n.id]?.x === t) continue;
		delete a[n.id];
		let i = new Set(Object.values(a).filter((e) => e.x === t).map((e) => e.y)), s = 62;
		for (; i.has(s);) s += e.row;
		a[n.id] = {
			x: t,
			y: s
		};
	}
	return {
		signature: s(t),
		positions: a,
		lanes: r
	};
}
function l(e, t, n) {
	let r = t.search.trim().toLocaleLowerCase("fr"), i = e.elements.filter((e) => t.elementType !== "all" && e.type !== t.elementType || !t.details && t.elementType === "all" && !r && [
		"module",
		"test",
		"contract"
	].includes(e.type) && e.id !== n ? !1 : !r || `${e.label} ${e.sources.map((e) => e.path).join(" ")}`.toLocaleLowerCase("fr").includes(r)), a = e.relations.filter((e) => t.relationKind === "all" || e.kind === t.relationKind), o = new Set(a.flatMap((e) => [e.source, e.target])), s = t.relationKind === "all" ? i : i.filter((e) => o.has(e.id)), c = s.find((e) => e.id === n), l = (c ? [c, ...s.filter((e) => e.id !== n)] : s).slice(0, t.limit), u = new Set(l.map((e) => e.id)), d = a.filter((e) => u.has(e.source) && u.has(e.target));
	return {
		elements: l,
		relations: d.slice(0, 200),
		total: s.length,
		omittedRelations: Math.max(0, d.length - 200)
	};
}
function u(t, n) {
	let r = t.map((e) => n.positions[e.id]).filter((e) => !!e);
	if (!r.length) return {
		x: 0,
		y: 0,
		width: 880,
		height: 460
	};
	let i = Math.min(...r.map((e) => e.x)) - 24, a = Math.min(...r.map((e) => e.y)) - 54;
	return {
		x: i,
		y: a,
		width: Math.max(...r.map((e) => e.x)) - i + e.width + 24,
		height: Math.max(...r.map((e) => e.y)) - a + e.height + 34
	};
}
function d(e, t) {
	let n = /* @__PURE__ */ new Map();
	if (!t) return n;
	let r = new Map(t.elements.map((e) => [e.id, e])), i = new Map(t.files.map((e) => [e.path, e.sha256])), a = new Map(e.files.map((e) => [e.path, e.sha256]));
	for (let t of e.elements) {
		let e = r.get(t.id);
		e ? (JSON.stringify(e) !== JSON.stringify(t) || t.sources.some((e) => a.get(e.path) !== i.get(e.path))) && n.set(t.id, "modified") : n.set(t.id, "added");
	}
	return n;
}
function f(t, n) {
	let r = t.x + e.width, i = t.y + e.height / 2, a = n.y + e.height / 2;
	if (t.x === n.x) return `M ${r - 40} ${t.y + e.height} C ${r + 40} ${t.y + e.height + 20}, ${r + 40} ${n.y - 20}, ${r - 40} ${n.y}`;
	let o = (r + n.x) / 2;
	return `M ${r} ${i} C ${o} ${i}, ${o} ${a}, ${n.x} ${a}`;
}
function p(e, t = 25) {
	return e.length > t ? `${e.slice(0, t - 1)}…` : e;
}
function m(e) {
	return e.replace(/Bearer\s+\S+/gi, "Bearer [masqué]").replace(/(["']?(?:password|secret|token|api[_-]?key|authorization)["']?\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;&]+)/gi, "$1[masqué]").replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[adresse masquée]");
}
//#endregion
export { c as a, u as c, m as d, f, n as i, d as l, t as n, o, p, r, l as s, e as t, s as u };
