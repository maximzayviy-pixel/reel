import { NextRequest, NextResponse } from 'next/server';
import { getAdminDB } from '../../../../lib/firebaseAdmin';
import { sendMessage } from '../../../../lib/notify';

/**
 * Minimal Telegram Bot Webhook handler.
 * Expects JSON update. On successful_payment with currency XTR (Stars),
 * credits user's stars balance by paid 'stars' count (see STARS_PRICE_MULTIPLIER).
 * UI shows RUB equivalent as stars/2 (2⭐ = 1₽).
 */
export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) return NextResponse.json({ ok: true });

    const message = update?.message || update?.channel_post || null;
    const sp = message?.successful_payment;
    if (!sp) return NextResponse.json({ ok: true });

    const from = message?.from;
    const userId = from?.id ? String(from.id) : null;
    if (!userId) return NextResponse.json({ ok: true });

    // total_amount may be in "minimal units". We used STARS_PRICE_MULTIPLIER when creating invoice.
    const mult = Number(process.env.STARS_PRICE_MULTIPLIER || 1);
    const total = Number(sp.total_amount || 0);
    const paidStars = mult > 0 ? Math.round(total / mult) : total; // back to "stars" units used in UI

    const adminDb = getAdminDB();
    await adminDb.runTransaction(async (tx) => {
      const userRef = adminDb.collection('users').doc(userId);
      const u = await tx.get(userRef);
      const balances = u.exists ? (u.data()?.balances || { stars: 0, ton: 0 }) : { stars: 0, ton: 0 };
      balances.stars = (balances.stars || 0) + paidStars;
      if (u.exists) tx.update(userRef, { balances });
      else tx.set(userRef, { balances, tg_id: userId, created_at_ms: Date.now() });

      const histRef = adminDb.collection('history').doc();
      tx.set(histRef, {
        type: 'stars_topup',
        user_id: userId,
        stars: paidStars,
        rub_equiv: paidStars / 2, // 2⭐ = 1₽
        payload: sp.invoice_payload || null,
        created_at_ms: Date.now(),
      });
    });

    // Notify user
    await sendMessage(userId, `⭐ Зачислено: ${paidStars} звёзд (≈ ${(paidStars/2).toFixed(2)} ₽). Спасибо!`);
    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ ok: true });
  }
}
