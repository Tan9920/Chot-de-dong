import { NextRequest, NextResponse } from 'next/server';
import { analyzeAcademicTrace } from '@/lib/academic-trace';
import { assessContentSafetyGate } from '@/lib/content-safety-gate';
import { contentRepository } from '@/lib/content-repository';
import { buildLessonContextProfile } from '@/lib/lesson-context';
import { assessTeacherEditableFrameReadiness } from '@/lib/teacher-lesson-frame';
import { buildReleaseDossier, buildReleaseDossierLines, saveReleaseDossierSnapshot, type ReleaseDossierAudience, type ReleaseDossierSubjectType } from '@/lib/release-dossier';
import { collectTrustedReleaseSignOffs } from '@/lib/release-signoff-workflow';
import { evaluatePublicTrustReadiness } from '@/lib/public-trust-policy';
import { assertRuntimeRateLimit, assertWriteProtection, readJsonBody, requireActiveSession } from '@/lib/runtime-security';
import { recordSecurityAuditEvent } from '@/lib/security-audit-log';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const subjectTypes = new Set<ReleaseDossierSubjectType>(['lesson_plan', 'community_resource', 'legal_asset', 'school_release', 'marketing_claim']);
const audiences = new Set<ReleaseDossierAudience>(['teacher_private', 'department_review', 'school_internal', 'public_community', 'public_marketing']);

function normalizeSubjectType(value: unknown): ReleaseDossierSubjectType {
  const text = String(value || 'lesson_plan') as ReleaseDossierSubjectType;
  return subjectTypes.has(text) ? text : 'lesson_plan';
}

function normalizeAudience(value: unknown): ReleaseDossierAudience {
  const text = String(value || 'teacher_private') as ReleaseDossierAudience;
  return audiences.has(text) ? text : 'teacher_private';
}

function normalizeClaims(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 20);
}

