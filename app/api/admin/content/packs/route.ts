import { NextRequest, NextResponse } from 'next/server';
import { assertRuntimeRateLimit, assertWriteProtection, readJsonBody } from '@/lib/runtime-security';
import { getSessionUser } from '@/lib/auth';
import { assertLessonPermission } from '@/lib/access';
import { contentManagement } from '@/lib/content-management';
import type { PackImportSelection } from '@/lib/types';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

async function requireManager() {
  const user = await getSessionUser();
  if (!user) return { error: NextResponse.json({ error: 'Bạn cần đăng nhập trước khi thao tác pack rollout.' }, { status: 401 }) };
  if (!assertLessonPermission(user, 'content:import')) {
    return { error: NextResponse.json({ error: 'Chỉ tổ trưởng/chuyên môn hoặc quản trị mới được import pack rollout.' }, { status: 403 }) };
  }
  return { user };
}

export async function POST(request: NextRequest) {
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const auth = await requireManager();
  if (auth.error) return auth.error;

  const rate = assertRuntimeRateLimit(request, 'admin_admin_content_packs_write', { windowMs: 60_000, max: 20 });
  if (!rate.allowed) return rate.response;
  const parsed = await readJsonBody<any>(request, { maxBytes: 512000, required: false });
  if (!parsed.ok) return parsed.response;
  const body = parsed.body || {};
  const selection = (body?.selection || body || {}) as PackImportSelection;
  const target = body?.target === 'database' || body?.target === 'json' ? body.target : 'auto';
  const dryRun = body?.dryRun !== false;

  if (dryRun) {
    const packPreview = await contentManagement.previewGeneratedPackImport(selection, target);
    return NextResponse.json({ packPreview });
  }

  const result = await contentManagement.importGeneratedPackSelection({
    selection,
    target,
    actorName: auth.user!.name,
    actorRole: auth.user!.role,
    dryRun: false
  });
  return NextResponse.json(result);
}
