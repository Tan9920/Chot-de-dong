import fs from 'node:fs';

function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''; }
function readJson(file, fallback = {}) { try { return JSON.parse(read(file) || JSON.stringify(fallback)); } catch { return fallback; } }
function has(file, marker) { return read(file).includes(marker); }
const issues = [];
function check(label, condition, detail = '') { if (!condition) issues.push(detail ? `${label}: ${detail}` : label); }

const pkg = readJson('package.json');
const lock = readJson('package-lock.json');
const config = readJson('data/operating-plan-config.json');
const usageLedger = readJson('data/usage-ledger.json', []);
const pointLedger = readJson('data/point-ledger.json', []);
const runtime = read('lib/operating-runtime.ts');
const productOperating = read('lib/product-operating.ts');
const usageRoute = read('app/api/operating/usage/route.ts');
const foundationRoute = read('app/api/operating/foundation/route.ts');
const docxRoute = read('app/api/export/docx/route.ts');
const pdfRoute = read('app/api/export/pdf/route.ts');
const lessonsRoute = read('app/api/lessons/route.ts');
const pkgText = JSON.stringify(pkg);

check('package.json version must be 0.101.0 or Batch102 compatible', ['0.101.0','0.102.0','0.103.0'].includes(pkg.version), pkg.version);
check('package-lock top-level version must be 0.101.0 or Batch102 compatible', ['0.101.0','0.102.0','0.103.0'].includes(lock.version), lock.version);
check('package-lock root package version must be 0.101.0 or Batch102 compatible', ['0.101.0','0.102.0','0.103.0'].includes(lock.packages?.['']?.version), lock.packages?.['']?.version);
for (const script of ['batch101:operating-runtime-validate', 'operating:runtime-validate', 'smoke:batch101', 'verify:batch101']) {
  check(`package.json missing ${script}`, Boolean(pkg.scripts?.[script]));
}
for (const file of [
  'BATCH101_NOTES.md',
  'docs/BATCH101_OPERATING_RUNTIME_FOUNDATION.md',
  'scripts/validate-batch101-operating-runtime-source.mjs',
  'data/operating-plan-config.json',
  'data/usage-ledger.json',
  'data/point-ledger.json',
  'lib/operating-runtime.ts',
  'lib/product-operating.ts'
]) check(`missing ${file}`, fs.existsSync(file));

check('operating config must be no-AI core', config.noAiCore === true);
check('payment must stay disabled', config.paymentEnabled === false);
check('cash marketplace must stay disabled', config.marketplaceCashEnabled === false);
check('cash fund must stay disabled', config.cashFundEnabled === false);
check('multi-level referral must stay disabled', config.multiLevelReferralEnabled === false);
check('usage ledger must start empty array', Array.isArray(usageLedger) && usageLedger.length === 0);
check('point ledger must start empty array', Array.isArray(pointLedger) && pointLedger.length === 0);

const planIds = new Set((Array.isArray(config.plans) ? config.plans : []).map((plan) => plan.id));
for (const id of ['free_community', 'teacher_pro_demo', 'team_workspace_demo', 'school_workspace_demo']) check(`operating config missing plan ${id}`, planIds.has(id));
for (const action of ['save_lesson', 'export_docx', 'export_pdf', 'template_lesson', 'worksheet_template', 'outline_slide_template']) {
  check(`operating config missing action ${action}`, Boolean(config.actions?.[action]));
  for (const plan of config.plans || []) check(`plan ${plan.id} missing limit for ${action}`, Number.isFinite(Number(plan.limits?.[action])));
}

for (const marker of [
  'usage-ledger.json',
  'point-ledger.json',
  'resolveOperatingPlan',
  'assertOperatingUsageAllowed',
  'recordOperatingUsage',
  'assertSavedLessonQuota',
  'buildOperatingEntitlementSnapshot',
  'applyOperatingExportPolicy',
  'monthKey',
  'JSON ledger chỉ là demo/runtime foundation',
  'paymentEnabled',
  'marketplaceCashEnabled',
  'cashFundEnabled',
  'multiLevelReferralEnabled'
]) check(`operating runtime missing marker ${marker}`, runtime.includes(marker));
check('operating runtime must not keep old 9999 open quota stub', !runtime.includes('limit: 9999') && !runtime.includes('Demo quota mở để test nội bộ'));
check('product operating board uses runtime config', productOperating.includes('getOperatingPlanConfig') && productOperating.includes('buildOperatingEntitlementSnapshot'));
check('usage route exposes entitlement snapshot', usageRoute.includes('buildOperatingEntitlementSnapshot'));
check('foundation route exposes operating board', foundationRoute.includes('buildOperatingFoundationBoard'));
check('DOCX export uses operating quota and ledger', docxRoute.includes('assertOperatingUsageAllowed') && docxRoute.includes('recordOperatingUsage'));
check('PDF export uses operating quota and ledger', pdfRoute.includes('assertOperatingUsageAllowed') && pdfRoute.includes('recordOperatingUsage'));
check('lesson save uses saved lesson quota and ledger', lessonsRoute.includes('assertSavedLessonQuota') && lessonsRoute.includes('recordOperatingUsage'));
for (const forbidden of ['openai', '@google/generative-ai', '@anthropic-ai/sdk', 'anthropic', 'langchain']) {
  check(`forbidden AI dependency ${forbidden}`, !pkgText.includes(`"${forbidden}"`));
}
check('docs note no production-ready claim', has('BATCH101_NOTES.md', 'không claim production-ready') && has('docs/BATCH101_OPERATING_RUNTIME_FOUNDATION.md', 'không phải billing production'));

const result = {
  ok: issues.length === 0,
  checked: {
    packageVersion: pkg.version,
    plans: [...planIds],
    actions: Object.keys(config.actions || {}),
    paymentEnabled: config.paymentEnabled,
    marketplaceCashEnabled: config.marketplaceCashEnabled,
    cashFundEnabled: config.cashFundEnabled,
    multiLevelReferralEnabled: config.multiLevelReferralEnabled,
    usageLedgerEmpty: Array.isArray(usageLedger) && usageLedger.length === 0,
    pointLedgerEmpty: Array.isArray(pointLedger) && pointLedger.length === 0
  },
  issues,
  note: 'Batch101 validates source-level no-AI operating plan/quota/ledger foundation. It does not prove npm install, Next build, live runtime, hosted smoke, billing correctness, or database-backed production ledger.'
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
