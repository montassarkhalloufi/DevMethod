# Studio dogfooding: the DevMethod website

Date: 17 September 2026. Status: the website has passed the recorded local browser
journey and export/restore checks. The third revision includes a technically working
English film, but the user rejected its robotic narration. A fourth iteration is
replacing that voice. Technical playback success is not editorial acceptance.
The site has not been published.

## Scope and environment

The user requested an English website presenting DevMethod and Studio, together with
a demonstration video. The website brief called for repository-backed content, the
night-blue/violet editorial direction, an interactive method walkthrough, real links,
responsive navigation and a FAQ. It explicitly excluded publishing the domain and
inventing testimonials or performance claims.

The project was created through the real Studio interface, rather than being recorded
after an unrelated implementation:

| Item | Recorded value |
| --- | --- |
| Home used for this project | Local port 4365 |
| Studio project sessions | Local port 58003, then 63824 after the media-serving correction |
| Project | `89997809-8f86-4961-8c38-be3769f3b577` |
| Project name | DevMethod — le site de la méthode |
| First website revision | `08abed28-cf08-48d3-bdaa-3206e805669b` |
| Reviewed website revision | `fbee0dd1-c100-4840-968c-838158cc5ba0` |
| Active revision at the second-review checkpoint | The reviewed website revision |

These ports identify local test sessions, not public services or permanent URLs.
The project lives under the local, untracked
`evaluation-private/devmethod-site-studio/projects/89997809-8f86-4961-8c38-be3769f3b577/`
workspace. Its Studio state retains both revisions and both browser observations.

## A Studio defect found while using Studio

The connector implementation at commit `53b15df` had a recorded full-suite result of
1068 passing tests. Its [delivery evidence](../missions/creation-experience/evidence/connector-permissions/RESULTS.md)
documents the distinction between provider access, guide preparation and tool permissions.

During subsequent use, reopening a guide at its saved verification step displayed
“Vos réponses ont changé” even though the answers had not changed. The preparation
needed to be checked again; the saved answers were still present. The message was
corrected to distinguish preserved answers from an actual edit.

The lead agent reported the new regression failing before the correction and the
six guide UI tests passing afterwards. The regression is named
`reopening the saved verification step preserves answers without claiming they changed`
in the guide UI tests (`tests/studio-connector-guide-ui.test.mjs`, source du dépôt).
The later full-suite log records 1069 passes and zero failures. This is a correction
after the connector commit, not evidence that the earlier 1068-test run covered it.

## A media-serving defect found during video integration

Adding the film exposed a separate Studio defect: `.mp4` and `.vtt` files fell back
to `application/octet-stream`. The correction in
[the shared file helpers](../../scripts/studio/files.mjs) maps them to `video/mp4`
and `text/vtt; charset=utf-8`.

The media regression test (`tests/studio-media-preview.test.mjs`, source du dépôt) starts local
HTTP previews and checks the exact Content-Type headers and response bytes for video
and captions. It covers the live preview and the preview runtime copied into a real
export and restored into a separate directory.

The report author inspected the red log: expected `video/mp4`, received
`application/octet-stream`. After the correction, the combined media/archive run
records 10 passes and zero failures. The video payload in this regression is a small
binary fixture, so these tests establish transport and preservation, not MP4 decoding
or browser playback. A bounded review of the mapping and test found no actionable
regression or security issue.

Local evidence: `/private/tmp/devmethod-media-red.log` and
`/private/tmp/devmethod-media-green.log`.

## First delivery: keep the failure visible

The first website revision was created at 15:57:50 UTC. Its delivery summary recorded
JavaScript syntax validation and 12 focused DOM/source checks, while explicitly
leaving browser checks to follow.

The real browser journey then found issues that those checks had not excluded:

| Finding | Observed evidence | Subsequent correction |
| --- | --- | --- |
| Two public documentation links were broken | Anonymous HTTP checks returned 404 for `docs/STUDIO.md` and `docs/STUDIO-CONNECTORS.md`; eight other unique GitHub URLs returned 200. | Two English documentation pages and a shared stylesheet were bundled with the site. |
| The mobile layout overflowed horizontally | The first preview measured a 388 px client width and 396 px scroll width: 8 px of overflow. | The hero decoration was contained within the layout. Mobile body text was also enlarged. |
| Copying gave no feedback while the clipboard operation remained pending | The interface did not indicate the pending operation. | Immediate progress feedback and a bounded fallback were added. |

