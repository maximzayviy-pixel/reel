import type { NextRequest } from "next/server";
import crypto from "crypto";

export type TGUser = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
};

function getRawInitDataFromReq(req: NextRequest): string | null {
  // 1) Header (preferred when coming from Mini App)
  const fromHeader = req.headers.get("x-telegram-init-data");
  if (fromHeader) return fromHeader;

  // 2) Search param (tgWebAppData)
  const url = new URL(req.url);
  const fromSearch = url.searchParams.get("tgWebAppData");
  if (fromSearch) return fromSearch;

  // 3) Cookie (if you store it there)
  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(/tg_init=([^;]+)/);
  if (m) return decodeURIComponent(m[1]);

  return null;
}

function validateInitData(raw: string): boolean {
  const secret = crypto.createHash("sha256").update(process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || "").digest();
  const parsed = new URLSearchParams(raw);
  const hash = parsed.get("hash") || "";

  const dataCheckArr: string[] = [];
  parsed.forEach((v, k) => {
    if (k === "hash") return;
    dataCheckArr.push(`${k}=${v}`);
  });
  dataCheckArr.sort();
  const dataCheckString = dataCheckArr.join("\n");

  const hmac = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex");
  return hmac === hash;
}

function extractUser(raw: string): TGUser | null {
  const parsed = new URLSearchParams(raw);
  const userJson = parsed.get("user");
  if (!userJson) return null;
  try {
    const u = JSON.parse(userJson);
    return {
      id: Number(u.id),
      username: u.username,
      first_name: u.first_name,
      last_name: u.last_name,
      photo_url: u.photo_url,
    };
  } catch {
    return null;
  }
}

export function requireUserFromRequest(req: NextRequest): TGUser {
  const raw = getRawInitDataFromReq(req);
  if (!raw) throw new Error("UNAUTHORIZED_NO_INITDATA");
  if (!validateInitData(raw)) throw new Error("UNAUTHORIZED_BAD_SIGNATURE");
  const user = extractUser(raw);
  if (!user?.id) throw new Error("UNAUTHORIZED_NO_USER");
  return user;
}
