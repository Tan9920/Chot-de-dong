import fs from 'node:fs';
import path from 'node:path';
function read(file, fallback = '') { try { return fs.readFileSync(file, 'utf8'); } catch { return fallback; } }
function readJson(file, fallback = {}) { try { return JSON.parse(read(file) || JSON.stringify(fallback)); } catch { return fallback; } }
const pkg = readJson('package.json');
const policy = readJson('data/teacher-pilot-print-export-policy.json');
const html = read(policy.offlineArtifact || 'public/teacher-pilot-demo.html');
const registry = readJson('data/subject-data-registry.json', { records: [] });
const fakeVerified = (registry.records || []).filter((item) => ['verified','approved_for_release'].includes(item.sourceStatus) || item.contentDepthAllowed);
const checks = [
  { id: 'version', ok: ['0.109.0','0.110.0'].includes(pkg.version) },
  { id: 'offline_html_exists', ok: fs.existsSync(policy.offlineArtifact || 'public/teacher-pilot-demo.html') },
  { id: 'print_css_exists', ok: html.includes('@media print') },
  { id: 'download_txt_exists', ok: html.includes('Tải TXT') && html.includes('downloadFile') },
  { id: 'download_html_exists', ok: html.includes('downloadHtml') && html.includes('Tải HTML in được') },
  { id: 'browser_print_exists', ok: html.includes('printLesson') && html.includes('window.print') },
  { id: 'batch108_guard_preserved', ok: html.includes('Phân số chỉ hiện khi chọn Toán') && html.includes('không cho tự chọn verified') },
  { id: 'no_fake_verified', ok: fakeVerified.length === 0 },
  { id: 'no_ai', ok: !JSON.stringify(pkg).toLowerCase().includes('openai') && !JSON.stringify(pkg).toLowerCase().includes('@anthropic-ai/sdk') },
  { id: 'no_runtime_overclaim', ok: html.includes('chưa phải hosted/runtime pass') || html.includes('Hosted/runtime vẫn chưa') }
];
const report = {
  ok: checks.every((item) => item.ok),
  batch: 'Batch109/110 — Offline Print Export preserved under Curriculum Matrix upgrade',
  packageVersion: pkg.version,
  policyVersion: policy.version,
  generatedAt: new Date().toISOString(),
  offlineArtifact: policy.offlineArtifact || 'public/teacher-pilot-demo.html',
  exportModes: policy.exportModes || [],
  teacherFacingChecklist: policy.teacherFacingChecklist || [],
  checks,
  fakeVerifiedRecords: fakeVerified.length,
  claimPolicy: policy.claimPolicy,
  note: 'This report proves source/offline export affordances only. It does not prove server-side DOCX/PDF, npm install, Next build, production live smoke, auth smoke, or hosted URL smoke.'
};
fs.mkdirSync('artifacts', { recursive: true });
fs.writeFileSync(path.join('artifacts', 'teacher-print-export-last-run.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
