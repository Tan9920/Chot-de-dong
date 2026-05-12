import policy from '@/data/security-data-protection-foundation-policy.json';

export type SecurityDataProtectionDecision = 'source_foundation_ready' | 'blocked_for_public_rollout';

type Control = {
  id: string;
  area: string;
  required: boolean;
  evidence: string[];
  summary: string;
};

function requiredControls() {
  return (policy.controls as Control[]).filter((control) => control.required);
}

export function buildSecurityDataProtectionBoard() {
  const controls = requiredControls();
  const releaseBlockers = Array.isArray(policy.releaseBlockers) ? policy.releaseBlockers : [];
  const hardBlocked = Boolean(policy.publicRolloutAllowed) === false || releaseBlockers.length > 0;
  const decision: SecurityDataProtectionDecision = hardBlocked ? 'blocked_for_public_rollout' : 'source_foundation_ready';

  return {
    ok: true,
    batch: policy.batch,
    phase: policy.phase,
    status: policy.status,
    decision,
    p1SourceFoundationReady: controls.length >= 6,
    publicRolloutAllowed: false,
    hostedProofRequired: Boolean(policy.hostedProofRequired),
    node24ProofRequired: Boolean(policy.node24ProofRequired),
    scope: policy.scope,
    controlSummary: {
      requiredControls: controls.length,
      accountCore: controls.filter((item) => item.area === 'account_core').length,
      routeSecurity: controls.filter((item) => item.area === 'route_security').length,
      roleGovernance: controls.filter((item) => item.area === 'role_governance').length,
      sessionSecurity: controls.filter((item) => item.area === 'session_security').length,
      auditLog: controls.filter((item) => item.area === 'audit_log').length,
      privacy: controls.filter((item) => item.area === 'privacy').length
    },
    controls,
    personalDataMap: policy.personalDataMap,
    releaseBlockers,
    founderAbsenceSafeMode: policy.founderAbsenceSafeMode,
    warning: 'P1 security/data protection board là source-level foundation. Không thay thế hosted proof, DB production auth, privacy/legal review hoặc browser QA thật.'
  };
}
