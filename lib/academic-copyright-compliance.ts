import copyrightPolicy from '@/data/academic-copyright-compliance-policy.json';
import copyrightDossier from '@/data/academic-copyright-compliance-dossier.json';
import sourceSubmissions from '@/data/academic-source-pack-submissions.json';
import registry from '@/data/subject-data-registry.json';
import { evaluateAcademicSourcePack, buildAcademicSourcePackTemplate } from './academic-source-intake';
import { buildAcademicVerificationReadinessReport } from './academic-verification-accelerator';

type Blocker = { label: string; teacherLabel: string; nextAction: string; severity: 'blocker' | 'warning' };

const ALLOWED_CATEGORIES = new Set(
  (copyrightPolicy as any).allowedUseCategories
    .filter((item: any) => item.allowed === true)
    .map((item: any) => item.category)
);
const BLOCKED_CATEGORIES = new Set(
  (copyrightPolicy as any).allowedUseCategories
    .filter((item: any) => item.allowed === false)
    .map((item: any) => item.category)
);
const RISK_SIGNALS = new Set((copyrightPolicy as any).copyrightRiskSignals || []);

function asText(value: unknown) {
  return String(value ?? '').trim();
}

function asArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function lower(value: unknown) {
  return asText(value).toLowerCase();
}

function blocker(label: string, teacherLabel: string, nextAction: string, severity: 'blocker' | 'warning' = 'blocker'): Blocker {
  return { label, teacherLabel, nextAction, severity };
}

function containsLongCopyRisk(input: any) {
  const declared = input.noLongCopyrightCopy === true;
  const excerptLength = Number(input.excerptCharacterCount ?? input.shortExcerptCharacterCount ?? 0);
  const fields = [input.sourceType, input.sourceTitle, input.sourceOwner, input.permissionBasis, input.notes, input.resourceType].map(lower).join(' ');
  const riskyWords = ['sgk', 'sách giáo khoa', 'sach giao khoa', 'sách giáo viên', 'sach giao vien', 'teacher book', 'answer key', 'đáp án', 'de thi thuong mai', 'đề thi thương mại'];
  return !declared || excerptLength > 500 || riskyWords.some((word) => fields.includes(word));
}

