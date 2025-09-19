'use client';
import React, { useEffect, useState } from 'react';

export default function BalanceText() {
  const [stars, setStars] = useState<number | null>(null);
  const [rub, setRub] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBalance() {
      try {
        setLoading(true);
        const res = await fetch('/api/me/balance?refresh=1');
        if (!res.ok) throw new Error('Ошибка API');
        const data = await res.json();
        setStars(data.stars ?? 0);
        setRub(data.rub ?? 0);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadBalance();
  }, []);

  if (loading) return <span>Загрузка...</span>;
  if (error) return <span>Ошибка: {error}</span>;

  return (
    <div className="flex flex-col items-center">
      <span>⭐ {stars}</span>
      <span>₽ {rub}</span>
    </div>
  );
}
