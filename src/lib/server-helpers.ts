import { randomUUID } from "crypto";
import type { Bill, Payment, Supplier } from "@/lib/types";

export function newId(prefix: string) {
  return `${prefix}_${randomUUID()}`;
}

// Neon returns DATE as "YYYY-MM-DD" strings and NUMERIC as strings — normalize both.
export function rowToSupplier(r: any): Supplier {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone ?? "",
    notes: r.notes ?? "",
    createdAt: Number(r.created_at),
  };
}

export function rowToBill(r: any): Bill {
  return {
    id: r.id,
    supplierId: r.supplier_id,
    date: String(r.date).slice(0, 10),
    amount: Number(r.amount),
    note: r.note ?? "",
    createdAt: Number(r.created_at),
  };
}

export function rowToPayment(r: any): Payment {
  return {
    id: r.id,
    billId: r.bill_id,
    date: String(r.date).slice(0, 10),
    amount: Number(r.amount),
    mode: r.mode,
    note: r.note ?? "",
    createdAt: Number(r.created_at),
  };
}

export function isValidDate(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export function isValidAmount(n: unknown): n is number {
  return typeof n === "number" && isFinite(n) && n > 0;
}
