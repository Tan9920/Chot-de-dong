import { NextRequest, NextResponse } from 'next/server';
import { analyzeAcademicTrace } from '@/lib/academic-trace';
import { contentRepository } from '@/lib/content-repository';
import { evaluatePublicTrustReadiness, type PublicTrustAction } from '@/lib/public-trust-policy';
import { assertRuntimeRateLimit, assertWriteProtection, readJsonBody, requireActiveSession } from '@/lib/runtime-security';
import { recordSecurityAuditEvent } from '@/lib/security-audit-log';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const allowedActions = new Set<PublicTrustAction>([
  'generate_lesson',
  'export_docx',
  'export_pdf',
  'share_to_community',
  'publish_public',
  'school_release',
  'marketing_display'
]);

function normalizeAction(value: unknown): PublicTrustAction {
  const action = String(value || 'generate_lesson') as PublicTrustAction;
  return allowedActions.has(action) ? action : 'generate_lesson';
}

function normalizeClaims(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 20);
}

export async function POST(request: NextRequest) {
  const rate = assertRuntimeRateLimit(request, 'public_trust_readiness', {
    windowMs: 60_000,
    max: 40,
    message: 'Bạn đang kiểm tra public trust quá nhanh. Hãy chờ một chút rồi thử lại.'
  });
  if (!rate.allowed) return rate.response;

  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;

  const session = await requireActiveSession();
  if (!session.ok) return session.response;

  const parsed = await readJsonBody<any>(request, { maxBytes: 50_000, required: true });
  if (!parsed.ok) return parsed.response;

  const payload = parsed.body || {};
  const action = normalizeAction(payload.action);
  const level = String(payload.level || '').trim();
  const grade = String(payload.grade || '').trim();
  const subject = String(payload.subject || '').trim();
  const book = String(payload.book || '').trim();
  const topicTitle = String(payload.topic || '').trim();

  if (!level || !grade || !subject || !book || !topicTitle) {
    return NextResponse.json({ error: 'Thiếu level/grade/subject/book/topic để kiểm tra public trust.' }, { status: 400 });
  }

  const topic = await contentRepository.getTopic(level, grade, subject, book, topicTitle, session.user);
  if (!topic) {
    return NextResponse.json({ error: 'Không tìm thấy topic/chủ đề trong dữ liệu hiện có.' }, { status: 404 });
  }

  const summary = await contentRepository.getCurriculumSummary(session.user);
  const coverage = summary.coverage.find((item) => item.grade === grade && item.subject === subject && item.book === book);
  const trace = analyzeAcademicTrace('topics', topic as any);
  const report = evaluatePublicTrustReadiness({
    action,
    sourceStatus: trace.sourceMeta.status,
    releaseTier: coverage?.releaseTier || 'internal_preview',
    supportLevel: coverage?.supportLevel || 'starter',
    referenceCount: trace.referenceCount,
    fieldEvidenceCount: trace.fieldEvidenceCount,
    copyrightRisk: payload.copyrightRisk,
    moderationStatus: payload.moderationStatus,
    hasTakedownClaim: Boolean(payload.hasTakedownClaim),
    legalAssetReady: typeof payload.legalAssetReady === 'boolean' ? payload.legalAssetReady : undefined,
    teacherConfirmedSources: Boolean(payload.teacherConfirmedSources),
    intendedClaims: normalizeClaims(payload.intendedClaims),
    contextLabel: `${grade} · ${subject} · ${book} · ${topicTitle}`
  });

  await recordSecurityAuditEvent({
    eventType: 'public_trust_readiness_check',
    outcome: report.decision === 'blocked' ? 'failure' : 'success',
    severity: report.decision === 'blocked' ? 'warning' : 'info',
    actorName: session.user.name,
    actorRole: session.user.role,
    actorEmail: session.user.authAccountId || session.user.id || session.user.name,
    schoolKey: session.user.schoolKey,
    departmentKey: session.user.departmentKey,
    targetType: 'curriculum_topic',
    targetId: String((topic as any).id || topicTitle),
    request,
    metadata: {
      action: report.action,
      decision: report.decision,
      label: report.label,
      blockers: report.issues.filter((item) => item.severity === 'blocker').length
    }
  });

  return NextResponse.json({
    report,
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
      noOverclaimMarketing: true,
      noPublicWithoutModerationAndLegalGate: true,
      teacherMustVerifyBeforeOfficialUse: true,
      legalReviewIsRequiredForRightsClaims: true
    }
  });
}
