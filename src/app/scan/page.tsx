'use client';
import React, { useCallback, useState } from 'react';
import QRScanner from '../../components/QRScanner';
import { Button, Card } from '../../components/UI';

export default function Scan() {
  const tg = (globalThis as any)?.Telegram?.WebApp;
  const initData = tg?.initData || '';
  const [step, setStep] = useState<'scan'|'quote'>('scan');
  const [quote, setQuote] = useState<any>(null);
  const [err, setErr] = useState<string>('');

  const onScan = useCallback(async (text: string) => {
    setErr('');
    const m = text.match(/amount=(\d+(?:\.\d+)?)/i);
    const rub = m ? Number(m[1]) : 1000;
    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-telegram-init-data': initData },
        body: JSON.stringify({ rub })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Ошибка');
      setQuote(data);
      setStep('quote');
    } catch (e:any) {
      setErr(e?.message || 'Сбой запроса');
    }
  }, [initData]);

  const choose = async (currency: 'stars'|'ton') => {
    setErr('');
    try {
      const res = await fetch('/api/choose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-telegram-init-data': initData },
        body: JSON.stringify({ quoteId: quote.id, currency })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Ошибка');
      window.location.href = `/status?paymentId=${data.paymentId}`;
    } catch (e:any) {
      setErr(e?.message || 'Сбой запроса');
    }
  };

  return (
    <div className="space-y-4">
      {step === 'scan' && <QRScanner onScan={onScan} />}
      {err && <div className="text-sm text-red-600">{err}</div>}
      {step === 'quote' && quote && (
        <Card>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>RUB: {quote.rub}</div>
            <div>⭐: {quote.stars}</div>
            <div>TON: {quote.ton.toFixed(4)}</div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <Button onClick={() => choose('stars')}>Оплатить ⭐</Button>
            <Button onClick={() => choose('ton')}>Оплатить TON</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
