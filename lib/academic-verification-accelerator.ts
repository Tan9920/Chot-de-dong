import sourceCatalog from '@/data/official-curriculum-source-catalog.json';
import readinessDossier from '@/data/academic-verification-readiness-dossier.json';
import registry from '@/data/subject-data-registry.json';
import sourceSubmissions from '@/data/academic-source-pack-submissions.json';
import { buildAcademicCoverageAuditReport } from './academic-coverage-audit';
import { buildAcademicSourcePackTemplate, evaluateAcademicSourcePack } from './academic-source-intake';

const STATUS_VERIFIED = new Set(['verified', 'approved_for_release']);

function pct(value: number, total: number) {
  return total <= 0 ? 0 : Math.round((value / total) * 1000) / 10;
}

function normalizeGrade(value: any) {
  const match = String(value ?? '').match(/\d+/);
  return match ? match[0] : String(value ?? '').trim();
}

function sourceSpineForGrade(grade: string) {
  return (sourceCatalog as any).gradeBandSourceSpine.find((item: any) => {
    return (item.grades || []).map(String).includes(normalizeGrade(grade));
  });
}

function isRealReviewedSubmission(item: any) {
  const evaluation = evaluateAcademicSourcePack(item);
  return Boolean(evaluation.readyForReviewedCandidate && item?.stage === 'reviewed_candidate');
}

function buildScopeRows() {
  const records = Array.isArray((registry as any).records) ? (registry as any).records : [];
  return records.map((record: any) => {
    const spine = sourceSpineForGrade(record.grade);
    const sourceIds = spine?.rootSourceIds || [];
    const sourceSpineReady = sourceIds.length > 0;
    const submissions = ((sourceSubmissions as any).items || []).filter((item: any) => item.scopeId === record.id);
    const reviewedSubmissions = submissions.filter(isRealReviewedSubmission);
    const verifiedOrApproved = STATUS_VERIFIED.has(record.sourceStatus);
    return {
      id: record.id,
      grade: record.grade,
      level: record.level,
      subject: record.subject,
      book: record.book,
      currentSourceStatus: record.sourceStatus,
      currentSupportLevel: record.supportLevel,
      currentReviewStatus: record.reviewStatus,
      sourceSpineReady,
      sourceSpineIds: sourceIds,
      sourcePackSubmissions: submissions.length,
      reviewedSourcePackSubmissions: reviewedSubmissions.length,
      verifiedOrApproved,
      contentDepthAllowed: Boolean(record.contentDepthAllowed),
      readinessStage: verifiedOrApproved
        ? 'verified_or_approved_registry_state'
        : reviewedSubmissions.length > 0
          ? 'reviewed_candidate_needs_release_dossier'
          : sourceSpineReady
            ? 'official_source_spine_ready_needs_source_pack_and_reviewer'
            : 'missing_official_source_spine',
      nextAction: verifiedOrApproved
        ? 'Kiểm tra release gate và export compliance trước khi cho sinh sâu.'
        : reviewedSubmissions.length > 0
          ? 'Lập release dossier nhỏ, kiểm tra legal/export/takedown rồi mới cập nhật registry.'
          : sourceSpineReady
            ? 'Nhập source pack bài/chủ đề cụ thể, reviewer signoff thật, license/attribution, no-long-copy và approved references.'
            : 'Bổ sung official curriculum source spine cho scope trước.'
    };
  });
}

function buildPriorityTemplates(rows: any[]) {
  const pilotScopes = new Set(((readinessDossier as any).releaseCandidates || []).map((item: any) => item.scopeId));
  const selected = rows.filter((row) => pilotScopes.has(row.id) || ['5', '6', '9', '10', '12'].includes(normalizeGrade(row.grade))).slice(0, 12);
  return selected.map((row) => ({
    scopeId: row.id,
    grade: row.grade,
    subject: row.subject,
    sourceSpineIds: row.sourceSpineIds,
    sourcePackTemplate: {
      ...buildAcademicSourcePackTemplate({ scopeId: row.id, grade: row.grade, level: row.level, subject: row.subject, book: row.book }),
      sourceType: 'official_public_metadata_only',
      sourceTitle: 'Điền văn bản CTGDPT/SGK/học liệu hợp pháp dùng cho scope này',
      sourceOwner: 'Bộ GD&ĐT / NXB / giáo viên hoặc trường sở hữu quyền',
      sourceLocator: row.sourceSpineIds.join(' + '),
      license: 'official_public_metadata_only_or_permission_required',
      attribution: 'Ghi rõ số/ký hiệu văn bản, NXB/tác giả/học liệu nếu có',
      permissionBasis: 'official_public_metadata_only',
      legalCheckStatus: 'official_public_metadata_only',
      exportComplianceLabel: 'batch111_source_spine_ready_not_verified'
    },
    warning: 'Template này chỉ giúp nhập bằng chứng; không tự nâng reviewed/verified và không bật contentDepthAllowed.'
  }));
}

