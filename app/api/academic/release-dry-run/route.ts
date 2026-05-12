import { NextResponse } from 'next/server';
import { buildAcademicReleaseDryRunReport, evaluateAcademicReleaseDryRunCandidate } from '@/lib/academic-release-dry-run';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export async function GET() { return NextResponse.json({ report: buildAcademicReleaseDryRunReport(), warning: 'Batch113 release dry-run only: không ghi registry, không nâng reviewed/verified, không bật contentDepthAllowed.' }); }
export async function POST(request: Request) { const body = await request.json().catch(() => ({})); return NextResponse.json({ evaluation: evaluateAcademicReleaseDryRunCandidate(body), note: 'Dry-run release evaluation only: không mutate registry, không public tài nguyên và không mở nội dung sâu.' }); }
