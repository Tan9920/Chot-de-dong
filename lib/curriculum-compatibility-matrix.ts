import fs from 'fs';
import path from 'path';

type AnyRecord = Record<string, any>;

function readText(file: string, fallback = '') {
  try { return fs.readFileSync(path.join(process.cwd(), file), 'utf8'); }
  catch { return fallback; }
}

function readJson(file: string, fallback: any = null) {
  try { return JSON.parse(readText(file, JSON.stringify(fallback))); }
  catch { return fallback; }
}

function normalize(value: any) {
  return String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/\s+/g, ' ');
}

export function readCurriculumCompatibilityMatrix() {
  return readJson('data/curriculum-compatibility-matrix.json', {
    version: 'missing',
    primaryBookset: 'ket_noi_tri_thuc',
    booksets: [],
    subjectGradeMatrix: [],
    records: [],
    contentDepthPolicy: { forceFalseFor: [] },
    contextDimensions: {}
  });
}

export function listCurriculumBooksets(options: AnyRecord = {}) {
  const matrix = readCurriculumCompatibilityMatrix();
  const includeLegacy = Boolean(options.includeLegacy || options.adminMode);
  return (matrix.booksets || []).filter((item: AnyRecord) => includeLegacy || item.teacherVisible !== false).map((item: AnyRecord) => ({
    id: item.id,
    label: item.label,
    mode: item.mode,
    teacherVisible: Boolean(item.teacherVisible),
    referenceOnly: Boolean(item.referenceOnly),
    note: item.note
  }));
}

export function listCurriculumSubjects(gradeInput: string | number = '5') {
  const matrix = readCurriculumCompatibilityMatrix();
  const grade = String(gradeInput || '5');
  const exact = (matrix.subjectGradeMatrix || []).find((item: AnyRecord) => String(item.grade) === grade);
  if (exact) return exact.subjects || [];
  const numeric = Number(grade);
  if (numeric >= 1 && numeric <= 5) return (matrix.subjectGradeMatrix || []).find((item: AnyRecord) => item.grade === 'generic_primary')?.subjects || [];
  if (numeric >= 6 && numeric <= 9) return (matrix.subjectGradeMatrix || []).find((item: AnyRecord) => item.grade === 'generic_lower_secondary')?.subjects || [];
  return (matrix.subjectGradeMatrix || []).find((item: AnyRecord) => item.grade === 'generic_upper_secondary')?.subjects || [];
}

function findBookset(booksetId: string, adminMode = false) {
  const matrix = readCurriculumCompatibilityMatrix();
  const requested = String(booksetId || matrix.teacherDefaultBookset || matrix.primaryBookset || 'ket_noi_tri_thuc');
  const found = (matrix.booksets || []).find((item: AnyRecord) => item.id === requested) || (matrix.booksets || []).find((item: AnyRecord) => item.id === matrix.primaryBookset);
  if (!found) return { id: 'ket_noi_tri_thuc', label: 'Kết nối tri thức', mode: 'primary', teacherVisible: true };
  if (!adminMode && found.teacherVisible === false) {
    const primary = (matrix.booksets || []).find((item: AnyRecord) => item.id === matrix.primaryBookset) || found;
    return { ...primary, requestedHiddenLegacy: found };
  }
  return found;
}

function recordMatches(record: AnyRecord, input: AnyRecord) {
  const topicId = normalize(input.topicId || input.matrixRecordId || '');
  const topic = normalize(input.topic || input.customTopic || '');
  const aliases = [record.id, record.title, ...(record.aliases || [])].map(normalize);
  return Boolean((topicId && aliases.includes(topicId)) || (topic && aliases.some((alias) => alias && (alias === topic || alias.includes(topic) || topic.includes(alias)))));
}

function deriveContentDepthAllowed(record: AnyRecord, matrix: AnyRecord) {
  const status = String(record.dataStatus || record.sourceStatus || 'seed');
  const type = String(record.recordType || 'unmapped');
  const forced = new Set(matrix.contentDepthPolicy?.forceFalseFor || []);
  if (forced.has(status) || forced.has(type)) return false;
  return ['verified', 'approved_for_release'].includes(status)
    && ['official_lesson', 'review_lesson'].includes(type)
    && Number(record.sourceCount || 0) > 0
    && Number(record.reviewerCount || 0) > 0
    && String(record.releaseGate || 'closed') === 'open';
}

export function listCurriculumRecords(input: AnyRecord = {}) {
  const matrix = readCurriculumCompatibilityMatrix();
  const grade = String(input.grade || '5');
  const subject = String(input.subject || '');
  const adminMode = Boolean(input.adminMode || input.includeLegacy);
  const bookset = findBookset(String(input.bookset || ''), adminMode);
  return (matrix.records || []).filter((record: AnyRecord) => {
    const gradeOk = !input.grade || String(record.grade) === grade;
    const subjectOk = !subject || record.subject === subject;
    const booksetOk = adminMode ? true : record.bookset === bookset.id;
    const visibleOk = adminMode ? true : record.teacherVisible !== false;
    return gradeOk && subjectOk && booksetOk && visibleOk;
  }).map((record: AnyRecord) => ({ ...record, contentDepthAllowed: deriveContentDepthAllowed(record, matrix) }));
}

