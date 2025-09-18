import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebaseAdmin';
import { isAdminRequest } from '../../../../lib/telegram';
import { sendMessage } from '../../../../lib/notify';

export async function POST(req: NextRequest) {
  try {
    if (!isAdminRequest(req as unknown as Request)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    const { paymentId } = await req.json();
    const result = await adminDb.runTransaction(async (tx) => {
      const pref = adminDb.collection('payments').doc(paymentId);
      const p = await tx.get(pref);
      if (!p.exists) throw new Error('not found');
      const pd = p.data()!;
      if (pd.status !== 'pending') return { ok: true };
      // capture hold (balance already reserved)
      const holdRef = adminDb.collection('holds').doc(pd.hold_id);
      const holdSnap = await tx.get(holdRef);
      if (!holdSnap.exists) throw new Error('hold not found');
      tx.update(holdRef, { status: 'captured' });
      tx.update(pref, { status: 'paid', updated_at_ms: Date.now() });
      return { ok: true, user_id: pd.user_id, rub: pd.rub };
    });

    if (result.user_id) {
      await sendMessage(String(result.user_id), `✅ Оплата подтверждена: ${result.rub} ₽`);
    }
    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'internal' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const peek = searchParams.get('peek');
  const list = searchParams.get('list');
  if (peek) {
    const p = await adminDb.collection('payments').doc(peek).get();
    if (!p.exists) return NextResponse.json({ error: 'not found' }, { status: 404 });
    const pd = p.data()!;
    const q = await adminDb.collection('quotes').doc(pd.quote_id).get();
    return NextResponse.json({ payment: { id:p.id, ...pd }, quote: { id:q.id, ...q.data() } });
  }
  if (list === 'pending') {
    const s = await adminDb.collection('payments').where('status','==','pending').orderBy('created_at_ms','desc').limit(50).get();
    return NextResponse.json({ items: s.docs.map(d => ({ id:d.id, ...d.data() })) });
  }
  return NextResponse.json({ ok:true });
}
