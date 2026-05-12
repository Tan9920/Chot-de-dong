type TrustIssue = { severity: 'blocker' | 'warning'; code: string; message: string };

function readSourceStatus(input: any) {
  return input?.sourceStatus
    || input?.draft?.sourceStatus
    || input?.draft?.governanceSnapshot?.sourceStatus
    || input?.draft?.governanceSnapshot?.sourceStatusSummary?.sourceStatus
    || input?.fallback?.sourceStatus
    || input?.fallback?.governanceSnapshot?.sourceStatus
    || 'seed';
}

function readRequestedStatus(input: any) {
  return input?.requestedStatus || input?.draft?.status || input?.fallback?.status || 'draft';
}

function isTrustedForReview(sourceStatus: string) {
  return ['reviewed', 'verified', 'approved_for_release'].includes(sourceStatus);
}

export function assessLessonTrustGate(input: any = {}) {
  const requestedStatus = readRequestedStatus(input);
  const sourceStatus = readSourceStatus(input);
  const issues: TrustIssue[] = [];

  if (sourceStatus === 'seed' || sourceStatus === 'scaffold' || sourceStatus === 'community') {
    issues.push({
      severity: requestedStatus === 'draft' ? 'warning' : 'blocker',
      code: 'source_not_reviewed',
      message: 'Dữ liệu đang là seed/scaffold/community; chỉ được lưu bản nháp an toàn, chưa được gửi duyệt/duyệt như nội dung đã kiểm chứng.'
    });
  }

  if (requestedStatus !== 'draft' && !isTrustedForReview(sourceStatus)) {
    issues.push({
      severity: 'blocker',
      code: 'review_requires_reviewed_source',
      message: 'Muốn gửi duyệt hoặc duyệt cần dữ liệu ít nhất ở mức reviewed và có nguồn/governance rõ.'
    });
  }

  const blockers = issues.filter((item) => item.severity === 'blocker');
  return {
    allowed: blockers.length === 0,
    sourceStatus,
    requestedStatus,
    issues,
    blockers,
    warnings: issues.filter((item) => item.severity === 'warning'),
    qualityChecklist: input?.qualityChecklist || {
      status: blockers.length ? 'blocked' : 'draft_allowed_with_warnings',
      note: requestedStatus === 'draft'
        ? 'Draft save được phép để giáo viên chỉnh sửa; không claim nội dung verified.'
        : 'Review/approval cần nguồn và trạng thái dữ liệu đáng tin cậy.'
    }
  };
}
