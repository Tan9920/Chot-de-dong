export function buildLessonCompliancePacket(lesson: any = {}, ..._args: any[]) {
  return { lessonId: lesson.id, generatedAt: new Date().toISOString(), status: 'demo_review_required', blockers: [], warnings: ['Seed/scaffold chưa verified.'] };
}
export function buildLessonComplianceBoard(lessons: any[] = [], ..._args: any[]) {
  return { generatedAt: new Date().toISOString(), items: lessons.map(buildLessonCompliancePacket), summary: { total: lessons.length, blockers: 0, warnings: lessons.length } };
}
