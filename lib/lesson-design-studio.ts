import blueprints from '@/data/lesson-design-studio-blueprints.json';
import { searchActivityGameLibrary } from './activity-game-library';

function normalise(value: any) {
  return String(value || '').trim().toLowerCase();
}

function gradeNumber(value: any) {
  return Number(String(value || '').match(/\d+/)?.[0] || 6);
}

function phaseLabel(phase: string) {
  const map: Record<string, string> = {
    khoiDong: 'Khởi động',
    hinhThanhKienThuc: 'Hình thành kiến thức / khám phá',
    luyenTap: 'Luyện tập',
    vanDung: 'Vận dụng',
    diagnostic: 'Chẩn đoán đầu vào',
    error_analysis: 'Phân tích lỗi sai',
    project: 'Dự án / sản phẩm',
    baoCao: 'Báo cáo',
    reflection: 'Phản tư sau học'
  };
  return map[phase] || phase;
}

function pickStudioMode(input: any) {
  const requested = normalise(input.designMode || input.uiMode || 'standard');
  const modes = (blueprints as any).studioModes || [];
  return modes.find((mode: any) => normalise(mode.id) === requested) || modes.find((mode: any) => mode.id === 'standard') || modes[0];
}

function pickLessonIntent(input: any) {
  const raw = normalise(input.lessonIntent || input.intent || input.examMode || 'new_lesson');
  const intents = (blueprints as any).lessonIntents || [];
  if (raw === 'grade10_entrance' || raw === 'thpt_exam') return intents.find((item: any) => item.id === 'exam_prep') || intents[0];
  return intents.find((item: any) => normalise(item.id) === raw) || intents.find((item: any) => item.id === 'new_lesson') || intents[0];
}

function buildContext(input: any, profile: any, gate: any) {
  const n = gradeNumber(input.grade);
  const level = n <= 5 ? 'Tiểu học' : n <= 9 ? 'THCS' : 'THPT';
  return {
    grade: String(input.grade || profile?.grade || '6'),
    level,
    subject: input.subject || 'Chưa chọn môn',
    book: input.book || 'Chưa chọn bộ sách/nguồn',
    topic: input.topic || 'Chủ đề do giáo viên nhập',
    duration: input.duration || `${profile?.defaultDurationMinutes || 45} phút`,
    classSize: input.classSize || 'standard',
    deviceAccess: input.deviceAccess || 'teacher_only',
    space: input.space || 'regular_room',
    learnerProfile: input.learnerProfile || 'standard',
    examMode: input.examMode || 'standard',
    dataGate: {
      mode: gate?.mode || 'safe_frame_only',
      sourceStatus: gate?.sourceStatus || 'scaffold',
      supportLevel: gate?.supportLevel || 'starter',
      releaseTier: gate?.releaseTier || 'internal_preview',
      contentDepthAllowed: Boolean(gate?.contentDepthAllowed),
      casioAllowed: Boolean(gate?.casioAllowed)
    }
  };
}

function buildDifferentiationLanes(profile: any, learnerProfile: string) {
  const diff = profile?.differentiation || {};
  return [
    {
      id: 'support',
      label: 'Nhóm cần hỗ trợ / lớp yếu',
      taskShape: diff.support || 'Nhiệm vụ ngắn, có mẫu/gợi ý từng bước.',
      evidence: 'Hoàn thành một phần sản phẩm, trả lời được câu hỏi lõi hoặc nêu điểm chưa hiểu.',
      teacherMove: 'Chia nhỏ nhiệm vụ, kiểm tra hiểu ngay, không tăng độ khó quá nhanh.',
      selected: learnerProfile === 'support'
    },
    {
      id: 'standard',
      label: 'Nhóm chuẩn',
      taskShape: diff.standard || 'Hoàn thành nhiệm vụ chính theo tiêu chí.',
      evidence: 'Sản phẩm đúng yêu cầu, có minh chứng/cách làm, tham gia thảo luận.',
      teacherMove: 'Giữ tiêu chí rõ, cho phản hồi nhanh và sửa lỗi thường gặp.',
      selected: learnerProfile === 'standard'
    },
    {
      id: 'advanced',
      label: 'Nhóm nâng cao / chuyên sâu',
      taskShape: diff.advanced || 'Mở rộng, giải thích, phản biện hoặc vận dụng tình huống mới.',
      evidence: 'Sản phẩm mở rộng, lời giải thích hoặc phương án khác có căn cứ.',
      teacherMove: 'Không giao thêm bài cho có; phải có tiêu chí đánh giá và giới hạn nguồn.',
      selected: learnerProfile === 'advanced'
    }
  ];
}

