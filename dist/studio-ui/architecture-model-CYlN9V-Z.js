import "./jsx-runtime-DZd2gj5L.js";
import { s as e } from "./i18n-CRhBcIYq.js";
//#region studio-ui/src/features/project/components/architecture-model.ts
var t = {
	width: 218,
	height: 108,
	column: 280,
	row: 150
}, n = (t = "en") => ({
	frontend: e("Application frontend", "Frontend application", void 0, t),
	module: e("Module", "Module", void 0, t),
	service: e("Service", "Service", void 0, t),
	endpoint: e("Endpoint", "Endpoint", void 0, t),
	database: e("Base de données", "Database", void 0, t),
	cache: e("Cache", "Cache", void 0, t),
	queue: e("File / événements", "Queue / events", void 0, t),
	storage: e("Stockage", "Storage", void 0, t),
	external: e("Service externe", "External service", void 0, t),
	contract: e("Contrat", "Contract", void 0, t),
	test: e("Test", "Test", void 0, t)
}), r = (t = "en") => ({
	import: e("Import", "Import", void 0, t),
	http: e("HTTP", "HTTP", void 0, t),
	read: e("Lecture", "Read", void 0, t),
	write: e("Écriture", "Write", void 0, t),
	publish: e("Publication", "Publish", void 0, t),
	consume: e("Consommation", "Consume", void 0, t),
	declares: e("Déclaration", "Declaration", void 0, t),
	tests: e("Test associé", "Related test", void 0, t)
}), i = (t = "en") => ({
	frontend: e("Frontend", "Frontend", void 0, t),
	backend: e("Backend", "Backend", void 0, t),
	data: e("Données et services", "Data and services", void 0, t),
	shared: e("Partagé", "Shared", void 0, t),
	infrastructure: e("Infrastructure", "Infrastructure", void 0, t),
	unclassified: e("Non classé", "Unclassified", void 0, t)
}), a = [
	"frontend",
	"backend",
	"data",
	"shared",
	"infrastructure",
	"unclassified"
], o = /* @__PURE__ */ new Set([
	"database",
	"cache",
	"queue",
	"storage",
	"external"
]);
function s(e) {
	return o.has(e.type) ? "data" : e.layer;
}
function c(e) {
	return e.map((e) => `${e.id}:${s(e)}`).sort().join("|");
}
function l(e, n) {
	let r = { ...n?.lanes }, i = { ...n?.positions }, o = new Set(e.map(s));
	for (let e of a) o.has(e) && r[e] === void 0 && (r[e] = Object.keys(r).length);
	let l = (e) => +!![
		"module",
		"contract",
		"test"
	].includes(e.type);
	for (let n of [...e].sort((e, t) => l(e) - l(t) || e.id.localeCompare(t.id))) {
		let e = (r[s(n)] ?? 0) * t.column + 24;
		if (i[n.id]?.x === e) continue;
		delete i[n.id];
		let a = new Set(Object.values(i).filter((t) => t.x === e).map((e) => e.y)), o = 62;
		for (; a.has(o);) o += t.row;
		i[n.id] = {
			x: e,
			y: o
		};
	}
	return {
		signature: c(e),
		positions: i,
		lanes: r
	};
}
function u(e, t, n) {
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
function d(e, n) {
	let r = e.map((e) => n.positions[e.id]).filter((e) => !!e);
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
		width: Math.max(...r.map((e) => e.x)) - i + t.width + 24,
		height: Math.max(...r.map((e) => e.y)) - a + t.height + 34
	};
}
function f(e, t) {
	let n = /* @__PURE__ */ new Map();
	if (!t) return n;
	let r = new Map(t.elements.map((e) => [e.id, e])), i = new Map(t.files.map((e) => [e.path, e.sha256])), a = new Map(e.files.map((e) => [e.path, e.sha256]));
	for (let t of e.elements) {
		let e = r.get(t.id);
		e ? (JSON.stringify(e) !== JSON.stringify(t) || t.sources.some((e) => a.get(e.path) !== i.get(e.path))) && n.set(t.id, "modified") : n.set(t.id, "added");
	}
	return n;
}
function p(e, n) {
	let r = e.x + t.width, i = e.y + t.height / 2, a = n.y + t.height / 2;
	if (e.x === n.x) return `M ${r - 40} ${e.y + t.height} C ${r + 40} ${e.y + t.height + 20}, ${r + 40} ${n.y - 20}, ${r - 40} ${n.y}`;
	let o = (r + n.x) / 2;
	return `M ${r} ${i} C ${o} ${i}, ${o} ${a}, ${n.x} ${a}`;
}
function m(e, t = 25) {
	return e.length > t ? `${e.slice(0, t - 1)}…` : e;
}
function h(t, n = "en") {
	return t.replace(/Bearer\s+\S+/gi, e("Bearer [masqué]", "Bearer [redacted]", void 0, n)).replace(/(["']?(?:password|secret|token|api[_-]?key|authorization)["']?\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;&]+)/gi, e("$1[masqué]", "$1[redacted]", void 0, n)).replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, e("[adresse masquée]", "[address redacted]", void 0, n));
}
//#endregion
export { l as a, d as c, h as d, p as f, r as i, f as l, n, s as o, m as p, i as r, u as s, t, c as u };
