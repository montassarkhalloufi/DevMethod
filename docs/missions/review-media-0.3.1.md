# Review documentation and media — 0.3.1

Scope authorized in conversation on 2026-09-13: update GitHub/npm documentation, images and the existing video to demonstrate review and its interface; extend the existing film rather than starting over. Version 0.3.0 was already published and verified, so this is a new patch release.

Outputs: the README, review walkthrough, actual UI screenshots, the packaged fictional JSON/Markdown/HTML example and six review scenes inserted before the existing film's conclusion. CLI runtime behavior and the accepted offline HTML decision are unchanged. The video remains on GitHub; the package distributes the guide, screenshots and example.

Validation: 89 core tests, local Markdown links, generated example equality against its JSON source, full MP4 decode, visual inspection of all added scenes and the retained ending, and actual tarball installation/update smoke. The smoke expectation distinguishes an unchanged upstream skill in 0.3.0→0.3.1 from an upstream/local conflict in 0.2.0→0.3.1; both preserve user content. Exact archive and platform/fullstack results belong to the associated PR/release.

Limits: the added video chapter is a narrated montage of real screenshots with fictional findings, not a continuous recording or a real review of Lisière. Direct file:// reopening remains unverified under the browser tool policy. No independent human audiovisual review is claimed.

Next: await final PR checks, integrate under existing authorization, create the new tag/release, publish the exact verified npm archive and verify registry integrity/readme/resources. npm may require another maintainer authentication. Never replace v0.3.0 or its published tarball.
