import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export type SecurityAuditOutcome = 'success' | 'failure' | 'blocked';
export type SecurityAuditSeverity = 'info' | 'warning' | 'critical';

type SecurityAuditInput = {
  eventType: string;
  outcome: SecurityAuditOutcome;
  severity?: SecurityAuditSeverity;
  actorName?: unknown;
  actorRole?: unknown;
  actorEmail?: unknown;
  schoolKey?: unknown;
  departmentKey?: unknown;
  targetType?: unknown;
  targetId?: unknown;
  reason?: unknown;
  request?: Request;
  metadata?: Record<string, unknown>;
};

type SecurityAuditQuery = {
  limit?: number;
  eventType?: string;
  outcome?: SecurityAuditOutcome;
  schoolKey?: string;
  departmentKey?: string;
};

const dataDir = process.env.GIAOAN_DATA_DIR || path.join(process.cwd(), 'data');
const auditPath = path.join(dataDir, 'security-audit-events.json');
const maxEvents = Number(process.env.GIAOAN_SECURITY_AUDIT_MAX_EVENTS || 1200);

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

function safeText(value: unknown, max = 240) {
  return String(value ?? '').trim().slice(0, max);
}

function readEvents(): any[] {
  try {
    if (!fs.existsSync(auditPath)) return [];
    const parsed = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeEvents(items: any[]) {
  try {
    ensureDataDir();
    const tempPath = `${auditPath}.tmp-${process.pid}-${Date.now()}`;
    fs.writeFileSync(tempPath, `${JSON.stringify(items.slice(0, maxEvents), null, 2)}\n`, 'utf8');
    fs.renameSync(tempPath, auditPath);
    return { ok: true as const, mode: 'file' as const };
  } catch (error) {
    // Batch89: audit log write is important, but it must not break CSRF/bootstrap on serverless demo hosts.
    return { ok: false as const, mode: 'memory_unpersisted' as const, error: error instanceof Error ? error.message : 'audit_write_failed' };
  }
}

function clientIpFromRequest(request?: Request) {
  if (!request) return undefined;
  const forwarded = request.headers.get('x-forwarded-for') || '';
  return (forwarded.split(',')[0] || request.headers.get('x-real-ip') || 'unknown').trim();
}

export async function recordSecurityAuditEvent(input: SecurityAuditInput) {
  const event = {
    id: randomUUID(),
    at: new Date().toISOString(),
    eventType: safeText(input.eventType, 120) || 'security_event',
    outcome: input.outcome,
    severity: input.severity || (input.outcome === 'blocked' || input.outcome === 'failure' ? 'warning' : 'info'),
    actorName: safeText(input.actorName, 120) || undefined,
    actorRole: safeText(input.actorRole, 40) || undefined,
    actorEmail: safeText(input.actorEmail, 180) || undefined,
    schoolKey: safeText(input.schoolKey, 120) || undefined,
    departmentKey: safeText(input.departmentKey, 120) || undefined,
    targetType: safeText(input.targetType, 120) || undefined,
    targetId: safeText(input.targetId, 180) || undefined,
    reason: safeText(input.reason, 300) || undefined,
    ip: clientIpFromRequest(input.request),
    userAgent: input.request?.headers.get('user-agent')?.slice(0, 240) || undefined,
    path: input.request ? new URL(input.request.url).pathname : undefined,
    metadata: input.metadata || {}
  };
  const events = readEvents();
  writeEvents([event, ...events]);
  return event;
}

export async function listSecurityAuditEvents(query: SecurityAuditQuery = {}) {
  const limit = Math.min(Math.max(Number(query.limit || 100), 1), 500);
  return readEvents()
    .filter((item) => !query.eventType || item.eventType === query.eventType)
    .filter((item) => !query.outcome || item.outcome === query.outcome)
    .filter((item) => !query.schoolKey || item.schoolKey === query.schoolKey)
    .filter((item) => !query.departmentKey || item.departmentKey === query.departmentKey)
    .slice(0, limit);
}
