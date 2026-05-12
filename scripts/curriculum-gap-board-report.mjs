import fs from 'node:fs';
function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''; }
function readJson(file, fallback = {}) { try { return JSON.parse(read(file) || JSON.stringify(fallback)); } catch { return fallback; } }
const matrix = readJson('data/curriculum-compatibility-matrix.json', { records: [], booksets: [] });
function derivedAllowed(record) {
  const forceFalse = new Set(matrix.contentDepthPolicy?.forceFalseFor || []);
  if (forceFalse.has(record.dataStatus) || forceFalse.has(record.recordType)) return false;
  return ['verified','approved_for_release'].includes(record.dataStatus)
    && ['official_lesson','review_lesson'].includes(record.recordType)
    && Number(record.sourceCount || 0) > 0
    && Number(record.reviewerCount || 0) > 0
    && record.releaseGate === 'open';
}
const records = matrix.records || [];
const report = {
  ok: true,
  batch: 'Batch110 — Curriculum Matrix, Primary Bookset Mode & Safer Lesson Composer',
  version: matrix.version,
  primaryBookset: matrix.primaryBookset,
  totalRecords: records.length,
  teacherVisibleRecords: records.filter((r) => r.teacherVisible !== false).length,
  hiddenLegacyRecords: records.filter((r) => r.teacherVisible === false || r.booksetMode === 'legacy_reference').length,
  officialLessonRecords: records.filter((r) => r.recordType === 'official_lesson').length,
  topicStrandRecords: records.filter((r) => r.recordType === 'topic_strand').length,
  blockedOrUnmappedRecords: records.filter((r) => r.recordType === 'unmapped' || r.supportLevel === 'blocked').length,
  missingSourceRecords: records.filter((r) => Number(r.sourceCount || 0) === 0 && r.recordType !== 'unmapped').length,
  missingReviewerRecords: records.filter((r) => Number(r.reviewerCount || 0) === 0 && r.recordType !== 'unmapped').length,
  contentDepthAllowedRecords: records.filter((r) => derivedAllowed(r)).length,
  fakeContentDepthFlags: records.filter((r) => Boolean(r.contentDepthAllowed) !== Boolean(derivedAllowed(r))).length,
  hiddenLegacyBooksets: (matrix.booksets || []).filter((b) => b.teacherVisible === false).map((b) => b.id),
  claimPolicy: { hostedRuntimeClaimed: false, productionReady: false, academicVerified1to12Claimed: false, noAiDependency: true, noFakeVerified: true },
  note: 'Gap board source-level: shows missing sources/reviewers and safe-frame-only areas; does not verify academic correctness.'
};
fs.mkdirSync('artifacts', { recursive: true });
fs.writeFileSync('artifacts/curriculum-gap-board-last-run.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
