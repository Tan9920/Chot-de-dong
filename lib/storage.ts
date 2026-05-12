import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { demoSettings, demoUser, nowIso } from './demo-data';
import type { SavedLessonPlan, SchoolSettings, SessionUser } from './types';

type LessonSaveContext = Partial<SessionUser> & {
  actorName?: string;
  actorRole?: string;
  changeSummary?: string;
  eventAction?: string;
};

type LessonVersionRecord = {
  id: string;
  lessonPlanId: string;
  version: number;
  title: string;
  content: string;
  status: string;
  governanceSnapshot?: any;
  provenanceSnapshot?: any;
  createdAt: string;
  actorName: string;
  actorRole: string;
  changeSummary: string;
};

type AuthSessionRecord = {
  sessionId: string;
  user: SessionUser;
  createdAt: string;
  expiresAt: string;
  revokedAt?: string;
};

const dataDir = process.env.GIAOAN_DATA_DIR || path.join(process.cwd(), 'data');
const lessonsPath = path.join(dataDir, 'saved-lessons.json');
const versionsPath = path.join(dataDir, 'saved-lesson-versions.json');
const sessionsPath = path.join(dataDir, 'auth-sessions.json');

let settings: SchoolSettings = { ...demoSettings };
let loaded = false;
let lessons: SavedLessonPlan[] = [];
let versions: LessonVersionRecord[] = [];
let sessionsLoaded = false;
let authSessions: AuthSessionRecord[] = [];

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