The two documentation files existed in the local DevMethod checkout but were absent
from public `main` at the time of the anonymous HTTP audit. The public repository
was accessible, with `main` at `6f31552ac3f68c70ee1caa7b4bffb1181341a336`.
The correction therefore addressed actual unavailable destinations, not a presumed
network failure.

Studio retains failed observation `0ba2345f-9485-4760-8faa-c461d7550d6b`, recorded at
16:02:46 UTC against the first revision. It was not rewritten into a pass.

## Second delivery and real browser checks

The reviewed revision was created at 16:09:16 UTC. Its delivery summary records
JavaScript syntax validation and 14 focused regression checks. It includes the local
`docs/studio.html`, `docs/connectors.html` and `docs/docs.css` pages prepared during
this session.

Those pages describe the current development checkout, use
`node scripts/studio.mjs` commands, and avoid claiming that the latest Studio features
are already available in a published npm release. They distinguish the manual host
bridge from the isolated native runner, and describe GitHub PAT access and the
boundaries of MCP tool policies.

The lead agent recorded the following actual computer-use interactions in the Studio
preview and its standalone local URL:

| Interaction | Recorded result |
| --- | --- |
| Open both local documentation links | Both English pages opened. |
| Use the example library filter | The selected filter displayed two example books. |
| Navigate the method tabs with ArrowRight | Selection moved from 03 Build to 04 Verify. |
| Expand the FAQ | The answer opened. |
| Copy the example prompt | Success feedback appeared. |
| Open the mobile menu and select a destination | The menu closed after selection. |
| Inspect the mobile layout at 390 px | Document client width and scroll width both measured 390 px. |
| Inspect the browser diagnostics | No errors or warnings were recorded during this journey. |

The mobile screenshot was inspected by the lead agent. These are bounded observations
of the tested revision and interactions; they are not a general accessibility audit,
cross-browser certification or proof of all clipboard failure modes.

Passed observation `8b1daf99-4a8f-4e0e-9a6f-329bba6b4ca7` was recorded at 16:13:24 UTC
against the second revision. This report's author independently read both revision
records and both browser check records from the local Studio state; the browser actions above
were performed by the lead agent, not repeated for this report.

Three local controls were also executed through the Studio UI on the second revision.
Their stored results were independently inspected:

| Control | Recorded result and scope |
| --- | --- |
| Source syntax | Passed: one file parsed, zero syntax errors. This does not execute the application or prove semantic typing or behavior. |
| Relative import resolution | Passed: zero relative imports to resolve. Dynamic imports, package resolution and aliases are outside this control. |
| Explicit secret markers | Passed: no matching marker in the formats checked. The bounded detector covers PEM private keys, AWS AKIA identifiers and GitHub prefixes; it does not guarantee the absence of every secret. |

These controls were recorded at 16:13:57 UTC. They complement the browser observation;
they do not replace it.

## Repository checks and evidence boundaries

The following local logs were inspected while writing this report:

| Check | Result | Local log |
| --- | --- | --- |
| Full repository test command after the guide-message fix | 1069 passed, 0 failed | `/private/tmp/devmethod-dogfood-tests.log` |
| Repository lint | Passed, no reported diagnostics | `/private/tmp/devmethod-dogfood-lint.log` |
| Formatting check | All matched files conform | `/private/tmp/devmethod-dogfood-format.log` |

The documentation-link check also passed. The lead agent reported a successful
`npm pack --dry-run --cache /private/tmp/devmethod-npm-cache`; this was a packaging
inspection, not an npm publication.

The earlier 1069-test result predates the MIME correction. The new full-suite log,
`/private/tmp/devmethod-dogfood-final-tests.log`, now records 1070 passes and zero failures;
the report author inspected its completed summary. The new lint log has no reported
diagnostics and the new formatting log reports success, at
`/private/tmp/devmethod-dogfood-final-lint.log` and
`/private/tmp/devmethod-dogfood-final-format.log`.

The connector baseline's 1068-test result and other delivery gates remain documented
in its linked report. The website's 12- and 14-check counts are revision delivery
summaries; they are separate from the full repository suite and the later browser
observations. Temporary log paths are local evidence references, not portable
attachments or public download links.

