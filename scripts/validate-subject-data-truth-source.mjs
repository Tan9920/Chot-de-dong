import fs from 'fs';

const issues = [];
const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
const requireFile = (file) => { if (!fs.existsSync(file)) issues.push(`Missing file: ${file}`); };
const requireMarker = (file, marker, label = marker) => {
  if (!read(file).includes(marker)) issues.push(`${file} missing marker: ${label}`);
};

const files = [
  'data/subject-data-registry.json',
  'lib/subject-data-truth.ts',
  'lib/curriculum-data.ts',
  'lib/content-repository.ts',
  'lib/coverage-truth.ts',
  'lib/generator.ts',
  'lib/teaching-policy.ts',
  'app/api/subject-data/truth/route.ts'
];
files.forEach(requireFile);

let registry = null;
try {
  registry = JSON.parse(read('data/subject-data-registry.json'));
} catch (error) {
  issues.push(`data/subject-data-registry.json invalid JSON: ${error.message}`);
}

if (registry) {
  if (!Array.isArray(registry.records)) issues.push('subject registry records must be an array');
  if (!registry.principles?.some((item) => String(item).includes('Coverage khác với readiness'))) issues.push('registry must explicitly separate coverage from readiness');
  const records = registry.records || [];
  const grades = new Set(records.map((item) => String(item.grade)));
  for (let grade = 1; grade <= 12; grade += 1) {
    if (!grades.has(String(grade))) issues.push(`missing grade ${grade} in subject data registry`);
  }
  const subjects = new Set(records.map((item) => String(item.subject)));
  for (const subject of ['Tiếng Việt', 'Ngữ văn', 'Toán', 'Công nghệ']) {
    if (!subjects.has(subject)) issues.push(`missing subject ${subject} in registry`);
  }
  if (subjects.has('Kĩ thuật') || subjects.has('Kỹ thuật')) issues.push('registry must not use Kĩ thuật/Kỹ thuật as subject name; use Công nghệ');
  const deepAllowed = records.filter((item) => item.contentDepthAllowed);
  if (deepAllowed.length > 0) issues.push('Batch74 must not create fake reviewed/verified deep-content records');
  const verified = records.filter((item) => ['reviewed','verified','approved_for_release'].includes(item.sourceStatus));
  if (verified.length > 0) issues.push('Batch74 must not upgrade sourceStatus to reviewed/verified without real review');
  const seed = records.filter((item) => item.sourceStatus === 'seed');
  if (seed.length < 1) issues.push('expected at least one seed record to preserve demo truth');
  const scaffold = records.filter((item) => item.sourceStatus === 'scaffold');
  if (scaffold.length < 100) issues.push('expected broad 1–12 scaffold truth coverage, not only grade 6');
}

requireMarker('lib/subject-data-truth.ts', 'buildSubjectDataGate', 'subject data gate');
requireMarker('lib/subject-data-truth.ts', 'contentDepthAllowed', 'deep content gate');
requireMarker('lib/subject-data-truth.ts', 'casioAllowed', 'Casio approval guard');
requireMarker('lib/subject-data-truth.ts', 'buildSubjectDataCatalog', 'catalog from subject registry');
requireMarker('lib/content-repository.ts', 'buildSubjectDataSummary', 'repository summary comes from subject truth');
requireMarker('lib/curriculum-data.ts', 'buildSubjectDataCoverageItems', 'coverage comes from subject truth registry');
requireMarker('lib/coverage-truth.ts', 'deepContentAllowedScopes', 'coverage truth reports deep-content allowed scopes');
requireMarker('lib/generator.ts', 'subjectDataGate', 'generated trace includes subject data gate');
requireMarker('lib/generator.ts', 'Không tự bịa kiến thức môn', 'safe frame warning');
requireMarker('lib/teaching-policy.ts', 'safeModeRequired', 'teaching policy exposes safe mode');
requireMarker('app/api/subject-data/truth/route.ts', 'buildSubjectDataGate', 'subject data truth API supports scoped gate');

const result = {
  ok: issues.length === 0,
  checkedFiles: files.length,
  totalRecords: registry?.records?.length || 0,
  issues,
  note: 'Source-level validation only. This proves Batch74 adds a subject-data truth model; it does not prove expert-reviewed curriculum content exists.'
};
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
