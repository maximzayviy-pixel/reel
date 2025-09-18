'use client';
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';

export function useRealtimeBalance(userId?: string | number) {
  const [stars, setStars] = useState<number | null>(null);
  const [ton, setTon] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) return;
    const d = doc(db, `users/${userId}/wallet/balances`);
    const unsub = onSnapshot(d, (snap) => {
      const data = snap.data() || {};
      setStars(typeof data.stars === 'number' ? data.stars : 0);
      setTon(typeof data.ton === 'number' ? data.ton : 0);
    });
    return () => unsub();
  }, [userId]);

  const rub = stars != null ? Math.floor((stars as number) / 2) : null;
  return { stars, ton, rub };
}