function buildActivityFallback(intent: any, context: any) {
  return (intent?.activityBias || ['khoiDong', 'hinhThanhKienThuc', 'luyenTap', 'vanDung']).map((phase: string, index: number) => ({
    id: `studio-fallback-${phase}`,
    title: `${phaseLabel(phase)} có kiểm soát`,
    phase,
    timeMinutes: index === 0 ? 5 : index === 1 ? 18 : index === 2 ? 15 : 7,
    kind: phase === 'khoiDong' ? 'starter' : phase === 'luyenTap' ? 'practice_game' : 'learning_activity',
    studentProducts: ['Sản phẩm học tập do giáo viên xác định theo bài thật.'],
    assessmentEvidence: ['Minh chứng quan sát/sản phẩm/câu trả lời được giáo viên kiểm tra.'],
    readiness: {
      safeSkeletonOnly: true,
      publicUseAllowed: false,
      warnings: [`Chưa có hoạt động verified khớp ${context.subject} lớp ${context.grade}; dùng như khung gợi ý.`]
    }
  }));
}

function buildActivityMap(items: any[], intent: any, context: any) {
  const candidates = items.length ? items : buildActivityFallback(intent, context);
  const byPhase: any[] = [];
  const phases = intent?.activityBias || ['khoiDong', 'hinhThanhKienThuc', 'luyenTap', 'vanDung'];
  for (const phase of phases) {
    const found = candidates.find((item: any) => normalise(item.phase) === normalise(phase)) || candidates[byPhase.length % candidates.length];
    byPhase.push({
      phase,
      label: phaseLabel(phase),
      title: found?.title || `${phaseLabel(phase)} có kiểm soát`,
      kind: found?.kind || 'learning_activity',
      timeMinutes: found?.timeMinutes || 8,
      products: found?.studentProducts || ['Sản phẩm học tập do giáo viên xác định.'],
      evidence: found?.assessmentEvidence || ['Minh chứng giáo viên kiểm tra.'],
      safetyNotes: found?.safetyNotes || ['Không dùng tài nguyên thiếu nguồn/license để public.'],
      readiness: found?.readiness || { safeSkeletonOnly: true, publicUseAllowed: false, warnings: ['Khung hoạt động an toàn.'] },
      origin: found?.origin || 'studio_blueprint'
    });
  }
  return byPhase;
}

function buildAssessmentBlueprint(intent: any, context: any, gate: any) {
  const deepAllowed = Boolean(gate?.contentDepthAllowed);
  return {
    focus: intent?.qualityFocus || [],
    quickChecks: [
      'Một điều đã hiểu chắc.',
      'Một minh chứng/sản phẩm học tập.',
      'Một lỗi hoặc câu hỏi cần giáo viên hỗ trợ.'
    ],
    rubricLanes: [
      'Cần hỗ trợ: hoàn thành nhiệm vụ lõi với gợi ý.',
      'Đạt: hoàn thành sản phẩm chính và nêu được minh chứng.',
      'Tốt: giải thích/mở rộng/vận dụng có căn cứ.'
    ],
    itemPolicy: deepAllowed
      ? 'Có thể dùng câu hỏi/rubric từ dữ liệu đã duyệt hoặc giáo viên nhập.'
      : 'Không tự sinh câu hỏi/đáp án sâu; giáo viên phải nhập hoặc chọn từ nguồn hợp pháp.',
    exportWarning: context.dataGate.contentDepthAllowed
      ? 'Có thể xuất nháp kèm compliance packet; vẫn cần giáo viên kiểm tra cuối.'
      : 'Chỉ xuất nháp/khung an toàn, không gắn nhãn verified/chính thức.'
  };
}

