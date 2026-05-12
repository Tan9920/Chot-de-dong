export type PublicTrustAction =
  | 'generate_lesson'
  | 'export_docx'
  | 'export_pdf'
  | 'share_to_community'
  | 'publish_public'
  | 'school_release'
  | 'marketing_display';

type Severity = 'info' | 'warning' | 'blocker';
function issue(id: string, severity: Severity, message: string) { return { id, severity, message }; }

export function evaluatePublicTrustReadiness(input: any = {}) {
  const action: PublicTrustAction = input.action || 'generate_lesson';
  const sourceStatus = input.sourceStatus || 'seed';
  const releaseTier = input.releaseTier || 'internal_preview';
  const supportLevel = input.supportLevel || 'starter';
  const referenceCount = Number(input.referenceCount || 0);
  const fieldEvidenceCount = Number(input.fieldEvidenceCount || 0);
  const intendedClaims = Array.isArray(input.intendedClaims) ? input.intendedClaims : [];
  const issues: Array<{ id: string; severity: Severity; message: string }> = [];
  if (!['reviewed', 'verified', 'approved_for_release'].includes(sourceStatus)) issues.push(issue('source_not_reviewed', ['publish_public','marketing_display','school_release'].includes(action) ? 'blocker' : 'warning', 'Dữ liệu chưa reviewed/verified; chỉ dùng khung an toàn, không claim chính thức.'));
  if (referenceCount < 1) issues.push(issue('missing_references', 'warning', 'Thiếu nguồn tham chiếu đủ rõ.'));
  if (fieldEvidenceCount < 1) issues.push(issue('missing_field_evidence', 'warning', 'Thiếu evidence theo trường dữ liệu.'));
  if (['publish_public','school_release','marketing_display'].includes(action) && releaseTier === 'internal_preview') issues.push(issue('internal_preview_only', 'blocker', 'Release tier chỉ ở internal_preview.'));
  if (['publish_public','marketing_display'].includes(action) && input.hasTakedownClaim) issues.push(issue('active_takedown_claim', 'blocker', 'Đang có takedown claim.'));
  if (['publish_public','marketing_display'].includes(action) && input.legalAssetReady === false) issues.push(issue('legal_asset_not_ready', 'blocker', 'Học liệu/ảnh/tài nguyên pháp lý chưa đủ nguồn/license/approval.'));
  if (intendedClaims.some((claim: string) => /chuẩn bộ|đúng 100|không vi phạm|dùng ngay/i.test(claim))) issues.push(issue('overclaim_marketing', 'blocker', 'Có claim quá mức.'));
  const blockers = issues.filter((x) => x.severity === 'blocker').length;
  const warnings = issues.filter((x) => x.severity === 'warning').length;
  return { action, decision: blockers ? 'blocked' : warnings ? 'allowed_with_warnings' : 'allowed', label: blockers ? 'Chưa đủ điều kiện công khai/phát hành' : warnings ? 'Chỉ nên dùng có cảnh báo' : 'Có thể dùng theo phạm vi đã chọn', contextLabel: input.contextLabel || '', sourceStatus, releaseTier, supportLevel, referenceCount, fieldEvidenceCount, issues, summary: { blockers, warnings }, policy: { noFakeKnowledge: true, noFakeVerifiedData: true, noOverclaimMarketing: true, publicRequiresModerationLegalAndHumanReview: true } };
}
