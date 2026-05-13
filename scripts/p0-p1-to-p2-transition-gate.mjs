import fs from 'node:fs';
import path from 'node:path';

const policy = JSON.parse(fs.readFileSync('data/batch150-p0-p1-to-p2-transition-policy.json', 'utf8'));
const strictPublic = process.argv.includes('--strict-public');

function readJson(rel, fallback = null) {
  try { return JSON.parse(fs.readFileSync(rel, 'utf8')); } catch { return fallback; }
}
function exists(rel) {
  return Boolean(rel && fs.existsSync(rel));
}
function write(rel, text) {
  fs.mkdirSync(path.dirname(rel), { recursive: true });
  fs.writeFileSync(rel, text, 'utf8');
}
function nodeMajor(version = process.versions.node) {
  return Number(String(version || '').split('.')[0] || 0);
}
function unique(items) {
  return [...new Set(items.filter(Boolean).map(String))];
}
function artifactTime(artifact) {
  return artifact?.generatedAt || artifact?.finishedAt || artifact?.startedAt || null;
}

const artifacts = {
  sourceValidate: readJson(policy.evidenceArtifacts.sourceValidate, null),
  batch149Runner: readJson(policy.evidenceArtifacts.batch149Runner, null),
  batch149Report: readJson(policy.evidenceArtifacts.batch149Report, null),
  p0p1FinalClosure: readJson(policy.evidenceArtifacts.p0p1FinalClosure, null),
  hostedSummary: readJson(policy.evidenceArtifacts.hostedSummary, null),
  closureDossier: readJson(policy.evidenceArtifacts.closureDossier, null),
  authenticityLock: readJson(policy.evidenceArtifacts.authenticityLock, null),
  publicRolloutReadiness: readJson(policy.evidenceArtifacts.publicRolloutReadiness, null),
  securityDataProtection: readJson(policy.evidenceArtifacts.securityDataProtection, null),
  guardedBuild: readJson(policy.evidenceArtifacts.guardedBuild, null),
  liveSmoke: readJson(policy.evidenceArtifacts.liveSmoke, null),
  loopbackSmoke: readJson(policy.evidenceArtifacts.loopbackSmoke, null)
};

function sourceOk() {
  return artifacts.sourceValidate?.ok === true && Array.isArray(artifacts.sourceValidate?.issues) && artifacts.sourceValidate.issues.length === 0;
}
function currentRuntimeLocalOk() {
  return Boolean(
    artifacts.securityDataProtection?.ok === true &&
    artifacts.securityDataProtection?.sourceFoundationReady === true &&
    artifacts.guardedBuild?.artifacts?.ready === true &&
    artifacts.liveSmoke?.ok === true &&
    artifacts.liveSmoke?.smokeMode === 'production' &&
    artifacts.loopbackSmoke?.ok === true &&
    artifacts.loopbackSmoke?.hostedSummary?.batch98RealAccountSaveExportSmoke === true
  );
}
function batch149LocalOk() {
  return currentRuntimeLocalOk() || Boolean(
    artifacts.batch149Report?.ok === true &&
    artifacts.batch149Report?.localClosureCandidate === true &&
    artifacts.batch149Report?.runnerPass === true &&
    artifacts.batch149Report?.productionReady !== true &&
    artifacts.batch149Report?.publicRolloutAllowed !== true
  ) || Boolean(
    artifacts.batch149Runner?.ok === true &&
    artifacts.batch149Runner?.status === 'pass' &&
    artifacts.batch149Runner?.localP0P1MaxClosureCandidate === true &&
    artifacts.batch149Runner?.productionReady !== true &&
    artifacts.batch149Runner?.publicRolloutAllowed !== true
  );
}
function finalClosureLocalOk() {
  return artifacts.p0p1FinalClosure?.localP0P1Closed === true || artifacts.batch149Report?.localClosureCandidate === true;
}
function hostedClosed() {
  return Boolean(
    artifacts.hostedSummary?.hostedProofClosed === true &&
    artifacts.hostedSummary?.publicRolloutAllowed === true &&
    artifacts.closureDossier?.hostedProofClosed === true &&
    artifacts.closureDossier?.publicRolloutAllowed === true &&
    artifacts.authenticityLock?.authenticityLocked === true &&
    artifacts.authenticityLock?.publicRolloutAllowed === true
  );
}
function publicReadinessClosed() {
  return Boolean(artifacts.publicRolloutReadiness?.publicRolloutAllowed === true && artifacts.publicRolloutReadiness?.productionReady !== true);
}

function buildGate(item) {
  const primary = readJson(item.artifact, null);
  const fallback = item.fallbackArtifact ? readJson(item.fallbackArtifact, null) : null;
  let ok = false;
  const issues = [];
  if (item.id === 'source_validate') ok = sourceOk();
  else if (item.id === 'batch149_local_max_closure') ok = batch149LocalOk();
  else if (item.id === 'p0_p1_final_closure_local') ok = finalClosureLocalOk();
  else ok = Boolean(primary?.ok === true || fallback?.ok === true);
  if (!exists(item.artifact) && !exists(item.fallbackArtifact)) issues.push('missing_artifact');
  if (!ok) issues.push(`${item.id}_not_passed`);
  return {
    id: item.id,
    label: item.label,
    command: item.command,
    artifact: item.artifact,
    fallbackArtifact: item.fallbackArtifact || null,
    required: Boolean(item.required),
    ok,
    state: ok ? 'pass' : item.required ? 'blocked' : 'optional_missing_or_unverified',
    artifactPresent: exists(item.artifact),
    fallbackArtifactPresent: exists(item.fallbackArtifact),
    artifactGeneratedAt: artifactTime(primary) || artifactTime(fallback),
    issues,
    reasonOptional: item.reasonOptional || null
  };
}

