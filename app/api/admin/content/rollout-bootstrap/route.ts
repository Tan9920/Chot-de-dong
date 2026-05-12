import { NextRequest, NextResponse } from 'next/server';
import { assertRuntimeRateLimit, assertWriteProtection, readJsonBody } from '@/lib/runtime-security';
import { getSessionUser } from '@/lib/auth';
import { assertLessonPermission } from '@/lib/access';
import { contentManagement } from '@/lib/content-management';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Bạn cần đăng nhập trước khi xem rollout bootstrap kit.' }, { status: 401 });
  if (!assertLessonPermission(user, 'content:manage')) {
    return NextResponse.json({ error: 'Chỉ tổ trưởng/chuyên môn hoặc quản trị mới được xem rollout bootstrap kit.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const waveId = searchParams.get('waveId') || undefined;
  const kit = await contentManagement.getAcademicRolloutBootstrapKit({ waveId });
  return NextResponse.json({ kit });
}

export async function POST(request: NextRequest) {
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Bạn cần đăng nhập trước khi apply rollout bootstrap.' }, { status: 401 });
  if (!assertLessonPermission(user, 'content:manage')) {
    return NextResponse.json({ error: 'Chỉ tổ trưởng/chuyên môn hoặc quản trị mới được apply rollout bootstrap.' }, { status: 403 });
  }

  const rate = assertRuntimeRateLimit(request, 'admin_admin_content_rollout_bootstrap_write', { windowMs: 60_000, max: 20 });
  if (!rate.allowed) return rate.response;
  const parsed = await readJsonBody<any>(request, { maxBytes: 512000, required: false });
  if (!parsed.ok) return parsed.response;
  const body = parsed.body || {};
  const waveId = body?.waveId ? String(body.waveId) : undefined;
  const result = await contentManagement.applyAcademicRolloutBootstrap({ waveId });
  return NextResponse.json(result);
}
