import fs from 'node:fs';

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

const workspace = read('components/workspace.tsx');
const pkg = JSON.parse(read('package.json'));
const issues = [];

const requiredWorkspaceMarkers = [
  '/api/subject-data/review-board',
  '/api/lesson-drafting/profiles',
  '/api/lesson-quality',
  'subjectDataSummary',
  'selectedDraftingProfile',
  'qualityChecklist',
  'Mục tiêu / chế độ',
  'Mức học sinh',
  'Sự thật dữ liệu môn học',
  'Hồ sơ soạn theo lớp/mục tiêu',
  'Checklist chất lượng giáo án',
  'Không tự sinh kiến thức sâu',
  'runQualityCheck',
  'function Badge'
];

for (const marker of requiredWorkspaceMarkers) {
  if (!workspace.includes(marker)) issues.push(`workspace missing marker: ${marker}`);
}

const requiredScripts = ['ui:batch76-validate', 'smoke:batch76', 'verify:batch76'];
for (const script of requiredScripts) {
  if (!pkg.scripts?.[script]) issues.push(`package.json missing script: ${script}`);
}

if (!/^0\.(7|8)\d*\./.test(String(pkg.version || ''))) issues.push(`package.json version should remain in post-Batch76 0.7x/0.8x line, got ${pkg.version}`);

const changedSource = [workspace, read('scripts/validate-batch76-ui-integration-source.mjs')].join('\n');
const disallowed = [
  /from\s+['"]openai['"]/i,
  /from\s+['"]@anthropic/i,
  /from\s+['"]@google\/generative-ai/i,
  /chat\.completions/i,
  /generateContent\s*\(/i,
  /new\s+OpenAI\s*\(/i
];
for (const pattern of disallowed) {
  if (pattern.test(changedSource)) issues.push(`disallowed AI/API marker matched: ${pattern}`);
}

const result = {
  ok: issues.length === 0,
  checkedFiles: ['components/workspace.tsx', 'package.json', 'scripts/validate-batch76-ui-integration-source.mjs'],
  markersChecked: requiredWorkspaceMarkers.length,
  scriptsChecked: requiredScripts,
  issues
};

console.log(JSON.stringify(result, null, 2));
if (issues.length) process.exit(1);
