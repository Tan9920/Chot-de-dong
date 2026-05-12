import fs from 'node:fs';

const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
const readJson = (file) => JSON.parse(read(file) || '{}');
const issues = [];
const pkg = readJson('package.json');
const registry = readJson('data/subject-data-registry.json');
const catalog = readJson('data/starter-curriculum-catalog.json');
const activities = readJson('data/activity-game-library.json');
const subjectTruth = read('lib/subject-data-truth.ts');
const starterLib = read('lib/starter-curriculum-catalog.ts');
const repository = read('lib/content-repository.ts');
const workspace = read('components/workspace.tsx');
const notes = read('BATCH92_NOTES.md');
const guide = read('docs/BATCH92_STARTER_DATA_EXPANSION.md');
const sourceRegistry = read('scripts/run-source-validators.mjs');

function requireFile(file) { if (!fs.existsSync(file)) issues.push(`missing file: ${file}`); }
function requireMarker(label, text, marker) { if (!text.includes(marker)) issues.push(`${label} missing marker: ${marker}`); }
function requireNotMarker(label, text, marker) { if (text.includes(marker)) issues.push(`${label} contains forbidden marker: ${marker}`); }

for (const file of [
  'data/starter-curriculum-catalog.json',
  'lib/starter-curriculum-catalog.ts',
  'scripts/validate-batch92-starter-data-expansion-source.mjs',
  'docs/BATCH92_STARTER_DATA_EXPANSION.md',
  'BATCH92_NOTES.md'
]) requireFile(file);

if (!['0.92.0', '0.93.0', '0.94.0', '0.95.0', '0.96.0', '0.97.0', '0.98.0','0.100.0','0.101.0','0.102.0','0.103.0'].includes(pkg.version)) issues.push(`package.json version must remain compatible with Batch92+ starter data, got ${pkg.version}`);
for (const scriptName of ['starter-data:validate', 'smoke:batch92', 'verify:batch92']) {
  if (!pkg.scripts?.[scriptName]) issues.push(`package.json missing script ${scriptName}`);
}

const gradeCount = new Set((registry.records || []).map((item) => item.grade)).size;
const subjectScopes = registry.records || [];
const starterGrades = catalog.grades || [];
const starterSubjectScopes = starterGrades.flatMap((grade) => grade.subjects || []);
const starterTopics = starterSubjectScopes.flatMap((subject) => subject.topics || []);
if (gradeCount !== 12) issues.push(`registry must cover 12 grades, got ${gradeCount}`);
if (starterGrades.length !== 12) issues.push(`starter catalog must cover 12 grades, got ${starterGrades.length}`);
if (starterSubjectScopes.length < 100) issues.push(`starter catalog subject scope count too low: ${starterSubjectScopes.length}`);
if (starterTopics.length < 300) issues.push(`starter topic count too low: ${starterTopics.length}`);

const unsafeUpgrade = subjectScopes.filter((item) => item.sourceStatus === 'reviewed' || item.sourceStatus === 'verified' || item.sourceStatus === 'approved_for_release' || item.contentDepthAllowed || item.approvedReferenceCount > 0 || item.casioAllowed);
if (unsafeUpgrade.length) issues.push(`starter batch must not create reviewed/verified/deep-content records: ${unsafeUpgrade.slice(0, 5).map((item) => item.id).join(', ')}`);
const notDevelopingSeed = subjectScopes.filter((item) => item.sourceStatus !== 'seed' || item.supportLevel !== 'developing' || item.safeLessonMode !== 'starter_topic_frame_only');
if (notDevelopingSeed.length) issues.push(`registry records must be seed/developing starter_topic_frame_only, sample: ${notDevelopingSeed.slice(0, 5).map((item) => item.id).join(', ')}`);

for (const marker of [
  'getStarterTopicTitles',
  'getStarterCurriculumStats',
  'starterCatalog',
  'starter_topic_frame_only'
]) requireMarker('lib/subject-data-truth.ts', subjectTruth, marker);
for (const marker of ['listStarterCurriculumTopics', 'getStarterTopicTitles', 'contentDepthAllowed']) requireMarker('lib/starter-curriculum-catalog.ts', starterLib, marker);
for (const marker of ['starterCatalog: getStarterCurriculumStats()', 'starterTopics', 'Có starter topics để chọn khi test']) requireMarker('lib/content-repository.ts', repository, marker);
for (const marker of ['Starter data 1–12', 'starterDataChecklist', 'seed/developing', 'chọn được nhiều hơn nhưng chưa verified']) requireMarker('components/workspace.tsx', workspace, marker);
for (const marker of ['Batch92', 'starter data expansion', '402 starter topics', 'không nâng reviewed/verified', 'không thêm AI']) requireMarker('BATCH92_NOTES.md', notes, marker);
for (const marker of ['BATCH92 STARTER DATA EXPANSION', 'starter topic catalog', 'seed/developing', 'contentDepthAllowed=false']) requireMarker('docs/BATCH92_STARTER_DATA_EXPANSION.md', guide, marker);
for (const marker of ['validate-batch92-starter-data-expansion-source.mjs', 'starter-data:validate', 'verify:batch92']) requireMarker('scripts/run-source-validators.mjs', sourceRegistry, marker);

if (!Array.isArray(activities) || activities.length < 12) issues.push(`activity-game-library should contain at least 12 starter activities, got ${Array.isArray(activities) ? activities.length : 'not-array'}`);
for (const forbidden of ['openai', '@google/generative-ai', '@anthropic-ai/sdk', 'langchain']) requireNotMarker('package.json', JSON.stringify(pkg), forbidden);

const result = {
  ok: issues.length === 0,
  issues,
  checked: {
    packageVersion: pkg.version,
    registryVersion: registry.version,
    registryRecords: subjectScopes.length,
    registryGradeCount: gradeCount,
    starterCatalogVersion: catalog.version,
    starterGrades: starterGrades.length,
    starterSubjectScopes: starterSubjectScopes.length,
    starterTopics: starterTopics.length,
    activities: Array.isArray(activities) ? activities.length : 0,
    reviewedOrVerifiedCreated: unsafeUpgrade.length,
    contentDepthAllowedRecords: subjectScopes.filter((item) => item.contentDepthAllowed).length
  },
  note: 'Batch92 validates starter data expansion at source level. It proves JSON/catalog wiring and safety labels, not academic verification or live runtime/build.'
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
