import { NextRequest, NextResponse } from 'next/server';
import { clearCurrentSession, sessionCookieName } from '@/lib/auth';
import { assertRuntimeRateLimit, assertWriteProtection, csrfCookieName } from '@/lib/runtime-security';
import { recordSecurityAuditEvent } from '@/lib/security-audit-log';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function POST(request: NextRequest) {
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const rate = assertRuntimeRateLimit(request, 'auth_logout', { windowMs: 60_000, max: 20 });
  if (!rate.allowed) return rate.response;
  await clearCurrentSession(request);
  await recordSecurityAuditEvent({ eventType: 'auth_logout', outcome: 'success', request });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(sessionCookieName, '', { path: '/', expires: new Date(0), httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  res.cookies.set(csrfCookieName, '', { path: '/', httpOnly: true, expires: new Date(0), sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  return res;
}
