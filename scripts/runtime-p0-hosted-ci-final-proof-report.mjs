import fs from 'node:fs';
import path from 'node:path';

const policy = JSON.parse(fs.readFileSync('data/runtime-p0-hosted-ci-final-proof-policy.json', 'utf8'));
const artifactPath = 'artifacts/runtime-p0-hosted-ci-final-proof-report-last-run.json';

function readJson(file, fallback = null) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
function exists(file) { return fs.existsSync(file); }
function nodeMajor(version = process.versions.node) { return Number(String(version || '').split('.')[0] || 0); }
function resultById(artifact, id) { return (Array.isArray(artifact?.results) ? artifact.results : []).find((item) => item?.id === id); }
function resultStatus(artifact, id) { return resultById(artifact, id)?.status; }
function allIdsHaveStatus(artifact, ids = [], status) { return ids.every((id) => resultStatus(artifact, id) === status); }
function ciProvenanceOk(artifact, contract = {}) {
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
function hasBoolean(artifact, key, value) { return artifact?.[key] === value || artifact?.artifactContract?.[key] === value; }

function visualOk() {
  const evidence = readJson('artifacts/visual-smoke-evidence.json');
  if (!evidence?.ok) return false;
  const captures = Array.isArray(evidence.captures) ? evidence.captures : [];
  return policy.visualEvidence.requiredViewports.every((viewportId) => captures.some((capture) => capture.viewportId === viewportId && capture.status === 'pass'));
}

function hostedUrlSmokeOk(artifact, contract = {}) {
  if (!artifact?.ok || artifact?.skipped) return false;
  if (contract.mustHaveBase && !artifact.base) return false;
  if (contract.mustHaveSummaryKey && artifact.summary?.[contract.mustHaveSummaryKey] !== true) return false;
  return true;
}

function releaseArtifactOk(artifact, contract = {}) {
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

function deepestNode24Ok(artifact, contract = {}) {
  if (!artifact?.ok || artifact?.skipped) return false;
  if (contract.command && artifact.command !== contract.command) return false;
  if (contract.requireNode24 && artifact.requireNode24 !== true) return false;
  if (contract.nodeMajor && nodeMajor(artifact.nodeVersion) !== contract.nodeMajor) return false;
  if (Array.isArray(contract.mustPassIds) && !allIdsHaveStatus(artifact, contract.mustPassIds, 'PASS')) return false;
  if (!ciProvenanceOk(artifact, contract)) return false;
  return true;
}

function artifactPass(item) {
  const artifact = readJson(item.artifact);
  const contract = item.artifactContract || {};
  if (item.id === 'node24_ci_deepest') return deepestNode24Ok(artifact, contract);
  if (item.id === 'hosted_release_strict') return releaseArtifactOk(artifact, contract);
  if (item.id === 'hosted_url_save_export') return hostedUrlSmokeOk(artifact, contract);
  if (item.id === 'visual_smoke_evidence') return visualOk();
  if (item.id === 'p0_100_release') return releaseArtifactOk(artifact, contract);
  return Boolean(artifact?.ok && !artifact?.skipped);
}

function artifactContractIssues(item) {
  const artifact = readJson(item.artifact);
  const contract = item.artifactContract || {};
  const issues = [];
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
    if (!visualOk()) issues.push('visual_smoke_contract_not_met');
  }
  return issues;
}

function evidenceState(item) {
  const artifact = readJson(item.artifact);
  if (artifactPass(item)) return 'pass';
  if (item.id === 'node24_ci_deepest') return nodeMajor() === 24 ? 'unverified' : 'blocked';
  if (artifact?.ok === false) return 'fail';
  return 'unverified';
}

const evidence = policy.requiredEvidence.map((item) => {
  const contractIssues = artifactContractIssues(item);
  return {
    id: item.id,
    label: item.label,
    command: item.command,
    artifact: item.artifact,
    required: Boolean(item.required),
    artifactPresent: exists(item.artifact),
    artifactOk: artifactPass(item),
    artifactContractIssues: contractIssues,
    state: evidenceState(item),
    blocksPublicRollout: Boolean(item.blocksPublicRollout)
  };
});
const missingRequired = evidence.filter((item) => item.required && item.state !== 'pass');
const report = {
  ok: missingRequired.length === 0,
  batch: policy.batch,
  version: policy.version,
  generatedAt: new Date().toISOString(),
  nodeVersion: process.versions.node,
  appUrlPresent: Boolean(process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.GIAOAN_DEMO_URL),
  workflowFilePresent: exists(policy.workflow.file),
  publicRolloutAllowed: missingRequired.length === 0,
  productionReady: false,
  readinessPercent: evidence.length ? Math.round((evidence.filter((item) => item.state === 'pass').length / evidence.length) * 100) : 0,
  evidence,
  missingRequired,
  artifactIntegrityRules: policy.artifactIntegrityRules || [],
  nextCommands: missingRequired.map((item) => item.command),
  workflow: policy.workflow,
  visualEvidence: policy.visualEvidence,
  noAiPaymentVerifiedFakeAdded: true,
  warning: 'Batch143 report exits 0 so you can inspect state. ok=false means do not claim hosted/public/100%. Node24 proof must include GitHub Actions provenance; hosted strict and P0-100 artifacts must be separate and proof-profile matched.'
};
fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
fs.writeFileSync(artifactPath, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ ...report, artifactPath }, null, 2));
