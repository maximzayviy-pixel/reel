export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDB } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    // Only care about successful payments
    const sp = update?.message?.successful_payment;
    if (sp && update?.message?.from?.id) {
      const tgId = String(update.message.from.id);
      // For Stars (currency XTR), total_amount is paid stars (integer)
      const paidStars = Number(sp.total_amount || 0);

      const db = getAdminDB();
      const ref = db.doc(`users/${tgId}/wallet/balances`);
      await db.runTransaction(async (tr) => {
        const snap = await tr.get(ref);
        const cur = snap.exists ? snap.data() : {};
        const next = {
          stars: (cur?.stars || 0) + paidStars,
          ton: (cur?.ton || 0),
        };
        tr.set(ref, next, { merge: true });
        const hist = db.collection(`users/${tgId}/wallet/history`).doc();
        tr.set(hist, {
          type: 'topup_stars',
          stars: paidStars,
          created_at_ms: Date.now(),
        });
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'webhook_error' }, { status: 200 });
  }
}

export async function GET() {
  // Simple health check
  return NextResponse.json({ ok: true });
}
