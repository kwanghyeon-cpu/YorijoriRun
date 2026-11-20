// Usage: node design/sounds/make-sounds.cjs [--dry] [--src <folder>]
// Turns downloaded sounds (see README.md) into the game's 16-bit mono WAVs for the app
// (res/raw) and the web build (web/assets/sfx, web/assets/bgm):
//   mono mix -> resample -> trim silence (effects only) -> cap the length with a fade-out
//   -> scale to the peak level the Lane Dash sound in that slot had, so the mix stays balanced.
// WAV (PCM 8/16/24/32-bit or float) is read directly. MP3/OGG/FLAC need ffmpeg on the PATH.
// Only files present in the source folder are processed. --dry writes to a temp folder instead.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const args = process.argv.slice(2);
const dry = args.includes('--dry');
const srcAt = args.indexOf('--src');
const SRC = srcAt >= 0 ? path.resolve(args[srcAt + 1]) : path.join(__dirname, 'originals');
const TMP = path.join(os.tmpdir(), 'yorijorirun-sounds');

// peak: the Lane Dash clip's peak in this slot (its 8-bit square waves sat right at their peak,
// so matching peaks, not RMS, keeps the balance without crushing recorded sounds).
// maxSeconds: longer clips are cut with a fade-out. Effects are trimmed; the loop is not.
const SOUNDS = {
  sfx_lane: { peak: 0.5, maxSeconds: 0.25, rate: 22050, web: 'web/assets/sfx' },
  sfx_coin: { peak: 0.8, maxSeconds: 0.6, rate: 22050, web: 'web/assets/sfx' },
  sfx_crash: { peak: 0.85, maxSeconds: 0.7, rate: 22050, web: 'web/assets/sfx' },
  sfx_fuel_low: { peak: 0.7, maxSeconds: 1.0, rate: 22050, web: 'web/assets/sfx' },
  sfx_gameover: { peak: 0.8, maxSeconds: 2.0, rate: 22050, web: 'web/assets/sfx' },
  sfx_newbest: { peak: 0.85, maxSeconds: 2.0, rate: 22050, web: 'web/assets/sfx' },
  bgm_loop: { peak: 0.9, maxSeconds: 90, rate: 32000, web: 'web/assets/bgm', loop: true },
};
const EXTS = ['.wav', '.mp3', '.ogg', '.flac'];
/** Samples quieter than this (about -48 dBFS) at the ends of an effect count as silence. */
const SILENCE = 0.004;
const FADE_SECONDS = 0.03;

/** Reads a RIFF/WAVE file into { rate, channels: Float32Array[] }. */
function readWav(file) {
  const b = fs.readFileSync(file);
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WAVE') throw new Error('WAV가 아님');
  let fmt = null, data = null;
  for (let o = 12; o + 8 <= b.length;) {
    const id = b.toString('ascii', o, o + 4);
    const size = b.readUInt32LE(o + 4);
    if (id === 'fmt ') {
      let format = b.readUInt16LE(o + 8);
      if (format === 0xfffe) format = b.readUInt16LE(o + 32); // WAVE_FORMAT_EXTENSIBLE: sub-format
      fmt = { format, channels: b.readUInt16LE(o + 10), rate: b.readUInt32LE(o + 12), bits: b.readUInt16LE(o + 22) };
    } else if (id === 'data') data = b.subarray(o + 8, Math.min(b.length, o + 8 + size));
    o += 8 + size + (size & 1);
  }
  if (!fmt || !data) throw new Error('fmt/data 청크가 없음');
  const { format, channels, bits } = fmt;
  const bytes = bits / 8;
  const frames = Math.floor(data.length / (bytes * channels));
  const out = Array.from({ length: channels }, () => new Float32Array(frames));
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < channels; c++) {
      const o = (i * channels + c) * bytes;
      let v;
      if (format === 3 && bits === 32) v = data.readFloatLE(o);
      else if (format === 3 && bits === 64) v = data.readDoubleLE(o);
      else if (bits === 8) v = (data[o] - 128) / 128;
      else if (bits === 16) v = data.readInt16LE(o) / 32768;
      else if (bits === 24) v = data.readIntLE(o, 3) / 8388608;
      else if (bits === 32) v = data.readInt32LE(o) / 2147483648;
      else throw new Error(`지원하지 않는 형식: ${format}/${bits}bit`);
      out[c][i] = v;
    }
  }
  return { rate: fmt.rate, channels: out };
}