No real GitHub PAT was supplied or exercised in this session's connector verification.
Protocol fixtures, an empty masked PAT field and guide navigation do not establish a
successful authenticated GitHub connection. The website was not deployed, and these
checks do not establish production hosting, provider authentication or end-user accounts.

## Verified export of the second revision

The lead agent clicked **Exporter** in the real Studio UI and observed the browser's
download event. The downloaded `~/Downloads/devmethod-project.tar` was dated
18:16:47 Europe/Paris and contained 1,018,880 bytes.

It was copied to
`evaluation-private/devmethod-delivery/devmethod-site-reviewed.tar`, then restored
through the CLI into
`evaluation-private/devmethod-delivery/restore-reviewed/`. The restore reported
22 files. The report author independently checked the copied archive's byte size,
its 22 regular-file entries and the presence of the three English documentation assets
under revision `fbee0dd1-c100-4840-968c-838158cc5ba0`.

The restored product was started with `node launch.mjs 4399`. The lead agent opened
the actual page in the browser and opened the English Studio guide there. The restored
directory also contains the connection guide, shared documentation CSS and standalone
launcher. This verifies the export/restore/open path for the reviewed second revision;
it does not verify provider credentials, a deployment or a future revision.

## Third revision: working media, rejected narration

The rendered file is
`evaluation-private/devmethod-media/studio-2026-09-17/final/devmethod-studio.en.mp4`.
Its production record identifies English narration using the Daniel voice. The film is
an edited walkthrough of real static screenshots, with titles and fades, rather than a
continuous screen recording. The product interface visible in those screenshots is French.

The report author inspected the artifact, its provenance and its caption file, and ran
a read-only `ffprobe` inspection:

| Property | Observed value |
| --- | --- |
| Duration | 88.101333 seconds |
| File size | 5,066,442 bytes |
| Video | 1920 × 1080, H.264, 25 frames/second |
| Audio | AAC |
| Captions | 20 cues in `devmethod-studio.en.vtt`; the MP4 also contains a subtitle stream |
| Production provenance | `final/provenance.json` |

The third website revision is `5554190a-1048-43c9-b0b5-bdff378e7d05`.
The lead agent completed the nine focused integration checks, then used the real
browser player: metadata reported 88.101333 seconds, playback advanced past 40
seconds, pause worked, and English captions were visible. The native transcript
opened. At a 390 px browser viewport the Studio preview document measured 356 px
for both client and scroll widths; the video was 316 px wide and was played and
paused again around 55 seconds. The desktop and mobile screenshots were inspected.

A passing browser observation and the three available local Studio controls were
stored against this third revision. Those results concern playback, layout and the
specified interactions; they do not assert that the narration sounds natural.

The actual UI export was copied to
`evaluation-private/devmethod-delivery/devmethod-site-en.tar` and restored into
`evaluation-private/devmethod-delivery/site-en/`: 33 regular files and 6,759,936 bytes
in the archive. MP4, captions and poster hashes matched their source assets. The
restored runtime contained the media MIME mappings, and no runtime credentials,
`.env` or `runtime.json` file was present. The restored page opened locally on port
4400 and loaded the film metadata and English track. The tab was closed before a
second advancing-playback observation there; do not conflate that bounded restored
observation with the longer playback exercised in Studio.

**The user then listened and described the narration as too robotic.** This is an
unsatisfied experience criterion despite the technical passes. The old Daniel film
is retained as a comparison artifact, not presented as the accepted final voice.
A new request was entered through the Studio conversation and claimed as job
`1629bcab-679c-44d2-81d6-aed5f3d994bc` to replace the narration, retime the edit and
captions, and deliver a new version. No video-generation capability native to Studio
is claimed: the host agent uses separate media tools and integrates their output.

## What this exercise established

The workflow retained an initial delivery, a failed browser observation, a correction
request and a second version with a separate passing observation. Real use also exposed
a misleading Studio guide message and missing video/caption MIME mappings, each corrected
with a regression test. The
observed result is a reviewed local website, an exercised correction loop and restored
exports. The third revision demonstrated video playback and export preservation,
then failed the user's perceived-voice-quality criterion. The narration replacement
requires its own evidence and must not inherit editorial approval from passing
transport checks. Publication remains outside the completed evidence.
