import fs from 'node:fs';
import path from 'node:path';

const policy = JSON.parse(fs.readFileSync('data/public-rollout-readiness-policy.json', 'utf8'));
const artifactPath = 'artifacts/public-rollout-readiness-report-last-run.json';
function readJson(file, fallback = null) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; } }
function exists(file) { return fs.existsSync(file); }
function artifactOk(file) { const item = readJson(file); return Boolean(item?.ok && !item?.skipped); }
function nodeMajor() { return Number(process.versions.node.split('.')[0] || 0); }
function visualOk() {
  const evidence = readJson('artifacts/visual-smoke-evidence.json');
  if (!evidence?.ok) return false;
  const captures = Array.isArray(evidence.captures) ? evidence.captures : [];
  const required = ['mobile-360', 'mobile-390', 'mobile-430', 'tablet-768', 'desktop-1366', 'desktop-1440'];
  return required.every((viewportId) => captures.some((capture) => capture.viewportId === viewportId && capture.status === 'pass'));
}
function dossierOk() {
  const dossier = readJson('artifacts/public-rollout-dossier-template.json');
  if (!dossier?.ok) return false;
  const sections = Array.isArray(dossier.sections) ? dossier.sections.map((item) => item.id) : [];
  return policy.dossierRequiredSections.every((sectionId) => sections.includes(sectionId));
}
function hostedCiClosed() {
  const report = readJson('artifacts/runtime-p0-hosted-ci-final-proof-report-last-run.json');
  return Boolean(report?.ok && report?.publicRolloutAllowed && String(report?.nodeVersion || '').startsWith('24.'));
}
function state(gate) {
  const artifact = readJson(gate.artifact);
  if (gate.id === 'batch132_ci_report') return hostedCiClosed() ? 'pass' : (nodeMajor() === 24 ? 'unverified' : 'blocked');
  if (gate.id === 'visual_smoke_evidence') return visualOk() ? 'pass' : 'unverified';
  if (gate.id === 'public_rollout_dossier') return dossierOk() ? 'pass' : 'unverified';
  if (gate.id === 'hosted_p0_100_release') {
    if (artifactOk(gate.artifact) && nodeMajor() === 24 && Boolean(process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.GIAOAN_DEMO_URL)) return 'pass';
    return nodeMajor() === 24 ? 'unverified' : 'blocked';
  }
  if (artifact?.ok === false) return 'fail';
  return artifactOk(gate.artifact) ? 'pass' : 'unverified';
}
const gates = policy.requiredGates.map((gate) => ({
  id: gate.id,
  label: gate.label,
  command: gate.command,
  artifact: gate.artifact,
  required: Boolean(gate.required),
  blocksPublicRollout: Boolean(gate.blocksPublicRollout),
  artifactPresent: exists(gate.artifact),
  artifactOk: artifactOk(gate.artifact),
  state: state(gate)
}));
const required = gates.filter((gate) => gate.required);
const missingRequired = required.filter((gate) => gate.state !== 'pass');
const rolloutBlockers = gates.filter((gate) => gate.blocksPublicRollout && gate.state !== 'pass');
const sourceLevelGates = gates.filter((gate) => !['batch132_ci_report', 'visual_smoke_evidence', 'hosted_p0_100_release'].includes(gate.id));
const sourceLevelReadinessPercent = sourceLevelGates.length ? Math.round((sourceLevelGates.filter((gate) => gate.state === 'pass').length / sourceLevelGates.length) * 100) : 0;
const evidenceReadinessPercent = required.length ? Math.round((required.filter((gate) => gate.state === 'pass').length / required.length) * 100) : 0;
const report = {
  ok: false,
  batch: policy.batch,
  version: policy.version,
  generatedAt: new Date().toISOString(),
  nodeVersion: process.versions.node,
  appUrlPresent: Boolean(process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.GIAOAN_DEMO_URL),
  publicRolloutAllowed: missingRequired.length === 0 && rolloutBlockers.length === 0,
  productionReady: false,
  sourceLevelReadinessPercent,
  evidenceReadinessPercent,
  gates,
  missingRequired,
  rolloutBlockers,
  nextCommands: missingRequired.map((gate) => gate.command),
  noAiPaymentVerifiedFakeAdded: true,
  warning: 'Report exits 0 for inspection. publicRolloutAllowed=false means do not claim public rollout or production readiness.'
};
report.ok = report.publicRolloutAllowed;
fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
fs.writeFileSync(artifactPath, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ ...report, artifactPath }, null, 2));
