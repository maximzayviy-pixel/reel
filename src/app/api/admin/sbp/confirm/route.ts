export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDB } from '../';
import { isAdminRequest } from '../';
import { sendMessage } from '../';

/**
 * Админ подтверждает СБП и списывает средства с баланса юзера.
 * Body: { paymentId: string, reason?: string }
 */
export async function POST(req: NextRequest) {
  try {
    if (!isAdminRequest(req as unknown as Request)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    const { paymentId, reason } = await req.json();
    if (!paymentId) return NextResponse.json({ error: 'bad_payload' }, { status: 400 });

    const adminDb = getAdminDB();
    const payRef = adminDb.collection('payments').doc(String(paymentId));
    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(payRef);
      if (!snap.exists) throw new Error('not_found');
      const pay = snap.data() as any;
      if (pay.status !== 'pending') throw new Error('already_processed');
      const userId = String(pay.user_id);
      const balRef = adminDb.doc(`balances/${userId}`);
      const balSnap = await tx.get(balRef);
      const bal = (balSnap.exists ? (balSnap.data() as any) : {}) || {};

      if (pay.pay_with === 'stars') {
        const have = Number(bal.stars || 0);
        const need = Number(pay.cost_stars || 0);
        if (have < need) throw new Error('insufficient_stars_now');
        tx.set(balRef, { stars: have - need }, { merge: true });
      } else if (pay.pay_with === 'ton') {
        const have = Number(bal.ton || 0);
        const need = Number(pay.cost_ton || 0);
        if (have < need) throw new Error('insufficient_ton_now');
        tx.set(balRef, { ton: have - need }, { merge: true });
      }
      tx.set(payRef, { status: 'confirmed', admin_reason: reason || '', confirmed_at: Date.now() }, { merge: true });
    });

    // notify user
    const snap = await payRef.get();
    const pay = snap.data() as any;
    if (pay?.user_id) {
      await sendMessage(String(pay.user_id), `✅ Оплата СБП #${paymentId} на ${pay.rub} ₽ подтверждена. Спасибо!`);
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'server_error' }, { status: 400 });
  }
}
