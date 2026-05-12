import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const lock = fs.existsSync('package-lock.json') ? fs.readFileSync('package-lock.json', 'utf8') : '';
const internal = (lock.match(/packages\.applied-caas-gateway1\.internal\.api\.openai\.org/g) || []).length;
const credentialed = (lock.match(/https:\/\/[^/\s"]+:[^@\s"]+@/g) || []).length;
if (internal || credentialed) {
  console.error(JSON.stringify({
    ok: false,
    error: 'lockfile_registry_not_public',
    internal,
    credentialed,
    message: 'Run npm run lockfile:public-registry first; do not install from credentialed/internal lockfile URLs.'
  }, null, 2));
  process.exit(1);
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'giao-an-npm-'));
const userconfig = path.join(dir, 'npmrc');
fs.writeFileSync(userconfig, [
  'registry=https://registry.npmjs.org/',
  'audit=false',
  'fund=false',
  'progress=false',
  'fetch-retries=1',
  'fetch-timeout=30000',
  'fetch-retry-mintimeout=5000',
  'fetch-retry-maxtimeout=15000',
  ''
].join('\n'));

const env = { ...process.env };
for (const key of ['NPM_CONFIG_REGISTRY','NPM_CONFIG_USERCONFIG','npm_config_registry','npm_config_userconfig']) delete env[key];
env.NPM_CONFIG_USERCONFIG = userconfig;
env.npm_config_userconfig = userconfig;
env.npm_config_registry = 'https://registry.npmjs.org/';
env.npm_config_always_auth = 'false';
env.npm_config_fetch_retries = '1';
env.npm_config_fetch_timeout = '30000';

const timeoutMs = Number(process.env.GIAOAN_NPM_CI_TIMEOUT_MS || 180_000);
const args = ['ci', '--ignore-scripts', '--no-audit', '--no-fund', ...process.argv.slice(2)];
console.log(JSON.stringify({
  ok: true,
  action: 'npm_clean_ci_start',
  command: `npm ${args.join(' ')}`,
  userconfig,
  registry: env.npm_config_registry,
  timeoutMs,
  note: 'Optional dependencies are intentionally not omitted; Next SWC may require them for real build.'
}, null, 2));

// Batch96 timeout hard-exit: do not wait forever for npm/network child processes after timeout.
const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', args, { stdio: 'inherit', env });
let finished = false;
const timer = setTimeout(() => {
  if (finished) return;
  console.error(JSON.stringify({
    ok: false,
    error: 'npm_ci_timeout',
    timeoutMs,
    message: 'npm ci did not finish. This is usually network/DNS/registry access, not a pass. Re-run on target machine or CI with public registry access.'
  }, null, 2));
  child.kill('SIGTERM');
  setTimeout(() => {
    try { child.kill('SIGKILL'); } catch {}
    if (!finished) process.exit(1);
  }, 5000).unref();
}, timeoutMs);

child.on('exit', (code, signal) => {
  finished = true;
  clearTimeout(timer);
  if (signal) process.exit(1);
  process.exit(code ?? 1);
});
