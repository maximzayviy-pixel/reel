'use client';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type TGUser = {
  id?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  verified?: boolean;
  banned?: boolean;
};

type Ctx = {
  user: TGUser | null;
  initData: string | null;
  isMiniApp: boolean;
  loading: boolean;
  setUser: (u: TGUser | null) => void;
};

const C = createContext<Ctx>({
  user: null, initData: null, isMiniApp: false, loading: true, setUser: () => {}
});

function parseFromHashOrSearch(): { initData: string|null, user: TGUser|null } {
  try{
    const pull = (s: string) => {
      const q = new URLSearchParams(s.replace(/^#/, '').replace(/^\?/, ''));
      const raw = q.get('tgWebAppData');
      if (!raw) return null;
      const params = new URLSearchParams(decodeURIComponent(raw));
      const u = params.get('user');
      let user: TGUser|null = null;
      if (u) {
        try { user = JSON.parse(u); } catch {}
      }
      return { initData: raw, user };
    };
    return pull(location.hash) || pull(location.search) || { initData: null, user: null };
  }catch{
    return { initData: null, user: null };
  }
}

export function UserProvider({ children }: { children: React.ReactNode }){
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<TGUser|null>(null);
  const [initData, setInitData] = useState<string|null>(null);
  const [isMiniApp, setIsMiniApp] = useState(false);

  useEffect(() => {
    const w = globalThis as any;
    const tg = w?.Telegram?.WebApp;
    let u: TGUser|null = null;
    let id: string|null = null;

    try {
      if (tg && typeof tg === 'object') {
        id = tg.initData || null;
        u = tg.initDataUnsafe?.user || null;
        try { tg.ready?.(); tg.expand?.(); } catch {}
        setIsMiniApp(true);
      }
    } catch {}

    if (!id) {
      const f = parseFromHashOrSearch();
      if (f.initData) {
        id = f.initData;
        u = (f.user as TGUser|null) || u;
        setIsMiniApp(true);
      }
    }

    setInitData(id || null);
    setUser(u ? {
      id: u.id ? String(u.id) : undefined,
      username: u.username,
      first_name: u.first_name,
      last_name: u.last_name,
      photo_url: u.photo_url,
    } : null);

    setLoading(false);
  }, []);

  const value = useMemo(() => ({ user, initData, isMiniApp, loading, setUser }), [user, initData, isMiniApp, loading]);
  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useTG(){ return useContext(C); }
