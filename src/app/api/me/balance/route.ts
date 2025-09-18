import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebaseAdmin';

export async function GET(req: NextRequest) {
  const userId = 'demo'; // заменить на userId из Telegram initData
  const ref = adminDb.collection('users').doc(userId);
  const snap = await ref.get();
  if (!snap.exists) {
    await ref.set({balances:{stars:0, ton:0},created_at_ms:Date.now()});
    return NextResponse.json({stars:0,ton:0});
  }
  return NextResponse.json(snap.data().balances);
}
