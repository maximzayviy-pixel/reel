import { NextRequest } from "next/server";
import { parse } from "querystring";

export interface TGUser {
  id: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
}

export function requireUserFromRequest(req: NextRequest): TGUser {
  const initDataRaw = req.headers.get("x-telegram-init-data");
  if (!initDataRaw) {
    throw new Error("Unauthorized: missing init data");
  }

  // Telegram mini app initData — строка формата querystring
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
