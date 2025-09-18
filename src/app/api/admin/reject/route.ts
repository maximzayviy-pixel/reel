import { NextRequest, NextResponse } from 'next/server';
import { getAdminDB } from '../../../../lib/firebaseAdmin';
import { isAdminRequest } from '../../../../lib/telegram';
import { sendMessage } from '../../../../lib/notify';

export async function POST(req: NextRequest) {
  try {
    if (!isAdminRequest(req as unknown as Request)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    const { paymentId } = await req.json();
    const adminDb = getAdminDB();
    const result = await adminDb.runTransaction(async (tx) => {
      const pref = adminDb.collection('payments').doc(paymentId);
      const p = await tx.get(pref);
      if (!p.exists) throw new Error('not found');
      const pd = p.data()!;
      if (pd.status !== 'pending') return { ok: true };
      const holdRef = adminDb.collection('holds').doc(pd.hold_id);
      const holdSnap = await tx.get(holdRef);
      if (!holdSnap.exists) throw new Error('hold not found');
      const hold = holdSnap.data()!;
      const userRef = adminDb.collection('users').doc(pd.user_id);
      const userSnap = await tx.get(userRef);
      const balances = userSnap.exists ? (userSnap.data()!.balances || { stars: 0, ton: 0 }) : { stars: 0, ton: 0 };
      const cur = hold.currency as 'stars'|'ton';
      balances[cur] = (balances[cur] || 0) + hold.amount;
      if (userSnap.exists) tx.update(userRef, { balances });
      else tx.set(userRef, { balances, created_at_ms: Date.now(), tg_id: pd.user_id });
      tx.update(holdRef, { status: 'released' });
      tx.update(pref, { status: 'rejected', updated_at_ms: Date.now() });
      return { ok: true, user_id: pd.user_id, rub: pd.rub };
    });
    if (result.user_id) await sendMessage(String(result.user_id), `❌ Оплата отклонена: ${result.rub} ₽`);
    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'internal' }, { status: 500 });
  }
}
