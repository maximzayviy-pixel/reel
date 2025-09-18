import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/adminGuard';
import { addBalance } from '../../../../lib/balanceOps';

export async function POST(req: NextRequest){
  try {
    requireAdmin(req);
    const body = await req.json();
    const { userId, currency, amount, note } = body || {};
    if (!userId || !currency || typeof amount !== 'number') {
      return NextResponse.json({ error: 'userId, currency, amount required' }, { status: 400 });
    }
    if (currency !== 'stars' && currency !== 'ton') {
      return NextResponse.json({ error: 'currency must be stars|ton' }, { status: 400 });
    }
    await addBalance(String(userId), currency, amount, note);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'error' }, { status: 401 });
  }
}