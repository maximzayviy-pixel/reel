// src/hooks/useRealtimeBalance.ts
'use client';

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

export function useRealtimeBalance(userId?: string) {
  const [stars, setStars] = useState<number>(0);

  useEffect(() => {
    if (!userId) return;
    const ref = doc(db, 'users', userId, 'wallet', 'balances');
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) setStars((snap.data() as any).stars || 0);
    });
    return () => unsub();
  }, [userId]);

  return { stars, rub: stars / 2 };
}
