import { NextRequest, NextResponse } from 'next/server';
import { getAdminDB } from '../../../../lib/firebaseAdmin';
import { getUserIdFromRequest } from '../../../../lib/telegram';

export async function GET(req: NextRequest) {
  const adminDb = getAdminDB();
  const userId = getUserIdFromRequest(req as unknown as Request);
  const ref = adminDb.collection('users').doc(userId);
  const snap = await ref.get();
  if (!snap.exists) {
    await ref.set({balances:{stars:0, ton:0},created_at_ms:Date.now(), tg_id: userId});
    return NextResponse.json({stars:0,ton:0});
  }
  return NextResponse.json(snap.data()?.balances || {stars:0,ton:0});
}
