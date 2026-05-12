import fs from 'fs';

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok: Boolean(ok), detail });
}

const pkg = JSON.parse(read('package.json'));
const runtimeSecurity = read('lib/runtime-security.ts');
const lessonsRoute = read('app/api/lessons/route.ts');
const docxRoute = read('app/api/export/docx/route.ts');
const pdfRoute = read('app/api/export/pdf/route.ts');
const workspace = read('components/workspace.tsx');
const batchNotes = fs.existsSync('BATCH95_NOTES.md') ? read('BATCH95_NOTES.md') : '';
const doc = fs.existsSync('docs/BATCH95_AUTH_RUNTIME_GATE.md') ? read('docs/BATCH95_AUTH_RUNTIME_GATE.md') : '';

check('package version is 0.95.0 or compatible later Batch96', ['0.95.0','0.96.0','0.97.0','0.98.0','0.100.0','0.101.0','0.102.0','0.103.0'].includes(pkg.version), pkg.version);
check('package has auth-runtime-gate validator', pkg.scripts?.['auth-runtime-gate:validate'] === 'node scripts/validate-batch95-auth-runtime-gate-source.mjs');
check('package has smoke:batch95', /auth-runtime-gate:validate/.test(pkg.scripts?.['smoke:batch95'] || ''));
check('package has verify:batch95', /live:smoke:clean/.test(pkg.scripts?.['verify:batch95'] || '') && /hosted:url-smoke:optional/.test(pkg.scripts?.['verify:batch95'] || ''));

check('runtime-security exports requireRealAccountSession', /export async function requireRealAccountSession/.test(runtimeSecurity));
check('requireRealAccountSession checks authAccountId', /!user\.authAccountId/.test(runtimeSecurity));
check('requireRealAccountSession returns requiresRealAccount marker', /requiresRealAccount:\s*true/.test(runtimeSecurity));
check('requireRealAccountSession explains demo/session limitation', /Phiên xem thử chỉ dùng để tạo khung bài/.test(runtimeSecurity));

check('lessons POST imports requireRealAccountSession', /requireRealAccountSession/.test(lessonsRoute));
check('lessons POST blocks before save/quota', /const accountGate = await requireRealAccountSession\('lưu bản nháp lên demo', request\)/.test(lessonsRoute));
check('lessons POST still keeps CSRF write protection', /assertWriteProtection\(request\)/.test(lessonsRoute));
check('lessons POST still records saved lesson usage', /recordOperatingUsage/.test(lessonsRoute));

check('DOCX export imports requireRealAccountSession', /requireRealAccountSession/.test(docxRoute));
check('DOCX export blocks demo session before export', /requireRealAccountSession\('xuất DOCX', request\)/.test(docxRoute));
check('DOCX export still keeps CSRF write protection', /assertWriteProtection\(request\)/.test(docxRoute));

check('PDF export imports requireRealAccountSession', /requireRealAccountSession/.test(pdfRoute));
check('PDF export blocks demo session before export', /requireRealAccountSession\('xuất PDF', request\)/.test(pdfRoute));
check('PDF export still keeps CSRF write protection', /assertWriteProtection\(request\)/.test(pdfRoute));

check('workspace still has visible account gate', /id="account-gate"/.test(workspace) && /Tài khoản giáo viên/.test(workspace));
check('workspace still has client-side real-account gate', /function requireRealAccountForAction/.test(workspace) && /authAccountId/.test(workspace));
check('workspace still allows template preview', /function generateLesson/.test(workspace) && /\/api\/template-builder/.test(workspace));

check('Batch95 notes exist', /BATCH95/.test(batchNotes) && /server-side/.test(batchNotes));
check('Batch95 doc exists', /Auth Runtime Gate/.test(doc) && /không thay thế/.test(doc));

const failed = checks.filter((item) => !item.ok);
console.log(JSON.stringify({ ok: failed.length === 0, checked: checks.length, failed }, null, 2));
if (failed.length) process.exit(1);
