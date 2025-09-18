// src/hooks/useRealtimeBalance.ts
'use client';
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebaseClient';

export function useRealtimeBalance(userId?: string){
  const [stars, setStars] = useState<number | null>(null);
  const [ton, setTon] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) return;
    const ref = doc(db, 'users', userId, 'wallet', 'balances');
    const unsub = onSnapshot(ref, (snap) => {
      const d = snap.data() as any || {};
      setStars(typeof d.stars === 'number' ? d.stars : 0);
      setTon(typeof d.ton === 'number' ? d.ton : 0);
    }, () => {
      setStars(0); setTon(0);
    });
    return () => unsub();
  }, [userId]);

  const rub = typeof stars === 'number' ? stars / 2 : null; // 2⭐ = 1₽
  return { stars, ton, rub };
}
