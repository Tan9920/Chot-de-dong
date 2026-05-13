import fs from 'node:fs';
import path from 'node:path';

const artifactPath = process.env.GIAOAN_HOSTED_PROOF_PREFLIGHT_ARTIFACT || 'artifacts/p0-hosted-final-proof-preflight-last-run.json';
const dryRun = process.argv.includes('--local-dry-run') || process.argv.includes('--dry-run');
const issues = [];

function nodeMajor(version = process.versions.node) {
  return Number(String(version || '').split('.')[0] || 0);
}

function rawAppUrl() {
  return process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.GIAOAN_DEMO_URL || process.argv.find((arg) => /^https?:\/\//i.test(arg)) || '';
}

function normalizeUrl(input) {
  const value = String(input || '').trim();
  if (!value) return null;
  const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  url.hash = '';
  url.search = '';
  return url;
}

function isLocalUrl(url) {
  return Boolean(url && /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/i.test(url.hostname));
}

function safeUrlSummary(url) {
  if (!url) return { present: false };
  return {
    present: true,
    protocol: url.protocol,
    host: url.host,
    origin: url.origin,
    isLocal: isLocalUrl(url)
  };
}

let parsedUrl = null;
try {
  parsedUrl = normalizeUrl(rawAppUrl());
} catch (error) {
  issues.push(`invalid_app_url:${error?.message || error}`);
}

const node24 = nodeMajor() === 24;
const githubActions = process.env.GITHUB_ACTIONS === 'true';
const githubWorkflow = process.env.GITHUB_WORKFLOW || '';
const githubRunId = process.env.GITHUB_RUN_ID || '';
const runnerOS = process.env.RUNNER_OS || '';
const strict = !dryRun;

if (!node24) issues.push(`node_major_${nodeMajor()}_not_24`);
if (!parsedUrl) issues.push('missing_APP_URL_NEXT_PUBLIC_APP_URL_or_GIAOAN_DEMO_URL');
if (parsedUrl && parsedUrl.protocol !== 'https:') issues.push('hosted_proof_requires_https_url');
if (parsedUrl && isLocalUrl(parsedUrl)) issues.push('hosted_proof_requires_non_localhost_url');
if (!githubActions) issues.push('missing_github_actions_provenance');
if (githubActions && !githubWorkflow) issues.push('missing_github_workflow');
if (githubActions && !githubRunId) issues.push('missing_github_run_id');
if (githubActions && !runnerOS) issues.push('missing_runner_os');

const result = {
  ok: issues.length === 0,
  status: issues.length === 0 ? 'PASS' : (dryRun ? 'BLOCKED_DRY_RUN' : 'FAIL'),
  mode: dryRun ? 'local_dry_run' : 'strict_hosted_ci',
  generatedAt: new Date().toISOString(),
  nodeVersion: process.versions.node,
  nodeMajor: nodeMajor(),
  node24,
  appUrl: safeUrlSummary(parsedUrl),
  ciProvenance: {
    githubActions,
    githubWorkflow: githubWorkflow || null,
    githubRunId: githubRunId || null,
    runnerOS: runnerOS || null,
    githubSha: process.env.GITHUB_SHA || null,
    githubRef: process.env.GITHUB_REF || null
  },
  strictRequirements: [
    'Node major version is 24',
    'GitHub Actions CI provenance is present',
    'APP_URL/NEXT_PUBLIC_APP_URL/GIAOAN_DEMO_URL is present',
    'Hosted URL is HTTPS and not localhost',
    'No AI/payment/fake verified/community auto-public change'
  ],
  issues,
  blockedClaims: issues.length === 0 ? [] : [
    'hosted proof closed',
    'public rollout allowed',
    'production-ready',
    '100% closure'
  ],
  noAiPaymentVerifiedFakeAdded: true,
  warning: dryRun
    ? 'Dry run records why hosted proof remains blocked. It intentionally exits 0 for local/source verification.'
    : 'Strict hosted CI preflight must pass before final hosted proof can be claimed.'
};

fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
fs.writeFileSync(artifactPath, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ ok: result.ok, status: result.status, mode: result.mode, artifactPath, issues: result.issues }, null, 2));
process.exit(result.ok || dryRun ? 0 : 1);
