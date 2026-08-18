"use client";

import Link from "next/link";
import { useState } from "react";
import { useLedger } from "@/lib/ledger-context";
import StatCard from "@/components/StatCard";
import { fmtDate, fmtMoney } from "@/lib/format";
import SupplierModal from "@/components/SupplierModal";

export default function OverviewPage() {
  const { suppliers, bills, payments, loading, error, supplierTotals, supplierName } = useLedger();
  const [showAdd, setShowAdd] = useState(false);

  if (loading) {
    return <div className="py-16 text-center text-ink-faint">Loading your ledger…</div>;
  }
  if (error) {
    return (
      <div className="mx-auto max-w-md rounded-lg border border-danger/30 bg-danger/5 p-6 text-center text-sm text-danger">
        {error}
      </div>
    );
  }

  if (suppliers.length === 0) {
    return (
      <div className="py-16 text-center text-ink-faint">
        <div className="mb-2.5 font-display text-3xl text-brass-light">◇</div>
        <h4 className="mb-1.5 font-display text-lg font-semibold text-ink">Your ledger is empty</h4>
        <p className="mb-4 text-sm">Add your first supplier to start recording bills and payments.</p>
        <button
          onClick={() => setShowAdd(true)}
          className="rounded border border-brass bg-brass px-4 py-2 text-sm font-medium text-white hover:bg-[#7F6329]"
        >
          + Add Supplier
        </button>
        {showAdd && <SupplierModal onClose={() => setShowAdd(false)} />}
      </div>
    );
  }

  let totalBilled = 0;
  let totalPaid = 0;
  let totalDue = 0;
  for (const s of suppliers) {
    const t = supplierTotals(s.id);
    totalBilled += t.billed;
    totalPaid += t.paid;
    totalDue += t.due;
  }

  const topDebts = suppliers
    .map((s) => ({ s, t: supplierTotals(s.id) }))
    .filter((x) => x.t.due > 0.01)
    .sort((a, b) => b.t.due - a.t.due)
    .slice(0, 6);

  const recentPayments = [...payments]
    .sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + String(a.createdAt)))
    .slice(0, 6);

  return (
    <div>
      <div className="mb-[22px] grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Suppliers" value={String(suppliers.length)} />
        <StatCard label="Total Billed" value={fmtMoney(totalBilled)} />
        <StatCard label="Total Paid" value={fmtMoney(totalPaid)} tone="paid" />
        <StatCard label="Total Outstanding" value={fmtMoney(totalDue)} tone="due" />
      </div>

      <div className="mb-3.5 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Suppliers with dues</h3>
      </div>
      {topDebts.length === 0 ? (
        <p className="-mt-1.5 mb-6 text-[13px] text-ink-faint">Nothing outstanding — every supplier is settled. 🎉</p>
      ) : (
        <div className="mb-6 overflow-hidden rounded-lg border border-border-soft bg-surface">
          <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface-2 text-left text-[10.5px] uppercase tracking-[0.06em] text-ink-faint">
                <th className="border-b border-border-soft px-3.5 py-2.5 font-normal">Supplier</th>
                <th className="border-b border-border-soft px-3.5 py-2.5 font-normal">Billed</th>
                <th className="border-b border-border-soft px-3.5 py-2.5 font-normal">Paid</th>
                <th className="border-b border-border-soft px-3.5 py-2.5 font-normal">Due</th>
              </tr>
            </thead>
            <tbody>
              {topDebts.map(({ s, t }) => (
                <tr key={s.id} className="hover:bg-surface-2">
                  <td className="border-b border-border-soft px-3.5 py-2.5 text-sm last:border-b-0">
                    <Link href={`/suppliers/${s.id}`} className="hover:underline">
                      {s.name}
                    </Link>
                  </td>
                  <td className="border-b border-border-soft px-3.5 py-2.5 font-mono text-sm">{fmtMoney(t.billed)}</td>
                  <td className="border-b border-border-soft px-3.5 py-2.5 font-mono text-sm">{fmtMoney(t.paid)}</td>
                  <td className="border-b border-border-soft px-3.5 py-2.5 font-mono text-sm text-amber">{fmtMoney(t.due)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      )}

      <div className="mb-3.5 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Recent payments</h3>
      </div>
      {recentPayments.length === 0 ? (
        <p className="text-[13px] text-ink-faint">No payments recorded yet.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border-soft bg-surface">
          <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface-2 text-left text-[10.5px] uppercase tracking-[0.06em] text-ink-faint">
                <th className="border-b border-border-soft px-3.5 py-2.5 font-normal">Date</th>
                <th className="border-b border-border-soft px-3.5 py-2.5 font-normal">Supplier</th>
                <th className="border-b border-border-soft px-3.5 py-2.5 font-normal">Amount</th>
                <th className="border-b border-border-soft px-3.5 py-2.5 font-normal">Mode</th>
                <th className="border-b border-border-soft px-3.5 py-2.5 font-normal">Reference</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.map((p) => {
                const bill = bills.find((b) => b.id === p.billId);
                return (
                  <tr key={p.id} className="hover:bg-surface-2">
                    <td className="border-b border-border-soft px-3.5 py-2.5 font-mono text-sm text-ink-soft last:border-b-0">
                      {fmtDate(p.date)}
                    </td>
                    <td className="border-b border-border-soft px-3.5 py-2.5 text-sm">
                      {supplierName(bill ? bill.supplierId : null)}
                    </td>
                    <td className="border-b border-border-soft px-3.5 py-2.5 font-mono text-sm">{fmtMoney(p.amount)}</td>
                    <td className="border-b border-border-soft px-3.5 py-2.5 text-sm">
                      <span
                        className={`rounded-full px-[7px] py-0.5 text-[10.5px] font-semibold ${
                          p.mode === "cash" ? "bg-[#E9E4D6] text-[#7A5E23]" : "bg-[#DCE6EC] text-[#385A70]"
                        }`}
                      >
                        {p.mode === "cash" ? "Cash" : "Online"}
                      </span>
                    </td>
                    <td className="border-b border-border-soft px-3.5 py-2.5 text-sm text-ink-soft">{p.note || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </div>
      )}
    </div>
  );
}
