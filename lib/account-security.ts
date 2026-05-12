import fs from 'fs';
import path from 'path';
import { randomBytes, timingSafeEqual, scryptSync } from 'crypto';

const dataDir = process.env.GIAOAN_DATA_DIR || path.join(process.cwd(), 'data');
const accountsPath = path.join(dataDir, 'auth-accounts.json');

type AccountRecord = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  passwordSalt: string;
  passwordAlgorithm: 'scrypt-v1';
  schoolName?: string;
  departmentName?: string;
  createdAt: string;
  updatedAt: string;
};

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

function readAccounts(): AccountRecord[] {
  try {
    if (!fs.existsSync(accountsPath)) return [];
    const parsed = JSON.parse(fs.readFileSync(accountsPath, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAccounts(items: AccountRecord[]) {
  ensureDataDir();
  const tempPath = `${accountsPath}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tempPath, `${JSON.stringify(items, null, 2)}\n`, 'utf8');
  fs.renameSync(tempPath, accountsPath);
}

function bounded(value: unknown, max = 160) {
  return String(value ?? '').trim().slice(0, max);
}

function normalizeEmail(value: unknown) {
  return bounded(value, 180).toLowerCase();
}

function hashPassword(password: string, salt = randomBytes(16).toString('hex')) {
  const passwordHash = scryptSync(password, salt, 64).toString('hex');
  return { passwordHash, passwordSalt: salt, passwordAlgorithm: 'scrypt-v1' as const };
}

function verifyHash(password: string, account: AccountRecord) {
  if (!account.passwordHash || !account.passwordSalt) return false;
  const expected = Buffer.from(account.passwordHash, 'hex');
  const actual = Buffer.from(hashPassword(password, account.passwordSalt).passwordHash, 'hex');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function publicAccount(account: AccountRecord) {
  const { passwordHash: _passwordHash, passwordSalt: _passwordSalt, ...safe } = account;
  return safe;
}

export async function registerPasswordAccount(input: any = {}) {
  const email = normalizeEmail(input.email);
  const password = String(input.password || '');
  if (!email || !email.includes('@')) throw new Error('Email không hợp lệ.');
  if (password.length < 8) throw new Error('Mật khẩu cần tối thiểu 8 ký tự.');
  const accounts = readAccounts();
  if (accounts.some((item) => item.email === email)) throw new Error('Email này đã có tài khoản.');
  const now = new Date().toISOString();
  const account: AccountRecord = {
    id: `account-${Date.now()}-${randomBytes(4).toString('hex')}`,
    email,
    name: bounded(input.name, 100) || email.split('@')[0] || 'Giáo viên',
    schoolName: bounded(input.schoolName, 140) || undefined,
    departmentName: bounded(input.departmentName, 140) || undefined,
    createdAt: now,
    updatedAt: now,
    ...hashPassword(password)
  };
  writeAccounts([account, ...accounts]);
  return { ok: true, account: publicAccount(account) };
}

export async function verifyPasswordAccount(email?: string, password?: string) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return { ok: false, error: 'Thiếu email.', reason: 'missing_email' };
  if (!password) return { ok: false, error: 'Thiếu mật khẩu.', reason: 'missing_password' };
  const account = readAccounts().find((item) => item.email === normalizedEmail);
  if (!account || !verifyHash(password, account)) {
    return { ok: false, error: 'Email hoặc mật khẩu không đúng.', reason: 'invalid_credentials' };
  }
  return { ok: true, account: publicAccount(account) };
}

export async function changePasswordAccount(input: any = {}) {
  const authAccountId = bounded(input.authAccountId, 120);
  const currentPassword = String(input.currentPassword || '');
  const newPassword = String(input.newPassword || '');
  if (!authAccountId) throw new Error('Thiếu tài khoản xác thực.');
  if (newPassword.length < 8) throw new Error('Mật khẩu mới cần tối thiểu 8 ký tự.');
  const accounts = readAccounts();
  const account = accounts.find((item) => item.id === authAccountId);
  if (!account) throw new Error('Không tìm thấy tài khoản.');
  if (!verifyHash(currentPassword, account)) throw new Error('Mật khẩu hiện tại không đúng.');
  const updated: AccountRecord = { ...account, ...hashPassword(newPassword), updatedAt: new Date().toISOString() };
  writeAccounts(accounts.map((item) => item.id === updated.id ? updated : item));
  return publicAccount(updated);
}
