import { NextRequest, NextResponse } from 'next/server';
import { getAdminDB } from '../../../../lib/firebaseAdmin';
import { getUserIdFromRequest } from '../../../../lib/telegram';

export async function POST(req: NextRequest) {
  try {
    const { rub } = await req.json();
    if (!rub || rub <= 0) return NextResponse.json({ error: 'bad rub' }, { status: 400 });
    const userId = getUserIdFromRequest(req as unknown as Request);

    const token = process.env.CRYPTOCLOUD_TOKEN;
    const shop = process.env.CRYPTOCLOUD_SHOP_ID;
    if (!token || !shop) return NextResponse.json({ error: 'no provider config' }, { status: 500 });

    const payload = {
      shop_id: shop,
      amount: rub,
      currency: "RUB",
      order_id: `${userId}-${Date.now()}`,
      description: `Reel Wallet topup by ${userId}`,
      // If provider supports TON directly, add 'payer_currency': 'TON' (or specific field per docs)
    };

    const res = await fetch('https://api.cryptocloud.plus/v2/invoice/create', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const j = await res.json();
    if (!res.ok || !j?.result) {
      return NextResponse.json({ error: j?.error || 'provider error' }, { status: 502 });
    }

    // Save pending topup (so webhook can match)
    const adminDb = getAdminDB();
    await adminDb.collection('topups').doc(j.result.uuid).set({
      provider: 'cryptocloud',
      user_id: userId,
      rub,
      status: 'pending',
      created_at_ms: Date.now()
    });

    return NextResponse.json({ pay_url: j.result.link, invoice_id: j.result.uuid });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'internal' }, { status: 500 });
  }
}
