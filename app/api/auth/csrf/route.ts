import { NextRequest } from 'next/server';
import { sessionCookieName, getSessionUser } from '@/lib/auth';
import { createSessionUser } from '@/lib/storage';
import { issueCsrfToken } from '@/lib/runtime-security';
import { recordSecurityAuditEvent } from '@/lib/security-audit-log';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const { csrfToken, response } = issueCsrfToken();
  const current = await getSessionUser(request);
  if (!current) {
    let user: Awaited<ReturnType<typeof createSessionUser>> | null = null;
    try {
      user = await createSessionUser('Giáo viên demo', 'teacher', { sessionMode: 'anonymous_demo_csrf_bootstrap' });
    } catch {
      // Batch89: Không để lỗi ghi JSON/session trên host demo làm chết CSRF token.
      user = {
        id: 'anonymous-demo-teacher',
        sessionId: `session-demo-${Date.now()}`,
        name: 'Giáo viên demo',
        role: 'teacher',
        schoolName: 'Trường demo',
        departmentName: 'Tổ chuyên môn demo',
        schoolKey: 'demo-school',
        departmentKey: 'demo-department',
        permissions: ['demo:feedback'],
        sessionMode: 'anonymous_demo_cookie_fallback'
      } as any;
    }
    response.cookies.set(sessionCookieName, user.sessionId || '', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7
    });
    try {
      await recordSecurityAuditEvent({
        eventType: 'auth_csrf_bootstrap_session',
        outcome: 'success',
        actorName: user.name,
        actorRole: user.role,
        schoolKey: user.schoolKey,
        departmentKey: user.departmentKey,
        request,
        metadata: { role: user.role, sessionMode: user.sessionMode, csrfTokenIssued: Boolean(csrfToken) }
      });
    } catch {
      // Audit persistence must not block the teacher's core flow in demo mode.
    }
  }
  return response;
}
