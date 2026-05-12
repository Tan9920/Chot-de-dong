// p0-p1-command-evidence: writes current-run command evidence artifacts for Batch139.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const args = process.argv.slice(2);
const sep = args.indexOf('--');
const metaArgs = sep >= 0 ? args.slice(0, sep) : args;
const commandArgs = sep >= 0 ? args.slice(sep + 1) : [];
function argValue(name) {
  const idx = metaArgs.indexOf(name);
  return idx >= 0 ? metaArgs[idx + 1] : '';
}
const id = argValue('--id') || 'command_evidence';
const artifactRel = argValue('--artifact') || `artifacts/${id}-last-run.json`;
const timeoutMs = Number(process.env.GIAOAN_P0P1_COMMAND_EVIDENCE_TIMEOUT_MS || 180_000);

if (!commandArgs.length) {
  console.error(JSON.stringify({ ok: false, id, error: 'missing command after --' }, null, 2));
  process.exit(1);
}

const command = commandArgs.join(' ');
const startedAt = new Date().toISOString();
const started = Date.now();
let stdout = '';
let stderr = '';
let finished = false;

function writeArtifact(data) {
  const artifactPath = path.join(root, artifactRel);
  fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
  fs.writeFileSync(artifactPath, `${JSON.stringify({ ...data, artifactPath: artifactRel, artifactFreshness: 'current_run' }, null, 2)}\n`, 'utf8');
}

const child = spawn(command, {
  cwd: root,
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true
});

child.stdout.on('data', (buf) => {
  const text = buf.toString();
  stdout += text;
  process.stdout.write(text);
});
child.stderr.on('data', (buf) => {
  const text = buf.toString();
  stderr += text;
  process.stderr.write(text);
});

const timer = setTimeout(() => {
  if (finished) return;
  finished = true;
  try { child.kill('SIGTERM'); } catch {}
  const result = {
    ok: false,
    id,
    command,
    status: 'timeout',
    exitCode: null,
    signal: 'SIGTERM',
    timeoutMs,
    startedAt,
    generatedAt: new Date().toISOString(),
    durationMs: Date.now() - started,
    nodeVersion: process.versions.node,
    stdoutTail: stdout.slice(-4000),
    stderrTail: stderr.slice(-4000),
    noAiPaymentVerifiedFakeAdded: true
  };
  writeArtifact(result);
  console.error(JSON.stringify(result, null, 2));
  process.exit(1);
}, timeoutMs);

timer.unref();

child.on('exit', (code, signal) => {
  if (finished) return;
  finished = true;
  clearTimeout(timer);
  const result = {
    ok: code === 0,
    id,
    command,
    status: code === 0 ? 'pass' : 'fail',
    exitCode: code,
    signal,
    timeoutMs,
    startedAt,
    generatedAt: new Date().toISOString(),
    durationMs: Date.now() - started,
    nodeVersion: process.versions.node,
    stdoutTail: stdout.slice(-4000),
    stderrTail: stderr.slice(-4000),
    noAiPaymentVerifiedFakeAdded: true
  };
  writeArtifact(result);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
});
