import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { contentManagement } from '@/lib/content-management';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({ items: await contentManagement.listTemplates(user) });
}
