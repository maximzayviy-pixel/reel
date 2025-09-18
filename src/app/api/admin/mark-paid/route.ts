export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDB } from '../../../../lib/firebaseAdmin';
import { isAdminRequest } from '../../../../lib/telegram';
import { sendMessage } from '../../../../lib/notify';

/** List pending payments for admin */
export async function GET(req: NextRequest) {
  try {
    if (!isAdminRequest(req as unknown as Request)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    const adminDb = getAdminDB();
    const snap = await adminDb.collection('payments').where('status','==','pending').orderBy('created_at_ms','desc').limit(50).get();
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ items });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'internal' }, { status: 500 });
  }
}

/** Mark payment as paid, finalize hold */
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
      tx.update(payRef, { status: 'paid', updated_at_ms: Date.now() });
      if (pay.hold_id) {
        const holdRef = adminDb.collection('holds').doc(pay.hold_id);
        tx.set(holdRef, { status: 'used', used_at_ms: Date.now() }, { merge: true });
      }
      const histRef = adminDb.collection('history').doc();
      tx.set(histRef, {
        type: 'payment_paid',
        user_id: pay.user_id,
        payment_id: payRef.id,
        currency: pay.currency,
        amount: pay.amount,
        rub: pay.rub,
        created_at_ms: Date.now(),
      });
    });

    // notify user & admins
    const admins = (process.env.TELEGRAM_ADMIN_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
    const msg = `✅ Оплачено админом\\nПлатёж #${paymentId}\\nСумма: ${pay.rub} ₽ (${pay.currency.toUpperCase()} ≈ ${pay.amount})`;
    for (const a of admins) sendMessage(a, msg);
    if (pay.user_id) sendMessage(String(pay.user_id), `✅ Ваш платёж на ${pay.rub} ₽ оплачен`);

    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'internal' }, { status: 500 });
  }
}
