import { NextRequest, NextResponse } from 'next/server';
import { assessLessonQuality } from '@/lib/lesson-quality-checklist';
import { assertRuntimeRateLimit, assertWriteProtection, readJsonBody } from '@/lib/runtime-security';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function POST(request: NextRequest) {
  const rate = assertRuntimeRateLimit(request, 'lesson_quality', { windowMs: 60_000, max: 40 });
  if (!rate.allowed) return rate.response;
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;

  try {
    const parsed = await readJsonBody<any>(request, { maxBytes: 140_000, required: true });
    if (!parsed.ok) return parsed.response;
    const body = parsed.body;
    const qualityChecklist = assessLessonQuality({
      content: body.content || '',
      level: body.level,
      grade: body.grade,
      subject: body.subject,
      book: body.book,
      topic: body.topic,
      template: body.template,
      duration: body.duration,
      methods: Array.isArray(body.methods) ? body.methods : [],
      techniques: Array.isArray(body.techniques) ? body.techniques : [],
      governanceSnapshot: body.governanceSnapshot || null,
      sourceStatus: body.sourceStatus,
      releaseTier: body.releaseTier,
      supportLevel: body.supportLevel
    });
    return NextResponse.json({ qualityChecklist });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Không kiểm tra được chất lượng giáo án.' }, { status: 400 });
  }
}
