import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { readSessionUserBySessionId, revokeSessionById } from './storage';
import type { SessionUser } from './types';

export const sessionCookieName = 'giaoan_session';

export function normalizeRole(role: string = 'teacher') {
  return role === 'admin' || role === 'leader' || role === 'teacher' ? role : 'teacher';
}

export function parseCookieHeader(header: string | null | undefined) {
  const result: Record<string, string> = {};
  for (const part of String(header || '').split(';')) {
    const [rawName, ...rawValue] = part.trim().split('=');
    if (!rawName) continue;
    result[rawName] = decodeURIComponent(rawValue.join('=') || '');
  }
  return result;
}

export async function getSessionId(request?: Request) {
  const fromHeader = parseCookieHeader(request?.headers.get('cookie'))[sessionCookieName];
  if (fromHeader) return fromHeader;
  try {
    const store = await cookies();
    return store.get(sessionCookieName)?.value || null;
  } catch {
    return null;
  }
}

function demoUserFromSessionCookie(sessionId: string | null): SessionUser | null {
  if (!sessionId || !sessionId.startsWith('session-demo-')) return null;
  if (process.env.GIAOAN_DISABLE_DEMO_SESSION_FALLBACK === 'true') return null;
  return {
    id: 'anonymous-demo-teacher',
    sessionId,
    name: 'Giáo viên demo',
    role: 'teacher',
    schoolName: 'Trường demo',
    departmentName: 'Tổ chuyên môn demo',
    schoolKey: 'demo-school',
    departmentKey: 'demo-department',
    permissions: ['demo:feedback'],
    sessionMode: 'anonymous_demo_cookie_fallback',
    fallbackPolicy: 'arbitrarySessionCookieFallbackBlocked_sessionDemoOnly'
  };
}

export async function getSessionUser(request?: Request): Promise<SessionUser | null> {
  const sessionId = await getSessionId(request);
  const stored = await readSessionUserBySessionId(sessionId);
  return stored || demoUserFromSessionCookie(sessionId);
}

export async function clearCurrentSession(request?: Request) {
  await revokeSessionById(await getSessionId(request));
  const res = NextResponse.json({ ok: true });
  res.cookies.set(sessionCookieName, '', { path: '/', maxAge: 0 });
  return res;
}
