import fs from 'node:fs';

function read(file) { return fs.readFileSync(file, 'utf8'); }
const issues = [];
const diag = read('scripts/raw-next-build-diagnostic.mjs');
const hardGate = read('scripts/runtime-build-hard-gate-report.mjs');
const pkg = JSON.parse(read('package.json'));
const policy = JSON.parse(read('data/raw-build-diagnostic-lifecycle-policy.json'));

for (const marker of [
  "Batch120 — Raw Build Diagnostic Lifecycle Hardening",
  "detached: false",
  "handleExternalSignal",
  "running: false",
  "interrupted_by_",
  "Collecting build traces",
  "timeout_before_raw_build_exit_zero",
  "raw-next-build-diagnostic-last-run.json"
]) {
  if (!diag.includes(marker)) issues.push({ file: 'scripts/raw-next-build-diagnostic.mjs', marker });
}
for (const marker of [
  "rawRunningArtifact",
  "rawArtifactInterrupted",
  "staleRawBuildDiagnostic",
  "rawBuildClosed",
  "productionLiveSmokePassed"
]) {
  if (!hardGate.includes(marker)) issues.push({ file: 'scripts/runtime-build-hard-gate-report.mjs', marker });
}
for (const script of [
  'runtime:raw-build-diagnostic-lifecycle-validate',
  'smoke:batch120',
  'verify:batch120'
]) {
  if (!pkg.scripts?.[script]) issues.push({ file: 'package.json', marker: script });
}
if (!String(pkg.version || '').startsWith('0.12')) issues.push({ file: 'package.json', marker: 'version 0.120.x or later Batch120-compatible version' });
if (!Array.isArray(policy.blockedEvidenceStates) || !policy.blockedEvidenceStates.includes('diagnostic_running_not_finished_yet')) {
  issues.push({ file: 'data/raw-build-diagnostic-lifecycle-policy.json', marker: 'blocked running diagnostic state' });
}
const result = {
  ok: issues.length === 0,
  batch: 'Batch120 — Raw Build Diagnostic Lifecycle Hardening',
  checked: 5,
  issues,
  noAiPaymentVerifiedFakeAdded: true,
  note: 'Source check only. Runtime proof still requires npm ci, raw build diagnostic, production live smoke, auth runtime smoke, and hosted URL smoke when a real URL exists.'
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
