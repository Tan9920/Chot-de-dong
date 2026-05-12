import fs from 'fs';
import path from 'path';

import policy from '@/data/public-rollout-readiness-policy.json';

type GateState = 'pass' | 'blocked' | 'unverified' | 'fail';
type AnyRecord = Record<string, any>;

function readJson(file: string, fallback: any = null) {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), file), 'utf8'));
  } catch {
    return fallback;
  }
}

function exists(file: string) {
  return fs.existsSync(path.join(process.cwd(), file));
}

function currentNodeMajor() {
  return Number(process.versions.node.split('.')[0] || 0);
}

function artifactOk(file: string) {
  const artifact = readJson(file);
  return Boolean(artifact?.ok && !artifact?.skipped);
}

function publicRolloutDossierOk() {
  const dossier = readJson('artifacts/public-rollout-dossier-template.json');
  if (!dossier?.ok) return false;
  const sections = Array.isArray(dossier.sections) ? dossier.sections : [];
  const ids = sections.map((item: AnyRecord) => item.id);
  return policy.dossierRequiredSections.every((sectionId) => ids.includes(sectionId));
}

function visualEvidenceOk() {
  const artifact = readJson('artifacts/visual-smoke-evidence.json');
  if (!artifact?.ok) return false;
  const captures = Array.isArray(artifact.captures) ? artifact.captures : [];
  const required = ['mobile-360', 'mobile-390', 'mobile-430', 'tablet-768', 'desktop-1366', 'desktop-1440'];
  return required.every((viewportId) => captures.some((capture: AnyRecord) => capture.viewportId === viewportId && capture.status === 'pass'));
}

function hostedCiProofClosed() {
  const report = readJson('artifacts/runtime-p0-hosted-ci-final-proof-report-last-run.json');
  return Boolean(report?.ok && report?.publicRolloutAllowed && report?.nodeVersion?.startsWith?.('24.'));
}

function gateState(gate: AnyRecord): GateState {
  const artifact = readJson(gate.artifact);
  if (gate.id === 'data_validate') return artifactOk(gate.artifact) ? 'pass' : 'unverified';
  if (gate.id === 'batch132_ci_report') return hostedCiProofClosed() ? 'pass' : (currentNodeMajor() === 24 ? 'unverified' : 'blocked');
  if (gate.id === 'visual_smoke_evidence') return visualEvidenceOk() ? 'pass' : 'unverified';
  if (gate.id === 'public_rollout_dossier') return publicRolloutDossierOk() ? 'pass' : 'unverified';
  if (gate.id === 'hosted_p0_100_release') {
    if (artifactOk(gate.artifact) && currentNodeMajor() === 24 && Boolean(process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.GIAOAN_DEMO_URL)) return 'pass';
    return currentNodeMajor() === 24 ? 'unverified' : 'blocked';
  }
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
    required: Boolean(gate.required),
    blocksPublicRollout: Boolean(gate.blocksPublicRollout),
    artifactPresent: exists(gate.artifact),
    artifactOk: artifactOk(gate.artifact),
    state,
    ok: state === 'pass',
    note: gate.note || null
  };
}

function laneStatus(lane: AnyRecord, gates: AnyRecord[]) {
  const related = gates.filter((gate) => {
    if (lane.id === 'source_and_runtime_local') return ['source_validate', 'live_smoke_clean', 'loopback_hosted_style_smoke'].includes(gate.id);
    if (lane.id === 'hosted_public_proof') return ['batch132_ci_report', 'hosted_p0_100_release'].includes(gate.id);
    if (lane.id === 'security_data_protection') return ['security_data_protection_report', 'auth_invite_smoke'].includes(gate.id);
    if (lane.id === 'visual_ux_evidence') return gate.id === 'visual_smoke_evidence';
    if (lane.id === 'rollback_safe_mode') return gate.id === 'public_rollout_dossier';
    if (lane.id === 'no_user_validation') return gate.id === 'public_rollout_dossier';
    return false;
  });
  const pass = related.filter((gate) => gate.ok).length;
  const percent = related.length ? Math.round((pass / related.length) * 100) : 0;
  const blockers = related.filter((gate) => gate.blocksPublicRollout && !gate.ok);
  return {
    ...lane,
    percent,
    status: blockers.length ? 'blocked' : percent === 100 ? 'pass' : 'partial',
    relatedGateIds: related.map((gate) => gate.id),
    blockers: blockers.map((gate) => gate.id)
  };
}

export function buildPublicRolloutReadinessBoard() {
  const gates = (policy.requiredGates as AnyRecord[]).map(buildGate);
  const required = gates.filter((gate) => gate.required);
  const missingRequired = required.filter((gate) => !gate.ok);
  const rolloutBlockers = gates.filter((gate) => gate.blocksPublicRollout && !gate.ok);
  const failed = gates.filter((gate) => gate.state === 'fail');
  const blocked = gates.filter((gate) => gate.state === 'blocked');
  const sourceLevelGates = gates.filter((gate) => !['batch132_ci_report', 'visual_smoke_evidence', 'hosted_p0_100_release'].includes(gate.id));
  const sourceLevelPass = sourceLevelGates.filter((gate) => gate.ok).length;
  const sourceLevelReadinessPercent = sourceLevelGates.length ? Math.round((sourceLevelPass / sourceLevelGates.length) * 100) : 0;
  const evidenceReadinessPercent = required.length ? Math.round((required.filter((gate) => gate.ok).length / required.length) * 100) : 0;
  const lanes = (policy.readinessLanes as AnyRecord[]).map((lane) => laneStatus(lane, gates));
  const publicRolloutAllowed = missingRequired.length === 0 && rolloutBlockers.length === 0;

  return {
    ok: true,
    batch: policy.batch,
    version: policy.version,
    phase: policy.phase,
    generatedAt: new Date().toISOString(),
    selectedBecause: policy.selectedBecause,
    canImproveNow: policy.canImproveNow,
    nodeVersion: process.versions.node,
    node24: currentNodeMajor() === 24,
    appUrlPresent: Boolean(process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.GIAOAN_DEMO_URL),
    publicRolloutAllowed,
    productionReady: false,
    status: publicRolloutAllowed ? 'public_rollout_ready_evidence_closed' : blocked.length ? 'public_rollout_blocked_by_hosted_or_node24' : 'public_rollout_not_ready',
    sourceLevelReadinessPercent,
    evidenceReadinessPercent,
    gates,
    lanes,
    missingRequired,
    rolloutBlockers,
    failed,
    blocked,
    dossierRequiredSections: policy.dossierRequiredSections,
    allowedPilotScope: policy.allowedPilotScope,
    claimPolicy: policy.claimPolicy,
    nextCommands: missingRequired.map((gate) => gate.command),
    warning: 'Batch133 improves public rollout readiness controls only. It does not make the project hosted/public/production-ready without real Node24, APP_URL, visual, auth, and release evidence.'
  };
}
