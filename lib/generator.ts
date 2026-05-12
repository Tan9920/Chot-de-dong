import { buildSubjectDataGate } from './subject-data-truth';
import { buildAcademicVerificationGate } from './academic-coverage-audit';
import { resolveSubjectName } from './subject-naming';
import { resolveLessonDraftingProfile } from './lesson-drafting-profile';
import { buildLessonDesignStudioPacket, formatLessonDesignStudioForPlan } from './lesson-design-studio';
import { buildAcademicSourcePackTemplate, evaluateAcademicSourcePack } from './academic-source-intake';

const safeFrameQuestions = [
  'Nhiệm vụ học tập chính của hoạt động này là gì?',
  'Sản phẩm học tập cần nộp hoặc trình bày là gì?',
  'Em cần thêm gợi ý, học liệu hoặc ví dụ nào từ giáo viên?'
];

function getLevelFromGrade(grade: string) {
  const n = Number(String(grade || '').match(/\d+/)?.[0] || 6);
  if (n <= 5) return 'Tiểu học';
  if (n <= 9) return 'THCS';
  return 'THPT';
}

function parseDurationMinutes(value: any, fallback: number) {
  const raw = String(value || '').trim();
  const match = raw.match(/\d+/);
  return match ? Number(match[0]) : fallback;
}

function buildFrameOnlyNotice(gate: any, profile: any) {
  return [
    'CẢNH BÁO DỮ LIỆU MÔN HỌC:',
    ...gate.dataWarnings.map((item: string) => `- ${item}`),
    'YÊU CẦU GIÁO VIÊN:',
    ...gate.teacherActionRequired.map((item: string) => `- ${item}`),
    '- Giáo viên phải nhập/chọn nội dung bài học, học liệu, câu hỏi, đáp án từ nguồn hợp pháp trước khi dùng chính thức.',
    '- Không coi bản này là nội dung đã thẩm định; đây là khung soạn giáo án an toàn.',
    'LƯU Ý THEO HỒ SƠ LỚP/HỌC SINH:',
    `- Hồ sơ đang áp dụng: ${profile.label}.`,
    `- Nhịp hoạt động: ${profile.activityTempo}.`,
    `- Phân hóa đã chọn: ${profile.learnerProfile} — ${profile.differentiationNote}.`
  ].join('\n');
}

function buildActivity(input: any) {
  const { index, title, minutes, goal, content, product, profile, gate, teacherStep, studentStep, reportStep, conclusionStep } = input;
  return `${index}. ${title} (${minutes} phút)
a) Mục tiêu: ${goal}
b) Nội dung: ${content}
c) Sản phẩm: ${product}
d) Tổ chức thực hiện:
- Chuyển giao nhiệm vụ: ${teacherStep}
- Thực hiện nhiệm vụ: ${studentStep}
- Báo cáo, thảo luận: ${reportStep}
- Kết luận, nhận định: ${conclusionStep}
- Điều chỉnh theo hồ sơ lớp: ${profile.teacherTone}.
- Kiểm soát dữ liệu: ${gate.contentDepthAllowed ? 'Có thể dùng dữ liệu có kiểm soát theo nguồn đã duyệt.' : 'Không sinh kiến thức sâu; giáo viên chuẩn hóa bằng nguồn đã kiểm tra.'}`;
}

function allocateActivityMinutes(total: number, profile: any) {
  const isPrimaryShort = Number(profile.grade) <= 4;
  if (isPrimaryShort) {
    return {
      warmup: Math.max(4, Math.round(total * 0.15)),
      knowledge: Math.max(12, Math.round(total * 0.38)),
      practice: Math.max(10, Math.round(total * 0.32)),
      application: Math.max(5, total - Math.max(4, Math.round(total * 0.15)) - Math.max(12, Math.round(total * 0.38)) - Math.max(10, Math.round(total * 0.32)))
    };
  }
  return {
    warmup: Math.max(5, Math.round(total * 0.12)),
    knowledge: Math.max(16, Math.round(total * 0.40)),
    practice: Math.max(14, Math.round(total * 0.32)),
    application: Math.max(6, total - Math.max(5, Math.round(total * 0.12)) - Math.max(16, Math.round(total * 0.40)) - Math.max(14, Math.round(total * 0.32)))
  };
}

