import fs from 'fs';
import path from 'path';

import policy from '@/data/p0-p1-final-closure-policy.json';

type AnyRecord = Record<string, any>;
type GateState = 'pass' | 'fail' | 'unverified' | 'blocked';

function readJson(file?: string | null, fallback: any = null) {
  if (!file) return fallback;
  try { return JSON.parse(fs.readFileSync(path.join(process.cwd(), file), 'utf8')); }
  catch { return fallback; }
}
function exists(file?: string | null) { return Boolean(file && fs.existsSync(path.join(process.cwd(), file))); }
function nodeMajor(version = process.versions.node) { return Number(String(version || '').split('.')[0] || 0); }
function get(obj: any, pathExpr: string) { return pathExpr.split('.').reduce((acc, key) => acc?.[key], obj); }
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

function visualEvidenceOk(file?: string | null) {
  const artifact = readJson(file);
  if (!artifact?.ok) return false;
  const captures = Array.isArray(artifact.captures) ? artifact.captures : [];
  const required = policy.canonicalVisualViewportIds as string[];
  return required.every((viewportId) => {
    const capture = captures.find((item: AnyRecord) => item?.viewportId === viewportId && item?.status === 'pass');
    if (!capture?.screenshotPath) return false;
    const absolute = path.join(process.cwd(), capture.screenshotPath);
    return fs.existsSync(absolute) && fs.statSync(absolute).size >= 8000;
  });
}
function gatePass(gate: AnyRecord) {
  const artifact = readJson(gate.artifact);
  if (gate.id === 'raw_build_diagnostic') return rawBuildOk(gate.artifact);
  if (gate.id === 'local_evidence_report') return Boolean(artifact?.ok && artifact?.localEvidenceReady && artifact?.evidenceIntegrityReady && artifact?.higherLocalP0P1ClaimAllowed);
  if (gate.id === 'stability_report') return Boolean(artifact?.ok && artifact?.localP0Stable && artifact?.p1FoundationSourceReady);
  if (gate.id === 'security_data_protection') return Boolean(artifact?.ok && artifact?.publicRolloutAllowed !== true);
  if (gate.id === 'auth_invite_runtime_smoke') return Boolean(artifact?.ok && artifact?.summary?.batch98InviteRuntimeSmoke === true);
  if (gate.id === 'live_smoke_production') return Boolean(artifact?.ok && artifact?.smokeMode === 'production');
  if (gate.id === 'loopback_hosted_style_smoke') return Boolean(artifact?.ok && artifact?.hostedSummary?.batch98RealAccountSaveExportSmoke === true);
  if (gate.id === 'hosted_ci_final_proof') return Boolean(artifact?.ok && artifact?.publicRolloutAllowed === true);
  if (gate.id === 'public_rollout_readiness') return Boolean(artifact?.ok && artifact?.publicRolloutAllowed === true);
  if (gate.id === 'visual_smoke_evidence') return visualEvidenceOk(gate.artifact);
  return Boolean(artifact?.ok && !artifact?.skipped);
}
function gateIssues(gate: AnyRecord) {
  const artifact = readJson(gate.artifact);
  const issues: string[] = [];
  if (!artifact) return ['missing_artifact'];
  if (artifact.ok === false) issues.push('artifact_ok_false');
  if (artifact.skipped) issues.push('artifact_skipped');
  if (gate.id === 'local_evidence_report') {
    for (const key of ['localEvidenceReady', 'evidenceIntegrityReady', 'higherLocalP0P1ClaimAllowed']) if (artifact?.[key] !== true) issues.push(`${key}_not_true`);
  }
  if (gate.id === 'stability_report') {
    for (const key of ['localP0Stable', 'p1FoundationSourceReady']) if (artifact?.[key] !== true) issues.push(`${key}_not_true`);
  }
  if (gate.id === 'auth_invite_runtime_smoke' && artifact?.summary?.batch98InviteRuntimeSmoke !== true) issues.push('batch98InviteRuntimeSmoke_not_true');
  if (gate.id === 'live_smoke_production' && artifact?.smokeMode !== 'production') issues.push(`smokeMode_${artifact?.smokeMode || 'missing'}_not_production`);
  if (gate.id === 'loopback_hosted_style_smoke' && artifact?.hostedSummary?.batch98RealAccountSaveExportSmoke !== true) issues.push('batch98RealAccountSaveExportSmoke_not_true');
  if (gate.id === 'hosted_ci_final_proof' && artifact?.publicRolloutAllowed !== true) issues.push('hosted_public_rollout_not_closed');
  if (gate.id === 'public_rollout_readiness' && artifact?.publicRolloutAllowed !== true) issues.push('public_rollout_not_allowed');
  if (gate.id === 'raw_build_diagnostic' && !rawBuildOk(gate.artifact)) issues.push('raw_build_exit_zero_contract_not_met');
  if (gate.id === 'visual_smoke_evidence' && !visualEvidenceOk(gate.artifact)) issues.push('visual_screenshot_contract_not_met');
  return issues;
}
function gateState(gate: AnyRecord, hosted = false): GateState {
  if (gatePass(gate)) return 'pass';
  const artifact = readJson(gate.artifact);
  if (hosted && !artifact) return 'blocked';
  if (hosted && artifact?.ok === false) return 'blocked';
  if (artifact?.ok === false) return 'fail';
  return hosted ? 'blocked' : 'unverified';
}
function buildGate(gate: AnyRecord, hosted = false) {
  const state = gateState(gate, hosted);
  const artifact = readJson(gate.artifact);
  return {
    id: gate.id,
    label: gate.label,
    command: gate.command,
    artifact: gate.artifact,
    artifactPresent: exists(gate.artifact),
    artifactOk: gatePass(gate),
    required: Boolean(gate.required),
    state,
    ok: state === 'pass',
    issues: gateIssues(gate),
    artifactGeneratedAt: artifact?.generatedAt || artifact?.finishedAt || null,
    passWhen: gate.passWhen || []
  };
}
function requiredPass(gates: ReturnType<typeof buildGate>[]) { return gates.filter((g) => g.required).every((g) => g.ok); }

