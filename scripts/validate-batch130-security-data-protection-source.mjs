import fs from 'node:fs';

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}
function has(file, marker) {
  return read(file).includes(marker);
}

const issues = [];
const requiredFiles = [
  'data/security-data-protection-foundation-policy.json',
  'lib/security-data-protection.ts',
  'app/api/security/data-protection/route.ts',
  'app/api/admin/security-data-protection-board/route.ts',
  'scripts/security-data-protection-report.mjs',
  'scripts/validate-batch130-security-data-protection-source.mjs',
  'docs/BATCH130_SECURITY_DATA_PROTECTION_FOUNDATION.md',
  'BATCH130_NOTES.md'
];
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) issues.push(`${file} missing`);
}

const pkg = JSON.parse(read('package.json') || '{}');
for (const script of ['batch130:security-data-protection-validate', 'security:data-protection-validate', 'security:data-protection-report', 'smoke:batch130', 'verify:batch130']) {
  if (!pkg.scripts?.[script]) issues.push(`package.json missing script ${script}`);
}
if (pkg.version !== '0.130.0') issues.push(`package version expected 0.130.0 got ${pkg.version}`);

const policy = JSON.parse(read('data/security-data-protection-foundation-policy.json') || '{}');
const requiredControls = Array.isArray(policy.controls) ? policy.controls.filter((control) => control.required) : [];
if (policy.batch !== 'Batch130') issues.push('policy batch must be Batch130');
if (requiredControls.length < 6) issues.push('policy must define at least 6 required security/data controls');
for (const key of ['noAiCore', 'noPayment', 'noMarketplaceCash', 'noFakeVerifiedData', 'noAutoPublicCommunity']) {
  if (policy.scope?.[key] !== true) issues.push(`policy scope ${key} must be true`);
}
if (policy.publicRolloutAllowed !== false) issues.push('Batch130 must keep publicRolloutAllowed=false');
if (!Array.isArray(policy.personalDataMap) || policy.personalDataMap.length < 6) issues.push('personalDataMap must cover core data classes');
if (!String(JSON.stringify(policy.founderAbsenceSafeMode || {})).includes('auto_deploy_production')) issues.push('founderAbsenceSafeMode must block auto_deploy_production');

if (!has('lib/auth.ts', "sessionId.startsWith('session-demo-')")) issues.push('lib/auth.ts must restrict anonymous demo fallback to session-demo-* only');
if (has('lib/auth.ts', "sessionId.startsWith('session-')) return null")) issues.push('lib/auth.ts still allows arbitrary session-* demo fallback');
if (!has('lib/auth.ts', 'arbitrarySessionCookieFallbackBlocked_sessionDemoOnly')) issues.push('lib/auth.ts missing explicit arbitrary session fallback guard label');
if (!has('app/api/auth/csrf/route.ts', 'session-demo-')) issues.push('csrf bootstrap fallback must use session-demo-* cookie id when storage write fails');

for (const [file, marker] of [
  ['lib/runtime-security.ts', 'requireRealAccountSession'],
  ['lib/runtime-security.ts', 'assertWriteProtection'],
  ['app/api/lessons/route.ts', "requireRealAccountSession('lưu bản nháp lên demo'"],
  ['app/api/export/docx/route.ts', "requireRealAccountSession('xuất DOCX'"],
  ['app/api/export/pdf/route.ts', "requireRealAccountSession('xuất PDF'"],
  ['lib/membership.ts', 'public accounts default to teacher'],
  ['app/api/auth/login/route.ts', 'Không thể tự chọn admin/tổ trưởng'],
  ['lib/security-audit-log.ts', 'recordSecurityAuditEvent'],
  ['app/api/admin/security-data-protection-board/route.ts', "requirePermission('security:read'"],
  ['app/api/security/data-protection/route.ts', 'Không chứa dữ liệu cá nhân'],
  ['docs/BATCH130_SECURITY_DATA_PROTECTION_FOUNDATION.md', 'Không thêm AI'],
  ['BATCH130_NOTES.md', 'public rollout vẫn bị chặn']
]) {
  if (!has(file, marker)) issues.push(`${file} missing marker: ${marker}`);
}

const packageText = read('package.json').toLowerCase();
for (const forbidden of ['openai', '@google/generative-ai', 'anthropic', 'stripe', 'paypal']) {
  if (packageText.includes(forbidden)) issues.push(`forbidden dependency marker found in package.json: ${forbidden}`);
}

const result = {
  ok: issues.length === 0,
  batch: 'Batch130',
  phase: 'P1 Security & Data Protection Foundation',
  checkedFiles: requiredFiles.length,
  requiredControls: requiredControls.length,
  arbitrarySessionCookieFallbackBlocked: has('lib/auth.ts', "sessionId.startsWith('session-demo-')"),
  realAccountGateStillRequired: has('lib/runtime-security.ts', 'requireRealAccountSession'),
  publicRolloutAllowed: false,
  issues
};
fs.mkdirSync('artifacts', { recursive: true });
fs.writeFileSync('artifacts/batch130-security-data-protection-source-last-run.json', `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