function buildLessonActivities(input: any) {
  const { grade, subject, topic, gate, profile, durationMinutes } = input;
  const minutes = allocateActivityMinutes(durationMinutes, profile);
  const sourcePhrase = gate.contentDepthAllowed
    ? 'nội dung/học liệu đã qua review và có nguồn'
    : 'nội dung/học liệu do giáo viên tự nhập từ nguồn hợp pháp';

  return [
    buildActivity({
      index: 1,
      title: 'Khởi động',
      minutes: minutes.warmup,
      goal: `Kích hoạt trải nghiệm ban đầu về ${topic} ở mức phù hợp lớp ${grade}.`,
      content: `Tình huống/câu hỏi mở do giáo viên chọn, không yêu cầu kiến thức sâu nếu dữ liệu chưa verified.`,
      product: 'Câu trả lời ngắn, dự đoán ban đầu hoặc biểu hiện quan sát được.',
      profile,
      gate,
      teacherStep: 'Nêu nhiệm vụ ngắn, rõ sản phẩm và thời gian; có ví dụ mẫu nếu học sinh cần hỗ trợ.',
      studentStep: 'Suy nghĩ cá nhân hoặc trao đổi cặp đôi theo yêu cầu.',
      reportStep: 'Một số học sinh chia sẻ; giáo viên ghi nhanh ý chính/lỗi thường gặp.',
      conclusionStep: 'Kết nối vào bài, chưa chốt kiến thức vượt ngoài nguồn giáo viên đã kiểm tra.'
    }),
    buildActivity({
      index: 2,
      title: 'Hình thành kiến thức / Khám phá',
      minutes: minutes.knowledge,
      goal: `Học sinh tiếp cận trọng tâm bài ${topic} thông qua ${sourcePhrase}.`,
      content: `Giáo viên cung cấp học liệu/nhiệm vụ đã kiểm tra; hệ thống chỉ giữ cấu trúc nhiệm vụ và tiêu chí quan sát.`,
      product: 'Phiếu học tập, ghi chép, bảng nhóm, sản phẩm thao tác hoặc kết quả thảo luận.',
      profile,
      gate,
      teacherStep: 'Giao nhiệm vụ theo từng bước, nêu tiêu chí sản phẩm và lưu ý nguồn học liệu.',
      studentStep: 'Đọc/xem/thao tác/thảo luận theo nhóm hoặc cá nhân, ghi minh chứng học tập.',
      reportStep: 'Đại diện trình bày kết quả; nhóm khác bổ sung/câu hỏi phản hồi.',
      conclusionStep: 'Giáo viên chuẩn hóa kiến thức bằng nguồn hợp pháp đã kiểm tra, không dựa vào nội dung tự sinh chưa duyệt.'
    }),
    buildActivity({
      index: 3,
      title: 'Luyện tập',
      minutes: minutes.practice,
      goal: 'Củng cố yêu cầu cần đạt bằng nhiệm vụ vừa sức và có tiêu chí rõ.',
      content: `Bài tập/nhiệm vụ do giáo viên nhập hoặc chọn từ ngân hàng đã duyệt; phân tầng theo mức ${profile.learnerProfile}.`,
      product: 'Bài làm, câu trả lời, sản phẩm cá nhân/nhóm, minh chứng sửa lỗi.',
      profile,
      gate,
      teacherStep: 'Nêu nhiệm vụ, tiêu chí đạt, thời gian và cách nộp/trình bày sản phẩm.',
      studentStep: 'Thực hiện nhiệm vụ; học sinh cần hỗ trợ dùng khung gợi ý, học sinh khá/giỏi làm nhánh mở rộng.',
      reportStep: 'Chia sẻ đáp án/cách làm/sản phẩm; đối chiếu với tiêu chí giáo viên đưa ra.',
      conclusionStep: 'Nhận xét lỗi điển hình, củng cố cách làm, giao sửa ngắn nếu cần.'
    }),
    buildActivity({
      index: 4,
      title: 'Vận dụng / Mở rộng có kiểm soát',
      minutes: minutes.application,
      goal: `Vận dụng nội dung bài vào tình huống phù hợp lớp ${grade} và môn ${subject}.`,
      content: 'Nhiệm vụ vận dụng gần gũi hoặc mở rộng; giáo viên quyết định mức độ và nguồn dữ liệu.',
      product: 'Ví dụ thực tế, đoạn trình bày, sản phẩm nhỏ, kế hoạch hành động hoặc bài vận dụng.',
      profile,
      gate,
      teacherStep: 'Giao nhiệm vụ vận dụng rõ bối cảnh, sản phẩm và tiêu chí đánh giá.',
      studentStep: 'Thực hiện cá nhân/nhóm; ghi lại cách làm và điểm còn chưa chắc.',
      reportStep: 'Trình bày sản phẩm; bạn học phản hồi theo tiêu chí.',
      conclusionStep: 'Giáo viên tổng kết, nhắc phần cần kiểm tra lại sau tiết học và hướng dẫn tự học.'
    })
  ].join('\n\n');
}

