import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const policy = JSON.parse(fs.readFileSync(path.join(root, 'data/p0-hosted-proof-execution-gate-policy.json'), 'utf8'));
const artifactPath = 'artifacts/p0-hosted-proof-execution-gate-last-run.json';
const markdownPath = 'artifacts/p0-hosted-proof-execution-gate-checklist.md';

function readJson(rel, fallback = null) {
  if (!rel) return fallback;
  try { return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')); } catch { return fallback; }
}
function exists(rel) { return Boolean(rel && fs.existsSync(path.join(root, rel))); }
function nodeMajorFrom(value) { return Number(String(value || '').split('.')[0] || 0); }
function nodeMajor() { return nodeMajorFrom(process.versions.node); }
function appUrl() { return process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.GIAOAN_DEMO_URL || ''; }
function artifactOk(rel) { const item = readJson(rel); return Boolean(item?.ok && !item?.skipped); }
function node24ProofOk(rel) { const item = readJson(rel); return artifactOk(rel) && nodeMajorFrom(item?.nodeVersion) === 24; }
function hostedReleaseOk(rel) { const item = readJson(rel); return Boolean(item?.ok === true && item?.appUrlPresent === true && (item?.summary?.failed ?? 1) === 0); }
function hostedSaveExportOk(rel) {
  const item = readJson(rel);
  if (item?.skipped) return false;
  return Boolean(item?.ok === true && (item?.summary?.batch98RealAccountSaveExportSmoke === true || item?.hostedSummary?.batch98RealAccountSaveExportSmoke === true || item?.saveExport?.ok === true));
}
function visualEvidenceOk(rel) {
  const item = readJson(rel);
  if (!item?.ok) return false;
  const captures = Array.isArray(item.captures) ? item.captures : [];
  return policy.visualEvidence.requiredViewports.every((viewportId) => captures.some((capture) => capture.viewportId === viewportId && capture.status === 'pass'));
}
function p0p1StabilityOk(rel) { const item = readJson(rel); return Boolean(item?.ok && item?.localP0Stable === true && item?.p1FoundationSourceReady === true); }
function captureBoardOk(rel) { const item = readJson(rel); return Boolean(item?.ok && item?.hostedProofClosed === true && Array.isArray(item?.missingRequired) && item.missingRequired.length === 0); }
function publicRolloutReadinessOk(rel) { const item = readJson(rel); return Boolean(item?.ok && item?.publicRolloutAllowed === true); }
function gateState(gate) {
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
function buildGate(gate) {
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
const gates = policy.hardGates.map(buildGate);
const missingRequired = gates.filter((item) => item.required && item.state !== 'pass');
const blockers = missingRequired.filter((item) => item.blocksHostedProof).map((item) => item.id);
const hostedProofClosed = missingRequired.length === 0;
const report = {
  ok: true,
  batch: policy.batch,
  version: policy.version,
  generatedAt: new Date().toISOString(),
  nodeVersion: process.versions.node,
  node24: nodeMajor() === 24,
  appUrlPresent: Boolean(appUrl()),
  appUrl: appUrl() ? '[provided]' : '',
  sourceLevelOnly: true,
  hostedProofClosed,
  safeToExpandBeyondP1: hostedProofClosed && blockers.length === 0,
  publicRolloutAllowed: Boolean(hostedProofClosed && publicRolloutReadinessOk('artifacts/public-rollout-readiness-report-last-run.json')),
  productionReady: false,
  gates,
  missingRequired,
  blockers,
  nextCommands: missingRequired.length ? missingRequired.map((item) => item.command) : ['npm run verify:p0-hosted-ci-proof', 'npm run public-rollout:readiness-report'],
  ciContract: policy.ciContract,
  executionModes: policy.executionModes,
  visualEvidence: policy.visualEvidence,
  claimPolicy: policy.claimPolicy,
  noAiPaymentVerifiedFakeAdded: true,
  warning: 'ok=true means the execution gate report was generated. hostedProofClosed must be true before claiming hosted proof closed. productionReady remains false without separate production DB/security/legal review.'
};
const markdown = [
  '# Batch138 P0 Hosted Proof Execution Gate',
  '',
  `Generated: ${report.generatedAt}`,
  `Node: ${report.nodeVersion}`,
  `APP_URL present: ${report.appUrlPresent}`,
  `Hosted proof closed: ${report.hostedProofClosed}`,
  `Public rollout allowed: ${report.publicRolloutAllowed}`,
  `Production ready: ${report.productionReady}`,
  '',
  '## Hard gates',
  ...gates.map((gate) => `- [${gate.state === 'pass' ? 'x' : ' '}] ${gate.label} — ${gate.state.toUpperCase()} — \`${gate.command}\``),
  '',
  '## Next commands',
  ...(report.nextCommands.length ? report.nextCommands.map((command) => `- \`${command}\``) : ['- All gates are marked pass; rerun final CI proof and public rollout readiness.']),
  '',
  '## Blocked claims',
  ...policy.claimPolicy.blocked.map((claim) => `- ${claim}`),
  '',
  '## Notes',
  '- This report does not deploy to Vercel and does not capture screenshots by itself.',
  '- A local Node22 dry run should remain blocked for Node24/APP_URL/visual evidence.',
  '- Keep No-AI, no payment, no fake verified data and no community auto-public.'
].join('\n') + '\n';
fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
fs.writeFileSync(path.join(root, artifactPath), JSON.stringify(report, null, 2) + '\n');
fs.writeFileSync(path.join(root, markdownPath), markdown);
console.log(JSON.stringify({ ...report, artifactPath, markdownPath }, null, 2));
process.exit(0);
