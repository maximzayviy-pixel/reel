// src/components/BalanceText.tsx
'use client';
import { useRealtimeBalance } from '../hooks/useRealtimeBalance';

export default function BalanceText({ userId }:{ userId?: string }){
  const { stars, rub } = useRealtimeBalance(userId);
  if (stars === null) {
    return <span className="inline-block h-7 w-24 animate-pulse rounded-md bg-white/10"/>;
  }
  return (
    <div className="leading-tight">
      <div className="text-3xl font-extrabold tracking-tight">{(rub ?? 0).toLocaleString('ru-RU')}<span className="text-2xl"> ₽</span></div>
      <div className="opacity-70 text-xs">≈ {stars} ⭐</div>
    </div>
  );
}
