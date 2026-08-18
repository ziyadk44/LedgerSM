import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";
import { isValidAmount, isValidDate, newId, rowToPayment } from "@/lib/server-helpers";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const body = await req.json();
    const billId = String(body?.billId ?? "");
    const date = body?.date;
    const amount = Number(body?.amount);
    const mode = body?.mode === "online" ? "online" : "cash";
    const note = String(body?.note ?? "").trim();

    if (!billId) {
      return NextResponse.json({ error: "Bill is required." }, { status: 400 });
    }
    if (!isValidDate(date)) {
      return NextResponse.json({ error: "A valid payment date is required." }, { status: 400 });
    }
    if (!isValidAmount(amount)) {
      return NextResponse.json({ error: "Amount must be greater than 0." }, { status: 400 });
    }

    const sql = db();
    const id = newId("pay");
    const createdAt = Date.now();
    const rows = await sql`
      INSERT INTO payments (id, bill_id, date, amount, mode, note, created_at)
      VALUES (${id}, ${billId}, ${date}, ${amount}, ${mode}, ${note}, ${createdAt})
      RETURNING *
    `;
    return NextResponse.json(rowToPayment(rows[0]), { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to record payment." },
      { status: 500 }
    );
  }
}
