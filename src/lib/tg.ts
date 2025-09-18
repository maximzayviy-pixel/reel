import type { NextRequest } from "next/server";
import crypto from "crypto";

export type TGUser = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
};

function header(req: NextRequest, name: string): string | null {
  // headers are case-insensitive but ensure we try a few common variants
  return (
    req.headers.get(name) ||
    req.headers.get(name.toLowerCase()) ||
    req.headers.get(name.toUpperCase())
  );
}

function getRawInitDataFromReq(req: NextRequest): string | null {
  // Prefer explicit header our app sets
  const fromHeader =
    header(req, "x-telegram-init-data") ||
    header(req, "x-telegram-web-app-init-data") ||
    header(req, "telegram-init-data");
  if (fromHeader) return fromHeader;

  // Then try query param (Telegram may pass tgWebAppData / tg_web_app_data)
  const url = new URL(req.url);
  const qs =
    url.searchParams.get("x-telegram-init-data") ||
    url.searchParams.get("tg_web_app_data") ||
    url.searchParams.get("tgWebAppData") ||
    url.searchParams.get("initData") ||
    url.searchParams.get("init_data");
  if (qs) return qs;

  // Finally try JSON body if present
  try {
    // NOTE: reading body here is not allowed in Next edge runtime streaming,
    // but our routes are nodejs and we call this only after route parsed JSON.
    // So this is a noop here; kept for completeness.
    return null;
  } catch {
    return null;
  }
}

function computeHash(raw: string, botToken: string): string {
  const secret = crypto.createHash("sha256").update(botToken).digest();
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
  // return both for diagnostics
  return hmac === hash ? "OK" : `BAD:${hash.slice(0, 8)}!=${hmac.slice(0, 8)}`;
}

function extractUser(raw: string): TGUser | null {
  const parsed = new URLSearchParams(raw);
  const userStr = parsed.get("user");
  if (!userStr) return null;
  try {
    const u = JSON.parse(userStr);
    return u as TGUser;
  } catch {
    return null;
  }
}

export function requireUserFromRequest(req: NextRequest): TGUser {
  const raw = getRawInitDataFromReq(req);
  if (!raw) throw new Error("UNAUTHORIZED_NO_INITDATA");

  const botToken = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || "";
  if (!botToken) throw new Error("UNAUTHORIZED_NO_TOKEN");

  const check = computeHash(raw, botToken);
  if (check !== "OK") throw new Error(`UNAUTHORIZED_BAD_SIGNATURE:${check}`);

  const user = extractUser(raw);
  if (!user?.id) throw new Error("UNAUTHORIZED_NO_USER");
  return user;
}

// Lightweight helper for diagnostics in /api/debug/tg
export function debugInitData(req: NextRequest) {
  const raw = getRawInitDataFromReq(req);
  const botToken = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || "";
  const user = raw ? extractUser(raw) : null;
  const status = raw && botToken ? computeHash(raw, botToken) : "NO_RAW_OR_TOKEN";
  return {
    hasRaw: !!raw,
    rawLength: raw?.length || 0,
    user,
    status, // "OK" or "BAD:..."
    botTokenPresent: !!botToken,
  };
}
