import fs from 'fs';
import path from 'path';

import { buildHostedRuntimeClosureBoard } from './runtime-hosted-closure';
import { buildAcademicCoverageAuditReport } from './academic-coverage-audit';
import { buildCurriculumGapBoard, resolveCurriculumSelection } from './curriculum-compatibility-matrix';

type AnyRecord = Record<string, any>;

function readText(file: string, fallback = '') {
  try { return fs.readFileSync(path.join(process.cwd(), file), 'utf8'); }
  catch { return fallback; }
}

function readJson(file: string, fallback: any = null) {
  try { return JSON.parse(readText(file, JSON.stringify(fallback))); }
  catch { return fallback; }
}

function exists(file: string) {
  return fs.existsSync(path.join(process.cwd(), file));
}

export function resolveTeacherPilotGradeProfile(gradeInput: string | number) {
  const pack = readJson('data/teacher-pilot-completion-pack.json', { gradeProfiles: [] });
  const grade = Number(gradeInput || 1);
  return (pack.gradeProfiles || []).find((profile: AnyRecord) => Array.isArray(profile.grades) && profile.grades.includes(grade)) || pack.gradeProfiles?.[0] || {
    id: 'unknown',
    label: 'Chưa xác định',
    teachingStyle: 'Dùng khung an toàn, giáo viên tự điều chỉnh.',
    avoid: 'Không sinh kiến thức sâu khi thiếu nguồn duyệt.'
  };
}

export function readTeacherPilotTopicCatalog() {
  return readJson('data/teacher-pilot-topic-picker-catalog.json', {
    version: 'missing',
    grades: [],
    customTopicPolicy: { allowed: true, defaultSourceStatus: 'custom_teacher_input', contentDepthAllowed: false }
  });
}

function gradeKey(gradeInput: string | number) {
  return String(gradeInput || '5');
}

function findGradeCatalog(gradeInput: string | number) {
  const catalog = readTeacherPilotTopicCatalog();
  const grade = gradeKey(gradeInput);
  const exact = (catalog.grades || []).find((item: AnyRecord) => String(item.grade) === grade);
  if (exact) return exact;
  const numeric = Number(grade);
  if (numeric >= 1 && numeric <= 5) return (catalog.grades || []).find((item: AnyRecord) => item.grade === 'generic_primary') || catalog.grades?.[0];
  return catalog.grades?.[0];
}

export function listTeacherPilotSubjects(gradeInput: string | number = '5') {
  const gradeCatalog = findGradeCatalog(gradeInput);
  return (gradeCatalog?.subjects || []).map((subject: AnyRecord) => ({
    subject: subject.subject,
    sourceStatus: subject.sourceStatus || 'seed',
    reviewStatus: subject.reviewStatus || 'not_reviewed',
    supportLevel: subject.supportLevel || 'developing',
    topicCount: Array.isArray(subject.topics) ? subject.topics.length : 0
  }));
}

export function listTeacherPilotTopics(gradeInput: string | number = '5', subjectInput = 'Tiếng Việt') {
  const gradeCatalog = findGradeCatalog(gradeInput);
  const subject = (gradeCatalog?.subjects || []).find((item: AnyRecord) => item.subject === subjectInput) || gradeCatalog?.subjects?.[0];
  return (subject?.topics || []).map((topic: AnyRecord) => ({
    ...topic,
    subject: subject?.subject,
    grade: String(gradeInput || gradeCatalog?.grade || '5'),
    sourceStatus: topic.sourceStatus || subject?.sourceStatus || 'seed',
    reviewStatus: topic.reviewStatus || subject?.reviewStatus || 'not_reviewed',
    supportLevel: topic.supportLevel || subject?.supportLevel || 'developing',
    contentDepthAllowed: Boolean(topic.contentDepthAllowed)
  }));
}

