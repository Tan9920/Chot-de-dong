import { assertLessonPermission } from './access';

export function isLessonVisibleToUser(user: any, lesson: any) {
  return assertLessonPermission(user, 'lesson:read', lesson);
}

export function canReviewLessonByScope(user: any, lesson: any, _settings: any = {}) { return assertLessonPermission(user, 'lesson:review', lesson); }
