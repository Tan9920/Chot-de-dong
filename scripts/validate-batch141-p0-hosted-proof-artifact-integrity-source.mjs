import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''; }
function readJson(file, fallback = {}) { try { return JSON.parse(read(file) || JSON.stringify(fallback)); } catch { return fallback; } }
function writeJson(file, value) { fs.mkdirSync(file.split('/').slice(0, -1).join('/') || '.', { recursive: true }); fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); }
function check(label, condition, detail = '') { if (!condition) issues.push(detail ? `${label}: ${detail}` : label); }
const issues = [];

const pkg = readJson('package.json');
const lock = readJson('package-lock.json');
const policy = readJson('data/runtime-p0-hosted-ci-final-proof-policy.json');
const report = read('scripts/runtime-p0-hosted-ci-final-proof-report.mjs');
const runner = read('scripts/p0-hosted-ci-final-proof-runner.mjs');
const release = read('scripts/verify-release.mjs');
const lib = read('lib/runtime-p0-hosted-ci-final-proof.ts');
const registry = read('scripts/run-source-validators.mjs');
const readme = read('README.md');
const notes = `${read('BATCH141_NOTES.md')}\n${read('docs/BATCH141_P0_HOSTED_PROOF_ARTIFACT_DISAMBIGUATION.md')}`;

check('package version must be 0.141.0 or later-compatible', ['0.141.0','0.142.0'].includes(pkg.version), pkg.version);
check('package-lock version must be 0.141.0 or later-compatible', ['0.141.0','0.142.0'].includes(lock.version), lock.version);
check('package-lock root version must be 0.141.0 or later-compatible', ['0.141.0','0.142.0'].includes(lock.packages?.['']?.version), lock.packages?.['']?.version);
check('node engine must remain 24.x', pkg.engines?.node === '24.x', pkg.engines?.node);
for (const script of ['batch141:p0-hosted-proof-artifact-integrity-validate','smoke:batch141','verify:batch141','verify:release:strict','verify:p0-100-release','runtime:p0-hosted-ci-proof-report']) {
  check(`package.json missing script ${script}`, Boolean(pkg.scripts?.[script]));
}
check('verify:release:strict must write dedicated artifact', pkg.scripts?.['verify:release:strict']?.includes('GIAOAN_VERIFY_RELEASE_ARTIFACT=artifacts/verify-release-strict-last-run.json'));
check('verify:p0-100-release must write dedicated artifact', pkg.scripts?.['verify:p0-100-release']?.includes('GIAOAN_VERIFY_RELEASE_ARTIFACT=artifacts/verify-p0-100-release-last-run.json'));
check('policy must be Batch141 artifact disambiguation or Batch142-compatible hardening', (policy.batch === 'Batch141 — P0 Hosted Proof Artifact Disambiguation' && policy.version === '0.141.0') || (policy.batch === 'Batch142 — P0 Node24 CI Provenance Hardening' && policy.version === '0.142.0'));
check('policy must keep public rollout blocked by default', policy.publicRolloutAllowed === false && policy.productionReady === false);
check('hosted strict and p0-100 artifacts must be separate in policy', JSON.stringify(policy).includes('verify-release-strict-last-run.json') && JSON.stringify(policy).includes('verify-p0-100-release-last-run.json'));
check('policy must define artifact integrity rules and contracts', JSON.stringify(policy).includes('artifactIntegrityRules') && JSON.stringify(policy).includes('artifactContract') && JSON.stringify(policy).includes('proofProfile'));
for (const marker of ['GIAOAN_VERIFY_RELEASE_ARTIFACT','proofProfile','hosted_release_strict','p0_100_release','artifactContract','requireNode24']) check(`verify-release missing ${marker}`, release.includes(marker));
for (const marker of ['verify:p0-100-release','p0-100-release-proof','source-batch141','P0-100 release proof requires Node24']) check(`runner missing ${marker}`, runner.includes(marker));
for (const marker of ['artifactContractIssues','releaseArtifactOk','hostedUrlSmokeOk','deepestNode24Ok','proofProfile_mismatch']) check(`report missing ${marker}`, report.includes(marker));
for (const marker of ['artifactContractIssues','releaseArtifactOk','hostedUrlSmokeOk','deepestNode24Ok','proofProfile_mismatch']) check(`lib missing ${marker}`, lib.includes(marker));
check('run-source-validators must register Batch141 validator', registry.includes('validate-batch141-p0-hosted-proof-artifact-integrity-source.mjs'));
check('README/docs must mention Batch141', `${readme}\n${notes}`.includes('Batch141'));
check('README/docs must mention no AI/payment/fake verified', `${readme}\n${notes}`.toLowerCase().includes('không thêm ai') && `${readme}\n${notes}`.toLowerCase().includes('không thêm thanh toán') && `${readme}\n${notes}`.toLowerCase().includes('verified giả'));