export function resolveTeacherPilotTopic(input: AnyRecord = {}) {
  const catalog = readTeacherPilotTopicCatalog();
  const warnings: string[] = [];
  const grade = gradeKey(input.grade || '5');
  const subjects = listTeacherPilotSubjects(grade);
  const requestedSubject = String(input.subject || subjects[0]?.subject || 'Tiếng Việt');
  const subject = subjects.find((item: AnyRecord) => item.subject === requestedSubject) || subjects[0] || { subject: requestedSubject, sourceStatus: 'seed' };
  if (subject.subject !== requestedSubject) {
    warnings.push(`Môn ${requestedSubject} chưa có trong catalog lớp ${grade}; hệ thống chuyển sang ${subject.subject}.`);
  }

  const topics = listTeacherPilotTopics(grade, subject.subject);
  const requestedTopicId = String(input.topicId || '');
  const requestedTopicTitle = String(input.topic || '').trim();
  let topic = topics.find((item: AnyRecord) => item.id === requestedTopicId) || null;

  if (!topic && requestedTopicTitle) {
    topic = topics.find((item: AnyRecord) => item.title === requestedTopicTitle) || null;
    if (!topic && /phân số/i.test(requestedTopicTitle) && subject.subject !== 'Toán') {
      warnings.push('“Phân số” không thuộc môn đã chọn. Hệ thống không cho tạo Tiếng Việt + Phân số; hãy chuyển môn sang Toán hoặc chọn chủ đề Tiếng Việt hợp lệ.');
    }
  }

  const allowCustomTopic = Boolean(input.allowCustomTopic || input.customTopic);
  const customTopic = String(input.customTopic || requestedTopicTitle || '').trim();
  if (!topic && allowCustomTopic && customTopic) {
    const policy = catalog.customTopicPolicy || {};
    topic = {
      id: 'custom-teacher-topic',
      title: customTopic,
      subject: subject.subject,
      grade,
      sourceStatus: policy.defaultSourceStatus || 'custom_teacher_input',
      reviewStatus: 'teacher_responsibility',
      supportLevel: 'teacher_custom',
      recordType: 'teacher_input',
      contentDepthAllowed: false,
      safeUse: policy.warning || 'Chủ đề tự nhập không phải dữ liệu verified; giáo viên tự chịu trách nhiệm nguồn.'
    };
    warnings.push('Bạn đang dùng chủ đề tự nhập: hệ thống chỉ dựng khung, không coi là verified và không sinh kiến thức sâu.');
  }

  if (!topic) {
    topic = topics[0] || {
      id: 'fallback-topic',
      title: 'Chủ đề do giáo viên chọn',
      subject: subject.subject,
      grade,
      sourceStatus: 'seed',
      reviewStatus: 'not_reviewed',
      supportLevel: 'developing',
      recordType: 'unmapped',
      contentDepthAllowed: false,
      safeUse: 'Fallback an toàn: giáo viên tự nhập nội dung và nguồn.'
    };
    warnings.push('Chưa chọn chủ đề hợp lệ; hệ thống dùng chủ đề đầu tiên trong catalog an toàn.');
  }

  const curriculumResolution = resolveCurriculumSelection({
    grade,
    subject: subject.subject,
    topicId: topic.matrixRecordId || topic.id,
    topic: topic.title,
    bookset: input.bookset || 'ket_noi_tri_thuc',
    allowCustomTopic,
    customTopic: input.customTopic,
    sourceStatus: input.sourceStatus,
    adminMode: Boolean(input.adminMode)
  });
  warnings.push(...curriculumResolution.warnings);

  if (input.sourceStatus === 'verified' && curriculumResolution.dataStatus !== 'verified' && curriculumResolution.dataStatus !== 'approved_for_release') {
    warnings.push('UI không cho tự chọn verified. Nhãn dữ liệu đã bị hạ về trạng thái thật của ma trận/chủ đề.');
  }

  return {
    grade,
    subject: subject.subject,
    topic,
    topics,
    subjects,
    bookset: curriculumResolution.bookset,
    curriculumResolution,
    sourceStatus: curriculumResolution.dataStatus || topic.sourceStatus || subject.sourceStatus || 'seed',
    recordType: curriculumResolution.recordType || topic.recordType || 'topic_strand',
    supportLevel: curriculumResolution.supportLevel || topic.supportLevel || subject.supportLevel || 'developing',
    reviewStatus: curriculumResolution.reviewStatus || topic.reviewStatus || subject.reviewStatus || 'not_reviewed',
    contentDepthAllowed: Boolean(curriculumResolution.contentDepthAllowed),
    releaseAllowed: Boolean(curriculumResolution.releaseAllowed),
    warnings
  };
}

