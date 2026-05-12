import fs from 'fs';
import path from 'path';

import policy from '@/data/p0-p1-local-evidence-policy.json';

type AnyRecord = Record<string, any>;
type GateState = 'pass' | 'fail' | 'unverified' | 'running';

function rootPath(file: string) {
  return path.join(process.cwd(), file);
}

function readJson(file?: string | null, fallback: any = null) {
  if (!file) return fallback;
  try {
    return JSON.parse(fs.readFileSync(rootPath(file), 'utf8'));
  } catch {
    return fallback;
  }
}

function exists(file?: string | null) {
  return Boolean(file && fs.existsSync(rootPath(file)));
}

function artifactOk(file?: string | null) {
  const artifact = readJson(file);
  return Boolean(artifact?.ok && !artifact?.skipped);
}

function liveSmokeOk(file?: string | null) {
  const artifact = readJson(file);
  return Boolean(
    artifact?.ok &&
      artifact?.smokeMode === 'production' &&
      Array.isArray(artifact?.checks) &&
      artifact.checks.every((check: AnyRecord) => check.ok)
  );
}

function authInviteOk(file?: string | null) {
  const artifact = readJson(file);
  return Boolean(artifact?.ok && artifact?.summary?.batch98InviteRuntimeSmoke === true);
}

function loopbackOk(file?: string | null) {
  const artifact = readJson(file);
  return Boolean(artifact?.ok && artifact?.hostedSummary?.batch98RealAccountSaveExportSmoke === true);
}

function rawBuildOk(file?: string | null) {
  const artifact = readJson(file);
  return Boolean(
    artifact?.ok === true &&
      artifact?.rawNextBuildExitCode === 0 &&
      artifact?.buildOutputCleanup?.removed === true &&
      artifact?.nextBuildIdExists === true &&
      artifact?.requiredServerFilesExists === true &&
      artifact?.routesManifestExists === true &&
      artifact?.prerenderManifestExists === true &&
      artifact?.appBuildManifestExists === true
  );
}

function guardedBuildOk(file?: string | null) {
  const artifact = readJson(file);
  return Boolean(artifact?.ok && artifact?.artifacts?.ready === true);
}

function localRunnerIntegrity(file?: string | null) {
  const artifact = readJson(file);
  const commands = Array.isArray(artifact?.commands) ? artifact.commands : [];
  const completed = Number.isFinite(Number(artifact?.completed)) ? Number(artifact.completed) : commands.length;
  const total = Number.isFinite(Number(artifact?.total)) ? Number(artifact.total) : commands.length;
  const allCommandsPass = commands.length > 0 && commands.every((command: AnyRecord) => command?.ok === true && command?.status === 'pass');
  const ok = Boolean(
    artifact?.ok === true &&
      artifact?.status === 'pass' &&
      total > 0 &&
      completed === total &&
      commands.length === total &&
      allCommandsPass
  );
  return {
    hasArtifact: Boolean(artifact),
    ok,
    status: artifact?.status || 'unverified',
    completed,
    total,
    commandCount: commands.length,
    allCommandsPass,
    nodeVersion: artifact?.nodeVersion || null,
    generatedAt: artifact?.generatedAt || null
  };
}

function gateArtifactOk(gate: AnyRecord) {
  if (gate.id === 'local_evidence_runner') return localRunnerIntegrity(gate.artifact).ok;
  return artifactOk(gate.artifact);
}

function gateState(gate: AnyRecord): GateState {
  const artifact = readJson(gate.artifact);
  if (gate.id === 'guarded_build') return guardedBuildOk(gate.artifact) ? 'pass' : artifact?.ok === false ? 'fail' : 'unverified';
  if (gate.id === 'raw_build_diagnostic') return rawBuildOk(gate.artifact) ? 'pass' : artifact?.ok === false ? 'fail' : 'unverified';
  if (gate.id === 'live_smoke_clean') return liveSmokeOk(gate.artifact) ? 'pass' : artifact?.ok === false ? 'fail' : 'unverified';
  if (gate.id === 'auth_invite_runtime_smoke') return authInviteOk(gate.artifact) ? 'pass' : artifact?.ok === false ? 'fail' : 'unverified';
  if (gate.id === 'loopback_hosted_style_smoke') return loopbackOk(gate.artifact) ? 'pass' : artifact?.ok === false ? 'fail' : 'unverified';
  if (gate.id === 'local_evidence_runner') {
    const integrity = localRunnerIntegrity(gate.artifact);
    if (integrity.ok) return 'pass';
    if (!integrity.hasArtifact) return 'unverified';
    if (integrity.status === 'running') return 'running';
    return 'fail';
  }
  if (artifact?.ok === false) return 'fail';
  return artifactOk(gate.artifact) ? 'pass' : 'unverified';
}

function buildGate(gate: AnyRecord) {
  const state = gateState(gate);
  const built: AnyRecord = {
    id: gate.id,
    label: gate.label,
    command: gate.command,
    artifact: gate.artifact || null,
    artifactPresent: exists(gate.artifact),
    artifactOk: gateArtifactOk(gate),
    required: Boolean(gate.required),
    recommended: Boolean(gate.recommended),
    state,
    ok: state === 'pass' || (!gate.required && state === 'unverified')
  };
  if (gate.id === 'local_evidence_runner') built.integrity = localRunnerIntegrity(gate.artifact);
  return built;
}

export function buildP0P1LocalEvidenceBoard() {
  const gates = (policy.localEvidenceGates as AnyRecord[]).map(buildGate);
  const required = gates.filter((gate) => gate.required);
  const missingRequired = required.filter((gate) => gate.state !== 'pass');
  const evidenceIntegrityWarnings = gates
    .filter((gate) => !gate.required && gate.artifactPresent && gate.state !== 'pass')
    .map((gate) => ({
      id: gate.id,
      state: gate.state,
      command: gate.command,
      artifact: gate.artifact,
      reason:
        gate.id === 'local_evidence_runner'
          ? 'Runner artifact must have ok=true, status=pass, completed===total and every command status=pass before it can support higher local P0/P1 evidence claims.'
          : 'Recommended evidence artifact is present but not passing.'
    }));
  const evidenceIntegrityReady = evidenceIntegrityWarnings.length === 0;
  const localEvidenceReady = missingRequired.length === 0 && evidenceIntegrityReady;
  return {
    ok: localEvidenceReady,
    batch: policy.batch,
    version: policy.version,
    phase: policy.phase,
    generatedAt: new Date().toISOString(),
    nodeVersion: process.versions.node,
    node24: Number(process.versions.node.split('.')[0] || 0) === 24,
    sourceLevelOnly: policy.sourceLevelOnly,
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
    hostedStillRequired: policy.hostedStillRequired,
    claimPolicy: policy.claimPolicy,
    nextCommands: missingRequired.length
      ? missingRequired.map((gate) => gate.command)
      : evidenceIntegrityWarnings.length
        ? evidenceIntegrityWarnings.map((gate) => gate.command)
        : (policy.hostedStillRequired as AnyRecord[]).map((gate) => gate.command),
    warning: 'Batch144 fixes local build/page-data evidence and evidence-report integrity. Local runner evidence is not accepted unless status=pass and completed===total. Hosted/public rollout remains blocked until Node24, APP_URL hosted smoke, real visual smoke, production DB and legal review.'
  };
}
