import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { assertLessonPermission } from '@/lib/access';
import { contentManagement } from '@/lib/content-management';
import { assertRuntimeRateLimit, assertWriteProtection, readJsonBody } from '@/lib/runtime-security';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

async function requireManager(permission: 'content:manage' | 'content:import' = 'content:manage') {
  const user = await getSessionUser();
  if (!user) return { error: NextResponse.json({ error: 'Bạn cần đăng nhập trước khi quản trị official source bootstrap.' }, { status: 401 }) };
  if (!assertLessonPermission(user, permission)) {
    return { error: NextResponse.json({ error: 'Bạn không có quyền quản trị official source bootstrap.' }, { status: 403 }) };
  }
  return { user };
}

export async function GET(request: NextRequest) {
  const auth = await requireManager('content:manage');
  if (auth.error) return auth.error;
  const { searchParams } = new URL(request.url);
  const packId = searchParams.get('packId') || undefined;
  const grade = searchParams.get('grade') || undefined;
  const applyRequested = searchParams.get('apply') === 'true';

  if (applyRequested) {
    return NextResponse.json({
      error: 'GET /official-source-bootstrap chỉ được dùng để preview. Thao tác apply phải dùng POST kèm CSRF token.',
      previewOnly: true
    }, { status: 405, headers: { Allow: 'GET, POST' } });
  }

  const [preview, coverage] = await Promise.all([
    contentManagement.getOfficialSourceBootstrapPreview({ packId, grade }),
    contentManagement.getOfficialSourceBootstrapCoverageSummary()
  ]);
  return NextResponse.json({ preview, coverage, previewOnly: true });
}

export async function POST(request: NextRequest) {
  const auth = await requireManager('content:import');
  if (auth.error) return auth.error;
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const rate = assertRuntimeRateLimit(request, 'admin_official_source_bootstrap_write', { windowMs: 60_000, max: 12 });
  if (!rate.allowed) return rate.response;
  const parsed = await readJsonBody<any>(request, { maxBytes: 96_000, required: false });
  if (!parsed.ok) return parsed.response;
  const body = parsed.body || {};
  const packId = body?.packId ? String(body.packId) : undefined;
  const grade = body?.grade ? String(body.grade) : undefined;
  const apply = body?.apply !== false;
  const result = apply
    ? await contentManagement.applyOfficialAcademicSourceBootstrap({ packId, grade })
    : await contentManagement.getOfficialSourceBootstrapPreview({ packId, grade });
  return NextResponse.json(result);
}
