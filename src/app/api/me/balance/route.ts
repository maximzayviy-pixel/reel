import { NextRequest, NextResponse } from "next/server";
import { getAdminDB } from "@/lib/firebaseAdmin";
import { getUserIdFromRequest } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getAdminDB();
    const userRef = db.collection("users").doc(String(userId));
    const snap = await userRef.get();

    let balances = { stars: 0, rub: 0 };
    if (snap.exists) {
      const data = snap.data() || {};
      balances = data.balances || balances;
    }

    // refresh=1 → принудительное обновление (например, через balanceOps)
    const { searchParams } = new URL(req.url);
    if (searchParams.get("refresh") === "1") {
      // Здесь можно вставить обновление из balanceOps если нужно
    }

    return NextResponse.json(balances);
  } catch (err: any) {
    console.error("Balance API error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
