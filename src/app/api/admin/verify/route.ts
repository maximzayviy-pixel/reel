import { NextRequest, NextResponse } from 'next/server';
import { getAdminDB } from '../../../../lib/firebaseAdmin';
import { isAdminRequest } from '../../../../lib/telegram';

export async function POST(req: NextRequest) {
  try {
    if (!isAdminRequest(req as unknown as Request)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    const { userId, verified } = await req.json();
    const adminDb = getAdminDB();
    await adminDb.collection('users').doc(String(userId)).set({ verified: !!verified }, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'internal' }, { status: 500 });
  }
}
