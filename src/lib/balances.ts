import { getAdminDB } from './firebaseAdmin';

/**
 * Транзакции баланса и холдов через Firestore Admin (ленивая инициализация).
 * Все операции выполняются в runTransaction.
 */

export async function reserveBalance(userId: string, currency: 'stars'|'ton', amount: number) {
  const adminDb = getAdminDB();
  return adminDb.runTransaction(async (tx) => {
    const userRef = adminDb.collection('users').doc(userId);
    const userSnap = await tx.get(userRef);
    const balances = userSnap.exists ? (userSnap.data()!.balances || { stars: 0, ton: 0 }) : { stars: 0, ton: 0 };
    const bal = balances[currency] || 0;
    if (bal < amount) throw new Error('Недостаточно средств на балансе');
    const newBal = { ...balances, [currency]: bal - amount };

    if (userSnap.exists) tx.update(userRef, { balances: newBal });
    else tx.set(userRef, { balances: newBal, created_at_ms: Date.now(), tg_id: userId });

    const holdRef = adminDb.collection('holds').doc();
    tx.set(holdRef, {
      user_id: userId, currency, amount,
      status: 'active', created_at_ms: Date.now()
    });

    return { holdId: holdRef.id };
  });
}

export async function captureHold(paymentId: string) {
  const adminDb = getAdminDB();
  return adminDb.runTransaction(async (tx) => {
    const pref = adminDb.collection('payments').doc(paymentId);
    const p = await tx.get(pref);
    if (!p.exists) throw new Error('not found');
    const pd = p.data()!;
    if (pd.status !== 'pending') return { ok: true };
    const holdRef = adminDb.collection('holds').doc(pd.hold_id);
    const holdSnap = await tx.get(holdRef);
    if (!holdSnap.exists) throw new Error('hold not found');
    tx.update(holdRef, { status: 'captured' });
    tx.update(pref, { status: 'paid', updated_at_ms: Date.now() });
    return { ok: true, user_id: pd.user_id, rub: pd.rub };
  });
}

export async function releaseHold(paymentId: string) {
  const adminDb = getAdminDB();
  return adminDb.runTransaction(async (tx) => {
    const pref = adminDb.collection('payments').doc(paymentId);
    const p = await tx.get(pref);
    if (!p.exists) throw new Error('not found');
    const pd = p.data()!;
    if (pd.status !== 'pending') return { ok: true };
    const holdRef = adminDb.collection('holds').doc(pd.hold_id);
    const holdSnap = await tx.get(holdRef);
    if (!holdSnap.exists) throw new Error('hold not found');
    const hold = holdSnap.data()!;

    const userRef = adminDb.collection('users').doc(pd.user_id);
    const userSnap = await tx.get(userRef);
    const balances = userSnap.exists ? (userSnap.data()!.balances || { stars: 0, ton: 0 }) : { stars: 0, ton: 0 };
    const cur = hold.currency as 'stars'|'ton';
    balances[cur] = (balances[cur] || 0) + hold.amount;
    if (userSnap.exists) tx.update(userRef, { balances });
    else tx.set(userRef, { balances, created_at_ms: Date.now(), tg_id: pd.user_id });

    tx.update(holdRef, { status: 'released' });
    tx.update(pref, { status: 'rejected', updated_at_ms: Date.now() });
    return { ok: true, user_id: pd.user_id, rub: pd.rub };
  });
}
