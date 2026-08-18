import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";
import { rowToSupplier } from "@/lib/server-helpers";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
    const rows = await sql`
      UPDATE suppliers SET name = ${name}, phone = ${phone}, notes = ${notes}
      WHERE id = ${id}
      RETURNING *
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: "Supplier not found." }, { status: 404 });
    }
    return NextResponse.json(rowToSupplier(rows[0]));
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update supplier." },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await ensureSchema();
    const sql = db();
    // ON DELETE CASCADE on bills/payments handles the cleanup.
    const rows = await sql`DELETE FROM suppliers WHERE id = ${id} RETURNING id`;
    if (rows.length === 0) {
      return NextResponse.json({ error: "Supplier not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete supplier." },
      { status: 500 }
    );
  }
}
