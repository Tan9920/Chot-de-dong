import { NextRequest, NextResponse } from 'next/server';
import { listSecurityAuditEvents, type SecurityAuditOutcome } from '@/lib/security-audit-log';
import { assertRuntimeRateLimit, requirePermission } from '@/lib/runtime-security';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const gate = await requirePermission('membership:manage', 'Bạn cần quyền quản trị để xem nhật ký bảo mật.', request);
  if (!gate.ok) return gate.response;
  const rate = assertRuntimeRateLimit(request, 'security_audit_read', { windowMs: 60_000, max: 40 });
  if (!rate.allowed) return rate.response;

  const { searchParams } = new URL(request.url);
  const requestedOutcome = searchParams.get('outcome') || undefined;
  const outcome = requestedOutcome === 'success' || requestedOutcome === 'failure' || requestedOutcome === 'blocked'
    ? requestedOutcome as SecurityAuditOutcome
    : undefined;
  const limit = Number(searchParams.get('limit') || 100);
  const schoolKey = gate.user.role === 'admin' ? searchParams.get('schoolKey') || undefined : gate.user.schoolKey;
  const departmentKey = gate.user.role === 'admin' ? searchParams.get('departmentKey') || undefined : gate.user.departmentKey;
  const items = await listSecurityAuditEvents({
    limit,
    eventType: searchParams.get('eventType') || undefined,
    outcome,
    schoolKey,
    departmentKey
  });
  return NextResponse.json({ items, scope: { schoolKey, departmentKey } });
}
