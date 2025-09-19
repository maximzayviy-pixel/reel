import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebaseAdmin';
import { getUserIdFromRequest } from '../../../../lib/telegram';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const userIdNum = getUserIdFromRequest(req as unknown as Request);
  if (!userIdNum) {
    return NextResponse.json({ error: 'no_user' }, { status: 400 });
  }
  const userId = String(userIdNum); // <-- doc id in Firestore must be string

  const body = await req.json().catch(() => ({}));
  const choice = body?.choice;

  const result = await adminDb.runTransaction(async (tx) => {
    const userRef = adminDb.collection('users').doc(userId); // fixed: string id
    const userSnap = await tx.get(userRef);
    const balances = userSnap.exists ? (userSnap.data()!.balances || { stars: 0, ton: 0 }) : { stars: 0, ton: 0 };
    if (userSnap.exists && userSnap.data()?.banned) throw new Error('Пользователь забанен');

    // пример изменения поля "choice" у пользователя
    tx.set(userRef, { choice }, { merge: true });

    return { ok: true, balances };
  });

  return NextResponse.json(result);
}
