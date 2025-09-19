import { NextRequest, NextResponse } from 'next/server';
import { getAdminDB } from '../../../../../lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
  const reason = String(body?.reason || 'Без причины');

  if (!id) return NextResponse.json({ error: 'no_id' }, { status: 400 });

  const ref = db.collection('payments').doc(id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const p = snap.data() as any;
  if (p.status === 'paid') return NextResponse.json({ error: 'already_paid' }, { status: 400 });
  if (p.status === 'rejected') return NextResponse.json({ error: 'already_rejected' }, { status: 400 });

  await ref.set({ status: 'rejected', rejected_at: Date.now(), reason }, { merge: true });

  try {
    const userId = String(p.user_id || '');
    const userSnap = await db.collection('users').doc(userId).get();
    const tgId = String((userSnap.data() as any)?.tg_id || userId);
    await notifyUser(tgId, `❌ Платеж отклонен. Причина: ${reason}`);
  } catch {}

  return NextResponse.json({ ok: true, id });
}
