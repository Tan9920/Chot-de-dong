import fs from 'fs';
import path from 'path';

const RESOURCES_FILE = path.join(process.cwd(), 'data/community-resources.json');

type Severity = 'info' | 'warning' | 'blocker';
function nowIso() { return new Date().toISOString(); }
function text(value: any) { return String(value || '').trim(); }
function makeId() { return `community-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function issue(id: string, severity: Severity, message: string) { return { id, severity, message }; }
function ensureFile() { if (!fs.existsSync(RESOURCES_FILE)) fs.writeFileSync(RESOURCES_FILE, '[]\n'); }
function readItems() { ensureFile(); try { const parsed = JSON.parse(fs.readFileSync(RESOURCES_FILE, 'utf8')); return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
function writeItems(items: any[]) { ensureFile(); fs.writeFileSync(RESOURCES_FILE, JSON.stringify(items, null, 2) + '\n'); }

function statusRank(status: string) {
  return ['seed','scaffold','community','reviewed','verified','approved_for_release'].indexOf(status);
}

export async function readCommunityResources(..._args: any[]) { return readItems(); }

export async function listPublicCommunityResources(..._args: any[]) {
  return readItems().filter((resource: any) => resource.visibility === 'public' && ['approved_community', 'verified_official'].includes(resource.moderationStatus || resource.status));
}

export function assessCommunityResourcePublication(item: any = {}, legalAssets: any[] = [], policy: any = {}) {
  const issues: Array<{ id: string; severity: Severity; message: string }> = [];
  const sourceStatus = item.sourceStatus || 'community';
  const minimumSourceStatus = policy.minimumSourceStatus || 'reviewed';
  const hasSource = Boolean(text(item.sourceUrl) || text(item.attribution) || (Array.isArray(item.sourceRefs) && item.sourceRefs.length));
  const hasLicense = Boolean(text(item.license));
  const copyrightRisk = item.copyrightRisk || 'unknown';
  const relatedLegalAsset = item.legalAssetId ? legalAssets.find((asset: any) => asset.id === item.legalAssetId) : null;
  if (!text(item.title)) issues.push(issue('missing_title', 'blocker', 'Thiếu tiêu đề tài nguyên.'));
  if (!hasSource) issues.push(issue('missing_source', 'blocker', 'Thiếu nguồn/source reference/attribution.'));
  if (!hasLicense) issues.push(issue('missing_license', 'blocker', 'Thiếu license/quyền sử dụng.'));
  if (statusRank(sourceStatus) < statusRank(minimumSourceStatus)) issues.push(issue('source_not_reviewed', 'blocker', `sourceStatus ${sourceStatus} chưa đạt ${minimumSourceStatus}.`));
  if (['unknown', 'high'].includes(copyrightRisk)) issues.push(issue('copyright_risk_not_clear', copyrightRisk === 'high' ? 'blocker' : 'warning', 'Rủi ro bản quyền chưa rõ/thấp.'));
  if (item.takedownStatus === 'active' || item.status === 'taken_down') issues.push(issue('active_takedown', 'blocker', 'Tài nguyên đang bị takedown/giữ pháp lý.'));
  if (item.legalAssetId && !relatedLegalAsset) issues.push(issue('legal_asset_not_found', 'warning', 'Có legalAssetId nhưng không tìm thấy hồ sơ legal asset.'));
  const blockers = issues.filter((x) => x.severity === 'blocker').length;
  const warnings = issues.filter((x) => x.severity === 'warning').length;
  return { allowed: blockers === 0 && ['approved_community', 'verified_official'].includes(item.moderationStatus || item.status), issues, summary: { blockers, warnings, total: issues.length }, policy: { minimumSourceStatus, sourceLicenseRequired: true, takedownBlocksPublic: true } };
}

export async function createCommunityResource(input: any = {}, user: any = {}) {
  const createdAt = nowIso();
  const resource = {
    id: input.id || makeId(),
    type: text(input.type || 'lesson_resource'),
    grade: text(input.grade),
    subject: text(input.subject),
    title: text(input.title),
    description: text(input.description || input.summary),
    status: 'submitted',
    moderationStatus: 'submitted',
    visibility: 'review_queue',
    sourceStatus: input.sourceStatus || 'community',
    supportLevel: input.supportLevel || 'starter',
    releaseTier: input.releaseTier || 'internal_preview',
    sourceUrl: text(input.sourceUrl),
    sourceRefs: Array.isArray(input.sourceRefs) ? input.sourceRefs : [],
    license: text(input.license),
    attribution: text(input.attribution),
    copyrightRisk: input.copyrightRisk || 'unknown',
    authorId: user.id || user.email || 'anonymous-demo-user',
    authorName: user.name || 'Người đóng góp',
    createdAt,
    updatedAt: createdAt,
    reviewLog: []
  };
  writeItems([resource, ...readItems()]);
  return resource;
}

export async function reviewCommunityResource(id: string, input: any = {}, user: any = {}) {
  const items = readItems();
  const existing = items.find((item: any) => item.id === id);
  if (!existing) throw new Error('Không tìm thấy tài nguyên cộng đồng.');
  const action = input.action || input.decision || 'needs_revision';
  const candidate = { ...existing, ...input.updates, updatedAt: nowIso() };
  const readinessBefore = assessCommunityResourcePublication(candidate, [], { minimumSourceStatus: 'reviewed' });
  const wantsApprove = ['approve', 'approved_community', 'verified_official'].includes(action);
  const blockedFromPublic = wantsApprove && readinessBefore.summary.blockers > 0;
  const resource = { ...candidate };

  if (['reject', 'rejected'].includes(action)) {
    resource.status = 'rejected'; resource.moderationStatus = 'rejected'; resource.visibility = 'private';
  } else if (blockedFromPublic || action === 'needs_revision') {
    resource.status = 'needs_revision'; resource.moderationStatus = 'needs_revision'; resource.visibility = 'private';
  } else if (action === 'verified_official') {
    resource.status = 'verified_official'; resource.moderationStatus = 'verified_official'; resource.visibility = 'public'; resource.sourceStatus = ['verified', 'approved_for_release'].includes(resource.sourceStatus) ? resource.sourceStatus : 'verified';
  } else if (wantsApprove) {
    resource.status = 'approved_community'; resource.moderationStatus = 'approved_community'; resource.visibility = 'public'; resource.sourceStatus = ['reviewed', 'verified', 'approved_for_release'].includes(resource.sourceStatus) ? resource.sourceStatus : 'reviewed';
  }
  resource.reviewLog = [...(Array.isArray(existing.reviewLog) ? existing.reviewLog : []), { reviewerId: user.id || user.email || 'demo-reviewer', reviewerName: user.name || 'Reviewer', action, note: text(input.note), at: nowIso(), blockedFromPublic }];

  const readiness = assessCommunityResourcePublication(resource, [], { minimumSourceStatus: 'reviewed' });
  writeItems(items.map((item: any) => item.id === id ? resource : item));
  return { resource, readiness, blockedFromPublic, releaseDossier: { decision: readiness.allowed ? 'allowed' : 'blocked', blockerCount: readiness.summary.blockers }, releaseDossierSnapshotId: `community-${resource.id}-${Date.now()}` };
}

export async function requestCommunityResourceTakedown(id: string, input: any = {}, user: any = {}) {
  const items = readItems();
  const existing = items.find((item: any) => item.id === id);
  if (!existing) throw new Error('Không tìm thấy tài nguyên cần takedown.');
  const reason = typeof input === 'string' ? input : text(input.reason || input.note || 'takedown_request');
  const resource = { ...existing, status: 'taken_down', moderationStatus: 'taken_down', visibility: 'private', takedownStatus: 'active', takedownReason: reason, updatedAt: nowIso(), reviewLog: [...(Array.isArray(existing.reviewLog) ? existing.reviewLog : []), { reviewerId: user.id || user.email || 'demo-reviewer', action: 'takedown', reason, at: nowIso() }] };
  writeItems(items.map((item: any) => item.id === id ? resource : item));
  return resource;
}

export async function holdCommunityResourcesForLegalAsset(id: string, ..._args: any[]) {
  const items = readItems();
  let held = 0;
  const next = items.map((item: any) => {
    if (item.legalAssetId !== id) return item;
    held += 1;
    return { ...item, visibility: 'private', status: 'legal_hold', moderationStatus: 'legal_hold', updatedAt: nowIso() };
  });
  writeItems(next);
  return { legalAssetId: id, held };
}
