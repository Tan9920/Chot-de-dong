import fs from 'fs';

const issues = [];
const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
const requireFile = (file) => { if (!fs.existsSync(file)) issues.push(`Missing file: ${file}`); };
const requireMarker = (file, marker, label = marker) => {
  if (!read(file).includes(marker)) issues.push(`${file} missing marker: ${label}`);
};

const files = [
  'data/curriculum-import-drafts.json',
  'lib/curriculum-data-pipeline.ts',
  'lib/content-repository.ts',
  'app/api/subject-data/review-board/route.ts',
  'app/api/admin/subject-data/imports/route.ts',
  'package.json'
];
files.forEach(requireFile);

let imports = null;
try { imports = JSON.parse(read('data/curriculum-import-drafts.json')); } catch (error) { issues.push(`data/curriculum-import-drafts.json invalid JSON: ${error.message}`); }

if (imports) {
  if (!Array.isArray(imports.requiredFields) || imports.requiredFields.length < 10) issues.push('curriculum import requiredFields must be explicit and broad enough');
  for (const field of ['grade','subject','bookOrProgram','topicTitle','sourceTitle','licenseStatus','attribution','reviewStatus','releaseTier']) {
    if (!imports.requiredFields.includes(field)) issues.push(`requiredFields missing ${field}`);
  }
  if (!Array.isArray(imports.drafts) || imports.drafts.length < 3) issues.push('expected at least 3 import draft examples/placeholders');
  if (!imports.reviewChecklist?.some((item) => String(item).includes('Không copy dài'))) issues.push('reviewChecklist must prohibit long copyrighted copying');
  const fakeVerified = (imports.drafts || []).filter((item) => item.reviewStatus === 'verified' || item.contentDepthAllowed === true);
  if (fakeVerified.length) issues.push('Batch75 must not add fake verified/contentDepthAllowed import drafts');
}

requireMarker('lib/curriculum-data-pipeline.ts', 'validateCurriculumImportDraft', 'draft validation');
requireMarker('lib/curriculum-data-pipeline.ts', 'licenseStatus', 'license validation');
requireMarker('lib/curriculum-data-pipeline.ts', 'contentDepthAllowed', 'deep content guard');
requireMarker('lib/curriculum-data-pipeline.ts', 'previewCurriculumImport', 'preview-only import');
requireMarker('lib/curriculum-data-pipeline.ts', 'Không tự nâng', 'no fake upgrade warning');
requireMarker('lib/content-repository.ts', 'buildCurriculumImportReviewBoard', 'repository exposes import board');
requireMarker('app/api/subject-data/review-board/route.ts', 'buildCurriculumImportReviewBoard', 'review board API');
requireMarker('app/api/admin/subject-data/imports/route.ts', 'previewCurriculumImport', 'admin import preview route');
requireMarker('package.json', 'curriculum-import:review-validate', 'package script');

const result = {
  ok: issues.length === 0,
  checkedFiles: files.length,
  draftCount: imports?.drafts?.length || 0,
  issues,
  note: 'Source-level validation only. This proves an import/review pipeline foundation exists; it does not prove reviewed curriculum data has been added.'
};
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
