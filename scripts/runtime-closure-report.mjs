import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const artifactPath = process.env.GIAOAN_RUNTIME_CLOSURE_REPORT || 'artifacts/runtime-closure-report-last-run.json';
const timeoutMs = Number(process.env.GIAOAN_RUNTIME_CLOSURE_REPORT_TIMEOUT_MS || 20_000);
function exists(p) { return fs.existsSync(p); }
function expectedSwcPackage() {
  const platform = os.platform();
  const arch = os.arch();
  if (platform === 'linux' && arch === 'x64') return 'node_modules/@next/swc-linux-x64-gnu';
  if (platform === 'linux' && arch === 'arm64') return 'node_modules/@next/swc-linux-arm64-gnu';
  if (platform === 'darwin' && arch === 'x64') return 'node_modules/@next/swc-darwin-x64';
  if (platform === 'darwin' && arch === 'arm64') return 'node_modules/@next/swc-darwin-arm64';
  if (process.platform === 'win32' && arch === 'x64') return 'node_modules/@next/swc-win32-x64-msvc';
  if (process.platform === 'win32' && arch === 'arm64') return 'node_modules/@next/swc-win32-arm64-msvc';
  return null;
}
function run(label, command, args = [], options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, ...(options.env || {}) }, shell: process.platform === 'win32' });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      setTimeout(() => { try { child.kill('SIGKILL'); } catch {} }, 2000).unref();
      resolve({ label, ok: false, status: null, timedOut: true, stdout: stdout.slice(-2000), stderr: stderr.slice(-2000) });
    }, options.timeoutMs || timeoutMs);
    child.stdout.on('data', (d) => { stdout += String(d); });
    child.stderr.on('data', (d) => { stderr += String(d); });
    child.on('exit', (code, signal) => {
      clearTimeout(timer);
      resolve({ label, ok: code === 0, status: code, signal, timedOut: false, stdout: stdout.slice(-3000), stderr: stderr.slice(-3000) });
    });
  });
}
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const swc = expectedSwcPackage();
const checks = {
  generatedAt: new Date().toISOString(),
  nodeVersion: process.version,
  platform: os.platform(),
  arch: os.arch(),
  dependencyState: {
    nodeModules: exists('node_modules'),
    nextBinary: exists(process.platform === 'win32' ? 'node_modules/.bin/next.cmd' : 'node_modules/.bin/next'),
    expectedSwcPackage: swc,
    expectedSwcPresent: swc ? exists(swc) : false,
    nextBuildId: exists('.next/BUILD_ID')
  },
  commands: []
};
checks.commands.push(await run('npm_diagnose', npmCmd, ['run', 'npm:diagnose'], { timeoutMs: 15_000 }));
checks.commands.push(await run('registry_diagnose', npmCmd, ['run', 'registry:diagnose'], { timeoutMs: 15_000, env: { GIAOAN_REGISTRY_TIMEOUT_MS: '5000' } }));
checks.commands.push(await run('next_swc_ready', npmCmd, ['run', 'next:swc-ready'], { timeoutMs: 10_000 }));
checks.commands.push(await run('source_smoke_batch105', npmCmd, ['run', 'smoke:batch105'], { timeoutMs: 120_000 }));
const runtimeReady = checks.dependencyState.nextBinary && checks.dependencyState.expectedSwcPresent && checks.dependencyState.nextBuildId;
const result = {
  ok: runtimeReady && checks.commands.find((c) => c.label === 'source_smoke_batch105')?.ok === true,
  ...checks,
  summary: {
    sourceSmokeBatch105Pass: checks.commands.find((c) => c.label === 'source_smoke_batch105')?.ok === true,
    registryReachable: checks.commands.find((c) => c.label === 'registry_diagnose')?.ok === true,
    dependencyInstalled: checks.dependencyState.nextBinary && checks.dependencyState.expectedSwcPresent,
    buildOutputPresent: checks.dependencyState.nextBuildId,
    runtimeReady,
    claimAllowed: runtimeReady ? 'Có thể tiếp tục chạy build/live/hosted smoke để chứng minh runtime.' : 'Chưa được claim runtime/build/deploy pass; cần npm run install:clean, next:swc-ready, build:clean và smoke thật.'
  },
  remediation: [
    'Chạy npm run registry:diagnose trên máy/CI có mạng ổn.',
    'Chạy npm run install:clean để cài đầy đủ optional dependencies cho Next SWC.',
    'Chạy npm run next:swc-ready trước khi build.',
    'Chạy npm run build:clean để tạo .next/BUILD_ID.',
    'Chạy GIAOAN_SMOKE_MODE=production npm run live:smoke:clean và npm run auth-invite:runtime-smoke.',
    'Sau deploy, chạy GIAOAN_DEMO_URL=https://... npm run hosted:url-smoke.'
  ]
};
fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
fs.writeFileSync(artifactPath, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
process.exit(0);
