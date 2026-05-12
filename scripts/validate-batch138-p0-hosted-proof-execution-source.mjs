import fs from 'node:fs';

function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''; }
function readJson(file, fallback = {}) { try { return JSON.parse(read(file) || JSON.stringify(fallback)); } catch { return fallback; } }
const issues = [];
function check(label, condition, detail = '') { if (!condition) issues.push(detail ? `${label}: ${detail}` : label); }

const pkg = readJson('package.json');
const lock = readJson('package-lock.json');
const policy = readJson('data/p0-hosted-proof-execution-gate-policy.json');
const lib = read('lib/p0-hosted-proof-execution-gate.ts');
const runtimeRoute = read('app/api/runtime/p0-hosted-proof-execution-gate/route.ts');
const adminRoute = read('app/api/admin/p0-hosted-proof-execution-gate-board/route.ts');
const report = read('scripts/p0-hosted-proof-execution-gate-report.mjs');
const workflow = read('.github/workflows/p0-hosted-final-proof.yml');
const registry = read('scripts/run-source-validators.mjs');
const notes = `${read('BATCH138_NOTES.md')}\n${read('docs/BATCH138_P0_HOSTED_PROOF_EXECUTION_GATE.md')}\n${read('README.md')}`;

check('package version must be 0.138.0', pkg.version === '0.138.0', `got ${pkg.version}`);
check('package-lock version must be 0.138.0', lock.version === '0.138.0', `got ${lock.version}`);
check('package-lock root version must be 0.138.0', lock.packages?.['']?.version === '0.138.0', `got ${lock.packages?.['']?.version}`);
check('node engine must remain 24.x', pkg.engines?.node === '24.x', pkg.engines?.node);
for (const script of ['p0:hosted-proof-execution-report','batch138:p0-hosted-proof-execution-validate','smoke:batch138','verify:batch138']) {
  check(`package.json missing script ${script}`, Boolean(pkg.scripts?.[script]));
}
check('policy marker/version', policy.batch === 'Batch138 — P0 Hosted Proof Execution Gate' && policy.version === '0.138.0');
check('policy source-level and no production claim', policy.sourceLevelOnly === true && policy.productionReady === false);
check('policy public rollout starts blocked', policy.publicRolloutAllowed === false);
check('policy hard gates include required hosted proof set', ['node24_ci','app_url_strict_release','hosted_real_account_save_export','visual_smoke_real_browser','p0_p1_stability','capture_board','public_rollout_readiness'].every((id) => policy.hardGates?.some((item) => item.id === id && item.required === true && item.blocksHostedProof === true)));
check('policy CI contract must point to hosted workflow', policy.ciContract?.workflowFile === '.github/workflows/p0-hosted-final-proof.yml' && policy.ciContract?.nodeVersion === '24');
check('policy visual evidence must cover six viewports', Array.isArray(policy.visualEvidence?.requiredViewports) && policy.visualEvidence.requiredViewports.length >= 6 && policy.visualEvidence.templateIsPass === false);
for (const marker of ['buildP0HostedProofExecutionGateBoard','buildP0HostedEvidenceCaptureBoard','hostedProofClosed','safeToExpandBeyondP1','productionReady: false','node24ProofOk','hostedReleaseOk','hostedSaveExportOk','visualEvidenceOk','captureBoardOk','publicRolloutReadinessOk']) {
  check(`lib missing marker ${marker}`, lib.includes(marker));
}
for (const marker of ['/api/runtime/p0-hosted-proof-execution-gate','buildP0HostedProofExecutionGateBoard','does not mark production-ready']) {
  check(`runtime route missing marker ${marker}`, runtimeRoute.includes(marker));
}
for (const marker of ['requirePermission','security:read','buildP0HostedProofExecutionGateBoard','không tự mở production-ready']) {
  check(`admin route missing marker ${marker}`, adminRoute.includes(marker));
}
for (const marker of ['p0-hosted-proof-execution-gate-last-run.json','p0-hosted-proof-execution-gate-checklist.md','hostedProofClosed','ok=true means the execution gate report was generated','visualEvidenceOk']) {
  check(`report script missing marker ${marker}`, report.includes(marker));
}
for (const marker of ['p0:hosted-proof-execution-report','Batch138 hosted proof execution gate']) {
  check(`workflow missing marker ${marker}`, workflow.includes(marker));
}
for (const marker of ['validate-batch138-p0-hosted-proof-execution-source.mjs','p0-hosted-proof-execution-gate-policy.json','BATCH138_P0_HOSTED_PROOF_EXECUTION_GATE']) {
  check(`source validator registry missing marker ${marker}`, registry.includes(marker));
}
const notesLower = notes.toLowerCase();
for (const marker of ['batch138', 'p0 hosted proof execution gate', 'không thêm ai', 'không thêm thanh toán', 'không tạo verified giả', 'node24', 'app_url', 'visual smoke', 'production-ready']) {
  check(`docs/readme missing marker ${marker}`, notesLower.includes(marker.toLowerCase()));
}
const pkgText = JSON.stringify(pkg).toLowerCase();
for (const forbidden of ['openai', '@google/generative-ai', '@anthropic-ai/sdk', 'anthropic', 'langchain', 'stripe', 'paypal']) {
  check(`forbidden dependency ${forbidden}`, !pkgText.includes(`"${forbidden}`));
}
const combined = `${policy.batch}\n${lib}\n${runtimeRoute}\n${adminRoute}\n${report}`.toLowerCase();
check('Batch138 must not unlock production readiness', !combined.includes('productionready: true'));
check('Batch138 must not auto-public community', !combined.includes('autopublic: true') && !combined.includes('auto-public: true'));

const result = {
  ok: issues.length === 0,
  batch: 'Batch138 P0 Hosted Proof Execution Gate',
  sourceLevelOnly: true,
  noAiPaymentOrFakeVerifiedAdded: true,
  hostedProofGateAdded: true,
  issues,
  note: 'Validates the hosted proof execution gate source contract only. It does not prove hosted/public/production readiness.'
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
