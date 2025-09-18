import { NextRequest, NextResponse } from 'next/server';
import { log } from '../../../../lib/logger';

function getUserId(req: NextRequest): string | null {
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
    const userId = getUserId(req);
    if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    if (!rub || rub <= 0) return NextResponse.json({ error: 'bad rub' }, { status: 400 });

    const token = process.env.CRYPTOCLOUD_TOKEN;
    const shop = process.env.CRYPTOCLOUD_SHOP_ID;
    if (!token || !shop) {
      return NextResponse.json({ error: 'CryptoCloud not configured: set CRYPTOCLOUD_TOKEN and CRYPTOCLOUD_SHOP_ID' }, { status: 500 });
    }

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
    log('cryptocloud create', j);
    if (!res.ok || !j?.result) {
      return NextResponse.json({ error: j?.error || 'provider error' }, { status: 502 });
    }

    return NextResponse.json({ pay_url: j.result.link, invoice_id: j.result.uuid });
  } catch (e:any) {
    log('ton error', e?.message);
    return NextResponse.json({ error: e?.message || 'internal' }, { status: 500 });
  }
}