# DevMethod — French demonstration video

[Watch/download the MP4](https://github.com/montassarkhalloufi/DevMethod/raw/refs/heads/main/docs/media/from-zero/devmethod-demo.fr.mp4) · [French subtitles](devmethod-demo.fr.srt) · [Narration and scenes](scenes.json)

A short promotional/explanatory video: product promise, an actual from-zero Clair agent trial, real recorded browser interactions, the separate Lisière visual pilot, verification and a GitHub call to action. The explanatory cards summarize work; they are not a recording of every development step.

The French narration is synthetic system speech (Thomas). No music, testimonials, customer results or comparative savings are invented. App records and generated book covers are fictional. The visible Lisière art-direction board is AI-generated; Clair's interface is implemented HTML/CSS. The source workflow is newer than npm 0.1.0; use the [source guide](../../VISUAL-WORKFLOW.md).

## Reproduce

Requires macOS `say` with Thomas, ffmpeg/ffprobe, Chrome and an installed Playwright module. Start Clair on localhost:8766 using the example README. From the repository root, run `node scripts/media/record-demo.cjs` (set PLAYWRIGHT_MODULE if needed), then `python3 scripts/media/encode-demo.py`. The narration text/timing lives in scenes.json. The recorder saves intermediate clips under /private/tmp/devmethod-video; the encoder writes MP4 and SRT here. Do not reuse old intermediate speech files after editing the narration.

[Desktop capture](https://github.com/montassarkhalloufi/DevMethod/raw/refs/heads/main/docs/media/from-zero/captures/clair-desktop.png) and [mobile capture](https://github.com/montassarkhalloufi/DevMethod/raw/refs/heads/main/docs/media/from-zero/captures/clair-mobile.png) are browser evidence. Tests validate selected behavior, not all accessibility, platforms or deployment conditions. See the [example report](../../../examples/clair-from-zero/README.md).

## Verification record

Final MP4: 1280×720 H.264, AAC narration, French mov_text subtitle track; approximately 70.5 seconds, 2.5 MB. Scene screenshots and an encoded interaction frame were visually inspected. Audio is non-silent (mean -15.7 dB, peak -0.4 dB); no claim of a full human listening review. Six Clair logic/storage tests and the independent browser journey passed. The suite disables animation for evidence screenshots.
