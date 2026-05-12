import { NextRequest, NextResponse } from 'next/server';
import {
  buildReleaseSignOffTargetKey,
  collectTrustedReleaseSignOffs,
  readReleaseSignOffWorkflows,
  recordReleaseSignOffDecision,
  requiredSignOffRolesForTarget
} from '@/lib/release-signoff-workflow';
import { assertRuntimeRateLimit, assertWriteProtection, readJsonBody, requireActiveSession } from '@/lib/runtime-security';
import { recordSecurityAuditEvent } from '@/lib/security-audit-log';
import type { ReleaseDossierAudience, ReleaseDossierSubjectType } from '@/lib/release-dossier';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const subjectTypes = new Set<ReleaseDossierSubjectType>(['lesson_plan', 'community_resource', 'legal_asset', 'school_release', 'marketing_claim']);
const audiences = new Set<ReleaseDossierAudience>(['teacher_private', 'department_review', 'school_internal', 'public_community', 'public_marketing']);

function boundedText(value: unknown, fallback = '', maxLength = 600) {
  return String(value ?? fallback).trim().slice(0, maxLength);
}

function normalizeSubjectType(value: unknown): ReleaseDossierSubjectType {
  const text = boundedText(value, 'lesson_plan', 80) as ReleaseDossierSubjectType;
  return subjectTypes.has(text) ? text : 'lesson_plan';
}

function normalizeAudience(value: unknown): ReleaseDossierAudience {
  const text = boundedText(value, 'teacher_private', 80) as ReleaseDossierAudience;
  return audiences.has(text) ? text : 'teacher_private';
}

function targetFromPayload(payload: any) {
  return {
    subjectType: normalizeSubjectType(payload?.subjectType),
    audience: normalizeAudience(payload?.audience),
    targetId: payload?.targetId ? boundedText(payload.targetId, '', 180) : undefined,
    title: payload?.title ? boundedText(payload.title, '', 240) : undefined,
    level: payload?.level ? boundedText(payload.level, '', 80) : undefined,
    grade: payload?.grade ? boundedText(payload.grade, '', 80) : undefined,
    subject: payload?.subject ? boundedText(payload.subject, '', 120) : undefined,
    book: payload?.book ? boundedText(payload.book, '', 160) : undefined,
    topic: payload?.topic ? boundedText(payload.topic, '', 240) : undefined,
    schoolKey: payload?.schoolKey ? boundedText(payload.schoolKey, '', 160) : undefined,
    departmentKey: payload?.departmentKey ? boundedText(payload.departmentKey, '', 160) : undefined,
    contentHash: payload?.contentHash ? boundedText(payload.contentHash, '', 160) : undefined
  };
}

function releaseSignOffPolicy() {
  return {
    clientSuppliedSignOffsIgnored: true,
    signerMustBeAuthenticated: true,
    reviewerRolesRequireServerSidePermission: true,
    targetKeyIncludesAudienceAndScope: true,
    teacherOwnerRequiresOwnershipCheck: true,
    serverDerivedContentHashWhenPossible: true,
    clientContentHashIgnoredWhenTargetResolvable: true,
    contentHashChangeRequiresFreshSignOff: true,
    jsonFallbackNotImmutableAudit: true
  };
}

