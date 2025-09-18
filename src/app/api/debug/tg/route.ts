export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { debugInitData } from '@/lib/tg';

export async function GET(req: NextRequest) {
  const info = debugInitData(req);
  return NextResponse.json(info, { status: 200 });
}
export async function POST(req: NextRequest) {
  const info = debugInitData(req);
  return NextResponse.json(info, { status: 200 });
}
