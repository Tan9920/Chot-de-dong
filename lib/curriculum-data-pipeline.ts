import importsData from '@/data/curriculum-import-drafts.json';
import { buildSubjectDataSummary, listSubjectDataRecords } from './subject-data-truth';

const REQUIRED_FIELDS = (importsData as any).requiredFields || [];

function hasValue(value: any) {
  return value !== undefined && value !== null && String(value).trim().length > 0;
}

export function listCurriculumImportDrafts() {
  return [...((importsData as any).drafts || [])];
}

export function validateCurriculumImportDraft(draft: any = {}) {
  const missingFields = REQUIRED_FIELDS.filter((field: string) => !hasValue(draft[field]));
  const warnings: string[] = [];
  const blockers: string[] = [];

  if (missingFields.length) blockers.push(`Thiếu trường bắt buộc: ${missingFields.join(', ')}`);
  if (draft.licenseStatus === 'missing' || draft.licenseStatus === 'unknown') blockers.push('Thiếu trạng thái license rõ ràng.');
  if (draft.attribution === 'missing' || !hasValue(draft.attribution)) blockers.push('Thiếu attribution/nguồn trích dẫn.');
  if (draft.reviewStatus === 'verified' && draft.contentDepthAllowed !== true) warnings.push('reviewStatus verified nhưng contentDepthAllowed chưa bật; cần kiểm tra logic nâng trạng thái.');
  if (draft.contentDepthAllowed && !['reviewed', 'verified', 'approved_for_release'].includes(draft.reviewStatus)) blockers.push('Không được bật contentDepthAllowed nếu chưa reviewed/verified/approved_for_release.');
  if (String(draft.sourceTitle || '').toLowerCase().includes('sgk') && !String(draft.safeUse || '').toLowerCase().includes('không copy')) {
    warnings.push('Nếu nguồn là SGK/sách giáo viên, chỉ lưu metadata/tóm tắt ngắn, không copy dài nội dung bản quyền.');
  }

  return {
    ok: blockers.length === 0,
    draftId: draft.id || 'unknown-draft',
    missingFields,
    blockers,
    warnings,
    recommendedNextStatus: blockers.length ? 'needs_revision' : 'submitted_for_review'
  };
}

export function buildCurriculumImportReviewBoard() {
  const drafts = listCurriculumImportDrafts();
  const validations = drafts.map(validateCurriculumImportDraft);
  const summary = buildSubjectDataSummary();
  const records = listSubjectDataRecords();
  const byReviewStatus = drafts.reduce((acc: Record<string, number>, item: any) => {
    const key = item.reviewStatus || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return {
    version: (importsData as any).version,
    updatedAt: (importsData as any).updatedAt,
    purpose: (importsData as any).purpose,
    requiredFields: REQUIRED_FIELDS,
    reviewChecklist: (importsData as any).reviewChecklist || [],
    totals: {
      registryRecords: records.length,
      importDrafts: drafts.length,
      registryDeepContentAllowed: summary.deepContentAllowedRecords,
      draftBlockers: validations.reduce((sum, item) => sum + item.blockers.length, 0),
      draftWarnings: validations.reduce((sum, item) => sum + item.warnings.length, 0)
    },
    byReviewStatus,
    validations,
    drafts,
    nextMilestones: [
      'Chuẩn hóa mẫu import CSV/JSON theo lớp-môn-bộ sách-bài/chủ đề.',
      'Bổ sung nguồn hợp pháp, license, attribution và reviewer thật cho từng topic.',
      'Tạo route apply import có audit log nhưng không tự nâng verified.',
      'Khi đủ reviewed + foundation + approved references mới cho phép nội dung sâu có kiểm soát.'
    ],
    warning: 'Đây là review pipeline foundation; chưa có dữ liệu môn học verified mới được thêm.'
  };
}

export function previewCurriculumImport(input: any = {}) {
  const draft = {
    id: input.id || 'preview-import',
    grade: input.grade,
    subject: input.subject,
    bookOrProgram: input.bookOrProgram || input.book,
    topicTitle: input.topicTitle || input.topic,
    curriculumNode: input.curriculumNode,
    sourceTitle: input.sourceTitle,
    sourceType: input.sourceType,
    sourceAuthority: input.sourceAuthority,
    licenseStatus: input.licenseStatus,
    attribution: input.attribution,
    reviewStatus: input.reviewStatus || 'draft',
    releaseTier: input.releaseTier || 'internal_preview',
    contentDepthAllowed: Boolean(input.contentDepthAllowed)
  };

  return {
    previewOnly: true,
    draft,
    validation: validateCurriculumImportDraft(draft),
    warning: 'POST hiện chỉ preview để tránh ghi dữ liệu học thuật chưa kiểm chứng vào registry. Không tự nâng seed/scaffold thành reviewed/verified.'
  };
}