export async function GET(request: NextRequest) {
  const session = await requireActiveSession('Bạn cần đăng nhập để xem sign-off release dossier.');
  if (!session.ok) return session.response;
  const rate = assertRuntimeRateLimit(request, 'release_dossier_signoff_read', { windowMs: 60_000, max: 60 });
  if (!rate.allowed) return rate.response;

  const { searchParams } = new URL(request.url);
  const target = targetFromPayload({
    subjectType: searchParams.get('subjectType'),
    audience: searchParams.get('audience'),
    targetId: searchParams.get('targetId'),
    title: searchParams.get('title'),
    level: searchParams.get('level'),
    grade: searchParams.get('grade'),
    subject: searchParams.get('subject'),
    book: searchParams.get('book'),
    topic: searchParams.get('topic'),
    schoolKey: searchParams.get('schoolKey') || session.user.schoolKey,
    departmentKey: searchParams.get('departmentKey') || session.user.departmentKey,
    contentHash: searchParams.get('contentHash')
  });
  const summary = await collectTrustedReleaseSignOffs(target);
  const targetKey = summary.targetKey;
  const workflows = await readReleaseSignOffWorkflows();
  const matching = workflows.filter((item) => {
    if (item.targetKey !== targetKey) return false;
    if (session.user.role === 'admin') return true;
    if (item.schoolKey && item.schoolKey !== session.user.schoolKey) return false;
    if (session.user.role === 'leader' && item.departmentKey && item.departmentKey !== session.user.departmentKey) return false;
    return true;
  });

  return NextResponse.json({
    targetKey,
    requiredRoles: requiredSignOffRolesForTarget(target),
    workflows: matching,
    summary,
    policy: releaseSignOffPolicy()
  });
}

export async function POST(request: NextRequest) {
  const session = await requireActiveSession('Bạn cần đăng nhập để ký release dossier.');
  if (!session.ok) return session.response;
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const rate = assertRuntimeRateLimit(request, 'release_dossier_signoff_write', {
    windowMs: 60_000,
    max: 18,
    message: 'Bạn đang ký release dossier quá nhanh. Hãy chờ một chút rồi thử lại.'
  });
  if (!rate.allowed) return rate.response;
  const parsed = await readJsonBody<any>(request, { maxBytes: 24_000, required: true });
  if (!parsed.ok) return parsed.response;

  const payload = parsed.body || {};
  const target = targetFromPayload(payload);
  try {
    const result = await recordReleaseSignOffDecision(
      {
        ...target,
        schoolKey: target.schoolKey || session.user.schoolKey,
        departmentKey: target.departmentKey || session.user.departmentKey,
        dossierSnapshotId: payload.dossierSnapshotId ? boundedText(payload.dossierSnapshotId, '', 180) : undefined
      },
      { role: payload.role, decision: payload.decision, note: payload.note },
      session.user
    );
    await recordSecurityAuditEvent({
      eventType: 'release_dossier_signoff',
      outcome: result.decision.decision === 'rejected' ? 'blocked' : 'success',
      severity: result.decision.decision === 'approved' ? 'info' : 'warning',
      actorName: session.user.name,
      actorRole: session.user.role,
      actorEmail: session.user.authAccountId || session.user.id || session.user.name,
      schoolKey: session.user.schoolKey,
      departmentKey: session.user.departmentKey,
      targetType: 'release_signoff_workflow',
      targetId: result.workflow.id,
      request,
      metadata: {
        targetKey: result.workflow.targetKey,
        subjectType: result.workflow.subjectType,
        audience: result.workflow.audience,
        role: result.decision.role,
        decision: result.decision.decision,
        workflowStatus: result.workflow.status,
        serverSideTrustedSignOff: true,
        targetKeyIncludesAudienceAndScope: true,
        teacherOwnerRequiresOwnershipCheck: true,
        contentHash: result.workflow.contentHash,
        contentHashSource: result.workflow.contentHashSource,
        supersededWorkflowIds: result.supersededWorkflowIds,
      }
    });
    return NextResponse.json(result);
  } catch (error: any) {
    await recordSecurityAuditEvent({
      eventType: 'release_dossier_signoff',
      outcome: 'failure',
      severity: 'warning',
      actorName: session.user.name,
      actorRole: session.user.role,
      actorEmail: session.user.authAccountId || session.user.id || session.user.name,
      schoolKey: session.user.schoolKey,
      departmentKey: session.user.departmentKey,
      targetType: 'release_signoff_workflow',
      targetId: buildReleaseSignOffTargetKey({ ...target, schoolKey: target.schoolKey || session.user.schoolKey, departmentKey: target.departmentKey || session.user.departmentKey }),
      reason: error?.message || 'signoff_failed',
      request
    });
    return NextResponse.json({ error: error?.message || 'Không ký được release dossier.', policy: releaseSignOffPolicy() }, { status: 403 });
  }
}
