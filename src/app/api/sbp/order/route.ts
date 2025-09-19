import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '../../../lib/telegram';
import { getAdminDB } from '../../../lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parseNspkSum(qrUrl: string): number | null {
  try {
    const url = new URL(qrUrl);
    const raw = url.searchParams.get('sum');
    if (!raw) return null;
    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    // NSPK 'sum' передаётся в копейках => рубли = /100
    return Math.round(n) / 100;
  } catch {
    return null;
  }
}

async function notifyAdmins(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const ids = (process.env.TELEGRAM_ADMIN_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!token || ids.length === 0) return;
  for (const id of ids) {
    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: id, text, parse_mode: 'HTML', disable_web_page_preview: false }),
      });
    } catch {}
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = String(getUserIdFromRequest(req as unknown as Request) || '');
    if (!userId) return NextResponse.json({ error: 'no_user' }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const qrUrl = String(body?.qrUrl || body?.link || '');
    const comment = typeof body?.comment === 'string' ? body.comment : undefined;
    if (!qrUrl) return NextResponse.json({ error: 'no_qr' }, { status: 400 });

    const rub = parseNspkSum(qrUrl);
    if (rub === null) return NextResponse.json({ error: 'bad_qr_sum' }, { status: 400 });

    const starsPerRub = Number(process.env.STARS_PER_RUB || 2);
    const tonRateRub = Number(process.env.TON_RATE_RUB || 350);

    const cost_stars = Math.ceil(rub * starsPerRub);
    const cost_ton = Number((rub / tonRateRub).toFixed(6));

    const db = getAdminDB();
    const ref = await db.collection('payments').add({
      user_id: userId,
      method: 'sbp',
      status: 'pending',
      rub,
      cost_stars,
      cost_ton,
      qr_url: qrUrl,
      comment: comment || null,
      created_at: Date.now(),
    });

    const text = [
      `<b>Новая заявка СБП</b>`,
      `id: <code>${ref.id}</code>`,
      `user: <code>${userId}</code>`,
      `Сумма: <b>${rub} ₽</b>`,
      `⭐ к списанию: <b>${cost_stars}</b>`,
      `TON к списанию: <b>${cost_ton}</b>`,
      comment ? `Комментарий: ${comment}` : null,
      ``,
      `Ссылка СБП:`,
      qrUrl,
    ].filter(Boolean).join('\n');

    await notifyAdmins(text);

    return NextResponse.json({ ok: true, id: ref.id, rub, cost_stars, cost_ton });
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
