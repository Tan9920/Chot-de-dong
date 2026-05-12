import fs from 'node:fs';

function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''; }
function readJson(file, fallback = {}) { try { return JSON.parse(read(file) || JSON.stringify(fallback)); } catch { return fallback; } }
const issues = [];
function check(label, condition, detail = '') { if (!condition) issues.push(detail ? `${label}: ${detail}` : label); }

const pkg = readJson('package.json');
const lock = readJson('package-lock.json');
const policy = readJson('data/p0-p1-local-evidence-policy.json');
const stabilityPolicy = readJson('data/p0-p1-stability-gate-policy.json');
const lib = read('lib/p0-p1-local-evidence.ts');
const runtimeRoute = read('app/api/runtime/p0-p1-local-evidence/route.ts');
const adminRoute = read('app/api/admin/p0-p1-local-evidence-board/route.ts');
const commandEvidence = read('scripts/p0-p1-command-evidence.mjs');
const runner = read('scripts/p0-p1-local-evidence-runner.mjs');
const report = read('scripts/p0-p1-local-evidence-report.mjs');
const registry = read('scripts/run-source-validators.mjs');
const notes = `${read('BATCH139_NOTES.md')}\n${read('docs/BATCH139_P0_P1_LOCAL_EVIDENCE_LIFT.md')}\n${read('README.md')}`;

