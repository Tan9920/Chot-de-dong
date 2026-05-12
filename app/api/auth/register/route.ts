import { NextRequest, NextResponse } from 'next/server';
import { createSessionUser } from '@/lib/storage';
import { sessionCookieName } from '@/lib/auth';
import { registerPasswordAccount } from '@/lib/account-security';
import { membershipToSessionShape, resolveMembershipForLogin } from '@/lib/membership';
import { redeemMembershipInvite } from '@/lib/membership-invites';
import { assertRuntimeRateLimit, assertSameOrigin, attachCsrfCookie, boundedString, createCsrfToken, readJsonBody } from '@/lib/runtime-security';
import { recordSecurityAuditEvent } from '@/lib/security-audit-log';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

type RegisterBody = {
  name?: unknown;
  email?: unknown;
  password?: unknown;
  schoolName?: unknown;
  departmentName?: unknown;
  inviteCode?: unknown;
};

export async function POST(request: NextRequest) {
  const origin = assertSameOrigin(request);
  if (!origin.ok) {
    await recordSecurityAuditEvent({ eventType: 'auth_register', outcome: 'blocked', severity: 'warning', reason: 'same_origin_failed', request });
    return origin.response;
  }

  const rate = assertRuntimeRateLimit(request, 'auth_register', {
    windowMs: 60_000,
    max: 8,
    message: 'Có quá nhiều lần đăng ký từ trình duyệt này. Hãy thử lại sau ít phút.'
  });
  if (!rate.allowed) {
    await recordSecurityAuditEvent({ eventType: 'auth_register', outcome: 'blocked', severity: 'warning', reason: 'rate_limited', request });
    return rate.response;
  }

  const parsed = await readJsonBody<RegisterBody>(request, { maxBytes: 14_000, required: true });
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;
  const inviteCode = boundedString(body.inviteCode, 160) || undefined;

  try {
    const registration = await registerPasswordAccount({
      name: body.name,
      email: body.email,
      password: body.password,
      schoolName: body.schoolName,
      departmentName: body.departmentName
    });
    const account = registration.account;

    const redeemed = inviteCode ? await redeemMembershipInvite({ code: inviteCode, email: account.email, name: account.name }) : null;
    const resolved = redeemed?.ok
      ? { membership: redeemed.membership, autoProvisioned: false, downgraded: false, privilegedBlocked: false }
      : await resolveMembershipForLogin({
          name: account.name,
          requestedRole: 'teacher',
          schoolName: account.schoolName,
          departmentName: account.departmentName,
          email: account.email
        });

    const user = await createSessionUser(account.name, resolved.membership.role, { ...membershipToSessionShape(resolved.membership), authAccountId: account.id });
    const csrfToken = createCsrfToken();
    const res = NextResponse.json({
      user,
      account: { id: account.id, name: account.name, email: account.email },
      membership: resolved.membership,
      autoProvisioned: resolved.autoProvisioned,
      downgraded: resolved.downgraded,
      inviteAccepted: Boolean(redeemed?.ok),
      inviteWarning: inviteCode && redeemed && !redeemed.ok ? redeemed.error : undefined,
      csrfToken
    }, { status: 201 });
    res.cookies.set(sessionCookieName, user.sessionId || '', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7
    });
    await recordSecurityAuditEvent({
      eventType: 'auth_register',
      outcome: 'success',
      actorName: user.name,
      actorRole: user.role,
      actorEmail: account.email,
      schoolKey: user.schoolKey,
      departmentKey: user.departmentKey,
      request,
      metadata: { inviteAccepted: Boolean(redeemed?.ok), effectiveRole: resolved.membership.role }
    });
    attachCsrfCookie(res, csrfToken);
    return res;
  } catch (error: any) {
    await recordSecurityAuditEvent({ eventType: 'auth_register', outcome: 'failure', severity: 'warning', actorEmail: body?.email, reason: error?.message || 'register_failed', request });
    return NextResponse.json({ error: error?.message || 'Không đăng ký được tài khoản.' }, { status: 400 });
  }
}
