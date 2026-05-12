import { NextRequest, NextResponse } from 'next/server';
import { getSchoolSettings, saveSchoolSettings } from '@/lib/storage';
import { assertRuntimeRateLimit, assertWriteProtection, readJsonBody, requirePermission } from '@/lib/runtime-security';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  const settings = await getSchoolSettings();
  return NextResponse.json({ settings });
}

export async function PUT(request: NextRequest) {
  const gate = await requirePermission('settings:update', 'Bạn cần đăng nhập trước khi cập nhật thiết lập.');
  if (!gate.ok) return gate.response;
  const rate = assertRuntimeRateLimit(request, 'settings_update', { windowMs: 60_000, max: 20 });
  if (!rate.allowed) return rate.response;
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const parsed = await readJsonBody(request, { maxBytes: 48_000, required: true });
  if (!parsed.ok) return parsed.response;
  const settings = await saveSchoolSettings(parsed.body ?? {});
  return NextResponse.json({ settings });
}
