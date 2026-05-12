import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
const root = process.cwd();
const artifactPath = 'artifacts/runtime-p0-final-closure-last-run.json';
const readJson = (rel) => { try { return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')); } catch { return null; } };
const readText = (rel) => { try { return fs.readFileSync(path.join(root, rel), 'utf8'); } catch { return ''; } };
const exists = (rel) => fs.existsSync(path.join(root, rel));
const timeMs = (iso) => { const t = iso ? Date.parse(iso) : NaN; return Number.isFinite(t) ? t : 0; };
const statTime = (rel) => { try { return fs.statSync(path.join(root, rel)).mtime.toISOString(); } catch { return null; } };
const pkg = readJson('package.json') || {};
function semverGte(actual, min) {
  const a = String(actual || '').split('.').map((x) => Number(x) || 0);
  const b = String(min || '').split('.').map((x) => Number(x) || 0);
  for (let i = 0; i < 3; i += 1) { if ((a[i] || 0) > (b[i] || 0)) return true; if ((a[i] || 0) < (b[i] || 0)) return false; }
  return true;
}
const policy = readJson('data/runtime-p0-final-closure-policy.json') || {};
const vercel = readJson('vercel.json') || {};
const guarded = readJson('artifacts/next-build-runtime-guard-last-run.json');
const live = readJson('artifacts/live-http-smoke-last-run.json');
const auth = readJson('artifacts/auth-invite-runtime-smoke-last-run.json');
const hosted = readJson('artifacts/hosted-demo-url-smoke-last-run.json');
const verifyFinal = readJson('artifacts/verify-p0-final-last-run.json');
const buildTime = timeMs(guarded?.generatedAt), liveTime = timeMs(live?.generatedAt), authTime = timeMs(auth?.generatedAt), hostedTime = timeMs(hosted?.generatedAt);
const actualNodeMajor = Number(process.versions.node.split('.')[0]);
const requireNode24 = process.env.GIAOAN_REQUIRE_NODE24 === '1';
const node24RuntimeVerified = actualNodeMajor === 24;
const requiredArtifacts = ['.next/BUILD_ID','.next/app-build-manifest.json','.next/routes-manifest.json','.next/prerender-manifest.json','.next/images-manifest.json','.next/required-server-files.json','.next/server/app-paths-manifest.json','.next/server/pages-manifest.json','.next/server/app','.next/static'];
const missingArtifacts = requiredArtifacts.filter((rel) => !exists(rel));
const liveChecks = Array.isArray(live?.checks) ? live.checks : [];
const authChecks = Array.isArray(auth?.checks) ? auth.checks : [];
const liveRoutes = new Set(liveChecks.map((c) => c.route));
const requiredLiveRoutes = ['/api/health','/api/auth/csrf','/api/template-builder','/api/export/docx','/api/export/pdf','/api/metadata'];
const missingLiveRoutes = requiredLiveRoutes.filter((route) => !liveRoutes.has(route));
const liveFailedChecks = liveChecks.filter((c) => !c.ok).length;
const authFailedChecks = authChecks.filter((c) => !c.ok).length;
const hostedPassed = Boolean(hosted?.ok && (hosted?.status === 'hosted_url_smoke_passed' || hosted?.hostedUrlSmokePassed === true));
const hostedFreshEnough = Boolean(hostedPassed && hostedTime >= buildTime);
const checks = [
  { id: 'repo_version_127_or_newer', ok: semverGte(pkg.version, '0.127.0'), evidence: pkg.version || null },
  { id: 'node_target_24x', ok: pkg.engines?.node === '24.x', evidence: pkg.engines || null },
  { id: 'node_version_file_24x', ok: /^24\./.test(readText('.node-version').trim()), evidence: readText('.node-version').trim() || null },
  { id: 'actual_node_runtime_is_24_when_required', ok: requireNode24 ? node24RuntimeVerified : true, evidence: { actual: process.versions.node, requireNode24, node24RuntimeVerified } },
  { id: 'vercel_deterministic_runtime_config', ok: vercel.framework === 'nextjs' && String(vercel.installCommand || '').includes('npm ci') && vercel.buildCommand === 'npm run build', evidence: vercel },
  { id: 'node_modules_present', ok: exists('node_modules/.bin/next') && exists('node_modules/@next/swc-linux-x64-gnu'), evidence: { next: exists('node_modules/.bin/next'), swc: exists('node_modules/@next/swc-linux-x64-gnu') } },
  { id: 'strict_raw_next_build_exit_zero', ok: Boolean(guarded?.ok && guarded?.status === 'raw_next_build_passed' && guarded?.rawNextBuildExitCode === 0), evidence: guarded ? { status: guarded.status, exitCode: guarded.rawNextBuildExitCode, generatedAt: guarded.generatedAt } : null },
  { id: 'build_artifacts_present', ok: missingArtifacts.length === 0 && Boolean(guarded?.artifacts?.ready), evidence: { missingArtifacts, buildIdMtime: statTime('.next/BUILD_ID') } },
  { id: 'live_smoke_after_current_build', ok: Boolean(live?.ok && liveTime >= buildTime && liveFailedChecks === 0), evidence: live ? { generatedAt: live.generatedAt, buildGeneratedAt: guarded?.generatedAt, checked: liveChecks.length, failed: liveFailedChecks } : null },
  { id: 'live_smoke_core_routes_covered', ok: missingLiveRoutes.length === 0, evidence: { requiredLiveRoutes, missingLiveRoutes } },
  { id: 'auth_invite_smoke_after_current_build', ok: Boolean(auth?.ok && authTime >= buildTime && authFailedChecks === 0 && (auth?.summary?.checked ?? 0) >= 8), evidence: auth ? { generatedAt: auth.generatedAt, buildGeneratedAt: guarded?.generatedAt, summary: auth.summary, failed: authFailedChecks } : null },
  { id: 'no_ai_payment_verified_fake_added', ok: Boolean(policy.noAiPaymentVerifiedFakeAdded && guarded?.noAiPaymentVerifiedFakeAdded !== false && auth?.noAiPaymentVerifiedFakeAdded !== false), evidence: true }
];
const failedLocalChecks = checks.filter((c) => !c.ok).map((c) => c.id);
const p0FinalLocalClosed = failedLocalChecks.length === 0;
const p1SourceWorkAllowed = p0FinalLocalClosed && (!requireNode24 || node24RuntimeVerified);
const publicP1RolloutAllowed = p0FinalLocalClosed && hostedFreshEnough && (!requireNode24 || node24RuntimeVerified);
const warnings = [];
if (!node24RuntimeVerified) warnings.push(`Current command ran on Node ${process.versions.node}; Node 24 runtime proof requires GIAOAN_REQUIRE_NODE24=1 npm run verify:p0-final on Node 24 CI/Vercel.`);
if (!hostedFreshEnough) warnings.push('Hosted/public rollout remains blocked until a fresh APP_URL/NEXT_PUBLIC_APP_URL strict URL smoke passes after this build.');
if (verifyFinal?.summary?.failed) warnings.push('verify:p0-final artifact contains failed steps; rerun verify:p0-final before claiming local P0 closure.');
const report = {
  ok: p0FinalLocalClosed,
  generatedAt: new Date().toISOString(),
  repoVersion: pkg.version || null,
  batch: policy.batch || 'Batch127 - P0 Final Runtime Closure Hardening',
  p0FinalLocalClosed,
  p1SourceWorkAllowed,
  publicP1RolloutAllowed,
  node24RuntimeVerified,
  currentNodeVersion: process.versions.node,
  hostedFreshEnough,
  checks,
  failedLocalChecks,
  warnings,
  noAiPaymentVerifiedFakeAdded: true,
  nextBatchRecommendation: publicP1RolloutAllowed ? 'P1 can proceed with hosted proof.' : 'Keep P0 for hosted/Node24 proof if needed; only P1 source work is safe when p0FinalLocalClosed is true.',
  note: 'Batch127 separates local P0 closure, required Node 24 proof, and hosted/public rollout proof. Do not claim production-ready until hostedFreshEnough and Node 24 proof are true.'
};
fs.mkdirSync(path.dirname(path.join(root, artifactPath)), { recursive: true });
fs.writeFileSync(path.join(root, artifactPath), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
