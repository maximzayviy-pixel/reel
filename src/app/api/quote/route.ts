import { NextRequest, NextResponse } from 'next/server';
import { getAdminDB } from '../../../lib/firebaseAdmin';
import { getTonRate } from '../../../lib/rates';
import { getUserIdFromRequest } from '../../../lib/telegram';

export async function POST(req: NextRequest) {
  try {
    const { rub } = await req.json();
    if (!rub || rub <= 0) return NextResponse.json({ error: 'bad rub' }, { status: 400 });
    const rate = await getTonRate();
    const stars = Math.ceil(rub * 2);
    const ton = Math.ceil(((rub / rate) * 1.15) * 1e9) / 1e9;
    const userId = getUserIdFromRequest(req as unknown as Request);
    const now = Date.now();
    const expires = now + 10*60*1000;
    const adminDb = getAdminDB();
    const ref = adminDb.collection('quotes').doc();
    await ref.set({ user_id:userId, rub, stars, ton, rate_rub_per_ton:rate, status:'active', expires_at_ms:expires, created_at_ms:now });
    return NextResponse.json({ id: ref.id, rub, stars, ton, expires_at_ms: expires });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'internal' }, { status: 500 });
  }
}
