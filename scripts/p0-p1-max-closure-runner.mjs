import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const policy = JSON.parse(fs.readFileSync('data/batch149-p0-p1-max-closure-policy.json', 'utf8'));
const artifactRel = policy.artifacts.runnerJson;
const defaultTimeoutMs = Number(process.env.GIAOAN_BATCH149_COMMAND_TIMEOUT_MS || 360_000);
const startedAt = new Date().toISOString();

function nodeMajor(version = process.versions.node) {
  return Number(String(version || '').split('.')[0] || 0);
}

function readJson(rel, fallback = null) {
  try { return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')); } catch { return fallback; }
}

function writeJson(rel, data) {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function summarizeArtifacts() {
  const hostedSummary = readJson('artifacts/p0-hosted-final-proof-summary-last-run.json', {});
  const closureDossier = readJson('artifacts/p0-hosted-proof-closure-dossier-last-run.json', {});
  const authenticity = readJson('artifacts/p0-hosted-proof-authenticity-lock-last-run.json', {});
  const finalClosure = readJson('artifacts/p0-p1-final-closure-report-last-run.json', {});
  const securityReport = readJson('artifacts/security-data-protection-report-last-run.json', {});
  const buildGuard = readJson('artifacts/next-build-runtime-guard-last-run.json', {});
  const liveSmoke = readJson('artifacts/live-http-smoke-last-run.json', {});
  const loopback = readJson('artifacts/p0-loopback-url-smoke-last-run.json', {});
  return {
    hostedSummary: {
      present: Boolean(hostedSummary && Object.keys(hostedSummary).length),
      hostedProofClosed: hostedSummary?.hostedProofClosed === true,
      publicRolloutAllowed: hostedSummary?.publicRolloutAllowed === true,
      blockers: hostedSummary?.blockers || hostedSummary?.hardBlockers || []
    },
    closureDossier: {
      present: Boolean(closureDossier && Object.keys(closureDossier).length),
      ok: closureDossier?.ok === true,
      hostedProofClosed: closureDossier?.hostedProofClosed === true,
      publicRolloutAllowed: closureDossier?.publicRolloutAllowed === true,
      blockers: closureDossier?.blockers || []
    },
    authenticity: {
      present: Boolean(authenticity && Object.keys(authenticity).length),
      ok: authenticity?.ok === true,
      authenticityLocked: authenticity?.authenticityLocked === true,
      publicRolloutAllowed: authenticity?.publicRolloutAllowed === true,
      blockers: authenticity?.blockers || authenticity?.issues || []
    },
    finalClosure: {
      present: Boolean(finalClosure && Object.keys(finalClosure).length),
      ok: finalClosure?.ok === true,
      localP0P1Closed: finalClosure?.localP0P1Closed === true,
      hostedPublicClosed: finalClosure?.hostedPublicClosed === true,
      allP0P1PublicClosed: finalClosure?.allP0P1PublicClosed === true,
      localClosurePercent: finalClosure?.localClosurePercent ?? null,
      hostedClosurePercent: finalClosure?.hostedClosurePercent ?? null,
      blockers: finalClosure?.blockers || []
    },
    securityReport: {
      present: Boolean(securityReport && Object.keys(securityReport).length),
      ok: securityReport?.ok === true,
      sourceFoundationReady: securityReport?.sourceFoundationReady === true,
      publicRolloutAllowed: securityReport?.publicRolloutAllowed === true
    },
    buildGuard: {
      present: Boolean(buildGuard && Object.keys(buildGuard).length),
      ok: buildGuard?.ok === true,
      artifactsReady: buildGuard?.artifacts?.ready === true,
      status: buildGuard?.status || null
    },
    liveSmoke: {
      present: Boolean(liveSmoke && Object.keys(liveSmoke).length),
      ok: liveSmoke?.ok === true,
      smokeMode: liveSmoke?.smokeMode || null
    },
    loopback: {
      present: Boolean(loopback && Object.keys(loopback).length),
      ok: loopback?.ok === true,
      realAccountSaveExportSmoke: loopback?.hostedSummary?.batch98RealAccountSaveExportSmoke === true
    }
  };
}

function writePartial(commands, status = 'running') {
  const passedRequired = commands.filter((item) => item.required && item.ok).length;
  const requiredTotal = policy.maxClosureCommands.filter((item) => item.required).length;
  writeJson(artifactRel, {
    ok: false,
    status,
    batch: policy.batch,
    version: policy.version,
    startedAt,
    generatedAt: new Date().toISOString(),
    nodeVersion: process.versions.node,
    node24: nodeMajor() === 24,
    appUrlPresent: Boolean(process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.GIAOAN_DEMO_URL),
    completed: commands.length,
    total: policy.maxClosureCommands.length,
    requiredPassed: passedRequired,
    requiredTotal,
    commands,
    artifactSummary: summarizeArtifacts(),
    localP0P1MaxClosureCandidate: false,
    hostedPublicStillBlocked: true,
    publicRolloutAllowed: false,
    productionReady: false,
    noAiPaymentVerifiedFakeAdded: true,
    warning: 'Partial Batch149 runner artifact is deliberately ok=false; do not use it as closure evidence unless status=pass and all required commands pass.'
  });
}

function runOne(item) {
  return new Promise((resolve) => {
    const started = Date.now();
    const startedAtCommand = new Date().toISOString();
    const timeoutMs = Number(item.timeoutMs || defaultTimeoutMs);
    let stdout = '';
    let stderr = '';
    let finished = false;
    console.log(JSON.stringify({ ok: true, action: 'batch149_command_start', id: item.id, command: item.command }, null, 2));
    const child = spawn(item.command, {
      cwd: root,
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true
    });
    child.stdout.on('data', (buf) => { const text = buf.toString(); stdout += text; process.stdout.write(text); });
    child.stderr.on('data', (buf) => { const text = buf.toString(); stderr += text; process.stderr.write(text); });
    const timer = setTimeout(() => {
      if (finished) return;
      finished = true;
      try { child.kill('SIGTERM'); } catch {}
      resolve({ ...item, ok: false, status: 'timeout', exitCode: null, signal: 'SIGTERM', timeoutMs, startedAt: startedAtCommand, generatedAt: new Date().toISOString(), durationMs: Date.now() - started, stdoutTail: stdout.slice(-2400), stderrTail: stderr.slice(-2400) });
    }, timeoutMs);
    timer.unref();
    child.on('exit', (code, signal) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      resolve({ ...item, ok: code === 0, status: code === 0 ? 'pass' : 'fail', exitCode: code, signal, timeoutMs, startedAt: startedAtCommand, generatedAt: new Date().toISOString(), durationMs: Date.now() - started, stdoutTail: stdout.slice(-2400), stderrTail: stderr.slice(-2400) });
    });
  });
}

const results = [];
writePartial(results);
for (const item of policy.maxClosureCommands) {
  const result = await runOne(item);
  results.push(result);
  writePartial(results, result.ok ? 'running' : 'failed_required_command');
  if (!result.ok && item.required) break;
}

const failedRequired = results.filter((item) => item.required && !item.ok);
const completedAll = results.length === policy.maxClosureCommands.length;
const artifactSummary = summarizeArtifacts();
const localRuntimeArtifactsPass = Boolean(
  artifactSummary.securityReport.ok &&
  artifactSummary.buildGuard.artifactsReady &&
  artifactSummary.liveSmoke.ok &&
  artifactSummary.loopback.realAccountSaveExportSmoke
);
const hostedPublicStillBlocked = !(
  artifactSummary.hostedSummary.hostedProofClosed &&
  artifactSummary.closureDossier.hostedProofClosed &&
  artifactSummary.authenticity.authenticityLocked &&
  artifactSummary.finalClosure.hostedPublicClosed
);
const localP0P1MaxClosureCandidate = failedRequired.length === 0 && completedAll && localRuntimeArtifactsPass;
const report = {
  ok: localP0P1MaxClosureCandidate,
  status: failedRequired.length ? 'failed_required_command' : completedAll ? 'pass' : 'incomplete',
  batch: policy.batch,
  version: policy.version,
  startedAt,
  generatedAt: new Date().toISOString(),
  nodeVersion: process.versions.node,
  node24: nodeMajor() === 24,
  appUrlPresent: Boolean(process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.GIAOAN_DEMO_URL),
  completed: results.length,
  total: policy.maxClosureCommands.length,
  commands: results,
  failedRequired,
  artifactSummary,
  localRuntimeArtifactsPass,
  localP0P1MaxClosureCandidate,
  hostedPublicStillBlocked,
  hostedPublicStillRequired: policy.hostedPublicStillRequired,
  publicRolloutAllowed: false,
  productionReady: false,
  claimPolicy: policy.claimPolicy,
  securityHardening: policy.securityHardening,
  noAiPaymentVerifiedFakeAdded: true,
  warning: hostedPublicStillBlocked
    ? 'Batch149 can support a max local/source/runtime P0/P1 candidate only. Hosted/public proof remains blocked until a real Node24 GitHub Actions + Vercel APP_URL + PNG visual smoke artifact set passes.'
    : 'Hosted artifacts appear closed, but production-ready still requires DB/security/legal review before public rollout.'
};
writeJson(artifactRel, report);
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
