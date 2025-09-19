import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '../../../../lib/telegram';
import { getAdminDB } from '../../../../lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/me/balance[?refresh=1&debug=1]
 * Canonical: balances/<userId> { stars, ton }
 * Fallbacks: users/<id>/wallet/balances, users/<id>/кошелек/(остатки|балансы)
 * If canonical exists but is zeroed and ?refresh=1, we re-read fallbacks and overwrite.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const refresh = url.searchParams.get('refresh') === '1';
  const debug = url.searchParams.get('debug') === '1';

  const userId = String(getUserIdFromRequest(req as unknown as Request) || '');
  if (!userId) return NextResponse.json({ error: 'no_user' }, { status: 400 });

  const db = getAdminDB();
  const balRef = db.collection('balances').doc(userId);
  const snap = await balRef.get();

  const pickNum = (obj: any, keys: string[]) => {
    for (const k of keys) if (obj && typeof obj[k] === 'number') return Number(obj[k]);
    return 0;
  };

  // Helper to read from alternate locations
  const readFallback = async (): Promise<{stars:number, ton:number, src?:string} | null> => {
    // english path
    try {
      const en = await db.collection('users').doc(userId).collection('wallet').doc('balances').get();
      if (en.exists) {
        const d = en.data() as any;
        return { stars: pickNum(d, ['stars','звезды','звезд']), ton: pickNum(d, ['ton','тонна']), src: 'users/wallet/balances' };
      }
    } catch {}
    // russian paths
    try {
      for (const name of ['остатки','балансы']) {
        const ru = await db.collection('users').doc(userId).collection('кошелек').doc(name).get();
        if (ru.exists) {
          const d = ru.data() as any;
          return { stars: pickNum(d, ['stars','звезды','звезд']), ton: pickNum(d, ['ton','тонна']), src: `users/кошелек/${name}` };
        }
      }
    } catch {}
    return null;
  };

  // If canonical exists and not refresh, return it
  if (snap.exists && !refresh) {
    const d = snap.data() as any;
    const stars = Number(d?.stars ?? 0);
    const ton = Number(d?.ton ?? 0);
    // If it's non-zero, return immediately
    if (stars > 0 || ton > 0) return NextResponse.json({ stars, ton, source: 'balances' });
    // If zero but not refreshing, still try 1 quick fallback read once
    const fb = await readFallback();
    if (fb && (fb.stars > 0 || fb.ton > 0)) {
      await balRef.set({ stars: fb.stars, ton: fb.ton }, { merge: true });
      return NextResponse.json({ stars: fb.stars, ton: fb.ton, source: fb.src || 'fallback' });
    }
    return NextResponse.json({ stars, ton, source: debug ? 'balances_zero' : 'balances' });
  }

  // Canonical missing OR refresh requested → consolidate from fallbacks
  const fb = await readFallback();
  if (fb) {
    await balRef.set({ stars: fb.stars, ton: fb.ton }, { merge: true });
    return NextResponse.json({ stars: fb.stars, ton: fb.ton, source: fb.src || 'fallback' });
  }

  // Nothing anywhere → initialize
  await balRef.set({ stars: 0, ton: 0 }, { merge: true });
  return NextResponse.json({ stars: 0, ton: 0, source: 'created' });
}
