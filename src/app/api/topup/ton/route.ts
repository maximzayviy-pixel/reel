import { NextRequest, NextResponse } from 'next/server';
import { getAdminDB } from '../../../../lib/firebaseAdmin';

function getUserIdFromHeader(req: NextRequest): string | null {
  const init = req.headers.get('x-telegram-init-data') || '';
  try {
    const p = new URLSearchParams(init);
    const raw = p.get('user');
    const u = raw ? JSON.parse(raw) : null;
    return u?.id ? String(u.id) : null;
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  try {
    const { rub } = await req.json();
    if (!rub || rub <= 0) return NextResponse.json({ error: 'bad rub' }, { status: 400 });
    const userId = getUserIdFromHeader(req);
    if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const token = process.env.CRYPTOCLOUD_TOKEN;
    const shop = process.env.CRYPTOCLOUD_SHOP_ID;
    if (!token || !shop) return NextResponse.json({ error: 'no provider config' }, { status: 500 });

    const payload = {
      shop_id: shop,
      amount: rub,
      currency: "RUB",
      order_id: `${userId}-${Date.now()}`,
      description: `Reel Wallet topup by ${userId}`,
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
