import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const strict = process.argv.includes('--strict') || process.env.GIAOAN_STRICT_HOSTED_CI_PROOF === '1';
const artifactPath = 'artifacts/p0-hosted-ci-final-proof-runner-last-run.json';
const timeoutMs = Number(process.env.GIAOAN_HOSTED_CI_FINAL_STEP_TIMEOUT_MS || 1_500_000);
const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.GIAOAN_DEMO_URL || '';
const results = [];
function write(final = false) {
  const failed = results.filter((item) => ['FAIL', 'TIMEOUT', 'BLOCKED'].includes(item.status)).length;
  const passed = results.filter((item) => item.status === 'PASS').length;
  const skipped = results.filter((item) => item.status === 'SKIP').length;
  const out = {
    ok: final ? failed === 0 : false,
    generatedAt: new Date().toISOString(),
    strict,
    nodeVersion: process.versions.node,
    appUrlPresent: Boolean(appUrl),
    summary: { total: results.length, passed, skipped, failed },
    results,
    noAiPaymentVerifiedFakeAdded: true,
    warning: 'Batch142: strict mode must pass GitHub Actions Node24 provenance, hosted strict release, hosted save/export smoke, visual smoke, and a separate P0-100 release artifact. Non-strict mode records blockers without pretending they passed.'
  };
  fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
  fs.writeFileSync(artifactPath, JSON.stringify(out, null, 2) + '\n');
  return out;
}
function add(status, id, detail) { results.push({ id, status, ...detail, finishedAt: new Date().toISOString() }); write(); }
function run(id, script, env = {}) {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn('npm', ['run', script], { stdio: 'inherit', shell: process.platform === 'win32', env: { ...process.env, ...env } });
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      try { child.kill('SIGTERM'); } catch {}
      setTimeout(() => { try { child.kill('SIGKILL'); } catch {} }, 5000).unref?.();
    }, timeoutMs);
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      const item = { id, script, status: timedOut ? 'TIMEOUT' : (code === 0 ? 'PASS' : 'FAIL'), exitCode: code, signal: signal || null, durationMs: Date.now() - started, finishedAt: new Date().toISOString() };
      results.push(item); write(); resolve(item);
    });
  });
}
function shouldStop(item) { return strict && item.status !== 'PASS'; }
function finish() { const out = write(true); console.log(JSON.stringify({ ok: out.ok, artifactPath, strict, summary: out.summary }, null, 2)); process.exit(strict ? (out.ok ? 0 : 1) : 0); }

let item = await run('source-batch141', 'batch141:p0-hosted-proof-artifact-integrity-validate');
if (shouldStop(item)) finish();

item = await run('source-batch132', 'runtime:p0-hosted-ci-proof-validate');
if (shouldStop(item)) finish();

item = await run('local-batch131-proof', 'verify:batch131');
if (shouldStop(item)) finish();

if (Number(process.versions.node.split('.')[0] || 0) === 24) {
  item = await run('node24-deepest-ci', 'verify:p0-deepest-node24-ci');
  if (shouldStop(item)) finish();
} else {
  add(strict ? 'BLOCKED' : 'SKIP', 'node24-deepest-ci', { reason: `Current Node ${process.versions.node}; Node24 proof must run in GitHub Actions/Vercel with CI provenance.` });
  if (strict) finish();
}

if (appUrl) {
  item = await run('hosted-release-strict', 'verify:release:strict', { APP_URL: appUrl, NEXT_PUBLIC_APP_URL: appUrl, GIAOAN_DEMO_URL: appUrl });
  if (shouldStop(item)) finish();
  item = await run('hosted-save-export-smoke', 'hosted:url-smoke', { GIAOAN_DEMO_URL: appUrl, APP_URL: appUrl, NEXT_PUBLIC_APP_URL: appUrl });
  if (shouldStop(item)) finish();
} else {
  add(strict ? 'BLOCKED' : 'SKIP', 'hosted-url-proof', { reason: 'Missing APP_URL/NEXT_PUBLIC_APP_URL/GIAOAN_DEMO_URL. Hosted proof cannot be claimed.' });
  if (strict) finish();
}

item = await run('visual-smoke-evidence', 'visual:smoke:evidence-validate');
if (shouldStop(item)) finish();

if (Number(process.versions.node.split('.')[0] || 0) === 24 && appUrl && item.status === 'PASS') {
  item = await run('p0-100-release-proof', 'verify:p0-100-release', { APP_URL: appUrl, NEXT_PUBLIC_APP_URL: appUrl, GIAOAN_DEMO_URL: appUrl });
  if (shouldStop(item)) finish();
} else {
  add(strict ? 'BLOCKED' : 'SKIP', 'p0-100-release-proof', { reason: 'P0-100 release proof requires Node24, APP_URL and visual smoke pass. It cannot reuse verify:release:strict artifact.' });
  if (strict) finish();
}

item = await run('final-ci-report', 'runtime:p0-hosted-ci-proof-report');
finish();
