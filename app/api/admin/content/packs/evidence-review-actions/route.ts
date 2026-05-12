import { NextRequest, NextResponse } from 'next/server';
import { assertRuntimeRateLimit, assertWriteProtection, readJsonBody } from '@/lib/runtime-security';
import { getSessionUser } from '@/lib/auth';
import { assertLessonPermission } from '@/lib/access';
import { contentManagement } from '@/lib/content-management';
import type { ContentEntityKind } from '@/lib/types';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

function normalizeEntityType(value: unknown): Exclude<ContentEntityKind, 'templates'> | null {
  return value === 'topics' || value === 'programs' || value === 'questions' || value === 'rubrics' || value === 'resources'
    ? value
    : null;
}

function readSelector(source: URLSearchParams | Record<string, unknown>) {
  const packId = String(source instanceof URLSearchParams ? source.get('packId') || '' : source.packId || '').trim();
  const entityType = normalizeEntityType(source instanceof URLSearchParams ? source.get('entityType') : source.entityType);
  const entityId = String(source instanceof URLSearchParams ? source.get('entityId') || '' : source.entityId || '').trim();
  const field = String(source instanceof URLSearchParams ? source.get('field') || '' : source.field || '').trim();
  if (!packId || !entityType || !entityId || !field) return null;
  return { packId, entityType, entityId, field };
}

async function requirePermission(action: 'content:review' | 'content:publish') {
  const user = await getSessionUser();
  if (!user) {
    return { error: NextResponse.json({ error: 'Bạn cần đăng nhập trước khi thao tác evidence review.' }, { status: 401 }) };
  }
  if (!assertLessonPermission(user, action)) {
    return { error: NextResponse.json({ error: action === 'content:publish' ? 'Bạn không có quyền ký duyệt leader approval.' : 'Bạn không có quyền ghi reviewer decision.' }, { status: 403 }) };
  }
  return { user };
}

export async function GET(request: NextRequest) {
  const auth = await requirePermission('content:review');
  if (auth.error) return auth.error;
  const selector = readSelector(new URL(request.url).searchParams);
  if (!selector) return NextResponse.json({ error: 'Thiếu selector packId/entityType/entityId/field.' }, { status: 400 });
  const detail = await contentManagement.getAcademicEvidenceReviewFieldDetail(auth.user, selector);
  return NextResponse.json(detail);
}

export async function POST(request: NextRequest) {
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const rate = assertRuntimeRateLimit(request, 'admin_admin_content_packs_evidence_review_actions_write', { windowMs: 60_000, max: 20 });
  if (!rate.allowed) return rate.response;
  const parsed = await readJsonBody<any>(request, { maxBytes: 96000, required: false });
  if (!parsed.ok) return parsed.response;
  const body = parsed.body || {};
  const selector = readSelector(body || {});
  if (!selector) return NextResponse.json({ error: 'Thiếu selector packId/entityType/entityId/field.' }, { status: 400 });
  const action = String(body?.action || 'review');

  try {
    if (action === 'leader_approval' || action === 'leader_revoke') {
      const auth = await requirePermission('content:publish');
      if (auth.error) return auth.error;
      const result = await contentManagement.setAcademicEvidenceLeaderApprovalRecord({
        selector,
        actorName: auth.user!.name,
        actorRole: auth.user!.role,
        approved: action === 'leader_approval',
        note: body?.note ? String(body.note) : undefined
      });
      return NextResponse.json(result);
    }

    const auth = await requirePermission('content:review');
    if (auth.error) return auth.error;
    const decision = body?.decision === 'changes_requested' || body?.decision === 'commented' ? body.decision : 'approved';
    const result = await contentManagement.addAcademicEvidenceReviewerDecisionRecord({
      selector,
      actorName: auth.user!.name,
      actorRole: auth.user!.role,
      decision,
      note: body?.note ? String(body.note) : undefined,
      citationLocatorVerified: typeof body?.citationLocatorVerified === 'boolean' ? body.citationLocatorVerified : undefined,
      legalSafeVerified: typeof body?.legalSafeVerified === 'boolean' ? body.legalSafeVerified : undefined
    });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Không cập nhật được evidence review.' }, { status: 400 });
  }
}
