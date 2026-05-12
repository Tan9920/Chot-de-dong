import fs from 'fs';
import path from 'path';

import policy from '@/data/p0-hosted-evidence-capture-policy.json';

type AnyRecord = Record<string, any>;
type EvidenceState = 'pass' | 'blocked' | 'unverified' | 'fail';

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

function nodeMajor() {
  return Number(process.versions.node.split('.')[0] || 0);
}

function appUrlPresent() {
  return Boolean(process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.GIAOAN_DEMO_URL);
}

function artifactOk(file?: string | null) {
  const artifact = readJson(file);
  return Boolean(artifact?.ok && !artifact?.skipped);
}

function visualEvidenceOk(file?: string | null) {
  const artifact = readJson(file);
  if (!artifact?.ok) return false;
  const captures = Array.isArray(artifact.captures) ? artifact.captures : [];
  const required = policy.visualEvidence.requiredViewports;
  return required.every((viewportId: string) =>
    captures.some((capture: AnyRecord) => capture.viewportId === viewportId && capture.status === 'pass')
  );
}

function node24ProofOk(file?: string | null) {
  const artifact = readJson(file);
  const artifactNodeMajor = Number(String(artifact?.nodeVersion || '').split('.')[0] || 0);
  return artifactOk(file) && artifactNodeMajor === 24;
}

function hostedReleaseOk(file?: string | null) {
  const artifact = readJson(file);
  return Boolean(artifact?.ok && artifact?.appUrlPresent === true && (artifact?.summary?.failed ?? 1) === 0);
}

function hostedSaveExportOk(file?: string | null) {
  const artifact = readJson(file);
  if (artifact?.skipped) return false;
  return Boolean(
    artifact?.ok === true &&
      (artifact?.hostedSummary?.batch98RealAccountSaveExportSmoke === true ||
        artifact?.summary?.batch98RealAccountSaveExportSmoke === true ||
        artifact?.saveExport?.ok === true)
  );
}

function publicRolloutReadinessOk(file?: string | null) {
  const artifact = readJson(file);
  return Boolean(artifact?.ok && artifact?.publicRolloutAllowed === true && artifact?.productionReady !== true);
}

function p0p1StabilityOk(file?: string | null) {
  const artifact = readJson(file);
  return Boolean(artifact?.ok && artifact?.localP0Stable === true && artifact?.p1FoundationSourceReady === true);
}

function evidenceState(item: AnyRecord): EvidenceState {
  const artifact = readJson(item.artifact);
  if (item.id === 'node24_ci') return node24ProofOk(item.artifact) ? 'pass' : 'blocked';
  if (item.id === 'hosted_release_strict') return hostedReleaseOk(item.artifact) ? 'pass' : appUrlPresent() ? 'unverified' : 'blocked';
  if (item.id === 'hosted_save_export_smoke') return hostedSaveExportOk(item.artifact) ? 'pass' : appUrlPresent() ? 'unverified' : 'blocked';
  if (item.id === 'visual_smoke_evidence') return visualEvidenceOk(item.artifact) ? 'pass' : 'unverified';
  if (item.id === 'public_rollout_readiness') return publicRolloutReadinessOk(item.artifact) ? 'pass' : 'blocked';
  if (item.id === 'p0_p1_stability') return p0p1StabilityOk(item.artifact) ? 'pass' : artifact?.ok === false ? 'fail' : 'unverified';
  if (artifact?.ok === false) return 'fail';
  return artifactOk(item.artifact) ? 'pass' : 'unverified';
}

function buildEvidence(item: AnyRecord) {
  const state = evidenceState(item);
  return {
    id: item.id,
    label: item.label,
    command: item.command,
    artifact: item.artifact,
    artifactPresent: exists(item.artifact),
    artifactOk: artifactOk(item.artifact),
    required: Boolean(item.required),
    blocksPublicRollout: Boolean(item.blocksPublicRollout),
    howToCapture: item.howToCapture,
    state,
    ok: state === 'pass'
  };
}

export function buildP0HostedEvidenceCaptureBoard() {
  const evidence = (policy.requiredEvidence as AnyRecord[]).map(buildEvidence);
  const missingRequired = evidence.filter((item) => item.required && item.state !== 'pass');
  const blockers = missingRequired.filter((item) => item.blocksPublicRollout).map((item) => item.id);
  const hostedProofClosed = missingRequired.length === 0;
  return {
    ok: true,
    batch: policy.batch,
    version: policy.version,
    phase: policy.phase,
    generatedAt: new Date().toISOString(),
    nodeVersion: process.versions.node,
    node24: nodeMajor() === 24,
    appUrlPresent: appUrlPresent(),
    sourceLevelOnly: policy.sourceLevelOnly,
    hostedProofClosed,
    publicRolloutAllowed: false,
    productionReady: false,
    evidence,
    blockers,
    missingRequired,
    runOrder: policy.runOrder,
    githubActions: policy.githubActions,
    visualEvidence: policy.visualEvidence,
    claimPolicy: policy.claimPolicy,
    nextCommands: missingRequired.length ? missingRequired.map((item) => item.command) : ['APP_URL=https://<vercel-url> npm run verify:p0-100-release'],
    warning: 'Batch137 captures the P0 hosted proof plan and current blockers. It does not deploy or mark public rollout allowed without real Node24/APP_URL/visual evidence.'
  };
}
