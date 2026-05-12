import { NextRequest, NextResponse } from 'next/server';
import { buildCurriculumImportReviewBoard, previewCurriculumImport } from '@/lib/curriculum-data-pipeline';
import { assertRuntimeRateLimit, assertWriteProtection, readJsonBody } from '@/lib/runtime-security';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  return NextResponse.json(buildCurriculumImportReviewBoard());
}

export async function POST(request: NextRequest) {
  const rate = assertRuntimeRateLimit(request, 'subject_data_import_preview', { windowMs: 60_000, max: 20 });
  if (!rate.allowed) return rate.response;
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;

  const parsed = await readJsonBody<any>(request, { maxBytes: 80_000, required: true });
  if (!parsed.ok) return parsed.response;

  return NextResponse.json(previewCurriculumImport(parsed.body), { status: 202 });
}
