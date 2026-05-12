import fs from 'node:fs';

const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
const readJson = (file) => JSON.parse(read(file) || '{}');
const issues = [];
const pkg = readJson('package.json');
const workspace = read('components/workspace.tsx');
const css = read('app/globals.css');
const notes = read('BATCH90_NOTES.md');
const guide = read('docs/BATCH90_APP_SHELL_UIUX.md');
const registry = read('scripts/run-source-validators.mjs');

function requireFile(file) { if (!fs.existsSync(file)) issues.push(`missing file: ${file}`); }
function requireMarker(label, text, marker) { if (!text.includes(marker)) issues.push(`${label} missing marker: ${marker}`); }
function requireNotMarker(label, text, marker) { if (text.includes(marker)) issues.push(`${label} contains forbidden marker: ${marker}`); }

for (const file of [
  'components/workspace.tsx',
  'scripts/validate-batch90-app-shell-uiux-source.mjs',
  'docs/BATCH90_APP_SHELL_UIUX.md',
  'BATCH90_NOTES.md'
]) requireFile(file);

if (!['0.90.0', '0.91.0', '0.92.0', '0.93.0', '0.94.0', '0.95.0', '0.96.0', '0.97.0', '0.98.0','0.100.0','0.101.0','0.102.0','0.103.0'].includes(pkg.version)) issues.push(`package.json version must be 0.90.0 or 0.91.0, got ${pkg.version}`);
for (const scriptName of ['app-shell-uiux:validate', 'smoke:batch90', 'verify:batch90']) {
  if (!pkg.scripts?.[scriptName]) issues.push(`package.json missing script ${scriptName}`);
}

for (const marker of [
  'type WorkspaceTab',
  'activeTab',
  'selectWorkspaceTab',
  'appTabs',
  'desktopTabs',
  'grid grid-cols-6',
  'Cài đặt bài dạy',
  'Xuất file',
  'mobileTab',
  'mobileVisibility',
  'desktopOnly',
  'Điều hướng',
  'Gom các lựa chọn phụ',
  'không phải tìm nút trong editor',
  'setActiveTab(\'editor\')'
]) requireMarker('components/workspace.tsx', workspace, marker);

for (const marker of ['Batch90 app-like navigation shell', 'safe-area-inset-bottom']) requireMarker('app/globals.css', css, marker);
for (const marker of ['Batch90', 'app-like', 'bottom tab', 'Cài đặt', 'Xuất file', 'không thêm AI', 'không production-ready']) requireMarker('BATCH90_NOTES.md', notes, marker);
for (const marker of ['BATCH90 APP SHELL UIUX', 'mobile bottom tabs', 'settings tab', 'export tab', 'teacher compose flow']) requireMarker('docs/BATCH90_APP_SHELL_UIUX.md', guide, marker);
for (const marker of ['validate-batch90-app-shell-uiux-source.mjs', 'app-shell-uiux:validate', 'verify:batch90']) requireMarker('scripts/run-source-validators.mjs', registry, marker);

for (const forbidden of ['openai', '@google/generative-ai', '@anthropic-ai/sdk', 'langchain']) requireNotMarker('package.json', JSON.stringify(pkg), forbidden);

const result = {
  ok: issues.length === 0,
  issues,
  checked: {
    packageVersion: pkg.version,
    hasTabState: workspace.includes('activeTab') && workspace.includes('selectWorkspaceTab'),
    hasMobileBottomTabs: workspace.includes('grid grid-cols-6') && workspace.includes('appTabs.map'),
    hasSettingsTab: workspace.includes('id="settings"') && workspace.includes('Cài đặt bài dạy'),
    hasExportTab: workspace.includes('id="export"') && workspace.includes('Xuất DOCX') && workspace.includes('Xuất PDF'),
    hidesInactiveMobilePanels: workspace.includes('mobileVisibility') && workspace.includes('hidden md:block')
  },
  note: 'Batch90 source validator checks app-like navigation shell at source level. It does not prove mobile browser QA, Vercel build, DOCX/PDF runtime export, or teacher feedback has passed.'
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
