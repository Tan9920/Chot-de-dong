import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const artifactPath = 'artifacts/p0-p1-stability-report-last-run.json';
const readJson = (rel, fallback = null) => {
  if (!rel) return fallback;
  try { return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')); } catch { return fallback; }
};
const exists = (rel) => Boolean(rel && fs.existsSync(path.join(root, rel)));
const artifactOk = (rel) => { const item = readJson(rel); return Boolean(item?.ok && !item?.skipped); };
const nodeMajor = () => Number(process.versions.node.split('.')[0] || 0);
const policy = readJson('data/p0-p1-stability-gate-policy.json', {});
function liveSmokeOk(rel) {
  const item = readJson(rel);
  return Boolean(item?.ok && item?.smokeMode === 'production' && Array.isArray(item?.checks) && item.checks.every((check) => check.ok));
}
function authInviteOk(rel) {
  const item = readJson(rel);
  return Boolean(item?.ok && item?.summary?.batch98InviteRuntimeSmoke === true);
}
function loopbackOk(rel) {
  const item = readJson(rel);
  return Boolean(item?.ok && item?.hostedSummary?.batch98RealAccountSaveExportSmoke === true);
}
function guardedBuildOk(rel) {
  const item = readJson(rel);
  return Boolean(item?.ok && item?.artifacts?.ready === true);
}
function visualEvidenceOk(rel) {
  const item = readJson(rel);
  if (!item?.ok) return false;
  const captures = Array.isArray(item.captures) ? item.captures : [];
  const required = ['mobile-360', 'mobile-390', 'mobile-430', 'tablet-768', 'desktop-1366', 'desktop-1440'];
  return required.every((viewportId) => captures.some((capture) => capture.viewportId === viewportId && capture.status === 'pass'));
}
function publicRolloutReportOk(rel) {
  const item = readJson(rel);
  return Boolean(item?.ok && item?.publicRolloutAllowed === true && item?.productionReady !== true);
}
function appUrlStrictOk(rel) {
  const item = readJson(rel);
  return Boolean(item?.ok && item?.appUrlPresent === true && (item?.summary?.failed ?? 1) === 0);
}
function state(gate) {
  if (gate.manualEvidence) return 'manual_required';
  const item = readJson(gate.artifact);
  if (gate.id === 'source_validate') return artifactOk(gate.artifact) ? 'pass' : 'unverified';
  if (gate.id === 'guarded_build') return guardedBuildOk(gate.artifact) ? 'pass' : item?.ok === false ? 'fail' : 'unverified';
  if (gate.id === 'live_smoke_clean') return liveSmokeOk(gate.artifact) ? 'pass' : item?.ok === false ? 'fail' : 'unverified';
  if (gate.id === 'auth_invite_runtime_smoke') return authInviteOk(gate.artifact) ? 'pass' : item?.ok === false ? 'fail' : 'unverified';
  if (gate.id === 'loopback_hosted_style_smoke') return loopbackOk(gate.artifact) ? 'pass' : item?.ok === false ? 'fail' : 'unverified';
  if (gate.id === 'security_data_protection_report') return artifactOk(gate.artifact) ? 'pass' : item?.ok === false ? 'fail' : 'unverified';
  if (gate.id === 'node24_ci') return nodeMajor() === 24 && artifactOk(gate.artifact) ? 'pass' : 'blocked';
  if (gate.id === 'app_url_strict_smoke') return appUrlStrictOk(gate.artifact) ? 'pass' : nodeMajor() === 24 ? 'unverified' : 'blocked';
  if (gate.id === 'visual_smoke_evidence') return visualEvidenceOk(gate.artifact) ? 'pass' : 'unverified';
  if (gate.id === 'public_rollout_readiness') return publicRolloutReportOk(gate.artifact) ? 'pass' : 'blocked';
  if (item?.ok === false) return 'fail';
  return artifactOk(gate.artifact) ? 'pass' : 'unverified';
}
function buildGate(gate) {
  const gateState = state(gate);
  return {
    id: gate.id,
    label: gate.label,
    command: gate.command,
    artifact: gate.artifact || null,
    artifactPresent: exists(gate.artifact),
    artifactOk: artifactOk(gate.artifact),
    required: Boolean(gate.required),
    manualEvidence: Boolean(gate.manualEvidence),
    state: gateState,
    ok: gateState === 'pass' || gateState === 'manual_required'
  };
}
const localP0Gates = (policy.localP0RequiredEvidence || []).map(buildGate);
const hostedPublicGates = (policy.hostedPublicRequiredEvidence || []).map(buildGate);
const p1FoundationGates = (policy.p1FoundationRequiredEvidence || []).map(buildGate);
const allPass = (gates, allowManual = false) => gates.filter((gate) => gate.required).every((gate) => gate.state === 'pass' || (allowManual && gate.state === 'manual_required'));
const localP0Stable = allPass(localP0Gates, true);
const p1FoundationSourceReady = localP0Stable && allPass(p1FoundationGates);
const hostedPublicClosed = allPass(hostedPublicGates);
const blockers = [
  ...localP0Gates.filter((gate) => gate.required && gate.state !== 'pass' && gate.state !== 'manual_required').map((gate) => `local:${gate.id}`),
  ...p1FoundationGates.filter((gate) => gate.required && gate.state !== 'pass').map((gate) => `p1:${gate.id}`),
  ...hostedPublicGates.filter((gate) => gate.required && gate.state !== 'pass').map((gate) => `hosted:${gate.id}`)
];
const report = {
  ok: localP0Stable && p1FoundationSourceReady,
  batch: policy.batch,
  version: policy.version,
  phase: policy.phase,
  generatedAt: new Date().toISOString(),
  nodeVersion: process.versions.node,
  node24: nodeMajor() === 24,
  appUrlPresent: Boolean(process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.GIAOAN_DEMO_URL),
  localP0Stable,
  p1FoundationSourceReady,
  p1FeatureExpansionBlocked: !localP0Stable,
  hostedPublicClosed,
  publicP1RolloutAllowed: p1FoundationSourceReady && hostedPublicClosed,
  productionReady: false,
  publicRolloutAllowed: false,
  localP0Gates,
  p1FoundationGates,
  hostedPublicGates,
  blockers,
  noAiPaymentVerifiedFakeAdded: true,
  nextCommands: blockers.length
    ? [...localP0Gates, ...p1FoundationGates, ...hostedPublicGates].filter((gate) => gate.required && gate.state !== 'pass').map((gate) => gate.command)
    : ['APP_URL=https://<vercel-url> npm run verify:p0-100-release'],
  warning: 'Batch136 report allows source-level P1 foundation only when local P0 is clean. Public rollout remains blocked until hosted/Node24/visual proof is real.'
};
fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
fs.writeFileSync(artifactPath, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ ...report, artifactPath }, null, 2));
process.exit(report.ok ? 0 : 1);
