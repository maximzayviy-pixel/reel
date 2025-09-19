import { NextRequest, NextResponse } from 'next/server';
import { getAdminDB } from '../../../../../lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STARS_PER_RUB = Number(process.env.STARS_PER_RUB || 2);
const TON_RATE_RUB = Number(process.env.TON_RATE_RUB || 350);

async function notifyUser(tgId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !tgId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: tgId, text, parse_mode: 'HTML' }),
    });
  } catch {}
}

export async function POST(req: NextRequest) {
  const db = getAdminDB();
  const body = await req.json().catch(() => ({}));
  const id = String(body?.payment_id || body?.id || '');
  const currency = (String(body?.currency || 'stars') as 'stars'|'ton');

  if (!id) return NextResponse.json({ error: 'no_id' }, { status: 400 });

  const ref = db.collection('payments').doc(id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const p = snap.data() as any;
  if (p.status === 'paid') return NextResponse.json({ error: 'already_paid' }, { status: 400 });
  if (p.status === 'rejected') return NextResponse.json({ error: 'already_rejected' }, { status: 400 });

  const userId = String(p.user_id || '');
  if (!userId) return NextResponse.json({ error: 'no_user' }, { status: 400 });

  const costStars = Number(p.cost_stars ?? Math.ceil(Number(p.rub || 0) * STARS_PER_RUB));
  const costTon = Number(p.cost_ton ?? Number((Number(p.rub || 0) / TON_RATE_RUB).toFixed(6)));

  const balRef = db.collection('balances').doc(userId);
  const balSnap = await balRef.get();
  const current = (balSnap.exists ? balSnap.data() : {stars:0, ton:0}) as any;

  const newStars = currency === 'stars' ? Math.max(0, Number(current.stars || 0) - costStars) : Number(current.stars || 0);
  const newTon = currency === 'ton' ? Math.max(0, Number(current.ton || 0) - costTon) : Number(current.ton || 0);

  await balRef.set({ stars: newStars, ton: newTon }, { merge: true });

  await ref.set({ status: 'paid', paid_at: Date.now(), currency_used: currency }, { merge: true });

  // notify
  try {
    const userSnap = await db.collection('users').doc(userId).get();
    const tgId = String((userSnap.data() as any)?.tg_id || userId);
    const text = `✅ Платеж подтвержден. Списано: ${currency==='stars' ? `⭐ ${costStars}`: `TON ${costTon}`}\nСпасибо!`;
    await notifyUser(tgId, text);
  } catch {}

  return NextResponse.json({ ok: true, id, newStars, newTon });
}
