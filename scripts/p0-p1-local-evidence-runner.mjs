import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const artifactRel = 'artifacts/p0-p1-local-evidence-runner-last-run.json';
const timeoutMs = Number(process.env.GIAOAN_P0P1_LOCAL_EVIDENCE_COMMAND_TIMEOUT_MS || 260_000);
const commands = [
  { id: 'source_validate', command: 'npm run source:validate', required: true },
  { id: 'data_validate', command: 'npm run data:validate', required: true },
  { id: 'data_validate_evidence', command: 'npm run p0-p1:data-evidence', required: true },
  { id: 'typecheck_evidence', command: 'npm run p0-p1:typecheck-evidence', required: true },
  { id: 'next_swc_evidence', command: 'npm run p0-p1:swc-evidence', required: true },
  { id: 'route_contract_evidence', command: 'npm run p0-p1:route-contract-evidence', required: true },
  // Optional packaging hygiene/preflight evidence commands remain available separately, but the main local runner avoids running them inside an npm-ci worktree where node_modules/.next are intentionally present.
  { id: 'guarded_build', command: 'GIAOAN_BUILD_TRACE_GRACE_MS=0 GIAOAN_BUILD_ARTIFACT_READY_GRACE_MS=0 npm run build', required: true },
  { id: 'raw_build_diagnostic', command: 'GIAOAN_RAW_BUILD_TIMEOUT_MS=180000 npm run build:raw:diagnose', required: true },
  { id: 'live_smoke_clean', command: 'GIAOAN_SMOKE_MODE=production npm run live:smoke:clean', required: true },
  { id: 'auth_invite_runtime_smoke', command: 'npm run auth-invite:runtime-smoke', required: true },
  { id: 'loopback_hosted_style_smoke', command: 'npm run runtime:p0-loopback-url-smoke', required: true },
  { id: 'security_data_protection_report', command: 'npm run security:data-protection-report', required: true }
];

function writeArtifact(data) {
  const artifactPath = path.join(root, artifactRel);
  fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
  fs.writeFileSync(artifactPath, `${JSON.stringify({ ...data, artifactPath: artifactRel, artifactFreshness: 'current_run' }, null, 2)}\n`, 'utf8');
}

function runOne(item) {
  return new Promise((resolve) => {
    const startedAt = new Date().toISOString();
    const started = Date.now();
    let stdout = '';
    let stderr = '';
    let finished = false;
    console.log(JSON.stringify({ ok: true, action: 'p0_p1_local_evidence_command_start', id: item.id, command: item.command }, null, 2));
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
      resolve({ ...item, ok: false, status: 'timeout', exitCode: null, signal: 'SIGTERM', timeoutMs, startedAt, generatedAt: new Date().toISOString(), durationMs: Date.now() - started, stdoutTail: stdout.slice(-3000), stderrTail: stderr.slice(-3000) });
    }, timeoutMs);
    timer.unref();
    child.on('exit', (code, signal) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      resolve({ ...item, ok: code === 0, status: code === 0 ? 'pass' : 'fail', exitCode: code, signal, timeoutMs, startedAt, generatedAt: new Date().toISOString(), durationMs: Date.now() - started, stdoutTail: stdout.slice(-3000), stderrTail: stderr.slice(-3000) });
    });
  });
}

const startedAt = new Date().toISOString();
const results = [];
for (const item of commands) {
  const result = await runOne(item);
  results.push(result);
  writeArtifact({ ok: false, status: 'running', batch: 'Batch144 P0/P1 Local Build Closure', version: '0.144.0', startedAt, generatedAt: new Date().toISOString(), nodeVersion: process.versions.node, completed: results.length, total: commands.length, commands: results, noAiPaymentVerifiedFakeAdded: true, productionReady: false, publicRolloutAllowed: false, warning: 'Partial runner artifacts are deliberately ok=false so reports cannot treat status=running/completed<total as pass.' });
  if (!result.ok && result.required) break;
}
const failedRequired = results.filter((item) => item.required && !item.ok);
const report = {
  ok: failedRequired.length === 0 && results.length === commands.length,
  status: failedRequired.length ? 'failed_required_command' : results.length === commands.length ? 'pass' : 'incomplete',
  batch: 'Batch144 P0/P1 Local Build Closure',
  version: '0.144.0',
  startedAt,
  generatedAt: new Date().toISOString(),
  nodeVersion: process.versions.node,
  node24: Number(process.versions.node.split('.')[0] || 0) === 24,
  completed: results.length,
  total: commands.length,
  commands: results,
  failedRequired,
  localEvidenceCurrentRun: true,
  productionReady: false,
  publicRolloutAllowed: false,
  noAiPaymentVerifiedFakeAdded: true,
  warning: 'This runner strengthens local Node22 P0/P1 evidence and requires cleaned raw Next build exit-zero proof. Partial artifacts are never ok=true; report acceptance requires status=pass and completed===total. It does not replace Node24 CI, hosted APP_URL smoke or real browser visual evidence.'
};
writeArtifact(report);
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
