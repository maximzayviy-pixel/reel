import { NextRequest, NextResponse } from 'next/server';
import { getAdminDB } from '../../../../lib/firebaseAdmin';
import { getUserIdFromRequest } from '../../../../lib/telegram';
import { sendMessage, sendPhoto } from '../../../../lib/notify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Body: { payment_id?: string, qrUrl?: string, photo?: string, caption?: string }
 * Stores proof on payment and forwards QR/photo to admins
 */
export async function POST(req: NextRequest) {
  const userId = String(getUserIdFromRequest(req as unknown as Request) || '');
  if (!userId) return NextResponse.json({ error: 'no_user' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const paymentId = String(body?.payment_id || '');
  const photoUrl = String(body?.photo || body?.qrUrl || '');
  const caption = typeof body?.caption === 'string' ? body.caption : undefined;
  if (!paymentId || !photoUrl) return NextResponse.json({ error: 'bad_body' }, { status: 400 });

  const db = getAdminDB();
  const ref = db.collection('payments').doc(paymentId);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  await ref.set({ proof_photo: photoUrl, proof_caption: caption || null, proof_at: Date.now() }, { merge: true });

  const ids = (process.env.TELEGRAM_ADMIN_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
  const head = `<b>Доказательство оплаты</b>\nПлатеж: <code>${paymentId}</code>\nОт: <code>${userId}</code>`;
  await Promise.all(ids.map(id => sendPhoto(id, photoUrl, caption ? head + '\n\n' + caption : head)));

  return NextResponse.json({ ok: true });
}
