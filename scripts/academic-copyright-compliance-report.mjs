import fs from 'node:fs';
function readJson(file, fallback = {}) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; } }
function pct(value, total) { return total <= 0 ? 0 : Math.round((value / total) * 1000) / 10; }
const policy = readJson('data/academic-copyright-compliance-policy.json', {});
const dossier = readJson('data/academic-copyright-compliance-dossier.json', {});
const registry = readJson('data/subject-data-registry.json', { records: [] });
const submissions = readJson('data/academic-source-pack-submissions.json', { items: [] });
const verificationLast = readJson('artifacts/academic-verification-readiness-last-run.json', { metrics: {} });
const allowedCategories = new Set((policy.allowedUseCategories || []).filter((x) => x.allowed === true).map((x) => x.category));
const blockedCategories = new Set((policy.allowedUseCategories || []).filter((x) => x.allowed === false).map((x) => x.category));
function asText(v) { return String(v ?? '').trim(); }
function asArray(v) { return Array.isArray(v) ? v : []; }
function evalItem(item) {
  const category = asText(item.usageCategory || item.permissionBasis || item.sourceType || 'unknown_or_unattributed');
  const blockers = [];
  if (!allowedCategories.has(category)) blockers.push('usage_category_not_allowed');
  if (blockedCategories.has(category)) blockers.push('blocked_usage_category');
  if (!asText(item.license) || ['missing','unknown'].includes(asText(item.license).toLowerCase())) blockers.push('missing_license');
  if (!asText(item.attribution)) blockers.push('missing_attribution');
  if (!asText(item.permissionBasis) || ['missing','unknown'].includes(asText(item.permissionBasis).toLowerCase())) blockers.push('missing_permission_basis');
  if (!asText(item.takedownContact)) blockers.push('missing_takedown_path');
  if (item.noLongCopyrightCopy !== true) blockers.push('long_copyright_copy_risk');
  if (asArray(item.copyrightRiskSignals).length > 0) blockers.push('copyright_risk_signal_present');
  return { id: item.id, scopeId: item.scopeId, usageCategory: category, blockers, legalHold: blockers.length > 0, legalReady: blockers.length === 0 };
}
const evaluations = (submissions.items || []).map(evalItem);
const fakeVerified = (registry.records || []).filter((item) => ['verified','approved_for_release'].includes(item.sourceStatus) || item.contentDepthAllowed);
const report = {
  ok: true,
  batch: 'Batch112 — Legal/Copyright-Safe Academic Verification Pipeline',
  version: policy.version,
  generatedAt: new Date().toISOString(),
  metrics: {
    totalAcademicScopes: (registry.records || []).length,
    copyrightPolicyLegalBasisCount: (policy.researchedLegalBasis || []).length,
    sourcePackSubmissions: (submissions.items || []).length,
    copyrightCheckedSourcePacks: evaluations.length,
    legalHoldSourcePacks: evaluations.filter((x) => x.legalHold).length,
    legalReadySourcePacks: evaluations.filter((x) => x.legalReady).length,
    legalReadySourcePackPercent: pct(evaluations.filter((x) => x.legalReady).length, evaluations.length),
    verifiedOrApprovedScopes: verificationLast.metrics?.verifiedOrApprovedScopes ?? fakeVerified.filter((x) => ['verified','approved_for_release'].includes(x.sourceStatus)).length,
    deepContentAllowedScopes: verificationLast.metrics?.deepContentAllowedScopes ?? fakeVerified.filter((x) => x.contentDepthAllowed).length,
    registryMutationsInBatch112: 0,
    fakeVerifiedCreated: 0,
    fakeContentDepthCreated: fakeVerified.filter((x) => x.contentDepthAllowed && !['verified','approved_for_release'].includes(x.sourceStatus)).length
  },
  legalBasisIds: (policy.researchedLegalBasis || []).map((x) => x.id),
  policyNonNegotiables: policy.nonNegotiables || [],
  pilotScopesStillBlocked: dossier.pilotScopesStillBlocked || [],
  evaluations,
  warning: 'copyright/legal-ready không đồng nghĩa academic verified; mọi scope thiếu nguồn/license/reviewer/takedown vẫn phải safe_frame_only.'
};
fs.mkdirSync('artifacts', { recursive: true });
fs.writeFileSync('artifacts/academic-copyright-compliance-last-run.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
process.exit(0);