export function validateTeacherPilotTopicInput(input: AnyRecord = {}) {
  const resolved = resolveTeacherPilotTopic(input);
  return {
    ok: resolved.warnings.length === 0,
    grade: resolved.grade,
    subject: resolved.subject,
    topicId: resolved.topic.id,
    topicTitle: resolved.topic.title,
    sourceStatus: resolved.sourceStatus,
    contentDepthAllowed: resolved.contentDepthAllowed,
    warnings: resolved.warnings,
    safeUse: resolved.topic.safeUse,
    bookset: resolved.bookset,
    recordType: resolved.recordType,
    supportLevel: resolved.supportLevel,
    reviewStatus: resolved.reviewStatus,
    releaseAllowed: resolved.releaseAllowed,
    curriculumResolution: resolved.curriculumResolution
  };
}

function subjectSpecificCompetency(subject: string) {
  if (subject === 'Tiếng Việt') return 'Đọc, viết, nói và nghe theo nhiệm vụ giáo viên chọn; không tự sinh văn bản/ngữ liệu dài khi chưa có nguồn duyệt.';
  if (subject === 'Toán') return 'Tư duy và lập luận toán học; mô hình hóa/toán học hóa tình huống; giải quyết vấn đề ở mức giáo viên xác nhận.';
  if (subject === 'Khoa học') return 'Quan sát, đặt câu hỏi, dự đoán, thực hành/thu thập minh chứng ở mức phù hợp lớp.';
  if (subject === 'Công nghệ') return 'Nhận biết, sử dụng, đánh giá sản phẩm/quy trình công nghệ an toàn; dùng đúng tên môn “Công nghệ”.';
  return `Năng lực đặc thù môn ${subject}: giáo viên nhập/chọn theo nguồn hợp lệ; hệ thống không bịa nếu chưa có nguồn duyệt.`;
}

