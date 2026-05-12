import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const out = process.env.GIAOAN_RUNTIME_DEPLOY_CLOSURE_REPORT || 'artifacts/runtime-deploy-closure-last-run.json';
function exists(file) { return fs.existsSync(file); }
function readJson(file, fallback = null) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; } }
function expectedSwcPackage() {
  const platform = os.platform();
  const arch = os.arch();
  if (platform === 'linux' && arch === 'x64') return 'node_modules/@next/swc-linux-x64-gnu';
  if (platform === 'linux' && arch === 'arm64') return 'node_modules/@next/swc-linux-arm64-gnu';
  if (platform === 'darwin' && arch === 'x64') return 'node_modules/@next/swc-darwin-x64';
  if (platform === 'darwin' && arch === 'arm64') return 'node_modules/@next/swc-darwin-arm64';
  if (platform === 'win32' && arch === 'x64') return 'node_modules/@next/swc-win32-x64-msvc';
  if (platform === 'win32' && arch === 'arm64') return 'node_modules/@next/swc-win32-arm64-msvc';
  return null;
}
const pkg = readJson('package.json', {});
const runtime = readJson('artifacts/runtime-closure-report-last-run.json', null);
const hosted = readJson('artifacts/hosted-demo-url-smoke-last-run.json', null);
const swc = expectedSwcPackage();
const nextBin = process.platform === 'win32' ? 'node_modules/.bin/next.cmd' : 'node_modules/.bin/next';
const dependencyState = {
  nodeModules: exists('node_modules'),
  nextBinary: exists(nextBin),
  expectedSwcPackage: swc,
  expectedSwcPresent: swc ? exists(swc) : false,
  nextBuildId: exists('.next/BUILD_ID')
};
const evidenceSteps = [
  { id: 'registry_diagnose', command: 'npm run registry:diagnose', ok: Boolean((runtime?.commands || []).find((c) => c.label === 'registry_diagnose')?.ok), artifact: 'artifacts/runtime-closure-report-last-run.json' },
  { id: 'install_clean', command: 'npm run install:clean', ok: dependencyState.nextBinary && dependencyState.expectedSwcPresent, artifact: 'node_modules + expected Next SWC' },
  { id: 'next_swc_ready', command: 'npm run next:swc-ready', ok: dependencyState.nextBinary && dependencyState.expectedSwcPresent, artifact: nextBin },
  { id: 'build_clean', command: 'npm run build:clean', ok: dependencyState.nextBuildId, artifact: '.next/BUILD_ID' },
  { id: 'runtime_closure_report', command: 'npm run runtime:closure-report', ok: Boolean(runtime?.ok), artifact: 'artifacts/runtime-closure-report-last-run.json' },
  { id: 'hosted_url_smoke', command: 'GIAOAN_DEMO_URL=https://... npm run hosted:url-smoke', ok: Boolean((hosted?.ok && !hosted?.skipped) || hosted?.status === 'pass'), artifact: 'artifacts/hosted-demo-url-smoke-last-run.json' }
];
const hardBlockers = evidenceSteps.filter((step) => !step.ok && step.id !== 'hosted_url_smoke');
const hostedBlockers = evidenceSteps.filter((step) => !step.ok && step.id === 'hosted_url_smoke');
const ok = hardBlockers.length === 0 && hostedBlockers.length === 0;
const report = {
  ok,
  batch: 'Batch105 — Runtime/Hosted Closure Breakthrough',
  version: pkg.version || 'unknown',
  generatedAt: new Date().toISOString(),
  nodeVersion: process.version,
  platform: os.platform(),
  arch: os.arch(),
  dependencyState,
  evidenceSteps,
  hardBlockers,
  hostedBlockers,
  claimAllowed: {
    sourceLevelRuntimeGate: true,
    dependencyInstalled: dependencyState.nextBinary && dependencyState.expectedSwcPresent,
    buildPass: dependencyState.nextBuildId,
    hostedPass: hostedBlockers.length === 0,
    teacherSmallGroupTest: ok,
    productionReady: false
  },
  message: ok
    ? 'Runtime/hosted evidence chain is green enough for a controlled teacher test candidate, still not production-ready.'
    : 'Runtime/hosted evidence chain is not green. Do not claim build/deploy/hosted pass; follow hardBlockers in order.',
  nextCommands: [
    'npm run registry:diagnose',
    'npm run install:clean',
    'npm run next:swc-ready',
    'npm run build:clean',
    'GIAOAN_SMOKE_MODE=production npm run live:smoke:clean',
    'npm run auth-invite:runtime-smoke',
    'GIAOAN_DEMO_URL=https://... npm run hosted:url-smoke'
  ]
};
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
process.exit(0);
