import fs from 'fs';

const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
const issues = [];
function requireFile(file) { if (!fs.existsSync(file)) issues.push(`Missing file: ${file}`); }
function requireMarker(file, marker, label = marker) {
  const text = read(file);
  if (!text.includes(marker)) issues.push(`${file} missing marker: ${label}`);
}
function forbidPattern(file, pattern, label) {
  const text = read(file);
  if (pattern.test(text)) issues.push(`${file} still has forbidden pattern: ${label}`);
}

const files = [
  'lib/auth.ts',
  'lib/runtime-security.ts',
  'lib/account-security.ts',
  'lib/security-audit-log.ts',
  'lib/access.ts',
  'lib/governance.ts',
  'lib/workflow.ts',
  'app/api/auth/csrf/route.ts',
  'app/api/lessons/route.ts',
  'app/api/export/docx/route.ts',
  'app/api/export/pdf/route.ts',
  'data/auth-sessions.json',
  'data/security-audit-events.json'
];
files.forEach(requireFile);

requireMarker('lib/auth.ts', 'readSessionUserBySessionId', 'session cookie lookup from JSON session store');
requireMarker('lib/auth.ts', 'parseCookieHeader', 'cookie parsing helper');
forbidPattern('lib/auth.ts', /return\s+demoUser\s*;/, 'getSessionUser returns demoUser');
forbidPattern('lib/auth.ts', /import\s+\{\s*demoUser\s*\}/, 'auth imports demoUser');

requireMarker('lib/runtime-security.ts', 'rateBuckets', 'in-memory rate limit bucket');
requireMarker('lib/runtime-security.ts', 'x-csrf-token', 'CSRF request header');
requireMarker('lib/runtime-security.ts', 'cookieToken', 'CSRF cookie comparison');
requireMarker('lib/runtime-security.ts', 'assertSameOrigin', 'same-origin guard');
requireMarker('lib/runtime-security.ts', 'demoBypass: false', 'write protection is not demo bypass');
forbidPattern('lib/runtime-security.ts', /return\s+\{\s*allowed:\s*true,\s*response:\s*null\s+as\s+any\s*\}\s*;/, 'rate limit unconditional allow');
forbidPattern('lib/runtime-security.ts', /return\s+\{\s*ok:\s*true,\s*response:\s*null\s+as\s+any,\s*demoBypass:\s*true\s*\}/, 'write protection demo bypass');

requireMarker('lib/account-security.ts', 'scryptSync', 'password hashing');
requireMarker('lib/account-security.ts', 'timingSafeEqual', 'constant-time password verify');
forbidPattern('lib/account-security.ts', /return\s+\{\s*ok:\s*true,\s*account:\s*\{\s*id:\s*'account-demo'/, 'verify accepts arbitrary email/password');

requireMarker('lib/security-audit-log.ts', 'recordSecurityAuditEvent', 'security audit writer');
requireMarker('lib/security-audit-log.ts', 'listSecurityAuditEvents', 'security audit reader');

requireMarker('lib/access.ts', 'authorId', 'owner-scoped lesson permission');
requireMarker('lib/access.ts', 'departmentKey', 'department-scoped lesson permission');
requireMarker('lib/access.ts', 'schoolKey', 'school-scoped lesson permission');
forbidPattern('lib/access.ts', /export function assertLessonPermission\(_user: any, _permission: string\) \{\n  return true;\n\}/, 'lesson permission always returns true');
requireMarker('lib/governance.ts', 'assertLessonPermission', 'visibility delegates to permission guard');
requireMarker('lib/workflow.ts', 'assertLessonPermission', 'workflow manage delegates to permission guard');

requireMarker('app/api/auth/csrf/route.ts', 'anonymous_demo_csrf_bootstrap', 'CSRF bootstrap creates low-privilege demo session');
requireMarker('app/api/auth/csrf/route.ts', "'teacher'", 'bootstrap role is teacher, not admin');
requireMarker('app/api/lessons/route.ts', 'getSessionUser(request)', 'lessons route uses request-scoped session');
requireMarker('app/api/lessons/route.ts', 'assertWriteProtection(request)', 'lessons write route protected');
requireMarker('app/api/export/docx/route.ts', 'requireActiveSession', 'DOCX export requires session');
requireMarker('app/api/export/docx/route.ts', 'assertWriteProtection(request)', 'DOCX export write protected');
requireMarker('app/api/export/pdf/route.ts', 'requireActiveSession', 'PDF export requires session');
requireMarker('app/api/export/pdf/route.ts', 'assertWriteProtection(request)', 'PDF export write protected');

for (const file of ['data/auth-sessions.json', 'data/security-audit-events.json']) {
  try {
    const parsed = JSON.parse(read(file));
    if (!Array.isArray(parsed)) issues.push(`${file} must be a JSON array`);
  } catch (error) {
    issues.push(`${file} is not valid JSON: ${error.message}`);
  }
}

const result = {
  ok: issues.length === 0,
  checkedFiles: files.length,
  issues,
  note: 'Source-level runtime security validation only. Still run npm install, typecheck, build, and live HTTP smoke before claiming deploy-ready.'
};
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
