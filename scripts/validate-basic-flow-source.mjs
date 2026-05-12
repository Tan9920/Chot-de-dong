import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'app/page.tsx',
  'components/workspace.tsx',
  'app/api/health/route.ts',
  'app/api/demo/readiness/route.ts',
  'app/api/demo/basic-flow/route.ts',
  'app/api/template-builder/route.ts',
  'app/api/export/docx/route.ts',
  'app/api/export/pdf/route.ts',
  'lib/demo-basic-flow.ts',
  'lib/demo-readiness.ts',
  'lib/exporter.ts',
  '.env.example',
  'package.json'
];

const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
const workspace = fs.readFileSync(path.join(root, 'components/workspace.tsx'), 'utf8');
const exporter = fs.readFileSync(path.join(root, 'lib/exporter.ts'), 'utf8');
const workspaceMarkers = ['Tạo khung giáo án', 'Lưu bản nháp', 'Xuất DOCX', 'Xuất PDF', 'localStorage', 'seed/scaffold', 'JSON persistence'];
const missingMarkers = workspaceMarkers.filter((marker) => !workspace.includes(marker));
const exporterMarkers = ['word/document.xml', '[Content_Types].xml', 'generateDocxBuffer', 'generatePdfBuffer', '0x04034b50'];
const missingExporterMarkers = exporterMarkers.filter((marker) => !exporter.includes(marker));

if (missing.length || missingMarkers.length || missingExporterMarkers.length) {
  console.error('Basic flow source validation failed.');
  if (missing.length) console.error('Missing files:', missing.join(', '));
  if (missingMarkers.length) console.error('Missing workspace markers:', missingMarkers.join(', '));
  if (missingExporterMarkers.length) console.error('Missing exporter markers:', missingExporterMarkers.join(', '));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  requiredFiles: required.length,
  workspaceMarkers: workspaceMarkers.length,
  exporterMarkers: exporterMarkers.length,
  note: 'Source-level basic web flow validation passed. Still run typecheck/build and live smoke before claiming deploy success.'
}, null, 2));
process.exit(0);
