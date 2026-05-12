import fs from 'fs';
import path from 'path';

import config from '@/data/operating-plan-config.json';

const dataDir = process.env.GIAOAN_DATA_DIR || path.join(process.cwd(), 'data');
const usageLedgerPath = path.join(dataDir, 'usage-ledger.json');
const pointLedgerPath = path.join(dataDir, 'point-ledger.json');

type OperatingAction = 'save_lesson' | 'export_docx' | 'export_pdf' | 'template_lesson' | 'worksheet_template' | 'outline_slide_template' | string;
type LedgerEvent = {
  id: string;
  createdAt: string;
  monthKey: string;
  userKey: string;
  authAccountId?: string;
  userName?: string;
  userRole?: string;
  schoolKey?: string;
  departmentKey?: string;
  plan: string;
  action: OperatingAction;
  quantity: number;
  scope?: any;
  note?: string;
};

let usageEvents: LedgerEvent[] | null = null;
let pointEvents: any[] | null = null;

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

function safeReadJsonArray<T>(filePath: string): T[] {
  try {
    if (!fs.existsSync(filePath)) return [];
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

function safeWriteJson(filePath: string, value: unknown) {
  try {
    ensureDataDir();
    const tempPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
    fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
    fs.renameSync(tempPath, filePath);
    return { ok: true as const, mode: 'file' as const };
  } catch (error) {
    return {
      ok: false as const,
      mode: 'memory_fallback' as const,
      error: error instanceof Error ? error.message : 'json_write_failed'
    };
  }
}

function loadUsageLedger() {
  if (usageEvents) return usageEvents;
  usageEvents = safeReadJsonArray<LedgerEvent>(usageLedgerPath);
  return usageEvents;
}

function flushUsageLedger() {
  const events = loadUsageLedger().slice(0, 5000);
  return safeWriteJson(usageLedgerPath, events);
}

function loadPointLedger() {
  if (pointEvents) return pointEvents;
  pointEvents = safeReadJsonArray<any>(pointLedgerPath);
  return pointEvents;
}

function monthKey(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function normaliseAction(action: OperatingAction) {
  return String(action || 'demo').trim();
}

function quantityOf(quantity: unknown) {
  const value = Math.max(1, Math.floor(Number(quantity || 1)));
  return Number.isFinite(value) ? Math.min(value, 10_000) : 1;
}

function userKey(user: any = {}) {
  return String(user.authAccountId || user.id || user.email || user.name || 'anonymous_demo_user').slice(0, 160);
}

export function resolveOperatingPlan(user: any = {}) {
  const override = String(process.env.GIAOAN_OPERATING_PLAN_OVERRIDE || '').trim();
  const role = user?.role === 'admin' || user?.role === 'leader' || user?.role === 'teacher' ? user.role : 'teacher';
  const planId = override || (config as any).rolePlanMap?.[role] || (config as any).defaultPlanId || 'free_community';
  const plans = Array.isArray((config as any).plans) ? (config as any).plans : [];
  return plans.find((plan: any) => plan.id === planId) || plans.find((plan: any) => plan.id === (config as any).defaultPlanId) || plans[0] || { id: 'free_community', label: 'Free Cộng Đồng', limits: {}, exportPolicy: {} };
}

export function getOperatingPlanConfig() {
  return config as any;
}

function limitFor(plan: any, action: OperatingAction) {
  const limits = plan?.limits || {};
  const actionKey = normaliseAction(action);
  const value = Number(limits[actionKey]);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function usageFor(user: any, action: OperatingAction, plan: any, selectedMonth = monthKey()) {
  const key = userKey(user);
  const actionKey = normaliseAction(action);
  return loadUsageLedger()
    .filter((event) => event.monthKey === selectedMonth && event.userKey === key && event.action === actionKey && event.plan === plan.id)
    .reduce((total, event) => total + quantityOf(event.quantity), 0);
}

export async function assertOperatingUsageAllowed(user: any, action: OperatingAction = 'demo', quantity = 1) {
  const actionKey = normaliseAction(action);
  const plan = resolveOperatingPlan(user);
  const used = usageFor(user, actionKey, plan);
  const limit = limitFor(plan, actionKey);
  const requested = quantityOf(quantity);
  const configuredAction = (config as any).actions?.[actionKey] || null;

  if (!configuredAction) {
    return {
      allowed: false,
      status: 400,
      plan: plan.id,
      used,
      limit,
      remaining: 0,
      action: actionKey,
      error: `Action operating chưa được cấu hình: ${actionKey}.`
    };
  }

  if (used + requested > limit) {
    return {
      allowed: false,
      status: 402,
      plan: plan.id,
      used,
      limit,
      remaining: Math.max(limit - used, 0),
      action: actionKey,
      error: `Đã hết quota tháng cho ${configuredAction.label || actionKey}. Gói hiện tại: ${plan.label || plan.id} (${used}/${limit}).`
    };
  }

  return {
    allowed: true,
    status: 200,
    plan: plan.id,
    planLabel: plan.label || plan.id,
    used,
    limit,
    remaining: Math.max(limit - used - requested, 0),
    action: actionKey,
    quantity: requested,
    error: ''
  };
}

export async function recordOperatingUsage(event: any = {}) {
  const action = normaliseAction(event.action || 'demo');
  const quantity = quantityOf(event.quantity);
  const plan = resolveOperatingPlan(event.user || event.actor || {});
  const user = event.user || event.actor || {};
  const item: LedgerEvent = {
    id: `usage-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    monthKey: monthKey(),
    userKey: userKey(user),
    authAccountId: user.authAccountId,
    userName: user.name,
    userRole: user.role,
    schoolKey: user.schoolKey,
    departmentKey: user.departmentKey,
    plan: plan.id,
    action,
    quantity,
    scope: event.scope || null,
    note: event.note || ''
  };
  usageEvents = [item, ...loadUsageLedger()].slice(0, 5000);
  const write = flushUsageLedger();
  return { ...item, write };
}

export async function assertSavedLessonQuota(user: any, quantity = 1) {
  return assertOperatingUsageAllowed(user, 'save_lesson', quantity);
}

export async function buildOperatingEntitlementSnapshot(user: any = {}) {
  const plan = resolveOperatingPlan(user || {});
  const actions = Object.keys((config as any).actions || {});
  const usage: Record<string, any> = {};
  for (const action of actions) {
    const used = usageFor(user || {}, action, plan);
    const limit = limitFor(plan, action);
    usage[action] = {
      used,
      limit,
      remaining: Math.max(limit - used, 0),
      label: (config as any).actions?.[action]?.label || action
    };
  }
  return {
    version: (config as any).version,
    generatedAt: new Date().toISOString(),
    plan: plan.id,
    planLabel: plan.label || plan.id,
    noAiCore: Boolean((config as any).noAiCore),
    paymentEnabled: Boolean((config as any).paymentEnabled),
    marketplaceCashEnabled: Boolean((config as any).marketplaceCashEnabled),
    cashFundEnabled: Boolean((config as any).cashFundEnabled),
    multiLevelReferralEnabled: Boolean((config as any).multiLevelReferralEnabled),
    monthKey: monthKey(),
    usage,
    exports: {
      docx: usage.export_docx,
      pdf: usage.export_pdf,
      policy: plan.exportPolicy || {}
    },
    lessons: usage.save_lesson,
    points: {
      enabled: Boolean((config as any).pointsPolicy?.enabled),
      cashRedemptionEnabled: Boolean((config as any).pointsPolicy?.cashRedemptionEnabled),
      currentLedgerEvents: loadPointLedger().filter((item) => item.userKey === userKey(user)).length,
      allowedRedemptions: (config as any).pointsPolicy?.allowedRedemptions || []
    },
    ledger: {
      mode: (config as any).ledgerMode,
      usageEventsForUser: loadUsageLedger().filter((item) => item.userKey === userKey(user)).length,
      usageLedgerPath: path.relative(process.cwd(), usageLedgerPath),
      pointLedgerPath: path.relative(process.cwd(), pointLedgerPath),
      note: 'JSON ledger chỉ là demo/runtime foundation. Production cần DB/migration/backup/locking/audit thật.'
    },
    guardrails: (config as any).guardrails || []
  };
}

export async function applyOperatingExportPolicy(payload: any, user?: any, format?: string) {
  const plan = resolveOperatingPlan(user || {});
  const policy = plan.exportPolicy || {};
  return {
    ...payload,
    operatingSnapshot: {
      plan: plan.id,
      planLabel: plan.label || plan.id,
      format,
      pdfWatermark: Boolean(policy.pdfWatermark),
      docxWatermark: Boolean(policy.docxWatermark),
      watermarkText: policy.watermarkText || '',
      mustShowDataTruthLabel: policy.mustShowDataTruthLabel !== false,
      note: 'Batch101 export policy snapshot; không phải payment thật và không thay thế compliance packet.'
    }
  };
}
