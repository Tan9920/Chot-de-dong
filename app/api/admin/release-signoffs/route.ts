import { NextRequest, NextResponse } from 'next/server';
import { buildReleaseSignOffBoard } from '@/lib/release-signoff-board';
import { assertRuntimeRateLimit, requirePermission } from '@/lib/runtime-security';
import type { ReleaseSignOffWorkflowStatus } from '@/lib/release-signoff-workflow';
import type { ReleaseDossierAudience, ReleaseDossierSubjectType } from '@/lib/release-dossier';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const statusValues = new Set(['all', 'needs_my_action', 'open', 'changes_requested', 'rejected', 'approved', 'superseded']);
const audienceValues = new Set(['all', 'teacher_private', 'department_review', 'school_internal', 'public_community', 'public_marketing']);
const subjectTypeValues = new Set(['all', 'lesson_plan', 'community_resource', 'legal_asset', 'school_release', 'marketing_claim']);

function pickParam<T extends string>(request: NextRequest, key: string, allowed: Set<string>, fallback: T): T {
  const value = request.nextUrl.searchParams.get(key) || fallback;
  return (allowed.has(value) ? value : fallback) as T;
}

export async function GET(request: NextRequest) {
  const auth = await requirePermission('content:review', 'Bạn cần quyền review để xem release sign-off board.');
  if (!auth.ok) return auth.response;
  const rate = assertRuntimeRateLimit(request, 'admin_release_signoff_board_read', { windowMs: 60_000, max: 50 });
  if (!rate.allowed) return rate.response;

  const board = await buildReleaseSignOffBoard({
    audience: pickParam<ReleaseDossierAudience | 'all'>(request, 'audience', audienceValues, 'all'),
    subjectType: pickParam<ReleaseDossierSubjectType | 'all'>(request, 'subjectType', subjectTypeValues, 'all'),
    status: pickParam<ReleaseSignOffWorkflowStatus | 'needs_my_action' | 'all'>(request, 'status', statusValues, 'all'),
    includeSuperseded: request.nextUrl.searchParams.get('includeSuperseded') === 'true',
    limit: Number(request.nextUrl.searchParams.get('limit') || 100)
  }, auth.user);

  return NextResponse.json({
    board,
    policy: {
      adminBoardIsReadOnly: true,
      writeDecisionsViaServerSignoffRoute: '/api/release-dossier/signoffs',
      postRouteStillRequiresCsrfSessionRateLimitOwnershipAndRoleChecks: true,
      boardDoesNotPromoteSeedOrScaffoldToVerified: true,
      boardDoesNotReplaceHumanReview: true
    }
  });
}
