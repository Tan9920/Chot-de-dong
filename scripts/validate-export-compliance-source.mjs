import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'lib/exporter.ts',
  'lib/export-saved-lesson.ts',
  'app/api/export/docx/route.ts',
  'app/api/export/pdf/route.ts',
  'components/workspace.tsx',
  'data/product-foundation.json',
  'package.json'
];

const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(root, file)));
const issues = [];
function read(file) { return fs.existsSync(path.join(root, file)) ? fs.readFileSync(path.join(root, file), 'utf8') : ''; }

const exporter = read('lib/exporter.ts');
const resolver = read('lib/export-saved-lesson.ts');
const docxRoute = read('app/api/export/docx/route.ts');
const pdfRoute = read('app/api/export/pdf/route.ts');
const workspace = read('components/workspace.tsx');
const pkg = read('package.json');
let foundation = {};
try { foundation = JSON.parse(read('data/product-foundation.json') || '{}'); } catch (error) { issues.push(`data/product-foundation.json parse failed: ${error.message}`); }

for (const marker of ['complianceLines', 'sourceStatus', 'supportLevel', 'reviewStatus', 'releaseTier', 'WATERMARK', 'PHỤ LỤC KIỂM TRA']) {
  if (!exporter.includes(marker)) issues.push(`lib/exporter.ts missing marker: ${marker}`);
}
for (const marker of ['resolveLessonExportPayload', 'getLessonById', 'savedLessonId', 'buildExportCompliancePacket', 'teacherFinalReviewRequired']) {
  if (!resolver.includes(marker)) issues.push(`lib/export-saved-lesson.ts missing marker: ${marker}`);
}
for (const [name, content] of [['docx route', docxRoute], ['pdf route', pdfRoute]]) {
  for (const marker of ['resolveLessonExportPayload', 'savedLessonId', 'lessonId']) {
    if (!content.includes(marker)) issues.push(`${name} missing marker: ${marker}`);
  }
}
for (const marker of ['activeDraftId', 'savedLessonId', 'compliance packet', 'Export theo giáo án đã lưu']) {
  if (!workspace.includes(marker)) issues.push(`components/workspace.tsx missing marker: ${marker}`);
}
if (foundation?.exportFoundation?.stage !== 'batch72_export_quality_compliance_packet') issues.push('product foundation missing Batch72 exportFoundation stage');
if (!foundation?.exportFoundation?.mustInclude?.includes('compliancePacket')) issues.push('product foundation missing exportFoundation compliancePacket');
if (!pkg.includes('export:compliance-validate') || !pkg.includes('smoke:batch72')) issues.push('package.json missing Batch72 export scripts');

const result = { ok: missing.length === 0 && issues.length === 0, missing, issues, checkedFiles: requiredFiles.length, note: 'Source-level export compliance validation only. Still run typecheck/build/live POST export with savedLessonId and open DOCX/PDF manually.' };
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
process.exit(0);
