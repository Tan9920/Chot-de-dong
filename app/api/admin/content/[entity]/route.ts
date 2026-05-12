import { NextRequest, NextResponse } from 'next/server';
import { assertRuntimeRateLimit, assertWriteProtection, readJsonBody } from '@/lib/runtime-security';
import { getSessionUser } from '@/lib/auth';
import { assertLessonPermission } from '@/lib/access';
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

async function requireManager() {
  const user = await getSessionUser();
  if (!user) return { error: NextResponse.json({ error: 'Bạn cần đăng nhập trước khi quản trị kho nội dung.' }, { status: 401 }) };
  if (!assertLessonPermission(user, 'content:manage')) {
    return { error: NextResponse.json({ error: 'Chỉ tổ trưởng/chuyên môn hoặc quản trị mới được chỉnh sửa kho nội dung.' }, { status: 403 }) };
  }
  return { user };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ entity: string }> }) {
  const auth = await requireManager();
  if (auth.error) return auth.error;

  const { entity: entityRaw } = await params;
  const entity = parseEntity(entityRaw);
  if (!entity) return NextResponse.json({ error: 'Entity không hợp lệ.' }, { status: 400 });

  const { searchParams } = new URL(request.url);
  const items = await contentManagement.listContent(entity, {
    q: searchParams.get('q') || undefined,
    grade: searchParams.get('grade') || undefined,
    subject: searchParams.get('subject') || undefined,
    book: searchParams.get('book') || undefined,
    topic: searchParams.get('topic') || undefined,
    lifecycleStatus: searchParams.get('lifecycleStatus') || undefined,
    visibilityScope: searchParams.get('visibilityScope') || undefined,
    sourceStatus: searchParams.get('sourceStatus') || undefined
  }, auth.user!);
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ entity: string }> }) {
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const auth = await requireManager();
  if (auth.error) return auth.error;

  const { entity: entityRaw } = await params;
  const entity = parseEntity(entityRaw);
  if (!entity) return NextResponse.json({ error: 'Entity không hợp lệ.' }, { status: 400 });

  const rate = assertRuntimeRateLimit(request, 'admin_admin_content_entity_write', { windowMs: 60_000, max: 20 });
  if (!rate.allowed) return rate.response;
  const parsed = await readJsonBody<any>(request, { maxBytes: 96000, required: false });
  if (!parsed.ok) return parsed.response;
  const body = parsed.body || {};
  try {
    const item = await contentManagement.upsertContent(entity, body?.item ?? body, auth.user!);
    return NextResponse.json({ item });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Không lưu được nội dung.' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ entity: string }> }) {
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const auth = await requireManager();
  if (auth.error) return auth.error;

  const { entity: entityRaw } = await params;
  const entity = parseEntity(entityRaw);
  if (!entity) return NextResponse.json({ error: 'Entity không hợp lệ.' }, { status: 400 });

  const { searchParams } = new URL(request.url);
  const id = String(searchParams.get('id') || '').trim();
  if (!id) return NextResponse.json({ error: 'Thiếu id để xóa bản ghi.' }, { status: 400 });

  await contentManagement.deleteContent(entity, id, auth.user!);
  return NextResponse.json({ ok: true });
}
