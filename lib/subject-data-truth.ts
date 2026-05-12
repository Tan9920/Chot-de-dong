import registry from '@/data/subject-data-registry.json';
import { resolveSubjectName } from './subject-naming';
import { getStarterCurriculumStats, getStarterTopicTitles } from './starter-curriculum-catalog';

const STATUS_ORDER = ['scaffold', 'seed', 'community', 'reviewed', 'verified', 'approved_for_release'];
const SUPPORT_ORDER = ['starter', 'developing', 'foundation', 'operational'];

function normalise(value: any) {
  return String(value || '').trim().toLowerCase();
}

function normaliseGrade(value: any) {
  const raw = String(value || '').trim();
  const match = raw.match(/\d+/);
  return match ? match[0] : raw;
}

function normaliseSubject(value: any) {
  const resolvedSubject = resolveSubjectName(String(value || '')) as any;
  const resolved = resolvedSubject.canonicalSubject || resolvedSubject.canonical || String(value || '');
  return normalise(resolved);
}

function rank(order: string[], value: string) {
  const index = order.indexOf(value);
  return index < 0 ? 0 : index;
}

export function listSubjectDataRecords() {
  return [...((registry as any).records || [])];
}

export function findSubjectDataRecord(input: any = {}) {
  const grade = normaliseGrade(input.grade);
  const subject = normaliseSubject(input.subject);
  const book = normalise(input.book);
  const records = listSubjectDataRecords();

  const exactBook = records.find((item: any) => normaliseGrade(item.grade) === grade && normaliseSubject(item.subject) === subject && book && normalise(item.book) === book);
  if (exactBook) return exactBook;

  const byGradeSubject = records.find((item: any) => normaliseGrade(item.grade) === grade && normaliseSubject(item.subject) === subject);
  if (byGradeSubject) return byGradeSubject;

  return null;
}

export function buildSubjectDataGate(input: any = {}) {
  const record = findSubjectDataRecord(input);
  const sourceStatus = record?.sourceStatus || 'scaffold';
  const supportLevel = record?.supportLevel || 'starter';
  const releaseTier = record?.releaseTier || 'internal_preview';
  const reviewStatus = record?.reviewStatus || 'not_reviewed';
  const hasReviewedData = rank(STATUS_ORDER, sourceStatus) >= rank(STATUS_ORDER, 'reviewed');
  const hasFoundationSupport = rank(SUPPORT_ORDER, supportLevel) >= rank(SUPPORT_ORDER, 'foundation');
  const hasReferences = Number(record?.approvedReferenceCount || 0) > 0;
  const contentDepthAllowed = Boolean(record?.contentDepthAllowed && hasReviewedData && hasFoundationSupport && hasReferences);
  const mode = contentDepthAllowed ? 'structured_content_allowed' : 'safe_frame_only';

  return {
    record,
    found: Boolean(record),
    mode,
    contentDepthAllowed,
    sourceStatus,
    supportLevel,
    releaseTier,
    reviewStatus,
    safeLessonMode: record?.safeLessonMode || 'frame_only',
    casioAllowed: Boolean(record?.casioAllowed && contentDepthAllowed),
    dataWarnings: record?.dataWarnings || ['Chưa có bản ghi dữ liệu môn/bài; chỉ được dựng khung giáo án an toàn.'],
    teacherActionRequired: record?.teacherActionRequired || ['Giáo viên cần chọn nguồn hợp pháp và nhập nội dung bài học trước khi dùng chính thức.'],
    blockers: contentDepthAllowed ? [] : [
      'subject_data_not_reviewed_or_not_foundation',
      sourceStatus === 'verified' || sourceStatus === 'approved_for_release' ? null : `source_status_${sourceStatus}`,
      supportLevel === 'foundation' || supportLevel === 'operational' ? null : `support_level_${supportLevel}`,
      hasReferences ? null : 'missing_approved_references'
    ].filter(Boolean),
    policy: {
      minSourceStatusForDeepLesson: 'reviewed',
      minSupportLevelForDeepLesson: 'foundation',
      approvedReferenceRequired: true,
      noCasioUnlessApproved: true
    }
  };
}

