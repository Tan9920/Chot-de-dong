import fs from 'node:fs';
import path from 'node:path';

const policy = JSON.parse(fs.readFileSync('data/runtime-p0-hosted-final-proof-policy.json', 'utf8'));
const out = process.env.GIAOAN_VISUAL_SMOKE_TEMPLATE_PATH || 'artifacts/visual-smoke-evidence-template.json';
const captures = [];
for (const viewport of policy.visualSmoke.requiredViewports || []) {
  captures.push({
    viewportId: viewport.id,
    width: viewport.width,
    height: viewport.height,
    deviceClass: viewport.deviceClass,
    status: 'not_captured',
    screenshotPath: `artifacts/visual-smoke/${viewport.id}.png`,
    flows: policy.visualSmoke.requiredFlows || [],
    notes: 'Capture real browser screenshot after hosted deploy; change status to pass only after manual/automated visual check.'
  });
}
const template = {
  ok: false,
  generatedAt: new Date().toISOString(),
  source: 'visual-smoke-evidence-template',
  appUrl: process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.GIAOAN_DEMO_URL || '',
  captures,
  requiredFlows: policy.visualSmoke.requiredFlows || [],
  claimWarning: 'This template is not proof. Copy to artifacts/visual-smoke-evidence.json only after real screenshots/checks are captured and passed.',
  noAiPaymentVerifiedFakeAdded: true
};
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(template, null, 2) + '\n');
console.log(JSON.stringify({ ok: true, artifactPath: out, captureCount: captures.length, note: template.claimWarning }, null, 2));
