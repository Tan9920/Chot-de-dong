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
const deepest = read('scripts/verify-p0-deepest.mjs');
const report = read('scripts/runtime-p0-hosted-ci-final-proof-report.mjs');
const lib = read('lib/runtime-p0-hosted-ci-final-proof.ts');
const registry = read('scripts/run-source-validators.mjs');
const readmeDocs = `${read('README.md')}\n${read('BATCH142_NOTES.md')}\n${read('docs/BATCH142_P0_NODE24_CI_PROVENANCE_HARDENING.md')}`;

check('package version must be 0.142.0', pkg.version === '0.142.0', pkg.version);
check('package-lock version must be 0.142.0', lock.version === '0.142.0', lock.version);
check('package-lock root version must be 0.142.0', lock.packages?.['']?.version === '0.142.0', lock.packages?.['']?.version);
check('node engine must remain 24.x', pkg.engines?.node === '24.x', pkg.engines?.node);
for (const script of ['batch142:p0-node24-ci-provenance-validate','smoke:batch142','verify:batch142','verify:p0-deepest-node24-ci']) {
  check(`package.json missing script ${script}`, Boolean(pkg.scripts?.[script]));
}
check('verify:p0-deepest-node24-ci must require CI provenance', pkg.scripts?.['verify:p0-deepest-node24-ci']?.includes('GIAOAN_REQUIRE_CI_PROVENANCE=1'));
check('verify:p0-deepest-node24-ci must still require Node24', pkg.scripts?.['verify:p0-deepest-node24-ci']?.includes('GIAOAN_REQUIRE_NODE24=1'));
check('policy must be Batch142 provenance hardening', policy.batch === 'Batch142 — P0 Node24 CI Provenance Hardening' && policy.version === '0.142.0');
const node24Evidence = (policy.requiredEvidence || []).find((item) => item.id === 'node24_ci_deepest');
check('policy must require node24_ci_deepest evidence', Boolean(node24Evidence));
check('node24_ci_deepest must require CI provenance', node24Evidence?.artifactContract?.requireCiProvenance === true);
check('node24_ci_deepest must require github_actions provider', node24Evidence?.artifactContract?.ciProvider === 'github_actions');
for (const marker of ['requireCiProvenance','ciProvenance','GITHUB_ACTIONS','GITHUB_RUN_ID','ci-provenance-preflight']) check(`verify-p0-deepest missing ${marker}`, deepest.includes(marker));
for (const marker of ['ciProvenanceOk','ci_provenance_contract_not_met','requireCiProvenance']) check(`hosted proof report missing ${marker}`, report.includes(marker));
for (const marker of ['ciProvenanceOk','ci_provenance_contract_not_met','requireCiProvenance']) check(`runtime lib missing ${marker}`, lib.includes(marker));
check('source validator registry must include Batch142 validator', registry.includes('validate-batch142-p0-node24-ci-provenance-source.mjs'));
check('README/docs must mention Batch142', readmeDocs.includes('Batch142'));
check('README/docs must keep no AI/payment/fake verified claims', readmeDocs.toLowerCase().includes('không thêm ai') && readmeDocs.toLowerCase().includes('không thêm thanh toán') && readmeDocs.toLowerCase().includes('verified giả'));

const artifactFiles = [
  'artifacts/verify-p0-deepest-last-run.json',
  'artifacts/verify-release-strict-last-run.json',
  'artifacts/verify-p0-100-release-last-run.json',
  'artifacts/hosted-demo-url-smoke-last-run.json',
  'artifacts/visual-smoke-evidence.json',
  'artifacts/runtime-p0-hosted-ci-final-proof-report-last-run.json'
];
const backups = Object.fromEntries(artifactFiles.map((file) => [file, read(file)]));
const passIds = node24Evidence?.artifactContract?.mustPassIds || [];
const now = new Date().toISOString();
function writeCommonArtifacts(ciProvenance) {
  writeJson('artifacts/verify-p0-deepest-last-run.json', {
    ok: true,
    command: 'verify:p0-deepest',
    nodeVersion: '24.0.0',
    requireNode24: true,
    requireCiProvenance: true,
    ciProvenance,
    results: passIds.map((id) => ({ id, status: 'PASS' })),
    generatedAt: now
  });
  writeJson('artifacts/verify-release-strict-last-run.json', {
    ok: true,
    command: 'verify:release:strict',
    proofProfile: 'hosted_release_strict',
    requireNode24: false,
    requireHostedUrl: true,
    requireVisualSmoke: false,
    results: [
      { id: 'verify-p0-deepest', status: 'PASS' },
      { id: 'smoke-url-strict', status: 'PASS' },
      { id: 'visual-smoke-evidence', status: 'SKIP' }
    ],
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
    captures: (policy.visualEvidence?.requiredViewports || []).map((viewportId) => ({ viewportId, status: 'pass', screenshotPath: `artifacts/visual-smoke/${viewportId}.png` })),
    generatedAt: now
  });
  writeJson('artifacts/verify-p0-100-release-last-run.json', {
    ok: true,
    command: 'verify:p0-100-release',
    proofProfile: 'p0_100_release',
    requireNode24: true,
    requireHostedUrl: true,
    requireVisualSmoke: true,
    results: [
      { id: 'verify-p0-deepest', status: 'PASS' },
      { id: 'smoke-url-strict', status: 'PASS' },
      { id: 'visual-smoke-evidence', status: 'PASS' }
    ],
    generatedAt: now
  });
}
function runReport() {
  const result = spawnSync('node', ['scripts/runtime-p0-hosted-ci-final-proof-report.mjs'], { encoding: 'utf8' });
  check('runtime hosted CI report should exit 0 for inspection', result.status === 0, result.stderr || result.stdout);
  return readJson('artifacts/runtime-p0-hosted-ci-final-proof-report-last-run.json');
}
try {
  writeCommonArtifacts({ required: true, githubActions: false, githubWorkflow: '', githubRunId: '', runnerOS: '' });
  let state = runReport();
  const localNode24 = (state.evidence || []).find((item) => item.id === 'node24_ci_deepest');
  check('local Node24 artifact without GitHub Actions provenance must not pass', localNode24?.state !== 'pass' && localNode24?.artifactOk === false, JSON.stringify(localNode24));
  check('local Node24 artifact must show ci provenance issue', (localNode24?.artifactContractIssues || []).includes('ci_provenance_contract_not_met'), JSON.stringify(localNode24?.artifactContractIssues || []));

  writeCommonArtifacts({ required: true, githubActions: true, githubWorkflow: 'P0 Hosted Final Proof', githubRunId: '123456789', githubJob: 'p0-hosted-final-proof', githubRef: 'refs/heads/main', githubSha: 'abc123', runnerOS: 'Linux', ci: 'true' });
  state = runReport();
  const ciNode24 = (state.evidence || []).find((item) => item.id === 'node24_ci_deepest');
  check('GitHub Actions Node24 artifact with provenance must pass contract', ciNode24?.state === 'pass' && ciNode24?.artifactOk === true, JSON.stringify(ciNode24));
} finally {
  for (const [file, content] of Object.entries(backups)) {
    if (content) fs.writeFileSync(file, content, 'utf8');
    else if (fs.existsSync(file)) fs.rmSync(file, { force: true });
  }
}

if (issues.length) {
  console.error(JSON.stringify({ ok: false, batch: 'Batch142', issues }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, batch: 'Batch142', message: 'Node24 CI provenance hardening source and regression checks passed.' }, null, 2));