const artifactFiles = [
  'artifacts/verify-release-strict-last-run.json',
  'artifacts/verify-p0-100-release-last-run.json',
  'artifacts/verify-p0-deepest-last-run.json',
  'artifacts/hosted-demo-url-smoke-last-run.json',
  'artifacts/visual-smoke-evidence.json',
  'artifacts/runtime-p0-hosted-ci-final-proof-report-last-run.json'
];
const backups = Object.fromEntries(artifactFiles.map((file) => [file, read(file)]));
try {
  const now = new Date().toISOString();
  writeJson('artifacts/verify-p0-deepest-last-run.json', {
    ok: true,
    command: 'verify:p0-deepest',
    nodeVersion: '24.0.0',
    requireNode24: true,
    results: ['source-validate','data-validate','typecheck','controlled-startable-build','production-live-smoke','auth-invite-runtime-smoke','loopback-hosted-route-smoke'].map((id) => ({ id, status: 'PASS' })),
    generatedAt: now
  });
  writeJson('artifacts/hosted-demo-url-smoke-last-run.json', {
    ok: true,
    base: 'https://example.vercel.app',
    summary: { batch98RealAccountSaveExportSmoke: true },
    generatedAt: now
  });
  writeJson('artifacts/visual-smoke-evidence.json', {
    ok: true,
    captures: (policy.visualEvidence?.requiredViewports || []).map((viewportId) => ({ viewportId, status: 'pass', width: 100, height: 100, screenshotPath: `artifacts/visual/${viewportId}.png`, flows: ['home_visible','lesson_create_edit_visible','governance_labels_visible','export_actions_reachable','navigation_not_trapped'] })),
    generatedAt: now
  });
  const strictArtifact = {
    ok: true,
    command: 'verify:release:strict',
    proofProfile: 'hosted_release_strict',
    requireNode24: false,
    requireHostedUrl: true,
    requireVisualSmoke: false,
    artifactContract: { command: 'verify:release:strict', proofProfile: 'hosted_release_strict', requireNode24: false, requireHostedUrl: true, requireVisualSmoke: false },
    results: [
      { id: 'verify-p0-deepest', status: 'PASS' },
      { id: 'smoke-url-strict', status: 'PASS' },
      { id: 'visual-smoke-evidence', status: 'SKIP' }
    ],
    generatedAt: now
  };
  writeJson('artifacts/verify-release-strict-last-run.json', strictArtifact);
  writeJson('artifacts/verify-p0-100-release-last-run.json', strictArtifact);
  let run = spawnSync(process.execPath, ['scripts/runtime-p0-hosted-ci-final-proof-report.mjs'], { encoding: 'utf8' });
  let generatedReport = readJson('artifacts/runtime-p0-hosted-ci-final-proof-report-last-run.json');
  const p0100Wrong = generatedReport.evidence?.find?.((item) => item.id === 'p0_100_release');
  check('regression must not let hosted strict artifact satisfy p0_100_release', generatedReport.ok === false && p0100Wrong?.state !== 'pass', `exit=${run.status} state=${p0100Wrong?.state} ok=${generatedReport.ok}`);
  check('regression p0_100 must expose profile/flag mismatch', Array.isArray(p0100Wrong?.artifactContractIssues) && (p0100Wrong.artifactContractIssues.includes('proofProfile_mismatch:hosted_release_strict') || p0100Wrong.artifactContractIssues.includes('requireNode24_mismatch') || p0100Wrong.artifactContractIssues.includes('requireVisualSmoke_mismatch')), JSON.stringify(p0100Wrong));

  writeJson('artifacts/verify-p0-100-release-last-run.json', {
    ok: true,
    command: 'verify:p0-100-release',
    proofProfile: 'p0_100_release',
    requireNode24: true,
    requireHostedUrl: true,
    requireVisualSmoke: true,
    artifactContract: { command: 'verify:p0-100-release', proofProfile: 'p0_100_release', requireNode24: true, requireHostedUrl: true, requireVisualSmoke: true },
    results: [
      { id: 'verify-p0-deepest', status: 'PASS' },
      { id: 'smoke-url-strict', status: 'PASS' },
      { id: 'visual-smoke-evidence', status: 'PASS' }
    ],
    generatedAt: now
  });
  run = spawnSync(process.execPath, ['scripts/runtime-p0-hosted-ci-final-proof-report.mjs'], { encoding: 'utf8' });
  generatedReport = readJson('artifacts/runtime-p0-hosted-ci-final-proof-report-last-run.json');
  const p0100Right = generatedReport.evidence?.find?.((item) => item.id === 'p0_100_release');
  check('regression matching p0_100 artifact can satisfy p0_100_release contract', p0100Right?.state === 'pass' && p0100Right?.artifactOk === true, `exit=${run.status} ${JSON.stringify(p0100Right)}`);
} finally {
  for (const [file, content] of Object.entries(backups)) {
    if (content) fs.writeFileSync(file, content, 'utf8');
    else if (fs.existsSync(file)) fs.unlinkSync(file);
  }
}

const pkgText = JSON.stringify(pkg).toLowerCase();
for (const forbidden of ['openai','@google/generative-ai','@anthropic-ai/sdk','anthropic','langchain','stripe','paypal']) {
  check(`forbidden dependency ${forbidden}`, !pkgText.includes(`"${forbidden}`));
}
const combined = `${JSON.stringify(policy)}\n${report}\n${runner}\n${release}\n${lib}`.toLowerCase();
check('Batch141 must not unlock productionReady true', !combined.includes('productionready: true'));
check('Batch141 must not auto-public community', !combined.includes('autopublic: true') && !combined.includes('auto-public: true'));

const result = {
  ok: issues.length === 0,
  batch: 'Batch141 P0 Hosted Proof Artifact Disambiguation',
  sourceLevelOnly: true,
  regressionCovered: true,
  noAiPaymentOrFakeVerifiedAdded: true,
  issues,
  note: 'Validates that hosted strict release artifacts cannot be reused as P0-100 release proof. It does not prove real Node24/Vercel/browser evidence.'
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
