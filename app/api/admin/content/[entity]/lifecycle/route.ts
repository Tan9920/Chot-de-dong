import { NextRequest, NextResponse } from 'next/server';
import { assertRuntimeRateLimit, assertWriteProtection, readJsonBody } from '@/lib/runtime-security';
import { getSessionUser } from '@/lib/auth';
import { contentManagement } from '@/lib/content-management';
import type { ContentEntityKind } from '@/lib/types';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

function parseEntity(value: string): ContentEntityKind | null {
  return ['topics', 'programs', 'questions', 'rubrics', 'resources', 'templates'].includes(value)
    ? value as ContentEntityKind
    : null;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ entity: string }> }) {
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Bạn cần đăng nhập trước khi chuyển trạng thái nội dung.' }, { status: 401 });
  if (!(user.role === 'leader' || user.role === 'admin')) {
    return NextResponse.json({ error: 'Chỉ tổ trưởng/chuyên môn hoặc quản trị mới được chuyển trạng thái nội dung.' }, { status: 403 });
  }
  const { entity: entityRaw } = await params;
  const entity = parseEntity(entityRaw);
  if (!entity) return NextResponse.json({ error: 'Entity không hợp lệ.' }, { status: 400 });
  const rate = assertRuntimeRateLimit(request, 'admin_admin_content_entity_lifecycle_write', { windowMs: 60_000, max: 20 });
  if (!rate.allowed) return rate.response;
  const parsed = await readJsonBody<any>(request, { maxBytes: 96000, required: false });
  if (!parsed.ok) return parsed.response;
  const body = parsed.body || {};
  const id = String(body?.id || '').trim();
  const action = body?.action as 'submit' | 'publish' | 'archive' | 'restore-draft';
  if (!id || !action) return NextResponse.json({ error: 'Thiếu id hoặc action lifecycle.' }, { status: 400 });
  try {
    const item = await contentManagement.updateLifecycle(entity, id, action, user);
    return NextResponse.json({ item });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Không chuyển được trạng thái nội dung.' }, { status: 400 });
  }
}
