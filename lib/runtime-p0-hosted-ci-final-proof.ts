import fs from 'fs';
import path from 'path';

import policy from '@/data/runtime-p0-hosted-ci-final-proof-policy.json';

type EvidenceStatus = 'pass' | 'blocked' | 'unverified' | 'fail';
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

function nodeMajor(version = process.versions.node) {
  return Number(String(version || '').split('.')[0] || 0);
}

function resultById(artifact: AnyRecord | null, id: string) {
  return (Array.isArray(artifact?.results) ? artifact.results : []).find((item: AnyRecord) => item?.id === id);
}

function resultStatus(artifact: AnyRecord | null, id: string) {
  return resultById(artifact, id)?.status;
}

function allIdsHaveStatus(artifact: AnyRecord | null, ids: string[] = [], status: string) {
  return ids.every((id) => resultStatus(artifact, id) === status);
}
function ciProvenanceOk(artifact: AnyRecord | null, contract: AnyRecord = {}) {
  if (!contract.requireCiProvenance) return true;
  const ci = artifact?.ciProvenance || {};
  if (contract.ciProvider === 'github_actions' && ci.githubActions !== true) return false;
  for (const key of contract.mustHaveCiFields || []) {
    const value = ci[key];
    if (key === 'githubActions') { if (value !== true) return false; }
    else if (!String(value || '').trim()) return false;
  }
  return true;
}

function hasBoolean(artifact: AnyRecord | null, key: string, value: boolean) {
  return artifact?.[key] === value || artifact?.artifactContract?.[key] === value;
}

function visualEvidenceOk() {
  const artifact = readJson('artifacts/visual-smoke-evidence.json');
  if (!artifact?.ok) return false;
  const captures = Array.isArray(artifact.captures) ? artifact.captures : [];
  const required = policy.visualEvidence.requiredViewports;
  return required.every((viewportId: string) => captures.some((capture: AnyRecord) => capture.viewportId === viewportId && capture.status === 'pass'));
}

function hostedUrlSmokeOk(artifact: AnyRecord | null, contract: AnyRecord = {}) {
  if (!artifact?.ok || artifact?.skipped) return false;
  if (contract.mustHaveBase && !artifact.base) return false;
  if (contract.mustHaveSummaryKey && artifact.summary?.[contract.mustHaveSummaryKey] !== true) return false;
  return true;
}

function releaseArtifactOk(artifact: AnyRecord | null, contract: AnyRecord = {}) {
  if (!artifact?.ok || artifact?.skipped) return false;
  if (contract.command && artifact.command !== contract.command) return false;
  if (contract.proofProfile && artifact.proofProfile !== contract.proofProfile) return false;
  for (const key of ['requireNode24', 'requireHostedUrl', 'requireVisualSmoke']) {
    if (Object.prototype.hasOwnProperty.call(contract, key) && !hasBoolean(artifact, key, contract[key])) return false;
  }
  if (Array.isArray(contract.mustPassIds) && !allIdsHaveStatus(artifact, contract.mustPassIds, 'PASS')) return false;
  if (Array.isArray(contract.mustSkipIds) && !allIdsHaveStatus(artifact, contract.mustSkipIds, 'SKIP')) return false;
  return true;
}

function deepestNode24Ok(artifact: AnyRecord | null, contract: AnyRecord = {}) {
  if (!artifact?.ok || artifact?.skipped) return false;
  if (contract.command && artifact.command !== contract.command) return false;
  if (contract.requireNode24 && artifact.requireNode24 !== true) return false;
  if (contract.nodeMajor && nodeMajor(artifact.nodeVersion) !== contract.nodeMajor) return false;
  if (Array.isArray(contract.mustPassIds) && !allIdsHaveStatus(artifact, contract.mustPassIds, 'PASS')) return false;
  if (!ciProvenanceOk(artifact, contract)) return false;
  return true;
}

function artifactPass(item: AnyRecord) {
  const artifact = readJson(item.artifact);
  const contract = item.artifactContract || {};
  if (item.id === 'node24_ci_deepest') return deepestNode24Ok(artifact, contract);
  if (item.id === 'hosted_release_strict') return releaseArtifactOk(artifact, contract);
  if (item.id === 'hosted_url_save_export') return hostedUrlSmokeOk(artifact, contract);
  if (item.id === 'visual_smoke_evidence') return visualEvidenceOk();
  if (item.id === 'p0_100_release') return releaseArtifactOk(artifact, contract);
  return Boolean(artifact?.ok && !artifact?.skipped);
}

