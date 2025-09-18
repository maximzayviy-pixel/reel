import { NextRequest, NextResponse } from 'next/server';
import { adminDb, admin } from '../../../../lib/firebaseAdmin';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
const tg = async (method: string, payload: any) => {
  if (!BOT_TOKEN) throw new Error('No TELEGRAM_BOT_TOKEN');
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
};

export async function GET() {
  return NextResponse.json({ ok: true, method: 'GET' });
}

export async function POST(req: NextRequest){
  const update = await req.json().catch(()=>null);
  try {
    // 1) pre_checkout_query — answer fast and don't block response
    const pc = update?.pre_checkout_query;
    if (pc?.id) {
      // fire-and-forget with timeout
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 8000);
      tg('answerPreCheckoutQuery', { pre_checkout_query_id: pc.id, ok: true })
        .catch(()=>{})
        .finally(()=>clearTimeout(timeout));
      // отвечаем клиенту мгновенно
      return NextResponse.json({ ok: true, handled: 'pre_checkout_query' });
    }

    // 2) successful_payment — credit stars
    const sp = update?.message?.successful_payment;
    const from = update?.message?.from;
    if (sp && from?.id) {
      const userId = String(from.id);
      const stars = sp.total_amount || 0;

      const userRef = adminDb.collection('users').doc(userId);
      const balRef = userRef.collection('wallet').doc('balances');
      const histRef = userRef.collection('history').doc();

      await adminDb.runTransaction(async (tx) => {
        const snap = await tx.get(balRef);
        const cur = snap.exists ? (snap.data() as any) : { stars: 0, ton: 0 };
        cur.stars = (cur.stars || 0) + stars;
        tx.set(balRef, cur, { merge: true });
        tx.set(histRef, {
          type: 'stars_successful_payment',
          amount: stars,
          created_at_ms: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      // уведомление пользователю (не блокируем основной ответ)
      if (BOT_TOKEN) {
        fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: userId, text: `Зачислено ⭐ ${stars}. Спасибо!` })
        }).catch(()=>{});
      }

      return NextResponse.json({ ok: true, handled: 'successful_payment' });
    }

    return NextResponse.json({ ok: true, handled: 'noop' });
  } catch (e:any) {
    console.error('[webhook]', e?.message);
    // 200 чтобы телега не ретраила бесконечно
    return NextResponse.json({ ok: false, error: e?.message || 'error' }, { status: 200 });
  }
}
