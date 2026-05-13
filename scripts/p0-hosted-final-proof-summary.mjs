import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const policy = JSON.parse(fs.readFileSync(path.join(root, 'data/batch146-hosted-proof-runner-hardening-policy.json'), 'utf8'));
const outJson = policy.summaryContract.jsonArtifact;
const outMd = policy.summaryContract.markdownArtifact;

const requiredArtifacts = [
  ['preflight', policy.preflightContract.artifact],
  ['hosted_ci_runner', 'artifacts/p0-hosted-ci-final-proof-runner-last-run.json'],
  ['hosted_ci_report', 'artifacts/runtime-p0-hosted-ci-final-proof-report-last-run.json'],
  ['execution_gate', 'artifacts/p0-hosted-proof-execution-gate-last-run.json'],
  ['execution_gate_markdown', 'artifacts/p0-hosted-proof-execution-gate-checklist.md'],
  ['hosted_evidence_capture_report', 'artifacts/p0-hosted-evidence-capture-report-last-run.json'],
  ['visual_smoke_evidence', 'artifacts/visual-smoke-evidence.json'],
  ['visual_smoke_validate', 'artifacts/visual-smoke-evidence-validate-last-run.json'],
  ['hosted_url_smoke', 'artifacts/hosted-demo-url-smoke-last-run.json'],
  ['release_strict', 'artifacts/verify-release-strict-last-run.json'],
  ['p0_100_release', 'artifacts/verify-p0-100-release-last-run.json'],
  ['public_rollout_readiness', 'artifacts/public-rollout-readiness-report-last-run.json']
];

function relPath(file) { return path.join(root, file); }
function exists(file) { return fs.existsSync(relPath(file)); }
function readJson(file) {
  try { return JSON.parse(fs.readFileSync(relPath(file), 'utf8')); }
  catch { return null; }
}
function statusFromArtifact(file) {
  if (!exists(file)) return 'missing';
  if (/\.md$/i.test(file)) return 'present';
  if (/\.png$/i.test(file)) return fs.statSync(relPath(file)).size > 0 ? 'present' : 'fail';
  const item = readJson(file);
  if (!item) return 'invalid_json';
  if (item.hostedProofClosed === true || item.publicRolloutAllowed === true) return 'pass';
  if (item.ok === true && item.status !== 'BLOCKED_DRY_RUN') return 'pass';
  if (item.status === 'BLOCKED_DRY_RUN') return 'blocked';
  if (item.ok === false) return 'fail';
  return 'present';
}
function artifactRows() {
  return requiredArtifacts.map(([id, file]) => {
    const full = relPath(file);
    const present = fs.existsSync(full);
    return {
      id,
      file,
      present,
      bytes: present ? fs.statSync(full).size : 0,
      status: statusFromArtifact(file)
    };
  });
}
function listScreenshots(dir = 'artifacts/visual-smoke') {
  const fullDir = relPath(dir);
  if (!fs.existsSync(fullDir)) return [];
  const found = [];
  const visit = (current) => {
    for (const name of fs.readdirSync(current)) {
      const full = path.join(current, name);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) visit(full);
      else if (/\.png$/i.test(name)) found.push({ file: path.relative(root, full), bytes: stat.size });
    }
  };
  visit(fullDir);
  return found.sort((a, b) => a.file.localeCompare(b.file));
}

const artifacts = artifactRows();
const screenshots = listScreenshots();
const preflight = readJson(policy.preflightContract.artifact);
const ciReport = readJson('artifacts/runtime-p0-hosted-ci-final-proof-report-last-run.json');
const executionGate = readJson('artifacts/p0-hosted-proof-execution-gate-last-run.json');
const publicRollout = readJson('artifacts/public-rollout-readiness-report-last-run.json');
const visualEvidence = readJson('artifacts/visual-smoke-evidence.json');
const requiredViewportCount = 6;
const passedScreenshotCount = Array.isArray(visualEvidence?.captures) ? visualEvidence.captures.filter((item) => item.status === 'pass').length : 0;

