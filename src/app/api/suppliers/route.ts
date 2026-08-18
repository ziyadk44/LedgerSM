import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";
import { newId, rowToSupplier } from "@/lib/server-helpers";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const body = await req.json();
    const name = String(body?.name ?? "").trim();
    const phone = String(body?.phone ?? "").trim();
    const notes = String(body?.notes ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Supplier name is required." }, { status: 400 });
    }
    const sql = db();
    const id = newId("sup");
    const createdAt = Date.now();
    const rows = await sql`
      INSERT INTO suppliers (id, name, phone, notes, created_at)
      VALUES (${id}, ${name}, ${phone}, ${notes}, ${createdAt})
      RETURNING *
    `;
    return NextResponse.json(rowToSupplier(rows[0]), { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create supplier." },
      { status: 500 }
    );
  }
}
