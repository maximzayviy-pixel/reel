import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/adminGuard';
import { setBan } from '../../../../lib/balanceOps';

export async function POST(req: NextRequest){
  try {
    requireAdmin(req);
    const { userId, banned } = await req.json();
    if (!userId || typeof banned !== 'boolean') {
      return NextResponse.json({ error: 'userId and banned required' }, { status: 400 });
    }
    await setBan(String(userId), banned);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'error' }, { status: 401 });
  }
}