function artifactContractIssues(item: AnyRecord) {
  const artifact = readJson(item.artifact);
  const contract = item.artifactContract || {};
  const issues: string[] = [];
  if (!artifact) return ['missing_artifact'];
  if (artifact?.ok === false) issues.push('artifact_ok_false');
  if (artifact?.skipped) issues.push('artifact_skipped');
  if (item.id === 'node24_ci_deepest') {
    if (contract.command && artifact.command !== contract.command) issues.push(`command_mismatch:${artifact.command || 'missing'}`);
    if (contract.requireNode24 && artifact.requireNode24 !== true) issues.push('missing_requireNode24_true');
    if (contract.nodeMajor && nodeMajor(artifact.nodeVersion) !== contract.nodeMajor) issues.push(`node_major_${nodeMajor(artifact.nodeVersion)}_not_${contract.nodeMajor}`);
    if (!ciProvenanceOk(artifact, contract)) issues.push('ci_provenance_contract_not_met');
    for (const id of contract.mustPassIds || []) if (resultStatus(artifact, id) !== 'PASS') issues.push(`missing_pass_result:${id}`);
  } else if (item.id === 'hosted_release_strict' || item.id === 'p0_100_release') {
    if (contract.command && artifact.command !== contract.command) issues.push(`command_mismatch:${artifact.command || 'missing'}`);
    if (contract.proofProfile && artifact.proofProfile !== contract.proofProfile) issues.push(`proofProfile_mismatch:${artifact.proofProfile || 'missing'}`);
    for (const key of ['requireNode24', 'requireHostedUrl', 'requireVisualSmoke']) {
      if (Object.prototype.hasOwnProperty.call(contract, key) && !hasBoolean(artifact, key, contract[key])) issues.push(`${key}_mismatch`);
    }
    for (const id of contract.mustPassIds || []) if (resultStatus(artifact, id) !== 'PASS') issues.push(`missing_pass_result:${id}`);
    for (const id of contract.mustSkipIds || []) if (resultStatus(artifact, id) !== 'SKIP') issues.push(`missing_skip_result:${id}`);
  } else if (item.id === 'hosted_url_save_export') {
    if (!hostedUrlSmokeOk(artifact, contract)) issues.push('hosted_url_smoke_contract_not_met');
  } else if (item.id === 'visual_smoke_evidence') {
    if (!visualEvidenceOk()) issues.push('visual_smoke_contract_not_met');
  }
  return issues;
}

function evidenceState(item: AnyRecord): EvidenceStatus {
  const artifact = readJson(item.artifact);
  if (artifactPass(item)) return 'pass';
  if (item.id === 'node24_ci_deepest') return nodeMajor() === 24 ? 'unverified' : 'blocked';
  if (artifact?.ok === false) return 'fail';
  return 'unverified';
}

function buildEvidence(item: AnyRecord) {
  const state = evidenceState(item);
  const contractIssues = artifactContractIssues(item);
  return {
    id: item.id,
    label: item.label,
    command: item.command,
    artifact: item.artifact,
    artifactPresent: exists(item.artifact),
    artifactOk: artifactPass(item),
    artifactContractIssues: contractIssues,
    required: Boolean(item.required),
    blocksPublicRollout: Boolean(item.blocksPublicRollout),
    state,
    ok: state === 'pass'
  };
}

export function buildP0HostedCiFinalProofBoard() {
  const evidence = (policy.requiredEvidence as AnyRecord[]).map(buildEvidence);
  const missingRequired = evidence.filter((item) => item.required && !item.ok);
  const blocked = evidence.filter((item) => item.state === 'blocked');
  const failed = evidence.filter((item) => item.state === 'fail');
  const passCount = evidence.filter((item) => item.ok).length;
  const appUrlPresent = Boolean(process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.GIAOAN_DEMO_URL);
  const publicRolloutAllowed = evidence.length > 0 && missingRequired.length === 0;

  return {
    ok: true,
    batch: policy.batch,
    version: policy.version,
    phase: policy.phase,
    status: publicRolloutAllowed ? 'p0_hosted_ci_final_proof_closed' : blocked.length ? 'p0_hosted_ci_blocked' : 'p0_hosted_ci_unverified',
    generatedAt: new Date().toISOString(),
    nodeVersion: process.versions.node,
    node24: nodeMajor() === 24,
    appUrlPresent,
    publicRolloutAllowed,
    productionReady: false,
    readinessPercent: evidence.length ? Math.round((passCount / evidence.length) * 100) : 0,
    evidence,
    missingRequired,
    blocked,
    failed,
    workflow: policy.workflow,
    visualEvidence: policy.visualEvidence,
    artifactIntegrityRules: policy.artifactIntegrityRules || [],
    claimPolicy: policy.claimPolicy,
    nextCommands: missingRequired.map((item) => item.command),
    warning: 'Batch143 requires GitHub Actions provenance for Node24 CI proof and keeps public rollout blocked unless every required artifact matches command/profile/provenance, APP_URL and visual evidence.'
  };
}