export function evaluateAcademicCopyrightCompliance(input: any = {}) {
  const category = asText(input.usageCategory || input.permissionBasis || input.sourceType || 'unknown_or_unattributed');
  const riskSignals = asArray(input.copyrightRiskSignals);
  const legalCheckStatus = asText(input.legalCheckStatus || 'missing');
  const sourceEvaluation = evaluateAcademicSourcePack(input);
  const blockers: Blocker[] = [];

  if (!category || category === 'unknown' || category === 'missing') {
    blockers.push(blocker('unknown_usage_category', 'Chưa xác định loại quyền sử dụng', 'Phân loại nguồn: metadata only, teacher owned, licensed, school internal, open license hoặc blocked.'));
  }
  if (BLOCKED_CATEGORIES.has(category) || category.includes('commercial_textbook') || category.includes('unknown_or_unattributed')) {
    blockers.push(blocker('blocked_usage_category', 'Loại nguồn đang bị chặn bản quyền', 'Không nhập/công khai nội dung; chỉ giữ metadata nếu hợp pháp hoặc xin giấy phép rõ phạm vi.'));
  }
  if (!ALLOWED_CATEGORIES.has(category) && !['official_public_metadata_only', 'teacher_owned', 'licensed_resource', 'school_internal_resource', 'public_domain_or_open_license'].includes(category)) {
    blockers.push(blocker('category_not_allowed_by_policy', 'Loại nguồn chưa được policy cho phép', 'Đưa về legal_hold cho tới khi legal reviewer phân loại.'));
  }
  if (!asText(input.license) || ['missing', 'unknown'].includes(lower(input.license))) {
    blockers.push(blocker('missing_license', 'Thiếu license/quyền sử dụng', 'Bổ sung license, hợp đồng, permission hoặc chỉ dùng metadata.'));
  }
  if (!asText(input.attribution)) {
    blockers.push(blocker('missing_attribution', 'Thiếu ghi nguồn/tác giả/NXB', 'Bắt buộc attribution trong UI/export trước khi public.'));
  }
  if (!asText(input.permissionBasis) || ['missing', 'unknown'].includes(lower(input.permissionBasis))) {
    blockers.push(blocker('missing_permission_basis', 'Thiếu cơ sở được phép sử dụng', 'Ghi rõ: official metadata only, teacher owned, school permission, license hoặc public domain/open license.'));
  }
  if (!asText(input.takedownContact)) {
    blockers.push(blocker('missing_takedown_path', 'Thiếu đường gỡ nội dung/takedown', 'Tạo contact và quy trình gỡ trước khi tài nguyên được public hoặc export.'));
  }
  if (!['cleared', 'teacher_owned', 'official_public_metadata_only', 'licensed', 'open_license_checked', 'school_internal_only'].includes(legalCheckStatus)) {
    blockers.push(blocker('legal_check_not_cleared', 'Legal check chưa đạt', 'Giữ legal_hold; không reviewed/verified/deep content.'));
  }
  if (containsLongCopyRisk(input)) {
    blockers.push(blocker('long_copyright_copy_risk', 'Nguy cơ copy dài SGK/SGV/tài liệu bản quyền', 'Chỉ lưu metadata, mapping, trích yếu ngắn thật sự cần thiết hoặc nội dung tự sở hữu.'));
  }
  const matchedRiskSignals = riskSignals.filter((signal) => RISK_SIGNALS.has(signal));
  if (matchedRiskSignals.length > 0) {
    blockers.push(blocker('copyright_risk_signal_present', 'Có tín hiệu rủi ro bản quyền', `Xử lý từng tín hiệu trước khi review: ${matchedRiskSignals.join(', ')}`));
  }
  if (category === 'official_public_metadata_only' && input.contentDepthRequested === true) {
    blockers.push(blocker('metadata_only_cannot_unlock_deep_content', 'Nguồn chính thống dạng metadata không mở nội dung sâu', 'Cần source pack bài/chủ đề và quyền sử dụng nội dung riêng.'));
  }
  if (input.publicReleaseRequested === true && input.currentLawCheckComplete !== true) {
    blockers.push(blocker('current_law_check_required', 'Chưa kiểm tra pháp lý hiện hành trước public release', 'Đối chiếu Luật SHTT, Nghị định 17/2023 và văn bản sửa đổi mới nhất trước release.'));
  }

  const sourcePackBlockerLabels = new Set(sourceEvaluation.blockers.map((item: any) => item.label));
  for (const item of sourceEvaluation.blockers) {
    if (['missing_license', 'missing_attribution', 'missing_permission_basis', 'long_copyright_copy_risk', 'missing_takedown_contact', 'legal_check_not_cleared'].includes(item.label)) {
      blockers.push(blocker(`source_pack_${item.label}`, item.teacherLabel, item.nextAction));
    }
  }

  const hardBlockers = blockers.filter((item) => item.severity === 'blocker');
  const legalReadyForReviewerQueue = hardBlockers.length === 0 && sourceEvaluation.readyForReviewerQueue;
  const legalReadyForReviewedCandidate = hardBlockers.length === 0 && sourceEvaluation.readyForReviewedCandidate;

  return {
    id: asText(input.id) || `copyright-dry-run-${Date.now()}`,
    scopeId: asText(input.scopeId),
    usageCategory: category,
    legalCheckStatus,
    riskSignals: matchedRiskSignals,
    sourcePackBlockerLabels: Array.from(sourcePackBlockerLabels),
    blockers,
    legalReadyForReviewerQueue,
    legalReadyForReviewedCandidate,
    canPublicRelease: false,
    canMutateRegistry: false,
    canAllowDeepContent: false,
    evaluatedStage: hardBlockers.length > 0 ? 'legal_hold' : legalReadyForReviewedCandidate ? 'reviewed_candidate_needs_release_dossier' : 'reviewer_queue',
    teacherSafeFallback: 'Nếu legal/copyright gate chưa đạt, hệ thống chỉ dựng khung giáo án an toàn và yêu cầu giáo viên nhập/chọn nội dung hợp pháp.',
    exportLabelRequired: 'copyright_status_and_data_status_must_be_visible_in_docx_pdf',
    policyVersion: (copyrightPolicy as any).version
  };
}

