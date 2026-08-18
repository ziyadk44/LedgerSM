"use client";

import { useState } from "react";
import { useLedger } from "@/lib/ledger-context";
import { fmtDate, fmtMoney } from "@/lib/format";
import type { Bill, Payment } from "@/lib/types";
import PaymentModal from "@/components/PaymentModal";
import BillModal from "@/components/BillModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import { exportPaymentsPDF } from "@/lib/pdf";

function statusFor(t: { paid: number; due: number }) {
  if (t.paid <= 0) return { label: "Unpaid", cls: "bg-[#E8E5DD] text-ink-soft" };
  if (t.due <= 0.01) return { label: "Paid", cls: "bg-green-bg text-green" };
  return { label: "Partial", cls: "bg-amber-bg text-amber" };
}

export default function BillCard({ bill, supplierName }: { bill: Bill; supplierName: string }) {
  const { billTotals, payments, deleteBill, deletePayment } = useLedger();
  const { showToast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [showEditBill, setShowEditBill] = useState(false);
  const [showDeleteBill, setShowDeleteBill] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [editPayment, setEditPayment] = useState<Payment | null>(null);
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const t = billTotals(bill.id);
  const status = statusFor(t);
  const pays = payments.filter((p) => p.billId === bill.id).sort((a, b) => b.date.localeCompare(a.date));

    async function exportBill(e: React.MouseEvent) {
    e.stopPropagation();
    if (pays.length === 0) {
      showToast("No payments recorded against this bill yet.");
      return;
    }
    setExporting(true);
    try {
      const enriched = pays.map((p) => ({
        ...p,
        supplierNameResolved: supplierName,
        billDate: bill.date,
        billAmount: bill.amount,
      }));
      await exportPaymentsPDF({
        rows: enriched,
        subtitle: `${supplierName} · Bill dated ${fmtDate(bill.date)} · ${fmtMoney(t.amount)} total`,
        fileTag: `bill_${bill.date}_${bill.id.slice(0, 6)}`,
      });
      showToast("PDF generated.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to generate PDF.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="mb-3 overflow-hidden rounded-lg border border-border-soft bg-surface">
      <div
        className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-2 px-4 py-[15px] sm:px-[18px]"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className={`w-3 text-[11px] text-ink-faint transition-transform ${expanded ? "rotate-90" : ""}`}>▶</span>
        <div className="min-w-0 flex-1 basis-full sm:basis-auto">
          <div className="mb-0.5 font-mono text-xs text-ink-soft">Bill dated {fmtDate(bill.date)}</div>
          <div className="flex flex-wrap items-baseline gap-2.5">
            <span className="font-mono text-base font-semibold">{fmtMoney(t.amount)}</span>
            {bill.note && <span className="text-xs text-ink-faint">{bill.note}</span>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:gap-[18px]">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.06em] text-ink-faint">Paid</div>
            <div className="font-mono text-[13.5px] font-semibold text-green">{fmtMoney(t.paid)}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.06em] text-ink-faint">Due</div>
            <div className={`font-mono text-[13.5px] font-semibold ${t.due > 0.01 ? "text-amber" : "text-ink-faint"}`}>
              {fmtMoney(t.due)}
            </div>
          </div>
          <span className={`whitespace-nowrap rounded-full px-2.5 py-[3px] font-mono text-[11px] font-semibold ${status.cls}`}>
            {status.label}
          </span>
        </div>
        <div className="flex shrink-0 gap-0.5">
          <button
            onClick={exportBill}
            disabled={exporting}
            className="flex h-[26px] w-[26px] items-center justify-center rounded text-ink-faint hover:bg-border-soft hover:text-ink disabled:opacity-50"
            title="Export bill as PDF"
          >
            ⭳
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowEditBill(true);
            }}
            className="flex h-[26px] w-[26px] items-center justify-center rounded text-ink-faint hover:bg-border-soft hover:text-ink"
            title="Edit bill"
          >
            ✎
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteBill(true);
            }}
            className="flex h-[26px] w-[26px] items-center justify-center rounded text-ink-faint hover:bg-border-soft hover:text-ink"
            title="Delete bill"
          >
            🗑
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border-soft bg-surface-2 px-4 pb-[18px] pt-3.5 sm:px-[18px]">
          <div className="mb-2.5 flex items-center justify-between">
            <h5 className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-soft">Payments ({pays.length})</h5>
            <button
              onClick={() => setShowAddPayment(true)}
              className="rounded border border-brass bg-brass px-2.5 py-1.5 text-xs font-medium text-white hover:bg-[#7F6329]"
            >
              + Add Payment
            </button>
          </div>
          {pays.length === 0 ? (
            <div className="px-1 py-3.5 text-[12.5px] text-ink-faint">No payments recorded against this bill yet.</div>
          ) : (
            pays.map((p) => (
              <div key={p.id} className="flex items-center gap-3 border-b border-border-soft py-[9px] px-1 last:border-b-0">
                <div className="w-[82px] shrink-0 font-mono text-xs text-ink-soft">{fmtDate(p.date)}</div>
                <span
                  className={`shrink-0 rounded-full px-[7px] py-0.5 text-[10.5px] font-semibold ${
                    p.mode === "cash" ? "bg-[#E9E4D6] text-[#7A5E23]" : "bg-[#DCE6EC] text-[#385A70]"
                  }`}
                >
                  {p.mode === "cash" ? "Cash" : "Online"}
                </span>
                <div className="w-[100px] shrink-0 font-mono text-[13.5px] font-semibold">{fmtMoney(p.amount)}</div>
                <div className="hidden min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs text-ink-soft sm:block">
                  {p.note || ""}
                </div>
                <div className="flex shrink-0 gap-0.5">
                  <button
                    onClick={() => setEditPayment(p)}
                    className="flex h-[26px] w-[26px] items-center justify-center rounded text-ink-faint hover:bg-border-soft hover:text-ink"
                    title="Edit"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => setDeletePaymentId(p.id)}
                    className="flex h-[26px] w-[26px] items-center justify-center rounded text-ink-faint hover:bg-border-soft hover:text-ink"
                    title="Delete"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showEditBill && <BillModal supplierId={bill.supplierId} supplierName={supplierName} bill={bill} onClose={() => setShowEditBill(false)} />}
      {showDeleteBill && (
        <ConfirmDialog
          title="Delete Bill"
          message={`Delete the bill dated ${fmtDate(bill.date)} for ${fmtMoney(bill.amount)}? This will also delete ${pays.length} payment(s) recorded against it.`}
          confirmLabel="Delete Bill"
          onClose={() => setShowDeleteBill(false)}
          onConfirm={async () => {
            await deleteBill(bill.id);
            showToast("Bill deleted.");
          }}
        />
      )}
      {showAddPayment && (
        <PaymentModal
          billId={bill.id}
          billLabel={`Bill dated ${fmtDate(bill.date)} · ${fmtMoney(t.amount)} total`}
          dueAmount={t.due}
          onClose={() => setShowAddPayment(false)}
        />
      )}
      {editPayment && (
        <PaymentModal
          billId={bill.id}
          payment={editPayment}
          billLabel={`Bill dated ${fmtDate(bill.date)} · ${supplierName}`}
          onClose={() => setEditPayment(null)}
        />
      )}
      {deletePaymentId && (
        <ConfirmDialog
          title="Delete Payment"
          message="This payment entry will be permanently removed. Continue?"
          confirmLabel="Delete Payment"
          onClose={() => setDeletePaymentId(null)}
          onConfirm={async () => {
            await deletePayment(deletePaymentId);
            showToast("Payment deleted.");
          }}
        />
      )}
    </div>
  );
}
