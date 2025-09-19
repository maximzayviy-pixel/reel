'use client';
import { useEffect, useState } from 'react';

export type Balance = { uid: string; stars: number; ton: number; total_rub?: number };

export function useRealtimeBalance() {
  const [data, setData] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(refresh=false) {
    try {
      const res = await fetch(`/api/me/balance${refresh ? '?refresh=1' : ''}`, {
        method: 'GET',
        headers: { 'cache-control': 'no-cache' },
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'balance_error');
      setData(j);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'balance_error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(true);
    const id = setInterval(() => load(false), 5000);
    return () => clearInterval(id);
  }, []);

  return { balance: data, loading, error, refresh: () => load(true) };
}
