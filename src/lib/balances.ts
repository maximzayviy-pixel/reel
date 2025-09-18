import { adminDb } from './firebaseAdmin';

// транзакции баланса и холдов
export async function reserveBalance(userId: string, currency: string, amount: number) {
  return adminDb.runTransaction(async (tx) => {
    const userRef = adminDb.collection('users').doc(userId);
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) throw new Error('User not found');
    const data = userSnap.data()!;
    const bal = data.balances?.[currency] || 0;
    if (bal < amount) throw new Error('Insufficient balance');
    tx.update(userRef, { [`balances.${currency}`]: bal - amount });
    return true;
  });
}

export async function releaseBalance(userId: string, currency: string, amount: number) {
  return adminDb.runTransaction(async (tx) => {
    const userRef = adminDb.collection('users').doc(userId);
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) throw new Error('User not found');
    const data = userSnap.data()!;
    const bal = data.balances?.[currency] || 0;
    tx.update(userRef, { [`balances.${currency}`]: bal + amount });
    return true;
  });
}
