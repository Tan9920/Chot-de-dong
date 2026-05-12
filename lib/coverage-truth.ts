export function buildCoverageTruthReport(_roadmap: any, coverage: any[] = [], lessons: any[] = []) {
  const byStatus: Record<string, number> = {};
  const bySupport: Record<string, number> = {};
  const byLevel: Record<string, any> = {};
  let deepContentAllowed = 0;

  for (const item of coverage) {
    byStatus[item.sourceStatus || 'unknown'] = (byStatus[item.sourceStatus || 'unknown'] || 0) + 1;
    bySupport[item.supportLevel || 'unknown'] = (bySupport[item.supportLevel || 'unknown'] || 0) + 1;
    const level = item.level || 'Khác';
    byLevel[level] ||= { level, records: 0, grades: new Set(), subjects: new Set(), deepContentAllowed: 0 };
    byLevel[level].records += 1;
    byLevel[level].grades.add(item.grade);
    byLevel[level].subjects.add(item.subject);
    if (item.contentDepthAllowed) {
      deepContentAllowed += 1;
      byLevel[level].deepContentAllowed += 1;
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    coverage,
    savedLessons: lessons.length,
    biasWarning: 'Coverage 1–12 không đồng nghĩa readiness. Batch74 cố ý đánh dấu phần lớn lớp/môn là scaffold/starter để tránh thổi phồng dữ liệu môn học.',
    dataTruthWarning: 'Không được sinh kiến thức sâu khi sourceStatus chưa đạt reviewed và supportLevel chưa đạt foundation kèm nguồn đã duyệt.',
    summary: {
      totalScopes: coverage.length,
      verifiedScopes: coverage.filter((item) => item.sourceStatus === 'verified' || item.sourceStatus === 'approved_for_release').length,
      reviewedScopes: coverage.filter((item) => item.sourceStatus === 'reviewed').length,
      seedScopes: coverage.filter((item) => item.sourceStatus === 'seed').length,
      scaffoldScopes: coverage.filter((item) => item.sourceStatus === 'scaffold').length,
      deepContentAllowedScopes: deepContentAllowed,
      byStatus,
      bySupport,
      byLevel: Object.values(byLevel).map((item: any) => ({ ...item, grades: [...item.grades], subjects: [...item.subjects] }))
    }
  };
}
