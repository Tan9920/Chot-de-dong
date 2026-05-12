import registry from '@/data/subject-data-registry.json';
import policy from '@/data/academic-verification-policy.json';
import verificationQueue from '@/data/academic-verification-queue.json';
import { buildSubjectDataGate, listSubjectDataRecords } from './subject-data-truth';
import { getStarterCurriculumStats, getStarterTopicTitles } from './starter-curriculum-catalog';

const STATUS_ORDER = ['scaffold', 'seed', 'community', 'reviewed', 'verified', 'approved_for_release'];
const SUPPORT_ORDER = ['starter', 'developing', 'foundation', 'operational'];

function rank(order: string[], value: string) {
  const index = order.indexOf(value);
  return index < 0 ? 0 : index;
}

function percent(value: number, total: number) {
  return total <= 0 ? 0 : Math.round((value / total) * 1000) / 10;
}

function normalizeGrade(value: any) {
  const match = String(value || '').match(/\d+/);
  return match ? match[0] : String(value || '').trim();
}

function isTransitionGrade(grade: string) {
  return ['1', '5', '6', '9', '10', '12'].includes(normalizeGrade(grade));
}

function recordBlockers(record: any) {
  const sourceStatus = record?.sourceStatus || 'scaffold';
  const supportLevel = record?.supportLevel || 'starter';
  const approvedReferenceCount = Number(record?.approvedReferenceCount || 0);
  const reviewStatus = record?.reviewStatus || 'not_reviewed';
  const blockers = [];
  if (rank(STATUS_ORDER, sourceStatus) < rank(STATUS_ORDER, 'reviewed')) blockers.push('source_not_reviewed');
  if (rank(SUPPORT_ORDER, supportLevel) < rank(SUPPORT_ORDER, 'foundation')) blockers.push('support_not_foundation');
  if (approvedReferenceCount < Number((policy as any).deepContentGate?.requiresApprovedReferenceCount || 1)) blockers.push('missing_approved_reference');
  if (reviewStatus === 'not_reviewed') blockers.push('missing_reviewer_signoff');
  if (!record?.contentDepthAllowed) blockers.push('deep_content_locked');
  if (record?.casioAllowed && !record?.contentDepthAllowed) blockers.push('casio_must_remain_locked');
  return blockers;
}

function publicTeacherLabel(record: any) {
  if (record?.contentDepthAllowed) return 'Có dữ liệu đã kiểm soát';
  if (record?.sourceStatus === 'reviewed') return 'Đã xem lại một phần';
  if (record?.sourceStatus === 'seed') return 'Bản mẫu thử';
  return 'Chỉ có khung an toàn';
}

export function buildAcademicCoverageMatrix() {
  return (listSubjectDataRecords() as any[]).map((record) => {
    const gate = buildSubjectDataGate(record);
    const blockers = recordBlockers(record);
    const starterTopics = getStarterTopicTitles({ grade: record.grade, subject: record.subject });
    return {
      id: record.id,
      level: record.level,
      grade: record.grade,
      subject: record.subject,
      book: record.book,
      topicCount: Math.max(Number(record.topicCount || 0), starterTopics.length),
      starterTopics,
      sourceStatus: record.sourceStatus,
      reviewStatus: record.reviewStatus,
      releaseTier: record.releaseTier,
      supportLevel: record.supportLevel,
      contentDepthAllowed: Boolean(gate.contentDepthAllowed),
      casioAllowed: Boolean(gate.casioAllowed),
      approvedReferenceCount: Number(record.approvedReferenceCount || 0),
      sourceReferenceCount: Number(record.sourceReferenceCount || 0),
      teacherLabel: publicTeacherLabel(record),
      safeLessonMode: gate.safeLessonMode,
      teacherSafeFallback: 'Chỉ dựng khung giáo án; giáo viên nhập/chọn kiến thức, học liệu, câu hỏi, đáp án từ nguồn hợp pháp.',
      priority: isTransitionGrade(record.grade) ? 'high' : 'normal',
      blockers,
      verificationNextStep: blockers.includes('missing_approved_reference')
        ? 'Bổ sung source pack hợp pháp + metadata + license/attribution.'
        : blockers.includes('missing_reviewer_signoff')
          ? 'Gửi reviewer chuyên môn kiểm tra và ký nhận.'
          : blockers.includes('support_not_foundation')
            ? 'Bổ sung học liệu/câu hỏi/rubric tối thiểu để đạt foundation.'
            : 'Kiểm tra release gate trước khi cho dùng sâu.'
    };
  });
}

