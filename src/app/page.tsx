'use client';
import HeaderWallet from '../components/HeaderWallet';
import ActionGrid from '../components/ActionGrid';
import Tabs from '../components/Tabs';
import { useEffect, useState } from 'react';

export default function Home() {
  const tg = (globalThis as any)?.Telegram?.WebApp;
  const [user, setUser] = useState<any>(null);
  useEffect(() => { if (tg?.initDataUnsafe?.user) setUser(tg.initDataUnsafe.user); }, [tg]);
  return (
    <>
      <HeaderWallet user={user} rub={0} />
      <div className="mt-4"><ActionGrid /></div>
      <Tabs/>
    </>
  );
}
