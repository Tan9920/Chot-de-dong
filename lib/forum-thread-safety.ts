import fs from 'fs';
import path from 'path';

const THREADS_FILE = path.join(process.cwd(), 'data/forum-threads.json');

type Severity = 'info' | 'warning' | 'blocker';
function nowIso() { return new Date().toISOString(); }
function text(value: any) { return String(value || '').trim(); }
function makeId() { return `thread-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function issue(id: string, severity: Severity, message: string) { return { id, severity, message }; }
function ensureFile() { if (!fs.existsSync(THREADS_FILE)) fs.writeFileSync(THREADS_FILE, '[]\n'); }
function readThreads() { ensureFile(); try { const parsed = JSON.parse(fs.readFileSync(THREADS_FILE, 'utf8')); return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
function writeThreads(items: any[]) { ensureFile(); fs.writeFileSync(THREADS_FILE, JSON.stringify(items, null, 2) + '\n'); }

function assessThreadSafety(thread: any = {}) {
  const issues: Array<{ id: string; severity: Severity; message: string }> = [];
  const title = text(thread.title);
  const body = text(thread.body || thread.content || thread.question);
  const combined = `${title}\n${body}`;
  if (!title) issues.push(issue('missing_title', 'blocker', 'Thiếu tiêu đề thread.'));
  if (body.length < 12) issues.push(issue('body_too_short', 'warning', 'Nội dung quá ngắn, dễ thành spam/khó hỗ trợ.'));
  if (/\b(zalo|telegram|casino|cá cược|mua bán|chuyển khoản|thu nhập thụ động)\b/i.test(combined)) issues.push(issue('spam_or_commercial_risk', 'blocker', 'Có dấu hiệu spam/quảng cáo/thu tiền.'));
  if (/(số điện thoại|cccd|địa chỉ nhà|ảnh học sinh|danh sách học sinh)/i.test(combined)) issues.push(issue('personal_data_risk', 'blocker', 'Có nguy cơ lộ dữ liệu cá nhân học sinh/giáo viên.'));
  if (/(chuẩn bộ|đúng 100%|không cần sửa|ai tạo giáo án chuẩn)/i.test(combined)) issues.push(issue('overclaim_risk', 'blocker', 'Có claim quá mức hoặc định vị sai.'));
  if ((thread.reportCount || 0) > 0 || Array.isArray(thread.reports) && thread.reports.length > 0) issues.push(issue('reported_thread', 'warning', 'Thread đã bị report, cần moderator triage.'));
  const blockers = issues.filter((x) => x.severity === 'blocker').length;
  const warnings = issues.filter((x) => x.severity === 'warning').length;
  return { issues, summary: { blockers, warnings, total: issues.length }, canPublic: blockers === 0 && ['approved', 'visible'].includes(thread.status), noAiAutoAnswer: true };
}

function normalizeThread(input: any = {}, user: any = {}) {
  const createdAt = nowIso();
  const thread = {
    id: input.id || makeId(),
    title: text(input.title || input.question),
    body: text(input.body || input.content || input.question),
    grade: text(input.grade),
    subject: text(input.subject),
    topic: text(input.topic),
    status: 'pending_review',
    visibility: 'review_queue',
    trustGate: user.role === 'admin' || user.role === 'leader' ? 'trusted_reviewer_user' : 'new_or_teacher_user_hold',
    authorId: user.id || user.email || 'anonymous-demo-user',
    authorName: user.name || 'Người dùng',
    reports: [],
    replies: [],
    createdAt,
    updatedAt: createdAt,
    reviewLog: []
  };
  const readiness = assessThreadSafety(thread);
  if (readiness.summary.blockers > 0) thread.visibility = 'private';
  return thread;
}

export async function listVisibleForumThreads(_query: any = {}) {
  return readThreads().filter((thread: any) => thread.visibility === 'public' && ['visible', 'approved'].includes(thread.status));
}

export async function createForumThread(input: any = {}, user: any = {}) {
  const thread = normalizeThread(input, user);
  const readiness = assessThreadSafety(thread);
  const threads = readThreads();
  writeThreads([thread, ...threads]);
  return { thread, readiness, policy: { moderationRequired: true, reportCanHoldPublic: true, noAiAutoAnswer: true } };
}

export function buildForumThreadSafetyBoard(query: any = {}) {
  const threads = readThreads();
  const includeHidden = Boolean(query.admin);
  const items = threads
    .filter((thread: any) => includeHidden || thread.visibility === 'public')
    .map((thread: any) => ({ thread, readiness: assessThreadSafety(thread) }));
  return {
    items,
    summary: {
      total: items.length,
      totalThreads: threads.length,
      moderationQueue: threads.filter((t: any) => ['pending_review', 'needs_revision'].includes(t.status)).length,
      openReports: threads.reduce((sum: number, t: any) => sum + (Array.isArray(t.reports) ? t.reports.filter((r: any) => r.status !== 'resolved').length : 0), 0),
      publicVisible: threads.filter((t: any) => t.visibility === 'public').length,
      blocked: items.filter((item: any) => item.readiness.summary.blockers > 0).length
    },
    policy: { moderationRequired: true, noAiAutoAnswer: true, personalDataHold: true, reportTriageRequired: true },
    warnings: items.flatMap((item: any) => item.readiness.issues.filter((x: any) => x.severity !== 'info').map((x: any) => ({ threadId: item.thread.id, ...x }))).slice(0, 20)
  };
}

export async function reportForumThread(id: string, input: any = {}, user: any = {}) {
  const threads = readThreads();
  const existing = threads.find((t: any) => t.id === id);
  if (!existing) throw new Error('Không tìm thấy thread cần report.');
  const report = { id: `report-${Date.now()}`, reason: text(input.reason || input.type || 'user_report'), details: text(input.details || input.note), reporterId: user.id || user.email || 'anonymous-demo-user', status: 'open', createdAt: nowIso() };
  const thread = { ...existing, reports: [...(Array.isArray(existing.reports) ? existing.reports : []), report], status: 'reported_hold', visibility: 'private', updatedAt: nowIso() };
  writeThreads(threads.map((t: any) => t.id === id ? thread : t));
  return { id, thread, report, readiness: assessThreadSafety(thread), status: 'reported' };
}

export async function reviewForumThread(id: string, input: any = {}, user: any = {}) {
  const threads = readThreads();
  const existing = threads.find((t: any) => t.id === id);
  if (!existing) throw new Error('Không tìm thấy thread cần review.');
  const action = input.action || input.decision || 'needs_revision';
  const base = { ...existing, updatedAt: nowIso() };
  const readinessBefore = assessThreadSafety(base);
  let status = 'needs_revision';
  let visibility = 'private';
  if (['approve', 'approved', 'visible'].includes(action) && readinessBefore.summary.blockers === 0) {
    status = 'visible'; visibility = 'public';
  } else if (['reject', 'rejected', 'hide'].includes(action)) {
    status = 'hidden'; visibility = 'private';
  }
  const thread = {
    ...base,
    status,
    visibility,
    reviewLog: [...(Array.isArray(base.reviewLog) ? base.reviewLog : []), { reviewerId: user.id || user.email || 'demo-reviewer', reviewerName: user.name || 'Reviewer', action, note: text(input.note), at: nowIso(), blockedFromPublic: action === 'approve' && readinessBefore.summary.blockers > 0 }]
  };
  const readiness = assessThreadSafety(thread);
  writeThreads(threads.map((t: any) => t.id === id ? thread : t));
  return { thread, readiness, decision: action, blockedFromPublic: action === 'approve' && readinessBefore.summary.blockers > 0 };
}
