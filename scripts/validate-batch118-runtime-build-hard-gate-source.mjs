import fs from 'node:fs';

function read(file) { return fs.readFileSync(file, 'utf8'); }
function readJson(file) { return JSON.parse(read(file)); }
function has(file, text) { return read(file).includes(text); }

const issues = [];
const requiredFiles = [
  'data/runtime-build-hard-gate-policy.json',
  'data/runtime-raw-build-closure-policy.json',
  'scripts/next-build-runtime-guard.mjs',
  'scripts/raw-next-build-diagnostic.mjs',
  'scripts/runtime-raw-build-closure-report.mjs',
  'next.config.ts',
  'package.json',
  'BATCH118_NOTES.md'
];
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) issues.push(`${file} missing`);
}

const pkg = readJson('package.json');
for (const script of ['build', 'build:raw', 'build:raw:diagnose', 'runtime:raw-build-closure-validate', 'runtime:build-hard-gate-validate', 'smoke:batch118', 'verify:batch118']) {
  if (!pkg.scripts?.[script]) issues.push(`package.json missing script ${script}`);
}
if (!String(pkg.scripts?.build || '').includes('next-build-runtime-guard.mjs')) issues.push('package.json build script must use the guarded runtime build wrapper');
if (String(pkg.scripts?.['build:raw'] || '') !== 'next build') issues.push('package.json build:raw must remain the raw Next build truth command');
if (!String(pkg.scripts?.['verify:batch118'] || '').includes('build:raw:diagnose')) issues.push('verify:batch118 must include raw build diagnostic evidence');

const nextConfig = read('next.config.ts');
for (const forbidden of ['staticGenerationRetryCount', 'staticGenerationMaxConcurrency', 'staticGenerationMinPagesPerWorker']) {
  if (nextConfig.includes(forbidden)) issues.push(`next.config.ts should not use ${forbidden}; it can trigger brittle static generation behavior`);
}
for (const required of ['outputFileTracingRoot', 'outputFileTracingExcludes', 'parallelServerBuildTraces: false', 'webpackBuildWorker: false']) {
  if (!nextConfig.includes(required)) issues.push(`next.config.ts missing ${required}`);
}

const policy = readJson('data/runtime-build-hard-gate-policy.json');
if (!Array.isArray(policy.hardBlockers) || policy.hardBlockers.length < 4) issues.push('runtime hard gate policy must define the four build/hosted blockers');
if (!Array.isArray(policy.forbiddenWhileBlocked) || !policy.forbiddenWhileBlocked.some((x) => /AI SDK/i.test(x))) issues.push('runtime hard gate policy must keep AI/payment/fake verified additions forbidden while blocked');

const rawPolicy = readJson('data/runtime-raw-build-closure-policy.json');
if (!rawPolicy.knownBlocker?.phase) issues.push('raw build closure policy must keep knownBlocker.phase');
if (!rawPolicy.noOverclaimRules?.some((x) => /raw build closure/i.test(x))) issues.push('raw build closure policy must keep no-overclaim raw build rule');

const guard = read('scripts/next-build-runtime-guard.mjs');
if (!guard.includes('artifactFreshness')) issues.push('next build guard must mark artifacts as current_run to prevent stale evidence reuse');
if (!guard.includes('removeStaleArtifact')) issues.push('next build guard must remove stale artifact before each run');
if (!guard.includes('not raw Next build closure') && !guard.includes('not the same as raw next build exiting 0')) issues.push('next build guard must warn that guarded artifact closure is not raw build closure');

const allText = [
  'README.md', 'BATCH117_NOTES.md', 'BATCH118_NOTES.md',
  'data/runtime-build-hard-gate-policy.json', 'data/runtime-raw-build-closure-policy.json'
].filter(fs.existsSync).map(read).join('\n');
for (const forbiddenClaim of ['production-ready 100%', 'rawBuildClosed: true', 'hostedClosed: true']) {
  if (allText.includes(forbiddenClaim)) issues.push(`forbidden overclaim marker found: ${forbiddenClaim}`);
}

const result = {
  ok: issues.length === 0,
  batch: 'Batch118 — Runtime Build Hard Gate & Future Blocker Prevention',
  checked: requiredFiles.length,
  issues,
  noAiPaymentVerifiedFakeAdded: true,
  note: 'This is a source-level hard gate. It does not claim raw Next build closure; raw closure still requires build:raw or build:raw:diagnose evidence.'
};
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
