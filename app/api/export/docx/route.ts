import { NextRequest, NextResponse } from 'next/server';
import { getSchoolSettings } from '@/lib/storage';
import { assertOperatingUsageAllowed, applyOperatingExportPolicy, recordOperatingUsage } from '@/lib/operating-runtime';
import type { LessonExportPayload, SessionUser } from '@/lib/types';
import { buildGuardedExportPayload } from '@/lib/export-guard';
import { buildExportFilename, generateDocxBuffer, normalizeExportPayload } from '@/lib/exporter';
import { assertRuntimeRateLimit, assertWriteProtection, readJsonBody, requireRealAccountSession } from '@/lib/runtime-security';
import { recordSecurityAuditEvent } from '@/lib/security-audit-log';
import { enforceReleaseDossierForExport, extractReleaseDossierFlags } from '@/lib/release-dossier-enforcement';
import { resolveLessonExportPayload } from '@/lib/export-saved-lesson';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

function getPayloadFromSearch(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  return normalizeExportPayload({
    title: searchParams.get('title') || undefined,
    level: searchParams.get('level') || undefined,
    grade: searchParams.get('grade') || undefined,
    subject: searchParams.get('subject') || undefined,
    book: searchParams.get('book') || undefined,
    topic: searchParams.get('topic') || undefined,
    template: searchParams.get('template') || undefined,
    methods: (searchParams.get('methods') || '').split(',').filter(Boolean),
    techniques: (searchParams.get('techniques') || '').split(',').filter(Boolean),
    content: searchParams.get('content') || undefined,
    packId: searchParams.get('packId') || undefined,
    lessonStatus: (searchParams.get('lessonStatus') as LessonExportPayload['lessonStatus']) || 'unsaved',
    lessonId: searchParams.get('lessonId') || searchParams.get('savedLessonId') || undefined
  });
}

async function emitDocx(input: ReturnType<typeof normalizeExportPayload>, user: SessionUser, request: NextRequest) {
  const action = 'export_docx' as const;
  const quotaGate = await assertOperatingUsageAllowed(user, action, 1);
  if (!quotaGate.allowed) {
    await recordSecurityAuditEvent({
      eventType: 'export_docx',
      outcome: 'blocked',
      severity: 'warning',
      actorName: user.name,
      actorRole: user.role,
      schoolKey: user.schoolKey,
      departmentKey: user.departmentKey,
      reason: 'quota_blocked',
      request,
      metadata: { plan: quotaGate.plan, used: quotaGate.used, limit: quotaGate.limit }
    });
    return NextResponse.json({ error: quotaGate.error, entitlement: { plan: quotaGate.plan, used: quotaGate.used, limit: quotaGate.limit } }, { status: quotaGate.status });
  }

  const settings = await getSchoolSettings();
  const guarded = await buildGuardedExportPayload(input, settings, user.name);
  const operatingGuarded = await applyOperatingExportPolicy(guarded, user, 'docx');
  const releaseDossierGate = await enforceReleaseDossierForExport(operatingGuarded, user, 'docx', extractReleaseDossierFlags(input));
  const { payload, buffer } = await generateDocxBuffer(releaseDossierGate.target);

  await recordOperatingUsage({
    user,
    action,
    quantity: 1,
    scope: { level: payload.level, grade: payload.grade, subject: payload.subject, book: payload.book, topic: payload.topic },
    note: `Xuất DOCX theo quota operating runtime; release dossier decision=${releaseDossierGate.summary.decision}, snapshot=${releaseDossierGate.snapshotId || 'none'}.`
  });

  await recordSecurityAuditEvent({
    eventType: 'export_docx',
    outcome: 'success',
    actorName: user.name,
    actorRole: user.role,
    schoolKey: user.schoolKey,
    departmentKey: user.departmentKey,
    request,
    metadata: { grade: payload.grade, subject: payload.subject, lessonStatus: payload.lessonStatus, releaseDossierDecision: releaseDossierGate.summary.decision, releaseDossierSnapshotId: releaseDossierGate.snapshotId, downgradedToDraft: releaseDossierGate.downgradedToDraft, releaseDossierBlockers: releaseDossierGate.summary.blockerCount }
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${buildExportFilename(payload, 'docx')}"`
    }
  });
}

export async function GET() {
  return NextResponse.json({ error: 'Xuất DOCX qua GET đã bị tắt để tránh CSRF/quota abuse. Hãy dùng POST kèm CSRF token.' }, { status: 405 });
}

export async function POST(request: NextRequest) {
  const session = await requireRealAccountSession('xuất DOCX', request);
  if (!session.ok) return session.response;
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const rate = assertRuntimeRateLimit(request, 'export_docx', { windowMs: 60_000, max: 20 });
  if (!rate.allowed) return rate.response;
  const parsed = await readJsonBody(request, { maxBytes: 140_000, required: true });
  if (!parsed.ok) return parsed.response;
  const resolved = await resolveLessonExportPayload(parsed.body, session.user);
  if (!resolved.ok) return NextResponse.json({ error: resolved.error, detail: resolved.detail }, { status: resolved.status });
  return emitDocx(normalizeExportPayload(resolved.payload), session.user, request);
}