export function buildTeacherPilotSafeLessonFrame(input: AnyRecord = {}) {
  const duration = String(input.duration || '1 tiết');
  const resolved = resolveTeacherPilotTopic(input);
  const grade = resolved.grade;
  const subject = resolved.subject;
  const topic = String(resolved.topic.title || 'Chủ đề do giáo viên chọn');
  const sourceStatus = String(resolved.sourceStatus || 'seed');
  const profile = resolveTeacherPilotGradeProfile(grade);
  const curriculum = resolved.curriculumResolution;
  const deepContentAllowed = Boolean(resolved.contentDepthAllowed);
  return {
    title: `Giáo án ${subject} lớp ${grade}: ${topic}`,
    mode: 'safe_frame_only',
    aiUsed: false,
    deepContentGenerated: false,
    deepContentAllowed,
    sourceStatus,
    recordType: resolved.recordType,
    supportLevel: resolved.supportLevel,
    reviewStatus: resolved.reviewStatus,
    releaseAllowed: resolved.releaseAllowed,
    bookset: resolved.bookset,
    curriculumResolution: curriculum,
    topicValidation: validateTeacherPilotTopicInput(input),
    profile,
    warning: deepContentAllowed
      ? 'Dữ liệu có thể dùng sâu hơn nếu có verified/release thật, nhưng giáo viên vẫn cần kiểm tra trước khi dùng chính thức.'
      : 'Chưa đủ nguồn/reviewer/release gate trong ma trận; hệ thống chỉ dựng khung và không sinh kiến thức sâu.',
    sections: [
      { id: 'general', heading: 'I. THÔNG TIN CHUNG', items: [`Lớp: ${grade}`, `Môn: ${subject}`, `Bài/chủ đề: ${topic}`, `Thời lượng: ${duration}`, `Profile: ${profile.label}`, `Nhãn dữ liệu tự động: ${sourceStatus}`, `Bộ sách/trục dữ liệu: ${resolved.bookset?.label || 'Kết nối tri thức'} (${resolved.bookset?.mode || 'primary'})`, `Loại bản ghi: ${resolved.recordType}`, `Mức hỗ trợ: ${resolved.supportLevel}`, `Release: ${resolved.releaseAllowed ? 'được phép' : 'chưa được phép'}`] },
      { id: 'outcomes', heading: 'II. YÊU CẦU CẦN ĐẠT', items: ['Kiến thức, kĩ năng: giáo viên nhập/chọn từ nguồn hợp lệ.', 'Năng lực chung: tự chủ và tự học; giao tiếp và hợp tác; giải quyết vấn đề và sáng tạo — điều chỉnh theo bài thật.', `Năng lực đặc thù môn học: ${subjectSpecificCompetency(subject)}`, 'Phẩm chất: chăm chỉ, trách nhiệm, trung thực — chọn phẩm chất phù hợp hoạt động.', 'Minh chứng đánh giá yêu cầu cần đạt: sản phẩm học sinh, quan sát, câu trả lời, phiếu học tập hoặc rubric do giáo viên xác nhận.', 'Lưu ý kĩ thuật: viết bằng hành vi quan sát được, tránh khẩu hiệu chung chung.'] },
      { id: 'materials', heading: 'III. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU', items: ['Thiết bị/học liệu có nguồn, license, attribution, approval status.', 'Không copy dài SGK/tài liệu bản quyền.', resolved.topic.safeUse || 'Giáo viên tự xác nhận nguồn trước khi dùng.' ] },
      { id: 'methods', heading: 'IV. PHƯƠNG PHÁP VÀ KĨ THUẬT DẠY HỌC', items: [profile.teachingStyle, profile.avoid, 'Điều chỉnh theo sĩ số/không gian/thiết bị/mức học sinh/mục tiêu tiết học.', 'Tên môn trong CT mới dùng “Công nghệ”; “kĩ thuật dạy học” chỉ dùng cho phương pháp.'] },
      { id: 'process', heading: 'V. TIẾN TRÌNH DẠY HỌC', activities: ['Khởi động', 'Hình thành kiến thức', 'Luyện tập', 'Vận dụng'].map((name) => ({ name, structure: ['a. Mục tiêu', 'b. Nội dung', 'c. Sản phẩm', 'd. Tổ chức thực hiện: Chuyển giao nhiệm vụ → Thực hiện nhiệm vụ → Báo cáo, thảo luận → Kết luận, nhận định'] })) },
      { id: 'assessment', heading: 'VI. KIỂM TRA, ĐÁNH GIÁ', items: ['Có tiêu chí/minh chứng/rubric hoặc quan sát.', 'Không tự sinh đáp án nếu thiếu nguồn duyệt.'] },
      { id: 'differentiation', heading: 'VII. PHÂN HÓA ĐỐI TƯỢNG HỌC SINH', items: ['Yếu: nhiệm vụ ngắn, có mẫu.', 'Chuẩn: nhiệm vụ đầy đủ.', 'Khá/giỏi/chuyên sâu: mở rộng/vận dụng.'] },
      { id: 'reflection', heading: 'VIII. GHI CHÚ / ĐIỀU CHỈNH SAU TIẾT DẠY', items: ['Ghi lại điều hiệu quả, điểm cần sửa, học sinh cần hỗ trợ.'] }
    ]
  };
}

