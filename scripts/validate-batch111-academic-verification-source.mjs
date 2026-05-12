import fs from 'node:fs';
function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''; }
function readJson(file, fallback = {}) { try { return JSON.parse(read(file) || JSON.stringify(fallback)); } catch { return fallback; } }
const issues = [];
function check(label, condition, detail = '') { if (!condition) issues.push(detail ? `${label}: ${detail}` : label); }
const pkg = readJson('package.json');
const lock = readJson('package-lock.json');
const registry = readJson('data/subject-data-registry.json', { records: [] });
const catalog = readJson('data/official-curriculum-source-catalog.json', { officialSources: [], gradeBandSourceSpine: [] });
const dossier = readJson('data/academic-verification-readiness-dossier.json', {});
const lib = read('lib/academic-verification-accelerator.ts');
const route = read('app/api/academic/verification-readiness/route.ts');
const adminRoute = read('app/api/admin/academic-verification-readiness-board/route.ts');
const reportScript = read('scripts/academic-verification-readiness-report.mjs');
const runValidators = read('scripts/run-source-validators.mjs');
const notes = read('BATCH111_NOTES.md') + '\n' + read('docs/BATCH111_VERIFIED_ACADEMIC_READINESS.md');
const pkgText = JSON.stringify(pkg).toLowerCase();
check('package.json version must preserve Batch111–Batch114 lineage', ['0.111.0', '0.112.0', '0.113.0', '0.114.0'].includes(pkg.version), pkg.version);
check('package-lock version must preserve Batch111–Batch114 lineage', ['0.111.0', '0.112.0', '0.113.0', '0.114.0'].includes(lock.version), lock.version);
check('package-lock root version must preserve Batch111–Batch114 lineage', ['0.111.0', '0.112.0', '0.113.0', '0.114.0'].includes(lock.packages?.['']?.version), lock.packages?.['']?.version);
for (const script of ['batch111:academic-verification-validate','academic:verification-readiness-validate','academic:verification-readiness-report','smoke:batch111','verify:batch111']) check(`package.json missing script ${script}`, Boolean(pkg.scripts?.[script]));
for (const file of ['data/official-curriculum-source-catalog.json','data/academic-verification-readiness-dossier.json','lib/academic-verification-accelerator.ts','app/api/academic/verification-readiness/route.ts','app/api/admin/academic-verification-readiness-board/route.ts','scripts/academic-verification-readiness-report.mjs','scripts/validate-batch111-academic-verification-source.mjs','docs/BATCH111_VERIFIED_ACADEMIC_READINESS.md','BATCH111_NOTES.md']) check(`missing ${file}`, fs.existsSync(file));
check('official source catalog must be Batch111', String(catalog.version || '').includes('batch111'), catalog.version);
check('readiness dossier must be Batch111', String(dossier.version || '').includes('batch111'), dossier.version);
const sourceIds = new Set((catalog.officialSources || []).map((item) => item.id));
for (const id of ['moet-tt32-2018-ctgdpt','gov-tt20-2021-ctgdpt-amendment','gov-tt13-2022-ctgdpt-amendment','gov-tt17-2025-ctgdpt-amendment']) check(`official source catalog missing ${id}`, sourceIds.has(id));
check('source catalog must forbid long copyrighted copying', JSON.stringify(catalog).includes('Không copy dài') && catalog.noContentImported === true);
check('source catalog must separate source spine from verified', JSON.stringify(catalog).includes('không đồng nghĩa') || JSON.stringify(catalog).includes('không tự nâng'));
check('grade band source spine must cover 1-12 bands', (catalog.gradeBandSourceSpine || []).length >= 3);
check('dossier must define pilot lanes', (dossier.pilotLanes || []).length >= 3);
check('dossier must define release candidates without allowing verified now', (dossier.releaseCandidates || []).length >= 3 && (dossier.releaseCandidates || []).every((item) => item.canBecomeVerifiedNow === false));
check('registry must still have 1-12 scopes', (registry.records || []).length >= 100, String((registry.records || []).length));
const fakeVerified = (registry.records || []).filter((item) => ['verified','approved_for_release'].includes(item.sourceStatus) || item.contentDepthAllowed);
check('Batch111 must not mutate registry to fake verified/contentDepthAllowed', fakeVerified.length === 0, `${fakeVerified.length} found`);
for (const marker of ['buildAcademicVerificationReadinessReport','buildOfficialCurriculumSourceCatalog','officialSourceSpineReadyPercent','registryMutationsInBatch111: 0','fakeVerifiedCreated: 0','prioritySourcePackTemplates','strictUpgradePath','Không gộp officialSourceSpineReadyPercent với verifiedOrApprovedPercent']) check(`lib missing marker ${marker}`, lib.includes(marker));
for (const marker of ['buildAcademicVerificationReadinessReport','không nâng registry thành verified','không bật contentDepthAllowed']) check(`route missing marker ${marker}`, route.includes(marker));
for (const marker of ['buildAcademicVerificationReadinessBoard','không dùng để fake coverage']) check(`admin route missing marker ${marker}`, adminRoute.includes(marker));
for (const marker of ['officialSourceSpineReadyPercent','verifiedOrApprovedPercent','artifacts/academic-verification-readiness-last-run.json']) check(`report script missing marker ${marker}`, reportScript.includes(marker));
for (const marker of ['validate-batch111-academic-verification-source.mjs','official-curriculum-source-catalog.json','academic-verification-readiness-report.mjs','BATCH111_NOTES.md']) check(`run-source-validators missing marker ${marker}`, runValidators.includes(marker));
check('docs must state focus only verified academic', notes.includes('chỉ tập trung Verified học thuật') || notes.includes('Verified học thuật thật 1–12'));
check('docs must state no fake verified', notes.includes('Không tạo verified giả') && notes.includes('không bật contentDepthAllowed'));
check('docs must not claim production-ready', notes.includes('Không claim production-ready') || notes.includes('không claim production-ready'));
for (const forbidden of ['openai','@google/generative-ai','@anthropic-ai/sdk','anthropic','langchain']) check(`forbidden AI dependency ${forbidden}`, !pkgText.includes(`"${forbidden}`));
const result = {
  ok: issues.length === 0,
  packageVersion: pkg.version,
  officialSourceDocuments: (catalog.officialSources || []).length,
  registryScopes: (registry.records || []).length,
  fakeVerifiedRecords: fakeVerified.length,
  releaseCandidates: (dossier.releaseCandidates || []).length,
  issues,
  note: 'Batch111 validates official source spine + verification readiness only. It does not prove real academic content is verified and does not prove build/runtime/hosted.'
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
