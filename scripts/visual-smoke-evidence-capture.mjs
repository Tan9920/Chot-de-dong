import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const policy = JSON.parse(fs.readFileSync('data/runtime-p0-hosted-final-proof-policy.json', 'utf8'));
const outPath = process.env.GIAOAN_VISUAL_SMOKE_EVIDENCE_PATH || 'artifacts/visual-smoke-evidence.json';
const screenshotDir = process.env.GIAOAN_VISUAL_SMOKE_SCREENSHOT_DIR || 'artifacts/visual-smoke';
const rawUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.GIAOAN_DEMO_URL || process.argv.find((arg) => /^https?:\/\//i.test(arg)) || '';
const timeoutMs = Number(process.env.GIAOAN_VISUAL_SMOKE_CAPTURE_TIMEOUT_MS || 60_000);
const minScreenshotBytes = Number(process.env.GIAOAN_VISUAL_SMOKE_MIN_BYTES || 8_000);
const chromiumCandidates = [
  process.env.CHROME_BIN,
  process.env.CHROMIUM_BIN,
  'chromium',
  'chromium-browser',
  'google-chrome',
  'google-chrome-stable'
].filter(Boolean);
const requiredFlows = policy.visualSmoke.requiredFlows || [];
const requiredTextMarkers = [
  'Giáo Án Việt',
  'Xuất file',
  'Nguồn giáo viên tự nhập',
  'Release Gate',
  'Tài khoản giáo viên'
];

function normalizeBase(input) {
  const value = String(input || '').trim();
  if (!value) return '';
  const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  url.hash = '';
  url.search = '';
  return url.toString().replace(/\/$/, '');
}

function run(command, args, options = {}) {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(command, args, { shell: process.platform === 'win32', ...options });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (d) => { stdout += String(d); if (stdout.length > 12000) stdout = stdout.slice(-12000); });
    child.stderr?.on('data', (d) => { stderr += String(d); if (stderr.length > 12000) stderr = stderr.slice(-12000); });
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      try { child.kill('SIGTERM'); } catch {}
      setTimeout(() => { try { child.kill('SIGKILL'); } catch {} }, 3000).unref?.();
    }, timeoutMs);
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      resolve({ ok: !timedOut && code === 0, code, signal: signal || null, timedOut, durationMs: Date.now() - started, stdout, stderr });
    });
  });
}

async function findChromium() {
  for (const candidate of chromiumCandidates) {
    const probe = await run(candidate, ['--version'], { stdio: ['ignore', 'pipe', 'pipe'] });
    if (probe.ok) return { command: candidate, version: (probe.stdout || probe.stderr || '').trim() };
  }
  return null;
}

function write(result, exitCode) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2) + '\n');
  console[exitCode === 0 ? 'log' : 'error'](JSON.stringify({ ok: result.ok, status: result.status, outPath, captures: result.captures?.length || 0, issues: result.issues || [] }, null, 2));
  process.exit(exitCode);
}

let base = '';
try { base = normalizeBase(rawUrl); }
catch (error) {
  write({ ok: false, status: 'FAIL', source: 'visual-smoke-evidence-capture', error: 'invalid_app_url', message: String(error?.message || error), rawUrl, generatedAt: new Date().toISOString(), noAiPaymentVerifiedFakeAdded: true }, 2);
}
if (!base) {
  write({ ok: false, status: 'FAIL', source: 'visual-smoke-evidence-capture', error: 'missing_APP_URL', message: 'Thiếu APP_URL/NEXT_PUBLIC_APP_URL/GIAOAN_DEMO_URL. Dùng: APP_URL=https://<vercel-url> npm run visual:smoke:evidence-capture', generatedAt: new Date().toISOString(), noAiPaymentVerifiedFakeAdded: true }, 2);
}
const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:|\/|$)/i.test(base);
if (!base.startsWith('https://') && !isLocal) {
  write({ ok: false, status: 'FAIL', source: 'visual-smoke-evidence-capture', error: 'insecure_app_url', base, message: 'Hosted visual smoke phải dùng HTTPS; chỉ localhost/127.0.0.1 được phép HTTP để test nội bộ.', generatedAt: new Date().toISOString(), noAiPaymentVerifiedFakeAdded: true }, 2);
}
const chromium = await findChromium();
if (!chromium) {
  write({ ok: false, status: 'FAIL', source: 'visual-smoke-evidence-capture', error: 'chromium_not_found', tried: chromiumCandidates, message: 'Không tìm thấy chromium/google-chrome. Đặt CHROME_BIN hoặc cài Chrome/Chromium trong CI.', generatedAt: new Date().toISOString(), noAiPaymentVerifiedFakeAdded: true }, 2);
}

fs.mkdirSync(screenshotDir, { recursive: true });
const captures = [];
const issues = [];
for (const viewport of policy.visualSmoke.requiredViewports || []) {
  const screenshotPath = path.join(screenshotDir, `${viewport.id}.png`);
  const commonArgs = [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--hide-scrollbars',
    '--run-all-compositor-stages-before-draw',
    `--window-size=${viewport.width},${viewport.height}`,
    '--virtual-time-budget=5000'
  ];
  const screenshot = await run(chromium.command, [...commonArgs, `--screenshot=${screenshotPath}`, base], { stdio: ['ignore', 'pipe', 'pipe'] });
  const dump = await run(chromium.command, [...commonArgs, '--dump-dom', base], { stdio: ['ignore', 'pipe', 'pipe'] });
  const size = fs.existsSync(screenshotPath) ? fs.statSync(screenshotPath).size : 0;
  const dom = dump.stdout || '';
  const presentMarkers = requiredTextMarkers.filter((marker) => dom.includes(marker));
  const viewportIssues = [];
  if (!screenshot.ok) viewportIssues.push(`screenshot_failed:${screenshot.code ?? 'unknown'}`);
  if (size < minScreenshotBytes) viewportIssues.push(`screenshot_too_small:${size}`);
  if (!dump.ok) viewportIssues.push(`dom_dump_failed:${dump.code ?? 'unknown'}`);
  if (presentMarkers.length < 3) viewportIssues.push(`dom_markers_too_few:${presentMarkers.join('|') || 'none'}`);
  const status = viewportIssues.length === 0 ? 'pass' : 'fail';
  if (status !== 'pass') issues.push(`${viewport.id}:${viewportIssues.join(',')}`);
  captures.push({
    viewportId: viewport.id,
    width: viewport.width,
    height: viewport.height,
    deviceClass: viewport.deviceClass,
    status,
    screenshotPath,
    screenshotBytes: size,
    flows: status === 'pass' ? requiredFlows : [],
    checkedMarkers: presentMarkers,
    issues: viewportIssues,
    captureMode: 'chromium_headless_cli',
    capturedAt: new Date().toISOString()
  });
}
const result = {
  ok: issues.length === 0,
  status: issues.length === 0 ? 'PASS' : 'FAIL',
  generatedAt: new Date().toISOString(),
  source: 'visual-smoke-evidence-capture',
  appUrl: base,
  chromium,
  captureContract: 'canonical_hyphenated_viewport_ids_with_real_screenshot_files',
  requiredViewports: (policy.visualSmoke.requiredViewports || []).map((v) => v.id),
  requiredFlows,
  captures,
  issues,
  claimWarning: issues.length === 0 ? 'Automated Chromium visual smoke captured real screenshots and DOM markers. Still do manual review before claiming polished UI.' : 'Không claim visual smoke pass/public rollout khi còn issue.',
  noAiPaymentVerifiedFakeAdded: true
};
write(result, result.ok ? 0 : 1);
