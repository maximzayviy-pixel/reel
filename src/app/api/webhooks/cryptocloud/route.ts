import { NextRequest, NextResponse } from 'next/server';
import { getAdminDB } from '../../../../lib/firebaseAdmin';

export async function POST(req: NextRequest) {
  // NOTE: for production, verify provider signature!
  const body = await req.json().catch(()=>null);
  try {
    const adminDb = getAdminDB();
    const uuid = body?.uuid;
    const status = body?.status;
    if (!uuid) return NextResponse.json({ ok: true }); // ignore

    const topupRef = adminDb.collection('topups').doc(uuid);
    const snap = await topupRef.get();
    if (!snap.exists) return NextResponse.json({ ok: true });

    const t = snap.data()!;
    if (t.status === 'paid') return NextResponse.json({ ok: true });

    if (String(status).toLowerCase() === 'paid') {
      // credit TON balance by approximate RUB/TON via last known rate (or provider's ton amount if present)
      const userRef = adminDb.collection('users').doc(t.user_id);
      await adminDb.runTransaction(async (tx) => {
        const u = await tx.get(userRef);
        const balances = u.exists ? (u.data()!.balances || { stars: 0, ton: 0 }) : { stars: 0, ton: 0 };
        // If body.ton_amount provided by provider, prefer it. Else just note RUB topup marker.
        const tonAmount = body?.amount_crypto ? Number(body.amount_crypto) : 0;
        balances.ton = (balances.ton || 0) + tonAmount;
        if (u.exists) tx.update(userRef, { balances });
        else tx.set(userRef, { balances, created_at_ms: Date.now(), tg_id: t.user_id });
        tx.update(topupRef, { status: 'paid', updated_at_ms: Date.now(), ton_credited: tonAmount });
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ ok: true });
  }
}
