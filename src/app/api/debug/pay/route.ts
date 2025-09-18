import { NextRequest, NextResponse } from 'next/server';
export async function GET(req: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return NextResponse.json({ error: 'no token' }, { status: 500 });
  const payload = {
    title: "Test Stars",
    description: "Тестовая покупка 5 ⭐",
    payload: `test:${Date.now()}`,
    currency: "XTR",
    prices: [{ label: "Stars", amount: 5 }],
  };
  const res = await fetch(`https://api.telegram.org/bot${token}/createInvoiceLink`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store'
  });
  const j = await res.json();
  return NextResponse.json(j);
}
