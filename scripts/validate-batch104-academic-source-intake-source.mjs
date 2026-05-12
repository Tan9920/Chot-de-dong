import fs from 'node:fs';

function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''; }
function readJson(file, fallback = {}) { try { return JSON.parse(read(file) || JSON.stringify(fallback)); } catch { return fallback; } }
function check(label, condition, detail = '') { if (!condition) issues.push(detail ? `${label}: ${detail}` : label); }
const issues = [];

const pkg = readJson('package.json');
const lock = readJson('package-lock.json');
const registry = readJson('data/subject-data-registry.json', { records: [] });
const policy = readJson('data/academic-source-intake-policy.json');
const submissions = readJson('data/academic-source-pack-submissions.json', { items: [] });
const lib = read('lib/academic-source-intake.ts');
const generator = read('lib/generator.ts');
const workspace = read('components/workspace.tsx');
const css = read('app/globals.css');
const demoBreakthrough = read('lib/demo-breakthrough.ts');
const runValidators = read('scripts/run-source-validators.mjs');

check('package.json version must preserve Batch104–Batch114 lineage', ['0.104.0', '0.105.0', '0.106.0', '0.107.0', '0.108.0', '0.109.0', '0.110.0', '0.111.0', '0.112.0', '0.113.0', '0.114.0'].includes(pkg.version), pkg.version);
check('package-lock top-level version must preserve Batch104–Batch114 lineage', ['0.104.0', '0.105.0', '0.106.0', '0.107.0', '0.108.0', '0.109.0', '0.110.0', '0.111.0', '0.112.0', '0.113.0', '0.114.0'].includes(lock.version), lock.version);
check('package-lock root package version must preserve Batch104–Batch114 lineage', ['0.104.0', '0.105.0', '0.106.0', '0.107.0', '0.108.0', '0.109.0', '0.110.0', '0.111.0', '0.112.0', '0.113.0', '0.114.0'].includes(lock.packages?.['']?.version), lock.packages?.['']?.version);
for (const script of ['batch104:academic-source-intake-validate', 'academic:source-intake-validate', 'smoke:batch104', 'verify:batch104']) {
  check(`package.json missing script ${script}`, Boolean(pkg.scripts?.[script]));
}

for (const file of [
  'BATCH104_NOTES.md',
  'docs/BATCH104_ACADEMIC_SOURCE_PACK_INTAKE.md',
  'data/academic-source-intake-policy.json',
  'data/academic-source-pack-submissions.json',
  'lib/academic-source-intake.ts',
  'app/api/academic/source-intake/route.ts',
  'app/api/admin/academic-source-intake-board/route.ts',
  'scripts/validate-batch104-academic-source-intake-source.mjs'
]) check(`missing ${file}`, fs.existsSync(file));

check('registry must still have records', Array.isArray(registry.records) && registry.records.length >= 100, String(registry.records?.length || 0));
check('Batch104 must not mutate registry version away from batch103 truth', String(registry.version || '').includes('batch103'), registry.version);
const fakeVerified = registry.records.filter((item) => ['verified', 'approved_for_release'].includes(item.sourceStatus) || item.contentDepthAllowed);
check('Batch104 must not create fake verified/contentDepthAllowed records', fakeVerified.length === 0, `${fakeVerified.length} found`);

check('policy version must mention batch104', String(policy.version || '').includes('batch104'), policy.version);
check('policy must block registry mutation in Batch104', policy.releaseGate?.batch104DoesNotMutateRegistry === true);
check('policy must require takedown path', JSON.stringify(policy).includes('takedown'));
check('policy must require reviewer signoff', JSON.stringify(policy).includes('reviewerSignoffAt'));
check('policy must forbid fake verified claim', JSON.stringify(policy).includes('Không nói Batch104 đã verified'));
check('submissions must be draft templates, not approved sources', Array.isArray(submissions.items) && submissions.items.length >= 3, `${submissions.items?.length || 0}`);
const promotedSubmissions = (submissions.items || []).filter((item) => item.stage === 'reviewed_candidate' || item.releaseGateStatus === 'released' || (item.approvedReferences || []).length > 0);
check('source pack submissions must not pretend to be reviewed/released', promotedSubmissions.length === 0, `${promotedSubmissions.length} found`);

for (const marker of [
  'buildAcademicSourceIntakeBoard',
  'evaluateAcademicSourcePack',
  'buildAcademicSourcePackTemplate',
  'source_pack_intake_foundation_registry_unchanged',
  'registryChangeBlockedReason',
  'canMutateRegistry: false',
  'canAllowDeepContent: false',
  'Batch104 không cập nhật subject-data-registry'
]) check(`academic source intake lib missing marker ${marker}`, lib.includes(marker));

for (const marker of [
  'evaluateAcademicSourcePack',
  'academicSourceIntakeGate',
  'PHỤ LỤC SOURCE PACK INTAKE BATCH104',
  'chưa đủ metadata nguồn/reviewer/license',
  'Được phép đổi registry ngay'
]) check(`generator missing marker ${marker}`, generator.includes(marker));

for (const marker of [
  'academic-source-intake-card',
  '/api/academic/source-intake',
  'Batch104 · Nhập-duyệt nguồn trước khi nâng coverage',
  'sourceIntakeRegistryMutations',
  'source_pack_intake_foundation_registry_unchanged'
]) check(`workspace missing marker ${marker}`, workspace.includes(marker));

for (const marker of ['.academic-source-intake-card', '.academic-source-intake-grid', 'Batch104 Academic Source Pack Intake']) {
  check(`CSS missing marker ${marker}`, css.includes(marker));
}

for (const marker of ['buildAcademicSourceIntakeBoard', 'academicSourceIntake:', 'academic_source_intake_source_ready_runtime_blocked']) {
  check(`demo breakthrough missing marker ${marker}`, demoBreakthrough.includes(marker));
}

check('run-source-validators must register Batch104 validator', runValidators.includes('validate-batch104-academic-source-intake-source.mjs'));

const pkgText = JSON.stringify(pkg).toLowerCase();
for (const forbidden of ['openai', '@google/generative-ai', '@anthropic-ai/sdk', 'anthropic', 'langchain']) {
  check(`forbidden AI dependency ${forbidden}`, !pkgText.includes(`"${forbidden}`));
}

const docs = read('BATCH104_NOTES.md') + '\n' + read('docs/BATCH104_ACADEMIC_SOURCE_PACK_INTAKE.md');
check('docs must say Batch104 does not verified fake data', docs.includes('không nâng dữ liệu verified giả') || docs.includes('không làm đẹp số liệu verified'));
check('docs must say not production-ready/overclaim', docs.includes('Không claim production-ready') || docs.includes('không claim production-ready'));

const result = {
  ok: issues.length === 0,
  packageVersion: pkg.version,
  registryRecords: registry.records.length,
  fakeVerifiedRecords: fakeVerified.length,
  sourcePackDrafts: submissions.items?.length || 0,
  promotedSubmissions: promotedSubmissions.length,
  issues,
  note: 'Batch104 validates academic source pack intake/review gate source-level. It does not verify real academic content, does not mutate registry, and does not prove runtime/build/hosted smoke.'
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
