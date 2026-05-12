import { NextResponse } from 'next/server';
import { getSessionUser } from './auth';
import { assertLessonPermission } from './access';
import { getLessonById } from './storage';

export function parseBoundedText(value: unknown, fallback = '', max = 500) {
  return String(value ?? fallback).slice(0, max);
}

export async function requireLessonRouteAccess(requestOrLessonId?: any, lessonOrPermission?: any, permission = 'lesson:read') {
  const request = typeof requestOrLessonId === 'string' ? undefined : requestOrLessonId;
  const lessonId = typeof requestOrLessonId === 'string' ? requestOrLessonId : undefined;
  const actualPermission = typeof requestOrLessonId === 'string' ? (lessonOrPermission || permission) : permission;
  const providedLesson = typeof requestOrLessonId === 'string' ? null : lessonOrPermission;
  const user = await getSessionUser(request);
  if (!user) return { ok: false as const, user: null, response: NextResponse.json({ error: 'Bạn cần đăng nhập để truy cập giáo án.' }, { status: 401 }) };
  const lesson = providedLesson || (lessonId ? await getLessonById(lessonId) : null);
  if (lesson && !assertLessonPermission(user, actualPermission, lesson)) {
    return { ok: false as const, user, response: NextResponse.json({ error: 'Bạn không có quyền truy cập giáo án này.' }, { status: 403 }) };
  }
  return { ok: true as const, user, lesson, response: null as any };
}
