import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(root, rel));
const pkg = JSON.parse(read('package.json'));
const policy = JSON.parse(read('data/runtime-p0-final-closure-policy.json'));
const issues = [];
function semverGte(actual, min) {
  const a = String(actual || '').split('.').map((x) => Number(x) || 0);
  const b = String(min || '').split('.').map((x) => Number(x) || 0);
  for (let i = 0; i < 3; i += 1) { if ((a[i] || 0) > (b[i] || 0)) return true; if ((a[i] || 0) < (b[i] || 0)) return false; }
  return true;
}
const requiredFiles = [
  'data/runtime-p0-final-closure-policy.json',
  'scripts/runtime-p0-final-closure-report.mjs',
  'scripts/validate-batch127-p0-final-closure-source.mjs',
  'scripts/verify-p0-final.mjs',
  'scripts/p0-runtime-clean-before-build.mjs',
  'vercel.json',
  'BATCH127_NOTES.md'
];
for (const file of requiredFiles) if (!exists(file)) issues.push({ code: 'missing_required_file', file });
if (!semverGte(pkg.version, '0.127.0')) issues.push({ code: 'version_lower_than_batch127', actual: pkg.version });
if (pkg.engines?.node !== '24.x') issues.push({ code: 'node_engine_not_24x', actual: pkg.engines?.node });
if (!/^24\./.test(read('.node-version').trim())) issues.push({ code: 'node_version_file_not_24x', actual: read('.node-version').trim() });
for (const script of ['runtime:p0-final-closure-validate','runtime:p0-final-closure-report','runtime:p0-prebuild-clean','smoke:batch127','verify:p0-final','verify:p0-node24-ci','verify:batch127','verify:release']) {
  if (!pkg.scripts?.[script]) issues.push({ code: 'missing_script', script });
}
if (!String(pkg.scripts?.['verify:p0-final']).includes('verify-p0-final.mjs')) issues.push({ code: 'verify_p0_final_must_use_orchestrator' });
if (!read('scripts/verify-p0-final.mjs').includes('p0-runtime-clean-before-build.mjs')) issues.push({ code: 'verify_p0_final_must_clean_stale_artifacts_before_build' });
if (!read('scripts/verify-p0-final.mjs').includes('node24-runtime-preflight')) issues.push({ code: 'verify_p0_final_must_fail_fast_when_node24_required' });
if (!String(pkg.scripts?.['verify:p0-node24-ci']).includes('GIAOAN_REQUIRE_NODE24=1')) issues.push({ code: 'node24_ci_script_must_require_actual_node24' });
const vercel = exists('vercel.json') ? JSON.parse(read('vercel.json')) : {};
if (vercel.framework !== 'nextjs') issues.push({ code: 'vercel_framework_not_nextjs', actual: vercel.framework });
if (!String(vercel.installCommand || '').includes('npm ci')) issues.push({ code: 'vercel_install_not_clean_npm_ci', actual: vercel.installCommand });
if (vercel.buildCommand !== 'npm run build') issues.push({ code: 'vercel_build_command_not_guarded_build', actual: vercel.buildCommand });
const release = read('scripts/verify-release.mjs');
if (!release.includes('verify:p0-final') && !release.includes('verify:p0-9899')) issues.push({ code: 'verify_release_not_using_final_p0_gate' });
const report = read('scripts/runtime-p0-final-closure-report.mjs');
for (const marker of ['p0FinalLocalClosed','node24RuntimeVerified','publicP1RolloutAllowed','strict_raw_next_build_exit_zero','hostedFreshEnough']) {
  if (!report.includes(marker)) issues.push({ code: 'final_report_missing_marker', marker });
}
if (!semverGte(policy.version, '0.127.0')) issues.push({ code: 'policy_version_lower_than_batch127', policyVersion: policy.version, packageVersion: pkg.version });
if (!policy.noAiPaymentVerifiedFakeAdded) issues.push({ code: 'policy_missing_no_ai_payment_verified_fake_guard' });
const result = { ok: issues.length === 0, batch: 'Batch127 - P0 Final Runtime Closure Hardening', checked: requiredFiles.length + 12, issues, noAiPaymentVerifiedFakeAdded: true };
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
