import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const artifact = 'artifacts/verify-p0-final-last-run.json';
const timeout = Number(process.env.GIAOAN_VERIFY_P0_STEP_TIMEOUT_MS || 900000);
const startedAt = new Date().toISOString();
const results = [];
function write(final = false) {
  const failed = results.filter((i) => i.status === 'FAIL' || i.status === 'TIMEOUT').length;
  const p = {
    ok: final ? failed === 0 : false,
    generatedAt: new Date().toISOString(),
    startedAt,
    command: 'verify:p0-final',
    nodeVersion: process.versions.node,
    requireNode24: process.env.GIAOAN_REQUIRE_NODE24 === '1',
    summary: { total: results.length, passed: results.filter((i) => i.status === 'PASS').length, skipped: results.filter((i) => i.status === 'SKIP').length, failed },
    results,
    note: 'Batch127 final P0 verifier: source/data/type/SWC/strict raw build/live smoke/auth smoke/final closure report. Hosted smoke remains in verify:release.'
  };
  fs.mkdirSync(path.dirname(artifact), { recursive: true });
  fs.writeFileSync(artifact, `${JSON.stringify(p, null, 2)}\n`);
  return p;
}
function run(id, command, args, env = {}) {
  return new Promise((resolve) => {
    const st = Date.now();
    const child = spawn(command, args, { stdio: 'inherit', shell: process.platform === 'win32', env: { ...process.env, ...env } });
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      try { child.kill('SIGTERM'); } catch {}
      setTimeout(() => { try { child.kill('SIGKILL'); } catch {} }, 5000).unref?.();
    }, timeout);
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      const item = { id, command: [command, ...args].join(' '), status: timedOut ? 'TIMEOUT' : (code === 0 ? 'PASS' : 'FAIL'), exitCode: code, signal: signal || null, durationMs: Date.now() - st, finishedAt: new Date().toISOString() };
      results.push(item);
      console.log(`[verify:p0-final] ${item.status} ${id}`);
      write();
      resolve(item);
    });
  });
}

if (process.env.GIAOAN_REQUIRE_NODE24 === '1' && Number(process.versions.node.split('.')[0]) !== 24) {
  results.push({
    id: 'node24-runtime-preflight',
    command: 'node -v',
    status: 'FAIL',
    exitCode: 1,
    signal: null,
    durationMs: 0,
    finishedAt: new Date().toISOString(),
    reason: `GIAOAN_REQUIRE_NODE24=1 requires Node 24.x, got ${process.versions.node}`
  });
  const p = write(true);
  console.error(JSON.stringify({ ok: false, artifact, reason: results.at(-1).reason, summary: p.summary }, null, 2));
  process.exit(1);
}

const steps = [
  ['source-validate', 'npm', ['run', 'source:validate']],
  ['data-validate', 'npm', ['run', 'data:validate']],
  ['batch127-source-gate', 'npm', ['run', 'runtime:p0-final-closure-validate']],
  ['typecheck', 'npm', ['run', 'typecheck']],
  ['next-swc-ready', 'npm', ['run', 'next:swc-ready']],
  ['prebuild-clean-stale-artifacts', 'node', ['scripts/p0-runtime-clean-before-build.mjs']],
  ['strict-raw-build', 'npm', ['run', 'build'], { GIAOAN_BUILD_GUARD_STRICT_RAW: '1', GIAOAN_BUILD_PROGRESS_LOG_MS: process.env.GIAOAN_BUILD_PROGRESS_LOG_MS || '2000' }],
  ['production-live-smoke', 'npm', ['run', 'live:smoke:clean'], { GIAOAN_SMOKE_MODE: 'production' }],
  ['auth-invite-runtime-smoke', 'npm', ['run', 'auth-invite:runtime-smoke']],
  ['p0-final-closure-report', 'npm', ['run', 'runtime:p0-final-closure-report']]
];
for (const [id, cmd, args, env] of steps) {
  const item = await run(id, cmd, args, env || {});
  if (item.status !== 'PASS') {
    const p = write(true);
    console.error(JSON.stringify({ ok: false, artifact, reason: `${id} ${item.status}`, summary: p.summary }, null, 2));
    process.exit(1);
  }
}
const p = write(true);
console.log(JSON.stringify({ ok: p.ok, artifact, summary: p.summary }, null, 2));
process.exit(p.ok ? 0 : 1);
