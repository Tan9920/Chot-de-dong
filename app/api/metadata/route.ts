import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { contentManagement } from '@/lib/content-management';
import { teachingMethods, teachingTechniques } from '@/lib/pedagogy';
import { contentRepository } from '@/lib/content-repository';
import { getCurriculumRoadmap } from '@/lib/curriculum-roadmap';
import { buildCoverageTruthReport } from '@/lib/coverage-truth';
import { getSchoolSettings, getStorageMode, readLessons } from '@/lib/storage';
import { resolveCurriculumScope } from '@/lib/curriculum-scope';
import { getTeachingPolicyFromSettings } from '@/lib/teaching-policy';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  const user = await getSessionUser();
  const [curriculum, summary, contentOverview, templates, settings] = await Promise.all([
    contentRepository.getCurriculumCatalog(user),
    contentRepository.getCurriculumSummary(user),
    contentRepository.overview(user),
    contentManagement.listTemplates(user),
    getSchoolSettings()
  ]);
  const roadmap = getCurriculumRoadmap();
  const lessons = await readLessons();
  const coverageTruth = buildCoverageTruthReport(roadmap, summary.coverage, lessons);
  const defaultScope = resolveCurriculumScope(curriculum, summary.gradeLevelMap, settings);

  return NextResponse.json({
    curriculum,
    templates: templates.map((item) => item.name),
    teachingMethods,
    teachingTechniques,
    defaultScope,
    teachingPolicy: getTeachingPolicyFromSettings(settings),
    summary: {
      ...summary,
      roadmap,
      coverageTruth
    },
    contentOverview,
    storage: getStorageMode()
  });
}
