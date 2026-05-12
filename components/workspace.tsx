'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

/* ========================================
   TYPES
   ======================================== */

type ApiState = {
  health?: any;
  readiness?: any;
  basicFlow?: any;
  productFoundation?: any;
  metadata?: any;
  subjectData?: any;
  lessonDrafting?: any;
  launchGate?: any;
  testerPack?: any;
  feedback?: any;
  breakthrough?: any;
  academicCoverage?: any;
  academicSourceIntake?: any;
  runtimeDeployClosure?: any;
  runtimeHostedClosure?: any;
  teacherPilotCompletion?: any;
  publicRolloutReadiness?: any;
  error?: string;
};

type LessonForm = {
  grade: string;
  subject: string;
  book: string;
  topic: string;
  template: string;
  duration: string;
  teacherNote: string;
  examMode: string;
  learnerProfile: string;
  lessonIntent: string;
  designMode: string;
  classSize: string;
  deviceAccess: string;
  space: string;
};

type SavedDraft = LessonForm & {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'review' | 'approved';
  currentVersion?: number;
  storage?: 'server_json' | 'browser_local';
};

type WorkspaceTab = 'dashboard' | 'compose' | 'editor' | 'drafts' | 'week' | 'resources' | 'export' | 'community' | 'team' | 'moderation' | 'legal' | 'release' | 'feedback' | 'settings' | 'debug';

type AuthForm = {
  mode: 'login' | 'register';
  name: string;
  email: string;
  password: string;
  schoolName: string;
  departmentName: string;
  inviteCode: string;
};

/* ========================================
   CONSTANTS
   ======================================== */

const defaultForm: LessonForm = {
  grade: '1',
  subject: 'Tiếng Việt',
  book: 'Nguồn giáo viên tự nhập',
  topic: 'Bài làm quen',
  template: 'Mẫu phát triển phẩm chất - năng lực',
  duration: '1 tiết',
  teacherNote: 'Chỉ tạo khung bản nháp an toàn; giáo viên kiểm tra kiến thức, nguồn và điều chỉnh theo lớp học thật.',
  examMode: 'standard',
  learnerProfile: 'standard',
  lessonIntent: 'new_lesson',
  designMode: 'standard',
  classSize: 'standard',
  deviceAccess: 'teacher_only',
  space: 'regular_room'
};

const defaultAuthForm: AuthForm = {
  mode: 'login',
  name: '',
  email: '',
  password: '',
  schoolName: '',
  departmentName: '',
  inviteCode: ''
};

const storageKey = 'giaoan-demo-saved-drafts-v1';

const fallbackTemplates = [
  'Mẫu phát triển phẩm chất - năng lực',
  'Mẫu giáo án dễ dùng cho giáo viên mới',
  'Mẫu luyện tập/củng cố',
  'Mẫu ôn tập theo chuyên đề',
  'Mẫu hoạt động trải nghiệm/dự án'
];

const fallbackDurations = ['1 tiết', '2 tiết', '35 phút', '45 phút', '90 phút'];

type TeacherStarterOption = {
  id: string;
  grade: string;
  subject: string;
  book: string;
  topic: string;
  label: string;
  note: string;
  dataLabel: string;
};

const lessonIntentCards = [
  { id: 'new_lesson', label: 'Bài mới', desc: 'Giảng dạy kiến thức mới', color: 'blue' },
  { id: 'practice', label: 'Luyện tập', desc: 'Củng cố kiến thức', color: 'green' },
  { id: 'review', label: 'Ôn tập', desc: 'Ôn lại theo chủ đề', color: 'amber' },
  { id: 'exam_prep', label: 'Ôn thi', desc: 'Chuẩn bị kiểm tra', color: 'purple' },
  { id: 'project_activity', label: 'Dự án', desc: 'Hoạt động trải nghiệm', color: 'teal' }
];

const weekLessonSamples = [
  { id: 'w-1', day: 'Thứ 2', period: 1, title: 'Phép cộng trong phạm vi 1000', subject: 'Toán', status: 'draft', ready: false, dataStatus: 'teacher_input', backendStatus: 'ui_sample' },
  { id: 'w-2', day: 'Thứ 2', period: 3, title: 'Tập đọc — Mẹ vắng nhà', subject: 'Tiếng Việt', status: 'reviewed', ready: true, dataStatus: 'reviewed_sample', backendStatus: 'ui_sample' },
  { id: 'w-3', day: 'Thứ 3', period: 2, title: 'Unit 5 — Daily Routines', subject: 'Tiếng Anh', status: 'scaffold', ready: false, dataStatus: 'scaffold_only', backendStatus: 'ui_sample' },
  { id: 'w-4', day: 'Thứ 4', period: 1, title: 'Phân số bằng nhau', subject: 'Toán', status: 'draft', ready: false, dataStatus: 'teacher_input', backendStatus: 'ui_sample' },
  { id: 'w-5', day: 'Thứ 5', period: 4, title: 'Ôn tập chương 2', subject: 'Toán', status: 'reviewed', ready: true, dataStatus: 'reviewed_sample', backendStatus: 'ui_sample' },
  { id: 'w-6', day: 'Thứ 6', period: 2, title: 'Hệ sinh thái rừng', subject: 'Khoa học tự nhiên', status: 'seed', ready: true, dataStatus: 'seed_only', backendStatus: 'ui_sample' }
];

const weekDays = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

const resourceTabs = [
  'Tất cả',
  'Hoạt động lớp học',
  'Trò chơi khởi động',
  'Phiếu học tập',
  'Slide dàn ý',
  'Rubric',
  'Câu hỏi kiểm tra'
];

const resourceSamples = [
  { title: 'Khởi động: Đố vui số học', grade: 'Lớp 3', subject: 'Toán', duration: '5 phút', device: 'Không cần thiết bị', sourceName: 'Mẫu tự soạn trong demo', license: 'CC BY tự khai báo', reviewState: 'seed_only', status: 'seed', canInsert: true, type: 2 },
  { title: 'Hoạt động nhóm: Sắp xếp câu', grade: 'Lớp 4', subject: 'Tiếng Việt', duration: '10 phút', device: 'Phiếu in', sourceName: 'Mẫu tự soạn trong demo', license: 'CC BY tự khai báo', reviewState: 'scaffold_only', status: 'scaffold', canInsert: true, type: 1 },
  { title: 'Trò chơi: Bingo từ vựng', grade: 'Lớp 5', subject: 'Tiếng Anh', duration: '8 phút', device: 'Phiếu in', sourceName: 'Đóng góp cộng đồng mẫu', license: 'Chờ xác minh quyền', reviewState: 'community_hold', status: 'community', canInsert: false, type: 2 },
  { title: 'Phiếu học tập: Phép cộng có nhớ', grade: 'Lớp 3', subject: 'Toán', duration: '15 phút', device: 'Phiếu in A4', sourceName: 'Mẫu tự soạn trong demo', license: 'CC BY tự khai báo', reviewState: 'reviewed_internal_sample', status: 'reviewed', canInsert: true, type: 3 },
  { title: 'Rubric đánh giá thuyết trình', grade: 'Lớp 6', subject: 'Ngữ văn', duration: '—', device: 'Bản in', sourceName: 'Đóng góp cộng đồng mẫu', license: 'Chờ xác minh quyền', reviewState: 'reviewed_internal_sample', status: 'reviewed', canInsert: false, type: 5 },
  { title: 'Câu hỏi kiểm tra cuối chương 2', grade: 'Lớp 4', subject: 'Khoa học tự nhiên', duration: '20 phút', device: 'Bản in / Slide', sourceName: 'Đóng góp cộng đồng mẫu', license: 'Chờ xác minh quyền', reviewState: 'review_required', status: 'review_required', canInsert: false, type: 6 }
];

const moderationQueueSamples = [
  { id: 'm-1', title: 'Phiếu học tập — Phép trừ có nhớ', author: 'Cô Lan (HCM)', submittedAt: '2 giờ trước', status: 'submitted', risk: 'thấp', licenseStatus: 'self_declared', studentDataRisk: 'none', auditRequired: true },
  { id: 'm-2', title: 'Trò chơi: Đố vui Lịch sử lớp 5', author: 'Thầy Minh (HN)', submittedAt: '5 giờ trước', status: 'needs_revision', risk: 'trung bình', licenseStatus: 'missing_source_detail', studentDataRisk: 'none', auditRequired: true },
  { id: 'm-3', title: 'Slide bài giảng — Hệ sinh thái', author: 'Cô Hằng (ĐN)', submittedAt: 'Hôm qua', status: 'submitted', risk: 'thấp', licenseStatus: 'needs_attribution_check', studentDataRisk: 'none', auditRequired: true },
  { id: 'm-4', title: 'Câu hỏi kiểm tra — Hoá học 9', author: 'Thầy Tùng (HP)', submittedAt: '2 ngày trước', status: 'submitted', risk: 'cao', licenseStatus: 'unknown', studentDataRisk: 'possible', auditRequired: true }
];

const legalGateItems = [
  { label: 'Điều khoản sử dụng (ToS)', status: 'warn' },
  { label: 'Chính sách bảo mật', status: 'warn' },
  { label: 'Chính sách cộng đồng', status: 'warn' },
  { label: 'Quy trình IP & Takedown', status: 'fail' },
  { label: 'Chính sách Plan & Quota', status: 'warn' },
  { label: 'Thoả thuận Tổ/Trường', status: 'fail' },
  { label: 'AI Beta Terms (chưa mở)', status: 'fail' }
];

const releaseGateChecks = [
  { label: 'Build status', status: 'warn' },
  { label: 'Typecheck', status: 'warn' },
  { label: 'Data validate', status: 'warn' },
  { label: 'Runtime smoke', status: 'fail' },
  { label: 'Hosted URL smoke', status: 'fail' },
  { label: 'Visual smoke', status: 'fail' },
  { label: 'Legal Gate', status: 'fail' },
  { label: 'Community moderation readiness', status: 'warn' },
  { label: 'Export readiness', status: 'warn' }
];

function compactStatusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: 'Nháp',
    seed: 'Seed',
    scaffold: 'Khung',
    reviewed: 'Đã rà',
    community: 'Cộng đồng',
    review_required: 'Cần duyệt',
    teacher_input: 'GV nhập',
    seed_only: 'Seed only',
    scaffold_only: 'Khung only',
    community_hold: 'Giữ duyệt',
    reviewed_internal_sample: 'Đã rà mẫu',
    submitted: 'Chờ duyệt',
    needs_revision: 'Cần sửa',
    ready: 'Sẵn sàng',
    blocked: 'Bị chặn',
    ok: 'OK',
    warn: 'Cần kiểm',
    fail: 'Chặn'
  };
  return labels[status] || status;
}

function compactStatusClass(status: string) {
  if (['reviewed', 'ready', 'ok', 'reviewed_internal_sample'].includes(status)) return 'badge-success';
  if (['draft', 'seed', 'seed_only', 'scaffold', 'scaffold_only', 'teacher_input', 'submitted', 'warn', 'needs_revision', 'review_required', 'community', 'community_hold'].includes(status)) return 'badge-warning';
  if (['fail', 'blocked'].includes(status)) return 'badge-danger';
  return 'badge-neutral';
}


/* ========================================
   UTILITIES
   ======================================== */

async function getJson(path: string, init?: RequestInit) {
  const res = await fetch(path, init);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || `${path} failed`);
  return json;
}

function lessonTitle(form: LessonForm) {
  return `Giáo án ${form.subject} lớp ${form.grade}: ${form.topic}`;
}

function readLocalDrafts(): SavedDraft[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) || '[]');
    return Array.isArray(parsed) ? parsed.map((item) => ({ ...item, storage: item.storage || 'browser_local' })) : [];
  } catch {
    return [];
  }
}

function writeLocalDrafts(items: SavedDraft[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(items.filter((item) => item.storage !== 'server_json').slice(0, 20)));
}

function draftFromSavedLesson(item: any): SavedDraft {
  return {
    id: item.id,
    title: item.title || lessonTitle(item),
    grade: item.grade || '1',
    subject: item.subject || 'Tiếng Việt',
    book: item.book || 'Nguồn giáo viên tự nhập',
    topic: item.topic || 'Bài làm quen',
    template: item.template || 'Mẫu phát triển phẩm chất - năng lực',
    duration: item.duration || item.summary?.duration || '1 tiết',
    teacherNote: item.teacherNote || 'Bản nháp lưu ở demo; giáo viên cần kiểm tra nguồn và kiến thức trước khi dùng thật.',
    examMode: item.examMode || 'standard',
    learnerProfile: item.learnerProfile || 'standard',
    lessonIntent: item.lessonIntent || item.summary?.lessonIntent || 'new_lesson',
    designMode: item.designMode || item.summary?.designMode || 'standard',
    classSize: item.classSize || 'standard',
    deviceAccess: item.deviceAccess || 'teacher_only',
    space: item.space || 'regular_room',
    content: item.content || '',
    status: item.status || 'draft',
    currentVersion: item.currentVersion || item.version || 1,
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString(),
    storage: 'server_json'
  };
}

function mergeDrafts(serverDrafts: SavedDraft[], localDrafts: SavedDraft[]) {
  const seen = new Set<string>();
  return [...serverDrafts, ...localDrafts].filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  }).slice(0, 30);
}

function downloadBlob(blob: Blob, fallbackName: string, response: Response) {
  const header = response.headers.get('content-disposition') || '';
  const match = header.match(/filename="?([^";]+)"?/i);
  const fileName = match?.[1] || fallbackName;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function friendlyErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || 'Không rõ lỗi');
  if (/csrf|same.?origin|token/i.test(message)) {
    return 'Lỗi phiên làm việc. Hãy tải lại trang rồi thử lại.';
  }
  if (/401|đăng nhập|session|phiên/i.test(message)) {
    return 'Phiên chưa sẵn sàng. Hãy tải lại trang.';
  }
  if (/export|docx|pdf|tải/i.test(message)) {
    return 'Chưa xuất được file. Hãy lưu bản nháp rồi thử lại.';
  }
  return message.replace('/api/auth/csrf failed', 'Lỗi phiên làm việc.');
}

function teacherDataLabel(item: any) {
  if (!item) return 'Chưa có dữ liệu';
  if (item.contentDepthAllowed || item.sourceStatus === 'đã rà soát' || item.sourceStatus === 'approved_for_release') return 'Đã rà soát';
  if (item.sourceStatus === 'reviewed') return 'Đã xem lại';
  if (item.sourceStatus === 'seed') return 'Bản mẫu thử';
  return 'Chỉ có khung';
}

