import fs from 'node:fs';
const issues = [];
function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''; }
function readJson(file, fallback = {}) { try { return JSON.parse(read(file) || JSON.stringify(fallback)); } catch { return fallback; } }
function check(label, condition, detail = '') { if (!condition) issues.push(detail ? `${label}: ${detail}` : label); }
const pkg = readJson('package.json');
const lock = readJson('package-lock.json');
const nodeVersion = read('.node-version').trim();
const npmrc = read('.npmrc');
const workflow = read('.github/workflows/demo-runtime-verify.yml');
const policy = readJson('data/runtime-node24-alignment-policy.json');
const pkgText = JSON.stringify(pkg).toLowerCase();
const lockRoot = lock.packages?.[''] || {};
check('package version must be Batch124', pkg.version === '0.124.0', pkg.version);
check('package-lock top-level version must be Batch124', lock.version === '0.124.0', lock.version);
check('package-lock root package version must be Batch124', lockRoot.version === '0.124.0', lockRoot.version);
check('package.json engines.node must target Node 24.x', pkg.engines?.node === '24.x', pkg.engines?.node);
check('package-lock root engines.node must target Node 24.x', lockRoot.engines?.node === '24.x', lockRoot.engines?.node);
check('.node-version must pin Node 24 LTS line', /^24\./.test(nodeVersion), nodeVersion);
check('@types/node should align with Node 24 type baseline', String(pkg.dependencies?.['@types/node'] || '').startsWith('24.'), pkg.dependencies?.['@types/node']);
check('package-lock @types/node should align with Node 24 type baseline', String(lock.packages?.['node_modules/@types/node']?.version || '').startsWith('24.'), lock.packages?.['node_modules/@types/node']?.version);
check('.npmrc must keep engine-strict=false for Android/Termux fallback installs', npmrc.includes('engine-strict=false'));
check('GitHub workflow should setup Node 24', workflow.includes('Setup Node 24') && /node-version:\s*"24"/.test(workflow), 'demo-runtime-verify.yml');
check('GitHub workflow should use universal release verify, not old Batch88 as final gate', workflow.includes('npm run verify:release') && !workflow.includes('Full Batch88 verification'), 'demo-runtime-verify.yml');
check('policy must describe batch124 Node 24 target', policy.version === 'batch124-node24-runtime-alignment' && policy.targetRuntime === 'node24', JSON.stringify({ version: policy.version, targetRuntime: policy.targetRuntime }));
for (const forbidden of ['openai', '@google/generative-ai', '@anthropic-ai/sdk', 'anthropic', 'langchain']) check(`forbidden AI dependency ${forbidden}`, !pkgText.includes(`"${forbidden}`));
for (const forbidden of ['stripe', 'paypal', 'vnpay', 'momo', 'zalopay']) check(`forbidden payment dependency ${forbidden}`, !pkgText.includes(`"${forbidden}`));
const result = { ok: issues.length === 0, checked: { packageVersion: pkg.version, packageEngine: pkg.engines?.node || null, nodeVersionFile: nodeVersion, nodeTypes: pkg.dependencies?.['@types/node'] || null, workflowNode24: workflow.includes('Setup Node 24') && workflow.includes('node-version: "24"'), noAiDependencies: !['openai', '@google/generative-ai', '@anthropic-ai/sdk', 'anthropic', 'langchain'].some((name) => pkgText.includes(`"${name}`)) }, issues, note: 'Batch124 validates source-level Node 24 LTS/Vercel/CI alignment only. It does not prove npm ci/build/live smoke/hosted smoke unless those commands are run successfully on a Node 24 environment.' };
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
