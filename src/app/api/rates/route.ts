import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const TON_RATE_RUB = Number(process.env.TON_RATE_RUB || 350);
  const STARS_PER_RUB = Number(process.env.STARS_PER_RUB || 2);
  return NextResponse.json({ ton: TON_RATE_RUB, starsPerRub: STARS_PER_RUB });
}