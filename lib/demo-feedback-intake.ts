import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { nowIso } from '@/lib/demo-data';

type Severity = 'P0' | 'P1' | 'P2' | 'P3';
type FeedbackStatus = 'new' | 'triaged' | 'blocked_release' | 'resolved' | 'wont_fix' | 'duplicate';
type ShareDecision = 'do_not_share' | 'owner_internal_only' | 'trusted_small_group_only' | 'can_continue_controlled_test';

export type DemoFeedbackSubmission = {
  id: string;
  createdAt: string;
  updatedAt: string;
  testerName: string;
  testerRole: string;
  contactChannel?: string;
  device: string;
  browser: string;
  demoUrl?: string;
  gradeTried: string;
  subjectTried: string;
  tasksCompleted: string[];
  ratingEase: number | null;
  ratingTrust: number | null;
  wouldUseAgain: 'yes' | 'maybe' | 'no' | 'not_sure';
  severity: Severity;
  status: FeedbackStatus;
  issueCategory: string;
  title: string;
  description: string;
  expectedResult?: string;
  actualResult?: string;
  evidenceNote?: string;
  hasStudentPersonalData: boolean;
  allowsFollowUp: boolean;
  source: 'hosted_demo_feedback_form' | 'admin_backfill' | 'smoke_test';
  riskFlags: string[];
};

type FeedbackInput = Partial<DemoFeedbackSubmission> & Record<string, any>;

type JsonFeedbackStore = {
  version: string;
  updatedAt: string;
  policy: {
    publicRawFeedback: boolean;
    studentPersonalDataAllowed: boolean;
    expandDemoRequiresNoOpenP0: boolean;
    expandDemoRequiresNoOpenP1: boolean;
    nonAiPositioningRequired: boolean;
  };
  submissions: DemoFeedbackSubmission[];
};

const dataDir = process.env.GIAOAN_DATA_DIR || path.join(process.cwd(), 'data');
const feedbackPath = path.join(dataDir, 'demo-feedback-submissions.json');

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

function boundedText(value: unknown, max = 500, fallback = '') {
  return String(value ?? fallback ?? '').trim().slice(0, max);
}

function asArray(value: unknown, max = 20) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => boundedText(item, 120)).filter(Boolean).slice(0, max);
}

function asRating(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.min(5, Math.max(1, Math.round(number)));
}

function safeReadStore(): JsonFeedbackStore {
  try {
    if (memoryFeedbackStore) return normalizeStore(memoryFeedbackStore);
    if (!fs.existsSync(feedbackPath)) return defaultStore();
    const parsed = JSON.parse(fs.readFileSync(feedbackPath, 'utf8'));
    return normalizeStore(parsed);
  } catch {
    return defaultStore();
  }
}

let memoryFeedbackStore: JsonFeedbackStore | null = null;

function safeWriteStore(store: JsonFeedbackStore) {
  memoryFeedbackStore = store;
  try {
    ensureDataDir();
    const tempPath = `${feedbackPath}.tmp-${process.pid}-${Date.now()}`;
    fs.writeFileSync(tempPath, JSON.stringify(store, null, 2) + '\n', 'utf8');
    fs.renameSync(tempPath, feedbackPath);
    return { ok: true as const, mode: 'file' as const };
  } catch (error) {
    // Batch89: Vercel/serverless may not allow writing bundled data/*.json.
    // Keep the board alive in memory for the current process and do not expose raw contact data.
    return { ok: false as const, mode: 'memory_fallback' as const, error: error instanceof Error ? error.message : 'feedback_write_failed' };
  }
}

function defaultStore(): JsonFeedbackStore {
  return {
    version: '2026-04-30.batch88-demo-feedback-evidence-dossier',
    updatedAt: nowIso(),
    policy: {
      publicRawFeedback: false,
      studentPersonalDataAllowed: false,
      expandDemoRequiresNoOpenP0: true,
      expandDemoRequiresNoOpenP1: true,
      nonAiPositioningRequired: true
    },
    submissions: []
  };
}

function normalizeStore(input: any): JsonFeedbackStore {
  const fallback = defaultStore();
  return {
    ...fallback,
    ...input,
    policy: { ...fallback.policy, ...(input?.policy || {}) },
    submissions: Array.isArray(input?.submissions) ? input.submissions.map(normalizeExistingSubmission).filter(Boolean) : []
  };
}

