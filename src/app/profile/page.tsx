'use client';
import Tabs from '../../components/Tabs';
import { useEffect, useState } from 'react';

export default function ProfilePage(){
  const tg = (globalThis as any)?.Telegram?.WebApp;
  const [user,setUser]=useState<any>(null);
  useEffect(()=>{ if(tg?.initDataUnsafe?.user) setUser(tg.initDataUnsafe.user); },[tg]);
  return (
    <>
      <div className="card bg-reel text-white">
        <div className="text-lg font-semibold">Reel Wallet</div>
        <div className="text-sm opacity-80">{user?.username ? '@'+user.username : 'Гость'}</div>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
        <div className="card">Язык: Русский</div>
        <div className="card">Admin ID: {process.env.NEXT_PUBLIC_ADMIN_ID || '—'}</div>
      </div>
      <Tabs/>
    </>
  );
}
