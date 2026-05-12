import { getStarterTopicTitles } from './starter-curriculum-catalog';

export function resolveCurriculumScope(_catalog: any, _gradeLevelMap: any, settings: any = {}) {
  const grade = settings.defaultGrade || '1';
  const subject = settings.defaultSubject || 'Tiếng Việt';
  const starterTopic = getStarterTopicTitles({ grade, subject })[0] || 'Chủ đề do giáo viên nhập';
  return {
    level: settings.defaultLevel || 'Tiểu học',
    grade,
    subject,
    book: settings.defaultBook || 'Starter 1–12 / giáo viên chọn nguồn',
    topic: settings.defaultTopic || starterTopic
  };
}