function normalizeExistingSubmission(input: any): DemoFeedbackSubmission {
  const now = nowIso();
  return {
    id: boundedText(input?.id, 120, `feedback-${randomUUID()}`),
    createdAt: boundedText(input?.createdAt, 80, now),
    updatedAt: boundedText(input?.updatedAt, 80, input?.createdAt || now),
    testerName: boundedText(input?.testerName, 120, 'Người test demo'),
    testerRole: boundedText(input?.testerRole, 120, 'teacher'),
    contactChannel: boundedText(input?.contactChannel, 200),
    device: boundedText(input?.device, 160, 'Không rõ thiết bị'),
    browser: boundedText(input?.browser, 160, 'Không rõ trình duyệt'),
    demoUrl: boundedText(input?.demoUrl, 300),
    gradeTried: boundedText(input?.gradeTried, 20, '1'),
    subjectTried: boundedText(input?.subjectTried, 100, 'Tiếng Việt'),
    tasksCompleted: asArray(input?.tasksCompleted, 20),
    ratingEase: asRating(input?.ratingEase),
    ratingTrust: asRating(input?.ratingTrust),
    wouldUseAgain: normalizeWouldUse(input?.wouldUseAgain),
    severity: normalizeSeverity(input?.severity),
    status: normalizeStatus(input?.status),
    issueCategory: boundedText(input?.issueCategory, 120, 'general_feedback'),
    title: boundedText(input?.title, 160, 'Feedback demo'),
    description: boundedText(input?.description, 2_000, 'Không có mô tả.'),
    expectedResult: boundedText(input?.expectedResult, 800),
    actualResult: boundedText(input?.actualResult, 800),
    evidenceNote: boundedText(input?.evidenceNote, 800),
    hasStudentPersonalData: Boolean(input?.hasStudentPersonalData),
    allowsFollowUp: Boolean(input?.allowsFollowUp),
    source: input?.source === 'admin_backfill' || input?.source === 'smoke_test' ? input.source : 'hosted_demo_feedback_form',
    riskFlags: asArray(input?.riskFlags, 20)
  };
}

function normalizeSeverity(value: unknown): Severity {
  return value === 'P0' || value === 'P1' || value === 'P2' || value === 'P3' ? value : 'P2';
}

function normalizeStatus(value: unknown): FeedbackStatus {
  const allowed: FeedbackStatus[] = ['new', 'triaged', 'blocked_release', 'resolved', 'wont_fix', 'duplicate'];
  return allowed.includes(value as FeedbackStatus) ? value as FeedbackStatus : 'new';
}

function normalizeWouldUse(value: unknown): DemoFeedbackSubmission['wouldUseAgain'] {
  return value === 'yes' || value === 'maybe' || value === 'no' || value === 'not_sure' ? value : 'not_sure';
}

function inferSeverity(input: FeedbackInput, riskFlags: string[]): Severity {
  const provided = normalizeSeverity(input.severity);
  const text = `${input.issueCategory || ''} ${input.title || ''} ${input.description || ''}`.toLowerCase();
  if (riskFlags.includes('student_personal_data')) return 'P0';
  if (/không mở|không load|màn hình trắng|crash|build|500|csrf|không đăng nhập|không xuất|không tải|docx lỗi|pdf lỗi/.test(text)) return provided === 'P0' ? 'P0' : 'P1';
  if (/sai kiến thức|sai dữ liệu|hiểu nhầm|verified|bản quyền|nguồn/.test(text)) return provided === 'P0' ? 'P0' : 'P1';
  if (provided) return provided;
  return 'P2';
}

function makeRiskFlags(input: FeedbackInput) {
  const flags = new Set<string>();
  const text = `${input.issueCategory || ''} ${input.title || ''} ${input.description || ''} ${input.evidenceNote || ''}`.toLowerCase();
  if (input.hasStudentPersonalData) flags.add('student_personal_data');
  if (/học sinh|số điện thoại|địa chỉ|ảnh mặt|thẻ học sinh|lớp của em/.test(text)) flags.add('possible_student_personal_data');
  if (/bản quyền|sgk|sách giáo viên|copy|scan|ảnh sách/.test(text)) flags.add('copyright_or_license_risk');
  if (/sai kiến thức|sai đáp án|sai nội dung|lệch chương trình/.test(text)) flags.add('academic_accuracy_risk');
  if (/không xuất|không tải|docx|pdf|font|file lỗi/.test(text)) flags.add('export_runtime_risk');
  if (/màn hình nhỏ|điện thoại|mobile|khó bấm|vỡ giao diện/.test(text)) flags.add('mobile_ux_risk');
  return [...flags];
}

