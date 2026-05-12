import fs from 'node:fs';

const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
const exists = (file) => fs.existsSync(file);
const issues = [];
function requireFile(file) { if (!exists(file)) issues.push(`Missing file: ${file}`); }
function requireMarker(file, marker, label = marker) { if (!read(file).includes(marker)) issues.push(`${file} missing marker: ${label}`); }
function forbidMarker(file, marker, label = marker) { if (read(file).includes(marker)) issues.push(`${file} still has forbidden marker: ${label}`); }
function requireMinLines(file, minLines, label = file) {
  const lines = read(file).split('\n').filter((line) => line.trim()).length;
  if (lines < minLines) issues.push(`${label} too shallow: ${lines} lines < ${minLines}`);
}

[
  'lib/strategy-risk-audit.ts',
  'app/api/product/strategy-risk-audit/route.ts',
  'lib/activity-game-moderation.ts',
  'lib/activity-game-library.ts',
  'lib/forum-thread-safety.ts',
  'lib/community-moderation.ts',
  'data/activity-game-contributions.json',
  'scripts/validate-batch80-deep-hidden-risk-source.mjs',
  'scripts/run-source-validators.mjs',
  'scripts/clean-npm-ci.mjs',
  'scripts/clean-npm-command.mjs',
  'BATCH80_NOTES.md'
].forEach(requireFile);

requireMarker('scripts/run-source-validators.mjs', 'GIAOAN_SOURCE_VALIDATOR_TIMEOUT_MS', 'per-validator timeout');
requireMarker('scripts/run-source-validators.mjs', 'timeoutMs', 'timeout budget marker');
requireMarker('scripts/clean-npm-ci.mjs', 'GIAOAN_NPM_CI_TIMEOUT_MS', 'npm ci timeout env');
requireMarker('scripts/clean-npm-ci.mjs', 'fetch-timeout=30000', 'npm fetch timeout');
requireMarker('scripts/clean-npm-command.mjs', 'GIAOAN_NPM_COMMAND_TIMEOUT_MS', 'clean command timeout env');
requireMarker('lib/strategy-risk-audit.ts', 'Không lấy AI làm lõi giai đoạn đầu', 'strategy principle');
requireMarker('lib/strategy-risk-audit.ts', 'Seed/scaffold/community không được nâng thành verified', 'data truth principle');
requireMarker('app/api/product/strategy-risk-audit/route.ts', 'buildStrategyRiskAudit', 'risk audit API');

requireMinLines('lib/activity-game-moderation.ts', 80, 'activity-game moderation implementation');
requireMinLines('lib/forum-thread-safety.ts', 80, 'forum thread safety implementation');
requireMinLines('lib/community-moderation.ts', 90, 'community moderation implementation');
forbidMarker('lib/activity-game-moderation.ts', "return { id: 'game-contrib-' + Date.now(), status: 'pending_review'", 'old activity game stub');
forbidMarker('lib/forum-thread-safety.ts', 'let threads: any[] = [];', 'old in-memory forum stub');
forbidMarker('lib/community-moderation.ts', 'let resources: any[] = [];', 'old in-memory community stub');
requireMarker('lib/activity-game-moderation.ts', 'sourceLicenseRequiredBeforePublic', 'source/license public gate');
requireMarker('lib/forum-thread-safety.ts', 'personalDataHold', 'forum personal data hold');
requireMarker('lib/community-moderation.ts', 'takedownBlocksPublic', 'community takedown blocks public');

const pkg = JSON.parse(read('package.json') || '{}');
for (const script of ['strategy:risk-audit','deep:hidden-risk-validate','smoke:batch80','verify:batch80']) {
  if (!pkg.scripts?.[script]) issues.push(`package.json missing script: ${script}`);
}

let activityContributionsOk = false;
try { activityContributionsOk = Array.isArray(JSON.parse(read('data/activity-game-contributions.json'))); } catch {}
if (!activityContributionsOk) issues.push('data/activity-game-contributions.json must be JSON array');

const result = {
  ok: issues.length === 0,
  checked: 12,
  issues,
  note: 'Batch80 validates hidden-risk audit surface, timeout-safe validators/install commands, and community/activity moderation hardening at source level only.'
};
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
