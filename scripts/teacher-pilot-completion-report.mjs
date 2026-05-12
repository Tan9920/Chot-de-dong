import fs from 'node:fs';

function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''; }
function readJson(file, fallback = {}) { try { return JSON.parse(read(file) || JSON.stringify(fallback)); } catch { return fallback; } }
const pack = readJson('data/teacher-pilot-completion-pack.json', {});
const html = read(pack.offlineArtifact || 'public/teacher-pilot-demo.html');
const registry = readJson('data/subject-data-registry.json', { records: [] });
const fakeVerified = (registry.records || []).filter((item) => ['verified', 'approved_for_release'].includes(item.sourceStatus) || item.contentDepthAllowed);
const hostedArtifact = readJson('artifacts/runtime-hosted-closure-last-run.json', {});
const criteria = pack.completionCriteria || [];
const checks = [
  { id: 'offlineArtifact', ok: fs.existsSync(pack.offlineArtifact || 'public/teacher-pilot-demo.html'), evidence: pack.offlineArtifact || 'public/teacher-pilot-demo.html' },
  { id: 'htmlSafeFrame', ok: html.includes('KẾ HOẠCH BÀI DẠY') && html.includes('Không cần npm/build'), evidence: 'offline HTML contains safe lesson frame markers' },
  { id: 'noFakeVerified', ok: fakeVerified.length === 0, evidence: `${fakeVerified.length} fake verified records` },
  { id: 'hostedRuntimeStillNotClaimed', ok: hostedArtifact.ok !== true, evidence: `runtime-hosted artifact ok=${hostedArtifact.ok}` }
];
const ok = checks.every((item) => item.ok);
const report = {
  ok,
  batch: 'Batch107 — Teacher Pilot Completion Slice',
  generatedAt: new Date().toISOString(),
  completionCriteria: criteria.length,
  checks,
  offlineArtifact: pack.offlineArtifact || 'public/teacher-pilot-demo.html',
  claim: ok
    ? 'Offline teacher demo slice is complete at source/artifact level. Hosted runtime remains guarded.'
    : 'Offline teacher demo slice has issues.',
  warning: 'This report does not prove Next build, live smoke, auth smoke, or hosted URL smoke.'
};
fs.mkdirSync('artifacts', { recursive: true });
fs.writeFileSync('artifacts/teacher-pilot-completion-last-run.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(ok ? 0 : 1);
