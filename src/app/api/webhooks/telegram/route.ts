import { NextRequest, NextResponse } from 'next/server';
import { tgCall } from '../../../../lib/telegramApi';
import { adminDb, admin } from '../../../../lib/firebaseAdmin';

export async function POST(req: NextRequest){
  const update = await req.json().catch(()=>null);
  try{
    // 1) pre_checkout_query -> MUST answer in ~10s or the UI will spin and cancel
    const pc = update?.pre_checkout_query;
    if (pc && pc.id){
      await tgCall('answerPreCheckoutQuery', { pre_checkout_query_id: pc.id, ok: true });
      return NextResponse.json({ ok:true });
    }

    // 2) successful_payment (message)
    const sp = update?.message?.successful_payment;
    const from = update?.message?.from;
    if (sp && from?.id){
      const userId = String(from.id);
      const stars = sp.total_amount || 0; // amount is in stars
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
          provider_payment_charge_id: sp.provider_payment_charge_id || null,
          telegram_payment_charge_id: sp.telegram_payment_charge_id || null,
          created_at_ms: admin.firestore.FieldValue.serverTimestamp(),
        });
      });
      // (Optional) notify user in chat
      try{
        await tgCall('sendMessage', { chat_id: userId, text: `Зачислено ⭐ ${stars}. Спасибо!` });
      }catch{}
      return NextResponse.json({ ok:true });
    }

    return NextResponse.json({ ok:true });
  }catch(e:any){
    console.error('[Webhook error]', e?.message, update);
    return NextResponse.json({ ok:false }, { status: 200 }); // always 200 to not retry loop
  }
}

export const GET = async () => NextResponse.json({ ok: true });
