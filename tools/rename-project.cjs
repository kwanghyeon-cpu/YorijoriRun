// Renames the project in place: package, class/theme prefix, display name, storage keys.
// Usage: node tools/rename-project.cjs <fromId> <toId> "<From Name>" "<To Name>"
//   e.g. node tools/rename-project.cjs PathDash TrailDash "Path Dash" "Trail Dash"
// fromId/toId are CamelCase (LaneDash); the lower-case package part (lanedash) and snake keys
// (lane_dash) are derived. The Firebase project id (lanedash-2cc5d) is never touched.
const fs = require('fs');
const path = require('path');

const [fromId, toId, fromName, toName] = process.argv.slice(2);
if (!fromId || !toId || !fromName || !toName) {
  console.error('usage: node tools/rename-project.cjs <fromId> <toId> "<From Name>" "<To Name>"');
  process.exit(1);
}
const root = path.resolve(__dirname, '..');
const lower = (s) => s.toLowerCase();
const snake = (s) => s.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
const upperWords = (s) => s.toUpperCase();

const PROTECT = ['lanedash-2cc5d'];
const pairs = [
  [`com.khcompany.${lower(fromId)}`, `com.khcompany.${lower(toId)}`],
  [`com/khcompany/${lower(fromId)}`, `com/khcompany/${lower(toId)}`],
  [`${lower(fromId)}-backdrops`, `${lower(toId)}-backdrops`],
  [fromId, toId],
  [fromName, toName],
  [upperWords(fromName), upperWords(toName)],
  [upperWords(fromName).replace(' ', '\\n'), upperWords(toName).replace(' ', '\\n')],
  [upperWords(fromName).replace(' ', '<br/>'), upperWords(toName).replace(' ', '<br/>')],
  [snake(fromId), snake(toId)],
  // Any other lower-case use: the leaderboard collection (scores_pathdash), temp folder names.
  [lower(fromId), lower(toId)],
];

const TEXT = /\.(kt|kts|xml|md|js|mjs|cjs|html|css|json|rules|properties|toml)$/;
const SKIP = new Set(['.git', 'build', '.gradle', 'node_modules', '.idea']);
let changed = 0;
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) { walk(p); continue; }
    if (!TEXT.test(entry.name) || p === __filename) continue;
    let s = fs.readFileSync(p, 'utf8');
    const before = s;
    PROTECT.forEach((word, i) => { s = s.split(word).join(`\u0000${i}\u0000`); });
    for (const [a, b] of pairs) s = s.split(a).join(b);
    PROTECT.forEach((word, i) => { s = s.split(`\u0000${i}\u0000`).join(word); });
    if (s !== before) { fs.writeFileSync(p, s); changed++; }
  }
}
walk(root);

// Source folders follow the package; files named after the old id follow the new one.
for (const set of ['main', 'test', 'androidTest']) {
  const base = path.join(root, 'app', 'src', set, 'java', 'com', 'khcompany');
  const from = path.join(base, lower(fromId));
  if (fs.existsSync(from)) fs.renameSync(from, path.join(base, lower(toId)));
}
function renameFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) renameFiles(p);
    else if (entry.name.includes(fromId)) fs.renameSync(p, path.join(dir, entry.name.split(fromId).join(toId)));
  }
}
renameFiles(root);
console.log(`renamed ${fromId} -> ${toId} ("${fromName}" -> "${toName}") in ${changed} files`);
