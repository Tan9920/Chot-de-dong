import { spawn } from 'node:child_process';
import { performance } from 'node:perf_hooks';

const registryHost = 'registry.npmjs.org';
const registryUrl = 'https://registry.npmjs.org/-/ping?write=false';
const timeoutMs = Number(process.env.GIAOAN_REGISTRY_TIMEOUT_MS || 8000);

function runNodeProbe(name, code) {
  return new Promise((resolve) => {
    const start = performance.now();
    const child = spawn(process.execPath, ['--input-type=module', '-e', code], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, GIAOAN_REGISTRY_TIMEOUT_MS: String(timeoutMs) }
    });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      resolve({ name, ok: false, error: `${name}_timeout_after_${timeoutMs}ms`, durationMs: Math.round(performance.now() - start) });
    }, timeoutMs);
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('exit', (code) => {
      clearTimeout(timer);
      try {
        const parsed = JSON.parse(stdout.trim() || '{}');
        resolve({ name, ...parsed, durationMs: Math.round(performance.now() - start) });
      } catch {
        resolve({ name, ok: code === 0, stdout: stdout.slice(0, 200), stderr: stderr.slice(0, 200), durationMs: Math.round(performance.now() - start) });
      }
    });
  });
}

const dnsCode = `
import dns from 'node:dns/promises';
const host = ${JSON.stringify(registryHost)};
try {
  const addresses = await dns.lookup(host, { all: true });
  console.log(JSON.stringify({ ok: true, addresses: addresses.map((item) => item.address).slice(0, 5) }));
} catch (error) {
  console.log(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }));
}
`;

const fetchCode = `
const url = ${JSON.stringify(registryUrl)};
const timeoutMs = Number(process.env.GIAOAN_REGISTRY_TIMEOUT_MS || 8000);
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), timeoutMs - 250);
try {
  const response = await fetch(url, { method: 'GET', signal: controller.signal, headers: { accept: 'application/json' } });
  const text = await response.text();
  console.log(JSON.stringify({ ok: response.ok, status: response.status, bodyPreview: text.slice(0, 120) }));
} catch (error) {
  console.log(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }));
} finally {
  clearTimeout(timer);
}
`;

const checks = [
  await runNodeProbe('dns_lookup', dnsCode),
  await runNodeProbe('registry_fetch', fetchCode)
];
const ok = checks.every((check) => check.ok);
const report = {
  ok,
  registryHost,
  registryUrl,
  timeoutMs,
  checks,
  remediation: [
    'Kiểm tra DNS/internet của máy hoặc CI.',
    'Chạy npm run lockfile:public-registry trước khi install.',
    'Đảm bảo không có NPM_CONFIG_REGISTRY dạng credential/protected khi chạy npm trực tiếp.',
    'Ưu tiên npm run install:clean vì script này tự cô lập npm userconfig public registry.'
  ],
  message: ok
    ? 'Public npm registry is reachable from this environment.'
    : 'Public npm registry is not fully reachable; dependency install/build closure cannot be claimed here. Batch96 registry probe is process-isolated and fails fast instead of hanging on DNS.'
};
console.log(JSON.stringify(report, null, 2));
process.exit(ok ? 0 : 1);
