import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";
import { isValidAmount, isValidDate, rowToPayment } from "@/lib/server-helpers";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await ensureSchema();
    const body = await req.json();
    const date = body?.date;
    const amount = Number(body?.amount);
    const mode = body?.mode === "online" ? "online" : "cash";
    const note = String(body?.note ?? "").trim();

    if (!isValidDate(date)) {
      return NextResponse.json({ error: "A valid payment date is required." }, { status: 400 });
    }
    if (!isValidAmount(amount)) {
      return NextResponse.json({ error: "Amount must be greater than 0." }, { status: 400 });
    }

    const sql = db();
    const rows = await sql`
      UPDATE payments SET date = ${date}, amount = ${amount}, mode = ${mode}, note = ${note}
      WHERE id = ${id}
      RETURNING *
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: "Payment not found." }, { status: 404 });
    }
    return NextResponse.json(rowToPayment(rows[0]));
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update payment." },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await ensureSchema();
    const sql = db();
    const rows = await sql`DELETE FROM payments WHERE id = ${id} RETURNING id`;
    if (rows.length === 0) {
      return NextResponse.json({ error: "Payment not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete payment." },
      { status: 500 }
    );
  }
}