function buildOutcomes(input: any) {
  const { subject, grade, topic, gate, profile } = input;
  const knowledgeLine = gate.contentDepthAllowed
    ? `Nêu/giải thích/thực hành được nội dung trọng tâm của ${topic} theo nguồn đã duyệt.`
    : `Giáo viên điền yêu cầu kiến thức/kĩ năng cụ thể của ${topic} sau khi đối chiếu CTGDPT, SGK/tài liệu hợp pháp và dữ liệu đã kiểm tra.`;

  return `1. Kiến thức, kĩ năng
- ${knowledgeLine}
- Không tự bịa kiến thức môn ${subject}; dữ liệu hiện là ${gate.sourceStatus}/${gate.supportLevel}.

2. Năng lực chung
- Tự chủ và tự học; giao tiếp và hợp tác; giải quyết vấn đề và sáng tạo ở mức phù hợp lớp ${grade}.
- Cách triển khai: ${profile.activityTempo}.

3. Năng lực đặc thù môn học
- Giáo viên xác định năng lực đặc thù môn ${subject} theo bài/chủ đề và nguồn đã kiểm tra.
- Nếu chưa có dữ liệu reviewed/foundation, chỉ ghi mô tả năng lực ở mức khung, không suy diễn nội dung sâu.

4. Phẩm chất
- Chăm chỉ, trách nhiệm, trung thực khi trình bày kết quả học tập; giáo viên điều chỉnh theo bài/chủ đề.

5. Minh chứng đánh giá yêu cầu cần đạt
- Câu trả lời, phiếu học tập, sản phẩm cá nhân/nhóm, quan sát quá trình, bảng tự đánh giá hoặc rubric giáo viên kiểm tra.

6. Lưu ý kĩ thuật khi viết mục này
- Mục tiêu phải quan sát/đánh giá được, tránh viết chung chung.
- Mục tiêu phải khớp hoạt động và đánh giá.
- Nếu cần máy tính cầm tay/Casio: chỉ thêm khi giáo viên tự nhập hoặc có dữ liệu được duyệt riêng.`;
}

function buildAssessmentSection(input: any) {
  const { gate, profile } = input;
  return `- Hình thức: quan sát, hỏi nhanh, phiếu ra cửa, sản phẩm học tập, tự đánh giá/đánh giá đồng đẳng.
- Tiêu chí tối thiểu:
  + Hoàn thành sản phẩm theo yêu cầu.
  + Nêu được minh chứng/cách làm hoặc điểm còn cần hỗ trợ.
  + Tham gia hoạt động đúng vai trò.
- Phân hóa đánh giá:
  + Cần hỗ trợ: ${profile.differentiation?.support || 'Hoàn thành nhiệm vụ ngắn với gợi ý.'}
  + Chuẩn: ${profile.differentiation?.standard || 'Hoàn thành nhiệm vụ chính.'}
  + Nâng cao: ${profile.differentiation?.advanced || 'Mở rộng hoặc giải thích thêm.'}
- Kiểm soát nguồn: ${gate.contentDepthAllowed ? 'Có thể dùng câu hỏi/rubric từ dữ liệu đã duyệt.' : 'Câu hỏi, đáp án và rubric chi tiết phải do giáo viên nhập/chọn từ nguồn hợp pháp.'}`;
}

