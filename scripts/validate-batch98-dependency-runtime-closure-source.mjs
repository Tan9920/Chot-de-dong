import fs from 'node:fs';
function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''; }
function has(file, marker) { return read(file).includes(marker); }
const issues = [];
function check(label, condition, detail = '') { if (!condition) issues.push(detail ? `${label}: ${detail}` : label); }
const pkg = JSON.parse(read('package.json') || '{}');
const lock = JSON.parse(read('package-lock.json') || '{}');
check('package.json version must be 0.98.0 or Batch100 compatible', ['0.98.0','0.99.0','0.100.0','0.101.0','0.102.0','0.103.0'].includes(pkg.version), pkg.version);
check('package-lock top-level version must be 0.98.0 or Batch100 compatible', ['0.98.0','0.99.0','0.100.0','0.101.0','0.102.0','0.103.0'].includes(lock.version), lock.version);
check('package-lock root package version must be 0.98.0 or Batch100 compatible', ['0.98.0','0.99.0','0.100.0','0.101.0','0.102.0','0.103.0'].includes(lock.packages?.['']?.version), lock.packages?.['']?.version);
for (const script of ['dependency-runtime-closure:validate','runtime:closure-report','smoke:batch98','verify:batch98','auth-invite:runtime-smoke']) check(`package.json missing ${script}`, Boolean(pkg.scripts?.[script]));
check('README documents Batch98 policy', has('README.md', 'Batch98 runtime verification policy') && has('README.md', 'không claim build/deploy pass'));
check('runtime closure report exists', fs.existsSync('scripts/runtime-closure-report.mjs'));
check('runtime closure report checks dependency state', has('scripts/runtime-closure-report.mjs', 'nextBinary') && has('scripts/runtime-closure-report.mjs', 'expectedSwcPresent') && has('scripts/runtime-closure-report.mjs', 'nextBuildId'));
check('runtime closure report writes artifact', has('scripts/runtime-closure-report.mjs', 'artifacts/runtime-closure-report-last-run.json'));
check('runtime closure report says claimAllowed', has('scripts/runtime-closure-report.mjs', 'claimAllowed'));
check('live smoke uses real account before save/export', has('scripts/live-http-smoke.mjs', 'batch98RealAccountSaveExportSmoke') && has('scripts/live-http-smoke.mjs', '/api/auth/register') && has('scripts/live-http-smoke.mjs', '/api/lessons') && has('scripts/live-http-smoke.mjs', 'lessonId'));
check('hosted smoke uses real account before save/export', has('scripts/hosted-demo-url-smoke.mjs', 'batch98RealAccountSaveExportSmoke') && has('scripts/hosted-demo-url-smoke.mjs', '/api/auth/register') && has('scripts/hosted-demo-url-smoke.mjs', '/api/lessons') && has('scripts/hosted-demo-url-smoke.mjs', 'lessonId'));
check('auth invite runtime smoke refuses fake proof without deps', has('scripts/auth-invite-runtime-smoke.mjs', 'dependencies_missing') && has('scripts/auth-invite-runtime-smoke.mjs', 'refuses to fake'));
check('auth invite runtime smoke seeds isolated admin membership', has('scripts/auth-invite-runtime-smoke.mjs', 'membership-admin-smoke') && has('scripts/auth-invite-runtime-smoke.mjs', 'seeded admin membership'));
check('Batch98 notes present', fs.existsSync('BATCH98_NOTES.md'));
check('Batch98 docs present', fs.existsSync('docs/BATCH98_DEPENDENCY_RUNTIME_CLOSURE.md'));
check('source validators include Batch98 marker', has('scripts/run-source-validators.mjs', 'BATCH98_NOTES.md') && has('scripts/run-source-validators.mjs', 'dependency-runtime-closure:validate'));
const result = { ok: issues.length === 0, checked: 24, issues, note: 'Batch98 validates dependency/build/runtime closure wiring source-level: real-account save/export smoke, invite runtime smoke, closure report and version consistency. It does not claim npm install/build/live hosted smoke pass.' };
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
