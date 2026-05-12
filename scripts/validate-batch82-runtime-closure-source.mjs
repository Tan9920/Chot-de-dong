import fs from 'node:fs';

const requiredFiles = [
  'scripts/live-http-smoke.mjs',
  'scripts/clean-npm-ci.mjs',
  'scripts/clean-npm-command.mjs',
  'scripts/check-next-swc-ready.mjs',
  'app/api/auth/csrf/route.ts',
  'app/api/template-builder/route.ts',
  'app/api/lesson-design/studio/route.ts',
  'app/api/export/docx/route.ts',
  'app/api/export/pdf/route.ts',
  'BATCH82_NOTES.md'
];

const issues = [];
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) issues.push(`missing file ${file}`);
}

function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''; }
const liveSmoke = read('scripts/live-http-smoke.mjs');
const exportSavedLesson = read('lib/export-saved-lesson.ts');
if (!exportSavedLesson.includes('teacherFinalReviewRequired')) issues.push('export compliance packet missing teacherFinalReviewRequired marker');
const packageJson = JSON.parse(read('package.json') || '{}');
const runSource = read('scripts/run-source-validators.mjs');
const notes = read('BATCH82_NOTES.md');

const liveMarkers = [
  '/api/metadata',
  '/api/template-builder',
  '/api/lesson-design/studio',
  '/api/operating/foundation',
  '/api/operating/usage',
  '/api/export/docx',
  '/api/export/pdf',
  '/api/auth/csrf',
  'x-csrf-token',
  'dependencies_missing',
  'wordprocessingml.document',
  'application/pdf'
];
for (const marker of liveMarkers) {
  if (!liveSmoke.includes(marker)) issues.push(`live smoke missing marker ${marker}`);
}

const requiredScripts = [
  'runtime:closure-validate',
  'smoke:batch82',
  'verify:batch82',
  'install:clean',
  'next:swc-ready',
  'build:clean',
  'live:smoke:clean'
];
for (const script of requiredScripts) {
  if (!packageJson.scripts?.[script]) issues.push(`package.json missing script ${script}`);
}

if (!runSource.includes('validate-batch82-runtime-closure-source.mjs')) issues.push('source validator registry missing Batch82 validator');
for (const marker of ['không fake runtime proof', 'không production-ready', 'CSRF-protected POST']) {
  if (!notes.includes(marker)) issues.push(`BATCH82_NOTES missing marker ${marker}`);
}

const result = {
  ok: issues.length === 0,
  checkedAt: new Date().toISOString(),
  issues,
  note: 'Batch82 source validator checks runtime closure harness and live smoke coverage. It does not prove install/build/live smoke pass without dependencies and server runtime.'
};
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
