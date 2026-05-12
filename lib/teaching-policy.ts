const SOURCE_ORDER = ['scaffold', 'seed', 'community', 'reviewed', 'verified', 'approved_for_release'];
const SUPPORT_ORDER = ['starter', 'developing', 'foundation', 'operational'];
const RELEASE_ORDER = ['internal_preview', 'school_release_candidate', 'school_released', 'public_release_candidate', 'public_released'];

function rank(order: string[], value: string) {
  const index = order.indexOf(value);
  return index < 0 ? 0 : index;
}

export function getTeachingPolicyFromSettings(settings: any = {}) {
  return settings.teachingPolicy || {
    minSourceStatusForDeepLesson: 'reviewed',
    minReleaseTierForDeepLesson: 'school_release_candidate',
    minSupportLevelForDeepLesson: 'foundation'
  };
}

export function evaluateTeachingPolicy(input: any = {}) {
  const policy = getTeachingPolicyFromSettings(input.settings);
  const actualSourceStatus = input.sourceStatus || 'seed';
  const actualReleaseTier = input.releaseTier || 'internal_preview';
  const actualSupportLevel = input.supportLevel || 'starter';
  const sourceOk = rank(SOURCE_ORDER, actualSourceStatus) >= rank(SOURCE_ORDER, policy.minSourceStatusForDeepLesson || 'reviewed');
  const releaseOk = rank(RELEASE_ORDER, actualReleaseTier) >= rank(RELEASE_ORDER, policy.minReleaseTierForDeepLesson || 'school_release_candidate');
  const supportOk = rank(SUPPORT_ORDER, actualSupportLevel) >= rank(SUPPORT_ORDER, policy.minSupportLevelForDeepLesson || 'foundation');
  const deepContentAllowed = sourceOk && releaseOk && supportOk;
  const reasons = [];
  if (!sourceOk) reasons.push(`sourceStatus ${actualSourceStatus} chưa đạt ${policy.minSourceStatusForDeepLesson || 'reviewed'}`);
  if (!releaseOk) reasons.push(`releaseTier ${actualReleaseTier} chưa đạt ${policy.minReleaseTierForDeepLesson || 'school_release_candidate'}`);
  if (!supportOk) reasons.push(`supportLevel ${actualSupportLevel} chưa đạt ${policy.minSupportLevelForDeepLesson || 'foundation'}`);

  return {
    allowed: true,
    bypassed: false,
    safeModeRequired: !deepContentAllowed,
    deepContentAllowed,
    reasons,
    policy,
    actualSourceStatus,
    actualReleaseTier,
    actualSupportLevel
  };
}
