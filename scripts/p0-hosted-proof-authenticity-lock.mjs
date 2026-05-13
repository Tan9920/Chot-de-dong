import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const policy = JSON.parse(fs.readFileSync(path.join(root, 'data/batch148-hosted-proof-authenticity-lock-policy.json'), 'utf8'));
const ARTIFACT_ROOT_ENV_NAME = 'GIAOAN_HOSTED_PROOF_ARTIFACT_ROOT';
const AUTHENTICITY_LOCK_JSON = 'p0-hosted-proof-authenticity-lock-last-run.json';
const AUTHENTICITY_LOCK_MD = 'p0-hosted-proof-authenticity-lock.md';
const strict = process.argv.includes('--strict') || process.env.GIAOAN_HOSTED_PROOF_AUTHENTICITY_STRICT === '1';
const requestedArtifactRoot = process.env[ARTIFACT_ROOT_ENV_NAME] || process.argv.find((arg) => arg.startsWith('--artifact-root='))?.split('=').slice(1).join('=') || '';
const reviewRoot = requestedArtifactRoot ? path.resolve(root, requestedArtifactRoot) : root;
const outJson = path.join(root, policy.lockContract.jsonArtifact);
const outMd = path.join(root, policy.lockContract.markdownArtifact);

function exists(file) { return Boolean(file && fs.existsSync(file)); }
function normalizeRel(rel) { return String(rel || '').replaceAll('\\', '/').replace(/^\.\//, ''); }
function stripArtifacts(rel) { const normalized = normalizeRel(rel); return normalized.startsWith('artifacts/') ? normalized.slice('artifacts/'.length) : normalized; }
function candidatePaths(rel) {
  const normalized = normalizeRel(rel);
  const withoutArtifacts = stripArtifacts(normalized);
  return Array.from(new Set([
    path.join(reviewRoot, normalized),
    path.join(reviewRoot, withoutArtifacts),
    path.join(root, normalized)
  ]));
}
function resolveArtifact(rel) { return candidatePaths(rel).find(exists) || candidatePaths(rel)[0]; }
function relativeDisplay(file) { return path.relative(root, file).replaceAll('\\', '/') || '.'; }
function tryRead(file) { try { return fs.readFileSync(file, 'utf8'); } catch { return ''; } }
function tryJson(file) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } }
function statBytes(file) { try { return fs.statSync(file).size; } catch { return 0; } }
function sha256File(file) { try { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); } catch { return null; } }
function nodeMajor(value) { return Number(String(value || '').split('.')[0] || 0); }
function isLocalHost(host = '') { return /^(localhost|127\.0\.0\.1|0\.0\.0\.0|::1)$/i.test(String(host || '').trim()); }
function originFromUrl(value) { try { const url = new URL(String(value || '')); return { origin: url.origin, protocol: url.protocol, host: url.hostname, isLocal: isLocalHost(url.hostname) }; } catch { return null; } }
function asDate(value) { const time = Date.parse(String(value || '')); return Number.isFinite(time) ? new Date(time) : null; }
function collectFiles(base) {
  const out = [];
  if (!exists(base)) return out;
  const visit = (current) => {
    for (const name of fs.readdirSync(current)) {
      const full = path.join(current, name);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        if (!full.includes(`${path.sep}node_modules${path.sep}`) && !full.includes(`${path.sep}.next${path.sep}`)) visit(full);
      } else out.push(full);
    }
  };
  visit(base);
  return out;
}
function screenshotFiles() {
  const files = collectFiles(reviewRoot).filter((file) => /\.(png)$/i.test(file) && file.replaceAll('\\','/').includes('visual-smoke'));
  return files.map((file) => ({ file, display: relativeDisplay(file), bytes: statBytes(file), sha256: sha256File(file) })).sort((a, b) => a.display.localeCompare(b.display));
}
function artifactInventoryItem(id, rel) {
  const file = resolveArtifact(rel);
  return { id, file: normalizeRel(rel), resolved: relativeDisplay(file), present: exists(file), bytes: statBytes(file), sha256: sha256File(file) };
}
function generatedAtFrom(json) { return asDate(json?.generatedAt || json?.finishedAt || json?.timestamp || json?.runAt); }
function appOriginsFrom(json) {
  const origins = [];
  const push = (label, candidate) => { if (candidate?.origin) origins.push({ label, ...candidate }); };
  push('appUrlObject', json?.appUrl?.origin ? json.appUrl : null);
  push('appUrlString', originFromUrl(json?.appUrl));
  push('url', originFromUrl(json?.url));
  push('origin', originFromUrl(json?.origin));
  push('baseUrl', originFromUrl(json?.baseUrl));
  push('targetUrl', originFromUrl(json?.targetUrl));
  push('appUrlValue', originFromUrl(json?.appUrlValue));
  if (Array.isArray(json?.captures)) {
    json.captures.forEach((capture, index) => {
      push(`capture_${index}_url`, originFromUrl(capture?.url || capture?.pageUrl || capture?.appUrl));
    });
  }
  return origins;
}
function screenshotPresentForCapture(capture, screenshots) {
  const screenshotPath = normalizeRel(capture?.screenshotPath || capture?.file || capture?.path || '');
  if (!screenshotPath) return false;
  const direct = resolveArtifact(screenshotPath);
  if (exists(direct) && statBytes(direct) > 0) return true;
  const base = path.basename(screenshotPath);
  return screenshots.some((item) => path.basename(item.file) === base && item.bytes > 0);
}
function evaluateArtifact(rule, screenshots) {
  const item = artifactInventoryItem(rule.id, rule.file);
  const json = item.present ? tryJson(resolveArtifact(rule.file)) : null;
  const issues = [];
  if (!item.present) issues.push('missing_artifact');
  if (item.present && !json) issues.push('invalid_json');
  if (rule.mustBeOk && json?.ok !== true) issues.push('ok_not_true');
  if (rule.requiresNode24 && nodeMajor(json?.nodeVersion) !== 24 && Number(json?.nodeMajor || 0) !== 24) issues.push(`node_major_${nodeMajor(json?.nodeVersion) || json?.nodeMajor || 'missing'}_not_24`);
  if (rule.requiresGithubActions && json?.ciProvenance?.githubActions !== true) issues.push('github_actions_provenance_missing');
  if (rule.requiresGithubActions && !String(json?.ciProvenance?.githubRunId || '').trim()) issues.push('github_run_id_missing');
  if (rule.requiresHttpsAppUrl) {
    const app = json?.appUrl?.origin ? json.appUrl : originFromUrl(json?.appUrl || json?.appUrlValue || json?.url || json?.baseUrl || '');
    if (!app?.origin) issues.push('app_url_origin_missing');
    if (app?.protocol !== 'https:') issues.push('app_url_not_https');
    if (app?.isLocal === true) issues.push('app_url_is_localhost');
  }
  if (rule.requiresStrict && json?.strict !== true) issues.push('strict_not_true');
  if (rule.requiresZeroFailures && Number(json?.summary?.failed ?? 1) !== 0) issues.push(`summary_failed_${Number(json?.summary?.failed ?? 1)}`);
  if (rule.requiresHostedProofClosed && json?.hostedProofClosed !== true) issues.push('hostedProofClosed_not_true');
  if (rule.requiresPublicRolloutAllowed && json?.publicRolloutAllowed !== true) issues.push('publicRolloutAllowed_not_true');
  if (rule.requiresScreenshots) {
    const captures = Array.isArray(json?.captures) ? json.captures : [];
    for (const viewportId of policy.requiredViewports || []) {
      const capture = captures.find((entry) => entry?.viewportId === viewportId);
      if (!capture) { issues.push(`missing_viewport_${viewportId}`); continue; }
      if (capture.status !== 'pass') issues.push(`viewport_${viewportId}_status_${capture.status || 'missing'}`);
      if (!screenshotPresentForCapture(capture, screenshots)) issues.push(`viewport_${viewportId}_missing_png`);
    }
  }
  return { ...item, generatedAt: json?.generatedAt || null, origins: json ? appOriginsFrom(json) : [], pass: issues.length === 0, issues };
}

