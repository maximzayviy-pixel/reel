import { NextRequest, NextResponse } from 'next/server';
import { getAdminDB } from '../../../../lib/firebaseAdmin';
import { getUserIdFromRequest } from '../../../../lib/telegram';

export async function POST(req: NextRequest) {
  try {
    const { stars } = await req.json();
    if (!stars || stars <= 0) return NextResponse.json({ error: 'bad stars' }, { status: 400 });
    const userId = getUserIdFromRequest(req as unknown as Request);
    const token = process.env.TELEGRAM_BOT_TOKEN!;
    const mult = Number(process.env.STARS_PRICE_MULTIPLIER || 1);

    const payload = {
      title: "Reel Wallet Topup",
      description: `Пополнение на ${stars} ⭐`,
      payload: `topup-stars-${userId}-${Date.now()}`,
      currency: "XTR",
      prices: [{ label: "Stars", amount: Math.round(stars * mult) }],
      // optional: provider_data, start_parameter, photo_url, etc.
    };

    const res = await fetch(`https://api.telegram.org/bot${token}/createInvoiceLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const j = await res.json();
    if (!j?.ok) return NextResponse.json({ error: j?.description || 'bot error' }, { status: 502 });
    const link = j.result;

    // Save pending topup record
    const adminDb = getAdminDB();
    await adminDb.collection('topups').doc(payload.payload).set({
      provider: 'telegram-stars',
      user_id: userId,
      stars,
      status: 'pending',
      created_at_ms: Date.now()
    });

    return NextResponse.json({ invoice_link: link, invoice_payload: payload.payload });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'internal' }, { status: 500 });
  }
}