export function buildSubjectDataSummary() {
  const records = listSubjectDataRecords();
  const starterCatalog = getStarterCurriculumStats();
  const byLevel: Record<string, any> = {};
  const byStatus: Record<string, number> = {};
  const bySupport: Record<string, number> = {};
  const unsafeForDeepContent: any[] = [];

  for (const item of records as any[]) {
    const level = item.level || 'Khác';
    byLevel[level] ||= { level, records: 0, grades: new Set(), subjects: new Set(), deepContentAllowed: 0 };
    byLevel[level].records += 1;
    byLevel[level].grades.add(item.grade);
    byLevel[level].subjects.add(item.subject);
    if (item.contentDepthAllowed) byLevel[level].deepContentAllowed += 1;
    byStatus[item.sourceStatus || 'unknown'] = (byStatus[item.sourceStatus || 'unknown'] || 0) + 1;
    bySupport[item.supportLevel || 'unknown'] = (bySupport[item.supportLevel || 'unknown'] || 0) + 1;
    if (!item.contentDepthAllowed) {
      unsafeForDeepContent.push({ grade: item.grade, subject: item.subject, sourceStatus: item.sourceStatus, supportLevel: item.supportLevel, reason: item.dataWarnings?.[0] });
    }
  }

  return {
    version: (registry as any).version,
    updatedAt: (registry as any).updatedAt,
    principles: (registry as any).principles,
    totalRecords: records.length,
    gradeCount: new Set(records.map((item: any) => item.grade)).size,
    subjectCount: new Set(records.map((item: any) => item.subject)).size,
    byStatus,
    bySupport,
    byLevel: Object.values(byLevel).map((item: any) => ({ ...item, grades: [...item.grades], subjects: [...item.subjects] })),
    deepContentAllowedRecords: records.filter((item: any) => item.contentDepthAllowed).length,
    unsafeForDeepContentCount: unsafeForDeepContent.length,
    sampleUnsafeForDeepContent: unsafeForDeepContent.slice(0, 12),
    starterCatalog,
    globalWarning: 'Batch92 đã mở rộng starter topic catalog cho 1–12 để test luồng chọn dữ liệu, nhưng chưa có dữ liệu reviewed/verified. Generator vẫn chỉ dựng khung an toàn khi thiếu nguồn đã duyệt.'
  };
}

export function buildSubjectDataCoverageItems() {
  return listSubjectDataRecords().map((item: any) => {
    const starterTopics = getStarterTopicTitles({ grade: item.grade, subject: item.subject });
    return {
      level: item.level,
      grade: item.grade,
      subject: item.subject,
      book: item.book,
      topics: Math.max(Number(item.topicCount || 0), starterTopics.length),
      programUnits: item.programUnits || starterTopics.length || 0,
      resources: item.resources || 0,
      questions: item.questions || 0,
      rubrics: item.rubrics || 0,
      sourceStatus: item.sourceStatus,
      reviewStatus: item.reviewStatus,
      releaseTier: item.releaseTier,
      supportLevel: item.supportLevel,
      contentDepthAllowed: Boolean(item.contentDepthAllowed),
      supportFlags: [item.safeLessonMode || 'frame_only'],
      supportNotes: item.dataWarnings || [],
      starterTopics
    };
  });
}

export function buildSubjectDataCatalog() {
  const catalog: any = { level: '1–12', grades: {} };
  for (const item of listSubjectDataRecords() as any[]) {
    const starterTopics = getStarterTopicTitles({ grade: item.grade, subject: item.subject });
    catalog.grades[item.grade] ||= { name: `Lớp ${item.grade}`, level: item.level, subjects: {} };
    catalog.grades[item.grade].subjects[item.subject] ||= { name: item.subject, books: {} };
    catalog.grades[item.grade].subjects[item.subject].books[item.book] = {
      name: item.book,
      sourceStatus: item.sourceStatus,
      supportLevel: item.supportLevel,
      contentDepthAllowed: Boolean(item.contentDepthAllowed),
      topics: Object.fromEntries(starterTopics.map((title) => [title, { title, sourceStatus: item.sourceStatus, supportLevel: item.supportLevel, safeUse: 'starter_topic_frame_only' }]))
    };
  }
  return catalog;
}
