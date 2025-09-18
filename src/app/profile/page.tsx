'use client';
import Tabs from '../../components/Tabs';
import { useEffect } from 'react';
import { useTG } from '../../context/UserContext';

export default function ProfilePage(){
  const { user, initData, loading, setUser } = useTG();

  useEffect(() => {
    const run = async () => {
      try{
        if (!initData) return;
        const r = await fetch('/api/me', { headers: {'x-telegram-init-data': initData}, cache:'no-store' });
        const j = await r.json();
        if (j?.user) setUser({ ...(user || {}), ...j.user });
      }catch{}
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initData]);

  const name = user?.first_name || user?.username || 'Гость';
  const id = user?.id || '—';
  const verified = user?.verified ? '✔️' : '—';
  const banned = user?.banned ? '🚫' : '—';

  if (loading) return <div className="p-4">Загрузка…</div>;

  return (
    <>
      <div className="card flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gray-200" />
        <div>
          <div className="font-semibold">{name}</div>
          <div className="text-xs opacity-60">ID: {id}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
        <div className="card">Верификация: {verified}</div>
        <div className="card">Бан: {banned}</div>
      </div>

      <Tabs/>
    </>
  );
}
