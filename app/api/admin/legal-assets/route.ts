import { NextRequest, NextResponse } from 'next/server';
import { holdCommunityResourcesForLegalAsset } from '@/lib/community-moderation';
import { createLegalAssetRecord, readLegalAssets, requestLegalAssetTakedown, reviewLegalAssetRecord } from '@/lib/legal-asset-library';
import { assertRuntimeRateLimit, assertWriteProtection, readJsonBody, requirePermission } from '@/lib/runtime-security';
import { recordSecurityAuditEvent } from '@/lib/security-audit-log';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

async function requireContentReviewer() {
  const gate = await requirePermission('content:review', 'Bạn cần quyền rà soát học liệu/pháp lý.');
  if (!gate.ok) return { error: gate.response };
  return { user: gate.user };
}

export async function GET(request: NextRequest) {
  const auth = await requireContentReviewer();
  if (auth.error) return auth.error;
  const rate = assertRuntimeRateLimit(request, 'admin_legal_asset_read', { windowMs: 60_000, max: 50 });
  if (!rate.allowed) return rate.response;
  const assets = await readLegalAssets();
  return NextResponse.json({ assets, policy: { approvedRequiredForExport: true, unknownLicenseBlocksOfficialUse: true, takedownKeepsOutOfPublic: true } });
}

export async function POST(request: NextRequest) {
  const auth = await requireContentReviewer();
  if (auth.error) return auth.error;
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const rate = assertRuntimeRateLimit(request, 'admin_legal_asset_create', { windowMs: 60_000, max: 15 });
  if (!rate.allowed) return rate.response;
  const parsed = await readJsonBody<any>(request, { maxBytes: 24_000, required: true });
  if (!parsed.ok) return parsed.response;
  try {
    const result = await createLegalAssetRecord(parsed.body, auth.user!.name);
    await recordSecurityAuditEvent({
      eventType: 'legal_asset_create',
      outcome: 'success',
      actorName: auth.user!.name,
      actorRole: auth.user!.role,
      schoolKey: auth.user!.schoolKey,
      departmentKey: auth.user!.departmentKey,
      targetType: 'legal_asset',
      targetId: result.asset.id,
      request,
      metadata: { status: result.asset.status, license: result.asset.license, assetType: result.asset.assetType }
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    await recordSecurityAuditEvent({ eventType: 'legal_asset_create', outcome: 'failure', severity: 'warning', actorName: auth.user!.name, actorRole: auth.user!.role, reason: error?.message || 'create_failed', request });
    return NextResponse.json({ error: error?.message || 'Không tạo được legal asset.' }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireContentReviewer();
  if (auth.error) return auth.error;
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const rate = assertRuntimeRateLimit(request, 'admin_legal_asset_review', { windowMs: 60_000, max: 20 });
  if (!rate.allowed) return rate.response;
  const parsed = await readJsonBody<any>(request, { maxBytes: 24_000, required: true });
  if (!parsed.ok) return parsed.response;
  const id = String(parsed.body?.id || '').trim();
  if (!id) return NextResponse.json({ error: 'Thiếu id legal asset.' }, { status: 400 });
  try {
    const isTakedown = parsed.body?.action === 'takedown';
    const takedownReason = String(parsed.body?.reason || parsed.body?.licenseNote || '');
    const result = isTakedown
      ? await requestLegalAssetTakedown(id, takedownReason, auth.user!.name)
      : await reviewLegalAssetRecord(id, parsed.body, auth.user!.name);
    const linkedHold = isTakedown
      ? await holdCommunityResourcesForLegalAsset(id, takedownReason || 'Legal asset bị yêu cầu takedown.', auth.user!)
      : { held: 0, resourceIds: [] as string[] };
    await recordSecurityAuditEvent({
      eventType: 'legal_asset_review',
      outcome: 'success',
      actorName: auth.user!.name,
      actorRole: auth.user!.role,
      schoolKey: auth.user!.schoolKey,
      departmentKey: auth.user!.departmentKey,
      targetType: 'legal_asset',
      targetId: id,
      request,
      metadata: { action: parsed.body?.action || 'review', status: result.asset.status, license: result.asset.license, linkedResourcesHeld: linkedHold.held }
    });
    return NextResponse.json({ ...result, linkedHold });
  } catch (error: any) {
    await recordSecurityAuditEvent({ eventType: 'legal_asset_review', outcome: 'failure', severity: 'warning', actorName: auth.user!.name, actorRole: auth.user!.role, targetType: 'legal_asset', targetId: id, reason: error?.message || 'review_failed', request });
    return NextResponse.json({ error: error?.message || 'Không cập nhật được legal asset.' }, { status: 400 });
  }
}
