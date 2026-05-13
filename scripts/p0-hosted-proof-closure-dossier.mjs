import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const policy = JSON.parse(fs.readFileSync(path.join(root, 'data/batch147-real-hosted-proof-run-closure-policy.json'), 'utf8'));
const ARTIFACT_ROOT_ENV_NAME = 'GIAOAN_HOSTED_PROOF_ARTIFACT_ROOT';
const CLOSURE_DOSSIER_JSON = 'p0-hosted-proof-closure-dossier-last-run.json';
const CLOSURE_DOSSIER_MD = 'p0-hosted-proof-closure-dossier.md';
const strict = process.argv.includes('--strict') || process.env.GIAOAN_HOSTED_PROOF_CLOSURE_STRICT === '1';
const requestedArtifactRoot = process.env[ARTIFACT_ROOT_ENV_NAME] || process.argv.find((arg) => arg.startsWith('--artifact-root='))?.split('=').slice(1).join('=') || '';
const reviewRoot = requestedArtifactRoot ? path.resolve(root, requestedArtifactRoot) : root;
const outJson = path.join(root, policy.closureDossierContract.jsonArtifact);
const outMd = path.join(root, policy.closureDossierContract.markdownArtifact);

function exists(file) { return Boolean(file && fs.existsSync(file)); }
function statBytes(file) { try { return fs.statSync(file).size; } catch { return 0; } }
function tryRead(file) { try { return fs.readFileSync(file, 'utf8'); } catch { return ''; } }
function tryJson(file) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } }
function nodeMajorFrom(value) { return Number(String(value || '').split('.')[0] || 0); }
function normalizeRel(rel) { return String(rel || '').replaceAll('\\', '/').replace(/^\.\//, ''); }
function candidatePaths(rel) {
  const normalized = normalizeRel(rel);
  const withoutArtifacts = normalized.startsWith('artifacts/') ? normalized.slice('artifacts/'.length) : normalized;
  return Array.from(new Set([
    path.join(reviewRoot, normalized),
    path.join(reviewRoot, withoutArtifacts),
    path.join(root, normalized)
  ]));
}
function resolveArtifact(rel) {
  for (const candidate of candidatePaths(rel)) if (exists(candidate)) return candidate;
  return candidatePaths(rel)[0];
}
function readArtifact(rel) { return tryJson(resolveArtifact(rel)); }
function artifactPresent(rel) { return exists(resolveArtifact(rel)); }
function relativeDisplay(file) { return path.relative(root, file).replaceAll('\\', '/') || '.'; }
function safeOriginFromPreflight(preflight) {
  const app = preflight?.appUrl || {};
  if (!app.present) return { present: false };
  return { present: true, protocol: app.protocol || null, host: app.host || null, origin: app.origin || null, isLocal: Boolean(app.isLocal) };
}
function collectFiles(base) {
  const out = [];
  if (!exists(base)) return out;
  const visit = (current) => {
    for (const name of fs.readdirSync(current)) {
      const full = path.join(current, name);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) visit(full);
      else out.push(full);
    }
  };
  visit(base);
  return out;
}
function allReviewFiles() {
  const files = collectFiles(reviewRoot).filter((file) => /\.(json|md|txt|log|yml|yaml)$/i.test(file));
  // Avoid scanning node_modules when the current repo root is reviewed locally.
  return files.filter((file) => !file.includes(`${path.sep}node_modules${path.sep}`) && !file.includes(`${path.sep}.next${path.sep}`));
}
function secretLeakFindings() {
  const findings = [];
  const checks = [
    { id: 'private_key_block', regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
    { id: 'openai_style_api_key_value', regex: /\bsk-[A-Za-z0-9_-]{20,}\b/ },
    { id: 'database_url_with_credentials', regex: /\b(?:postgres|postgresql|mysql):\/\/[^\s:@]+:[^\s@]+@[^\s]+/i },
    { id: 'named_secret_literal_value', regex: /\b(?:OPENAI_API_KEY|ANTHROPIC_API_KEY|GEMINI_API_KEY|GOOGLE_API_KEY|DATABASE_URL|NEXTAUTH_SECRET|AUTH_SECRET|VERCEL_AUTOMATION_BYPASS_SECRET|PRIVATE_KEY)\b\s*[:=]\s*["']?(?!\$\{\{\s*secrets\.|<|\[provided\]|redacted|null|missing|your_|xxx|example)([A-Za-z0-9_./:@+\-=]{16,})/i }
  ];
  for (const file of allReviewFiles()) {
    const text = tryRead(file);
    for (const check of checks) {
      if (check.regex.test(text)) findings.push({ file: relativeDisplay(file), check: check.id });
    }
  }
  return findings.slice(0, 50);
}
function screenshotFiles() {
  const candidates = [
    path.join(reviewRoot, 'artifacts/visual-smoke'),
    path.join(reviewRoot, 'visual-smoke'),
    path.join(root, 'artifacts/visual-smoke')
  ];
  const files = [];
  for (const dir of candidates) {
    for (const file of collectFiles(dir).filter((item) => /\.png$/i.test(item))) files.push(file);
  }
  return Array.from(new Set(files)).map((file) => ({ file, display: relativeDisplay(file), bytes: statBytes(file) })).sort((a, b) => a.display.localeCompare(b.display));
}
function captureScreenshotPresent(capture, screenshots) {
  const capturePath = normalizeRel(capture?.screenshotPath || '');
  if (!capturePath) return false;
  const direct = resolveArtifact(capturePath);
  if (exists(direct) && statBytes(direct) > 0) return true;
  const basename = path.basename(capturePath);
  return screenshots.some((item) => path.basename(item.file) === basename && item.bytes > 0);
}
function visualGateDetails() {
  const evidence = readArtifact('artifacts/visual-smoke-evidence.json');
  const validate = readArtifact('artifacts/visual-smoke-evidence-validate-last-run.json');
  const shots = screenshotFiles();
  const captures = Array.isArray(evidence?.captures) ? evidence.captures : [];
  const required = policy.requiredViewports || [];
  const missing = [];
  const failed = [];
  for (const viewportId of required) {
    const capture = captures.find((item) => item?.viewportId === viewportId);
    if (!capture) { missing.push(viewportId); continue; }
    if (capture.status !== 'pass') failed.push(`${viewportId}:status_${capture.status || 'missing'}`);
    if (!captureScreenshotPresent(capture, shots)) failed.push(`${viewportId}:missing_png`);
  }
  return {
    artifactPresent: artifactPresent('artifacts/visual-smoke-evidence.json'),
    validateArtifactPresent: artifactPresent('artifacts/visual-smoke-evidence-validate-last-run.json'),
    evidenceOk: evidence?.ok === true,
    validateOk: validate?.ok === true,
    requiredViewportCount: required.length,
    captureCount: captures.length,
    screenshotCount: shots.length,
    screenshots: shots.map((item) => ({ file: item.display, bytes: item.bytes })),
    missing,
    failed,
    ok: evidence?.ok === true && validate?.ok === true && missing.length === 0 && failed.length === 0
  };
}
function gateResult(gate) {
  const artifact = readArtifact(gate.artifact);
  const present = artifactPresent(gate.artifact);
  const issues = [];
  let pass = false;
  if (gate.id === 'preflight_node24_github_app_url') {
    const app = artifact?.appUrl || {};
    if (!present) issues.push('missing_preflight_artifact');
    if (artifact?.ok !== true) issues.push('preflight_ok_not_true');
    if (nodeMajorFrom(artifact?.nodeVersion) !== 24) issues.push(`node_major_${nodeMajorFrom(artifact?.nodeVersion)}_not_24`);
    if (artifact?.ciProvenance?.githubActions !== true) issues.push('github_actions_provenance_missing');
    if (!String(artifact?.ciProvenance?.githubRunId || '').trim()) issues.push('github_run_id_missing');
    if (app?.present !== true) issues.push('app_url_missing');
    if (app?.protocol !== 'https:') issues.push('app_url_not_https');
    if (app?.isLocal === true) issues.push('app_url_is_localhost');
    pass = issues.length === 0;
  } else if (gate.id === 'hosted_ci_runner_all_pass') {
    const failed = Number(artifact?.summary?.failed ?? 1);
    if (!present) issues.push('missing_runner_artifact');
    if (artifact?.ok !== true) issues.push('runner_ok_not_true');
    if (artifact?.strict !== true) issues.push('runner_not_strict');
    if (failed !== 0) issues.push(`runner_failed_${failed}`);
    pass = issues.length === 0;
  } else if (gate.id === 'hosted_ci_report_ok') {
    if (!present) issues.push('missing_ci_report_artifact');
    if (artifact?.ok !== true) issues.push('ci_report_ok_not_true');
    if (artifact?.publicRolloutAllowed !== true) issues.push('ci_report_public_rollout_not_allowed');
    if (nodeMajorFrom(artifact?.nodeVersion) !== 24) issues.push(`ci_report_node_major_${nodeMajorFrom(artifact?.nodeVersion)}_not_24`);
    pass = issues.length === 0;
  } else if (gate.id === 'execution_gate_hosted_closed') {
    if (!present) issues.push('missing_execution_gate_artifact');
    if (artifact?.hostedProofClosed !== true) issues.push('execution_gate_hostedProofClosed_not_true');
    pass = issues.length === 0;
  } else if (gate.id === 'summary_hosted_closed') {
    if (!present) issues.push('missing_summary_artifact');
    if (artifact?.hostedProofClosed !== true) issues.push('summary_hostedProofClosed_not_true');
    pass = issues.length === 0;
  } else if (gate.id === 'visual_smoke_evidence_pngs') {
    const details = visualGateDetails();
    if (!details.artifactPresent) issues.push('missing_visual_smoke_evidence');
    if (!details.validateArtifactPresent) issues.push('missing_visual_smoke_validate_artifact');
    if (!details.evidenceOk) issues.push('visual_evidence_ok_not_true');
    if (!details.validateOk) issues.push('visual_validate_ok_not_true');
    for (const item of details.missing) issues.push(`missing_viewport_${item}`);
    for (const item of details.failed) issues.push(item);
    pass = issues.length === 0;
    return { id: gate.id, label: gate.label, artifact: gate.artifact, present: details.artifactPresent, required: Boolean(gate.required), blocksHostedProof: Boolean(gate.blocksHostedProof), status: pass ? 'PASS' : (present ? 'FAIL' : 'MISSING'), pass, issues, details };
  } else if (gate.id === 'public_rollout_readiness_optional') {
    if (!present) issues.push('missing_public_rollout_report_optional');
    if (present && artifact?.publicRolloutAllowed !== true) issues.push('public_rollout_not_allowed_yet');
    pass = present && artifact?.ok === true && artifact?.publicRolloutAllowed === true;
  } else {
    pass = Boolean(artifact?.ok === true);
    if (!pass) issues.push('generic_artifact_ok_not_true');
  }
  return { id: gate.id, label: gate.label, artifact: gate.artifact, present, bytes: statBytes(resolveArtifact(gate.artifact)), required: Boolean(gate.required), blocksHostedProof: Boolean(gate.blocksHostedProof), status: pass ? 'PASS' : (present ? 'FAIL' : 'MISSING'), pass, issues };
}

const gates = (policy.hardGates || []).map(gateResult);
const requiredGates = gates.filter((gate) => gate.required);
const hostedBlockers = requiredGates.filter((gate) => !gate.pass && gate.blocksHostedProof);
const optionalBlockers = gates.filter((gate) => !gate.required && !gate.pass);
const preflight = readArtifact('artifacts/p0-hosted-final-proof-preflight-last-run.json');
const summary = readArtifact('artifacts/p0-hosted-final-proof-summary-last-run.json');
const leakFindings = secretLeakFindings();
const hostedProofClosed = hostedBlockers.length === 0 && leakFindings.length === 0;
const publicRolloutAllowed = Boolean(hostedProofClosed && summary?.publicRolloutAllowed === true && gates.find((g) => g.id === 'public_rollout_readiness_optional')?.pass === true);
const result = {
  ok: hostedProofClosed,
  batch: policy.batch,
  version: policy.version,
  generatedAt: new Date().toISOString(),
  strict,
  reviewRoot,
  reviewRootExists: exists(reviewRoot),
  nodeVersion: process.versions.node,
  artifactRootEnv: policy.artifactRootEnv,
  appUrl: safeOriginFromPreflight(preflight),
  hostedProofClosed,
  publicRolloutAllowed,
  productionReady: false,
  sourceLevelOnly: !hostedProofClosed,
  gates,
  hostedBlockers: hostedBlockers.map((gate) => ({ id: gate.id, issues: gate.issues })),
  optionalBlockers: optionalBlockers.map((gate) => ({ id: gate.id, issues: gate.issues })),
  secretLeakFindings: leakFindings,
  nextCommands: hostedProofClosed ? [
    'npm run public-rollout:readiness-report',
    'Run manual production DB/security/legal review before any public rollout claim.',
    'Keep productionReady=false until production review passes.'
  ] : [
    'Deploy to Vercel and copy the HTTPS URL.',
    'Run GitHub Actions workflow P0 Hosted Final Proof with app_url=<Vercel URL>, strict=true on Node24.',
    'Download and extract p0-hosted-final-proof-artifacts.',
    `${policy.artifactRootEnv}=<extracted-artifact-folder> npm run p0:hosted-proof-closure-dossier:strict`
  ],
  claimPolicy: policy.claimPolicy,
  noAiPaymentVerifiedFakeAdded: true,
  warning: 'This dossier reviews evidence only. It does not deploy, does not create production DB proof, and does not replace legal/security review.'
};

const md = [
  '# Batch147 Real Hosted Proof Closure Dossier',
  '',
  `Generated: ${result.generatedAt}`,
  `Review root: \`${relativeDisplay(reviewRoot)}\``,
  `Node running dossier: ${result.nodeVersion}`,
  `Hosted proof closed: ${result.hostedProofClosed}`,
  `Public rollout allowed: ${result.publicRolloutAllowed}`,
  `Production ready: ${result.productionReady}`,
  '',
  '## Gates',
  '| Gate | Status | Required | Blocks hosted proof | Issues |',
  '|---|---:|---:|---:|---|',
  ...gates.map((gate) => `| ${gate.id} | ${gate.status} | ${gate.required ? 'yes' : 'no'} | ${gate.blocksHostedProof ? 'yes' : 'no'} | ${gate.issues.length ? gate.issues.join('<br>') : 'none'} |`),
  '',
  '## Screenshot inventory',
  ...(visualGateDetails().screenshots.length ? visualGateDetails().screenshots.map((item) => `- \`${item.file}\` (${item.bytes} bytes)`) : ['- No PNG screenshots found.']),
  '',
  '## Secret leak scan',
  ...(leakFindings.length ? leakFindings.map((item) => `- ${item.file}: ${item.needle}`) : ['- No configured secret markers found in reviewed JSON/MD/TXT/YAML files.']),
  '',
  '## Next commands',
  ...result.nextCommands.map((item) => `- ${item}`),
  '',
  '## Claim guard',
  ...policy.claimPolicy.blocked.map((item) => `- ${item}`)
].join('\n') + '\n';

fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, JSON.stringify(result, null, 2) + '\n');
fs.writeFileSync(outMd, md);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
console.log(JSON.stringify({ ok: result.ok, hostedProofClosed: result.hostedProofClosed, publicRolloutAllowed: result.publicRolloutAllowed, artifactPath: policy.closureDossierContract.jsonArtifact, markdownPath: policy.closureDossierContract.markdownArtifact, hostedBlockers: result.hostedBlockers }, null, 2));
process.exit(strict && !hostedProofClosed ? 1 : 0);
