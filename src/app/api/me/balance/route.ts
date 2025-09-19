// /api/me/balance — читает баланс по Telegram ID и не кэшируется на билде
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDB } from '../../../../lib/firebaseAdmin';
import { getUserIdFromRequest } from '../../../../lib/telegram';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Balances = { stars?: number; ton?: number; rub?: number; total_rub?: number };

function toNumber(x: any, def = 0): number {
  if (x == null) return def;
  const n = Number(x);
  return Number.isFinite(n) ? n : def;
}

// Универсальный парсер под разные старые структуры документа
function readBalances(doc: any): Balances {
  if (!doc || typeof doc !== 'object') return { stars: 0, ton: 0, total_rub: 0 };
  const b = (doc.balances && typeof doc.balances === 'object') ? doc.balances : doc;
  const stars = toNumber(b.stars, 0);
  const ton = toNumber(b.ton, 0);
  const rub = toNumber(b.total_rub != null ? b.total_rub : b.rub, 0);
  return { stars, ton, total_rub: rub };
}

export async function GET(req: NextRequest) {
  try {
    const db = getAdminDB();
    const uidNum = getUserIdFromRequest(req as unknown as Request);
    if (!uidNum) {
      return NextResponse.json({ error: 'no_user' }, { status: 401 });
    }
    const uid = String(uidNum);

    const ref = db.collection('users').doc(uid);
    const snap = await ref.get();
    if (!snap.exists) {
      await ref.set({ balances: { stars: 0, ton: 0, rub: 0 }, createdAt: Date.now() }, { merge: true });
      return NextResponse.json({ uid, stars: 0, ton: 0, total_rub: 0 }, { headers: { 'cache-control': 'no-store' } });
    }

    const data = snap.data() || {};
    const balances = readBalances(data);
    const res = { uid, stars: balances.stars || 0, ton: balances.ton || 0, total_rub: balances.total_rub || 0 };

    return NextResponse.json(res, { headers: { 'cache-control': 'no-store' } });
  } catch (e: any) {
    console.error('balance GET error:', e?.message || e);
    return NextResponse.json({ error: 'balance_failed' }, { status: 500 });
  }
}
