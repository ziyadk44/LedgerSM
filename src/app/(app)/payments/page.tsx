"use client";

import { useMemo, useState } from "react";
import { useLedger } from "@/lib/ledger-context";
import { fmtDate, fmtMoney } from "@/lib/format";
import PaymentModal from "@/components/PaymentModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import ExportRangeModal from "@/components/ExportRangeModal";
import { useToast } from "@/components/Toast";
import { exportPaymentsPDF } from "@/lib/pdf";
import type { Payment } from "@/lib/types";

type SortCol = "date" | "amount" | "supplier" | "mode";

export default function AllPaymentsPage() {
  const { suppliers, bills, payments, loading, supplierName, deletePayment } = useLedger();
  const { showToast } = useToast();

  const [filterSupplier, setFilterSupplier] = useState("all");
  const [filterMode, setFilterMode] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortCol, setSortCol] = useState<SortCol>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editPayment, setEditPayment] = useState<Payment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showExportRange, setShowExportRange] = useState(false);
  const [exporting, setExporting] = useState(false);

  const rows = useMemo(() => {
    let r = payments.map((p) => {
      const bill = bills.find((b) => b.id === p.billId);
      return { ...p, supplierId: bill?.supplierId ?? null, billDate: bill?.date ?? null };
    });
    if (filterSupplier !== "all") r = r.filter((x) => x.supplierId === filterSupplier);
    if (filterMode !== "all") r = r.filter((x) => x.mode === filterMode);
    if (from) r = r.filter((x) => x.date >= from);
    if (to) r = r.filter((x) => x.date <= to);

    const dir = sortDir === "asc" ? 1 : -1;
    r.sort((a, b) => {
      let av: string | number, bv: string | number;
      if (sortCol === "date") {
        av = a.date;
        bv = b.date;
      } else if (sortCol === "amount") {
        av = Number(a.amount);
        bv = Number(b.amount);
      } else if (sortCol === "supplier") {
        av = supplierName(a.supplierId);
        bv = supplierName(b.supplierId);
      } else {
        av = a.mode;
        bv = b.mode;
      }
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return r;
  }, [payments, bills, filterSupplier, filterMode, from, to, sortCol, sortDir, supplierName]);

  function toggleSort(col: SortCol) {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir(col === "date" ? "desc" : "asc");
    }
  }

  function sortArrow(col: SortCol) {
    if (sortCol !== col) return null;
    return <span className="ml-[3px] text-brass">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.id));

  async function exportSelected() {
    const chosen = payments.filter((p) => selected.has(p.id));
    if (chosen.length === 0) {
      showToast("No payments selected.");
      return;
    }
    setExporting(true);
    try {
      const enriched = chosen.map((p) => {
        const bill = bills.find((b) => b.id === p.billId);
        return { ...p, supplierNameResolved: supplierName(bill?.supplierId), billDate: bill?.date ?? null };
      });
      await exportPaymentsPDF({ rows: enriched, subtitle: `Selected entries (${chosen.length})`, fileTag: "selected-entries" });
      showToast("PDF generated.");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to generate PDF.");
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return <div className="py-16 text-center text-ink-faint">Loading…</div>;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2.5 rounded-lg border border-border-soft bg-surface px-4 py-3.5">
        <FilterField label="Supplier">
          <select
            value={filterSupplier}
            onChange={(e) => setFilterSupplier(e.target.value)}
            className="min-w-[120px] rounded border border-border bg-surface px-2.5 py-[7px] text-[12.5px] focus:border-brass focus:outline-none"
          >
            <option value="all">All suppliers</option>
            {[...suppliers]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
        </FilterField>
        <FilterField label="Mode">
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="min-w-[120px] rounded border border-border bg-surface px-2.5 py-[7px] text-[12.5px] focus:border-brass focus:outline-none"
          >
            <option value="all">All modes</option>
            <option value="cash">Cash</option>
            <option value="online">Online / Cheque</option>
          </select>
        </FilterField>
        <FilterField label="From">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded border border-border bg-surface px-2.5 py-[7px] text-[12.5px] focus:border-brass focus:outline-none"
          />
        </FilterField>
        <FilterField label="To">
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded border border-border bg-surface px-2.5 py-[7px] text-[12.5px] focus:border-brass focus:outline-none"
          />
        </FilterField>
        <FilterField label=" ">
          <button
            onClick={() => {
              setFilterSupplier("all");
              setFilterMode("all");
              setFrom("");
              setTo("");
            }}
            className="rounded border border-border bg-surface px-2.5 py-[7px] text-xs font-medium hover:bg-surface-2"
          >
            Clear filters
          </button>
        </FilterField>
        <div className="flex-1" />
        <FilterField label=" ">
          <button
            onClick={() => setShowExportRange(true)}
            className="rounded border border-brass bg-brass px-2.5 py-[7px] text-xs font-medium text-white hover:bg-[#7F6329]"
          >
            Export by date range
          </button>
        </FilterField>
      </div>

      {selected.size > 0 && (
        <div className="mb-3.5 flex items-center justify-between rounded border border-brass-light bg-brass-bg px-4 py-2.5 text-sm text-[#5A461B]">
          <span>
            {selected.size} payment{selected.size > 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelected(new Set())}
              className="rounded border border-border bg-surface px-2.5 py-1.5 text-xs font-medium hover:bg-surface-2"
            >
              Clear selection
            </button>
            <button
              onClick={exportSelected}
              disabled={exporting}
              className="rounded border border-brass bg-brass px-2.5 py-1.5 text-xs font-medium text-white hover:bg-[#7F6329] disabled:opacity-50"
            >
              Export selected as PDF
            </button>
          </div>
        </div>
      )}

            {/* Mobile: stacked cards */}
      <div className="space-y-2 sm:hidden">
        {rows.length === 0 ? (
          <div className="rounded-lg border border-border-soft bg-surface px-4 py-8 text-center text-ink-faint">
            No payments match these filters.
          </div>
        ) : (
          rows.map((r) => (
            <div key={r.id} className="rounded-lg border border-border-soft bg-surface p-3.5">
              <div className="flex items-start justify-between gap-2">
                <label className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={selected.has(r.id)}
                    onChange={(e) => {
                      const next = new Set(selected);
                      if (e.target.checked) next.add(r.id);
                      else next.delete(r.id);
                      setSelected(next);
                    }}
                  />
                  <div>
                    <div className="font-mono text-base font-semibold">{fmtMoney(r.amount)}</div>
                    <div className="text-[13px] text-ink-soft">{supplierName(r.supplierId)}</div>
                  </div>
                </label>
                <span
                  className={`shrink-0 rounded-full px-[7px] py-0.5 text-[10.5px] font-semibold ${
                    r.mode === "cash" ? "bg-[#E9E4D6] text-[#7A5E23]" : "bg-[#DCE6EC] text-[#385A70]"
                  }`}
                >
                  {r.mode === "cash" ? "Cash" : "Online"}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between font-mono text-xs text-ink-faint">
                <span>Paid {fmtDate(r.date)}</span>
                <span>Bill {fmtDate(r.billDate)}</span>
              </div>
              {r.note && <div className="mt-1.5 text-xs text-ink-soft">{r.note}</div>}
              <div className="mt-2.5 flex justify-end gap-1 border-t border-border-soft pt-2.5">
                <button
                  onClick={() => setEditPayment(r)}
                  className="rounded border border-border bg-surface px-2.5 py-1 text-xs font-medium hover:bg-surface-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteId(r.id)}
                  className="rounded border border-border bg-surface px-2.5 py-1 text-xs font-medium text-danger hover:bg-surface-2"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop / tablet: table */}

      <div className="hidden overflow-hidden rounded-lg border border-border-soft bg-surface sm:block">
         <table className="w-full border-collapse">
          <thead>
            <tr className="bg-surface-2 text-left text-[10.5px] uppercase tracking-[0.06em] text-ink-faint">
              <th className="w-[34px] border-b border-border-soft px-3.5 py-2.5 font-normal">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={(e) => {
                    const next = new Set(selected);
                    if (e.target.checked) rows.forEach((r) => next.add(r.id));
                    else rows.forEach((r) => next.delete(r.id));
                    setSelected(next);
                  }}
                />
              </th>
              <th className="cursor-pointer select-none whitespace-nowrap border-b border-border-soft px-3.5 py-2.5 font-normal hover:text-ink" onClick={() => toggleSort("date")}>
                Date{sortArrow("date")}
              </th>
              <th className="cursor-pointer select-none border-b border-border-soft px-3.5 py-2.5 font-normal hover:text-ink" onClick={() => toggleSort("supplier")}>
                Supplier{sortArrow("supplier")}
              </th>
              <th className="border-b border-border-soft px-3.5 py-2.5 font-normal">Bill Date</th>
              <th className="cursor-pointer select-none border-b border-border-soft px-3.5 py-2.5 font-normal hover:text-ink" onClick={() => toggleSort("amount")}>
                Amount{sortArrow("amount")}
              </th>
              <th className="cursor-pointer select-none border-b border-border-soft px-3.5 py-2.5 font-normal hover:text-ink" onClick={() => toggleSort("mode")}>
                Mode{sortArrow("mode")}
              </th>
              <th className="border-b border-border-soft px-3.5 py-2.5 font-normal">Reference</th>
              <th className="border-b border-border-soft px-3.5 py-2.5 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3.5 py-8 text-center text-ink-faint">
                  No payments match these filters.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover:bg-surface-2">
                  <td className="border-b border-border-soft px-3.5 py-2.5">
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      onChange={(e) => {
                        const next = new Set(selected);
                        if (e.target.checked) next.add(r.id);
                        else next.delete(r.id);
                        setSelected(next);
                      }}
                    />
                  </td>
                  <td className="whitespace-nowrap border-b border-border-soft px-3.5 py-2.5 font-mono text-sm text-ink-soft">{fmtDate(r.date)}</td>
                  <td className="border-b border-border-soft px-3.5 py-2.5 text-sm">{supplierName(r.supplierId)}</td>
                  <td className="whitespace-nowrap border-b border-border-soft px-3.5 py-2.5 font-mono text-sm text-ink-soft">{fmtDate(r.billDate)}</td>
                  <td className="border-b border-border-soft px-3.5 py-2.5 font-mono text-sm font-semibold">{fmtMoney(r.amount)}</td>
                  <td className="border-b border-border-soft px-3.5 py-2.5 text-sm">
                    <span
                      className={`rounded-full px-[7px] py-0.5 text-[10.5px] font-semibold ${
                        r.mode === "cash" ? "bg-[#E9E4D6] text-[#7A5E23]" : "bg-[#DCE6EC] text-[#385A70]"
                      }`}
                    >
                      {r.mode === "cash" ? "Cash" : "Online"}
                    </span>
                  </td>
                  <td className="max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap border-b border-border-soft px-3.5 py-2.5 text-sm text-ink-soft">
                    {r.note || "—"}
                  </td>
                  <td className="border-b border-border-soft px-3.5 py-2.5">
                    <div className="flex gap-0.5">
                      <button
                        onClick={() => setEditPayment(r)}
                        className="flex h-[26px] w-[26px] items-center justify-center rounded text-ink-faint hover:bg-border-soft hover:text-ink"
                        title="Edit"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => setDeleteId(r.id)}
                        className="flex h-[26px] w-[26px] items-center justify-center rounded text-ink-faint hover:bg-border-soft hover:text-ink"
                        title="Delete"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editPayment && <PaymentModal billId={editPayment.billId} payment={editPayment} onClose={() => setEditPayment(null)} />}
      {deleteId && (
        <ConfirmDialog
          title="Delete Payment"
          message="This payment entry will be permanently removed. Continue?"
          confirmLabel="Delete Payment"
          onClose={() => setDeleteId(null)}
          onConfirm={async () => {
            await deletePayment(deleteId);
            showToast("Payment deleted.");
          }}
        />
      )}
      {showExportRange && <ExportRangeModal onClose={() => setShowExportRange(false)} />}
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[10.5px] uppercase tracking-[0.06em] text-ink-faint">{label}</label>
      {children}
    </div>
  );
}
