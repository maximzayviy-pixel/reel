import { adminDb, admin } from './firebaseAdmin';

export async function addBalance(userId: string, currency: 'stars' | 'ton', amount: number, note?: string) {
  if (!userId) throw new Error('userId required');
  if (!Number.isFinite(amount)) throw new Error('amount invalid');

  const userRef = adminDb.collection('users').doc(userId);
  const balRef = userRef.collection('wallet').doc('balances');
  const histRef = userRef.collection('history').doc();

  await adminDb.runTransaction(async (tx) => {
    const balSnap = await tx.get(balRef);
    const cur = balSnap.exists ? balSnap.data() as any : { stars: 0, ton: 0 };
    cur[currency] = (cur[currency] || 0) + amount;
    tx.set(balRef, cur, { merge: true });

    tx.set(histRef, {
      type: 'admin_credit',
      currency,
      amount,
      note: note || null,
      created_at_ms: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  });
}

export async function setBan(userId: string, banned: boolean) {
  const userRef = adminDb.collection('users').doc(userId);
  await userRef.set({ banned }, { merge: true });
}