export function buildCopyrightSafeSourcePackTemplate(scope: any = {}) {
  return {
    ...buildAcademicSourcePackTemplate(scope),
    usageCategory: 'official_public_metadata_only',
    copyrightRiskSignals: [],
    excerptCharacterCount: 0,
    contentDepthRequested: false,
    publicReleaseRequested: false,
    currentLawCheckComplete: false,
    ownerDeclaration: '',
    licenseEvidenceLocator: '',
    exportCopyrightLabel: 'metadata_only_not_copyright_cleared_for_deep_content',
    legalReviewerId: '',
    legalReviewerSignoffAt: ''
  };
}

export function buildAcademicCopyrightComplianceReport() {
  const submissions = asArray((sourceSubmissions as any).items);
  const registryRecords = asArray((registry as any).records);
  const evaluations = submissions.map((item: any) => ({ ...item, copyrightEvaluation: evaluateAcademicCopyrightCompliance(item) }));
  const verificationReadiness = buildAcademicVerificationReadinessReport();
  const totalSubmissions = submissions.length;
  const legalHold = evaluations.filter((item: any) => item.copyrightEvaluation.evaluatedStage === 'legal_hold').length;
  const legalReady = evaluations.filter((item: any) => item.copyrightEvaluation.legalReadyForReviewedCandidate).length;
  const fakeVerified = registryRecords.filter((item: any) => ['verified', 'approved_for_release'].includes(item.sourceStatus) || item.contentDepthAllowed);

  return {
    batch: 'Batch112 — Legal/Copyright-Safe Academic Verification Pipeline',
    version: (copyrightPolicy as any).version,
    generatedAt: new Date().toISOString(),
    status: 'copyright_pipeline_ready_registry_unchanged_safe_frame_only',
    plainLanguageStatus: 'Đã thêm lớp kiểm tra bản quyền/pháp lý trước khi nâng Verified học thuật thật. Không copy dài SGK/SGV, không dùng ngoại lệ giáo dục để public sản phẩm, không bật nội dung sâu nếu thiếu license/reviewer/takedown.',
    metrics: {
      totalAcademicScopes: registryRecords.length,
      sourcePackSubmissions: totalSubmissions,
      copyrightCheckedSourcePacks: totalSubmissions,
      legalHoldSourcePacks: legalHold,
      legalReadyForReviewedCandidateSourcePacks: legalReady,
      verifiedOrApprovedScopes: verificationReadiness.metrics.verifiedOrApprovedScopes,
      deepContentAllowedScopes: verificationReadiness.metrics.deepContentAllowedScopes,
      registryMutationsInBatch112: 0,
      fakeVerifiedCreated: 0,
      fakeContentDepthCreated: fakeVerified.filter((item: any) => item.contentDepthAllowed && !['verified', 'approved_for_release'].includes(item.sourceStatus)).length
    },
    legalBasis: (copyrightPolicy as any).researchedLegalBasis,
    policy: copyrightPolicy,
    dossier: copyrightDossier,
    safeTemplate: buildCopyrightSafeSourcePackTemplate((copyrightDossier as any).pilotScopesStillBlocked?.[0] || {}),
    evaluations,
    strictUpgradePath: [
      '1) Tra cứu nguồn pháp lý hiện hành và ghi locator nguồn.',
      '2) Chỉ nhập metadata/mapping/trích yếu ngắn hoặc nội dung tự sở hữu/đã có license.',
      '3) Chạy copyright compliance gate: license, attribution, permissionBasis, noLongCopy, takedown, current-law check.',
      '4) Reviewer chuyên môn và legal reviewer ký audit log thật.',
      '5) Chỉ sau release dossier nhỏ mới được cập nhật registry reviewed/verified; Batch112 không tự cập nhật.'
    ],
    forbiddenClaims: (copyrightPolicy as any).forbiddenClaims,
    warning: 'Legal-ready không đồng nghĩa academic verified; academic verified cũng không tự cho phép copy tài liệu bản quyền nếu license không cho phép.'
  };
}

export function buildAcademicCopyrightComplianceBoard() {
  return {
    report: buildAcademicCopyrightComplianceReport(),
    adminWarning: 'Board này chặn bản quyền/pháp lý trước khi nâng Verified học thuật. Không dùng để fake coverage hoặc tự mở contentDepthAllowed.',
    nextSafeBatchAfterRealEvidence: 'Khi có source pack thật và license/reviewer/takedown đầy đủ cho 1-3 scope nhỏ, làm release dossier rất hẹp; không tăng hàng loạt.'
  };
}
