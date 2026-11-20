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
  car_rear_3: 384, // 인라인 (처음엔 리어카, 그다음 배달 카트)
  car_rear_4: 384, // 킥보드
  traffic_rear_sedan: 332, // 자전거 탄 사람
  traffic_rear_suv: 332, // 강아지 산책
  traffic_rear_bus: 332, // 러닝 크루
  traffic_rear_truck: 332, // 배달 오토바이
  hw_barrier: 444, // 포트홀
  hw_cone: 357, // 라바콘
};
const EXTS = ['.png', '.webp', '.jpg', '.jpeg'];
/**
 * Riders whose Gemini second frame came back with (some) legs unchanged. From behind, flipping a
 * pair of legs left-to-right swaps the forward and the kicked-up foot.
 *   { from }        frame 2 = frame 1 with everything below `from` (share of the height) flipped;
 *                   head and torso stay exactly the same, so nothing flickers.
 *   { from, cols }  for a group: keep Gemini's frame 2, but replace each listed column (shares of
 *                   the width, centered on one person) below `from` with frame 1's legs there,
 *                   flipped in place — only the people whose legs didn't change.
 */
const MIRROR_LEGS = {
  car_rear_1: { from: 0.56 }, // 조깅: cut through the middle of the shorts
  // 러닝 크루: the middle and right runners kicked the same foot in both frames; the left one is fine.
  traffic_rear_bus: { from: 0.63, cols: [[0.398, 0.6], [0.702, 0.916]] },
};
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
/**
 * Gemini's sparkle mark sits in the bottom-right corner. On a large original it is bigger than the
 * SPECK cut-off, so any opaque island lying entirely inside that corner (the last CORNER share of
 * the width and height) is cleared too; the subject itself never fits inside the corner.
 */
const CORNER = 0.12;
function removeCornerMark(maskFile, W, H) {
  const out = execFileSync('magick', [maskFile, '-define', 'connected-components:verbose=true',
    '-connected-components', '8', 'null:'], { maxBuffer: 1 << 26 }).toString();
  for (const line of out.split('\n')) {
    // e.g. "  12: 40x38+2410+1460 2430.1,1479.2 1180 gray(255)"
    const m = line.match(/^\s*\d+:\s+(\d+)x(\d+)\+(\d+)\+(\d+)\s.*(gray\(255\)|white|srgb\(255,255,255\))/);
    if (!m) continue;
    const [w, h, x, y] = m.slice(1, 5).map(Number);
    if (x >= W * (1 - CORNER) && y >= H * (1 - CORNER) && w < W * CORNER && h < H * CORNER) {
      magick(maskFile, '-fill', 'black', '-draw', `rectangle ${x},${y} ${x + w},${y + h}`, maskFile);
    }
  }
}

/**
 * Keys the magenta out of `src` (optionally only a `crop` of it), drops specks and Gemini's sparkle,
 * removes a drawn ground line, and trims to the subject. Returns the trimmed PNG's path.
 */
