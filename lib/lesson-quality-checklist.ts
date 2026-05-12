function includesAll(content: string, items: string[]) {
  return items.every((item) => content.includes(item));
}

function buildCheck(id: string, label: string, status: 'pass' | 'warning' | 'blocker', detail: string) {
  return { id, label, status, detail };
}

export function assessLessonQuality(input: any = {}) {
  const content = String(input.content || '');
  const sourceStatus = input.sourceStatus || 'scaffold';
  const releaseTier = input.releaseTier || 'internal_preview';
  const supportLevel = input.supportLevel || 'starter';
  const isDeepData = ['reviewed', 'verified', 'approved_for_release'].includes(sourceStatus) && ['foundation', 'operational'].includes(supportLevel);
  const checks = [];

  checks.push(buildCheck(
    'core_sections',
    'Đủ 8 mục chính của kế hoạch bài dạy',
    includesAll(content, ['I. THÔNG TIN CHUNG', 'II. YÊU CẦU CẦN ĐẠT', 'III. THIẾT BỊ', 'IV. PHƯƠNG PHÁP', 'V. TIẾN TRÌNH', 'VI. KIỂM TRA', 'VII. PHÂN HÓA', 'VIII. GHI CHÚ']) ? 'pass' : 'blocker',
    'Giáo án cần đủ thông tin chung, yêu cầu cần đạt, thiết bị/học liệu, phương pháp, tiến trình, đánh giá, phân hóa và ghi chú sau tiết dạy.'
  ));

  checks.push(buildCheck(
    'learning_outcomes',
    'Yêu cầu cần đạt có kiến thức/kĩ năng, năng lực, phẩm chất, minh chứng',
    includesAll(content, ['Kiến thức, kĩ năng', 'Năng lực chung', 'Năng lực đặc thù', 'Phẩm chất', 'Minh chứng đánh giá', 'Lưu ý kĩ thuật']) ? 'pass' : 'blocker',
    'Mục yêu cầu cần đạt không được chỉ ghi chung chung; phải có năng lực/phẩm chất và minh chứng đánh giá.'
  ));

  checks.push(buildCheck(
    'activity_structure',
    'Mỗi hoạt động có mục tiêu, nội dung, sản phẩm, tổ chức thực hiện',
    includesAll(content, ['a) Mục tiêu', 'b) Nội dung', 'c) Sản phẩm', 'd) Tổ chức thực hiện']) ? 'pass' : 'blocker',
    'Tiến trình phải tránh chỉ mô tả chung; mỗi hoạt động cần đủ 4 thành phần.'
  ));

  checks.push(buildCheck(
    'teaching_steps',
    'Tổ chức thực hiện có đủ 4 bước',
    includesAll(content, ['Chuyển giao nhiệm vụ', 'Thực hiện nhiệm vụ', 'Báo cáo, thảo luận', 'Kết luận, nhận định']) ? 'pass' : 'blocker',
    'Mỗi hoạt động cần có chuyển giao, thực hiện, báo cáo/thảo luận, kết luận/nhận định.'
  ));

  checks.push(buildCheck(
    'data_truth_label',
    'Có nhãn trạng thái dữ liệu và cảnh báo nguồn',
    includesAll(content, ['Trạng thái dữ liệu', 'CẢNH BÁO DỮ LIỆU MÔN HỌC']) || sourceStatus !== 'verified' ? 'warning' : 'pass',
    'Bản nháp phải cho giáo viên thấy dữ liệu đang seed/scaffold/reviewed/verified và cần kiểm tra nguồn.'
  ));

  checks.push(buildCheck(
    'safe_content_gate',
    'Không sinh kiến thức sâu khi dữ liệu chưa đủ',
    isDeepData ? 'pass' : (content.includes('không sinh kiến thức sâu') || content.includes('Không tự bịa')) ? 'pass' : 'blocker',
    'Nếu source/support chưa đạt reviewed+foundation thì giáo án chỉ được là khung an toàn.'
  ));

  checks.push(buildCheck(
    'source_license',
    'Có yêu cầu nguồn/license/attribution cho học liệu',
    includesAll(content, ['nguồn', 'license']) || content.includes('attribution') ? 'pass' : 'warning',
    'Học liệu/ảnh/tài nguyên cần nguồn, license, attribution và trạng thái duyệt.'
  ));

  checks.push(buildCheck(
    'differentiation',
    'Có phân hóa học sinh',
    content.includes('Nhóm cần hỗ trợ') && content.includes('Nhóm chuẩn') ? 'pass' : 'warning',
    'Giáo án cần phân hóa cho học sinh cần hỗ trợ, chuẩn và khá/giỏi/nâng cao.'
  ));

  checks.push(buildCheck(
    'casio_guard',
    'Có chặn Casio/máy tính cầm tay nếu chưa duyệt',
    content.includes('Casio') || content.includes('máy tính cầm tay') ? 'pass' : 'warning',
    'Không tự thêm hướng dẫn Casio/máy tính cầm tay nếu chưa có dữ liệu duyệt hoặc giáo viên nhập.'
  ));

  checks.push(buildCheck(
    'release_claims',
    'Không overclaim chuẩn Bộ/100%/dùng ngay',
    /(chuẩn Bộ|100%|dùng ngay không cần)/i.test(content) ? 'blocker' : 'pass',
    'Không quảng cáo bản nháp là chuẩn Bộ, đúng 100% hoặc dùng ngay không cần giáo viên kiểm tra.'
  ));

  const blockers = checks.filter((item) => item.status === 'blocker').length;
  const warnings = checks.filter((item) => item.status === 'warning').length;
  const passes = checks.filter((item) => item.status === 'pass').length;
  const score = Math.max(0, Math.min(100, Math.round((passes / checks.length) * 100 - blockers * 12 - warnings * 3)));

  return {
    generatedAt: new Date().toISOString(),
    checks,
    summary: {
      score,
      blockers,
      warnings,
      passes,
      total: checks.length,
      sourceStatus,
      releaseTier,
      supportLevel,
      safeToExportAsDraft: blockers === 0,
      safeForOfficialUse: blockers === 0 && warnings <= 1 && isDeepData && ['school_release_candidate', 'school_released', 'public_release_candidate', 'public_released'].includes(releaseTier)
    },
    note: 'Checklist rule-based giúp phát hiện thiếu cấu trúc/nguồn/gate dữ liệu; không thay thế thẩm định chuyên môn.'
  };
}
