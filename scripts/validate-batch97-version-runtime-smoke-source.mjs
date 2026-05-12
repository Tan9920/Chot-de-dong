import fs from 'node:fs';
function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''; }
function has(file, marker) { return read(file).includes(marker); }
const issues = [];
function check(label, condition, detail = '') { if (!condition) issues.push(detail ? `${label}: ${detail}` : label); }
const pkg = JSON.parse(read('package.json') || '{}');
const lock = JSON.parse(read('package-lock.json') || '{}');
const compatible = ['0.97.0','0.98.0','0.100.0','0.101.0','0.102.0','0.103.0'];
check('package.json version must be Batch97 compatible', compatible.includes(pkg.version), pkg.version);
check('package-lock top-level version must be Batch97 compatible', compatible.includes(lock.version), lock.version);
check('package-lock root package version must be Batch97 compatible', compatible.includes(lock.packages?.['']?.version), lock.packages?.['']?.version);
for (const script of ['version-runtime-smoke:validate','auth-invite:runtime-smoke','smoke:batch97','verify:batch97']) check(`package.json missing ${script}`, Boolean(pkg.scripts?.[script]));
check('README documents Batch97/98 runtime verification policy', has('README.md', 'Batch98 runtime verification policy') || has('README.md', 'Batch97'), 'README missing Batch97/98 policy');
check('live smoke refuses missing dependencies', has('scripts/live-http-smoke.mjs', 'dependencies_missing'));
check('live smoke registers real teacher account', has('scripts/live-http-smoke.mjs', '/api/auth/register') && has('scripts/live-http-smoke.mjs', 'authAccountId'));
check('live smoke saves lesson before export', has('scripts/live-http-smoke.mjs', '/api/lessons') && has('scripts/live-http-smoke.mjs', 'lessonId'));
check('hosted smoke registers real teacher account', has('scripts/hosted-demo-url-smoke.mjs', '/api/auth/register') && has('scripts/hosted-demo-url-smoke.mjs', 'authAccountId'));
check('auth invite runtime smoke exists', fs.existsSync('scripts/auth-invite-runtime-smoke.mjs'));
check('auth invite runtime smoke uses isolated data dir', has('scripts/auth-invite-runtime-smoke.mjs', 'GIAOAN_DATA_DIR') && has('scripts/auth-invite-runtime-smoke.mjs', 'mkdtempSync'));
check('auth invite runtime smoke tests create/redeem/reuse/revoked/expired', ['admin creates leader invite','leader redeem invite','reuse redeemed invite','revoked invite','expired invite'].every((m) => has('scripts/auth-invite-runtime-smoke.mjs', m)));
check('auth invite runtime smoke blocks role self-elevation', has('scripts/auth-invite-runtime-smoke.mjs', 'privilegedBlocked') && has('scripts/auth-invite-runtime-smoke.mjs', 'effectiveRole'));
check('source compat shim includes useRef', has('types/source-compat.d.ts', 'useRef'));
const result = { ok: issues.length === 0, checked: 18, issues, note: 'Batch97 validates version consistency and real-account runtime smoke wiring at source level. It does not prove npm install/build/live runtime by itself.' };
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