export async function generateLessonBundle(payload: any = {}) {
  const grade = String(payload.grade || '6');
  const subjectNaming = resolveSubjectName(payload.subject || 'Ngữ văn');
  const subject = (subjectNaming as any).canonicalSubject || (subjectNaming as any).canonical || payload.subject || 'Ngữ văn';
  const level = payload.level || getLevelFromGrade(grade);
  const book = payload.book || 'Chưa chọn bộ sách / dữ liệu scaffold';
  const topic = payload.topic || 'Chủ đề do giáo viên nhập';
  const template = payload.template || 'Mẫu phát triển phẩm chất - năng lực';
  const profile = resolveLessonDraftingProfile(payload);
  const durationMinutes = parseDurationMinutes(payload.duration, profile.defaultDurationMinutes || 45);
  const gate = buildSubjectDataGate({ grade, subject, book, topic });
  const academicGate = buildAcademicVerificationGate({ grade, subject, book, topic });
  const sourceIntakeEvaluation = evaluateAcademicSourcePack(buildAcademicSourcePackTemplate({
    scopeId: gate.record?.id || '',
    grade,
    level,
    subject,
    book,
    topic
  }));
  const notice = buildFrameOnlyNotice(gate, profile);
  const designStudio = await buildLessonDesignStudioPacket({ payload: { ...payload, grade, subject, book, topic, level, template, duration: payload.duration || `${durationMinutes} phút` }, profile, gate });
  const designStudioAppendix = formatLessonDesignStudioForPlan(designStudio);
  const activities = buildLessonActivities({ grade, subject, topic, gate, profile, durationMinutes });
  const outcomes = buildOutcomes({ grade, subject, topic, gate, profile });
  const assessment = buildAssessmentSection({ gate, profile });

  const plan = `KẾ HOẠCH BÀI DẠY

I. THÔNG TIN CHUNG
- Lớp: ${grade}
- Môn: ${subject}
- Bộ sách/Nguồn: ${book}
- Bài/Chủ đề: ${topic}
- Mẫu: ${template}
- Thời lượng dự kiến: ${durationMinutes} phút
- Hồ sơ soạn giáo án: ${profile.label}
- Nhịp tổ chức: ${profile.activityTempo}
- Trạng thái dữ liệu: ${gate.sourceStatus} / ${gate.supportLevel}
- Chế độ nội dung: ${gate.mode}
- Cổng xác minh học thuật Batch103: ${academicGate.teacherFacingLabel} · ${academicGate.blockedFromDeepContent ? 'khóa kiến thức sâu' : 'cho phép nội dung có kiểm soát'}
- Source Pack Intake Batch104: ${sourceIntakeEvaluation.evaluatedStage} · ${sourceIntakeEvaluation.readyForReviewedCandidate ? 'đủ điều kiện review candidate' : 'chưa đủ metadata nguồn/reviewer/license'}
- Lesson Design Studio: ${designStudio.selectedMode?.label || 'Tiêu chuẩn'} · ${designStudio.selectedIntent?.label || 'Bài học thông thường'}
- Điều kiện lớp: sĩ số ${designStudio.context?.classSize || 'standard'} · thiết bị ${designStudio.context?.deviceAccess || 'teacher_only'} · không gian ${designStudio.context?.space || 'regular_room'}

II. YÊU CẦU CẦN ĐẠT
${outcomes}

III. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU
- Thiết bị: bảng, phiếu học tập, máy chiếu/thiết bị số nếu có.
- Học liệu bắt buộc do giáo viên kiểm soát: tài liệu hợp pháp, có nguồn/attribution/license/trạng thái duyệt nếu đưa vào kho.
- Phương án thay thế: bản in/phiếu giấy/đồ dùng trực quan nếu thiếu thiết bị.
- Cảnh báo: tài nguyên thiếu nguồn/license không được công khai hoặc dùng như dữ liệu verified.

IV. PHƯƠNG PHÁP VÀ KĨ THUẬT DẠY HỌC
- Phương pháp gợi ý: trực quan, vấn đáp, luyện tập, hợp tác nhóm, giải quyết vấn đề hoặc phương pháp phù hợp lớp/môn.
- Kĩ thuật dạy học: Think–Pair–Share, khăn trải bàn, mảnh ghép, phiếu ra cửa hoặc kĩ thuật do giáo viên chọn.
- Lưu ý: “Công nghệ” là tên môn khi đúng ngữ cảnh chương trình; “kĩ thuật dạy học” chỉ dùng khi nói về phương pháp/kĩ thuật.

V. TIẾN TRÌNH DẠY HỌC
${activities}

VI. KIỂM TRA, ĐÁNH GIÁ
${assessment}

VII. PHÂN HÓA ĐỐI TƯỢNG HỌC SINH
- Nhóm cần hỗ trợ: ${profile.differentiation?.support || profile.differentiationNote}
- Nhóm chuẩn: ${profile.differentiation?.standard || 'Hoàn thành nhiệm vụ chính theo tiêu chí.'}
- Nhóm khá/giỏi/chuyên sâu: ${profile.differentiation?.advanced || 'Mở rộng, giải thích hoặc vận dụng tình huống mới.'}
- Lưu ý: Nếu chọn chế độ ôn thi/lớp yếu/nâng cao/chuyên sâu, giáo viên cần nhập dạng bài, đề/câu hỏi, đáp án và nguồn đã kiểm tra.

VIII. GHI CHÚ / ĐIỀU CHỈNH SAU TIẾT DẠY
- Ghi lại nội dung cần điều chỉnh, học sinh cần hỗ trợ, học liệu cần bổ sung và minh chứng sau khi dạy thật.
- Không chuyển bản nháp thành tài liệu chính thức nếu chưa có review chuyên môn/nguồn hợp pháp.

PHỤ LỤC XÁC MINH HỌC THUẬT BATCH103
- Nhãn giáo viên: ${academicGate.teacherFacingLabel}
- Bị khóa khỏi nội dung sâu: ${academicGate.blockedFromDeepContent ? 'Có' : 'Không'}
- Blocker: ${academicGate.blockers.length ? academicGate.blockers.join(', ') : 'Không có'}
- Bước tiếp theo: ${academicGate.verificationNextStep}
- Evidence cần có nếu muốn nâng verified: ${academicGate.requiredEvidenceForVerifiedScope.join(', ')}

PHỤ LỤC SOURCE PACK INTAKE BATCH104
- Trạng thái intake đánh giá: ${sourceIntakeEvaluation.evaluatedStage}
- Được phép đổi registry ngay: ${sourceIntakeEvaluation.canMutateRegistry ? 'Có' : 'Không'}
- Được phép mở deep content ngay: ${sourceIntakeEvaluation.canAllowDeepContent ? 'Có' : 'Không'}
- Lý do chặn đổi registry: ${sourceIntakeEvaluation.registryChangeBlockedReason}
- Blocker intake: ${sourceIntakeEvaluation.blockers.length ? sourceIntakeEvaluation.blockers.map((item: any) => item.label).join(', ') : 'Không có'}
- Fallback an toàn: ${sourceIntakeEvaluation.teacherSafeFallback}

${notice}
${designStudioAppendix}

GHI CHÚ KHÔNG-AI: Không có AI/model/API trả phí. Đây là giáo án dựng bằng template, truth model dữ liệu môn học và hồ sơ sư phạm theo lớp; giáo viên chịu trách nhiệm kiểm tra cuối trước khi dùng chính thức.`;

  return {
    summary: { level, grade, subject, book, topic, template, duration: `${durationMinutes} phút`, draftingProfile: profile.label, designMode: designStudio.selectedMode?.id, lessonIntent: designStudio.selectedIntent?.id },
    plan,
    suggestedQuestions: gate.contentDepthAllowed ? [
      'Câu hỏi nhận biết/thông hiểu/vận dụng phải lấy từ nguồn đã duyệt hoặc giáo viên nhập.',
      'Giáo viên kiểm tra đáp án và mức độ trước khi dùng.'
    ] : safeFrameQuestions,
    rubric: [
      'Mức cần hỗ trợ: Học sinh hoàn thành một phần nhiệm vụ với gợi ý/mẫu.',
      'Mức đạt: Học sinh hoàn thành sản phẩm theo yêu cầu và nêu được minh chứng.',
      'Mức tốt: Học sinh giải thích được cách làm, hỗ trợ bạn hoặc vận dụng tình huống mới.'
    ],
    worksheet: [
      'Phần A: Giáo viên nhập học liệu/nội dung bài học từ nguồn hợp pháp.',
      'Phần B: Học sinh thực hiện nhiệm vụ chính và ghi sản phẩm.',
      'Phần C: Học sinh tự đánh giá: điều đã làm được, điều cần hỗ trợ, minh chứng sản phẩm.'
    ],
    quickCheck: ['Nêu một điều đã hiểu, một minh chứng sản phẩm học tập và một câu hỏi còn cần làm rõ.'],
    designStudio,
    trace: {
      packId: gate.record?.id || 'subject-data-missing',
      sourceStatus: gate.sourceStatus,
      lifecycleStatus: 'draft',
      sourceLabel: gate.contentDepthAllowed ? 'Dữ liệu đạt ngưỡng có kiểm soát' : 'Khung an toàn — dữ liệu môn học chưa verified',
      referenceCount: gate.record?.sourceReferenceCount || 0,
      fieldEvidenceCount: gate.record?.approvedReferenceCount || 0,
      conflicts: [],
      subjectDataGate: gate,
      academicVerificationGate: academicGate,
      academicSourceIntakeGate: sourceIntakeEvaluation,
      lessonDraftingProfile: profile,
      safeLessonMode: gate.safeLessonMode,
      contentDepthAllowed: gate.contentDepthAllowed,
      teacherFinalReviewRequired: true
    }
  };
}
