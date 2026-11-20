// Usage: node design/title-icon/make-title-icon.cjs [--dry] [--src <folder>]   (needs ImageMagick `magick`)
// Turns the Gemini title background and app icon (see gemini-prompts.md) into game assets:
//   home_portrait.(png|webp|jpg) -> 1080x2160 title background for the app and the web build
//   app_icon.(png|webp|jpg)      -> adaptive-icon foreground (magenta keyed out, fitted into the
//                                   safe zone) + a 512x512 store icon on the existing background
// Only files present in the source folder are processed. --dry writes everything to a temp folder.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const args = process.argv.slice(2);
const dry = args.includes('--dry');
const srcAt = args.indexOf('--src');
const SRC = srcAt >= 0 ? path.resolve(args[srcAt + 1]) : path.join(__dirname, 'gemini-originals');
const TMP = path.join(os.tmpdir(), 'yorijorirun-title-icon');
const RES = path.join(ROOT, 'app/src/main/res/drawable-nodpi');
const out = (real) => (dry ? path.join(TMP, path.basename(real)) : real);

const TITLE_W = 1080;
const TITLE_H = 2160;
const ICON = 512;
/** Adaptive icons show a 66dp circle of a 108dp canvas; on 512px that is a radius of ~156px. */
const SAFE_RADIUS = 154;
const FUZZ = '22%';
const SPECK = 0.0008;
const OUTLINE = '#F5EBD7';
const PINKISH = 'r>0.5 && b>0.5 && g<min(r,b)-0.12';
const EXTS = ['.png', '.webp', '.jpg', '.jpeg'];

const magick = (...a) => execFileSync('magick', a, { maxBuffer: 1 << 28 }).toString().trim();
const find = (name) => {
  const ext = EXTS.find((e) => fs.existsSync(path.join(SRC, name + e)));
  return ext && path.join(SRC, name + ext);
};
const size = (f) => magick('identify', '-format', '%w %h', f).split(' ').map(Number);

if (!fs.existsSync(SRC)) {
  console.error(`원본 폴더가 없습니다: ${SRC}\n제미나이 결과를 home_portrait.png, app_icon.png 이름으로 저장하세요 (gemini-prompts.md 참고).`);
  process.exit(1);
}
fs.mkdirSync(TMP, { recursive: true });
let done = 0;

// ---- Title background: center-crop to 1:2, then scale to 1080x2160. ----
const title = find('home_portrait');
if (title) {
  const [w, h] = size(title);
  const cropW = Math.min(w, Math.round(h * TITLE_W / TITLE_H));
  const cropH = Math.min(h, Math.round(cropW * TITLE_H / TITLE_W));
  const appOut = out(path.join(RES, 'home_portrait.png'));
  const resized = path.join(TMP, 'title-resized.png');
  magick(title, '-gravity', 'center', '-crop', `${cropW}x${cropH}+0+0`, '+repage',
    '-resize', `${TITLE_W}x${TITLE_H}!`, resized);
  // Gemini stamps a small, half-transparent white sparkle in the bottom-right corner, so it reads
  // as a pale tint of whatever is under it (pale pink on the red track). Pale pixels whose green
  // and blue stay level are taken as the sparkle; cream lane lines (green well above blue) and
  // grass are left alone. They are filled with a median of their surroundings.
  const sparkle = path.join(TMP, 'title-sparkle.png');
  magick(resized, '-fx', `i>w*0.86 && j>h*0.90 && lightness>0.6 && abs(g-b)<0.08`, '-alpha', 'off',
    '-morphology', 'Dilate', 'Disk:4', sparkle);
  // The median window must be well wider than the sparkle, or it just repaints the sparkle; it
  // runs on the corner only, since a window this size over the whole picture is slow.
  const x0 = Math.floor(TITLE_W * 0.8);
  const y0 = Math.floor(TITLE_H * 0.86);
  const filled = path.join(TMP, 'title-filled.png');
  magick(resized, '(', '+clone', '-crop', `${TITLE_W - x0}x${TITLE_H - y0}+${x0}+${y0}`, '+repage',
    '-statistic', 'Median', '121x121', ')', '-geometry', `+${x0}+${y0}`, '-composite', filled);
  magick(resized, filled, sparkle, '-composite', '-strip', '-define', 'png:compression-level=9', appOut);
  fs.rmSync(filled);
  const cleared = Number(magick(sparkle, '-format', '%[fx:mean*w*h]', 'info:'));
  fs.rmSync(resized); fs.rmSync(sparkle);
  if (!dry) fs.copyFileSync(appOut, path.join(ROOT, 'web/assets/ui/home_portrait.png'));
  console.log(`타이틀: ${path.basename(title)} ${w}x${h} -> 가운데 ${cropW}x${cropH} 잘라 ${TITLE_W}x${TITLE_H}, 구석 표시 ${Math.round(cleared)}px 지움` +
    (Math.abs(w / h - 9 / 16) > 0.02 ? '  ← 9:16이 아님, 많이 잘렸을 수 있음' : ''));
  done++;
}

