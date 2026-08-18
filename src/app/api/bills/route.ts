import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";
import { isValidAmount, isValidDate, newId, rowToBill } from "@/lib/server-helpers";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const body = await req.json();
    const supplierId = String(body?.supplierId ?? "");
    const date = body?.date;
    const amount = Number(body?.amount);
    const note = String(body?.note ?? "").trim();

    if (!supplierId) {
      return NextResponse.json({ error: "Supplier is required." }, { status: 400 });
    }
    if (!isValidDate(date)) {
      return NextResponse.json({ error: "A valid bill date is required." }, { status: 400 });
    }
    if (!isValidAmount(amount)) {
      return NextResponse.json({ error: "Amount must be greater than 0." }, { status: 400 });
    }

    const sql = db();
    const id = newId("bill");
    const createdAt = Date.now();
    const rows = await sql`
      INSERT INTO bills (id, supplier_id, date, amount, note, created_at)
      VALUES (${id}, ${supplierId}, ${date}, ${amount}, ${note}, ${createdAt})
      RETURNING *
    `;
    return NextResponse.json(rowToBill(rows[0]), { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create bill." },
      { status: 500 }
    );
  }
}
