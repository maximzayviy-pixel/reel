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

type CtxType = { user: TUser; initData: string; loading: boolean };

const Ctx = createContext<CtxType>({ user: null, initData: '', loading: true });

function buildInitDataFromUnsafe(unsafe: any): string {
  if (!unsafe || typeof unsafe !== 'object') return '';
  const params = new URLSearchParams();
  if (unsafe.user) params.set('user', JSON.stringify(unsafe.user));
  if (unsafe.auth_date) params.set('auth_date', String(unsafe.auth_date));
  if (unsafe.hash) params.set('hash', String(unsafe.hash));
  if (unsafe.start_param) params.set('start_param', String(unsafe.start_param));
  if (unsafe.query_id) params.set('query_id', String(unsafe.query_id));
  if (unsafe.chat) params.set('chat', JSON.stringify(unsafe.chat));
  if (unsafe.chat_type) params.set('chat_type', String(unsafe.chat_type));
  if (unsafe.chat_instance) params.set('chat_instance', String(unsafe.chat_instance));
  return params.toString();
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TUser>(null);
  const [initData, setInitData] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tg = (window as any)?.Telegram?.WebApp;
    try { tg?.ready?.(); tg?.expand?.(); } catch {}

    let init = tg?.initData || '';

    if (!init && window.location.hash.includes('tgWebAppData=')) {
      const h = new URLSearchParams(window.location.hash.slice(1));
      init = h.get('tgWebAppData') || '';
    }

    if (!init && tg?.initDataUnsafe) {
      init = buildInitDataFromUnsafe(tg.initDataUnsafe);
    }

    setInitData(init || '');

    if (!init) { setLoading(false); return; }

    fetch('/api/me', { headers: { 'x-telegram-init-data': init }})
      .then(r => r.json())
      .then(j => { if (!j?.error) setUser(j); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return <Ctx.Provider value={{ user, initData, loading }}>{children}</Ctx.Provider>;
}

export function useTG() {
  return useContext(Ctx);
}
