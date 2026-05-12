import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(root, rel));
const pkg = JSON.parse(read('package.json'));
const issues = [];
const requiredFiles = [
  'scripts/p0-loopback-url-smoke.mjs',
  'scripts/verify-p0-9899.mjs',
  'scripts/runtime-p0-9899-closure-report.mjs',
  'scripts/validate-batch128-p0-9899-closure-source.mjs',
  'data/runtime-p0-9899-closure-policy.json',
  'BATCH128_NOTES.md'
];
for (const file of requiredFiles) if (!exists(file)) issues.push({ code: 'missing_required_file', file });
if (pkg.version !== '0.128.0') issues.push({ code: 'version_not_batch128', actual: pkg.version });
if (pkg.engines?.node !== '24.x') issues.push({ code: 'node_engine_not_24x', actual: pkg.engines?.node });
for (const script of ['runtime:p0-9899-closure-validate','runtime:p0-loopback-url-smoke','runtime:p0-9899-closure-report','verify:p0-9899','verify:p0-9899-node24-ci','verify:release:strict','smoke:batch128','verify:batch128']) {
  if (!pkg.scripts?.[script]) issues.push({ code: 'missing_script', script });
}
if (!String(pkg.scripts?.['verify:p0-9899-node24-ci'] || '').includes('GIAOAN_REQUIRE_NODE24=1')) issues.push({ code: 'node24_ci_must_require_node24' });
if (!String(pkg.scripts?.['verify:release:strict'] || '').includes('GIAOAN_REQUIRE_HOSTED_URL=1')) issues.push({ code: 'strict_release_must_require_hosted_url' });
const loopback = read('scripts/p0-loopback-url-smoke.mjs');
for (const marker of ['hosted-demo-url-smoke.mjs', 'next', 'start', 'GIAOAN_DATA_DIR', '127.0.0.1']) if (!loopback.includes(marker)) issues.push({ code: 'loopback_script_missing_marker', marker });
const release = read('scripts/verify-release.mjs');
if (!release.includes('verify:p0-9899')) issues.push({ code: 'verify_release_must_use_9899_gate' });
if (!release.includes('GIAOAN_REQUIRE_HOSTED_URL')) issues.push({ code: 'verify_release_must_have_strict_hosted_env' });
const report = read('scripts/runtime-p0-9899-closure-report.mjs');
for (const marker of ['p0Local9899Closed','localClosurePercent','publicP1RolloutAllowed','loopback_hosted_route_smoke_passed_after_build','hostedFreshEnough']) if (!report.includes(marker)) issues.push({ code: '9899_report_missing_marker', marker });
const policy = JSON.parse(read('data/runtime-p0-9899-closure-policy.json'));
if (policy.version !== '0.128.0') issues.push({ code: 'policy_version_not_batch128', actual: policy.version });
if (!policy.noAiPaymentVerifiedFakeAdded) issues.push({ code: 'policy_missing_no_ai_payment_verified_fake_guard' });
const pkgText = JSON.stringify(pkg).toLowerCase();
for (const forbidden of ['openai','@google/generative-ai','@anthropic-ai/sdk','anthropic','langchain','stripe','paypal','vnpay','momo','zalopay']) {
  if (pkgText.includes(`"${forbidden}`)) issues.push({ code: 'forbidden_dependency_added', dependency: forbidden });
}
const result = { ok: issues.length === 0, batch: 'Batch128 - P0 98-99 Local Runtime Closure Hardening', checked: requiredFiles.length + 20, issues, noAiPaymentVerifiedFakeAdded: true };
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
