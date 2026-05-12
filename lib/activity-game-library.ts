import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data/activity-game-library.json');
const CONTRIBUTIONS_FILE = path.join(process.cwd(), 'data/activity-game-contributions.json');

function readJsonArray(file: string) {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalise(value: any) {
  return String(value || '').trim().toLowerCase();
}

function matchesText(item: any, q: string) {
  if (!q) return true;
  const haystack = [item.title, item.grade, item.subject, item.topic, item.kind, item.phase, item.level].join(' ').toLowerCase();
  return haystack.includes(q.toLowerCase());
}

function isPublicEnough(item: any) {
  const visibility = item.visibility || 'limited';
  const moderationStatus = item.moderationStatus || item.reviewStatus || item.status || '';
  return visibility === 'public' || visibility === 'limited' || moderationStatus === 'approved_community' || moderationStatus === 'verified_official';
}

function buildReadiness(item: any) {
  const sourceStatus = item.sourceStatus || 'seed';
  const supportLevel = item.supportLevel || 'starter';
  const hasSource = Boolean(String(item.sourceUrl || '').trim() || String(item.attribution || '').trim());
  const hasLicense = Boolean(String(item.license || '').trim());
  const canPublic = ['reviewed', 'verified', 'approved_for_release'].includes(sourceStatus) && hasSource && hasLicense && item.visibility === 'public';
  return {
    sourceStatus,
    supportLevel,
    safeSkeletonOnly: !canPublic,
    publicUseAllowed: canPublic,
    warnings: [
      canPublic ? null : 'Chỉ dùng như gợi ý/khung an toàn; giáo viên cần kiểm tra trước khi dùng chính thức.',
      hasSource ? null : 'Thiếu nguồn/attribution rõ.',
      hasLicense ? null : 'Thiếu license/quyền sử dụng rõ.'
    ].filter(Boolean)
  };
}

export async function searchActivityGameLibrary(query: any = {}) {
  const q = String(query.q || '').trim();
  const grade = normalise(query.grade);
  const subject = normalise(query.subject);
  const topic = normalise(query.topic);
  const kind = normalise(query.kind);
  const includeReviewQueue = Boolean(query.includeReviewQueue);

  const seedItems = readJsonArray(DATA_FILE).map((item: any) => ({ ...item, origin: 'seed_library' }));
  const contributionItems = readJsonArray(CONTRIBUTIONS_FILE)
    .filter((item: any) => includeReviewQueue || isPublicEnough(item))
    .map((item: any) => ({ ...item, origin: 'community_contribution' }));

  let items = [...seedItems, ...contributionItems].filter((item: any) => {
    if (grade && normalise(item.grade) !== grade && !normalise(item.grade).includes('dùng chung')) return false;
    if (subject && normalise(item.subject) !== subject && !normalise(item.subject).includes('dùng chung')) return false;
    if (topic && !normalise(item.topic).includes(topic) && !normalise(item.title).includes(topic)) return false;
    if (kind && normalise(item.kind) !== kind) return false;
    return matchesText(item, q);
  });

  items = items.map((item: any) => ({ ...item, readiness: buildReadiness(item) }));

  return {
    items,
    readiness: {
      policy: 'Seed/scaffold/community chỉ là gợi ý có kiểm soát; muốn public/official phải có nguồn, license, review và release tier phù hợp.',
      safeSkeletonOnlyCount: items.filter((item: any) => item.readiness.safeSkeletonOnly).length
    },
    summary: {
      total: items.length,
      seed: items.filter((item: any) => item.origin === 'seed_library').length,
      community: items.filter((item: any) => item.origin === 'community_contribution').length,
      publicUseAllowed: items.filter((item: any) => item.readiness.publicUseAllowed).length
    }
  };
}
