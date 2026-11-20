// Usage: node design/sprites/make-sprites.cjs [--dry] [--src <folder>]   (needs ImageMagick `magick`)
// Turns Gemini sprites on a flat magenta background (see gemini-prompts.md) into game sprites:
// removes the magenta, trims the empty margin, scales to the width the game expects, and writes the
// PNG to both the app (res/drawable-nodpi) and the web build (web/assets/rear).
// Only files present in the source folder are processed, so sprites can arrive a few at a time.
// --dry writes to a temp folder instead and leaves the app and web folders alone.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const args = process.argv.slice(2);
const dry = args.includes('--dry');
const srcAt = args.indexOf('--src');
const SRC = srcAt >= 0 ? path.resolve(args[srcAt + 1]) : path.join(__dirname, 'gemini-originals');
const DESTS = dry
  ? [path.join(os.tmpdir(), 'yorijorirun-sprites')]
  : [path.join(ROOT, 'app/src/main/res/drawable-nodpi'), path.join(ROOT, 'web/assets/rear')];

// File name -> output width in px (the widths of the Lane Dash sprites these replace).
const SPRITES = {
  car_rear_1: 384, // 조깅
  car_rear_2: 384, // 자전거
  car_rear_3: 384, // 리어카
  car_rear_4: 384, // 킥보드
  traffic_rear_sedan: 332, // 자전거 탄 사람
  traffic_rear_suv: 332, // 강아지 산책
  traffic_rear_bus: 332, // 러닝 크루
  traffic_rear_truck: 332, // 배달 오토바이
  hw_barrier: 444, // 포트홀
  hw_cone: 357, // 라바콘
};
const EXTS = ['.png', '.webp', '.jpg', '.jpeg'];
// How far from pure magenta still counts as background. Gemini's "flat" color drifts a little.
const FUZZ = '22%';
/** Islands smaller than this share of the image area are dropped (Gemini's sparkle mark, specks). */
const SPECK = 0.0008;
/** A ground line under the subject is at most this share of the image height thick. */
const LINE_MAX = 0.03;
/** The cream outline the prompt asks for. */
const OUTLINE = '#F5EBD7';
/** -fx test for a pink-tinted pixel: red and blue well above green. */
const PINKISH = 'r>0.5 && b>0.5 && g<min(r,b)-0.12';

if (!fs.existsSync(SRC)) {
  console.error(`원본 폴더가 없습니다: ${SRC}\n제미나이 결과를 car_rear_1.png 같은 이름으로 저장하세요 (gemini-prompts.md 참고).`);
  process.exit(1);
}
for (const d of DESTS) fs.mkdirSync(d, { recursive: true });

const magick = (...a) => execFileSync('magick', a, { maxBuffer: 1 << 28 }).toString().trim();

/**
 * Gemini tends to draw a thin ground line under the subject. The game draws its own shadow, so the
 * line goes: walking up from the lowest opaque row, rows whose longest opaque run is at least half
 * the subject's width are line rows, as long as that band stays thin (LINE_MAX of the image height)
 * and the rows above it are clearly narrower. Feet, wheels and a pothole's rounded rim never make a
 * long thin band, and a cone's base is too thick to count. Clears those rows in the 0/255 mask.
 */
