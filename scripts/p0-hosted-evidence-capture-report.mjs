import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const policy = JSON.parse(fs.readFileSync(path.join(root, 'data/p0-hosted-evidence-capture-policy.json'), 'utf8'));
const artifactPath = 'artifacts/p0-hosted-evidence-capture-report-last-run.json';
const checklistPath = 'artifacts/p0-hosted-evidence-capture-checklist.md';
// Batch137 marker: npm run visual:smoke:evidence-validate must be run against real browser evidence, not just a template.

function readJson(rel, fallback = null) {
  if (!rel) return fallback;
  try { return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')); } catch { return fallback; }
}
function exists(rel) { return Boolean(rel && fs.existsSync(path.join(root, rel))); }
function artifactOk(rel) { const item = readJson(rel); return Boolean(item?.ok && !item?.skipped); }
function nodeMajor() { return Number(process.versions.node.split('.')[0] || 0); }
function appUrlPresent() { return Boolean(process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.GIAOAN_DEMO_URL); }
function visualEvidenceOk(rel) {
  const item = readJson(rel);
  if (!item?.ok) return false;
  const captures = Array.isArray(item.captures) ? item.captures : [];
  return policy.visualEvidence.requiredViewports.every((viewportId) => captures.some((capture) => capture.viewportId === viewportId && capture.status === 'pass'));
}
function node24ProofOk(rel) {
  const item = readJson(rel);
  const artifactNodeMajor = Number(String(item?.nodeVersion || '').split('.')[0] || 0);
  return artifactOk(rel) && artifactNodeMajor === 24;
}
function hostedReleaseOk(rel) {
  const item = readJson(rel);
  return Boolean(item?.ok && item?.appUrlPresent === true && (item?.summary?.failed ?? 1) === 0);
}
function hostedSaveExportOk(rel) {
  const item = readJson(rel);
  if (item?.skipped) return false;
  return Boolean(item?.ok === true && (item?.hostedSummary?.batch98RealAccountSaveExportSmoke === true || item?.summary?.batch98RealAccountSaveExportSmoke === true || item?.saveExport?.ok === true));
}
function publicRolloutReadinessOk(rel) {
  const item = readJson(rel);
  return Boolean(item?.ok && item?.publicRolloutAllowed === true && item?.productionReady !== true);
}
function p0p1StabilityOk(rel) {
  const item = readJson(rel);
  return Boolean(item?.ok && item?.localP0Stable === true && item?.p1FoundationSourceReady === true);
}
function state(evidence) {
  const item = readJson(evidence.artifact);
  if (evidence.id === 'node24_ci') return node24ProofOk(evidence.artifact) ? 'pass' : 'blocked';
  if (evidence.id === 'hosted_release_strict') return hostedReleaseOk(evidence.artifact) ? 'pass' : appUrlPresent() ? 'unverified' : 'blocked';
  if (evidence.id === 'hosted_save_export_smoke') return hostedSaveExportOk(evidence.artifact) ? 'pass' : appUrlPresent() ? 'unverified' : 'blocked';
  if (evidence.id === 'visual_smoke_evidence') return visualEvidenceOk(evidence.artifact) ? 'pass' : 'unverified';
  if (evidence.id === 'public_rollout_readiness') return publicRolloutReadinessOk(evidence.artifact) ? 'pass' : 'blocked';
  if (evidence.id === 'p0_p1_stability') return p0p1StabilityOk(evidence.artifact) ? 'pass' : item?.ok === false ? 'fail' : 'unverified';
  if (item?.ok === false) return 'fail';
  return artifactOk(evidence.artifact) ? 'pass' : 'unverified';
}
const evidence = policy.requiredEvidence.map((item) => {
  const itemState = state(item);
  return {
    id: item.id,
    label: item.label,
    command: item.command,
    artifact: item.artifact,
    artifactPresent: exists(item.artifact),
    artifactOk: artifactOk(item.artifact),
    state: itemState,
    ok: itemState === 'pass',
    required: Boolean(item.required),
    blocksPublicRollout: Boolean(item.blocksPublicRollout),
    howToCapture: item.howToCapture
  };
});
const missingRequired = evidence.filter((item) => item.required && item.state !== 'pass');
const blockers = missingRequired.filter((item) => item.blocksPublicRollout).map((item) => item.id);
const report = {
  ok: true,
  hostedProofClosed: missingRequired.length === 0,
  publicRolloutAllowed: false,
  productionReady: false,
  batch: policy.batch,
  version: policy.version,
  generatedAt: new Date().toISOString(),
  nodeVersion: process.versions.node,
  node24: nodeMajor() === 24,
  appUrlPresent: appUrlPresent(),
  sourceLevelOnly: true,
  evidence,
  missingRequired,
  blockers,
  nextCommands: missingRequired.map((item) => item.command),
  githubActions: policy.githubActions,
  visualEvidence: policy.visualEvidence,
  claimPolicy: policy.claimPolicy,
  noAiPaymentVerifiedFakeAdded: true,
  warning: 'ok=true means the capture report was generated, not that hosted proof passed. hostedProofClosed must be true before public rollout claims.'
};
const checklist = [
  '# Batch137 P0 Hosted Evidence Capture Checklist',
  '',
  `Generated: ${report.generatedAt}`,
  `Node: ${report.nodeVersion}`,
  `APP_URL present: ${report.appUrlPresent}`,
  '',
  '## Required evidence',
  ...evidence.map((item) => `- [${item.state === 'pass' ? 'x' : ' '}] ${item.label} — ${item.state.toUpperCase()} — \`${item.command}\``),
  '',
  '## Next commands',
  ...(report.nextCommands.length ? report.nextCommands.map((command) => `- \`${command}\``) : ['- All evidence marked pass; rerun final release gate with real APP_URL.']),
  '',
  '## Blocked claims',
  ...policy.claimPolicy.blocked.map((claim) => `- ${claim}`),
  '',
  '## Notes',
  '- This checklist is evidence tracking only; it does not deploy to Vercel.',
  '- Template visual smoke evidence is not a pass; real browser captures are required.',
  '- Keep No-AI, no payment, no fake verified data and no community auto-public.'
].join('\n') + '\n';

fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
fs.writeFileSync(path.join(root, artifactPath), JSON.stringify(report, null, 2) + '\n');
fs.writeFileSync(path.join(root, checklistPath), checklist);
console.log(JSON.stringify({ ...report, artifactPath, checklistPath }, null, 2));
// Report generation should not fail local runs just because hosted proof is still missing.
process.exit(0);
