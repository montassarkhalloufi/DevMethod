# ADR 008: Versioned review results and local presentation

Status: accepted through explicit user delegation, 2026-09-13.

The user explicitly requested a versioned validated review record, common derived counters/report/interface, safe local browser consultation from the npm package, legacy Markdown support and the supplied visual direction. The existing kit accepts strict TypeScript, Node.js >=22, no runtime dependencies, offline operation and no automatic migrations.

The implemented shared components are independent of the final opening mode: a pure format-1 model/validator used by Node and the browser, derived Markdown, and an HTML rendering with bundled CSS/program/data. The CLI can generate that required report artifact. It does not execute checks or read arbitrary evidence paths. Explicit reviewed raster data and HTTPS navigation avoid exposing the project filesystem. Text is rendered as text; CSP pins the shipped program. Legacy Markdown stays historical text.

The decision brief was presented in conversation: a self-contained HTML report is portable and offline, requires no service lifecycle and matches existing dependency constraints. A loopback server is an alternative for future live refresh and controlled local-resource access, but adds process, route and filesystem security responsibilities. Recommendation: self-contained HTML for this release, with snapshot freshness and deliberately included evidence; revisit if real usage requires live refresh or local evidence linking. No account, external hosting or dashboard scope is introduced.

The user explicitly delegated this choice in conversation (“je te delegue le choix”), on 2026-09-13. Under that delegation, select the self-contained offline HTML report. `review --output report.html --open` requests opening through the operating system's browser handler, with fixed executable/argument boundaries and no shell. Opening failure preserves the generated report and explains manual recovery. No server is needed. Revisit this decision if live refresh or controlled local evidence access becomes an actual requirement.

Browser verification found and corrected a real focus-loss defect. Direct file:// reopening is blocked by the browser tool's URL policy; that limitation remains recorded, without a workaround or a claim of successful offline-browser reopening. The opening adapter is checked without launching a browser; the remaining offline reopening limitation must stay explicit in release evidence. Publication follows the authorized repository gates.
