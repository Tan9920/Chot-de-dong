import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { parseCookieHeader } from './auth';
import { getSessionUser } from './auth';

export const csrfCookieName = 'giaoan_csrf';

type RateBucket = { count: number; resetAt: number };
const rateBuckets = new Map<string, RateBucket>();

export function createCsrfToken() {
  return `csrf-${randomBytes(24).toString('base64url')}`;
}

export function attachCsrfCookie(response: NextResponse, token: string) {
  response.cookies.set(csrfCookieName, token, {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 12
  });
  return response;
}

export function issueCsrfToken() {
  const csrfToken = createCsrfToken();
  const response = NextResponse.json({ csrfToken });
  attachCsrfCookie(response, csrfToken);
  return { csrfToken, response };
}

function clientIp(request: NextRequest | Request) {
  const forwarded = request.headers.get('x-forwarded-for') || '';
  return (forwarded.split(',')[0] || request.headers.get('x-real-ip') || 'local').trim();
}

export function assertRuntimeRateLimit(request: NextRequest, key = 'default', options: any = {}) {
  const windowMs = Math.max(Number(options.windowMs || 60_000), 1_000);
  const max = Math.max(Number(options.max || 60), 1);
  const now = Date.now();
  const identity = `${key}:${clientIp(request)}:${request.headers.get('user-agent') || 'ua'}`;
  const bucket = rateBuckets.get(identity);
  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(identity, { count: 1, resetAt: now + windowMs });
    return { allowed: true, response: null as any, remaining: max - 1 };
  }
  if (bucket.count >= max) {
    return {
      allowed: false,
      response: NextResponse.json({ error: options.message || 'Thao tác quá nhanh. Hãy thử lại sau ít phút.', retryAfterMs: bucket.resetAt - now }, { status: 429 }),
      remaining: 0
    };
  }
  bucket.count += 1;
  rateBuckets.set(identity, bucket);
  return { allowed: true, response: null as any, remaining: Math.max(max - bucket.count, 0) };
}

export function assertSameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const expected = new URL(request.url).origin;
  let allowedReferer = true;
  try {
    allowedReferer = !referer || new URL(referer).origin === expected;
  } catch {
    allowedReferer = false;
  }
  const allowedOrigin = !origin || origin === expected;
  if (!allowedOrigin || !allowedReferer) {
    return { ok: false as const, response: NextResponse.json({ error: 'Yêu cầu bị chặn vì không cùng nguồn.' }, { status: 403 }), reason: 'same_origin_failed' };
  }
  return { ok: true as const, response: null as any };
}

function csrfFromRequest(request: NextRequest) {
  const headerToken = request.headers.get('x-csrf-token') || request.headers.get('csrf-token') || '';
  const cookieToken = parseCookieHeader(request.headers.get('cookie'))[csrfCookieName] || '';
  return { headerToken, cookieToken };
}

function contentTypeOk(request: NextRequest) {
  const method = request.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD') return true;
  const length = Number(request.headers.get('content-length') || 0);
  const type = request.headers.get('content-type') || '';
  return length === 0 || type.includes('application/json') || type.includes('multipart/form-data') || type.includes('text/plain');
}

export function assertWriteProtection(request: NextRequest) {
  const origin = assertSameOrigin(request);
  if (!origin.ok) return { ok: false as const, response: origin.response, reason: origin.reason };
  if (!contentTypeOk(request)) {
    return { ok: false as const, response: NextResponse.json({ error: 'Content-Type không được phép cho write route.' }, { status: 415 }), reason: 'content_type_failed' };
  }
  const { headerToken, cookieToken } = csrfFromRequest(request);
  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    return { ok: false as const, response: NextResponse.json({ error: 'CSRF token không hợp lệ hoặc đã hết hạn. Hãy tải lại trang rồi thử lại.' }, { status: 403 }), reason: 'csrf_failed' };
  }
  return { ok: true as const, response: null as any, demoBypass: false };
}

export function boundedString(value: unknown, max = 500, fallback = '') {
  const text = String(value ?? fallback ?? '').trim();
  return text.slice(0, max);
}

export async function readJsonBody<T = any>(request: Request, options: { maxBytes?: number; required?: boolean } = {}): Promise<any> {
  try {
    const text = await request.text();
    if (!text && options.required) return { ok: false as const, response: NextResponse.json({ error: 'Thiếu JSON body.' }, { status: 400 }) };
    if (options.maxBytes && Buffer.byteLength(text, 'utf8') > options.maxBytes) {
      return { ok: false as const, response: NextResponse.json({ error: 'Body quá lớn.' }, { status: 413 }) };
    }
    const body = text ? JSON.parse(text) as T : {} as T;
    return { ok: true as const, body };
  } catch {
    return { ok: false as const, response: NextResponse.json({ error: 'JSON body không hợp lệ.' }, { status: 400 }) };
  }
}

export async function requireActiveSession(message = 'Bạn cần đăng nhập trước khi tiếp tục.', request?: Request) {
  const user = await getSessionUser(request);
  return user ? { ok: true as const, user } : { ok: false as const, response: NextResponse.json({ error: message }, { status: 401 }) };
}

export async function requireRealAccountSession(actionLabel = 'thực hiện thao tác này', request?: Request) {
  const user = await getSessionUser(request);
  if (!user) {
    return {
      ok: false as const,
      user: null,
      response: NextResponse.json({
        error: `Bạn cần đăng nhập bằng tài khoản giáo viên trước khi ${actionLabel}.`,
        requiresRealAccount: true
      }, { status: 401 })
    };
  }

  if (!user.authAccountId) {
    return {
      ok: false as const,
      user,
      response: NextResponse.json({
        error: `Bạn cần đăng nhập bằng tài khoản giáo viên thật trước khi ${actionLabel}. Phiên xem thử chỉ dùng để tạo khung bài, không dùng để lưu bản nháp hoặc xuất file có quota.`,
        requiresRealAccount: true,
        sessionMode: user.sessionMode || 'demo_session_without_auth_account'
      }, { status: 403 })
    };
  }

  return { ok: true as const, user };
}

export async function requirePermission(permission = 'demo', message = 'Bạn cần đăng nhập trước khi tiếp tục.', request?: Request) {
  const user = await getSessionUser(request);
  if (!user) return { ok: false as const, response: NextResponse.json({ error: message }, { status: 401 }) };
  const permissions = Array.isArray(user.permissions) ? user.permissions : [];
  const allowed = user.role === 'admin' || permissions.includes('*') || permissions.includes(permission);
  return allowed ? { ok: true as const, user } : { ok: false as const, response: NextResponse.json({ error: 'Bạn không có quyền thực hiện thao tác này.' }, { status: 403 }) };
}