// ---- App icon: key out magenta, drop specks (Gemini's sparkle), fit into the safe zone. ----
const icon = find('app_icon');
if (icon) {
  const keyed = path.join(TMP, 'icon-keyed.png');
  const mask = path.join(TMP, 'icon-mask.png');
  magick(icon, '-alpha', 'set', '-fuzz', FUZZ, '-transparent', '#FF00FF',
    '-channel', 'A', '-morphology', 'Erode', 'Disk:1', '+channel', keyed);
  const [W, H] = size(keyed);
  magick(keyed, '-alpha', 'extract', '-threshold', '50%',
    '-define', `connected-components:area-threshold=${Math.round(W * H * SPECK)}`,
    '-define', 'connected-components:mean-color=true', '-connected-components', '8', mask);
  const cut = path.join(TMP, 'icon-cut.png');
  magick(keyed, mask, '-compose', 'CopyOpacity', '-composite', '-trim', '+repage', cut);
  // Pink-tinted edge pixels take the cream outline color (opaque, so no pink shows through).
  magick(cut, '(', '+clone', '-alpha', 'off', '-fill', OUTLINE, '-colorize', '100', ')',
    '(', '-clone', '0', '-fx', `a>0.2 && ${PINKISH}`, '-alpha', 'off', ')', '-composite', cut);

  // Scale so the art's farthest opaque pixel from its center stays inside the safe circle (tighter
  // than fitting the bounding box's diagonal), then center it on 512x512.
  const [cw, ch] = size(cut);
  const alpha = execFileSync('magick', [cut, '-alpha', 'extract', '-depth', '8', 'gray:-'], { maxBuffer: 1 << 28 });
  let reach = 0;
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      if (alpha[y * cw + x] > 127) reach = Math.max(reach, Math.hypot(x + 0.5 - cw / 2, y + 0.5 - ch / 2));
    }
  }
  const scale = SAFE_RADIUS / reach;
  const fw = Math.round(cw * scale);
  const fh = Math.round(ch * scale);
  const fg = out(path.join(RES, 'ic_launcher_foreground.png'));
  magick(cut, '-resize', `${fw}x${fh}!`, '-background', 'none', '-gravity', 'center', '-extent', `${ICON}x${ICON}`,
    '-strip', '-define', 'png:compression-level=9', `PNG32:${fg}`);
  const store = out(path.join(ROOT, 'design/icon/store_icon_512.png'));
  magick(path.join(RES, 'ic_launcher_background.png'), '-resize', `${ICON}x${ICON}!`, fg, '-composite',
    '-strip', '-define', 'png:compression-level=9', store);
  const pink = Number(magick(fg, '-fx', `a>0.5 && ${PINKISH}`, '-format', '%[fx:mean*w*h]', 'info:'));
  console.log(`아이콘: ${path.basename(icon)} -> 그림 ${fw}x${fh} (안전 영역 반지름 ${SAFE_RADIUS}px 안), 스토어 아이콘 512x512` +
    (pink > fw * fh * 0.002 ? `  ← 분홍 픽셀 ${Math.round(pink)}개 남음, 배경색 확인` : ''));
  for (const f of [keyed, mask, cut]) fs.rmSync(f);
  done++;
}

console.log(done ? `${done}종 처리${dry ? ` (미리보기: ${TMP})` : ''}` : `처리할 그림이 없음: ${SRC}`);
