import starterCatalog from '@/data/starter-curriculum-catalog.json';

function normalise(value: any) {
  return String(value || '').trim().toLowerCase();
}

function normaliseGrade(value: any) {
  const raw = String(value || '').trim();
  const match = raw.match(/\d+/);
  return match ? match[0] : raw;
}

export type StarterTopic = {
  id: string;
  title: string;
  intent: string;
  sourceStatus: string;
  reviewStatus: string;
  supportLevel: string;
  contentDepthAllowed: boolean;
  safeUse: string;
};

export function listStarterCurriculumGrades() {
  return [...((starterCatalog as any).grades || [])];
}

export function listStarterCurriculumTopics(input: any = {}): StarterTopic[] {
  const grade = normaliseGrade(input.grade);
  const subject = normalise(input.subject);
  const gradeEntry = listStarterCurriculumGrades().find((item: any) => normaliseGrade(item.grade) === grade);
  if (!gradeEntry) return [];
  const subjectEntry = (gradeEntry.subjects || []).find((item: any) => normalise(item.subject) === subject);
  return subjectEntry?.topics || [];
}

export function getStarterTopicTitles(input: any = {}) {
  return listStarterCurriculumTopics(input).map((item) => item.title);
}

export function findStarterTopic(input: any = {}) {
  const topic = normalise(input.topic);
  return listStarterCurriculumTopics(input).find((item) => normalise(item.title) === topic) || null;
}

export function getStarterCurriculumStats() {
  const grades = listStarterCurriculumGrades();
  const subjects = grades.flatMap((grade: any) => grade.subjects || []);
  const topics = subjects.flatMap((subject: any) => subject.topics || []);
  return {
    version: (starterCatalog as any).version,
    updatedAt: (starterCatalog as any).updatedAt,
    purpose: (starterCatalog as any).purpose,
    sourceStatus: (starterCatalog as any).sourceStatus,
    reviewStatus: (starterCatalog as any).reviewStatus,
    releaseTier: (starterCatalog as any).releaseTier,
    supportLevel: (starterCatalog as any).supportLevel,
    contentDepthAllowed: Boolean((starterCatalog as any).contentDepthAllowed),
    gradeCount: grades.length,
    subjectScopeCount: subjects.length,
    topicCount: topics.length,
    safetyRules: (starterCatalog as any).safetyRules || []
  };
}
