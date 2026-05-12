import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const cmd = process.argv.slice(2);
if (!cmd.length) {
  console.error(JSON.stringify({ ok: false, error: 'missing_command' }, null, 2));
  process.exit(1);
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'giao-an-npmcmd-'));
const userconfig = path.join(dir, 'npmrc');
fs.writeFileSync(userconfig, [
  'registry=https://registry.npmjs.org/',
  'audit=false',
  'fund=false',
  'progress=false',
  'fetch-retries=1',
  'fetch-timeout=30000',
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

const timeoutMs = Number(process.env.GIAOAN_NPM_COMMAND_TIMEOUT_MS || 180_000);
console.log(JSON.stringify({ ok: true, action: 'clean_npm_command_start', command: cmd, userconfig, registry: env.npm_config_registry, timeoutMs, detachedKillTree: process.platform !== 'win32' }, null, 2));

const child = spawn(cmd[0], cmd.slice(1), {
  stdio: 'inherit',
  env,
  shell: process.platform === 'win32',
  detached: process.platform !== 'win32'
});
let finished = false;
function killTree(signal = 'SIGTERM') {
  try {
    if (process.platform !== 'win32') process.kill(-child.pid, signal);
    else child.kill(signal);
  } catch {
    try { child.kill(signal); } catch {}
  }
}
const timer = setTimeout(() => {
  if (finished) return;
  console.error(JSON.stringify({ ok: false, error: 'clean_npm_command_timeout', command: cmd, timeoutMs }, null, 2));
  killTree('SIGTERM');
  setTimeout(() => {
    if (!finished) killTree('SIGKILL');
    if (!finished) process.exit(1);
  }, 5000).unref();
}, timeoutMs);
child.on('exit', (code, signal) => {
  finished = true;
  clearTimeout(timer);
  if (signal) process.exit(1);
  process.exit(code ?? 1);
});
