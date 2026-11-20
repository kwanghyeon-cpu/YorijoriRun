// Usage: node design/sounds/synth-sounds.cjs [--dry]
// Synthesizes the game's seven sounds as retro chiptune clips (no samples, so no licenses) and
// writes 16-bit mono 22,050 Hz WAVs to the app (res/raw) and the web build (web/assets/sfx, bgm).
// Each clip's peak matches the Lane Dash sound it replaces, so the in-game balance stays the same.
// --dry writes to a temp folder instead. Tweak a sound by editing its function below and re-running.
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const dry = process.argv.includes('--dry');
const TMP = path.join(os.tmpdir(), 'yorijorirun-synth');
const RATE = 22050;

// ---------- building blocks ----------

const midi = (n) => 440 * 2 ** ((n - 69) / 12);

/** PolyBLEP correction: removes most of the aliasing of a naive square at this low sample rate. */
function blep(t, dt) {
  if (t < dt) { t /= dt; return t + t - t * t - 1; }
  if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1; }
  return 0;
}

/** Band-limited pulse wave; `phase` in cycles (0..1), `duty` the high fraction. */
function pulse(phase, inc, duty) {
  let v = phase < duty ? 1 : -1;
  v += blep(phase, inc);
  v -= blep((phase - duty + 1) % 1, inc);
  return v;
}
const triangle = (phase) => 4 * Math.abs(phase - 0.5) - 1;

let seed = 12345;
/** Deterministic white noise, so every run writes the same files. */
const noise = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x3fffffff - 1; };

/**
 * One voice: `freq(t)` and `amp(t)` are functions of seconds into the note, so slides, vibrato and
 * envelopes are just math. `wave` is 'square' (with `duty`), 'triangle' or 'noise'.
 */
function voice(buf, start, length, { wave, duty = 0.5, freq = () => 0, amp, wrap = false }) {
  const s0 = Math.round(start * RATE);
  const n = Math.round(length * RATE);
  let phase = 0;
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const f = freq(t);
    const inc = f / RATE;
    let v;
    if (wave === 'square') v = pulse(phase, inc, duty);
    else if (wave === 'triangle') v = triangle(phase);
    else { lp += 0.5 * (noise() - lp); v = noise() - lp; } // crude high-pass: brighter, less rumble
    phase = (phase + inc) % 1;
    let j = s0 + i;
    if (wrap) j %= buf.length;
    else if (j >= buf.length) break;
    buf[j] += v * amp(t);
  }
}

/** Attack, then exponential decay to silence by `length`; `hold` keeps it level for a while first. */
const env = (length, { attack = 0.003, hold = 0, curve = 4 } = {}) => (t) => {
  if (t < attack) return t / attack;
  if (t < attack + hold) return 1;
  const d = (t - attack - hold) / Math.max(1e-6, length - attack - hold);
  return d >= 1 ? 0 : Math.exp(-curve * d) * (1 - d);
};

/**
 * Removes the DC offset narrow pulse waves carry (a lopsided wave clicks at its start and end and
 * wastes headroom). For a loop the filter first runs once around the loop, so it is already
 * settled when the kept pass starts and the seam stays clean.
 */
function finish(buf, peak, loop = false) {
  let px = 0, py = 0;
  for (let pass = loop ? 0 : 1; pass < 2; pass++) {
    for (let i = 0; i < buf.length; i++) {
      const x = buf[i];
      const y = x - px + 0.995 * py;
      px = x; py = y;
      if (pass === 1) buf[i] = y;
    }
  }
  let m = 0;
  for (const v of buf) m = Math.max(m, Math.abs(v));
  const g = m ? peak / m : 0;
  for (let i = 0; i < buf.length; i++) buf[i] *= g;
  return buf;
}
const clip = (seconds) => new Float32Array(Math.round(seconds * RATE));

// ---------- the sounds ----------