export async function POST(request: NextRequest) {
  const rate = assertRuntimeRateLimit(request, 'release_dossier_readiness', {
    windowMs: 60_000,
    max: 25,
    message: 'Bạn đang kiểm tra hồ sơ phát hành quá nhanh. Hãy chờ một chút rồi thử lại.'
  });
  if (!rate.allowed) return rate.response;

  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;

  const session = await requireActiveSession();
  if (!session.ok) return session.response;

  const parsed = await readJsonBody<any>(request, { maxBytes: 90_000, required: true });
  if (!parsed.ok) return parsed.response;

  const payload = parsed.body || {};
  const level = String(payload.level || '').trim();
  const grade = String(payload.grade || '').trim();
  const subject = String(payload.subject || '').trim();
  const book = String(payload.book || '').trim();
  const topicTitle = String(payload.topic || '').trim();

  if (!level || !grade || !subject || !book || !topicTitle) {
    return NextResponse.json({ error: 'Thiếu level/grade/subject/book/topic để lập release dossier.' }, { status: 400 });
  }

  const topic = await contentRepository.getTopic(level, grade, subject, book, topicTitle, session.user);
  if (!topic) {
    return NextResponse.json({ error: 'Không tìm thấy topic/chủ đề trong dữ liệu hiện có.' }, { status: 404 });
  }

  const summary = await contentRepository.getCurriculumSummary(session.user);
  const coverage = summary.coverage.find((item) => item.grade === grade && item.subject === subject && item.book === book);
  const trace = analyzeAcademicTrace('topics', topic as any);
  const releaseTier = coverage?.releaseTier || 'internal_preview';
  const supportLevel = coverage?.supportLevel || 'starter';
  const lessonContext = buildLessonContextProfile(payload.lessonContext);
  const contentSafety = assessContentSafetyGate({
    sourceStatus: trace.sourceMeta.status,
    releaseTier,
    supportLevel,
    referenceCount: trace.referenceCount,
    fieldEvidenceCount: trace.fieldEvidenceCount
  });
  const teacherFrame = assessTeacherEditableFrameReadiness({
    level,
    grade,
    subject,
    book,
    topic: topicTitle,
    template: String(payload.template || '').trim(),
    sourceStatus: trace.sourceMeta.status,
    releaseTier,
    supportLevel,
    referenceCount: trace.referenceCount,
    fieldEvidenceCount: trace.fieldEvidenceCount,
    lessonContext,
    blockers: contentSafety.blockers,
    warnings: contentSafety.warnings
  });
  const audience = normalizeAudience(payload.audience);
  const subjectType = normalizeSubjectType(payload.subjectType);
  const signOffWorkflow = await collectTrustedReleaseSignOffs({
    subjectType,
    audience,
    targetId: payload.targetId,
    level,
    grade,
    subject,
    book,
    topic: topicTitle,
    title: payload.title || ` ·  · `,
    schoolKey: payload.schoolKey || session.user.schoolKey,
    departmentKey: payload.departmentKey || session.user.departmentKey,
    contentHash: payload.contentHash
  });
  const publicTrust = evaluatePublicTrustReadiness({
    action: audience === 'public_marketing' ? 'marketing_display' : audience === 'public_community' ? 'publish_public' : 'export_docx',
    sourceStatus: trace.sourceMeta.status,
    releaseTier,
    supportLevel,
    referenceCount: trace.referenceCount,
    fieldEvidenceCount: trace.fieldEvidenceCount,
    hasTakedownClaim: Number(payload.activeTakedownClaimCount || 0) > 0,
    copyrightRisk: payload.copyrightRisk,
    legalAssetReady: Number(payload.legalAssetCount || 0) ? Number(payload.legalAssetReadyCount || 0) >= Number(payload.legalAssetCount || 0) : undefined,
    teacherConfirmedSources: Boolean(payload.teacherConfirmedSources),
    intendedClaims: normalizeClaims(payload.intendedClaims),
    contextLabel: `${grade} · ${subject} · ${book} · ${topicTitle}`
  });

  const dossier = buildReleaseDossier({
    subjectType,
    audience,
    level,
    grade,
    subject,
    book,
    topic: topicTitle,
    title: payload.title || `${grade} · ${subject} · ${topicTitle}`,
    sourceStatus: trace.sourceMeta.status,
    releaseTier,
    supportLevel,
    referenceCount: trace.referenceCount,
    fieldEvidenceCount: trace.fieldEvidenceCount,
    legalAssetCount: Number(payload.legalAssetCount || 0),
    legalAssetReadyCount: Number(payload.legalAssetReadyCount || 0),
    communityResourceCount: Number(payload.communityResourceCount || 0),
    communityResourcesPublicReady: Number(payload.communityResourcesPublicReady || 0),
    activeTakedownClaimCount: Number(payload.activeTakedownClaimCount || 0),
    copyrightRisk: payload.copyrightRisk,
    teacherConfirmedSources: Boolean(payload.teacherConfirmedSources),
    teacherConfirmedNoLongCopyrightCopy: Boolean(payload.teacherConfirmedNoLongCopyrightCopy),
    teacherConfirmedClassroomContext: Boolean(payload.teacherConfirmedClassroomContext),
    teacherConfirmedAssessmentEvidence: Boolean(payload.teacherConfirmedAssessmentEvidence),
    hasCalculatorGuidance: Boolean(payload.hasCalculatorGuidance),
    calculatorGuidanceApproved: Boolean(payload.calculatorGuidanceApproved),
    hasImagesOrExternalMaterials: Boolean(payload.hasImagesOrExternalMaterials),
    mediaProvenanceComplete: Boolean(payload.mediaProvenanceComplete),
    intendedClaims: normalizeClaims(payload.intendedClaims),
    signOffs: signOffWorkflow.trustedSignOffs,
    publicTrustReport: publicTrust
  });

  let snapshot = null;
  if (payload.persistSnapshot === true) {
    snapshot = await saveReleaseDossierSnapshot(dossier, session.user);
  }

  await recordSecurityAuditEvent({
    eventType: 'release_dossier_readiness_check',
    outcome: dossier.issues.some((item) => item.severity === 'blocker') ? 'blocked' : 'success',
    severity: dossier.issues.some((item) => item.severity === 'blocker') ? 'warning' : 'info',
    actorName: session.user.name,
    actorRole: session.user.role,
    actorEmail: session.user.authAccountId || session.user.id || session.user.name,
    schoolKey: session.user.schoolKey,
    departmentKey: session.user.departmentKey,
    targetType: 'release_dossier',
    targetId: dossier.id,
    request,
    metadata: {
      audience: dossier.audience,
      decision: dossier.decision,
      blockers: dossier.issues.filter((item) => item.severity === 'blocker').length,
      snapshotSaved: Boolean(snapshot),
      signOffWorkflowId: signOffWorkflow.workflowId,
      trustedSignOffStatus: signOffWorkflow.status,
      trustedSignOffTargetKey: signOffWorkflow.targetKey,
      contentHash: signOffWorkflow.contentHash,
      contentHashSource: signOffWorkflow.contentHashSource,
      staleWorkflowCount: signOffWorkflow.staleWorkflowCount,
      clientSuppliedSignOffsIgnored: true
    }
  });

  return NextResponse.json({
    dossier,
    dossierLines: buildReleaseDossierLines(dossier),
    snapshot,
    contentSafety,
    teacherFrame,
    signOffWorkflow,
    sourceTrace: {
      sourceStatus: trace.sourceMeta.status,
      sourceLabel: trace.sourceMeta.sourceLabel,
      packId: trace.sourceMeta.packId,
      referenceCount: trace.referenceCount,
      fieldEvidenceCount: trace.fieldEvidenceCount,
      conflicts: trace.conflicts
    },
    policy: {
      noFakeKnowledge: true,
      noFakeVerifiedData: true,
      noOverclaimMarketing: true,
      legalReviewDoesNotEqualLegalGuarantee: true,
      teacherMustVerifyBeforeOfficialUse: true,
      clientSuppliedSignOffsIgnored: true,
      signOffRequiresServerSideWorkflow: true,
      targetKeyIncludesAudienceAndScope: true,
      teacherOwnerRequiresOwnershipCheck: true,
      serverDerivedContentHashWhenPossible: true,
      clientContentHashIgnoredWhenTargetResolvable: true,
      contentHashChangeRequiresFreshSignOff: true
    }
  });
}
