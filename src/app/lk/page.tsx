'use client';
import React, { useEffect, useState } from 'react';
import { Card } from '../../components/UI';

export default function LK() {
  const tg = (globalThis as any)?.Telegram?.WebApp;
  const initData = tg?.initData || '';
  const [balance, setBalance] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const b = await fetch('/api/me/balance', { headers: { 'x-telegram-init-data': initData } }).then(r=>r.json());
      setBalance(b);
      const p = await fetch('/api/me/payments', { headers: { 'x-telegram-init-data': initData } }).then(r=>r.json());
      setPayments(p.items||[]);
    };
    load();
  }, [initData]);

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-lg font-semibold">Баланс</h2>
        {balance && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>⭐ Stars: {balance.stars}</div>
            <div>TON: {balance.ton}</div>
          </div>
        )}
      </Card>
      <Card>
        <h2 className="text-lg font-semibold">История</h2>
        <ul className="text-sm space-y-1">
          {payments.map(p => <li key={p.id}>{p.status} — {p.rub}₽ ({p.currency})</li>)}
        </ul>
      </Card>
    </div>
  );
}
