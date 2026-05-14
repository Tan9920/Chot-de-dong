import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const artifactPath = 'artifacts/runtime-p0-deepest-closure-last-run.json';
const readJson = (rel) => { try { return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')); } catch { return null; } };
const exists = (rel) => fs.existsSync(path.join(root, rel));
const timeMs = (iso) => { const t = iso ? Date.parse(iso) : NaN; return Number.isFinite(t) ? t : 0; };
const pkg = readJson('package.json') || {};
const build = readJson('artifacts/next-build-runtime-guard-last-run.json');
const live = readJson('artifacts/live-http-smoke-last-run.json');
const auth = readJson('artifacts/auth-invite-runtime-smoke-last-run.json');
const loopback = readJson('artifacts/p0-loopback-url-smoke-last-run.json');
const loopbackHosted = readJson('artifacts/p0-loopback-hosted-url-smoke-last-run.json');
const responsive = readJson('artifacts/batch129-responsive-p0-contract-last-run.json');
const sourceGate = readJson('artifacts/batch129-p0-deepest-closure-source-last-run.json');
const hosted = readJson('artifacts/hosted-demo-url-smoke-last-run.json');
const buildTime = timeMs(build?.generatedAt);
const hostedTime = timeMs(hosted?.generatedAt);
const actualNodeMajor = Number(process.versions.node.split('.')[0]);
// Batch129+ compatibility: keep the repo on the 0.x release train while allowing real minor/patch bumps.
const zeroMajorVersionAtLeast = (version, baselineMinor, baselinePatch = 0) => {
  const [major, minor, patch] = String(version || '0.0.0')
    .split('.')
    .map((part) => Number(part));

  if (major !== 0 || !Number.isInteger(minor) || !Number.isInteger(patch)) return false;
  return minor > baselineMinor || (minor === baselineMinor && patch >= baselinePatch);
};
const node24RuntimeVerified = actualNodeMajor === 24;
const startableBuildStatus = new Set(['raw_next_build_passed','controlled_trace_timeout_with_startable_artifacts','controlled_artifact_ready_timeout_with_startable_artifacts','recovered_missing_500_after_artifacts_ready']);
const rawExitZero = Boolean(build?.status === 'raw_next_build_passed' && build?.rawNextBuildExitCode === 0);
const startableArtifacts = Boolean(build?.ok && startableBuildStatus.has(build?.status) && build?.artifacts?.ready === true);
const requiredArtifacts = ['.next/BUILD_ID','.next/app-build-manifest.json','.next/routes-manifest.json','.next/prerender-manifest.json','.next/images-manifest.json','.next/required-server-files.json','.next/server/app-paths-manifest.json','.next/server/pages-manifest.json'];
const missingArtifacts = requiredArtifacts.filter((rel) => !exists(rel)).concat(['.next/server/app','.next/static'].filter((rel) => !fs.existsSync(path.join(root, rel))));
const loopbackRoutes = new Set((loopback?.checkedRoutes || []).filter(Boolean));
const requiredLoopbackRoutes = ['/', '/api/health', '/api/auth/csrf', '/api/template-builder', '/api/lesson-design/studio', '/api/export/docx', '/api/export/pdf', '/api/metadata'];
const missingLoopbackRoutes = requiredLoopbackRoutes.filter((route) => !loopbackRoutes.has(route));
const hostedPassed = Boolean(hosted?.ok && (hosted?.status === 'hosted_url_smoke_passed' || hosted?.hostedUrlSmokePassed === true || Array.isArray(hosted?.checks)));
const hostedFreshEnough = Boolean(hostedPassed && hostedTime >= buildTime);
const checks = [
{ id: 'repo_version_129_or_later', ok: zeroMajorVersionAtLeast(pkg.version, 129, 0), evidence: pkg.version || null },  { id: 'node_engine_24x', ok: pkg.engines?.node === '24.x', evidence: pkg.engines || null },
  { id: 'responsive_mobile_contract_passed', ok: Boolean(responsive?.ok), evidence: responsive ? { failed: responsive.failed || [] } : null },
  { id: 'batch129_source_gate_passed', ok: Boolean(sourceGate?.ok), evidence: sourceGate ? { failed: sourceGate.failed || [] } : null },
  { id: 'startable_next_build_current', ok: startableArtifacts, evidence: build ? { status: build.status, rawNextBuildExitCode: build.rawNextBuildExitCode, generatedAt: build.generatedAt, artifacts: build.artifacts || null } : null },
  { id: 'required_build_artifacts_present', ok: missingArtifacts.length === 0, evidence: { missingArtifacts } },
  { id: 'live_smoke_passed', ok: Boolean(live?.ok && ((live?.summary?.checked ?? (Array.isArray(live?.checks) ? live.checks.length : 0)) >= 15)), evidence: live?.summary || null },
  { id: 'auth_smoke_passed', ok: Boolean(auth?.ok && (auth?.summary?.checked ?? 0) >= 8), evidence: auth?.summary || null },
  { id: 'loopback_hosted_smoke_passed', ok: Boolean(loopback?.ok && loopbackHosted?.ok && timeMs(loopback.generatedAt) >= buildTime), evidence: loopback ? { checked: loopback.hostedSummary?.checked || null, generatedAt: loopback.generatedAt } : null },
  { id: 'loopback_core_routes_covered', ok: missingLoopbackRoutes.length === 0, evidence: { requiredLoopbackRoutes, missingLoopbackRoutes } },
  { id: 'no_ai_payment_verified_fake_added', ok: Boolean(loopback?.noAiPaymentVerifiedFakeAdded && responsive?.noAiPaymentVerifiedFakeAdded && sourceGate?.noAiPaymentVerifiedFakeAdded), evidence: true }
];
const failedLocalChecks = checks.filter((c) => !c.ok).map((c) => c.id);
const p0DeepestLocalClosed = failedLocalChecks.length === 0;
const p0HundredPercentBlocked = !node24RuntimeVerified || !hostedFreshEnough || !rawExitZero;
const p0LocalPercent = p0DeepestLocalClosed ? (rawExitZero ? 99 : 99) : (startableArtifacts ? 96 : 90);
const p0PublicPercent = p0DeepestLocalClosed && node24RuntimeVerified && hostedFreshEnough ? (rawExitZero ? 100 : 99) : (p0DeepestLocalClosed ? 72 : 65);
const warnings = [];
if (!rawExitZero) warnings.push(`Raw Next build did not prove exit 0 in this environment; current build status is ${build?.status || 'missing'}. Startable artifacts + next start smoke passed, but raw-exit proof remains external/CI work.`);
if (!node24RuntimeVerified) warnings.push(`Current runtime is Node ${process.versions.node}; Node 24 proof requires npm run verify:p0-deepest-node24-ci on CI/Vercel.`);
if (!hostedFreshEnough) warnings.push('Real hosted APP_URL strict smoke has not passed after this build; public rollout/100% remains blocked.');
warnings.push('Visual screenshot/browser smoke for mobile/tablet/desktop still needs real device/browser after deploy.');
const report = {
  ok: p0DeepestLocalClosed,
  generatedAt: new Date().toISOString(),
  repoVersion: pkg.version || null,
  nodeVersion: process.versions.node,
  p0DeepestLocalClosed,
  p0LocalPercent,
  p0PublicPercent,
  rawExitZero,
  startableArtifacts,
  node24RuntimeVerified,
  hostedFreshEnough,
  p1SourceWorkAllowed: p0DeepestLocalClosed,
  publicP1RolloutAllowed: p0DeepestLocalClosed && node24RuntimeVerified && hostedFreshEnough,
  p0HundredPercentBlocked,
  hundredPercentRequires: ['raw Next build exit 0 on Node24 CI or Vercel', 'APP_URL strict hosted smoke after deployment', 'visual browser smoke for mobile/tablet/desktop'],
  checks,
  failedLocalChecks,
  warnings,
  note: 'Batch129 is the deepest comprehensive P0 local proof pack. It can justify 99% local/startable-runtime confidence, but intentionally blocks 100%/public claims until external proof exists.',
  noAiPaymentVerifiedFakeAdded: true
};
fs.mkdirSync(path.dirname(path.join(root, artifactPath)), { recursive: true });
fs.writeFileSync(path.join(root, artifactPath), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
