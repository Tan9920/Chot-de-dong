import fs from 'fs';
import path from 'path';
const roots = ['app', 'components'];
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(p);
    return /\.(ts|tsx)$/.test(entry.name) ? [p] : [];
  });
}
const missing = [];
for (const file of roots.flatMap(walk)) {
  const source = fs.readFileSync(file, 'utf8');
  const re = /from ['"]@\/(lib\/[^'"]+)['"]/g;
  let match;
  while ((match = re.exec(source))) {
    const target = `${match[1]}.ts`;
    if (!fs.existsSync(target)) missing.push({ file, target });
  }
}
console.log(JSON.stringify({ ok: missing.length === 0, missing }, null, 2));
if (missing.length) process.exit(1);
process.exit(0);
