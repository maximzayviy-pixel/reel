'use client';
import React, { useEffect, useState } from 'react';
import { Button, Card } from '../../components/UI';

export default function Admin() {
  const tg = (globalThis as any)?.Telegram?.WebApp;
  const initData = tg?.initData || '';
  const [items, setItems] = useState<any[]>([]);

  const load = async () => {
    const res = await fetch('/api/admin/mark-paid?list=pending');
    const j = await res.json();
    setItems(j.items || []);
  };

  useEffect(() => { load(); }, []);

  const act = async (id: string, action: 'mark-paid'|'reject') => {
    await fetch(`/api/admin/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-telegram-init-data': initData },
      body: JSON.stringify({ paymentId: id })
    });
    load();
  };

  return (
    <div className="space-y-3">
      <h1 className="text-lg font-semibold">Админка</h1>
      {items.map(p => (
        <Card key={p.id}>
          <div>{p.rub} ₽ — {p.currency} ≈ {p.amount}</div>
          <div className="flex gap-2 mt-2">
            <Button onClick={() => act(p.id,'mark-paid')}>Оплачено</Button>
            <Button className="bg-red-600" onClick={() => act(p.id,'reject')}>Отклонить</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
