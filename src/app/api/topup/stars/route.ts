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
    const { stars } = await req.json();
    const userId = getUserId(req);
    if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    if (!stars || stars <= 0) return NextResponse.json({ error: 'bad stars' }, { status: 400 });

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return NextResponse.json({ error: 'no bot token' }, { status: 500 });

    // For Stars, use currency XTR and amount in "stars units". Telegram handles conversion.
    const payload = {
      title: "Reel Wallet: пополнение",
      description: `Пополнение баланса на ${stars} ⭐`,
      payload: `stars:${userId}:${Date.now()}`,
      currency: "XTR",
      prices: [{ label: "Stars", amount: Math.round(stars) }],
    };

    const res = await fetch(`https://api.telegram.org/bot${token}/createInvoiceLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const j = await res.json();
    log('createInvoiceLink', j);
    if (!j?.ok) return NextResponse.json({ error: j?.description || 'telegram error' }, { status: 502 });

    return NextResponse.json({ link: j.result, payload: payload.payload });
  } catch (e:any) {
    log('stars error', e?.message);
    return NextResponse.json({ error: e?.message || 'internal' }, { status: 500 });
  }
}