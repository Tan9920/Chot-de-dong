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

async function requirePermission(action: 'content:manage' | 'content:review' | 'content:publish' | 'admin_only') {
  const user = await getSessionUser();
  if (!user) {
    return { error: NextResponse.json({ error: 'Bạn cần đăng nhập trước khi thao tác pack curation.' }, { status: 401 }) };
  }
  if (action === 'admin_only') {
    if (user.role !== 'admin') {
      return { error: NextResponse.json({ error: 'Chỉ quản trị viên mới được ký admin approval.' }, { status: 403 }) };
    }
    return { user };
  }
  if (!assertLessonPermission(user, action)) {
    return {
      error: NextResponse.json({
        error: action === 'content:publish'
          ? 'Bạn không có quyền thao tác leader/release recommendation ở cấp pack.'
          : 'Bạn không có quyền ghi reviewer decision ở cấp pack.'
      }, { status: 403 })
    };
  }
  return { user };
}

export async function GET(request: NextRequest) {
  const auth = await requirePermission('content:manage');
  if (auth.error) return auth.error;
  const packId = readPackId(new URL(request.url).searchParams);
  if (!packId) return NextResponse.json({ error: 'Thiếu packId.' }, { status: 400 });
  const detail = await contentManagement.getAcademicPackCurationDetail(auth.user, { packId });
  return NextResponse.json(detail);
}

export async function POST(request: NextRequest) {
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const rate = assertRuntimeRateLimit(request, 'admin_admin_content_packs_curation_actions_write', { windowMs: 60_000, max: 20 });
  if (!rate.allowed) return rate.response;
  const parsed = await readJsonBody<any>(request, { maxBytes: 96000, required: false });
  if (!parsed.ok) return parsed.response;
  const body = parsed.body || {};
  const packId = readPackId(body || {});
  if (!packId) return NextResponse.json({ error: 'Thiếu packId.' }, { status: 400 });
  const action = String(body?.action || 'review');

  try {
    if (action === 'admin_approval' || action === 'admin_revoke') {
      const auth = await requirePermission('admin_only');
      if (auth.error) return auth.error;
      const result = await contentManagement.setAcademicPackAdminApprovalRecord({
        packId,
        actorName: auth.user!.name,
        actorRole: auth.user!.role,
        approved: action === 'admin_approval',
        note: body?.note ? String(body.note) : undefined
      });
      return NextResponse.json(result);
    }

    if (action === 'leader_approval' || action === 'leader_revoke' || action === 'release_recommendation') {
      const auth = await requirePermission('content:publish');
      if (auth.error) return auth.error;
      if (action === 'release_recommendation') {
        const recommendation = body?.recommendation === 'verified_release' || body?.recommendation === 'school_release_candidate' ? body.recommendation : 'hold';
        const result = await contentManagement.setAcademicPackReleaseRecommendationRecord({
          packId,
          actorName: auth.user!.name,
          actorRole: auth.user!.role,
          recommendation,
          note: body?.note ? String(body.note) : undefined
        });
        return NextResponse.json(result);
      }
      const result = await contentManagement.setAcademicPackLeaderApprovalRecord({
        packId,
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
    const result = await contentManagement.addAcademicPackReviewerDecisionRecord({
      packId,
      actorName: auth.user!.name,
      actorRole: auth.user!.role,
      decision,
      note: body?.note ? String(body.note) : undefined
    });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Không cập nhật được pack curation.' }, { status: 400 });
  }
}
