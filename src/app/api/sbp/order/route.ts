export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDB } from '../../../../../lib/firebaseAdmin';
import { getUserIdFromRequest } from '../../../../../lib/telegram';
import { sendPhoto, sendMessage } from '../../../../../lib/notify';

function getRates() {
  const ton = Number(process.env.TON_RATE_RUB || 350);
  const starsPerRub = Number(process.env.STARS_PER_RUB || 2);
  return { ton, starsPerRub };
}

/**
 * Создать заявку на оплату СБП: пользователь платит с баланса (stars/ton),
 * а админ проводит оплату по QR и подтверждает в админке.
 * Body: { rub: number, payWith: 'stars' | 'ton', qrUrl: string, comment?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { rub, payWith, qrUrl, comment } = await req.json();
    const userId = getUserIdFromRequest(req as unknown as Request);
    if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const rubN = Number(rub);
    if (!rubN || rubN < 1) return NextResponse.json({ error: 'bad_amount' }, { status: 400 });
    if (payWith !== 'stars' && payWith !== 'ton') return NextResponse.json({ error: 'bad_currency' }, { status: 400 });
    if (!qrUrl || typeof qrUrl !== 'string') return NextResponse.json({ error: 'bad_qr' }, { status: 400 });

    const rates = getRates();
    const adminDb = getAdminDB();

    // read user balance
    const balRef = adminDb.doc(`balances/${userId}`);
    const balSnap = await balRef.get();
    const bal = (balSnap.exists ? (balSnap.data() as any) : {}) || {};
    const needStars = payWith === 'stars' ? Math.ceil(rubN * (rates.starsPerRub || 2)) : 0;
    const needTon = payWith === 'ton' ? (rubN / (rates.ton || 350)) : 0;

    if (payWith === 'stars' && (Number(bal.stars || 0) < needStars)) {
      return NextResponse.json({ error: 'insufficient_stars' }, { status: 400 });
    }
    if (payWith === 'ton' && (Number(bal.ton || 0) < needTon)) {
      return NextResponse.json({ error: 'insufficient_ton' }, { status: 400 });
    }

    // create payment doc (pending, no deduction yet)
    const ref = adminDb.collection('payments').doc();
    const doc = {
      id: ref.id,
      type: 'sbp',
      status: 'pending', // pending -> confirmed/rejected
      user_id: String(userId),
      rub: rubN,
      pay_with: payWith,
      cost_stars: needStars,
      cost_ton: needTon,
      qr_url: qrUrl,
      comment: comment || '',
      created_at: Date.now(),
    };
    await ref.set(doc);

    // notify admins with photo
    const admins = (process.env.TELEGRAM_ADMIN_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
    const cap = [
      `🧾 Заявка на оплату СБП #${ref.id}`,
      `Пользователь: ${userId}`,
      `Сумма: ${rubN} ₽`,
      payWith === 'stars' ? `Списать: ${needStars}⭐` : `Списать: ${needTon.toFixed(4)} TON`,
      comment ? `Комментарий: ${comment}` : null,
      '',
      'Подтверди или отклони в админке.'
    ].filter(Boolean).join('\n');
    for (const a of admins) await sendPhoto(a, qrUrl, cap);

    return NextResponse.json({ ok: true, paymentId: ref.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'server_error' }, { status: 500 });
  }
}
