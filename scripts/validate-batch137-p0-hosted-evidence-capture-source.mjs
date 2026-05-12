import fs from 'node:fs';

function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''; }
function readJson(file, fallback = {}) { try { return JSON.parse(read(file) || JSON.stringify(fallback)); } catch { return fallback; } }
const issues = [];
function check(label, condition, detail = '') { if (!condition) issues.push(detail ? `${label}: ${detail}` : label); }

const pkg = readJson('package.json');
const lock = readJson('package-lock.json');
const policy = readJson('data/p0-hosted-evidence-capture-policy.json');
const lib = read('lib/p0-hosted-evidence-capture.ts');
const runtimeRoute = read('app/api/runtime/p0-hosted-evidence-capture/route.ts');
const adminRoute = read('app/api/admin/p0-hosted-evidence-capture-board/route.ts');
const report = read('scripts/p0-hosted-evidence-capture-report.mjs');
const workflow = read('.github/workflows/p0-hosted-final-proof.yml');
const registry = read('scripts/run-source-validators.mjs');
const notes = `${read('BATCH137_NOTES.md')}\n${read('docs/BATCH137_P0_HOSTED_EVIDENCE_CAPTURE.md')}\n${read('README.md')}`;

check('package version must be at least 0.137.0', /^0\.(137|138|139|14[0-9])\.0$/.test(pkg.version), `got ${pkg.version}`);
check('package-lock version must be at least 0.137.0', /^0\.(137|138|139|14[0-9])\.0$/.test(lock.version), `got ${lock.version}`);
check('package-lock root version must be at least 0.137.0', /^0\.(137|138|139|14[0-9])\.0$/.test(lock.packages?.['']?.version || ''), `got ${lock.packages?.['']?.version}`);
check('node engine must remain 24.x', pkg.engines?.node === '24.x', pkg.engines?.node);
for (const script of ['p0:hosted-evidence-capture-report','batch137:p0-hosted-evidence-capture-validate','smoke:batch137','verify:batch137']) {
  check(`package.json missing script ${script}`, Boolean(pkg.scripts?.[script]));
}
check('policy marker', policy.batch === 'Batch137 — P0 Hosted Evidence Capture Pack' && policy.version === '0.137.0');
check('policy source-level only and blocks public rollout', policy.sourceLevelOnly === true && policy.publicRolloutAllowed === false && policy.productionReady === false);
check('policy must require hosted evidence set', ['node24_ci','hosted_release_strict','hosted_save_export_smoke','visual_smoke_evidence','public_rollout_readiness','p0_p1_stability'].every((id) => policy.requiredEvidence?.some((item) => item.id === id)));
check('policy must include GitHub/Vercel capture contract', policy.githubActions?.workflowFile === '.github/workflows/p0-hosted-final-proof.yml' && policy.githubActions?.nodeVersion === '24');
check('policy must require visual breakpoints', Array.isArray(policy.visualEvidence?.requiredViewports) && policy.visualEvidence.requiredViewports.length >= 6);
for (const marker of ['buildP0HostedEvidenceCaptureBoard','hostedProofClosed','publicRolloutAllowed: false','productionReady: false','visualEvidenceOk','node24ProofOk','hostedReleaseOk','hostedSaveExportOk']) {
  check(`lib missing marker ${marker}`, lib.includes(marker));
}
for (const marker of ['/api/runtime/p0-hosted-evidence-capture','buildP0HostedEvidenceCaptureBoard','does not unlock public rollout']) {
  check(`runtime route missing marker ${marker}`, runtimeRoute.includes(marker));
}
for (const marker of ['requirePermission','security:read','buildP0HostedEvidenceCaptureBoard','không tự mở public rollout']) {
  check(`admin route missing marker ${marker}`, adminRoute.includes(marker));
}
for (const marker of ['p0-hosted-evidence-capture-report-last-run.json','p0-hosted-evidence-capture-checklist.md','hostedProofClosed','ok=true means the capture report was generated','visual:smoke:evidence-validate']) {
  check(`report script missing marker ${marker}`, report.includes(marker));
}
for (const marker of ['p0:hosted-evidence-capture-report','Batch137 evidence capture report']) {
  check(`workflow missing marker ${marker}`, workflow.includes(marker));
}
for (const marker of ['validate-batch137-p0-hosted-evidence-capture-source.mjs','p0-hosted-evidence-capture-policy.json','BATCH137_P0_HOSTED_EVIDENCE_CAPTURE']) {
  check(`source validator registry missing marker ${marker}`, registry.includes(marker));
}
const notesLower = notes.toLowerCase();
for (const marker of ['batch137', 'p0 hosted evidence capture', 'không thêm ai', 'không thêm thanh toán', 'không tạo verified giả', 'public rollout vẫn bị chặn', 'node24', 'app_url', 'visual']) {
  check(`docs/readme missing marker ${marker}`, notesLower.includes(marker.toLowerCase()));
}
const pkgText = JSON.stringify(pkg).toLowerCase();
for (const forbidden of ['openai', '@google/generative-ai', '@anthropic-ai/sdk', 'anthropic', 'langchain', 'stripe', 'paypal']) {
  check(`forbidden dependency ${forbidden}`, !pkgText.includes(`"${forbidden}`));
}
const combined = `${policy.batch}\n${lib}\n${runtimeRoute}\n${adminRoute}\n${report}`.toLowerCase();
check('Batch137 must not unlock production or public rollout', !combined.includes('productionready: true') && !combined.includes('publicrolloutallowed: true'));

const result = {
  ok: issues.length === 0,
  batch: 'Batch137 P0 Hosted Evidence Capture Pack',
  sourceLevelOnly: true,
  noAiPaymentOrFakeVerifiedAdded: true,
  publicRolloutStillBlocked: true,
  issues,
  note: 'Validates hosted proof evidence capture source contract only. It does not prove hosted/public/production readiness.'
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