function buildExportReadiness(context: any, activityMap: any[]) {
  const checklist = (blueprints as any).exportReadinessChecklist || [];
  const blockedByData = !context.dataGate.contentDepthAllowed;
  const unsafeActivities = activityMap.filter((item) => item?.readiness?.safeSkeletonOnly).length;
  return {
    status: blockedByData || unsafeActivities ? 'draft_only_with_warnings' : 'ready_for_internal_review',
    canExportDraft: true,
    canSubmitOfficial: !blockedByData && unsafeActivities === 0,
    checklist,
    blockers: [
      blockedByData ? 'Dữ liệu chưa đủ reviewed/foundation/approved references để dùng nội dung sâu.' : null,
      unsafeActivities ? `${unsafeActivities} hoạt động/game chỉ ở mức seed/scaffold/community hoặc thiếu source/license/review.` : null
    ].filter(Boolean),
    warnings: [
      'DOCX/PDF cần giữ compliance packet, nhãn dữ liệu và cảnh báo giáo viên kiểm tra.',
      'Không dùng bản xuất để quảng cáo chuẩn Bộ/100%/dùng ngay.'
    ]
  };
}

export async function buildLessonDesignStudioPacket(input: any = {}) {
  const payload = input.payload || input;
  const profile = input.profile || {};
  const gate = input.gate || {};
  const mode = pickStudioMode(payload);
  const intent = pickLessonIntent(payload);
  const context = buildContext(payload, profile, gate);
  const activityResult = await searchActivityGameLibrary({
    grade: context.grade,
    subject: context.subject,
    topic: context.topic,
    q: payload.activityQuery || '',
    includeReviewQueue: false
  }).catch(() => ({ items: [], readiness: {}, summary: {} }));
  const activityMap = buildActivityMap(activityResult.items || [], intent, context);
  const differentiationLanes = buildDifferentiationLanes(profile, normalise(context.learnerProfile || 'standard'));
  const assessmentBlueprint = buildAssessmentBlueprint(intent, context, gate);
  const exportReadiness = buildExportReadiness(context, activityMap);

  return {
    version: (blueprints as any).version,
    generatedAt: new Date().toISOString(),
    name: 'Lesson Design Studio 1–12',
    positioning: 'Không chỉ tạo văn bản giáo án; đây là quy trình thiết kế bài dạy có kiểm nguồn, phân hóa, hoạt động, đánh giá, export và duyệt tổ chuyên môn.',
    selectedMode: mode,
    selectedIntent: intent,
    context,
    profileCard: {
      label: profile?.label || 'Hồ sơ sư phạm chưa xác định',
      selectedBy: profile?.selectedBy || 'unknown',
      activityTempo: profile?.activityTempo || 'cần giáo viên chọn',
      teacherTone: profile?.teacherTone || 'rõ nhiệm vụ, rõ sản phẩm, rõ tiêu chí',
      guardrails: profile?.avoid || []
    },
    safetyContract: {
      noAiCore: true,
      teacherFinalReviewRequired: true,
      safeFrameOnly: !context.dataGate.contentDepthAllowed,
      noDeepContentWithoutReviewedData: !context.dataGate.contentDepthAllowed,
      noCasioUnlessApproved: !context.dataGate.casioAllowed,
      dataWarnings: gate?.dataWarnings || ['Chưa có dữ liệu verified đầy đủ; chỉ dựng khung an toàn.'],
      teacherMustProvide: gate?.teacherActionRequired || ['Nhập/chọn nội dung bài học, học liệu, câu hỏi/đáp án từ nguồn hợp pháp.']
    },
    differentiationLanes,
    activityMap,
    assessmentBlueprint,
    worksheetOutline: [
      'Phần 1: Nhiệm vụ chính và học liệu/nguồn giáo viên kiểm tra.',
      'Phần 2: Sản phẩm học sinh cần nộp/trình bày.',
      'Phần 3: Tự đánh giá theo mức cần hỗ trợ/đạt/tốt.',
      'Phần 4: Câu hỏi/lỗi còn cần hỗ trợ sau tiết học.'
    ],
    slideOutline: [
      'Slide 1: Mục tiêu và sản phẩm bài học.',
      'Slide 2: Tình huống khởi động hoặc câu hỏi dẫn nhập.',
      'Slide 3–4: Nhiệm vụ khám phá/hình thành kiến thức.',
      'Slide 5: Luyện tập phân tầng.',
      'Slide 6: Vận dụng/exit ticket và hướng dẫn sau tiết.'
    ],
    exportReadiness,
    nextBestActions: [
      'Giáo viên nhập/chọn nội dung bài học thật từ nguồn hợp pháp.',
      'Chọn hoặc tự tạo học liệu có source/license/attribution rõ.',
      'Chạy checklist chất lượng trước khi lưu/gửi duyệt.',
      'Xuất DOCX/PDF kèm nhãn dữ liệu; không bỏ compliance packet.',
      'Nếu dùng trong tổ/trường, gửi duyệt thay vì tự gắn trạng thái chính thức.'
    ],
    activityLibrarySummary: activityResult.summary || {},
    limits: {
      notAProfessionalReview: true,
      notVerifiedCurriculumCoverage: !context.dataGate.contentDepthAllowed,
      notProductionReleaseWorkflow: true
    }
  };
}

