import { NextRequest, NextResponse } from 'next/server';
import { getAdminDB } from '../';
import { getUserIdFromRequest } from '../';
import { sendMessage, sendPhoto } from '../';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * User submits payment proof (QR/photo URL) for a pending SBP payment.
 * Body: { paymentId: string, photoUrl: string, comment?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { paymentId, photoUrl, comment } = await req.json();
    const userId = getUserIdFromRequest(req as unknown as Request);
    if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    if (!paymentId || !photoUrl) return NextResponse.json({ error: 'bad payload' }, { status: 400 });

    const adminDb = getAdminDB();
    const ref = adminDb.collection('payments').doc(String(paymentId));
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: 'not found' }, { status: 404 });
    const pay = snap.data() as any;
    if (String(pay.user_id) !== String(userId)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    if (pay.status !== 'pending') return NextResponse.json({ error: 'already processed' }, { status: 400 });

    await ref.set({
      proof_url: photoUrl,
      proof_comment: comment || '',
      proof_submitted_by: String(userId),
      proof_submitted_at: Date.now(),
    }, { merge: true });

    // Notify admins with the photo
    const admins = (process.env.TELEGRAM_ADMIN_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
    const caption = [
      `🧾 Доказательство по платежу #${paymentId}`,
      `Пользователь: ${userId}`,
      pay?.rub ? `Сумма: ${pay.rub} ₽` : null,
      comment ? `Комментарий: ${comment}` : null,
      '',
      'Действия: подтвердить или отклонить в админке.',
    ].filter(Boolean).join('\n');
    for (const a of admins) {
      await sendPhoto(a, photoUrl, caption);
    }

    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'internal' }, { status: 500 });
  }
}
