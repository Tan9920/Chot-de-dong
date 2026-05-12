import fs from 'node:fs';
function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''; }
function readJson(file, fallback = {}) { try { return JSON.parse(read(file) || JSON.stringify(fallback)); } catch { return fallback; } }
const issues = [];
function check(label, condition, detail = '') { if (!condition) issues.push(detail ? `${label}: ${detail}` : label); }
const pkg = readJson('package.json');
const lock = readJson('package-lock.json');
const matrix = readJson('data/curriculum-compatibility-matrix.json');
const catalog = readJson('data/teacher-pilot-topic-picker-catalog.json');
const html = read('public/teacher-pilot-demo.html');
const lib = read('lib/curriculum-compatibility-matrix.ts') + '\n' + read('lib/teacher-pilot-completion.ts');
const route = read('app/api/curriculum/matrix/route.ts') + '\n' + read('app/api/teacher-pilot/completion/route.ts');
const adminRoute = read('app/api/admin/curriculum-gap-board/route.ts') + '\n' + read('app/api/admin/teacher-pilot-completion-board/route.ts');
const runValidators = read('scripts/run-source-validators.mjs');
const workspace = read('components/workspace.tsx');
const css = read('app/globals.css');
const notes = read('BATCH110_NOTES.md') + '\n' + read('docs/BATCH110_CURRICULUM_MATRIX.md');
check('package.json version must preserve Batch110–Batch114 lineage', ['0.110.0', '0.111.0', '0.112.0', '0.113.0', '0.114.0'].includes(pkg.version), pkg.version);
check('package-lock top-level version must preserve Batch110–Batch114 lineage', ['0.110.0', '0.111.0', '0.112.0', '0.113.0', '0.114.0'].includes(lock.version), lock.version);
check('package-lock root package version must preserve Batch110–Batch114 lineage', ['0.110.0', '0.111.0', '0.112.0', '0.113.0', '0.114.0'].includes(lock.packages?.['']?.version), lock.packages?.['']?.version);
for (const script of ['batch110:curriculum-matrix-validate','curriculum:matrix-validate','curriculum:gap-report','smoke:batch110','verify:batch110']) check(`package.json missing script ${script}`, Boolean(pkg.scripts?.[script]));
for (const file of ['data/curriculum-compatibility-matrix.json','lib/curriculum-compatibility-matrix.ts','app/api/curriculum/matrix/route.ts','app/api/admin/curriculum-gap-board/route.ts','scripts/validate-batch110-curriculum-matrix-source.mjs','scripts/curriculum-gap-board-report.mjs','BATCH110_NOTES.md','docs/BATCH110_CURRICULUM_MATRIX.md']) check(`missing ${file}`, fs.existsSync(file));
check('matrix version must be Batch110', matrix.version === 'batch110_curriculum_matrix_v1', matrix.version);
check('primary bookset must be Kết nối tri thức', matrix.primaryBookset === 'ket_noi_tri_thuc', matrix.primaryBookset);
const hidden = (matrix.booksets || []).filter((item) => item.teacherVisible === false).map((item) => item.id);
check('Cánh Diều must be hidden legacy/reference-only', hidden.includes('canh_dieu'));
check('Chân trời sáng tạo must be hidden legacy/reference-only', hidden.includes('chan_troi_sang_tao'));
check('teacher visible booksets should only include primary in demo', (matrix.booksets || []).filter((item) => item.teacherVisible !== false).every((item) => item.id === 'ket_noi_tri_thuc'));
const recordTypes = new Set((matrix.records || []).map((item) => item.recordType));
for (const type of ['official_lesson','topic_strand','legacy_reference','unmapped']) check(`matrix missing recordType ${type}`, recordTypes.has(type));
const forceFalse = new Set(matrix.contentDepthPolicy?.forceFalseFor || []);
for (const status of ['seed','scaffold','community','custom_teacher_input','teacher_input','legacy_reference','unmapped']) check(`contentDepthPolicy missing forceFalse ${status}`, forceFalse.has(status));
const fakeDeep = (matrix.records || []).filter((item) => item.contentDepthAllowed === true || ['verified','approved_for_release'].includes(item.dataStatus));
check('Batch110 must not create fake verified/contentDepthAllowed records', fakeDeep.length === 0, `${fakeDeep.length} found`);
const tvFraction = (matrix.records || []).find((item) => item.id === 'blocked-g5-tv-phan-so');
check('must explicitly block Tiếng Việt + Phân số mismatch', tvFraction?.recordType === 'unmapped' && tvFraction?.supportLevel === 'blocked');
check('topic catalog must link to curriculum matrix', catalog.curriculumMatrix?.enabled === true && catalog.curriculumMatrix?.primaryBookset === 'ket_noi_tri_thuc');
check('catalog must map g5-toan-phan-so to matrix record', JSON.stringify(catalog).includes('g5-kntt-toan-phan-so-y-nghia'));
for (const marker of ['Batch110','Curriculum Matrix','curriculum_matrix_teacher_composer','Kết nối tri thức','legacy/reference-only','official_lesson','topic_strand','teacher_input','unmapped','Curriculum Gap Board','sourceStatusIsUserSelectable:false','teacher_print_export_package','downloadHtml','printLesson','Tải HTML in được','In / xuất PDF bằng trình duyệt','Không claim DOCX/PDF runtime','Batch108','Phân số chỉ hiện khi chọn Toán','không cho tự chọn verified','Không cần npm/build','KẾ HOẠCH BÀI DẠY']) check(`offline HTML missing marker ${marker}`, html.includes(marker));
check('offline HTML must keep print CSS', html.includes('@media print'));
check('offline HTML must not expose source status select', !html.includes('<select id="source"') && !html.includes("<select id='source'"));
for (const marker of ['resolveCurriculumSelection','buildCurriculumGapBoard','deriveContentDepthAllowed','legacy_reference','custom_teacher_input','contentDepthAllowed: false','releaseAllowed']) check(`lib missing marker ${marker}`, lib.includes(marker));
for (const marker of ['readCurriculumCompatibilityMatrix','resolveCurriculumSelection','buildCurriculumGapBoard']) check(`route missing marker ${marker}`, route.includes(marker));
for (const marker of ['buildCurriculumGapBoard','readCurriculumCompatibilityMatrix']) check(`admin route missing marker ${marker}`, adminRoute.includes(marker));
for (const marker of ['validate-batch110-curriculum-matrix-source.mjs','smoke:batch110','verify:batch110']) check(`run-source-validators missing marker ${marker}`, runValidators.includes(marker));
for (const marker of ['Batch110','curriculum-matrix','Curriculum Matrix']) check(`workspace missing marker ${marker}`, workspace.includes(marker));
for (const marker of ['Batch110 Curriculum Matrix','curriculum-matrix']) check(`CSS missing marker ${marker}`, css.includes(marker));
check('notes must state no AI/no fake verified/no hosted overclaim', notes.includes('Không thêm AI') && notes.includes('Không tạo verified giả') && notes.includes('Không claim hosted/runtime pass'));
const pkgText = JSON.stringify(pkg).toLowerCase();
for (const forbidden of ['openai','@google/generative-ai','@anthropic-ai/sdk','anthropic','langchain']) check(`forbidden AI dependency ${forbidden}`, !pkgText.includes(`"${forbidden}`));
const result = {
  ok: issues.length === 0,
  packageVersion: pkg.version,
  matrixVersion: matrix.version,
  primaryBookset: matrix.primaryBookset,
  hiddenLegacyBooksets: hidden,
  records: Array.isArray(matrix.records) ? matrix.records.length : 0,
  fakeVerifiedOrDeepRecords: fakeDeep.length,
  issues,
  note: 'Batch110 validates source-level curriculum compatibility matrix and safer composer. It does not prove Next build, live runtime, hosted URL smoke, or academic verification.'
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