const SOUNDS = {
  // Lane change: a tiny "tuk" step, a soft swish plus a short rising blip. Plays constantly.
  sfx_lane: { peak: 0.5, web: 'web/assets/sfx', make() {
    const b = clip(0.07);
    voice(b, 0, 0.04, { wave: 'noise', amp: (t) => 0.25 * env(0.04, { curve: 6 })(t) });
    voice(b, 0, 0.06, { wave: 'square', duty: 0.5, freq: (t) => 700 + 6000 * t,
      amp: (t) => 0.5 * env(0.06, { hold: 0.015, curve: 4 })(t) });
    voice(b, 0, 0.06, { wave: 'triangle', freq: (t) => 350 + 3000 * t, amp: (t) => 0.5 * env(0.06, { hold: 0.015, curve: 4 })(t) });
    return b;
  } },

  // Pickup (water bottle; also shield/magnet at a lower pitch): a bright two-note "ppi-rong".
  sfx_coin: { peak: 0.8, web: 'web/assets/sfx', make() {
    const b = clip(0.3);
    const note = (start, len, n) => {
      voice(b, start, len, { wave: 'square', duty: 0.25, freq: () => midi(n), amp: (t) => 0.6 * env(len, { curve: 3 })(t) });
      voice(b, start, len, { wave: 'triangle', freq: () => midi(n - 12), amp: (t) => 0.4 * env(len, { curve: 3 })(t) });
    };
    note(0, 0.07, 88); // E6
    note(0.06, 0.24, 95); // B6
    return b;
  } },

  // Bump: a cartoon "boing" that drops in pitch with a wobble, nothing that sounds like a crash.
  sfx_crash: { peak: 0.85, web: 'web/assets/sfx', make() {
    const len = 0.32;
    const b = clip(len);
    const f = (t) => (430 * Math.exp(-t * 7) + 110) * (1 + 0.08 * Math.sin(2 * Math.PI * 22 * t));
    voice(b, 0, len, { wave: 'triangle', freq: f, amp: (t) => env(len, { curve: 2.5 })(t) });
    voice(b, 0, len, { wave: 'square', duty: 0.5, freq: f, amp: (t) => 0.25 * env(len, { curve: 3.5 })(t) });
    voice(b, 0, 0.03, { wave: 'noise', amp: (t) => 0.35 * env(0.03, { curve: 5 })(t) });
    return b;
  } },

  // Low stamina: two short, slightly urgent "ppi-ppi" beeps.
  sfx_fuel_low: { peak: 0.7, web: 'web/assets/sfx', make() {
    const b = clip(0.36);
    for (const start of [0, 0.17]) {
      voice(b, start, 0.11, { wave: 'square', duty: 0.25, freq: () => midi(84),
        amp: (t) => (t < 0.005 ? t / 0.005 : t > 0.1 ? (0.11 - t) / 0.01 : 1) * 0.8 });
      voice(b, start, 0.11, { wave: 'triangle', freq: () => midi(72),
        amp: (t) => (t < 0.005 ? t / 0.005 : t > 0.1 ? (0.11 - t) / 0.01 : 1) * 0.3 });
    }
    return b;
  } },

  // Out of stamina: a deflating "ppu-u-u" — three falling notes and a long sagging one.
  sfx_gameover: { peak: 0.8, web: 'web/assets/sfx', make() {
    const b = clip(1.0);
    const notes = [[0, 67], [0.14, 64], [0.28, 60]];
    for (const [start, n] of notes) {
      voice(b, start, 0.15, { wave: 'square', duty: 0.5, freq: () => midi(n), amp: (t) => 0.45 * env(0.15, { hold: 0.08, curve: 3 })(t) });
      voice(b, start, 0.15, { wave: 'triangle', freq: () => midi(n - 12), amp: (t) => 0.5 * env(0.15, { hold: 0.08, curve: 3 })(t) });
    }
    const last = (t) => midi(55) * (1 - 0.06 * Math.min(1, t / 0.55)) * (1 + 0.025 * Math.sin(2 * Math.PI * 6 * t));
    voice(b, 0.42, 0.58, { wave: 'square', duty: 0.5, freq: last, amp: (t) => 0.45 * env(0.58, { hold: 0.2, curve: 2 })(t) });
    voice(b, 0.42, 0.58, { wave: 'triangle', freq: (t) => last(t) / 2, amp: (t) => 0.5 * env(0.58, { hold: 0.2, curve: 2 })(t) });
    return b;
  } },

  // New best: a quick rising fanfare that lands on a shimmering high note.
  sfx_newbest: { peak: 0.85, web: 'web/assets/sfx', make() {
    const b = clip(0.8);
    const run = [[0, 72], [0.08, 76], [0.16, 79]];
    for (const [start, n] of run) {
      voice(b, start, 0.1, { wave: 'square', duty: 0.25, freq: () => midi(n), amp: (t) => 0.5 * env(0.1, { hold: 0.05 })(t) });
    }
    const top = (t) => midi(84) * (1 + 0.012 * Math.sin(2 * Math.PI * 7 * t));
    voice(b, 0.24, 0.56, { wave: 'square', duty: 0.25, freq: top, amp: (t) => 0.5 * env(0.56, { hold: 0.18, curve: 2.5 })(t) });
    voice(b, 0.24, 0.56, { wave: 'square', duty: 0.5, freq: (t) => top(t) * 1.5, amp: (t) => 0.18 * env(0.56, { hold: 0.1, curve: 3 })(t) });
    voice(b, 0.24, 0.56, { wave: 'triangle', freq: (t) => top(t) / 2, amp: (t) => 0.4 * env(0.56, { hold: 0.18, curve: 2.5 })(t) });
    return b;
  } },

  // Background loop: 8 bars at 140 BPM in C major (C G Am F | C G F G), square lead, triangle bass,
  // noise drums. Exactly 302,400 samples, and every tail wraps to the start, so it loops seamlessly.
  bgm_loop: { peak: 0.9, web: 'web/assets/bgm', loop: true, make() {
    const eighth = 60 / 140 / 2;
    const bars = 8;
    const b = new Float32Array(Math.round(bars * 8 * eighth * RATE));
    const lead = [
      76, 79, 84, 79, 76, 79, 81, 79, // C
      74, 79, 83, 79, 74, 79, 81, 83, // G
      84, 83, 81, 76, 81, 83, 84, 88, // Am
      86, 84, 81, 77, 81, 84, 86, 84, // F
      88, 86, 84, 79, 76, 79, 84, 86, // C
      83, 79, 74, 79, 83, 86, 83, 79, // G
      81, 84, 89, 84, 81, 77, 81, 84, // F
      83, 86, 91, 86, 83, 81, 79, -1, // G (rest, then back to the top)
    ];
    const roots = [48, 43, 45, 41, 48, 43, 41, 43]; // C3 G2 A2 F2 C3 G2 F2 G2
    for (let i = 0; i < bars * 8; i++) {
      const start = i * eighth;
      const n = lead[i];
      if (n > 0) {
        voice(b, start, eighth * 0.9, { wave: 'square', duty: 0.25, freq: () => midi(n), wrap: true,
          amp: (t) => 0.22 * env(eighth * 0.9, { hold: eighth * 0.4, curve: 2 })(t) });
      }
      const root = roots[Math.floor(i / 8)] + (i % 2 ? 12 : 0);
      voice(b, start, eighth * 0.95, { wave: 'triangle', freq: () => midi(root), wrap: true,
        amp: (t) => 0.32 * env(eighth * 0.95, { hold: eighth * 0.5, curve: 2 })(t) });
      const beat = i % 8;
      if (beat === 0 || beat === 4) { // kick
        voice(b, start, 0.09, { wave: 'triangle', freq: (t) => 50 + 110 * Math.exp(-t * 40), wrap: true,
          amp: (t) => 0.55 * env(0.09, { curve: 3 })(t) });
      } else if (beat === 2 || beat === 6) { // snare
        voice(b, start, 0.09, { wave: 'noise', wrap: true, amp: (t) => 0.22 * env(0.09, { curve: 5 })(t) });
      }
      if (i % 2) voice(b, start, 0.03, { wave: 'noise', wrap: true, amp: (t) => 0.08 * env(0.03, { curve: 6 })(t) }); // hat
    }
    return b;
  } },
};

// ---------- write ----------

function writeWav(file, samples) {
  const b = Buffer.alloc(44 + samples.length * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + samples.length * 2, 4); b.write('WAVE', 8);
  b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(RATE, 24); b.writeUInt32LE(RATE * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write('data', 36); b.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) {
    b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(samples[i] * 32767))), 44 + i * 2);
  }
  fs.writeFileSync(file, b);
}

if (dry) fs.mkdirSync(TMP, { recursive: true });
for (const [name, s] of Object.entries(SOUNDS)) {
  seed = 12345;
  const samples = finish(s.make(), s.peak, s.loop);
  const app = dry ? path.join(TMP, name + '.wav') : path.join(ROOT, 'app/src/main/res/raw', name + '.wav');
  writeWav(app, samples);
  if (!dry) fs.copyFileSync(app, path.join(ROOT, s.web, name + '.wav'));
  console.log(`${name}: ${(samples.length / RATE).toFixed(2)}초, 최대 음량 ${s.peak}`);
}
console.log(dry ? `미리보기: ${TMP}` : '앱(res/raw)과 웹(web/assets)에 넣음');
