import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';

type BalancesDoc = { stars?: number; ton?: number };

export function useRealtimeBalance(userId?: string) {
  const [stars, setStars] = useState<number>(0);
  const [ton, setTon] = useState<number>(0);

  useEffect(() => {
    if (!userId) return;
    const ref = doc(db, 'users', userId, 'wallet', 'balances');
    const unsub = onSnapshot(ref, (snap) => {
      const d = (snap.data() || {}) as BalancesDoc;
      setStars(d.stars || 0);
      setTon(d.ton || 0);
    });
    return () => unsub();
  }, [userId]);

  const rub = stars / 2;
  return { stars, ton, rub };
}
