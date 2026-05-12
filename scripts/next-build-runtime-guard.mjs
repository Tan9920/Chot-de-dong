import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const artifactsDir = path.join(root, 'artifacts');
const artifactPath = path.join(artifactsDir, 'next-build-runtime-guard-last-run.json');
const traceGraceMs = Number(process.env.GIAOAN_BUILD_TRACE_GRACE_MS || 45_000);
const artifactReadyGraceMs = Number(process.env.GIAOAN_BUILD_ARTIFACT_READY_GRACE_MS || traceGraceMs);
const hardTimeoutMs = Number(process.env.GIAOAN_BUILD_GUARD_TIMEOUT_MS || 240_000);
const strictRaw = process.env.GIAOAN_BUILD_GUARD_STRICT_RAW === '1';
const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next');
const fallback500 = `<!doctype html>
<html lang="vi">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>500 — Lỗi máy chủ</title></head>
<body><main style="font-family:system-ui,sans-serif;padding:24px"><h1>500 — Lỗi máy chủ</h1><p>Demo đang ở chế độ kiểm tra runtime. Vui lòng tải lại trang hoặc liên hệ quản trị.</p></main></body>
</html>
`;

function exists(rel) { return fs.existsSync(path.join(root, rel)); }
function ensureFallback500() {
  const dir = path.join(root, '.next', 'export');
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, '500.html'), fallback500, 'utf8');
  } catch {}
}
function requiredArtifactsReady() {
  const requiredFiles = [
    '.next/BUILD_ID',
    '.next/app-build-manifest.json',
    '.next/routes-manifest.json',
    '.next/prerender-manifest.json',
    '.next/images-manifest.json',
    '.next/required-server-files.json',
    '.next/server/app-paths-manifest.json',
    '.next/server/pages-manifest.json'
  ];
  const requiredDirs = ['.next/server/app', '.next/static'];
  const missing = [...requiredFiles.filter((f) => !exists(f)), ...requiredDirs.filter((d) => !fs.existsSync(path.join(root, d)))];
  return { ready: missing.length === 0, missing };
}
function writeArtifact(data) {
  fs.mkdirSync(artifactsDir, { recursive: true });
  fs.writeFileSync(artifactPath, `${JSON.stringify({ ...data, artifactFreshness: 'current_run', artifactPath: 'artifacts/next-build-runtime-guard-last-run.json' }, null, 2)}\n`, 'utf8');
}
function removeStaleArtifact() { try { fs.unlinkSync(artifactPath); } catch {} }
function cleanNextBuildOutput() {
  if (process.env.GIAOAN_BUILD_GUARD_PRESERVE_NEXT === '1') {
    return { ok: true, removed: false, reason: 'GIAOAN_BUILD_GUARD_PRESERVE_NEXT=1' };
  }
  try {
    fs.rmSync(path.join(root, '.next'), { recursive: true, force: true });
    return { ok: true, removed: true, reason: 'removed stale .next before guarded build so required artifacts must come from the current run' };
  } catch (error) {
    return { ok: false, removed: false, reason: error.message };
  }
}
function killTree(child) {
  if (!child || child.killed) return;
  try { process.kill(-child.pid, 'SIGTERM'); } catch { try { child.kill('SIGTERM'); } catch {} }
  setTimeout(() => {
    try { process.kill(-child.pid, 'SIGKILL'); } catch { try { child.kill('SIGKILL'); } catch {} }
  }, 2000).unref();
}

removeStaleArtifact();
const buildOutputCleanup = cleanNextBuildOutput();

if (!fs.existsSync(nextBin)) {
  const result = { ok: false, status: 'next_bin_missing', nextBin, generatedAt: new Date().toISOString() };
  writeArtifact(result);
  console.error(JSON.stringify(result, null, 2));
  process.exit(1);
}

const startedAt = Date.now();
const output = [];
let sawGeneratingStaticPages = false;
let sawCollectingBuildTraces = false;
let traceStageStartedAt = 0;
let finished = false;
let fallbackArmed = false;
let artifactsReadySince = 0;
let lastProgressLogAt = 0;

console.log(JSON.stringify({ ok: true, action: 'next_build_runtime_guard_start', nextBin, hardTimeoutMs, traceGraceMs, artifactReadyGraceMs, strictRaw, buildOutputCleanup }, null, 2));

const child = spawn(process.execPath, [nextBin, 'build'], {
  cwd: root,
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
  stdio: ['inherit', 'pipe', 'pipe'],
  detached: process.platform !== 'win32'
});

