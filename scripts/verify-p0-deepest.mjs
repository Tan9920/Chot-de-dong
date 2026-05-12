import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const artifact = 'artifacts/verify-p0-deepest-last-run.json';
const timeout = Number(process.env.GIAOAN_VERIFY_P0_DEEPEST_STEP_TIMEOUT_MS || 240_000);
const startedAt = new Date().toISOString();
const results = [];
const requireNode24 = process.env.GIAOAN_REQUIRE_NODE24 === '1';
const requireCiProvenance = process.env.GIAOAN_REQUIRE_CI_PROVENANCE === '1';
function ciProvenance() {
  return {
    required: requireCiProvenance,
    githubActions: process.env.GITHUB_ACTIONS === 'true',
    githubWorkflow: process.env.GITHUB_WORKFLOW || '',
    githubRunId: process.env.GITHUB_RUN_ID || '',
    githubJob: process.env.GITHUB_JOB || '',
    githubRef: process.env.GITHUB_REF || '',
    githubSha: process.env.GITHUB_SHA || '',
    runnerOS: process.env.RUNNER_OS || '',
    ci: process.env.CI || ''
  };
}
function write(final = false) {
  const failed = results.filter((i) => i.status === 'FAIL' || i.status === 'TIMEOUT').length;
  const out = {
    ok: final ? failed === 0 : false,
    generatedAt: new Date().toISOString(),
    startedAt,
    command: 'verify:p0-deepest',
    nodeVersion: process.versions.node,
    requireNode24,
    requireCiProvenance,
    ciProvenance: ciProvenance(),
    summary: { total: results.length, passed: results.filter((i) => i.status === 'PASS').length, skipped: results.filter((i) => i.status === 'SKIP').length, failed },
    results,
    note: 'Batch142-hardened deepest P0 verifier. Node24 CI proof now requires explicit GitHub Actions provenance when GIAOAN_REQUIRE_CI_PROVENANCE=1, so a local Node24 run cannot be misread as CI/Vercel evidence.'
  };
  fs.mkdirSync(path.dirname(artifact), { recursive: true });
  fs.writeFileSync(artifact, JSON.stringify(out, null, 2) + '\n');
  return out;
}
function run(id, command, args, env = {}) {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], shell: process.platform === 'win32', env: { ...process.env, ...env } });
    let output = '';
    child.stdout.on('data', (d) => { output += String(d); if (output.length > 12000) output = output.slice(-12000); });
    child.stderr.on('data', (d) => { output += String(d); if (output.length > 12000) output = output.slice(-12000); });
    let timedOut = false;
    const heartbeat = setInterval(() => console.log(`[verify:p0-deepest] running ${id} ${Math.round((Date.now() - started) / 1000)}s`), Number(process.env.GIAOAN_VERIFY_P0_DEEPEST_HEARTBEAT_MS || 5000));
    heartbeat.unref?.();
    const timer = setTimeout(() => {
      timedOut = true;
      try { child.kill('SIGTERM'); } catch {}
      setTimeout(() => { try { child.kill('SIGKILL'); } catch {} }, 3000).unref?.();
    }, timeout);
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      clearInterval(heartbeat);
      const item = { id, command: [command, ...args].join(' '), status: timedOut ? 'TIMEOUT' : (code === 0 ? 'PASS' : 'FAIL'), exitCode: code, signal: signal || null, durationMs: Date.now() - started, finishedAt: new Date().toISOString(), tail: output.slice(-4000) };
      if (item.status !== 'PASS') console.error(item.tail || `[verify:p0-deepest] ${id} produced no output`);
      results.push(item);
      console.log(`[verify:p0-deepest] ${item.status} ${id}`);
      write();
      resolve(item);
    });
  });
}
async function must(id, command, args, env = {}) {
  const item = await run(id, command, args, env);
  if (item.status !== 'PASS') {
    const out = write(true);
    console.error(JSON.stringify({ ok: false, artifact, reason: `${id} ${item.status}`, summary: out.summary }, null, 2));
    process.exit(1);
  }
}
if (requireNode24 && Number(process.versions.node.split('.')[0]) !== 24) {
  results.push({ id: 'node24-runtime-preflight', command: 'node -v', status: 'FAIL', exitCode: 1, signal: null, durationMs: 0, finishedAt: new Date().toISOString(), reason: `GIAOAN_REQUIRE_NODE24=1 requires Node 24.x, got ${process.versions.node}` });
  const out = write(true);
  console.error(JSON.stringify({ ok: false, artifact, reason: results.at(-1).reason, summary: out.summary }, null, 2));
  process.exit(1);
}
if (requireCiProvenance && process.env.GITHUB_ACTIONS !== 'true') {
  results.push({
    id: 'ci-provenance-preflight',
    command: 'GITHUB_ACTIONS=true GITHUB_RUN_ID=<id> npm run verify:p0-deepest-node24-ci',
    status: 'FAIL',
    exitCode: 1,
    signal: null,
    durationMs: 0,
    finishedAt: new Date().toISOString(),
    reason: 'GIAOAN_REQUIRE_CI_PROVENANCE=1 requires GitHub Actions provenance. Local Node24 runs are useful but cannot satisfy CI/Vercel proof.'
  });
  const out = write(true);
  console.error(JSON.stringify({ ok: false, artifact, reason: results.at(-1).reason, ciProvenance: ciProvenance(), summary: out.summary }, null, 2));
  process.exit(1);
}
await must('source-validate', 'npm', ['run', 'source:validate']);
await must('data-validate', 'npm', ['run', 'data:validate']);
await must('batch129-responsive-contract', 'npm', ['run', 'runtime:p0-responsive-contract-validate']);
await must('batch129-source-gate', 'npm', ['run', 'runtime:p0-deepest-closure-validate']);
await must('typecheck', 'npm', ['run', 'typecheck']);
await must('next-swc-ready', 'npm', ['run', 'next:swc-ready']);
await must('prebuild-clean-stale-artifacts', 'npm', ['run', 'runtime:p0-prebuild-clean']);
await must('controlled-startable-build', 'npm', ['run', 'build'], {
  GIAOAN_BUILD_TRACE_GRACE_MS: process.env.GIAOAN_BUILD_TRACE_GRACE_MS || '0',
  GIAOAN_BUILD_ARTIFACT_READY_GRACE_MS: process.env.GIAOAN_BUILD_ARTIFACT_READY_GRACE_MS || '0',
  GIAOAN_BUILD_PROGRESS_LOG_MS: process.env.GIAOAN_BUILD_PROGRESS_LOG_MS || '1000'
});
await must('production-live-smoke', 'npm', ['run', 'live:smoke:clean'], { GIAOAN_SMOKE_MODE: 'production' });
await must('auth-invite-runtime-smoke', 'npm', ['run', 'auth-invite:runtime-smoke']);
await must('loopback-hosted-route-smoke', 'npm', ['run', 'runtime:p0-loopback-url-smoke']);
await must('deepest-closure-report', 'npm', ['run', 'runtime:p0-deepest-closure-report']);
const out = write(true);
console.log(JSON.stringify({ ok: out.ok, artifact, summary: out.summary }, null, 2));
process.exit(out.ok ? 0 : 1);