export function createDemoFeedbackSubmission(input: FeedbackInput, actor: any = {}) {
  const riskFlags = makeRiskFlags(input);
  const severity = inferSeverity(input, riskFlags);
  const description = boundedText(input.description, 2_000);
  const title = boundedText(input.title, 160);
  const hasStudentPersonalData = Boolean(input.hasStudentPersonalData || riskFlags.includes('student_personal_data'));

  if (!title) throw new Error('Thiếu tiêu đề feedback.');
  if (!description || description.length < 12) throw new Error('Mô tả feedback cần đủ rõ để xử lý.');
  if (hasStudentPersonalData) throw new Error('Không gửi dữ liệu cá nhân học sinh trong feedback demo. Hãy ẩn/xóa thông tin rồi gửi lại.');

  const now = nowIso();
  const submission: DemoFeedbackSubmission = {
    id: `demo-feedback-${randomUUID()}`,
    createdAt: now,
    updatedAt: now,
    testerName: boundedText(input.testerName || actor?.name, 120, 'Người test demo'),
    testerRole: boundedText(input.testerRole || actor?.role, 120, 'teacher'),
    contactChannel: boundedText(input.contactChannel, 200),
    device: boundedText(input.device, 160, 'Không rõ thiết bị'),
    browser: boundedText(input.browser, 160, 'Không rõ trình duyệt'),
    demoUrl: boundedText(input.demoUrl, 300),
    gradeTried: boundedText(input.gradeTried, 20, '1'),
    subjectTried: boundedText(input.subjectTried, 100, 'Tiếng Việt'),
    tasksCompleted: asArray(input.tasksCompleted, 20),
    ratingEase: asRating(input.ratingEase),
    ratingTrust: asRating(input.ratingTrust),
    wouldUseAgain: normalizeWouldUse(input.wouldUseAgain),
    severity,
    status: severity === 'P0' ? 'blocked_release' : 'new',
    issueCategory: boundedText(input.issueCategory, 120, 'general_feedback'),
    title,
    description,
    expectedResult: boundedText(input.expectedResult, 800),
    actualResult: boundedText(input.actualResult, 800),
    evidenceNote: boundedText(input.evidenceNote, 800),
    hasStudentPersonalData: false,
    allowsFollowUp: Boolean(input.allowsFollowUp),
    source: input.source === 'smoke_test' ? 'smoke_test' : 'hosted_demo_feedback_form',
    riskFlags
  };

  const store = safeReadStore();
  store.version = '2026-04-30.batch88-demo-feedback-evidence-dossier';
  store.updatedAt = now;
  store.submissions = [submission, ...store.submissions].slice(0, 500);
  safeWriteStore(store);
  return redactSubmission(submission);
}

export function listDemoFeedbackSubmissions() {
  return safeReadStore().submissions.map(redactSubmission);
}

