'use client';
import React from 'react';
import { useRealtimeBalance } from '@/hooks/useRealtimeBalance';

export default function BalanceText({ userId }: { userId?: string | number }) {
  const { stars, rub } = useRealtimeBalance(userId);
  if (stars == null) {
    return <div className="animate-pulse h-8 w-40 rounded bg-gray-200/40" />;
  }
  return (
    <div className="text-white">
      <div className="text-5xl font-bold drop-shadow">{
        (rub ?? 0).toLocaleString('ru-RU')
      }<span className="text-3xl align-top ml-1">₽</span></div>
      <div className="text-white/70 text-sm mt-1">≈ {stars} ⭐</div>
    </div>
  );
}
