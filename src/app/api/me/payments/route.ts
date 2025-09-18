import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebaseAdmin';

export async function GET(req: NextRequest) {
  const userId = 'demo'; // заменить на userId из Telegram initData
  const snap = await adminDb.collection('payments').where('user_id','==',userId).orderBy('created_at_ms','desc').limit(20).get();
  return NextResponse.json({items:snap.docs.map(d=>({id:d.id,...d.data()}))});
}
