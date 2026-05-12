import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { buildOperatingEntitlementSnapshot } from '@/lib/operating-runtime';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    const user = await getSessionUser();
    const entitlement = await buildOperatingEntitlementSnapshot(user);
    return NextResponse.json({ entitlement });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Không đọc được operating entitlement.' }, { status: 500 });
  }
}
