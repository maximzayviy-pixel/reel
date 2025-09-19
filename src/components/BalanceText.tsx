'use client';
import React from 'react';
import { useRealtimeBalance } from '../../hooks/useRealtimeBalance';

export default function BalanceText() {
  const { balance, loading, error } = useRealtimeBalance();

  if (loading) return <span>…</span>;
  if (error) return <span className="text-red-600">ошибка</span>;
  if (!balance) return <span>0</span>;

  const fmt = new Intl.NumberFormat('ru-RU');
  return (
    <span>
      ⭐ {fmt.format(balance.stars)} · ₽ {fmt.format(Math.round((balance.total_rub || 0) * 100) / 100)}
    </span>
  );
}
