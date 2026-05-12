import { buildDemoReadinessBoard } from './demo-readiness';
import { buildOperatingEntitlementSnapshot, getOperatingPlanConfig } from './operating-runtime';

export async function buildOperatingFoundationBoard(user?: any) {
  const config = getOperatingPlanConfig();
  const entitlement = await buildOperatingEntitlementSnapshot(user);
  const plans = Array.isArray(config.plans) ? config.plans : [];
  const actions = config.actions || {};
  const guardrails = Array.isArray(config.guardrails) ? config.guardrails : [];
  const issues = [];

  if (!config.noAiCore) issues.push({ severity: 'blocker', code: 'ai_core_enabled', message: 'Operating config phải giữ noAiCore=true trong giai đoạn đầu.' });
  if (config.paymentEnabled || config.marketplaceCashEnabled || config.cashFundEnabled || config.multiLevelReferralEnabled) {
    issues.push({ severity: 'blocker', code: 'unsafe_money_feature_enabled', message: 'Không bật payment thật/marketplace tiền mặt/quỹ tiền mặt/referral nhiều tầng trong foundation demo.' });
  }
  for (const required of ['free_community', 'teacher_pro_demo', 'team_workspace_demo', 'school_workspace_demo']) {
    if (!plans.some((plan: any) => plan.id === required)) issues.push({ severity: 'warning', code: `missing_plan_${required}`, message: `Thiếu plan ${required}.` });
  }
  for (const action of ['save_lesson', 'export_docx', 'export_pdf', 'worksheet_template', 'outline_slide_template']) {
    if (!actions[action]) issues.push({ severity: 'warning', code: `missing_action_${action}`, message: `Thiếu action quota ${action}.` });
  }

  return {
    generatedAt: new Date().toISOString(),
    status: issues.some((item) => item.severity === 'blocker') ? 'blocked' : issues.length ? 'operating_foundation_ready_with_warnings' : 'operating_foundation_ready_source_level',
    noAiMode: Boolean(config.noAiCore),
    demoMode: true,
    ledgerMode: config.ledgerMode,
    paymentEnabled: Boolean(config.paymentEnabled),
    plans: plans.map((plan: any) => ({
      id: plan.id,
      label: plan.label,
      audience: plan.audience,
      limits: plan.limits,
      exportPolicy: plan.exportPolicy,
      workflow: plan.workflow
    })),
    actions,
    entitlement,
    guardrails,
    issues,
    risks: [
      'Seed/scaffold chưa verified; quota không biến dữ liệu thành nội dung đã kiểm chứng.',
      'Usage/point ledger JSON là demo/runtime foundation, chưa phải billing hoặc audit production.',
      'Auth demo chưa thay thế production auth/database/email verification/lockout đầy đủ.',
      'Không dùng điểm để trả tiền mặt hoặc mở marketplace sớm.'
    ],
    demoReadiness: await buildDemoReadinessBoard(),
    note: 'Batch101 dựng operating plan/quota/ledger ở source-level. Nó không chứng minh npm install/build/live smoke và không bật thanh toán thật.'
  };
}
