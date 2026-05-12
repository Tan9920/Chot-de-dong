import { NextRequest, NextResponse } from 'next/server';
import { assertRuntimeRateLimit, assertWriteProtection, readJsonBody } from '@/lib/runtime-security';
import { getSessionUser } from '@/lib/auth';
import { assertLessonPermission } from '@/lib/access';
import { listContentReviews } from '@/lib/content-reviews';
import { contentManagement } from '@/lib/content-management';
import type { ContentEntityKind, ContentReviewDecision } from '@/lib/types';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

function parseEntity(value: string): ContentEntityKind | null {
  return ['topics', 'programs', 'questions', 'rubrics', 'resources', 'templates'].includes(value)
    ? value as ContentEntityKind
    : null;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ entity: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Bạn cần đăng nhập trước khi xem review content.' }, { status: 401 });
  const { entity: entityRaw } = await params;
  const entity = parseEntity(entityRaw);
  if (!entity) return NextResponse.json({ error: 'Entity không hợp lệ.' }, { status: 400 });
  const { searchParams } = new URL(request.url);
  const entityId = String(searchParams.get('id') || '').trim();
  const items = await listContentReviews({ entityType: entity, entityId: entityId || undefined }, user);
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ entity: string }> }) {
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Bạn cần đăng nhập trước khi review kho nội dung.' }, { status: 401 });
  if (!assertLessonPermission(user, 'content:review')) {
    return NextResponse.json({ error: 'Bạn không có quyền review kho nội dung.' }, { status: 403 });
  }
  const { entity: entityRaw } = await params;
  const entity = parseEntity(entityRaw);
  if (!entity) return NextResponse.json({ error: 'Entity không hợp lệ.' }, { status: 400 });
  const rate = assertRuntimeRateLimit(request, 'admin_admin_content_entity_reviews_write', { windowMs: 60_000, max: 20 });
  if (!rate.allowed) return rate.response;
  const parsed = await readJsonBody<any>(request, { maxBytes: 96000, required: false });
  if (!parsed.ok) return parsed.response;
  const body = parsed.body || {};
  const id = String(body?.id || '').trim();
  const decision = body?.decision as ContentReviewDecision;
  const note = String(body?.note || '').trim();
  if (!id || !decision) return NextResponse.json({ error: 'Thiếu id hoặc decision review.' }, { status: 400 });
  try {
    const item = await contentManagement.reviewContent(entity, id, decision, note, user);
    const reviews = await listContentReviews({ entityType: entity, entityId: id }, user);
    return NextResponse.json({ item, reviews });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Không review được bản ghi.' }, { status: 400 });
  }
}
