// Generates the deck's built-in audio assets: short generative ambient loops,
// rendered offline to 22050 Hz mono 16-bit WAV. Replace these files with real
// recordings any time — the deck only cares about the paths in content.js.
// Usage: node scripts/environment/generate-deck-audio.mjs

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SAMPLE_RATE = 22050;
const SECONDS = 24;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../media/music');

const mulberry32 = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const sine = (phase) => Math.sin(phase * Math.PI * 2);

// Crossfade the tail into the head so every file loops without a click.
const makeLoopable = (samples, fadeSeconds = 0.5) => {
  const fade = Math.floor(fadeSeconds * SAMPLE_RATE);
  for (let i = 0; i < fade; i += 1) {
    const mix = i / fade;
    const tail = samples[samples.length - fade + i];
    samples[i] = samples[i] * mix + tail * (1 - mix);
    samples[samples.length - fade + i] = tail * mix + samples[i] * (1 - mix) * 0;
  }
  return samples;
};

const normalize = (samples, peak = 0.7) => {
  const max = samples.reduce((acc, value) => Math.max(acc, Math.abs(value)), 0.0001);
  return samples.map((value) => (value / max) * peak);
};

const render = (seconds, voice) => {
  const total = Math.floor(seconds * SAMPLE_RATE);
  const samples = new Float64Array(total);
  for (let i = 0; i < total; i += 1) samples[i] = voice(i / SAMPLE_RATE);
  return makeLoopable(normalize(Array.from(samples)));
};

// A2/E3 pad with slow tide-like noise swells.
const tideStudy = render(SECONDS, (t) => {
  const pad = sine(110 * t) * 0.5 + sine(165.2 * t) * 0.28 + sine(220.4 * t) * 0.12;
  const breathe = 0.65 + 0.35 * sine(t / 12);
  const wash = (Math.random() * 2 - 1) * 0.05 * Math.max(0, sine(t / 12 + 0.25));
  return pad * breathe + wash;
});

// 60 Hz hum plus sparse pentatonic blips (deterministic).
const blipRandom = mulberry32(2000);
const blips = Array.from({ length: 9 }, (_, index) => ({
  at: 1.2 + blipRandom() * (SECONDS - 3),
  freq: [330, 392, 440, 523, 587][Math.floor(blipRandom() * 5)],
  gain: 0.16 + blipRandom() * 0.1,
  index,
}));
const paperChannels = render(SECONDS, (t) => {
  let sample = sine(60 * t) * 0.06 + sine(120.3 * t) * 0.02;
  for (const blip of blips) {
    const dt = t - blip.at;
    if (dt > 0 && dt < 0.9) {
      sample += sine(blip.freq * dt) * Math.exp(-dt * 7) * blip.gain;
    }
  }
  return sample;
});

// Detuned drone that slowly opens, with a high ping every 6 seconds.
const openHorizon = render(SECONDS, (t) => {
  const open = 0.5 + 0.5 * sine(t / 24 - 0.25);
  const drone = sine(98 * t) * 0.4
    + sine(98.7 * t) * 0.3
    + sine(196.5 * t) * 0.18 * open
    + sine(294 * t) * 0.1 * open;
  const pingPhase = t % 6;
  const ping = sine(880 * pingPhase) * Math.exp(-pingPhase * 4) * 0.12;
  return drone + ping;
});

const toWav = (samples) => {
  const data = Buffer.alloc(44 + samples.length * 2);
  data.write('RIFF', 0);
  data.writeUInt32LE(36 + samples.length * 2, 4);
  data.write('WAVE', 8);
  data.write('fmt ', 12);
  data.writeUInt32LE(16, 16);
  data.writeUInt16LE(1, 20); // PCM
  data.writeUInt16LE(1, 22); // mono
  data.writeUInt32LE(SAMPLE_RATE, 24);
  data.writeUInt32LE(SAMPLE_RATE * 2, 28);
  data.writeUInt16LE(2, 32);
  data.writeUInt16LE(16, 34);
  data.write('data', 36);
  data.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((value, index) => {
    data.writeInt16LE(Math.max(-1, Math.min(1, value)) * 32767, 44 + index * 2);
  });
  return data;
};

await mkdir(ROOT, { recursive: true });
const outputs = {
  'tide-study-0200.wav': tideStudy,
  'paper-channels.wav': paperChannels,
  'open-horizon.wav': openHorizon,
};
for (const [name, samples] of Object.entries(outputs)) {
  const file = join(ROOT, name);
  await writeFile(file, toWav(samples));
  console.log(`${name}: ${samples.length} samples`);
}
