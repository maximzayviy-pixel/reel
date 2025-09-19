import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '../../../../lib/telegram';
import { getAdminDB } from '../../../../lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/me/balance
 * Supports multiple Firestore layouts:
 *  A) balances/<userId>                 -> { stars, ton }
 *  B) users/<userId>/wallet/balances    -> { stars, ton }
 *  C) users/<userId>/кошелек/остатки    -> { 'звезд'|'звезды'|'stars', 'тонна'|'ton' }
 *  D) users/<userId>/кошелек/балансы    -> same as (C)
 * If found in (B|C|D), the value is mirrored into (A) for faster subsequent reads.
 */
export async function GET(req: NextRequest) {
  const userId = String(getUserIdFromRequest(req as unknown as Request) || '');
  if (!userId) return NextResponse.json({ error: 'no_user' }, { status: 400 });

  const db = getAdminDB();

  const balRef = db.collection('balances').doc(userId);
  const snap = await balRef.get();
  if (snap.exists) {
    const d = snap.data() as any;
    return NextResponse.json({ stars: Number(d?.stars || 0), ton: Number(d?.ton || 0), source: 'balances' });
  }

  const pickNum = (obj: any, keys: string[]) => {
    for (const k of keys) if (obj && typeof obj[k] === 'number') return Number(obj[k]);
    return 0;
  };

  // B) users/<id>/wallet/balances
  try {
    const enDoc = await db.collection('users').doc(userId).collection('wallet').doc('balances').get();
    if (enDoc.exists) {
      const d = enDoc.data() as any;
      const stars = pickNum(d, ['stars', 'звезды', 'звезд']) || 0;
      const ton = pickNum(d, ['ton', 'тонна']) || 0;
      await balRef.set({ stars, ton }, { merge: true });
      return NextResponse.json({ stars, ton, source: 'users/wallet/balances' });
    }
  } catch {}

  // C/D) users/<id>/кошелек/(остатки|балансы)
  try {
    const ruDocNames = ['остатки', 'балансы'];
    for (const name of ruDocNames) {
      const ruDoc = await db.collection('users').doc(userId).collection('кошелек').doc(name).get();
      if (ruDoc.exists) {
        const d = ruDoc.data() as any;
        const stars = pickNum(d, ['stars', 'звезды', 'звезд']) || 0;
        const ton = pickNum(d, ['ton', 'тонна']) || 0;
        await balRef.set({ stars, ton }, { merge: true });
        return NextResponse.json({ stars, ton, source: `users/кошелек/${name}` });
      }
    }
  } catch {}

  // Ensure canonical exists to unblock UI
  await balRef.set({ stars: 0, ton: 0 }, { merge: true });
  return NextResponse.json({ stars: 0, ton: 0, source: 'created' });
}
