'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

type TUser = { id?: string; username?: string; first_name?: string; last_name?: string; photo_url?: string } | null;

const Ctx = createContext<TUser>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TUser>(null);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tg = (window as any)?.Telegram?.WebApp;
    try { tg?.ready?.(); tg?.expand?.(); } catch {}
    const initData = tg?.initData || '';
    if (!initData) return;
    // Ask server for enriched profile (with avatar), also stores in Firestore
    fetch('/api/me', { headers: { 'x-telegram-init-data': initData }})
      .then(r => r.json())
      .then(j => { if (!j?.error) setUser(j); })
      .catch(()=>{});
  }, []);
  return <Ctx.Provider value={user}>{children}</Ctx.Provider>;
}

export function useTGUser() {
  return useContext(Ctx);
}
