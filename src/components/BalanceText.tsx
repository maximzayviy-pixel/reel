'use client';
import React from 'react';

type Resp = { uid:string; stars:number; ton:number; total_rub?:number };

export default function BalanceText({ userId }: { userId?: string | number }) {
  const [data, setData] = React.useState<Resp | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/me/balance?refresh=1');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (e:any) {
        if (!cancelled) setError(e?.message || 'error');
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  if (error) return <span className="text-red-500">баланс: ошибка</span>;
  if (!data) return <span className="opacity-60">баланс: …</span>;

  return (
    <span>⭐ {data.stars ?? 0} · TON {data.ton ?? 0} {typeof data.total_rub==='number' ? `(≈ ${data.total_rub}₽)` : ''}</span>
  );
}
