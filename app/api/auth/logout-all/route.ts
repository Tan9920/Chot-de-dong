import { NextRequest, NextResponse } from 'next/server';
import { clearCurrentSession, sessionCookieName } from '@/lib/auth';
import { revokeAllSessionsForAuthAccount } from '@/lib/storage';
import { assertRuntimeRateLimit, assertWriteProtection, requireActiveSession } from '@/lib/runtime-security';
import { recordSecurityAuditEvent } from '@/lib/security-audit-log';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function POST(request: NextRequest) {
  const session = await requireActiveSession('Bạn cần đăng nhập trước khi thu hồi phiên.', request);
  if (!session.ok) return session.response;
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const rate = assertRuntimeRateLimit(request, 'auth_logout_all', { windowMs: 60_000, max: 10 });
  if (!rate.allowed) return rate.response;

  if (!session.user.authAccountId) {
    return NextResponse.json({ error: 'Phiên hiện tại không gắn với tài khoản email/mật khẩu nên không thể thu hồi toàn bộ thiết bị.' }, { status: 400 });
  }

  const revoked = await revokeAllSessionsForAuthAccount(session.user.authAccountId);
  await clearCurrentSession(request);
  await recordSecurityAuditEvent({
    eventType: 'auth_logout_all',
    outcome: 'success',
    actorName: session.user.name,
    actorRole: session.user.role,
    schoolKey: session.user.schoolKey,
    departmentKey: session.user.departmentKey,
    request,
    metadata: { revokedSessions: revoked.revoked }
  });
  const res = NextResponse.json({ ok: true, revokedSessions: revoked.revoked });
  res.cookies.set(sessionCookieName, '', { path: '/', maxAge: 0 });
  return res;
}
