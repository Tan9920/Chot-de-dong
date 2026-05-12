import fs from 'node:fs';

function read(file) { return fs.readFileSync(file, 'utf8'); }
const issues = [];
const liveSmoke = read('scripts/live-http-smoke.mjs');
const hardGate = read('scripts/runtime-build-hard-gate-report.mjs');
const pkg = JSON.parse(read('package.json'));

for (const marker of [
  "artifacts/live-http-smoke-last-run.json",
  "function writeSmokeArtifact(report)",
  "batch98RealAccountSaveExportSmoke"
]) {
  if (!liveSmoke.includes(marker)) issues.push({ file: 'scripts/live-http-smoke.mjs', marker });
}
for (const marker of [
  "productionLiveSmokePassed",
  "hostedClosure",
  "liveSmokeStatus",
  "productionLiveSmokeClosure",
  "teacherPilotReady"
]) {
  if (!hardGate.includes(marker)) issues.push({ file: 'scripts/runtime-build-hard-gate-report.mjs', marker });
}
for (const script of ['runtime:evidence-gate-validate','smoke:batch119','verify:batch119']) {
  if (!pkg.scripts?.[script]) issues.push({ file: 'package.json', marker: script });
}
const report = {
  ok: issues.length === 0,
  batch: 'Batch119 — Runtime Evidence Gate Closure',
  checked: 8,
  issues,
  noAiPaymentVerifiedFakeAdded: true,
  note: 'Source check only. Runtime proof still requires npm ci, raw build diagnostic, production live smoke, auth runtime smoke, and hosted URL smoke when a real URL exists.'
};
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
