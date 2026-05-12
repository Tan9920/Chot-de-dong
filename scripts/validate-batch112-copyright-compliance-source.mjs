import fs from 'node:fs';
function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''; }
function readJson(file, fallback = {}) { try { return JSON.parse(read(file) || JSON.stringify(fallback)); } catch { return fallback; } }
const issues = [];
function check(label, condition, detail = '') { if (!condition) issues.push(detail ? `${label}: ${detail}` : label); }
const pkg = readJson('package.json');
const lock = readJson('package-lock.json');
const policy = readJson('data/academic-copyright-compliance-policy.json', {});
const dossier = readJson('data/academic-copyright-compliance-dossier.json', {});
const registry = readJson('data/subject-data-registry.json', { records: [] });
const lib = read('lib/academic-copyright-compliance.ts');
const academicIntakeLib = read('lib/academic-source-intake.ts');
const route = read('app/api/academic/copyright-compliance/route.ts');
const adminRoute = read('app/api/admin/academic-copyright-compliance-board/route.ts');
const reportScript = read('scripts/academic-copyright-compliance-report.mjs');
const runValidators = read('scripts/run-source-validators.mjs');
const notes = read('BATCH112_NOTES.md') + '\n' + read('docs/BATCH112_COPYRIGHT_SAFE_VERIFICATION.md');
const pkgText = JSON.stringify(pkg).toLowerCase();
check('package.json version must preserve Batch112–Batch114 lineage', ['0.112.0', '0.113.0', '0.114.0'].includes(pkg.version), pkg.version);
check('package-lock version must preserve Batch112–Batch114 lineage', ['0.112.0', '0.113.0', '0.114.0'].includes(lock.version), lock.version);
check('package-lock root version must preserve Batch112–Batch114 lineage', ['0.112.0', '0.113.0', '0.114.0'].includes(lock.packages?.['']?.version), lock.packages?.['']?.version);
for (const script of ['batch112:copyright-compliance-validate','academic:copyright-compliance-validate','academic:copyright-compliance-report','smoke:batch112','verify:batch112']) check(`package.json missing script ${script}`, Boolean(pkg.scripts?.[script]));
for (const file of ['data/academic-copyright-compliance-policy.json','data/academic-copyright-compliance-dossier.json','lib/academic-copyright-compliance.ts','app/api/academic/copyright-compliance/route.ts','app/api/admin/academic-copyright-compliance-board/route.ts','scripts/academic-copyright-compliance-report.mjs','scripts/validate-batch112-copyright-compliance-source.mjs','docs/BATCH112_COPYRIGHT_SAFE_VERIFICATION.md','BATCH112_NOTES.md']) check(`missing ${file}`, fs.existsSync(file));
check('policy must be Batch112', String(policy.version || '').includes('batch112'), policy.version);
check('dossier must be Batch112', String(dossier.version || '').includes('batch112'), dossier.version);
for (const id of ['vn-ip-law-50-2005-as-amended','gov-nd17-2023-copyright-neighboring-rights','gov-nd134-2026-amends-nd17','moet-tt32-2018-ctgdpt','moet-tt17-2025-ctgdpt-amendment']) check(`policy missing legal basis ${id}`, (policy.researchedLegalBasis || []).some((item) => item.id === id));
for (const marker of ['Không copy dài SGK','Không dựa vào ngoại lệ giảng dạy','license','attribution','takedownContact','batch112DoesNotMutateRegistry','metadataOnly','forbiddenClaims']) check(`policy missing marker ${marker}`, JSON.stringify(policy).includes(marker));
for (const marker of ['sourcePackLegalChecklist','pilotScopesStillBlocked','takedownWorkflow','registryMutationsInBatch112']) check(`dossier missing marker ${marker}`, JSON.stringify(dossier).includes(marker));
for (const marker of ['evaluateAcademicCopyrightCompliance','buildAcademicCopyrightComplianceReport','buildAcademicCopyrightComplianceBoard','copyright_pipeline_ready_registry_unchanged_safe_frame_only','canMutateRegistry: false','canAllowDeepContent: false','metadata_only_cannot_unlock_deep_content','Legal-ready không đồng nghĩa academic verified']) check(`lib missing marker ${marker}`, lib.includes(marker));
check('lib must reuse academic source pack evaluation', lib.includes('evaluateAcademicSourcePack') && lib.includes('buildAcademicVerificationReadinessReport'));
for (const marker of ['buildAcademicCopyrightComplianceReport','Dry-run evaluation only','không ghi registry']) check(`route missing marker ${marker}`, route.includes(marker));
for (const marker of ['buildAcademicCopyrightComplianceBoard','không auto-public community resource']) check(`admin route missing marker ${marker}`, adminRoute.includes(marker));
for (const marker of ['academic-copyright-compliance-last-run.json','legalHoldSourcePacks','registryMutationsInBatch112']) check(`report script missing marker ${marker}`, reportScript.includes(marker));
for (const marker of ['validate-batch112-copyright-compliance-source.mjs','academic-copyright-compliance-policy.json','academic-copyright-compliance-report.mjs','BATCH112_NOTES.md']) check(`run-source-validators missing marker ${marker}`, runValidators.includes(marker));
check('academic source intake must still require no long copyright copy', academicIntakeLib.includes('long_copyright_copy_risk') && academicIntakeLib.includes('takedownContact'));
const fakeVerified = (registry.records || []).filter((item) => ['verified','approved_for_release'].includes(item.sourceStatus) || item.contentDepthAllowed);
check('Batch112 must not mutate registry to fake verified/contentDepthAllowed', fakeVerified.length === 0, `${fakeVerified.length} found`);
check('docs must state copyright/legal focus', notes.includes('bản quyền') && notes.includes('pháp lý'));
check('docs must state no fake verified', notes.includes('Không tạo verified giả') && notes.includes('không bật contentDepthAllowed'));
check('docs must state source/legal researched before upgrade', notes.includes('Luật Sở hữu trí tuệ') && notes.includes('Nghị định 17/2023') && notes.includes('Nghị định 134/2026'));
for (const forbidden of ['openai','@google/generative-ai','@anthropic-ai/sdk','anthropic','langchain']) check(`forbidden AI dependency ${forbidden}`, !pkgText.includes(`"${forbidden}`));
const result = {
  ok: issues.length === 0,
  packageVersion: pkg.version,
  legalBasisCount: (policy.researchedLegalBasis || []).length,
  registryScopes: (registry.records || []).length,
  fakeVerifiedRecords: fakeVerified.length,
  issues,
  note: 'Batch112 validates legal/copyright compliance pipeline only. It does not prove legal advice, production readiness, real reviewer signoff, or hosted runtime.'
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
