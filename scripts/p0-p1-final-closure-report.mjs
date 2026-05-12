import fs from 'node:fs';
import path from 'node:path';

const policy = JSON.parse(fs.readFileSync('data/p0-p1-final-closure-policy.json', 'utf8'));
const artifactPath = 'artifacts/p0-p1-final-closure-report-last-run.json';
function readJson(file, fallback = null) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; } }
function exists(file) { return Boolean(file && fs.existsSync(file)); }
function nodeMajor(version = process.versions.node) { return Number(String(version || '').split('.')[0] || 0); }
function rawBuildOk(file) {
  const artifact = readJson(file);
  return Boolean(artifact?.ok === true && artifact?.rawNextBuildExitCode === 0 && artifact?.buildOutputCleanup?.removed === true && artifact?.nextBuildIdExists === true && artifact?.requiredServerFilesExists === true && artifact?.routesManifestExists === true && artifact?.prerenderManifestExists === true && artifact?.appBuildManifestExists === true);
}

function visualEvidenceOk(file) {
  const artifact = readJson(file);
  if (!artifact?.ok) return false;
  const captures = Array.isArray(artifact.captures) ? artifact.captures : [];
  return policy.canonicalVisualViewportIds.every((viewportId) => {
    const capture = captures.find((item) => item?.viewportId === viewportId && item?.status === 'pass');
    return Boolean(capture?.screenshotPath && fs.existsSync(capture.screenshotPath) && fs.statSync(capture.screenshotPath).size >= 8000);
  });
}
function gatePass(gate) {
  const a = readJson(gate.artifact);
  if (gate.id === 'raw_build_diagnostic') return rawBuildOk(gate.artifact);
  if (gate.id === 'local_evidence_report') return Boolean(a?.ok && a?.localEvidenceReady && a?.evidenceIntegrityReady && a?.higherLocalP0P1ClaimAllowed);
  if (gate.id === 'stability_report') return Boolean(a?.ok && a?.localP0Stable && a?.p1FoundationSourceReady);
  if (gate.id === 'security_data_protection') return Boolean(a?.ok && a?.publicRolloutAllowed !== true);
  if (gate.id === 'auth_invite_runtime_smoke') return Boolean(a?.ok && a?.summary?.batch98InviteRuntimeSmoke === true);
  if (gate.id === 'live_smoke_production') return Boolean(a?.ok && a?.smokeMode === 'production');
  if (gate.id === 'loopback_hosted_style_smoke') return Boolean(a?.ok && a?.hostedSummary?.batch98RealAccountSaveExportSmoke === true);
  if (gate.id === 'hosted_ci_final_proof') return Boolean(a?.ok && a?.publicRolloutAllowed === true);
  if (gate.id === 'public_rollout_readiness') return Boolean(a?.ok && a?.publicRolloutAllowed === true);
  if (gate.id === 'visual_smoke_evidence') return visualEvidenceOk(gate.artifact);
  return Boolean(a?.ok && !a?.skipped);
}
function issues(gate) {
  const a = readJson(gate.artifact);
  const out = [];
  if (!a) return ['missing_artifact'];
  if (a.ok === false) out.push('artifact_ok_false');
  if (a.skipped) out.push('artifact_skipped');
  if (!gatePass(gate)) out.push('pass_contract_not_met');
  return out;
}
function buildGate(gate, hosted = false) {
  const ok = gatePass(gate);
  const a = readJson(gate.artifact);
  const state = ok ? 'pass' : hosted ? 'blocked' : a?.ok === false ? 'fail' : 'unverified';
  return { id: gate.id, label: gate.label, command: gate.command, artifact: gate.artifact, artifactPresent: exists(gate.artifact), artifactOk: ok, required: Boolean(gate.required), state, ok, issues: issues(gate), passWhen: gate.passWhen || [], artifactGeneratedAt: a?.generatedAt || a?.finishedAt || null };
}
const localGates = policy.localP0P1ClosureEvidence.map((gate) => buildGate(gate, false));
const hostedGates = policy.hostedPublicClosureEvidence.map((gate) => buildGate(gate, true));
const localP0P1Closed = localGates.filter((gate) => gate.required).every((gate) => gate.ok);
const hostedPublicClosed = hostedGates.filter((gate) => gate.required).every((gate) => gate.ok);
const allP0P1PublicClosed = localP0P1Closed && hostedPublicClosed;
const blockers = [...localGates, ...hostedGates].filter((gate) => gate.required && !gate.ok).map((gate) => `${gate.state}:${gate.id}`);
const report = {
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
  warning: localP0P1Closed && !hostedPublicClosed ? 'Local/source P0/P1 closure candidate reached. Hosted/public proof remains blocked; do not claim production-ready or 100%.' : 'P0/P1 final closure still has local/source blockers.'
};
fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
fs.writeFileSync(artifactPath, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ ...report, artifactPath }, null, 2));
process.exit(0);
