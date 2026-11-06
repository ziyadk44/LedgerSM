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

// Neon can return DATE columns as either a "YYYY-MM-DD" string or a JS Date
// object depending on the query path. Normalize both to a clean ISO date
// string using UTC components (a DATE column has no time/timezone, so UTC
// avoids the value shifting a day backward/forward based on server timezone).
function toISODateString(value: unknown): string {
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(value).slice(0, 10);
}


export function rowToBill(r: any): Bill {
  return {
    id: r.id,
    supplierId: r.supplier_id,
    // date: String(r.date).slice(0, 10),
    date: toISODateString(r.date),
    amount: Number(r.amount),
    note: r.note ?? "",
    cashAmount: r.cash_amount === null || r.cash_amount === undefined ? null : Number(r.cash_amount),
    createdAt: Number(r.created_at),
  };
}

export function rowToPayment(r: any): Payment {
  return {
    id: r.id,
    billId: r.bill_id,
    // date: String(r.date).slice(0, 10),
    date: toISODateString(r.date),
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

export function parseCashAmount(
  raw: unknown,
  total: number
): { ok: true; value: number | null } | { ok: false } {
  if (raw === null || raw === undefined || raw === "") return { ok: true, value: null };
  const n = Number(raw);
  if (!isFinite(n) || n < 0 || n > total) return { ok: false };
  return { ok: true, value: Math.round(n * 100) / 100 };
}
