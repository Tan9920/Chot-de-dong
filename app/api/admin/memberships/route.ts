import { NextRequest, NextResponse } from 'next/server';
import { deleteMembership, getMembershipSummary, listMemberships, upsertMembership } from '@/lib/membership';
import { assertRuntimeRateLimit, assertWriteProtection, readJsonBody, requirePermission } from '@/lib/runtime-security';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

async function requireManager(request: NextRequest) {
  const gate = await requirePermission('membership:manage', 'Bạn cần đăng nhập trước khi quản trị membership.', request);
  if (!gate.ok) return { error: gate.response };
  return { user: gate.user };
}

export async function GET(request: NextRequest) {
  const auth = await requireManager(request);
  if (auth.error) return auth.error;
  const rate = assertRuntimeRateLimit(request, 'membership_read', { windowMs: 60_000, max: 60 });
  if (!rate.allowed) return rate.response;
  const { searchParams } = new URL(request.url);
  const items = await listMemberships({
    q: searchParams.get('q') || undefined,
    schoolKey: searchParams.get('schoolKey') || undefined,
    departmentKey: searchParams.get('departmentKey') || undefined,
    status: searchParams.get('status') || undefined,
    role: searchParams.get('role') || undefined
  }, auth.user!);
  const summary = await getMembershipSummary(auth.user!);
  return NextResponse.json({ items, summary });
}

export async function POST(request: NextRequest) {
  const auth = await requireManager(request);
  if (auth.error) return auth.error;
  const rate = assertRuntimeRateLimit(request, 'membership_write', { windowMs: 60_000, max: 20 });
  if (!rate.allowed) return rate.response;
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const parsed = await readJsonBody<any>(request, { maxBytes: 24_000, required: true });
  if (!parsed.ok) return parsed.response;
  try {
    const item = await upsertMembership(parsed.body?.item ?? parsed.body, auth.user!);
    return NextResponse.json({ item });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Không lưu được membership.' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireManager(request);
  if (auth.error) return auth.error;
  const rate = assertRuntimeRateLimit(request, 'membership_delete', { windowMs: 60_000, max: 20 });
  if (!rate.allowed) return rate.response;
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const { searchParams } = new URL(request.url);
  const id = String(searchParams.get('id') || '').trim();
  if (!id) return NextResponse.json({ error: 'Thiếu id membership cần xóa.' }, { status: 400 });
  try {
    await deleteMembership(id, auth.user!);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Không xóa được membership.' }, { status: 400 });
  }
}