export function buildOfficialCurriculumSourceCatalog() {
  return {
    ...(sourceCatalog as any),
    officialSourceCount: ((sourceCatalog as any).officialSources || []).length,
    currentKnownAmendmentIds: ((sourceCatalog as any).officialSources || [])
      .filter((item: any) => String(item.id).includes('2025') || String(item.verificationValue).includes('latest'))
      .map((item: any) => item.id)
  };
}

export function buildAcademicVerificationReadinessReport() {
  const coverage = buildAcademicCoverageAuditReport();
  const rows = buildScopeRows();
  const total = rows.length;
  const sourceSpineReady = rows.filter((row) => row.sourceSpineReady).length;
  const reviewedCandidates = rows.filter((row) => row.reviewedSourcePackSubmissions > 0).length;
  const verifiedOrApproved = rows.filter((row) => row.verifiedOrApproved).length;
  const deepContentAllowed = rows.filter((row) => row.contentDepthAllowed).length;
  const fakeDeep = rows.filter((row) => row.contentDepthAllowed && !row.verifiedOrApproved).length;

  return {
    batch: 'Batch111 — Verified Academic 1–12 Readiness & Official Source Spine',
    version: (readinessDossier as any).version,
    generatedAt: new Date().toISOString(),
    status: verifiedOrApproved > 0 ? 'verified_registry_exists_recheck_release_gate' : 'official_source_spine_ready_registry_still_safe_frame_only',
    plainLanguageStatus: 'Đợt này chỉ tập trung Verified học thuật thật 1–12: đã bổ sung xương sống nguồn chính thống và dossier nâng cấp; chưa nâng nhãn verified nếu chưa có source pack bài/chủ đề + reviewer thật.',
    metrics: {
      totalAcademicScopes: total,
      officialSourceDocuments: ((sourceCatalog as any).officialSources || []).length,
      scopesWithOfficialSourceSpine: sourceSpineReady,
      officialSourceSpineReadyPercent: pct(sourceSpineReady, total),
      reviewedCandidateScopes: reviewedCandidates,
      reviewedCandidatePercent: pct(reviewedCandidates, total),
      verifiedOrApprovedScopes: verifiedOrApproved,
      verifiedOrApprovedPercent: pct(verifiedOrApproved, total),
      deepContentAllowedScopes: deepContentAllowed,
      deepContentAllowedPercent: pct(deepContentAllowed, total),
      registryMutationsInBatch111: 0,
      fakeVerifiedCreated: 0,
      fakeContentDepthCreated: fakeDeep
    },
    sourceCatalog: buildOfficialCurriculumSourceCatalog(),
    readinessDossier,
    coverageSnapshot: {
      batch: coverage.batch,
      totalScopes: coverage.metrics.totalScopes,
      verifiedOrApprovedScopes: coverage.metrics.verifiedOrApprovedScopes,
      deepContentAllowedScopes: coverage.metrics.deepContentAllowedScopes,
      blockedFromDeepContentScopes: coverage.metrics.blockedFromDeepContentScopes,
      forbiddenClaims: coverage.forbiddenClaims
    },
    prioritySourcePackTemplates: buildPriorityTemplates(rows),
    sampleRows: rows.slice(0, 30),
    strictUpgradePath: [
      '1) Chỉ lưu official source spine + metadata hợp pháp, không copy dài.',
      '2) Tạo source pack cho từng lớp/môn/bài/chủ đề cụ thể.',
      '3) Reviewer chuyên môn thật ký duyệt, có reviewerId/reviewerRole/reviewerSignoffAt.',
      '4) Legal/license/attribution/takedown/export compliance pass.',
      '5) Chỉ sau đó mới tạo release dossier nhỏ để cập nhật registry reviewed/verified và mở contentDepthAllowed nếu đủ gate.'
    ],
    allowedClaims: [
      'Đã có official source spine để bắt đầu nâng verified thật có kiểm soát.',
      'Đã có readiness board tách rõ source spine, source pack, reviewed candidate, verified và deep content.',
      'Batch111 không tạo verified giả và không mở sinh kiến thức sâu khi thiếu reviewer/source pack.'
    ],
    forbiddenClaims: [
      'Không nói verified học thuật 1–12 đã tăng thật nếu chưa có reviewer và source pack bài cụ thể.',
      'Không gộp officialSourceSpineReadyPercent với verifiedOrApprovedPercent.',
      'Không nói đã chuẩn Bộ/đúng 100%/dùng chính thức ngay.',
      'Không mở câu hỏi, đáp án, Casio hoặc nội dung sâu chỉ dựa vào văn bản chương trình tổng thể.'
    ]
  };
}

export function buildAcademicVerificationReadinessBoard() {
  const report = buildAcademicVerificationReadinessReport();
  return {
    report,
    adminWarning: 'Board này dùng để nâng Verified học thuật thật từng scope nhỏ. Nó không được phép tự ghi registry hoặc bật contentDepthAllowed.',
    nextSafeBatchAfterEvidence: 'Khi user cung cấp source pack/reviewer thật cho một vài scope, làm Batch112 First Reviewed Scope Release Dossier — cập nhật rất ít scope có audit log, không tăng ồ ạt.'
  };
}