function removeGroundLine(maskFile, W, H) {
  const a = execFileSync('magick', [maskFile, '-depth', '8', 'gray:-'], { maxBuffer: 1 << 28 });
  const runOf = (y) => {
    let best = 0, run = 0, left = W, right = -1;
    for (let x = 0; x < W; x++) {
      if (a[y * W + x] > 127) { run++; if (run > best) best = run; left = Math.min(left, x); right = x; } else run = 0;
    }
    return { best, span: right - left + 1 };
  };
  let bottom = H - 1;
  while (bottom > 0 && runOf(bottom).best === 0) bottom--;
  let subjectWidth = 0;
  for (let y = 0; y <= bottom; y++) subjectWidth = Math.max(subjectWidth, runOf(y).span);
  // The line's lowest rows can be a faint, broken edge: start from the first long row within a few px.
  const long = (y) => runOf(y).best >= subjectWidth * 0.5;
  let lineBottom = bottom;
  while (bottom - lineBottom < 8 && !long(lineBottom)) lineBottom--;
  if (!long(lineBottom)) return;
  let top = lineBottom;
  while (top > 0 && lineBottom - top < H * LINE_MAX && long(top - 1)) top--;
  if (lineBottom - top >= H * LINE_MAX) return;
  // The rows just above the band must be much narrower, or this is the subject's own flat bottom.
  const above = Math.max(runOf(top - 2).best, runOf(top - 4).best);
  if (above >= runOf(lineBottom).best * 0.6) return;
  magick(maskFile, '-fill', 'black', '-draw', `rectangle 0,${top - 1} ${W},${bottom}`, maskFile);
}
let done = 0;
for (const [name, width] of Object.entries(SPRITES)) {
  const ext = EXTS.find((e) => fs.existsSync(path.join(SRC, name + e)));
  if (!ext) continue;
  const src = path.join(SRC, name + ext);
  const out = path.join(DESTS[0], name + '.png');
  const keyed = path.join(os.tmpdir(), `yorijorirun-sprite-${name}.png`);
  const mask = path.join(os.tmpdir(), `yorijorirun-sprite-${name}-mask.png`);
  magick(
    src, '-alpha', 'set',
    // Every magenta-ish pixel goes transparent (the prompt keeps magenta off the subject, so this
    // also clears the gaps between legs, spokes and handles that a flood fill would miss).
    '-fuzz', FUZZ, '-transparent', '#FF00FF',
    // Peel one pixel off the silhouette so the pink anti-aliased fringe goes with the background.
    '-channel', 'A', '-morphology', 'Erode', 'Disk:1', '+channel',
    keyed,
  );
  // Small islands go: Gemini's sparkle mark in the corner and stray specks. Anything smaller than
  // SPECK of the image area is merged into the background in the alpha mask.
  const [W, H] = magick('identify', '-format', '%w %h', keyed).split(' ').map(Number);
  magick(keyed, '-alpha', 'extract', '-threshold', '50%',
    '-define', `connected-components:area-threshold=${Math.round(W * H * SPECK)}`,
    '-define', 'connected-components:mean-color=true', '-connected-components', '8', mask);
  removeGroundLine(mask, W, H);
  magick(keyed, mask, '-compose', 'CopyOpacity', '-composite',
    '-trim', '+repage',
    '-resize', `${width}x`,
    '-strip', '-define', 'png:compression-level=9', out);
  fs.rmSync(keyed); fs.rmSync(mask);
  // Edge pixels that still carry a pink tint (JPEG and soft edges bleed the background in) take the
  // cream outline color instead. Safe because the prompt keeps pink off the subject.
  // The cream patch is opaque: a see-through one would let the pink under a soft edge show through.
  magick(out, '(', '+clone', '-alpha', 'off', '-fill', OUTLINE, '-colorize', '100', ')', '(', '-clone', '0', '-fx', `a>0.2 && ${PINKISH}`, '-alpha', 'off', ')',
    '-composite', '-strip', '-define', 'png:compression-level=9', out);
  for (const d of DESTS.slice(1)) fs.copyFileSync(out, path.join(d, name + '.png'));

  const [w, h] = magick('identify', '-format', '%w %h', out).split(' ').map(Number);
  // Leftover pink: opaque pixels that are still strongly magenta point at a background the fuzz missed.
  const pink = Number(magick(out, '-fx', `a>0.5 && ${PINKISH}`, '-format', '%[fx:mean*w*h]', 'info:'));
  const warn = pink > w * h * 0.002 ? `  ← 분홍 픽셀 ${Math.round(pink)}개 남음, 배경색 확인` : '';
  console.log(`${name}: ${path.basename(src)} -> ${w}x${h} (세로/가로 ${(h / w).toFixed(2)})${warn}`);
  done++;
}
console.log(done ? `${done}장 처리 -> ${DESTS.join(', ')}` : `처리할 그림이 없음: ${SRC}`);
