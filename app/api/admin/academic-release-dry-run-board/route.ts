import { NextResponse } from 'next/server';
import { buildAcademicReleaseDryRunBoard } from '@/lib/academic-release-dry-run';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export async function GET() { return NextResponse.json({ board: buildAcademicReleaseDryRunBoard(), warning: 'Admin dry-run board: chỉ xem gate và blocker. không auto-release, không fake verified, không auto-public community resource.' }); }
