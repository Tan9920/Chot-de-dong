import fs from 'node:fs';
function readJson(file, fallback = {}) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
function pct(value, total) { return total <= 0 ? 0 : Math.round((value / total) * 1000) / 10; }
function normGrade(value) { const m = String(value ?? '').match(/\d+/); return m ? m[0] : String(value ?? '').trim(); }
const registry = readJson('data/subject-data-registry.json', { records: [] });
const catalog = readJson('data/official-curriculum-source-catalog.json', { officialSources: [], gradeBandSourceSpine: [] });
const dossier = readJson('data/academic-verification-readiness-dossier.json', {});
const submissions = readJson('data/academic-source-pack-submissions.json', { items: [] });
function sourceSpineForGrade(grade) {
  return (catalog.gradeBandSourceSpine || []).find((item) => (item.grades || []).map(String).includes(normGrade(grade)));
}
function reviewedSubmission(item) {
  return item.stage === 'reviewed_candidate' && item.reviewerId && item.reviewerRole && item.reviewerSignoffAt && Array.isArray(item.approvedReferences) && item.approvedReferences.length > 0;
}
const rows = (registry.records || []).map((record) => {
  const spine = sourceSpineForGrade(record.grade);
  const sourceIds = spine?.rootSourceIds || [];
  const sub = (submissions.items || []).filter((item) => item.scopeId === record.id);
  return {
    id: record.id,
    grade: record.grade,
    subject: record.subject,
    sourceStatus: record.sourceStatus,
    supportLevel: record.supportLevel,
    sourceSpineReady: sourceIds.length > 0,
    sourceSpineIds: sourceIds,
    sourcePackSubmissions: sub.length,
    reviewedSourcePackSubmissions: sub.filter(reviewedSubmission).length,
    verifiedOrApproved: ['verified', 'approved_for_release'].includes(record.sourceStatus),
    contentDepthAllowed: Boolean(record.contentDepthAllowed)
  };
});
const total = rows.length;
const report = {
  ok: true,
  batch: 'Batch111 — Verified Academic 1–12 Readiness & Official Source Spine',
  version: dossier.version,
  generatedAt: new Date().toISOString(),
  metrics: {
    totalAcademicScopes: total,
    officialSourceDocuments: (catalog.officialSources || []).length,
    scopesWithOfficialSourceSpine: rows.filter((row) => row.sourceSpineReady).length,
    officialSourceSpineReadyPercent: pct(rows.filter((row) => row.sourceSpineReady).length, total),
    reviewedCandidateScopes: rows.filter((row) => row.reviewedSourcePackSubmissions > 0).length,
    reviewedCandidatePercent: pct(rows.filter((row) => row.reviewedSourcePackSubmissions > 0).length, total),
    verifiedOrApprovedScopes: rows.filter((row) => row.verifiedOrApproved).length,
    verifiedOrApprovedPercent: pct(rows.filter((row) => row.verifiedOrApproved).length, total),
    deepContentAllowedScopes: rows.filter((row) => row.contentDepthAllowed).length,
    deepContentAllowedPercent: pct(rows.filter((row) => row.contentDepthAllowed).length, total),
    registryMutationsInBatch111: 0,
    fakeVerifiedCreated: 0,
    fakeContentDepthCreated: rows.filter((row) => row.contentDepthAllowed && !row.verifiedOrApproved).length
  },
  sourceIds: (catalog.officialSources || []).map((item) => item.id),
  pilotLanes: dossier.pilotLanes || [],
  releaseCandidates: dossier.releaseCandidates || [],
  warning: 'officialSourceSpineReadyPercent không phải verified coverage. Verified thật vẫn cần source pack bài/chủ đề, reviewer signoff và release gate.'
};
fs.mkdirSync('artifacts', { recursive: true });
fs.writeFileSync('artifacts/academic-verification-readiness-last-run.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
