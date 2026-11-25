// Usage: node tools/make-release-assets.cjs   (after ./gradlew :app:bundleRelease and the store screenshots)
// Collects everything the Play Console upload needs into store-assets/release-<version>/ (git-ignored):
//   yorijorirun-<version>.aab   the signed release bundle
//   mapping.txt                 R8 mapping, for readable crash stack traces in Play Console
//   icon_512.png                hi-res store icon
//   feature_graphic_1024x500.png
//   screenshots/*.png           phone screenshots, flattened to 24-bit PNG (Play rejects alpha)
//   store-listing.md, RELEASE.md  the listing text and the upload guide
// Needs ImageMagick `magick` for the screenshot flattening.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const gradle = fs.readFileSync(path.join(ROOT, 'app/build.gradle.kts'), 'utf8');
const version = (gradle.match(/versionName\s*=\s*"([^"]+)"/) || [])[1];
const versionCode = (gradle.match(/versionCode\s*=\s*(\d+)/) || [])[1];
if (!version) throw new Error('versionName을 app/build.gradle.kts에서 찾지 못했어요');

const shotsDir = path.join(ROOT, 'store-assets', `screenshots-${version.split('.').slice(0, 2).join('.')}`);
const out = path.join(ROOT, 'store-assets', `release-${version}`);
const need = {
  aab: path.join(ROOT, 'app/build/outputs/bundle/release/app-release.aab'),
  mapping: path.join(ROOT, 'app/build/outputs/mapping/release/mapping.txt'),
  icon: path.join(ROOT, 'design/icon/store_icon_512.png'),
  feature: path.join(ROOT, 'design/icon/feature_graphic.png'),
};
for (const [what, file] of Object.entries(need)) {
  if (!fs.existsSync(file)) throw new Error(`${what} 파일이 없어요: ${file}`);
}
if (!fs.existsSync(shotsDir)) throw new Error(`스크린샷 폴더가 없어요: ${shotsDir}`);

// A stale bundle is the easy mistake. File times can't tell (switching branches touches every file), so
// ask git: the app must have no uncommitted changes, and the bundle must be newer than its last commit.
const git = (...a) => execFileSync('git', a, { cwd: ROOT }).toString().trim();
if (git('status', '--porcelain', '--', 'app') !== '') {
  throw new Error('app/에 커밋하지 않은 변경이 있어요. 커밋한 뒤 ./gradlew.bat :app:bundleRelease 를 다시 실행하세요.');
}
const lastAppCommit = Number(git('log', '-1', '--format=%ct', '--', 'app')) * 1000;
if (fs.statSync(need.aab).mtimeMs < lastAppCommit) {
  throw new Error('app-release.aab가 앱의 마지막 커밋보다 오래됐어요. ./gradlew.bat :app:bundleRelease 를 먼저 다시 실행하세요.');
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'screenshots'), { recursive: true });
fs.copyFileSync(need.aab, path.join(out, `yorijorirun-${version}.aab`));
fs.copyFileSync(need.mapping, path.join(out, 'mapping.txt'));
fs.copyFileSync(need.icon, path.join(out, 'icon_512.png'));
fs.copyFileSync(need.feature, path.join(out, 'feature_graphic_1024x500.png'));
const shots = fs.readdirSync(shotsDir).filter((f) => f.endsWith('.png')).sort();
for (const f of shots) {
  execFileSync('magick', [path.join(shotsDir, f), '-background', '#120B22', '-alpha', 'remove', '-alpha', 'off',
    '-define', 'png:compression-level=9', `PNG24:${path.join(out, 'screenshots', f)}`]);
}
for (const doc of ['store-listing.md', 'RELEASE.md']) fs.copyFileSync(path.join(ROOT, doc), path.join(out, doc));

console.log(`요리조리 런 ${version} (versionCode ${versionCode}) -> ${path.relative(ROOT, out)}`);
console.log(`  AAB ${(fs.statSync(path.join(out, `yorijorirun-${version}.aab`)).size / 1e6).toFixed(1)}MB, 스크린샷 ${shots.length}장(24비트 PNG), 아이콘, 피처 그래픽, mapping.txt, 문서 2개`);
