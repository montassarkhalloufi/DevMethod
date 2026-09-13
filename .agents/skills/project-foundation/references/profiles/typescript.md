# TypeScript profile

Apply to TypeScript changes. Inspect `package.json`, the actual lockfile, `node --version`, `npm ls typescript` (or the existing package manager equivalent), every extended `tsconfig`, path aliases, package module type and generated-code policy. Never run a floating installer merely to discover a version.

Preserve strictness, ESM/CommonJS conventions, public exported types and package boundaries. Validate untrusted runtime input as `unknown`: an interface or type assertion is not transport validation. Keep identifiers explicit and business constants in their authoritative module. Do not silence new errors through broad `any`, `skipLibCheck` changes, or wholesale configuration migration.

Check emitted import paths, declaration compatibility, target runtime support and null/error paths. Type-only imports do not remove architectural dependency direction. Run the project's existing typecheck/build and focused tests; generated declarations need consumer checks when public contracts change.

Executable example: from `examples/fullstack`, `npm run build:api` and `npm run build:web`. API compilation uses TypeScript 5.9.3 with strict mode. `skipLibCheck` in this small fixture excludes third-party declaration checking; it does not prove those packages are type-correct.

Source: [TypeScript strict configuration](https://www.typescriptlang.org/tsconfig/strict.html), consulted 2026-09-13. Official docs explain the flag; installed compiler and effective configuration determine actual checks.
