'use client';

import { useEffect, useRef, useState } from 'react';

type Balances = { stars: number; ton: number };
type Rates = { ton: number; starsPerRub: number };

async function fetchRates(): Promise<Rates> {
  try {
    const r = await fetch('/api/rates', { cache: 'no-store' });
    const j = await r.json();
    return { ton: Number(j?.ton || 350), starsPerRub: Number(j?.starsPerRub || 2) };
  } catch {
    return { ton: 350, starsPerRub: 2 };
  }
}

async function fetchBalances(): Promise<Balances> {
  try {
    const initData = (globalThis as any)?.Telegram?.WebApp?.initData || '';
    const r = await fetch('/api/me/balance', {
      headers: { 'x-telegram-init-data': initData },
      cache: 'no-store',
    });
    const j = await r.json();
    return { stars: Number(j?.stars || 0), ton: Number(j?.ton || 0) };
  } catch {
    return { stars: 0, ton: 0 };
  }
}

export function useRealtimeBalance(_userId?: string | number) {
  const [stars, setStars] = useState(0);
  const [ton, setTon] = useState(0);
  const [rub, setRub] = useState(0);

  const ratesRef = useRef<Rates>({ ton: 350, starsPerRub: 2 });

  useEffect(() => {
    let mounted = true;
    fetchRates().then((rt) => {
      if (mounted) ratesRef.current = rt;
    });
    return () => { mounted = false; };
  }, []);

  async function refresh() {
    const b = await fetchBalances();
    setStars(b.stars);
    setTon(b.ton);
    const r = ratesRef.current;
    const newRub = (b.stars / (r.starsPerRub || 2)) + (b.ton * (r.ton || 350));
    setRub(Number(newRub));
  }

  useEffect(() => {
    refresh();
    const iv = setInterval(refresh, 5000);
    const onVis = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  return { stars, ton, rub, refresh };
}
