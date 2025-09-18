import { NextRequest, NextResponse } from 'next/server';
import { requireUserFromRequest } from '@/lib/tg';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = requireUserFromRequest(req);
    const { amount } = await req.json();
    const a = Number(amount);
    if (!Number.isFinite(a) || a < 1) {
      return NextResponse.json({ ok: false, error: 'bad_amount' }, { status: 400 });
    }

    const botToken = (process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN) as string;
    if (!botToken) return NextResponse.json({ ok: false, error: 'no_bot_token' }, { status: 500 });

    // Stars (XTR) usually expect minor units; multiply by 100 just in case.
    const units = Math.round(a * 100);

    const resp = await fetch(`https://api.telegram.org/bot${botToken}/createInvoiceLink`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 'Reel Wallet: пополнение',
        description: `Пополнение баланса пользователя ${user.username || user.id}`,
        payload: `topup:${user.id}:${a}`,
        currency: 'XTR',
        prices: [{ label: 'Reel Wallet', amount: units }],
      })
    });

    const text = await resp.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = null; }

    if (!resp.ok || !data?.ok) {
      const err = data?.description || text || `http_${resp.status}`;
      return NextResponse.json({ ok: false, error: err }, { status: 500 });
    }

    return NextResponse.json({ ok: true, link: data.result });
  } catch (e: any) {
    const msg = String(e?.message || e);
    if (msg.startsWith('UNAUTHORIZED')) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: msg || 'server_error' }, { status: 500 });
  }
}
