import { NextRequest, NextResponse } from 'next/server';
import { assertRuntimeRateLimit, assertWriteProtection, readJsonBody } from '@/lib/runtime-security';
import { getSessionUser } from '@/lib/auth';
import { assertLessonPermission } from '@/lib/access';
import { contentManagement } from '@/lib/content-management';
import type { ContentEntityKind, ContentSourceStatusAction } from '@/lib/types';
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
  if (!user) return NextResponse.json({ error: 'Bạn cần đăng nhập trước khi cập nhật source status.' }, { status: 401 });
  if (!assertLessonPermission(user, 'content:review')) {
    return NextResponse.json({ error: 'Bạn không có quyền cập nhật source status của kho nội dung.' }, { status: 403 });
  }

  const { entity: entityRaw } = await params;
  const entity = parseEntity(entityRaw);
  if (!entity) return NextResponse.json({ error: 'Entity không hợp lệ.' }, { status: 400 });

  const rate = assertRuntimeRateLimit(request, 'admin_admin_content_entity_source_status_write', { windowMs: 60_000, max: 20 });
  if (!rate.allowed) return rate.response;
  const parsed = await readJsonBody<any>(request, { maxBytes: 96000, required: false });
  if (!parsed.ok) return parsed.response;
  const body = parsed.body || {};
  const id = String(body?.id || '').trim();
  const action = body?.action as ContentSourceStatusAction;
  const note = String(body?.note || '').trim();
  if (!id || !action) return NextResponse.json({ error: 'Thiếu id hoặc action source status.' }, { status: 400 });

  try {
    const item = await contentManagement.updateSourceStatus(entity, id, action, user, note || undefined);
    return NextResponse.json({ item });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Không cập nhật được source status.' }, { status: 400 });
  }
}
