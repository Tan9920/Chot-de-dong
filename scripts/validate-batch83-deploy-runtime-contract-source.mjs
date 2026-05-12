import fs from 'node:fs';

function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''; }
function includes(file, marker) { return read(file).includes(marker); }

const requiredFiles = [
  'scripts/check-registry-network.mjs',
  'scripts/assert-artifact-hygiene.mjs',
  'scripts/validate-batch83-route-contract-source.mjs',
  'scripts/batch83-runtime-preflight.mjs',
  'scripts/live-http-smoke.mjs',
  'BATCH83_NOTES.md',
  'docs/BATCH83_RUNTIME_CI_CHECKLIST.md'
];

const issues = [];
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) issues.push(`missing file ${file}`);
}

const pkg = JSON.parse(read('package.json') || '{}');
for (const script of [
  'registry:diagnose',
  'artifact:hygiene',
  'route:contract-validate',
  'runtime:preflight',
  'deploy:runtime-contract-validate',
  'smoke:batch83',
  'verify:batch83'
]) {
  if (!pkg.scripts?.[script]) issues.push(`package.json missing script ${script}`);
}
if (!/^0\.(83|84|85|8[6-9]|9\d)\.\d+$/.test(String(pkg.version))) issues.push(`package version expected Batch83+ compatible version, got ${pkg.version}`);

const liveMarkers = [
  'findFreePort',
  'GIAOAN_SMOKE_MODE',
  'production',
  '.next/BUILD_ID',
  'smokeMode',
  '/api/export/docx',
  '/api/export/pdf',
  '/api/lesson-design/studio'
];
for (const marker of liveMarkers) {
  if (!includes('scripts/live-http-smoke.mjs', marker)) issues.push(`live smoke missing marker ${marker}`);
}

const preflightMarkers = ['missing_next_binary', 'missing_next_swc_optional_package', 'preflight_subcheck_failed', 'validate-batch83-route-contract-source.mjs', 'assert-artifact-hygiene.mjs'];
for (const marker of preflightMarkers) {
  if (!includes('scripts/batch83-runtime-preflight.mjs', marker)) issues.push(`preflight missing marker ${marker}`);
}

const hygieneMarkers = ['forbidden_directory_present', 'forbidden_env_file_present', 'OPENAI_API_KEY', 'node_modules', '.next'];
for (const marker of hygieneMarkers) {
  if (!includes('scripts/assert-artifact-hygiene.mjs', marker)) issues.push(`artifact hygiene missing marker ${marker}`);
}

const routeMarkers = ['assertWriteProtection', 'requireActiveSession', 'generateDocxBuffer', 'generatePdfBuffer', 'issueCsrfToken'];
for (const marker of routeMarkers) {
  if (!includes('scripts/validate-batch83-route-contract-source.mjs', marker)) issues.push(`route contract validator missing marker ${marker}`);
}

const notes = read('BATCH83_NOTES.md');
for (const marker of ['Actual Build/Production Smoke Readiness', 'không thêm AI', 'source-level', 'live smoke thật', 'GIAOAN_SMOKE_MODE=production']) {
  if (!notes.includes(marker)) issues.push(`BATCH83_NOTES missing marker ${marker}`);
}

const result = {
  ok: issues.length === 0,
  checkedAt: new Date().toISOString(),
  issues,
  note: 'Batch83 source validator checks deployment/runtime contract harness only. It does not prove dependency install, build, production server, or browser/mobile QA pass.'
};
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
