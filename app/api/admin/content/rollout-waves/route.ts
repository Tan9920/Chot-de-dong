import { NextRequest, NextResponse } from 'next/server';
import { assertRuntimeRateLimit, assertWriteProtection, readJsonBody } from '@/lib/runtime-security';
import { getSessionUser } from '@/lib/auth';
import { assertLessonPermission } from '@/lib/access';
import { contentManagement } from '@/lib/content-management';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Bạn cần đăng nhập trước khi xem rollout waves.' }, { status: 401 });
  if (!assertLessonPermission(user, 'content:manage')) {
    return NextResponse.json({ error: 'Chỉ tổ trưởng/chuyên môn hoặc quản trị mới được xem rollout waves.' }, { status: 403 });
  }

  const summary = await contentManagement.getAcademicRolloutWaveSummary();
  return NextResponse.json({ summary });
}

export async function POST(request: NextRequest) {
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Bạn cần đăng nhập trước khi import rollout waves.' }, { status: 401 });
  if (!assertLessonPermission(user, 'content:manage')) {
    return NextResponse.json({ error: 'Chỉ tổ trưởng/chuyên môn hoặc quản trị mới được import rollout waves.' }, { status: 403 });
  }

  const rate = assertRuntimeRateLimit(request, 'admin_admin_content_rollout_waves_write', { windowMs: 60_000, max: 20 });
  if (!rate.allowed) return rate.response;
  const parsed = await readJsonBody<any>(request, { maxBytes: 512000, required: false });
  if (!parsed.ok) return parsed.response;
  const body = parsed.body || {};
  const payload = body?.payload ?? body;
  const apply = Boolean(body?.apply);
  const result = apply
    ? await contentManagement.importAcademicRolloutWaveRegistry({ payload, apply: true })
    : await contentManagement.previewAcademicRolloutWaveRegistryImport(payload);

  return NextResponse.json(result);
}
