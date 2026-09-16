# Observed local browser journey — 2026-09-16

Environment: local Chrome controlled through the authorized browser interface, Node 24.18.0/macOS, `http://127.0.0.1:4177`. Real server processes used one dedicated fictional data file; no deployment, accounts or user data. Browser interactions and read-only DOM geometry were observed directly, not simulated by jsdom. The [source/capture hashes](evidence/browser-inputs.json) identify the corrected assets; the baseline is PR #33 `440db432`.

## Before and after

Before correction: choose two garden places, stop the server, attempt reservation, observe `Failed to fetch`, restart with the same data file, then click **Refresh availability**. The selected quantity changed silently from 2 to 1, while the error text still advised retrying the same places. This violated the existing input-preservation/recovery contract; a new procedural instruction was unnecessary.

Two DOM-to-real-HTTP regressions fail on the old code (`1 !== 2`) and pass after correction. The [red log](evidence/selection-red.log) and [final log](evidence/selection-final.log) preserve outcomes. The correction keeps each role's unsubmitted quantity, marks a depleted choice unavailable, disables submission until a valid choice, and replaces stale error text after successful manual refresh. A successful reservation clears only its own choice; the original uncertain-request identity logic remains in place.

Actual browser confirmation on corrected source:

| Journey / state | Observation |
| --- | --- |
| Initial/empty and reservation | Five places initially; reserving two welcome places shows Team complete, disabled submit and a durable reference |
| Browser reload | Same reference and remaining capacity, rather than an empty new event |
| Real server stop/restart | Same welcome reservation remained after exit/relaunch against the same data file |
| Cancellation | Two garden places restored; row explicitly marked Cancelled |
| Refresh with valid choice | Choice of two garden places remains two |
| Competing local browser visitor | One tab chooses three; another reserves one; refresh leaves `3 people — unavailable`, disabled submit and visible explanatory text |
| Keyboard recovery | Choosing two hides the unavailable hint; Tab reaches submit; Return reserves two; focus returns to the status notice |
| Corrected network recovery | Choose two, stop server, refresh fails; restart and refresh succeeds with choice still `2`, `error=false`, four reservation rows preserved |
| Narrow rendered layout | Actual `innerWidth=320`, document `scrollWidth=320`; no horizontal overflow in inspected states; text, controls and cancellation visible |
| Desktop rendered layout | Actual width 1280, document width 1280; two-column roles, hierarchy and reservation list retained |

The browser viewport API uses the selected tab. Dimensions above are the **measured CSS viewport**, not requested outer-window sizes; browser zoom was not changed. Temporary overrides were reset and both test tabs closed. The server is stopped after evidence collection; its test data is retained outside the repository.

[Mobile unavailable state](evidence/mobile-unavailable.jpg) and [desktop reservations](evidence/desktop-reservations.jpg) are actual screenshots, not image generation or visual mockups. The selected option's long label is clipped by the narrow native select; the explanatory text below remains visible and is connected via `aria-describedby`. DOM-to-HTTP tests separately check that relationship and valid-choice recovery.

## Scope and limits

This preserves the demonstration's existing visual direction. There was no new image-design commission; no post-hoc image is presented as the reference for prior implementation. Historical Lisière assets retain their distinct generated-direction/master/prototype history.

The functional browser journey is observed, including failures and correction. Agent visual inspection establishes rendered properties, not target-user comprehension, preference or general aesthetic superiority. No screen reader, cross-browser compatibility campaign, comprehensive CSP audit, power-loss durability or concurrent-file-writer guarantee was performed. Narrow native-select clipping is disclosed; no pixel-perfect claim is made.
