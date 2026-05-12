import profilesData from '@/data/lesson-drafting-profiles.json';

function normaliseGrade(value: any) {
  const raw = String(value || '').trim();
  const match = raw.match(/\d+/);
  return match ? match[0] : raw;
}

function normalise(value: any) {
  return String(value || '').trim().toLowerCase();
}

export function listLessonDraftingProfiles() {
  return [...((profilesData as any).profiles || [])];
}

export function resolveLessonDraftingProfile(input: any = {}) {
  const grade = normaliseGrade(input.grade);
  const examMode = normalise(input.examMode || input.goal || input.lessonMode);
  const learnerProfile = normalise(input.learnerProfile || input.differentiation || 'standard');

  const profiles = listLessonDraftingProfiles();
  const examProfile = profiles.find((item: any) => item.examMode && examMode && normalise(item.examMode) === examMode);
  const gradeProfile = profiles.find((item: any) => Array.isArray(item.grades) && item.grades.map(String).includes(grade));
  const profile = examProfile || gradeProfile || profiles.find((item: any) => item.id === 'secondary-6-9') || profiles[0];

  return {
    ...profile,
    selectedBy: examProfile ? 'exam_mode' : gradeProfile ? 'grade_band' : 'fallback',
    grade,
    learnerProfile: learnerProfile || 'standard',
    differentiationNote: profile?.differentiation?.[learnerProfile] || profile?.differentiation?.standard || 'Hoàn thành nhiệm vụ chính theo tiêu chí giáo viên đưa ra.',
    policy: {
      noOneSizeFitsAll: true,
      safeFrameWhenDataInsufficient: true,
      teacherFinalReviewRequired: true,
      noDeepQuestionsWithoutReviewedData: true
    }
  };
}

export function buildLessonDraftingProfileSummary() {
  const profiles = listLessonDraftingProfiles();
  return {
    version: (profilesData as any).version,
    updatedAt: (profilesData as any).updatedAt,
    principles: (profilesData as any).principles || [],
    profileCount: profiles.length,
    gradeProfiles: profiles.filter((item: any) => item.grades).map((item: any) => ({ id: item.id, label: item.label, grades: item.grades })),
    examProfiles: profiles.filter((item: any) => item.examMode).map((item: any) => ({ id: item.id, label: item.label, examMode: item.examMode }))
  };
}
