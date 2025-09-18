'use client';
import { useRealtimeBalance } from '@/hooks/useRealtimeBalance';

export default function BalanceText({ userId }: { userId?: string }) {
  const { rub } = useRealtimeBalance(userId);
  const value = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 1, maximumFractionDigits: 1,
  }).format(rub);
  return <span>{value} ₽</span>;
}