export function buildP0P1FinalClosureBoard() {
  const localGates = (policy.localP0P1ClosureEvidence as AnyRecord[]).map((gate) => buildGate(gate, false));
  const hostedGates = (policy.hostedPublicClosureEvidence as AnyRecord[]).map((gate) => buildGate(gate, true));
  const localP0P1Closed = requiredPass(localGates);
  const hostedPublicClosed = requiredPass(hostedGates);
  const allP0P1PublicClosed = localP0P1Closed && hostedPublicClosed;
  const blockers = [...localGates, ...hostedGates].filter((gate) => gate.required && !gate.ok).map((gate) => `${gate.state}:${gate.id}`);
  return {
    ok: localP0P1Closed,
    batch: policy.batch,
    version: policy.version,
    phase: policy.phase,
    generatedAt: new Date().toISOString(),
    nodeVersion: process.versions.node,
    node24: nodeMajor() === 24,
    appUrlPresent: Boolean(process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.GIAOAN_DEMO_URL),
    localP0P1Closed,
    hostedPublicClosed,
    allP0P1PublicClosed,
    localClosurePercent: Math.round((localGates.filter((g) => g.ok).length / Math.max(1, localGates.length)) * 100),
    hostedClosurePercent: Math.round((hostedGates.filter((g) => g.ok).length / Math.max(1, hostedGates.length)) * 100),
    publicRolloutAllowed: allP0P1PublicClosed,
    productionReady: false,
    localGates,
    hostedGates,
    blockers,
    nextCommands: blockers.length ? [...localGates, ...hostedGates].filter((gate) => gate.required && !gate.ok).map((gate) => gate.command) : ['Run legal/production DB/security review before wider public rollout.'],
    canonicalVisualViewportIds: policy.canonicalVisualViewportIds,
    claimPolicy: policy.claimPolicy,
    noAiPaymentVerifiedFakeAdded: true,
    warning: localP0P1Closed && !hostedPublicClosed
      ? 'Local/source P0/P1 closure candidate is reached, but hosted/public proof is still blocked. Do not claim production-ready or 100% until hosted gates pass.'
      : 'P0/P1 final closure still has local/source blockers; fix those before public/hosted claims.'
  };
}
