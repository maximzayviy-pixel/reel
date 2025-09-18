import { NextRequest } from "next/server";
import { parse } from "querystring";

export interface TGUser {
  id: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
}

/**
 * Используется на сервере (API-роуты).
 */
export function requireUserFromRequest(req: NextRequest): TGUser {
  const initDataRaw = req.headers.get("x-telegram-init-data");
  if (!initDataRaw) {
    throw new Error("Unauthorized: missing init data");
  }
  const parsed = parse(initDataRaw);
  if (!parsed.user) {
    throw new Error("Unauthorized: missing user");
  }
  const user = JSON.parse(parsed.user as string) as TGUser;
  if (!user.id) {
    throw new Error("Unauthorized: invalid user");
  }
  return user;
}

/**
 * Используется на клиенте (React-компоненты).
 */
export function getInitData(): string | null {
  if (typeof window === "undefined") return null;
  return (window as any).Telegram?.WebApp?.initData || null;
}

/**
 * Берём user.id без строгой проверки (для UI).
 */
export function getUserIdUnsafe(): string | null {
  try {
    const raw = getInitData();
    if (!raw) return null;
    const parsed = parse(raw);
    if (!parsed.user) return null;
    const user = JSON.parse(parsed.user as string) as TGUser;
    return user.id;
  } catch {
    return null;
  }
}
