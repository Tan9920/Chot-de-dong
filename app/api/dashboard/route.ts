import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDashboardStats, getStorageMode } from '@/lib/storage';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  const user = await getSessionUser();
  const stats = await getDashboardStats(user);
  return NextResponse.json({ ...stats, storage: getStorageMode() });
}
