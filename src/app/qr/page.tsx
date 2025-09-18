'use client';
import { useCallback, useState } from 'react';
import Tabs from '../../components/Tabs';
import { Card, Button } from '../../components/UI';
import { parseSBPQR } from '../../lib/sbp';
import CameraQR from '../../components/CameraQR';

export default function QRPage(){
  const tg = (globalThis as any)?.Telegram?.WebApp;
  const initData = tg?.initData || '';
  const [payload, setPayload] = useState('ST00012|Name=ООО Пример|Amount=1234.56|Purpose=Оплата заказа');
  const [quote, setQuote] = useState<any>(null);
  const [err, setErr] = useState('');

  const handleScanned = useCallback((text: string) => { setPayload(text); }, []);

  const calculate = useCallback(async () => {
    setErr('');
    const parsed = parseSBPQR(payload);
    const rub = parsed.amount || 0;
    if (!rub) { setErr('Не удалось извлечь сумму из QR'); return; }
    const res = await fetch('/api/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-telegram-init-data': initData },
      body: JSON.stringify({ rub })
    });
    const data = await res.json();
    if (!res.ok) { setErr(data?.error || 'Ошибка'); return; }
    setQuote(data);
  }, [payload, initData]);

  const choose = async (currency:'stars'|'ton') => {
    setErr('');
    const res = await fetch('/api/choose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-telegram-init-data': initData },
      body: JSON.stringify({ quoteId: quote.id, currency })
    });
    const data = await res.json();
    if (!res.ok) { setErr(data?.error || 'Ошибка'); return; }
    window.location.href = `/status?paymentId=${data.paymentId}`;
  };

  return (
    <>
      <CameraQR onScan={handleScanned} />
      <div className="card mt-3">
        <div className="text-sm opacity-70 mb-2">Payload QR (редактируемый):</div>
        <textarea value={payload} onChange={e=>setPayload(e.target.value)} className="w-full h-24 rounded-xl border p-2" />
        <div className="mt-3"><Button onClick={calculate}>Рассчитать</Button></div>
        {err && <div className="text-sm text-red-600 mt-2">{err}</div>}
      </div>
      {quote && (
        <div className="card mt-4">
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>RUB: {quote.rub}</div>
            <div>⭐: {quote.stars}</div>
            <div>TON: {quote.ton.toFixed(4)}</div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <Button onClick={()=>choose('stars')}>Оплатить ⭐</Button>
            <Button onClick={()=>choose('ton')}>Оплатить TON</Button>
          </div>
        </div>
      )}
      <Tabs/>
    </>
  );
}
