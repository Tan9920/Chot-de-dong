import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';

const nextBin = process.platform === 'win32' ? 'node_modules/.bin/next.cmd' : 'node_modules/.bin/next';
if (!fs.existsSync(nextBin)) {
  console.error(JSON.stringify({ ok: false, error: 'dependencies_missing', message: 'Run npm run install:clean before auth invite runtime smoke. Batch98 refuses to fake invite/runtime proof without Next installed.' }, null, 2));
  process.exit(2);
}
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'giao-an-auth-invite-smoke-'));
const artifactsDir = path.join(process.cwd(), 'artifacts');
fs.mkdirSync(artifactsDir, { recursive: true });
const artifactFile = path.join(artifactsDir, 'auth-invite-runtime-smoke-last-run.json');
const timeoutMs = Number(process.env.GIAOAN_AUTH_INVITE_SMOKE_TIMEOUT_MS || 120000);
let finished = false;
function writeArtifact(report) {
  const finalReport = { ...report, generatedAt: new Date().toISOString(), artifact: 'artifacts/auth-invite-runtime-smoke-last-run.json' };
  fs.writeFileSync(artifactFile, JSON.stringify(finalReport, null, 2) + '\n', 'utf8');
  return finalReport;
}
const now = new Date().toISOString();
const future = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
for (const file of ['auth-accounts.json','auth-sessions.json','saved-lessons.json','saved-lesson-versions.json','security-audit-events.json','usage-ledger.json']) fs.writeFileSync(path.join(dataDir, file), '[]\n', 'utf8');
fs.writeFileSync(path.join(dataDir, 'memberships.json'), JSON.stringify([{ id: 'membership-admin-smoke', name: 'Smoke Admin', email: 'smoke-admin@example.test', role: 'admin', schoolName: 'Trường smoke', departmentName: 'Ban smoke', schoolKey: 'smoke-school', departmentKey: 'smoke-admin', status: 'active', source: 'batch98_runtime_smoke_seed', createdAt: now, updatedAt: now }], null, 2) + '\n');
fs.writeFileSync(path.join(dataDir, 'membership-invites.json'), JSON.stringify([
  { id: 'invite-revoked-smoke', code: 'invite-revoked-smoke-code', email: 'revoked-smoke@example.test', name: 'Revoked Smoke', role: 'leader', schoolName: 'Trường smoke', departmentName: 'Tổ revoked', schoolKey: 'smoke-school', departmentKey: 'smoke-revoked', status: 'revoked', createdBy: 'membership-admin-smoke', createdByRole: 'admin', createdAt: now, updatedAt: now, expiresAt: future },
  { id: 'invite-expired-smoke', code: 'invite-expired-smoke-code', email: 'expired-smoke@example.test', name: 'Expired Smoke', role: 'leader', schoolName: 'Trường smoke', departmentName: 'Tổ expired', schoolKey: 'smoke-school', departmentKey: 'smoke-expired', status: 'active', createdBy: 'membership-admin-smoke', createdByRole: 'admin', createdAt: now, updatedAt: now, expiresAt: past }
], null, 2) + '\n');

