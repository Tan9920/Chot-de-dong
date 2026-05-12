import fs from 'fs';
import path from 'path';

import policy from '@/data/p0-hosted-proof-execution-gate-policy.json';
import { buildP0HostedEvidenceCaptureBoard } from '@/lib/p0-hosted-evidence-capture';

type AnyRecord = Record<string, any>;
type GateState = 'pass' | 'blocked' | 'unverified' | 'fail';

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

function nodeMajorFrom(value?: string | null) {
  return Number(String(value || '').split('.')[0] || 0);
}

function nodeMajor() {
  return nodeMajorFrom(process.versions.node);
}

function appUrl() {
  return process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.GIAOAN_DEMO_URL || '';
}

function artifactOk(file?: string | null) {
  const artifact = readJson(file);
  return Boolean(artifact?.ok && !artifact?.skipped);
}

function node24ProofOk(file?: string | null) {
  const artifact = readJson(file);
  return artifactOk(file) && nodeMajorFrom(artifact?.nodeVersion) === 24;
}

function hostedReleaseOk(file?: string | null) {
  const artifact = readJson(file);
  return Boolean(artifact?.ok === true && artifact?.appUrlPresent === true && (artifact?.summary?.failed ?? 1) === 0);
}

function hostedSaveExportOk(file?: string | null) {
  const artifact = readJson(file);
  if (artifact?.skipped) return false;
  return Boolean(
    artifact?.ok === true &&
      (artifact?.summary?.batch98RealAccountSaveExportSmoke === true ||
        artifact?.hostedSummary?.batch98RealAccountSaveExportSmoke === true ||
        artifact?.saveExport?.ok === true)
  );
}

function visualEvidenceOk(file?: string | null) {
  const artifact = readJson(file);
  if (!artifact?.ok) return false;
  const captures = Array.isArray(artifact.captures) ? artifact.captures : [];
  return policy.visualEvidence.requiredViewports.every((viewportId: string) =>
    captures.some((capture: AnyRecord) => capture.viewportId === viewportId && capture.status === 'pass')
  );
}

function p0p1StabilityOk(file?: string | null) {
  const artifact = readJson(file);
  return Boolean(artifact?.ok && artifact?.localP0Stable === true && artifact?.p1FoundationSourceReady === true);
}

function captureBoardOk(file?: string | null) {
  const artifact = readJson(file);
  return Boolean(artifact?.ok && artifact?.hostedProofClosed === true && Array.isArray(artifact?.missingRequired) && artifact.missingRequired.length === 0);
}

function publicRolloutReadinessOk(file?: string | null) {
  const artifact = readJson(file);
  return Boolean(artifact?.ok && artifact?.publicRolloutAllowed === true);
}

function gateState(gate: AnyRecord): GateState {
  const artifact = readJson(gate.artifact);
  if (gate.id === 'node24_ci') return node24ProofOk(gate.artifact) ? 'pass' : 'blocked';
  if (gate.id === 'app_url_strict_release') return hostedReleaseOk(gate.artifact) ? 'pass' : appUrl() ? 'unverified' : 'blocked';
  if (gate.id === 'hosted_real_account_save_export') return hostedSaveExportOk(gate.artifact) ? 'pass' : appUrl() ? 'unverified' : 'blocked';
  if (gate.id === 'visual_smoke_real_browser') return visualEvidenceOk(gate.artifact) ? 'pass' : 'unverified';
  if (gate.id === 'p0_p1_stability') return p0p1StabilityOk(gate.artifact) ? 'pass' : artifact?.ok === false ? 'fail' : 'unverified';
  if (gate.id === 'capture_board') return captureBoardOk(gate.artifact) ? 'pass' : artifact?.ok === false ? 'fail' : 'blocked';
  if (gate.id === 'public_rollout_readiness') return publicRolloutReadinessOk(gate.artifact) ? 'pass' : artifact?.ok === false ? 'blocked' : 'unverified';
  if (artifact?.ok === false) return 'fail';
  return artifactOk(gate.artifact) ? 'pass' : 'unverified';
}

function buildGate(gate: AnyRecord) {
  const state = gateState(gate);
  return {
    id: gate.id,
    label: gate.label,
    command: gate.command,
    artifact: gate.artifact,
    artifactPresent: exists(gate.artifact),
    artifactOk: artifactOk(gate.artifact),
    required: Boolean(gate.required),
    blocksHostedProof: Boolean(gate.blocksHostedProof),
    passRule: gate.passRule,
    state,
    ok: state === 'pass'
  };
}

export function buildP0HostedProofExecutionGateBoard() {
  const captureBoard = buildP0HostedEvidenceCaptureBoard();
  const gates = (policy.hardGates as AnyRecord[]).map(buildGate);
  const missingRequired = gates.filter((item) => item.required && item.state !== 'pass');
  const blockers = missingRequired.filter((item) => item.blocksHostedProof).map((item) => item.id);
  const hostedProofClosed = missingRequired.length === 0;
  const safeToExpandBeyondP1 = hostedProofClosed && blockers.length === 0;
  return {
    ok: true,
    batch: policy.batch,
    version: policy.version,
    phase: policy.phase,
    generatedAt: new Date().toISOString(),
    nodeVersion: process.versions.node,
    node24: nodeMajor() === 24,
    appUrlPresent: Boolean(appUrl()),
    appUrl: appUrl() ? '[provided]' : '',
    sourceLevelOnly: policy.sourceLevelOnly,
    hostedProofClosed,
    safeToExpandBeyondP1,
    publicRolloutAllowed: Boolean(hostedProofClosed && publicRolloutReadinessOk('artifacts/public-rollout-readiness-report-last-run.json')),
    productionReady: false,
    gates,
    missingRequired,
    blockers,
    nextCommands: missingRequired.length ? missingRequired.map((item) => item.command) : ['npm run verify:p0-hosted-ci-proof', 'npm run public-rollout:readiness-report'],
    captureBoardSummary: {
      hostedProofClosed: captureBoard.hostedProofClosed,
      blockers: captureBoard.blockers,
      missingRequiredCount: captureBoard.missingRequired?.length || 0
    },
    ciContract: policy.ciContract,
    executionModes: policy.executionModes,
    visualEvidence: policy.visualEvidence,
    claimPolicy: policy.claimPolicy,
    warning: 'Batch138 is a hosted proof execution gate. It can show blockers and closed evidence, but it does not make the app production-ready or bypass separate legal/security/DB review.'
  };
}
