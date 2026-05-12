import fs from 'node:fs';

function read(file) { return fs.readFileSync(file, 'utf8'); }
const issues = [];
const pkg = JSON.parse(read('package.json'));
const policy = JSON.parse(read('data/full-verify-chain-stability-policy.json'));
const nextConfig = read('next.config.ts');
const rawDiag = read('scripts/raw-next-build-diagnostic.mjs');
const authSmoke = read('scripts/auth-invite-runtime-smoke.mjs');

if (pkg.version !== '0.121.0') issues.push({ file: 'package.json', marker: 'version 0.121.0' });
for (const script of ['runtime:full-verify-chain-validate','smoke:batch121','verify:batch121']) {
  if (!pkg.scripts?.[script]) issues.push({ file: 'package.json', marker: script });
}
for (const marker of [
  'Batch121 marker: disable webpack filesystem cache',
  'webpack: (config) =>',
  'config.cache = false'
]) {
  if (!nextConfig.includes(marker)) issues.push({ file: 'next.config.ts', marker });
}
for (const marker of [
  'cleanNextBuildCache',
  "fs.rmSync(cacheDir, { recursive: true, force: true })",
  'cacheCleanup',
  'GIAOAN_RAW_BUILD_CACHE_CLEANED'
]) {
  if (!rawDiag.includes(marker)) issues.push({ file: 'scripts/raw-next-build-diagnostic.mjs', marker });
}
for (const marker of [
  'auth-invite-runtime-smoke-last-run.json',
  'serverMode',
  'hasBuildArtifact',
  'missing_next_build_artifact',
  'auth_invite_runtime_smoke_timeout',
  'writeArtifact'
]) {
  if (!authSmoke.includes(marker)) issues.push({ file: 'scripts/auth-invite-runtime-smoke.mjs', marker });
}
if (policy.version !== '0.121.0' || policy.priority !== 'P0 Runtime/Build Closure') {
  issues.push({ file: 'data/full-verify-chain-stability-policy.json', marker: 'version/priority' });
}
if (policy.noAiPaymentVerifiedFakeAdded !== true) {
  issues.push({ file: 'data/full-verify-chain-stability-policy.json', marker: 'noAiPaymentVerifiedFakeAdded' });
}
const forbidden = ['openai', 'gemini', 'anthropic', 'stripe', 'paypal'];
const changedText = [nextConfig, rawDiag, JSON.stringify(pkg), JSON.stringify(policy)].join('\n').toLowerCase();
for (const marker of forbidden) {
  if (changedText.includes(marker)) issues.push({ file: 'batch121 changed surface', marker: `forbidden marker ${marker}` });
}
const result = {
  ok: issues.length === 0,
  batch: 'Batch121 — Full Verify Chain Stability & Cache Hygiene',
  checked: 5,
  issues,
  noAiPaymentVerifiedFakeAdded: true,
  note: 'Source check only. Runtime proof still requires npm ci, typecheck, finalized raw build diagnostic, production live smoke, auth smoke, and hosted URL smoke when a real URL exists.'
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
