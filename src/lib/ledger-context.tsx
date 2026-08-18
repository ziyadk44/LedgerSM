"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Bill, LedgerData, Payment, PaymentMode, Supplier } from "@/lib/types";

type Ctx = {
  loading: boolean;
  error: string | null;
  suppliers: Supplier[];
  bills: Bill[];
  payments: Payment[];
  refresh: () => Promise<void>;

  addSupplier: (input: { name: string; phone?: string; notes?: string }) => Promise<Supplier>;
  updateSupplier: (
    id: string,
    input: { name: string; phone?: string; notes?: string }
  ) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;

  addBill: (input: { supplierId: string; date: string; amount: number; note?: string }) => Promise<Bill>;
  updateBill: (id: string, input: { date: string; amount: number; note?: string }) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;

  addPayment: (input: {
    billId: string;
    date: string;
    amount: number;
    mode: PaymentMode;
    note?: string;
  }) => Promise<Payment>;
  updatePayment: (
    id: string,
    input: { date: string; amount: number; mode: PaymentMode; note?: string }
  ) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;

  billTotals: (billId: string) => { amount: number; paid: number; due: number };
  supplierTotals: (supplierId: string) => {
    billed: number;
    paid: number;
    due: number;
    billCount: number;
  };
  supplierName: (id: string | null | undefined) => string;
};

const LedgerCtx = createContext<Ctx | null>(null);

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.error || `Request failed (${res.status})`);
  }
  return body as T;
}

export function LedgerProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<LedgerData>({ suppliers: [], bills: [], payments: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const d = await api<LedgerData>("/api/data");
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addSupplier: Ctx["addSupplier"] = useCallback(async (input) => {
    const s = await api<Supplier>("/api/suppliers", { method: "POST", body: JSON.stringify(input) });
    setData((d) => ({ ...d, suppliers: [...d.suppliers, s] }));
    return s;
  }, []);

  const updateSupplier: Ctx["updateSupplier"] = useCallback(async (id, input) => {
    const s = await api<Supplier>(`/api/suppliers/${id}`, { method: "PUT", body: JSON.stringify(input) });
    setData((d) => ({ ...d, suppliers: d.suppliers.map((x) => (x.id === id ? s : x)) }));
  }, []);

  const deleteSupplier: Ctx["deleteSupplier"] = useCallback(async (id) => {
    await api(`/api/suppliers/${id}`, { method: "DELETE" });
    setData((d) => {
      const billIds = new Set(d.bills.filter((b) => b.supplierId === id).map((b) => b.id));
      return {
        suppliers: d.suppliers.filter((s) => s.id !== id),
        bills: d.bills.filter((b) => b.supplierId !== id),
        payments: d.payments.filter((p) => !billIds.has(p.billId)),
      };
    });
  }, []);

  const addBill: Ctx["addBill"] = useCallback(async (input) => {
    const b = await api<Bill>("/api/bills", { method: "POST", body: JSON.stringify(input) });
    setData((d) => ({ ...d, bills: [b, ...d.bills] }));
    return b;
  }, []);

  const updateBill: Ctx["updateBill"] = useCallback(async (id, input) => {
    const b = await api<Bill>(`/api/bills/${id}`, { method: "PUT", body: JSON.stringify(input) });
    setData((d) => ({ ...d, bills: d.bills.map((x) => (x.id === id ? b : x)) }));
  }, []);

  const deleteBill: Ctx["deleteBill"] = useCallback(async (id) => {
    await api(`/api/bills/${id}`, { method: "DELETE" });
    setData((d) => ({
      bills: d.bills.filter((b) => b.id !== id),
      suppliers: d.suppliers,
      payments: d.payments.filter((p) => p.billId !== id),
    }));
  }, []);

  const addPayment: Ctx["addPayment"] = useCallback(async (input) => {
    const p = await api<Payment>("/api/payments", { method: "POST", body: JSON.stringify(input) });
    setData((d) => ({ ...d, payments: [p, ...d.payments] }));
    return p;
  }, []);

  const updatePayment: Ctx["updatePayment"] = useCallback(async (id, input) => {
    const p = await api<Payment>(`/api/payments/${id}`, { method: "PUT", body: JSON.stringify(input) });
    setData((d) => ({ ...d, payments: d.payments.map((x) => (x.id === id ? p : x)) }));
  }, []);

  const deletePayment: Ctx["deletePayment"] = useCallback(async (id) => {
    await api(`/api/payments/${id}`, { method: "DELETE" });
    setData((d) => ({ ...d, payments: d.payments.filter((p) => p.id !== id) }));
  }, []);

  const billTotals = useCallback(
    (billId: string) => {
      const bill = data.bills.find((b) => b.id === billId);
      const amount = bill ? Number(bill.amount) : 0;
      const paid = data.payments
        .filter((p) => p.billId === billId)
        .reduce((s, p) => s + Number(p.amount), 0);
      return { amount, paid, due: Math.round((amount - paid) * 100) / 100 };
    },
    [data.bills, data.payments]
  );

  const supplierTotals = useCallback(
    (supplierId: string) => {
      const bills = data.bills.filter((b) => b.supplierId === supplierId);
      let billed = 0;
      let paid = 0;
      for (const b of bills) {
        const t = billTotals(b.id);
        billed += t.amount;
        paid += t.paid;
      }
      return { billed, paid, due: Math.round((billed - paid) * 100) / 100, billCount: bills.length };
    },
    [data.bills, billTotals]
  );

  const supplierName = useCallback(
    (id: string | null | undefined) => data.suppliers.find((s) => s.id === id)?.name ?? "Unknown supplier",
    [data.suppliers]
  );

  const value = useMemo<Ctx>(
    () => ({
      loading,
      error,
      suppliers: data.suppliers,
      bills: data.bills,
      payments: data.payments,
      refresh,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      addBill,
      updateBill,
      deleteBill,
      addPayment,
      updatePayment,
      deletePayment,
      billTotals,
      supplierTotals,
      supplierName,
    }),
    [
      loading,
      error,
      data,
      refresh,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      addBill,
      updateBill,
      deleteBill,
      addPayment,
      updatePayment,
      deletePayment,
      billTotals,
      supplierTotals,
      supplierName,
    ]
  );

  return <LedgerCtx.Provider value={value}>{children}</LedgerCtx.Provider>;
}

export function useLedger() {
  const ctx = useContext(LedgerCtx);
  if (!ctx) throw new Error("useLedger must be used within LedgerProvider");
  return ctx;
}