export function formatLessonDesignStudioForPlan(studio: any) {
  const activities = (studio.activityMap || []).map((item: any, index: number) => `${index + 1}. ${item.label}: ${item.title} (${item.timeMinutes} phút)\n   - Sản phẩm: ${(item.products || []).join('; ')}\n   - Minh chứng: ${(item.evidence || []).join('; ')}\n   - Lưu ý: ${(item.readiness?.warnings || item.safetyNotes || []).slice(0, 2).join(' ')}`).join('\n');
  const lanes = (studio.differentiationLanes || []).map((lane: any) => `- ${lane.label}${lane.selected ? ' [đang ưu tiên]' : ''}: ${lane.taskShape}`).join('\n');
  return `
PHỤ LỤC THIẾT KẾ BÀI DẠY / LESSON DESIGN STUDIO
- Định vị: ${studio.positioning}
- Chế độ giao diện: ${studio.selectedMode?.label || 'Tiêu chuẩn'}
- Mục tiêu thiết kế: ${studio.selectedIntent?.label || 'Bài học thông thường'}
- Điều kiện lớp: sĩ số ${studio.context?.classSize}, thiết bị ${studio.context?.deviceAccess}, không gian ${studio.context?.space}
- Hợp đồng an toàn dữ liệu: ${studio.safetyContract?.safeFrameOnly ? 'Chỉ dựng khung an toàn, không sinh kiến thức sâu.' : 'Có thể dùng nội dung có kiểm soát theo nguồn đã duyệt.'}

Gợi ý hoạt động/game/học liệu có kiểm soát:
${activities}

Phân hóa theo nhóm học sinh:
${lanes}

Worksheet outline:
${(studio.worksheetOutline || []).map((item: string) => `- ${item}`).join('\n')}

Slide outline:
${(studio.slideOutline || []).map((item: string) => `- ${item}`).join('\n')}

Export readiness: ${studio.exportReadiness?.status || 'draft_only_with_warnings'}
${(studio.exportReadiness?.blockers || []).map((item: string) => `- Blocker: ${item}`).join('\n')}`;
}
