import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getSchoolSettings } from '@/lib/storage';
import { generateLessonBundle } from '@/lib/generator';
import { contentManagement } from '@/lib/content-management';
import { contentRepository } from '@/lib/content-repository';
import { evaluateTeachingPolicy } from '@/lib/teaching-policy';
import { assertOperatingUsageAllowed, recordOperatingUsage } from '@/lib/operating-runtime';
import { assessLessonQuality } from '@/lib/lesson-quality-checklist';
import { applyContentSafetyGate, assessContentSafetyGate } from '@/lib/content-safety-gate';
import { assertRuntimeRateLimit, assertWriteProtection, readJsonBody } from '@/lib/runtime-security';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function POST(request: NextRequest) {
  const rate = assertRuntimeRateLimit(request, 'template_builder', {
    windowMs: 60_000,
    max: 20,
    message: 'Bạn đang dựng giáo án quá nhanh. Hãy chờ một chút rồi thử lại.'
  });
  if (!rate.allowed) return rate.response;
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;

  try {
    const parsed = await readJsonBody<any>(request, { maxBytes: 80_000, required: true });
    if (!parsed.ok) return parsed.response;
    const payload = parsed.body;

    const [user, settings, summary] = await Promise.all([
      getSessionUser(request),
      getSchoolSettings(),
      contentRepository.getCurriculumSummary()
    ]);
    const usageGate = await assertOperatingUsageAllowed(user, 'template_lesson', 1);
    if (!usageGate.allowed) {
      return NextResponse.json({ error: usageGate.error, entitlement: { plan: usageGate.plan, used: usageGate.used, limit: usageGate.limit } }, { status: usageGate.status });
    }

    const rawBundle = await generateLessonBundle(payload);
    const snapshot = rawBundle.trace.packId ? await contentManagement.getPackReleaseSnapshot(user, { packId: rawBundle.trace.packId }) : null;
    const selectedCoverage = summary.coverage.find((item) => item.grade === rawBundle.summary.grade && item.subject === rawBundle.summary.subject && item.book === rawBundle.summary.book);
    const gate = evaluateTeachingPolicy({
      sourceStatus: rawBundle.trace.sourceStatus,
      releaseTier: snapshot?.releaseTier || selectedCoverage?.releaseTier || 'internal_preview',
      supportLevel: selectedCoverage?.supportLevel || 'starter',
      settings,
      user,
      requestedPreview: Boolean(payload?.allowInternalPreview)
    });

    if (!gate.allowed) {
      return NextResponse.json({
        error: gate.reasons.join(' '),
        policy: {
          ...gate.policy,
          actualSourceStatus: gate.actualSourceStatus,
          actualReleaseTier: gate.actualReleaseTier,
          actualSupportLevel: gate.actualSupportLevel,
          bypassed: false
        }
      }, { status: 412 });
    }

    const contentSafety = assessContentSafetyGate({
      sourceStatus: gate.actualSourceStatus,
      releaseTier: gate.actualReleaseTier,
      supportLevel: gate.actualSupportLevel,
      referenceCount: rawBundle.trace.referenceCount,
      fieldEvidenceCount: rawBundle.trace.fieldEvidenceCount
    });
    const bundle = applyContentSafetyGate(rawBundle, contentSafety);

    const qualityChecklist = assessLessonQuality({
      content: bundle.plan,
      level: bundle.summary.level,
      grade: bundle.summary.grade,
      subject: bundle.summary.subject,
      book: bundle.summary.book,
      topic: bundle.summary.topic,
      template: bundle.summary.template,
      duration: bundle.summary.duration,
      methods: payload.methods,
      techniques: payload.techniques,
      sourceStatus: bundle.trace.sourceStatus,
      releaseTier: gate.actualReleaseTier,
      supportLevel: gate.actualSupportLevel
    });

    await recordOperatingUsage({
      user,
      action: 'template_lesson',
      quantity: 1,
      scope: { level: bundle.summary.level, grade: bundle.summary.grade, subject: bundle.summary.subject, book: bundle.summary.book, topic: bundle.summary.topic },
      note: contentSafety.mode === 'safe_skeleton'
        ? 'Dựng khung giáo án an toàn vì dữ liệu chưa đủ ngưỡng; không gọi AI và không bịa kiến thức.'
        : 'Dựng giáo án bằng template/data có cấu trúc; không gọi AI.'
    });

    return NextResponse.json({
      bundle: {
        ...bundle,
        trace: {
          ...bundle.trace,
          releaseTier: gate.actualReleaseTier,
          supportLevel: gate.actualSupportLevel,
          contentSafety
        },
        qualityChecklist
      },
      policy: {
        ...gate.policy,
        actualSourceStatus: gate.actualSourceStatus,
        actualReleaseTier: gate.actualReleaseTier,
        actualSupportLevel: gate.actualSupportLevel,
        bypassed: gate.bypassed,
        notice: contentSafety.mode === 'safe_skeleton'
          ? 'Dữ liệu chưa đủ ngưỡng reviewed/foundation nên hệ thống chỉ tạo khung bản nháp an toàn, không sinh kiến thức sâu.'
          : gate.bypassed
            ? 'Đã bật internal preview bypass cho vai trò có thẩm quyền. Kết quả chỉ nên dùng nội bộ, không coi là scope đạt ngưỡng dạy học chính thức.'
            : undefined
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Không sinh được giáo án.' }, { status: 400 });
  }
}
