import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";
import { rowToBill, rowToPayment, rowToSupplier } from "@/lib/server-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSchema();
    const sql = db();
    const [supplierRows, billRows, paymentRows] = await Promise.all([
      sql`SELECT * FROM suppliers ORDER BY name ASC`,
      sql`SELECT * FROM bills ORDER BY date DESC`,
      sql`SELECT * FROM payments ORDER BY date DESC`,
    ]);
    return NextResponse.json({
      suppliers: supplierRows.map(rowToSupplier),
      bills: billRows.map(rowToBill),
      payments: paymentRows.map(rowToPayment),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load data." },
      { status: 500 }
    );
  }
}
