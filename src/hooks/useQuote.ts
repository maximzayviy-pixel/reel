
'use client';
import { useEffect, useState } from 'react';

// Хук забирает котировку TON→RUB с наценкой +15% через /api/quote (если есть)
// и кэширует в памяти на 60с.
export function useQuoteTonRub() {
  const [rubPerTon, setRubPerTon] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/quote?asset=TON&withMarkup=1', { cache: 'no-store' });
        if (!res.ok) throw new Error('quote_http_'+res.status);
        const data = await res.json();
        // ожидаем { rubPerTon: number }
        const value = Number(data.rubPerTon ?? data.rub_per_ton ?? data.price);
        if (!Number.isFinite(value)) throw new Error('quote_format');
        if (mounted) setRubPerTon(value);
      } catch (e:any) {
        setError(e?.message || 'quote_error');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    const t = setInterval(load, 60_000);
    return () => { mounted = false; clearInterval(t); };
  }, []);

  return { rubPerTon, loading, error };
}
