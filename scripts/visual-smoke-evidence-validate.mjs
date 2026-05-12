import fs from 'node:fs';
import path from 'node:path';

const policy = JSON.parse(fs.readFileSync('data/runtime-p0-hosted-final-proof-policy.json', 'utf8'));
const evidencePath = process.env.GIAOAN_VISUAL_SMOKE_EVIDENCE_PATH || 'artifacts/visual-smoke-evidence.json';
const minScreenshotBytes = Number(process.env.GIAOAN_VISUAL_SMOKE_MIN_BYTES || 8000);
const issues = [];
function finish(result, code) {
  const artifactPath = 'artifacts/visual-smoke-evidence-validate-last-run.json';
  fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
  fs.writeFileSync(artifactPath, JSON.stringify({ ...result, artifactPath, generatedAt: new Date().toISOString() }, null, 2) + '\n');
  console[code === 0 ? 'log' : 'error'](JSON.stringify(result, null, 2));
  process.exit(code);
}
if (!fs.existsSync(evidencePath)) {
  finish({ ok: false, status: 'FAIL', error: 'missing_visual_smoke_evidence', evidencePath, message: 'Thiếu artifacts/visual-smoke-evidence.json. Chạy npm run visual:smoke:evidence-template để tạo mẫu, sau đó capture thật rồi validate lại.' }, 2);
}
let evidence;
try { evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8')); }
catch (error) { finish({ ok: false, status: 'FAIL', error: 'invalid_visual_smoke_evidence_json', evidencePath, message: String(error?.message || error) }, 2); }
const captures = Array.isArray(evidence.captures) ? evidence.captures : [];
const requiredFlows = policy.visualSmoke.requiredFlows || [];
for (const viewport of policy.visualSmoke.requiredViewports || []) {
  const capture = captures.find((item) => item.viewportId === viewport.id);
  if (!capture) { issues.push(`missing viewport ${viewport.id}`); continue; }
  if (capture.width !== viewport.width || capture.height !== viewport.height) issues.push(`${viewport.id} wrong viewport size ${capture.width}x${capture.height}`);
  if (capture.status !== 'pass') issues.push(`${viewport.id} status must be pass`);
  if (!capture.screenshotPath || !String(capture.screenshotPath).trim()) {
    issues.push(`${viewport.id} missing screenshotPath`);
  } else if (!fs.existsSync(capture.screenshotPath)) {
    issues.push(`${viewport.id} screenshot file missing: ${capture.screenshotPath}`);
  } else if (fs.statSync(capture.screenshotPath).size < minScreenshotBytes) {
    issues.push(`${viewport.id} screenshot file too small: ${fs.statSync(capture.screenshotPath).size}`);
  }
  const flows = Array.isArray(capture.flows) ? capture.flows : [];
  for (const flow of requiredFlows) if (!flows.includes(flow)) issues.push(`${viewport.id} missing flow ${flow}`);
}
if (evidence.ok !== true) issues.push('evidence.ok must be true after real visual smoke passes');
finish({ ok: issues.length === 0, status: issues.length === 0 ? 'PASS' : 'FAIL', evidencePath, requiredViewports: policy.visualSmoke.requiredViewports.length, checkedCaptures: captures.length, issues, message: issues.length === 0 ? 'Visual smoke evidence passed with screenshot file checks.' : 'Không claim visual smoke pass/public rollout khi còn issue.' }, issues.length === 0 ? 0 : 1);

// Required visual flow marker: governance_labels_visible
