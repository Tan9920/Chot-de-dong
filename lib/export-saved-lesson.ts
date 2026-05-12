import { getLessonById, getStorageMode } from './storage';
import { assertLessonPermission } from './access';
import { buildLessonCompliancePacket } from './lesson-compliance';
import type { SessionUser } from './types';

function firstDefined(...values: any[]) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function readSourceStatus(snapshot: any) {
  return firstDefined(
    snapshot?.sourceStatus,
    snapshot?.sourceStatusSummary?.sourceStatus,
    snapshot?.dataTruth?.sourceStatus,
    snapshot?.truthStatus,
    snapshot?.status,
    'seed'
  );
}

function readSupportLevel(snapshot: any) {
  return firstDefined(
    snapshot?.supportLevel,
    snapshot?.coverage?.supportLevel,
    snapshot?.readiness?.supportLevel,
    'starter'
  );
}

function readReviewStatus(snapshot: any, status: string) {
  return firstDefined(
    snapshot?.reviewStatus,
    snapshot?.approvalStatus,
    snapshot?.releaseStatus,
    status === 'approved' ? 'approved_lesson_status_only' : 'draft_or_unreviewed'
  );
}

function isTrustedForOfficialUse(sourceStatus: string) {
  return ['reviewed', 'verified', 'approved_for_release'].includes(sourceStatus);
}

export function buildExportCompliancePacket(payload: any, lesson: any | null = null) {
  const sourceStatus = payload.sourceStatus || readSourceStatus(payload.governanceSnapshot || lesson?.governanceSnapshot);
  const supportLevel = payload.supportLevel || readSupportLevel(payload.governanceSnapshot || lesson?.governanceSnapshot);
  const lessonStatus = payload.lessonStatus || lesson?.status || 'draft';
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!isTrustedForOfficialUse(sourceStatus)) {
    warnings.push('Dữ liệu đang ở mức seed/scaffold/community hoặc chưa xác định; file chỉ nên dùng như bản nháp để giáo viên kiểm tra và chỉnh sửa.');
  }
  if (lessonStatus !== 'approved') {
    warnings.push('Giáo án chưa ở trạng thái approved; không được coi là bản duyệt cuối.');
  }
  if (!payload.content || String(payload.content).trim().length < 40) {
    warnings.push('Nội dung giáo án ngắn hoặc rỗng; cần bổ sung trước khi dùng chính thức.');
  }
  if (payload.subject === 'Kĩ thuật' || payload.subject === 'Kỹ thuật') {
    warnings.push('Nếu đây là tên môn trong CTGDPT mới, cần dùng “Công nghệ”; chỉ dùng “kĩ thuật” khi nói về phương pháp/kĩ thuật dạy học.');
  }

  return {
    lessonId: payload.lessonId || lesson?.id || null,
    exportedFromSavedLesson: Boolean(lesson),
    generatedAt: new Date().toISOString(),
    lessonStatus,
    sourceStatus,
    supportLevel,
    reviewStatus: payload.reviewStatus || readReviewStatus(payload.governanceSnapshot || lesson?.governanceSnapshot, lessonStatus),
    releaseTier: payload.releaseTier || payload.governanceSnapshot?.releaseTier || 'not_released',
    storageMode: payload.storageMode || getStorageMode(),
    warnings,
    blockers,
    teacherFinalReviewRequired: true,
    legalNotice: 'File xuất ra là tài liệu hỗ trợ soạn giáo án. Giáo viên/tổ chuyên môn cần kiểm tra kiến thức, nguồn, bản quyền học liệu và điều chỉnh theo lớp học thật trước khi sử dụng.',
    nonClaims: [
      'Không tự nhận chuẩn Bộ/đúng 100%.',
      'Không biến seed/scaffold thành verified.',
      'Không thay thế trách nhiệm chuyên môn của giáo viên/tổ chuyên môn.'
    ]
  };
}

function lessonToExportPayload(body: any, lesson: any, user: SessionUser) {
  const governanceSnapshot = firstDefined(body.governanceSnapshot, lesson.governanceSnapshot, null);
  const sourceStatus = readSourceStatus(governanceSnapshot);
  const supportLevel = readSupportLevel(governanceSnapshot);
  const lessonStatus = firstDefined(body.lessonStatus, lesson.status, 'draft');
  const payload = {
    ...body,
    lessonId: lesson.id,
    savedLessonId: lesson.id,
    title: firstDefined(body.title, lesson.title),
    level: firstDefined(body.level, lesson.level),
    grade: firstDefined(body.grade, lesson.grade),
    subject: firstDefined(body.subject, lesson.subject),
    book: firstDefined(body.book, lesson.book),
    topic: firstDefined(body.topic, lesson.topic),
    template: firstDefined(body.template, lesson.template),
    duration: firstDefined(body.duration, lesson.duration, lesson.summary?.duration),
    teacherNote: firstDefined(body.teacherNote, lesson.teacherNote),
    methods: Array.isArray(body.methods) ? body.methods : Array.isArray(lesson.methods) ? lesson.methods : [],
    techniques: Array.isArray(body.techniques) ? body.techniques : Array.isArray(lesson.techniques) ? lesson.techniques : [],
    content: firstDefined(body.content, lesson.content, lesson.plan, ''),
    lessonStatus,
    currentVersion: lesson.currentVersion || lesson.version || body.currentVersion || 1,
    createdAt: lesson.createdAt,
    updatedAt: lesson.updatedAt,
    authorName: lesson.authorName,
    exporterName: user.name,
    governanceSnapshot,
    provenanceSnapshot: firstDefined(body.provenanceSnapshot, lesson.provenanceSnapshot, null),
    sourceStatus,
    supportLevel,
    reviewStatus: readReviewStatus(governanceSnapshot, lessonStatus),
    releaseTier: governanceSnapshot?.releaseTier || governanceSnapshot?.release?.tier || 'not_released',
    storageMode: getStorageMode(),
    exportedFromSavedLesson: true
  };
  return { ...payload, compliancePacket: buildExportCompliancePacket(payload, lesson) };
}

export async function resolveLessonExportPayload(body: any = {}, user: SessionUser) {
  const lessonId = body.lessonId || body.savedLessonId || body.id;
  if (!lessonId) {
    const payload = {
      ...body,
      lessonStatus: body.lessonStatus || body.status || 'draft',
      sourceStatus: readSourceStatus(body.governanceSnapshot),
      supportLevel: readSupportLevel(body.governanceSnapshot),
      storageMode: getStorageMode(),
      exportedFromSavedLesson: false
    };
    return { ok: true as const, payload: { ...payload, compliancePacket: buildExportCompliancePacket(payload, null) }, lesson: null };
  }

  const lesson = await getLessonById(String(lessonId));
  if (!lesson) {
    return {
      ok: false as const,
      status: 404,
      error: 'Không tìm thấy giáo án đã lưu để xuất file.',
      detail: 'Hãy lưu giáo án trước, sau đó xuất bằng lessonId/savedLessonId.'
    };
  }

  if (!assertLessonPermission(user, 'lesson:read', lesson)) {
    return { ok: false as const, status: 403, error: 'Bạn không có quyền xuất giáo án này.' };
  }

  const compliancePacket = buildLessonCompliancePacket({ lesson });
  const payload = lessonToExportPayload(body, lesson, user);
  return {
    ok: true as const,
    payload: {
      ...payload,
      compliancePacket: {
        ...payload.compliancePacket,
        lessonCompliancePacket: compliancePacket
      }
    },
    lesson
  };
}
