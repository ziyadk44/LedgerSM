import { neon } from "@neondatabase/serverless";

// DATABASE_URL is provided by your Postgres provider (Neon, or Vercel's
// native Neon integration). See README.md for setup steps.
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // We don't throw at import time (that would break `next build`, which
  // imports this module without env vars set). Routes that actually touch
  // the DB will fail loudly and helpfully instead — see query() below.
  console.warn(
    "[db] DATABASE_URL is not set. Set it in your environment before using the ledger."
  );
}

export const sql = connectionString ? neon(connectionString) : null;

function requireSql() {
  if (!sql) {
    throw new Error(
      "DATABASE_URL is not configured. Add it to your environment variables (see README.md)."
    );
  }
  return sql;
}

let schemaReady = false;

/**
 * Creates all tables if they don't already exist. Safe to call on every
 * request — it's a no-op after the first successful run per server
 * instance, and CREATE TABLE IF NOT EXISTS is idempotent regardless.
 */
export async function ensureSchema() {
  if (schemaReady) return;
  const db = requireSql();
  await db`
    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at BIGINT NOT NULL
    )
  `;
  await db`
    CREATE TABLE IF NOT EXISTS bills (
      id TEXT PRIMARY KEY,
      supplier_id TEXT NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      amount NUMERIC(12,2) NOT NULL,
      note TEXT DEFAULT '',
      created_at BIGINT NOT NULL
    )
  `;
  await db`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      bill_id TEXT NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      amount NUMERIC(12,2) NOT NULL,
      mode TEXT NOT NULL CHECK (mode IN ('cash','online')),
      note TEXT DEFAULT '',
      created_at BIGINT NOT NULL
    )
  `;
  await db`CREATE INDEX IF NOT EXISTS idx_bills_supplier ON bills(supplier_id)`;
  await db`CREATE INDEX IF NOT EXISTS idx_payments_bill ON payments(bill_id)`;
  schemaReady = true;
}

export function db() {
  return requireSql();
}
