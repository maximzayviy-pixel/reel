'use client';
export const dynamic = 'force-dynamic';

import { useCallback, useState } from 'react';
import Tabs from '../../components/Tabs';
import { Button } from '../../components/UI';
import { parseSBPUrlAmount } from '../../lib/sbp';
import CameraQR from '../../components/CameraQR';
import { useTG } from '../../context/UserContext';

export default function QRPage(){
  const { initData } = useTG();
  const [url, setUrl] = useState('https://pay.example.bank/sbp?amount=1234.56');
  const [quote, setQuote] = useState<any>(null);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');

  const handleScanned = useCallback((text: string) => {
    setUrl(text);
  }, []);

  const calculate = useCallback(async () => {
    setErr('');
    setSent(false);
    const rub = parseSBPUrlAmount(url) || 0;
    if (!rub) { setErr('В ссылке СБП не найдена сумма'); return; }
    if (!initData) { setErr('Открой Mini App внутри Telegram'); return; }
    const res = await fetch('/api/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-telegram-init-data': initData },
      body: JSON.stringify({ rub, sbpUrl: url })
    });
    const data = await res.json();
    if (!res.ok) { setErr(data?.error || 'Ошибка'); return; }
    setQuote(data);
    setSent(true);
  }, [url, initData]);

  const choose = async (currency:'stars'|'ton') => {
    setErr('');
    if (!initData) { setErr('Открой Mini App внутри Telegram'); return; }
    const res = await fetch('/api/choose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-telegram-init-data': initData },
      body: JSON.stringify({ quoteId: quote.id, currency, sbpUrl: url })
    });
    const data = await res.json();
    if (!res.ok) { setErr(data?.error || 'Ошибка'); return; }
    window.location.href = `/status?paymentId=${data.paymentId}`;
  };

  return (
    <>
      <CameraQR onScan={handleScanned} />
      <div className="card mt-3">
        <div className="text-sm opacity-70 mb-2">Вставь <b>ссылку СБП</b>:</div>
        <input value={url} onChange={e=>setUrl(e.target.value)} className="w-full rounded-xl border p-2" placeholder="https://...sbp..." />
        <div className="mt-3"><Button onClick={calculate}>Рассчитать и отправить админу</Button></div>
        {sent && <div className="text-xs text-green-700 mt-2">Отправлено админу. Выберите способ оплаты:</div>}
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
