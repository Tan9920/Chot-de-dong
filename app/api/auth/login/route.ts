import { NextRequest, NextResponse } from 'next/server';
import { createSessionUser } from '@/lib/storage';
import { normalizeRole, sessionCookieName } from '@/lib/auth';
import { verifyPasswordAccount } from '@/lib/account-security';
import { membershipToSessionShape, resolveMembershipForLogin } from '@/lib/membership';
import { redeemMembershipInvite } from '@/lib/membership-invites';
import { assertRuntimeRateLimit, assertSameOrigin, attachCsrfCookie, boundedString, createCsrfToken, readJsonBody } from '@/lib/runtime-security';
import { recordSecurityAuditEvent } from '@/lib/security-audit-log';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

type LoginBody = {
  name?: unknown;
  role?: unknown;
  email?: unknown;
  password?: unknown;
  schoolName?: unknown;
  departmentName?: unknown;
  inviteCode?: unknown;
  membershipCode?: unknown;
};

export async function POST(request: NextRequest) {
  const origin = assertSameOrigin(request);
  if (!origin.ok) {
    await recordSecurityAuditEvent({ eventType: 'auth_login', outcome: 'blocked', severity: 'warning', reason: 'same_origin_failed', request });
    return origin.response;
  }

  const rate = assertRuntimeRateLimit(request, 'auth_login', {
    windowMs: 60_000,
    max: 12,
    message: 'Có quá nhiều lần đăng nhập từ trình duyệt này. Hãy thử lại sau ít phút.'
  });
  if (!rate.allowed) {
    await recordSecurityAuditEvent({ eventType: 'auth_login', outcome: 'blocked', severity: 'warning', reason: 'rate_limited', request });
    return rate.response;
  }

  const parsed = await readJsonBody<LoginBody>(request, { maxBytes: 12_000, required: true });
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  const email = boundedString(body?.email, 160) || undefined;
  let authAccountId: string | undefined;
  const password = String(body?.password || '');
  const requestedRole = normalizeRole(String(body?.role || 'teacher'));
  const inviteCode = boundedString(body?.inviteCode || body?.membershipCode, 220) || undefined;

  let name = boundedString(body?.name, 80);
  let schoolName = boundedString(body?.schoolName, 120) || undefined;
  let departmentName = boundedString(body?.departmentName, 120) || undefined;
  let passwordLogin = false;

  if (email || password) {
    const verified = await verifyPasswordAccount(email, password);
    if (!verified.ok) {
      await recordSecurityAuditEvent({ eventType: 'auth_login', outcome: 'failure', severity: 'warning', actorEmail: email, reason: verified.reason || 'invalid_credentials', request });
      return NextResponse.json({ error: verified.error }, { status: 401 });
    }
    passwordLogin = true;
    name = verified.account.name;
    authAccountId = verified.account.id;
    schoolName = verified.account.schoolName;
    departmentName = verified.account.departmentName;
  } else if (process.env.GIAOAN_ALLOW_DEMO_LOGIN !== 'true') {
    await recordSecurityAuditEvent({ eventType: 'auth_login', outcome: 'blocked', severity: 'warning', reason: 'demo_login_disabled', request });
    return NextResponse.json({ error: 'Đăng nhập demo bằng tên đã bị tắt. Hãy đăng ký/đăng nhập bằng email và mật khẩu, hoặc bật GIAOAN_ALLOW_DEMO_LOGIN=true cho môi trường demo nội bộ.' }, { status: 401 });
  }

  if (!name) return NextResponse.json({ error: 'Tên đăng nhập không được để trống.' }, { status: 400 });

  const redeemed = inviteCode ? await redeemMembershipInvite({ code: inviteCode, email, name, schoolName, departmentName }) : null;
  const resolved = redeemed?.ok
    ? { membership: redeemed.membership, autoProvisioned: false, downgraded: false, privilegedBlocked: false, inviteAccepted: true, inviteWarning: undefined }
    : {
        ...(await resolveMembershipForLogin({
          name,
          requestedRole: 'teacher',
          schoolName,
          departmentName,
          email
        })),
        inviteAccepted: false,
        inviteWarning: inviteCode && redeemed && !redeemed.ok ? redeemed.error : undefined
      };

  const privilegedBlocked = Boolean((resolved as any).privilegedBlocked || requestedRole !== 'teacher' && !resolved.inviteAccepted);
  const user = await createSessionUser(name, resolved.membership.role, { ...membershipToSessionShape(resolved.membership), authAccountId });
  const csrfToken = createCsrfToken();
  const res = NextResponse.json({
    user,
    membership: resolved.membership,
    autoProvisioned: resolved.autoProvisioned,
    downgraded: resolved.downgraded,
    privilegedBlocked,
    passwordLogin,
    inviteAccepted: resolved.inviteAccepted,
    inviteWarning: resolved.inviteWarning,
    csrfToken,
    notice: privilegedBlocked ? 'Không thể tự chọn admin/tổ trưởng khi đăng nhập. Quyền cao hơn chỉ có hiệu lực khi dùng mã mời thật còn active hoặc membership đã được admin tạo.' : resolved.inviteWarning,
    requestedRole,
    effectiveRole: resolved.membership.role
  });
  res.cookies.set(sessionCookieName, user.sessionId || '', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7
  });
  await recordSecurityAuditEvent({
    eventType: 'auth_login',
    outcome: 'success',
    actorName: user.name,
    actorRole: user.role,
    actorEmail: email,
    schoolKey: user.schoolKey,
    departmentKey: user.departmentKey,
    request,
    metadata: { passwordLogin, requestedRole, effectiveRole: resolved.membership.role, privilegedBlocked, inviteAccepted: resolved.inviteAccepted, inviteWarning: resolved.inviteWarning }
  });
  attachCsrfCookie(res, csrfToken);
  return res;
}
