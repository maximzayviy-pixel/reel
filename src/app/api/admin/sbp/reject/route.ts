export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDB } from '../../../../../lib/firebaseAdmin';
import { isAdminRequest } from '../../../../../lib/telegram';
import { sendMessage } from '../../../../../lib/notify';

/**
 * Админ отклоняет СБП с причиной.
 * Body: { paymentId: string, reason?: string }
 */
export async function POST(req: NextRequest) {
  try {
    if (!isAdminRequest(req as unknown as Request)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    const { paymentId, reason } = await req.json();
    if (!paymentId) return NextResponse.json({ error: 'bad_payload' }, { status: 400 });

    const adminDb = getAdminDB();
    const payRef = adminDb.collection('payments').doc(String(paymentId));
    const snap = await payRef.get();
    if (!snap.exists) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    const pay = snap.data() as any;
    if (pay.status !== 'pending') return NextResponse.json({ error: 'already_processed' }, { status: 400 });

    await payRef.set({ status: 'rejected', admin_reason: reason || '', rejected_at: Date.now() }, { merge: true });

    if (pay?.user_id) {
      await sendMessage(String(pay.user_id), `❌ Оплата СБП #${paymentId} отклонена.${reason ? `\nПричина: ${reason}` : ''}`);
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'server_error' }, { status: 400 });
  }
}
