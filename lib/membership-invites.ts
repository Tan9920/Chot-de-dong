import fs from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';
import { upsertMembership } from './membership';
import { demoUser } from './demo-data';

const dataDir = process.env.GIAOAN_DATA_DIR || path.join(process.cwd(), 'data');
const invitesPath = path.join(dataDir, 'membership-invites.json');

type InviteRecord = {
  id: string;
  code: string;
  email?: string;
  name?: string;
  role: 'teacher' | 'leader' | 'admin';
  schoolName?: string;
  departmentName?: string;
  schoolKey?: string;
  departmentKey?: string;
  status: 'active' | 'redeemed' | 'revoked' | 'expired';
  createdBy?: string;
  createdByRole?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  redeemedAt?: string;
  redeemedByEmail?: string;
};

let loaded = false;
let invites: InviteRecord[] = [];

function nowIso() { return new Date().toISOString(); }
function ensureDataDir() { if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true }); }
function bounded(value: unknown, fallback = '', max = 140) { return String(value ?? fallback).trim().slice(0, max); }
function normalizeEmail(value: unknown) { return bounded(value, '', 180).toLowerCase(); }
function normalizeRole(role: unknown): InviteRecord['role'] { return role === 'admin' || role === 'leader' || role === 'teacher' ? role : 'teacher'; }
function slug(value: unknown, fallback: string) {
  const text = bounded(value, fallback, 120).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return text || fallback;
}
function readJsonArray<T>(filePath: string): T[] {
  try {
    if (!fs.existsSync(filePath)) return [];
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch { return []; }
}
function writeJson(filePath: string, value: unknown) {
  ensureDataDir();
  const tmp = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(tmp, filePath);
}
function loadInvites() {
  if (loaded) return;
  invites = readJsonArray<InviteRecord>(invitesPath);
  loaded = true;
}
function flushInvites() { writeJson(invitesPath, invites.slice(0, 1000)); }
function defaultExpiry(days = 14) { return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(); }
function makeCode(role: InviteRecord['role']) { return `invite-${role}-${randomBytes(16).toString('base64url')}`; }
function isExpired(invite: InviteRecord) { return Boolean(invite.expiresAt && invite.expiresAt < nowIso()); }
function redactInvite(invite: InviteRecord) {
  const codePreview = `${invite.code.slice(0, 14)}…`;
  return { ...invite, codePreview, code: invite.status === 'active' ? invite.code : codePreview };
}

export async function listMembershipInvites(filter: any = {}, _actor?: any) {
  loadInvites();
  const q = bounded(filter.q, '', 120).toLowerCase();
  return invites.map((invite) => isExpired(invite) && invite.status === 'active' ? { ...invite, status: 'expired' as const } : invite)
    .filter((invite) => {
      if (filter.status && invite.status !== filter.status) return false;
      if (filter.role && invite.role !== filter.role) return false;
      if (q && !JSON.stringify(invite).toLowerCase().includes(q)) return false;
      return true;
    })
    .map(redactInvite);
}

export async function createMembershipInvite(input: any = {}, actor?: any) {
  loadInvites();
  const role = normalizeRole(input.role);
  if (role === 'admin' && actor?.role !== 'admin' && !(Array.isArray(actor?.permissions) && actor.permissions.includes('membership:manage'))) {
    throw new Error('Chỉ admin mới được tạo lời mời admin.');
  }
  const schoolName = bounded(input.schoolName, actor?.schoolName || demoUser.schoolName, 140);
  const departmentName = bounded(input.departmentName, actor?.departmentName || demoUser.departmentName, 140);
  const now = nowIso();
  const invite: InviteRecord = {
    id: `invite-${Date.now()}-${randomBytes(4).toString('hex')}`,
    code: bounded(input.code, makeCode(role), 220),
    email: normalizeEmail(input.email) || undefined,
    name: bounded(input.name, '', 120) || undefined,
    role,
    schoolName,
    departmentName,
    schoolKey: bounded(input.schoolKey, actor?.schoolKey || slug(schoolName, 'demo-school'), 120),
    departmentKey: bounded(input.departmentKey, actor?.departmentKey || slug(departmentName, 'demo-department'), 120),
    status: 'active',
    createdBy: actor?.id || actor?.name || 'system',
    createdByRole: actor?.role || 'admin',
    createdAt: now,
    updatedAt: now,
    expiresAt: bounded(input.expiresAt, defaultExpiry(Number(input.expiresInDays || 14)), 60)
  };
  if (invites.some((item) => item.code === invite.code && item.status === 'active')) throw new Error('Mã mời đang tồn tại. Hãy tạo mã khác.');
  invites = [invite, ...invites];
  flushInvites();
  return { ok: true, invite };
}

export async function redeemMembershipInvite(input: any = {}, _actor?: any) {
  loadInvites();
  const code = bounded(typeof input === 'string' ? input : input.code, '', 220);
  const email = normalizeEmail(typeof input === 'string' ? '' : input.email);
  const name = bounded(typeof input === 'string' ? '' : input.name, demoUser.name, 120);
  if (!code) return { ok: false as const, error: 'Thiếu mã mời.' };
  const invite = invites.find((item) => item.code === code);
  if (!invite) return { ok: false as const, error: 'Mã mời không tồn tại hoặc chưa được admin tạo.' };
  if (invite.status !== 'active') return { ok: false as const, error: `Mã mời không còn hiệu lực (${invite.status}).` };
  if (isExpired(invite)) {
    invites = invites.map((item) => item.id === invite.id ? { ...item, status: 'expired', updatedAt: nowIso() } : item);
    flushInvites();
    return { ok: false as const, error: 'Mã mời đã hết hạn.' };
  }
  if (invite.email && email && invite.email !== email) return { ok: false as const, error: 'Mã mời không khớp email đăng ký/đăng nhập.' };
  const membership = await upsertMembership({
    name: invite.name || name,
    email: invite.email || email || undefined,
    role: invite.role,
    schoolName: invite.schoolName,
    departmentName: invite.departmentName,
    schoolKey: invite.schoolKey,
    departmentKey: invite.departmentKey,
    source: `invite:${invite.id}`
  });
  const redeemedAt = nowIso();
  invites = invites.map((item) => item.id === invite.id ? { ...item, status: 'redeemed', redeemedAt, redeemedByEmail: email || undefined, updatedAt: redeemedAt } : item);
  flushInvites();
  return { ok: true as const, code, invite: { ...invite, status: 'redeemed' as const, redeemedAt }, membership };
}

export async function revokeMembershipInvite(id: string, actor?: any) {
  loadInvites();
  const target = invites.find((item) => item.id === id || item.code === id);
  if (!target) return { ok: true, id, revoked: false };
  const updated = { ...target, status: 'revoked' as const, updatedAt: nowIso(), createdByRole: target.createdByRole || actor?.role || 'admin' };
  invites = [updated, ...invites.filter((item) => item.id !== target.id)];
  flushInvites();
  return { ok: true, id: target.id, revoked: true, invite: updated };
}
