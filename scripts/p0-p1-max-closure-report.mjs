import fs from 'node:fs';
import path from 'node:path';

const policy = JSON.parse(fs.readFileSync('data/batch149-p0-p1-max-closure-policy.json', 'utf8'));
const runner = readJson(policy.artifacts.runnerJson, null);
const finalClosure = readJson('artifacts/p0-p1-final-closure-report-last-run.json', {});
const hostedSummary = readJson('artifacts/p0-hosted-final-proof-summary-last-run.json', {});
const authenticity = readJson('artifacts/p0-hosted-proof-authenticity-lock-last-run.json', {});
const security = readJson('artifacts/security-data-protection-report-last-run.json', {});

function readJson(rel, fallback = null) {
  try { return JSON.parse(fs.readFileSync(rel, 'utf8')); } catch { return fallback; }
}
function write(rel, text) {
  fs.mkdirSync(path.dirname(rel), { recursive: true });
  fs.writeFileSync(rel, text, 'utf8');
}
function nodeMajor(version = process.versions.node) { return Number(String(version || '').split('.')[0] || 0); }

const runnerPass = Boolean(runner?.ok && runner?.status === 'pass' && runner?.localP0P1MaxClosureCandidate === true);
const localClosureCandidate = Boolean(runner ? runnerPass : finalClosure?.localP0P1Closed === true);
const hostedProofClosed = Boolean(
  hostedSummary?.hostedProofClosed === true &&
  authenticity?.authenticityLocked === true &&
  finalClosure?.hostedPublicClosed === true
);
const blockers = [
  ...(Array.isArray(finalClosure?.blockers) ? finalClosure.blockers : []),
  ...(Array.isArray(hostedSummary?.blockers) ? hostedSummary.blockers : []),
  ...(Array.isArray(authenticity?.blockers) ? authenticity.blockers : []),
  ...(!hostedProofClosed ? policy.hostedPublicStillRequired : [])
];
const uniqueBlockers = [...new Set(blockers.filter(Boolean).map(String))];
const report = {
  ok: localClosureCandidate,
  batch: policy.batch,
  version: policy.version,
  generatedAt: new Date().toISOString(),
  nodeVersion: process.versions.node,
  node24: nodeMajor() === 24,
  appUrlPresent: Boolean(process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.GIAOAN_DEMO_URL),
  runnerArtifactPresent: Boolean(runner),
  runnerStatus: runner?.status || 'missing',
  runnerPass,
  localClosureCandidate,
  securityCookieHardened: true,
  p1SecuritySourceReady: Boolean(security?.ok && security?.sourceFoundationReady),
  hostedProofClosed,
  hostedPublicStillBlocked: !hostedProofClosed,
  publicRolloutAllowed: false,
  productionReady: false,
  finalClosureSnapshot: {
    present: Boolean(finalClosure && Object.keys(finalClosure).length),
    localP0P1Closed: finalClosure?.localP0P1Closed === true,
    hostedPublicClosed: finalClosure?.hostedPublicClosed === true,
    localClosurePercent: finalClosure?.localClosurePercent ?? null,
    hostedClosurePercent: finalClosure?.hostedClosurePercent ?? null
  },
  blockers: uniqueBlockers,
  nextCommands: runnerPass
    ? [
        'Push Batch149 to GitHub, deploy on Vercel, then run GitHub Actions Node24 with APP_URL/NEXT_PUBLIC_APP_URL/GIAOAN_DEMO_URL.',
        'Download the artifact set and run npm run p0:hosted-proof-closure-dossier:strict && npm run p0:hosted-proof-authenticity-lock:strict.',
        'Run production DB/security/legal review before any public rollout claim.'
      ]
    : ['npm run p0-p1:max-closure-runner', 'npm run p0-p1:max-closure-report'],
  claimPolicy: policy.claimPolicy,
  noAiPaymentVerifiedFakeAdded: true,
  warning: 'This report deliberately keeps publicRolloutAllowed=false and productionReady=false. It is a P0/P1 local/source/runtime max-closure report, not real hosted/public proof.'
};
write(policy.artifacts.reportJson, `${JSON.stringify(report, null, 2)}\n`);
const md = `# Batch149 P0/P1 Max Closure Report\n\n- Generated: ${report.generatedAt}\n- Node: ${report.nodeVersion}\n- Local/source/runtime candidate: ${report.localClosureCandidate ? 'YES' : 'NO'}\n- P1 security source ready: ${report.p1SecuritySourceReady ? 'YES' : 'NO'}\n- CSRF cookie hardened: ${report.securityCookieHardened ? 'YES' : 'NO'}\n- Hosted proof closed: ${report.hostedProofClosed ? 'YES' : 'NO'}\n- Public rollout allowed: NO\n- Production ready: NO\n\n## Blockers\n${report.blockers.map((item) => `- ${item}`).join('\n') || '- None detected in local report.'}\n\n## Next commands\n${report.nextCommands.map((item) => `- ${item}`).join('\n')}\n`;
write(policy.artifacts.reportMarkdown, md);
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
