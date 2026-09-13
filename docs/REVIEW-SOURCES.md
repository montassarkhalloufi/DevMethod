# Sources inspected for the review interface

Consulted 2026-09-13. Installed compiler: TypeScript 5.9.3; @types/node 22.20.2 (package-lock.json). Package baseline Node.js >=22, CI Node.js 22; local runtime Node.js 24.18.0. Keep NodeNext/ES2022 and existing strictness; no version migration is required.

| Source | Publisher / provenance | Applicable version and use | Limits |
|---|---|---|---|
| [Node filesystem documentation](https://nodejs.org/download/release/v22.17.0/docs/api/fs.html) | Node.js official site | Node 22 baseline, bounded regular-file reads and exclusive output creation | Path validation remains application responsibility; not a concurrency sandbox |
| [TypeScript 5.9 notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html) | TypeScript official site | Installed 5.9.3; preserve project NodeNext configuration and DOM typing | Newer compiler documentation is not a migration requirement |
| [DOM textContent](https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent) | MDN Web Docs, web-platform documentation | Text rendering of untrusted report content | Setting safe text does not validate navigation destinations |
| [Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) | W3C WAI | Keyboard focus, selection and panel association | Authoring guidance, not proof of an accessibility audit |
| [TypeScript maintainer skills](https://github.com/microsoft/TypeScript-Maintainer-Skills) | Microsoft-owned repository; inspected README and intended scope | Compiler-issue maintenance, not a general application review skill | Discovered, not installed or executed; not adopted for this app |

Searches included Node.js organization skill sources and Microsoft TypeScript maintainer skill sources. No suitable general Node.js/application review skill was verified in this search. That is a bounded search result, not proof no such skill exists. Use relevant official documentation directly. No third-party skill was automatically installed. A reference in an example fixture is labelled unverified unless that example actually records consultation.