export function resolveCurriculumSelection(input: AnyRecord = {}) {
  const matrix = readCurriculumCompatibilityMatrix();
  const warnings: string[] = [];
  const grade = String(input.grade || '5');
  const requestedSubject = String(input.subject || 'Tiếng Việt');
  const adminMode = Boolean(input.adminMode);
  const bookset = findBookset(String(input.bookset || ''), adminMode);
  if ((bookset as AnyRecord).requestedHiddenLegacy) {
    warnings.push(`Bộ sách ${(bookset as AnyRecord).requestedHiddenLegacy.label} đang ở chế độ legacy/reference-only và bị ẩn khỏi luồng giáo viên thường; hệ thống chuyển về trục ${bookset.label}.`);
  }
  const subjects = listCurriculumSubjects(grade);
  const subject = subjects.includes(requestedSubject) ? requestedSubject : (subjects[0] || requestedSubject);
  if (subject !== requestedSubject) warnings.push(`Môn ${requestedSubject} chưa có trong ma trận lớp ${grade}; hệ thống chuyển sang ${subject}.`);

  const allGradeRecords = (matrix.records || []).filter((record: AnyRecord) => String(record.grade) === grade);
  let record = allGradeRecords.find((item: AnyRecord) => item.subject === subject && item.bookset === bookset.id && recordMatches(item, input)) || null;
  const mismatchRecord = allGradeRecords.find((item: AnyRecord) => item.subject !== subject && recordMatches(item, input));
  if (!record && mismatchRecord && !String(input.customTopic || '').trim()) {
    warnings.push(`Bài/chủ đề “${input.topic || input.topicId || ''}” không thuộc môn ${subject}; gợi ý kiểm tra lại môn ${mismatchRecord.subject}.`);
    record = {
      id: 'unmapped-subject-topic-mismatch',
      title: input.topic || input.topicId || 'Tổ hợp lớp/môn/chủ đề chưa map',
      grade,
      subject,
      bookset: bookset.id,
      booksetMode: bookset.mode,
      recordType: 'unmapped',
      dataStatus: 'unmapped',
      reviewStatus: 'blocked_mismatch',
      supportLevel: 'blocked',
      teacherVisible: false,
      sourceCount: 0,
      reviewerCount: 0,
      releaseGate: 'closed',
      contentDepthAllowed: false,
      exportMode: 'blocked',
      riskFlags: ['subject_topic_mismatch', `suggest_subject_${mismatchRecord.subject}`]
    };
  }

  const customTopic = String(input.customTopic || '').trim();
  const allowCustom = Boolean(input.allowCustomTopic || customTopic);
  if (!record && allowCustom && customTopic) {
    record = {
      id: 'teacher-input-topic',
      title: customTopic,
      grade,
      subject,
      bookset: bookset.id,
      booksetMode: bookset.mode,
      recordType: 'teacher_input',
      dataStatus: 'custom_teacher_input',
      reviewStatus: 'teacher_responsibility',
      supportLevel: 'teacher_custom',
      teacherVisible: true,
      sourceCount: 0,
      reviewerCount: 0,
      releaseGate: 'closed',
      contentDepthAllowed: false,
      exportMode: 'safe_frame_only',
      riskFlags: ['teacher_supplied_content', 'needs_source_check']
    };
    warnings.push('Chủ đề tự nhập được phân loại teacher_input/custom_teacher_input; chỉ dựng khung, không sinh kiến thức sâu.');
  }

  if (!record) {
    record = listCurriculumRecords({ grade, subject, bookset: bookset.id })[0] || {
      id: 'unmapped-fallback',
      title: input.topic || 'Chủ đề chưa có trong ma trận',
      grade,
      subject,
      bookset: bookset.id,
      booksetMode: bookset.mode,
      recordType: 'unmapped',
      dataStatus: 'unmapped',
      reviewStatus: 'not_reviewed',
      supportLevel: 'blocked',
      sourceCount: 0,
      reviewerCount: 0,
      releaseGate: 'closed',
      contentDepthAllowed: false,
      exportMode: 'safe_frame_only',
      riskFlags: ['unmapped_topic']
    };
    warnings.push('Chưa map được bài/chủ đề vào ma trận; hệ thống hạ cấp về khung an toàn.');
  }

  const contentDepthAllowed = deriveContentDepthAllowed(record, matrix);
  const releaseAllowed = Boolean(contentDepthAllowed && String(record.releaseGate) === 'open');
  const dataStatus = String(record.dataStatus || 'seed');
  if (input.sourceStatus === 'verified' && !['verified', 'approved_for_release'].includes(dataStatus)) warnings.push('Input đòi verified đã bị bỏ qua; dataStatus do ma trận tự tính.');
  if (!contentDepthAllowed) warnings.push('contentDepthAllowed=false: chưa đủ nguồn/reviewer/release gate để sinh kiến thức sâu.');
  return {
    ok: String(record.recordType) !== 'unmapped' && String(record.supportLevel) !== 'blocked',
    version: matrix.version,
    grade,
    subject,
    bookset: { id: bookset.id, label: bookset.label, mode: bookset.mode, teacherVisible: Boolean(bookset.teacherVisible) },
    record: { ...record, contentDepthAllowed },
    recordType: record.recordType || 'unmapped',
    dataStatus,
    supportLevel: record.supportLevel || 'starter',
    reviewStatus: record.reviewStatus || 'not_reviewed',
    contentDepthAllowed,
    releaseAllowed,
    exportMode: record.exportMode || 'safe_frame_only',
    riskFlags: record.riskFlags || [],
    warnings,
    teacherMessage: contentDepthAllowed
      ? 'Dữ liệu có thể dùng sâu hơn nhưng giáo viên vẫn cần kiểm tra cuối.'
      : 'Chưa đủ dữ liệu đã duyệt; hệ thống chỉ dựng khung an toàn và yêu cầu giáo viên bổ sung/đối chiếu.'
  };
}

