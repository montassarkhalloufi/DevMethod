# La séance collective

A local research prototype for preparing a fictional film evening, making a scheduling trade-off explicit, and preserving every published programme. Built after the full scenario was revealed: this is neither a blind comparison, a preserved maintenance baseline, nor demonstrated benefit over ordinary development. No agent, provider, network service, or telemetry is connected.

## Run

From the repository root:

```sh
python3 -m http.server 9087 --bind 127.0.0.1 --directory examples/seance
```

Open `http://127.0.0.1:9087`. The source uses ES modules and must be served over HTTP; opening `index.html` directly is not supported. The server only serves files. Drafts and publications stay in the browser's local storage for this origin. Exported HTML programmes are self-contained and work offline.

1. Edit the programme title and reorder, remove or re-add activities. Film and interval durations are fixed; the discussion may last 15 or 10 minutes.
2. Check the calculated times and explicitly publish a first version. No previous publication is fabricated.
3. Activate the guest's 20:05–20:20 call. The existing programme is not rearranged automatically. Publication is blocked until the call fits.
4. Choose one proposed compromise or build a manual arrangement. Review the changes, then publish a new version. Earlier versions remain selectable and unchanged.
5. Export the chosen version as an offline HTML programme, including the volunteer announcements. Sending it is a separate manual action. JSON backup is available; the prototype has no JSON restore interface.

## Behaviour and boundaries

The evening starts at 19:00. The room must be empty by 21:10, including five minutes for departure. An interval lasts ten minutes. Early arrival at the fixed call creates visible waiting time; late arrival blocks publication. Films are never shortened or overlapped to hide a conflict. Keeping F6 as the last film is a preference, not a compulsory rule.

The initial six films total 92 minutes; adding interval and discussion gives an end at 20:57 and an empty room at 21:02. Two authored proposals expose different sacrifices:

- Keep six films, replace the discussion with the call, and reorder: empty room at 21:02.
- Keep a separate 15-minute discussion, remove F4, and wait two minutes before the call: empty room at 21:10.

These are proposals for the known fictional data, not an optimiser or an exhaustive list of possibilities. Applying either requires an explicit click. Manual edits replace the prior compromise note with a reminder to review times and announcements.

`code/domain.js` owns pure scheduling, conflicts, proposals, differences and publication snapshots. `code/render.js` owns escaped HTML views and offline exports. `code/storage.js` owns JSON persistence; malformed stored data blocks opening without replacement, while a failed write leaves a visibly temporary session. `code/app.js` binds user actions and coordinates these modules.

Publications are preserved by the UI and domain operations. This does not protect against manual storage edits, browser data deletion or concurrent tabs. There is no account system, synchronisation, live-event delay handling, editable catalogue or support for multiple evenings. Keep exported copies separately.

## Checks

From the repository root, with development dependencies available:

```sh
node --test tests/seance.test.mjs
```

The ten original functional cases cover timing, both compromises, conflicts, explicit choice, unchanged old publications/HTML, escaping, storage and fixed durations. Additional cases cover invalid activity identifiers, protection of stored data on failed opening, and DOM event bindings through title editing, ordering, publishing, choosing and reopening. DOM tests do not establish actual browser layout, download behaviour, old-phone usability, or human understanding. No generated evidence files are written by this test suite.

This example is an adaptation of an independently authored prototype, not a general replacement for DevMethod. Human usefulness and comparative benefit remain unestablished.
