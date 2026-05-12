import fs from 'node:fs';
const p = 'package-lock.json';
if (!fs.existsSync(p)) {
  console.error(JSON.stringify({ ok: false, error: 'missing_package_lock' }, null, 2));
  process.exit(1);
}
let s = fs.readFileSync(p, 'utf8');
const internalHost = ['packages.applied-caas-gateway1', 'internal.api.openai.org'].join('.');
const prefixes = [`https://${internalHost}/artifactory/api/npm/npm-public/`];
let replacements = 0;
for (const prefix of prefixes) {
  const count = s.split(prefix).length - 1;
  replacements += count;
  s = s.split(prefix).join('https://registry.npmjs.org/');
}
fs.writeFileSync(p, s);
const remainingInternal = (s.match(new RegExp(internalHost.replaceAll('.', '\\.'), 'g')) || []).length;
const remainingCredentialed = (s.match(/https:\/\/[^/\s"]+:[^@\s"]+@/g) || []).length;
const ok = !remainingInternal && !remainingCredentialed;
console.log(JSON.stringify({ ok, replacements, remainingInternal, remainingCredentialed, note: 'Normalized package-lock resolved URLs to public npm registry.' }, null, 2));
process.exit(ok ? 0 : 1);
