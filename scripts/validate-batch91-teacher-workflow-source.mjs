import fs from 'node:fs';

const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
const readJson = (file) => JSON.parse(read(file) || '{}');
const issues = [];
const pkg = readJson('package.json');
const workspace = read('components/workspace.tsx');
const css = read('app/globals.css');
const notes = read('BATCH91_NOTES.md');
const guide = read('docs/BATCH91_TEACHER_WORKFLOW_GUARD.md');
const registry = read('scripts/run-source-validators.mjs');

function requireFile(file) { if (!fs.existsSync(file)) issues.push(`missing file: ${file}`); }
function requireMarker(label, text, marker) { if (!text.includes(marker)) issues.push(`${label} missing marker: ${marker}`); }
function requireNotMarker(label, text, marker) { if (text.includes(marker)) issues.push(`${label} contains forbidden marker: ${marker}`); }

for (const file of [
  'components/workspace.tsx',
  'scripts/validate-batch91-teacher-workflow-source.mjs',
  'docs/BATCH91_TEACHER_WORKFLOW_GUARD.md',
  'BATCH91_NOTES.md'
]) requireFile(file);

if (!['0.91.0', '0.92.0', '0.93.0', '0.94.0', '0.95.0', '0.96.0', '0.97.0', '0.98.0','0.100.0','0.101.0','0.102.0','0.103.0'].includes(pkg.version)) issues.push(`package.json version must be 0.91.0 or 0.92.0, got ${pkg.version}`);
for (const scriptName of ['teacher-workflow:validate', 'smoke:batch91', 'verify:batch91']) {
  if (!pkg.scripts?.[scriptName]) issues.push(`package.json missing script ${scriptName}`);
}

for (const marker of [
  'activeTabGuide',
  'Đi bước tiếp theo',
  'Starter data 1–12',
  'starterDataChecklist',
  'Chưa có nội dung để sửa',
  'Quay về Soạn bài',
  'Chế độ khuyên dùng khi dữ liệu mới ở mức starter',
  "grade: item.grade || '1'",
  "book: item.book || 'Nguồn giáo viên tự nhập'",
  'pb-[calc(0.5rem+env(safe-area-inset-bottom))]'
]) requireMarker('components/workspace.tsx', workspace, marker);

for (const marker of ['Batch91 teacher workflow guard', 'teacher-step-cue']) requireMarker('app/globals.css', css, marker);
for (const marker of ['Batch91', 'teacher workflow guard', 'dữ liệu đang đứng im', 'không thêm dữ liệu học thuật', 'không thêm AI', 'không production-ready']) requireMarker('BATCH91_NOTES.md', notes, marker);
for (const marker of ['BATCH91 TEACHER WORKFLOW GUARD', 'data-paused', 'mobile step cue', 'empty editor state', 'khung an toàn']) requireMarker('docs/BATCH91_TEACHER_WORKFLOW_GUARD.md', guide, marker);
for (const marker of ['validate-batch91-teacher-workflow-source.mjs', 'teacher-workflow:validate', 'verify:batch91']) requireMarker('scripts/run-source-validators.mjs', registry, marker);

for (const forbidden of ['openai', '@google/generative-ai', '@anthropic-ai/sdk', 'langchain']) requireNotMarker('package.json', JSON.stringify(pkg), forbidden);

const result = {
  ok: issues.length === 0,
  issues,
  checked: {
    packageVersion: pkg.version,
    hasMobileStepCue: workspace.includes('activeTabGuide') && workspace.includes('Đi bước tiếp theo'),
    hasDataPausedGuard: workspace.includes('Starter data 1–12') && workspace.includes('starterDataChecklist'),
    hasEmptyEditorState: workspace.includes('Chưa có nội dung để sửa') && workspace.includes('Quay về Soạn bài'),
    hasSaferFallbackDefaults: workspace.includes("grade: item.grade || '1'") && workspace.includes("book: item.book || 'Nguồn giáo viên tự nhập'")
  },
  note: 'Batch91 source validator checks teacher workflow guard at source level. It does not prove Vercel build, mobile browser QA, DOCX/PDF runtime export, or real teacher feedback.'
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
