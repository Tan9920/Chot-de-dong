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
  if (!user) return NextResponse.json({ error: 'Bạn cần đăng nhập trước khi import academic dossier.' }, { status: 401 });
  if (!assertLessonPermission(user, 'content:import')) {
    return NextResponse.json({ error: 'Chỉ tổ trưởng/chuyên môn hoặc quản trị mới được import academic dossier.' }, { status: 403 });
  }

  const rate = assertRuntimeRateLimit(request, 'admin_admin_content_dossiers_import_write', { windowMs: 60_000, max: 20 });
  if (!rate.allowed) return rate.response;
  const parsed = await readJsonBody<any>(request, { maxBytes: 512000, required: false });
  if (!parsed.ok) return parsed.response;
  const body = parsed.body || {};
  const target = body?.target === 'database' || body?.target === 'json' ? body.target : 'auto';
  const dryRun = body?.dryRun !== false;
  const result = await contentManagement.importAcademicDossierTemplate({
    template: body?.template ?? body,
    target,
    actorName: user.name,
    actorRole: user.role,
    viewer: user,
    dryRun
  });

  const valid = result?.dossierPreview?.valid !== false;
  const importPreviewValid = 'preview' in result ? result.preview.valid : valid;
  const status = dryRun ? (valid ? 200 : 400) : (importPreviewValid ? 200 : 400);
  return NextResponse.json(result, { status });
}