const screenshots = screenshotFiles();
const evidence = (policy.requiredJsonArtifacts || []).map((rule) => evaluateArtifact(rule, screenshots));
const allIssues = [];
for (const item of evidence) for (const issue of item.issues) allIssues.push(`${item.id}:${issue}`);

const timestamps = evidence.map((item) => ({ id: item.id, date: asDate(item.generatedAt), generatedAt: item.generatedAt })).filter((item) => item.date);
const times = timestamps.map((item) => item.date.getTime());
const spreadMinutes = times.length > 1 ? Math.round((Math.max(...times) - Math.min(...times)) / 60000) : 0;
if (timestamps.length < Math.min(policy.minRequiredArtifacts || 0, evidence.length)) allIssues.push(`timestamp_count_${timestamps.length}_below_min_${policy.minRequiredArtifacts}`);
if (spreadMinutes > Number(policy.maxTimestampSpreadMinutes || 90)) allIssues.push(`timestamp_spread_${spreadMinutes}_minutes_exceeds_${policy.maxTimestampSpreadMinutes}`);

const origins = evidence.flatMap((item) => item.origins.map((origin) => ({ artifact: item.id, ...origin })));
const uniqueOrigins = Array.from(new Set(origins.map((item) => item.origin).filter(Boolean)));
const badOrigins = origins.filter((item) => item.protocol !== 'https:' || item.isLocal === true);
if (badOrigins.length) allIssues.push('non_https_or_local_origin_present');
if (uniqueOrigins.length > 1) allIssues.push(`mixed_app_origins_${uniqueOrigins.join(',')}`);

