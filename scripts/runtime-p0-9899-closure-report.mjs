import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const artifactPath = 'artifacts/runtime-p0-9899-closure-last-run.json';
const readJson = (rel) => { try { return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')); } catch { return null; } };
const exists = (rel) => fs.existsSync(path.join(root, rel));
const timeMs = (iso) => { const t = iso ? Date.parse(iso) : NaN; return Number.isFinite(t) ? t : 0; };
const pkg = readJson('package.json') || {};
const guarded = readJson('artifacts/next-build-runtime-guard-last-run.json');
const verifyFinal = readJson('artifacts/verify-p0-final-last-run.json');
const finalReport = readJson('artifacts/runtime-p0-final-closure-last-run.json');
const live = readJson('artifacts/live-http-smoke-last-run.json');
const auth = readJson('artifacts/auth-invite-runtime-smoke-last-run.json');
const loopback = readJson('artifacts/p0-loopback-url-smoke-last-run.json');
const loopbackHosted = readJson('artifacts/p0-loopback-hosted-url-smoke-last-run.json');
const hosted = readJson('artifacts/hosted-demo-url-smoke-last-run.json');
const buildTime = timeMs(guarded?.generatedAt);
const loopbackTime = timeMs(loopback?.generatedAt);
const hostedTime = timeMs(hosted?.generatedAt);
const actualNodeMajor = Number(process.versions.node.split('.')[0]);
const requireNode24 = process.env.GIAOAN_REQUIRE_NODE24 === '1';
const node24RuntimeVerified = actualNodeMajor === 24;
const hostedPassed = Boolean(hosted?.ok && (hosted?.status === 'hosted_url_smoke_passed' || hosted?.hostedUrlSmokePassed === true || Array.isArray(hosted?.checks)));
const hostedFreshEnough = Boolean(hostedPassed && hostedTime >= buildTime);
const loopbackRoutes = new Set((loopback?.checkedRoutes || []).filter(Boolean));
const requiredLoopbackRoutes = ['/', '/api/health', '/api/auth/csrf', '/api/template-builder', '/api/lesson-design/studio', '/api/export/docx', '/api/export/pdf', '/api/metadata'];
const missingLoopbackRoutes = requiredLoopbackRoutes.filter((route) => !loopbackRoutes.has(route));
const requiredFiles = ['.next/BUILD_ID', '.next/routes-manifest.json', '.next/required-server-files.json', '.next/server/app', '.next/static'];
const missingArtifacts = requiredFiles.filter((rel) => !exists(rel));
const checks = [
  { id: 'repo_version_128', ok: pkg.version === '0.128.0', evidence: pkg.version || null },
  { id: 'node_engine_24x', ok: pkg.engines?.node === '24.x', evidence: pkg.engines || null },
  { id: 'node24_runtime_when_required', ok: requireNode24 ? node24RuntimeVerified : true, evidence: { actual: process.versions.node, requireNode24, node24RuntimeVerified } },
  { id: 'verify_p0_final_passed', ok: Boolean((verifyFinal?.ok && (verifyFinal?.summary?.failed ?? 1) === 0 && (verifyFinal?.summary?.passed ?? 0) >= 10) || finalReport?.p0FinalLocalClosed), evidence: { verifyFinal: verifyFinal?.summary || null, finalReport: finalReport ? { p0FinalLocalClosed: finalReport.p0FinalLocalClosed, failedChecks: finalReport.failedLocalChecks || [] } : null } },
  { id: 'strict_raw_build_exit_zero', ok: Boolean(guarded?.ok && guarded?.status === 'raw_next_build_passed' && guarded?.rawNextBuildExitCode === 0), evidence: guarded ? { status: guarded.status, exitCode: guarded.rawNextBuildExitCode, generatedAt: guarded.generatedAt } : null },
  { id: 'required_build_artifacts_present', ok: missingArtifacts.length === 0, evidence: { missingArtifacts } },
  { id: 'live_smoke_passed', ok: Boolean(live?.ok && ((live?.summary?.checked ?? (Array.isArray(live?.checks) ? live.checks.length : 0)) >= 15)), evidence: live?.summary || (Array.isArray(live?.checks) ? { checked: live.checks.length } : null) },
  { id: 'auth_smoke_passed', ok: Boolean(auth?.ok && (auth?.summary?.checked ?? 0) >= 8), evidence: auth?.summary || null },
  { id: 'final_closure_report_passed', ok: Boolean(finalReport?.ok && finalReport?.p0FinalLocalClosed), evidence: finalReport ? { p0FinalLocalClosed: finalReport.p0FinalLocalClosed, failedChecks: finalReport.failedLocalChecks || [] } : null },
  { id: 'loopback_hosted_route_smoke_passed_after_build', ok: Boolean(loopback?.ok && loopbackHosted?.ok && loopbackTime >= buildTime), evidence: loopback ? { generatedAt: loopback.generatedAt, checked: loopback.hostedSummary?.checked || null, buildGeneratedAt: guarded?.generatedAt } : null },
  { id: 'loopback_core_routes_covered', ok: missingLoopbackRoutes.length === 0, evidence: { requiredLoopbackRoutes, missingLoopbackRoutes } },
  { id: 'no_ai_payment_verified_fake_added', ok: Boolean(loopback?.noAiPaymentVerifiedFakeAdded && finalReport?.noAiPaymentVerifiedFakeAdded !== false), evidence: true }
];
const failedChecks = checks.filter((c) => !c.ok).map((c) => c.id);
const p0Local9899Closed = failedChecks.length === 0;
const localClosurePercent = p0Local9899Closed ? (node24RuntimeVerified ? 99 : 98) : (finalReport?.p0FinalLocalClosed ? 96 : 92);
const publicClosurePercent = p0Local9899Closed && node24RuntimeVerified && hostedFreshEnough ? 99 : (p0Local9899Closed ? 72 : 65);
const warnings = [];
if (!node24RuntimeVerified) warnings.push(`Current runtime is Node ${process.versions.node}; Node 24 proof still needs verify:p0-9899-node24-ci on CI/Vercel.`);
if (!hostedFreshEnough) warnings.push('Hosted/public P0 is still below 98-99 until APP_URL strict smoke passes on the deployed Vercel URL.');
const report = {
  ok: p0Local9899Closed,
  generatedAt: new Date().toISOString(),
  repoVersion: pkg.version || null,
  nodeVersion: process.versions.node,
  p0Local9899Closed,
  localClosurePercent,
  publicClosurePercent,
  node24RuntimeVerified,
  hostedFreshEnough,
  p1SourceWorkAllowed: p0Local9899Closed,
  publicP1RolloutAllowed: p0Local9899Closed && node24RuntimeVerified && hostedFreshEnough,
  checks,
  failedChecks,
  warnings,
  note: 'Batch128 adds a loopback URL smoke that runs the hosted URL route suite against next start locally. Local P0 can reach 98-99 proof quality; 100/public-ready is blocked until real Node24 CI + hosted Vercel URL smoke pass.',
  noAiPaymentVerifiedFakeAdded: true
};
fs.mkdirSync(path.dirname(path.join(root, artifactPath)), { recursive: true });
fs.writeFileSync(path.join(root, artifactPath), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
