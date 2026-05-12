import fs from 'fs';
const checks = [
  ['health route', 'app/api/health/route.ts'],
  ['demo readiness route', 'app/api/demo/readiness/route.ts'],
  ['metadata route', 'app/api/metadata/route.ts'],
  ['template-builder route', 'app/api/template-builder/route.ts']
].map(([label, file]) => ({ label, file, exists: fs.existsSync(file) }));
const ok = checks.every((item) => item.exists);
console.log(JSON.stringify({ ok, checks, note: 'Source smoke only; run npm run build and live HTTP smoke on host.' }, null, 2));
if (!ok) process.exit(1);
process.exit(0);