export function buildDemoFeedbackBoard() {
  const store = safeReadStore();
  const submissions = store.submissions;
  const open = submissions.filter((item) => !['resolved', 'wont_fix', 'duplicate'].includes(item.status));
  const p0 = open.filter((item) => item.severity === 'P0');
  const p1 = open.filter((item) => item.severity === 'P1');
  const p2 = open.filter((item) => item.severity === 'P2');
  const p3 = open.filter((item) => item.severity === 'P3');
  const mobile = submissions.filter((item) => item.riskFlags.includes('mobile_ux_risk'));
  const exportIssues = submissions.filter((item) => item.riskFlags.includes('export_runtime_risk'));
  const academicRisk = submissions.filter((item) => item.riskFlags.includes('academic_accuracy_risk') || item.riskFlags.includes('copyright_or_license_risk'));
  const ratings = submissions.map((item) => item.ratingTrust).filter((item): item is number => Number.isFinite(item as number));
  const avgTrust = ratings.length ? Number((ratings.reduce((sum, item) => sum + item, 0) / ratings.length).toFixed(1)) : null;
  const shareDecision = decideShare(p0.length, p1.length, submissions.length, avgTrust);

  return {
    generatedAt: nowIso(),
    board: {
      status: shareDecision.decision,
      label: shareDecision.label,
      reason: shareDecision.reason,
      summary: {
        total: submissions.length,
        open: open.length,
        openP0: p0.length,
        openP1: p1.length,
        openP2: p2.length,
        openP3: p3.length,
        mobileIssues: mobile.length,
        exportIssues: exportIssues.length,
        academicOrLegalRisk: academicRisk.length,
        averageTrustRating: avgTrust
      },
      blockers: [...p0, ...p1].slice(0, 10).map(redactSubmission),
      latest: submissions.slice(0, 8).map(redactSubmission),
      requiredBeforeExpanding: [
        'Không có P0/P1 mở trước khi mở rộng nhóm test.',
        'Có ít nhất 3 feedback hợp lệ từ thiết bị thật trước khi mời thêm người.',
        'Có ít nhất 1 feedback mobile và 1 bằng chứng export DOCX/PDF mở được.',
        'Không chứa dữ liệu cá nhân học sinh hoặc tài liệu thiếu quyền trong feedback/evidence.',
        'Vẫn dùng tin nhắn safeSharingMessage, không quảng cáo production-ready.'
      ],
      policy: store.policy
    },
    formConfig: {
      severityOptions: ['P0', 'P1', 'P2', 'P3'],
      wouldUseAgainOptions: ['yes', 'maybe', 'no', 'not_sure'],
      issueCategories: ['cannot_open_demo', 'cannot_create_lesson', 'cannot_save', 'cannot_export_docx_pdf', 'mobile_ui_problem', 'academic_or_source_confusion', 'general_feedback'],
      privacyWarning: 'Không gửi tên, ảnh, số điện thoại, địa chỉ hoặc thông tin nhận diện học sinh. Hãy che dữ liệu trước khi gửi feedback.'
    },
    note: 'Feedback board dùng để kiểm soát vòng test demo. Nó không thay thế build/live smoke, mobile QA thật hoặc review học thuật/pháp lý.'
  };
}

function decideShare(openP0: number, openP1: number, total: number, avgTrust: number | null): { decision: ShareDecision; label: string; reason: string } {
  if (openP0 > 0) return { decision: 'do_not_share', label: 'Dừng chia link', reason: 'Đang có P0 mở; phải xử lý trước khi tiếp tục test.' };
  if (openP1 > 0) return { decision: 'owner_internal_only', label: 'Chỉ kiểm nội bộ', reason: 'Đang có P1 mở; chưa nên mời thêm giáo viên.' };
  if (total < 3) return { decision: 'trusted_small_group_only', label: 'Chỉ nhóm nhỏ tin cậy', reason: 'Chưa đủ feedback thật để mở rộng ngoài 3–10 giáo viên.' };
  if (avgTrust !== null && avgTrust < 3) return { decision: 'trusted_small_group_only', label: 'Giữ nhóm nhỏ', reason: 'Điểm tin cậy trung bình còn thấp; cần sửa trải nghiệm/niềm tin trước.' };
  return { decision: 'can_continue_controlled_test', label: 'Có thể tiếp tục test có kiểm soát', reason: 'Chưa có P0/P1 mở và đã có feedback tối thiểu; vẫn chưa production-ready.' };
}

function redactSubmission(item: DemoFeedbackSubmission) {
  return {
    id: item.id,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    testerName: item.testerName ? `${item.testerName.slice(0, 1)}***` : 'Ẩn danh',
    testerRole: item.testerRole,
    device: item.device,
    browser: item.browser,
    gradeTried: item.gradeTried,
    subjectTried: item.subjectTried,
    tasksCompleted: item.tasksCompleted,
    ratingEase: item.ratingEase,
    ratingTrust: item.ratingTrust,
    wouldUseAgain: item.wouldUseAgain,
    severity: item.severity,
    status: item.status,
    issueCategory: item.issueCategory,
    title: item.title,
    description: item.description.slice(0, 500),
    evidenceNote: item.evidenceNote,
    riskFlags: item.riskFlags,
    allowsFollowUp: item.allowsFollowUp,
    source: item.source
  };
}
