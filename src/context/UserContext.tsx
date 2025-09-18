'use client';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchBalance } from '../lib/fetchBalance';

type TGUser = { id?: string; username?: string; first_name?: string; last_name?: string; photo_url?: string; };
type Ctx = {
  user: TGUser | null;
  initData: string | null;
  loading: boolean;
  balances: { stars: number; ton: number };
  refreshBalances: () => Promise<void>;
};
const C = createContext<Ctx>({ user: null, initData: null, loading: true, balances:{stars:0, ton:0}, refreshBalances: async()=>{} });

export function UserProvider({ children }: { children: React.ReactNode }){
  const tg = (globalThis as any)?.Telegram?.WebApp;
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<TGUser|null>(null);
  const [initData, setInitData] = useState<string|null>(null);
  const [balances, setBalances] = useState({ stars: 0, ton: 0 });

  useEffect(() => {
    try{
      const init = tg?.initData || null;
      setInitData(init || null);
      const pdata = tg?.initDataUnsafe?.user || null;
      setUser(pdata ? { id: String(pdata.id), username: pdata.username, first_name: pdata.first_name, last_name: pdata.last_name, photo_url: pdata.photo_url } : null);
    }catch{}
    setLoading(false);
  }, [tg]);

  const refreshBalances = async () => {
    try{
      const b = await fetchBalance(initData || undefined);
      setBalances(b);
    }catch{}
  };

  useEffect(()=>{ if (initData) refreshBalances(); }, [initData]);

  const value = useMemo(()=>({ user, initData, loading, balances, refreshBalances }), [user, initData, loading, balances]);

  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useTG(){ return useContext(C); }
