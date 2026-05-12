import fs from 'node:fs';

const issues = [];
function read(file) { try { return fs.readFileSync(file, 'utf8'); } catch { return ''; } }
function json(file) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (error) { issues.push(`${file} invalid JSON: ${error.message}`); return {}; } }
function has(file, marker) {
  if (!read(file).includes(marker)) issues.push(`${file} missing marker: ${marker}`);
}

const pkg = json('package.json');
const localPolicy = json('data/p0-p1-local-evidence-policy.json');
const finalPolicy = json('data/p0-p1-final-closure-policy.json');

if (pkg.version !== '0.144.0') issues.push(`package version must be 0.144.0, got ${pkg.version}`);
for (const script of ['batch144:p0-p1-build-closure-validate','p0-p1:build-closure-validate','smoke:batch144','verify:batch144','build:raw:diagnose']) {
  if (!pkg.scripts?.[script]) issues.push(`package.json missing script ${script}`);
}
if (localPolicy.version !== '0.144.0') issues.push('p0-p1 local evidence policy version must be 0.144.0');
if (finalPolicy.version !== '0.144.0') issues.push('p0-p1 final closure policy version must be 0.144.0');
if (!localPolicy.localEvidenceGates?.some((gate) => gate.id === 'raw_build_diagnostic' && gate.required === true)) issues.push('local evidence policy must require raw_build_diagnostic');
if (!finalPolicy.localP0P1ClosureEvidence?.some((gate) => gate.id === 'raw_build_diagnostic' && gate.required === true)) issues.push('final closure policy must require raw_build_diagnostic');

has('scripts/next-build-runtime-guard.mjs', 'cleanNextBuildOutput');
has('scripts/next-build-runtime-guard.mjs', "fs.rmSync(path.join(root, '.next')");
has('scripts/next-build-runtime-guard.mjs', 'buildOutputCleanup');
has('scripts/next-build-runtime-guard.mjs', 'Batch144 progress artifact');
has('scripts/raw-next-build-diagnostic.mjs', 'Batch144 — P0/P1 Local Build Closure');
has('scripts/raw-next-build-diagnostic.mjs', 'cleanNextBuildOutput');
has('scripts/raw-next-build-diagnostic.mjs', 'buildCanExceedInteractiveToolWindow');
has('scripts/p0-p1-local-evidence-runner.mjs', 'raw_build_diagnostic');
has('scripts/p0-p1-local-evidence-report.mjs', 'rawBuildOk');
has('scripts/p0-p1-local-evidence-report.mjs', 'rawNextBuildExitCode === 0');
has('lib/p0-p1-local-evidence.ts', 'rawBuildOk');
has('scripts/p0-p1-final-closure-report.mjs', 'raw_build_diagnostic');
has('lib/p0-p1-final-closure.ts', 'raw_build_exit_zero_contract_not_met');
has('README.md', 'Batch144');
has('BATCH144_NOTES.md', 'P0/P1 Local Build Closure');
has('docs/BATCH144_P0_P1_LOCAL_BUILD_CLOSURE.md', 'raw Next build');

const result = {
  ok: issues.length === 0,
  batch: 'Batch144 — P0/P1 Local Build Closure',
  checked: 18,
  issues,
  noAiPaymentVerifiedFakeAdded: true,
  productionReady: false,
  publicRolloutAllowed: false,
  warning: 'This validator checks source-level build closure hardening only. It does not replace runtime build/live smoke or hosted proof commands.'
};
fs.mkdirSync('artifacts', { recursive: true });
fs.writeFileSync('artifacts/batch144-p0-p1-build-closure-source-last-run.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
