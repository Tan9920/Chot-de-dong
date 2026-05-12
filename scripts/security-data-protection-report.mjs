import fs from 'node:fs';

const policy = JSON.parse(fs.readFileSync('data/security-data-protection-foundation-policy.json', 'utf8'));
const report = {
  ok: true,
  batch: policy.batch,
  phase: policy.phase,
  sourceFoundationReady: Array.isArray(policy.controls) && policy.controls.filter((control) => control.required).length >= 6,
  publicRolloutAllowed: false,
  releaseBlockers: policy.releaseBlockers,
  noAiNoPaymentNoFakeVerified: policy.scope,
  note: 'Batch130 report is source-level. Re-run hosted strict smoke, Node24 CI/Vercel proof, and real browser visual smoke before public rollout.'
};
fs.mkdirSync('artifacts', { recursive: true });
fs.writeFileSync('artifacts/security-data-protection-report-last-run.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
