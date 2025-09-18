import { NextRequest, NextResponse } from 'next/server';
import { getAdminDB } from '../../../lib/firebaseAdmin';
import { getUserIdFromRequest } from '../../../lib/telegram';
import { sendMessage } from '../../../lib/notify';

// Dummy rate provider: stars (2⭐=1₽), TON fetched from cache (assume env TON_RATE_RUB or 350)
const TON_RATE_RUB = Number(process.env.TON_RATE_RUB || 350);
const STARS_PER_RUB = 2;

export async function POST(req: NextRequest) {
  try {
    const { rub, sbpUrl } = await req.json();
    const userId = getUserIdFromRequest(req as unknown as Request);
    if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const R = Number(rub || 0);
    if (!R || !sbpUrl) return NextResponse.json({ error: 'bad payload' }, { status: 400 });

    const stars = Math.ceil(R * STARS_PER_RUB);
    const ton = R / TON_RATE_RUB * 1.15; // +15% markup

    const adminDb = getAdminDB();
    const ref = adminDb.collection('quotes').doc();
    const data = {
      user_id: userId,
      rub: R,
      stars,
      ton,
      status: 'active',
      expires_at_ms: Date.now() + 10 * 60 * 1000,
      created_at_ms: Date.now(),
      sbp_url: sbpUrl,
    };
    await ref.set(data);

    // Notify admins right away with the SBP link
    const admins = (process.env.TELEGRAM_ADMIN_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
    const text = `🆕 Запрос оплаты по СБП\nRUB: ${R}\n⭐: ${stars}\nTON: ${ton.toFixed(4)}\nСсылка: ${sbpUrl}`;
    for (const a of admins) sendMessage(a, text);

    return NextResponse.json({ id: ref.id, ...data });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'internal' }, { status: 500 });
  }
}