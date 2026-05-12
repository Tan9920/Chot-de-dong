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
  if (!user) return { error: NextResponse.json({ error: 'Bạn cần đăng nhập trước khi quản trị source authority registry.' }, { status: 401 }) };
  if (!assertLessonPermission(user, permission)) {
    return { error: NextResponse.json({ error: 'Bạn không có quyền quản trị source authority registry.' }, { status: 403 }) };
  }
  return { user };
}

export async function GET(_request: NextRequest) {
  const auth = await requireManager('content:manage');
  if (auth.error) return auth.error;
  const summary = await contentManagement.getAcademicSourceAuthoritySummary();
  return NextResponse.json(summary);
}

export async function POST(request: NextRequest) {
  const auth = await requireManager('content:import');
  if (auth.error) return auth.error;
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const rate = assertRuntimeRateLimit(request, 'admin_source_authorities_write', { windowMs: 60_000, max: 12 });
  if (!rate.allowed) return rate.response;
  const parsed = await readJsonBody<any>(request, { maxBytes: 512_000, required: false });
  if (!parsed.ok) return parsed.response;
  const body = parsed.body || {};
  const apply = body?.apply === true;
  const payload = body?.payload ?? body;
  const result = apply
    ? await contentManagement.importAcademicSourceAuthorityRegistry({ payload, apply: true })
    : await contentManagement.previewAcademicSourceAuthorityRegistryImport(payload);
  return NextResponse.json(result);
}
