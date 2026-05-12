import fs from 'node:fs';

const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
const readJson = (file) => JSON.parse(read(file) || '{}');
const issues = [];
const pkg = readJson('package.json');
const lock = read('package-lock.json');
const npmrc = read('.npmrc');
const registryScript = read('scripts/check-registry-network.mjs');
const runtimePreflight = read('scripts/batch83-runtime-preflight.mjs');
const batch85Notes = read('BATCH85_NOTES.md');
const vercel = read('vercel.json');

function requireMarker(fileLabel, text, marker) {
  if (!text.includes(marker)) issues.push(`${fileLabel} missing marker: ${marker}`);
}
function requireNotMarker(fileLabel, text, marker) {
  if (text.includes(marker)) issues.push(`${fileLabel} still contains forbidden marker: ${marker}`);
}

if (!String(pkg.version || "").match(/^0\.(85|86|87|88|89|90|91|92)\.0$/)) issues.push(`package.json version must be 0.85.0 or later Batch86/87/88-compatible 0.86.0/0.87.0/0.88.0/0.89.0/0.90.0, got ${pkg.version}`);
if (pkg.engines?.node !== '22.x') issues.push(`engines.node must be pinned to 22.x for Vercel major-version stability, got ${pkg.engines?.node}`);
if (pkg.dependencies?.next !== '15.3.8') issues.push(`next must be exact patched release 15.3.8, got ${pkg.dependencies?.next}`);
if (pkg.dependencies?.react !== '19.0.4') issues.push(`react must be exact patched release 19.0.4, got ${pkg.dependencies?.react}`);
if (pkg.dependencies?.['react-dom'] !== '19.0.4') issues.push(`react-dom must be exact patched release 19.0.4, got ${pkg.dependencies?.['react-dom']}`);

for (const script of ['runtime:deploy-hardening-validate', 'smoke:batch85', 'verify:batch85', 'registry:diagnose', 'runtime:preflight']) {
  if (!pkg.scripts?.[script]) issues.push(`package.json missing script ${script}`);
}

for (const file of ['BATCH85_NOTES.md', 'scripts/validate-batch85-runtime-deploy-hardening-source.mjs', 'scripts/check-registry-network.mjs', 'scripts/batch83-runtime-preflight.mjs', 'vercel.json']) {
  if (!fs.existsSync(file)) issues.push(`missing file: ${file}`);
}

requireNotMarker('.npmrc', npmrc, 'always-auth');
requireMarker('.npmrc', npmrc, 'registry=https://registry.npmjs.org/');
const internalRegistryHost = ['packages.applied-caas-gateway1', 'internal.api.openai.org'].join('.');
requireNotMarker('package-lock.json', lock, internalRegistryHost);
if (/https:\/\/[^/\s"]+:[^@\s"]+@/.test(lock)) issues.push('package-lock.json contains credentialed registry URL');
requireMarker('package-lock.json', lock, 'next-15.3.8.tgz');
requireMarker('package-lock.json', lock, 'react-19.0.4.tgz');
requireMarker('package-lock.json', lock, 'react-dom-19.0.4.tgz');

for (const marker of ['Promise.race', 'dns_lookup_timeout_after', 'registry_fetch_timeout_after', 'fails fast instead of hanging on DNS']) {
  requireMarker('scripts/check-registry-network.mjs', registryScript, marker);
}
for (const marker of ['isAtLeast(pkg.version, \'0.83.0\')', 'credentialed_registry_env_sanitized_by_clean_scripts', 'GIAOAN_SMOKE_MODE=production']) {
  requireMarker('scripts/batch83-runtime-preflight.mjs', runtimePreflight, marker);
}
for (const marker of ['Next.js 15.3.8', 'React 19.0.4', 'Node 22.x', 'always-auth', 'không chứng minh production-ready']) {
  requireMarker('BATCH85_NOTES.md', batch85Notes, marker);
}
for (const marker of ['"framework": "nextjs"', '"buildCommand": "npm run build"']) {
  requireMarker('vercel.json', vercel, marker);
}

const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
for (const aiDep of ['openai', '@google/generative-ai', '@anthropic-ai/sdk', 'anthropic', 'langchain']) {
  if (deps[aiDep]) issues.push(`forbidden AI dependency present: ${aiDep}`);
}

const result = {
  ok: issues.length === 0,
  issues,
  checked: {
    packageVersion: pkg.version,
    nodeEngine: pkg.engines?.node,
    next: pkg.dependencies?.next,
    react: pkg.dependencies?.react,
    reactDom: pkg.dependencies?.['react-dom']
  },
  note: 'Batch85 source validator checks deploy-warning fixes and runtime preflight hardening only. It does not replace npm install, Next build, production live smoke, or browser QA.'
};
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