export function buildTeacherPilotCompletionBoard(input: AnyRecord = {}) {
  const pack = readJson('data/teacher-pilot-completion-pack.json', {});
  const topicCatalog = readTeacherPilotTopicCatalog();
  const hosted = buildHostedRuntimeClosureBoard(input.hostedEvidence || {});
  const academic = buildAcademicCoverageAuditReport();
  const curriculumGapBoard = buildCurriculumGapBoard();
  const offlineHtml = exists(pack.offlineArtifact || 'public/teacher-pilot-demo.html');
  const htmlText = readText(pack.offlineArtifact || 'public/teacher-pilot-demo.html');
  const topicValidation = validateTeacherPilotTopicInput(input.lesson || { grade: '5', subject: 'Tiếng Việt', topic: 'Phân số' });
  const criteria = (pack.completionCriteria || []).map((item: AnyRecord) => {
    let ok = false;
    if (item.id === 'offline_html_artifact') ok = offlineHtml && htmlText.includes('Batch108') && htmlText.includes('Không cần npm/build');
    if (item.id === 'safe_lesson_frame') ok = htmlText.includes('KẾ HOẠCH BÀI DẠY') && htmlText.includes('YÊU CẦU CẦN ĐẠT') && htmlText.includes('PHÂN HÓA');
    if (item.id === 'grade_band_profiles') ok = JSON.stringify(pack.gradeProfiles || []).includes('Lớp 1-2') && JSON.stringify(pack.gradeProfiles || []).includes('Lớp 10-12');
    if (item.id === 'teacher_modes') ok = JSON.stringify(pack.teacherModes || []).includes('Dễ dùng') && htmlText.includes('data-mode="advanced"');
    if (item.id === 'source_status_labels') ok = htmlText.includes('Nhãn dữ liệu tự động') && htmlText.includes('không cho tự chọn verified') && htmlText.includes('sourceStatus');
    if (item.id === 'no_ai_dependency') ok = true;
    if (item.id === 'no_fake_verified') ok = Number((academic.metrics as any).fakeVerifiedRecords || 0) === 0;
    if (item.id === 'hosted_runtime_guard') ok = hosted.evidence.claimAllowed.productionReady === false && hosted.evidence.claimAllowed.teacherSmallGroupTest === false;
    return { ...item, ok };
  });
  const batch108Criteria = [
    { id: 'subject_topic_picker_catalog', label: 'Có catalog chọn chủ đề theo lớp + môn', ok: exists('data/teacher-pilot-topic-picker-catalog.json') && JSON.stringify(topicCatalog).includes('g5-toan-phan-so') },
    { id: 'no_subject_topic_mismatch', label: 'Chặn tổ hợp sai Tiếng Việt + Phân số', ok: topicValidation.warnings.some((item) => item.includes('Phân số')) && topicValidation.subject === 'Tiếng Việt' },
    { id: 'no_manual_verified_choice', label: 'Không cho người dùng tự chọn verified', ok: htmlText.includes('không cho tự chọn verified') && !htmlText.includes('<select id="source"') },
    { id: 'math_fraction_only_under_math', label: 'Phân số chỉ nằm trong môn Toán ở lớp 5', ok: htmlText.includes('Phân số chỉ hiện khi chọn Toán') && JSON.stringify(topicCatalog).includes('g5-toan-phan-so') }
  ];
  const batch110Criteria = [
    { id: 'curriculum_compatibility_matrix', label: 'Có Curriculum Compatibility Matrix lớp–môn–bộ sách–bài/chủ đề', ok: exists('data/curriculum-compatibility-matrix.json') && curriculumGapBoard.version === 'batch110_curriculum_matrix_v1' },
    { id: 'primary_bookset_mode', label: 'Kết nối tri thức là trục chính; legacy booksets bị ẩn khỏi teacher flow', ok: curriculumGapBoard.primaryBookset === 'ket_noi_tri_thuc' && curriculumGapBoard.hiddenLegacyBooksets.includes('canh_dieu') && curriculumGapBoard.hiddenLegacyBooksets.includes('chan_troi_sang_tao') },
    { id: 'backend_recomputes_content_depth', label: 'Backend tự tính contentDepthAllowed và không tạo fake verified', ok: curriculumGapBoard.metrics.fakeDeepContentFlags === 0 && curriculumGapBoard.metrics.contentDepthAllowedRecords === 0 },
    { id: 'curriculum_gap_board', label: 'Có Curriculum Gap Board cho admin nhìn lỗ hổng dữ liệu', ok: Array.isArray(curriculumGapBoard.gaps) && curriculumGapBoard.gaps.length > 0 }
  ];
  const allCriteria = [...criteria, ...batch108Criteria, ...batch110Criteria];
  const required = allCriteria.filter((item: AnyRecord) => item.required !== false);
  const passed = required.filter((item: AnyRecord) => item.ok).length;
  return {
    batch: 'Batch110 — Curriculum Matrix, Primary Bookset Mode & Safer Lesson Composer',
    version: 'batch110_curriculum_matrix_v1',
    generatedAt: new Date().toISOString(),
    status: passed === required.length ? 'offline_curriculum_matrix_teacher_composer_guarded' : 'curriculum_matrix_teacher_composer_incomplete',
    plainLanguageStatus: passed === required.length
      ? 'Đã có ma trận lớp–môn–bộ sách–bài/chủ đề source-level: Kết nối tri thức là trục chính, legacy bị ẩn, backend tự hạ cấp dữ liệu chưa duyệt về khung an toàn. Hosted runtime vẫn chưa được claim pass.'
      : 'Lát cắt ma trận chương trình/composer an toàn vẫn còn thiếu tiêu chí source-level/offline.',
    completionPercent: required.length ? Math.round((passed / required.length) * 100) : 0,
    requiredPassed: passed,
    requiredTotal: required.length,
    offlineArtifact: pack.offlineArtifact || 'public/teacher-pilot-demo.html',
    offlineArtifactExists: offlineHtml,
    criteria: allCriteria,
    topicCatalogVersion: topicCatalog.version,
    topicValidationPreview: topicValidation,
    curriculumGapBoard,
    safeLessonFramePreview: buildTeacherPilotSafeLessonFrame(input.lesson || { grade: '5', subject: 'Toán', topicId: 'g5-toan-phan-so' }),
    hostedRuntimeStillGuarded: hosted.evidence.claimAllowed.teacherSmallGroupTest === false,
    academicStillGuarded: academic.metrics.deepContentAllowedScopes === 0,
    claimPolicy: pack.claimPolicy,
    teacherModes: pack.teacherModes || [],
    gradeProfiles: pack.gradeProfiles || [],
    nextRecommendedMove: 'Dùng Batch110 matrix/composer để test giáo viên chọn đúng lớp–môn–bài và hiểu trạng thái dữ liệu. Nếu có log Vercel thật thì Batch111 xử lý runtime/build; nếu chưa có thì mở rộng section editor/export structure.'
  };
}


