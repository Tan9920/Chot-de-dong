import fs from 'node:fs';

function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''; }
function has(file, marker) { return read(file).includes(marker); }
function assert(condition, label, issues) { if (!condition) issues.push(label); }

const issues = [];
const pkg = JSON.parse(read('package.json') || '{}');
const lock = JSON.parse(read('package-lock.json') || '{}');
const membership = read('lib/membership.ts');
const invites = read('lib/membership-invites.ts');
const login = read('app/api/auth/login/route.ts');
const inviteRoute = read('app/api/admin/membership-invites/route.ts');
const access = read('lib/access.ts');
const registry = read('scripts/check-registry-network.mjs');

assert(['0.96.0','0.97.0','0.98.0','0.100.0','0.101.0','0.102.0','0.103.0'].includes(pkg.version), 'package.json version must be 0.96.0 or compatible later Batch97/98', issues);
assert(['0.96.0','0.97.0','0.98.0','0.100.0','0.101.0','0.102.0','0.103.0'].includes(lock.packages?.['']?.version), 'package-lock root package version must be Batch96+ compatible', issues);
for (const script of ['auth-membership-hardening:validate', 'smoke:batch96', 'verify:batch96']) {
  assert(Boolean(pkg.scripts?.[script]), `package.json missing ${script}`, issues);
}
assert(fs.existsSync('data/memberships.json'), 'data/memberships.json missing', issues);
assert(fs.existsSync('data/membership-invites.json'), 'data/membership-invites.json missing', issues);
assert(has('lib/membership.ts', 'auto_teacher_login'), 'membership login fallback must default to teacher only', issues);
assert(has('lib/membership.ts', 'privilegedBlocked'), 'membership resolver must expose privilegedBlocked when client requested higher role', issues);
assert(has('lib/access.ts', 'content/admin actions do not always have a lesson object'), 'access/permission bug rationale missing', issues);
assert(!membership.includes("input.requestedRole") || membership.includes("role: 'teacher'"), 'membership resolver must not directly trust requestedRole', issues);
assert(has('lib/membership-invites.ts', 'membership-invites.json'), 'membership invite store must persist to JSON demo store', issues);
assert(has('lib/membership-invites.ts', 'Mã mời không tồn tại hoặc chưa được admin tạo'), 'invite redeem must reject arbitrary codes', issues);
assert(has('lib/membership-invites.ts', "status: 'redeemed'"), 'invite redeem must mark code redeemed', issues);
assert(has('lib/membership-invites.ts', 'Chỉ admin mới được tạo lời mời admin'), 'admin invite creation guard missing', issues);
assert(!invites.includes('startsWith(\'trusted-admin-\')') && !invites.includes('startsWith("trusted-admin-")'), 'trusted-admin prefix must not auto-elevate', issues);
assert(!invites.includes('startsWith(\'trusted-leader-\')') && !invites.includes('startsWith("trusted-leader-")'), 'trusted-leader prefix must not auto-elevate', issues);
assert(has('app/api/auth/login/route.ts', 'redeemMembershipInvite'), 'login must use real invite redemption', issues);
assert(has('app/api/auth/login/route.ts', "requestedRole: 'teacher'"), 'login must resolve default role as teacher when no valid invite', issues);
assert(has('app/api/auth/login/route.ts', 'Không thể tự chọn admin/tổ trưởng khi đăng nhập'), 'login must communicate blocked role elevation', issues);
assert(!login.includes('startsWith(\'trusted-\')') && !login.includes('startsWith("trusted-")'), 'login must not trust trusted-* magic strings', issues);
assert(has('app/api/admin/membership-invites/route.ts', 'result.invite.id'), 'membership invite route must match createMembershipInvite result shape', issues);
assert(has('app/api/admin/membership-invites/route.ts', 'requireManager(request)'), 'membership invite route must read session from request', issues);
assert(has('lib/access.ts', 'assertGlobalRolePermission'), 'access must support global permission namespace', issues);
assert(has('lib/access.ts', "action.startsWith('content:')"), 'access must allow intended content permissions without lesson object', issues);
assert(has('scripts/check-registry-network.mjs', 'runNodeProbe'), 'registry diagnose must isolate DNS/fetch probes', issues);
assert(has('scripts/check-registry-network.mjs', 'process-isolated and fails fast'), 'registry diagnose must document fail-fast behavior', issues);
assert(fs.existsSync('BATCH96_NOTES.md'), 'BATCH96_NOTES.md missing', issues);
assert(fs.existsSync('docs/BATCH96_DEEP_AUTH_MEMBERSHIP_HARDENING.md'), 'Batch96 docs missing', issues);

for (const file of ['data/memberships.json','data/membership-invites.json']) {
  try { JSON.parse(read(file)); } catch (error) { issues.push(`${file} invalid JSON: ${error.message}`); }
}

const result = {
  ok: issues.length === 0,
  checked: 31,
  issues,
  note: 'Batch96 validates deep auth/membership hardening at source level: no trusted-* role escalation, persistent demo invite store, fixed invite route result shape, role namespace permissions, and fail-fast registry diagnostics. It does not prove npm install/build/browser runtime.'
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
