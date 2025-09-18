// src/components/BalanceText.tsx
'use client';

import { useRealtimeBalance } from "@/hooks/useRealtimeBalance";

export default function BalanceText({ userId }: { userId?: string }) {
  const { stars, rub } = useRealtimeBalance(userId);

  return (
    <div className="flex flex-col items-start">
      <span className="text-4xl font-bold tracking-wide">{rub.toFixed(2)} ₽</span>
      <span className="text-sm opacity-70">⭐ {stars}</span>
    </div>
  );
}
