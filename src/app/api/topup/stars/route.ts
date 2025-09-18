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

    const botToken = process.env.BOT_TOKEN as string;
    if (!botToken) return NextResponse.json({ ok: false, error: 'no_bot_token' }, { status: 500 });

    const resp = await fetch(`https://api.telegram.org/bot${botToken}/createInvoiceLink`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 'Reel Wallet: пополнение',
        description: `Пополнение баланса пользователя ${user.username || user.id}`,
        payload: `topup:${user.id}:${a}`,
        currency: 'XTR',
        prices: [{ label: 'Reel Wallet', amount: a }],
      })
    });
    const data = await resp.json();
    if (!data?.ok) {
      return NextResponse.json({ ok: false, error: data?.description || 'tg_error' }, { status: 500 });
    }
    return NextResponse.json({ ok: true, result: data.result });
  } catch (e: any) {
    const code = String(e?.message || '');
    if (code.startsWith('UNAUTHORIZED')) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}
