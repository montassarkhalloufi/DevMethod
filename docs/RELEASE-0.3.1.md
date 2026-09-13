# DevMethod 0.3.1 — review documentation and film

This patch makes the 0.3 review capability visible in the GitHub/npm README, provides a step-by-step guide with actual interface captures, and distributes the fictional example as JSON, generated Markdown and standalone HTML. CLI behavior and the format-1 contract are unchanged.

The existing Lisière 4K film is extended to approximately **4 min 03 s**. Its original footage, narration and ending are retained; six narrated review-interface scenes are inserted before the ending. The added example is clearly fictional and separate from the Lisière pilot. French subtitles, the preview image and montage provenance are updated. The video is linked from npm and hosted on GitHub, rather than included in the npm tarball.

```sh
npx --yes devmethod-ai@0.3.1 review --demo --output review-demo.html --open
```

[Review guide](REVIEW-GUIDE.md) · [Example](../examples/review/README.md) · [Extended film](media/visual-chain/README.md) · [0.3 functional changes](RELEASE-0.3.0.md)

Validation covers the unchanged CLI test suite, document links, derivation of the example Markdown/HTML, archive resources and preserved installation behavior. Media checks inspect the encoded frames, subtitle timing, duration and audio/video streams. The new chapter is a narrated screenshot montage, not a continuous browser recording or an independently executed review of Lisière. Direct offline browser reopening remains unverified under the tool policy described in the 0.3 review evidence.

GitHub release and npm registry metadata are the publication evidence; see the associated PR for the exact revision, archive integrity and final check results.
