import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { assertLessonPermission } from '@/lib/access';
import { contentRepository } from '@/lib/content-repository';
import { contentManagement } from '@/lib/content-management';
import { assertRuntimeRateLimit, assertWriteProtection, readJsonBody } from '@/lib/runtime-security';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  const [overview, summary, adminSummary, imports] = await Promise.all([
    contentRepository.overview(),
    contentRepository.getCurriculumSummary(),
    contentManagement.getSummary(),
    contentManagement.listImportBatches()
  ]);
  return NextResponse.json({ overview, summary, adminSummary, imports });
}

export async function POST(request: NextRequest) {
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const rate = assertRuntimeRateLimit(request, 'content_import', { windowMs: 60_000, max: 10 });
  if (!rate.allowed) return rate.response;
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Bạn cần đăng nhập trước khi đồng bộ kho dữ liệu.' }, { status: 401 });
  }
  if (!assertLessonPermission(user, 'content:import')) {
    return NextResponse.json({ error: 'Chỉ tổ trưởng/chuyên môn hoặc quản trị mới được đồng bộ kho dữ liệu.' }, { status: 403 });
  }

  const parsed = await readJsonBody<any>(request, { maxBytes: 240_000, required: false });
  if (!parsed.ok) return parsed.response;
  const body = parsed.body || {};
  const target = body?.target === 'database' || body?.target === 'json' ? body.target : 'auto';

  try {
    if (body?.manifest) {
      const manifest = contentManagement.parseManifest(body.manifest);
      const result = await contentManagement.importManifest({
        target,
        manifest,
        actorName: user.name,
        actorRole: user.role,
        dryRun: Boolean(body?.dryRun)
      });
      return NextResponse.json(result, { status: result.preview.valid ? 200 : 400 });
    }

    const result = await contentRepository.importSeedContent(target, user.name);
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Không đồng bộ được kho dữ liệu.' }, { status: 400 });
  }
}