check('package version must be 0.139.0 or later-compatible', ['0.139.0','0.140.0','0.141.0','0.142.0'].includes(pkg.version), `got ${pkg.version}`);
check('package-lock version must be 0.139.0 or later-compatible', ['0.139.0','0.140.0','0.141.0','0.142.0'].includes(lock.version), `got ${lock.version}`);
check('package-lock root version must be 0.139.0 or later-compatible', ['0.139.0','0.140.0','0.141.0','0.142.0'].includes(lock.packages?.['']?.version), `got ${lock.packages?.['']?.version}`);
check('node engine must remain 24.x', pkg.engines?.node === '24.x', pkg.engines?.node);
for (const script of ['p0-p1:data-evidence','p0-p1:typecheck-evidence','p0-p1:swc-evidence','p0-p1:artifact-hygiene-evidence','p0-p1:route-contract-evidence','p0-p1:runtime-preflight-evidence','p0-p1:local-evidence-report','p0-p1:local-evidence-runner','batch139:p0-p1-local-evidence-validate','smoke:batch139','verify:batch139']) {
  check(`package.json missing script ${script}`, Boolean(pkg.scripts?.[script]));
}
check('policy marker/version', (policy.batch === 'Batch139 — P0/P1 Local Evidence Lift' && policy.version === '0.139.0') || (policy.batch === 'Batch140 — P0/P1 Evidence Report Integrity Fix' && policy.version === '0.140.0'));
check('policy must keep rollout/production blocked', policy.productionReady === false && policy.publicRolloutAllowed === false && policy.sourceLevelOnly === true);
check('policy local gates include stronger current-run evidence set', ['data_validate','typecheck_artifact','next_swc_artifact','route_contract_artifact','guarded_build','live_smoke_clean','auth_invite_runtime_smoke','loopback_hosted_style_smoke','security_data_protection_report'].every((id) => policy.localEvidenceGates?.some((gate) => gate.id === id && gate.required === true)) && ['artifact_hygiene_artifact','runtime_preflight_artifact'].every((id) => policy.localEvidenceGates?.some((gate) => gate.id === id && gate.recommended === true)));
check('policy hosted gates still required', ['node24_ci','app_url_strict_smoke','visual_smoke_real_browser'].every((id) => policy.hostedStillRequired?.some((gate) => gate.id === id)));
check('stability policy must be lifted to Batch139', stabilityPolicy.version === '0.139.0' && String(stabilityPolicy.batch || '').includes('Batch139'));
check('stability policy must remove manual typecheck/SWC gates', !JSON.stringify(stabilityPolicy.localP0RequiredEvidence || []).includes('manualEvidence'));
check('stability policy must include Batch139 typecheck/SWC/preflight artifacts', ['data_validate','typecheck_artifact','next_swc_artifact','route_contract_artifact'].every((id) => stabilityPolicy.localP0RequiredEvidence?.some((gate) => gate.id === id && gate.required === true)) && ['artifact_hygiene_artifact','runtime_preflight_artifact'].every((id) => stabilityPolicy.localP0RequiredEvidence?.some((gate) => gate.id === id && gate.recommended === true)));
for (const marker of ['buildP0P1LocalEvidenceBoard','localEvidenceReady','localEvidenceReadinessPercent','p1LocalExpansionAllowed','hostedPublicStillBlocked','productionReady: false','publicRolloutAllowed: false']) {
  check(`lib missing marker ${marker}`, lib.includes(marker));
}
for (const marker of ['/api/runtime/p0-p1-local-evidence','buildP0P1LocalEvidenceBoard','does not unlock hosted/public rollout']) {
  check(`runtime route missing marker ${marker}`, runtimeRoute.includes(marker));
}
for (const marker of ['requirePermission','security:read','buildP0P1LocalEvidenceBoard','không tự mở production-ready']) {
  check(`admin route missing marker ${marker}`, adminRoute.includes(marker));
}
for (const marker of ['artifactFreshness','current_run','p0-p1-command-evidence','noAiPaymentVerifiedFakeAdded']) {
  check(`command evidence script missing marker ${marker}`, commandEvidence.includes(marker));
}
for (const marker of ['p0-p1-local-evidence-runner-last-run.json','GIAOAN_SMOKE_MODE=production npm run live:smoke:clean','npm run runtime:p0-loopback-url-smoke','npm run security:data-protection-report','localEvidenceCurrentRun']) {
  check(`local evidence runner missing marker ${marker}`, runner.includes(marker));
}
for (const marker of ['p0-p1-local-evidence-report-last-run.json','localEvidenceReadinessPercent','hostedPublicStillBlocked','Node24, APP_URL hosted smoke and real visual smoke','localRunnerIntegrity']) {
  check(`local evidence report missing marker ${marker}`, report.includes(marker));
}
for (const marker of ['validate-batch139-p0-p1-local-evidence-source.mjs','p0-p1-local-evidence-policy.json','BATCH139_P0_P1_LOCAL_EVIDENCE_LIFT']) {
  check(`source validator registry missing marker ${marker}`, registry.includes(marker));
}
const notesLower = notes.toLowerCase();
for (const marker of ['batch139','p0/p1 local evidence lift','không thêm ai','không thêm thanh toán','không tạo verified giả','node22','node24','app_url','visual smoke','production-ready']) {
  check(`docs/readme missing marker ${marker}`, notesLower.includes(marker.toLowerCase()));
}
const pkgText = JSON.stringify(pkg).toLowerCase();
for (const forbidden of ['openai','@google/generative-ai','@anthropic-ai/sdk','anthropic','langchain','stripe','paypal']) {
  check(`forbidden dependency ${forbidden}`, !pkgText.includes(`"${forbidden}`));
}
const combined = `${JSON.stringify(policy)}\n${lib}\n${runtimeRoute}\n${adminRoute}\n${runner}\n${report}`.toLowerCase();
check('Batch139 must not unlock production readiness', !combined.includes('productionready: true'));
check('Batch139 must not auto-public community', !combined.includes('autopublic: true') && !combined.includes('auto-public: true'));

const result = {
  ok: issues.length === 0,
  batch: 'Batch139 P0/P1 Local Evidence Lift',
  sourceLevelOnly: true,
  localEvidenceLiftAdded: true,
  noAiPaymentOrFakeVerifiedAdded: true,
  issues,
  note: 'Validates the Batch139 local evidence source contract only. It does not prove Node24 hosted/public/production readiness.'
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