export function buildCurriculumGapBoard() {
  const matrix = readCurriculumCompatibilityMatrix();
  const records = matrix.records || [];
  const withDerived = records.map((record: AnyRecord) => ({ ...record, derivedContentDepthAllowed: deriveContentDepthAllowed(record, matrix) }));
  const fakeDeepContent = withDerived.filter((record: AnyRecord) => Boolean(record.contentDepthAllowed) !== Boolean(record.derivedContentDepthAllowed));
  const hiddenLegacy = withDerived.filter((record: AnyRecord) => record.booksetMode === 'legacy_reference' || record.teacherVisible === false);
  const blockedOrUnmapped = withDerived.filter((record: AnyRecord) => ['unmapped', 'blocked'].includes(String(record.recordType)) || String(record.supportLevel) === 'blocked');
  const missingSource = withDerived.filter((record: AnyRecord) => Number(record.sourceCount || 0) === 0 && record.recordType !== 'unmapped');
  const missingReviewer = withDerived.filter((record: AnyRecord) => Number(record.reviewerCount || 0) === 0 && record.recordType !== 'unmapped');
  const byGradeSubject: AnyRecord = {};
  for (const record of withDerived) {
    const key = `${record.grade}::${record.subject}`;
    byGradeSubject[key] = byGradeSubject[key] || { grade: record.grade, subject: record.subject, total: 0, teacherVisible: 0, safeFrameOnly: 0, contentDepthAllowed: 0 };
    byGradeSubject[key].total += 1;
    if (record.teacherVisible !== false) byGradeSubject[key].teacherVisible += 1;
    if (!record.derivedContentDepthAllowed) byGradeSubject[key].safeFrameOnly += 1;
    if (record.derivedContentDepthAllowed) byGradeSubject[key].contentDepthAllowed += 1;
  }
  return {
    batch: 'Batch110 — Curriculum Matrix, Primary Bookset Mode & Safer Lesson Composer',
    version: matrix.version,
    status: fakeDeepContent.length === 0 ? 'curriculum_matrix_source_ready_safe_frame_guarded' : 'curriculum_matrix_has_policy_issues',
    primaryBookset: matrix.primaryBookset,
    hiddenLegacyBooksets: (matrix.booksets || []).filter((item: AnyRecord) => item.teacherVisible === false).map((item: AnyRecord) => item.id),
    metrics: {
      totalRecords: records.length,
      teacherVisibleRecords: withDerived.filter((record: AnyRecord) => record.teacherVisible !== false).length,
      hiddenLegacyRecords: hiddenLegacy.length,
      officialLessonRecords: withDerived.filter((record: AnyRecord) => record.recordType === 'official_lesson').length,
      topicStrandRecords: withDerived.filter((record: AnyRecord) => record.recordType === 'topic_strand').length,
      blockedOrUnmappedRecords: blockedOrUnmapped.length,
      missingSourceRecords: missingSource.length,
      missingReviewerRecords: missingReviewer.length,
      contentDepthAllowedRecords: withDerived.filter((record: AnyRecord) => record.derivedContentDepthAllowed).length,
      fakeDeepContentFlags: fakeDeepContent.length
    },
    byGradeSubject: Object.values(byGradeSubject),
    gaps: [
      ...missingSource.slice(0, 10).map((record: AnyRecord) => ({ id: record.id, type: 'missing_source', message: `${record.grade} · ${record.subject} · ${record.title} thiếu nguồn hợp lệ.` })),
      ...missingReviewer.slice(0, 10).map((record: AnyRecord) => ({ id: record.id, type: 'missing_reviewer', message: `${record.grade} · ${record.subject} · ${record.title} chưa có reviewer.` })),
      ...blockedOrUnmapped.slice(0, 10).map((record: AnyRecord) => ({ id: record.id, type: 'blocked_or_unmapped', message: `${record.grade} · ${record.subject} · ${record.title} chưa được phép sinh sâu/release.` }))
    ],
    claimPolicy: {
      productionReady: false,
      hostedRuntimeClaimed: false,
      academicVerified1to12Claimed: false,
      safeFrameOnlyWhenUnverified: true,
      noAiDependency: true,
      noFakeVerified: fakeDeepContent.length === 0
    }
  };
}
