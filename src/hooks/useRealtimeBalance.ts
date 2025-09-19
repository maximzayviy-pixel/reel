import { useEffect, useState } from "react";

export function useRealtimeBalance(userId?: string | number) {
  const [balance, setBalance] = useState<{ stars: number; rub: number }>({ stars: 0, rub: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchBalance(refresh = false) {
    try {
      setLoading(true);
      const res = await fetch(`/api/me/balance${refresh ? '?refresh=1' : ''}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setBalance({ stars: data.stars || 0, rub: data.rub || 0 });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(() => fetchBalance(true), 10000);
    return () => clearInterval(interval);
  }, [userId]);

  return { balance, loading, error, refresh: () => fetchBalance(true) };
}