export function buildAcademicCoverageAuditReport(input: any = {}) {
  const matrix = buildAcademicCoverageMatrix();
  const filtered = matrix.filter((item) => {
    if (input.grade && normalizeGrade(item.grade) !== normalizeGrade(input.grade)) return false;
    if (input.subject && String(item.subject).toLowerCase() !== String(input.subject).toLowerCase()) return false;
    return true;
  });
  const source = filtered.length ? filtered : matrix;
  const byStatus: Record<string, number> = {};
  const bySupport: Record<string, number> = {};
  const byLevel: Record<string, any> = {};
  const byGrade: Record<string, any> = {};
  const bySubject: Record<string, any> = {};

  for (const item of source) {
    byStatus[item.sourceStatus] = (byStatus[item.sourceStatus] || 0) + 1;
    bySupport[item.supportLevel] = (bySupport[item.supportLevel] || 0) + 1;
    byLevel[item.level] ||= { level: item.level, total: 0, verified: 0, deepContentAllowed: 0, blocked: 0 };
    byGrade[item.grade] ||= { grade: item.grade, total: 0, verified: 0, deepContentAllowed: 0, blocked: 0 };
    bySubject[item.subject] ||= { subject: item.subject, total: 0, verified: 0, deepContentAllowed: 0, blocked: 0 };
    for (const bucket of [byLevel[item.level], byGrade[item.grade], bySubject[item.subject]]) {
      bucket.total += 1;
      if (item.sourceStatus === 'verified' || item.sourceStatus === 'approved_for_release') bucket.verified += 1;
      if (item.contentDepthAllowed) bucket.deepContentAllowed += 1;
      if (item.blockers.length > 0) bucket.blocked += 1;
    }
  }

  const total = source.length;
  const verified = source.filter((item) => item.sourceStatus === 'verified' || item.sourceStatus === 'approved_for_release').length;
  const reviewed = source.filter((item) => item.sourceStatus === 'reviewed').length;
  const deepContentAllowed = source.filter((item) => item.contentDepthAllowed).length;
  const blocked = source.filter((item) => item.blockers.length > 0).length;
  const missingReferences = source.filter((item) => item.blockers.includes('missing_approved_reference')).length;
  const missingReviewer = source.filter((item) => item.blockers.includes('missing_reviewer_signoff')).length;
  const starterStats = getStarterCurriculumStats();

  return {
    batch: 'Batch103 — Academic Coverage Truth & Verification Gate',
    version: (registry as any).version,
    generatedAt: new Date().toISOString(),
    scopeFilter: input,
    status: deepContentAllowed > 0 ? 'partial_verified_data_exists' : 'safe_frame_only_academic_data',
    plainLanguageStatus: deepContentAllowed > 0
      ? 'Một phần scope có thể dùng dữ liệu có kiểm soát; các scope còn lại vẫn phải dựng khung an toàn.'
      : 'Có catalog lớp/môn/chủ đề để giáo viên chọn, nhưng chưa có scope nào đủ điều kiện sinh kiến thức sâu. Hệ thống phải dựng khung an toàn.',
    metrics: {
      totalScopes: total,
      starterCatalogGrades: starterStats.gradeCount,
      starterCatalogSubjects: starterStats.subjectScopeCount,
      starterCatalogTopics: starterStats.topicCount,
      verifiedOrApprovedScopes: verified,
      reviewedScopes: reviewed,
      deepContentAllowedScopes: deepContentAllowed,
      blockedFromDeepContentScopes: blocked,
      missingApprovedReferenceScopes: missingReferences,
      missingReviewerSignoffScopes: missingReviewer,
      verifiedOrApprovedPercent: percent(verified, total),
      deepContentAllowedPercent: percent(deepContentAllowed, total),
      blockedFromDeepContentPercent: percent(blocked, total)
    },
    byStatus,
    bySupport,
    byLevel: Object.values(byLevel),
    byGrade: Object.values(byGrade).sort((a: any, b: any) => Number(a.grade) - Number(b.grade)),
    bySubject: Object.values(bySubject).sort((a: any, b: any) => String(a.subject).localeCompare(String(b.subject), 'vi')),
    highPriorityQueue: (verificationQueue as any).items.filter((item: any) => item.priority === 'high').slice(0, 20),
    sampleBlockedScopes: source.filter((item) => item.blockers.length > 0).slice(0, 20),
    policy: (policy as any).deepContentGate,
    nonNegotiables: (policy as any).nonNegotiables,
    requiredEvidenceForVerifiedScope: (policy as any).requiredEvidenceForVerifiedScope,
    allowedTeacherPromise: [
      'Có thể nói hệ thống đã biết rõ scope nào chỉ là starter/seed/scaffold.',
      'Có thể nói generator bị khóa ở chế độ khung an toàn khi thiếu dữ liệu reviewed/foundation/source.',
      'Có thể nói đã có verification queue để nhập-duyệt dữ liệu học thuật theo từng lớp/môn.'
    ],
    forbiddenClaims: [
      'Không nói dữ liệu học thuật 1–12 đã verified đầy đủ.',
      'Không nói giáo án đúng 100% hoặc chuẩn Bộ.',
      'Không nâng seed/starter/scaffold thành verified bằng code.',
      'Không tự sinh câu hỏi/đáp án/Casio nếu chưa có data được duyệt hoặc giáo viên tự nhập.'
    ]
  };
}

