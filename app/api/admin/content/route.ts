import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { assertLessonPermission } from '@/lib/access';
import { contentRepository } from '@/lib/content-repository';
import { contentManagement } from '@/lib/content-management';
import { getRecentContentReviews } from '@/lib/content-reviews';
import { getMembershipSummary, listMemberships } from '@/lib/membership';
import { buildAcademicDossierSummary } from '@/lib/academic-dossier';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Bạn cần đăng nhập trước khi quản trị kho nội dung.' }, { status: 401 });
  if (!assertLessonPermission(user, 'content:manage')) {
    return NextResponse.json({ error: 'Chỉ tổ trưởng/chuyên môn hoặc quản trị mới được quản trị kho nội dung.' }, { status: 403 });
  }

  const [overview, summary, adminSummary, audits, imports, recentReviews, membershipSummary, memberships, verificationQueue, academicQuality, releaseBoard, packCockpit, bundleSummary, sourceAuthoritySummary, officialPortfolioSummary, executionSummary, curationSummary, evidenceLedgerSummary, evidenceReviewSummary, evidenceReviewWorkbench, packWorkbench, rolloutWaveSummary, rolloutPortfolio, complianceSummary, curationQueue] = await Promise.all([
    contentRepository.overview(user),
    contentRepository.getCurriculumSummary(user),
    contentManagement.getSummary(),
    contentManagement.listAuditLogs(),
    contentManagement.listImportBatches(),
    getRecentContentReviews(user),
    getMembershipSummary(user),
    listMemberships({}, user),
    contentManagement.getVerificationQueue(user),
    contentManagement.getAcademicQualitySummary(user),
    contentManagement.getPackReleaseBoard(user),
    contentManagement.getPackAcademicCockpit(user),
    contentManagement.getAcademicSourceBundleSummary(user),
    contentManagement.getAcademicSourceAuthoritySummary(),
    contentManagement.getOfficialCurriculumPortfolio(),
    contentManagement.getAcademicPackExecutionRegistrySummary(user),
    contentManagement.getAcademicPackCurationSummary(user),
    contentManagement.getAcademicEvidenceLedgerRegistrySummary(user),
    contentManagement.getAcademicEvidenceReviewRegistrySummary(user),
    contentManagement.getAcademicEvidenceReviewWorkbench(user),
    contentManagement.getPackAcademicWorkbench(user),
    contentManagement.getAcademicRolloutWaveSummary(),
    contentManagement.getAcademicRolloutPortfolioSummary(),
    contentManagement.getAcademicComplianceSummary(user),
    contentManagement.getAcademicCurationQueue(user)
  ]);
  const dossierSummary = buildAcademicDossierSummary(releaseBoard.items);

  return NextResponse.json({
    overview,
    summary,
    supportSummary: summary.supportSummary,
    adminSummary,
    audits,
    imports,
    recentReviews,
    membershipSummary,
    memberships: memberships.slice(0, 30),
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
    complianceSummary,
    curationQueue
  });
}
