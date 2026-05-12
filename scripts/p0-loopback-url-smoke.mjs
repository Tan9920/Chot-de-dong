import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';

const root = process.cwd();
const artifactPath = 'artifacts/p0-loopback-url-smoke-last-run.json';
const timeoutMs = Number(process.env.GIAOAN_P0_LOOPBACK_TIMEOUT_MS || 240_000);
const readinessTimeoutMs = Number(process.env.GIAOAN_P0_LOOPBACK_READY_TIMEOUT_MS || 45_000);
const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next');

function writeArtifact(result) {
  fs.mkdirSync(path.dirname(path.join(root, artifactPath)), { recursive: true });
  fs.writeFileSync(path.join(root, artifactPath), `${JSON.stringify(result, null, 2)}\n`);
  return result;
}
function finish(result, exitCode) {
  const withMeta = { ...result, generatedAt: new Date().toISOString(), artifactPath, nodeVersion: process.versions.node };
  writeArtifact(withMeta);
  console[exitCode === 0 ? 'log' : 'error'](JSON.stringify(withMeta, null, 2));
  process.exit(exitCode);
}
if (!fs.existsSync(nextBin)) {
  finish({ ok: false, error: 'next_bin_missing', message: 'Run npm ci before loopback URL smoke.', noAiPaymentVerifiedFakeAdded: true }, 2);
}
if (!fs.existsSync(path.join(root, '.next', 'BUILD_ID'))) {
  finish({ ok: false, error: 'missing_next_build_output', message: 'Run strict build before loopback URL smoke.', noAiPaymentVerifiedFakeAdded: true }, 2);
}

async function findFreePort(preferred) {
  function tryPort(port) {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.unref();
      server.on('error', () => resolve(false));
      server.listen({ port, host: '127.0.0.1' }, () => {
        const actual = server.address()?.port || port;
        server.close(() => resolve(actual));
      });
    });
  }
  const preferredResult = await tryPort(preferred);
  if (preferredResult) return preferredResult;
  for (let port = 3210; port < 3310; port += 1) {
    const result = await tryPort(port);
    if (result) return result;
  }
  return await tryPort(0);
}
function wait(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
async function waitForHealth(base) {
  const started = Date.now();
  let lastError = '';
  while (Date.now() - started < readinessTimeoutMs) {
    try {
      const res = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) return { ok: true, durationMs: Date.now() - started };
      lastError = `status_${res.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await wait(650);
  }
  return { ok: false, durationMs: Date.now() - started, lastError };
}
function killTree(child, signal = 'SIGTERM') {
  try {
    if (process.platform !== 'win32') process.kill(-child.pid, signal);
    else child.kill(signal);
  } catch {
    try { child.kill(signal); } catch {}
  }
}

const port = Number(await findFreePort(Number(process.env.PORT || 3200)));
const base = `http://localhost:${port}`;
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'giao-an-p0-loopback-data-'));
for (const file of ['auth-accounts.json','auth-sessions.json','memberships.json','membership-invites.json','saved-lessons.json','saved-lesson-versions.json','security-audit-events.json','usage-ledger.json']) {
  fs.writeFileSync(path.join(dataDir, file), '[]\n', 'utf8');
}
const env = {
  ...process.env,
  NEXT_PUBLIC_DEMO_MODE: 'true',
  GIAOAN_DEMO_MODE: 'true',
  GIAOAN_ALLOW_DEMO_LOGIN: 'false',
  GIAOAN_PUBLIC_TEST_MODE: 'limited',
  GIAOAN_DATA_DIR: dataDir,
  NEXT_TELEMETRY_DISABLED: '1',
  PORT: String(port)
};
for (const key of ['NPM_CONFIG_REGISTRY','NPM_CONFIG_USERCONFIG','npm_config_registry','npm_config_userconfig']) delete env[key];
env.npm_config_registry = 'https://registry.npmjs.org/';
env.npm_config_always_auth = 'false';

const startedAt = Date.now();
const child = spawn(process.execPath, [nextBin, 'start', '--hostname', '127.0.0.1', '--port', String(port)], {
  cwd: root,
  stdio: ['ignore', 'pipe', 'pipe'],
  env,
  detached: process.platform !== 'win32'
});
let logs = '';
child.stdout.on('data', (d) => { logs += String(d); });
child.stderr.on('data', (d) => { logs += String(d); });
let finished = false;
const hardTimer = setTimeout(() => {
  if (finished) return;
  finished = true;
  killTree(child, 'SIGTERM');
  setTimeout(() => killTree(child, 'SIGKILL'), 1000).unref?.();
  finish({ ok: false, error: 'p0_loopback_timeout', timeoutMs, base, dataDir, logs: logs.slice(-5000), noAiPaymentVerifiedFakeAdded: true }, 124);
}, timeoutMs);

try {
  const ready = await waitForHealth(base);
  if (!ready.ok) {
    throw new Error(`server_not_ready: ${ready.lastError || 'unknown'}; logs=${logs.slice(-2500)}`);
  }
  const childEnv = {
    ...env,
    GIAOAN_HOSTED_URL_SMOKE_ARTIFACT: 'artifacts/p0-loopback-hosted-url-smoke-last-run.json',
    GIAOAN_HOSTED_URL_SMOKE_TIMEOUT_MS: process.env.GIAOAN_HOSTED_URL_SMOKE_TIMEOUT_MS || '18000'
  };
  const smoke = spawn(process.execPath, ['scripts/hosted-demo-url-smoke.mjs', base], {
    cwd: root,
    stdio: 'inherit',
    env: childEnv
  });
  const smokeResult = await new Promise((resolve) => smoke.on('close', (code, signal) => resolve({ code, signal: signal || null })));
  const hostedArtifact = JSON.parse(fs.readFileSync(path.join(root, 'artifacts/p0-loopback-hosted-url-smoke-last-run.json'), 'utf8'));
  if (smokeResult.code !== 0 || !hostedArtifact.ok) {
    throw new Error(`loopback_hosted_url_smoke_failed code=${smokeResult.code} signal=${smokeResult.signal || 'none'}`);
  }
  const result = {
    ok: true,
    base,
    dataDir,
    elapsedMs: Date.now() - startedAt,
    serverReadyMs: ready.durationMs,
    hostedArtifactPath: 'artifacts/p0-loopback-hosted-url-smoke-last-run.json',
    hostedSummary: hostedArtifact.summary || null,
    checkedRoutes: Array.isArray(hostedArtifact.checks) ? hostedArtifact.checks.map((c) => c.route).filter(Boolean) : [],
    note: 'Batch128 loopback URL smoke starts next start from the current .next build and reuses the strict hosted URL smoke suite against localhost. This is stronger local route parity evidence, not a substitute for real Vercel APP_URL proof.',
    noAiPaymentVerifiedFakeAdded: true
  };
  finished = true;
  clearTimeout(hardTimer);
  killTree(child, 'SIGTERM');
  setTimeout(() => killTree(child, 'SIGKILL'), 500).unref?.();
  finish(result, 0);
} catch (error) {
  finished = true;
  clearTimeout(hardTimer);
  killTree(child, 'SIGTERM');
  setTimeout(() => killTree(child, 'SIGKILL'), 500).unref?.();
  finish({ ok: false, error: 'p0_loopback_url_smoke_failed', message: error instanceof Error ? error.message : String(error), base, dataDir, logs: logs.slice(-5000), noAiPaymentVerifiedFakeAdded: true }, 1);
}
