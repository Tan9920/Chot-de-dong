import { NextResponse } from 'next/server';
import { buildCoverageTruthReport } from '@/lib/coverage-truth';
import { getCurriculumCoverage } from '@/lib/curriculum-data';
import { getCurriculumRoadmap } from '@/lib/curriculum-roadmap';
import { readLessons } from '@/lib/storage';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    const [lessons] = await Promise.all([readLessons()]);
    const roadmap = getCurriculumRoadmap();
    const coverage = getCurriculumCoverage();
    return NextResponse.json({ report: buildCoverageTruthReport(roadmap, coverage, lessons) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Không dựng được coverage truth report.' }, { status: 500 });
  }
}