function cutOut(src, tag, crop) {
  const keyed = path.join(os.tmpdir(), `yorijorirun-sprite-${tag}.png`);
  const mask = path.join(os.tmpdir(), `yorijorirun-sprite-${tag}-mask.png`);
  const cut = path.join(os.tmpdir(), `yorijorirun-sprite-${tag}-cut.png`);
  magick(
    src, ...(crop ? ['-crop', crop, '+repage'] : []), '-alpha', 'set',
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
  removeCornerMark(mask, W, H);
  removeGroundLine(mask, W, H);
  magick(keyed, mask, '-compose', 'CopyOpacity', '-composite', '-trim', '+repage', cut);
  fs.rmSync(keyed); fs.rmSync(mask);
  return cut;
}

/** Pink-tinted edge pixels take the cream outline color, then the PNG is written compactly. */
function finish(file) {
  // JPEG and soft edges bleed the background into the rim. Safe because the prompt keeps pink off
  // the subject; the cream patch is opaque so no pink shows through a soft edge.
  magick(file, '(', '+clone', '-alpha', 'off', '-fill', OUTLINE, '-colorize', '100', ')', '(', '-clone', '0', '-fx', `a>0.2 && ${PINKISH}`, '-alpha', 'off', ')',
    '-composite', '-strip', '-define', 'png:compression-level=9', file);
}

function report(name, src, file) {
  const [w, h] = magick('identify', '-format', '%w %h', file).split(' ').map(Number);
  // Leftover pink: opaque pixels that are still strongly magenta point at a background the fuzz missed.
  const pink = Number(magick(file, '-fx', `a>0.5 && ${PINKISH}`, '-format', '%[fx:mean*w*h]', 'info:'));
  const warn = pink > w * h * 0.002 ? `  ← 분홍 픽셀 ${Math.round(pink)}개 남음, 배경색 확인` : '';
  console.log(`${name}: ${path.basename(src)} -> ${w}x${h} (세로/가로 ${(h / w).toFixed(2)})${warn}`);
}

const copyOut = (file, outName) => { for (const d of DESTS.slice(1)) fs.copyFileSync(file, path.join(d, outName)); };
const removeFrameB = (name) => { for (const d of DESTS) fs.rmSync(path.join(d, `${name}_b.png`), { force: true }); };

let done = 0;
for (const [name, width] of Object.entries(SPRITES)) {
  const findSrc = (base) => { const e = EXTS.find((x) => fs.existsSync(path.join(SRC, base + x))); return e && path.join(SRC, base + e); };
  const sheet = findSrc(`${name}_frames`);
  const single = findSrc(name);
  if (sheet) {
    // Two frames side by side: cut each half out, scale both by the same factor, and stand both on
    // one canvas anchored at the bottom center, so swapping them never shifts the feet.
    const [W, H] = magick('identify', '-format', '%w %h', sheet).split(' ').map(Number);
    const half = Math.floor(W / 2);
    const a = cutOut(sheet, `${name}-a`, `${half}x${H}+0+0`);
    const b = cutOut(sheet, `${name}-b`, `${W - half}x${H}+${half}+0`);
    const [aw, ah] = magick('identify', '-format', '%w %h', a).split(' ').map(Number);
    const [bw, bh] = magick('identify', '-format', '%w %h', b).split(' ').map(Number);
    const boxW = Math.max(aw, bw), boxH = Math.max(ah, bh);
    const scale = width / boxW;
    const outW = width, outH = Math.round(boxH * scale);
    const outA = path.join(DESTS[0], `${name}.png`);
    const outB = path.join(DESTS[0], `${name}_b.png`);
    for (const [cut, out] of [[a, outA], [b, outB]]) {
      magick(cut, '-resize', `${Math.round(100 * scale * 1000) / 1000}%`, '-background', 'none', '-gravity', 'south',
        '-extent', `${outW}x${outH}`, '-strip', `PNG32:${out}`);
      finish(out);
      fs.rmSync(cut);
    }
    const mirror = MIRROR_LEGS[name];
    if (mirror && !mirror.cols) {
      const y = Math.round(outH * mirror.from);
      magick('(', outA, '-crop', `${outW}x${y}+0+0`, '+repage', ')',
        '(', outA, '-crop', `${outW}x${outH - y}+0+${y}`, '+repage', '-flop', ')',
        '-background', 'none', '-append', '+repage', '-strip', '-define', 'png:compression-level=9', `PNG32:${outB}`);
      console.log(`  ${name}_b: 1프레임의 다리(아래 ${Math.round((1 - mirror.from) * 100)}%)를 좌우로 뒤집어 만듦`);
    } else if (mirror) {
      const y = Math.round(outH * mirror.from);
      const h = outH - y;
      for (const [l, r] of mirror.cols) {
        const x = Math.round(outW * l), w = Math.round(outW * (r - l));
        // Copy a fully transparent block over that region of frame 2 (Copy replaces alpha too),
        // then lay frame 1's legs there, flipped in place.
        magick(outB, '(', '-size', `${w}x${h}`, 'xc:none', ')', '-geometry', `+${x}+${y}`, '-compose', 'Copy', '-composite',
          '(', outA, '-crop', `${w}x${h}+${x}+${y}`, '+repage', '-flop', ')', '-geometry', `+${x}+${y}`,
          '-compose', 'Over', '-composite', '-strip', '-define', 'png:compression-level=9', `PNG32:${outB}`);
      }
      console.log(`  ${name}_b: ${mirror.cols.length}명의 다리를 1프레임에서 좌우로 뒤집어 넣음`);
    }
    copyOut(outA, `${name}.png`); copyOut(outB, `${name}_b.png`);
    report(`${name} (1프레임)`, sheet, outA);
    report(`${name}_b (2프레임)`, sheet, outB);
    done += 2;
    if (single) console.log(`  (${path.basename(single)}도 있지만 2프레임 그림을 썼어요)`);
  } else if (single) {
    const cut = cutOut(single, name);
    const out = path.join(DESTS[0], `${name}.png`);
    magick(cut, '-resize', `${width}x`, '-strip', out);
    fs.rmSync(cut);
    finish(out);
    copyOut(out, `${name}.png`);
    // A one-frame original replaces any earlier pair, so a stale second frame can't linger.
    removeFrameB(name);
    report(name, single, out);
    done++;
  }
}

// The web build can't ask the server which second frames exist, so it reads this generated list.
if (!dry && done) {
  const webRear = path.join(ROOT, 'web/assets/rear');
  const pairs = fs.readdirSync(webRear).filter((f) => f.endsWith('_b.png')).sort()
    .map((f) => `  'assets/rear/${f.replace('_b.png', '.png')}': 'assets/rear/${f}',`);
  fs.writeFileSync(path.join(ROOT, 'web/js/sprite-frames.js'),
    '// GENERATED by design/sprites/make-sprites.cjs — do not edit by hand.\n' +
    '// Sprite path -> its second animation frame (two-frame riders; see design/sprites/gemini-prompts.md).\n' +
    `const SPRITE_FRAME_B = {\n${pairs.join('\n')}${pairs.length ? '\n' : ''}};\n`);
  console.log(`web/js/sprite-frames.js: 2프레임 ${pairs.length}개`);
}
console.log(done ? `${done}장 처리 -> ${DESTS.join(', ')}` : `처리할 그림이 없음: ${SRC}`);
