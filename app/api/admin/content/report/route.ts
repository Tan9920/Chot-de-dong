import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { assertLessonPermission } from '@/lib/access';
import { contentRepository } from '@/lib/content-repository';
import { contentManagement } from '@/lib/content-management';
import { buildAcademicDossierSummary } from '@/lib/academic-dossier';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Bạn cần đăng nhập trước khi tải report quản trị.' }, { status: 401 });
  if (!assertLessonPermission(user, 'content:manage')) {
    return NextResponse.json({ error: 'Chỉ tổ trưởng/chuyên môn hoặc quản trị mới được tải report quản trị.' }, { status: 403 });
  }

  const [overview, summary, verificationQueue, academicQuality, releaseBoard, audits, imports, packCockpit, bundleSummary, sourceAuthoritySummary, officialPortfolioSummary, executionSummary, curationSummary, evidenceLedgerSummary, evidenceReviewSummary, evidenceReviewWorkbench, packWorkbench, rolloutWaveSummary, rolloutPortfolio, complianceSummary, curationQueue] = await Promise.all([
    contentRepository.overview(user),
    contentRepository.getCurriculumSummary(user),
    contentManagement.getVerificationQueue(user),
    contentManagement.getAcademicQualitySummary(user),
    contentManagement.getPackReleaseBoard(user),
    contentManagement.listAuditLogs(),
    contentManagement.listImportBatches(),
    contentManagement.getPackAcademicCockpit(user, { limit: undefined }),
    contentManagement.getAcademicSourceBundleSummary(user),
    contentManagement.getAcademicSourceAuthoritySummary(),
    contentManagement.getOfficialCurriculumPortfolio(),
    contentManagement.getAcademicPackExecutionRegistrySummary(user),
    contentManagement.getAcademicPackCurationSummary(user),
    contentManagement.getAcademicEvidenceLedgerRegistrySummary(user),
    contentManagement.getAcademicEvidenceReviewRegistrySummary(user),
    contentManagement.getAcademicEvidenceReviewWorkbench(user, { limit: undefined }),
    contentManagement.getPackAcademicWorkbench(user, { limit: undefined }),
    contentManagement.getAcademicRolloutWaveSummary(),
    contentManagement.getAcademicRolloutPortfolioSummary(),
    contentManagement.getAcademicComplianceSummary(user),
    contentManagement.getAcademicCurationQueue(user)
  ]);
  const dossierSummary = buildAcademicDossierSummary(releaseBoard.items);

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    overview,
    summary,
    verificationQueue,
    academicQuality,
    releaseBoard,
    dossierSummary,
    packCockpit,
    bundleSummary,
    sourceAuthoritySummary,
    officialPortfolioSummary,
    executionSummary,
    curationSummary,
    evidenceLedgerSummary,
    evidenceReviewSummary,
    evidenceReviewWorkbench,
    packWorkbench,
    rolloutWaveSummary,
    rolloutPortfolio,
    audits,
    imports,
    complianceSummary,
    curationQueue
  });
}
