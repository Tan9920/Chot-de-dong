import fs from 'node:fs';

function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''; }
function readJson(file, fallback = {}) { try { return JSON.parse(read(file) || JSON.stringify(fallback)); } catch { return fallback; } }
function check(label, condition, detail = '') { if (!condition) issues.push(detail ? `${label}: ${detail}` : label); }
const issues = [];

const pkg = readJson('package.json');
const lock = readJson('package-lock.json');
const registry = readJson('data/subject-data-registry.json', { records: [] });
const policy = readJson('data/academic-verification-policy.json');
const queue = readJson('data/academic-verification-queue.json', { items: [] });
const lib = read('lib/academic-coverage-audit.ts');
const generator = read('lib/generator.ts');
const workspace = read('components/workspace.tsx');
const css = read('app/globals.css');
const demoBreakthrough = read('lib/demo-breakthrough.ts');
const runValidators = read('scripts/run-source-validators.mjs');

check('package.json version must preserve Batch103+ lineage', ['0.103.0', '0.104.0', '0.105.0', '0.106.0', '0.107.0', '0.108.0', '0.109.0', '0.110.0', '0.111.0', '0.112.0', '0.113.0', '0.114.0'].includes(pkg.version), pkg.version);
check('package-lock top-level version must preserve Batch103+ lineage', ['0.103.0', '0.104.0', '0.105.0', '0.106.0', '0.107.0', '0.108.0', '0.109.0', '0.110.0', '0.111.0', '0.112.0', '0.113.0', '0.114.0'].includes(lock.version), lock.version);
check('package-lock root package version must preserve Batch103+ lineage', ['0.103.0', '0.104.0', '0.105.0', '0.106.0', '0.107.0', '0.108.0', '0.109.0', '0.110.0', '0.111.0', '0.112.0', '0.113.0', '0.114.0'].includes(lock.packages?.['']?.version), lock.packages?.['']?.version);
for (const script of ['batch103:academic-coverage-validate', 'academic:coverage-validate', 'smoke:batch103', 'verify:batch103']) {
  check(`package.json missing script ${script}`, Boolean(pkg.scripts?.[script]));
}

for (const file of [
  'BATCH103_NOTES.md',
  'docs/BATCH103_ACADEMIC_COVERAGE_TRUTH.md',
  'data/academic-verification-policy.json',
  'data/academic-verification-queue.json',
  'lib/academic-coverage-audit.ts',
  'app/api/academic/coverage-audit/route.ts',
  'app/api/admin/academic-verification-board/route.ts',
  'scripts/validate-batch103-academic-coverage-source.mjs'
]) check(`missing ${file}`, fs.existsSync(file));

check('registry must still have records', Array.isArray(registry.records) && registry.records.length >= 100, String(registry.records?.length || 0));
check('registry version must mention batch103', String(registry.version || '').includes('batch103'), registry.version);
const fakeVerified = registry.records.filter((item) => ['verified', 'approved_for_release'].includes(item.sourceStatus) || item.contentDepthAllowed);
check('Batch103 must not create fake verified/contentDepthAllowed records', fakeVerified.length === 0, `${fakeVerified.length} found`);
check('queue must cover registry records', Array.isArray(queue.items) && queue.items.length === registry.records.length, `${queue.items?.length || 0}/${registry.records.length}`);
check('policy must require approved references', Number(policy.deepContentGate?.requiresApprovedReferenceCount || 0) >= 1);
check('policy must forbid fake upgrades', JSON.stringify(policy).includes('Không nâng seed/scaffold/starter lên reviewed/verified'));

for (const marker of [
  'buildAcademicCoverageAuditReport',
  'buildAcademicCoverageMatrix',
  'buildAcademicVerificationGate',
  'buildAcademicVerificationBoard',
  'safe_frame_only_academic_data',
  'blockedFromDeepContentPercent',
  'requiredEvidenceForVerifiedScope',
  'Không nâng seed/starter/scaffold thành verified'
]) check(`academic coverage lib missing marker ${marker}`, lib.includes(marker));

for (const marker of [
  'buildAcademicVerificationGate',
  'academicVerificationGate',
  'PHỤ LỤC XÁC MINH HỌC THUẬT BATCH103',
  'Evidence cần có nếu muốn nâng verified',
  'khóa kiến thức sâu'
]) check(`generator missing marker ${marker}`, generator.includes(marker));

for (const marker of [
  'academic-truth-card',
  '/api/academic/coverage-audit',
  'Batch103 · Sự thật dữ liệu học thuật 1–12',
  'Không nâng seed/scaffold thành verified',
  'academicCoverage: academicReport'
]) check(`workspace missing marker ${marker}`, workspace.includes(marker));

for (const marker of ['.academic-truth-card', '.academic-truth-grid', 'Batch103 Academic Coverage Truth']) {
  check(`CSS missing marker ${marker}`, css.includes(marker));
}

for (const marker of ['buildAcademicCoverageAuditReport', 'academicCoverage:']) {
  check(`demo breakthrough missing marker ${marker}`, demoBreakthrough.includes(marker));
}

check('run-source-validators must register Batch103 validator', runValidators.includes('validate-batch103-academic-coverage-source.mjs'));

const pkgText = JSON.stringify(pkg);
for (const forbidden of ['openai', '@google/generative-ai', '@anthropic-ai/sdk', 'anthropic', 'langchain']) {
  check(`forbidden AI dependency ${forbidden}`, !pkgText.includes(`"${forbidden}"`));
}

const docs = read('BATCH103_NOTES.md') + '\n' + read('docs/BATCH103_ACADEMIC_COVERAGE_TRUTH.md');
check('docs must not claim verified increase', docs.includes('không làm tăng dữ liệu học thuật verified thật') || docs.includes('không tự nâng verified'));
check('docs must say not production-ready/overclaim', docs.includes('Không claim production-ready') || docs.includes('không claim production-ready'));

const result = {
  ok: issues.length === 0,
  lineage: 'Batch103 validator accepts Batch104–Batch114 package versions because later batches preserve coverage truth and do not create fake verified data.',
  packageVersion: pkg.version,
  registryRecords: registry.records.length,
  queueItems: queue.items?.length || 0,
  fakeVerifiedRecords: fakeVerified.length,
  issues,
  note: 'Batch103 validates academic coverage truth/gate source-level. It does not verify any real academic content and does not prove runtime/build/hosted smoke.'
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