async function findFreePort(preferred) { function tryPort(port) { return new Promise((resolve) => { const server = net.createServer(); server.unref(); server.on('error', () => resolve(false)); server.listen({ port, host: '127.0.0.1' }, () => { const actual = server.address()?.port || port; server.close(() => resolve(actual)); }); }); } const pref = await tryPort(preferred); if (pref) return pref; for (let port = 3201; port < 3300; port += 1) { const result = await tryPort(port); if (result) return result; } return await tryPort(0); }
const port = Number(await findFreePort(Number(process.env.PORT || 3210)));
const smokeBaseHost = process.env.GIAOAN_SMOKE_BASE_HOST || 'localhost';
const base = `http://${smokeBaseHost}:${port}`;
const env = { ...process.env, PORT: String(port), HOSTNAME: '127.0.0.1', NEXT_PUBLIC_DEMO_MODE: 'true', GIAOAN_DEMO_MODE: 'true', GIAOAN_ALLOW_DEMO_LOGIN: 'false', GIAOAN_DATA_DIR: dataDir, NEXT_TELEMETRY_DISABLED: '1' };
for (const key of ['NPM_CONFIG_REGISTRY','NPM_CONFIG_USERCONFIG','npm_config_registry','npm_config_userconfig']) delete env[key];
env.npm_config_registry = 'https://registry.npmjs.org/';
env.npm_config_always_auth = 'false';
const hasBuildArtifact = fs.existsSync(path.join(process.cwd(), '.next', 'BUILD_ID'));
if (!hasBuildArtifact) {
  const report = writeArtifact({ ok: false, error: 'missing_next_build_artifact', message: 'Run npm run build:raw:diagnose before auth-invite:runtime-smoke. Batch121 refuses to fall back to next dev for runtime proof.', base, dataDir, noAiPaymentVerifiedFakeAdded: true });
  console.error(JSON.stringify(report, null, 2));
  process.exit(2);
}
const serverMode = 'start';
const serverArgs = ['start', '--hostname', '127.0.0.1', '--port', String(port)];
const child = spawn(nextBin, serverArgs, { stdio: ['ignore','pipe','pipe'], env, detached: process.platform !== 'win32' });
let logs = '';
child.stdout.on('data', d => { logs += String(d); });
function killChildTree(signal = 'SIGTERM') {
  try {
    if (process.platform !== 'win32') process.kill(-child.pid, signal);
    else child.kill(signal);
  } catch {
    try { child.kill(signal); } catch {}
  }
}
child.stderr.on('data', d => { logs += String(d); });
const timeout = setTimeout(() => {
  if (finished) return;
  finished = true;
  const report = writeArtifact({ ok: false, error: 'auth_invite_runtime_smoke_timeout', timeoutMs, serverMode, base, dataDir, logs: logs.slice(-5000), noAiPaymentVerifiedFakeAdded: true });
  console.error(JSON.stringify(report, null, 2));
  killChildTree('SIGTERM');
  setTimeout(() => { killChildTree('SIGKILL'); process.exit(124); }, 1000).unref();
}, timeoutMs);
function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
function setCookies(headers) { if (typeof headers.getSetCookie === 'function') return headers.getSetCookie(); const raw = headers.get('set-cookie'); return raw ? [raw] : []; }
class CookieJar { constructor() { this.cookies = new Map(); } store(headers) { for (const item of setCookies(headers)) for (const part of String(item).split(/,(?=\s*[^;,]+=)/)) { const pair = part.split(';')[0]?.trim(); if (!pair || !pair.includes('=')) continue; const [name, ...rest] = pair.split('='); this.cookies.set(name, rest.join('=')); } } header() { return [...this.cookies.entries()].map(([k,v]) => `${k}=${v}`).join('; '); } clone() { const next = new CookieJar(); next.cookies = new Map(this.cookies); return next; } clear() { this.cookies.clear(); } }
let finalExitCode = 0;
const jar = new CookieJar();
async function request(route, init = {}, activeJar = jar) { const headers = new Headers(init.headers || {}); if (activeJar.header()) headers.set('cookie', activeJar.header()); if (init.method && init.method !== 'GET') { if (!headers.has('origin')) headers.set('origin', base); if (!headers.has('referer')) headers.set('referer', `${base}/`); } const res = await fetch(base + route, { ...init, headers }); activeJar.store(res.headers); const contentType = res.headers.get('content-type') || ''; const body = await res.text(); let json = null; if (contentType.includes('application/json')) { try { json = JSON.parse(body); } catch {} } return { route, status: res.status, ok: res.ok, contentType, body, json }; }
function assertStatus(result, statuses, label) { if (!statuses.includes(result.status)) throw new Error(`${label || result.route} expected ${statuses.join('/')} got ${result.status}: ${result.body.slice(0, 300)}`); return { route: result.route, status: result.status, ok: result.ok, label }; }
async function csrf(activeJar=jar) { const res = await request('/api/auth/csrf', {}, activeJar); assertStatus(res, [200], 'csrf'); if (!res.json?.csrfToken) throw new Error('missing csrfToken'); return res.json.csrfToken; }
function headers(token) { return { 'content-type': 'application/json', 'x-csrf-token': token, origin: base, referer: `${base}/` }; }
try {
  let ready = false;
  for (let i=0;i<60;i++) { try { const h = await request('/api/health'); if (h.ok) { ready=true; break; } } catch {} await wait(600); }
  if (!ready) throw new Error(`server_not_ready logs=${logs.slice(-2500)}`);
  const checks = [];
  const adminCsrf = await csrf(jar);
  const adminRegister = await request('/api/auth/register', { method: 'POST', headers: headers(adminCsrf), body: JSON.stringify({ name: 'Smoke Admin', email: 'smoke-admin@example.test', password: 'AdminPass123!', schoolName: 'Trường smoke', departmentName: 'Ban smoke' }) });
  checks.push(assertStatus(adminRegister, [201], 'admin register uses seeded admin membership'));
  if (adminRegister.json?.user?.role !== 'admin') throw new Error(`seeded admin membership did not produce admin session; got ${adminRegister.json?.user?.role}`);
  const activeAdminCsrf = adminRegister.json?.csrfToken || adminCsrf;
  const createInvite = await request('/api/admin/membership-invites', { method: 'POST', headers: headers(activeAdminCsrf), body: JSON.stringify({ role: 'leader', email: 'leader-smoke@example.test', name: 'Leader Smoke', schoolName: 'Trường smoke', departmentName: 'Tổ smoke', expiresInDays: 7 }) });
  checks.push(assertStatus(createInvite, [201], 'admin creates leader invite'));
  const inviteCode = createInvite.json?.invite?.code;
  if (!inviteCode) throw new Error('create invite did not return active invite code.');
  const leaderJar = new CookieJar();
  const leaderCsrf = await csrf(leaderJar);
  const leaderRegister = await request('/api/auth/register', { method: 'POST', headers: headers(leaderCsrf), body: JSON.stringify({ name: 'Leader Smoke', email: 'leader-smoke@example.test', password: 'LeaderPass123!', schoolName: 'Trường smoke', departmentName: 'Tổ smoke', inviteCode }) }, leaderJar);
  checks.push(assertStatus(leaderRegister, [201], 'leader redeem invite during register'));
  if (leaderRegister.json?.user?.role !== 'leader' || !leaderRegister.json?.inviteAccepted) throw new Error('leader invite redeem did not create leader session.');
  const reuseJar = new CookieJar();
  const reuseCsrf = await csrf(reuseJar);
  const reuse = await request('/api/auth/register', { method: 'POST', headers: headers(reuseCsrf), body: JSON.stringify({ name: 'Reuse Smoke', email: 'reuse-smoke@example.test', password: 'ReusePass123!', inviteCode }) }, reuseJar);
  checks.push(assertStatus(reuse, [201], 'reuse redeemed invite downgrades to teacher'));
  if (reuse.json?.user?.role !== 'teacher' || reuse.json?.inviteAccepted) throw new Error('redeemed invite reuse must not create leader/admin privileges.');
  const revokedJar = new CookieJar();
  const revokedCsrf = await csrf(revokedJar);
  const revoked = await request('/api/auth/register', { method: 'POST', headers: headers(revokedCsrf), body: JSON.stringify({ name: 'Revoked Smoke', email: 'revoked-smoke@example.test', password: 'RevokedPass123!', inviteCode: 'invite-revoked-smoke-code' }) }, revokedJar);
  checks.push(assertStatus(revoked, [201], 'revoked invite registers as teacher only'));
  if (revoked.json?.user?.role !== 'teacher' || revoked.json?.inviteAccepted) throw new Error('revoked invite must not create privileged session.');
  const expiredJar = new CookieJar();
  const expiredCsrf = await csrf(expiredJar);
  const expired = await request('/api/auth/register', { method: 'POST', headers: headers(expiredCsrf), body: JSON.stringify({ name: 'Expired Smoke', email: 'expired-smoke@example.test', password: 'ExpiredPass123!', inviteCode: 'invite-expired-smoke-code' }) }, expiredJar);
  checks.push(assertStatus(expired, [201], 'expired invite registers as teacher only'));
  if (expired.json?.user?.role !== 'teacher' || expired.json?.inviteAccepted) throw new Error('expired invite must not create privileged session.');
  const blockedJar = new CookieJar();
  const blockedCsrf = await csrf(blockedJar);
  const blocked = await request('/api/auth/register', { method: 'POST', headers: headers(blockedCsrf), body: JSON.stringify({ name: 'Blocked Role Smoke', email: 'blocked-role-smoke@example.test', password: 'BlockedPass123!', role: 'admin' }) }, blockedJar);
  checks.push(assertStatus(blocked, [201], 'public register role field ignored'));
  if (blocked.json?.user?.role !== 'teacher') throw new Error('public register must ignore role elevation and default to teacher.');
  const loginCsrf = await csrf(blockedJar);
  const login = await request('/api/auth/login', { method: 'POST', headers: headers(loginCsrf), body: JSON.stringify({ email: 'blocked-role-smoke@example.test', password: 'BlockedPass123!', role: 'admin' }) }, blockedJar);
  checks.push(assertStatus(login, [200], 'login requestedRole admin blocked'));
  if (login.json?.effectiveRole !== 'teacher' || !login.json?.privilegedBlocked) throw new Error('login role elevation must be blocked with effectiveRole teacher and privilegedBlocked true.');
  const report = writeArtifact({ ok: true, base, dataDir, serverMode, checks, summary: { checked: checks.length, batch98InviteRuntimeSmoke: true }, noAiPaymentVerifiedFakeAdded: true, note: 'Batch121 auth invite runtime smoke uses next start when raw build artifact exists, prevents orphaned dev servers, and proves invite create/redeem/reuse/revoked/expired plus role self-elevation blocking through HTTP routes with an isolated temp JSON store.' });
  console.log(JSON.stringify(report, null, 2));
  finalExitCode = 0;
} catch (error) {
  const report = writeArtifact({ ok: false, error: 'auth_invite_runtime_smoke_failed', message: error instanceof Error ? error.message : String(error), base, dataDir, serverMode, logs: logs.slice(-5000), noAiPaymentVerifiedFakeAdded: true });
  console.error(JSON.stringify(report, null, 2));
  finalExitCode = 1;
} finally {
  finished = true;
  clearTimeout(timeout);
  killChildTree('SIGTERM');
  setTimeout(() => {
    killChildTree('SIGKILL');
    process.exit(finalExitCode);
  }, 500);
}
