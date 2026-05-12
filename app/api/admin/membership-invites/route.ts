import { NextRequest, NextResponse } from 'next/server';
import { createMembershipInvite, listMembershipInvites, revokeMembershipInvite } from '@/lib/membership-invites';
import { assertRuntimeRateLimit, assertWriteProtection, readJsonBody, requirePermission } from '@/lib/runtime-security';
import { recordSecurityAuditEvent } from '@/lib/security-audit-log';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

async function requireManager(request: NextRequest) {
  const gate = await requirePermission('membership:manage', 'Bạn cần đăng nhập trước khi quản trị lời mời.', request);
  if (!gate.ok) return { error: gate.response };
  return { user: gate.user };
}

export async function GET(request: NextRequest) {
  const auth = await requireManager(request);
  if (auth.error) return auth.error;
  const rate = assertRuntimeRateLimit(request, 'membership_invite_read', { windowMs: 60_000, max: 50 });
  if (!rate.allowed) return rate.response;
  const { searchParams } = new URL(request.url);
  const items = await listMembershipInvites({
    q: searchParams.get('q') || undefined,
    role: searchParams.get('role') || undefined,
    status: searchParams.get('status') || undefined
  }, auth.user!);
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const auth = await requireManager(request);
  if (auth.error) return auth.error;
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const rate = assertRuntimeRateLimit(request, 'membership_invite_write', { windowMs: 60_000, max: 15 });
  if (!rate.allowed) return rate.response;
  const parsed = await readJsonBody<any>(request, { maxBytes: 16_000, required: true });
  if (!parsed.ok) return parsed.response;
  try {
    const result = await createMembershipInvite(parsed.body, auth.user!);
    await recordSecurityAuditEvent({
      eventType: 'membership_invite_create',
      outcome: 'success',
      actorName: auth.user!.name,
      actorRole: auth.user!.role,
      schoolKey: auth.user!.schoolKey,
      departmentKey: auth.user!.departmentKey,
      targetType: 'membership_invite',
      targetId: result.invite.id,
      request,
      metadata: { invitedRole: result.invite.role, expiresAt: result.invite.expiresAt }
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    await recordSecurityAuditEvent({ eventType: 'membership_invite_create', outcome: 'failure', severity: 'warning', actorName: auth.user!.name, actorRole: auth.user!.role, reason: error?.message || 'create_failed', request });
    return NextResponse.json({ error: error?.message || 'Không tạo được lời mời.' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireManager(request);
  if (auth.error) return auth.error;
  const protection = assertWriteProtection(request);
  if (!protection.ok) return protection.response;
  const rate = assertRuntimeRateLimit(request, 'membership_invite_revoke', { windowMs: 60_000, max: 20 });
  if (!rate.allowed) return rate.response;
  const { searchParams } = new URL(request.url);
  const id = String(searchParams.get('id') || '').trim();
  if (!id) return NextResponse.json({ error: 'Thiếu id hoặc code lời mời cần thu hồi.' }, { status: 400 });
  try {
    const result = await revokeMembershipInvite(id, auth.user!);
    await recordSecurityAuditEvent({
      eventType: 'membership_invite_revoke',
      outcome: 'success',
      actorName: auth.user!.name,
      actorRole: auth.user!.role,
      schoolKey: auth.user!.schoolKey,
      departmentKey: auth.user!.departmentKey,
      targetType: 'membership_invite',
      targetId: result.id,
      request
    });
    return NextResponse.json(result);
  } catch (error: any) {
    await recordSecurityAuditEvent({ eventType: 'membership_invite_revoke', outcome: 'failure', severity: 'warning', actorName: auth.user!.name, actorRole: auth.user!.role, targetType: 'membership_invite', targetId: id, reason: error?.message || 'revoke_failed', request });
    return NextResponse.json({ error: error?.message || 'Không thu hồi được lời mời.' }, { status: 400 });
  }
}