function teacherDataNote(item: any) {
  const label = teacherDataLabel(item);
  if (label === 'Đã rà soát') return 'Có dữ liệu tốt, nhưng giáo viên vẫn cần chỉnh theo lớp thật.';
  if (label === 'Bản mẫu thử') return 'Dùng để thử, không dùng nguyên văn nếu chưa kiểm tra.';
  if (label === 'Chỉ có khung') return 'Hệ thống chỉ dựng bố cục; giáo viên tự bổ sung kiến thức.';
  return 'Có thể tự nhập chủ đề để tạo khung an toàn.';
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function isRealAccount(user: any) {
  return Boolean(user?.authAccountId);
}

function accountStatusLabel(user: any) {
  if (isRealAccount(user)) return 'Đã đăng nhập';
  if (user?.sessionMode?.includes('anonymous_demo')) return 'Xem thử';
  if (user) return 'Demo';
  return 'Chưa đăng nhập';
}

function roleLabel(role: string) {
  if (role === 'admin') return 'Quản trị';
  if (role === 'leader') return 'Tổ trưởng';
  return 'Giáo viên';
}

function storageLabel(storage?: string) {
  if (storage === 'server_json') return 'Đã lưu';
  return 'Tạm lưu';
}

/* ========================================
   ICONS (SVG inline to avoid dependencies)
   ======================================== */

function IconHome({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}

function IconCompose({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"/>
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
  );
}

function IconEdit({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

function IconFolder({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

function IconDownload({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}

function IconMessage({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

function IconSettings({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

function IconCheck({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function IconAlert({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}

function IconUser({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function IconBook({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  );
}

function IconUsers({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

function IconFile({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  );
}

function IconChevronRight({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}

function IconShield({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}

function IconSearch({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}

function IconPlus({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

function IconFileText({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  );
}

function IconCheckCircle({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  );
}

function IconArchive({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="21 8 21 21 3 21 3 8"/>
      <rect x="1" y="3" width="22" height="5"/>
      <line x1="10" y1="12" x2="14" y2="12"/>
    </svg>
  );
}

function IconGrid({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
    </svg>
  );
}

function IconClipboard({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    </svg>
  );
}

function IconHelpCircle({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

function IconMenu({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
}

function IconX({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}


function IconCalendar({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}

function IconRocket({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
      <path d="m12 15-3-3a22 22 0 0 1 2-7 11 11 0 0 1 7-3 11 11 0 0 1-3 7 22 22 0 0 1-7 2z"/>
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
    </svg>
  );
}

function IconScale({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
      <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
      <path d="M7 21h10"/>
      <path d="M12 3v18"/>
      <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
    </svg>
  );
}

/* Batch135 Plan Bridge Hardening markers: plan-bridge-hardening; action-notice-contract; dynamic-release-gate-from-api; source-level-action-guard; no-fake-verified-lovable-samples. Batch134 Lovable Plan Bridge markers: lovable-plan-bridge; weekly teaching workspace; resource-library; moderation-queue; legal-gate-ui; release-gate-ui; no-ai-no-payment-no-fake-verified. Batch100 UX/Governance Polish markers: BATCH100 UX/Governance Polish; teacher-safe-flow-banner; guided-progress-card; mode-switcher; mobile-menu-backdrop; Đóng menu bằng cách bấm ra ngoài; body.classList.add; disableExportUntilContent; Tài khoản giáo viên; Đăng nhập để lưu và xuất an toàn; Không cho tự chọn admin/tổ trưởng khi đăng ký; Mã mời tổ/trường nếu có; Phiên này chỉ để xem thử; lưu bản nháp lên demo. Batch102 markers: breakthrough-card; teacher-starter-grid; quota-strip; /api/demo/breakthrough. Batch103 markers: academic-truth-card; /api/academic/coverage-audit; academicVerificationGate; safe_frame_only_academic_data. Batch104 markers: academic-source-intake-card; /api/academic/source-intake; academicSourceIntakeGate; source_pack_intake_foundation_registry_unchanged. Batch105 markers: runtime-deploy-closure-card; /api/runtime/deploy-closure; runtimeDeployClosure; runtimeDeployHardBlockers; source_level_runtime_gate_ready. Batch106 markers: runtime-hosted-closure-card; /api/runtime/hosted-closure; runtimeHostedClosure; runtimeHostedMissingRequired; hosted_runtime_unverified_or_blocked. Batch107 markers: teacher-pilot-completion-card; /api/teacher-pilot/completion; teacherPilotCompletion; teacherPilotCompletionPercent; offline_teacher_pilot_slice_complete_hosted_runtime_guarded. Batch108 markers: teacher-topic-picker; teacherTopicPickerCatalog; no_subject_topic_mismatch; no_manual_verified_choice; offline_teacher_topic_picker_complete_hosted_runtime_guarded. Batch108 · Chọn lớp/môn/chủ đề đúng; Batch109 markers: teacher-print-export; printable-preview; downloadHtml; printLesson; teacher_print_export_package. Batch110 markers: curriculum-matrix; Curriculum Matrix; curriculum_matrix_teacher_composer; /api/curriculum/matrix; /api/admin/curriculum-gap-board; Curriculum Gap Board; Kết nối tri thức; legacy_reference; teacher_input; unmapped. */

/* ========================================
   MAIN COMPONENT
   ======================================== */

export default function Workspace() {
  const [state, setState] = useState<ApiState>({});
  const [form, setForm] = useState<LessonForm>(defaultForm);
  const [content, setContent] = useState('');
  const [drafts, setDrafts] = useState<SavedDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<'generate' | 'save' | 'quality' | 'docx' | 'pdf' | null>(null);
  const [notice, setNotice] = useState('');
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [qualityChecklist, setQualityChecklist] = useState<any>(null);
  const [lessonDesignStudio, setLessonDesignStudio] = useState<any>(null);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    testerName: '',
    testerRole: 'teacher',
    device: 'Điện thoại Android',
    browser: 'Chrome',
    gradeTried: '1',
    subjectTried: 'Tiếng Việt',
    issueCategory: 'general_feedback',
    severity: 'P2',
    title: '',
    description: '',
    ratingEase: '4',
    ratingTrust: '4',
    wouldUseAgain: 'maybe',
    evidenceNote: '',
    hasStudentPersonalData: false
  });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authForm, setAuthForm] = useState<AuthForm>(defaultAuthForm);
  const [authBusy, setAuthBusy] = useState(false);
  const [authNotice, setAuthNotice] = useState('');
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [resourceTab, setResourceTab] = useState(0);
  const [resourceQuery, setResourceQuery] = useState('');
  const [moderationFilter, setModerationFilter] = useState<'all' | 'submitted' | 'needs_revision'>('all');
  const [moderationOpenId, setModerationOpenId] = useState<string | null>(null);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const localDrafts = readLocalDrafts();
    setDrafts(localDrafts);
    async function boot() {
      try {
        const [authMe, health, readiness, basicFlow, launchGate, testerPack, feedback, breakthrough, academicCoverage, academicSourceIntake, runtimeDeployClosure, runtimeHostedClosure, teacherPilotCompletion, publicRolloutReadiness, productFoundation, metadata, subjectData, lessonDrafting, savedLessons] = await Promise.all([
          getJson('/api/auth/me').catch(() => ({ user: null })),
          getJson('/api/health'),
          getJson('/api/demo/readiness'),
          getJson('/api/demo/basic-flow'),
          getJson('/api/demo/launch-gate').catch(() => null),
          getJson('/api/demo/tester-pack').catch(() => null),
          getJson('/api/demo/feedback').catch(() => null),
          getJson('/api/demo/breakthrough').catch(() => null),
          getJson('/api/academic/coverage-audit').catch(() => null),
          getJson('/api/academic/source-intake').catch(() => null),
          getJson('/api/runtime/deploy-closure').catch(() => null),
          getJson('/api/runtime/hosted-closure').catch(() => null),
          getJson('/api/teacher-pilot/completion').catch(() => null),
          getJson('/api/runtime/public-rollout-readiness').catch(() => null),
          getJson('/api/product/foundation'),
          getJson('/api/metadata'),
          getJson('/api/subject-data/review-board').catch(() => null),
          getJson('/api/lesson-drafting/profiles?grade=' + encodeURIComponent(form.grade) + '&learnerProfile=' + encodeURIComponent(form.learnerProfile)).catch(() => null),
          getJson('/api/lessons').catch(() => ({ items: [] }))
        ]);
        setCurrentUser(authMe?.user || null);
        const serverDrafts = Array.isArray(savedLessons?.items) ? savedLessons.items.map(draftFromSavedLesson) : [];
        setDrafts(mergeDrafts(serverDrafts, localDrafts));
        setState({ health, readiness, basicFlow, launchGate, testerPack, feedback, breakthrough, academicCoverage, academicSourceIntake, runtimeDeployClosure, runtimeHostedClosure, teacherPilotCompletion, publicRolloutReadiness, productFoundation, metadata, subjectData, lessonDrafting });
      } catch (error) {
        setState({ error: error instanceof Error ? error.message : 'Không tải được trạng thái demo.' });
      } finally {
        setLoading(false);
      }
    }
    void boot();
  }, []);

  useEffect(() => {
    async function refreshDraftingProfile() {
      try {
        const query = new URLSearchParams();
        query.set('grade', form.grade);
        if (form.examMode !== 'standard') query.set('examMode', form.examMode);
        query.set('learnerProfile', form.learnerProfile);
        const lessonDrafting = await getJson('/api/lesson-drafting/profiles?' + query.toString());
        setState((prev) => ({ ...prev, lessonDrafting }));
      } catch {
        setState((prev) => ({ ...prev, lessonDrafting: prev.lessonDrafting }));
      }
    }
    void refreshDraftingProfile();
  }, [form.grade, form.examMode, form.learnerProfile]);

  const payload = useMemo(() => ({
    title: lessonTitle(form),
    level: Number(form.grade) <= 5 ? 'Tiểu học' : Number(form.grade) <= 9 ? 'THCS' : 'THPT',
    grade: form.grade,
    subject: form.subject,
    book: form.book,
    topic: form.topic,
    template: form.template,
    duration: form.duration,
    teacherNote: form.teacherNote,
    examMode: form.examMode === 'standard' ? undefined : form.examMode,
    learnerProfile: form.learnerProfile,
    lessonIntent: form.lessonIntent,
    designMode: form.designMode,
    classSize: form.classSize,
    deviceAccess: form.deviceAccess,
    space: form.space,
    content,
    methods: ['Trực quan', 'Thảo luận', 'Luyện tập'],
    techniques: ['Think–Pair–Share', 'Phiếu ra cửa'],
    lessonStatus: 'draft',
    allowInternalPreview: true
  }), [form, content]);

  async function refreshCurrentUser() {
    const json = await getJson('/api/auth/me').catch(() => ({ user: null }));
    setCurrentUser(json?.user || null);
    return json?.user || null;
  }

  async function refreshServerDrafts() {
    const savedLessons = await getJson('/api/lessons').catch(() => ({ items: [] }));
    const serverDrafts = Array.isArray(savedLessons?.items) ? savedLessons.items.map(draftFromSavedLesson) : [];
    const localDrafts = readLocalDrafts();
    const next = mergeDrafts(serverDrafts, localDrafts);
    setDrafts(next);
    return next;
  }

  async function submitAuth() {
    setAuthBusy(true);
    setAuthNotice('');
    setNotice('');
    setState((prev) => ({ ...prev, error: undefined }));
    try {
      const endpoint = authForm.mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const body = authForm.mode === 'register'
        ? { name: authForm.name, email: authForm.email, password: authForm.password, schoolName: authForm.schoolName, departmentName: authForm.departmentName, inviteCode: authForm.inviteCode || undefined }
        : { email: authForm.email, password: authForm.password, inviteCode: authForm.inviteCode || undefined };
      const json = await getJson(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      setCurrentUser(json.user);
      setAuthForm((prev) => ({ ...defaultAuthForm, mode: prev.mode, email: json?.account?.email || prev.email }));
      await refreshServerDrafts();
      setAuthNotice(authForm.mode === 'register' ? 'Đã tạo tài khoản giáo viên.' : 'Đã đăng nhập.');
    } catch (error) {
      setAuthNotice('');
      setState((prev) => ({ ...prev, error: friendlyErrorMessage(error) || 'Không xử lý được đăng nhập/đăng ký.' }));
    } finally {
      setAuthBusy(false);
    }
  }

  async function logout() {
    setAuthBusy(true);
    setAuthNotice('');
    try {
      const csrf = await getJson('/api/auth/csrf');
      await getJson('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf.csrfToken || '' },
        body: JSON.stringify({})
      });
      setCurrentUser(null);
      setActiveDraftId(null);
      setAuthNotice('Đã đăng xuất.');
    } catch (error) {
      setState((prev) => ({ ...prev, error: friendlyErrorMessage(error) || 'Không đăng xuất được.' }));
    } finally {
      setAuthBusy(false);
    }
  }

  function requireRealAccountForAction(actionLabel: string) {
    if (isRealAccount(currentUser)) return true;
    setAuthNotice(`Cần đăng nhập hoặc đăng ký tài khoản giáo viên trước khi ${actionLabel}. Việc này giúp bảo vệ bản nháp, quota export và quyền người dùng.`);
    setActiveTab('settings');
    return false;
  }

  function startFromWeekLesson(lesson: (typeof weekLessonSamples)[number]) {
    setForm((prev) => ({
      ...prev,
      subject: lesson.subject,
      topic: lesson.title,
      teacherNote: `Tạo từ Lịch tuần: ${lesson.day}, tiết ${lesson.period}. Đây là dữ liệu UI mẫu (${lesson.dataStatus}); giáo viên cần kiểm tra và nhập nội dung chuyên môn thật.`
    }));
    setNotice(`Đã đưa “${lesson.title}” vào form soạn bài. Lịch tuần vẫn là UI mẫu, chưa lưu backend thật.`);
    setActiveTab('compose');
  }

  function handleSourceLevelAction(area: string, action: string) {
    setNotice(`${area}: ${action} hiện là hành động source-level UI. Chưa ghi backend/audit log thật; cần batch backend riêng trước khi public.`);
  }

  function handleResourceAction(item: (typeof resourceSamples)[number], action: 'save' | 'insert' | 'report') {
    if (action === 'insert' && item.canInsert) {
      setForm((prev) => ({
        ...prev,
        teacherNote: `${prev.teacherNote}\nGợi ý học liệu mẫu: ${item.title} (${item.reviewState}; nguồn: ${item.sourceName}; license: ${item.license}).`
      }));
      setNotice(`Đã thêm gợi ý học liệu “${item.title}” vào ghi chú giáo viên. Đây không phải chèn nội dung verified.`);
      return;
    }
    if (action === 'insert' && !item.canInsert) {
      setNotice(`Không chèn “${item.title}” vì metadata/license/review chưa đủ. Tài nguyên cần qua moderation/takedown guard trước khi dùng rộng.`);
      return;
    }
    handleSourceLevelAction('Học liệu', action === 'save' ? `lưu “${item.title}”` : `báo lỗi “${item.title}”`);
  }

  function handleModerationAction(item: (typeof moderationQueueSamples)[number], action: string) {
    const blocked = item.risk === 'cao' || item.licenseStatus === 'unknown' || item.studentDataRisk !== 'none';
    if (action === 'Duyệt cộng đồng' && blocked) {
      setNotice(`Không duyệt “${item.title}”: rủi ro/license/dữ liệu học sinh chưa đủ. Cần backend audit + reviewer thật.`);
      return;
    }
    handleSourceLevelAction('Kiểm duyệt', `${action.toLowerCase()} “${item.title}”`);
  }

  async function generateLesson() {
    setBusy('generate');
    setNotice('');
    try {
      const csrf = await getJson('/api/auth/csrf');
      const json = await getJson('/api/template-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf.csrfToken || 'demo' },
        body: JSON.stringify({ ...payload, content: undefined })
      });
      const plan = json?.bundle?.plan || '';
      setContent(plan);
      setActiveTab('editor');
      window.setTimeout(() => editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
      setQualityChecklist(json?.bundle?.qualityChecklist || null);
      setLessonDesignStudio(json?.bundle?.designStudio || null);
      setNotice('Đã tạo khung bài dạy. Hãy kiểm tra và chỉnh sửa trước khi xuất.');
      void refreshCurrentUser();
    } catch (error) {
      setState((prev) => ({ ...prev, error: friendlyErrorMessage(error) || 'Không tạo được khung bài dạy.' }));
    } finally {
      setBusy(null);
    }
  }

  async function saveDraft() {
    if (!requireRealAccountForAction('lưu bản nháp lên demo')) return;
    setBusy('save');
    setNotice('');
    const now = new Date().toISOString();
    const fallbackItem: SavedDraft = {
      ...form,
      id: `draft-${Date.now()}`,
      title: lessonTitle(form),
      content: content || 'Bản nháp chưa có nội dung.',
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      storage: 'browser_local'
    };

    try {
      const csrf = await getJson('/api/auth/csrf');
      const json = await getJson('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf.csrfToken || 'demo' },
        body: JSON.stringify({ ...payload, content: fallbackItem.content, status: 'draft', changeSummary: 'Lưu bản nháp.' })
      });
      const serverDraft = draftFromSavedLesson(json.item);
      const next = mergeDrafts([serverDraft], drafts);
      setDrafts(next);
      writeLocalDrafts(next);
      setActiveDraftId(serverDraft.id);
      setNotice('Đã lưu bản nháp.');
    } catch (error) {
      const next = [fallbackItem, ...drafts].slice(0, 20);
      setDrafts(next);
      writeLocalDrafts(next);
      setNotice(`Đã lưu tạm trong trình duyệt. ${error instanceof Error ? error.message : ''}`);
    } finally {
      setBusy(null);
    }
  }

  function loadDraft(item: SavedDraft) {
    setForm({
      grade: item.grade,
      subject: item.subject,
      book: item.book,
      topic: item.topic,
      template: item.template,
      duration: item.duration,
      teacherNote: item.teacherNote,
      examMode: item.examMode || 'standard',
      learnerProfile: item.learnerProfile || 'standard',
      lessonIntent: item.lessonIntent || 'new_lesson',
      designMode: item.designMode || 'standard',
      classSize: item.classSize || 'standard',
      deviceAccess: item.deviceAccess || 'teacher_only',
      space: item.space || 'regular_room'
    });
    setContent(item.content);
    setActiveDraftId(item.storage === 'server_json' ? item.id : null);
    setActiveTab('editor');
    setNotice(`Đã mở: ${item.title}`);
  }

  async function runQualityCheck() {
    setBusy('quality');
    setNotice('');
    try {
      const csrf = await getJson('/api/auth/csrf');
      const json = await getJson('/api/lesson-quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf.csrfToken || 'demo' },
        body: JSON.stringify({ ...payload, content: content || 'Bản nháp chưa có nội dung.' })
      });
      setQualityChecklist(json?.qualityChecklist || null);
      setNotice('Đã kiểm tra. Xem kết quả bên dưới.');
    } catch (error) {
      setState((prev) => ({ ...prev, error: friendlyErrorMessage(error) || 'Không kiểm tra được.' }));
    } finally {
      setBusy(null);
    }
  }

  async function exportLesson(kind: 'docx' | 'pdf') {
    if (!requireRealAccountForAction(`xuất ${kind.toUpperCase()}`)) return;
    setBusy(kind);
    setNotice('');
    try {
      const csrf = await getJson('/api/auth/csrf');
      const response = await fetch(`/api/export/${kind}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf.csrfToken || 'demo' },
        body: JSON.stringify({ ...payload, lessonId: activeDraftId || undefined, savedLessonId: activeDraftId || undefined, content: content || 'Bản nháp chưa có nội dung.' })
      });
      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error(json?.error || `Không xuất được ${kind.toUpperCase()}.`);
      }
      const blob = await response.blob();
      downloadBlob(blob, `giao-an-demo.${kind}`, response);
      setNotice(`Đã tạo file ${kind.toUpperCase()}. Hãy kiểm tra trước khi dùng.`);
    } catch (error) {
      setState((prev) => ({ ...prev, error: friendlyErrorMessage(error) || `Không xuất được ${kind.toUpperCase()}.` }));
    } finally {
      setBusy(null);
    }
  }

  async function submitDemoFeedback() {
    setFeedbackSubmitting(true);
    setNotice('');
    try {
      const csrf = await getJson('/api/auth/csrf');
      const json = await getJson('/api/demo/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf.csrfToken || 'demo' },
        body: JSON.stringify({
          ...feedbackForm,
          demoUrl: typeof window !== 'undefined' ? window.location.href : undefined,
          tasksCompleted: ['open_home', 'review_tester_pack', 'try_lesson_frame'],
          ratingEase: Number(feedbackForm.ratingEase),
          ratingTrust: Number(feedbackForm.ratingTrust)
        })
      });
      setState((prev) => ({ ...prev, feedback: { board: json.board, formConfig: prev.feedback?.formConfig } }));
      setFeedbackForm((prev) => ({ ...prev, title: '', description: '', evidenceNote: '', hasStudentPersonalData: false }));
      setNotice('Đã gửi góp ý. Cảm ơn bạn!');
    } catch (error) {
      setState((prev) => ({ ...prev, error: friendlyErrorMessage(error) || 'Không gửi được góp ý.' }));
    } finally {
      setFeedbackSubmitting(false);
    }
  }

  function selectTeacherStarter(option: TeacherStarterOption) {
    setForm((prev) => ({
      ...prev,
      grade: option.grade,
      subject: option.subject,
      book: option.book,
      topic: option.topic
    }));
    setNotice(`Đã chọn nhanh: ${option.label} — ${option.topic}. Hãy kiểm tra nhãn dữ liệu trước khi dùng.`);
  }

  function selectWorkspaceTab(tab: WorkspaceTab) {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  useEffect(() => {
    if (!mobileMenuOpen) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen || typeof document === 'undefined') return;
    document.body.classList.add('mobile-menu-open');
    return () => document.body.classList.remove('mobile-menu-open');
  }, [mobileMenuOpen]);

  // Derived state
  const curriculumGrades = state.metadata?.curriculum?.grades || {};
  const gradeCatalog = curriculumGrades?.[form.grade] || null;
  const subjectOptions = unique(Object.keys(gradeCatalog?.subjects || {}));
  const subjectCatalog = gradeCatalog?.subjects?.[form.subject] || null;
  const bookOptions = unique(Object.keys(subjectCatalog?.books || {}));
  const selectedBook = subjectCatalog?.books?.[form.book] || null;
  const topicOptions = unique(Object.keys(selectedBook?.topics || {}));
  const selectedTopic = selectedBook?.topics?.[form.topic] || null;
  const templateOptions = unique([...(Array.isArray(state.metadata?.templates) ? state.metadata.templates : []), ...fallbackTemplates]);
  const currentDataLabel = teacherDataLabel(selectedTopic || selectedBook || subjectCatalog);
  const showStandardPanels = form.designMode !== 'easy';
  const showTechnicalPanels = form.designMode === 'advanced';
  const realAccount = isRealAccount(currentUser);
  const accountLabel = accountStatusLabel(currentUser);
  const qualitySummary = qualityChecklist?.summary;
  const visibleQualityChecks = Array.isArray(qualityChecklist?.checks) ? qualityChecklist.checks.slice(0, 5) : [];
  const disableExportUntilContent = !content.trim();
  const dataStatusClass = currentDataLabel === 'Đã rà soát' ? 'verified' : currentDataLabel === 'Đã xem lại' ? 'reviewed' : currentDataLabel === 'Bản mẫu thử' ? 'seed' : 'scaffold';
  const breakthroughReport = state.breakthrough?.report || null;
  const breakthroughBlockers = Array.isArray(breakthroughReport?.blockers) ? breakthroughReport.blockers : [];
  const breakthroughSourcePercent = Number(breakthroughReport?.sourceReadinessPercent || 0);
  const exportDocxQuota = breakthroughReport?.operating?.usage?.export_docx || null;
  const exportPdfQuota = breakthroughReport?.operating?.usage?.export_pdf || null;
  const saveLessonQuota = breakthroughReport?.operating?.usage?.save_lesson || null;
  const academicReport = state.academicCoverage?.report || breakthroughReport?.academicCoverage || null;
  const academicMetrics = academicReport?.metrics || null;
  const academicDeepAllowed = Number(academicMetrics?.deepContentAllowedScopes || 0);
  const academicTotalScopes = Number(academicMetrics?.totalScopes || 0);
  const academicBlockedPercent = Number(academicMetrics?.blockedFromDeepContentPercent || 0);
  const sourceIntakeBoard = state.academicSourceIntake?.board || breakthroughReport?.academicSourceIntake || null;
  const sourceIntakeMetrics = sourceIntakeBoard?.metrics || null;
  const sourceIntakeDrafts = Number(sourceIntakeMetrics?.intakeDrafts || 0);
  const sourceIntakeReviewCandidates = Number(sourceIntakeMetrics?.readyForReviewedCandidate || 0);
  const sourceIntakeRegistryMutations = Number(sourceIntakeMetrics?.registryMutationsInBatch104 || 0);
  const runtimeDeployBoard = state.runtimeDeployClosure?.board || breakthroughReport?.runtimeDeployClosure || null;
  const runtimeDeployReadinessPercent = Number(runtimeDeployBoard?.readinessPercent || 0);
  const runtimeDeployHardBlockers = Array.isArray(runtimeDeployBoard?.runtime?.hardBlockers)
    ? runtimeDeployBoard.runtime.hardBlockers.length
    : Array.isArray(runtimeDeployBoard?.hardBlockers)
      ? runtimeDeployBoard.hardBlockers.length
      : 0;
  const runtimeDeployHostedBlockers = Array.isArray(runtimeDeployBoard?.runtime?.hostedBlockers)
    ? runtimeDeployBoard.runtime.hostedBlockers.length
    : Array.isArray(runtimeDeployBoard?.hostedBlockers)
      ? runtimeDeployBoard.hostedBlockers.length
      : 0;
  const runtimeDeployStatus = runtimeDeployBoard?.status || 'source_level_runtime_gate_ready';
  const runtimeHostedBoard = state.runtimeHostedClosure?.board || breakthroughReport?.runtimeHostedClosure || null;
  const runtimeHostedReadinessPercent = Number(runtimeHostedBoard?.readinessPercent || 0);
  const runtimeHostedMissingRequired = Array.isArray(runtimeHostedBoard?.evidence?.missingRequired)
    ? runtimeHostedBoard.evidence.missingRequired.length
    : Array.isArray(runtimeHostedBoard?.missingRequired)
      ? runtimeHostedBoard.missingRequired.length
      : 0;
  const runtimeHostedHardBlockers = Array.isArray(runtimeHostedBoard?.evidence?.hardBlockers)
    ? runtimeHostedBoard.evidence.hardBlockers.length
    : Array.isArray(runtimeHostedBoard?.hardBlockers)
      ? runtimeHostedBoard.hardBlockers.length
      : 0;
  const runtimeHostedStatus = runtimeHostedBoard?.status || 'hosted_runtime_unverified_or_blocked';
  const teacherPilotCompletionBoard = state.teacherPilotCompletion?.board || breakthroughReport?.teacherPilotCompletion || null;
  const teacherPilotCompletionPercent = Number(teacherPilotCompletionBoard?.completionPercent || 0);
  const teacherPilotRequiredPassed = Number(teacherPilotCompletionBoard?.requiredPassed || 0);
  const teacherPilotRequiredTotal = Number(teacherPilotCompletionBoard?.requiredTotal || 0);
  const teacherPilotOfflineArtifact = teacherPilotCompletionBoard?.offlineArtifact || 'public/teacher-pilot-demo.html';
  const teacherPilotStatus = teacherPilotCompletionBoard?.status || 'offline_teacher_pilot_slice_pending';
  const teacherStarterOptions = useMemo<TeacherStarterOption[]>(() => {
    const options: TeacherStarterOption[] = [];
    const grades = Object.keys(curriculumGrades || {}).sort((a, b) => Number(a) - Number(b));
    for (const grade of grades) {
      const subjects = curriculumGrades?.[grade]?.subjects || {};
      for (const subject of Object.keys(subjects)) {
        const books = subjects?.[subject]?.books || {};
        for (const book of Object.keys(books)) {
          const topics = books?.[book]?.topics || {};
          const topicNames = Object.keys(topics);
          for (const topic of topicNames.slice(0, 2)) {
            const topicData = topics?.[topic];
            options.push({
              id: `${grade}-${subject}-${book}-${topic}`,
              grade,
              subject,
              book,
              topic,
              label: `Lớp ${grade} · ${subject}`,
              note: `${book} · ${topic}`,
              dataLabel: teacherDataLabel(topicData || books?.[book] || subjects?.[subject])
            });
            if (options.length >= 6) return options;
          }
        }
      }
    }
    return options;
  }, [curriculumGrades]);
  const guidedProgressItems = [
    { label: 'Chọn lớp/môn/bài', hint: 'Ưu tiên chọn từ danh sách; nếu chưa có thì tự nhập.', done: Boolean(form.grade && form.subject && form.topic), tab: 'compose' as WorkspaceTab },
    { label: 'Tạo khung an toàn', hint: 'Không sinh kiến thức sâu nếu dữ liệu chưa verified.', done: Boolean(content.trim()), tab: content.trim() ? 'editor' as WorkspaceTab : 'compose' as WorkspaceTab },
    { label: 'Lưu bằng tài khoản giáo viên', hint: 'Cần tài khoản thật trước khi lưu/xuất demo.', done: Boolean(activeDraftId), tab: realAccount ? 'editor' as WorkspaceTab : 'settings' as WorkspaceTab },
    { label: 'Kiểm tra rồi xuất', hint: 'Checklist + nhãn dữ liệu phải rõ trước khi dùng.', done: Boolean(qualityChecklist), tab: 'editor' as WorkspaceTab }
  ];
  const guidedProgressDone = guidedProgressItems.filter((item) => item.done).length;
  const guidedProgressPercent = Math.round((guidedProgressDone / guidedProgressItems.length) * 100);

  const weeklyReadyCount = weekLessonSamples.filter((item) => item.ready).length;
  const weeklyTodoCount = weekLessonSamples.length - weeklyReadyCount;
  const filteredResourceSamples = resourceSamples.filter((item) => {
    const matchesTab = resourceTab === 0 || item.type === resourceTab;
    const query = resourceQuery.trim().toLowerCase();
    const matchesQuery = !query || [item.title, item.grade, item.subject, item.device, item.license].join(' ').toLowerCase().includes(query);
    return matchesTab && matchesQuery;
  });
  const filteredModerationQueue = moderationQueueSamples.filter((item) => moderationFilter === 'all' || item.status === moderationFilter);
  const rolloutBoard = state.publicRolloutReadiness?.board;
  const dynamicReleaseGateChecks = Array.isArray(rolloutBoard?.gates)
    ? rolloutBoard.gates.map((gate: any) => ({
        label: gate.label || gate.id,
        status: gate.ok ? 'ok' : gate.state === 'blocked' || gate.state === 'fail' ? 'fail' : 'warn',
        note: gate.note || gate.command || gate.artifact || ''
      }))
    : releaseGateChecks.map((item) => ({ ...item, note: 'Fallback UI; chưa tải được API readiness.' }));
  const rolloutReadinessText = rolloutBoard
    ? `${rolloutBoard.sourceLevelReadinessPercent || 0}% source · ${rolloutBoard.evidenceReadinessPercent || 0}% evidence`
    : 'Chưa tải API readiness';

  // Navigation items
  const sidebarNavMain = [
    { id: 'dashboard' as WorkspaceTab, label: 'Tổng quan', icon: IconHome },
    { id: 'compose' as WorkspaceTab, label: 'Tạo giáo án', icon: IconCompose },
    { id: 'editor' as WorkspaceTab, label: 'Chỉnh sửa', icon: IconEdit, hidden: !content },
    { id: 'drafts' as WorkspaceTab, label: 'Kho giáo án', icon: IconFolder, count: drafts.length },
    { id: 'week' as WorkspaceTab, label: 'Lịch tuần', icon: IconCalendar, badge: weeklyTodoCount ? `${weeklyTodoCount} việc` : 'OK' },
    { id: 'export' as WorkspaceTab, label: 'Xuất file', icon: IconDownload },
  ];

  const sidebarNavResources = [
    { id: 'resources' as WorkspaceTab, label: 'Học liệu', icon: IconArchive, badge: 'Mới' },
    { id: 'community' as WorkspaceTab, label: 'Cộng đồng', icon: IconMessage, badge: 'Duyệt' },
    { id: 'team' as WorkspaceTab, label: 'Tổ chuyên môn', icon: IconUsers, badge: 'Beta' },
  ];

  const sidebarNavSystem = [
    { id: 'moderation' as WorkspaceTab, label: 'Kiểm duyệt', icon: IconShield, badge: `${moderationQueueSamples.length}` },
    { id: 'legal' as WorkspaceTab, label: 'Legal Gate', icon: IconScale },
    { id: 'release' as WorkspaceTab, label: 'Release Gate', icon: IconRocket },
    { id: 'feedback' as WorkspaceTab, label: 'Góp ý', icon: IconMessage },
    { id: 'settings' as WorkspaceTab, label: 'Cài đặt', icon: IconSettings },
  ];

  const mobileNavItems = [
    { id: 'compose' as WorkspaceTab, label: 'Soạn', icon: IconCompose },
    { id: 'editor' as WorkspaceTab, label: 'Sửa', icon: IconEdit },
    { id: 'drafts' as WorkspaceTab, label: 'Nháp', icon: IconFolder },
    { id: 'week' as WorkspaceTab, label: 'Tuần', icon: IconCalendar },
    { id: 'settings' as WorkspaceTab, label: 'Khác', icon: IconMenu },
  ];

  const tabTitles: Record<WorkspaceTab, string> = {
    dashboard: 'Tổng quan',
    compose: 'Tạo giáo án',
    editor: 'Chỉnh sửa',
    drafts: 'Kho giáo án',
    week: 'Lịch tuần',
    resources: 'Học liệu',
    export: 'Xuất file',
    community: 'Cộng đồng',
    team: 'Tổ chuyên môn',
    moderation: 'Kiểm duyệt',
    legal: 'Legal Gate',
    release: 'Release Gate',
    feedback: 'Góp ý',
    settings: 'Cài đặt',
    debug: 'Kiểm định',
  };

  // Current step for stepper
  const currentStep = activeTab === 'compose' ? 1 : activeTab === 'editor' ? 2 : activeTab === 'export' ? 3 : 0;

  return (
    <div className="app-shell">
      {/* ========== DESKTOP SIDEBAR ========== */}
      <aside className="desktop-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <IconBook className="h-5 w-5" />
            </div>
            <div className="sidebar-logo-text">
              <div className="sidebar-logo-title">Giáo Án Việt</div>
              <div className="sidebar-logo-subtitle">Soạn giáo án dễ dàng</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav scrollbar-thin">
          <div className="sidebar-nav-section">
            <div className="sidebar-nav-section-title">Chính</div>
            {sidebarNavMain.filter(item => !item.hidden).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectWorkspaceTab(item.id)}
                  className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
                >
                  <Icon className="sidebar-nav-icon" />
                  <span>{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="sidebar-nav-badge">{item.count}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="sidebar-nav-section">
            <div className="sidebar-nav-section-title">Tài nguyên</div>
            {sidebarNavResources.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectWorkspaceTab(item.id)}
                  className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
                >
                  <Icon className="sidebar-nav-icon" />
                  <span>{item.label}</span>
                  {item.badge && <span className="sidebar-nav-badge">{item.badge}</span>}
                </button>
              );
            })}
          </div>

          <div className="sidebar-nav-section">
            <div className="sidebar-nav-section-title">Hệ thống</div>
            {sidebarNavSystem.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectWorkspaceTab(item.id)}
                  className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
                >
                  <Icon className="sidebar-nav-icon" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            {showTechnicalPanels && (
              <button
                type="button"
                onClick={() => selectWorkspaceTab('debug')}
                className={`sidebar-nav-item ${activeTab === 'debug' ? 'active' : ''}`}
              >
                <IconShield className="sidebar-nav-icon" />
                <span>Kiểm định</span>
              </button>
            )}
          </div>
        </nav>

        <div className="sidebar-footer">
          <button 
            type="button"
            onClick={() => selectWorkspaceTab('settings')}
            className="sidebar-user-card w-full text-left"
          >
            <div className="sidebar-user-avatar">
              <IconUser className="h-4 w-4" />
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{currentUser?.name || 'Khách'}</div>
              <div className="sidebar-user-status">{accountLabel}</div>
            </div>
          </button>
        </div>
      </aside>

      {/* ========== DESKTOP HEADER ========== */}
      <header className="desktop-header">
        <h1 className="header-title">{tabTitles[activeTab]}</h1>
        
        <div className="header-search">
          <IconSearch className="header-search-icon" />
          <input
            type="text"
            placeholder="Tìm giáo án, học liệu..."
            className="header-search-input"
          />
        </div>

        <div className="header-chips">
          <span className="header-chip warning">Không dùng AI</span>
          <span className="header-chip">Bản demo</span>
        </div>

        <label className="mode-switcher" title="Chế độ Dễ dùng/Tiêu chuẩn/Nâng cao ngay trên header">
          <span>Chế độ</span>
          <select
            value={form.designMode}
            onChange={(e) => setForm({ ...form, designMode: e.target.value })}
            aria-label="Chọn chế độ giao diện"
          >
            <option value="easy">Dễ dùng</option>
            <option value="standard">Tiêu chuẩn</option>
            <option value="advanced">Nâng cao</option>
          </select>
        </label>

        <div className="header-cta">
          <button
            type="button"
            onClick={() => setActiveTab('compose')}
            className="btn btn-primary"
          >
            <IconPlus className="h-4 w-4" />
            <span>Tạo giáo án</span>
          </button>
        </div>
      </header>

      {/* ========== MOBILE HEADER ========== */}
      <header className="mobile-header">
        <div className="mobile-header-content">
          <div className="mobile-logo">
            <div className="mobile-logo-icon">
              <IconBook className="h-4 w-4" />
            </div>
            <div>
              <div className="mobile-logo-text">Giáo Án Việt</div>
              <div className="mobile-logo-status">{accountLabel}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn btn-ghost btn-icon"
            aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-more-menu"
          >
            {mobileMenuOpen ? <IconX className="h-5 w-5" /> : <IconSettings className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* ========== MOBILE MORE BOTTOM SHEET ========== */}
      {mobileMenuOpen && (
        <div className="mobile-menu-layer" role="presentation">
          <button
            type="button"
            className="mobile-menu-backdrop"
            aria-label="Đóng menu bằng cách bấm ra ngoài"
            onClick={closeMobileMenu}
          />
          <div
            id="mobile-more-menu"
            className="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu chức năng khác dạng bottom sheet"
          >
            <div className="mobile-menu-header">
              <div>
                <div className="mobile-menu-kicker">Menu nhanh</div>
                <div className="mobile-menu-heading">Khu vực khác</div>
              </div>
              <button type="button" onClick={closeMobileMenu} className="btn btn-ghost btn-icon" aria-label="Đóng menu">
                <IconX className="h-5 w-5" />
              </button>
            </div>

            <div className="mobile-menu-account-card">
              <div>
                <div className="mobile-menu-title">Tài khoản giáo viên</div>
                <p>{realAccount ? 'Đã đăng nhập, có thể lưu/xuất demo an toàn hơn.' : 'Phiên này chỉ để xem thử. Hãy đăng nhập trước khi lưu hoặc xuất.'}</p>
              </div>
              <button type="button" onClick={() => selectWorkspaceTab('settings')} className="btn btn-secondary btn-sm">
                {realAccount ? 'Xem tài khoản' : 'Đăng nhập'}
              </button>
            </div>

            <div className="mobile-menu-section">
              <div className="mobile-menu-title">Chế độ hiển thị</div>
              <div className="mobile-mode-grid">
                {[
                  { id: 'easy', label: 'Dễ dùng' },
                  { id: 'standard', label: 'Tiêu chuẩn' },
                  { id: 'advanced', label: 'Nâng cao' }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setForm({ ...form, designMode: mode.id })}
                    className={`mobile-mode-pill ${form.designMode === mode.id ? 'active' : ''}`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mobile-menu-section">
              <div className="mobile-menu-title">Chính</div>
              <button type="button" onClick={() => selectWorkspaceTab('dashboard')} className="mobile-menu-item">
                <IconHome className="h-5 w-5" />
                <span>Tổng quan</span>
              </button>
              <button type="button" onClick={() => selectWorkspaceTab('compose')} className="mobile-menu-item">
                <IconCompose className="h-5 w-5" />
                <span>Tạo giáo án</span>
              </button>
              <button type="button" onClick={() => selectWorkspaceTab('drafts')} className="mobile-menu-item">
                <IconFolder className="h-5 w-5" />
                <span>Bản nháp</span>
                {drafts.length > 0 && <span className="mobile-menu-badge">{drafts.length}</span>}
              </button>
              <button type="button" onClick={() => selectWorkspaceTab('export')} className="mobile-menu-item">
                <IconDownload className="h-5 w-5" />
                <span>Xuất file</span>
              </button>
            </div>

            <div className="mobile-menu-section">
              <div className="mobile-menu-title">Tài nguyên</div>
              <button type="button" onClick={() => selectWorkspaceTab('week')} className="mobile-menu-item">
                <IconCalendar className="h-5 w-5" />
                <span>Lịch tuần</span>
                {weeklyTodoCount > 0 && <span className="mobile-menu-badge">{weeklyTodoCount} việc</span>}
              </button>
              <button type="button" onClick={() => selectWorkspaceTab('resources')} className="mobile-menu-item">
                <IconArchive className="h-5 w-5" />
                <span>Học liệu</span>
                <span className="mobile-menu-badge">Mới</span>
              </button>
              <button type="button" onClick={() => selectWorkspaceTab('community')} className="mobile-menu-item">
                <IconMessage className="h-5 w-5" />
                <span>Cộng đồng</span>
                <span className="mobile-menu-badge">Duyệt</span>
              </button>
              <button type="button" onClick={() => selectWorkspaceTab('team')} className="mobile-menu-item">
                <IconUsers className="h-5 w-5" />
                <span>Tổ chuyên môn</span>
                <span className="mobile-menu-badge">Beta</span>
              </button>
            </div>
            <div className="mobile-menu-section">
              <div className="mobile-menu-title">Hệ thống</div>
              <button type="button" onClick={() => selectWorkspaceTab('moderation')} className="mobile-menu-item">
                <IconShield className="h-5 w-5" />
                <span>Kiểm duyệt</span>
                <span className="mobile-menu-badge">{moderationQueueSamples.length}</span>
              </button>
              <button type="button" onClick={() => selectWorkspaceTab('legal')} className="mobile-menu-item">
                <IconScale className="h-5 w-5" />
                <span>Legal Gate</span>
              </button>
              <button type="button" onClick={() => selectWorkspaceTab('release')} className="mobile-menu-item">
                <IconRocket className="h-5 w-5" />
                <span>Release Gate</span>
              </button>
              <button type="button" onClick={() => selectWorkspaceTab('feedback')} className="mobile-menu-item">
                <IconMessage className="h-5 w-5" />
                <span>Góp ý</span>
              </button>
              <button type="button" onClick={() => selectWorkspaceTab('settings')} className="mobile-menu-item">
                <IconSettings className="h-5 w-5" />
                <span>Cài đặt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== MOBILE STEPPER ========== */}
      {currentStep > 0 && (
        <div className="stepper">
          {[
            { step: 1, label: 'Chọn', tab: 'compose' as WorkspaceTab },
            { step: 2, label: 'Sửa', tab: 'editor' as WorkspaceTab },
            { step: 3, label: 'Xuất', tab: 'export' as WorkspaceTab }
          ].map((item, idx) => {
            const isCompleted = currentStep > item.step;
            const isActive = currentStep === item.step;
            return (
              <div key={item.step} className="stepper-step">
                {idx > 0 && <div className={`stepper-line ${isCompleted ? 'completed' : ''}`} />}
                <button
                  type="button"
                  onClick={() => selectWorkspaceTab(item.tab)}
                  className={`stepper-dot ${isCompleted ? 'completed' : isActive ? 'active' : 'pending'}`}
                >
                  {isCompleted ? <IconCheck className="h-3 w-3" /> : item.step}
                </button>
                <span className={`stepper-label ${isActive ? 'active' : ''}`}>{item.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ========== MAIN CONTENT ========== */}
      <div className="main-wrapper">
        <div className="main-content">
          {/* Alerts */}
          {(state.error || notice) && (
            <div className="mb-4 lg:mb-6">
              {state.error && (
                <div className="alert alert-danger mb-3">
                  <IconAlert className="alert-icon" />
                  <span>{state.error}</span>
                </div>
              )}
              {notice && (
                <div className="alert alert-success">
                  <IconCheck className="alert-icon" />
                  <span>{notice}</span>
                </div>
              )}
            </div>
          )}

          <div className={`teacher-safe-flow-banner ${dataStatusClass}`}>
            <div className="teacher-safe-flow-main">
              <span className="teacher-safe-flow-kicker">Luồng an toàn cho giáo viên</span>
              <strong>{currentDataLabel}</strong>
              <span>{teacherDataNote(selectedTopic || selectedBook || subjectCatalog)}</span>
            </div>
            <div className="teacher-safe-flow-actions">
              <button type="button" onClick={() => selectWorkspaceTab('compose')} className="btn btn-secondary btn-sm">Chọn bài</button>
              <button type="button" onClick={runQualityCheck} disabled={busy !== null || !content.trim()} className="btn btn-secondary btn-sm">Checklist</button>
              {!realAccount && <button type="button" onClick={() => selectWorkspaceTab('settings')} className="btn btn-primary btn-sm">Đăng nhập để lưu/xuất</button>}
            </div>
          </div>

          {/* ========== DASHBOARD ========== */}
          {activeTab === 'dashboard' && (
            <div className="dashboard-layout">
              {/* Welcome */}
              <div className="welcome-card">
                <div className="welcome-content">
                  <h2 className="welcome-title">Xin chào, {currentUser?.name || 'Giáo viên'}!</h2>
                  <p className="welcome-subtitle">Bắt đầu soạn giáo án hoặc tiếp tục chỉnh sửa bản nháp.</p>
                  <button type="button" onClick={() => setActiveTab('compose')} className="welcome-cta">
                    <IconPlus className="h-4 w-4" />
                    <span>Tạo giáo án mới</span>
                  </button>
                </div>
              </div>


              <div className="plan-bridge-card">
                <div className="plan-bridge-main">
                  <span className="plan-bridge-kicker">Batch135 · Hardening phần vừa port từ file kế hoạch</span>
                  <h3>Biến UI mới thành luồng có guardrail, không chỉ là nút mock</h3>
                  <p>Đã kiểm tra phần vừa thêm ở Batch134 và khóa các hành động dễ gây hiểu nhầm: lịch tuần chỉ prefill form, học liệu cần metadata/license, moderation không duyệt thật nếu chưa có backend audit, Release Gate lấy trạng thái từ API readiness.</p>
                </div>
                <div className="plan-bridge-actions">
                  <button type="button" onClick={() => selectWorkspaceTab('week')} className="btn btn-primary btn-sm">Mở lịch tuần</button>
                  <button type="button" onClick={() => selectWorkspaceTab('resources')} className="btn btn-secondary btn-sm">Xem học liệu</button>
                  <button type="button" onClick={() => selectWorkspaceTab('moderation')} className="btn btn-secondary btn-sm">Kiểm duyệt</button>
                </div>
              </div>

              <div className="plan-stat-grid">
                <button type="button" onClick={() => selectWorkspaceTab('drafts')} className="plan-stat-card">
                  <span>Giáo án đã lưu</span>
                  <strong>{drafts.length}</strong>
                  <small>{drafts.length ? 'Có thể mở lại để chỉnh sửa' : 'Chưa có bản nháp thật'}</small>
                </button>
                <button type="button" onClick={() => selectWorkspaceTab('week')} className="plan-stat-card">
                  <span>Bài cần chuẩn bị</span>
                  <strong>{weeklyTodoCount}</strong>
                  <small>{weeklyReadyCount} bài đã chuẩn bị trong tuần mẫu</small>
                </button>
                <button type="button" onClick={() => selectWorkspaceTab('export')} className="plan-stat-card">
                  <span>Lượt xuất còn lại</span>
                  <strong>{exportDocxQuota ? `${exportDocxQuota.remaining}/${exportDocxQuota.limit}` : 'Demo'}</strong>
                  <small>DOCX/PDF có cảnh báo nguồn</small>
                </button>
                <button type="button" onClick={() => selectWorkspaceTab('resources')} className="plan-stat-card">
                  <span>Học liệu mẫu</span>
                  <strong>{resourceSamples.length}</strong>
                  <small>Hoạt động, trò chơi, rubric, câu hỏi</small>
                </button>
              </div>

              <div className="breakthrough-card">
                <div className="breakthrough-card-main">
                  <span className="breakthrough-kicker">Batch102 · Bứt phá demo</span>
                  <h3>Đóng các điểm đau trước khi mời giáo viên test rộng</h3>
                  <p>{breakthroughReport?.plainLanguageStatus || 'Đang tải báo cáo bứt phá demo.'}</p>
                  <div className="breakthrough-pills">
                    <span className="badge badge-neutral">Source {breakthroughSourcePercent || 0}%</span>
                    <span className={`badge ${breakthroughBlockers.length ? 'badge-warning' : 'badge-success'}`}>{breakthroughBlockers.length} điểm cần đóng</span>
                    <span className="badge badge-neutral">Không AI lõi</span>
                  </div>
                </div>
                <div className="breakthrough-actions">
                  <button type="button" onClick={() => selectWorkspaceTab('compose')} className="btn btn-primary btn-sm">Tạo giáo án thử</button>
                  <button type="button" onClick={() => selectWorkspaceTab('debug')} className="btn btn-secondary btn-sm">Xem kiểm định</button>
                </div>
              </div>

              <div className="academic-truth-card">
                <div className="academic-truth-main">
                  <span className="academic-truth-kicker">Batch103 · Sự thật dữ liệu học thuật 1–12</span>
                  <h3>{academicReport?.plainLanguageStatus || 'Đang tải audit dữ liệu học thuật.'}</h3>
                  <p>Không nâng seed/scaffold thành verified. Nếu thiếu nguồn/reviewer, hệ thống chỉ dựng khung giáo án an toàn.</p>
                  <div className="academic-truth-grid">
                    <span><strong>{academicDeepAllowed}</strong><small>scope được phép nội dung sâu</small></span>
                    <span><strong>{academicTotalScopes}</strong><small>scope lớp/môn đang có trong registry</small></span>
                    <span><strong>{academicBlockedPercent}%</strong><small>bị khóa deep content</small></span>
                  </div>
                </div>
                <button type="button" onClick={() => selectWorkspaceTab('debug')} className="btn btn-secondary btn-sm">Xem audit học thuật</button>
              </div>



              <div className="academic-source-intake-card">
                <div className="academic-source-intake-main">
                  <span className="academic-source-intake-kicker">Batch104 · Nhập-duyệt nguồn trước khi nâng coverage</span>
                  <h3>{sourceIntakeBoard?.plainLanguageStatus || 'Đang tải source pack intake.'}</h3>
                  <p>Muốn nâng reviewed/verified phải có metadata nguồn, license/attribution, reviewer signoff, approved references, audit log và takedown. Batch104 không đổi registry.</p>
                  <div className="academic-source-intake-grid">
                    <span><strong>{sourceIntakeDrafts}</strong><small>source pack draft/template</small></span>
                    <span><strong>{sourceIntakeReviewCandidates}</strong><small>reviewed candidate thật</small></span>
                    <span><strong>{sourceIntakeRegistryMutations}</strong><small>registry mutations trong Batch104</small></span>
                  </div>
                </div>
                <button type="button" onClick={() => selectWorkspaceTab('debug')} className="btn btn-secondary btn-sm">Xem intake nguồn</button>
              </div>

              <div className="runtime-deploy-closure-card">
                <div className="runtime-deploy-closure-main">
                  <span className="runtime-deploy-closure-kicker">Batch105 · Runtime/Hosted Closure</span>
                  <h3>{runtimeDeployBoard?.plainLanguageStatus || 'Đang tải runtime/deploy closure board.'}</h3>
                  <p>Muốn mời giáo viên test phải pass install, Next SWC, build, live smoke, auth smoke và hosted URL smoke. Card này không thay thế bằng chứng runtime thật.</p>
                  <div className="runtime-deploy-closure-grid">
                    <span><strong>{runtimeDeployReadinessPercent}%</strong><small>runtime evidence source</small></span>
                    <span><strong>{runtimeDeployHardBlockers}</strong><small>hard blockers</small></span>
                    <span><strong>{runtimeDeployHostedBlockers}</strong><small>hosted blockers</small></span>
                  </div>
                  <em>Trạng thái: {runtimeDeployStatus}</em>
                </div>
                <button type="button" onClick={() => selectWorkspaceTab('debug')} className="btn btn-secondary btn-sm">Xem runtime gate</button>
              </div>

              <div className="runtime-hosted-closure-card">
                <div className="runtime-hosted-closure-main">
                  <span className="runtime-hosted-closure-kicker">Batch106 · Hosted runtime proof</span>
                  <h3>{runtimeHostedBoard?.plainLanguageStatus || 'Đang tải hosted runtime proof board.'}</h3>
                  <p>Board này dùng để phân loại Vercel/npm/build log và khóa claim demo thật cho tới khi registry, install, Next/SWC, build, smoke và hosted URL đều có proof.</p>
                  <div className="runtime-hosted-closure-grid">
                    <span><strong>{runtimeHostedReadinessPercent}%</strong><small>proof chain</small></span>
                    <span><strong>{runtimeHostedMissingRequired}</strong><small>required còn thiếu</small></span>
                    <span><strong>{runtimeHostedHardBlockers}</strong><small>hard blockers</small></span>
                  </div>
                  <em>Trạng thái: {runtimeHostedStatus}</em>
                </div>
                <button type="button" onClick={() => selectWorkspaceTab('debug')} className="btn btn-secondary btn-sm">Xem hosted proof</button>
              </div>

              
              <div className="curriculum-matrix-card">
                <div className="teacher-pilot-completion-main">
                  <span className="teacher-pilot-completion-kicker">Batch110 · Curriculum Matrix</span>
                  <h3>Ma trận dữ liệu/chương trình: chặn sai lớp–môn–bài và hạ cấp về khung an toàn</h3>
                  <p>Batch110 bổ sung <code>/api/curriculum/matrix</code> và <code>/api/admin/curriculum-gap-board</code>: Kết nối tri thức là trục chính trong teacher flow, Cánh Diều/Chân trời ở <code>legacy_reference</code>, chủ đề tự nhập là <code>teacher_input</code>, tổ hợp chưa map là <code>unmapped</code>. Hệ thống tự tính trạng thái dữ liệu, không cho tự chọn verified, không sinh kiến thức sâu khi thiếu nguồn/reviewer/release gate.</p>
                </div>
              </div>
              <div className="teacher-pilot-completion-card">
                <div className="teacher-pilot-completion-main">
                  <span className="teacher-pilot-completion-kicker">Batch109 · Chọn đúng và xuất bản nháp in được</span>
                  <h3>{teacherPilotCompletionBoard?.plainLanguageStatus || 'Đang tải lát cắt chọn lớp/môn/chủ đề offline/source-level.'}</h3>
                  <p>Đây là phần hoàn thành hữu hình: mở <code>{teacherPilotOfflineArtifact}</code> sau khi giải nén ZIP. Batch109 giữ Batch108 guard: không bắt giáo viên tự gõ chủ đề, chặn sai môn–chủ đề như Tiếng Việt + Phân số, không cho tự chọn verified; bổ sung TXT/HTML/print offline. Hosted runtime vẫn bị khóa claim cho tới khi smoke thật pass.</p>
                  <div className="teacher-pilot-completion-grid">
                    <span><strong>{teacherPilotCompletionPercent}%</strong><small>teacher-print-export / topic slice</small></span>
                    <span><strong>{teacherPilotRequiredPassed}/{teacherPilotRequiredTotal}</strong><small>tiêu chí bắt buộc</small></span>
                    <span><strong>0</strong><small>AI/model call</small></span>
                  </div>
                  <em>Trạng thái: {teacherPilotStatus}</em>
                </div>
                <button type="button" onClick={() => selectWorkspaceTab('debug')} className="btn btn-secondary btn-sm">Xem completion</button>
              </div>

              <div className="guided-progress-card">
                <div className="guided-progress-header">
                  <div>
                    <h3>Đi bước tiếp theo</h3>
                    <p>Quy trình 4 bước giúp giáo viên không bị lạc khi dùng trên điện thoại hoặc máy tính.</p>
                  </div>
                  <div className="guided-progress-score">{guidedProgressPercent}%</div>
                </div>
                <div className="guided-progress-track" aria-label={`Đã hoàn thành ${guidedProgressDone} trên ${guidedProgressItems.length} bước`}>
                  <div style={{ width: `${guidedProgressPercent}%` }} />
                </div>
                <div className="guided-progress-list">
                  {guidedProgressItems.map((item, index) => (
                    <button key={item.label} type="button" onClick={() => selectWorkspaceTab(item.tab)} className={`guided-progress-item ${item.done ? 'done' : ''}`}>
                      <span className="guided-progress-dot">{item.done ? <IconCheck className="h-3 w-3" /> : index + 1}</span>
                      <span>
                        <strong>{item.label}</strong>
                        <small>{item.hint}</small>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="metric-grid">
                <button type="button" onClick={() => setActiveTab('drafts')} className="metric-card">
                  <div className="metric-icon blue">
                    <IconFolder className="h-5 w-5" />
                  </div>
                  <div className="metric-value">{drafts.length}</div>
                  <div className="metric-label">Bản nháp</div>
                </button>
                <div className="metric-card">
                  <div className="metric-icon green">
                    <IconDownload className="h-5 w-5" />
                  </div>
                  <div className="metric-value">0</div>
                  <div className="metric-label">Lượt xuất</div>
                </div>
                <div className="metric-card">
                  <div className="metric-icon amber">
                    <IconClipboard className="h-5 w-5" />
                  </div>
                  <div className="metric-value">{visibleQualityChecks.filter((c: any) => c.status !== 'pass').length}</div>
                  <div className="metric-label">Cần bổ sung</div>
                </div>
                <div className="metric-card">
                  <div className="metric-icon purple">
                    <IconArchive className="h-5 w-5" />
                  </div>
                  <div className="metric-value">0</div>
                  <div className="metric-label">Tài nguyên</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="dashboard-section">
                <h3 className="section-title">Thao tác nhanh</h3>
                <div className="quick-actions-grid">
                  <button type="button" onClick={() => setActiveTab('compose')} className="quick-action-card">
                    <div className="quick-action-icon">
                      <IconCompose className="h-5 w-5" />
                    </div>
                    <span className="quick-action-label">Tạo từ mẫu</span>
                  </button>
                  <button type="button" onClick={() => setActiveTab('drafts')} className="quick-action-card">
                    <div className="quick-action-icon">
                      <IconFolder className="h-5 w-5" />
                    </div>
                    <span className="quick-action-label">Mở bản nháp</span>
                  </button>
                  <button type="button" onClick={() => setActiveTab('export')} className="quick-action-card">
                    <div className="quick-action-icon">
                      <IconDownload className="h-5 w-5" />
                    </div>
                    <span className="quick-action-label">Xuất Word</span>
                  </button>
                  <button type="button" onClick={runQualityCheck} disabled={busy !== null} className="quick-action-card">
                    <div className="quick-action-icon">
                      <IconCheckCircle className="h-5 w-5" />
                    </div>
                    <span className="quick-action-label">Chạy checklist</span>
                  </button>
                </div>
              </div>

              {/* Recent Drafts */}
              {drafts.length > 0 && (
                <div className="dashboard-section">
                  <div className="section-header">
                    <h3 className="section-title">Bản nháp gần đây</h3>
                    <button type="button" onClick={() => setActiveTab('drafts')} className="section-link">
                      Xem tất cả
                    </button>
                  </div>
                  <div className="recent-drafts-grid">
                    {drafts.slice(0, 4).map((draft) => (
                      <button key={draft.id} type="button" onClick={() => loadDraft(draft)} className="draft-card">
                        <div className="draft-card-icon">
                          <IconFile className="h-5 w-5" />
                        </div>
                        <div className="draft-card-content">
                          <div className="draft-card-title">{draft.title}</div>
                          <div className="draft-card-meta">
                            Lớp {draft.grade} · {draft.subject}
                          </div>
                          <div className="draft-card-footer">
                            <span className={`badge ${draft.storage === 'server_json' ? 'badge-success' : 'badge-neutral'}`}>
                              {storageLabel(draft.storage)}
                            </span>
                            <span className="draft-card-date">
                              {new Date(draft.updatedAt).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========== COMPOSE ========== */}
          {activeTab === 'compose' && (
            <div className="compose-layout">
              {/* Main Form */}
              <div className="compose-main">
                <div className="card">
                  <div className="card-header">
                    <div>
                      <h2 className="card-title">Tạo giáo án mới</h2>
                      <p className="card-subtitle">Chọn lớp, môn và bài học để bắt đầu</p>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="form-help-strip">
                      <IconHelpCircle className="h-5 w-5" />
                      <div>
                        <strong>Gợi ý nhập nhanh:</strong> chọn lớp, môn, bài/chủ đề trước. Nếu dữ liệu chỉ là seed/scaffold, hệ thống chỉ dựng khung để giáo viên tự bổ sung kiến thức.
                      </div>
                    </div>

                    {teacherStarterOptions.length > 0 && (
                      <div className="teacher-starter-panel">
                        <div className="teacher-starter-header">
                          <div>
                            <span className="teacher-starter-kicker">Chọn nhanh</span>
                            <h3>Không bắt giáo viên phải tự gõ từ đầu</h3>
                          </div>
                          <span className="badge badge-neutral">{teacherStarterOptions.length} gợi ý</span>
                        </div>
                        <div className="teacher-starter-grid">
                          {teacherStarterOptions.map((option) => (
                            <button key={option.id} type="button" onClick={() => selectTeacherStarter(option)} className="teacher-starter-card">
                              <strong>{option.label}</strong>
                              <span>{option.note}</span>
                              <em>{option.dataLabel}</em>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lesson Type */}
                    <div className="form-section">
                      <div className="form-section-title">Kiểu bài dạy</div>
                      <div className="lesson-type-grid">
                        {lessonIntentCards.map((intent) => {
                          const isSelected = form.lessonIntent === intent.id;
                          return (
                            <button
                              key={intent.id}
                              type="button"
                              onClick={() => setForm({ ...form, lessonIntent: intent.id })}
                              className={`lesson-type-card ${isSelected ? 'selected' : ''} ${intent.color}`}
                            >
                              <div className="lesson-type-label">{intent.label}</div>
                              <div className="lesson-type-desc">{intent.desc}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Grade & Subject */}
                    <div className="form-section">
                      <div className="form-section-title">Lớp và môn học</div>
                      <div className="form-grid form-grid-2">
                        <div className="form-field">
                          <label className="form-label">Lớp</label>
                          <select value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} className="input">
                            {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((grade) => (
                              <option key={grade} value={grade}>Lớp {grade}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-field">
                          <label className="form-label">Môn học</label>
                          <select
                            value={subjectOptions.includes(form.subject) ? form.subject : '__custom__'}
                            onChange={(e) => setForm({ ...form, subject: e.target.value === '__custom__' ? '' : e.target.value, book: 'Nguồn giáo viên tự nhập', topic: '' })}
                            className="input"
                          >
                            <option value="">-- Chọn môn --</option>
                            {subjectOptions.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
                            <option value="__custom__">Tự nhập...</option>
                          </select>
                        </div>
                      </div>
                      {!subjectOptions.includes(form.subject) && form.subject !== '' && (
                        <input
                          value={form.subject}
                          onChange={(e) => setForm({ ...form, subject: e.target.value })}
                          className="input mt-3"
                          placeholder="Nhập tên môn học"
                        />
                      )}
                    </div>

                    {/* Book & Topic */}
                    <div className="form-section">
                      <div className="form-section-title">Bài học</div>
                      <div className="form-grid form-grid-2">
                        <div className="form-field">
                          <label className="form-label">Bộ sách / nguồn</label>
                          <select
                            value={bookOptions.includes(form.book) ? form.book : '__custom__'}
                            onChange={(e) => setForm({ ...form, book: e.target.value === '__custom__' ? 'Nguồn giáo viên tự nhập' : e.target.value, topic: '' })}
                            className="input"
                          >
                            {bookOptions.map((book) => <option key={book} value={book}>{book}</option>)}
                            <option value="__custom__">Nguồn giáo viên tự nhập</option>
                          </select>
                        </div>
                        <div className="form-field">
                          <label className="form-label">Bài / chủ đề</label>
                          {topicOptions.length > 0 ? (
                            <select
                              value={topicOptions.includes(form.topic) ? form.topic : '__custom__'}
                              onChange={(e) => setForm({ ...form, topic: e.target.value === '__custom__' ? '' : e.target.value })}
                              className="input"
                            >
                              <option value="">-- Chọn bài --</option>
                              {topicOptions.map((topic) => <option key={topic} value={topic}>{topic}</option>)}
                              <option value="__custom__">Tự nhập...</option>
                            </select>
                          ) : (
                            <input
                              value={form.topic}
                              onChange={(e) => setForm({ ...form, topic: e.target.value })}
                              className="input"
                              placeholder="Nhập tên bài / chủ đề"
                            />
                          )}
                        </div>
                      </div>
                      {topicOptions.length > 0 && !topicOptions.includes(form.topic) && form.topic !== '' && (
                        <input
                          value={form.topic}
                          onChange={(e) => setForm({ ...form, topic: e.target.value })}
                          className="input mt-3"
                          placeholder="Nhập tên bài / chủ đề"
                        />
                      )}
                    </div>

                    {/* Template & Duration */}
                    {showStandardPanels && (
                      <div className="form-section">
                        <div className="form-section-title">Mẫu và thời lượng</div>
                        <div className="form-grid form-grid-2">
                          <div className="form-field">
                            <label className="form-label">Mẫu giáo án</label>
                            <select value={form.template} onChange={(e) => setForm({ ...form, template: e.target.value })} className="input">
                              {templateOptions.map((template) => <option key={template} value={template}>{template}</option>)}
                            </select>
                          </div>
                          <div className="form-field">
                            <label className="form-label">Thời lượng</label>
                            <select
                              value={fallbackDurations.includes(form.duration) ? form.duration : '__custom__'}
                              onChange={(e) => setForm({ ...form, duration: e.target.value === '__custom__' ? '' : e.target.value })}
                              className="input"
                            >
                              {fallbackDurations.map((duration) => <option key={duration} value={duration}>{duration}</option>)}
                              <option value="__custom__">Tự nhập...</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="compose-actions">
                      <button onClick={generateLesson} disabled={busy !== null || !form.topic} className="btn btn-primary btn-lg flex-1">
                        {busy === 'generate' ? 'Đang tạo...' : 'Thiết kế bài dạy'}
                      </button>
                      <button onClick={saveDraft} disabled={busy !== null} className="btn btn-secondary btn-lg">
                        {busy === 'save' ? 'Đang lưu...' : 'Lưu nháp'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Inspector (Desktop) */}
              <div className="compose-inspector">
                {/* Data Status */}
                <div className="inspector-section">
                  <div className="inspector-section-header">
                    <h3 className="inspector-section-title">
                      <IconShield className="h-4 w-4" />
                      Trạng thái dữ liệu
                    </h3>
                  </div>
                  <div className="inspector-section-body">
                    <div className={`status-card ${currentDataLabel === 'Đã rà soát' ? 'verified' : currentDataLabel === 'Đã xem lại' ? 'reviewed' : currentDataLabel === 'Bản mẫu thử' ? 'seed' : 'scaffold'}`}>
                      <span className={`badge ${currentDataLabel === 'Đã rà soát' ? 'badge-success' : currentDataLabel === 'Bản mẫu thử' ? 'badge-warning' : 'badge-neutral'}`}>
                        {currentDataLabel}
                      </span>
                      <p className="status-note">
                        {teacherDataNote(selectedTopic || selectedBook || subjectCatalog)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Export */}
                <div className="inspector-section">
                  <div className="inspector-section-header">
                    <h3 className="inspector-section-title">
                      <IconDownload className="h-4 w-4" />
                      Xuất nhanh
                    </h3>
                  </div>
                  <div className="inspector-section-body">
                    <div className="flex gap-2">
                      <button onClick={() => exportLesson('docx')} disabled={busy !== null || !content} className="btn btn-secondary flex-1 btn-sm">
                        DOCX
                      </button>
                      <button onClick={() => exportLesson('pdf')} disabled={busy !== null || !content} className="btn btn-secondary flex-1 btn-sm">
                        PDF
                      </button>
                    </div>
                    {!content && <p className="text-xs text-slate-500 mt-2">Tạo nội dung trước khi xuất.</p>}
                  </div>
                </div>

                {/* Notice */}
                <div className="inspector-section">
                  <div className="inspector-section-body">
                    <div className="alert alert-warning text-xs">
                      Giáo viên cần kiểm tra nội dung trước khi sử dụng chính thức.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========== EDITOR ========== */}
          {activeTab === 'editor' && (
            <div className="editor-layout">
              <div className="editor-main">
                <div className="editor-wrapper">
                  <div className="editor-toolbar">
                    <div className="editor-toolbar-left">
                      <h2 className="editor-title">{form.topic || 'Giáo án chưa đặt tên'}</h2>
                      <span className="editor-meta">
                        {form.subject} lớp {form.grade} · {activeDraftId ? 'Đã lưu' : 'Chưa lưu'}
                      </span>
                    </div>
                    <div className="editor-toolbar-right">
                      <button onClick={runQualityCheck} disabled={busy !== null} className="btn btn-ghost btn-sm">
                        {busy === 'quality' ? '...' : 'Kiểm tra'}
                      </button>
                      <button onClick={saveDraft} disabled={busy !== null} className="btn btn-secondary btn-sm">
                        {busy === 'save' ? '...' : 'Lưu'}
                      </button>
                      <button onClick={() => exportLesson('docx')} disabled={busy !== null || disableExportUntilContent} className="btn btn-primary btn-sm">
                        {busy === 'docx' ? '...' : 'Xuất DOCX'}
                      </button>
                    </div>
                  </div>
                  
                  {!content.trim() ? (
                    <div className="empty-state">
                      <div className="empty-icon">
                        <IconFile className="h-6 w-6" />
                      </div>
                      <h3 className="empty-title">Chưa có nội dung</h3>
                      <p className="empty-desc">Bấm &quot;Thiết kế bài dạy&quot; để tạo khung hoặc nhập trực tiếp.</p>
                      <button type="button" onClick={() => selectWorkspaceTab('compose')} className="btn btn-primary">
                        Quay về Soạn bài
                      </button>
                    </div>
                  ) : (
                    <textarea
                      ref={editorRef}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Nhập nội dung giáo án..."
                      className="editor-textarea"
                    />
                  )}
                </div>
              </div>

              {/* Right Inspector (Desktop) */}
              <div className="editor-inspector">
                {showStandardPanels && (
                  <div className="inspector-section">
                    <div className="inspector-section-header">
                      <h3 className="inspector-section-title">
                        <IconCheckCircle className="h-4 w-4" />
                        Checklist
                      </h3>
                    </div>
                    <div className="inspector-section-body">
                      {visibleQualityChecks.length > 0 ? (
                        <div className="checklist">
                          {visibleQualityChecks.map((check: any) => (
                            <div key={check.id} className="checklist-item">
                              <span className="checklist-label">{check.label}</span>
                              <span className={`badge ${check.status === 'pass' ? 'badge-success' : check.status === 'warning' ? 'badge-warning' : 'badge-danger'}`}>
                                {check.status === 'pass' ? 'OK' : 'Xem'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">Bấm &quot;Kiểm tra&quot; để chạy checklist.</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="inspector-section">
                  <div className="inspector-section-header">
                    <h3 className="inspector-section-title">
                      <IconDownload className="h-4 w-4" />
                      Xuất file
                    </h3>
                  </div>
                  <div className="inspector-section-body space-y-2">
                    <button onClick={() => exportLesson('docx')} disabled={busy !== null || disableExportUntilContent} className="btn btn-primary w-full">
                      {busy === 'docx' ? 'Đang xuất...' : 'Xuất DOCX'}
                    </button>
                    <button onClick={() => exportLesson('pdf')} disabled={busy !== null || disableExportUntilContent} className="btn btn-secondary w-full">
                      {busy === 'pdf' ? 'Đang xuất...' : 'Xuất PDF'}
                    </button>
                  </div>
                </div>

                <div className="inspector-section">
                  <div className="inspector-section-body">
                    <div className={`status-card compact ${currentDataLabel === 'Đã rà soát' ? 'verified' : 'scaffold'}`}>
                      <span className={`badge ${currentDataLabel === 'Đã rà soát' ? 'badge-success' : 'badge-neutral'}`}>
                        {currentDataLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========== DRAFTS ========== */}
          {activeTab === 'drafts' && (
            <div className="drafts-layout">
              <div className="card">
                <div className="card-header">
                  <div>
                    <h2 className="card-title">Bản nháp của tôi</h2>
                    <p className="card-subtitle">{drafts.length} giáo án đã lưu</p>
                  </div>
                  <button type="button" onClick={() => setActiveTab('compose')} className="btn btn-primary btn-sm">
                    <IconPlus className="h-4 w-4" />
                    <span>Tạo mới</span>
                  </button>
                </div>
                <div className="card-body">
                  {drafts.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">
                        <IconFolder className="h-6 w-6" />
                      </div>
                      <h3 className="empty-title">Chưa có bản nháp</h3>
                      <p className="empty-desc">Tạo và lưu bài dạy đầu tiên của bạn.</p>
                      <button type="button" onClick={() => setActiveTab('compose')} className="btn btn-primary">
                        Tạo giáo án mới
                      </button>
                    </div>
                  ) : (
                    <div className="draft-list">
                      {drafts.map((draft) => (
                        <button key={draft.id} type="button" onClick={() => loadDraft(draft)} className="draft-item">
                          <div className="draft-icon">
                            <IconFile className="h-5 w-5" />
                          </div>
                          <div className="draft-content">
                            <div className="draft-title">{draft.title}</div>
                            <div className="draft-meta">
                              <span>Lớp {draft.grade}</span>
                              <span>·</span>
                              <span>{draft.subject}</span>
                              <span>·</span>
                              <span>{new Date(draft.updatedAt).toLocaleDateString('vi-VN')}</span>
                            </div>
                          </div>
                          <div className="draft-status">
                            <span className={`badge ${draft.storage === 'server_json' ? 'badge-success' : 'badge-neutral'}`}>
                              {storageLabel(draft.storage)}
                            </span>
                            <IconChevronRight className="h-4 w-4 text-slate-400" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========== WEEKLY TEACHING WORKSPACE ========== */}
          {activeTab === 'week' && (
            <div className="weekly-layout">
              <div className="page-hero-card">
                <div>
                  <span className="page-hero-kicker">Weekly teaching workspace</span>
                  <h2>Lịch tuần</h2>
                  <p>Chuẩn bị tiết dạy, ghi chú sau tiết, nhân bản bài cũ cho tuần mới. Mục tiêu là giữ giáo viên quay lại hằng tuần, không chỉ tạo giáo án một lần.</p>
                </div>
                <button type="button" onClick={() => handleSourceLevelAction('Lịch tuần', 'thêm bài mới')} className="btn btn-primary btn-sm">
                  <IconPlus className="h-4 w-4" />
                  Thêm bài
                </button>
              </div>

              <div className="weekly-switcher-card">
                <div className="weekly-switcher-actions">
                  <button type="button" onClick={() => setWeekOffset((value) => value - 1)} className="btn btn-secondary btn-sm" aria-label="Tuần trước">‹</button>
                  <strong>Tuần {weekOffset === 0 ? 'này' : weekOffset > 0 ? `+${weekOffset}` : weekOffset}</strong>
                  <button type="button" onClick={() => setWeekOffset((value) => value + 1)} className="btn btn-secondary btn-sm" aria-label="Tuần sau">›</button>
                </div>
                <div className="weekly-switcher-stats">
                  <span className="badge badge-success">{weeklyReadyCount} bài đã chuẩn bị</span>
                  <span className="badge badge-warning">{weeklyTodoCount} bài cần chuẩn bị</span>
                </div>
              </div>

              <div className="preview-banner">
                <IconAlert className="h-4 w-4" />
                <span>Dữ liệu lịch tuần hiện là mẫu từ file kế hoạch; khi nối backend sẽ lưu lịch thật theo tài khoản giáo viên/tổ chuyên môn.</span>
              </div>

              <div className="weekly-grid">
                {weekDays.map((day) => {
                  const lessons = weekLessonSamples.filter((item) => item.day === day);
                  return (
                    <div key={day} className="weekly-day-card">
                      <div className="weekly-day-header">
                        <strong>{day}</strong>
                        <IconCalendar className="h-4 w-4" />
                      </div>
                      {lessons.length === 0 ? (
                        <button type="button" onClick={() => handleSourceLevelAction('Lịch tuần', `thêm tiết ${day}`)} className="weekly-empty-slot">+ Thêm bài</button>
                      ) : (
                        <div className="weekly-lesson-list">
                          {lessons.map((lesson) => (
                            <button key={lesson.id} type="button" onClick={() => startFromWeekLesson(lesson)} className="weekly-lesson-card">
                              <span className="weekly-lesson-meta">Tiết {lesson.period} · {lesson.subject}</span>
                              <strong>{lesson.title}</strong>
                              <span className="weekly-lesson-footer">
                                <span className={`badge ${compactStatusClass(lesson.status)}`}>{compactStatusLabel(lesson.status)}</span>
                                <em>{lesson.ready ? '✓ Đã chuẩn bị' : '● Cần chuẩn bị'} · {compactStatusLabel(lesson.dataStatus)}</em>
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="weekly-side-grid">
                <div className="card">
                  <div className="card-header compact">
                    <h3 className="card-title">Bài cần chuẩn bị</h3>
                    <p className="card-subtitle">Ưu tiên mở soạn giáo án nhanh.</p>
                  </div>
                  <div className="card-body compact-list">
                    {weekLessonSamples.filter((item) => !item.ready).map((lesson) => (
                      <button key={lesson.id} type="button" onClick={() => startFromWeekLesson(lesson)} className="compact-row">
                        <span><strong>{lesson.title}</strong><small>{lesson.day} · Tiết {lesson.period}</small></span>
                        <em>Soạn</em>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="card">
                  <div className="card-header compact">
                    <h3 className="card-title">Nhân bản bài cũ</h3>
                    <p className="card-subtitle">Giữ cấu trúc, chỉnh nội dung theo tuần mới.</p>
                  </div>
                  <div className="card-body compact-list">
                    {['Phép cộng phạm vi 100', 'Đọc hiểu — Bài 4'].map((title) => (
                      <button key={title} type="button" onClick={() => handleSourceLevelAction('Lịch tuần', `nhân bản bài cũ ${title}`)} className="compact-row">
                        <span><strong>{title}</strong><small>Mock từ kế hoạch</small></span>
                        <em>Nhân bản</em>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="card">
                  <div className="card-header compact">
                    <h3 className="card-title">Ghi chú sau tiết</h3>
                    <p className="card-subtitle">Giữ kinh nghiệm dạy thật.</p>
                  </div>
                  <div className="card-body">
                    <textarea className="input min-h-[130px]" placeholder="Học sinh tiếp thu thế nào, cần điều chỉnh gì, học liệu nào cần bổ sung…" />
                    <button type="button" onClick={() => handleSourceLevelAction('Ghi chú sau tiết', 'lưu ghi chú')} className="btn btn-primary btn-sm mt-3">Lưu ghi chú</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========== RESOURCE LIBRARY ========== */}
          {activeTab === 'resources' && (
            <div className="resource-layout">
              <div className="page-hero-card">
                <div>
                  <span className="page-hero-kicker">Học liệu thực dụng</span>
                  <h2>Hoạt động, trò chơi, phiếu học tập, rubric</h2>
                  <p>Port từ file kế hoạch nhưng giữ nguyên guardrail: mỗi tài nguyên có nhãn nguồn, license và trạng thái rà soát; cộng đồng chưa duyệt thì không public.</p>
                </div>
                <button type="button" onClick={() => selectWorkspaceTab('moderation')} className="btn btn-secondary btn-sm">Mở kiểm duyệt</button>
              </div>

              <div className="resource-toolbar">
                <div className="header-search resource-search">
                  <IconSearch className="header-search-icon" />
                  <input value={resourceQuery} onChange={(event) => setResourceQuery(event.target.value)} type="text" placeholder="Tìm học liệu…" className="header-search-input" />
                </div>
                <select className="input compact-select" aria-label="Lọc khối"><option>Tất cả khối</option></select>
                <select className="input compact-select" aria-label="Lọc môn"><option>Tất cả môn</option></select>
                <select className="input compact-select" aria-label="Lọc license"><option>License</option></select>
              </div>

              <div className="resource-tabs">
                {resourceTabs.map((tab, index) => (
                  <button key={tab} type="button" onClick={() => setResourceTab(index)} className={`resource-tab ${resourceTab === index ? 'active' : ''}`}>{tab}</button>
                ))}
              </div>

              <div className="resource-grid">
                {filteredResourceSamples.map((item) => (
                  <article key={item.title} className="resource-card">
                    <div className="resource-card-top">
                      <div className="resource-icon"><IconArchive className="h-5 w-5" /></div>
                      <span className={`badge ${compactStatusClass(item.status)}`}>{compactStatusLabel(item.status)}</span>
                    </div>
                    <h3>{item.title}</h3>
                    <ul>
                      <li>{item.grade} · {item.subject} · {item.duration}</li>
                      <li>Thiết bị: {item.device}</li>
                      <li>Nguồn: {item.sourceName}</li>
                      <li>License: {item.license}</li>
                      <li>Review: {item.reviewState}</li>
                    </ul>
                    <div className="resource-actions">
                      <button type="button" onClick={() => handleResourceAction(item, 'save')}>Lưu</button>
                      <button type="button" onClick={() => handleResourceAction(item, 'insert')} disabled={!item.canInsert}>{item.canInsert ? 'Chèn' : 'Chặn'}</button>
                      <button type="button" onClick={() => handleResourceAction(item, 'report')} className="danger">Báo lỗi</button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* ========== EXPORT ========== */}
          {activeTab === 'export' && (
            <div className="export-layout">
              <div className="export-main">
                <div className="card">
                  <div className="card-header">
                    <div>
                      <h2 className="card-title">Xuất file</h2>
                      <p className="card-subtitle">Tải về DOCX hoặc PDF</p>
                    </div>
                  </div>
                  <div className="card-body">
                    {/* Summary */}
                    <div className="export-summary">
                      <h3 className="export-summary-title">{lessonTitle(form)}</h3>
                      <div className="export-summary-meta">
                        <span className={`badge ${currentDataLabel === 'Đã rà soát' ? 'badge-success' : 'badge-neutral'}`}>
                          {currentDataLabel}
                        </span>
                        {activeDraftId && <span className="badge badge-success">Đã lưu</span>}
                      </div>
                    </div>

                    {/* Warning */}
                    <div className="alert alert-warning mb-6">
                      <IconAlert className="alert-icon" />
                      <span>Kiểm tra nội dung và nguồn trước khi dùng chính thức. Bản xuất không thay thế kiểm tra chuyên môn của giáo viên.</span>
                    </div>
                    {disableExportUntilContent && (
                      <div className="alert alert-info mb-6">
                        <IconHelpCircle className="alert-icon" />
                        <span>Cần tạo hoặc nhập nội dung giáo án trước khi xuất file.</span>
                      </div>
                    )}

                    <div className="quota-strip mb-6">
                      <div>
                        <span>Lưu nháp</span>
                        <strong>{saveLessonQuota ? `${saveLessonQuota.remaining}/${saveLessonQuota.limit}` : 'Demo'}</strong>
                      </div>
                      <div>
                        <span>DOCX tháng này</span>
                        <strong>{exportDocxQuota ? `${exportDocxQuota.remaining}/${exportDocxQuota.limit}` : 'Demo'}</strong>
                      </div>
                      <div>
                        <span>PDF tháng này</span>
                        <strong>{exportPdfQuota ? `${exportPdfQuota.remaining}/${exportPdfQuota.limit}` : 'Demo'}</strong>
                      </div>
                    </div>

                    {/* Export Cards */}
                    <div className="export-cards">
                      <button type="button" onClick={() => exportLesson('docx')} disabled={busy !== null || disableExportUntilContent} className="export-card docx">
                        <div className="export-card-icon">
                          <IconFileText className="h-8 w-8" />
                        </div>
                        <div className="export-card-content">
                          <div className="export-card-title">{busy === 'docx' ? 'Đang xuất...' : 'Xuất DOCX'}</div>
                          <div className="export-card-desc">File Word - Dễ chỉnh sửa, nộp BGH</div>
                        </div>
                        <div className="export-card-badge">Phổ biến</div>
                      </button>
                      <button type="button" onClick={() => exportLesson('pdf')} disabled={busy !== null || disableExportUntilContent} className="export-card pdf">
                        <div className="export-card-icon">
                          <IconFile className="h-8 w-8" />
                        </div>
                        <div className="export-card-content">
                          <div className="export-card-title">{busy === 'pdf' ? 'Đang xuất...' : 'Xuất PDF'}</div>
                          <div className="export-card-desc">File PDF - Giữ nguyên định dạng</div>
                        </div>
                      </button>
                    </div>

                    {/* Save first */}
                    {!activeDraftId && (
                      <button onClick={saveDraft} disabled={busy !== null} className="btn btn-secondary w-full mt-4">
                        {busy === 'save' ? 'Đang lưu...' : 'Lưu bản nháp trước khi xuất'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Export History (Desktop) */}
              <div className="export-inspector">
                <div className="inspector-section">
                  <div className="inspector-section-header">
                    <h3 className="inspector-section-title">Lịch sử xuất</h3>
                  </div>
                  <div className="inspector-section-body">
                    <p className="text-sm text-slate-500">Chưa có lịch sử xuất file.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========== COMMUNITY ========== */}
          {activeTab === 'community' && (
            <div className="max-w-5xl">
              <div className="page-hero-card">
                <div>
                  <span className="page-hero-kicker">Cộng đồng giáo viên</span>
                  <h2>Cộng đồng chia sẻ có kiểm duyệt</h2>
                  <p>Tài nguyên do giáo viên gửi lên không tự public. Mọi bài chia sẻ cần đi qua hàng đợi, nhãn nguồn, license, cảnh báo và audit log.</p>
                </div>
                <button type="button" onClick={() => selectWorkspaceTab('moderation')} className="btn btn-primary btn-sm">Xem hàng đợi</button>
              </div>

              <div className="preview-banner mt-4">
                <IconAlert className="h-4 w-4" />
                <span>Không cho cộng đồng trở thành kho nội dung công khai nếu chưa có moderator và quy trình takedown.</span>
              </div>

              <div className="plan-feature-grid mt-4">
                <button type="button" onClick={() => selectWorkspaceTab('resources')} className="plan-feature-card">
                  <IconArchive className="h-5 w-5" />
                  <strong>Kho học liệu đã gắn nhãn</strong>
                  <span>Hoạt động, trò chơi, phiếu học tập, rubric và câu hỏi có nguồn/license.</span>
                </button>
                <button type="button" onClick={() => selectWorkspaceTab('moderation')} className="plan-feature-card">
                  <IconShield className="h-5 w-5" />
                  <strong>Hàng đợi kiểm duyệt</strong>
                  <span>Duyệt, yêu cầu sửa, từ chối, takedown; chưa có quyền moderator tự đăng ký.</span>
                </button>
                <button type="button" onClick={() => selectWorkspaceTab('team')} className="plan-feature-card">
                  <IconUsers className="h-5 w-5" />
                  <strong>Tổ chuyên môn</strong>
                  <span>Workspace pilot cho nhóm nhỏ: gửi duyệt, nhận góp ý, kho tổ.</span>
                </button>
              </div>
            </div>
          )}

          {/* ========== TEAM ========== */}
          {activeTab === 'team' && (
            <div className="max-w-4xl">
              <div className="card">
                <div className="card-header">
                  <div>
                    <h2 className="card-title">Tổ chuyên môn</h2>
                    <p className="card-subtitle">Phối hợp và chia sẻ với đồng nghiệp</p>
                  </div>
                </div>
                <div className="card-body">
                  <div className="preview-banner">
                    <IconAlert className="h-4 w-4" />
                    <span>Bản xem trước - Sắp triển khai cho tổ chuyên môn.</span>
                  </div>
                  <div className="category-grid">
                    <div className="category-card">
                      <div className="category-icon"><IconCompose className="h-5 w-5" /></div>
                      <div className="category-content">
                        <div className="category-title">Gửi duyệt</div>
                        <div className="category-desc">Gửi giáo án cho tổ trưởng</div>
                      </div>
                    </div>
                    <div className="category-card">
                      <div className="category-icon"><IconMessage className="h-5 w-5" /></div>
                      <div className="category-content">
                        <div className="category-title">Nhận góp ý</div>
                        <div className="category-desc">Xem nhận xét từ đồng nghiệp</div>
                      </div>
                    </div>
                    <div className="category-card">
                      <div className="category-icon"><IconArchive className="h-5 w-5" /></div>
                      <div className="category-content">
                        <div className="category-title">Kho tổ</div>
                        <div className="category-desc">Giáo án chung của tổ</div>
                      </div>
                    </div>
                    <div className="category-card">
                      <div className="category-icon"><IconGrid className="h-5 w-5" /></div>
                      <div className="category-content">
                        <div className="category-title">Dashboard tổ</div>
                        <div className="category-desc">Tổng quan hoạt động</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========== MODERATION QUEUE ========== */}
          {activeTab === 'moderation' && (
            <div className="max-w-5xl">
              <div className="page-hero-card">
                <div>
                  <span className="page-hero-kicker">Moderator workspace</span>
                  <h2>Hàng đợi kiểm duyệt</h2>
                  <p>Duyệt tài nguyên cộng đồng, yêu cầu sửa, từ chối hoặc takedown. Vai trò moderator không do người dùng tự chọn.</p>
                </div>
                <button type="button" onClick={() => selectWorkspaceTab('community')} className="btn btn-secondary btn-sm">Xem cộng đồng</button>
              </div>

              <div className="preview-banner mt-4">
                <IconShield className="h-4 w-4" />
                <span>Mọi thao tác duyệt/takedown phải ghi audit log khi nối backend. Màn hình này là source-level UI bridge từ file kế hoạch.</span>
              </div>

              <div className="moderation-filter-bar">
                {[
                  { id: 'all', label: `Tất cả (${moderationQueueSamples.length})` },
                  { id: 'submitted', label: 'Chờ duyệt' },
                  { id: 'needs_revision', label: 'Cần sửa' }
                ].map((item) => (
                  <button key={item.id} type="button" onClick={() => setModerationFilter(item.id as 'all' | 'submitted' | 'needs_revision')} className={moderationFilter === item.id ? 'active' : ''}>{item.label}</button>
                ))}
              </div>

              <div className="moderation-list">
                {filteredModerationQueue.map((item) => {
                  const isOpen = moderationOpenId === item.id;
                  const riskClass = item.risk === 'cao' ? 'danger' : item.risk === 'trung bình' ? 'warning' : 'neutral';
                  return (
                    <div key={item.id} className="moderation-item">
                      <button type="button" onClick={() => setModerationOpenId(isOpen ? null : item.id)} className="moderation-item-head">
                        <span>
                          <strong>{item.title}</strong>
                          <small>{item.author} · gửi {item.submittedAt}</small>
                        </span>
                        <span className="moderation-item-badges">
                          <span className={`badge ${compactStatusClass(item.status)}`}>{compactStatusLabel(item.status)}</span>
                          <span className={`risk-pill ${riskClass}`}>Rủi ro: {item.risk}</span>
                        </span>
                      </button>
                      {isOpen && (
                        <div className="moderation-item-body">
                          <div className="moderation-preview">Xem trước nội dung tài nguyên. Nội dung thật sẽ chỉ public sau khi đủ nguồn, license, reviewer và không chứa dữ liệu học sinh.<br />License: {item.licenseStatus} · Dữ liệu học sinh: {item.studentDataRisk} · Audit log: {item.auditRequired ? 'bắt buộc' : 'chưa rõ'}</div>
                          <div className="moderation-actions">
                            <button type="button" onClick={() => handleModerationAction(item, 'Duyệt cộng đồng')} className="btn btn-primary btn-sm">Duyệt cộng đồng</button>
                            <button type="button" onClick={() => handleModerationAction(item, 'Yêu cầu sửa')} className="btn btn-secondary btn-sm">Yêu cầu sửa</button>
                            <button type="button" onClick={() => handleModerationAction(item, 'Từ chối')} className="btn btn-secondary btn-sm">Từ chối</button>
                            <button type="button" onClick={() => handleModerationAction(item, 'Takedown')} className="btn btn-danger btn-sm">Takedown</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========== LEGAL GATE ========== */}
          {activeTab === 'legal' && (
            <div className="max-w-4xl">
              <div className="page-hero-card danger">
                <div>
                  <span className="page-hero-kicker">Legal Gate</span>
                  <h2>Checklist pháp lý trước khi mở tính năng rủi ro</h2>
                  <p>Các mục critical bị khóa tới khi có rà soát pháp lý/bảo mật. Không tuyên bố “chuẩn Bộ”, “verified” hoặc “production-ready” nếu chưa có bằng chứng.</p>
                </div>
                <button type="button" onClick={() => selectWorkspaceTab('release')} className="btn btn-secondary btn-sm">Xem Release Gate</button>
              </div>
              <div className="gate-list">
                {legalGateItems.map((item) => (
                  <div key={item.label} className="gate-row">
                    <span className={`gate-dot ${item.status}`} />
                    <strong>{item.label}</strong>
                    <span className="gate-row-note">Cần policy/evidence trước public hoặc thu tiền</span>
                    <span className={`badge ${compactStatusClass(item.status)}`}>{compactStatusLabel(item.status)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========== RELEASE GATE ========== */}
          {activeTab === 'release' && (
            <div className="max-w-4xl">
              <div className="page-hero-card danger">
                <div>
                  <span className="page-hero-kicker">Release Gate</span>
                  <h2>Public rollout hiện vẫn bị chặn</h2>
                  <p>Muốn mở công khai cần hosted proof, visual smoke, runtime smoke, legal gate, community moderation và export readiness. Màn hình này đọc API readiness nếu có, không dùng số tĩnh để claim.</p>
                  <p><strong>{rolloutReadinessText}</strong></p>
                </div>
                <span className={`badge ${rolloutBoard?.publicRolloutAllowed ? 'badge-success' : 'badge-danger'}`}>{rolloutBoard?.publicRolloutAllowed ? 'READY' : 'BLOCKED'}</span>
              </div>
              <div className="gate-list">
                {dynamicReleaseGateChecks.map((item) => (
                  <div key={item.label} className="gate-row">
                    <span className={`gate-dot ${item.status}`} />
                    <strong>{item.label}</strong>
                    {item.note && <span className="gate-row-note">{item.note}</span>}
                    <span className={`badge ${compactStatusClass(item.status)}`}>{compactStatusLabel(item.status)}</span>
                  </div>
                ))}
              </div>
              <div className="preview-banner mt-4">
                <IconAlert className="h-4 w-4" />
                <span>Không thêm AI/API AI, không thêm thanh toán, không nâng dữ liệu seed/scaffold thành verified trong batch này.</span>
              </div>
            </div>
          )}

          {/* ========== FEEDBACK ========== */}
          {activeTab === 'feedback' && (
            <div className="max-w-2xl">
              <div className="card">
                <div className="card-header">
                  <div>
                    <h2 className="card-title">Gửi góp ý</h2>
                    <p className="card-subtitle">Báo lỗi hoặc đề xuất cải tiến</p>
                  </div>
                </div>
                <div className="card-body space-y-4">
                  <div className="form-grid form-grid-2">
                    <div className="form-field">
                      <label className="form-label">Tên người góp ý</label>
                      <input
                        value={feedbackForm.testerName}
                        onChange={(e) => setFeedbackForm((prev) => ({ ...prev, testerName: e.target.value }))}
                        className="input"
                        placeholder="Ví dụ: Cô A / Thầy B"
                      />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Loại góp ý</label>
                      <select
                        value={feedbackForm.issueCategory}
                        onChange={(e) => setFeedbackForm((prev) => ({ ...prev, issueCategory: e.target.value }))}
                        className="input"
                      >
                        <option value="general_feedback">Góp ý chung</option>
                        <option value="cannot_open_demo">Không mở được</option>
                        <option value="cannot_create_lesson">Không tạo được</option>
                        <option value="cannot_save">Không lưu được</option>
                        <option value="cannot_export_docx_pdf">Không xuất được</option>
                        <option value="mobile_ui_problem">Lỗi trên điện thoại</option>
                        <option value="academic_or_source_confusion">Hiểu nhầm dữ liệu</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-field">
                    <label className="form-label">Tiêu đề</label>
                    <input
                      value={feedbackForm.title}
                      onChange={(e) => setFeedbackForm((prev) => ({ ...prev, title: e.target.value }))}
                      className="input"
                      placeholder="Tóm tắt ngắn gọn"
                    />
                  </div>

                  <div className="form-field">
                    <label className="form-label">Mô tả chi tiết</label>
                    <textarea
                      value={feedbackForm.description}
                      onChange={(e) => setFeedbackForm((prev) => ({ ...prev, description: e.target.value }))}
                      className="input"
                      style={{ minHeight: '120px' }}
                      placeholder="Ghi các bước đã làm và kết quả thấy được..."
                    />
                  </div>

                  <label className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={feedbackForm.hasStudentPersonalData}
                      onChange={(e) => setFeedbackForm((prev) => ({ ...prev, hasStudentPersonalData: e.target.checked }))}
                      className="mt-0.5"
                    />
                    <span>Góp ý này có chứa thông tin cá nhân học sinh (cần xóa trước khi gửi)</span>
                  </label>

                  <button
                    onClick={submitDemoFeedback}
                    disabled={feedbackSubmitting || !feedbackForm.title || !feedbackForm.description || feedbackForm.hasStudentPersonalData}
                    className="btn btn-primary btn-lg w-full"
                  >
                    {feedbackSubmitting ? 'Đang gửi...' : 'Gửi góp ý'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========== SETTINGS ========== */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl space-y-6">
              {/* Account */}
              <div className="card">
                <div className="card-header">
                  <div>
                    <h2 className="card-title">Tài khoản giáo viên</h2>
                    <p className="card-subtitle">Đăng nhập để lưu và xuất an toàn</p>
                  </div>
                </div>
                <div className="card-body space-y-4">
                  <div id="account-gate" className="account-card">
                    <div className="account-avatar">
                      <IconUser className="h-5 w-5" />
                    </div>
                    <div className="account-info">
                      <div className="account-name">{currentUser?.name || 'Khách'}</div>
                      <div className="account-role">{realAccount ? roleLabel(currentUser?.role) : 'Chưa đăng nhập'}</div>
                    </div>
                    <span className={`badge ${realAccount ? 'badge-success' : 'badge-warning'}`}>
                      {accountLabel}
                    </span>
                  </div>
                  {!realAccount && (
                    <div className="alert alert-warning">
                      <IconAlert className="alert-icon" />
                      <span>Phiên này chỉ để xem thử. Cần đăng ký/đăng nhập email để lưu bản nháp lên demo hoặc xuất file.</span>
                    </div>
                  )}

                  {currentUser && (
                    <button type="button" onClick={logout} disabled={authBusy} className="btn btn-secondary w-full">
                      {authBusy ? 'Đang xử lý...' : 'Đăng xuất'}
                    </button>
                  )}

                  {!realAccount && (
                    <div className="space-y-4 pt-2">
                      <div className="auth-tabs">
                        <button
                          type="button"
                          onClick={() => setAuthForm((prev) => ({ ...prev, mode: 'login' }))}
                          className={`auth-tab ${authForm.mode === 'login' ? 'active' : ''}`}
                        >
                          Đăng nhập
                        </button>
                        <button
                          type="button"
                          onClick={() => setAuthForm((prev) => ({ ...prev, mode: 'register' }))}
                          className={`auth-tab ${authForm.mode === 'register' ? 'active' : ''}`}
                        >
                          Đăng ký
                        </button>
                      </div>

                      {authForm.mode === 'register' && (
                        <div className="form-grid form-grid-2">
                          <input
                            value={authForm.name}
                            onChange={(e) => setAuthForm((prev) => ({ ...prev, name: e.target.value }))}
                            className="input"
                            placeholder="Tên giáo viên"
                          />
                          <input
                            value={authForm.schoolName}
                            onChange={(e) => setAuthForm((prev) => ({ ...prev, schoolName: e.target.value }))}
                            className="input"
                            placeholder="Trường (không bắt buộc)"
                          />
                        </div>
                      )}

                      <input
                        value={authForm.email}
                        onChange={(e) => setAuthForm((prev) => ({ ...prev, email: e.target.value }))}
                        className="input"
                        placeholder="Email"
                        type="email"
                        autoComplete="email"
                      />
                      <input
                        value={authForm.password}
                        onChange={(e) => setAuthForm((prev) => ({ ...prev, password: e.target.value }))}
                        className="input"
                        placeholder="Mật khẩu (tối thiểu 8 ký tự)"
                        type="password"
                        autoComplete={authForm.mode === 'register' ? 'new-password' : 'current-password'}
                      />
                      <input
                        value={authForm.inviteCode}
                        onChange={(e) => setAuthForm((prev) => ({ ...prev, inviteCode: e.target.value }))}
                        className="input"
                        placeholder="Mã mời tổ/trường nếu có"
                      />
                      <p className="text-xs leading-5 text-slate-500">Không cho tự chọn admin/tổ trưởng khi đăng ký. Quyền cao hơn chỉ cấp bằng mã mời hoặc admin/reviewer đã duyệt.</p>

                      <button
                        type="button"
                        onClick={submitAuth}
                        disabled={authBusy || !authForm.email || !authForm.password || (authForm.mode === 'register' && !authForm.name)}
                        className="btn btn-primary btn-lg w-full"
                      >
                        {authBusy ? 'Đang xử lý...' : authForm.mode === 'register' ? 'Tạo tài khoản' : 'Đăng nhập'}
                      </button>

                      {authNotice && (
                        <div className="alert alert-info">
                          <IconAlert className="alert-icon" />
                          <span>{authNotice}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Display Mode */}
              <div className="card">
                <div className="card-header">
                  <div>
                    <h2 className="card-title">Chế độ hiển thị</h2>
                    <p className="card-subtitle">Điều chỉnh giao diện theo nhu cầu</p>
                  </div>
                </div>
                <div className="card-body space-y-4">
                  <select
                    value={form.designMode}
                    onChange={(e) => setForm({ ...form, designMode: e.target.value })}
                    className="input"
                  >
                    <option value="easy">Dễ dùng - Chỉ hiện cơ bản</option>
                    <option value="standard">Tiêu chuẩn - Có checklist chất lượng</option>
                    <option value="advanced">Nâng cao - Xem kiểm định</option>
                  </select>
                  <p className="text-sm text-slate-500">
                    {form.designMode === 'easy' && 'Ẩn panel kỹ thuật, chỉ hiện chức năng cơ bản.'}
                    {form.designMode === 'standard' && 'Hiện checklist và trạng thái dữ liệu.'}
                    {form.designMode === 'advanced' && 'Hiện đầy đủ thông tin kiểm định.'}
                  </p>
                </div>
              </div>

              {/* Class Settings */}
              {showStandardPanels && (
                <div className="card">
                  <div className="card-header">
                    <div>
                      <h2 className="card-title">Bối cảnh lớp học</h2>
                      <p className="card-subtitle">Cài đặt mặc định cho giáo án</p>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="form-grid form-grid-2">
                      <div className="form-field">
                        <label className="form-label">Sĩ số</label>
                        <select
                          value={form.classSize}
                          onChange={(e) => setForm({ ...form, classSize: e.target.value })}
                          className="input"
                        >
                          <option value="small">Ít học sinh</option>
                          <option value="standard">Tiêu chuẩn</option>
                          <option value="large">Lớp đông</option>
                        </select>
                      </div>
                      <div className="form-field">
                        <label className="form-label">Thiết bị</label>
                        <select
                          value={form.deviceAccess}
                          onChange={(e) => setForm({ ...form, deviceAccess: e.target.value })}
                          className="input"
                        >
                          <option value="none">Không có</option>
                          <option value="teacher_only">Chỉ giáo viên</option>
                          <option value="shared_devices">Dùng chung</option>
                          <option value="one_to_one">Mỗi HS có</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========== DEBUG ========== */}
          {activeTab === 'debug' && showTechnicalPanels && (
            <div className="max-w-4xl space-y-6">
              <div className="card">
                <div className="card-header">
                  <div>
                    <h2 className="card-title">Kiểm định hệ thống</h2>
                    <p className="card-subtitle">Thông tin kỹ thuật</p>
                  </div>
                </div>
                <div className="card-body space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <StatusCard label="Health" value={state.health?.ok ? 'OK' : 'Kiểm tra'} />
                    <StatusCard label="Storage" value={state.health?.dataMode || 'Demo'} />
                    <StatusCard label="Readiness" value={state.readiness?.board?.status || 'Đang kiểm tra'} />
                    <StatusCard label="Basic flow" value={state.basicFlow?.board?.status || 'Đang kiểm tra'} />
                  </div>
                  <details className="rounded-xl bg-slate-100 p-4 text-sm">
                    <summary className="cursor-pointer font-semibold text-slate-800">Xem JSON</summary>
                    <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-xs text-slate-600">
                      {JSON.stringify({
                        readiness: state.readiness?.board,
                        basicFlow: state.basicFlow?.board,
                        productFoundation: state.productFoundation?.board?.summary,
                        subjectData: state.subjectData?.subjectDataSummary,
                        breakthrough: breakthroughReport,
                        academicCoverage: academicReport,
                        runtimeDeployClosure: runtimeDeployBoard,
                        runtimeHostedClosure: runtimeHostedBoard,
                        teacherPilotCompletion: teacherPilotCompletionBoard,
                        publicRolloutReadiness: rolloutBoard,
                        qualityChecklist: qualitySummary
                      }, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========== MOBILE BOTTOM NAV ========== */}
      <nav className="bottom-nav">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || (item.id === 'settings' && ['settings', 'feedback', 'resources', 'community', 'team', 'moderation', 'legal', 'release', 'dashboard', 'debug'].includes(activeTab));
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => item.id === 'settings' ? setMobileMenuOpen(!mobileMenuOpen) : selectWorkspaceTab(item.id)}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="bottom-nav-icon">
                <Icon />
              </div>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/* ========================================
   SUB-COMPONENTS
   ======================================== */

function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 font-semibold text-slate-900">{value}</div>
    </div>
  );
}
