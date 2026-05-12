import fs from 'node:fs';
import path from 'node:path';

const policy = JSON.parse(fs.readFileSync('data/runtime-p0-hosted-final-proof-policy.json', 'utf8'));
function readJson(file, fallback = null) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; } }
function exists(file) { return fs.existsSync(file); }
function artifactOk(file) { const item = readJson(file); return Boolean(item?.ok && !item?.skipped); }
function nodeMajor() { return Number(process.versions.node.split('.')[0] || 0); }
function visualOk() {
  const evidence = readJson('artifacts/visual-smoke-evidence.json');
  if (!evidence?.ok) return false;
  const captures = Array.isArray(evidence.captures) ? evidence.captures : [];
  return policy.visualSmoke.requiredViewports.every((viewport) => captures.some((capture) => capture.viewportId === viewport.id && capture.status === 'pass'));
}
function gateState(gate) {
  if (gate.id === 'node24_ci') return nodeMajor() === 24 && artifactOk(gate.evidenceArtifact) ? 'pass' : nodeMajor() === 24 ? 'unverified' : 'blocked';
  if (gate.id === 'visual_smoke_breakpoints') return visualOk() ? 'pass' : 'unverified';
  return artifactOk(gate.evidenceArtifact) ? 'pass' : 'unverified';
}
const gates = policy.requiredGates.map((gate) => ({
  id: gate.id,
  label: gate.label,
  command: gate.command,
  evidenceArtifact: gate.evidenceArtifact,
  artifactPresent: exists(gate.evidenceArtifact),
  artifactOk: artifactOk(gate.evidenceArtifact),
  state: gateState(gate),
  blocksPublicRollout: gate.blocksPublicRollout
}));
const missingRequired = gates.filter((gate) => gate.state !== 'pass');
const report = {
  ok: missingRequired.length === 0,
  batch: policy.batch,
  version: policy.version,
  generatedAt: new Date().toISOString(),
  nodeVersion: process.versions.node,
  appUrlPresent: Boolean(process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.GIAOAN_DEMO_URL),
  publicRolloutAllowed: missingRequired.length === 0,
  productionReady: false,
  readinessPercent: Math.round((gates.filter((gate) => gate.state === 'pass').length / gates.length) * 100),
  gates,
  missingRequired,
  nextCommands: missingRequired.map((gate) => gate.command),
  noAiPaymentVerifiedFakeAdded: true,
  warning: 'Report có thể exit 0 để đọc trạng thái, nhưng ok=false nghĩa là chưa được claim hosted/public/100%.'
};
const artifactPath = 'artifacts/runtime-p0-hosted-final-proof-report-last-run.json';
fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
fs.writeFileSync(artifactPath, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ ...report, artifactPath }, null, 2));
