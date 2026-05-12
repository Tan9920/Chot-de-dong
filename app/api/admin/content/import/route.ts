import { NextRequest, NextResponse } from 'next/server';
import { assertRuntimeRateLimit, assertWriteProtection, readJsonBody } from '@/lib/runtime-security';
import { getSessionUser } from '@/lib/auth';
import { assertLessonPermission } from '@/lib/access';
import { contentManagement } from '@/lib/content-management';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function POST(request: NextRequest) {
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Bạn cần đăng nhập trước khi import kho nội dung.' }, { status: 401 });
  if (!assertLessonPermission(user, 'content:import')) {
    return NextResponse.json({ error: 'Chỉ tổ trưởng/chuyên môn hoặc quản trị mới được import kho nội dung.' }, { status: 403 });
  }

  const rate = assertRuntimeRateLimit(request, 'admin_admin_content_import_write', { windowMs: 60_000, max: 20 });
  if (!rate.allowed) return rate.response;
  const parsed = await readJsonBody<any>(request, { maxBytes: 512000, required: false });
  if (!parsed.ok) return parsed.response;
  const body = parsed.body || {};
  const manifest = contentManagement.parseManifest(body?.manifest ?? body);
  const result = await contentManagement.importManifest({
    target: body?.target === 'database' || body?.target === 'json' ? body.target : 'auto',
    manifest,
    actorName: user.name,
    actorRole: user.role,
    dryRun: Boolean(body?.dryRun)
  });

  const status = result.preview.valid ? 200 : 400;
  return NextResponse.json(result, { status });
}
