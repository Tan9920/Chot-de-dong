import intakePolicy from '@/data/academic-source-intake-policy.json';
import sourceSubmissions from '@/data/academic-source-pack-submissions.json';
import verificationQueue from '@/data/academic-verification-queue.json';
import { buildAcademicCoverageAuditReport } from './academic-coverage-audit';

const LEGAL_ALLOWED = new Set((intakePolicy as any).legalCheck?.allowedStatusesForReview || []);
const LEGAL_BLOCKED = new Set((intakePolicy as any).legalCheck?.blockedStatuses || []);

function asText(value: unknown) {
  return String(value ?? '').trim();
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function isFilled(value: unknown) {
  return asText(value).length > 0;
}

function normalizeStage(value: unknown) {
  const stage = asText(value) || 'draft';
  return (intakePolicy as any).sourcePackStages.includes(stage) ? stage : 'draft';
}

function blocker(label: string, teacherLabel: string, nextAction: string) {
  return { label, teacherLabel, nextAction };
}

export function evaluateAcademicSourcePack(input: any = {}) {
  const approvedReferences = asArray(input.approvedReferences);
  const legalStatus = asText(input.legalCheckStatus) || 'missing';
  const releaseGateStatus = asText(input.releaseGateStatus) || 'not_started';
  const stage = normalizeStage(input.stage);
  const blockers: Array<{ label: string; teacherLabel: string; nextAction: string }> = [];

  for (const field of ['scopeId', 'grade', 'subject', 'book', 'topic']) {
    if (!isFilled(input[field])) blockers.push(blocker(`missing_${field}`, `Thiếu ${field}`, `Bổ sung ${field} trước khi gửi duyệt.`));
  }

  for (const field of ['sourceType', 'sourceTitle', 'sourceOwner', 'sourceLocator']) {
    if (!isFilled(input[field])) blockers.push(blocker(`missing_${field}`, `Thiếu metadata nguồn: ${field}`, 'Chỉ nhập metadata/locator hợp pháp; không copy dài tài liệu bản quyền.'));
  }

  if (!isFilled(input.license) || asText(input.license) === 'missing' || asText(input.license) === 'unknown') {
    blockers.push(blocker('missing_license', 'Thiếu license/quyền sử dụng', 'Xác định license, quyền sử dụng hoặc cơ sở pháp lý trước khi public/review.'));
  }
  if (!isFilled(input.attribution)) {
    blockers.push(blocker('missing_attribution', 'Thiếu attribution/tác giả/nguồn', 'Bổ sung cách ghi nguồn/tác giả/chủ sở hữu rõ ràng.'));
  }
  if (!isFilled(input.permissionBasis) || ['missing', 'unknown'].includes(asText(input.permissionBasis))) {
    blockers.push(blocker('missing_permission_basis', 'Thiếu cơ sở được phép sử dụng', 'Ghi rõ official/public metadata only/teacher owned/permission granted hoặc hợp đồng sử dụng.'));
  }
  if (input.noLongCopyrightCopy !== true) {
    blockers.push(blocker('long_copyright_copy_risk', 'Có nguy cơ copy dài tài liệu bản quyền', 'Chỉ lưu metadata, mapping, trích yếu ngắn hợp pháp hoặc nội dung giáo viên tự sở hữu.'));
  }
  if (!isFilled(input.takedownContact)) {
    blockers.push(blocker('missing_takedown_contact', 'Thiếu đầu mối takedown', 'Tạo contact/quy trình gỡ nội dung trước khi public học liệu.'));
  }
  if (LEGAL_BLOCKED.has(legalStatus) || !LEGAL_ALLOWED.has(legalStatus)) {
    blockers.push(blocker('legal_check_not_cleared', 'Legal source check chưa đạt', 'Chuyển legalCheckStatus sang cleared/teacher_owned/official_public_metadata_only bằng bằng chứng thật.'));
  }
  if (!isFilled(input.reviewerRole) || !isFilled(input.reviewerId) || !isFilled(input.reviewerSignoffAt)) {
    blockers.push(blocker('missing_reviewer_signoff', 'Thiếu reviewer signoff thật', 'Cần reviewer có vai trò, danh tính và thời điểm ký duyệt.'));
  }
  if (approvedReferences.length < Number((intakePolicy as any).reviewGate?.requiresApprovedReferenceCount || 1)) {
    blockers.push(blocker('missing_approved_reference', 'Thiếu approved reference', 'Thêm ít nhất 1 nguồn/tài liệu hợp pháp đã được duyệt.'));
  }
  if (asText(input.assessmentItemReviewStatus) !== 'reviewed') {
    blockers.push(blocker('assessment_items_not_reviewed', 'Câu hỏi/rubric/đáp án chưa được review', 'Nếu có câu hỏi/rubric/đáp án, cần review riêng trước khi cho nội dung sâu.'));
  }
  if (!isFilled(input.exportComplianceLabel)) {
    blockers.push(blocker('missing_export_compliance_label', 'Thiếu nhãn compliance khi xuất file', 'Thêm nhãn seed/reviewed/verified và nguồn vào DOCX/PDF.'));
  }

  const readyForReviewerQueue = blockers.every((item) => ![
    'missing_scopeId',
    'missing_grade',
    'missing_subject',
    'missing_book',
    'missing_topic',
    'missing_sourceType',
    'missing_sourceTitle',
    'missing_sourceOwner',
    'missing_sourceLocator',
    'missing_license',
    'missing_attribution',
    'missing_permission_basis',
    'long_copyright_copy_risk',
    'missing_takedown_contact',
    'legal_check_not_cleared'
  ].includes(item.label));
  const readyForReviewedCandidate = blockers.length === 0 && stage !== 'rejected' && stage !== 'taken_down';
  const safeStage = readyForReviewedCandidate
    ? 'reviewed_candidate'
    : readyForReviewerQueue
      ? 'reviewer_queue'
      : legalStatus && LEGAL_BLOCKED.has(legalStatus)
        ? 'legal_hold'
        : 'draft';

  return {
    id: asText(input.id) || `dry-run-${Date.now()}`,
    scopeId: asText(input.scopeId),
    grade: asText(input.grade),
    subject: asText(input.subject),
    book: asText(input.book),
    topic: asText(input.topic),
    requestedStage: stage,
    evaluatedStage: safeStage,
    blockers,
    readyForReviewerQueue,
    readyForReviewedCandidate,
    canMutateRegistry: false,
    canAllowDeepContent: false,
    registryChangeBlockedReason: (intakePolicy as any).releaseGate?.batch104DoesNotMutateRegistry
      ? 'Batch104 chỉ tạo intake/review gate; không tự cập nhật registry hoặc bật contentDepthAllowed.'
      : 'Registry change requires separate release batch with audit log.',
    teacherSafeFallback: 'Scope này vẫn chỉ được dựng khung giáo án an toàn cho tới khi source pack có nguồn hợp pháp, license/attribution, takedown, reviewer signoff, approved references và release gate thật.',
    releaseGateStatus,
    evidenceSummary: {
      approvedReferenceCount: approvedReferences.length,
      legalCheckStatus: legalStatus,
      reviewerSignoffPresent: Boolean(isFilled(input.reviewerRole) && isFilled(input.reviewerId) && isFilled(input.reviewerSignoffAt)),
      noLongCopyrightCopy: input.noLongCopyrightCopy === true,
      takedownReady: isFilled(input.takedownContact)
    }
  };
}

export function buildAcademicSourcePackTemplate(scope: any = {}) {
  return {
    scopeId: scope.scopeId || scope.id || '',
    grade: scope.grade || '',
    level: scope.level || '',
    subject: scope.subject || '',
    book: scope.book || 'Giáo viên/trường chọn nguồn',
    topic: scope.topic || '',
    stage: 'draft',
    sourceType: 'official_public_metadata_only | teacher_owned | licensed_resource | school_internal_resource',
    sourceTitle: '',
    sourceOwner: '',
    sourceLocator: '',
    license: '',
    attribution: '',
    permissionBasis: '',
    shortExcerptPolicy: 'metadata_mapping_short_excerpt_only',
    noLongCopyrightCopy: true,
    takedownContact: '',
    reviewerRole: '',
    reviewerId: '',
    reviewerSignoffAt: '',
    legalCheckStatus: 'missing',
    releaseGateStatus: 'not_started',
    approvedReferences: [],
    assessmentItemReviewStatus: 'not_started',
    exportComplianceLabel: 'source_pack_draft_not_for_deep_content'
  };
}

export function buildAcademicSourceIntakeBoard() {
  const coverage = buildAcademicCoverageAuditReport();
  const queueItems = asArray((verificationQueue as any).items);
  const submittedItems = asArray((sourceSubmissions as any).items);
  const evaluations = submittedItems.map((item) => ({ ...item, evaluation: evaluateAcademicSourcePack(item) }));
  const highPriority = queueItems.filter((item: any) => item.priority === 'high').slice(0, 12);
  const readyForReviewerQueue = evaluations.filter((item: any) => item.evaluation.readyForReviewerQueue).length;
  const readyForReviewedCandidate = evaluations.filter((item: any) => item.evaluation.readyForReviewedCandidate).length;
  const blockedByLicenseOrLegal = evaluations.filter((item: any) => item.evaluation.blockers.some((b: any) => ['missing_license', 'missing_permission_basis', 'legal_check_not_cleared'].includes(b.label))).length;

  return {
    batch: 'Batch104 — Academic Source Pack Intake & Review Gate Foundation',
    version: (intakePolicy as any).version,
    generatedAt: new Date().toISOString(),
    status: 'source_pack_intake_foundation_registry_unchanged',
    plainLanguageStatus: 'Đã có khung nhập nguồn học thuật, license/attribution, reviewer signoff, approved references và takedown; chưa nâng bất kỳ scope nào thành verified/reviewed thật.',
    metrics: {
      totalAcademicScopes: coverage.metrics.totalScopes,
      deepContentAllowedScopes: coverage.metrics.deepContentAllowedScopes,
      verificationQueueItems: queueItems.length,
      intakeDrafts: submittedItems.length,
      readyForReviewerQueue,
      readyForReviewedCandidate,
      blockedByLicenseOrLegal,
      registryMutationsInBatch104: 0,
      fakeVerifiedCreated: 0
    },
    policy: intakePolicy,
    sourcePackTemplate: buildAcademicSourcePackTemplate(highPriority[0] || {}),
    highPriorityIntakePlan: highPriority.map((item: any) => ({
      scopeId: item.scopeId,
      grade: item.grade,
      level: item.level,
      subject: item.subject,
      currentSourceStatus: item.currentSourceStatus,
      currentSupportLevel: item.currentSupportLevel,
      priority: item.priority,
      sourcePackTemplate: buildAcademicSourcePackTemplate(item),
      firstSafeStep: 'Nhập metadata nguồn hợp pháp + license/attribution + takedown; chưa nhập nội dung dài.'
    })),
    evaluations,
    registryMutationGuard: {
      allowedNow: false,
      reason: 'Batch104 không cập nhật subject-data-registry; mọi scope vẫn giữ seed/developing/contentDepthAllowed=false cho tới khi có batch release riêng kèm bằng chứng thật.',
      nextBatchAfterRealEvidence: 'Khi có source pack thật, làm Batch105 Release Dossier for First Reviewed Scopes để cập nhật một số scope nhỏ có audit log.'
    },
    teacherPromiseAllowed: (intakePolicy as any).teacherFacingPromiseAllowed,
    forbiddenClaims: (intakePolicy as any).forbiddenClaims
  };
}
