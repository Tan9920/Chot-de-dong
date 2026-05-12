import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const root = process.cwd();
const artifactsDir = path.join(root, 'artifacts');
fs.mkdirSync(artifactsDir, { recursive: true });
const timeoutMs = Number(process.env.GIAOAN_RAW_BUILD_TIMEOUT_MS || 180000);
const startedAt = new Date().toISOString();
const output = [];
let lastPhase = 'not_started';
let finalized = false;
let timeoutTriggered = false;
let child = null;
let timer = null;
let lastArtifactWriteMs = 0;

function cleanNextBuildOutput() {
  if (process.env.GIAOAN_RAW_BUILD_PRESERVE_NEXT === '1') {
    return { ok: true, outputDir: '.next', removed: false, reason: 'GIAOAN_RAW_BUILD_PRESERVE_NEXT=1' };
  }
  try {
    fs.rmSync(path.join(root, '.next'), { recursive: true, force: true });
    return { ok: true, outputDir: '.next', removed: true, reason: 'removed stale .next before raw build so route/page data evidence belongs to the current run' };
  } catch (error) {
    return { ok: false, outputDir: '.next', removed: false, error: error.message };
  }
}

const buildOutputCleanup = cleanNextBuildOutput();

function nextArtifactSnapshot() {
  return {
    nextBuildIdExists: fs.existsSync(path.join(root, '.next', 'BUILD_ID')),
    requiredServerFilesExists: fs.existsSync(path.join(root, '.next', 'required-server-files.json')),
    routesManifestExists: fs.existsSync(path.join(root, '.next', 'routes-manifest.json')),
    prerenderManifestExists: fs.existsSync(path.join(root, '.next', 'prerender-manifest.json')),
    appBuildManifestExists: fs.existsSync(path.join(root, '.next', 'app-build-manifest.json'))
  };
}

function writeReport(rawNextBuildExitCode, status, extra = {}) {
  const tail = output.join('').slice(-8000);
  const report = {
    ok: rawNextBuildExitCode === 0,
    batch: 'Batch144 — P0/P1 Local Build Closure',
    startedAt,
    finishedAt: new Date().toISOString(),
    timeoutMs,
    buildCanExceedInteractiveToolWindow: true,
    status,
    buildOutputCleanup,
    rawNextBuildExitCode,
    detectedPhase: lastPhase,
    ...nextArtifactSnapshot(),
    tail,
    noProductionReadyClaim: rawNextBuildExitCode !== 0,
    noAiPaymentVerifiedFakeAdded: true,
    ...extra
  };
  fs.writeFileSync(path.join(artifactsDir, 'raw-next-build-diagnostic-last-run.json'), JSON.stringify(report, null, 2) + '\n');
  return report;
}

function maybeWriteRunningArtifact() {
  const now = Date.now();
  if (now - lastArtifactWriteMs < 5000 || finalized) return;
  lastArtifactWriteMs = now;
  writeReport(125, 'diagnostic_running_not_finished_yet', { running: true, timeoutTriggered: false });
}

function push(chunk) {
  const text = String(chunk || '');
  output.push(text);
  const joined = output.join('').slice(-12000);
  if (joined.includes('Creating an optimized production build')) lastPhase = 'creating_optimized_production_build';
  if (joined.includes('Compiled successfully')) lastPhase = 'compiled_successfully';
  if (joined.includes('Collecting page data')) lastPhase = 'collecting_page_data';
  if (joined.includes('Generating static pages')) lastPhase = 'generating_static_pages';
  if (joined.includes('Finalizing page optimization')) lastPhase = 'finalizing_page_optimization';
  if (joined.includes('Collecting build traces')) lastPhase = 'collecting_build_traces';
  maybeWriteRunningArtifact();
}

function killChild(signal = 'SIGTERM') {
  try {
    if (child && child.exitCode === null && !child.killed) child.kill(signal);
  } catch {}
}

function finalize(rawNextBuildExitCode, status, extra = {}) {
  if (finalized) return null;
  finalized = true;
  if (timer) clearTimeout(timer);
  const report = writeReport(rawNextBuildExitCode, status, { running: false, timeoutTriggered, ...extra });
  console.log(JSON.stringify({ ok: report.ok, rawNextBuildExitCode: report.rawNextBuildExitCode, detectedPhase: report.detectedPhase, artifact: 'artifacts/raw-next-build-diagnostic-last-run.json' }, null, 2));
  return report;
}

function handleExternalSignal(signal) {
  timeoutTriggered = false;
  const report = finalize(123, `interrupted_by_${signal.toLowerCase()}`, { signal, interrupted: true });
  killChild('SIGTERM');
  setTimeout(() => killChild('SIGKILL'), 2500).unref();
  console.error(JSON.stringify({ ok: false, diagnostic: report?.status, detectedPhase: report?.detectedPhase, warning: 'Raw build diagnostic was interrupted. Do not claim raw build closure from a running/stale artifact.' }, null, 2));
  process.exit(123);
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => handleExternalSignal(signal));
}

const nextBin = process.platform === 'win32' ? path.join(root, 'node_modules', '.bin', 'next.cmd') : path.join(root, 'node_modules', '.bin', 'next');
child = spawn(nextBin, ['build'], {
  cwd: root,
  env: { ...process.env, CI: '1', NEXT_TELEMETRY_DISABLED: '1', GIAOAN_RAW_BUILD_CACHE_CLEANED: '1' },
  shell: false,
  detached: false
});

writeReport(125, 'diagnostic_started_not_finished_yet', { running: true, timeoutTriggered: false });
child.stdout.on('data', (chunk) => { process.stdout.write(chunk); push(chunk); });
child.stderr.on('data', (chunk) => { process.stderr.write(chunk); push(chunk); });
child.on('error', (error) => {
  const report = finalize(127, 'raw_build_spawn_failed', { error: error.message, signal: null });
  console.error(JSON.stringify({ ok: false, diagnostic: report?.status, error: error.message }, null, 2));
  process.exit(127);
});

timer = setTimeout(() => {
  timeoutTriggered = true;
  const report = finalize(124, 'timeout_before_raw_build_exit_zero', { timeoutTriggered: true });
  killChild('SIGTERM');
  setTimeout(() => killChild('SIGKILL'), 2500).unref();
  console.error(JSON.stringify({ ok: false, diagnostic: report?.status, detectedPhase: report?.detectedPhase, warning: 'Raw build did not exit 0 inside diagnostic timeout. Do not claim raw build closure.' }, null, 2));
  setTimeout(() => process.exit(124), 3000).unref();
}, timeoutMs);

child.on('exit', (code, signal) => {
  const exitCode = typeof code === 'number' ? code : (signal ? 128 : 1);
  const report = finalize(exitCode, exitCode === 0 ? 'raw_build_exit_zero' : 'raw_build_failed', { signal: signal || null });
  process.exit(report?.rawNextBuildExitCode ?? exitCode);
});
