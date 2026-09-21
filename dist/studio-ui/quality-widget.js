import { i as e, n as t, r as n, t as r } from "./jsx-runtime-DZd2gj5L.js";
import { r as i, s as a } from "./i18n-CRhBcIYq.js";
import { t as o } from "./error-messages-CtvOKk7F.js";
import { t as s } from "./engine-messages-BqQBXaLA.js";
//#region studio-ui/src/features/quality/model/catalog-presentation.ts
var c = e(), l = t(), u = {
	"source-syntax": {
		title: ["Syntaxe des sources", "Source syntax"],
		tool: ["Node --check / parseur TypeScript installé", "Node --check / installed TypeScript parser"],
		objective: ["Repérer les erreurs de syntaxe sans exécuter le programme.", "Detect syntax errors without executing the program."]
	},
	"react-strict-build": {
		title: ["Compilation React stricte", "Strict React compilation"],
		tool: ["Compilateur contrôlé React / TypeScript strict", "Controlled strict React / TypeScript compiler"],
		objective: ["Vérifier les types et compiler le profil React pris en charge, sans exécuter le programme ou ses scripts.", "Check types and compile the supported React profile without executing the program or its scripts."]
	},
	"relative-imports": {
		title: ["Résolution des imports relatifs", "Relative import resolution"],
		tool: ["AST TypeScript + manifeste de la version", "TypeScript AST + version manifest"],
		objective: ["Vérifier que les imports statiques relatifs pointent vers un fichier de cette version.", "Check that static relative imports point to a file in this version."]
	},
	"json-format": {
		title: ["Documents JSON", "JSON documents"],
		tool: ["JSON.parse", "JSON.parse"],
		objective: ["Vérifier le format des documents JSON sans exécuter leur contenu.", "Check JSON document format without executing its contents."]
	},
	"type-checking": {
		title: ["Typage et contrats statiques", "Types and static contracts"],
		tool: ["TypeScript tsc --noEmit", "TypeScript tsc --noEmit"],
		objective: ["Vérifier la cohérence des types avec la configuration et les dépendances du projet.", "Check type consistency with project configuration and dependencies."]
	},
	linting: {
		title: ["Lint et conventions du projet", "Lint and project conventions"],
		tool: ["ESLint et règles du projet", "ESLint and project rules"],
		objective: ["Contrôler les conventions configurées sans assimiler le lint à un test de comportement.", "Check configured conventions without equating lint with behavior testing."]
	},
	"unit-tests": {
		title: ["Tests unitaires et assertions", "Unit tests and assertions"],
		tool: ["Runner de tests du projet", "Project test runner"],
		objective: ["Exercer la logique et examiner la pertinence des assertions.", "Exercise logic and examine the relevance of assertions."]
	},
	"integration-tests": {
		title: ["Intégration et contrats", "Integration and contracts"],
		tool: ["Runner et services du projet", "Project runner and services"],
		objective: ["Vérifier les contrats entre modules et services.", "Check contracts between modules and services."]
	},
	"end-to-end": {
		title: ["Parcours de bout en bout", "End-to-end journeys"],
		tool: ["Playwright ou navigateur autorisé", "Playwright or authorized browser"],
		objective: ["Exécuter les parcours réels, y compris les cas limites.", "Execute real journeys, including edge cases."]
	},
	"mutation-testing": {
		title: ["Pertinence par mutation", "Assertion relevance through mutation"],
		tool: ["Outil de mutation adapté au projet", "Project-appropriate mutation tool"],
		objective: ["Éprouver si les assertions détectent des défauts introduits.", "Check whether assertions detect introduced defects."]
	},
	"bundle-size": {
		title: ["Inventaire du bundle compilé", "Compiled bundle inventory"],
		tool: ["Manifeste et taille des artefacts", "Artifact manifest and size"],
		objective: ["Mesurer les octets compilés ; aucune latence ni performance utilisateur déduite.", "Measure compiled bytes; no latency or user performance inferred."]
	},
	loading: {
		title: ["Chargement, réseau et cache", "Loading, network and cache"],
		tool: ["DevTools Network / Lighthouse", "DevTools Network / Lighthouse"],
		objective: ["Mesurer les ressources, le cache et le chargement.", "Measure resources, cache and loading."]
	},
	responsiveness: {
		title: ["Réactivité et tâches longues", "Responsiveness and long tasks"],
		tool: ["Profiler du navigateur", "Browser profiler"],
		objective: ["Mesurer les tâches JavaScript qui retardent les interactions.", "Measure JavaScript tasks that delay interactions."]
	},
	"react-renders": {
		title: ["Rendus React", "React renders"],
		tool: ["React Profiler", "React Profiler"],
		objective: ["Mesurer les rendus et leurs causes.", "Measure renders and their causes."]
	},
	"api-latency": {
		title: ["Latences API et tracing", "API latency and tracing"],
		tool: ["Profiler backend / OpenTelemetry", "Backend profiler / OpenTelemetry"],
		objective: ["Mesurer les temps et erreurs d’une requête.", "Measure request duration and errors."]
	},
	"database-queries": {
		title: ["Requêtes, index et N+1", "Queries, indexes and N+1"],
		tool: ["EXPLAIN et profiler de base", "EXPLAIN and database profiler"],
		objective: ["Examiner les plans de requêtes sur une base autorisée.", "Examine query plans on an authorized database."]
	},
	memory: {
		title: ["Mémoire et allocations", "Memory and allocations"],
		tool: ["Heap profiler", "Heap profiler"],
		objective: ["Observer les allocations et rechercher les fuites.", "Observe allocations and investigate leaks."]
	},
	load: {
		title: ["Charge, débit et endurance", "Load, throughput and endurance"],
		tool: ["k6 ou outil autorisé", "k6 or authorized tool"],
		objective: ["Mesurer débit, erreurs et stabilité sous charge.", "Measure throughput, errors and stability under load."]
	},
	keyboard: {
		title: ["Clavier et focus", "Keyboard and focus"],
		tool: ["Revue navigateur manuelle", "Manual browser review"],
		objective: ["Parcourir les actions et vérifier le focus visible.", "Navigate actions and check visible focus."]
	},
	semantics: {
		title: ["Sémantique, libellés et contrastes", "Semantics, labels and contrast"],
		tool: ["Analyse automatisée + revue manuelle", "Automated analysis + manual review"],
		objective: ["Vérifier les noms accessibles, la structure et les contrastes.", "Check accessible names, structure and contrast."]
	},
	responsive: {
		title: ["Responsive et compatibilité", "Responsive layout and compatibility"],
		tool: ["Navigateurs et tailles représentatives", "Representative browsers and sizes"],
		objective: ["Vérifier le rendu, le défilement et la compatibilité.", "Check rendering, scrolling and compatibility."]
	},
	"ui-states": {
		title: ["États vides, chargements et erreurs", "Empty, loading and error states"],
		tool: ["Parcours navigateur", "Browser journeys"],
		objective: ["Vérifier les états utiles et les moyens de récupération.", "Check useful states and recovery options."]
	},
	"secret-markers": {
		title: ["Marqueurs explicites de secrets", "Explicit secret markers"],
		tool: ["Détecteur borné de formats sensibles", "Bounded sensitive-format detector"],
		objective: ["Repérer des clés privées PEM et formats de jetons connus ; valeurs masquées.", "Detect PEM private keys and known token formats; values redacted."]
	},
	authorization: {
		title: ["Autorisations et isolation", "Authorization and isolation"],
		tool: ["Tests API avec identités de test", "API tests with test identities"],
		objective: ["Vérifier les limites d’accès côté serveur.", "Check server-side access boundaries."]
	},
	"server-validation": {
		title: ["Validation serveur", "Server validation"],
		tool: ["Tests de contrats et entrées invalides", "Contract tests and invalid inputs"],
		objective: ["Éprouver les entrées reçues par le serveur.", "Exercise inputs received by the server."]
	},
	dependencies: {
		title: ["Dépendances et analyse statique", "Dependencies and static analysis"],
		tool: ["Analyseur SAST / audit du verrou installé", "SAST analyzer / installed lockfile audit"],
		objective: ["Examiner les dépendances et les chemins risqués.", "Review dependencies and risky paths."]
	},
	"dynamic-security": {
		title: ["Sécurité dynamique autorisée", "Authorized dynamic security"],
		tool: ["Scanner configuré pour la cible autorisée", "Scanner configured for the authorized target"],
		objective: ["Examiner une cible explicitement autorisée.", "Examine an explicitly authorized target."]
	},
	"network-recovery": {
		title: ["Coupures, délais et reprise", "Disconnections, timeouts and recovery"],
		tool: ["Injection de fautes réseau", "Network fault injection"],
		objective: ["Vérifier les timeouts, les erreurs et la conservation des saisies.", "Check timeouts, errors and input preservation."]
	},
	concurrency: {
		title: ["Concurrence et idempotence", "Concurrency and idempotence"],
		tool: ["Tests d’intégration concurrents", "Concurrent integration tests"],
		objective: ["Éprouver les transactions, doublons et mises à jour concurrentes.", "Exercise transactions, duplicates and concurrent updates."]
	},
	backup: {
		title: ["Sauvegarde et restauration", "Backup and restoration"],
		tool: ["Exercice de restauration", "Restoration exercise"],
		objective: ["Restaurer une copie autorisée et confronter les données.", "Restore an authorized copy and compare data."]
	},
	observability: {
		title: ["Logs, exceptions et traces", "Logs, exceptions and traces"],
		tool: ["Instrumentation et collecteur du projet", "Project instrumentation and collector"],
		objective: ["Observer une exécution avec des données sensibles masquées.", "Observe execution with sensitive data redacted."]
	},
	availability: {
		title: ["Disponibilité et alertes", "Availability and alerts"],
		tool: ["Sondes et alertes du projet", "Project probes and alerts"],
		objective: ["Vérifier un service réellement lancé.", "Check an actually running service."]
	},
	rollback: {
		title: ["Déploiement et retour arrière", "Deployment and rollback"],
		tool: ["Pipeline autorisé du projet", "Authorized project pipeline"],
		objective: ["Éprouver la reprise et le retour arrière sans publier depuis ce contrôle.", "Exercise recovery and rollback without publishing from this check."]
	},
	costs: {
		title: ["Coût et consommation", "Cost and usage"],
		tool: ["Mesures du fournisseur et du runtime", "Provider and runtime measurements"],
		objective: ["Rapprocher la consommation réellement mesurée du périmètre.", "Compare actual measured usage against scope."]
	},
	"business-journey": {
		title: ["Critères métier du projet", "Project business criteria"],
		tool: ["Scénarios issus du cadrage", "Scenarios from framing"],
		objective: ["Vérifier les critères du projet ; aucun scénario sectoriel n’est inventé.", "Check project criteria; no industry-specific scenario is invented."]
	},
	"business-browser": {
		title: ["Scénarios navigateur du candidat", "Candidate browser scenarios"],
		tool: ["Playwright · navigateur local isolé", "Playwright · isolated local browser"],
		objective: ["Exécuter les assertions déclarées sur une copie du candidat et des données de recette vides.", "Execute declared assertions on a copy of the candidate with empty test data."]
	}
}, d = {
	functional: ["Fonctionnel", "Functional"],
	performance: ["Performance", "Performance"],
	accessibility: ["Accessibilité", "Accessibility"],
	security: ["Sécurité", "Security"],
	reliability: ["Fiabilité", "Reliability"],
	operations: ["Exploitation", "Operations"],
	business: ["Métier", "Business"]
};
function f(e, t) {
	let n = u[e.id];
	if (!n) return e;
	let r = { ...e };
	for (let i of [
		"title",
		"tool",
		"objective"
	]) {
		let o = n[i];
		e[i] === o[0] && (r[i] = a(o[0], o[1], void 0, t));
	}
	e.reason && (r.reason = s(e.reason, t));
	let i = /^Capacité ([a-zA-Z]+) non détectée dans cette version ; confirmer le périmètre si nécessaire\.$/.exec(e.reason ?? "");
	i && (r.reason = a("Capacité {scope} non détectée dans cette version ; confirmer le périmètre si nécessaire.", "Capability {scope} was not detected in this version; confirm the scope if needed.", { scope: i[1] }, t)), e.reason === "Cette technique nécessite un outil ou une session dédiée non pilotée par ce Studio." && (r.reason = a(e.reason, "This technique requires a dedicated tool or session not controlled by this Studio.", void 0, t));
	let o = "Exécuter " + e.tool + " dans un environnement autorisé, puis conserver une preuve liée à cette version.";
	return e.nextAction === o ? r.nextAction = a("Exécuter {tool} dans un environnement autorisé, puis conserver une preuve liée à cette version.", "Run {tool} in an authorized environment, then retain evidence linked to this version.", { tool: r.tool }, t) : e.nextAction && (r.nextAction = s(e.nextAction, t)), r;
}
function p(e, t) {
	return e ? {
		...e,
		categories: e.categories.map((e) => ({
			...e,
			label: d[e.id] ? a(d[e.id][0], d[e.id][1], void 0, t) : e.label
		})),
		checks: e.checks.map((e) => f(e, t)),
		limits: e.limits.map((e) => s(e, t))
	} : null;
}
//#endregion
//#region studio-ui/src/features/quality/model/ui-messages.ts
var m = {
	"Le pilote optionnel playwright-core est absent de cette installation.": "The optional playwright-core driver is absent from this installation.",
	"Le pilote est installé. Activer ce contrôle pour utiliser une copie isolée du candidat.": "The driver is installed. Enable this check to use an isolated copy of the candidate.",
	"Réenregistrer ce réglage pour confirmer la configuration locale avant de lancer le contrôle.": "Save this setting again to confirm the local configuration before running the check.",
	"Le navigateur sélectionné doit être installé ; sa disponibilité sera vérifiée au lancement.": "The selected browser must be installed; availability will be checked at launch.",
	Lecture: "Read",
	Configuration: "Configuration",
	Contrôle: "Check",
	"Réglage navigateur indisponible.": "Browser settings unavailable.",
	"Configuration navigateur invalide.": "Invalid browser configuration.",
	"Configuration relue. Vos choix sont conservés ; examinez-les avant d’enregistrer.": "Configuration reloaded. Your choices are retained; review them before saving.",
	"Lecture impossible.": "Unable to load.",
	"Réglage enregistré. Aucun navigateur lancé maintenant. Les prochains candidats de l’agent pourront être vérifiés automatiquement.": "Settings saved. No browser launched now. Future agent candidates may be checked automatically.",
	"Réglage enregistré. Aucun navigateur lancé. Utilisez Exécuter dans le contrôle navigateur.": "Settings saved. No browser launched. Use Run in the browser check.",
	" Vos choix sont conservés. Relisez la configuration avant de réessayer.": " Your choices are retained. Reload the configuration before retrying.",
	"L’examen reçu ne correspond pas à cette version et ce reçu.": "The received review does not match this version and receipt.",
	"Appréciation enregistrée. Aucun contrôle relancé ni version adoptée.": "Assessment saved. No check rerun or version adopted.",
	"Appréciation enregistrée, mais relecture indisponible. ": "Assessment saved, but reloading is unavailable. ",
	" Vos saisies sont conservées. Actualisez l’examen avant de confirmer à nouveau.": " Your entries are retained. Refresh the review before confirming again.",
	"Rapport qualité invalide.": "Invalid quality report.",
	"La réponse concerne une autre version ; série interrompue.": "The response concerns another version; batch interrupted.",
	"La réponse concerne une autre version ; rapport écarté.": "The response concerns another version; report discarded.",
	"Contrôle indisponible.": "Check unavailable.",
	"La réponse concerne une autre version.": "The response concerns another version.",
	"Actualisation du rapport après appréciation impossible. ": "Could not refresh the report after assessment. ",
	"Réessayez.": "Retry.",
	"Chargement impossible.": "Unable to load.",
	"Enregistrement impossible.": "Unable to save."
};
function h(e, t) {
	if (!e) return e;
	let n = /^Délai de réponse dépassé \((\d+(?:\.\d+)?) s\)\. Aucun nouveau résultat confirmé\. Réessayez pour lire l’état réel des contrôles ; une exécution peut continuer côté serveur\.$/.exec(e);
	if (n) return a("Délai de réponse dépassé ({seconds} s). Aucun nouveau résultat confirmé. Réessayez pour lire l’état réel des contrôles ; une exécution peut continuer côté serveur.", "Response timed out ({seconds} s). No new result confirmed. Retry to read the actual check status; execution may continue on the server.", { seconds: n[1] }, t);
	if (m[e]) return a(e, m[e], void 0, t);
	for (let [n, r] of Object.entries(m)) {
		if (n.endsWith(" ") && e.startsWith(n)) return a(n, r, void 0, t) + (h(e.slice(n.length), t) ?? "");
		if (n.startsWith(" ") && e.endsWith(n)) return (h(e.slice(0, -n.length), t) ?? "") + a(n, r, void 0, t);
	}
	return o(e, t);
}
//#endregion
//#region studio-ui/src/features/quality/model/selectors.ts
var g = (e = "en") => ({
	notrun: a("Non exécuté", "Not run", void 0, e),
	running: a("En cours", "Running", void 0, e),
	passed: a("Réussi", "Passed", void 0, e),
	failed: a("Échec", "Failed", void 0, e),
	blocked: a("Bloqué", "Blocked", void 0, e),
	notapplicable: a("Non applicable", "Not applicable", void 0, e),
	configure: a("Connexion nécessaire", "Connection required", void 0, e)
});
function _(e) {
	return e.execution === "external" && !e.evidence && e.status === "blocked" && e.freshness === "current" ? "configure" : e.status;
}
function v(e) {
	return e.filter((e) => e.canRun && e.execution === "studio" && e.freshness === "current");
}
var y = (e = "en") => ({
	current: a("Version sélectionnée", "Selected version", void 0, e),
	obsolete: a("Autre version", "Another version", void 0, e),
	reevaluate: a("À réévaluer", "Needs review", void 0, e)
});
function b(e, t, n) {
	return e.filter((e) => (t === "all" || e.category === t) && (n === "all" || _(e) === n));
}
function x(e) {
	return e.reduce((e, t) => (e.total++, t.freshness === "current" ? (e[_(t)]++, e) : (e.reevaluate++, e)), {
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
var S = (e) => e.slice(0, 8);
function C(e, t = "en") {
	return e == null ? "—" : e < 1e3 ? `${new Intl.NumberFormat(t).format(e)} ms` : `${new Intl.NumberFormat(t, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	}).format(e / 1e3)} s`;
}
function w(e, t = "en") {
	return e ? new Intl.DateTimeFormat(t === "fr" ? "fr-FR" : "en-US", {
		dateStyle: "short",
		timeStyle: "short"
	}).format(new Date(e)) : a("Non exécuté", "Not run", void 0, t);
}
//#endregion
//#region studio-ui/src/features/quality/hooks/useQuality.ts
async function T(e, t = "en") {
	let n = await e.json();
	if (!e.ok) {
		let e = typeof n == "object" && n && "error" in n ? String(n.error) : a("Le service qualité n’a pas répondu.", "The quality service did not respond.", void 0, t);
		throw Error(e);
	}
	if (typeof n != "object" || !n || !("checks" in n) || !Array.isArray(n.checks) || !("revisionId" in n)) throw Error(a("Rapport qualité invalide.", "Invalid quality report.", void 0, t));
	return n;
}
async function E(e, t, n, r, i = "en") {
	let o = AbortSignal.timeout(n), s = AbortSignal.any([t, o]);
	try {
		let t = await T(await fetch(e, {
			...r,
			signal: s
		}), i);
		return s.throwIfAborted(), t;
	} catch (e) {
		throw o.aborted && !t.aborted ? Error(a("Délai de réponse dépassé ({seconds} s). Aucun nouveau résultat confirmé. Réessayez pour lire l’état réel des contrôles ; une exécution peut continuer côté serveur.", "Response timed out ({seconds} s). No new result confirmed. Retry to read the actual check status; execution may continue on the server.", { seconds: n / 1e3 }, i), { cause: e }) : e;
	}
}
async function D(e, t = "en") {
	let n = 0;
	for (let r of e.queue) {
		if (!e.current() || e.shouldStop()) break;
		e.onStart(r);
		let i = await E("/api/project/checks/run", e.signal, 3e4, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				revisionId: e.revisionId,
				checkId: r
			})
		}, t);
		if (!e.current()) break;
		if (i.revisionId !== e.revisionId) throw Error(a("La réponse concerne une autre version ; série interrompue.", "The response concerns another version; batch interrupted.", void 0, t));
		e.onResult(i, ++n);
	}
	return n;
}
function O({ revisionId: e, onStateChanged: t, verification: r }) {
	let { locale: i } = n(), a = r?.revisionId === e ? JSON.stringify([
		r.jobId,
		r.revisionId,
		r.status,
		r.receiptId,
		r.finishedAt
	]) : "", o = r?.status === "running", [s, l] = (0, c.useState)(null), [u, d] = (0, c.useState)(""), [f, m] = (0, c.useState)(null), [g, _] = (0, c.useState)(null), y = (0, c.useRef)(!1), [b, x] = (0, c.useState)(0), S = s?.report.revisionId === e && s.refreshKey === b && s.verificationKey === a ? s.report : null, C = (0, c.useRef)(0), w = (0, c.useRef)(null), T = (0, c.useRef)(null);
	(0, c.useEffect)(() => {
		let t = new AbortController(), n = ++C.current;
		return w.current?.abort(), w.current = null, l(null), _(null), d(""), m(null), e && E(`/api/project/checks?revision=${encodeURIComponent(e)}`, t.signal, 15e3, void 0, "fr").then((r) => {
			if (!t.signal.aborted && n === C.current) {
				if (r.revisionId !== e) throw Error("La réponse concerne une autre version ; rapport écarté.");
				l({
					report: r,
					refreshKey: b,
					verificationKey: a
				});
			}
		}).catch((e) => {
			!t.signal.aborted && n === C.current && (l(null), d(e instanceof Error ? e.message : "Chargement impossible."));
		}), () => {
			t.abort(), w.current?.abort(), T.current?.abort();
		};
	}, [
		e,
		b,
		a
	]);
	let O = (0, c.useCallback)(async (n, r) => {
		if (o || !e || w.current || S?.revisionId !== e) return;
		let i = new Set(v(S.checks).map((e) => e.id)), s = [...new Set(n)].filter((e) => i.has(e));
		if (!s.length) return;
		T.current?.abort();
		let c = new AbortController(), u = C.current, f = () => !c.signal.aborted && u === C.current;
		w.current = c, y.current = !1, d(""), _(r ? {
			revisionId: e,
			total: s.length,
			completed: 0,
			state: "running"
		} : null);
		let p = 0;
		try {
			p = await D({
				queue: s,
				revisionId: e,
				signal: c.signal,
				current: f,
				shouldStop: () => y.current,
				onStart: m,
				onResult(t, n) {
					l((n) => ({
						refreshKey: b,
						verificationKey: a,
						report: {
							...t,
							flowModel: t.flowModel ?? (n?.report.revisionId === e && n.refreshKey === b ? n.report.flowModel : null)
						}
					})), p = n, r && _({
						revisionId: e,
						total: s.length,
						completed: p,
						state: "running"
					});
				}
			}, "fr"), f() && t?.();
		} catch (e) {
			f() && (l(null), d(e instanceof Error ? e.message : "Contrôle indisponible."));
		} finally {
			f() && (m(null), w.current = null, _((e) => e ? {
				...e,
				completed: p,
				state: p === s.length ? "complete" : "stopped"
			} : null));
		}
	}, [
		e,
		S,
		b,
		a,
		o,
		t
	]), k = (0, c.useCallback)(async () => {
		if (!e) return;
		T.current?.abort();
		let t = new AbortController(), n = C.current;
		T.current = t;
		try {
			let r = await E(`/api/project/checks?revision=${encodeURIComponent(e)}`, t.signal, 15e3, void 0, "fr");
			if (t.signal.aborted || n !== C.current) return;
			if (r.revisionId !== e) throw Error("La réponse concerne une autre version.");
			l({
				report: r,
				refreshKey: b,
				verificationKey: a
			});
		} catch (e) {
			!t.signal.aborted && n === C.current && d("Actualisation du rapport après appréciation impossible. " + (e instanceof Error ? e.message : "Réessayez."));
		}
	}, [
		e,
		b,
		a
	]), A = S?.revisionId === e ? S : null;
	return {
		report: p(A, i),
		error: h(u, i),
		runningId: o ? r?.revisionId === e ? "business-browser" : "automatic-browser-other-revision" : f,
		batch: g?.revisionId === e ? g : null,
		run: (e) => O([e], !1),
		runAll: () => O(v(A?.checks ?? []).map((e) => e.id), !0),
		stopAfterCurrent: () => {
			y.current = !0, _((e) => e ? {
				...e,
				stopping: !0
			} : null);
		},
		refreshCoverage: k,
		refresh: () => x((e) => e + 1)
	};
}
//#endregion
//#region studio-ui/src/features/quality/components/QualityTable.tsx
var k = r();
function A({ checks: e, selectedId: t, runningId: r, categories: i, onSelect: a }) {
	let { t: o, locale: s } = n();
	return /* @__PURE__ */ (0, k.jsxs)("div", {
		className: "quality-table-scroll",
		tabIndex: 0,
		"aria-label": o("Tableau des contrôles, défilement horizontal disponible", "Checks table, horizontal scrolling available"),
		children: [/* @__PURE__ */ (0, k.jsxs)("table", {
			className: "quality-table",
			children: [
				/* @__PURE__ */ (0, k.jsx)("caption", {
					className: "quality-sr",
					children: o("Contrôles du périmètre filtré. Sélectionnez un nom pour consulter sa preuve.", "Checks in the filtered scope. Select a name to inspect its evidence.")
				}),
				/* @__PURE__ */ (0, k.jsx)("thead", { children: /* @__PURE__ */ (0, k.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, k.jsx)("th", {
						scope: "col",
						children: o("Contrôle", "Check")
					}),
					/* @__PURE__ */ (0, k.jsx)("th", {
						scope: "col",
						children: o("Catégorie", "Category")
					}),
					/* @__PURE__ */ (0, k.jsx)("th", {
						scope: "col",
						children: o("Outil / méthode", "Tool / method")
					}),
					/* @__PURE__ */ (0, k.jsx)("th", {
						scope: "col",
						children: o("Résultat", "Result")
					}),
					/* @__PURE__ */ (0, k.jsx)("th", {
						scope: "col",
						children: o("Durée", "Duration")
					}),
					/* @__PURE__ */ (0, k.jsx)("th", {
						scope: "col",
						children: o("Dernière exécution", "Last execution")
					})
				] }) }),
				/* @__PURE__ */ (0, k.jsx)("tbody", { children: e.map((e) => {
					let n = r === e.id ? "running" : _(e), c = e.evidence?.provider ? e.evidence : null;
					return /* @__PURE__ */ (0, k.jsxs)("tr", {
						className: t === e.id ? `is-selected quality-row-${n}` : void 0,
						children: [
							/* @__PURE__ */ (0, k.jsx)("th", {
								scope: "row",
								children: /* @__PURE__ */ (0, k.jsxs)("button", {
									type: "button",
									className: "quality-row-button",
									"aria-pressed": t === e.id,
									onClick: () => a(e.id),
									children: [e.title, /* @__PURE__ */ (0, k.jsx)("span", {
										"aria-hidden": "true",
										children: "›"
									})]
								})
							}),
							/* @__PURE__ */ (0, k.jsx)("td", { children: i.find((t) => t.id === e.category)?.label ?? e.category }),
							/* @__PURE__ */ (0, k.jsx)("td", {
								className: "quality-method",
								children: c ? o("{tool} · rapport de l’hôte", "{tool} · host report", { tool: `${c.tool}${c.toolVersion ? ` ${c.toolVersion}` : ""}` }) : e.tool
							}),
							/* @__PURE__ */ (0, k.jsxs)("td", { children: [/* @__PURE__ */ (0, k.jsx)("span", {
								className: `quality-status quality-status-${e.freshness === "current" ? n : "blocked"}`,
								children: g(s)[n]
							}), e.freshness === "current" ? null : /* @__PURE__ */ (0, k.jsx)("small", {
								className: "quality-freshness",
								children: y(s)[e.freshness]
							})] }),
							/* @__PURE__ */ (0, k.jsx)("td", {
								className: "quality-numeric",
								children: C(e.evidence?.durationMs, s)
							}),
							/* @__PURE__ */ (0, k.jsx)("td", {
								className: "quality-numeric",
								children: w(e.evidence?.finishedAt, s)
							})
						]
					}, e.id);
				}) })
			]
		}), e.length ? null : /* @__PURE__ */ (0, k.jsx)("p", {
			className: "quality-empty",
			children: o("Aucun contrôle ne correspond à ces filtres.", "No check matches these filters.")
		})]
	});
}
//#endregion
//#region studio-ui/src/features/quality/model/requests.ts
function j(e, t, n = "en") {
	let r = e.evidence, i = r?.checkId ?? e.id, o = _(e) === "configure" ? "connect" : "fix", s = r?.revisionId ?? t.revisionId, c = (e, t, r) => a(e, t, r, n), l = c("{action} : {title}", "{action}: {title}", {
		action: o === "connect" ? c("Connecter", "Connect") : c("Corriger", "Fix"),
		title: e.title
	});
	return {
		kind: o,
		revisionId: s,
		checkId: i,
		title: l,
		prompt: [
			l,
			c("Contrôle : {check}. Version concernée : {revision}.", "Check: {check}. Target version: {revision}.", {
				check: i,
				revision: s
			}),
			c("Version actuellement sélectionnée : {revision}. Fraîcheur : {freshness}.", "Currently selected version: {revision}. Freshness: {freshness}.", {
				revision: t.revisionId,
				freshness: e.freshness
			}),
			c("Objectif : {value}", "Objective: {value}", { value: r?.expected ?? e.objective }),
			c("Résultat observé : {value}", "Observed result: {value}", { value: r?.observed || e.reason || c("Aucune exécution.", "No execution.") }),
			c("Outil : {tool}.", "Tool: {tool}.", { tool: r?.tool ?? e.tool }),
			r ? c("Preuve : {id} · {date} · empreinte {fingerprint}.", "Evidence: {id} · {date} · fingerprint {fingerprint}.", {
				id: r.id,
				date: r.finishedAt ?? r.startedAt,
				fingerprint: r.fingerprint ?? c("non enregistrée", "not recorded")
			}) : c("Aucune preuve de réussite enregistrée.", "No evidence of success recorded."),
			...(r?.findings ?? []).slice(0, 10).map((e) => `${e.source ? `${e.source.path}${e.source.line ? `:${e.source.line}` : ""}` : e.target || c("Constat", "Finding")} — ${e.message}`),
			e.nextAction ? c("Prérequis : {value}", "Prerequisite: {value}", { value: e.nextAction }) : "",
			...(r?.limits ?? []).map((e) => c("Limite : {value}", "Limit: {value}", { value: e })),
			o === "connect" ? a("Examiner les outils et accès déjà disponibles. Proposer puis raccorder le contrôle adapté au projet, avec exécution bornée et preuve sur sa version exacte. Ne pas déduire de résultat avant son exécution ; aucune installation, dépense ou action externe implicite.", "Review the tools and access already available. Propose and connect a suitable check with bounded execution and evidence tied to the exact project version. Do not infer results before execution; no implicit installation, spending or external action.", void 0, n) : a("Réexaminer la preuve et la version actuelle avant toute correction. Préserver les données et décisions, corriger le périmètre affecté, puis relancer les vérifications pertinentes sur la nouvelle version. Une preuve ancienne ne valide jamais la nouvelle version.", "Review the evidence and current version before correcting. Preserve data and decisions, correct the affected scope, then rerun relevant checks on the new version. Old evidence never validates a new version.", void 0, n)
		].filter(Boolean).join("\n").slice(0, 12e3)
	};
}
//#endregion
//#region studio-ui/src/features/quality/model/coverage.ts
var M = (e = "en") => ({
	sufficient: a("Suffisante pour ce critère dans ce périmètre", "Sufficient for this criterion within this scope", void 0, e),
	partial: a("Pertinente mais partielle", "Relevant but partial", void 0, e),
	irrelevant: a("Non pertinente", "Not relevant", void 0, e)
});
function N(e, t) {
	return !e?.canReview || !t.conclusion || !t.scope.trim() || !t.reason.trim() || !t.scenarioIds.length || t.scenarioIds.length > 6 || t.scope.trim().length > 2e3 || t.reason.trim().length > 4e3 || !e.criteria.some((e) => e.id === t.criterionId) ? !1 : t.scenarioIds.every((n) => {
		let r = e.scenarios.find((e) => e.id === n);
		return r && (t.conclusion !== "sufficient" || e.receipt.status === "passed" && r.canCover);
	});
}
function P(e, t) {
	return !!(e?.receipt.status === "passed" && t.length && t.every((t) => e.scenarios.some((e) => e.id === t && e.canCover)));
}
//#endregion
//#region studio-ui/src/features/quality/hooks/useCoverageReview.ts
async function F(e, t = "en") {
	let n = await e.json();
	if (!e.ok) throw Error(n.error || a("Examen de couverture indisponible.", "Coverage review unavailable.", void 0, t));
	return n;
}
async function I(e, t, n, r = "en") {
	let i = await F(await fetch(`/api/coverage-review?${new URLSearchParams({
		revision: e,
		receipt: t
	})}`, {
		signal: n,
		credentials: "same-origin",
		cache: "no-store"
	}), r);
	if (i.revision?.id !== e || i.receipt?.id !== t || !Array.isArray(i.criteria) || !Array.isArray(i.scenarios) || !Array.isArray(i.reviews)) throw Error(a("L’examen reçu ne correspond pas à cette version et ce reçu.", "The received review does not match this version and receipt.", void 0, r));
	return i;
}
function L(e, t, r) {
	let { locale: i } = n(), [a, o] = (0, c.useState)(!1), [s, l] = (0, c.useState)(null), [u, d] = (0, c.useState)({
		criterionId: "",
		scenarioIds: [],
		conclusion: "",
		scope: "",
		reason: ""
	}), [f, p] = (0, c.useState)(null), [m, g] = (0, c.useState)(!1), [_, v] = (0, c.useState)(""), [y, b] = (0, c.useState)(""), x = (0, c.useRef)(null);
	(0, c.useEffect)(() => () => {
		x.current?.abort(), x.current = null;
	}, []);
	async function S() {
		if (x.current) return;
		let n = new AbortController();
		x.current = n, o(!0), p("read"), v(""), b(""), g(!0);
		try {
			let r = await I(e, t, n.signal, "fr");
			if (n.signal.aborted) return;
			l(r), g(!1);
		} catch (e) {
			n.signal.aborted || v(e instanceof Error ? e.message : "Lecture impossible.");
		} finally {
			n.signal.aborted || (x.current = null, p(null));
		}
	}
	async function C() {
		if (x.current || m || !N(s, u) || !s) return;
		let n = new AbortController();
		x.current = n, p("save"), v(""), b("");
		let i = !1;
		try {
			if (await F(await fetch("/api/coverage-review", {
				method: "POST",
				credentials: "same-origin",
				signal: n.signal,
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					version: s.version,
					revisionId: e,
					receiptId: t,
					reviewKey: s.reviewKey,
					...u,
					scope: u.scope.trim(),
					reason: u.reason.trim()
				})
			}), "fr"), n.signal.aborted) return;
			g(!0), i = !0, b("Appréciation enregistrée. Aucun contrôle relancé ni version adoptée."), r();
			let a = await I(e, t, n.signal, "fr");
			n.signal.aborted || l(a);
		} catch (e) {
			n.signal.aborted || (g(!0), v((i ? "Appréciation enregistrée, mais relecture indisponible. " : "") + (e instanceof Error ? e.message : "Enregistrement impossible.") + " Vos saisies sont conservées. Actualisez l’examen avant de confirmer à nouveau."));
		} finally {
			n.signal.aborted || (x.current = null, p(null));
		}
	}
	return {
		opened: a,
		review: s,
		draft: u,
		setDraft: d,
		busy: f,
		needsRead: m,
		error: h(_, i),
		message: h(y, i),
		read: S,
		save: C
	};
}
//#endregion
//#region studio-ui/src/features/quality/components/CoverageReview.tsx
var R = (e = "en") => ({
	fill: a("Saisir", "Fill", void 0, e),
	click: a("Cliquer", "Click", void 0, e),
	expectText: a("Vérifier le texte", "Check text", void 0, e),
	expectValue: a("Vérifier la valeur", "Check value", void 0, e),
	expectVisible: a("Vérifier la visibilité", "Check visibility", void 0, e),
	expectData: a("Vérifier les données", "Check data", void 0, e),
	reload: a("Recharger", "Reload", void 0, e),
	restart: a("Redémarrer", "Restart", void 0, e)
}), z = (e = "en") => ({
	passed: a("Satisfait", "Satisfied", void 0, e),
	failed: a("En échec", "Failed", void 0, e),
	blocked: a("Bloqué", "Blocked", void 0, e),
	running: a("En cours", "Running", void 0, e),
	"not-run": a("Non exécuté", "Not run", void 0, e)
});
function B({ value: e }) {
	return e && typeof e == "object" ? /* @__PURE__ */ (0, k.jsx)("ul", { children: Object.entries(e).map(([e, t]) => /* @__PURE__ */ (0, k.jsxs)("li", { children: [
		e,
		" : ",
		/* @__PURE__ */ (0, k.jsx)(B, { value: t })
	] }, e)) }) : /* @__PURE__ */ (0, k.jsx)("span", { children: e === null ? "null" : String(e) });
}
function V({ scenario: e }) {
	let { t, locale: r } = n();
	return /* @__PURE__ */ (0, k.jsxs)("details", { children: [/* @__PURE__ */ (0, k.jsxs)("summary", { children: [
		t("Étapes et résultats ·", "Steps and results ·"),
		" ",
		e.executedSteps,
		" ",
		t("étape(s) exécutée(s)", "step(s) executed")
	] }), /* @__PURE__ */ (0, k.jsx)("ol", { children: e.steps.map((n, i) => {
		let a = e.assertions.find((e) => e.step === i + 1);
		return /* @__PURE__ */ (0, k.jsxs)("li", { children: [
			/* @__PURE__ */ (0, k.jsx)("strong", { children: R(r)[n.action] ?? n.action }),
			" · ",
			a ? z(r)[a.status] ?? a.status : i < e.executedSteps ? t("Exécutée", "Executed") : t("Exécution non confirmée", "Execution not confirmed"),
			n.target ? /* @__PURE__ */ (0, k.jsxs)("p", { children: [
				t("Cible :", "Target:"),
				" ",
				n.target.role,
				" ",
				n.target.name,
				n.target.testId ? t("identifiant de test {id}", "test ID {id}", { id: n.target.testId }) : ""
			] }) : null,
			n.path ? /* @__PURE__ */ (0, k.jsxs)("p", { children: [
				t("Chemin des données :", "Data path:"),
				" ",
				n.path.join(" → ") || t("racine", "root")
			] }) : null,
			n.value === void 0 ? null : /* @__PURE__ */ (0, k.jsxs)("div", { children: [
				t("Valeur déclarée :", "Declared value:"),
				" ",
				/* @__PURE__ */ (0, k.jsx)(B, { value: n.value })
			] }),
			n.text === void 0 ? null : /* @__PURE__ */ (0, k.jsxs)("p", { children: [
				t("Texte attendu déclaré :", "Declared expected text:"),
				" ",
				n.text
			] }),
			n.expected === void 0 ? null : /* @__PURE__ */ (0, k.jsxs)("div", { children: [
				t("Données attendues déclarées :", "Declared expected data:"),
				" ",
				/* @__PURE__ */ (0, k.jsx)(B, { value: n.expected })
			] })
		] }, i);
	}) })] });
}
function H({ review: e }) {
	let { t, locale: r } = n();
	return /* @__PURE__ */ (0, k.jsxs)("details", { children: [/* @__PURE__ */ (0, k.jsxs)("summary", { children: [
		t("Appréciations enregistrées (", "Recorded assessments ("),
		e.reviews.length,
		")"
	] }), e.reviews.map((n) => /* @__PURE__ */ (0, k.jsxs)("article", { children: [
		/* @__PURE__ */ (0, k.jsx)("h4", { children: n.criterionText ?? e.criteria.find((e) => e.id === n.criterionId)?.text ?? n.criterionId }),
		/* @__PURE__ */ (0, k.jsxs)("p", { children: [
			M(r)[n.conclusion],
			" ·",
			" ",
			y(r)[n.freshness]
		] }),
		/* @__PURE__ */ (0, k.jsxs)("p", { children: [
			t("Périmètre :", "Scope:"),
			" ",
			n.scope
		] }),
		/* @__PURE__ */ (0, k.jsxs)("p", { children: [
			t("Justification :", "Reason:"),
			" ",
			n.reason
		] }),
		/* @__PURE__ */ (0, k.jsxs)("p", { children: [
			t("Scénarios :", "Scenarios:"),
			" ",
			n.scenarioIds.join(", "),
			" ",
			t("· Décision", "· Decision"),
			" ",
			n.decisionId
		] })
	] }, n.decisionId))] });
}
function U({ review: e, draft: t, setDraft: r }) {
	let { t: i, locale: a } = n();
	return /* @__PURE__ */ (0, k.jsxs)("fieldset", { children: [
		/* @__PURE__ */ (0, k.jsx)("legend", { children: i("Scénarios à apprécier (au moins un)", "Scenarios to assess (at least one)") }),
		e.scenarios.map((e) => /* @__PURE__ */ (0, k.jsxs)("article", { children: [
			/* @__PURE__ */ (0, k.jsxs)("label", { children: [/* @__PURE__ */ (0, k.jsx)("input", {
				type: "checkbox",
				checked: t.scenarioIds.includes(e.id),
				onChange: (n) => r({
					...t,
					scenarioIds: n.target.checked ? [...t.scenarioIds, e.id] : t.scenarioIds.filter((t) => t !== e.id)
				})
			}), e.title] }),
			/* @__PURE__ */ (0, k.jsxs)("p", { children: [
				z(a)[e.status] ?? e.status,
				" ",
				i("· Liens déclarés aux critères :", "· Declared criterion links:"),
				" ",
				e.criterionIds.join(", ") || i("aucun", "none"),
				".",
				" ",
				e.canCover ? "" : i("Ne permet pas de conclure à une couverture suffisante.", "Cannot support sufficient coverage.")
			] }),
			/* @__PURE__ */ (0, k.jsx)(V, { scenario: e })
		] }, e.id)),
		t.scenarioIds.filter((t) => !e.scenarios.some((e) => e.id === t)).map((e) => /* @__PURE__ */ (0, k.jsxs)("label", { children: [
			/* @__PURE__ */ (0, k.jsx)("input", {
				type: "checkbox",
				checked: !0,
				onChange: () => r({
					...t,
					scenarioIds: t.scenarioIds.filter((t) => t !== e)
				})
			}),
			i("Scénario devenu indisponible :", "Scenario no longer available:"),
			" ",
			e,
			i(". Décochez-le pour poursuivre.", ". Deselect it to continue.")
		] }, e))
	] });
}
function W({ review: e }) {
	let { t, locale: r } = n();
	return /* @__PURE__ */ (0, k.jsxs)(k.Fragment, { children: [
		/* @__PURE__ */ (0, k.jsxs)("p", { children: [
			e.revision.title,
			" · ",
			e.revision.id,
			" ",
			t("· Reçu", "· Receipt"),
			" ",
			e.receipt.id,
			" · ",
			z(r)[e.receipt.status] ?? e.receipt.status,
			" ",
			"· ",
			y(r)[e.receipt.freshness]
		] }),
		/* @__PURE__ */ (0, k.jsxs)("p", { children: [
			t("Protocole", "Protocol"),
			" ",
			e.receipt.protocol ?? t("non recueilli", "not captured"),
			" ",
			t("· pilote", "· driver"),
			" ",
			e.receipt.driverVersion ?? t("non recueilli", "not captured"),
			" ",
			t("· navigateur", "· browser"),
			" ",
			e.receipt.browserVersion ?? t("non recueilli", "not captured"),
			"."
		] }),
		e.canReview ? null : /* @__PURE__ */ (0, k.jsxs)("p", {
			role: "status",
			children: [
				t("Examen indisponible :", "Review unavailable:"),
				" ",
				e.reason
			]
		})
	] });
}
function G({ revisionId: e, receiptId: t, onSaved: r }) {
	let { t: i, locale: a } = n(), o = L(e, t, r), { review: s, draft: c } = o, l = s?.criteria.find((e) => e.id === c.criterionId), u = P(s, c.scenarioIds), d = /* @__PURE__ */ (0, k.jsxs)(k.Fragment, { children: [o.error ? /* @__PURE__ */ (0, k.jsx)("p", {
		role: "alert",
		className: "quality-error",
		children: o.error
	}) : null, o.message ? /* @__PURE__ */ (0, k.jsx)("p", {
		role: "status",
		children: o.message
	}) : null] });
	return /* @__PURE__ */ (0, k.jsx)("section", {
		className: "quality-coverage-review",
		"aria-label": i("Examen de couverture métier", "Business coverage review"),
		children: o.opened ? /* @__PURE__ */ (0, k.jsxs)(k.Fragment, { children: [
			/* @__PURE__ */ (0, k.jsx)("h4", { children: i("Examiner la couverture métier", "Review business coverage") }),
			/* @__PURE__ */ (0, k.jsx)("p", { children: i("Appréciez la pertinence des scénarios pour un critère et un périmètre précis. Cette décision ne relance aucun contrôle et n’adopte aucune version.", "Assess how relevant the scenarios are to a specific criterion and scope. This decision does not rerun checks or adopt a version.") }),
			/* @__PURE__ */ (0, k.jsx)("button", {
				type: "button",
				disabled: o.busy !== null,
				onClick: () => void o.read(),
				children: i("Actualiser l’examen", "Refresh review")
			}),
			s ? null : d,
			o.busy ? /* @__PURE__ */ (0, k.jsx)("p", {
				role: "status",
				children: o.busy === "read" ? i("Lecture de l’examen…", "Loading review…") : i("Enregistrement de l’appréciation…", "Saving assessment…")
			}) : null,
			s ? /* @__PURE__ */ (0, k.jsxs)(k.Fragment, { children: [
				/* @__PURE__ */ (0, k.jsx)(W, { review: s }),
				/* @__PURE__ */ (0, k.jsx)(H, { review: s }),
				/* @__PURE__ */ (0, k.jsx)("form", {
					onSubmit: (e) => {
						e.preventDefault(), o.save();
					},
					children: /* @__PURE__ */ (0, k.jsxs)("fieldset", {
						disabled: o.busy !== null || !s.canReview,
						children: [
							/* @__PURE__ */ (0, k.jsx)("legend", { children: i("Votre appréciation de couverture", "Your coverage assessment") }),
							/* @__PURE__ */ (0, k.jsxs)("label", { children: [i("Critère à examiner", "Criterion to review"), /* @__PURE__ */ (0, k.jsxs)("select", {
								required: !0,
								value: c.criterionId,
								onChange: (e) => o.setDraft({
									...c,
									criterionId: e.target.value
								}),
								children: [/* @__PURE__ */ (0, k.jsx)("option", {
									value: "",
									children: i("Choisir un critère", "Choose a criterion")
								}), s.criteria.map((e) => /* @__PURE__ */ (0, k.jsx)("option", {
									value: e.id,
									children: e.text
								}, e.id))]
							})] }),
							l ? /* @__PURE__ */ (0, k.jsxs)("p", { children: [
								i("Critère exact :", "Exact criterion:"),
								" ",
								l.text
							] }) : null,
							/* @__PURE__ */ (0, k.jsx)(U, {
								review: s,
								draft: c,
								setDraft: o.setDraft
							}),
							/* @__PURE__ */ (0, k.jsxs)("p", { children: [
								i("Les étapes montrent le manifeste déclaré.", "The steps show the declared manifest."),
								" ",
								"{{nonce}}",
								" ",
								i("reste un modèle ; aucune valeur privée observée n’est récupérée.", "remains a template; no observed private value is retrieved.")
							] }),
							/* @__PURE__ */ (0, k.jsxs)("fieldset", { children: [
								/* @__PURE__ */ (0, k.jsx)("legend", { children: "Conclusion" }),
								/* @__PURE__ */ (0, k.jsx)("p", { children: i("Une couverture suffisante nécessite un reçu réussi et uniquement des scénarios éligibles.", "Sufficient coverage requires a successful receipt and only eligible scenarios.") }),
								Object.entries(M(a)).map(([e, t]) => /* @__PURE__ */ (0, k.jsxs)("label", { children: [/* @__PURE__ */ (0, k.jsx)("input", {
									type: "radio",
									name: "coverage-conclusion",
									value: e,
									checked: c.conclusion === e,
									disabled: e === "sufficient" && !u,
									onChange: () => o.setDraft({
										...c,
										conclusion: e
									})
								}), t] }, e))
							] }),
							/* @__PURE__ */ (0, k.jsxs)("label", { children: [i("Périmètre de cette appréciation", "Scope of this assessment"), /* @__PURE__ */ (0, k.jsx)("textarea", {
								required: !0,
								maxLength: 2e3,
								value: c.scope,
								onChange: (e) => o.setDraft({
									...c,
									scope: e.target.value
								})
							})] }),
							/* @__PURE__ */ (0, k.jsxs)("label", { children: [i("Justification", "Reason"), /* @__PURE__ */ (0, k.jsx)("textarea", {
								required: !0,
								maxLength: 4e3,
								value: c.reason,
								onChange: (e) => o.setDraft({
									...c,
									reason: e.target.value
								})
							})] }),
							/* @__PURE__ */ (0, k.jsx)("button", {
								type: "submit",
								disabled: o.needsRead || !N(s, c),
								children: i("Enregistrer l’appréciation", "Save assessment")
							})
						]
					})
				}),
				d,
				/* @__PURE__ */ (0, k.jsxs)("details", {
					className: "quality-limits",
					open: !0,
					children: [/* @__PURE__ */ (0, k.jsx)("summary", { children: i("Limites de cet examen", "Limitations of this review") }), /* @__PURE__ */ (0, k.jsx)("ul", { children: s.limits.map((e) => /* @__PURE__ */ (0, k.jsx)("li", { children: e }, e)) })]
				})
			] }) : null
		] }) : /* @__PURE__ */ (0, k.jsx)("button", {
			type: "button",
			onClick: () => void o.read(),
			children: i("Examiner la couverture métier", "Review business coverage")
		})
	});
}
//#endregion
//#region studio-ui/src/features/quality/components/QualityDetail.tsx
function K({ check: e, revisionId: t }) {
	let { t: r, locale: i } = n(), a = e.evidence;
	return /* @__PURE__ */ (0, k.jsxs)("dl", {
		className: "quality-metadata",
		children: [
			/* @__PURE__ */ (0, k.jsxs)("div", { children: [/* @__PURE__ */ (0, k.jsx)("dt", { children: a ? r("Version contrôlée", "Checked version") : r("Version à contrôler", "Version to check") }), /* @__PURE__ */ (0, k.jsxs)("dd", { children: [
				S(a?.revisionId ?? t),
				" ·",
				" ",
				y(i)[e.freshness]
			] })] }),
			/* @__PURE__ */ (0, k.jsxs)("div", { children: [/* @__PURE__ */ (0, k.jsx)("dt", { children: r("Dernière exécution", "Last execution") }), /* @__PURE__ */ (0, k.jsxs)("dd", { children: [
				w(a?.finishedAt, i),
				" · ",
				C(a?.durationMs, i)
			] })] }),
			/* @__PURE__ */ (0, k.jsxs)("div", { children: [/* @__PURE__ */ (0, k.jsx)("dt", { children: r("Environnement", "Environment") }), /* @__PURE__ */ (0, k.jsx)("dd", { children: a?.environment ?? r("Aucune exécution", "No execution") })] }),
			a?.provider ? /* @__PURE__ */ (0, k.jsxs)("div", { children: [/* @__PURE__ */ (0, k.jsx)("dt", { children: r("Provenance du rapport", "Report provenance") }), /* @__PURE__ */ (0, k.jsxs)("dd", { children: [
				a.tool,
				" ",
				a.toolVersion,
				" · ",
				a.source?.kind,
				" ",
				r("· connexion", "· connection"),
				" ",
				a.provider.connectionId,
				r(". Rapport reçu de l’agent hôte.", ". Report received from the host agent.")
			] })] }) : null,
			a?.metrics ? Object.entries(a.metrics).map(([e, t]) => /* @__PURE__ */ (0, k.jsxs)("div", { children: [/* @__PURE__ */ (0, k.jsx)("dt", { children: e }), /* @__PURE__ */ (0, k.jsx)("dd", { children: t })] }, e)) : null,
			a?.fingerprint ? /* @__PURE__ */ (0, k.jsxs)("div", { children: [/* @__PURE__ */ (0, k.jsx)("dt", { children: r("Empreinte du périmètre", "Scope fingerprint") }), /* @__PURE__ */ (0, k.jsx)("dd", {
				title: a.fingerprint,
				children: a.fingerprint.slice(0, 16)
			})] }) : null
		]
	});
}
var q = (e = "en") => ({
	"not-run": a("Non exécuté", "Not run", void 0, e),
	running: a("En cours", "Running", void 0, e),
	passed: a("Satisfait", "Satisfied", void 0, e),
	failed: a("En échec", "Failed", void 0, e),
	blocked: a("Bloqué", "Blocked", void 0, e)
}), J = (e = "en") => ({
	expectText: a("Texte attendu", "Expected text", void 0, e),
	expectValue: a("Valeur attendue", "Expected value", void 0, e),
	expectVisible: a("Visibilité attendue", "Expected visibility", void 0, e),
	expectData: a("Données attendues", "Expected data", void 0, e)
});
function Y({ receipt: e }) {
	let { t, locale: r } = n();
	return /* @__PURE__ */ (0, k.jsxs)("details", {
		className: "quality-limits quality-browser-receipt",
		open: !0,
		children: [
			/* @__PURE__ */ (0, k.jsx)("summary", { children: t("Scénarios exécutés dans le navigateur", "Scenarios executed in the browser") }),
			/* @__PURE__ */ (0, k.jsxs)("p", { children: [
				e.channel === "chrome" ? "Chrome" : "Edge",
				" ",
				t("· navigateur", "· browser"),
				" ",
				e.browserVersion ?? t("version non recueillie", "version not captured"),
				" ",
				t("· pilote", "· driver"),
				" ",
				e.driverVersion ?? t("version non recueillie", "version not captured"),
				" ",
				t("· protocole", "· protocol"),
				" ",
				e.protocol
			] }),
			/* @__PURE__ */ (0, k.jsx)("p", { children: t("Le résultat porte uniquement sur les assertions des scénarios déclarés. Les critères associés ne sont pas validés automatiquement ; cette liste ne démontre pas une couverture complète du besoin.", "The result covers only assertions in declared scenarios. Associated criteria are not automatically validated; this list does not demonstrate complete coverage of the need.") }),
			e.scenarios.length ? e.scenarios.map((e) => /* @__PURE__ */ (0, k.jsxs)("article", { children: [
				/* @__PURE__ */ (0, k.jsxs)("h4", { children: [
					e.title,
					" · ",
					q(r)[e.status]
				] }),
				/* @__PURE__ */ (0, k.jsxs)("p", { children: [
					t("Scénario", "Scenario"),
					" ",
					e.id,
					" · ",
					e.executedSteps,
					" ",
					t("étape(s) exécutée(s).", "step(s) executed.")
				] }),
				/* @__PURE__ */ (0, k.jsxs)("p", { children: [
					t("Critères déclarés, non validés :", "Declared criteria, not validated:"),
					" ",
					e.criterionIds.length ? e.criterionIds.join(", ") : t("aucun", "none"),
					"."
				] }),
				e.assertions.length ? /* @__PURE__ */ (0, k.jsx)("ul", { children: e.assertions.map((e) => /* @__PURE__ */ (0, k.jsxs)("li", { children: [
					t("Étape", "Step"),
					" ",
					e.step,
					" ·",
					" ",
					J(r)[e.action],
					" ·",
					" ",
					q(r)[e.status]
				] }, e.step)) }) : /* @__PURE__ */ (0, k.jsx)("p", { children: t("Aucune assertion exécutée dans ce scénario.", "No assertion executed in this scenario.") })
			] }, e.id)) : /* @__PURE__ */ (0, k.jsx)("p", { children: t("Aucun scénario exécuté.", "No scenario executed.") }),
			/* @__PURE__ */ (0, k.jsx)("p", { children: t("Les valeurs privées attendues et observées ne sont pas conservées dans ce reçu. Les constats disponibles figurent dans le résultat et les diagnostics du contrôle.", "Private expected and observed values are not retained in this receipt. Available findings appear in the check result and diagnostics.") }),
			e.manifestFingerprint || e.sourceFingerprint ? /* @__PURE__ */ (0, k.jsxs)("details", { children: [/* @__PURE__ */ (0, k.jsx)("summary", { children: t("Empreintes du reçu navigateur", "Browser receipt fingerprints") }), /* @__PURE__ */ (0, k.jsxs)("dl", {
				className: "quality-metadata",
				children: [e.manifestFingerprint ? /* @__PURE__ */ (0, k.jsxs)("div", { children: [/* @__PURE__ */ (0, k.jsx)("dt", { children: t("Scénarios déclarés", "Declared scenarios") }), /* @__PURE__ */ (0, k.jsx)("dd", { children: e.manifestFingerprint })] }) : null, e.sourceFingerprint ? /* @__PURE__ */ (0, k.jsxs)("div", { children: [/* @__PURE__ */ (0, k.jsx)("dt", { children: t("Sources contrôlées", "Checked sources") }), /* @__PURE__ */ (0, k.jsx)("dd", { children: e.sourceFingerprint })] }) : null]
			})] }) : null
		]
	});
}
function X({ check: e, runningId: t, onRun: r }) {
	let { t: i } = n(), a = e.evidence, o = t === e.id;
	return /* @__PURE__ */ (0, k.jsx)("div", {
		className: "quality-detail-actions",
		children: e.canRun ? /* @__PURE__ */ (0, k.jsxs)("button", {
			type: "button",
			className: "quality-primary",
			disabled: t !== null,
			onClick: () => r(e.id),
			children: [
				o ? i("Contrôle en cours…", "Check running…") : a ? i("Relancer ce contrôle", "Run this check again") : i("Exécuter ce contrôle", "Run this check"),
				" ",
				/* @__PURE__ */ (0, k.jsx)("span", {
					"aria-hidden": "true",
					children: "→"
				})
			]
		}) : a ? /* @__PURE__ */ (0, k.jsx)("p", {
			className: "quality-unavailable",
			children: e.reason ?? i("Cette preuve historique est consultable ; elle ne lance pas de commande.", "This historical evidence can be viewed; it does not launch a command.")
		}) : null
	});
}
function Z({ check: e, detailRef: t, report: r, runningId: i, onRun: a, onOpenSource: o, onPrepareRequest: s, onOpenConnectors: c, onCoverageReviewed: l }) {
	let { t: u, locale: d } = n(), f = e.evidence;
	return /* @__PURE__ */ (0, k.jsxs)("section", {
		ref: t,
		tabIndex: -1,
		className: `quality-detail quality-detail-${e.status}`,
		"aria-labelledby": "quality-detail-heading",
		children: [
			/* @__PURE__ */ (0, k.jsxs)("header", { children: [/* @__PURE__ */ (0, k.jsx)("span", {
				className: `quality-status quality-status-${e.freshness === "current" ? e.status : "blocked"}`,
				children: g(d)[_(e)]
			}), /* @__PURE__ */ (0, k.jsx)("h3", {
				id: "quality-detail-heading",
				children: e.title
			})] }),
			/* @__PURE__ */ (0, k.jsxs)("div", {
				className: "quality-expectation",
				children: [/* @__PURE__ */ (0, k.jsx)("strong", { children: u("Attendu", "Expected") }), /* @__PURE__ */ (0, k.jsx)("p", { children: f?.expected ?? e.objective })]
			}),
			/* @__PURE__ */ (0, k.jsxs)("div", {
				className: "quality-observation",
				children: [/* @__PURE__ */ (0, k.jsx)("strong", { children: f ? u("Observé", "Observed") : u("État du contrôle", "Check status") }), /* @__PURE__ */ (0, k.jsx)("p", { children: f?.observed || e.reason || u("Ce contrôle n’a pas encore été exécuté.", "This check has not run yet.") })]
			}),
			/* @__PURE__ */ (0, k.jsx)(K, {
				check: e,
				revisionId: r.revisionId
			}),
			f?.browser ? /* @__PURE__ */ (0, k.jsx)(Y, { receipt: f.browser }) : null,
			f?.findings.length ? /* @__PURE__ */ (0, k.jsx)("ul", {
				className: "quality-findings",
				children: f.findings.map((e, t) => /* @__PURE__ */ (0, k.jsxs)("li", { children: [e.source ? /* @__PURE__ */ (0, k.jsxs)("button", {
					type: "button",
					onClick: () => o(e.source.path, e.source.line, f.revisionId),
					children: [
						e.source.path,
						e.source.line ? `:${e.source.line}` : "",
						" ↗"
					]
				}) : /* @__PURE__ */ (0, k.jsx)("span", { children: e.target || u("Constat sans fichier associé", "Finding without an associated file") }), /* @__PURE__ */ (0, k.jsx)("p", { children: e.message })] }, `${e.source?.path || e.target || "diagnostic"}:${t}`))
			}) : null,
			e.id === "business-browser" && f ? /* @__PURE__ */ (0, k.jsx)(G, {
				revisionId: f.revisionId,
				receiptId: f.id,
				onSaved: () => l?.()
			}, `${f.revisionId}:${f.id}`) : null,
			/* @__PURE__ */ (0, k.jsx)(X, {
				check: e,
				runningId: i,
				onRun: a
			}),
			e.execution === "external" && c ? /* @__PURE__ */ (0, k.jsx)("button", {
				type: "button",
				onClick: () => c(e.id),
				children: u("Choisir un outil ou un connecteur →", "Choose a tool or connector →")
			}) : null,
			s && (e.status === "failed" || e.status === "blocked") ? /* @__PURE__ */ (0, k.jsxs)("div", {
				className: "quality-next-step",
				children: [/* @__PURE__ */ (0, k.jsx)("button", {
					type: "button",
					"data-quality-prepare": "",
					disabled: i !== null,
					onClick: () => s(j(e, r, d)),
					children: _(e) === "configure" ? u("Préparer le raccordement de ce contrôle", "Prepare this check’s integration") : u("Préparer une correction", "Prepare a correction")
				}), /* @__PURE__ */ (0, k.jsx)("p", { children: u("Prépare une demande DevMethod avec la version et les constats. Vous pourrez la compléter avant de l’envoyer.", "Prepares a DevMethod request with the version and findings. You can edit it before sending.") })]
			}) : null,
			e.nextAction ? /* @__PURE__ */ (0, k.jsxs)("div", {
				className: "quality-procedure",
				children: [
					/* @__PURE__ */ (0, k.jsx)("strong", { children: u("Pour l’exécuter", "To run it") }),
					/* @__PURE__ */ (0, k.jsx)("p", { children: e.nextAction }),
					/* @__PURE__ */ (0, k.jsxs)("p", { children: [
						u("Version à joindre à la preuve :", "Version to attach to the evidence:"),
						" ",
						S(r.revisionId),
						u(". Le Studio ne déduit aucun résultat de cette procédure.", ". Studio does not infer any result from this procedure.")
					] })
				]
			}) : null,
			f?.limits.length ? /* @__PURE__ */ (0, k.jsxs)("details", {
				className: "quality-limits",
				children: [/* @__PURE__ */ (0, k.jsx)("summary", { children: u("Portée et limites du contrôle", "Check scope and limitations") }), /* @__PURE__ */ (0, k.jsx)("ul", { children: f.limits.map((e) => /* @__PURE__ */ (0, k.jsx)("li", { children: e }, e)) })]
			}) : null
		]
	});
}
//#endregion
//#region studio-ui/src/features/quality/components/QualityTrace.tsx
function Q({ report: e, onOpenSource: t }) {
	let { t: r } = n(), [i, a] = (0, c.useState)(""), o = e.flowModel, s = o?.flows.find((e) => e.id === i) ?? o?.flows[0];
	return !s || !o ? /* @__PURE__ */ (0, k.jsx)("p", {
		className: "quality-empty",
		children: r("Aucun parcours de code associé à cette version. Aucune trace applicative n’a été enregistrée par ces contrôles.", "No code flow associated with this version. No application trace was recorded by these checks.")
	}) : /* @__PURE__ */ (0, k.jsxs)(k.Fragment, { children: [
		/* @__PURE__ */ (0, k.jsxs)("label", {
			className: "quality-select-label",
			children: [r("Parcours déduit du code", "Flow inferred from code"), /* @__PURE__ */ (0, k.jsx)("select", {
				value: s.id,
				onChange: (e) => a(e.target.value),
				children: o.flows.map((e) => /* @__PURE__ */ (0, k.jsx)("option", {
					value: e.id,
					children: e.title
				}, e.id))
			})]
		}),
		/* @__PURE__ */ (0, k.jsxs)("p", {
			className: "quality-note",
			children: [
				r("Lecture statique de la version", "Static reading of version"),
				" ",
				S(e.revisionId),
				r(". Ce parcours n’est pas une trace d’exécution, ni nécessairement la cause du résultat sélectionné.", ". This flow is not an execution trace or necessarily the cause of the selected result.")
			]
		}),
		/* @__PURE__ */ (0, k.jsx)("ol", {
			className: "quality-flow",
			children: s.elementIds.map((n) => {
				let i = o.elements.find((e) => e.id === n), a = i?.sources[0];
				return /* @__PURE__ */ (0, k.jsxs)("li", { children: [/* @__PURE__ */ (0, k.jsx)("span", {
					className: "quality-flow-node",
					children: i?.label ?? n
				}), a ? /* @__PURE__ */ (0, k.jsx)("button", {
					type: "button",
					onClick: () => t(a.path, a.line, e.revisionId),
					children: r("Voir la source ↗", "View source ↗")
				}) : null] }, n);
			})
		}),
		s.limits.length ? /* @__PURE__ */ (0, k.jsxs)("details", { children: [/* @__PURE__ */ (0, k.jsx)("summary", { children: r("Limites de cette déduction", "Limitations of this inference") }), /* @__PURE__ */ (0, k.jsx)("ul", { children: s.limits.map((e) => /* @__PURE__ */ (0, k.jsx)("li", { children: e }, e)) })] }) : null
	] });
}
function ee({ check: e, report: t, onOpenSource: r }) {
	let { t: i, locale: a } = n(), o = e.evidence?.events ?? [], s = !e.evidence || e.evidence.revisionId === t.revisionId;
	return /* @__PURE__ */ (0, k.jsxs)("section", {
		className: "quality-trace",
		"aria-labelledby": "quality-trace-heading",
		children: [/* @__PURE__ */ (0, k.jsx)("h3", {
			id: "quality-trace-heading",
			children: o.length ? i("Journal du contrôle", "Check log") : i("Parcours du projet", "Project flow")
		}), o.length ? /* @__PURE__ */ (0, k.jsxs)(k.Fragment, { children: [
			/* @__PURE__ */ (0, k.jsx)("p", {
				className: "quality-note",
				children: e.evidence?.provider ? i("Événements du rapport transmis par l’agent hôte. La réception du rapport ne constitue pas une vérification indépendante de son contenu.", "Report events supplied by the host agent. Receiving the report is not independent verification of its contents.") : i("Événements réellement enregistrés par l’analyseur. Aucune exécution métier n’est déduite.", "Events actually recorded by the analyzer. No business execution is inferred.")
			}),
			/* @__PURE__ */ (0, k.jsx)("ol", {
				className: "quality-run-events",
				children: o.map((e, t) => /* @__PURE__ */ (0, k.jsxs)("li", { children: [/* @__PURE__ */ (0, k.jsx)("time", {
					dateTime: e.at,
					children: w(e.at, a)
				}), /* @__PURE__ */ (0, k.jsx)("span", { children: e.label })] }, `${e.at}:${t}`))
			}),
			/* @__PURE__ */ (0, k.jsxs)("details", {
				className: "quality-code-flow",
				children: [/* @__PURE__ */ (0, k.jsx)("summary", { children: i("Consulter aussi les parcours déduits du code", "Also inspect flows inferred from code") }), s ? /* @__PURE__ */ (0, k.jsx)(Q, {
					report: t,
					onOpenSource: r
				}) : /* @__PURE__ */ (0, k.jsx)("p", { children: i("Cette preuve appartient à une autre version. Sélectionnez sa version dans l’historique pour consulter ses parcours.", "This evidence belongs to another version. Select its version in history to inspect its flows.") })]
			})
		] }) : s ? /* @__PURE__ */ (0, k.jsx)(Q, {
			report: t,
			onOpenSource: r
		}) : /* @__PURE__ */ (0, k.jsx)("p", { children: i("Cette preuve appartient à une autre version. Les parcours de la version affichée ne lui sont pas attribués.", "This evidence belongs to another version. Flows from the displayed version are not attributed to it.") })]
	});
}
//#endregion
//#region studio-ui/src/features/quality/components/QualityBatch.tsx
function te({ batch: e, onStop: t }) {
	let { t: r } = n(), i = {
		complete: r("Terminés", "Completed"),
		stopped: r("Série interrompue", "Batch interrupted"),
		running: r("Contrôles en cours", "Checks running")
	}[e.state];
	return /* @__PURE__ */ (0, k.jsxs)("div", {
		className: "quality-batch",
		role: "status",
		"aria-live": "polite",
		children: [
			/* @__PURE__ */ (0, k.jsxs)("span", { children: [
				i,
				" : ",
				e.completed,
				" / ",
				e.total,
				" ",
				r("réponses reçues · version", "responses received · version"),
				" ",
				S(e.revisionId),
				"."
			] }),
			/* @__PURE__ */ (0, k.jsx)("progress", {
				value: e.completed,
				max: e.total,
				"aria-label": r("Contrôles terminés", "Checks completed")
			}),
			e.state === "running" ? /* @__PURE__ */ (0, k.jsx)("button", {
				type: "button",
				onClick: t,
				disabled: e.stopping,
				children: e.stopping ? r("Arrêt après le contrôle en cours…", "Stopping after the current check…") : r("Arrêter après ce contrôle", "Stop after this check")
			}) : null,
			/* @__PURE__ */ (0, k.jsx)("small", { children: r("Seuls les contrôles raccordés sont exécutés. Les résultats détaillés restent propres à chaque contrôle.", "Only connected checks are executed. Detailed results remain specific to each check.") })
		]
	});
}
//#endregion
//#region studio-ui/src/features/quality/hooks/useBrowserConfiguration.ts
async function $(e, t, n = "en") {
	let r = await fetch("/api/project/browser" + (t ? "/configure" : ""), {
		signal: e,
		credentials: "same-origin",
		cache: "no-store",
		...t ? {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(t)
		} : {}
	}), i = await r.json();
	if (!r.ok) throw Error(i.error || a("Réglage navigateur indisponible.", "Browser settings unavailable.", void 0, n));
	if (!Number.isInteger(i.version) || typeof i.enabled != "boolean" || i.automatic !== void 0 && typeof i.automatic != "boolean" || !["chrome", "msedge"].includes(i.channel)) throw Error(a("Configuration navigateur invalide.", "Invalid browser configuration.", void 0, n));
	return {
		...i,
		automatic: i.automatic === !0 && i.enabled
	};
}
function ne() {
	let { locale: e } = n(), [t, r] = (0, c.useState)(null), [i, a] = (0, c.useState)({
		enabled: !1,
		automatic: !1,
		channel: "chrome"
	}), [o, s] = (0, c.useState)(!1), [l, u] = (0, c.useState)(""), [d, f] = (0, c.useState)(""), [p, m] = (0, c.useState)(!1), g = (0, c.useRef)(null), _ = (0, c.useRef)(!1), v = (0, c.useCallback)(async () => {
		if (g.current) return;
		let e = new AbortController();
		g.current = e, s(!0), u("");
		try {
			let t = await $(e.signal, void 0, "fr");
			if (e.signal.aborted) return;
			r(t), _.current ? f("Configuration relue. Vos choix sont conservés ; examinez-les avant d’enregistrer.") : a({
				enabled: t.enabled,
				channel: t.channel,
				automatic: t.automatic
			}), _.current = !0, m(!1);
		} catch (t) {
			e.signal.aborted || u(t instanceof Error ? t.message : "Lecture impossible.");
		} finally {
			e.signal.aborted || (g.current = null, s(!1));
		}
	}, []);
	(0, c.useEffect)(() => (v(), () => {
		g.current?.abort(), g.current = null;
	}), [v]);
	async function y(e) {
		if (g.current || !t || p) return;
		let n = new AbortController();
		g.current = n, s(!0), u(""), f("");
		try {
			let o = await $(n.signal, {
				version: t.version,
				...i
			}, "fr");
			if (n.signal.aborted) return;
			r(o), a({
				enabled: o.enabled,
				channel: o.channel,
				automatic: o.automatic
			}), f(o.automatic ? "Réglage enregistré. Aucun navigateur lancé maintenant. Les prochains candidats de l’agent pourront être vérifiés automatiquement." : "Réglage enregistré. Aucun navigateur lancé. Utilisez Exécuter dans le contrôle navigateur."), e();
		} catch (e) {
			n.signal.aborted || (m(!0), u((e instanceof Error ? e.message : "Enregistrement impossible.") + " Vos choix sont conservés. Relisez la configuration avant de réessayer."));
		} finally {
			n.signal.aborted || (g.current = null, s(!1));
		}
	}
	return {
		configuration: t,
		draft: i,
		setDraft: a,
		busy: o,
		error: h(l, e),
		message: h(d, e),
		needsRead: p,
		read: v,
		save: y
	};
}
//#endregion
//#region studio-ui/src/features/quality/components/BrowserConfiguration.tsx
function re(e, t) {
	return e.driverAvailable ? a("disponible", "available", void 0, t) + (e.driverVersion ? ` · ${e.driverVersion}` : "") : a("indisponible", "unavailable", void 0, t);
}
function ie({ onSaved: e }) {
	let { t, locale: r } = n(), i = ne();
	return /* @__PURE__ */ (0, k.jsxs)("section", {
		className: "quality-workspace quality-browser",
		"aria-label": t("Réglage navigateur", "Browser settings"),
		children: [
			/* @__PURE__ */ (0, k.jsx)("h3", { children: t("Contrôle navigateur optionnel", "Optional browser check") }),
			/* @__PURE__ */ (0, k.jsx)("p", { children: t("Utilise une copie du candidat avec des données vides et Chrome ou Edge déjà installé. Aucun téléchargement. Enregistrer ne lance pas le navigateur.", "Uses a copy of the candidate with empty data and an existing Chrome or Edge installation. No download. Saving does not launch the browser.") }),
			i.configuration ? /* @__PURE__ */ (0, k.jsxs)("p", { children: [
				t("Configuration enregistrée :", "Saved configuration:"),
				" ",
				i.configuration.enabled ? t("activée", "enabled") : t("désactivée", "disabled"),
				" ·",
				" ",
				i.configuration.channel === "chrome" ? "Chrome" : "Edge",
				".",
				" ",
				h(i.configuration.reason, r),
				" ",
				t("Pilote", "Driver"),
				" ",
				re(i.configuration, r),
				t(". Automatique :", ". Automatic:"),
				" ",
				i.configuration.automatic ? t("autorisé", "allowed") : t("non autorisé", "not allowed"),
				"."
			] }) : /* @__PURE__ */ (0, k.jsx)("p", {
				role: "status",
				children: i.busy ? t("Lecture du réglage navigateur…", "Reading browser settings…") : t("Configuration non chargée.", "Configuration not loaded.")
			}),
			/* @__PURE__ */ (0, k.jsxs)("form", {
				className: "quality-filters",
				onSubmit: (t) => {
					t.preventDefault(), i.save(e);
				},
				children: [
					/* @__PURE__ */ (0, k.jsxs)("label", { children: [
						/* @__PURE__ */ (0, k.jsx)("input", {
							type: "checkbox",
							checked: i.draft.enabled,
							disabled: i.busy || !i.configuration,
							onChange: (e) => i.setDraft({
								...i.draft,
								enabled: e.target.checked,
								automatic: e.target.checked && i.draft.automatic
							})
						}),
						" ",
						t("Activer le contrôle navigateur", "Enable browser check")
					] }),
					/* @__PURE__ */ (0, k.jsxs)("label", { children: [
						/* @__PURE__ */ (0, k.jsx)("input", {
							type: "checkbox",
							checked: i.draft.automatic,
							disabled: i.busy || !i.configuration || !i.draft.enabled,
							onChange: (e) => i.setDraft({
								...i.draft,
								automatic: e.target.checked
							})
						}),
						" ",
						t("Exécuter automatiquement après chaque candidat de l’agent", "Run automatically after each agent candidate")
					] }),
					/* @__PURE__ */ (0, k.jsxs)("label", { children: [
						t("Navigateur installé", "Installed browser"),
						" ",
						/* @__PURE__ */ (0, k.jsxs)("select", {
							value: i.draft.channel,
							disabled: i.busy || !i.configuration,
							onChange: (e) => i.setDraft({
								...i.draft,
								channel: e.target.value
							}),
							children: [/* @__PURE__ */ (0, k.jsx)("option", {
								value: "chrome",
								children: "Chrome"
							}), /* @__PURE__ */ (0, k.jsx)("option", {
								value: "msedge",
								children: "Edge"
							})]
						})
					] }),
					/* @__PURE__ */ (0, k.jsx)("button", {
						type: "submit",
						disabled: i.busy || !i.configuration || i.needsRead,
						children: t("Enregistrer le réglage", "Save settings")
					}),
					/* @__PURE__ */ (0, k.jsx)("button", {
						type: "button",
						disabled: i.busy,
						onClick: () => void i.read(),
						children: t("Relire la configuration", "Reload configuration")
					})
				]
			}),
			/* @__PURE__ */ (0, k.jsx)("p", { children: t("Autorise uniquement les scénarios navigateur locaux des prochains candidats de l’agent. Ne lance pas de demande à l’agent et n’adopte aucune version. Aucun rattrapage automatique des candidats existants.", "Only allows local browser scenarios for future agent candidates. Does not submit an agent request or adopt a version. Existing candidates are not checked retroactively.") }),
			i.error ? /* @__PURE__ */ (0, k.jsx)("p", {
				role: "alert",
				className: "quality-error",
				children: i.error
			}) : null,
			i.message ? /* @__PURE__ */ (0, k.jsx)("p", {
				role: "status",
				children: i.message
			}) : null
		]
	});
}
//#endregion
//#region studio-ui/src/features/quality/components/QualityView.tsx
function ae(e) {
	let { t } = n(), r = O(e);
	return /* @__PURE__ */ (0, k.jsxs)(k.Fragment, { children: [
		/* @__PURE__ */ (0, k.jsx)(ie, { onSaved: r.refresh }),
		e.verification ? /* @__PURE__ */ (0, k.jsxs)("p", {
			role: "status",
			className: "quality-batch",
			children: [
				t("Vérification navigateur du candidat", "Candidate browser verification"),
				" ",
				e.verification.revisionId,
				" ·",
				" ",
				e.verification.status === "running" ? t("en cours", "running") : e.verification.status === "passed" ? t("Assertions satisfaites sur le périmètre déclaré", "Assertions passed within the declared scope") : e.verification.status === "failed" ? t("En échec : consulter les constats", "Failed: inspect findings") : t("Bloquée ou interrompue : aucun succès confirmé", "Blocked or interrupted: no confirmed success"),
				".",
				e.verification.revisionId === e.revisionId ? "" : t(" Ce résultat ne concerne pas la version affichée.", " This result does not concern the displayed version.")
			]
		}) : null,
		/* @__PURE__ */ (0, k.jsx)(oe, {
			options: e,
			quality: r
		})
	] });
}
function oe({ options: e, quality: t }) {
	let { t: r, locale: i } = n(), { report: a, error: o, runningId: s, batch: l, run: u, runAll: d, stopAfterCurrent: f, refresh: p, refreshCoverage: m } = t, h = (0, c.useRef)(null), [_, y] = (0, c.useState)("all"), [C, w] = (0, c.useState)("all"), [T, E] = (0, c.useState)(""), [D, O] = (0, c.useState)(!1);
	if (!e.revisionId) return /* @__PURE__ */ (0, k.jsxs)("section", {
		className: "quality-workspace quality-empty",
		children: [/* @__PURE__ */ (0, k.jsx)("h2", { children: r("Qualité du projet", "Project quality") }), /* @__PURE__ */ (0, k.jsx)("p", { children: r("Créez une version pour relier les contrôles à ses fichiers exacts.", "Create a version to link checks to its exact files.") })]
	});
	if (!a) return /* @__PURE__ */ (0, k.jsxs)("section", {
		className: "quality-workspace",
		children: [
			/* @__PURE__ */ (0, k.jsx)("h2", { children: r("Qualité du projet", "Project quality") }),
			/* @__PURE__ */ (0, k.jsx)("p", {
				role: "status",
				children: o || r("Lecture des contrôles de cette version…", "Loading checks for this version…")
			}),
			o ? /* @__PURE__ */ (0, k.jsx)("button", {
				type: "button",
				onClick: p,
				children: r("Réessayer", "Retry")
			}) : null
		]
	});
	let j = b((D ? a.historical : a.checks).map((e) => e.id === s ? {
		...e,
		status: "running"
	} : e), _, C), M = x(j), N = j.find((e) => e.id === T) ?? j.find((e) => e.status === "failed") ?? j[0];
	return /* @__PURE__ */ (0, k.jsxs)("section", {
		className: "quality-workspace",
		"aria-labelledby": "quality-heading",
		children: [
			/* @__PURE__ */ (0, k.jsxs)("header", {
				className: "quality-heading",
				children: [/* @__PURE__ */ (0, k.jsxs)("div", { children: [/* @__PURE__ */ (0, k.jsx)("h2", {
					id: "quality-heading",
					children: r("Qualité du projet", "Project quality")
				}), /* @__PURE__ */ (0, k.jsxs)("p", { children: [
					r("Résultats liés à la version sélectionnée", "Results linked to the selected version"),
					" ",
					/* @__PURE__ */ (0, k.jsx)("strong", { children: S(a.revisionId) }),
					"."
				] })] }), /* @__PURE__ */ (0, k.jsxs)("div", {
					className: "quality-heading-actions",
					children: [
						e.onOpenConnectors ? /* @__PURE__ */ (0, k.jsx)("button", {
							type: "button",
							onClick: () => e.onOpenConnectors?.(),
							children: r("Outils et connecteurs", "Tools and connectors")
						}) : null,
						/* @__PURE__ */ (0, k.jsxs)("button", {
							type: "button",
							"data-quality-run-all": "",
							onClick: () => void d(),
							disabled: s !== null || !v(a.checks).length,
							children: [
								r("Exécuter les contrôles disponibles (", "Run available checks ("),
								v(a.checks).length,
								")"
							]
						}),
						/* @__PURE__ */ (0, k.jsx)("button", {
							type: "button",
							onClick: p,
							disabled: s !== null,
							children: r("Actualiser", "Refresh")
						})
					]
				})]
			}),
			l ? /* @__PURE__ */ (0, k.jsx)(te, {
				batch: l,
				onStop: f
			}) : null,
			o ? /* @__PURE__ */ (0, k.jsx)("p", {
				role: "alert",
				className: "quality-error",
				children: o
			}) : null,
			a.localChanges ? /* @__PURE__ */ (0, k.jsx)("p", {
				className: "quality-warning",
				role: "status",
				children: r("Sources locales modifiées ou indisponibles : preuves à réévaluer. Aucun nouveau succès ne peut être enregistré.", "Local sources changed or unavailable: evidence needs review. No new success can be recorded.")
			}) : null,
			/* @__PURE__ */ (0, k.jsx)("nav", {
				className: "quality-categories",
				"aria-label": r("Famille de contrôles", "Check category"),
				children: [{
					id: "all",
					label: r("Tous", "All")
				}, ...a.categories].map((e) => /* @__PURE__ */ (0, k.jsx)("button", {
					type: "button",
					"aria-pressed": _ === e.id,
					onClick: () => y(e.id),
					children: e.label
				}, e.id))
			}),
			/* @__PURE__ */ (0, k.jsxs)("div", {
				className: "quality-summary",
				"aria-label": r("Résumé du périmètre filtré", "Filtered scope summary"),
				children: [
					/* @__PURE__ */ (0, k.jsxs)("div", {
						className: "quality-summary-passed",
						children: [
							/* @__PURE__ */ (0, k.jsx)("span", {
								"aria-hidden": "true",
								children: "✓"
							}),
							/* @__PURE__ */ (0, k.jsx)("strong", { children: M.passed }),
							/* @__PURE__ */ (0, k.jsxs)("div", { children: [r("Réussis", "Passed"), /* @__PURE__ */ (0, k.jsx)("small", { children: r("Périmètre de ces contrôles uniquement", "Scope of these checks only") })] })
						]
					}),
					/* @__PURE__ */ (0, k.jsxs)("div", {
						className: "quality-summary-failed",
						children: [
							/* @__PURE__ */ (0, k.jsx)("span", {
								"aria-hidden": "true",
								children: "×"
							}),
							/* @__PURE__ */ (0, k.jsx)("strong", { children: M.failed }),
							/* @__PURE__ */ (0, k.jsxs)("div", { children: [r("En échec", "Failed"), /* @__PURE__ */ (0, k.jsx)("small", { children: r("Résultats à examiner", "Results to inspect") })] })
						]
					}),
					/* @__PURE__ */ (0, k.jsxs)("div", {
						className: "quality-summary-waiting",
						children: [
							/* @__PURE__ */ (0, k.jsx)("span", {
								"aria-hidden": "true",
								children: "◷"
							}),
							/* @__PURE__ */ (0, k.jsx)("strong", { children: M.notrun + M.blocked + M.configure }),
							/* @__PURE__ */ (0, k.jsxs)("div", { children: [r("Sans exécution aboutie", "No completed execution"), /* @__PURE__ */ (0, k.jsxs)("small", { children: [
								M.notrun,
								" ",
								r("non exécuté(s) ·", "not run ·"),
								" ",
								M.configure,
								" ",
								r("à connecter ·", "to connect ·"),
								" ",
								M.blocked,
								" ",
								r("bloqué(s)", "blocked")
							] })] })
						]
					})
				]
			}),
			/* @__PURE__ */ (0, k.jsxs)("div", {
				className: "quality-filters",
				children: [
					/* @__PURE__ */ (0, k.jsxs)("label", { children: [r("Résultat", "Result"), /* @__PURE__ */ (0, k.jsxs)("select", {
						value: C,
						onChange: (e) => w(e.target.value),
						children: [/* @__PURE__ */ (0, k.jsx)("option", {
							value: "all",
							children: r("Tous les résultats", "All results")
						}), Object.entries(g(i)).map(([e, t]) => /* @__PURE__ */ (0, k.jsx)("option", {
							value: e,
							children: t
						}, e))]
					})] }),
					/* @__PURE__ */ (0, k.jsxs)("label", {
						className: "quality-history-toggle",
						children: [
							/* @__PURE__ */ (0, k.jsx)("input", {
								type: "checkbox",
								checked: D,
								onChange: (e) => O(e.target.checked)
							}),
							r("Preuves des autres versions (", "Evidence from other versions ("),
							a.historical.length,
							")"
						]
					}),
					/* @__PURE__ */ (0, k.jsxs)("span", { children: [
						M.total,
						" ",
						r("contrôle(s) ·", "check(s) ·"),
						" ",
						M.notapplicable,
						" ",
						r("non applicable(s) ·", "not applicable ·"),
						" ",
						M.reevaluate,
						" ",
						r("hors preuve actuelle ·", "outside current evidence ·"),
						" ",
						M.running,
						" ",
						r("en cours", "running")
					] })
				]
			}),
			/* @__PURE__ */ (0, k.jsx)(A, {
				checks: j,
				selectedId: N?.id,
				runningId: s,
				categories: a.categories,
				onSelect: (e) => {
					E(e), requestAnimationFrame(() => h.current?.focus());
				}
			}),
			N ? /* @__PURE__ */ (0, k.jsxs)("div", {
				className: "quality-details-grid",
				children: [/* @__PURE__ */ (0, k.jsx)(Z, {
					detailRef: h,
					check: N,
					report: a,
					runningId: s,
					onRun: (e) => void u(e),
					onOpenSource: e.onOpenSource,
					onPrepareRequest: e.onPrepareRequest,
					onOpenConnectors: e.onOpenConnectors,
					onCoverageReviewed: () => {
						m(), e.onStateChanged?.();
					}
				}), /* @__PURE__ */ (0, k.jsx)(ee, {
					check: N,
					report: a,
					onOpenSource: e.onOpenSource
				})]
			}) : null,
			/* @__PURE__ */ (0, k.jsxs)("details", {
				className: "quality-report-limits",
				children: [/* @__PURE__ */ (0, k.jsx)("summary", { children: r("Ce que ces résultats permettent de conclure", "What these results establish") }), /* @__PURE__ */ (0, k.jsx)("ul", { children: a.limits.map((e) => /* @__PURE__ */ (0, k.jsx)("li", { children: e }, e)) })]
			})
		]
	});
}
//#endregion
//#region studio-ui/src/quality-widget.tsx
function se(e, t) {
	i(e.ownerDocument, e.ownerDocument.defaultView ?? void 0);
	let n = (0, l.createRoot)(e), r = !1, a = (e) => {
		r || n.render(/* @__PURE__ */ (0, k.jsx)(ae, { ...e }));
	};
	return a(t), {
		update: a,
		dispose() {
			r || (r = !0, n.unmount());
		}
	};
}
//#endregion
export { se as mountQualityWidget };
