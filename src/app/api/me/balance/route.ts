import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '../../../../lib/telegram';
import { getAdminDB } from '../../../../lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STARS_PER_RUB = Number(process.env.STARS_PER_RUB || 2);
const TON_RATE_RUB = Number(process.env.TON_RATE_RUB || 350);

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
  const debug = url.searchParams.get('debug') === '1';

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

  let result = null as null | {stars:number, ton:number, source:string};
  if (!refresh) {
    const can = await readCanon();
    if (can) result = can;
  }
  if (!result || (result.stars === 0 && result.ton === 0)) {
    const fb = await readFallback();
    if (fb) {
      await canonical.set({ stars: fb.stars, ton: fb.ton }, { merge: true });
      result = fb;
    }
  }
  if (!result) {
    result = { stars: 0, ton: 0, source: 'created' };
    await canonical.set({ stars: 0, ton: 0 }, { merge: true });
  }

  const rubFromStars = result.stars / STARS_PER_RUB;
  const rubFromTon = result.ton * TON_RATE_RUB;
  const total_rub = Math.round((rubFromStars + rubFromTon) * 100) / 100;

  // также обновим users/<id>/wallet/balances зеркалом и total_rub
  try {
    await db.collection('users').doc(userId).collection('wallet').doc('balances').set(
      { stars: result.stars, ton: result.ton, total_rub },
      { merge: true }
    );
  } catch {}

  const payload:any = { uid: userId, stars: result.stars, ton: result.ton, total_rub };
  if (debug) payload.source = result.source;
  return NextResponse.json(payload);
}
