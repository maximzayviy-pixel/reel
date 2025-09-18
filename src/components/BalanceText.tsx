// src/components/BalanceText.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRealtimeBalance } from '../hooks/useRealtimeBalance';

function Shimmer({width='8rem'}:{width?:string}){
  return <span className="inline-block animate-pulse h-6 rounded-md bg-white/30" style={{width}}/>;
}

export default function BalanceText({ userId }:{ userId?: string }){
  const { stars, ton, rub } = useRealtimeBalance(userId);
  const [rubPerTon, setRubPerTon] = useState<number | null>(null);

  // Тянем курс TON→₽ с наценкой +15%
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch('/api/quote?asset=TON&withMarkup=1', { cache: 'no-store' });
        if (!res.ok) return;
        const j = await res.json();
        const v = Number(j?.rubPerTon ?? j?.rub_per_ton ?? j?.price);
        if (Number.isFinite(v) && alive) setRubPerTon(v);
      } catch {}
    };
    load();
    const t = setInterval(load, 60000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const rubFromTon = rubPerTon ? (ton || 0) * rubPerTon : 0;
  const totalRub = (rub || 0) + rubFromTon;

  return (
    <div className="flex flex-col items-start gap-1">
      {userId ? (
        <span className="text-4xl font-bold tracking-wide">
          {rubPerTon===null && (ton||0)>0 ? <Shimmer width="7rem"/> : totalRub.toFixed(2)} ₽
        </span>
      ) : <Shimmer width="7rem"/> }
      <span className="text-sm opacity-80">⭐ {stars} {(ton||0)>0 && `• TON ${ton}`}</span>
      {(ton||0)>0 && rubPerTon && (
        <span className="text-xs opacity-60">Курс TON≈{rubPerTon.toFixed(2)} ₽ (+15%)</span>
      )}
    </div>
  );
}
