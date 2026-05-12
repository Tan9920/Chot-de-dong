import fs from 'fs';

const issues = [];
const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
const requireFile = (file) => { if (!fs.existsSync(file)) issues.push(`Missing file: ${file}`); };
const requireMarker = (file, marker, label = marker) => {
  if (!read(file).includes(marker)) issues.push(`${file} missing marker: ${label}`);
};

const files = [
  'data/lesson-drafting-profiles.json',
  'lib/lesson-drafting-profile.ts',
  'lib/generator.ts',
  'lib/lesson-quality-checklist.ts',
  'app/api/lesson-drafting/profiles/route.ts',
  'package.json'
];
files.forEach(requireFile);

let profiles = null;
try { profiles = JSON.parse(read('data/lesson-drafting-profiles.json')); } catch (error) { issues.push(`data/lesson-drafting-profiles.json invalid JSON: ${error.message}`); }

if (profiles) {
  const list = profiles.profiles || [];
  if (!Array.isArray(list) || list.length < 7) issues.push('expected grade-band and exam lesson drafting profiles');
  for (const grade of ['1','2','3','4','5','6','9','10','12']) {
    if (!list.some((item) => Array.isArray(item.grades) && item.grades.includes(grade))) issues.push(`missing drafting profile for grade ${grade}`);
  }
  for (const examMode of ['grade10_entrance','thpt_exam']) {
    if (!list.some((item) => item.examMode === examMode)) issues.push(`missing exam drafting profile ${examMode}`);
  }
  if (!profiles.principles?.some((item) => String(item).includes('không dùng một mẫu máy móc'))) issues.push('profiles must explicitly reject one-size-fits-all lesson drafting');
}

requireMarker('lib/lesson-drafting-profile.ts', 'resolveLessonDraftingProfile', 'profile resolver');
requireMarker('lib/lesson-drafting-profile.ts', 'learnerProfile', 'learner profile differentiation');
requireMarker('lib/generator.ts', 'resolveLessonDraftingProfile', 'generator uses lesson drafting profile');
requireMarker('lib/generator.ts', 'buildLessonActivities', 'generator builds structured activities');
requireMarker('lib/generator.ts', 'Không tự bịa kiến thức môn', 'safe knowledge guard');
requireMarker('lib/generator.ts', 'teacherFinalReviewRequired', 'teacher review marker');
requireMarker('lib/lesson-quality-checklist.ts', 'core_sections', 'quality checklist core sections');
requireMarker('lib/lesson-quality-checklist.ts', 'safe_content_gate', 'quality checklist safe gate');
requireMarker('lib/lesson-quality-checklist.ts', 'release_claims', 'quality checklist anti-overclaim');
requireMarker('app/api/lesson-drafting/profiles/route.ts', 'resolveLessonDraftingProfile', 'lesson drafting profile API');
requireMarker('package.json', 'lesson-drafting:quality-validate', 'package script');

const result = {
  ok: issues.length === 0,
  checkedFiles: files.length,
  profileCount: profiles?.profiles?.length || 0,
  issues,
  note: 'Source-level validation only. This improves lesson drafting structure and pedagogy; it does not prove typecheck/build/live UI QA.'
};
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