const preflightJson = tryJson(resolveArtifact('artifacts/p0-hosted-final-proof-preflight-last-run.json'));
const runIdentity = {
  githubActions: Boolean(preflightJson?.ciProvenance?.githubActions),
  githubWorkflow: preflightJson?.ciProvenance?.githubWorkflow || null,
  githubRunId: preflightJson?.ciProvenance?.githubRunId || null,
  githubSha: preflightJson?.ciProvenance?.githubSha || null,
  githubRef: preflightJson?.ciProvenance?.githubRef || null,
  runnerOS: preflightJson?.ciProvenance?.runnerOS || null,
  nodeVersion: preflightJson?.nodeVersion || null,
  nodeMajor: preflightJson?.nodeMajor || nodeMajor(preflightJson?.nodeVersion)
};
if (runIdentity.githubActions !== true) allIssues.push('run_identity_github_actions_missing');
if (!String(runIdentity.githubRunId || '').trim()) allIssues.push('run_identity_github_run_id_missing');
if (Number(runIdentity.nodeMajor || 0) !== 24) allIssues.push(`run_identity_node_major_${runIdentity.nodeMajor || 'missing'}_not_24`);

const inventory = evidence.map(({ id, file, resolved, present, bytes, sha256, generatedAt, pass, issues }) => ({ id, file, resolved, present, bytes, sha256, generatedAt, pass, issues }));
const screenshotInventory = screenshots.map(({ display, bytes, sha256 }) => ({ file: display, bytes, sha256 }));
const requiredScreenshotsOk = policy.requiredViewports.every((viewportId) => {
  const visual = tryJson(resolveArtifact('artifacts/visual-smoke-evidence.json'));
  const capture = Array.isArray(visual?.captures) ? visual.captures.find((entry) => entry?.viewportId === viewportId) : null;
  return capture?.status === 'pass' && screenshotPresentForCapture(capture, screenshots);
});
if (!requiredScreenshotsOk) allIssues.push('required_screenshot_png_inventory_incomplete');

