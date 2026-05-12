import fs from 'fs';
import path from 'path';

const root = process.cwd();
const mustExist = [
  'lib/lesson-design-studio.ts',
  'app/api/lesson-design/studio/route.ts',
  'data/lesson-design-studio-blueprints.json',
  'components/workspace.tsx',
  'lib/generator.ts',
  'package.json'
];
const failures = [];
function read(file) {
  try { return fs.readFileSync(path.join(root, file), 'utf8'); } catch { return ''; }
}
for (const file of mustExist) if (!fs.existsSync(path.join(root, file))) failures.push(`missing:${file}`);
const studio = read('lib/lesson-design-studio.ts');
const route = read('app/api/lesson-design/studio/route.ts');
const workspace = read('components/workspace.tsx');
const generator = read('lib/generator.ts');
const pkg = JSON.parse(read('package.json') || '{}');
const blueprints = JSON.parse(read('data/lesson-design-studio-blueprints.json') || '{}');

const requiredStudioMarkers = [
  'buildLessonDesignStudioPacket',
  'formatLessonDesignStudioForPlan',
  'differentiationLanes',
  'activityMap',
  'exportReadiness',
  'worksheetOutline',
  'slideOutline',
  'teacherFinalReviewRequired',
  'noDeepContentWithoutReviewedData'
];
for (const marker of requiredStudioMarkers) if (!studio.includes(marker)) failures.push(`studio_missing_marker:${marker}`);
for (const marker of ['GET(request: NextRequest)', 'POST(request: NextRequest)', 'assertWriteProtection', 'buildLessonDesignStudioPacket']) {
  if (!route.includes(marker)) failures.push(`route_missing_marker:${marker}`);
}
for (const marker of ['Lesson Design Studio', 'lessonIntent', 'designMode', 'classSize', 'deviceAccess', 'Phân hóa & minh chứng']) {
  if (!workspace.includes(marker)) failures.push(`workspace_missing_marker:${marker}`);
}
for (const marker of ['designStudio', 'formatLessonDesignStudioForPlan', 'designStudioAppendix']) {
  if (!generator.includes(marker)) failures.push(`generator_missing_marker:${marker}`);
}
if (!studio.includes('PHỤ LỤC THIẾT KẾ BÀI DẠY')) failures.push('studio_missing_plan_appendix_label');
if (!Array.isArray(blueprints.studioModes) || blueprints.studioModes.length < 3) failures.push('blueprints_need_three_ui_modes');
if (!Array.isArray(blueprints.lessonIntents) || blueprints.lessonIntents.length < 4) failures.push('blueprints_need_lesson_intents');
if (!pkg.scripts?.['lesson-design:studio-validate']) failures.push('package_missing_lesson_design_validate_script');

const result = {
  ok: failures.length === 0,
  checkedAt: new Date().toISOString(),
  failures,
  note: 'Batch81 source validator checks Lesson Design Studio wiring only. It does not replace typecheck/build/live HTTP smoke.'
};
console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exit(1);