/** Decodes any other format to a temp WAV with ffmpeg, if it is installed. */
function toWav(file) {
  if (file.toLowerCase().endsWith('.wav')) return file;
  const wav = path.join(TMP, path.basename(file) + '.wav');
  try {
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', file, '-c:a', 'pcm_s16le', wav]);
  } catch {
    throw new Error(`${path.basename(file)}: MP3·OGG·FLAC는 ffmpeg가 필요합니다. WAV로 받거나 변환해 주세요.`);
  }
  return wav;
}

function writeWav(file, samples, rate) {
  const b = Buffer.alloc(44 + samples.length * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + samples.length * 2, 4); b.write('WAVE', 8);
  b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(rate, 24); b.writeUInt32LE(rate * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write('data', 36); b.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) {
    b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(samples[i] * 32767))), 44 + i * 2);
  }
  fs.writeFileSync(file, b);
}

/** Linear-interpolation resampling with a short moving-average pre-filter when downsampling. */
function resample(x, from, to) {
  if (from === to) return x;
  let src = x;
  const ratio = from / to;
  if (ratio > 1) {
    const k = Math.ceil(ratio);
    src = new Float32Array(x.length);
    let sum = 0;
    for (let i = 0; i < x.length; i++) {
      sum += x[i];
      if (i >= k) sum -= x[i - k];
      src[i] = sum / Math.min(i + 1, k);
    }
  }
  const n = Math.floor(x.length / ratio);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const p = i * ratio;
    const j = Math.floor(p);
    const t = p - j;
    out[i] = src[j] * (1 - t) + (src[Math.min(j + 1, src.length - 1)] || 0) * t;
  }
  return out;
}

if (!fs.existsSync(SRC)) {
  console.error(`원본 폴더가 없습니다: ${SRC}\n고른 소리를 sfx_coin.wav 같은 이름으로 저장하세요 (README.md 참고).`);
  process.exit(1);
}
fs.mkdirSync(TMP, { recursive: true });
let done = 0;
for (const [name, spec] of Object.entries(SOUNDS)) {
  const ext = EXTS.find((e) => fs.existsSync(path.join(SRC, name + e)));
  if (!ext) continue;
  const src = path.join(SRC, name + ext);
  let wav;
  try { wav = readWav(toWav(src)); } catch (e) { console.log(`${name}: 건너뜀 — ${e.message}`); continue; }

  // Mono mix, then the target sample rate.
  const len = wav.channels[0].length;
  let x = new Float32Array(len);
  for (const ch of wav.channels) for (let i = 0; i < len; i++) x[i] += ch[i] / wav.channels.length;
  x = resample(x, wav.rate, spec.rate);

  // Effects: drop leading/trailing silence relative to the clip's own peak.
  let peak = x.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
  if (peak === 0) { console.log(`${name}: 건너뜀 — 소리가 없음`); continue; }
  if (!spec.loop) {
    const floor = Math.max(SILENCE, peak * 0.02);
    let a = 0, b = x.length - 1;
    while (a < b && Math.abs(x[a]) < floor) a++;
    while (b > a && Math.abs(x[b]) < floor) b--;
    x = x.slice(Math.max(0, a - Math.round(spec.rate * 0.002)), b + 1);
  }
  const original = x.length / spec.rate;
  const maxLen = Math.round(spec.maxSeconds * spec.rate);
  const fade = Math.round(FADE_SECONDS * spec.rate);
  if (x.length > maxLen) {
    x = x.slice(0, maxLen);
    for (let i = 0; i < fade; i++) x[maxLen - 1 - i] *= i / fade;
  } else if (!spec.loop) {
    // A tiny fade at the end so a clip that stops mid-wave does not click.
    const f = Math.min(fade, Math.floor(x.length / 4));
    for (let i = 0; i < f; i++) x[x.length - 1 - i] *= i / f;
  }

  peak = x.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
  const gain = spec.peak / peak;
  for (let i = 0; i < x.length; i++) x[i] *= gain;

  const outDir = dry ? TMP : path.join(ROOT, 'app/src/main/res/raw');
  const out = path.join(outDir, name + '.wav');
  writeWav(out, x, spec.rate);
  if (!dry) fs.copyFileSync(out, path.join(ROOT, spec.web, name + '.wav'));
  const secs = x.length / spec.rate;
  console.log(`${name}: ${path.basename(src)} ${wav.rate}Hz ${wav.channels.length}ch -> ${spec.rate}Hz 모노 ${secs.toFixed(2)}초` +
    (original > spec.maxSeconds ? ` (원래 ${original.toFixed(2)}초, 줄임)` : '') + `, 음량 x${gain.toFixed(2)}`);
  done++;
}
console.log(done ? `${done}개 처리${dry ? ` (미리보기: ${TMP})` : ''}` : `처리할 소리가 없음: ${SRC}`);
