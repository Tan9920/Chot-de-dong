import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function exists(file) { return fs.existsSync(path.join(process.cwd(), file)); }
function readJson(file, fallback = null) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; } }
function platformSwcPackage() {
  const platform = os.platform(); const arch = os.arch();
  if (platform === 'linux' && arch === 'x64') return 'node_modules/@next/swc-linux-x64-gnu';
  if (platform === 'linux' && arch === 'arm64') return 'node_modules/@next/swc-linux-arm64-gnu';
  if (platform === 'darwin' && arch === 'x64') return 'node_modules/@next/swc-darwin-x64';
  if (platform === 'darwin' && arch === 'arm64') return 'node_modules/@next/swc-darwin-arm64';
  if (platform === 'win32' && arch === 'x64') return 'node_modules/@next/swc-win32-x64-msvc';
  if (platform === 'win32' && arch === 'arm64') return 'node_modules/@next/swc-win32-arm64-msvc';
  return null;
}
function artifactOk(file) { const artifact = readJson(file, {}); return Boolean(artifact?.ok && !artifact?.skipped); }
function gate(id, command, ok, evidence, blocksTeacherTest = true) { return { id, command, ok, state: ok ? 'pass' : 'unverified_or_blocked', evidence, blocksTeacherTest }; }
const pkg = readJson('package.json', {});
const plan = readJson('data/runtime-hosted-closure-evidence.json', {});
const nextBin = process.platform === 'win32' ? 'node_modules/.bin/next.cmd' : 'node_modules/.bin/next';
const swc = platformSwcPackage();
const runtimeOk = artifactOk('artifacts/runtime-closure-report-last-run.json');
const hostedOk = artifactOk('artifacts/hosted-demo-url-smoke-last-run.json');
const gates = [
  gate('registry_diagnose', 'npm run registry:diagnose', false, 'requires fresh command output ok=true'),
  gate('install_clean', 'npm run install:clean', exists('node_modules') && exists(nextBin), `node_modules=${exists('node_modules')}; next=${exists(nextBin)}`),
  gate('next_swc_ready', 'npm run next:swc-ready', exists(nextBin) && Boolean(swc && exists(swc)), `next=${exists(nextBin)}; swc=${Boolean(swc && exists(swc))}`),
  gate('build_clean', 'npm run build:clean', exists('.next/BUILD_ID'), `.next/BUILD_ID=${exists('.next/BUILD_ID')}`),
  gate('live_smoke_clean', 'GIAOAN_SMOKE_MODE=production npm run live:smoke:clean', runtimeOk, `runtime artifact ok=${runtimeOk}`),
  gate('auth_invite_runtime_smoke', 'npm run auth-invite:runtime-smoke', false, 'requires fresh auth invite runtime smoke output'),
  gate('hosted_url_smoke', 'GIAOAN_DEMO_URL=https://... npm run hosted:url-smoke', hostedOk, `hosted artifact ok=${hostedOk}`),
  gate('browser_qa_mobile_desktop', 'manual QA screenshots/logs', false, 'manual QA not attached', false)
];
const missingRequired = gates.filter((item) => item.blocksTeacherTest && !item.ok);
const report = {
  ok: missingRequired.length === 0,
  batch: 'Batch106 — Real Hosted Runtime Closure / Vercel Log Fix',
  version: pkg.version || 'unknown',
  generatedAt: new Date().toISOString(),
  nodeVersion: process.version,
  platform: os.platform(),
  arch: os.arch(),
  planVersion: plan.version || 'batch106-real-hosted-runtime-closure',
  gates,
  missingRequired,
  claimAllowed: {
    sourceLevelHostedRuntimeGate: true,
    buildPass: exists('.next/BUILD_ID'),
    runtimePass: runtimeOk,
    hostedPass: hostedOk,
    teacherSmallGroupTest: missingRequired.length === 0,
    productionReady: false
  },
  nextCommands: gates.filter((item) => !item.ok).map((item) => item.command),
  message: missingRequired.length === 0
    ? 'Minimum hosted runtime proof chain is green enough for controlled teacher-test consideration, not production-ready.'
    : 'Hosted runtime proof chain is not green. Do not claim build/runtime/hosted pass.'
};
fs.mkdirSync('artifacts', { recursive: true });
fs.writeFileSync('artifacts/runtime-hosted-closure-last-run.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
process.exit(0);
