import { NextRequest, NextResponse } from 'next/server';
import { contentRepository } from '@/lib/content-repository';
import { analyzeAcademicTrace } from '@/lib/academic-trace';
import { assessContentSafetyGate } from '@/lib/content-safety-gate';
import { buildLessonContextProfile } from '@/lib/lesson-context';
import { getGradeLessonBlueprint } from '@/lib/grade-lesson-structure';
import { getLessonPedagogyProfile } from '@/lib/lesson-pedagogy';
import { getLessonTechnicalDraftingProfile } from '@/lib/lesson-technical-drafting';
import { assessTeacherEditableFrameReadiness, buildTeacherEditableFrameLines } from '@/lib/teacher-lesson-frame';
import { evaluatePublicTrustReadiness } from '@/lib/public-trust-policy';
import { assertRuntimeRateLimit, assertWriteProtection, readJsonBody, requireActiveSession } from '@/lib/runtime-security';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function POST(request: NextRequest) {
  const rate = assertRuntimeRateLimit(request, 'lesson_frame_readiness', {
    windowMs: 60_000,
    max: 30,
    message: 'Bạn đang kiểm tra khung giáo án quá nhanh. Hãy chờ một chút rồi thử lại.'
  });
  if (!rate.allowed) return rate.response;

  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;

  const session = await requireActiveSession();
  if (!session.ok) return session.response;

  const parsed = await readJsonBody<any>(request, { maxBytes: 50_000, required: true });
  if (!parsed.ok) return parsed.response;

  const payload = parsed.body || {};
  const level = String(payload.level || '').trim();
  const grade = String(payload.grade || '').trim();
  const subject = String(payload.subject || '').trim();
  const book = String(payload.book || '').trim();
  const topicTitle = String(payload.topic || '').trim();
  const template = String(payload.template || '').trim();

  if (!level || !grade || !subject || !book || !topicTitle) {
    return NextResponse.json({ error: 'Thiếu level/grade/subject/book/topic để kiểm tra khung giáo án.' }, { status: 400 });
  }

  const topic = await contentRepository.getTopic(level, grade, subject, book, topicTitle, session.user);
  if (!topic) {
    return NextResponse.json({ error: 'Không tìm thấy topic/chủ đề trong dữ liệu hiện có.' }, { status: 404 });
  }

  const summary = await contentRepository.getCurriculumSummary(session.user);
  const coverage = summary.coverage.find((item) => item.grade === grade && item.subject === subject && item.book === book);
  const trace = analyzeAcademicTrace('topics', topic as any);
  const lessonContext = buildLessonContextProfile(payload.lessonContext);
  const pedagogyProfile = getLessonPedagogyProfile(grade, level);
  const gradeBlueprint = getGradeLessonBlueprint(grade, level);
  const technicalDraftingProfile = getLessonTechnicalDraftingProfile(grade, level);
  const releaseTier = coverage?.releaseTier || 'internal_preview';
  const supportLevel = coverage?.supportLevel || 'starter';

  const contentSafety = assessContentSafetyGate({
    sourceStatus: trace.sourceMeta.status,
    releaseTier,
    supportLevel,
    referenceCount: trace.referenceCount,
    fieldEvidenceCount: trace.fieldEvidenceCount
  });

  const teacherFrameReadiness = assessTeacherEditableFrameReadiness({
    level,
    grade,
    subject,
    book,
    topic: topicTitle,
    template,
    sourceStatus: trace.sourceMeta.status,
    releaseTier,
    supportLevel,
    referenceCount: trace.referenceCount,
    fieldEvidenceCount: trace.fieldEvidenceCount,
    lessonContext,
    pedagogyProfile,
    gradeBlueprint,
    technicalDraftingProfile,
    blockers: contentSafety.blockers,
    warnings: contentSafety.warnings
  });

  const publicTrust = evaluatePublicTrustReadiness({
    action: 'generate_lesson',
    sourceStatus: trace.sourceMeta.status,
    releaseTier,
    supportLevel,
    referenceCount: trace.referenceCount,
    fieldEvidenceCount: trace.fieldEvidenceCount,
    intendedClaims: []
  });

  return NextResponse.json({
    readiness: teacherFrameReadiness,
    publicTrust,
    contentSafety,
    sourceTrace: {
      sourceStatus: trace.sourceMeta.status,
      sourceLabel: trace.sourceMeta.sourceLabel,
      packId: trace.sourceMeta.packId,
      referenceCount: trace.referenceCount,
      fieldEvidenceCount: trace.fieldEvidenceCount,
      conflicts: trace.conflicts
    },
    context: lessonContext,
    frameLines: buildTeacherEditableFrameLines(teacherFrameReadiness),
    policy: {
      noAi: true,
      noDeepSubjectGenerationWhenUnverified: !teacherFrameReadiness.canUseDetailedSubjectContent,
      teacherMustVerifyBeforeExportOrSharing: true
    }
  });
}
