import fs from 'fs';
import path from 'path';

import policy from '@/data/runtime-p0-hosted-final-proof-policy.json';

type GateState = 'pass' | 'blocked' | 'unverified';
type AnyRecord = Record<string, any>;

function exists(file: string) {
  return fs.existsSync(path.join(process.cwd(), file));
}

function readJson(file: string, fallback: any = null) {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), file), 'utf8'));
  } catch {
    return fallback;
  }
}

function currentNodeMajor() {
  const value = process.versions.node.split('.')[0];
  return Number(value || 0);
}

function artifactOk(file: string) {
  const artifact = readJson(file, null);
  return Boolean(artifact?.ok && !artifact?.skipped);
}

function visualEvidenceOk() {
  const artifact = readJson('artifacts/visual-smoke-evidence.json', null);
  if (!artifact?.ok) return false;
  const requiredViewports = policy.visualSmoke.requiredViewports.map((item) => item.id);
  const requiredFlows = policy.visualSmoke.requiredFlows;
  const captures = Array.isArray(artifact.captures) ? artifact.captures : [];
  return requiredViewports.every((viewportId) => captures.some((capture: AnyRecord) => {
    const flows = Array.isArray(capture.flows) ? capture.flows : [];
    return capture.viewportId === viewportId && capture.status === 'pass' && requiredFlows.every((flow) => flows.includes(flow));
  }));
}

function gateState(gate: AnyRecord): GateState {
  if (gate.id === 'node24_ci') {
    const artifact = readJson(gate.evidenceArtifact, null);
    if (artifactOk(gate.evidenceArtifact) && Number(artifact?.nodeVersion?.split?.('.')?.[0] || 0) === 24) return 'pass';
    return currentNodeMajor() === 24 ? 'unverified' : 'blocked';
  }
  if (gate.id === 'visual_smoke_breakpoints') return visualEvidenceOk() ? 'pass' : 'unverified';
  if (gate.id === 'hosted_app_url_strict_smoke' || gate.id === 'hosted_save_export_smoke' || gate.id === 'release_final_chain') {
    return artifactOk(gate.evidenceArtifact) ? 'pass' : 'unverified';
  }
  return artifactOk(gate.evidenceArtifact) ? 'pass' : 'unverified';
}

function buildGate(gate: AnyRecord) {
  const state = gateState(gate);
  return {
    id: gate.id,
    label: gate.label,
    required: Boolean(gate.required),
    command: gate.command,
    evidenceArtifact: gate.evidenceArtifact,
    artifactPresent: exists(gate.evidenceArtifact),
    artifactOk: artifactOk(gate.evidenceArtifact),
    state,
    ok: state === 'pass',
    blocksPublicRollout: Boolean(gate.blocksPublicRollout)
  };
}

export function buildP0HostedFinalProofBoard() {
  const gates = (policy.requiredGates as AnyRecord[]).map(buildGate);
  const missingRequired = gates.filter((gate) => gate.required && gate.state !== 'pass');
  const blocked = gates.filter((gate) => gate.state === 'blocked');
  const passCount = gates.filter((gate) => gate.ok).length;
  const readinessPercent = gates.length ? Math.round((passCount / gates.length) * 100) : 0;
  const publicRolloutAllowed = gates.length > 0 && missingRequired.length === 0;
  const appUrlPresent = Boolean(process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.GIAOAN_DEMO_URL);

  return {
    ok: true,
    batch: policy.batch,
    version: policy.version,
    phase: policy.phase,
    status: publicRolloutAllowed ? 'p0_hosted_public_proof_closed' : blocked.length ? 'p0_hosted_public_blocked' : 'p0_hosted_public_unverified',
    generatedAt: new Date().toISOString(),
    nodeVersion: process.versions.node,
    node24: currentNodeMajor() === 24,
    appUrlPresent,
    publicRolloutAllowed,
    productionReady: false,
    readinessPercent,
    gates,
    missingRequired,
    blocked,
    visualSmoke: policy.visualSmoke,
    claimPolicy: policy.claimPolicy,
    nextCommands: missingRequired.map((gate) => gate.command),
    warning: 'Batch131 board chỉ đóng public/hosted proof khi Node24 + hosted APP_URL smoke + hosted save/export smoke + visual evidence + final release artifact đều pass. Nếu thiếu artifact thì vẫn chưa hosted-demo-closed.'
  };
}
