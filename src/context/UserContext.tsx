'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

type TUser = { id?: string; username?: string; first_name?: string; last_name?: string } | null;

const Ctx = createContext<TUser>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TUser>(null);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tg = (window as any)?.Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user) setUser(tg.initDataUnsafe.user);
  }, []);
  return <Ctx.Provider value={user}>{children}</Ctx.Provider>;
}

export function useTGUser() {
  return useContext(Ctx);
}
