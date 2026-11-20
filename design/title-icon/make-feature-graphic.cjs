// Usage: node design/title-icon/make-feature-graphic.cjs   (needs ImageMagick `magick`)
// Builds the Play Store feature graphic (1024x500) from assets already in the app:
//   background  the sunset sky, skyline and horizon band of the title art (home_portrait.png)
//   right       the four rides' rear sprites (car_rear_1..4), same height, with ground shadows
//   left        the title logo (title_logo.png) on a soft dark wash so it reads on the bright sky
// Play may overlay its own UI near the center and crops nothing, but keeps the edges busy-free,
// so the logo and riders stay inside a 40px margin. Writes design/icon/feature_graphic.png.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const RES = path.join(ROOT, 'app/src/main/res/drawable-nodpi');
const OUT = path.join(ROOT, 'design/icon/feature_graphic.png');
const TMP = path.join(os.tmpdir(), 'yorijorirun-feature');
fs.mkdirSync(TMP, { recursive: true });
const magick = (...a) => execFileSync('magick', a, { maxBuffer: 1 << 28 }).toString().trim();

const W = 1024, H = 500;
// The title art's ground starts about 44.5% down its 2160px height, and its own riders start right
// below (~50%). So the banner is built in two parts: the sky and skyline just above the horizon,
// and the empty strip of path and grass just below it, stretched down to fill the bottom half.
const TITLE_W = 1080, TITLE_H = 2160, HORIZON = 0.445;
const GROUND_STRIP = 60; // title px of empty ground under the horizon (riders begin below ~100)
const SKY_SHARE = 0.5; // the horizon sits halfway down the banner
const horizonY = Math.round(TITLE_H * HORIZON);
const skyH = Math.round(H * SKY_SHARE * TITLE_W / W);
const bg = path.join(TMP, 'bg.png');
magick(
  '(', path.join(RES, 'home_portrait.png'), '-crop', `${TITLE_W}x${skyH}+0+${horizonY - skyH}`, '+repage',
  '-resize', `${W}x${Math.round(H * SKY_SHARE)}!`, ')',
  '(', path.join(RES, 'home_portrait.png'), '-crop', `${TITLE_W}x${GROUND_STRIP}+0+${horizonY}`, '+repage',
  '-resize', `${W}x${H - Math.round(H * SKY_SHARE)}!`, '-blur', '0x2', ')', // soft, like near ground
  '-append', '+repage',
  // a soft dark wash on the left half for the logo
  '(', '-size', `${H}x${W}`, 'gradient:rgba(18,11,34,0.55)-rgba(18,11,34,0)', '-rotate', '-90', ')',
  '-compose', 'over', '-composite', bg);

// Riders: jogger, cyclist, kick scooter, delivery cart — staggered like the title art.
const RIDER_H = 330;
const riders = [
  { sprite: 'car_rear_1', x: 600, bottom: 470 },
  { sprite: 'car_rear_2', x: 700, bottom: 445 },
  { sprite: 'car_rear_4', x: 800, bottom: 455 },
  { sprite: 'car_rear_3', x: 905, bottom: 480 },
];
const args = [bg];
for (const r of riders) {
  const [sw, sh] = magick('identify', '-format', '%w %h', path.join(RES, r.sprite + '.png')).split(' ').map(Number);
  const w = Math.round(sw * RIDER_H / sh);
  const left = Math.round(r.x - w / 2);
  const top = r.bottom - RIDER_H;
  // ground shadow under the feet/wheels
  args.push('(', '-size', `${Math.round(w * 1.1)}x22`, 'xc:none', '-fill', 'rgba(20,10,30,0.45)',
    '-draw', `ellipse ${Math.round(w * 0.55)},11 ${Math.round(w * 0.5)},9 0,360`, '-blur', '0x3', ')',
    '-geometry', `+${Math.round(r.x - w * 0.55)}+${r.bottom - 12}`, '-composite');
  args.push('(', path.join(RES, r.sprite + '.png'), '-resize', `x${RIDER_H}`, ')',
    '-geometry', `+${left}+${top}`, '-composite');
}
// Logo, left side.
const LOGO_W = 470;
args.push('(', path.join(RES, 'title_logo.png'), '-resize', `${LOGO_W}x`, ')', '-geometry', '+44+150', '-composite');
args.push('-strip', '-define', 'png:compression-level=9', `PNG24:${OUT}`);
magick(...args);
fs.rmSync(TMP, { recursive: true, force: true });
console.log(`feature_graphic.png ${magick('identify', '-format', '%wx%h', OUT)} -> ${path.relative(ROOT, OUT)}`);
