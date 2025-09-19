import { NextRequest, NextResponse } from 'next/server';
import { getAdminDB } from '../../../../../lib/firebaseAdmin';
import { getUserIdFromRequest } from '../../../../../lib/telegram';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Bal = { stars: number; ton: number; total_rub?: number };

function num(x: any, d = 0): number {
  const n = Number(x);
  return Number.isFinite(n) ? n : d;
}

async function readFromPaths(db: FirebaseFirestore.Firestore, tgid: string) {
  // canonical en
  const a = await db.doc(`users/${tgid}/wallet/balances`).get();
  if (a.exists) return a.data() as any;

  // ru variants
  const b = await db.doc(`users/${tgid}/кошелек/балансы`).get().catch(() => null);
  if (b && b.exists) return b.data() as any;

  const c = await db.doc(`users/${tgid}/кошелек/остатки`).get().catch(() => null);
  if (c && c.exists) return c.data() as any;

  const d = await db.doc(`users/${tgid}/кошелек/ост` ).get().catch(() => null);
  if (d && d.exists) return d.data() as any;

  return null;
}

export async function GET(req: NextRequest) {
  // Берём именно telegram id из initData
  const tgid = String(getUserIdFromRequest(req as unknown as Request) || '');
  if (!tgid) return NextResponse.json({ error: 'no_telegram_initdata' }, { status: 400 });

  const db = getAdminDB();
  const url = new URL(req.url);
  const refresh = url.searchParams.get('refresh') === '1' || url.searchParams.get('refresh') === 'true';

  let data: any = null;
  if (refresh) {
    data = await readFromPaths(db, tgid);
  }

  // Если не попросили refresh — сначала смотрим кэш в canonical balances/<tgid>
  if (!data) {
    const cached = await db.doc(`balances/${tgid}`).get();
    data = cached.exists ? cached.data() : null;
    if (!data) {
      // если кэша нет — ищем в юзерских путях
      data = await readFromPaths(db, tgid);
    }
  }

  const stars = num(data?.stars, 0);
  const ton = num(data?.ton, 0);

  const starsPerRub = num(process.env.STARS_PER_RUB, 2);
  const tonRateRub = num(process.env.TON_RATE_RUB, 350);
  const total_rub = Math.round((stars / starsPerRub + ton * tonRateRub) * 100) / 100;

  const payload: Bal & { uid: string } = { uid: tgid, stars, ton, total_rub };

  // зеркало в canonical balances/<tgid>
  await db.doc(`balances/${tgid}`).set(payload, { merge: true });

  return NextResponse.json(payload, {
    headers: {
      // чтобы мини-апп не кэшировало
      'Cache-Control': 'no-store',
    },
  });
}
