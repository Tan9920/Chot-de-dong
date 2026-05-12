import fs from 'node:fs';
const read=(f)=>fs.existsSync(f)?fs.readFileSync(f,'utf8'):'';
const readJson=(f)=>JSON.parse(read(f)||'{}');
const issues=[];
function m(label,text,marker){ if(!text.includes(marker)) issues.push(`${label} missing marker: ${marker}`); }
function nm(label,text,marker){ if(text.includes(marker)) issues.push(`${label} contains forbidden marker: ${marker}`); }
function f(file){ if(!fs.existsSync(file)) issues.push(`missing file: ${file}`); }
const pkg=readJson('package.json');
const lock=readJson('package-lock.json');
const workspace=read('components/workspace.tsx');
const login=read('app/api/auth/login/route.ts');
const register=read('app/api/auth/register/route.ts');
const me=read('app/api/auth/me/route.ts');
const logout=read('app/api/auth/logout/route.ts');
const notes=read('BATCH94_NOTES.md');
const doc=read('docs/BATCH94_VISIBLE_ACCOUNT_GATE.md');
const runSource=read('scripts/run-source-validators.mjs');
['scripts/validate-batch94-auth-gate-source.mjs','BATCH94_NOTES.md','docs/BATCH94_VISIBLE_ACCOUNT_GATE.md','components/workspace.tsx','app/api/auth/register/route.ts','app/api/auth/login/route.ts','app/api/auth/me/route.ts','app/api/auth/logout/route.ts'].forEach(f);
if(!['0.94.0','0.95.0','0.96.0','0.97.0','0.98.0','0.100.0','0.101.0','0.102.0','0.103.0'].includes(pkg.version)) issues.push(`package.json version must be 0.94.0 or a compatible later Batch96 version for Batch94 source check, got ${pkg.version}`);
if(!['0.94.0','0.95.0','0.96.0','0.97.0','0.98.0','0.100.0','0.101.0','0.102.0','0.103.0'].includes(lock.version)||!['0.94.0','0.95.0','0.96.0','0.97.0','0.98.0','0.100.0','0.101.0','0.102.0','0.103.0'].includes(lock.packages?.['']?.version)) issues.push('package-lock.json root version must match 0.94.0 or compatible later Batch96 version');
if(!/Batch9[4-6]|auth|membership/i.test(String(pkg.description||''))) issues.push('package.json.description should preserve Batch94/auth-gate lineage or be compatible later batch');
['auth-gate:validate','smoke:batch94','verify:batch94'].forEach((s)=>{ if(!pkg.scripts?.[s]) issues.push(`package.json missing script ${s}`); });
[
  'Tài khoản giáo viên',
  'Đăng nhập để lưu và xuất an toàn',
  'Không cho tự chọn admin/tổ trưởng khi đăng ký',
  'requireRealAccountForAction',
  'isRealAccount(currentUser)',
  '/api/auth/register',
  '/api/auth/login',
  '/api/auth/me',
  '/api/auth/logout',
  'authAccountId',
  'Mã mời tổ/trường nếu có',
  'Phiên này chỉ để xem thử',
  'Cần đăng nhập hoặc đăng ký tài khoản giáo viên trước khi',
  'lưu bản nháp lên demo',
  'xuất ${kind.toUpperCase()}'
].forEach((x)=>m('components/workspace.tsx',workspace,x));
['requestedRole: \'teacher\'','redeemMembershipInvite','resolveMembershipForLogin','recordSecurityAuditEvent','assertRuntimeRateLimit','assertSameOrigin','attachCsrfCookie'].forEach((x)=>m('app/api/auth/register/route.ts',register,x));
['verifyPasswordAccount','resolveMembershipForLogin','privilegedBlocked','requestedRole','assertRuntimeRateLimit','assertSameOrigin','attachCsrfCookie'].forEach((x)=>m('app/api/auth/login/route.ts',login,x));
['getSessionUser','NextResponse.json({ user })'].forEach((x)=>m('app/api/auth/me/route.ts',me,x));
['assertWriteProtection','csrfCookieName','recordSecurityAuditEvent'].forEach((x)=>m('app/api/auth/logout/route.ts',logout,x));
['Batch94','đăng nhập','đăng ký','save/export','không cho tự chọn admin'].forEach((x)=>m('BATCH94_NOTES.md',notes,x));
['BATCH94 VISIBLE ACCOUNT GATE','/api/auth/register','/api/auth/login','real teacher account','source-level'].forEach((x)=>m('docs/BATCH94_VISIBLE_ACCOUNT_GATE.md',doc,x));
['validate-batch94-auth-gate-source.mjs','auth-gate:validate','verify:batch94'].forEach((x)=>m('scripts/run-source-validators.mjs',runSource,x));
['OpenAI','Gemini','Anthropic','@anthropic-ai/sdk','@google/generative-ai','langchain'].forEach((x)=>nm('package/scripts/workspace',JSON.stringify(pkg)+workspace,x));
const result={
  ok: issues.length===0,
  issues,
  checked:{
    packageVersion: pkg.version,
    visibleAccountGate: workspace.includes('Tài khoản giáo viên'),
    registerVisible: workspace.includes('Tạo tài khoản giáo viên'),
    loginVisible: workspace.includes('Đăng nhập'),
    saveExportRequireRealAccount: workspace.includes('requireRealAccountForAction') && workspace.includes('authAccountId'),
    selfRoleSelectionBlocked: workspace.includes('Không cho tự chọn admin/tổ trưởng khi đăng ký'),
    authRoutesPresent: Boolean(login&&register&&me&&logout)
  },
  note:'Batch94 validates visible account/auth UX at source level. It does not prove npm install, Next build, browser login/register runtime, server write persistence, production live smoke, or hosted URL smoke.'
};
console.log(JSON.stringify(result,null,2));
process.exit(result.ok?0:1);
