import { NextRequest, NextResponse } from 'next/server';
import { assertRuntimeRateLimit, assertWriteProtection, readJsonBody } from '@/lib/runtime-security';
import { getSessionUser } from '@/lib/auth';
import { assertLessonPermission } from '@/lib/access';
import { contentManagement } from '@/lib/content-management';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

function parseBoolean(value: string | null) {
  if (value == null) return undefined;
  return value === '1' || value.toLowerCase() === 'true';
}

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Bạn cần đăng nhập trước khi preview materialize evidence ledger.' }, { status: 401 });
  if (!assertLessonPermission(user, 'content:manage')) {
    return NextResponse.json({ error: 'Chỉ tổ trưởng/chuyên môn hoặc quản trị mới được preview materialize evidence ledger.' }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const preview = await contentManagement.previewAcademicEvidenceLedgerMaterializationPlan({
    packId: searchParams.get('packId') || undefined,
    grade: searchParams.get('grade') || undefined,
    onlyMissing: parseBoolean(searchParams.get('onlyMissing'))
  });
  return NextResponse.json(preview);
}

export async function POST(request: NextRequest) {
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Bạn cần đăng nhập trước khi materialize evidence ledger.' }, { status: 401 });
  if (!assertLessonPermission(user, 'content:manage')) {
    return NextResponse.json({ error: 'Chỉ tổ trưởng/chuyên môn hoặc quản trị mới được materialize evidence ledger.' }, { status: 403 });
  }
  const rate = assertRuntimeRateLimit(request, 'admin_admin_content_evidence_ledger_materialize_write', { windowMs: 60_000, max: 20 });
  if (!rate.allowed) return rate.response;
  const parsed = await readJsonBody<any>(request, { maxBytes: 512000, required: false });
  if (!parsed.ok) return parsed.response;
  const body = parsed.body || {};
  const result = await contentManagement.applyAcademicEvidenceLedgerMaterialization({
    actorName: user.name,
    actorRole: user.role,
    packId: typeof body?.packId === 'string' ? body.packId : undefined,
    grade: typeof body?.grade === 'string' ? body.grade : undefined,
    onlyMissing: typeof body?.onlyMissing === 'boolean' ? body.onlyMissing : true
  });
  return NextResponse.json(result);
}
