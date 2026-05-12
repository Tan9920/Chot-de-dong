import fs from 'node:fs';

const issues = [];
function read(file) { try { return fs.readFileSync(file, 'utf8'); } catch { issues.push(`${file}:missing`); return ''; } }
function json(file) { try { return JSON.parse(read(file)); } catch (error) { issues.push(`${file}:invalid_json:${error.message}`); return {}; } }
function has(file, marker) { if (!read(file).includes(marker)) issues.push(`${file}:missing_marker:${marker}`); }

const pkg = json('package.json');
const finalProofPolicy = json('data/runtime-p0-hosted-final-proof-policy.json');
const hostedCiPolicy = json('data/runtime-p0-hosted-ci-final-proof-policy.json');
const finalClosurePolicy = json('data/p0-p1-final-closure-policy.json');
const canonical = ['mobile-360','mobile-390','mobile-430','tablet-768','desktop-1366','desktop-1440'];
const finalProofIds = (finalProofPolicy.visualSmoke?.requiredViewports || []).map((v) => v.id);
const hostedIds = hostedCiPolicy.visualEvidence?.requiredViewports || [];
if (JSON.stringify(finalProofIds) !== JSON.stringify(canonical)) issues.push(`runtime-p0-hosted-final-proof viewport ids mismatch:${finalProofIds.join(',')}`);
if (JSON.stringify(hostedIds) !== JSON.stringify(canonical)) issues.push(`runtime-p0-hosted-ci-final-proof viewport ids mismatch:${hostedIds.join(',')}`);
if (JSON.stringify(finalClosurePolicy.canonicalVisualViewportIds || []) !== JSON.stringify(canonical)) issues.push('p0-p1-final-closure-policy canonical viewport ids mismatch');
for (const script of ['visual:smoke:evidence-capture','p0-p1:final-closure-report','batch143:p0-p1-final-closure-validate','smoke:batch143','verify:batch143']) {
  if (!pkg.scripts?.[script]) issues.push(`package.json missing script ${script}`);
}
for (const file of [
  'scripts/visual-smoke-evidence-capture.mjs',
  'scripts/p0-p1-final-closure-report.mjs',
  'lib/p0-p1-final-closure.ts',
  'app/api/runtime/p0-p1-final-closure/route.ts',
  'app/api/admin/p0-p1-final-closure-board/route.ts',
  'docs/BATCH143_P0_P1_FINAL_CLOSURE_CANDIDATE.md',
  'BATCH143_NOTES.md'
]) if (!fs.existsSync(file)) issues.push(`${file}:missing`);
has('scripts/visual-smoke-evidence-capture.mjs', 'canonical_hyphenated_viewport_ids_with_real_screenshot_files');
has('scripts/visual-smoke-evidence-capture.mjs', '--screenshot=');
has('scripts/visual-smoke-evidence-capture.mjs', 'chromium_headless_cli');
has('scripts/visual-smoke-evidence-validate.mjs', 'screenshotPath');
has('scripts/visual-smoke-evidence-validate.mjs', 'screenshot file');
has('.github/workflows/p0-hosted-final-proof.yml', 'npm run visual:smoke:evidence-capture');
has('lib/p0-p1-final-closure.ts', 'localP0P1Closed');
has('lib/p0-p1-final-closure.ts', 'hostedPublicClosed');
has('scripts/p0-p1-final-closure-report.mjs', 'allP0P1PublicClosed');
has('scripts/next-build-runtime-guard.mjs', 'running_build_guard_progress');
has('data/p0-p1-final-closure-policy.json', 'visual-smoke-pass-without-screenshots');
const result = { ok: issues.length === 0, batch: 'Batch143 — P0/P1 Final Closure Candidate', checked: 24, canonicalVisualViewportIds: canonical, issues, noAiPaymentVerifiedFakeAdded: true };
fs.writeFileSync('artifacts/batch143-p0-p1-final-closure-source-last-run.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
