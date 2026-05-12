import { NextRequest, NextResponse } from 'next/server';
import { readReleaseDossierSnapshots } from '@/lib/release-dossier';
import { buildReleaseSignOffBoard } from '@/lib/release-signoff-board';
import { readReleaseSignOffWorkflows } from '@/lib/release-signoff-workflow';
import { assertRuntimeRateLimit, requirePermission } from '@/lib/runtime-security';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const auth = await requirePermission('content:review', 'Bạn cần quyền review để xem release dossier.');
  if (!auth.ok) return auth.response;
  const rate = assertRuntimeRateLimit(request, 'admin_release_dossier_read', { windowMs: 60_000, max: 40 });
  if (!rate.allowed) return rate.response;
  const [items, signOffWorkflows, signOffBoard] = await Promise.all([
    readReleaseDossierSnapshots(),
    readReleaseSignOffWorkflows(),
    buildReleaseSignOffBoard({ limit: 50 }, auth.user)
  ]);
  const blockerCount = items.filter((item) => item.dossier.issues.some((issue) => issue.severity === 'blocker')).length;
  return NextResponse.json({
    items,
    summary: {
      total: items.length,
      blocked: blockerCount,
      releaseCandidates: items.filter((item) => item.dossier.decision === 'release_candidate' || item.dossier.decision === 'verified_release_candidate').length,
      signOffWorkflows: signOffWorkflows.length,
      signOffApproved: signOffWorkflows.filter((item) => item.status === 'approved').length,
      signOffBlocked: signOffWorkflows.filter((item) => item.status === 'rejected' || item.status === 'changes_requested').length,
      signOffNeedsMyAction: signOffBoard.summary.needsMyAction,
      signOffWithStaleWorkflows: signOffBoard.summary.withStaleWorkflows
    },
    signOffBoard,
    signOffWorkflows,
    policy: {
      snapshotsAreAuditEvidenceNotLegalGuarantees: true,
      doNotPromoteSeedToVerifiedWithoutReview: true,
      publicReleaseRequiresHumanSignOff: true,
      signOffsMustComeFromServerSideWorkflow: true,
      clientSuppliedSignOffsIgnored: true,
      signOffReviewBoardAvailable: true,
      signOffBoardDoesNotReplacePostRouteChecks: true
    }
  });
}
