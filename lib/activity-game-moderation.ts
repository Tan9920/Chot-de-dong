import fs from 'fs';
import path from 'path';

const CONTRIBUTIONS_FILE = path.join(process.cwd(), 'data/activity-game-contributions.json');
const SEED_FILE = path.join(process.cwd(), 'data/activity-game-library.json');

type Severity = 'info' | 'warning' | 'blocker';

function ensureFile() {
  if (!fs.existsSync(CONTRIBUTIONS_FILE)) fs.writeFileSync(CONTRIBUTIONS_FILE, '[]\n');
}

function readItems() {
  ensureFile();
  try {
    const parsed = JSON.parse(fs.readFileSync(CONTRIBUTIONS_FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeItems(items: any[]) {
  ensureFile();
  fs.writeFileSync(CONTRIBUTIONS_FILE, JSON.stringify(items, null, 2) + '\n');
}

function readSeedItems() {
  try {
    const parsed = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function nowIso() { return new Date().toISOString(); }
function text(value: any) { return String(value || '').trim(); }
function makeId() { return `game-contrib-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function issue(id: string, severity: Severity, message: string) { return { id, severity, message }; }

function assessActivityGameReadiness(item: any = {}) {
  const issues: Array<{ id: string; severity: Severity; message: string }> = [];
  const sourceStatus = item.sourceStatus || 'community';
  const supportLevel = item.supportLevel || 'starter';
  const moderationStatus = item.moderationStatus || item.status || 'submitted';
  const hasSource = Boolean(text(item.sourceUrl) || text(item.attribution));
  const hasLicense = Boolean(text(item.license));
  const hasReview = ['reviewed', 'verified', 'approved_for_release'].includes(sourceStatus) || ['approved_community', 'verified_official'].includes(moderationStatus);

  if (!text(item.title)) issues.push(issue('missing_title', 'blocker', 'Thiếu tiêu đề hoạt động/trò chơi.'));
  if (!text(item.grade)) issues.push(issue('missing_grade', 'blocker', 'Thiếu lớp/khối áp dụng.'));
  if (!text(item.subject)) issues.push(issue('missing_subject', 'warning', 'Thiếu môn/lĩnh vực.'));
  if (!text(item.topic)) issues.push(issue('missing_topic', 'warning', 'Thiếu bài/chủ đề.'));
  if (!Array.isArray(item.steps) || item.steps.length < 2) issues.push(issue('weak_steps', 'warning', 'Cần ít nhất 2 bước tổ chức thực hiện rõ ràng.'));
  if (!Array.isArray(item.studentProducts) || item.studentProducts.length < 1) issues.push(issue('missing_student_product', 'warning', 'Thiếu sản phẩm học sinh/minh chứng.'));
  if (!Array.isArray(item.assessmentEvidence) || item.assessmentEvidence.length < 1) issues.push(issue('missing_assessment_evidence', 'warning', 'Thiếu minh chứng đánh giá.'));
  if (!hasSource) issues.push(issue('missing_source_or_attribution', 'blocker', 'Thiếu nguồn hoặc attribution; không được public rộng.'));
  if (!hasLicense) issues.push(issue('missing_license', 'blocker', 'Thiếu license/quyền sử dụng; không được public rộng.'));
  if (item.copyrightRisk === 'unknown' || !item.copyrightRisk) issues.push(issue('unknown_copyright_risk', 'warning', 'Chưa đánh giá rủi ro bản quyền.'));
  if (!hasReview) issues.push(issue('not_reviewed', 'warning', 'Chưa qua review đủ để coi là nguồn tin cậy.'));

  const blockers = issues.filter((x) => x.severity === 'blocker').length;
  const warnings = issues.filter((x) => x.severity === 'warning').length;
  const officialExportAllowed = blockers === 0 && warnings <= 1 && ['verified', 'approved_for_release'].includes(sourceStatus);
  return {
    sourceStatus,
    supportLevel,
    moderationStatus,
    issues,
    summary: { blockers, warnings, total: issues.length },
    safeSkeletonOnly: blockers > 0 || !officialExportAllowed,
    communityVisibleAllowed: blockers === 0 && ['approved_community', 'verified_official'].includes(moderationStatus),
    officialExportAllowed,
    note: 'Activity/Game readiness là rule-based; không thay thế review chuyên môn/pháp lý.'
  };
}

function normalizeContribution(input: any = {}, user: any = {}) {
  const createdAt = nowIso();
  return {
    id: input.id || makeId(),
    title: text(input.title),
    kind: text(input.kind || 'teaching_activity'),
    grade: text(input.grade),
    level: text(input.level),
    subject: text(input.subject),
    book: text(input.book || 'Dùng chung'),
    topic: text(input.topic),
    phase: text(input.phase || 'khoiDong'),
    timeMinutes: Number(input.timeMinutes || 10),
    classSize: text(input.classSize || 'standard'),
    space: text(input.space || 'regular_room'),
    deviceRequirement: text(input.deviceRequirement || 'minimal'),
    noiseLevel: text(input.noiseLevel || 'moderate'),
    learnerLevel: text(input.learnerLevel || 'standard'),
    objectives: Array.isArray(input.objectives) ? input.objectives : [],
    studentProducts: Array.isArray(input.studentProducts) ? input.studentProducts : [],
    assessmentEvidence: Array.isArray(input.assessmentEvidence) ? input.assessmentEvidence : [],
    steps: Array.isArray(input.steps) ? input.steps : [],
    teacherPreparation: Array.isArray(input.teacherPreparation) ? input.teacherPreparation : [],
    safetyNotes: Array.isArray(input.safetyNotes) ? input.safetyNotes : [],
    differentiationNotes: Array.isArray(input.differentiationNotes) ? input.differentiationNotes : [],
    sourceStatus: input.sourceStatus || 'community',
    supportLevel: input.supportLevel || 'starter',
    releaseTier: input.releaseTier || 'internal_preview',
    reviewStatus: 'submitted',
    moderationStatus: 'submitted',
    visibility: 'review_queue',
    copyrightRisk: input.copyrightRisk || 'unknown',
    sourceUrl: text(input.sourceUrl),
    license: text(input.license),
    attribution: text(input.attribution),
    authorId: user.id || user.email || 'anonymous-demo-user',
    authorName: user.name || input.authorName || 'Người đóng góp',
    createdAt,
    updatedAt: createdAt,
    reviewLog: []
  };
}

export async function createActivityGameContribution(input: any = {}, user: any = {}) {
  const item = normalizeContribution(input, user);
  const readiness = assessActivityGameReadiness(item);
  const items = readItems();
  writeItems([item, ...items]);
  return { item, readiness, decision: 'submitted_for_review', policy: { publicRequiresModeration: true, sourceLicenseRequired: true, noAiGeneratedDeepContent: true } };
}

export async function listActivityGameModerationBoard(query: any = {}) {
  const includeSeed = query.includeSeed !== false;
  const contributions = readItems();
  const seedItems = includeSeed ? readSeedItems().map((item: any) => ({ ...item, origin: 'seed_library', readiness: assessActivityGameReadiness(item) })) : [];
  const communityItems = contributions.map((item: any) => ({ ...item, origin: 'community_contribution', readiness: assessActivityGameReadiness(item) }));
  const items = [...communityItems, ...seedItems];
  return {
    items,
    summary: {
      total: items.length,
      pending: items.filter((item: any) => ['submitted', 'pending_review'].includes(item.moderationStatus || item.status)).length,
      approved: items.filter((item: any) => ['approved_community', 'verified_official'].includes(item.moderationStatus || item.status)).length,
      rejected: items.filter((item: any) => ['rejected', 'taken_down'].includes(item.moderationStatus || item.status)).length,
      blockedFromPublic: items.filter((item: any) => item.readiness?.summary?.blockers > 0).length
    },
    policy: { publicRequiresModeration: true, sourceLicenseRequired: true, noCashRewardEarly: true, seedDoesNotMeanVerified: true }
  };
}

export async function reviewActivityGameContribution(id: string, input: any = {}, user: any = {}) {
  const items = readItems();
  const existing = items.find((item: any) => item.id === id);
  if (!existing) throw new Error('Không tìm thấy activity/game contribution trong queue.');
  const action = input.action || input.decision || 'needs_revision';
  const next = { ...existing, updatedAt: nowIso() };
  const preReadiness = assessActivityGameReadiness(next);
  const wantsApprove = ['approve', 'approved_community', 'verified_official'].includes(action);
  const blockedFromPublic = wantsApprove && preReadiness.summary.blockers > 0;

  if (action === 'reject' || action === 'rejected') {
    next.moderationStatus = 'rejected';
    next.visibility = 'private';
    next.reviewStatus = 'rejected';
  } else if (blockedFromPublic || action === 'needs_revision') {
    next.moderationStatus = 'needs_revision';
    next.visibility = 'private';
    next.reviewStatus = 'needs_revision';
  } else if (action === 'verified_official') {
    next.moderationStatus = 'verified_official';
    next.visibility = 'public';
    next.reviewStatus = 'verified';
    next.sourceStatus = ['verified', 'approved_for_release'].includes(next.sourceStatus) ? next.sourceStatus : 'verified';
    next.supportLevel = ['foundation', 'operational'].includes(next.supportLevel) ? next.supportLevel : 'foundation';
  } else if (wantsApprove) {
    next.moderationStatus = 'approved_community';
    next.visibility = 'limited';
    next.reviewStatus = 'reviewed';
    next.sourceStatus = ['reviewed', 'verified', 'approved_for_release'].includes(next.sourceStatus) ? next.sourceStatus : 'reviewed';
  } else {
    next.moderationStatus = 'needs_revision';
    next.visibility = 'private';
    next.reviewStatus = 'needs_revision';
  }

  next.reviewLog = [
    ...(Array.isArray(existing.reviewLog) ? existing.reviewLog : []),
    { reviewerId: user.id || user.email || 'demo-reviewer', reviewerName: user.name || 'Reviewer', action, note: text(input.note), at: nowIso(), blockedFromPublic }
  ];
  const readiness = assessActivityGameReadiness(next);
  writeItems(items.map((item: any) => item.id === id ? next : item));
  return { item: next, readiness, decision: action, blockedFromPublic, policy: { sourceLicenseRequiredBeforePublic: true, noFakeVerifiedUpgrade: true } };
}
