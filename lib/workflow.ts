import { assertLessonPermission } from './access';

export function canManageLesson(user: any, lesson: any) {
  return assertLessonPermission(user, 'lesson:manage', lesson);
}

export function resolveLessonUpdate(input: any = {}) { const body = input.body || {}; const current = input.current || {}; const requested = body.status === 'approved' || body.status === 'review' || body.status === 'draft' ? body.status : current.status || 'draft'; return { ok: true, status: 200, error: '', nextStatus: requested, changeSummary: body.changeSummary || 'Cập nhật giáo án.', eventAction: requested === 'approved' ? 'approved' : requested === 'review' ? 'submitted_for_review' : 'updated' }; }
