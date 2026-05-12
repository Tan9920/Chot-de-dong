import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const artifact = 'artifacts/verify-p0-9899-last-run.json';
const timeout = Number(process.env.GIAOAN_VERIFY_P0_9899_STEP_TIMEOUT_MS || 1_200_000);
const startedAt = new Date().toISOString();
const results = [];
function write(final = false) {
  const failed = results.filter((i) => i.status === 'FAIL' || i.status === 'TIMEOUT').length;
  const p = {
    ok: final ? failed === 0 : false,
    generatedAt: new Date().toISOString(),
    startedAt,
    command: 'verify:p0-9899',
    nodeVersion: process.versions.node,
    requireNode24: process.env.GIAOAN_REQUIRE_NODE24 === '1',
    summary: { total: results.length, passed: results.filter((i) => i.status === 'PASS').length, skipped: results.filter((i) => i.status === 'SKIP').length, failed },
    results,
    note: 'Batch128 P0 98-99 verifier: final P0 verifier + loopback hosted-route smoke + 98/99 closure report. It still does not replace real hosted APP_URL proof.'
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
      console.log(`[verify:p0-9899] ${item.status} ${id}`);
      write();
      resolve(item);
    });
  });
}
if (process.env.GIAOAN_REQUIRE_NODE24 === '1' && Number(process.versions.node.split('.')[0]) !== 24) {
  results.push({ id: 'node24-runtime-preflight', command: 'node -v', status: 'FAIL', exitCode: 1, signal: null, durationMs: 0, finishedAt: new Date().toISOString(), reason: `GIAOAN_REQUIRE_NODE24=1 requires Node 24.x, got ${process.versions.node}` });
  const p = write(true);
  console.error(JSON.stringify({ ok: false, artifact, reason: results.at(-1).reason, summary: p.summary }, null, 2));
  process.exit(1);
}
const steps = [
  ['verify-p0-final', 'npm', ['run', 'verify:p0-final']],
  ['loopback-hosted-route-smoke', 'npm', ['run', 'runtime:p0-loopback-url-smoke']],
  ['p0-9899-closure-report', 'npm', ['run', 'runtime:p0-9899-closure-report']]
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
