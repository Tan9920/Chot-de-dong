import { NextRequest, NextResponse } from 'next/server';
import { assertRuntimeRateLimit, assertWriteProtection, readJsonBody } from '@/lib/runtime-security';
import { getSessionUser } from '@/lib/auth';
import { assertLessonPermission } from '@/lib/access';
import { contentManagement } from '@/lib/content-management';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

function readPackId(source: URLSearchParams | Record<string, unknown>) {
  const packId = String(source instanceof URLSearchParams ? source.get('packId') || '' : source.packId || '').trim();
  return packId || null;
}

async function requirePermission(action: 'content:review' | 'content:publish') {
  const user = await getSessionUser();
  if (!user) {
    return { error: NextResponse.json({ error: 'Bạn cần đăng nhập trước khi thao tác evidence review ở cấp pack.' }, { status: 401 }) };
  }
  if (!assertLessonPermission(user, action)) {
    return {
      error: NextResponse.json({
        error: action === 'content:publish'
          ? 'Bạn không có quyền ký/gỡ leader approval hàng loạt.'
          : 'Bạn không có quyền thao tác reviewer batch ở cấp pack.'
      }, { status: 403 })
    };
  }
  return { user };
}

export async function GET(request: NextRequest) {
  const auth = await requirePermission('content:review');
  if (auth.error) return auth.error;
  const packId = readPackId(new URL(request.url).searchParams);
  if (!packId) return NextResponse.json({ error: 'Thiếu packId.' }, { status: 400 });
  const detail = await contentManagement.getAcademicEvidenceReviewPackDetail(auth.user, { packId });
  return NextResponse.json(detail);
}

export async function POST(request: NextRequest) {
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const rate = assertRuntimeRateLimit(request, 'admin_admin_content_packs_evidence_review_pack_actions_write', { windowMs: 60_000, max: 20 });
  if (!rate.allowed) return rate.response;
  const parsed = await readJsonBody<any>(request, { maxBytes: 96000, required: false });
  if (!parsed.ok) return parsed.response;
  const body = parsed.body || {};
  const packId = readPackId(body || {});
  if (!packId) return NextResponse.json({ error: 'Thiếu packId.' }, { status: 400 });
  const action = String(body?.action || 'review_missing_my_decision');

  try {
    if (action === 'leader_approve_ready' || action === 'leader_revoke_all') {
      const auth = await requirePermission('content:publish');
      if (auth.error) return auth.error;
      const result = await contentManagement.setAcademicEvidenceLeaderApprovalBatchRecord({
        packId,
        actorName: auth.user!.name,
        actorRole: auth.user!.role,
        approved: action === 'leader_approve_ready',
        note: body?.note ? String(body.note) : undefined
      });
      return NextResponse.json(result);
    }

    const auth = await requirePermission('content:review');
    if (auth.error) return auth.error;
    const decision = body?.decision === 'changes_requested' || body?.decision === 'commented' ? body.decision : 'approved';
    const result = await contentManagement.addAcademicEvidenceReviewerDecisionBatchRecord({
      packId,
      actorName: auth.user!.name,
      actorRole: auth.user!.role,
      decision,
      note: body?.note ? String(body.note) : undefined,
      citationLocatorVerified: typeof body?.citationLocatorVerified === 'boolean' ? body.citationLocatorVerified : undefined,
      legalSafeVerified: typeof body?.legalSafeVerified === 'boolean' ? body.legalSafeVerified : undefined
    });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Không cập nhật được evidence review stage ở cấp pack.' }, { status: 400 });
  }
}
