'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

type TUser = {
  id?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  verified?: boolean;
  banned?: boolean;
} | null;

type CtxType = { user: TUser; initData: string };

const Ctx = createContext<CtxType>({ user: null, initData: '' });

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TUser>(null);
  const [initData, setInitData] = useState<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tg = (window as any)?.Telegram?.WebApp;
    try { tg?.ready?.(); tg?.expand?.(); } catch {}
    const id = tg?.initData || '';
    setInitData(id || '');
    if (!id) return;
    fetch('/api/me', { headers: { 'x-telegram-init-data': id }})
      .then(r => r.json())
      .then(j => { if (!j?.error) setUser(j); })
      .catch(()=>{});
  }, []);

  return <Ctx.Provider value={{ user, initData }}>{children}</Ctx.Provider>;
}

export function useTG() {
  return useContext(Ctx);
}