export function buildAcademicVerificationGate(input: any = {}) {
  const gate = buildSubjectDataGate(input);
  const blockers = gate.record ? recordBlockers(gate.record) : ['scope_not_found', 'deep_content_locked'];
  return {
    ...gate,
    academicPolicyVersion: (policy as any).version,
    teacherFacingLabel: publicTeacherLabel(gate.record),
    blockedFromDeepContent: !gate.contentDepthAllowed,
    blockers,
    requiredEvidenceForVerifiedScope: (policy as any).requiredEvidenceForVerifiedScope,
    safeFallback: 'Tạo khung giáo án an toàn; giáo viên nhập/chọn kiến thức, học liệu, câu hỏi, đáp án và nguồn hợp pháp trước khi dùng chính thức.',
    verificationNextStep: blockers.includes('scope_not_found')
      ? 'Tạo scope registry trước, sau đó nhập source pack hợp pháp.'
      : blockers.includes('missing_approved_reference')
        ? 'Bổ sung nguồn hợp pháp, license/attribution và approved reference.'
        : blockers.includes('missing_reviewer_signoff')
          ? 'Gửi reviewer chuyên môn ký duyệt và lưu audit log.'
          : 'Kiểm tra release gate và export compliance.'
  };
}

export function buildAcademicVerificationBoard() {
  const report = buildAcademicCoverageAuditReport();
  return {
    report,
    queueVersion: (verificationQueue as any).version,
    queue: (verificationQueue as any).items,
    policy,
    sourcePackTemplate: {
      scope: { grade: '6', subject: 'Toán', book: 'Nguồn giáo viên/trường chọn', topic: 'Chủ đề cụ thể' },
      requiredMetadata: ['officialOrLegalSource', 'sourceOwner', 'license', 'attribution', 'shortExcerptOnly', 'reviewerId', 'reviewedAt', 'releaseTier'],
      requiredArtifacts: ['curriculumMapping', 'teacherOwnedLessonNotes', 'questionBankItemsIfAny', 'rubricIfAny', 'assetLicenseRecordsIfAny'],
      releaseRule: 'Chỉ khi đủ metadata + reviewerSignoff + approvedReferenceCount >= 1 mới được nâng support/source theo quy trình.'
    }
  };
}
