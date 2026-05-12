import fs from 'node:fs';
import path from 'node:path';

function read(file, fallback = '') {
  try { return fs.readFileSync(file, 'utf8'); } catch { return fallback; }
}
function readJson(file, fallback = {}) {
  try { return JSON.parse(read(file) || JSON.stringify(fallback)); } catch { return fallback; }
}
const pkg = readJson('package.json');
const catalog = readJson('data/teacher-pilot-topic-picker-catalog.json', { grades: [] });
const html = read('public/teacher-pilot-demo.html');
const registry = readJson('data/subject-data-registry.json', { records: [] });
const grade5 = (catalog.grades || []).find((g) => String(g.grade) === '5');
const tv = (grade5?.subjects || []).find((s) => s.subject === 'Tiếng Việt');
const math = (grade5?.subjects || []).find((s) => s.subject === 'Toán');
const tvHasFraction = JSON.stringify(tv || {}).toLowerCase().includes('phân số');
const mathHasFraction = JSON.stringify(math || {}).toLowerCase().includes('phân số');
const fakeVerified = (registry.records || []).filter((item) => ['verified','approved_for_release'].includes(item.sourceStatus) || item.contentDepthAllowed);
const checks = [
  { id: 'version', ok: ['0.108.0','0.109.0','0.110.0'].includes(pkg.version) },
  { id: 'offline_html_exists', ok: fs.existsSync('public/teacher-pilot-demo.html') },
  { id: 'catalog_exists', ok: fs.existsSync('data/teacher-pilot-topic-picker-catalog.json') },
  { id: 'html_batch108', ok: html.includes('Batch108') && html.includes('Không cần npm/build') },
  { id: 'no_manual_verified_select', ok: !html.includes('<select id="source"') && html.includes('không cho tự chọn verified') },
  { id: 'fraction_only_math', ok: mathHasFraction && !tvHasFraction },
  { id: 'no_fake_verified', ok: fakeVerified.length === 0 },
  { id: 'no_ai', ok: !JSON.stringify(pkg).toLowerCase().includes('openai') && !JSON.stringify(pkg).toLowerCase().includes('@anthropic-ai/sdk') }
];
const report = {
  ok: checks.every((item) => item.ok),
  batch: 'Batch108 — Teacher Topic Picker & Data Label Safety Upgrade',
  packageVersion: pkg.version,
  generatedAt: new Date().toISOString(),
  offlineArtifact: 'public/teacher-pilot-demo.html',
  grade5VietnameseTopics: (tv?.topics || []).map((t) => t.title),
  grade5MathTopics: (math?.topics || []).map((t) => t.title),
  checks,
  fakeVerifiedRecords: fakeVerified.length,
  note: 'Batch108 fixes teacher input UX: subject/topic dropdown, no Tiếng Việt + Phân số, no manual verified. It does not prove hosted runtime pass.'
};
fs.mkdirSync('artifacts', { recursive: true });
fs.writeFileSync(path.join('artifacts', 'teacher-topic-picker-last-run.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
