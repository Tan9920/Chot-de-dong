import fs from 'fs';
import path from 'path';

const root = process.cwd();
const requiredFiles = [
  'data/product-foundation.json',
  'lib/product-foundation.ts',
  'app/api/product/foundation/route.ts',
  'docs/BASIC_PRODUCT_FOUNDATION.md',
  'components/workspace.tsx',
  'lib/demo-basic-flow.ts',
  'package.json'
];

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(root, file)));
const issues = [];
let foundation = null;
try {
  foundation = JSON.parse(read('data/product-foundation.json'));
} catch (error) {
  issues.push(`data/product-foundation.json parse failed: ${error.message}`);
}

if (foundation) {
  if (foundation?.positioning?.nonAiFirst !== true) issues.push('positioning.nonAiFirst must be true');
  if (foundation?.positioning?.teacherFinalReviewRequired !== true) issues.push('teacherFinalReviewRequired must be true');
  for (const label of ['seed', 'scaffold', 'community', 'reviewed', 'verified', 'approved_for_release']) {
    if (!foundation?.dataTruthModel?.requiredLabels?.includes(label)) issues.push(`missing data truth label ${label}`);
  }
  for (const mode of ['Dễ dùng', 'Tiêu chuẩn', 'Nâng cao']) {
    if (!JSON.stringify(foundation.interfaceModes || []).includes(mode)) issues.push(`missing interface mode ${mode}`);
  }
  for (const plan of ['free', 'pro', 'team', 'school']) {
    if (!foundation?.planFoundation?.[plan]) issues.push(`missing plan foundation ${plan}`);
  }
  for (const state of ['submitted', 'approved_community', 'taken_down']) {
    if (!foundation?.communityFoundation?.states?.includes(state)) issues.push(`missing community state ${state}`);
  }
  if (!Array.isArray(foundation.runtimeGates) || foundation.runtimeGates.length < 7) issues.push('runtimeGates must list install/typecheck/build/live smoke/browser QA gates');
}

const workspace = missing.includes('components/workspace.tsx') ? '' : read('components/workspace.tsx');
const basicFlow = missing.includes('lib/demo-basic-flow.ts') ? '' : read('lib/demo-basic-flow.ts');
const pkg = missing.includes('package.json') ? '' : read('package.json');

if (!workspace.includes('/api/product/foundation')) issues.push('workspace must fetch /api/product/foundation');
if (!workspace.includes('Nền móng sản phẩm dài hạn')) issues.push('workspace must expose long-term product foundation without making normal UX too technical');
if (!basicFlow.includes('app/api/product/foundation/route.ts')) issues.push('basic flow board must check product foundation route');
if (!pkg.includes('product:foundation-validate') || !pkg.includes('smoke:batch70')) issues.push('package.json missing Batch70 validation scripts');

const forbiddenPackageTerms = ['openai', '@anthropic', '@google/generative-ai', 'langchain'];
for (const term of forbiddenPackageTerms) {
  if (pkg.toLowerCase().includes(term)) issues.push(`forbidden AI dependency found in package.json: ${term}`);
}

const result = {
  ok: missing.length === 0 && issues.length === 0,
  missing,
  issues,
  checkedFiles: requiredFiles.length,
  note: 'Source-level validation only. Still run npm install/typecheck/build/live smoke before claiming deploy-ready.'
};

console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
process.exit(0);
