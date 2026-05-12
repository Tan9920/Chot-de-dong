import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const removed = [];
for (const rel of ['.next','artifacts/next-build-runtime-guard-last-run.json','artifacts/live-http-smoke-last-run.json','artifacts/auth-invite-runtime-smoke-last-run.json','artifacts/runtime-p0-final-closure-last-run.json']) {
  const full = path.join(root, rel);
  if (fs.existsSync(full)) {
    fs.rmSync(full, { recursive: true, force: true });
    removed.push(rel);
  }
}
const report = { ok: true, generatedAt: new Date().toISOString(), removed, note: 'Batch127 P0 prebuild cleanup removes stale .next and runtime smoke artifacts before strict build proof.' };
fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(root, 'artifacts/p0-runtime-clean-before-build-last-run.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
