export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDB } from '../../../../lib/firebaseAdmin';
import { isAdminRequest } from '../../../../lib/telegram';
import { sendMessage } from '../../../../lib/notify';

export async function POST(req: NextRequest) {
  try {
    if (!isAdminRequest(req as unknown as Request)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    const { paymentId } = await req.json();
    if (!paymentId) return NextResponse.json({ error: 'bad payload' }, { status: 400 });

    const adminDb = getAdminDB();
    const payRef = adminDb.collection('payments').doc(String(paymentId));
    const paySnap = await payRef.get();
    if (!paySnap.exists) return NextResponse.json({ error: 'not found' }, { status: 404 });
    const pay = paySnap.data()!;
    if (pay.status !== 'pending') return NextResponse.json({ error: 'already processed' }, { status: 400 });

    await adminDb.runTransaction(async (tx) => {
      // refund hold to balance
      if (pay.hold_id) {
        const holdRef = adminDb.collection('holds').doc(pay.hold_id);
        const holdSnap = await tx.get(holdRef);
        if (holdSnap.exists) {
          tx.set(holdRef, { status: 'released', released_at_ms: Date.now() }, { merge: true });
        }
      }
      // refund balance
      const userRef = adminDb.collection('users').doc(pay.user_id);
      const u = await tx.get(userRef);
      const balances = u.exists ? (u.data()!.balances || { stars:0, ton:0 }) : { stars:0, ton:0 };
      balances[pay.currency] = (balances[pay.currency] || 0) + (pay.amount || 0);
      if (u.exists) tx.update(userRef, { balances });
      else tx.set(userRef, { balances, created_at_ms: Date.now(), tg_id: pay.user_id });

      tx.update(payRef, { status: 'rejected', updated_at_ms: Date.now() });

      const histRef = adminDb.collection('history').doc();
      tx.set(histRef, {
        type: 'payment_rejected',
        user_id: pay.user_id,
        payment_id: payRef.id,
        currency: pay.currency,
        amount: pay.amount,
        rub: pay.rub,
        created_at_ms: Date.now(),
      });
    });

    const admins = (process.env.TELEGRAM_ADMIN_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
    const msg = `❌ Отклонён платёж #${paymentId} (${pay.rub} ₽)`;
    for (const a of admins) sendMessage(a, msg);
    if (pay.user_id) sendMessage(String(pay.user_id), `❌ Ваш платёж на ${pay.rub} ₽ отклонён. Средства возвращены на баланс.`);

    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'internal' }, { status: 500 });
  }
}
