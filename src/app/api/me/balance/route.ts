import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '../../../../lib/telegram';
import { getAdminDB } from '../../../../lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function toNum(val: any): number {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string') {
    const n = Number(val.replace(',', '.'));
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const refresh = url.searchParams.get('refresh') === '1' || url.searchParams.get('force') === '1';

  const userId = String(getUserIdFromRequest(req as unknown as Request) || '');
  if (!userId) return NextResponse.json({ error: 'no_user' }, { status: 400 });

  const db = getAdminDB();
  const canonical = db.collection('balances').doc(userId);

  const readCanon = async () => {
    const s = await canonical.get();
    if (!s.exists) return null as any;
    const d = s.data() as any;
    return { stars: toNum(d?.stars), ton: toNum(d?.ton), source: 'balances' };
  };

  const readFallback = async () => {
    // EN path
    try {
      const s = await db.collection('users').doc(userId).collection('wallet').doc('balances').get();
      if (s.exists) {
        const d = s.data() as any;
        return { stars: toNum(d?.stars ?? d?.['звезды'] ?? d?.['звезд']), ton: toNum(d?.ton ?? d?.['тонна']), source: 'users/wallet/balances' };
      }
    } catch {}
    // RU paths
    for (const name of ['остатки','балансы']) {
      try {
        const s = await db.collection('users').doc(userId).collection('кошелек').doc(name).get();
        if (s.exists) {
          const d = s.data() as any;
          return { stars: toNum(d?.stars ?? d?.['звезды'] ?? d?.['звезд']), ton: toNum(d?.ton ?? d?.['тонна']), source: `users/кошелек/${name}` };
        }
      } catch {}
    }
    return null;
  };

  // Read canonical first (unless force refresh)
  if (!refresh) {
    const can = await readCanon();
    if (can && (can.stars > 0 || can.ton > 0)) {
      return NextResponse.json({ uid: userId, ...can });
    }
  }

  // Fallbacks
  const fb = await readFallback();
  if (fb) {
    await canonical.set({ stars: fb.stars, ton: fb.ton }, { merge: true });
    return NextResponse.json({ uid: userId, ...fb });
  }

  // Canonical exists but zero or nothing found → zero init
  await canonical.set({ stars: 0, ton: 0 }, { merge: true });
  return NextResponse.json({ uid: userId, stars: 0, ton: 0, source: 'created' });
}
