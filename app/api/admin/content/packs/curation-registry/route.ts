import { NextRequest, NextResponse } from 'next/server';
import { assertRuntimeRateLimit, assertWriteProtection, readJsonBody } from '@/lib/runtime-security';
import { getSessionUser } from '@/lib/auth';
import { assertLessonPermission } from '@/lib/access';
import { contentManagement } from '@/lib/content-management';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

async function requireManager(permission: 'content:manage' | 'content:import' = 'content:manage') {
  const user = await getSessionUser();
  if (!user) return { error: NextResponse.json({ error: 'Bạn cần đăng nhập trước khi quản trị pack curation registry.' }, { status: 401 }) };
  if (!assertLessonPermission(user, permission)) {
    return { error: NextResponse.json({ error: 'Bạn không có quyền quản trị pack curation registry.' }, { status: 403 }) };
  }
  return { user };
}

export async function GET(request: NextRequest) {
  const auth = await requireManager('content:manage');
  if (auth.error) return auth.error;
  const packId = new URL(request.url).searchParams.get('packId') || undefined;
  const summary = await contentManagement.getAcademicPackCurationSummary(auth.user, { packId });
  return NextResponse.json(summary);
}

export async function POST(request: NextRequest) {
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const auth = await requireManager('content:import');
  if (auth.error) return auth.error;
  const rate = assertRuntimeRateLimit(request, 'admin_admin_content_packs_curation_registry_write', { windowMs: 60_000, max: 20 });
  if (!rate.allowed) return rate.response;
  const parsed = await readJsonBody<any>(request, { maxBytes: 512000, required: false });
  if (!parsed.ok) return parsed.response;
  const body = parsed.body || {};
  const packId = body?.packId ? String(body.packId) : undefined;
  const apply = body?.apply === true;
  const payload = body?.payload ?? body;
  const result = apply
    ? await contentManagement.importAcademicPackCurationRegistry({ payload, actorName: auth.user!.name, actorRole: auth.user!.role, packId, apply: true })
    : await contentManagement.previewAcademicPackCurationRegistryImport(payload, { packId });
  return NextResponse.json(result);
}
