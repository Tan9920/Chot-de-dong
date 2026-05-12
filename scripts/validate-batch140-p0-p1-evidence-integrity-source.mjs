import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''; }
function readJson(file, fallback = {}) { try { return JSON.parse(read(file) || JSON.stringify(fallback)); } catch { return fallback; } }
function writeJson(file, value) { fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); }
const issues = [];
function check(label, condition, detail = '') { if (!condition) issues.push(detail ? `${label}: ${detail}` : label); }

const pkg = readJson('package.json');
const lock = readJson('package-lock.json');
const policy = readJson('data/p0-p1-local-evidence-policy.json');
const runner = read('scripts/p0-p1-local-evidence-runner.mjs');
const report = read('scripts/p0-p1-local-evidence-report.mjs');
const lib = read('lib/p0-p1-local-evidence.ts');
const registry = read('scripts/run-source-validators.mjs');
const readme = read('README.md');
const notes = `${read('BATCH140_NOTES.md')}\n${read('docs/BATCH140_P0_P1_EVIDENCE_REPORT_INTEGRITY_FIX.md')}`;

check('package version must be 0.140.0 or later-compatible', ['0.140.0','0.141.0','0.142.0'].includes(pkg.version), `got ${pkg.version}`);
check('package-lock version must be 0.140.0 or later-compatible', ['0.140.0','0.141.0','0.142.0'].includes(lock.version), `got ${lock.version}`);
check('package-lock root version must be 0.140.0 or later-compatible', ['0.140.0','0.141.0','0.142.0'].includes(lock.packages?.['']?.version), `got ${lock.packages?.['']?.version}`);
check('node engine must remain 24.x', pkg.engines?.node === '24.x', pkg.engines?.node);
for (const script of ['batch140:p0-p1-evidence-integrity-validate','smoke:batch140','verify:batch140','p0-p1:local-evidence-report','p0-p1:local-evidence-runner']) {
  check(`package.json missing script ${script}`, Boolean(pkg.scripts?.[script]));
}
check('policy must be Batch140 evidence integrity fix', policy.batch === 'Batch140 — P0/P1 Evidence Report Integrity Fix' && policy.version === '0.140.0');
check('policy must keep rollout/production blocked', policy.productionReady === false && policy.publicRolloutAllowed === false && policy.sourceLevelOnly === true);
check('policy must define strict integrity rules', JSON.stringify(policy.integrityRules || {}).includes('completed === total') && JSON.stringify(policy.integrityRules || {}).includes('status === pass'));
check('runner must not recursively call local evidence report', !runner.includes("id: 'local_evidence_report'") && !runner.includes('npm run p0-p1:local-evidence-report'));
check('runner partial artifacts must be ok=false while running', runner.includes("ok: false, status: 'running'") && runner.includes('Partial runner artifacts are deliberately ok=false'));
check('runner final artifact must include completed and total', runner.includes('completed: results.length') && runner.includes('total: commands.length'));
for (const text of [report, lib]) {
  check('report/lib must define localRunnerIntegrity', text.includes('function localRunnerIntegrity'));
  check('report/lib must require runner status pass', text.includes("status === 'pass'"));
  check('report/lib must require completed === total', text.includes('completed === total'));
  check('report/lib must require commands.length === total', text.includes('commands.length === total'));
  check('report/lib must expose evidenceIntegrityWarnings', text.includes('evidenceIntegrityWarnings'));
  check('report/lib must expose higherLocalP0P1ClaimAllowed', text.includes('higherLocalP0P1ClaimAllowed'));
}
check('source validator registry must include Batch140 validator', registry.includes('validate-batch140-p0-p1-evidence-integrity-source.mjs'));
check('README/docs must mention Batch140', `${readme}\n${notes}`.includes('Batch140'));
check('README/docs must mention no AI/payment/fake verified', `${readme}\n${notes}`.toLowerCase().includes('không thêm ai') && `${readme}\n${notes}`.toLowerCase().includes('không thêm thanh toán') && `${readme}\n${notes}`.toLowerCase().includes('verified giả'));

// Regression check: a runner artifact that says ok=true but status=running/completed<total must not be counted as pass.
const runnerArtifact = 'artifacts/p0-p1-local-evidence-runner-last-run.json';
const reportArtifact = 'artifacts/p0-p1-local-evidence-report-last-run.json';
const runnerBackup = read(runnerArtifact);
const reportBackup = read(reportArtifact);
try {
  writeJson(runnerArtifact, {
    ok: true,
    status: 'running',
    batch: 'Batch139 simulated incomplete artifact',
    version: '0.139.0',
    completed: 6,
    total: 12,
    commands: Array.from({ length: 6 }, (_, index) => ({ id: `simulated_${index + 1}`, ok: true, status: 'pass' })),
    generatedAt: new Date().toISOString()
  });
  const run = spawnSync(process.execPath, ['scripts/p0-p1-local-evidence-report.mjs'], { encoding: 'utf8' });
  const generatedReport = readJson(reportArtifact);
  const runnerGate = generatedReport.gates?.find?.((gate) => gate.id === 'local_evidence_runner');
  check('regression report must not pass incomplete running runner artifact', run.status !== 0 && generatedReport.ok === false && generatedReport.evidenceIntegrityReady === false, `exit=${run.status} ok=${generatedReport.ok}`);
  check('regression runner gate state must be running, not pass', runnerGate?.state === 'running' && runnerGate?.artifactOk === false, JSON.stringify(runnerGate));
  check('regression must suggest rerunning local evidence runner', Array.isArray(generatedReport.nextCommands) && generatedReport.nextCommands.includes('npm run p0-p1:local-evidence-runner'), JSON.stringify(generatedReport.nextCommands));
} finally {
  if (runnerBackup) fs.writeFileSync(runnerArtifact, runnerBackup, 'utf8');
  else if (fs.existsSync(runnerArtifact)) fs.unlinkSync(runnerArtifact);
  if (reportBackup) fs.writeFileSync(reportArtifact, reportBackup, 'utf8');
  else if (fs.existsSync(reportArtifact)) fs.unlinkSync(reportArtifact);
}

const pkgText = JSON.stringify(pkg).toLowerCase();
for (const forbidden of ['openai','@google/generative-ai','@anthropic-ai/sdk','anthropic','langchain','stripe','paypal']) {
  check(`forbidden dependency ${forbidden}`, !pkgText.includes(`"${forbidden}`));
}
const combined = `${JSON.stringify(policy)}\n${runner}\n${report}\n${lib}`.toLowerCase();
check('Batch140 must not unlock production readiness', !combined.includes('productionready: true'));
check('Batch140 must not auto-public community', !combined.includes('autopublic: true') && !combined.includes('auto-public: true'));

const result = {
  ok: issues.length === 0,
  batch: 'Batch140 P0/P1 Evidence Report Integrity Fix',
  sourceLevelOnly: true,
  regressionCovered: true,
  noAiPaymentOrFakeVerifiedAdded: true,
  issues,
  note: 'Validates that incomplete/running p0-p1 local runner artifacts cannot be counted as pass. It does not prove Node24 hosted/public/production readiness.'
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