function safeReadJsonArray<T>(filePath: string): T[] {
  try {
    if (!fs.existsSync(filePath)) return [];
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

function safeWriteJson(filePath: string, value: unknown) {
  try {
    ensureDataDir();
    const tempPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
    fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
    fs.renameSync(tempPath, filePath);
    return { ok: true as const, mode: 'file' as const };
  } catch (error) {
    // Batch89: trên Vercel/serverless, thư mục data có thể chỉ đọc.
    // Không để lỗi ghi JSON làm chết CSRF/session hoặc luồng tạo giáo án demo;
    // dữ liệu vẫn giữ trong memory của process hiện tại và client còn fallback localStorage.
    return {
      ok: false as const,
      mode: 'memory_fallback' as const,
      error: error instanceof Error ? error.message : 'json_write_failed'
    };
  }
}

function loadPersistentStore() {
  if (loaded) return;
  lessons = safeReadJsonArray<SavedLessonPlan>(lessonsPath);
  versions = safeReadJsonArray<LessonVersionRecord>(versionsPath);
  loaded = true;
}

function flushPersistentStore() {
  safeWriteJson(lessonsPath, lessons);
  safeWriteJson(versionsPath, versions);
}

function loadAuthSessions() {
  if (sessionsLoaded) return;
  authSessions = safeReadJsonArray<AuthSessionRecord>(sessionsPath)
    .filter((item: any) => item?.sessionId && item?.user && !item.revokedAt && String(item.expiresAt || '') > nowIso());
  sessionsLoaded = true;
}

function flushAuthSessions() {
  safeWriteJson(sessionsPath, authSessions.slice(0, 500));
}

function normalizeSessionRole(role: unknown) {
  return role === 'admin' || role === 'leader' || role === 'teacher' ? role : 'teacher';
}

function sessionExpiry(days = 7) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function resolveActor(context: LessonSaveContext = {}) {
  return {
    actorName: context.actorName || context.name || demoUser.name || 'Giáo viên demo',
    actorRole: context.actorRole || context.role || demoUser.role || 'teacher',
    authorId: context.id || demoUser.id || 'demo-user',
    authorName: context.name || context.actorName || demoUser.name || 'Giáo viên demo',
    authorRole: context.role || context.actorRole || demoUser.role || 'teacher',
    changeSummary: context.changeSummary || 'Lưu giáo án.',
    eventAction: context.eventAction || 'saved'
  };
}

function nextVersionNumber(existing: any, input: any) {
  if (!existing) return Number(input.currentVersion || input.version || 1) || 1;
  return (Number(existing.currentVersion || existing.version || 1) || 1) + 1;
}

function normalizeLesson(input: any, existing: any, context: LessonSaveContext) {
  const actor = resolveActor(context);
  const now = nowIso();
  const id = input.id || existing?.id || `lesson-${Date.now()}`;
  const currentVersion = nextVersionNumber(existing, input);
  const title = input.title || existing?.title || `${input.subject || existing?.subject || 'Môn học'} - ${input.topic || existing?.topic || 'Chủ đề'}`;
  const history = Array.isArray(existing?.history) ? [...existing.history] : Array.isArray(existing?.workflow) ? [...existing.workflow] : [];
  history.push({
    id: `history-${Date.now()}-${history.length + 1}`,
    action: context.eventAction || input.eventAction || input.status || actor.eventAction,
    at: now,
    actorName: actor.actorName,
    actorRole: actor.actorRole,
    changeSummary: context.changeSummary || input.changeSummary || actor.changeSummary
  });

  return {
    ...existing,
    ...input,
    id,
    title,
    content: input.content || input.plan || existing?.content || '',
    status: input.status || existing?.status || 'draft',
    level: input.level || existing?.level || 'THCS',
    grade: input.grade || existing?.grade || '6',
    subject: input.subject || existing?.subject || 'Ngữ văn',
    book: input.book || existing?.book || 'Cánh Diều',
    topic: input.topic || existing?.topic || 'Bài mở đầu',
    template: input.template || existing?.template || 'Mẫu phát triển phẩm chất - năng lực',
    methods: Array.isArray(input.methods) ? input.methods : Array.isArray(existing?.methods) ? existing.methods : [],
    techniques: Array.isArray(input.techniques) ? input.techniques : Array.isArray(existing?.techniques) ? existing.techniques : [],
    governanceSnapshot: input.governanceSnapshot ?? existing?.governanceSnapshot ?? null,
    provenanceSnapshot: input.provenanceSnapshot ?? existing?.provenanceSnapshot ?? null,
    currentVersion,
    version: currentVersion,
    authorId: existing?.authorId || input.authorId || actor.authorId,
    authorName: existing?.authorName || input.authorName || actor.authorName,
    authorRole: existing?.authorRole || input.authorRole || actor.authorRole,
    reviews: Array.isArray(input.reviews) ? input.reviews : Array.isArray(existing?.reviews) ? existing.reviews : [],
    history,
    workflow: history,
    createdAt: existing?.createdAt || input.createdAt || now,
    updatedAt: now
  };
}

function makeVersionRecord(lesson: any, context: LessonSaveContext): LessonVersionRecord {
  const actor = resolveActor(context);
  return {
    id: `version-${lesson.currentVersion}`,
    lessonPlanId: lesson.id,
    version: Number(lesson.currentVersion || lesson.version || 1),
    title: lesson.title,
    content: lesson.content || '',
    status: lesson.status || 'draft',
    governanceSnapshot: lesson.governanceSnapshot || null,
    provenanceSnapshot: lesson.provenanceSnapshot || null,
    createdAt: lesson.updatedAt || nowIso(),
    actorName: actor.actorName,
    actorRole: actor.actorRole,
    changeSummary: context.changeSummary || 'Lưu phiên bản giáo án.'
  };
}

function normalizeRestoreArgs(idOrArgs: any, versionId?: string) {
  if (typeof idOrArgs === 'object' && idOrArgs) {
    return {
      lessonPlanId: idOrArgs.lessonPlanId || idOrArgs.id,
      versionId: idOrArgs.versionId,
      actorName: idOrArgs.actorName,
      actorRole: idOrArgs.actorRole
    };
  }
  return { lessonPlanId: idOrArgs, versionId };
}

function normalizeDiffArgs(idOrArgs: any, a?: string, b?: string) {
  if (typeof idOrArgs === 'object' && idOrArgs) {
    return {
      lessonPlanId: idOrArgs.lessonPlanId || idOrArgs.id,
      versionId: idOrArgs.versionId,
      compareVersionId: idOrArgs.compareVersionId
    };
  }
  return { lessonPlanId: idOrArgs, versionId: a, compareVersionId: b };
}

export function getStorageMode() {
  return process.env.DATABASE_URL ? 'database_configured_json_persistence_fallback' : 'json_file_persistence_fallback';
}

export function getStoragePaths() {
  return {
    mode: getStorageMode(),
    lessonsFile: path.relative(process.cwd(), lessonsPath),
    versionsFile: path.relative(process.cwd(), versionsPath),
    sessionsFile: path.relative(process.cwd(), sessionsPath),
    writable: true,
    writeFallback: 'memory_fallback_when_json_file_is_read_only',
    note: 'JSON persistence dùng cho demo/runtime foundation. Nếu host/serverless không cho ghi data/*.json, runtime không được làm chết luồng chính và phải fallback memory/localStorage. Production vẫn cần DB/migration/backup/locking đầy đủ.'
  };
}

export async function getSchoolSettings() { return settings; }
export async function saveSchoolSettings(next: any) { settings = { ...settings, ...next }; return settings; }

export async function readLessons() {
  loadPersistentStore();
  return [...lessons].sort((a: any, b: any) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
}

export async function searchLessons(filter: any = {}, _user?: SessionUser) {
  const q = String(filter.query || '').toLowerCase();
  const items = await readLessons();
  return items.filter((l: any) => (!q || JSON.stringify(l).toLowerCase().includes(q)) && (!filter.status || filter.status === 'all' || l.status === filter.status));
}

export async function getLessonById(id: string) {
  loadPersistentStore();
  return lessons.find((l: any) => l.id === id) || null;
}

export async function saveLesson(input: any, context: LessonSaveContext = demoUser) {
  loadPersistentStore();
  const id = input.id || `lesson-${Date.now()}`;
  const existing = lessons.find((item: any) => item.id === id);
  const next = normalizeLesson({ ...input, id }, existing, context);
  lessons = existing ? lessons.map((item: any) => item.id === id ? next : item) : [next, ...lessons];
  versions = [...versions.filter((item) => !(item.lessonPlanId === id && item.version === next.currentVersion)), makeVersionRecord(next, context)];
  flushPersistentStore();
  return next;
}

export async function deleteLesson(id: string) {
  loadPersistentStore();
  lessons = lessons.filter((l: any) => l.id !== id);
  versions = versions.filter((item) => item.lessonPlanId !== id);
  flushPersistentStore();
  return true;
}

export async function addLessonReview(idOrInput: any, review: any = {}, user: SessionUser = demoUser) {
  const id = typeof idOrInput === 'object' ? idOrInput.lessonPlanId : idOrInput;
  review = typeof idOrInput === 'object' ? idOrInput : review;
  const lesson = await getLessonById(id);
  return { id: `review-${Date.now()}`, lessonId: id, reviewerName: user.name, ...review, lesson };
}

export async function getLessonHistory(id: string) {
  const lesson = await getLessonById(id);
  return lesson?.history || lesson?.workflow || [];
}

export async function getLessonVersions(id: string) {
  loadPersistentStore();
  return versions
    .filter((item) => item.lessonPlanId === id)
    .sort((a, b) => b.version - a.version);
}

export async function getLessonVersionDiff(idOrArgs: any, a?: string, b?: string) {
  const { lessonPlanId, versionId, compareVersionId } = normalizeDiffArgs(idOrArgs, a, b);
  if (!lessonPlanId || !versionId) return null;
  const all = await getLessonVersions(lessonPlanId);
  const current = all.find((item) => item.id === versionId || String(item.version) === String(versionId));
  const compare = compareVersionId
    ? all.find((item) => item.id === compareVersionId || String(item.version) === String(compareVersionId))
    : all.find((item) => item.version < Number(current?.version || 0));
  if (!current) return null;
  const before = compare?.content || '';
  const after = current.content || '';
  return {
    lessonId: lessonPlanId,
    fromVersionId: compare?.id || null,
    toVersionId: current.id,
    changed: before !== after,
    summary: before === after ? 'Không phát hiện thay đổi nội dung.' : 'Có thay đổi nội dung giữa hai phiên bản.',
    lines: [
      { label: 'Phiên bản trước', value: before.slice(0, 400) },
      { label: 'Phiên bản được chọn', value: after.slice(0, 400) }
    ],
    governanceChanged: JSON.stringify(compare?.governanceSnapshot || null) !== JSON.stringify(current.governanceSnapshot || null)
  };
}

export async function restoreLessonVersion(idOrArgs: any, maybeVersionId?: string) {
  const args = normalizeRestoreArgs(idOrArgs, maybeVersionId);
  if (!args.lessonPlanId || !args.versionId) return null;
  const lesson = await getLessonById(args.lessonPlanId);
  if (!lesson) return null;
  const all = await getLessonVersions(args.lessonPlanId);
  const found = all.find((v: any) => v.id === args.versionId || String(v.version) === String(args.versionId));
  if (!found) return null;
  return saveLesson({
    ...lesson,
    content: found.content,
    status: 'draft',
    governanceSnapshot: found.governanceSnapshot || lesson.governanceSnapshot,
    provenanceSnapshot: found.provenanceSnapshot || lesson.provenanceSnapshot
  }, {
    actorName: args.actorName || demoUser.name,
    actorRole: args.actorRole || demoUser.role,
    changeSummary: `Phục hồi từ phiên bản ${found.version}.`,
    eventAction: 'version_restored'
  });
}

export async function getDashboardStats(_user?: any) {
  const items = await readLessons();
  return {
    totalLessons: items.length,
    draftLessons: items.filter((l:any)=>l.status==='draft').length,
    reviewLessons: items.filter((l:any)=>l.status==='review').length,
    approvedLessons: items.filter((l:any)=>l.status==='approved').length,
    bySubject: [],
    byGrade: []
  };
}

export async function createSessionUser(name: string, role = 'teacher', extra: any = {}) {
  loadAuthSessions();
  const sessionId = `session-${randomUUID()}`;
  const user: SessionUser = {
    id: extra.id || extra.userId || `user-${randomUUID()}`,
    sessionId,
    name: String(name || 'Giáo viên').slice(0, 100),
    role: normalizeSessionRole(role),
    schoolName: extra.schoolName || demoUser.schoolName,
    departmentName: extra.departmentName || demoUser.departmentName,
    schoolKey: extra.schoolKey || 'demo-school',
    departmentKey: extra.departmentKey || 'demo-department',
    permissions: Array.isArray(extra.permissions) ? extra.permissions : [],
    authAccountId: extra.authAccountId,
    sessionMode: extra.sessionMode || 'password_or_demo_session'
  };
  const record: AuthSessionRecord = { sessionId, user, createdAt: nowIso(), expiresAt: sessionExpiry(7) };
  authSessions = [record, ...authSessions.filter((item) => item.sessionId !== sessionId)].slice(0, 500);
  flushAuthSessions();
  return user;
}

export async function readSessionUserBySessionId(sessionId?: string | null) {
  if (!sessionId) return null;
  loadAuthSessions();
  const now = nowIso();
  const found = authSessions.find((item) => item.sessionId === sessionId && !item.revokedAt && item.expiresAt > now);
  return found?.user || null;
}

export async function revokeSessionById(sessionId?: string | null) {
  if (!sessionId) return { revoked: 0 };
  loadAuthSessions();
  let revoked = 0;
  authSessions = authSessions.map((item) => {
    if (item.sessionId === sessionId && !item.revokedAt) {
      revoked += 1;
      return { ...item, revokedAt: nowIso() };
    }
    return item;
  });
  flushAuthSessions();
  return { revoked };
}

export async function revokeAllSessionsForAuthAccount(id: string) {
  loadAuthSessions();
  let revoked = 0;
  authSessions = authSessions.map((item) => {
    if (item.user?.authAccountId === id && !item.revokedAt) {
      revoked += 1;
      return { ...item, revokedAt: nowIso() };
    }
    return item;
  });
  flushAuthSessions();
  return { revoked };
}

export async function revokeSessionsByAuthAccountId(id: string, keepSessionId?: string) {
  loadAuthSessions();
  let revoked = 0;
  authSessions = authSessions.map((item) => {
    if (item.user?.authAccountId === id && item.sessionId !== keepSessionId && !item.revokedAt) {
      revoked += 1;
      return { ...item, revokedAt: nowIso() };
    }
    return item;
  });
  flushAuthSessions();
  return { revoked };
}
