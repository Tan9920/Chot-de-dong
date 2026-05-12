import fs from 'node:fs';

function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''; }
function has(file, pattern) { return pattern.test(read(file)); }

const contracts = [
  {
    name: 'csrf bootstrap route issues token and demo session',
    file: 'app/api/auth/csrf/route.ts',
    checks: [/export\s+async\s+function\s+GET/, /issueCsrfToken\(/, /sessionCookieName/, /createSessionUser/]
  },
  {
    name: 'template-builder write route inherits generate POST',
    file: 'app/api/template-builder/route.ts',
    checks: [/export\s*\{\s*POST\s*\}\s*from\s*['"]\.\.\/generate\/route['"]/]
  },
  {
    name: 'generate POST is CSRF protected and quota gated',
    file: 'app/api/generate/route.ts',
    checks: [/export\s+async\s+function\s+POST/, /assertWriteProtection\(request\)/, /assertRuntimeRateLimit\(request,\s*['"]template_builder/, /assertOperatingUsageAllowed\(user,\s*['"]template_lesson/, /contentSafety/]
  },
  {
    name: 'lesson design studio has GET and CSRF POST',
    file: 'app/api/lesson-design/studio/route.ts',
    checks: [/export\s+async\s+function\s+GET/, /export\s+async\s+function\s+POST/, /assertWriteProtection\(request\)/, /buildLessonDesignStudioPacket/, /buildSubjectDataGate|supportLevel|gate/]
  },
  {
    name: 'DOCX export is POST-only with CSRF/session/quota',
    file: 'app/api/export/docx/route.ts',
    checks: [/export\s+async\s+function\s+GET/, /status:\s*405/, /require(?:RealAccount)?Session/, /assertWriteProtection\(request\)/, /assertOperatingUsageAllowed\(user,\s*action/, /generateDocxBuffer/]
  },
  {
    name: 'PDF export is POST-only with CSRF/session/quota',
    file: 'app/api/export/pdf/route.ts',
    checks: [/export\s+async\s+function\s+GET/, /status:\s*405/, /require(?:RealAccount)?Session/, /assertWriteProtection\(request\)/, /assertOperatingUsageAllowed\(user,\s*action/, /generatePdfBuffer/]
  },
  {
    name: 'runtime security provides same-origin, CSRF and rate-limit guards',
    file: 'lib/runtime-security.ts',
    checks: [/assertSameOrigin/, /assertWriteProtection/, /csrfCookieName/, /assertRuntimeRateLimit/, /readJsonBody/]
  },
  {
    name: 'Batch82 live smoke covers CSRF-protected export and studio POST',
    file: 'scripts/live-http-smoke.mjs',
    checks: [/\/api\/auth\/csrf/, /x-csrf-token/, /\/api\/template-builder/, /\/api\/lesson-design\/studio/, /\/api\/export\/docx/, /\/api\/export\/pdf/]
  }
];

const results = contracts.map((contract) => {
  const text = read(contract.file);
  const missing = [];
  if (!text) missing.push('file_missing');
  contract.checks.forEach((pattern, index) => {
    if (!pattern.test(text)) missing.push(`check_${index}:${pattern}`);
  });
  return { name: contract.name, file: contract.file, ok: missing.length === 0, missing };
});

const ok = results.every((result) => result.ok);
console.log(JSON.stringify({
  ok,
  checked: results.length,
  results,
  note: 'Batch83 route-contract validator is source-level only. It proves key route security/export markers exist, not that handlers work at runtime.'
}, null, 2));
process.exit(ok ? 0 : 1);
