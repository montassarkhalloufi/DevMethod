// Copy this file and its JSON preset into an isolated npm directory before use.
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { KokoroTTS } from 'kokoro-js';
import { env } from '@huggingface/transformers';

async function main() {
  const runtime = path.dirname(fileURLToPath(import.meta.url));
  const preset = JSON.parse(await readFile(path.join(runtime, 'devmethod-english.json'), 'utf8'));
  const [input, destination] = process.argv.slice(2);
  if (!input || !destination)
    throw new Error('Usage: node generate.mjs scenes.json output-directory');
  const source = JSON.parse(await readFile(path.resolve(input), 'utf8'));
  const scenes = Array.isArray(source) ? source : source.scenes;
  if (!Array.isArray(scenes) || !scenes.length) throw new Error('Input must contain scenes');
  const texts = scenes.map((scene) => scene.text ?? scene.voice);
  if (texts.some((text) => typeof text !== 'string' || !text.trim())) {
    throw new Error('Each scene needs non-empty text (or the legacy voice narration field)');
  }

  const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
  for (const [name, version] of Object.entries(preset.runtime.packages)) {
    const installed = JSON.parse(
      await readFile(path.join(runtime, 'node_modules', name, 'package.json'), 'utf8'),
    );
    if (installed.version !== version) throw new Error(`Expected ${name}@${version}`);
  }
  const voiceFile = path.join(runtime, 'node_modules/kokoro-js/voices', `${preset.voice.id}.bin`);
  if (digest(await readFile(voiceFile)) !== preset.voice.sha256)
    throw new Error('Voice checksum mismatch');

  const modelDirectory = path.join(runtime, 'models/kokoro-v1.0');
  for (const asset of preset.model.files) {
    const target = path.join(modelDirectory, asset.path);
    let bytes;
    try {
      bytes = await readFile(target);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    if (!bytes) {
      console.log(`Downloading pinned model asset: ${asset.path}`);
      const response = await fetch(asset.url);
      if (!response.ok) throw new Error(`Model download failed: ${response.status}`);
      bytes = Buffer.from(await response.arrayBuffer());
      if (digest(bytes) !== asset.sha256) throw new Error(`Checksum mismatch: ${asset.path}`);
      await mkdir(path.dirname(target), { recursive: true });
      const temporary = `${target}.${process.pid}.partial`;
      try {
        await writeFile(temporary, bytes);
        await rename(temporary, target);
      } finally {
        await rm(temporary, { force: true });
      }
    }
    if (digest(bytes) !== asset.sha256)
      throw new Error(`Cached model checksum mismatch: ${asset.path}`);
  }

  // After explicit, checksum-verified downloads, inference uses only local files.
  env.allowRemoteModels = false;
  const tts = await KokoroTTS.from_pretrained(modelDirectory, {
    dtype: preset.model.precision,
    device: preset.model.device,
  });
  // Reject overlong scenes instead of silently truncating their narration.
  const tokenizer = tts.tokenizer;
  tts.tokenizer = (text, options) => {
    const result = tokenizer(text, { ...options, truncation: false });
    if (result.input_ids.dims[1] > 512)
      throw new Error('Scene too long: split it into shorter paragraphs');
    return result;
  };

  const output = path.resolve(destination);
  await mkdir(output, { recursive: true });
  const manifest = {
    preset: preset.id,
    synthetic: true,
    model: preset.model,
    runtime: preset.runtime,
    license: preset.license,
    processing: {
      input: 'Native PCM float32 WAV; no trimming or normalization applied',
      intended: preset.processing,
    },
    scenes: [],
  };
  for (const [index, text] of texts.entries()) {
    const id = index + 1;
    const audio = await tts.generate(text, { voice: preset.voice.id, speed: preset.voice.speed });
    const audioPath = path.join(output, `${String(id).padStart(2, '0')}-${preset.voice.id}.wav`);
    await audio.save(audioPath);
    manifest.scenes.push({
      id,
      audio: audioPath,
      text,
      voice: preset.voice.id,
      language: 'en',
      speed: preset.voice.speed,
      sha256: digest(await readFile(audioPath)),
    });
    await writeFile(path.join(output, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`Ready: ${audioPath}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
