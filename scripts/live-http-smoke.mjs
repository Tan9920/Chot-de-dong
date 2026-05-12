import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';

const nextBin = process.platform === 'win32' ? 'node_modules/.bin/next.cmd' : 'node_modules/.bin/next';
if (!fs.existsSync(nextBin)) {
  console.error(JSON.stringify({
    ok: false,
    error: 'dependencies_missing',
    message: 'Run npm run install:clean successfully before live HTTP smoke. Batch98 refuses to fake runtime proof without Next installed.'
  }, null, 2));
  process.exit(2);
}

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'giao-an-live-smoke-data-'));
for (const file of ['auth-accounts.json','auth-sessions.json','memberships.json','membership-invites.json','saved-lessons.json','saved-lesson-versions.json','security-audit-events.json','usage-ledger.json']) {
  fs.writeFileSync(path.join(dataDir, file), '[]\n', 'utf8');
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'giao-an-live-smoke-npm-'));
const userconfig = path.join(dir, 'npmrc');
fs.writeFileSync(userconfig, [
  'registry=https://registry.npmjs.org/',
  'audit=false',
  'fund=false',
  'progress=false',
  'fetch-retries=1',
  'fetch-timeout=30000',
  ''
].join('\n'));

const smokeEnv = { ...process.env };
for (const key of ['NPM_CONFIG_REGISTRY', 'NPM_CONFIG_USERCONFIG', 'npm_config_registry', 'npm_config_userconfig']) delete smokeEnv[key];
smokeEnv.NPM_CONFIG_USERCONFIG = userconfig;
smokeEnv.npm_config_userconfig = userconfig;
smokeEnv.npm_config_registry = 'https://registry.npmjs.org/';
smokeEnv.npm_config_always_auth = 'false';
smokeEnv.npm_config_fetch_retries = '1';
smokeEnv.npm_config_fetch_timeout = '30000';
smokeEnv.NEXT_PUBLIC_DEMO_MODE ||= 'true';
smokeEnv.GIAOAN_DEMO_MODE ||= 'true';
smokeEnv.GIAOAN_ALLOW_DEMO_LOGIN ||= 'false';
smokeEnv.GIAOAN_DATA_DIR = dataDir;
smokeEnv.NEXT_TELEMETRY_DISABLED = '1';

async function findFreePort(preferred) {
  function tryPort(port) {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.unref();
      server.on('error', () => resolve(false));
      server.listen({ port, host: '127.0.0.1' }, () => {
        const actual = server.address()?.port || port;
        server.close(() => resolve(actual));
      });
    });
  }
  const preferredResult = await tryPort(preferred);
  if (preferredResult) return preferredResult;
  for (let port = 3101; port < 3200; port += 1) {
    const result = await tryPort(port);
    if (result) return result;
  }
  return await tryPort(0);
}

const preferredPort = Number(process.env.PORT || 3100);
const port = Number(await findFreePort(preferredPort));
const smokeBaseHost = process.env.GIAOAN_SMOKE_BASE_HOST || 'localhost';
const base = `http://${smokeBaseHost}:${port}`;
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const hasBuildOutput = fs.existsSync('.next/BUILD_ID');
const requestedMode = process.env.GIAOAN_SMOKE_MODE || 'auto';
const smokeMode = requestedMode === 'dev' ? 'dev' : (requestedMode === 'production' || hasBuildOutput ? 'production' : 'dev');
if (requestedMode === 'production' && !hasBuildOutput) {
  console.error(JSON.stringify({
    ok: false,
    error: 'missing_next_build_output',
    message: 'GIAOAN_SMOKE_MODE=production requires .next/BUILD_ID. Run npm run build:clean first.'
  }, null, 2));
  process.exit(2);
}
const smokeArgs = smokeMode === 'production'
  ? ['run', 'start', '--', '--hostname', '127.0.0.1', '--port', String(port)]
  : ['run', 'dev', '--', '--hostname', '127.0.0.1', '--port', String(port)];
const child = spawn(npm, smokeArgs, { stdio: ['ignore', 'pipe', 'pipe'], env: { ...smokeEnv, PORT: String(port) }, detached: process.platform !== 'win32' });
let logs = '';
child.stdout.on('data', (d) => { logs += String(d); });
function killChildTree(signal = 'SIGTERM') {
  try {
    if (process.platform !== 'win32') process.kill(-child.pid, signal);
    else child.kill(signal);
  } catch {
    try { child.kill(signal); } catch {}
  }
}
child.stderr.on('data', (d) => { logs += String(d); });

