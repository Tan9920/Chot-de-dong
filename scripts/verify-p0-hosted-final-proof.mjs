import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const artifactPath = 'artifacts/verify-p0-hosted-final-proof-last-run.json';
const timeoutMs = Number(process.env.GIAOAN_VERIFY_P0_HOSTED_FINAL_STEP_TIMEOUT_MS || 1_500_000);
const results = [];
function write(final = false) {
  const failed = results.filter((item) => ['FAIL', 'TIMEOUT'].includes(item.status)).length;
  const out = { ok: final ? failed === 0 : false, generatedAt: new Date().toISOString(), nodeVersion: process.versions.node, summary: { total: results.length, passed: results.filter((item) => item.status === 'PASS').length, failed }, results, note: 'Batch131 strict hosted final proof requires Node24, hosted APP_URL smoke, and visual smoke evidence. It is expected to fail on local Node22 or without APP_URL/visual evidence.' };
  fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
  fs.writeFileSync(artifactPath, JSON.stringify(out, null, 2) + '\n');
  return out;
}
function run(id, script, env = {}) {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn('npm', ['run', script], { stdio: 'inherit', shell: process.platform === 'win32', env: { ...process.env, ...env } });
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; try { child.kill('SIGTERM'); } catch {} setTimeout(() => { try { child.kill('SIGKILL'); } catch {} }, 5000).unref?.(); }, timeoutMs);
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      const item = { id, script, status: timedOut ? 'TIMEOUT' : (code === 0 ? 'PASS' : 'FAIL'), exitCode: code, signal: signal || null, durationMs: Date.now() - started };
      results.push(item);
      write();
      resolve(item);
    });
  });
}
for (const [id, script, env] of [
  ['node24-deepest-ci', 'verify:p0-deepest-node24-ci', {}],
  ['hosted-release-strict', 'verify:release:strict', { GIAOAN_REQUIRE_HOSTED_URL: '1' }],
  ['visual-smoke-evidence', 'visual:smoke:evidence-validate', {}],
  ['p0-100-release', 'verify:p0-100-release', {}]
]) {
  const item = await run(id, script, env);
  if (item.status !== 'PASS') {
    const out = write(true);
    console.error(JSON.stringify({ ok: false, artifactPath, reason: `${id} ${item.status}`, summary: out.summary }, null, 2));
    process.exit(1);
  }
}
const out = write(true);
console.log(JSON.stringify({ ok: out.ok, artifactPath, summary: out.summary }, null, 2));
process.exit(out.ok ? 0 : 1);