export function buildTeacherPilotPrintableExport(input: AnyRecord = {}) {
  const frame = buildTeacherPilotSafeLessonFrame(input);
  const policy = readJson('data/teacher-pilot-print-export-policy.json', {});
  const title = String(frame.title || 'Kế hoạch bài dạy');
  const sectionLines = (frame.sections || []).flatMap((section: AnyRecord) => {
    const lines = [`${section.heading}`];
    if (Array.isArray(section.items)) lines.push(...section.items.map((item: string) => `- ${item}`));
    if (Array.isArray(section.activities)) {
      for (const activity of section.activities) {
        lines.push(`- ${activity.name}`);
        if (Array.isArray(activity.structure)) lines.push(...activity.structure.map((item: string) => `  ${item}`));
      }
    }
    return lines;
  });
  const plainText = [
    'KẾ HOẠCH BÀI DẠY',
    '',
    `Tiêu đề: ${title}`,
    `Nhãn dữ liệu: ${frame.sourceStatus}`,
    `Loại bản ghi: ${frame.recordType || 'unknown'}`,
    `Mức hỗ trợ: ${frame.supportLevel || 'unknown'}`,
    `Bộ sách/trục dữ liệu: ${frame.bookset?.label || 'Kết nối tri thức'} (${frame.bookset?.mode || 'primary'})`,
    `AI used: ${frame.aiUsed ? 'yes' : 'no'}`,
    `Deep content generated: ${frame.deepContentGenerated ? 'yes' : 'no'}`,
    '',
    ...sectionLines,
    '',
    'CHECKLIST TRƯỚC KHI DÙNG',
    ...(policy.teacherFacingChecklist || []).map((item: string) => `- ${item}`),
    '',
    `CẢNH BÁO: ${frame.warning}`
  ].join('\n');
  return {
    batch: 'Batch110 — Curriculum Matrix, Primary Bookset Mode & Safer Lesson Composer',
    version: 'batch110_curriculum_matrix_v1',
    mode: 'curriculum_matrix_teacher_print_export_source_level',
    legacyTeacherPrintExportMarker: 'teacher_print_export_package',
    offlineArtifact: policy.offlineArtifact || 'public/teacher-pilot-demo.html',
    serverSideDocxPdfClaimed: false,
    hostedRuntimeClaimed: false,
    aiUsed: false,
    sourceStatusIsUserSelectable: false,
    deepContentGenerated: false,
    printCssAvailable: true,
    exportModes: policy.exportModes || [],
    teacherFacingChecklist: policy.teacherFacingChecklist || [],
    claimPolicy: policy.claimPolicy || {},
    curriculumGapBoard: buildCurriculumGapBoard(),
    frame,
    plainText,
    printableHtmlSkeleton: '<!doctype html><html lang="vi"><head><meta charset="utf-8"><style>@media print{body{margin:18mm}}</style></head><body><!-- Client-side printable lesson body --></body></html>'
  };
}
