import fs from 'fs';
const required = [
  'package.json',
  'tsconfig.json',
  'next.config.ts',
  'app/page.tsx',
  'components/workspace.tsx',
  'app/api/health/route.ts',
  'app/api/demo/readiness/route.ts',
  'app/api/demo/basic-flow/route.ts',
  'lib/demo-readiness.ts',
  'lib/demo-basic-flow.ts',
  'lib/exporter.ts',
  'DEPLOYMENT_DEMO_GUIDE.md'
];
const missing = required.filter((file) => !fs.existsSync(file));
console.log(JSON.stringify({ ok: missing.length === 0, required, missing }, null, 2));
if (missing.length) process.exit(1);
process.exit(0);
