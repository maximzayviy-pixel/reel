'use client';
import { useEffect, useState, useMemo } from 'react';
import Tabs from '../../components/Tabs';

export default function StatusPage(){
  const params = new URLSearchParams(window.location.search);
  const paymentId = params.get('paymentId')||'';
  const [data, setData] = useState<any>(null);

  useEffect(()=>{
    let alive = true;
    const loop = async () => {
      const res = await fetch(`/api/admin/mark-paid?peek=${paymentId}`, { cache:'no-store' });
      const j = await res.json();
      if (alive) setData(j);
      setTimeout(loop, 1500);
    };
    if (paymentId) loop();
    return ()=>{ alive=false };
  },[paymentId]);

  const st = data?.payment?.status || 'pending';
  const title = st==='paid'?'✅ Оплачено':st==='rejected'?'❌ Отклонено':st==='expired'?'⏳ Истекло':'⌛ Ожидание';

  return (
    <>
      <div className="card text-center">
        {st==='pending' && <div className="loader mb-3" />}
        <div className="text-xl font-semibold">{title}</div>
        {data && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div>RUB: {data.quote.rub}</div>
            <div>⭐: {data.quote.stars}</div>
            <div>TON: {data.quote.ton.toFixed(4)}</div>
          </div>
        )}
        <div className="text-xs opacity-60 mt-2">Ожидаем подтверждение оплаты админом…</div>
      </div>
      <Tabs/>
    </>
  );
}
