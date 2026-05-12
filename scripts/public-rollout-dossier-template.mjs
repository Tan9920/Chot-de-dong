import fs from 'node:fs';
import path from 'node:path';

const policy = JSON.parse(fs.readFileSync('data/public-rollout-readiness-policy.json', 'utf8'));
const artifactPath = 'artifacts/public-rollout-dossier-template.json';
const sections = [
  {
    id: 'targetUsersAndScope',
    title: 'Target users and rollout scope',
    status: 'draft_required_before_public',
    checklist: ['Trusted internal reviewers only until hosted proof passes', 'No school-wide/team-wide/public rollout before final evidence']
  },
  {
    id: 'allowedClaims',
    title: 'Allowed claims',
    status: 'safe_claims_only',
    checklist: ['No-AI early stage', 'Template/rule-based safe lesson frame', 'Teacher must review and edit before official use']
  },
  {
    id: 'blockedClaims',
    title: 'Blocked claims',
    status: 'hard_blocked',
    checklist: policy.claimPolicy.mustNotClaimWithoutHostedEvidence
  },
  {
    id: 'rollbackPlan',
    title: 'Rollback plan',
    status: 'draft_required_before_public',
    checklist: ['Keep previous ZIP/release available', 'Disable public entry points if hosted smoke fails', 'Do not delete user data while triaging']
  },
  {
    id: 'safeModePlan',
    title: 'Founder absence / safe mode plan',
    status: 'draft_required_before_public',
    checklist: ['Freeze risky modules', 'Keep community auto-public disabled', 'Keep payment/AI/marketplace disabled']
  },
  {
    id: 'supportAndTakedownChannels',
    title: 'Support and takedown channels',
    status: 'draft_required_before_public',
    checklist: ['Visible report channel', 'Copyright/data takedown queue', 'No 24/7 promise unless staffed']
  },
  {
    id: 'visualSmokeChecklist',
    title: 'Visual smoke checklist',
    status: 'requires_real_capture',
    checklist: ['Mobile 360/390/430', 'Tablet 768', 'Desktop 1366/1440', 'Sidebar/bottom navigation not trapped']
  },
  {
    id: 'hostedProofCommands',
    title: 'Hosted proof commands',
    status: 'requires_node24_and_app_url',
    checklist: ['npm run verify:p0-deepest-node24-ci', 'APP_URL=https://<url> npm run verify:release:strict', 'APP_URL=https://<url> npm run verify:p0-100-release']
  },
  {
    id: 'noAiPaymentVerifiedFakeStatement',
    title: 'No AI/payment/fake-verified statement',
    status: 'locked',
    checklist: ['No AI/API/model call added', 'No payment/marketplace/quỹ/referral cash added', 'No verified fake records added']
  }
];
const missing = policy.dossierRequiredSections.filter((id) => !sections.some((section) => section.id === id));
const artifact = {
  ok: missing.length === 0,
  batch: policy.batch,
  version: policy.version,
  generatedAt: new Date().toISOString(),
  sections,
  missing,
  publicRolloutAllowed: false,
  productionReady: false,
  warning: 'This is a dossier template/evidence scaffold, not a public rollout approval.'
};
fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
fs.writeFileSync(artifactPath, JSON.stringify(artifact, null, 2) + '\n');
console.log(JSON.stringify({ ...artifact, artifactPath }, null, 2));
process.exit(artifact.ok ? 0 : 1);