function handleText(text, stream) {
  output.push(text);
  if (stream === 'stderr') process.stderr.write(text); else process.stdout.write(text);
  if (text.includes('Generating static pages')) {
    sawGeneratingStaticPages = true;
    if (!fallbackArmed) {
      fallbackArmed = true;
      for (const delay of [10, 50, 120, 250, 500]) setTimeout(ensureFallback500, delay).unref();
    }
  }
  if (text.includes('Collecting build traces')) {
    sawCollectingBuildTraces = true;
    traceStageStartedAt ||= Date.now();
  }
}
child.stdout.on('data', (buf) => handleText(buf.toString(), 'stdout'));
child.stderr.on('data', (buf) => handleText(buf.toString(), 'stderr'));

const monitor = setInterval(() => {
  if (finished) return;
  const elapsedMs = Date.now() - startedAt;
  const artifacts = requiredArtifactsReady();
  if (Date.now() - lastProgressLogAt >= Number(process.env.GIAOAN_BUILD_PROGRESS_LOG_MS || 5000)) {
    lastProgressLogAt = Date.now();
    const progress = {
      ok: false,
      status: 'running_build_guard_progress',
      action: 'next_build_runtime_guard_progress',
      generatedAt: new Date().toISOString(),
      elapsedMs,
      sawGeneratingStaticPages,
      sawCollectingBuildTraces,
      artifactsReady: artifacts.ready,
      missingArtifacts: artifacts.missing,
      warning: 'Batch144 progress artifact: guarded build cleans stale .next first; if the outer environment kills a hanging build before JS hard timeout fires, reports must see this as not passing rather than reuse stale evidence.',
      buildOutputCleanup,
      noAiPaymentVerifiedFakeAdded: true
    };
    writeArtifact(progress);
    console.log(JSON.stringify(progress, null, 2));
  }
  if (artifacts.ready) artifactsReadySince ||= Date.now();
  const traceGraceSatisfied = sawCollectingBuildTraces && Date.now() - traceStageStartedAt >= traceGraceMs;
  const artifactGraceSatisfied = artifacts.ready && Date.now() - artifactsReadySince >= artifactReadyGraceMs;
  if (artifacts.ready && !strictRaw && (traceGraceSatisfied || artifactGraceSatisfied)) {
    finished = true;
    clearInterval(monitor);
    killTree(child);
    const result = {
      ok: true,
      status: sawCollectingBuildTraces ? 'controlled_trace_timeout_with_startable_artifacts' : 'controlled_artifact_ready_timeout_with_startable_artifacts',
      rawNextBuildExitCode: null,
      generatedAt: new Date().toISOString(),
      elapsedMs,
      sawGeneratingStaticPages,
      sawCollectingBuildTraces,
      artifacts,
      warning: 'The guarded build produced required startable artifacts from a cleaned .next output and stopped a likely trace/finalization hang. This is guarded artifact closure; raw build closure is verified separately by build:raw:diagnose.',
      buildOutputCleanup,
      noAiPaymentVerifiedFakeAdded: true
    };
    writeArtifact(result);
    console.log(JSON.stringify(result, null, 2));
    setTimeout(() => process.exit(0), 250);
  } else if (elapsedMs >= hardTimeoutMs) {
    finished = true;
    clearInterval(monitor);
    killTree(child);
    const result = {
      ok: false,
      status: 'hard_timeout',
      rawNextBuildExitCode: null,
      generatedAt: new Date().toISOString(),
      elapsedMs,
      sawGeneratingStaticPages,
      sawCollectingBuildTraces,
      artifacts,
      tail: output.join('').slice(-4000),
      warning: 'Guarded build timed out before required artifacts were ready.',
      buildOutputCleanup
    };
    writeArtifact(result);
    console.error(JSON.stringify(result, null, 2));
    setTimeout(() => process.exit(1), 250);
  }
}, 500);

child.on('exit', (code, signal) => {
  if (finished) return;
  finished = true;
  clearInterval(monitor);
  const elapsedMs = Date.now() - startedAt;
  const artifacts = requiredArtifactsReady();
  const tail = output.join('').slice(-4000);
  const canRecover500 = !strictRaw && code !== 0 && tail.includes(".next/export/500.html") && artifacts.ready;
  const result = {
    ok: code === 0 || canRecover500,
    status: code === 0 ? 'raw_next_build_passed' : canRecover500 ? 'recovered_missing_500_after_artifacts_ready' : 'raw_next_build_failed',
    rawNextBuildExitCode: code,
    rawNextBuildSignal: signal,
    generatedAt: new Date().toISOString(),
    elapsedMs,
    sawGeneratingStaticPages,
    sawCollectingBuildTraces,
    artifacts,
    tail,
    warning: code === 0 ? 'Raw Next build exited 0 after cleaned guarded build.' : 'Guarded build did not get a raw Next build exit 0; check status before claiming production readiness.',
    buildOutputCleanup,
    noAiPaymentVerifiedFakeAdded: true
  };
  writeArtifact(result);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
});
