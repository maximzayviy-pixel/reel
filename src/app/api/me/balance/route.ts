export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDB } from '../../../../lib/firebaseAdmin';
import { getUserIdFromRequest } from '../../../../lib/telegram';

export async function GET(req: NextRequest) {
  const userId = getUserIdFromRequest(req as unknown as Request);
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const adminDb = getAdminDB();
  const doc = await adminDb.collection('users').doc(userId).get();
  const balances = doc.exists ? (doc.data()?.balances || { stars: 0, ton: 0 }) : { stars: 0, ton: 0 };
  return NextResponse.json({ balances });
}