const authenticityLocked = allIssues.length === 0 && evidence.every((item) => item.pass) && screenshots.length >= policy.requiredViewports.length;
const publicRolloutAllowed = false;
const result = {
  ok: authenticityLocked,
  batch: policy.batch,
  version: policy.version,
  generatedAt: new Date().toISOString(),
  strict,
  reviewRoot,
  reviewRootExists: exists(reviewRoot),
  nodeVersion: process.versions.node,
  artifactRootEnv: policy.artifactRootEnv,
  authenticityLocked,
  hostedProofClosed: authenticityLocked,
  publicRolloutAllowed,
  productionReady: false,
  sourceLevelOnly: !authenticityLocked,
  runIdentity,
  appOrigins: uniqueOrigins,
  timestampSpreadMinutes: spreadMinutes,
  maxTimestampSpreadMinutes: policy.maxTimestampSpreadMinutes,
  evidenceInventory: inventory,
  screenshotInventory,
  blockers: Array.from(new Set(allIssues)),
  nextCommands: authenticityLocked ? [
    'Run public rollout readiness report again from the same downloaded artifact bundle.',
    'Do production DB/security/legal review before any public rollout or production-ready claim.',
    'Keep productionReady=false until production review passes.'
  ] : [
    'Run the P0 Hosted Final Proof GitHub Actions workflow on Node24 with app_url=<Vercel URL> and strict=true.',
    'Download and extract the p0-hosted-final-proof-artifacts bundle from that same workflow run.',
    `${policy.artifactRootEnv}=<extracted-artifact-folder> npm run p0:hosted-proof-authenticity-lock:strict`,
    'Do not mix older local artifacts with the downloaded hosted proof artifact folder.'
  ],
  claimPolicy: policy.claimPolicy,
  noAiPaymentVerifiedFakeAdded: true,
  warning: 'Batch148 locks evidence authenticity only. It does not deploy, does not create production DB proof, and does not replace legal/security review.'
};
const md = [
  '# Batch148 Hosted Proof Evidence Authenticity Lock',
  '',
  `Generated: ${result.generatedAt}`,
  `Review root: \`${relativeDisplay(reviewRoot)}\``,
  `Node running lock: ${result.nodeVersion}`,
  `Authenticity locked: ${result.authenticityLocked}`,
  `Hosted proof closed by authenticity lock: ${result.hostedProofClosed}`,
  `Public rollout allowed: ${result.publicRolloutAllowed}`,
  `Production ready: ${result.productionReady}`,
  `Timestamp spread: ${result.timestampSpreadMinutes} minutes / max ${result.maxTimestampSpreadMinutes}`,
  '',
  '## Run identity',
  `- GitHub Actions: ${result.runIdentity.githubActions}`,
  `- Workflow: ${result.runIdentity.githubWorkflow || 'missing'}`,
  `- Run ID: ${result.runIdentity.githubRunId || 'missing'}`,
  `- SHA: ${result.runIdentity.githubSha || 'missing'}`,
  `- Node: ${result.runIdentity.nodeVersion || 'missing'}`,
  '',
  '## Evidence inventory',
  '| Artifact | Pass | Bytes | GeneratedAt | SHA-256 | Issues |',
  '|---|---:|---:|---|---|---|',
  ...inventory.map((item) => `| ${item.id} | ${item.pass ? 'yes' : 'no'} | ${item.bytes} | ${item.generatedAt || 'missing'} | ${item.sha256 || 'missing'} | ${item.issues.length ? item.issues.join('<br>') : 'none'} |`),
  '',
  '## Screenshot inventory',
  ...(screenshotInventory.length ? screenshotInventory.map((item) => `- \`${item.file}\` (${item.bytes} bytes, sha256 ${item.sha256})`) : ['- No PNG screenshots found.']),
  '',
  '## Blockers',
  ...(result.blockers.length ? result.blockers.map((item) => `- ${item}`) : ['- none']),
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
console.log(JSON.stringify({ ok: result.ok, authenticityLocked: result.authenticityLocked, hostedProofClosed: result.hostedProofClosed, publicRolloutAllowed: result.publicRolloutAllowed, artifactPath: policy.lockContract.jsonArtifact, markdownPath: policy.lockContract.markdownArtifact, blockers: result.blockers }, null, 2));
process.exit(strict && !authenticityLocked ? 1 : 0);
