import fs from 'fs';
import path from 'path';
import { buildBasicWebFlowBoard } from './demo-basic-flow';

function exists(root: string, file: string) {
  return fs.existsSync(path.join(root, file));
}

export async function buildDemoReadinessBoard() {
  const root = process.cwd();
  const required = [
    'package.json',
    'tsconfig.json',
    'next.config.ts',
    'app/page.tsx',
    'components/workspace.tsx',
    'app/api/health/route.ts',
    'app/api/demo/readiness/route.ts',
    'app/api/demo/basic-flow/route.ts',
    'app/api/metadata/route.ts',
    'app/api/template-builder/route.ts',
    'app/api/export/docx/route.ts',
    'app/api/export/pdf/route.ts',
    'lib/demo-readiness.ts',
    'lib/demo-basic-flow.ts',
    'lib/exporter.ts',
    '.env.example'
  ];
  const checks = required.map((file) => ({ id: file, label: file, status: exists(root, file) ? 'pass' : 'blocker' }));
  const blockers = checks.filter((c) => c.status === 'blocker');
  const basicFlow = await buildBasicWebFlowBoard();
  const warnings = [
    { id: 'seed-data', label: 'Dữ liệu seed/scaffold chưa verified; chỉ dùng demo nội bộ.', status: 'warning' },
    { id: 'local-storage-demo', label: 'Lưu nháp UX dùng localStorage cho demo; bản thật cần database/persistence.', status: 'warning' },
    { id: 'pdf-font', label: 'PDF fallback tối thiểu; cần kiểm tra font tiếng Việt trên host thật.', status: 'warning' }
  ];

  return {
    generatedAt: new Date().toISOString(),
    status: blockers.length ? 'blocked' : 'demo_ready_source_level',
    blockers,
    warnings,
    checks,
    basicFlowSummary: basicFlow.summary,
    smokeFlow: ['/api/health', '/api/demo/readiness', '/api/demo/basic-flow', '/api/metadata', '/api/template-builder', '/api/export/docx', '/api/export/pdf'],
    deployTargets: ['Vercel', 'Render Docker', 'local npm start'],
    note: 'Readiness source-level cho web demo cơ bản; vẫn cần npm install/typecheck/build/live smoke trên host thật.'
  };
}
