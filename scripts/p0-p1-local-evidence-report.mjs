import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const artifactRel = 'artifacts/p0-p1-local-evidence-report-last-run.json';
const policy = readJson('data/p0-p1-local-evidence-policy.json', {});
function exists(rel) { return Boolean(rel && fs.existsSync(path.join(root, rel))); }
function readJson(rel, fallback = null) {
  if (!rel) return fallback;
  try { return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')); } catch { return fallback; }
}
function artifactOk(rel) {
  const item = readJson(rel);
  return Boolean(item?.ok && !item?.skipped);
}
function liveSmokeOk(rel) {
  const item = readJson(rel);
  return Boolean(item?.ok && item?.smokeMode === 'production' && Array.isArray(item?.checks) && item.checks.every((check) => check.ok));
}
function authInviteOk(rel) {
  const item = readJson(rel);
  return Boolean(item?.ok && item?.summary?.batch98InviteRuntimeSmoke === true);
}
function loopbackOk(rel) {
  const item = readJson(rel);
  return Boolean(item?.ok && item?.hostedSummary?.batch98RealAccountSaveExportSmoke === true);
}
function rawBuildOk(rel) {
  const artifact = readJson(rel);
  return Boolean(artifact?.ok === true && artifact?.rawNextBuildExitCode === 0 && artifact?.buildOutputCleanup?.removed === true && artifact?.nextBuildIdExists === true && artifact?.requiredServerFilesExists === true && artifact?.routesManifestExists === true && artifact?.prerenderManifestExists === true && artifact?.appBuildManifestExists === true);
}

function guardedBuildOk(rel) {
  const item = readJson(rel);
  return Boolean(item?.ok && item?.artifacts?.ready === true);
}
function localRunnerIntegrity(rel) {
  const item = readJson(rel);
  const commands = Array.isArray(item?.commands) ? item.commands : [];
  const completed = Number.isFinite(Number(item?.completed)) ? Number(item.completed) : commands.length;
  const total = Number.isFinite(Number(item?.total)) ? Number(item.total) : commands.length;
  const allCommandsPass = commands.length > 0 && commands.every((cmd) => cmd?.ok === true && cmd?.status === 'pass');
  const ok = Boolean(
    item?.ok === true &&
    item?.status === 'pass' &&
    total > 0 &&
    completed === total &&
    commands.length === total &&
    allCommandsPass
  );
  return {
    hasArtifact: Boolean(item),
    ok,
    status: item?.status || 'unverified',
    completed,
    total,
    commandCount: commands.length,
    allCommandsPass,
    nodeVersion: item?.nodeVersion || null,
    generatedAt: item?.generatedAt || null
  };
}
function gateArtifactOk(gate) {
  if (gate.id === 'local_evidence_runner') return localRunnerIntegrity(gate.artifact).ok;
  return artifactOk(gate.artifact);
}
function gateState(gate) {
  const item = readJson(gate.artifact);
  if (gate.id === 'guarded_build') return guardedBuildOk(gate.artifact) ? 'pass' : item?.ok === false ? 'fail' : 'unverified';
  if (gate.id === 'raw_build_diagnostic') return rawBuildOk(gate.artifact) ? 'pass' : item?.ok === false ? 'fail' : 'unverified';
  if (gate.id === 'live_smoke_clean') return liveSmokeOk(gate.artifact) ? 'pass' : item?.ok === false ? 'fail' : 'unverified';
  if (gate.id === 'auth_invite_runtime_smoke') return authInviteOk(gate.artifact) ? 'pass' : item?.ok === false ? 'fail' : 'unverified';
  if (gate.id === 'loopback_hosted_style_smoke') return loopbackOk(gate.artifact) ? 'pass' : item?.ok === false ? 'fail' : 'unverified';
  if (gate.id === 'local_evidence_runner') {
    const integrity = localRunnerIntegrity(gate.artifact);
    if (integrity.ok) return 'pass';
    if (!integrity.hasArtifact) return 'unverified';
    if (integrity.status === 'running') return 'running';
    return 'fail';
  }
  if (item?.ok === false) return 'fail';
  return artifactOk(gate.artifact) ? 'pass' : 'unverified';
}
function buildGate(gate) {
  const state = gateState(gate);
  const built = { ...gate, artifactPresent: exists(gate.artifact), artifactOk: gateArtifactOk(gate), state, ok: state === 'pass' || (!gate.required && state === 'unverified') };
  if (gate.id === 'local_evidence_runner') built.integrity = localRunnerIntegrity(gate.artifact);
  return built;
}
const gates = (policy.localEvidenceGates || []).map(buildGate);
const required = gates.filter((gate) => gate.required);
const missingRequired = required.filter((gate) => gate.state !== 'pass');
const evidenceIntegrityWarnings = gates
  .filter((gate) => !gate.required && gate.artifactPresent && gate.state !== 'pass')
  .map((gate) => ({ id: gate.id, state: gate.state, command: gate.command, artifact: gate.artifact, reason: gate.id === 'local_evidence_runner' ? 'Runner artifact must have ok=true, status=pass, completed===total and every command status=pass before it can support higher local P0/P1 evidence claims.' : 'Recommended evidence artifact is present but not passing.' }));
const hostedStillRequired = policy.hostedStillRequired || [];
const evidenceIntegrityReady = evidenceIntegrityWarnings.length === 0;
const localEvidenceReady = missingRequired.length === 0 && evidenceIntegrityReady;
const report = {
  ok: localEvidenceReady,
  batch: policy.batch,
  version: policy.version,
  phase: policy.phase,
  generatedAt: new Date().toISOString(),
  nodeVersion: process.versions.node,
  node24: Number(process.versions.node.split('.')[0] || 0) === 24,
  localEvidenceReady,
  localEvidenceReadinessPercent: Math.round((required.length ? (required.length - missingRequired.length) / required.length : 0) * 100),
  evidenceIntegrityReady,
  higherLocalP0P1ClaimAllowed: localEvidenceReady,
  p1LocalExpansionAllowed: localEvidenceReady,
  hostedPublicStillBlocked: true,
  productionReady: false,
  publicRolloutAllowed: false,
  gates,
  missingRequired,
  evidenceIntegrityWarnings,
  hostedStillRequired,
  nextCommands: missingRequired.length ? missingRequired.map((gate) => gate.command) : evidenceIntegrityWarnings.length ? evidenceIntegrityWarnings.map((gate) => gate.command) : hostedStillRequired.map((gate) => gate.command),
  noAiPaymentVerifiedFakeAdded: true,
  warning: 'Batch144 fixes local build/page-data evidence and evidence-report integrity. Local runner evidence is not accepted unless status=pass and completed===total. Hosted/public rollout remains blocked until Node24, APP_URL hosted smoke and real visual smoke pass.'
};
fs.mkdirSync(path.dirname(path.join(root, artifactRel)), { recursive: true });
fs.writeFileSync(path.join(root, artifactRel), `${JSON.stringify({ ...report, artifactPath: artifactRel, artifactFreshness: 'current_run' }, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