const localGates = policy.localTransitionRequired.map(buildGate);
const requiredLocalPass = localGates.filter((gate) => gate.required).every((gate) => gate.ok);
const hostedProofClosed = hostedClosed();
const publicRolloutReadinessClosed = publicReadinessClosed();
const externalHardBlockersRemaining = hostedProofClosed && publicRolloutReadinessClosed
  ? []
  : policy.externalHardBlockers.map((item) => item.id);
const canStartP2SourceWork = Boolean(requiredLocalPass);
const canStartP2PublicExposure = Boolean(requiredLocalPass && hostedProofClosed && publicRolloutReadinessClosed);
const blockers = unique([
  ...localGates.filter((gate) => gate.required && !gate.ok).map((gate) => `local:${gate.id}`),
  ...(!hostedProofClosed ? ['external:hosted_proof_not_closed'] : []),
  ...(!publicRolloutReadinessClosed ? ['external:public_rollout_readiness_not_closed'] : []),
  ...(artifacts.batch149Report?.blockers || []),
  ...(artifacts.hostedSummary?.blockers || artifacts.hostedSummary?.hardBlockers || []),
  ...(artifacts.closureDossier?.blockers || []),
  ...(artifacts.authenticityLock?.blockers || artifacts.authenticityLock?.issues || [])
]);

const unresolvedGuide = policy.externalHardBlockers.map((item, index) => ({
  step: index + 1,
  ...item,
  resolved: !externalHardBlockersRemaining.includes(item.id)
}));

const result = {
  ok: strictPublic ? canStartP2PublicExposure : canStartP2SourceWork,
  batch: policy.batch,
  version: policy.version,
  mode: strictPublic ? 'strict_public_rollout_gate' : 'local_p2_transition_gate',
  generatedAt: new Date().toISOString(),
  nodeVersion: process.versions.node,
  node24: nodeMajor() === 24,
  appUrlPresent: Boolean(process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.GIAOAN_DEMO_URL),
  sourceLocalP0P1RelaxationAllowed: canStartP2SourceWork,
  p2SourceWorkAllowed: canStartP2SourceWork,
  p2PublicExposureAllowed: canStartP2PublicExposure,
  hostedProofClosed,
  publicRolloutReadinessClosed,
  publicRolloutAllowed: canStartP2PublicExposure,
  productionReady: false,
  localGates,
  externalHardBlockersRemaining,
  currentRuntimeLocalOk: currentRuntimeLocalOk(),
  unresolvedGuide,
  blockers,
  artifactSnapshot: Object.fromEntries(Object.entries(artifacts).map(([key, value]) => [key, {
    present: Boolean(value),
    ok: value?.ok === true,
    generatedAt: artifactTime(value),
    publicRolloutAllowed: value?.publicRolloutAllowed === true,
    productionReady: value?.productionReady === true
  }])),
  nextLocalP2Rules: canStartP2SourceWork
    ? [
        'P2 may start as source/local/private development only.',
        'Do not expose P2 publicly or claim public rollout until external hard blockers are resolved.',
        'Any P2 change must preserve no-AI, no-payment, no-fake-verified-data, and no community auto-public rules.',
        'Start P2 with Lesson Authoring Core quality/export/editor flow, not broad new ecosystem features.'
      ]
    : policy.operatorGuide.localBeforeP2Commands,
  nextExternalProofSteps: policy.operatorGuide.hostedProofCommands,
  claimPolicy: policy.transitionPolicy,
  noAiPaymentVerifiedFakeAdded: true,
  warning: canStartP2SourceWork && !canStartP2PublicExposure
    ? 'P0/P1 can be relaxed for P2 source work only. Hosted/public proof remains blocked; do not claim production-ready, public-rollout-ready, or 100%.'
    : canStartP2PublicExposure
      ? 'External hosted/public proof appears closed, but production-ready still requires production DB/security/legal review.'
      : 'P0/P1 local transition gate is not ready; do not start P2 until local required gates pass.'
};

write(policy.artifacts.transitionJson, `${JSON.stringify(result, null, 2)}\n`);
const md = `# Batch150 P0/P1 → P2 Transition Gate\n\n- Generated: ${result.generatedAt}\n- Mode: ${result.mode}\n- Node: ${result.nodeVersion}\n- P2 source work allowed: ${result.p2SourceWorkAllowed ? 'YES' : 'NO'}\n- P2 public exposure allowed: ${result.p2PublicExposureAllowed ? 'YES' : 'NO'}\n- Hosted proof closed: ${result.hostedProofClosed ? 'YES' : 'NO'}\n- Public rollout allowed: ${result.publicRolloutAllowed ? 'YES' : 'NO'}\n- Production ready: NO\n\n## Local gates\n${result.localGates.map((gate) => `- ${gate.ok ? 'PASS' : 'BLOCKED'} — ${gate.id}: ${gate.label}`).join('\n')}\n\n## External blockers still requiring your action\n${result.unresolvedGuide.filter((item) => !item.resolved).map((item) => `- ${item.id}: ${item.label} — ${item.command}`).join('\n') || '- None from artifact gate; still complete production DB/security/legal review before production-ready claims.'}\n\n## Safe P2 rules\n${result.nextLocalP2Rules.map((item) => `- ${item}`).join('\n')}\n\n## Warning\n${result.warning}\n`;
write(policy.artifacts.transitionMarkdown, md);
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
