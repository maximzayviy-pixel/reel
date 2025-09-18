import { getAdminDB, admin } from './firebaseAdmin';

/** Add or subtract balance with history record */
export async function addBalance(
  userId: string,
  currency: 'stars' | 'ton',
  amount: number,
  note?: string,
) {
  if (!userId) throw new Error('userId required');
  const db = getAdminDB();
  const balRef = db.doc(`users/${userId}/wallet/balances`);
  const histRef = db.collection(`users/${userId}/history`).doc();

  await db.runTransaction(async (t) => {
    const snap = await t.get(balRef);
    const cur = (snap.exists ? snap.data()?.[currency] : 0) ?? 0;
    t.set(balRef, { [currency]: cur + amount }, { merge: true });
    t.set(histRef, {
      type: `admin_${amount >= 0 ? 'credit' : 'debit'}`,
      currency,
      amount,
      rub: currency === 'stars' ? amount / 2 : undefined,
      note: note ?? null,
      created_at_ms: Date.now(),
      _by: 'admin',
    });
  });
}

export async function setVerified(userId: string, value: boolean) {
  const db = getAdminDB();
  await db.doc(`users/${userId}`).set({ verified: value, updated_at_ms: Date.now() }, { merge: true });
}

export async function setBanned(userId: string, value: boolean) {
  const db = getAdminDB();
  await db.doc(`users/${userId}`).set({ banned: value, updated_at_ms: Date.now() }, { merge: true });
}

/** Shorthand expected by your API routes (compat layer) */
export const setBan = setBanned;
export const setVerify = setVerified;

/** Optional helper for atomic increments */
export async function adjustBalance(
  userId: string,
  currency: 'stars' | 'ton',
  delta: number
) {
  const db = getAdminDB();
  const balRef = db.doc(`users/${userId}/wallet/balances`);
  await balRef.set(
    { [currency]: admin.firestore.FieldValue.increment(delta) },
    { merge: true }
  );
}