function wait(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function readSetCookies(headers) {
  if (typeof headers.getSetCookie === 'function') return headers.getSetCookie();
  const raw = headers.get('set-cookie');
  return raw ? [raw] : [];
}
class CookieJar {
  constructor() { this.cookies = new Map(); }
  store(headers) {
    for (const item of readSetCookies(headers)) {
      for (const part of String(item).split(/,(?=\s*[^;,]+=)/)) {
        const pair = part.split(';')[0]?.trim();
        if (!pair || !pair.includes('=')) continue;
        const [name, ...rest] = pair.split('=');
        this.cookies.set(name, rest.join('='));
      }
    }
  }
  header() { return [...this.cookies.entries()].map(([name, value]) => `${name}=${value}`).join('; '); }
}
const jar = new CookieJar();
async function request(route, init = {}) {
  const headers = new Headers(init.headers || {});
  if (jar.header()) headers.set('cookie', jar.header());
  if (init.method && init.method !== 'GET') {
    if (!headers.has('origin')) headers.set('origin', base);
    if (!headers.has('referer')) headers.set('referer', `${base}/`);
  }
  const res = await fetch(base + route, { ...init, headers });
  jar.store(res.headers);
  const contentType = res.headers.get('content-type') || '';
  const arrayBuffer = await res.arrayBuffer();
  const text = Buffer.from(arrayBuffer).toString('utf8');
  let json = null;
  if (contentType.includes('application/json')) {
    try { json = JSON.parse(text); } catch { json = null; }
  }
  return { route, status: res.status, ok: res.ok, contentType, bytes: arrayBuffer.byteLength, text, json };
}
function assertOk(result, expect = {}) {
  const expectedStatuses = expect.statuses || [200];
  if (!expectedStatuses.includes(result.status)) throw new Error(`${result.route} expected ${expectedStatuses.join('/')} got ${result.status}: ${result.text.slice(0, 300)}`);
  if (expect.jsonKey && !result.json?.[expect.jsonKey]) throw new Error(`${result.route} missing JSON key ${expect.jsonKey}: ${result.text.slice(0, 300)}`);
  if (expect.contentTypeIncludes && !result.contentType.includes(expect.contentTypeIncludes)) throw new Error(`${result.route} expected content-type containing ${expect.contentTypeIncludes}, got ${result.contentType}`);
  if (expect.minBytes && result.bytes < expect.minBytes) throw new Error(`${result.route} returned only ${result.bytes} bytes`);
  return { route: result.route, status: result.status, contentType: result.contentType, bytes: result.bytes, ok: true };
}
function assertMetadataStarterSnapshot(result) {
  const starter = result.json?.summary?.starterCatalog || result.json?.contentOverview?.starterCatalog;
  const truth = result.json?.summary?.subjectDataTruth || result.json?.contentOverview?.subjectDataTruth;
  const catalog = result.json?.curriculum;
  if (!starter) throw new Error('/api/metadata missing starterCatalog snapshot.');
  if (starter.gradeCount !== 12) throw new Error(`/api/metadata starterCatalog.gradeCount expected 12 got ${starter.gradeCount}`);
  if (starter.subjectScopeCount < 100) throw new Error(`/api/metadata starterCatalog.subjectScopeCount too low: ${starter.subjectScopeCount}`);
  if (starter.topicCount < 300) throw new Error(`/api/metadata starterCatalog.topicCount too low: ${starter.topicCount}`);
  if (starter.contentDepthAllowed !== false) throw new Error('/api/metadata starterCatalog.contentDepthAllowed must remain false for starter data.');
  if (!truth || truth.deepContentAllowedRecords !== 0) throw new Error(`/api/metadata subjectDataTruth.deepContentAllowedRecords must be 0, got ${truth?.deepContentAllowedRecords}`);
  const grade1 = catalog?.grades?.['1'];
  const hasGradeOneTopics = grade1 && Object.values(grade1.subjects || {}).some((subject) => Object.values(subject.books || {}).some((book) => Object.keys(book.topics || {}).length > 0));
  if (!hasGradeOneTopics) throw new Error('/api/metadata curriculum must expose starter topics for grade 1.');
  return { route: result.route, status: result.status, contentType: result.contentType, bytes: result.bytes, ok: true, starterCatalog: { gradeCount: starter.gradeCount, subjectScopeCount: starter.subjectScopeCount, topicCount: starter.topicCount, contentDepthAllowed: starter.contentDepthAllowed }, deepContentAllowedRecords: truth.deepContentAllowedRecords, batch93MetadataStarterSmoke: true };
}
let finalExitCode = 0;

function writeSmokeArtifact(report) {
  const artifact = {
    ...report,
    generatedAt: new Date().toISOString(),
    artifact: 'artifacts/live-http-smoke-last-run.json'
  };
  fs.mkdirSync('artifacts', { recursive: true });
  fs.writeFileSync('artifacts/live-http-smoke-last-run.json', JSON.stringify(artifact, null, 2) + '\n', 'utf8');
  return artifact;
}
const sampleLesson = {
  title: 'Smoke test Lesson Design Studio', level: 'Tiểu học', grade: '1', subject: 'Tiếng Việt', book: 'Nguồn giáo viên tự nhập', topic: 'Bài smoke test', template: 'Kế hoạch bài dạy', duration: '35 phút', learnerProfile: 'standard', designMode: 'standard', lessonIntent: 'new_lesson', classSize: 'standard', deviceAccess: 'teacher_only', space: 'regular_room', content: 'Đây là nội dung smoke test an toàn. Giáo viên phải thay bằng nội dung bài học thật từ nguồn hợp pháp trước khi dùng chính thức.', lessonStatus: 'draft', status: 'draft', sourceStatus: 'scaffold', supportLevel: 'starter'
};
try {
  let ready = false;
  for (let i = 0; i < 60; i += 1) {
    try { const health = await request('/api/health'); if (health.ok) { ready = true; break; } } catch {}
    await wait(600);
  }
  if (!ready) throw new Error(`server_not_ready logs=${logs.slice(-2500)}`);
  const checks = [];
  for (const [route, expect = {}] of [
    ['/api/health'], ['/api/demo/readiness'], ['/api/demo/basic-flow'], ['/api/demo/launch-gate'], ['/api/product/foundation'], ['/api/operating/foundation'], ['/api/operating/usage'], ['/api/lesson-design/studio?grade=1&subject=Ti%E1%BA%BFng%20Vi%E1%BB%87t&topic=B%C3%A0i%20smoke%20test&designMode=standard&lessonIntent=new_lesson', { jsonKey: 'studio' }], ['/api/subject-data/review-board'], ['/api/lesson-drafting/profiles?grade=1']
  ]) checks.push(assertOk(await request(route), expect));
  checks.push(assertMetadataStarterSnapshot(await request('/api/metadata')));
  const csrf = await request('/api/auth/csrf');
  checks.push(assertOk(csrf, { jsonKey: 'csrfToken' }));
  const csrfToken = csrf.json?.csrfToken;
  const postHeaders = { 'content-type': 'application/json', 'x-csrf-token': csrfToken, origin: base, referer: `${base}/` };
  checks.push(assertOk(await request('/api/template-builder', { method: 'POST', headers: postHeaders, body: JSON.stringify(sampleLesson) }), { jsonKey: 'bundle' }));
  checks.push(assertOk(await request('/api/lesson-design/studio', { method: 'POST', headers: postHeaders, body: JSON.stringify(sampleLesson) }), { jsonKey: 'studio' }));
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const register = await request('/api/auth/register', { method: 'POST', headers: postHeaders, body: JSON.stringify({ name: 'Smoke Teacher', email: `smoke-${unique}@example.test`, password: 'SmokePass123!', schoolName: 'Trường smoke', departmentName: 'Tổ smoke' }) });
  checks.push(assertOk(register, { statuses: [201], jsonKey: 'user' }));
  if (register.json?.user?.role !== 'teacher' || !register.json?.user?.authAccountId) throw new Error('Batch98 live smoke register must create a real teacher account session with authAccountId.');
  checks.push(assertOk(await request('/api/auth/me'), { jsonKey: 'user' }));
  const accountCsrfToken = register.json?.csrfToken || (await request('/api/auth/csrf')).json?.csrfToken;
  const accountPostHeaders = { 'content-type': 'application/json', 'x-csrf-token': accountCsrfToken, origin: base, referer: `${base}/` };
  const saved = await request('/api/lessons', { method: 'POST', headers: accountPostHeaders, body: JSON.stringify(sampleLesson) });
  checks.push(assertOk(saved, { statuses: [201], jsonKey: 'item' }));
  const lessonId = saved.json?.item?.id;
  if (!lessonId) throw new Error('/api/lessons did not return saved lesson id.');
  checks.push(assertOk(await request('/api/export/docx', { method: 'POST', headers: accountPostHeaders, body: JSON.stringify({ lessonId }) }), { contentTypeIncludes: 'wordprocessingml.document', minBytes: 500 }));
  checks.push(assertOk(await request('/api/export/pdf', { method: 'POST', headers: accountPostHeaders, body: JSON.stringify({ lessonId }) }), { contentTypeIncludes: 'application/pdf', minBytes: 300 }));
  const successArtifact = writeSmokeArtifact({ ok: true, checks, sanitizedNpmRegistry: smokeEnv.npm_config_registry, smokeMode, port, base, dataDir, batch98RealAccountSaveExportSmoke: true, note: 'Batch98 live smoke uses a real registered teacher account before saving and exporting. Browser/mobile QA remains separate.' });
  console.log(JSON.stringify(successArtifact, null, 2));
  finalExitCode = 0;
} catch (error) {
  const failureArtifact = writeSmokeArtifact({ ok: false, error: 'live_http_smoke_failed', message: error instanceof Error ? error.message : String(error), smokeMode, port, base, dataDir, logs: logs.slice(-5000) });
  console.error(JSON.stringify(failureArtifact, null, 2));
  finalExitCode = 1;
} finally {
  killChildTree('SIGTERM');
  setTimeout(() => {
    killChildTree('SIGKILL');
    process.exit(finalExitCode);
  }, 500);
}