const hostedProofClosed = Boolean(
  preflight?.ok === true &&
  ciReport?.ok === true &&
  executionGate?.hostedProofClosed === true &&
  passedScreenshotCount >= requiredViewportCount
);
const publicRolloutAllowed = Boolean(hostedProofClosed && publicRollout?.publicRolloutAllowed === true && publicRollout?.ok === true);
const missingCritical = artifacts.filter((item) => !item.present).map((item) => item.id);
const blockedOrFailing = artifacts.filter((item) => ['blocked', 'fail', 'missing'].includes(item.status)).map((item) => item.id);

const result = {
  ok: hostedProofClosed,
  batch: policy.batch,
  version: policy.version,
  generatedAt: new Date().toISOString(),
  nodeVersion: process.versions.node,
  appUrlPresent: Boolean(process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.GIAOAN_DEMO_URL || preflight?.appUrl?.present),
  hostedProofClosed,
  publicRolloutAllowed,
  productionReady: false,
  sourceLevelOnly: true,
  artifacts,
  screenshots,
  visual: {
    requiredViewportCount,
    passedScreenshotCount,
    screenshotCount: screenshots.length
  },
  blockers: hostedProofClosed ? [] : Array.from(new Set([...missingCritical, ...blockedOrFailing, ...(executionGate?.blockers || []), ...(ciReport?.missingRequired || []).map((item) => item.id).filter(Boolean)])),
  nextCommands: hostedProofClosed
    ? ['npm run public-rollout:readiness-report', 'manual production DB/security/legal review before public rollout']
    : [
        'Run .github/workflows/p0-hosted-final-proof.yml on GitHub Actions Node24 with workflow_dispatch app_url or secret GIAOAN_DEMO_URL.',
        'Download p0-hosted-final-proof-artifacts and inspect JSON, Markdown, and artifacts/visual-smoke/**/*.png.',
        'Do not claim hosted/public/production closure until this summary has hostedProofClosed=true.'
      ],
  claimPolicy: policy.claimPolicy,
  noAiPaymentVerifiedFakeAdded: true,
  warning: 'This summary is an audit surface. It does not deploy to Vercel and does not replace production DB/security/legal review.'
};

const md = [
  '# Batch146 Hosted Proof Final Evidence Summary',
  '',
  `Generated: ${result.generatedAt}`,
  `Node: ${result.nodeVersion}`,
  `APP_URL present: ${result.appUrlPresent}`,
  `Hosted proof closed: ${result.hostedProofClosed}`,
  `Public rollout allowed: ${result.publicRolloutAllowed}`,
  `Production ready: ${result.productionReady}`,
  '',
  '## Artifact inventory',
  '| Artifact | Status | Present | Bytes | File |',
  '|---|---:|---:|---:|---|',
  ...artifacts.map((item) => `| ${item.id} | ${item.status} | ${item.present ? 'yes' : 'no'} | ${item.bytes} | \`${item.file}\` |`),
  '',
  '## Screenshot inventory',
  screenshots.length
    ? '| File | Bytes |\n|---|---:|\n' + screenshots.map((item) => `| \`${item.file}\` | ${item.bytes} |`).join('\n')
    : '_No screenshot PNG files found._',
  '',
  '## Blockers',
  ...(result.blockers.length ? result.blockers.map((item) => `- ${item}`) : ['- None from this summary; still run manual production DB/security/legal review before broader rollout.']),
  '',
  '## Next commands',
  ...result.nextCommands.map((item) => `- ${item}`),
  '',
  '## Claim guard',
  '- No AI added.',
  '- No payment added.',
  '- No fake verified data added.',
  '- No community auto-public added.',
  '- Production-ready remains false without separate production review.'
].join('\n') + '\n';

fs.mkdirSync(path.dirname(relPath(outJson)), { recursive: true });
fs.writeFileSync(relPath(outJson), JSON.stringify(result, null, 2) + '\n');
fs.writeFileSync(relPath(outMd), md);
if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
}
console.log(JSON.stringify({ ok: result.ok, hostedProofClosed: result.hostedProofClosed, publicRolloutAllowed: result.publicRolloutAllowed, artifactPath: outJson, markdownPath: outMd, blockers: result.blockers }, null, 2));
process.exit(0);
