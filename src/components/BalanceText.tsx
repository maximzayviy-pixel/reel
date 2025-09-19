'use client';
import React from 'react';
import { useRealtimeBalance } from '@/hooks/useRealtimeBalance';

export default function BalanceText({ userId }: { userId?: string | number }) {
  const { balance, loading, error } = useRealtimeBalance(userId);

  if (loading) return <span>Загрузка...</span>;
  if (error) return <span>Ошибка: {error}</span>;

  return (
    <div className="flex flex-col items-center">
      <span className="text-lg font-semibold">⭐ {balance.stars}</span>
      <span className="text-lg font-semibold">₽ {balance.rub}</span>
    </div>
  );
}
