// Usage: node design/title-icon/make-logo.cjs <folder with logo_C3.png>   (needs ImageMagick `magick`)
// Trims the transparent margin off the logo drawn by logo.html (concept C3) and writes it as
// title_logo.png for the app (res/drawable-nodpi) and the web build (web/assets/ui).
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const src = path.join(path.resolve(process.argv[2] || '.'), 'logo_C3.png');
if (!fs.existsSync(src)) {
  console.error(`logo_C3.png가 없습니다: ${src}\nlogo.html?c=C3&save=1 로 먼저 저장하세요.`);
  process.exit(1);
}
const app = path.join(ROOT, 'app/src/main/res/drawable-nodpi/title_logo.png');
// A few pixels of padding keep the drop shadow and rim from touching the edge.
execFileSync('magick', [src, '-trim', '+repage', '-bordercolor', 'none', '-border', '6', '-strip',
  '-define', 'png:compression-level=9', `PNG32:${app}`]);
fs.copyFileSync(app, path.join(ROOT, 'web/assets/ui/title_logo.png'));
const size = execFileSync('magick', ['identify', '-format', '%wx%h', app]).toString();
console.log(`title_logo.png ${size} -> 앱(res/drawable-nodpi)과 웹(web/assets/ui)`);
