// src/hooks/useRealtimeBalance.ts
'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebaseClient";

type Balance = { stars: number; ton?: number };

export function useRealtimeBalance(userId?: string) {
  const [stars, setStars] = useState<number>(0);
  const [ton, setTon] = useState<number>(0);
  const started = useRef(false);

  // 1) Реалтайм из Firestore
  useEffect(() => {
    if (!userId) return;
    const ref = doc(db, 'users', String(userId), 'wallet', 'balances');
    const unsub = onSnapshot(ref, (snap) => {
      const data = (snap.exists() ? (snap.data() as any) : {}) as Balance;
      if (typeof data.stars === 'number') setStars(data.stars);
      if (typeof data.ton === 'number') setTon(data.ton || 0);
    });
    return () => unsub();
  }, [userId]);

  // 2) Фоллбэк-пуллинг серверного API (если правила/импорты мешают читать client SDK)
  useEffect(() => {
    if (!userId) return;
    if (started.current) return;
    started.current = true;
    let stop = false;
    const tick = async () => {
      try {
        const r = await fetch('/api/me/balance', { cache: 'no-store' });
        if (r.ok) {
          const j = await r.json();
          if (typeof j?.stars === 'number') setStars(j.stars);
          if (typeof j?.ton === 'number') setTon(j.ton);
        }
      } catch {}
      if (!stop) setTimeout(tick, 3000);
    };
    tick();
    return () => { stop = true; };
  }, [userId]);

  return { stars, ton, rub: stars / 2 };
}
