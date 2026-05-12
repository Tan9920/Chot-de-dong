import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'data/saved-lessons.json',
  'data/saved-lesson-versions.json',
  'lib/storage.ts',
  'app/api/lessons/route.ts',
  'app/api/lessons/[id]/route.ts',
  'app/api/lessons/[id]/versions/route.ts',
  'components/workspace.tsx',
  'data/product-foundation.json',
  'package.json'
];

const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(root, file)));
const issues = [];

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function parseArray(file) {
  try {
    const parsed = JSON.parse(read(file));
    if (!Array.isArray(parsed)) issues.push(`${file} must be a JSON array`);
  } catch (error) {
    issues.push(`${file} parse failed: ${error.message}`);
  }
}

if (!missing.includes('data/saved-lessons.json')) parseArray('data/saved-lessons.json');
if (!missing.includes('data/saved-lesson-versions.json')) parseArray('data/saved-lesson-versions.json');

const storage = missing.includes('lib/storage.ts') ? '' : read('lib/storage.ts');
const workspace = missing.includes('components/workspace.tsx') ? '' : read('components/workspace.tsx');
const foundation = missing.includes('data/product-foundation.json') ? '' : read('data/product-foundation.json');
const pkg = missing.includes('package.json') ? '' : read('package.json');

for (const marker of ['safeReadJsonArray', 'safeWriteJson', 'saved-lessons.json', 'saved-lesson-versions.json', 'getLessonVersions', 'restoreLessonVersion']) {
  if (!storage.includes(marker)) issues.push(`lib/storage.ts missing marker: ${marker}`);
}
for (const marker of ['/api/lessons', 'JSON persistence', 'localStorage', 'server_json']) {
  if (!workspace.includes(marker)) issues.push(`components/workspace.tsx missing marker: ${marker}`);
}
for (const marker of ['persistenceFoundation', 'json_file_persistence_fallback', 'not a database']) {
  if (!foundation.includes(marker)) issues.push(`data/product-foundation.json missing marker: ${marker}`);
}
if (!pkg.includes('saved-lessons:persistence-validate') || !pkg.includes('smoke:batch71')) {
  issues.push('package.json missing Batch71 persistence scripts');
}

const result = {
  ok: missing.length === 0 && issues.length === 0,
  missing,
  issues,
  checkedFiles: requiredFiles.length,
  note: 'Source-level persistence validation only. Still run typecheck/build/live /api/lessons save-list smoke before claiming runtime-ready.'
};
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
process.exit(0);
