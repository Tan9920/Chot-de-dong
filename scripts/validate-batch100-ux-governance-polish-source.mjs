import fs from 'node:fs';

function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''; }
function readJson(file) { return JSON.parse(read(file) || '{}'); }
function has(file, marker) { return read(file).includes(marker); }
const issues = [];
function check(label, condition, detail = '') { if (!condition) issues.push(detail ? `${label}: ${detail}` : label); }

const pkg = readJson('package.json');
const lock = readJson('package-lock.json');
const workspace = read('components/workspace.tsx');
const css = read('app/globals.css');
const sessions = readJson('data/auth-sessions.json');
const audit = readJson('data/security-audit-events.json');
const pkgText = JSON.stringify(pkg);

check('package.json version must be 0.100.0 or Batch101 compatible', ['0.100.0','0.101.0','0.102.0','0.103.0'].includes(pkg.version), pkg.version);
check('package-lock top-level version must be 0.100.0 or Batch101 compatible', ['0.100.0','0.101.0','0.102.0','0.103.0'].includes(lock.version), lock.version);
check('package-lock root package version must be 0.100.0 or Batch101 compatible', ['0.100.0','0.101.0','0.102.0','0.103.0'].includes(lock.packages?.['']?.version), lock.packages?.['']?.version);
for (const script of ['batch100:ux-governance-polish-validate','smoke:batch100','verify:batch100']) {
  check(`package.json missing ${script}`, Boolean(pkg.scripts?.[script]));
}
for (const file of ['BATCH100_NOTES.md','docs/BATCH100_UX_GOVERNANCE_POLISH.md','scripts/validate-batch100-ux-governance-polish-source.mjs','BATCH98_NOTES.md','docs/BATCH98_DEPENDENCY_RUNTIME_CLOSURE.md']) {
  check(`missing ${file}`, fs.existsSync(file));
}
for (const marker of [
  'Tài khoản giáo viên',
  'Đăng nhập để lưu và xuất an toàn',
  'Không cho tự chọn admin/tổ trưởng khi đăng ký',
  'Mã mời tổ/trường nếu có',
  'Phiên này chỉ để xem thử',
  'Cần đăng nhập hoặc đăng ký tài khoản giáo viên trước khi',
  'lưu bản nháp lên demo',
  'requireRealAccountForAction',
  'isRealAccount(currentUser)',
  '/api/auth/register',
  '/api/auth/login',
  '/api/auth/me',
  '/api/auth/logout'
]) check(`workspace missing auth recovery marker ${marker}`, workspace.includes(marker));
for (const marker of [
  'mobile-menu-layer',
  'mobile-menu-backdrop',
  'Đóng menu bằng cách bấm ra ngoài',
  'closeMobileMenu',
  "event.key === 'Escape'",
  'aria-controls="mobile-more-menu"',
  'role="dialog"',
  'aria-modal="true"',
  'aria-label="Đóng menu"',
  "body.classList.add('mobile-menu-open')"
]) check(`workspace missing closable mobile menu marker ${marker}`, workspace.includes(marker));
for (const marker of [
  'teacher-safe-flow-banner',
  'Luồng an toàn cho giáo viên',
  'guided-progress-card',
  'Đi bước tiếp theo',
  'mode-switcher',
  'Chế độ Dễ dùng/Tiêu chuẩn/Nâng cao ngay trên header',
  'form-help-strip',
  'disableExportUntilContent',
  'Cần tạo hoặc nhập nội dung giáo án trước khi xuất file'
]) check(`workspace missing UX/governance marker ${marker}`, workspace.includes(marker));
for (const marker of [
  '.mobile-menu-layer',
  '.mobile-menu-backdrop',
  'body.mobile-menu-open',
  '.teacher-safe-flow-banner',
  '.guided-progress-card',
  '.mode-switcher',
  '.form-help-strip',
  '.mobile-mode-pill'
]) check(`CSS missing marker ${marker}`, css.includes(marker));
check('auth-sessions.json must be empty distributable artifact', Array.isArray(sessions) && sessions.length === 0);
check('security-audit-events.json must be empty distributable artifact', Array.isArray(audit) && audit.length === 0);
check('security audit data must not include IP/user-agent leftovers', !/(\b\d{1,3}(?:\.\d{1,3}){3}\b|Mozilla\/5\.0|Chrome\/)/.test(read('data/security-audit-events.json')));
for (const ai of ['openai','@google/generative-ai','@anthropic-ai/sdk','anthropic','langchain']) {
  check(`forbidden AI dependency ${ai}`, !pkgText.includes(`"${ai}"`));
}
check('Next.js remains exact 15.3.8', pkg.dependencies?.next === '15.3.8', pkg.dependencies?.next);
check('React remains exact 19.0.4', pkg.dependencies?.react === '19.0.4', pkg.dependencies?.react);
check('Node engine remains 22.x', pkg.engines?.node === '22.x', pkg.engines?.node);
check('README documents Batch100', has('README.md', 'Batch100'));
check('Batch100 docs avoid production-ready claim', has('BATCH100_NOTES.md', 'không claim production-ready') || has('docs/BATCH100_UX_GOVERNANCE_POLISH.md', 'không claim production-ready'));

const result = {
  ok: issues.length === 0,
  checked: {
    packageVersion: pkg.version,
    authRecovered: workspace.includes('Đăng nhập để lưu và xuất an toàn') && workspace.includes('Mã mời tổ/trường nếu có'),
    menuClosable: workspace.includes('mobile-menu-backdrop') && workspace.includes("event.key === 'Escape'") && workspace.includes("body.classList.add('mobile-menu-open')"),
    guidedUx: workspace.includes('teacher-safe-flow-banner') && workspace.includes('guided-progress-card') && workspace.includes('mode-switcher'),
    safeExportAffordance: workspace.includes('disableExportUntilContent'),
    sensitiveDataCleaned: Array.isArray(sessions) && sessions.length === 0 && Array.isArray(audit) && audit.length === 0,
    noAiDependencies: !['openai','@google/generative-ai','@anthropic-ai/sdk','anthropic','langchain'].some((name) => pkgText.includes(`"${name}"`))
  },
  issues,
  note: 'Batch100 validates source-level UX/governance polish only. It does not prove npm install, typecheck, Next build, browser/mobile QA, live smoke, or hosted Vercel smoke.'
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
