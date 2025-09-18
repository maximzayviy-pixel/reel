import { NextRequest, NextResponse } from 'next/server';
import { getAdminDB } from '../../../../lib/firebaseAdmin';
import { getUserIdFromRequest } from '../../../../lib/telegram';

export async function GET(req: NextRequest) {
  const adminDb = getAdminDB();
  const userId = getUserIdFromRequest(req as unknown as Request);
  const snap = await adminDb.collection('payments').where('user_id','==',userId).orderBy('created_at_ms','desc').limit(20).get();
  return NextResponse.json({items:snap.docs.map(d=>({id:d.id,...d.data()}))});
}
