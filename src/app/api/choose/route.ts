import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebaseAdmin';
import { getUserIdFromRequest } from '../../../lib/telegram';
import { sendMessage } from '../../../lib/notify';

export async function POST(req: NextRequest) {
  try {
    const { quoteId, currency } = await req.json();
    if (!quoteId || !['stars','ton'].includes(currency)) return NextResponse.json({ error: 'bad payload' }, { status: 400 });
    const userId = getUserIdFromRequest(req as unknown as Request);
    const qref = adminDb.collection('quotes').doc(quoteId);
    const q = await qref.get();
    if (!q.exists) return NextResponse.json({ error: 'not found' }, { status: 404 });
    const d = q.data()!;
    if (d.user_id !== userId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    if (d.status !== 'active' || d.expires_at_ms < Date.now()) return NextResponse.json({ error: 'expired' }, { status: 400 });
    const amount = currency==='stars' ? d.stars : d.ton;

    // Transaction: reserve user balance and create hold + payment
    const result = await adminDb.runTransaction(async (tx) => {
      const userRef = adminDb.collection('users').doc(userId);
      const userSnap = await tx.get(userRef);
      const balances = userSnap.exists ? (userSnap.data()!.balances || { stars: 0, ton: 0 }) : { stars: 0, ton: 0 };
      const bal = balances[currency] || 0;
      if (bal < amount) throw new Error('Недостаточно средств на балансе');

      // decrement balance
      const newBal = { ...balances, [currency]: bal - amount };
      if (userSnap.exists) tx.update(userRef, { balances: newBal });
      else tx.set(userRef, { balances: newBal, created_at_ms: Date.now(), tg_id: userId });

      // create hold
      const holdRef = adminDb.collection('holds').doc();
      tx.set(holdRef, {
        user_id: userId, quote_id: quoteId, currency, amount,
        status: 'active', created_at_ms: Date.now()
      });

      // create payment
      const payRef = adminDb.collection('payments').doc();
      tx.set(payRef, {
        user_id: userId, quote_id: quoteId, rub: d.rub, currency, amount,
        status: 'pending', hold_id: holdRef.id,
        created_at_ms: Date.now(), updated_at_ms: Date.now()
      });

      return { paymentId: payRef.id };
    });

    // Notify admin about pending payment
    const admins = (process.env.TELEGRAM_ADMIN_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
    for (const adminId of admins) {
      sendMessage(adminId, `🧾 Новый запрос оплаты: ${d.rub} ₽ (${currency.toUpperCase()} ≈ ${amount})`);
    }

    return NextResponse.json(result);
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'internal' }, { status: 500 });
  }
}
