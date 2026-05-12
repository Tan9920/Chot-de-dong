import fs from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';
import { demoUser, okSummary } from './demo-data';

const dataDir = process.env.GIAOAN_DATA_DIR || path.join(process.cwd(), 'data');
const membershipsPath = path.join(dataDir, 'memberships.json');

type MembershipRecord = {
  id: string;
  name: string;
  email?: string;
  role: 'teacher' | 'leader' | 'admin';
  schoolName?: string;
  departmentName?: string;
  schoolKey?: string;
  departmentKey?: string;
  status: 'active' | 'inactive' | 'revoked';
  source?: string;
  createdAt: string;
  updatedAt: string;
};

let loaded = false;
let memberships: MembershipRecord[] = [];

function nowIso() { return new Date().toISOString(); }
function ensureDataDir() { if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true }); }
function bounded(value: unknown, fallback = '', max = 120) { return String(value ?? fallback).trim().slice(0, max); }
function normalizeEmail(value: unknown) { return bounded(value, '', 180).toLowerCase(); }
function normalizeRole(role: unknown): MembershipRecord['role'] { return role === 'admin' || role === 'leader' || role === 'teacher' ? role : 'teacher'; }
function normalizeStatus(status: unknown): MembershipRecord['status'] { return status === 'inactive' || status === 'revoked' || status === 'active' ? status : 'active'; }
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
function loadMemberships() {
  if (loaded) return;
  memberships = readJsonArray<MembershipRecord>(membershipsPath).filter((item: any) => item?.id && item?.status !== 'revoked');
  loaded = true;
}
function flushMemberships() { writeJson(membershipsPath, memberships.slice(0, 1000)); }
function normalizeMembership(input: any = {}, existing?: MembershipRecord | null, actor?: any): MembershipRecord {
  const now = nowIso();
  const role = normalizeRole(input.role);
  const schoolName = bounded(input.schoolName, existing?.schoolName || demoUser.schoolName, 140);
  const departmentName = bounded(input.departmentName, existing?.departmentName || demoUser.departmentName, 140);
  return {
    id: bounded(input.id, existing?.id || `membership-${Date.now()}-${randomBytes(4).toString('hex')}`, 140),
    name: bounded(input.name, existing?.name || input.email || demoUser.name, 120),
    email: normalizeEmail(input.email || existing?.email) || undefined,
    role,
    schoolName,
    departmentName,
    schoolKey: bounded(input.schoolKey, existing?.schoolKey || slug(schoolName, 'demo-school'), 120),
    departmentKey: bounded(input.departmentKey, existing?.departmentKey || slug(departmentName, 'demo-department'), 120),
    status: normalizeStatus(input.status || existing?.status || 'active'),
    source: bounded(input.source, existing?.source || (actor?.id ? 'admin_membership' : 'auto_teacher'), 80),
    createdAt: existing?.createdAt || bounded(input.createdAt, now, 40),
    updatedAt: now
  };
}
function findMatchingMembership(input: any = {}) {
  const email = normalizeEmail(input.email);
  const name = bounded(input.name, '', 120).toLowerCase();
  return memberships.find((item) => item.status === 'active' && ((email && item.email === email) || (!email && name && item.name.toLowerCase() === name))) || null;
}

export async function listMemberships(filter: any = {}, _actor?: any) {
  loadMemberships();
  const q = bounded(filter.q, '', 120).toLowerCase();
  return memberships.filter((item) => {
    if (filter.role && item.role !== filter.role) return false;
    if (filter.status && item.status !== filter.status) return false;
    if (filter.schoolKey && item.schoolKey !== filter.schoolKey) return false;
    if (filter.departmentKey && item.departmentKey !== filter.departmentKey) return false;
    if (q && !JSON.stringify(item).toLowerCase().includes(q)) return false;
    return true;
  });
}
export async function getMembershipSummary(_actor?: any) {
  loadMemberships();
  const active = memberships.filter((item) => item.status === 'active');
  return {
    ...okSummary(),
    total: memberships.length,
    active: active.length,
    teacher: active.filter((item) => item.role === 'teacher').length,
    leader: active.filter((item) => item.role === 'leader').length,
    admin: active.filter((item) => item.role === 'admin').length,
    persistence: 'json_file_demo_membership_store'
  };
}
export async function upsertMembership(input: any = {}, actor?: any) {
  loadMemberships();
  const id = bounded(input.id, '', 140);
  const email = normalizeEmail(input.email);
  const existing = memberships.find((item) => (id && item.id === id) || (email && item.email === email)) || null;
  const item = normalizeMembership(input, existing, actor);
  memberships = [item, ...memberships.filter((m) => m.id !== item.id)];
  flushMemberships();
  return item;
}
export async function deleteMembership(id: string, actor?: any) {
  loadMemberships();
  const target = memberships.find((m) => m.id === id);
  if (!target) return { ok: true, id, deleted: false };
  const revoked = { ...target, status: 'revoked' as const, updatedAt: nowIso(), source: `revoked_by_${actor?.role || 'admin'}` };
  memberships = [revoked, ...memberships.filter((m) => m.id !== id)];
  flushMemberships();
  return { ok: true, id, deleted: true };
}

export async function resolveMembershipForLogin(input: any = {}, _actor?: any) {
  loadMemberships();
  const existing = findMatchingMembership(input);
  if (existing) {
    return { membership: existing, autoProvisioned: false, downgraded: false, privilegedBlocked: false };
  }
  // Batch96: role elevation is no longer inferred from a client-provided role or a
  // magic trusted-* string. New public accounts default to teacher. Leader/admin
  // must come from an existing membership or a redeemed invite in membership-invites.ts.
  const membership = normalizeMembership({
    name: input.name,
    email: input.email,
    role: 'teacher',
    schoolName: input.schoolName,
    departmentName: input.departmentName,
    source: 'auto_teacher_login'
  });
  return {
    membership,
    autoProvisioned: true,
    downgraded: normalizeRole(input.requestedRole) !== 'teacher',
    privilegedBlocked: normalizeRole(input.requestedRole) !== 'teacher'
  };
}

export function membershipToSessionShape(membership: any = {}, _args?: any) {
  return {
    schoolName: membership.schoolName,
    departmentName: membership.departmentName,
    schoolKey: membership.schoolKey || 'demo-school',
    departmentKey: membership.departmentKey || 'demo-department',
    permissions: membership.permissions || []
  };
}
