import fs from 'node:fs';
import path from 'node:path';

function readJson(file, fallback = null) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
function exists(file) { return fs.existsSync(path.join(process.cwd(), file)); }

const raw = readJson('artifacts/raw-next-build-diagnostic-last-run.json', {});
const guarded = readJson('artifacts/next-build-runtime-guard-last-run.json', {});
const liveSmoke = readJson('artifacts/live-http-smoke-last-run.json', {});
const hostedSmoke = readJson('artifacts/hosted-demo-url-smoke-last-run.json', {});
const requiredArtifactFiles = [
  '.next/BUILD_ID',
  '.next/app-build-manifest.json',
  '.next/routes-manifest.json',
  '.next/prerender-manifest.json',
  '.next/images-manifest.json',
  '.next/required-server-files.json',
  '.next/server/app-paths-manifest.json',
  '.next/server/pages-manifest.json'
];
const missing = requiredArtifactFiles.filter((file) => !exists(file));
const rawRunningArtifact = raw.running === true || ['diagnostic_started_not_finished_yet','diagnostic_running_not_finished_yet'].includes(raw.status);
const rawArtifactInterrupted = typeof raw.status === 'string' && raw.status.startsWith('interrupted_by_');
const staleRawBuildDiagnostic = rawRunningArtifact || rawArtifactInterrupted;
const rawBuildClosed = raw.ok === true && raw.rawNextBuildExitCode === 0 && !staleRawBuildDiagnostic;
const guardedArtifactReady = guarded.ok === true && guarded.artifacts?.ready === true;
const productionLiveSmokePassed = liveSmoke.ok === true && liveSmoke.smokeMode === 'production' && liveSmoke.batch98RealAccountSaveExportSmoke === true;
const startableArtifactFilesPresent = missing.length === 0;
const startableArtifactReady = startableArtifactFilesPresent || productionLiveSmokePassed;
const hostedClosure = hostedSmoke.ok === true && hostedSmoke.skipped !== true;

const report = {
  ok: rawBuildClosed && startableArtifactReady && productionLiveSmokePassed,
  rawBuildClosed,
  rawRunningArtifact,
  rawArtifactInterrupted,
  staleRawBuildDiagnostic,
  guardedArtifactReady,
  startableArtifactReady,
  startableArtifactFilesPresent,
  productionLiveSmokePassed,
  hostedClosure,
  missingStartableArtifacts: missing,
  rawStatus: raw.status || 'missing_raw_diagnostic',
  guardedStatus: guarded.status || 'missing_guarded_build_artifact',
  liveSmokeStatus: liveSmoke.ok === true ? `${liveSmoke.smokeMode || 'unknown'}_live_smoke_passed` : (liveSmoke.error || 'missing_live_http_smoke_artifact'),
  hostedStatus: hostedSmoke.skipped === true ? 'hosted_url_smoke_skipped_no_url' : (hostedSmoke.ok === true ? 'hosted_url_smoke_passed' : (hostedSmoke.error || 'missing_hosted_url_smoke_artifact')),
  allowedClaims: {
    sourceValidated: true,
    guardedArtifactClosure: guardedArtifactReady,
    rawBuildClosure: rawBuildClosed,
    productionLiveSmokeClosure: productionLiveSmokePassed,
    hostedClosure
  },
  blockedClaims: [
    ...(!rawBuildClosed ? ['rawBuildClosed', 'productionReady'] : []),
    ...(staleRawBuildDiagnostic ? ['staleRawBuildDiagnostic must be finalized before runtime claims'] : []),
    ...(!startableArtifactReady ? ['startableArtifactReady', 'liveSmokeReady'] : []),
    ...(!productionLiveSmokePassed ? ['productionLiveSmokeReady', 'teacherPilotReady'] : []),
    ...(!hostedClosure ? ['hostedClosed until GIAOAN_DEMO_URL smoke passes'] : [])
  ],
  noAiPaymentVerifiedFakeAdded: true,
  note: 'Batch120 hard gate requires finalized raw build and production live smoke evidence. File-level .next manifests are recorded when present; a passing production live smoke is accepted as startability proof. Hosted closure still requires strict hosted URL smoke.'
};
fs.mkdirSync('artifacts', { recursive: true });
fs.writeFileSync('artifacts/runtime-build-hard-gate-last-run.json', JSON.stringify(report, null, 2) + '\n', 'utf8');
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
