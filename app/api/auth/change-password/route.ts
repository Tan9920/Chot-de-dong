import { NextRequest, NextResponse } from 'next/server';
import { changePasswordAccount } from '@/lib/account-security';
import { revokeSessionsByAuthAccountId } from '@/lib/storage';
import { assertRuntimeRateLimit, assertWriteProtection, readJsonBody, requireActiveSession } from '@/lib/runtime-security';
import { recordSecurityAuditEvent } from '@/lib/security-audit-log';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

type ChangePasswordBody = {
  email?: unknown;
  currentPassword?: unknown;
  newPassword?: unknown;
  revokeOtherSessions?: unknown;
};

export async function POST(request: NextRequest) {
  const session = await requireActiveSession('Bạn cần đăng nhập trước khi đổi mật khẩu.', request);
  if (!session.ok) return session.response;
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const rate = assertRuntimeRateLimit(request, 'auth_change_password', {
    windowMs: 60_000,
    max: 6,
    message: 'Có quá nhiều lần đổi mật khẩu từ trình duyệt này. Hãy thử lại sau ít phút.'
  });
  if (!rate.allowed) return rate.response;

  const parsed = await readJsonBody<ChangePasswordBody>(request, { maxBytes: 12_000, required: true });
  if (!parsed.ok) return parsed.response;

  if (!session.user.authAccountId) {
    return NextResponse.json({ error: 'Phiên hiện tại không gắn với tài khoản email/mật khẩu nên không thể đổi mật khẩu.' }, { status: 400 });
  }

  try {
    const account = await changePasswordAccount({ ...parsed.body, authAccountId: session.user.authAccountId });
    const shouldRevoke = parsed.body.revokeOtherSessions !== false;
    const revoked = account.id && shouldRevoke
      ? await revokeSessionsByAuthAccountId(account.id, session.user.sessionId)
      : { revoked: 0 };
    await recordSecurityAuditEvent({
      eventType: 'auth_change_password',
      outcome: 'success',
      actorName: session.user.name,
      actorRole: session.user.role,
      actorEmail: parsed.body.email,
      schoolKey: session.user.schoolKey,
      departmentKey: session.user.departmentKey,
      request,
      metadata: { revokedSessions: revoked.revoked, revokeOtherSessions: shouldRevoke }
    });
    return NextResponse.json({ ok: true, revokedSessions: revoked.revoked });
  } catch (error: any) {
    await recordSecurityAuditEvent({
      eventType: 'auth_change_password',
      outcome: 'failure',
      severity: 'warning',
      actorName: session.user.name,
      actorRole: session.user.role,
      actorEmail: parsed.body.email,
      reason: error?.message || 'change_password_failed',
      request
    });
    return NextResponse.json({ error: error?.message || 'Không đổi được mật khẩu.' }, { status: 400 });
  }
}
