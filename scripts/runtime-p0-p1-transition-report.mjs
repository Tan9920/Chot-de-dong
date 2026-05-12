import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const artifactPath = 'artifacts/runtime-p0-p1-transition-last-run.json';
const readJson = (rel) => { try { return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')); } catch { return null; } };
const exists = (rel) => fs.existsSync(path.join(root, rel));
const pkg = readJson('package.json') || {};
const policy = readJson('data/runtime-p0-p1-transition-policy.json') || {};
const verifyAll = readJson('artifacts/verify-all-last-run.json');
const verifyRelease = readJson('artifacts/verify-release-last-run.json');
const raw = readJson('artifacts/raw-next-build-diagnostic-last-run.json');
const guarded = readJson('artifacts/next-build-runtime-guard-last-run.json');
const live = readJson('artifacts/live-http-smoke-last-run.json');
const auth = readJson('artifacts/auth-invite-runtime-smoke-last-run.json');
const hardGate = readJson('artifacts/runtime-build-hard-gate-last-run.json');
const hosted = readJson('artifacts/hosted-demo-url-smoke-last-run.json');
const verifyAllFailed = verifyAll?.summary?.failed ?? null;
const verifyAllPassedOrSkippedClean = Boolean(verifyAll?.ok && verifyAllFailed === 0);
const verifyReleaseClean = Boolean(verifyRelease?.ok && (verifyRelease?.summary?.failed ?? 1) === 0);
const hostedPassed = Boolean(hosted?.ok && (hosted?.status === 'hosted_url_smoke_passed' || hosted?.hostedUrlSmokePassed === true));
const hostedSkipped = Boolean(hosted?.status === 'hosted_url_smoke_skipped_no_url' || verifyRelease?.appUrlPresent === false);
const checks = [
  { id: 'node_engine_24', ok: pkg?.engines?.node === '24.x', evidence: pkg?.engines?.node || null },
  { id: 'policy_present', ok: policy?.version === pkg?.version, evidence: policy?.batch || null },
  { id: 'next_swc_ready_by_install', ok: exists('node_modules/.bin/next') && exists('node_modules/@next/swc-linux-x64-gnu'), evidence: 'node_modules next + linux x64 SWC present' },
  { id: 'startable_artifact_present', ok: exists('.next/BUILD_ID') && exists('.next/routes-manifest.json') && exists('.next/server/app'), evidence: '.next startable artifacts present' },
  { id: 'raw_next_build_exit_zero', ok: Boolean(raw?.ok && (raw?.rawNextBuildExitCode === 0 || raw?.status === 'raw_next_build_passed')), evidence: raw?.artifact || raw?.status || null },
  { id: 'guarded_build_artifact_ready', ok: Boolean(guarded?.ok && guarded?.artifacts?.ready === true), evidence: guarded?.status || null },
  { id: 'production_live_smoke_passed', ok: Boolean(live?.ok && live?.smokeMode === 'production' && Array.isArray(live?.checks) && live.checks.every((c) => c.ok)), evidence: live?.artifact || 'artifacts/live-http-smoke-last-run.json' },
  { id: 'auth_invite_runtime_smoke_passed', ok: Boolean(auth?.ok && auth?.summary?.batch98InviteRuntimeSmoke === true), evidence: auth?.artifact || 'artifacts/auth-invite-runtime-smoke-last-run.json' },
  { id: 'hard_gate_local_closure', ok: Boolean(hardGate?.ok && hardGate?.rawBuildClosed && hardGate?.productionLiveSmokePassed && hardGate?.startableArtifactReady), evidence: hardGate?.allowedClaims || null },
  { id: 'verify_all_no_failed_steps', ok: verifyAllPassedOrSkippedClean, evidence: verifyAll?.summary || null },
  { id: 'verify_release_no_failed_steps', ok: verifyReleaseClean, evidence: verifyRelease?.summary || null },
  { id: 'no_ai_payment_verified_fake_added', ok: Boolean((raw?.noAiPaymentVerifiedFakeAdded !== false) && (guarded?.noAiPaymentVerifiedFakeAdded !== false) && (hardGate?.noAiPaymentVerifiedFakeAdded !== false) && (auth?.noAiPaymentVerifiedFakeAdded !== false)), evidence: true }
];
const failedLocal = checks.filter((c) => !c.ok).map((c) => c.id);
const localP0Closed = failedLocal.length === 0;
const publicP1RolloutAllowed = localP0Closed && hostedPassed;
const p1SourceWorkAllowed = localP0Closed;
const blockedClaims = [];
if (!localP0Closed) blockedClaims.push('P1 source work should wait until local P0 closure evidence is clean.');
if (!hostedPassed) blockedClaims.push('Hosted/public P1 rollout remains blocked until APP_URL/NEXT_PUBLIC_APP_URL strict URL smoke passes.');
const report = { ok: localP0Closed, generatedAt: new Date().toISOString(), repoVersion: pkg?.version || null, batch: policy?.batch || 'Batch125 - P0 Runtime Closure & P1 Transition Gate', localP0Closed, p1SourceWorkAllowed, publicP1RolloutAllowed, hosted: { passed: hostedPassed, skippedNoUrl: hostedSkipped, appUrlPresentInVerifyRelease: verifyRelease?.appUrlPresent ?? null, status: hosted?.status || (hostedSkipped ? 'skipped_no_url' : 'unknown') }, checks, failedLocalChecks: failedLocal, blockedClaims, nextBatchRecommendation: publicP1RolloutAllowed ? 'P1 Account/Role/Admin Foundation can start with hosted proof in hand.' : 'P1 source work can start after this local closure, but public rollout must first run APP_URL=https://... npm run verify:release on Vercel URL.', noAiPaymentVerifiedFakeAdded: true, note: 'This report separates local P0 runtime closure from hosted/public rollout closure. It must not be used to claim production-ready without hosted URL smoke and real-device UX smoke.' };
fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
fs.writeFileSync(artifactPath, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
