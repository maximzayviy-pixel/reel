'use client';
import React from 'react';
import { useRealtimeBalance } from '../hooks/useRealtimeBalance';

export default function BalanceText({ userId }: { userId?: string | number }) {
  const { stars, rub } = useRealtimeBalance(userId);
  return (
    <span>{rub.toFixed(2)} ₽ · {Math.floor(stars)}⭐</span>
  );
}
