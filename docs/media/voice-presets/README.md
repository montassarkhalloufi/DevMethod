# DevMethod English narration

The user approved the first Kokoro `af_heart` sample on **17 September 2026**, then explicitly requested that this voice be reused for future productions. [The preset](devmethod-english.json) preserves that choice: American English, speed **1.0**, Kokoro **82M v1.0**, full precision on CPU. This is synthetic narration, not the voice of a claimed human presenter.

The model and voice are Apache-2.0 licensed. Sources: [official Kokoro.js](https://github.com/hexgrad/kokoro/tree/main/kokoro.js), [original model](https://huggingface.co/hexgrad/Kokoro-82M), and the [ONNX model used by the official JS instructions](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX). The preset pins the ONNX repository revision and SHA-256 hashes of the model, tokenizer files and voice. It contains no credentials or machine-specific project paths.

## Generate in an isolated environment

Use Node.js 24 and npm. Run these commands from the DevMethod repository root. They install no dependencies in the project. The first run downloads the pinned public model (about 326 MB); subsequent runs reuse verified local files. Speech is synthesized locally.

```sh
voice_runtime="$(mktemp -d "${TMPDIR:-/tmp}/devmethod-voice.XXXXXX")"
cp docs/media/voice-presets/generate.mjs "$voice_runtime/generate.mjs"
cp docs/media/voice-presets/devmethod-english.json "$voice_runtime/devmethod-english.json"
npm install --prefix "$voice_runtime" --cache "$voice_runtime/npm-cache" \
  --no-audit --no-fund \
  kokoro-js@1.2.1 @huggingface/transformers@3.8.1 \
  onnxruntime-node@1.21.0 phonemizer@1.2.1
node "$voice_runtime/generate.mjs" /absolute/path/scenes.json /absolute/path/audio-output
```

Keep `voice_runtime` for later use if desired. For a permanent cache, choose a dedicated directory outside the source repository instead of `mktemp`. The generator verifies package versions and asset hashes, rejects mismatched cached weights, and disables implicit model downloads during inference. Native dependency installation may require the host's normal package-install permissions.

Input accepts an array or an object with a `scenes` array. Each scene contains `text`; the legacy Studio media `voice` field is also accepted. Keep each scene to a short paragraph; oversized token sequences fail explicitly rather than silently losing words.

```json
{
  "scenes": [
    { "text": "This is DevMethod Studio: a local workspace for your project." },
    { "text": "Build with your agents, with decisions and evidence you can inspect." }
  ]
}
```

The output contains one native **24 kHz mono PCM float32 WAV** per scene and a manifest with exact input text, voice, speed, file hashes and provenance. Create a short sample first when a new script introduces names or technical terms. The saved voice choice does not claim that every future pronunciation has been reviewed.

## Finish the narration

Preserve float audio through editing: the neural output can have peaks above 0 dBFS. Converting to integer PCM before normalization would clip these samples. Trim only exterior silence (the approved edit uses a -50 dB threshold with a 70 ms margin), preserving natural pauses inside sentences. The original seven raw segments totalled 79.85 seconds; no time stretching was applied.

The montage pads each scene by 150 ms before speech and 350 ms after it, with 650 ms after the last scene. Normalize the **assembled narration**, preferably with FFmpeg's two-pass `loudnorm`, to **-17 LUFS / -1.5 dBTP** before encoding AAC once. Verify actual loudness, full decoding, and absence of clipping on the final media; merely selecting targets does not prove they were reached.

Kokoro's preprocessing already pronounces `DevMethod` as “Dev Method”, and spells `MCP` and `API` as English letter names. No script substitution was used. Kokoro.js does not expose native word timestamps through its public generation API; mark subtitle alignment as estimated when timing it from segments and detected pauses.

Retain the exact narrated text, model/voice hashes, processing parameters and review results with each production. Identify the narration as synthetic and distinguish edited screenshots from a real-time screen recording.
