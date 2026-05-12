import fs from 'fs';
import path from 'path';

import policy from '@/data/p0-p1-stability-gate-policy.json';

type AnyRecord = Record<string, any>;
type GateState = 'pass' | 'blocked' | 'unverified' | 'fail' | 'manual_required';

function readJson(file?: string | null, fallback: any = null) {
  if (!file) return fallback;
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), file), 'utf8'));
  } catch {
    return fallback;
  }
}

function exists(file?: string | null) {
  return Boolean(file && fs.existsSync(path.join(process.cwd(), file)));
}

function currentNodeMajor() {
  return Number(process.versions.node.split('.')[0] || 0);
}

function artifactOk(file?: string | null) {
  const artifact = readJson(file);
  return Boolean(artifact?.ok && !artifact?.skipped);
}

function liveSmokeOk(file?: string | null) {
  const artifact = readJson(file);
  return Boolean(artifact?.ok && artifact?.smokeMode === 'production' && Array.isArray(artifact?.checks) && artifact.checks.every((check: AnyRecord) => check.ok));
}

function authInviteOk(file?: string | null) {
  const artifact = readJson(file);
  return Boolean(artifact?.ok && artifact?.summary?.batch98InviteRuntimeSmoke === true);
}

function loopbackOk(file?: string | null) {
  const artifact = readJson(file);
  return Boolean(artifact?.ok && artifact?.hostedSummary?.batch98RealAccountSaveExportSmoke === true);
}

function guardedBuildOk(file?: string | null) {
  const artifact = readJson(file);
  return Boolean(artifact?.ok && artifact?.artifacts?.ready === true);
}

function visualEvidenceOk(file?: string | null) {
  const artifact = readJson(file);
  if (!artifact?.ok) return false;
  const captures = Array.isArray(artifact.captures) ? artifact.captures : [];
  const required = ['mobile-360', 'mobile-390', 'mobile-430', 'tablet-768', 'desktop-1366', 'desktop-1440'];
  return required.every((viewportId) => captures.some((capture: AnyRecord) => capture.viewportId === viewportId && capture.status === 'pass'));
}

function publicRolloutReportOk(file?: string | null) {
  const artifact = readJson(file);
  return Boolean(artifact?.ok && artifact?.publicRolloutAllowed === true && artifact?.productionReady !== true);
}

function appUrlStrictOk(file?: string | null) {
  const artifact = readJson(file);
  return Boolean(artifact?.ok && artifact?.appUrlPresent === true && (artifact?.summary?.failed ?? 1) === 0);
}

function gateState(gate: AnyRecord): GateState {
  if (gate.manualEvidence) return 'manual_required';
  const artifact = readJson(gate.artifact);
  if (gate.id === 'source_validate') return artifactOk(gate.artifact) ? 'pass' : 'unverified';
  if (gate.id === 'guarded_build') return guardedBuildOk(gate.artifact) ? 'pass' : artifact?.ok === false ? 'fail' : 'unverified';
  if (gate.id === 'live_smoke_clean') return liveSmokeOk(gate.artifact) ? 'pass' : artifact?.ok === false ? 'fail' : 'unverified';
  if (gate.id === 'auth_invite_runtime_smoke') return authInviteOk(gate.artifact) ? 'pass' : artifact?.ok === false ? 'fail' : 'unverified';
  if (gate.id === 'loopback_hosted_style_smoke') return loopbackOk(gate.artifact) ? 'pass' : artifact?.ok === false ? 'fail' : 'unverified';
  if (gate.id === 'security_data_protection_report') return artifactOk(gate.artifact) ? 'pass' : artifact?.ok === false ? 'fail' : 'unverified';
  if (gate.id === 'node24_ci') return currentNodeMajor() === 24 && artifactOk(gate.artifact) ? 'pass' : 'blocked';
  if (gate.id === 'app_url_strict_smoke') return appUrlStrictOk(gate.artifact) ? 'pass' : (currentNodeMajor() === 24 ? 'unverified' : 'blocked');
  if (gate.id === 'visual_smoke_evidence') return visualEvidenceOk(gate.artifact) ? 'pass' : 'unverified';
  if (gate.id === 'public_rollout_readiness') return publicRolloutReportOk(gate.artifact) ? 'pass' : 'blocked';
  if (artifact?.ok === false) return 'fail';
  return artifactOk(gate.artifact) ? 'pass' : 'unverified';
}

function buildGate(gate: AnyRecord) {
  const state = gateState(gate);
  return {
    id: gate.id,
    label: gate.label,
    command: gate.command,
    artifact: gate.artifact || null,
    artifactPresent: exists(gate.artifact),
    artifactOk: artifactOk(gate.artifact),
    required: Boolean(gate.required),
    manualEvidence: Boolean(gate.manualEvidence),
    state,
    ok: state === 'pass' || state === 'manual_required'
  };
}

function allRequiredPass(gates: ReturnType<typeof buildGate>[], options: { allowManual?: boolean } = {}) {
  return gates.filter((gate) => gate.required).every((gate) => gate.state === 'pass' || (options.allowManual && gate.state === 'manual_required'));
}

export function buildP0P1StabilityBoard() {
  const localP0Gates = (policy.localP0RequiredEvidence as AnyRecord[]).map(buildGate);
  const hostedPublicGates = (policy.hostedPublicRequiredEvidence as AnyRecord[]).map(buildGate);
  const p1FoundationGates = (policy.p1FoundationRequiredEvidence as AnyRecord[]).map(buildGate);
  const localP0Stable = allRequiredPass(localP0Gates, { allowManual: true });
  const p1FoundationSourceReady = localP0Stable && allRequiredPass(p1FoundationGates);
  const hostedPublicClosed = allRequiredPass(hostedPublicGates);
  const p1FeatureExpansionBlocked = !localP0Stable;
  const publicP1RolloutAllowed = p1FoundationSourceReady && hostedPublicClosed;
  const blockers = [
    ...localP0Gates.filter((gate) => gate.required && gate.state !== 'pass' && gate.state !== 'manual_required').map((gate) => `local:${gate.id}`),
    ...p1FoundationGates.filter((gate) => gate.required && gate.state !== 'pass').map((gate) => `p1:${gate.id}`),
    ...hostedPublicGates.filter((gate) => gate.required && gate.state !== 'pass').map((gate) => `hosted:${gate.id}`)
  ];

  return {
    ok: true,
    batch: policy.batch,
    version: policy.version,
    phase: policy.phase,
    generatedAt: new Date().toISOString(),
    nodeVersion: process.versions.node,
    node24: currentNodeMajor() === 24,
    appUrlPresent: Boolean(process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.GIAOAN_DEMO_URL),
    sourceLevelOnly: policy.sourceLevelOnly,
    localP0Stable,
    p1FoundationSourceReady,
    p1FeatureExpansionBlocked,
    publicP1RolloutAllowed,
    productionReady: false,
    publicRolloutAllowed: false,
    localP0Gates,
    p1FoundationGates,
    hostedPublicGates,
    blockers,
    claimPolicy: policy.claimPolicy,
    nextCommands: blockers.length
      ? [...localP0Gates, ...p1FoundationGates, ...hostedPublicGates].filter((gate) => gate.required && gate.state !== 'pass').map((gate) => gate.command)
      : ['APP_URL=https://<vercel-url> npm run verify:p0-100-release'],
    warning: 'Batch136 is a P0/P1 stability gate. It does not add teacher-facing features and public rollout remains blocked until real hosted Node24/APP_URL/visual evidence is captured.'
  };
}
