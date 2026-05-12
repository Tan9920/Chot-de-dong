import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const artifact = process.env.GIAOAN_VERIFY_RELEASE_ARTIFACT || 'artifacts/verify-release-last-run.json';
const timeout = Number(process.env.GIAOAN_VERIFY_RELEASE_STEP_TIMEOUT_MS || 1_500_000);
const results = [];
const startedAt = new Date().toISOString();
const commandName = process.env.npm_lifecycle_event || 'verify:release';
const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.GIAOAN_DEMO_URL || '';
const requireHostedUrl = process.env.GIAOAN_REQUIRE_HOSTED_URL === '1';
const requireVisualSmoke = process.env.GIAOAN_REQUIRE_VISUAL_SMOKE === '1';
const requireNode24 = process.env.GIAOAN_REQUIRE_NODE24 === '1';
const proofProfile = requireNode24 && requireHostedUrl && requireVisualSmoke
  ? 'p0_100_release'
  : requireHostedUrl && !requireVisualSmoke
    ? 'hosted_release_strict'
    : 'local_release';

function write(final = false) {
  const failed = results.filter((i) => i.status === 'FAIL' || i.status === 'TIMEOUT').length;
  const passed = results.filter((i) => i.status === 'PASS').length;
  const skipped = results.filter((i) => i.status === 'SKIP').length;
  const p = {
    ok: final ? failed === 0 : false,
    generatedAt: new Date().toISOString(),
    startedAt,
    command: commandName,
    proofProfile,
    nodeVersion: process.versions.node,
    nodeMajor: Number(process.versions.node.split('.')[0] || 0),
    appUrlPresent: Boolean(appUrl),
    requireNode24,
    requireHostedUrl,
    requireVisualSmoke,
    artifactContract: {
      artifact,
      command: commandName,
      proofProfile,
      requireNode24,
      requireHostedUrl,
      requireVisualSmoke
    },
    summary: { total: results.length, passed, skipped, failed },
    results,
    note: 'Batch141: release artifacts are proof-profiled. verify:release:strict and verify:p0-100-release must write separate artifacts so hosted strict smoke cannot be counted as P0-100 release proof.'
  };
  fs.mkdirSync(path.dirname(artifact), { recursive: true });
  fs.writeFileSync(artifact, JSON.stringify(p, null, 2) + '\n');
  return p;
}
function run(id, script, extraEnv = {}) {
  return new Promise((resolve) => {
    const st = Date.now();
    const c = spawn('npm', ['run', script], { stdio: 'inherit', shell: process.platform === 'win32', env: { ...process.env, ...extraEnv } });
    let timedOut = false;
    const t = setTimeout(() => {
      timedOut = true;
      try { c.kill('SIGTERM'); } catch {}
      setTimeout(() => { try { c.kill('SIGKILL'); } catch {} }, 5000).unref?.();
    }, timeout);
    c.on('close', (code, signal) => {
      clearTimeout(t);
      const item = { id, script, status: timedOut ? 'TIMEOUT' : (code === 0 ? 'PASS' : 'FAIL'), exitCode: code, signal: signal || null, durationMs: Date.now() - st, finishedAt: new Date().toISOString() };
      results.push(item);
      write();
      resolve(item);
    });
  });
}
function skip(id, reason) {
  results.push({ id, status: 'SKIP', reason, finishedAt: new Date().toISOString() });
  console.log(`[verify:release] SKIP ${id} — ${reason}`);
  write();
}
function fail(id, reason) {
  results.push({ id, status: 'FAIL', reason, exitCode: 1, signal: null, durationMs: 0, finishedAt: new Date().toISOString() });
  console.error(`[verify:release] FAIL ${id} — ${reason}`);
  write();
}

let item = await run('verify-p0-deepest', 'verify:p0-deepest');
if (item.status !== 'PASS') {
  const p = write(true);
  console.error(JSON.stringify({ ok: false, artifact, proofProfile, reason: 'verify:p0-deepest failed before release URL smoke', summary: p.summary }, null, 2));
  process.exit(1);
}

if (appUrl) {
  item = await run('smoke-url-strict', 'smoke:url:strict', { GIAOAN_DEMO_URL: appUrl, APP_URL: appUrl, NEXT_PUBLIC_APP_URL: appUrl });
  if (item.status !== 'PASS') {
    const p = write(true);
    console.error(JSON.stringify({ ok: false, artifact, proofProfile, reason: 'strict URL smoke failed', summary: p.summary }, null, 2));
    process.exit(1);
  }
} else if (requireHostedUrl) {
  fail('smoke-url-strict', 'GIAOAN_REQUIRE_HOSTED_URL=1 nhưng không có APP_URL/NEXT_PUBLIC_APP_URL/GIAOAN_DEMO_URL. Không được claim 100%/public rollout.');
  const p = write(true);
  console.error(JSON.stringify({ ok: false, artifact, proofProfile, reason: 'missing required hosted URL', summary: p.summary }, null, 2));
  process.exit(1);
} else {
  skip('smoke-url-strict', 'Không có APP_URL/NEXT_PUBLIC_APP_URL/GIAOAN_DEMO_URL nên skip URL smoke. Public rollout/P1 rộng vẫn bị chặn đến khi chạy APP_URL=https://... npm run verify:release:strict.');
}

if (requireVisualSmoke) {
  item = await run('visual-smoke-evidence', 'visual:smoke:evidence-validate');
  if (item.status !== 'PASS') {
    const p = write(true);
    console.error(JSON.stringify({ ok: false, artifact, proofProfile, reason: 'missing required visual smoke evidence', summary: p.summary }, null, 2));
    process.exit(1);
  }
} else {
  skip('visual-smoke-evidence', 'GIAOAN_REQUIRE_VISUAL_SMOKE is not set. This is acceptable for hosted URL strict smoke, but not for verify:p0-100-release/public rollout.');
}

const p = write(true);
console.log(JSON.stringify({ ok: p.ok, artifact, proofProfile, summary: p.summary }, null, 2));
process.exit(p.ok ? 0 : 1);
